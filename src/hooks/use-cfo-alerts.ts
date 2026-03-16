import { useMemo } from "react";
import { differenceInCalendarDays, endOfMonth, format, parseISO, startOfDay, startOfMonth, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useCashForecast90d } from "@/hooks/use-cash-forecast-90d";
import { useFiscal } from "@/hooks/use-fiscal";
import { useInvoices } from "@/hooks/use-invoices";
import { useReconciliations } from "@/hooks/use-reconciliations";
import { useTransactions } from "@/hooks/use-transactions";
import { formatBRLCompact, formatBRLNoCents } from "@/lib/format";

export type CfoAlertSeverity = "critical" | "warning" | "info" | "positive";

export type CfoAlert = {
  id: string;
  severity: CfoAlertSeverity;
  title: string;
  description: string;
  actionLabel?: string;
  actionUrl?: string;
};

const OPEN_STATUSES = new Set(["open", "pending", "partial"]);
const TAX_OPEN_STATUSES = new Set(["open", "overdue"]);

function severityRank(sev: CfoAlertSeverity) {
  switch (sev) {
    case "critical":
      return 0;
    case "warning":
      return 1;
    case "info":
      return 2;
    case "positive":
      return 3;
    default:
      return 9;
  }
}

export function useCfoAlerts() {
  const { transactions } = useTransactions();
  const { milestones, startingCash, isLoading: forecastLoading } = useCashForecast90d();
  const { receivables } = useInvoices();
  const { apurations, isLoading: fiscalLoading } = useFiscal();
  const { reconciliations } = useReconciliations();

  const isLoading = forecastLoading || receivables.isLoading || fiscalLoading || reconciliations.isLoading;

  const alerts = useMemo<CfoAlert[]>(() => {
    const now = startOfDay(new Date());
    const list: CfoAlert[] = [];

    // 1) Cash going negative
    if (milestones.daysUntilNegative !== null && milestones.daysUntilNegative <= 90) {
      list.push({
        id: "cash-negative",
        severity: milestones.daysUntilNegative <= 45 ? "critical" : "warning",
        title: `Caixa ficara negativo em ${milestones.daysUntilNegative} dias`,
        description: `Mantendo o ritmo atual, o saldo projetado em ${format(milestones.d90.date, "dd/MM", { locale: ptBR })} sera ${formatBRLNoCents(milestones.d90.balance)}.`,
        actionLabel: "Ver previsao",
        actionUrl: "/cash-flow",
      });
    }

    // 2) Overdue receivables
    const overdueReceivables = (receivables.data || [])
      .filter((r) => OPEN_STATUSES.has(String(r.status || "").toLowerCase()))
      .filter((r) => r.due_date)
      .map((r) => ({ ...r, due: parseISO(String(r.due_date)) }))
      .filter((r) => r.due < now)
      .map((r) => ({
        ...r,
        daysLate: differenceInCalendarDays(now, r.due),
        amountNum: Number(r.amount) || 0,
      }))
      .sort((a, b) => b.daysLate - a.daysLate);

    if (overdueReceivables.length > 0) {
      const worst = overdueReceivables[0];
      const name = (worst as any).customers?.name || "Cliente";
      list.push({
        id: "overdue-receivable",
        severity: worst.daysLate >= 30 ? "critical" : "warning",
        title: `${name} atrasado ha ${worst.daysLate} dias`,
        description: `Valor em aberto: ${formatBRLCompact(worst.amountNum)}. Vencimento: ${format(worst.due, "dd/MM", { locale: ptBR })}.`,
        actionLabel: "Ver contas a receber",
        actionUrl: "/invoices",
      });
    }

    // 3) Taxes due / overdue
    const openTaxes = (apurations.data || [])
      .filter((t) => TAX_OPEN_STATUSES.has(String(t.status || "").toLowerCase()))
      .map((t) => {
        const remaining = (Number(t.amount_due) || 0) - (Number(t.amount_paid) || 0);
        const due = t.due_date ? parseISO(String(t.due_date)) : null;
        return { ...t, remaining, due };
      })
      .filter((t) => t.remaining > 0);

    if (openTaxes.length > 0) {
      const overdue = openTaxes.filter((t) => t.due && t.due < now);
      const overdueTotal = overdue.reduce((s, t) => s + t.remaining, 0);
      if (overdueTotal > 0) {
        list.push({
          id: "taxes-overdue",
          severity: "critical",
          title: `Impostos vencidos: ${formatBRLCompact(overdueTotal)}`,
          description: "Existem guias em atraso. Regularize para evitar multas e bloqueios.",
          actionLabel: "Ver impostos",
          actionUrl: "/taxes",
        });
      } else {
        const next = openTaxes
          .filter((t) => t.due)
          .sort((a, b) => (a.due!.getTime() - b.due!.getTime()))[0];

        if (next?.due) {
          const days = differenceInCalendarDays(next.due, now);
          if (days <= 15) {
            const totalOpen = openTaxes.reduce((s, t) => s + t.remaining, 0);
            list.push({
              id: "taxes-soon",
              severity: days <= 7 ? "warning" : "info",
              title: `Impostos a vencer em ${days} dias: ${formatBRLCompact(totalOpen)}`,
              description: `Proximo vencimento em ${format(next.due, "dd/MM", { locale: ptBR })}.`,
              actionLabel: "Ver impostos",
              actionUrl: "/taxes",
            });
          }
        }
      }
    } else {
      list.push({
        id: "taxes-missing",
        severity: "info",
        title: "Sem impostos registrados neste mes",
        description: "Gere uma estimativa automatica para evitar surpresas no caixa.",
        actionLabel: "Gerar estimativa",
        actionUrl: "/taxes",
      });
    }

    // 4) Margin drop (this month vs last month)
    const thisStart = startOfMonth(now);
    const lastStart = startOfMonth(subMonths(now, 1));
    const lastEnd = endOfMonth(subMonths(now, 1));

    const sumRevenue = (from: Date, to: Date) =>
      transactions
        .filter((t: any) => {
          const d = new Date(t.date);
          return d >= from && d <= to && Number(t.amount) > 0;
        })
        .reduce((s: number, t: any) => s + Number(t.amount), 0);

    const sumExpenses = (from: Date, to: Date) =>
      transactions
        .filter((t: any) => {
          const d = new Date(t.date);
          return d >= from && d <= to && Number(t.amount) < 0;
        })
        .reduce((s: number, t: any) => s + Math.abs(Number(t.amount)), 0);

    const thisRev = sumRevenue(thisStart, now);
    const thisExp = sumExpenses(thisStart, now);
    const lastRev = sumRevenue(lastStart, lastEnd);
    const lastExp = sumExpenses(lastStart, lastEnd);

    const thisMargin = thisRev > 0 ? (thisRev - thisExp) / thisRev : null;
    const lastMargin = lastRev > 0 ? (lastRev - lastExp) / lastRev : null;

    if (thisMargin !== null && lastMargin !== null) {
      const drop = lastMargin - thisMargin;
      if (drop >= 0.1) {
        list.push({
          id: "margin-drop",
          severity: drop >= 0.2 ? "critical" : "warning",
          title: `Margem caiu ${(drop * 100).toFixed(0)} p.p. neste mes`,
          description: `Margem atual: ${(thisMargin * 100).toFixed(0)}%. Mes anterior: ${(lastMargin * 100).toFixed(0)}%.`,
          actionLabel: "Ver despesas",
          actionUrl: "/expenses",
        });
      }
    }

    // 5) Basic runway sanity (positive signal)
    if (
      milestones.daysUntilNegative === null &&
      startingCash > 0 &&
      milestones.d90.balance > startingCash * 0.9
    ) {
      list.push({
        id: "cash-stable",
        severity: "positive",
        title: "Caixa estavel nos proximos 90 dias",
        description: "Sua previsao indica estabilidade. Aproveite para investir em crescimento com disciplina.",
        actionLabel: "Ver previsao",
        actionUrl: "/cash-flow",
      });
    }

    // 6) Reconciliation backlog (daily engagement + auditability)
    const recByTx = new Map<string, any>();
    for (const r of reconciliations.data || []) recByTx.set(String((r as any).transaction_id), r);

    const monthTxs = transactions.filter((t: any) => {
      const d = new Date(t.date);
      return d >= thisStart && d <= now;
    });

    const pendingTxs = monthTxs.filter((t: any) => {
      const rec = recByTx.get(String(t.id));
      const status = String(rec?.status || "pending").toLowerCase();
      return status !== "reconciled";
    });

    const pendingValue = pendingTxs.reduce((s: number, t: any) => s + Math.abs(Number(t.amount) || 0), 0);
    if (pendingTxs.length >= 12 && pendingValue > 0) {
      list.push({
        id: "reconciliation-backlog",
        severity: pendingTxs.length >= 30 ? "warning" : "info",
        title: `Você tem ${pendingTxs.length} transações pendentes de conciliação`,
        description: `Valor estimado: ${formatBRLCompact(pendingValue)} neste mês. Concilie para transformar o extrato em livro auditável.`,
        actionLabel: "Conciliar agora",
        actionUrl: "/reconciliation",
      });
    }

    // 7) Possible duplicate payments (fraud / error pattern)
    const last30 = transactions
      .filter((t: any) => {
        const d = new Date(t.date);
        const days = differenceInCalendarDays(now, startOfDay(d));
        return days >= 0 && days <= 30 && Number(t.amount) < 0;
      })
      .map((t: any) => {
        const desc = String(t.description || "")
          .toLowerCase()
          .replace(/\s+/g, " ")
          .replace(/[0-9]/g, "")
          .trim()
          .slice(0, 60);
        const amt = Math.abs(Number(t.amount) || 0);
        return { ...t, _k: `${amt.toFixed(2)}|${desc}`, _amt: amt, _desc: desc };
      });

    const groups = new Map<string, any[]>();
    for (const t of last30) {
      if (!t._desc || t._amt <= 0) continue;
      const arr = groups.get(t._k) || [];
      arr.push(t);
      groups.set(t._k, arr);
    }

    const dup = Array.from(groups.values())
      .filter((g) => g.length >= 2)
      .sort((a, b) => b.reduce((s, x) => s + x._amt, 0) - a.reduce((s, x) => s + x._amt, 0))[0];

    if (dup) {
      const sample = dup[0];
      const total = dup.reduce((s, x) => s + x._amt, 0);
      list.push({
        id: "possible-duplicate-payment",
        severity: total >= 5000 ? "warning" : "info",
        title: `Possível pagamento duplicado (${dup.length}x)`,
        description: `Descrição: "${sample.description}". Total: ${formatBRLCompact(total)} nos últimos 30 dias.`,
        actionLabel: "Ver transações",
        actionUrl: "/transactions",
      });
    }

    return list.sort((a, b) => severityRank(a.severity) - severityRank(b.severity));
  }, [apurations.data, milestones, receivables.data, reconciliations.data, startingCash, transactions]);

  return { alerts, isLoading };
}
