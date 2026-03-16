import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

function requireEnv(name: string) {
  const v = Deno.env.get(name);
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

export function createSupabaseAdminClient() {
  const url = requireEnv("SUPABASE_URL");
  const serviceRole = requireEnv("SUPABASE_SERVICE_ROLE_KEY");
  return createClient(url, serviceRole, {
    auth: { persistSession: false },
  });
}

export function createSupabaseUserClient(req: Request) {
  // Edge Functions automatically inject these variables
  const url = Deno.env.get("SUPABASE_URL") ?? "";
  const anon = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
  const authHeader = req.headers.get("Authorization") ?? "";
  
  if (!url || !anon) {
     console.error("Missing SUPABASE_URL or SUPABASE_ANON_KEY");
  }

  return createClient(url, anon, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false },
  });
}

import { corsHeaders } from "./cors.ts";

export async function requireUser(req: Request) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return { 
      ok: false as const, 
      response: new Response(
        JSON.stringify({ error: "Unauthorized", details: "Missing Authorization header" }), 
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      ) 
    };
  }

  const supabase = createSupabaseUserClient(req);
  const token = authHeader.replace("Bearer ", "");
  
  // Explicitly passing the token to getUser is more reliable in Edge Functions
  const { data, error } = await supabase.auth.getUser(token);
  
  if (error || !data.user) {
    console.error("Auth Error:", error?.message || "User not found");
    return { 
      ok: false as const, 
      response: new Response(
        JSON.stringify({ 
          error: "Unauthorized", 
          details: error?.message || "Invalid session",
          hint: "Try logging out and in again" 
        }), 
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      ) 
    };
  }
  return { ok: true as const, user: data.user };
}

