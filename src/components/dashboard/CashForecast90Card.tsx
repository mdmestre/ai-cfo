import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AlertTriangle } from "lucide-react";
import { formatBRLCompact, formatBRLNoCents } from "@/lib/format";
import type { CashForecastMilestones, CashForecastPoint } from "@/hooks/use-cash-forecast-90d";

export function CashForecast90Card({
  points,
  milestones,
}: {
  points: CashForecastPoint[];
  milestones: CashForecastMilestones;
}) {
  const { today, d30, d60, d90, daysUntilNegative } = milestones;

  const milestoneItems = [
    { label: "Hoje", point: today },
    { label: "30 dias", point: d30 },
    { label: "60 dias", point: d60 },
    { label: "90 dias", point: d90 },
  ] as const;

  return (
    <div className="metric-card animate-slide-up">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="min-w-0">
          <p className="section-label">Previsao de Caixa (90 dias)</p>
          {daysUntilNegative !== null ? (
            <div className="mt-2 flex items-center gap-2 text-[12px] text-destructive">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span className="font-semibold">
                Alerta: caixa negativo em {daysUntilNegative} dias.
              </span>
            </div>
          ) : (
            <p className="mt-2 text-[12px] text-muted-foreground">
              Projecao automatica usando transacoes, contas a pagar/receber e impostos.
            </p>
          )}
        </div>

        <div className="text-right shrink-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground/70">
            Caixa hoje
          </p>
          <p className="mt-1 text-[18px] font-bold text-foreground tabular-nums">
            {formatBRLNoCents(today.balance)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 mb-4">
        {milestoneItems.map((m) => (
          <div key={m.label} className="rounded-lg border border-border/60 bg-secondary/20 p-3">
            <p className="text-xxs font-bold uppercase tracking-wider text-muted-foreground/70">
              {m.label}
            </p>
            <p
              className={`mt-1 text-[14px] font-bold tabular-nums ${
                m.point.balance < 0 ? "text-destructive" : "text-foreground"
              }`}
            >
              {formatBRLNoCents(m.point.balance)}
            </p>
          </div>
        ))}
      </div>

      <div className="h-[220px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={points} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="cashForecastGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(var(--foreground))" stopOpacity={0.08} />
                <stop offset="100%" stopColor="hsl(var(--foreground))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
            <XAxis
              dataKey="label"
              axisLine={false}
              tickLine={false}
              interval="preserveStartEnd"
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              tickFormatter={(v: number) => formatBRLCompact(v)}
            />
            <Tooltip formatter={(value: number) => [formatBRLNoCents(value), "Saldo"]} />
            <Area
              type="monotone"
              dataKey="balance"
              stroke="hsl(var(--foreground))"
              strokeWidth={2}
              fill="url(#cashForecastGrad)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

