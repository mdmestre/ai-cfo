import { AlertTriangle, CheckCircle, Info, Loader2, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useCfoAlerts } from "@/hooks/use-cfo-alerts";

const alertStyles = {
  critical: "alert-critical",
  warning: "alert-warning",
  positive: "alert-success",
  info: "alert-info",
};

const iconColors = {
  critical: "text-destructive",
  warning: "text-warning",
  positive: "text-success",
  info: "text-info",
};

const iconMap = {
  critical: AlertTriangle,
  warning: AlertTriangle,
  positive: CheckCircle,
  info: Info,
};

export function FinancialAlerts() {
  const navigate = useNavigate();
  const { alerts, isLoading } = useCfoAlerts();

  if (isLoading) {
    return (
      <div className="metric-card animate-slide-up flex items-center justify-center py-12">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="metric-card animate-slide-up">
      <p className="text-[13px] font-medium text-muted-foreground mb-4">Alertas do CFO</p>
      <div className="space-y-2">
        {alerts.length > 0 ? (
          alerts.map((alert: any, i: number) => {
            const Icon = (iconMap as any)[alert.severity] || Info;
            return (
              <div
                key={i}
                className={`financial-alert ${(alertStyles as any)[alert.severity]} ${alert.actionUrl ? "cursor-pointer hover:bg-secondary/30 transition-colors" : ""}`}
                onClick={() => alert.actionUrl && navigate(alert.actionUrl)}
                role={alert.actionUrl ? "button" : undefined}
                tabIndex={alert.actionUrl ? 0 : undefined}
                onKeyDown={(e) => {
                  if (alert.actionUrl && (e.key === "Enter" || e.key === " ")) navigate(alert.actionUrl);
                }}
              >
                <Icon className={`h-4 w-4 shrink-0 mt-0.5 ${(iconColors as any)[alert.severity]}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-[13px] font-medium text-foreground">{alert.title}</p>
                    <span className="text-xxs text-muted-foreground ml-2 shrink-0">Hoje</span>
                  </div>
                  <p className="text-[13px] text-muted-foreground mt-0.5 leading-snug">{alert.description}</p>
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
            );
          })
        ) : (
          <p className="text-[13px] text-muted-foreground py-8 text-center">Nenhum alerta no momento.</p>
        )}
      </div>
    </div>
  );
}
