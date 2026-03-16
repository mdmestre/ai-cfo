import { AppLayout } from "@/components/layout/AppLayout";
import { Badge } from "@/components/ui/badge";
import { useSavingsOpportunities } from "@/hooks/use-savings-opportunities";
import { formatBRLCompact, formatBRLNoCents } from "@/lib/format";
import { ArrowRight, Loader2, Repeat, Sparkles, Tag, TrendingDown } from "lucide-react";
import { Link } from "react-router-dom";

const typeMeta: Record<
  string,
  { label: string; Icon: typeof Repeat; tone: "success" | "warning" | "info" }
> = {
  recurring_expense: { label: "Recorrente", Icon: Repeat, tone: "warning" },
  category_spike: { label: "Aumento", Icon: TrendingDown, tone: "warning" },
  uncategorized: { label: "Higiene", Icon: Tag, tone: "info" },
};

export default function SavingsIntelligence() {
  const { opportunities, totals, isLoading } = useSavingsOpportunities();

  return (
    <AppLayout>
      <div className="max-w-[1120px] space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[20px] font-bold text-foreground tracking-tight">Economias</h1>
            <p className="mt-0.5 text-[13px] text-muted-foreground">
              Oportunidades praticas de reduzir custos e melhorar margem.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="metric-card animate-slide-up">
            <p className="section-label">Economia potencial (mes)</p>
            <p className="mt-3 text-[28px] font-bold text-success leading-none">
              {formatBRLCompact(totals.potentialSavingsMonthly)}
            </p>
            <p className="mt-1 text-[12px] text-muted-foreground">Heuristica baseada nos seus dados</p>
          </div>
          <div className="metric-card animate-slide-up">
            <p className="section-label">Gastos analisados (mes)</p>
            <p className="mt-3 text-[28px] font-bold text-foreground leading-none">
              {formatBRLCompact(totals.analyzedSpendMonthly)}
            </p>
            <p className="mt-1 text-[12px] text-muted-foreground">Foco em despesas recorrentes</p>
          </div>
          <div className="metric-card animate-slide-up">
            <p className="section-label">Oportunidades</p>
            <p className="mt-3 text-[28px] font-bold text-foreground leading-none">{opportunities.length}</p>
            <p className="mt-1 text-[12px] text-muted-foreground">Nos ultimos 90 dias</p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : opportunities.length === 0 ? (
          <div className="metric-card flex flex-col items-center justify-center py-16 text-center">
            <Sparkles className="h-8 w-8 text-muted-foreground/30 mb-3" />
            <p className="text-[14px] font-medium text-foreground">Sem oportunidades ainda</p>
            <p className="mt-1 text-[13px] text-muted-foreground max-w-[520px]">
              Conecte seus bancos e categorize transacoes para o sistema detectar despesas recorrentes e aumentos.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {opportunities.map((o) => {
              const meta = typeMeta[o.type] || { label: o.type, Icon: Sparkles, tone: "info" as const };
              const badgeClass =
                meta.tone === "success"
                  ? "border-success/30 text-success bg-success/10"
                  : meta.tone === "warning"
                    ? "border-warning/30 text-warning bg-warning/10"
                    : "border-info/30 text-info bg-info/10";

              return (
                <div key={o.id} className="metric-card animate-slide-up">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1 min-w-0">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent/10">
                        <meta.Icon className="h-5 w-5 text-accent" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h3 className="text-[14px] font-semibold text-foreground">{o.title}</h3>
                          <Badge variant="outline" className={badgeClass}>
                            {meta.label}
                          </Badge>
                          <span className="text-[11px] text-muted-foreground">
                            Confianca: <span className="font-semibold text-foreground">{o.confidence}%</span>
                          </span>
                        </div>
                        <p className="text-[13px] text-muted-foreground leading-relaxed">{o.description}</p>
                        {o.potentialSavingsMonthly > 0 && (
                          <div className="mt-2 flex items-center gap-3 text-[12px]">
                            <span className="text-muted-foreground">
                              Economia potencial:
                              <span className="ml-1 font-semibold text-success">
                                {formatBRLNoCents(o.potentialSavingsMonthly)}/mes
                              </span>
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {o.actionUrl ? (
                      <Link
                        to={o.actionUrl}
                        className="rounded-lg border border-border bg-background px-3 py-2 text-[12px] font-semibold text-foreground hover:bg-secondary transition-colors shrink-0 inline-flex items-center gap-2"
                      >
                        {o.actionLabel || "Abrir"}
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}

