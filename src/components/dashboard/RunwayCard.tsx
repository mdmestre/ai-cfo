import { Clock, TrendingDown } from "lucide-react";
import { formatBRLCompact } from "@/lib/format";

interface RunwayCardProps {
  totalCash: number;
  monthlyBurn: number;
}

export function RunwayCard({ totalCash, monthlyBurn }: RunwayCardProps) {
  const runwayMonths = monthlyBurn > 0 ? totalCash / monthlyBurn : Infinity;

  const getRunwayColor = () => {
    if (runwayMonths >= 12) return "text-success";
    if (runwayMonths >= 6) return "text-warning";
    return "text-destructive";
  };

  const getRunwayLabel = () => {
    if (runwayMonths === Infinity) return "Sem queima de caixa detectada";
    if (runwayMonths >= 24) return "Runway muito saudavel";
    if (runwayMonths >= 12) return "Runway saudavel";
    if (runwayMonths >= 6) return "Runway moderado - planeje";
    return "Runway critico - aja agora";
  };

  return (
    <div className="metric-card animate-slide-up">
      <div className="flex items-center justify-between mb-4">
        <p className="text-[12px] font-semibold uppercase tracking-wider text-muted-foreground/80">Estimativa de Runway</p>
        <Clock className="h-4 w-4 text-muted-foreground/60" />
      </div>
      <div className="flex items-baseline gap-2">
        <span className={`text-3xl font-bold tracking-tight ${runwayMonths === Infinity ? "text-success" : getRunwayColor()}`}>
          {runwayMonths === Infinity ? "Ilimitado" : `${Math.round(runwayMonths)}`}
        </span>
        <span className="text-[13px] text-muted-foreground font-medium">
          {runwayMonths === Infinity ? "" : "meses"}
        </span>
      </div>
      <p className="mt-1 text-[12px] text-muted-foreground">{getRunwayLabel()}</p>
      {monthlyBurn > 0 && (
        <div className="mt-4 flex items-center gap-2 rounded-md bg-secondary/50 px-3 py-2">
          <TrendingDown className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-[12px] text-muted-foreground">
            Queima media: <span className="font-semibold text-foreground">{formatBRLCompact(monthlyBurn)}/mes</span>
          </span>
        </div>
      )}
    </div>
  );
}
