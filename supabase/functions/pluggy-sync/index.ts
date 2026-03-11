import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const PLUGGY_API_URL = "https://api.pluggy.ai";

async function getPluggyApiKey(): Promise<string> {
  const clientId = Deno.env.get("PLUGGY_CLIENT_ID");
  const clientSecret = Deno.env.get("PLUGGY_CLIENT_SECRET");
  if (!clientId || !clientSecret) throw new Error("Pluggy credentials not configured");
  const res = await fetch(`${PLUGGY_API_URL}/auth`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ clientId, clientSecret }),
  });
  if (!res.ok) throw new Error("Pluggy auth failed");
  const data = await res.json();
  return data.apiKey;
}

async function syncItemData(
  supabase: ReturnType<typeof createClient>,
  apiKey: string,
  conn: Record<string, unknown>,
  itemId: string
) {
  const companyId = conn.company_id as string;

  // 1. Fetch item details
  const itemRes = await fetch(`${PLUGGY_API_URL}/items/${itemId}`, {
    headers: { "X-API-KEY": apiKey },
  });
  if (!itemRes.ok) {
    console.error(`Failed to fetch item ${itemId}: ${itemRes.status}`);
    return { accounts: 0, transactions: 0 };
  }
  const item = await itemRes.json();

  // 2. Fetch accounts
  const accountsRes = await fetch(`${PLUGGY_API_URL}/accounts?itemId=${itemId}`, {
    headers: { "X-API-KEY": apiKey },
  });
  if (!accountsRes.ok) {
    console.error(`Failed to fetch accounts for item ${itemId}`);
    return { accounts: 0, transactions: 0 };
  }
  const accountsData = await accountsRes.json();
  const pluggyAccounts = accountsData.results || [];

  let totalAccounts = 0;
  let totalTransactions = 0;

  for (const acc of pluggyAccounts) {
    const bankName = `${item.connector?.name || "Pluggy"} - ${acc.name}`;
    const accountType = acc.type === "BANK" ? "checking" : acc.type === "CREDIT" ? "credit" : "checking";

    // Upsert account
    const { data: existingAcc } = await supabase
      .from("accounts")
      .select("id")
      .eq("company_id", companyId)
      .eq("bank_name", bankName)
      .maybeSingle();

    let internalAccountId: string;

    if (existingAcc) {
      await supabase
        .from("accounts")
        .update({ balance: acc.balance || 0 })
        .eq("id", existingAcc.id);
      internalAccountId = existingAcc.id;
    } else {
      const { data: newAcc } = await supabase
        .from("accounts")
        .insert({
          company_id: companyId,
          bank_name: bankName,
          account_type: accountType,
          balance: acc.balance || 0,
        })
        .select("id")
        .single();
      internalAccountId = newAcc?.id;
    }

    totalAccounts++;

    if (!internalAccountId) continue;

    // 3. Fetch transactions for this account
    const txRes = await fetch(
      `${PLUGGY_API_URL}/transactions?accountId=${acc.id}&pageSize=500`,
      { headers: { "X-API-KEY": apiKey } }
    );

    if (!txRes.ok) {
      console.error(`Failed to fetch transactions for account ${acc.id}`);
      continue;
    }

    const txData = await txRes.json();
    const pluggyTxs = txData.results || [];

    for (const tx of pluggyTxs) {
      // Check if transaction already exists (by description + date + amount to avoid duplicates)
      const { data: existing } = await supabase
        .from("transactions")
        .select("id")
        .eq("account_id", internalAccountId)
        .eq("amount", tx.amount)
        .eq("description", tx.description || tx.descriptionRaw || "")
        .eq("date", tx.date)
        .maybeSingle();

      if (!existing) {
        await supabase.from("transactions").insert({
          account_id: internalAccountId,
          amount: tx.amount,
          description: tx.description || tx.descriptionRaw || "",
          category: tx.category || "Uncategorized",
          date: tx.date,
        });
        totalTransactions++;
      }
    }
  }

  // Update connection status
  await supabase
    .from("bank_connections")
    .update({
      status: "connected",
      last_synced_at: new Date().toISOString(),
      metadata: {
        ...((conn.metadata as Record<string, unknown>) || {}),
        pluggy_item_id: itemId,
        pluggy_status: item.status,
        pluggy_connector: item.connector?.name,
        accounts_count: pluggyAccounts.length,
        last_full_sync: new Date().toISOString(),
      },
    })
    .eq("id", conn.id);

  return { accounts: totalAccounts, transactions: totalTransactions };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Get all active connections with pluggy_item_id
    const { data: connections, error } = await supabase
      .from("bank_connections")
      .select("*")
      .eq("status", "connected")
      .not("metadata->>pluggy_item_id", "is", null);

    if (error) throw error;
    if (!connections || connections.length === 0) {
      return new Response(JSON.stringify({ message: "No connections to sync", synced: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const apiKey = await getPluggyApiKey();
    let totalAccounts = 0;
    let totalTransactions = 0;
    let syncedConnections = 0;

    for (const conn of connections) {
      const metadata = conn.metadata as Record<string, unknown>;
      const itemId = metadata?.pluggy_item_id as string;
      if (!itemId) continue;

      try {
        // Trigger update on Pluggy side first
        await fetch(`${PLUGGY_API_URL}/items/${itemId}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            "X-API-KEY": apiKey,
          },
          body: JSON.stringify({}),
        });

        // Then fetch and persist all data
        const result = await syncItemData(supabase, apiKey, conn, itemId);
        totalAccounts += result.accounts;
        totalTransactions += result.transactions;
        syncedConnections++;
      } catch (e) {
        console.error(`Error syncing connection ${conn.id}:`, e);
      }
    }

    return new Response(
      JSON.stringify({
        message: `Synced ${syncedConnections} connections`,
        synced: syncedConnections,
        accounts: totalAccounts,
        transactions: totalTransactions,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Sync error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
