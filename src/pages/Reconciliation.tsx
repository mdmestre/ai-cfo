import { AppLayout } from "@/components/layout/AppLayout";
import { useLedger } from "@/hooks/use-ledger";
import { useReconciliations, ReconciliationStatus } from "@/hooks/use-reconciliations";
import { useTransactions } from "@/hooks/use-transactions";
import { formatBRL, formatBRLCompact } from "@/lib/format";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AlertTriangle, CheckCircle2, Loader2, RefreshCw, Scale, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link } from "react-router-dom";

type ReconRow = {
  tx: any;
  status: ReconciliationStatus;
  ledgerEntry: any | null;
  ledgerTotal: number | null;
};

function statusLabel(status: ReconciliationStatus) {
  switch (status) {
    case "reconciled":
      return "Conciliado";
    case "divergent":
      return "Divergente";
    case "pending":
    default:
      return "Pendente";
  }
}

function statusClass(status: ReconciliationStatus) {
  switch (status) {
    case "reconciled":
      return "bg-success/10 text-success border-success/20";
    case "divergent":
      return "bg-destructive/10 text-destructive border-destructive/20";
    case "pending":
    default:
      return "bg-secondary text-muted-foreground border-border";
  }
}

function sumEntryTotal(entry: any): number {
  const lines = (entry?.ledger_entry_lines || []) as any[];
  const debit = lines.reduce((s, l) => s + Number(l.debit || 0), 0);
  const credit = lines.reduce((s, l) => s + Number(l.credit || 0), 0);
  return Math.max(debit, credit);
}

function guessCashAccountId(ledgerAccounts: any[]): string | null {
  const byName = ledgerAccounts.find((a) => String(a.name || "").toLowerCase().includes("caixa"));
  if (byName?.id) return String(byName.id);
  const byCode = ledgerAccounts.find((a) => String(a.code || "").startsWith("1.1.1"));
  if (byCode?.id) return String(byCode.id);
  const firstAsset = ledgerAccounts.find((a) => String(a.account_type || "").toLowerCase() === "asset");
  return firstAsset?.id ? String(firstAsset.id) : null;
}

function suggestCounterpartAccountId(tx: any, ledgerAccounts: any[]): string | null {
  const category = String(tx.category || "").toLowerCase();
  const desc = String(tx.description || "").toLowerCase();

  const wantsRevenue = Number(tx.amount) > 0;
  const preferredType = wantsRevenue ? "revenue" : "expense";

  const ranked = ledgerAccounts
    .filter((a) => String(a.account_type || "").toLowerCase() === preferredType)
    .map((a) => {
      const name = String(a.name || "").toLowerCase();
      let score = 0;
      if (category && name.includes(category)) score += 4;
      if (category.includes("marketing") && name.includes("marketing")) score += 4;
      if (category.includes("folha") && (name.includes("folha") || name.includes("sal"))) score += 4;
      if (category.includes("imposto") && (name.includes("imposto") || name.includes("tax"))) score += 4;
      if (desc && name.includes("tarifa") && desc.includes("tarifa")) score += 3;
      return { a, score };
    })
    .sort((x, y) => y.score - x.score);

  const best = ranked[0];
  if (best?.score >= 3) return String(best.a.id);

  const fallback = ledgerAccounts.find((a) => String(a.account_type || "").toLowerCase() === preferredType);
  return fallback?.id ? String(fallback.id) : null;
}

export default function Reconciliation() {
  const { transactions, isLoading: txLoading } = useTransactions();
  const { reconciliations, upsertReconciliation } = useReconciliations();
  const { journalEntries, ledgerAccounts, createJournalEntry, isLoading: ledgerLoading } = useLedger();

  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<ReconciliationStatus | "all">("all");
  const [activeTx, setActiveTx] = useState<any | null>(null);
  const [cashAccountId, setCashAccountId] = useState<string | null>(null);
  const [counterpartAccountId, setCounterpartAccountId] = useState<string | null>(null);

  const isLoading = txLoading || ledgerLoading || reconciliations.isLoading;

  const { rows, summary } = useMemo(() => {
    const recByTx = new Map<string, any>();
    for (const r of reconciliations.data || []) recByTx.set(String((r as any).transaction_id), r);

    const ledById = new Map<string, any>();
    const ledByRef = new Map<string, any>();
    for (const e of journalEntries || []) {
      ledById.set(String(e.id), e);
      if (e.reference) ledByRef.set(String(e.reference), e);
    }

    const q = query.trim().toLowerCase();
    const computed: ReconRow[] = (transactions as any[])
      .filter((t) => {
        if (!q) return true;
        const hay = `${t.description || ""} ${t.category || ""}`.toLowerCase();
        return hay.includes(q);
      })
      .map((tx) => {
        const rec = recByTx.get(String(tx.id)) || null;
        let status: ReconciliationStatus = (rec?.status as ReconciliationStatus) || "pending";
        let ledgerEntry = null;

        const ledgerEntryId = rec?.ledger_entry_id ? String(rec.ledger_entry_id) : null;
        if (ledgerEntryId) ledgerEntry = ledById.get(ledgerEntryId) || null;
        if (!ledgerEntry && !rec) {
          ledgerEntry = ledByRef.get(String(tx.id)) || null;
          if (ledgerEntry) status = "reconciled";
        }

        const ledgerTotal = ledgerEntry ? sumEntryTotal(ledgerEntry) : null;

        // Auto-classify as divergent if amounts don't match.
        if (status === "reconciled" && ledgerTotal !== null) {
          const txAbs = Math.abs(Number(tx.amount) || 0);
          if (Math.abs(ledgerTotal - txAbs) > 0.01) status = "divergent";
        }

        return { tx, status, ledgerEntry, ledgerTotal };
      })
      .filter((r) => (filter === "all" ? true : r.status === filter));

    const totals = {
      total: computed.length,
      reconciled: computed.filter((r) => r.status === "reconciled").length,
      pending: computed.filter((r) => r.status === "pending").length,
      divergent: computed.filter((r) => r.status === "divergent").length,
      pendingValue: computed
        .filter((r) => r.status === "pending")
        .reduce((s, r) => s + Math.abs(Number(r.tx.amount) || 0), 0),
    };

    return { rows: computed, summary: totals };
  }, [filter, journalEntries, query, reconciliations.data, transactions]);

  const openReconcile = (tx: any) => {
    setActiveTx(tx);
    const cash = guessCashAccountId(ledgerAccounts || []);
    setCashAccountId(cash);
    setCounterpartAccountId(suggestCounterpartAccountId(tx, ledgerAccounts || []));
  };

  const closeReconcile = () => {
    setActiveTx(null);
    setCashAccountId(null);
    setCounterpartAccountId(null);
  };

  const handleMarkPending = async (txId: string) => {
    try {
      await upsertReconciliation.mutateAsync({ transaction_id: txId, status: "pending", ledger_entry_id: null });
      toast.success("Marcado como pendente");
    } catch (e: any) {
      toast.error(e?.message || "Falha ao atualizar conciliacao");
    }
  };

  const handleGenerateLedgerEntry = async () => {
    if (!activeTx) return;
    if (!cashAccountId) return toast.error("Defina a conta Caixa/Bancos no seu plano de contas (Ledger).");
    if (!counterpartAccountId) return toast.error("Selecione a conta de contrapartida.");

    const amountAbs = Math.abs(Number(activeTx.amount) || 0);
    const inflow = Number(activeTx.amount) > 0;

    const lines = inflow
      ? [
          { ledger_account_id: cashAccountId, debit: amountAbs, credit: 0 },
          { ledger_account_id: counterpartAccountId, debit: 0, credit: amountAbs },
        ]
      : [
          { ledger_account_id: counterpartAccountId, debit: amountAbs, credit: 0 },
          { ledger_account_id: cashAccountId, debit: 0, credit: amountAbs },
        ];

    try {
      const entry = await createJournalEntry.mutateAsync({
        description: String(activeTx.description || "Conciliação bancária"),
        reference: String(activeTx.id),
        entry_date: activeTx.date ? new Date(activeTx.date).toISOString() : new Date().toISOString(),
        lines,
      });

      await upsertReconciliation.mutateAsync({
        transaction_id: String(activeTx.id),
        ledger_entry_id: String((entry as any).id),
        status: "reconciled",
        match_score: 1,
      });

      toast.success("Lançamento criado e conciliado");
      closeReconcile();
    } catch (e: any) {
      toast.error(e?.message || "Falha ao gerar lançamento");
    }
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-[1200px] space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-foreground tracking-tight">Conciliação</h1>
            <p className="mt-0.5 text-[13px] text-muted-foreground">
              Banco → conciliação → Ledger. Aqui é onde o caixa vira “verdade contábil”.
            </p>
          </div>

          <button
            onClick={() => window.location.reload()}
            className="flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-[13px] font-semibold text-foreground hover:bg-secondary transition-colors"
            title="Recarregar"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Atualizar
          </button>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="metric-card">
            <p className="text-xxs font-bold uppercase tracking-wider text-muted-foreground/70">Pendentes</p>
            <p className="mt-1 text-2xl font-bold tracking-tight text-foreground">{summary.pending}</p>
            <p className="mt-1 text-[12px] text-muted-foreground">Valor: {formatBRLCompact(summary.pendingValue)}</p>
          </div>
          <div className="metric-card">
            <p className="text-xxs font-bold uppercase tracking-wider text-muted-foreground/70">Conciliados</p>
            <p className="mt-1 text-2xl font-bold tracking-tight text-foreground">{summary.reconciled}</p>
            <p className="mt-1 text-[12px] text-muted-foreground">Pronto para auditoria</p>
          </div>
          <div className="metric-card">
            <p className="text-xxs font-bold uppercase tracking-wider text-muted-foreground/70">Divergentes</p>
            <p className="mt-1 text-2xl font-bold tracking-tight text-foreground">{summary.divergent}</p>
            <p className="mt-1 text-[12px] text-muted-foreground">Precisa de ajuste</p>
          </div>
          <div className="metric-card">
            <p className="text-xxs font-bold uppercase tracking-wider text-muted-foreground/70">Health Check</p>
            <p className="mt-1 text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <Scale className="h-5 w-5 text-primary" /> Truth Layer
            </p>
            <p className="mt-1 text-[12px] text-muted-foreground">Cada lançamento pode ser selado e auditado</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex flex-1 items-center gap-2 rounded-md border border-border bg-card px-3 py-1.5 max-w-sm">
            <Search className="h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar por descrição/categoria..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1 bg-transparent text-[13px] text-foreground placeholder:text-muted-foreground outline-none"
            />
          </div>

          {(["all", "pending", "reconciled", "divergent"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={cn(
                "rounded-md px-3 py-1.5 text-[13px] font-medium transition-colors",
                s === filter ? "bg-foreground text-background" : "border border-border bg-card text-foreground hover:bg-secondary",
              )}
            >
              {s === "all" ? "Tudo" : statusLabel(s)}
            </button>
          ))}
        </div>

        <div className="overflow-hidden rounded-lg border border-border bg-card">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                {["Data", "Descrição", "Categoria", "Valor", "Status", "Ação"].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-2.5 text-left text-xxs font-medium uppercase tracking-wider text-muted-foreground"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-[13px] text-muted-foreground">
                    Nenhuma transação para este filtro.
                  </td>
                </tr>
              ) : (
                rows.map((r) => {
                  const d = r.tx.date ? new Date(r.tx.date) : null;
                  const amount = Number(r.tx.amount) || 0;
                  return (
                    <tr key={r.tx.id} className="border-b border-border last:border-0 hover:bg-secondary/50 transition-colors">
                      <td className="px-4 py-3 text-[13px] text-muted-foreground">
                        {d ? format(d, "dd/MM/yyyy", { locale: ptBR }) : "-"}
                      </td>
                      <td className="px-4 py-3 text-[13px] font-medium text-foreground">
                        {r.tx.description || "-"}
                        {r.ledgerEntry?.entry_hash && (
                          <p className="mt-0.5 text-xxs text-muted-foreground">
                            Hash: <span className="font-mono">{String(r.ledgerEntry.entry_hash).slice(0, 12)}…</span>
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="rounded-full bg-secondary px-2 py-0.5 text-xxs font-medium text-secondary-foreground">
                          {r.tx.category || "Uncategorized"}
                        </span>
                      </td>
                      <td className={cn("px-4 py-3 text-[13px] font-semibold", amount > 0 ? "text-success" : "text-foreground")}>
                        {amount > 0 ? "+" : "-"}
                        {formatBRL(Math.abs(amount))}
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn("inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xxs font-semibold", statusClass(r.status))}>
                          {r.status === "reconciled" ? <CheckCircle2 className="h-3 w-3" /> : r.status === "divergent" ? <AlertTriangle className="h-3 w-3" /> : null}
                          {statusLabel(r.status)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {r.status === "pending" ? (
                          <button
                            onClick={() => openReconcile(r.tx)}
                            className="rounded-md bg-primary px-3 py-1.5 text-[12px] font-bold text-primary-foreground hover:opacity-90"
                          >
                            Conciliar
                          </button>
                        ) : (
                          <button
                            onClick={() => handleMarkPending(String(r.tx.id))}
                            className="rounded-md border border-border bg-card px-3 py-1.5 text-[12px] font-bold text-foreground hover:bg-secondary"
                            title="Desfazer conciliação (mantém o ledger, volta a pendente)"
                          >
                            Reabrir
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <Dialog open={!!activeTx} onOpenChange={(open) => (!open ? closeReconcile() : null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Conciliar transação</DialogTitle>
              <DialogDescription>
                Vamos gerar um lançamento no Ledger e selar a trilha de auditoria.
              </DialogDescription>
            </DialogHeader>

            {activeTx && (
              <div className="space-y-4">
                {ledgerAccounts.length === 0 && (
                  <div className="rounded-lg border border-border bg-secondary/30 p-3 text-[13px] text-muted-foreground">
                    Seu Ledger ainda não tem contas. Crie pelo menos uma conta <strong className="text-foreground">Caixa/Bancos</strong>{" "}
                    e uma conta de contrapartida (Receita/Despesa) para conciliar.
                    <div className="mt-2">
                      <Link to="/ledger" className="text-primary font-semibold hover:underline">
                        Ir para o Ledger
                      </Link>
                    </div>
                  </div>
                )}
                <div className="rounded-lg border border-border bg-secondary/30 p-3">
                  <p className="text-[13px] font-semibold text-foreground">{activeTx.description || "Transação"}</p>
                  <p className="mt-0.5 text-[12px] text-muted-foreground">
                    {activeTx.date ? format(new Date(activeTx.date), "dd/MM/yyyy", { locale: ptBR }) : "-"} •{" "}
                    <span className={Number(activeTx.amount) > 0 ? "text-success font-semibold" : "font-semibold"}>
                      {Number(activeTx.amount) > 0 ? "+" : "-"}
                      {formatBRL(Math.abs(Number(activeTx.amount) || 0))}
                    </span>
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="space-y-1">
                    <p className="text-[11px] font-semibold text-muted-foreground">Conta Caixa/Bancos</p>
                    <Select value={cashAccountId || ""} onValueChange={(v) => setCashAccountId(v)}>
                      <SelectTrigger className="h-9 text-[13px]">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {ledgerAccounts.map((a: any) => (
                          <SelectItem key={a.id} value={a.id}>
                            {a.code} - {a.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <p className="text-[11px] font-semibold text-muted-foreground">Contrapartida</p>
                    <Select value={counterpartAccountId || ""} onValueChange={(v) => setCounterpartAccountId(v)}>
                      <SelectTrigger className="h-9 text-[13px]">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {ledgerAccounts.map((a: any) => (
                          <SelectItem key={a.id} value={a.id}>
                            {a.code} - {a.name} ({a.account_type})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="rounded-lg border border-border bg-card p-3">
                  <p className="text-[12px] font-bold text-foreground mb-2">Prévia do lançamento</p>
                  <div className="text-[12px] text-muted-foreground space-y-1">
                    <p>
                      Referência: <span className="font-mono text-foreground">{String(activeTx.id).slice(0, 8)}…</span>
                    </p>
                    <p>
                      Valor: <span className="font-semibold text-foreground">{formatBRL(Math.abs(Number(activeTx.amount) || 0))}</span>
                    </p>
                  </div>
                </div>
              </div>
            )}

            <DialogFooter>
              <button
                onClick={closeReconcile}
                className="rounded-md border border-border bg-card px-4 py-2 text-[13px] font-semibold text-foreground hover:bg-secondary"
              >
                Cancelar
              </button>
              <button
                onClick={handleGenerateLedgerEntry}
                disabled={ledgerAccounts.length === 0 || createJournalEntry.isPending || upsertReconciliation.isPending}
                className="rounded-md bg-primary px-4 py-2 text-[13px] font-bold text-primary-foreground hover:opacity-90 disabled:opacity-50"
              >
                {createJournalEntry.isPending || upsertReconciliation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Gerar lançamento e conciliar"
                )}
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
