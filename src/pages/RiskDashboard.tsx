import { AppLayout } from "@/components/layout/AppLayout";
import { Badge } from "@/components/ui/badge";
import { useCashForecast90d } from "@/hooks/use-cash-forecast-90d";
import { useCfoAlerts } from "@/hooks/use-cfo-alerts";
import { useFiscal } from "@/hooks/use-fiscal";
import { useInvoices } from "@/hooks/use-invoices";
import { useTransactions } from "@/hooks/use-transactions";
import { formatBRLCompact } from "@/lib/format";
import { differenceInCalendarDays, endOfMonth, format, parseISO, startOfDay, startOfMonth, subMonths, subDays } from "date-fns";
import { AlertTriangle, CheckCircle, Loader2, ShieldAlert, XCircle } from "lucide-react";
import { useMemo } from "react";

const OPEN_STATUSES = new Set(["open", "pending", "partial"]);
const TAX_OPEN_STATUSES = new Set(["open", "overdue"]);

type RiskLevel = "baixo" | "medio" | "alto" | "critico";

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function riskLevelFromScore(score: number): RiskLevel {
  if (score >= 80) return "baixo";
  if (score >= 60) return "medio";
  if (score >= 40) return "alto";
  return "critico";
}

function levelTone(level: RiskLevel) {
  switch (level) {
    case "baixo":
      return { cls: "text-success", badge: "border-success/30 text-success bg-success/10" };
    case "medio":
      return { cls: "text-warning", badge: "border-warning/30 text-warning bg-warning/10" };
    case "alto":
      return { cls: "text-destructive", badge: "border-destructive/30 text-destructive bg-destructive/10" };
    case "critico":
      return { cls: "text-destructive", badge: "border-destructive/30 text-destructive bg-destructive/10" };
    default:
      return { cls: "text-muted-foreground", badge: "border-border text-muted-foreground bg-muted/20" };
  }
}

export default function RiskDashboard() {
  const { alerts, isLoading: alertsLoading } = useCfoAlerts();
  const { milestones, startingCash, isLoading: forecastLoading } = useCashForecast90d();
  const { apurations, isLoading: fiscalLoading } = useFiscal();
  const { receivables, invoices } = useInvoices();
  const { transactions, monthlyExpenses, isLoading: txLoading } = useTransactions();

  const isLoading = alertsLoading || forecastLoading || fiscalLoading || receivables.isLoading || invoices.isLoading || txLoading;

  const computed = useMemo(() => {
    const now = startOfDay(new Date());

    // Liquidity
    const runwayMonths = monthlyExpenses > 0 ? startingCash / monthlyExpenses : Infinity;
    const liquidityScore =
      milestones.daysUntilNegative !== null
        ? milestones.daysUntilNegative <= 30
          ? 20
          : milestones.daysUntilNegative <= 60
            ? 40
            : 60
        : runwayMonths === Infinity
          ? 90
          : runwayMonths >= 12
            ? 100
            : runwayMonths >= 6
              ? 85
              : runwayMonths >= 3
                ? 70
                : runwayMonths >= 1
                  ? 45
                  : 20;

    // Taxes
    const openTaxes = (apurations.data || [])
      .filter((t: any) => TAX_OPEN_STATUSES.has(String(t.status || "").toLowerCase()))
      .map((t: any) => {
        const remaining = (Number(t.amount_due) || 0) - (Number(t.amount_paid) || 0);
        const due = t.due_date ? parseISO(String(t.due_date)) : null;
        return { ...t, remaining, due };
      })
      .filter((t: any) => t.remaining > 0);

    const overdueTaxes = openTaxes.filter((t: any) => t.due && t.due < now);
    const overdueTaxesTotal = overdueTaxes.reduce((s: number, t: any) => s + t.remaining, 0);
    const nextTax = openTaxes
      .filter((t: any) => t.due && t.due >= now)
      .sort((a: any, b: any) => a.due.getTime() - b.due.getTime())[0];
    const daysToTax = nextTax?.due ? differenceInCalendarDays(nextTax.due, now) : null;

    const taxesScore =
      overdueTaxesTotal > 0 ? 20 : daysToTax !== null ? (daysToTax <= 7 ? 50 : daysToTax <= 15 ? 65 : 90) : 80;

    // Receivables overdue
    const overdueReceivables = (receivables.data || [])
      .filter((r: any) => OPEN_STATUSES.has(String(r.status || "").toLowerCase()))
      .filter((r: any) => r.due_date)
      .map((r: any) => ({ ...r, due: parseISO(String(r.due_date)) }))
      .filter((r: any) => r.due < now)
      .map((r: any) => ({ ...r, daysLate: differenceInCalendarDays(now, r.due), amountNum: Number(r.amount) || 0 }))
      .sort((a: any, b: any) => b.daysLate - a.daysLate);

    const worstLate = overdueReceivables[0]?.daysLate || 0;
    const overdueReceivablesTotal = overdueReceivables.reduce((s: number, r: any) => s + r.amountNum, 0);

    const receivablesScore = worstLate >= 30 ? 30 : worstLate > 0 ? 60 : 90;

    // Margin
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

    const marginScore =
      thisMargin === null
        ? 60
        : thisMargin >= 0.2
          ? 100
          : thisMargin >= 0.1
            ? 80
            : thisMargin >= 0
              ? 60
              : thisMargin >= -0.1
                ? 40
                : 20;

    // Concentration (last 90d receivable invoices by customer)
    const inv90Start = subDays(now, 90);
    const receivableInvoices90 = (invoices.data || []).filter((i: any) => {
      const dt = i.invoice_date ? new Date(i.invoice_date) : null;
      return i.direction === "receivable" && dt && dt >= inv90Start && dt <= now;
    });

    const byCustomer: Record<string, number> = {};
    for (const inv of receivableInvoices90) {
      const name = (inv.customers?.name as string) || "Cliente";
      byCustomer[name] = (byCustomer[name] || 0) + Number(inv.total_amount || 0);
    }
    const totalInv90 = Object.values(byCustomer).reduce((s, v) => s + v, 0);
    const top = Object.entries(byCustomer).sort((a, b) => b[1] - a[1])[0] || null;
    const topShare = top && totalInv90 > 0 ? top[1] / totalInv90 : null;

    const concentrationScore =
      topShare === null ? 80 : topShare >= 0.6 ? 40 : topShare >= 0.45 ? 60 : topShare >= 0.3 ? 80 : 95;

    const factors = [
      { key: "liquidez", label: "Liquidez", score: liquidityScore, note: milestones.daysUntilNegative !== null ? `Caixa negativo em ${milestones.daysUntilNegative} dias.` : `Runway: ${runwayMonths === Infinity ? "∞" : runwayMonths.toFixed(1)} meses.` },
      { key: "impostos", label: "Impostos", score: taxesScore, note: overdueTaxesTotal > 0 ? `Impostos vencidos: ${formatBRLCompact(overdueTaxesTotal)}.` : daysToTax !== null ? `Proximo vencimento em ${daysToTax} dias.` : "Sem guias abertas." },
      { key: "inadimplencia", label: "Inadimplencia", score: receivablesScore, note: overdueReceivablesTotal > 0 ? `A receber vencido: ${formatBRLCompact(overdueReceivablesTotal)}.` : "Sem atrasos relevantes." },
      { key: "margem", label: "Margem", score: marginScore, note: thisMargin === null ? "Sem base suficiente." : `Margem do mes: ${(thisMargin * 100).toFixed(0)}%.` },
      { key: "concentracao", label: "Concentracao", score: concentrationScore, note: topShare === null ? "Sem base suficiente." : `${top?.[0]}: ${(topShare * 100).toFixed(0)}% da receita (90d).` },
    ];

    const score = Math.round(factors.reduce((s, f) => s + f.score, 0) / factors.length);
    const level = riskLevelFromScore(score);

    const events: Array<{ id: string; severity: "low" | "medium" | "high" | "critical"; title: string; description: string; date: Date }> = [];

    // Convert CFO alerts into risk events.
    for (const a of alerts) {
      if (a.severity === "positive") continue;
      events.push({
        id: `alert:${a.id}`,
        severity: a.severity === "critical" ? "critical" : a.severity === "warning" ? "high" : "medium",
        title: a.title,
        description: a.description,
        date: now,
      });
    }

    // Add concentration risk event if high.
    if (topShare !== null && top && topShare >= 0.5) {
      events.push({
        id: "concentration",
        severity: topShare >= 0.65 ? "high" : "medium",
        title: "Concentracao de receita",
        description: `${top[0]} representa ${(topShare * 100).toFixed(0)}% da receita dos ultimos 90 dias.`,
        date: now,
      });
    }

    // If no events, add a positive-ish note.
    if (events.length === 0) {
      events.push({
        id: "no-events",
        severity: "low",
        title: "Nenhum risco critico detectado",
        description: "Continue acompanhando alertas e previsao para agir cedo.",
        date: now,
      });
    }

    events.sort((a, b) => {
      const rank = (s: string) => (s === "critical" ? 0 : s === "high" ? 1 : s === "medium" ? 2 : 3);
      return rank(a.severity) - rank(b.severity);
    });

    return { score, level, factors, events, topShare, overdueReceivablesTotal, overdueTaxesTotal, runwayMonths };
  }, [alerts, apurations.data, invoices.data, milestones.daysUntilNegative, monthlyExpenses, receivables.data, startingCash, transactions]);

  const tone = levelTone(computed.level);

  return (
    <AppLayout>
      <div className="max-w-[1120px] space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[20px] font-bold text-foreground tracking-tight">Riscos</h1>
            <p className="mt-0.5 text-[13px] text-muted-foreground">
              Monitoramento de riscos financeiros com base em caixa, impostos, recebiveis e margem.
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
              <div className="metric-card flex flex-col items-center justify-center py-8 animate-slide-up">
                <p className="section-label mb-4">Score de risco</p>
                <div className="relative">
                  <svg width="120" height="120" viewBox="0 0 120 120">
                    <circle cx="60" cy="60" r="52" fill="none" stroke="hsl(var(--border))" strokeWidth="6" />
                    <circle
                      cx="60"
                      cy="60"
                      r="52"
                      fill="none"
                      stroke={
                        computed.score >= 80
                          ? "hsl(var(--success))"
                          : computed.score >= 60
                            ? "hsl(var(--warning))"
                            : "hsl(var(--destructive))"
                      }
                      strokeWidth="6"
                      strokeLinecap="round"
                      strokeDasharray={2 * Math.PI * 52}
                      strokeDashoffset={2 * Math.PI * 52 - (computed.score / 100) * 2 * Math.PI * 52}
                      transform="rotate(-90 60 60)"
                      className="transition-all duration-1000"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-[32px] font-bold text-foreground">{computed.score}</span>
                    <span className="text-[10px] text-muted-foreground">/100</span>
                  </div>
                </div>
                <p className={`mt-3 text-[13px] font-semibold capitalize ${tone.cls}`}>{computed.level}</p>
              </div>

              <div className="lg:col-span-2 metric-card animate-slide-up">
                <p className="section-label mb-4">Fatores</p>
                <div className="space-y-3">
                  {computed.factors.map((f) => (
                    <div key={f.key}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[13px] font-medium text-foreground">{f.label}</span>
                        <span className="text-[13px] font-semibold text-foreground">{f.score}/100</span>
                      </div>
                      <div className="h-2 rounded-full bg-secondary overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ${
                            f.score >= 80 ? "bg-success" : f.score >= 60 ? "bg-warning" : "bg-destructive"
                          }`}
                          style={{ width: `${clamp(f.score, 0, 100)}%` }}
                        />
                      </div>
                      <p className="mt-1 text-[11px] text-muted-foreground">{f.note}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="metric-card animate-slide-up">
              <p className="section-label mb-4">Eventos</p>
              <div className="space-y-2">
                {computed.events.map((e) => {
                  const sevCls =
                    e.severity === "critical"
                      ? "bg-destructive/10 text-destructive"
                      : e.severity === "high"
                        ? "bg-warning/10 text-warning"
                        : e.severity === "medium"
                          ? "bg-info/10 text-info"
                          : "bg-success/10 text-success";

                  const Icon =
                    e.severity === "critical"
                      ? XCircle
                      : e.severity === "high"
                        ? AlertTriangle
                        : e.severity === "medium"
                          ? ShieldAlert
                          : CheckCircle;

                  return (
                    <div key={e.id} className="flex items-start gap-3 rounded-lg border border-border/50 p-3">
                      <div className={`rounded-md p-1.5 shrink-0 ${sevCls}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-[13px] font-medium text-foreground">{e.title}</p>
                          <Badge variant="outline" className={sevCls}>
                            {e.severity}
                          </Badge>
                        </div>
                        <p className="mt-0.5 text-[12px] text-muted-foreground">{e.description}</p>
                      </div>
                      <span className="text-[11px] text-muted-foreground shrink-0">{format(e.date, "dd/MM")}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </AppLayout>
  );
}
