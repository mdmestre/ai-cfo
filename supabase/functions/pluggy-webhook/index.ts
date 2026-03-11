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
  if (!res.ok) throw new Error(`Pluggy auth failed`);
  const data = await res.json();
  return data.apiKey;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { event, itemId } = body;

    console.log(`Pluggy webhook received: event=${event}, itemId=${itemId}`);

    if (!itemId) {
      return new Response(JSON.stringify({ received: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    if (event === "item/updated" || event === "item/created") {
      const apiKey = await getPluggyApiKey();

      // Get item details
      const itemRes = await fetch(`${PLUGGY_API_URL}/items/${itemId}`, {
        headers: { "X-API-KEY": apiKey },
      });
      if (!itemRes.ok) throw new Error("Failed to fetch item");
      const item = await itemRes.json();

      // Get accounts for the item
      const accountsRes = await fetch(`${PLUGGY_API_URL}/accounts?itemId=${itemId}`, {
        headers: { "X-API-KEY": apiKey },
      });
      if (!accountsRes.ok) throw new Error("Failed to fetch accounts");
      const accountsData = await accountsRes.json();

      // Find the bank_connection linked to this item
      const { data: connections } = await supabase
        .from("bank_connections")
        .select("*")
        .eq("metadata->>pluggy_item_id", itemId);

      if (connections && connections.length > 0) {
        const conn = connections[0];
        const companyId = conn.company_id;

        // Update connection status
        await supabase
          .from("bank_connections")
          .update({
            status: item.status === "UPDATED" ? "connected" : item.status.toLowerCase(),
            last_synced_at: new Date().toISOString(),
            metadata: {
              ...((conn.metadata as Record<string, unknown>) || {}),
              pluggy_item_id: itemId,
              pluggy_status: item.status,
              pluggy_connector: item.connector?.name,
              accounts_count: accountsData.results?.length || 0,
              last_webhook_sync: new Date().toISOString(),
            },
          })
          .eq("id", conn.id);

        // Sync accounts and transactions
        for (const acc of accountsData.results || []) {
          const bankName = `${item.connector?.name || "Pluggy"} - ${acc.name}`;
          const accountType = acc.type === "BANK" ? "checking" : acc.type === "CREDIT" ? "credit" : "checking";

          // Upsert account
          const { data: existingAccount } = await supabase
            .from("accounts")
            .select("id")
            .eq("company_id", companyId)
            .eq("bank_name", bankName)
            .maybeSingle();

          let internalAccountId: string;

          if (existingAccount) {
            await supabase
              .from("accounts")
              .update({ balance: acc.balance || 0 })
              .eq("id", existingAccount.id);
            internalAccountId = existingAccount.id;
          } else {
            const { data: newAcc } = await supabase.from("accounts").insert({
              company_id: companyId,
              bank_name: bankName,
              account_type: accountType,
              balance: acc.balance || 0,
            }).select("id").single();
            internalAccountId = newAcc?.id;
          }

          if (!internalAccountId) continue;

          // Fetch and persist transactions
          const txRes = await fetch(`${PLUGGY_API_URL}/transactions?accountId=${acc.id}&pageSize=500`, {
            headers: { "X-API-KEY": apiKey },
          });
          if (txRes.ok) {
            const txData = await txRes.json();
            for (const tx of txData.results || []) {
              // Check for duplicate
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
              }
            }
          }
        }
      }
    }

    if (event === "item/error") {
      await supabase
        .from("bank_connections")
        .update({ status: "error" })
        .eq("metadata->>pluggy_item_id", itemId);
    }

    if (event === "item/deleted") {
      await supabase
        .from("bank_connections")
        .update({ status: "disconnected" })
        .eq("metadata->>pluggy_item_id", itemId);
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Webhook error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
