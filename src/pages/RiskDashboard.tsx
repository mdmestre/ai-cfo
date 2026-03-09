import { AppLayout } from "@/components/layout/AppLayout";
import { useRiskEngine } from "@/hooks/use-risk";
import { Loader2, Shield, AlertTriangle, RefreshCw, CheckCircle, XCircle } from "lucide-react";
import { format } from "date-fns";

const severityColors: Record<string, string> = {
  low: "bg-success/10 text-success",
  medium: "bg-warning/10 text-warning",
  high: "bg-destructive/10 text-destructive",
  critical: "bg-destructive/20 text-destructive",
};

const riskLevelColors: Record<string, string> = {
  low: "text-success",
  medium: "text-warning",
  high: "text-destructive",
  critical: "text-destructive",
};

export default function RiskDashboard() {
  const { latestScore, events, isLoading, runAnalysis } = useRiskEngine();

  const factors = latestScore?.factors as Record<string, { score: number; note: string }> | null;

  return (
    <AppLayout>
      <div className="max-w-[1120px] space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[20px] font-bold text-foreground tracking-tight">Risk Engine</h1>
            <p className="mt-0.5 text-[13px] text-muted-foreground">
              AI-powered financial risk assessment and anomaly detection.
            </p>
          </div>
          <button
            onClick={() => runAnalysis.mutate()}
            disabled={runAnalysis.isPending}
            className="flex items-center gap-2 rounded-lg bg-foreground px-4 py-2 text-[13px] font-semibold text-background hover:bg-foreground/90 transition-all disabled:opacity-50"
          >
            {runAnalysis.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Shield className="h-4 w-4" />}
            Run Assessment
          </button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            {/* Risk Score + Factors */}
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
              {/* Score */}
              <div className="metric-card flex flex-col items-center justify-center py-8 animate-slide-up">
                <p className="section-label mb-4">Risk Score</p>
                <div className="relative">
                  <svg width="120" height="120" viewBox="0 0 120 120">
                    <circle cx="60" cy="60" r="52" fill="none" stroke="hsl(var(--border))" strokeWidth="6" />
                    <circle
                      cx="60" cy="60" r="52" fill="none"
                      stroke={latestScore ? (latestScore.score >= 70 ? "hsl(var(--success))" : latestScore.score >= 40 ? "hsl(var(--warning))" : "hsl(var(--destructive))") : "hsl(var(--border))"}
                      strokeWidth="6"
                      strokeLinecap="round"
                      strokeDasharray={2 * Math.PI * 52}
                      strokeDashoffset={2 * Math.PI * 52 - ((latestScore?.score || 0) / 100) * 2 * Math.PI * 52}
                      transform="rotate(-90 60 60)"
                      className="transition-all duration-1000"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-[32px] font-bold text-foreground">{latestScore?.score || "—"}</span>
                    <span className="text-[10px] text-muted-foreground">/100</span>
                  </div>
                </div>
                {latestScore && (
                  <p className={`mt-3 text-[13px] font-semibold capitalize ${riskLevelColors[latestScore.risk_level]}`}>
                    {latestScore.risk_level} Risk
                  </p>
                )}
              </div>

              {/* Factors */}
              <div className="lg:col-span-2 metric-card animate-slide-up">
                <p className="section-label mb-4">Risk Factors</p>
                {factors ? (
                  <div className="space-y-3">
                    {Object.entries(factors).map(([key, val]) => (
                      <div key={key}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[13px] font-medium text-foreground capitalize">{key.replace(/_/g, " ")}</span>
                          <span className="text-[13px] font-semibold text-foreground">{val.score}/100</span>
                        </div>
                        <div className="h-2 rounded-full bg-secondary overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-700 ${val.score >= 70 ? "bg-success" : val.score >= 40 ? "bg-warning" : "bg-destructive"}`}
                            style={{ width: `${val.score}%` }}
                          />
                        </div>
                        <p className="mt-1 text-[11px] text-muted-foreground">{val.note}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[13px] text-muted-foreground py-8 text-center">Run an assessment to see risk factors.</p>
                )}
              </div>
            </div>

            {/* Risk Events */}
            <div className="metric-card animate-slide-up">
              <p className="section-label mb-4">Risk Events</p>
              {events.length > 0 ? (
                <div className="space-y-2">
                  {events.map((event: any) => (
                    <div key={event.id} className="flex items-start gap-3 rounded-lg border border-border/50 p-3">
                      <div className={`rounded-md p-1.5 shrink-0 ${severityColors[event.severity]}`}>
                        {event.severity === "high" || event.severity === "critical" ? (
                          <XCircle className="h-4 w-4" />
                        ) : event.severity === "medium" ? (
                          <AlertTriangle className="h-4 w-4" />
                        ) : (
                          <CheckCircle className="h-4 w-4" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-[13px] font-medium text-foreground">{event.title}</p>
                          <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium capitalize ${severityColors[event.severity]}`}>
                            {event.severity}
                          </span>
                        </div>
                        <p className="mt-0.5 text-[12px] text-muted-foreground">{event.description}</p>
                      </div>
                      <span className="text-[11px] text-muted-foreground shrink-0">{format(new Date(event.created_at), "MMM dd")}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[13px] text-muted-foreground py-8 text-center">No risk events detected. Run an assessment to analyze.</p>
              )}
            </div>
          </>
        )}
      </div>
    </AppLayout>
  );
}
