import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { jsonResponse, textResponse } from "../_shared/cors.ts";
import { createSupabaseAdminClient } from "../_shared/supabase.ts";
import { syncBelvoConnection } from "../_shared/open_finance_sync.ts";

function requireWebhookAuth(req: Request) {
  const expected = Deno.env.get("BELVO_WEBHOOK_AUTH");
  if (!expected) return { ok: false as const, reason: "Missing BELVO_WEBHOOK_AUTH env var" };
  const got = req.headers.get("authorization") || "";
  if (got !== expected) return { ok: false as const, reason: "Unauthorized" };
  return { ok: true as const };
}

type BelvoWebhook = {
  webhook_type?: string;
  webhook_code?: string;
  link?: string;
  request_id?: string;
  external_id?: string;
  created_at?: string;
  data?: any;
};

serve(async (req) => {
  // Webhooks are server-to-server, no need for CORS preflight.
  if (req.method !== "POST") return textResponse("Method Not Allowed", { status: 405 });

  const auth = requireWebhookAuth(req);
  if (!auth.ok) return textResponse(auth.reason, { status: auth.reason === "Unauthorized" ? 401 : 500 });

  try {
    const payload = (await req.json().catch(() => ({}))) as BelvoWebhook;
    const webhookType = String(payload.webhook_type || "").toUpperCase();
    const webhookCode = String(payload.webhook_code || "").toLowerCase();
    const linkId = String(payload.link || "").trim();

    if (!linkId) return jsonResponse({ ok: true, ignored: true, reason: "missing_link" });

    const supabaseAdmin = createSupabaseAdminClient();
    const { data: connections, error } = await supabaseAdmin
      .from("bank_connections")
      .select("*")
      .eq("provider", "belvo")
      .eq("account_id", linkId);
    if (error) throw error;
    if (!connections || connections.length === 0) {
      return jsonResponse({ ok: true, ignored: true, reason: "unknown_link" });
    }

    // Mark connection status on authentication issues.
    if (["invalid_credentials", "token_required", "consent_expired", "consent_revoked"].includes(webhookCode)) {
      await supabaseAdmin
        .from("bank_connections")
        .update({
          status: "needs_attention",
          metadata: { last_webhook: payload, last_error: webhookCode },
        } as any)
        .eq("provider", "belvo")
        .eq("account_id", linkId);

      return jsonResponse({ ok: true, updated: true, status: "needs_attention" });
    }

    const results: any[] = [];

    for (const c of connections) {
      if (webhookType === "ACCOUNTS") {
        if (["historical_update", "new_accounts_available"].includes(webhookCode)) {
          results.push(await syncBelvoConnection(supabaseAdmin, c as any, { mode: "accounts_only" }));
        }
        continue;
      }

      if (webhookType === "TRANSACTIONS") {
        if (webhookCode === "transactions_deleted") {
          const ids = (payload.data?.transactions || payload.data?.ids || []) as string[];
          if (Array.isArray(ids) && ids.length > 0) {
            const { error: updErr } = await supabaseAdmin
              .from("transactions")
              .update({ status: "deleted" } as any)
              .eq("provider", "belvo")
              .in("external_id", ids);
            if (updErr) throw updErr;
          }

          results.push({ connectionId: (c as any).id, deleted: (ids || []).length });
          continue;
        }

        const createdAtGte =
          payload.data?.created_at__range?.start_date ||
          payload.data?.first_transaction_date ||
          undefined;

        const txIds = (payload.data?.transactions || []) as string[];

        if (webhookCode === "transactions_updated" && Array.isArray(txIds) && txIds.length > 0) {
          results.push(
            await syncBelvoConnection(supabaseAdmin, c as any, {
              mode: "transactions_only",
              createdAtGte,
              transactionIds: txIds,
            }),
          );
          continue;
        }

        if (
          ["historical_update", "new_transactions_available", "recurring_transactions_updated"].includes(webhookCode)
        ) {
          results.push(
            await syncBelvoConnection(supabaseAdmin, c as any, {
              mode: "transactions_only",
              createdAtGte,
            }),
          );
        }
      }
    }

    return jsonResponse({
      ok: true,
      linkId,
      webhookType,
      webhookCode,
      processed: results.length,
      results,
    });
  } catch (e) {
    console.error("belvo-webhook error:", e);
    return jsonResponse({ error: "internal_error", message: String(e?.message || e) }, { status: 500 });
  }
});

