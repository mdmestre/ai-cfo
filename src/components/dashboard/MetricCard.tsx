import { ArrowUpRight, ArrowDownRight } from "lucide-react";

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
        <p className="text-[13px] font-medium text-muted-foreground">{title}</p>
        {icon && (
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-secondary">
            {icon}
          </div>
        )}
      </div>
      <p className="mt-3 text-2xl font-semibold tracking-tight text-foreground">{value}</p>
      {subtitle && (
        <p className="mt-1 text-[13px] text-muted-foreground">{subtitle}</p>
      )}
      {change && (
        <div className="mt-3 flex items-center gap-1">
          {changeType === "positive" ? (
            <ArrowUpRight className="h-3.5 w-3.5 text-success" />
          ) : changeType === "negative" ? (
            <ArrowDownRight className="h-3.5 w-3.5 text-destructive" />
          ) : null}
          <span
            className={`text-[13px] font-medium ${
              changeType === "positive"
                ? "text-success"
                : changeType === "negative"
                ? "text-destructive"
                : "text-muted-foreground"
            }`}
          >
            {change}
          </span>
          <span className="text-[13px] text-muted-foreground">vs last month</span>
        </div>
      )}
    </div>
  );
}
