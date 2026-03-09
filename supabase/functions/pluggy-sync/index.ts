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
    let syncedCount = 0;

    for (const conn of connections) {
      const metadata = conn.metadata as Record<string, unknown>;
      const itemId = metadata?.pluggy_item_id as string;
      if (!itemId) continue;

      try {
        // Trigger update on Pluggy side
        const updateRes = await fetch(`${PLUGGY_API_URL}/items/${itemId}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            "X-API-KEY": apiKey,
          },
          body: JSON.stringify({}),
        });

        if (updateRes.ok) {
          await supabase
            .from("bank_connections")
            .update({ last_synced_at: new Date().toISOString() })
            .eq("id", conn.id);
          syncedCount++;
        } else {
          console.error(`Failed to sync item ${itemId}: ${updateRes.status}`);
        }
      } catch (e) {
        console.error(`Error syncing connection ${conn.id}:`, e);
      }
    }

    return new Response(
      JSON.stringify({ message: `Synced ${syncedCount} connections`, synced: syncedCount }),
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
