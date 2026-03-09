import { AlertTriangle, CheckCircle, Info, Loader2 } from "lucide-react";
import { useInsights } from "@/hooks/use-insights";
import { useCompany } from "@/hooks/use-company";

const alertStyles = {
  warning: "alert-warning",
  success: "alert-success",
  info: "alert-info",
  risk: "alert-warning",
  insight: "alert-info"
};

const iconColors = {
  warning: "text-warning",
  success: "text-success",
  info: "text-info",
  risk: "text-warning",
  insight: "text-info"
};

const iconMap = {
  warning: AlertTriangle,
  success: CheckCircle,
  info: Info,
  risk: AlertTriangle,
  insight: Info
};

export function FinancialAlerts() {
  const { company } = useCompany();
  const { data: insightsData, isLoading } = useInsights(company?.id);

  if (isLoading) {
    return (
      <div className="metric-card animate-slide-up flex items-center justify-center py-12">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const alerts = insightsData?.insights || [];

  return (
    <div className="metric-card animate-slide-up">
      <p className="text-[13px] font-medium text-muted-foreground mb-4">Financial Intelligence Alerts</p>
      <div className="space-y-2">
        {alerts.length > 0 ? (
          alerts.map((alert: any, i: number) => {
            const Icon = (iconMap as any)[alert.type] || Info;
            return (
              <div key={i} className={`financial-alert ${(alertStyles as any)[alert.type]}`}>
                <Icon className={`h-4 w-4 shrink-0 mt-0.5 ${(iconColors as any)[alert.type]}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-[13px] font-medium text-foreground">{alert.title}</p>
                    <span className="text-xxs text-muted-foreground ml-2 shrink-0">Just now</span>
                  </div>
                  <p className="text-[13px] text-muted-foreground mt-0.5 leading-snug">{alert.description}</p>
                </div>
              </div>
            );
          })
        ) : (
          <p className="text-[13px] text-muted-foreground py-8 text-center">No active alerts at this time.</p>
        )}
      </div>
    </div>
  );
}
