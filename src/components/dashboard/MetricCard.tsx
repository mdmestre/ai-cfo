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
      <div className="flex items-center justify-between">
        <p className="section-label">{title}</p>
        {icon && <div className="text-muted-foreground/40">{icon}</div>}
      </div>
      <p className="mt-3 text-[28px] font-bold tracking-tight text-foreground leading-none">{value}</p>
      {subtitle && (
        <p className="mt-2 text-[12px] text-muted-foreground">{subtitle}</p>
      )}
      {change && change !== "—" && (
        <div className="mt-2.5 flex items-center gap-1">
          {changeType === "positive" ? (
            <ArrowUpRight className="h-3 w-3 text-success" />
          ) : changeType === "negative" ? (
            <ArrowDownRight className="h-3 w-3 text-destructive" />
          ) : null}
          <span
            className={`text-[12px] font-medium ${
              changeType === "positive"
                ? "text-success"
                : changeType === "negative"
                  ? "text-destructive"
                  : "text-muted-foreground"
            }`}
          >
            {change}
          </span>
        </div>
      )}
    </div>
  );
}
