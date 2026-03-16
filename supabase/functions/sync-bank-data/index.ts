import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { corsHeaders, jsonResponse, textResponse } from "../_shared/cors.ts";
import { createSupabaseAdminClient, createSupabaseUserClient, requireUser } from "../_shared/supabase.ts";
import { syncBelvoConnection } from "../_shared/open_finance_sync.ts";

type SyncBankDataRequest = { connectionId?: string };

serve(async (req) => {
  if (req.method === "OPTIONS") return textResponse("ok", { headers: corsHeaders });

  const auth = await requireUser(req);
  if (!auth.ok) return textResponse("Unauthorized", { status: 401, headers: corsHeaders });

  try {
    const body = (await req.json().catch(() => ({}))) as SyncBankDataRequest;
    const connectionId = body.connectionId?.trim();
    if (!connectionId) {
      return jsonResponse({ error: "bad_request", message: "Provide connectionId." }, { status: 400 });
    }

    const supabaseUser = createSupabaseUserClient(req);
    const { data: connection, error } = await supabaseUser
      .from("bank_connections")
      .select("*")
      .eq("id", connectionId)
      .single();
    if (error) throw error;

    const provider = String(connection.provider || "").toLowerCase();
    const supabaseAdmin = createSupabaseAdminClient();

    if (provider === "belvo") {
      const res = await syncBelvoConnection(supabaseAdmin, connection, { mode: "full" });
      return jsonResponse({ ok: true, provider, result: res });
    }

    // For non-Belvo providers, we just mark a sync timestamp (until that connector is implemented).
    const { error: updErr } = await supabaseAdmin
      .from("bank_connections")
      .update({ last_synced_at: new Date().toISOString(), status: "connected" })
      .eq("id", connectionId);
    if (updErr) throw updErr;

    return jsonResponse({
      ok: true,
      provider,
      message: "Conexao marcada como sincronizada (conector ainda nao implementado).",
    });
  } catch (e) {
    console.error("sync-bank-data error:", e);
    return jsonResponse({ error: "internal_error", message: String(e?.message || e) }, { status: 500 });
  }
});

