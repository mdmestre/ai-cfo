import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { corsHeaders, jsonResponse, textResponse } from "../_shared/cors.ts";
import { createSupabaseAdminClient, createSupabaseUserClient, requireUser } from "../_shared/supabase.ts";
import { syncBelvoConnection } from "../_shared/open_finance_sync.ts";

type SyncRequest = {
  companyId?: string;
  connectionId?: string;
  linkId?: string;
  createdAtGte?: string;
  mode?: "full" | "accounts_only" | "transactions_only";
  transactionIds?: string[];
};

serve(async (req) => {
  if (req.method === "OPTIONS") return textResponse("ok", { headers: corsHeaders });

  const auth = await requireUser(req);
  if (!auth.ok) return textResponse("Unauthorized", { status: 401, headers: corsHeaders });

  try {
    const body = (await req.json().catch(() => ({}))) as SyncRequest;
    const companyId = body.companyId?.trim();
    const connectionId = body.connectionId?.trim();
    const linkId = body.linkId?.trim();

    if (!companyId && !connectionId && !linkId) {
      return jsonResponse(
        { error: "bad_request", message: "Provide companyId, connectionId or linkId." },
        { status: 400 },
      );
    }

    const supabaseUser = createSupabaseUserClient(req);
    const supabaseAdmin = createSupabaseAdminClient();

    // Load connections using user-scoped client (RLS enforces access).
    let connections: any[] = [];
    if (connectionId) {
      const { data, error } = await supabaseUser
        .from("bank_connections")
        .select("*")
        .eq("id", connectionId)
        .single();
      if (error) throw error;
      connections = [data];
    } else if (linkId) {
      const { data, error } = await supabaseUser
        .from("bank_connections")
        .select("*")
        .eq("provider", "belvo")
        .eq("account_id", linkId);
      if (error) throw error;
      connections = data || [];
    } else {
      // Ensure user can access the company (RLS on companies table).
      const { data: companyRow, error: companyErr } = await supabaseUser
        .from("companies")
        .select("id")
        .eq("id", companyId!)
        .maybeSingle();
      if (companyErr) throw companyErr;
      if (!companyRow) return textResponse("Forbidden", { status: 403, headers: corsHeaders });

      const { data, error } = await supabaseUser
        .from("bank_connections")
        .select("*")
        .eq("company_id", companyId!)
        .eq("provider", "belvo");
      if (error) throw error;
      connections = data || [];
    }

    if (connections.length === 0) {
      return jsonResponse({ ok: true, synced: 0, results: [] });
    }

    const startedAt = new Date();
    const results = [];

    for (const c of connections) {
      if (String(c.status || "").toLowerCase() === "disconnected") continue;
      results.push(
        await syncBelvoConnection(supabaseAdmin, c, {
          mode: body.mode,
          createdAtGte: body.createdAtGte,
          transactionIds: body.transactionIds,
        }),
      );
    }

    const finishedAt = new Date();
    return jsonResponse({
      ok: true,
      synced: results.length,
      startedAt: startedAt.toISOString(),
      finishedAt: finishedAt.toISOString(),
      results,
    });
  } catch (e) {
    const msg = String(e?.message || e);
    console.error("belvo-sync error:", e);

    // Friendly hint when schema wasn't migrated.
    if (msg.toLowerCase().includes("column") && msg.toLowerCase().includes("does not exist")) {
      return jsonResponse(
        {
          error: "schema_outdated",
          message:
            "Seu schema Supabase parece desatualizado para Open Finance. Rode o script supabase_open_finance_truth_layer.sql e tente novamente.",
          details: msg,
        },
        { status: 400 },
      );
    }

    return jsonResponse({ error: "internal_error", message: msg }, { status: 500 });
  }
});

