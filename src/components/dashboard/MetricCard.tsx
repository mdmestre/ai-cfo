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
    <div className="metric-card animate-slide-up shadow-card border-border/50 bg-white">
      <div className="flex items-start justify-between">
        <p className="text-[12px] font-semibold uppercase tracking-wider text-muted-foreground/80">{title}</p>
        {icon && (
          <div className="text-primary/60">
            {icon}
          </div>
        )}
      </div>
      <p className="mt-2 text-3xl font-bold tracking-tight text-primary">{value}</p>
      {subtitle && (
        <p className="mt-1 text-[13px] text-muted-foreground font-medium">{subtitle}</p>
      )}
      {change && (
        <div className="mt-3 flex items-center gap-1">
          {changeType === "positive" ? (
            <ArrowUpRight className="h-3.5 w-3.5 text-success" />
          ) : changeType === "negative" ? (
            <ArrowDownRight className="h-3.5 w-3.5 text-destructive" />
          ) : null}
          <span
            className={`text-[13px] font-medium ${changeType === "positive"
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
