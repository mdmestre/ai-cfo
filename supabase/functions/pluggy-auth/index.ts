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
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Pluggy auth failed [${res.status}]: ${err}`);
  }
  const data = await res.json();
  return data.apiKey;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate user auth
    const authHeader = req.headers.get("authorization");
    if (!authHeader) throw new Error("Missing authorization header");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) throw new Error("Unauthorized");

    const url = new URL(req.url);
    const action = url.pathname.split("/").pop();

    const apiKey = await getPluggyApiKey();

    // Route actions
    if (action === "connect-token") {
      // Create a connect token for the Pluggy Connect widget
      const body = await req.json();
      const res = await fetch(`${PLUGGY_API_URL}/connect_token`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-KEY": apiKey,
        },
        body: JSON.stringify({
          clientUserId: user.id,
          ...(body.itemId ? { itemId: body.itemId } : {}),
        }),
      });
      if (!res.ok) {
        const err = await res.text();
        throw new Error(`Connect token failed [${res.status}]: ${err}`);
      }
      const data = await res.json();
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "items" && req.method === "GET") {
      // List all connected items for this user
      const res = await fetch(`${PLUGGY_API_URL}/items?clientUserId=${user.id}`, {
        headers: { "X-API-KEY": apiKey },
      });
      if (!res.ok) {
        const err = await res.text();
        throw new Error(`List items failed [${res.status}]: ${err}`);
      }
      const data = await res.json();
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "accounts" && req.method === "GET") {
      const itemId = url.searchParams.get("itemId");
      if (!itemId) throw new Error("itemId is required");
      const res = await fetch(`${PLUGGY_API_URL}/accounts?itemId=${itemId}`, {
        headers: { "X-API-KEY": apiKey },
      });
      if (!res.ok) {
        const err = await res.text();
        throw new Error(`List accounts failed [${res.status}]: ${err}`);
      }
      const data = await res.json();
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "transactions" && req.method === "GET") {
      const accountId = url.searchParams.get("accountId");
      const from = url.searchParams.get("from");
      const to = url.searchParams.get("to");
      if (!accountId) throw new Error("accountId is required");
      let endpoint = `${PLUGGY_API_URL}/transactions?accountId=${accountId}`;
      if (from) endpoint += `&from=${from}`;
      if (to) endpoint += `&to=${to}`;
      const res = await fetch(endpoint, {
        headers: { "X-API-KEY": apiKey },
      });
      if (!res.ok) {
        const err = await res.text();
        throw new Error(`List transactions failed [${res.status}]: ${err}`);
      }
      const data = await res.json();
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "identity" && req.method === "GET") {
      const itemId = url.searchParams.get("itemId");
      if (!itemId) throw new Error("itemId is required");
      const res = await fetch(`${PLUGGY_API_URL}/identity?itemId=${itemId}`, {
        headers: { "X-API-KEY": apiKey },
      });
      if (!res.ok) {
        const err = await res.text();
        throw new Error(`Identity failed [${res.status}]: ${err}`);
      }
      const data = await res.json();
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "delete-item" && req.method === "POST") {
      const body = await req.json();
      const res = await fetch(`${PLUGGY_API_URL}/items/${body.itemId}`, {
        method: "DELETE",
        headers: { "X-API-KEY": apiKey },
      });
      if (!res.ok) {
        const err = await res.text();
        throw new Error(`Delete item failed [${res.status}]: ${err}`);
      }
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "investments" && req.method === "GET") {
      const itemId = url.searchParams.get("itemId");
      if (!itemId) throw new Error("itemId is required");
      const res = await fetch(`${PLUGGY_API_URL}/investments?itemId=${itemId}`, {
        headers: { "X-API-KEY": apiKey },
      });
      if (!res.ok) {
        const err = await res.text();
        throw new Error(`Investments failed [${res.status}]: ${err}`);
      }
      const data = await res.json();
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), {
      status: 404,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Pluggy error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
