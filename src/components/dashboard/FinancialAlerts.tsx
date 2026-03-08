import { AlertTriangle, CheckCircle, Info } from "lucide-react";

const alerts = [
  {
    type: "warning" as const,
    icon: AlertTriangle,
    title: "Cash runway alert",
    message: "At current burn rate, your company may run out of cash in 47 days.",
    time: "2h ago",
  },
  {
    type: "info" as const,
    icon: Info,
    title: "Unusual expense detected",
    message: "Software subscriptions increased by 34% compared to last month.",
    time: "5h ago",
  },
  {
    type: "success" as const,
    icon: CheckCircle,
    title: "Revenue milestone",
    message: "Monthly recurring revenue exceeded $400K for the first time.",
    time: "1d ago",
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
      <p className="text-[13px] font-medium text-muted-foreground mb-4">Financial Alerts</p>
      <div className="space-y-2">
        {alerts.map((alert, i) => (
          <div key={i} className={`financial-alert ${alertStyles[alert.type]}`}>
            <alert.icon className={`h-4 w-4 shrink-0 mt-0.5 ${iconColors[alert.type]}`} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <p className="text-[13px] font-medium text-foreground">{alert.title}</p>
                <span className="text-xxs text-muted-foreground ml-2 shrink-0">{alert.time}</span>
              </div>
              <p className="text-[13px] text-muted-foreground mt-0.5 leading-snug">{alert.message}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
