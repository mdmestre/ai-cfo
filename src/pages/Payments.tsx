import { AppLayout } from "@/components/layout/AppLayout";
import { Badge } from "@/components/ui/badge";
import { useInvoices } from "@/hooks/use-invoices";
import { formatBRLCompact, formatBRLNoCents } from "@/lib/format";
import { addDays, differenceInCalendarDays, format, parseISO, startOfDay } from "date-fns";
import { ArrowDownLeft, ArrowUpRight, CheckCircle2, Clock, Loader2, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

const OPEN_STATUSES = new Set(["open", "pending", "partial"]);

type TabKey = "receivables" | "payables";
type FilterKey = "all" | "overdue" | "7d" | "30d";

function normalizeStatus(v: unknown) {
  const s = String(v || "").trim().toLowerCase();
  return s || "open";
}

export default function Payments() {
  const { receivables, payables, updateReceivableStatus, updatePayableStatus } = useInvoices();
  const [tab, setTab] = useState<TabKey>("receivables");
  const [filter, setFilter] = useState<FilterKey>("all");

  const now = startOfDay(new Date());
  const d7 = addDays(now, 7);
  const d30 = addDays(now, 30);

  const rRows = useMemo(() => {
    return (receivables.data || []).map((r: any) => {
      const status = normalizeStatus(r.status);
      const isOpen = OPEN_STATUSES.has(status);
      const isPaid = status === "paid";
      const due = r.due_date ? parseISO(String(r.due_date)) : null;
      const amount = Number(r.amount) || 0;
      const isOverdue = Boolean(isOpen && due && due < now);
      const daysLate = isOverdue && due ? differenceInCalendarDays(now, due) : 0;
      return { row: r, isOpen, isPaid, due, amount, isOverdue, daysLate };
    });
  }, [now, receivables.data]);

  const pRows = useMemo(() => {
    return (payables.data || []).map((p: any) => {
      const status = normalizeStatus(p.status);
      const isOpen = OPEN_STATUSES.has(status);
      const isPaid = status === "paid";
      const due = p.due_date ? parseISO(String(p.due_date)) : null;
      const amount = Number(p.amount) || 0;
      const isOverdue = Boolean(isOpen && due && due < now);
      const daysLate = isOverdue && due ? differenceInCalendarDays(now, due) : 0;
      return { row: p, isOpen, isPaid, due, amount, isOverdue, daysLate };
    });
  }, [now, payables.data]);

  const totals = useMemo(() => {
    const rOpen = rRows.filter((x) => x.isOpen).reduce((s, x) => s + x.amount, 0);
    const pOpen = pRows.filter((x) => x.isOpen).reduce((s, x) => s + x.amount, 0);
    const rOverdue = rRows.filter((x) => x.isOverdue).reduce((s, x) => s + x.amount, 0);
    const pOverdue = pRows.filter((x) => x.isOverdue).reduce((s, x) => s + x.amount, 0);
    return { rOpen, pOpen, rOverdue, pOverdue };
  }, [pRows, rRows]);

  const filtered = useMemo(() => {
    const base = tab === "receivables" ? rRows : pRows;
    if (filter === "all") return base;
    if (filter === "overdue") return base.filter((x) => x.isOverdue);
    if (filter === "7d") return base.filter((x) => x.isOpen && x.due && x.due >= now && x.due <= d7);
    if (filter === "30d") return base.filter((x) => x.isOpen && x.due && x.due >= now && x.due <= d30);
    return base;
  }, [d30, d7, filter, now, pRows, rRows, tab]);

  const isLoading = receivables.isLoading || payables.isLoading;

  const onSetStatus = async (id: string, status: "paid" | "open") => {
    try {
      if (tab === "receivables") {
        await updateReceivableStatus.mutateAsync({ id, status });
      } else {
        await updatePayableStatus.mutateAsync({ id, status });
      }
    } catch (err: any) {
      toast.error(err?.message || "Falha ao atualizar status.");
    }
  };

  return (
    <AppLayout>
      <div className="max-w-[1200px] space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-foreground tracking-tight">Pagamentos</h1>
            <p className="mt-0.5 text-[13px] text-muted-foreground">
              Contas a receber e a pagar. Isso alimenta previsao de caixa e alertas.
            </p>
          </div>

          <Link
            to="/invoices"
            className="flex items-center gap-2 rounded-md bg-primary px-3 py-1.5 text-[13px] font-semibold text-primary-foreground hover:opacity-90 transition-opacity"
          >
            <Plus className="h-4 w-4" />
            Nova fatura
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
          <div className="metric-card">
            <p className="section-label">A receber (aberto)</p>
            <p className="mt-2 text-[22px] font-bold text-foreground tabular-nums">{formatBRLCompact(totals.rOpen)}</p>
            <p className="mt-1 text-[11px] text-muted-foreground">Base: faturas a receber</p>
          </div>
          <div className="metric-card">
            <p className="section-label">A pagar (aberto)</p>
            <p className="mt-2 text-[22px] font-bold text-foreground tabular-nums">{formatBRLCompact(totals.pOpen)}</p>
            <p className="mt-1 text-[11px] text-muted-foreground">Base: faturas a pagar</p>
          </div>
          <div className="metric-card">
            <p className="section-label">Vencidos (a receber)</p>
            <p className="mt-2 text-[22px] font-bold text-destructive tabular-nums">{formatBRLCompact(totals.rOverdue)}</p>
            <p className="mt-1 text-[11px] text-muted-foreground">Cobranca imediata</p>
          </div>
          <div className="metric-card">
            <p className="section-label">Vencidos (a pagar)</p>
            <p className="mt-2 text-[22px] font-bold text-destructive tabular-nums">{formatBRLCompact(totals.pOverdue)}</p>
            <p className="mt-1 text-[11px] text-muted-foreground">Risco de juros/multa</p>
          </div>
        </div>

        <div className="metric-card">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setTab("receivables")}
                className={`rounded-lg px-3 py-1.5 text-[13px] font-semibold transition-colors ${
                  tab === "receivables" ? "bg-foreground text-background" : "bg-secondary text-foreground hover:bg-secondary/70"
                }`}
              >
                <span className="inline-flex items-center gap-2">
                  <ArrowDownLeft className="h-4 w-4" />
                  A receber
                </span>
              </button>
              <button
                onClick={() => setTab("payables")}
                className={`rounded-lg px-3 py-1.5 text-[13px] font-semibold transition-colors ${
                  tab === "payables" ? "bg-foreground text-background" : "bg-secondary text-foreground hover:bg-secondary/70"
                }`}
              >
                <span className="inline-flex items-center gap-2">
                  <ArrowUpRight className="h-4 w-4" />
                  A pagar
                </span>
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {[
                { key: "all", label: "Tudo" },
                { key: "overdue", label: "Vencidos" },
                { key: "7d", label: "Proximos 7d" },
                { key: "30d", label: "Proximos 30d" },
              ].map((f) => (
                <button
                  key={f.key}
                  onClick={() => setFilter(f.key as FilterKey)}
                  className={`rounded-full border px-3 py-1 text-[12px] font-medium transition-colors ${
                    filter === f.key
                      ? "border-foreground bg-foreground text-background"
                      : "border-border bg-background text-foreground hover:bg-secondary/40"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4 overflow-hidden rounded-lg border border-border bg-card">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b text-left text-muted-foreground bg-muted/20">
                  <th className="p-3 font-medium">Vencimento</th>
                  <th className="p-3 font-medium">Contato</th>
                  <th className="p-3 font-medium">Descricao</th>
                  <th className="p-3 font-medium text-right">Valor</th>
                  <th className="p-3 font-medium">Status</th>
                  <th className="p-3 font-medium text-right">Acao</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="p-10 text-center text-muted-foreground">
                      <div className="inline-flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Carregando...
                      </div>
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-10 text-center text-muted-foreground">
                      Nenhum registro para este filtro.
                    </td>
                  </tr>
                ) : (
                  filtered.map((x: any) => {
                    const contact =
                      tab === "receivables"
                        ? (x.row.customers?.name as string) || "Cliente"
                        : (x.row.vendors?.name as string) || "Fornecedor";

                    const dueLabel = x.due ? format(x.due, "dd/MM") : "-";

                    const statusBadge = x.isPaid ? (
                      <Badge variant="outline" className="border-success/30 text-success bg-success/10">
                        <CheckCircle2 className="h-3 w-3 mr-1" /> Pago
                      </Badge>
                    ) : x.isOverdue ? (
                      <Badge variant="outline" className="border-destructive/30 text-destructive bg-destructive/10">
                        <Clock className="h-3 w-3 mr-1" /> Vencido ({x.daysLate}d)
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="border-warning/30 text-warning bg-warning/10">
                        <Clock className="h-3 w-3 mr-1" /> Em aberto
                      </Badge>
                    );

                    return (
                      <tr key={x.row.id} className="border-b last:border-0 hover:bg-muted/30">
                        <td className="p-3 text-muted-foreground tabular-nums">{dueLabel}</td>
                        <td className="p-3 font-medium text-foreground">{contact}</td>
                        <td className="p-3 text-muted-foreground">{x.row.description}</td>
                        <td className="p-3 text-right font-mono tabular-nums text-foreground">
                          {formatBRLNoCents(x.amount)}
                        </td>
                        <td className="p-3">{statusBadge}</td>
                        <td className="p-3 text-right">
                          {x.isOpen ? (
                            <button
                              onClick={() => onSetStatus(x.row.id, "paid")}
                              className="text-[11px] font-bold text-success hover:underline px-2"
                            >
                              Dar baixa
                            </button>
                          ) : (
                            <button
                              onClick={() => onSetStatus(x.row.id, "open")}
                              className="text-[11px] font-bold text-muted-foreground hover:underline px-2"
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
        </div>
      </div>
    </AppLayout>
  );
}

