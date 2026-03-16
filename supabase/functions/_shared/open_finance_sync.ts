import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { belvoGetAll, getBelvoConfig } from "./belvo.ts";
import { classifyTransaction } from "./classify.ts";

export type BankConnectionRow = {
  id: string;
  company_id: string;
  institution_name: string;
  provider: string;
  status: string | null;
  account_id: string | null; // For Belvo we store link id here (legacy naming)
  last_synced_at: string | null;
  metadata: Record<string, unknown> | null;
};

type SyncMode = "full" | "accounts_only" | "transactions_only";

export type BelvoSyncOptions = {
  mode?: SyncMode;
  createdAtGte?: string; // YYYY-MM-DD (Belvo created_at__gte)
  transactionIds?: string[];
};

function toYmd(d: Date) {
  return d.toISOString().slice(0, 10);
}

function daysAgoYmd(days: number) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return toYmd(d);
}

function pickAccountType(raw: unknown) {
  const s = String(raw || "").toLowerCase();
  if (s.includes("check") || s.includes("current")) return "checking";
  if (s.includes("saving")) return "savings";
  if (s.includes("credit")) return "credit";
  if (s.includes("invest")) return "investment";
  return "other";
}

function parseBalance(account: any): number {
  const bal = account?.balance;
  if (typeof bal === "number") return Number(bal) || 0;
  if (typeof bal?.current === "number") return Number(bal.current) || 0;
  if (typeof bal?.available === "number") return Number(bal.available) || 0;
  if (typeof bal?.current === "string") return Number(bal.current) || 0;
  if (typeof bal?.available === "string") return Number(bal.available) || 0;
  return 0;
}

function parseAmount(tx: any): number {
  let amt = 0;
  if (typeof tx?.amount === "number") amt = tx.amount;
  else if (typeof tx?.amount === "string") amt = Number(tx.amount) || 0;
  else if (typeof tx?.amount?.amount === "number") amt = tx.amount.amount;
  else if (typeof tx?.amount?.amount === "string") amt = Number(tx.amount.amount) || 0;

  const type = String(tx?.type || "").toUpperCase();
  // Some providers send positive amounts plus a type (OUTFLOW/INFLOW).
  if (amt > 0 && (type.includes("OUT") || type.includes("DEBIT"))) return -amt;
  return amt;
}

function parseTxDate(tx: any): string {
  const dateStr = tx?.value_date || tx?.accounting_date || tx?.date || tx?.created_at;
  if (!dateStr) return new Date().toISOString();
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return new Date().toISOString();
  return d.toISOString();
}

function normalizeAccountExternalId(tx: any): string | null {
  const a = tx?.account;
  if (!a) return null;
  if (typeof a === "string") return a;
  if (typeof a?.id === "string") return a.id;
  return null;
}

export async function syncBelvoConnection(
  supabaseAdmin: SupabaseClient,
  connection: BankConnectionRow,
  opts?: BelvoSyncOptions,
) {
  if (String(connection.provider || "").toLowerCase() !== "belvo") {
    throw new Error(`syncBelvoConnection called for provider=${connection.provider}`);
  }

  const linkId = String(connection.account_id || "").trim();
  if (!linkId) throw new Error("Belvo connection missing link id (bank_connections.account_id)");

  const cfg = getBelvoConfig();

  const mode: SyncMode = opts?.mode || "full";
  const createdAtGte =
    opts?.createdAtGte ||
    (connection.last_synced_at ? toYmd(new Date(connection.last_synced_at)) : daysAgoYmd(365));

  // 1) Accounts
  let accountsUpserted = 0;
  const accountIdByExternal = new Map<string, string>();

  if (mode === "full" || mode === "accounts_only") {
    const belvoAccounts = await belvoGetAll<any>(cfg, "/api/accounts/", {
      link: linkId,
      page_size: 100,
    });

    const rows = belvoAccounts.map((a) => {
      const externalId = String(a.id);
      const name = String(a.name || a.official_name || a.type || a.category || "Conta");
      const bankName = `${connection.institution_name} • ${name}`;

      return {
        company_id: connection.company_id,
        bank_connection_id: connection.id,
        provider: "belvo",
        external_id: externalId,
        bank_name: bankName,
        account_type: pickAccountType(a.category || a.type),
        balance: parseBalance(a),
        currency: String(a.currency || a?.balance?.currency || "BRL"),
        metadata: { belvo: a },
      };
    });

    if (rows.length > 0) {
      const { error } = await supabaseAdmin.from("accounts").upsert(rows, {
        onConflict: "company_id,provider,external_id",
      });
      if (error) throw error;
      accountsUpserted = rows.length;
    }

    // Load ids to map transactions -> internal account_id.
    const { data: syncedAccounts, error: syncedErr } = await supabaseAdmin
      .from("accounts")
      .select("id, external_id")
      .eq("company_id", connection.company_id)
      .eq("provider", "belvo")
      .eq("bank_connection_id", connection.id);
    if (syncedErr) throw syncedErr;

    for (const a of syncedAccounts || []) {
      const ext = String((a as any).external_id || "");
      if (!ext) continue;
      accountIdByExternal.set(ext, String((a as any).id));
    }
  }

  // 2) Transactions
  let transactionsUpserted = 0;
  let transactionsSkipped = 0;

  if (mode === "full" || mode === "transactions_only") {
    const query: Record<string, string | number | boolean | undefined | null> = {
      link: linkId,
      page_size: 100,
      created_at__gte: createdAtGte,
    };

    if (opts?.transactionIds?.length) {
      query.id__in = opts.transactionIds.join(",");
    }

    const belvoTxs = await belvoGetAll<any>(cfg, "/api/transactions/", query);

    const rows = belvoTxs
      .map((t) => {
        const externalId = String(t.id);
        const accountExternal = normalizeAccountExternalId(t);
        if (!accountExternal) return null;

        const internalAccountId = accountIdByExternal.get(accountExternal);
        if (!internalAccountId) return null;

        const amount = parseAmount(t);
        const description = String(t.description || t.merchant?.name || t.reference || "Transacao");
        const category = String(t.category || classifyTransaction(description, amount) || "Uncategorized");
        const date = parseTxDate(t);
        const status = String(t.status || "completed").toLowerCase();

        return {
          company_id: connection.company_id,
          account_id: internalAccountId,
          amount,
          category,
          description,
          date,
          status,
          provider: "belvo",
          external_id: externalId,
          metadata: {
            belvo: t,
            belvo_link_id: linkId,
            bank_connection_id: connection.id,
          },
        };
      })
      .filter(Boolean) as any[];

    transactionsSkipped = belvoTxs.length - rows.length;

    if (rows.length > 0) {
      const { error } = await supabaseAdmin.from("transactions").upsert(rows, {
        onConflict: "provider,external_id",
      });
      if (error) throw error;
      transactionsUpserted = rows.length;
    }
  }

  // 3) Update sync timestamp
  const { error: connErr } = await supabaseAdmin
    .from("bank_connections")
    .update({ last_synced_at: new Date().toISOString(), status: "connected" })
    .eq("id", connection.id);
  if (connErr) throw connErr;

  return {
    connectionId: connection.id,
    accountsUpserted,
    transactionsUpserted,
    transactionsSkipped,
    createdAtGte,
  };
}

