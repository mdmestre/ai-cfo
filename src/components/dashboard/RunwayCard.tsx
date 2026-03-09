import { Clock, TrendingDown } from "lucide-react";

interface RunwayCardProps {
  totalCash: number;
  monthlyBurn: number;
}

const formatCurrency = (value: number) => {
  if (Math.abs(value) >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (Math.abs(value) >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
  return `$${value.toFixed(0)}`;
};

export function RunwayCard({ totalCash, monthlyBurn }: RunwayCardProps) {
  const runwayMonths = monthlyBurn > 0 ? totalCash / monthlyBurn : Infinity;
  const runwayDays = runwayMonths * 30;

  const getRunwayColor = () => {
    if (runwayMonths >= 12) return "text-success";
    if (runwayMonths >= 6) return "hsl(var(--warning))";
    return "text-destructive";
  };

  const getRunwayLabel = () => {
    if (runwayMonths === Infinity) return "No burn detected";
    if (runwayMonths >= 24) return "Very healthy runway";
    if (runwayMonths >= 12) return "Healthy runway";
    if (runwayMonths >= 6) return "Moderate — plan ahead";
    return "Critical — take action";
  };

  return (
    <div className="metric-card animate-slide-up">
      <div className="flex items-center justify-between mb-4">
        <p className="text-[12px] font-semibold uppercase tracking-wider text-muted-foreground/80">Runway Estimate</p>
        <Clock className="h-4 w-4 text-muted-foreground/60" />
      </div>
      <div className="flex items-baseline gap-2">
        <span className={`text-3xl font-bold tracking-tight ${runwayMonths === Infinity ? "text-success" : getRunwayColor()}`}>
          {runwayMonths === Infinity ? "∞" : `${Math.round(runwayMonths)}`}
        </span>
        <span className="text-[13px] text-muted-foreground font-medium">
          {runwayMonths === Infinity ? "" : "months"}
        </span>
      </div>
      <p className="mt-1 text-[12px] text-muted-foreground">{getRunwayLabel()}</p>
      {monthlyBurn > 0 && (
        <div className="mt-4 flex items-center gap-2 rounded-md bg-secondary/50 px-3 py-2">
          <TrendingDown className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-[12px] text-muted-foreground">
            Avg burn: <span className="font-semibold text-foreground">{formatCurrency(monthlyBurn)}/mo</span>
          </span>
        </div>
      )}
    </div>
  );
}
