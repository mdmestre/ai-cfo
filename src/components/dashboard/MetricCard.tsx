import { TrendingUp, TrendingDown, DollarSign, ArrowUpRight, ArrowDownRight } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: string;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon?: React.ReactNode;
  subtitle?: string;
}

export function MetricCard({ title, value, change, changeType = "neutral", icon, subtitle }: MetricCardProps) {
  return (
    <div className="metric-card animate-slide-up">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-foreground">{value}</p>
          {subtitle && (
            <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
          )}
        </div>
        {icon && (
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
            {icon}
          </div>
        )}
      </div>
      {change && (
        <div className="mt-4 flex items-center gap-1.5">
          {changeType === "positive" ? (
            <ArrowUpRight className="h-4 w-4 text-success" />
          ) : changeType === "negative" ? (
            <ArrowDownRight className="h-4 w-4 text-destructive" />
          ) : null}
          <span
            className={
              changeType === "positive"
                ? "text-sm font-medium text-success"
                : changeType === "negative"
                ? "text-sm font-medium text-destructive"
                : "text-sm font-medium text-muted-foreground"
            }
          >
            {change}
          </span>
          <span className="text-sm text-muted-foreground">vs last month</span>
        </div>
      )}
    </div>
  );
}
