import { AlertTriangle, TrendingDown, CheckCircle, Info } from "lucide-react";

const alerts = [
  {
    type: "warning" as const,
    icon: AlertTriangle,
    title: "Cash runway alert",
    message: "At current burn rate, your company may run out of cash in 47 days.",
    time: "2 hours ago",
  },
  {
    type: "info" as const,
    icon: Info,
    title: "Unusual expense detected",
    message: "Software subscriptions increased by 34% compared to last month.",
    time: "5 hours ago",
  },
  {
    type: "success" as const,
    icon: CheckCircle,
    title: "Revenue milestone",
    message: "Monthly recurring revenue exceeded $400K for the first time.",
    time: "1 day ago",
  },
];

const alertStyles = {
  warning: "alert-warning",
  success: "alert-success",
  info: "alert-info",
};

const iconColors = {
  warning: "text-warning",
  success: "text-success",
  info: "text-info",
};

export function FinancialAlerts() {
  return (
    <div className="metric-card animate-slide-up">
      <p className="text-sm font-medium text-muted-foreground mb-4">Financial Alerts</p>
      <div className="space-y-3">
        {alerts.map((alert, i) => (
          <div key={i} className={`financial-alert ${alertStyles[alert.type]}`}>
            <alert.icon className={`h-5 w-5 shrink-0 mt-0.5 ${iconColors[alert.type]}`} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">{alert.title}</p>
              <p className="text-sm text-muted-foreground mt-0.5">{alert.message}</p>
              <p className="text-xs text-muted-foreground mt-1">{alert.time}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
