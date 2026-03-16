import { AppLayout } from "@/components/layout/AppLayout";
import { useCfoAlerts, type CfoAlertSeverity } from "@/hooks/use-cfo-alerts";
import { AlertTriangle, CheckCircle, Info, Loader2, Sparkles, ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

const severityUi: Record<
  CfoAlertSeverity,
  { label: string; icon: any; color: string; bg: string; border: string }
> = {
  critical: {
    label: "Critico",
    icon: AlertTriangle,
    color: "text-destructive",
    bg: "bg-destructive/5",
    border: "border-destructive/15",
  },
  warning: {
    label: "Aviso",
    icon: AlertTriangle,
    color: "text-warning",
    bg: "bg-warning/5",
    border: "border-warning/15",
  },
  info: {
    label: "Info",
    icon: Info,
    color: "text-info",
    bg: "bg-info/5",
    border: "border-info/15",
  },
  positive: {
    label: "Positivo",
    icon: CheckCircle,
    color: "text-success",
    bg: "bg-success/5",
    border: "border-success/15",
  },
};

export default function Insights() {
  const navigate = useNavigate();
  const { alerts, isLoading } = useCfoAlerts();
  const [filter, setFilter] = useState<"all" | CfoAlertSeverity>("all");

  const filtered = useMemo(() => {
    if (filter === "all") return alerts;
    return alerts.filter((a) => a.severity === filter);
  }, [alerts, filter]);

  return (
    <AppLayout>
      <div className="max-w-[1120px] space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-accent" />
              <h1 className="text-xl font-semibold text-foreground">Alertas</h1>
            </div>
            <p className="mt-0.5 text-[13px] text-muted-foreground">
              Sinais automaticos do seu caixa, impostos e recebiveis. Aqui voce ve o que precisa de acao.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {(
            [
              { key: "all" as const, label: "Todos" },
              { key: "critical" as const, label: "Critico" },
              { key: "warning" as const, label: "Aviso" },
              { key: "info" as const, label: "Info" },
              { key: "positive" as const, label: "Positivo" },
            ] as const
          ).map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={cn(
                "rounded-md px-2.5 py-1 text-xxs font-medium transition-colors",
                filter === f.key ? "bg-foreground text-background" : "text-muted-foreground hover:bg-secondary"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : filtered.length > 0 ? (
          <div className="space-y-2">
            {filtered.map((alert) => {
              const ui = severityUi[alert.severity];
              const Icon = ui.icon;
              return (
                <div
                  key={alert.id}
                  className={cn("rounded-lg border p-4 transition-colors", ui.border, ui.bg, alert.actionUrl && "cursor-pointer hover:bg-secondary/30")}
                  onClick={() => alert.actionUrl && navigate(alert.actionUrl)}
                  role={alert.actionUrl ? "button" : undefined}
                  tabIndex={alert.actionUrl ? 0 : undefined}
                  onKeyDown={(e) => {
                    if (alert.actionUrl && (e.key === "Enter" || e.key === " ")) navigate(alert.actionUrl);
                  }}
                >
                  <div className="flex items-start gap-3">
                    <Icon className={cn("h-4 w-4 shrink-0 mt-0.5", ui.color)} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-[13px] font-medium text-foreground">{alert.title}</p>
                          <p className="text-[13px] text-muted-foreground mt-0.5 leading-snug">{alert.description}</p>
                        </div>
                        <span className={cn("rounded-full px-2 py-0.5 text-xxs font-bold uppercase tracking-widest", ui.bg, ui.color)}>
                          {ui.label}
                        </span>
                      </div>
                      {alert.actionLabel && (
                        <button
                          type="button"
                          className="mt-2 inline-flex items-center gap-1 text-xxs font-semibold text-primary hover:underline"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (alert.actionUrl) navigate(alert.actionUrl);
                          }}
                        >
                          {alert.actionLabel} <ChevronRight className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="metric-card flex flex-col items-center justify-center py-16">
            <Sparkles className="h-8 w-8 text-muted-foreground/30 mb-3" />
            <p className="text-[14px] font-medium text-foreground">Nenhum alerta agora</p>
            <p className="mt-1 text-[13px] text-muted-foreground text-center">
              Continue sincronizando bancos e registrando faturas para deixar a previsao mais precisa.
            </p>
          </div>
        )}
      </div>
    </AppLayout>
  );
}

