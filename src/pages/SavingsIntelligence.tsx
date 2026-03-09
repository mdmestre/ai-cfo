import { AppLayout } from "@/components/layout/AppLayout";
import { useSavingsIntelligence } from "@/hooks/use-savings";
import { Loader2, Sparkles, TrendingDown, X, DollarSign, AlertTriangle, RefreshCw, Package, Repeat, Scissors, BadgeDollarSign } from "lucide-react";
import { format } from "date-fns";

const typeIcons: Record<string, any> = {
  duplicate_subscription: Repeat,
  unused_service: Package,
  price_optimization: TrendingDown,
  volume_discount: BadgeDollarSign,
  unnecessary_expense: Scissors,
  contract_renegotiation: AlertTriangle,
};

const typeLabels: Record<string, string> = {
  duplicate_subscription: "Duplicate",
  unused_service: "Unused Service",
  price_optimization: "Price Optimization",
  volume_discount: "Volume Discount",
  unnecessary_expense: "Unnecessary",
  contract_renegotiation: "Renegotiate",
};

const fmt = (v: number) => {
  if (Math.abs(v) >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (Math.abs(v) >= 1_000) return `$${(v / 1_000).toFixed(1)}K`;
  return `$${v.toFixed(0)}`;
};

export default function SavingsIntelligence() {
  const { activeInsights, isLoading, runAnalysis, dismissInsight, totalPotentialSavings, totalCurrentSpend } = useSavingsIntelligence();

  return (
    <AppLayout>
      <div className="max-w-[1120px] space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[20px] font-bold text-foreground tracking-tight">Savings Intelligence</h1>
            <p className="mt-0.5 text-[13px] text-muted-foreground">
              AI-powered cost optimization — detect waste, reduce spend, save money automatically.
            </p>
          </div>
          <button
            onClick={() => runAnalysis.mutate()}
            disabled={runAnalysis.isPending}
            className="flex items-center gap-2 rounded-lg bg-foreground px-4 py-2 text-[13px] font-semibold text-background hover:bg-foreground/90 transition-all disabled:opacity-50"
          >
            {runAnalysis.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            Run Analysis
          </button>
        </div>

        {/* KPI Row */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="metric-card animate-slide-up">
            <p className="section-label">Potential Savings</p>
            <p className="mt-3 text-[28px] font-bold text-success leading-none">{fmt(totalPotentialSavings)}</p>
            <p className="mt-1 text-[12px] text-muted-foreground">per month</p>
          </div>
          <div className="metric-card animate-slide-up">
            <p className="section-label">Spend Analyzed</p>
            <p className="mt-3 text-[28px] font-bold text-foreground leading-none">{fmt(totalCurrentSpend)}</p>
            <p className="mt-1 text-[12px] text-muted-foreground">across {activeInsights.length} findings</p>
          </div>
          <div className="metric-card animate-slide-up">
            <p className="section-label">Savings Rate</p>
            <p className="mt-3 text-[28px] font-bold text-foreground leading-none">
              {totalCurrentSpend > 0 ? `${((totalPotentialSavings / totalCurrentSpend) * 100).toFixed(1)}%` : "—"}
            </p>
            <p className="mt-1 text-[12px] text-muted-foreground">of analyzed spend</p>
          </div>
        </div>

        {/* Insights list */}
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : activeInsights.length > 0 ? (
          <div className="space-y-3">
            {activeInsights.map((insight: any) => {
              const Icon = typeIcons[insight.insight_type] || DollarSign;
              return (
                <div key={insight.id} className="metric-card animate-slide-up">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent/10">
                        <Icon className="h-5 w-5 text-accent" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-[14px] font-semibold text-foreground">{insight.title}</h3>
                          <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                            {typeLabels[insight.insight_type] || insight.insight_type}
                          </span>
                          <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium text-muted-foreground capitalize">
                            {insight.category}
                          </span>
                        </div>
                        <p className="text-[13px] text-muted-foreground leading-relaxed">{insight.description}</p>
                        {insight.recommendation && (
                          <div className="mt-2 rounded-lg bg-success/5 border border-success/10 px-3 py-2">
                            <p className="text-[12px] font-medium text-success">💡 {insight.recommendation}</p>
                          </div>
                        )}
                        <div className="mt-2 flex items-center gap-4 text-[12px] text-muted-foreground">
                          <span>Current: <span className="font-medium text-foreground">{fmt(Number(insight.current_spend))}/mo</span></span>
                          <span>Save: <span className="font-semibold text-success">{fmt(Number(insight.potential_savings))}/mo</span></span>
                          <span>Confidence: <span className="font-medium text-foreground">{insight.confidence}%</span></span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => dismissInsight.mutate(insight.id)}
                      className="rounded-lg p-1.5 text-muted-foreground hover:bg-secondary transition-colors shrink-0"
                      title="Dismiss"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="metric-card flex flex-col items-center justify-center py-16">
            <Sparkles className="h-8 w-8 text-muted-foreground/30 mb-3" />
            <p className="text-[14px] font-medium text-foreground">No savings insights yet</p>
            <p className="mt-1 text-[13px] text-muted-foreground">Click "Run Analysis" to let AI scan your expenses for savings opportunities.</p>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
