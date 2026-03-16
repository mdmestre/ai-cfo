import { AppLayout } from "@/components/layout/AppLayout";
import { Slider } from "@/components/ui/slider";
import { useCashForecast90d, type CashForecastPoint } from "@/hooks/use-cash-forecast-90d";
import { useTransactions } from "@/hooks/use-transactions";
import { formatBRLCompact, formatBRLNoCents } from "@/lib/format";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AlertTriangle, RotateCcw, TrendingDown, Users, Wallet } from "lucide-react";
import { useMemo, useState } from "react";

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function inferDailyNet(points: CashForecastPoint[]) {
  const p0 = points[0];
  const p1 = points[1];
  if (!p0 || !p1) return 0;
  // balance(i) = balance(i-1) + dailyNet + inflow(i) - outflow(i)
  return p1.balance - p0.balance - p1.inflow + p1.outflow;
}

function computeScenarioPoints(args: {
  base: CashForecastPoint[];
  dailyNetBase: number;
  dailyNetDelta: number;
  oneTimeOutflow: number;
}) {
  const { base, dailyNetBase, dailyNetDelta, oneTimeOutflow } = args;
  if (base.length === 0) return [];

  let balance = base[0].balance;
  const series = base.map((p, i) => {
    if (i === 0) return { ...p, balance };
    const oneTime = i === 1 ? oneTimeOutflow : 0;
    balance = balance + dailyNetBase + dailyNetDelta + p.inflow - p.outflow - oneTime;
    return { ...p, balance };
  });

  const firstNeg = series.findIndex((p) => p.balance < 0);
  const daysUntilNegative = firstNeg === -1 ? null : firstNeg;

  return { points: series, daysUntilNegative };
}

export default function CashFlow() {
  const { points, milestones, isLoading } = useCashForecast90d();
  const { monthlyRevenue, monthlyExpenses } = useTransactions();

  const [revPct, setRevPct] = useState(0);
  const [expPct, setExpPct] = useState(0);
  const [extraMonthly, setExtraMonthly] = useState(0);
  const [oneTime, setOneTime] = useState(0);

  const dailyNetBase = useMemo(() => inferDailyNet(points), [points]);

  const dailyNetDelta = useMemo(() => {
    // Delta is relative to baseline. Convert % impacts from monthly to daily (approx).
    const revDelta = (monthlyRevenue * (revPct / 100)) / 30;
    const expDelta = (-monthlyExpenses * (expPct / 100)) / 30;
    const extraDelta = (-extraMonthly) / 30;
    return revDelta + expDelta + extraDelta;
  }, [expPct, extraMonthly, monthlyExpenses, monthlyRevenue, revPct]);

  const scenario = useMemo(() => {
    const active = revPct !== 0 || expPct !== 0 || extraMonthly !== 0 || oneTime !== 0;
    if (!active) return null;
    return computeScenarioPoints({ base: points, dailyNetBase, dailyNetDelta, oneTimeOutflow: oneTime });
  }, [dailyNetBase, dailyNetDelta, expPct, extraMonthly, oneTime, points, revPct]);

  const chartData = useMemo(() => {
    return points.map((p, i) => ({
      label: p.label,
      baseline: p.balance,
      scenario: scenario?.points?.[i]?.balance ?? null,
    }));
  }, [points, scenario?.points]);

  const baseline90 = milestones.d90?.balance ?? 0;
  const scenario90 = scenario?.points?.[90]?.balance ?? null;
  const diff90 = scenario90 === null ? null : scenario90 - baseline90;

  const preset = {
    revenueDrop20: () => {
      setRevPct(-20);
      setExpPct(0);
      setExtraMonthly(0);
      setOneTime(0);
    },
    hire2: () => {
      setRevPct(0);
      setExpPct(0);
      setExtraMonthly(14200);
      setOneTime(0);
    },
    marketing10: () => {
      setRevPct(0);
      setExpPct(0);
      setExtraMonthly(10000);
      setOneTime(0);
    },
  };

  return (
    <AppLayout>
      <div className="max-w-[1120px] space-y-6 animate-fade-in">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold text-foreground">Previsao de Caixa</h1>
            <p className="mt-0.5 text-[13px] text-muted-foreground">
              Projecao de 90 dias com base em transacoes, contas a pagar/receber e impostos.
            </p>
          </div>

          <button
            onClick={() => {
              setRevPct(0);
              setExpPct(0);
              setExtraMonthly(0);
              setOneTime(0);
            }}
            className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-[12px] font-semibold text-foreground hover:bg-secondary/40 transition-colors"
            title="Resetar simulacao"
          >
            <RotateCcw className="h-4 w-4" />
            Resetar
          </button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="inline-flex items-center gap-2 text-muted-foreground">
              <RotateCcw className="h-4 w-4 animate-spin" />
              Carregando...
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-4">
              <div className="metric-card">
                <p className="section-label">Caixa hoje</p>
                <p className="mt-2 text-[22px] font-bold text-foreground tabular-nums">
                  {formatBRLNoCents(milestones.today.balance)}
                </p>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  {milestones.daysUntilNegative === null ? "Sem previsao negativa" : `Negativo em ${milestones.daysUntilNegative} dias`}
                </p>
              </div>
              <div className="metric-card">
                <p className="section-label">30 dias</p>
                <p className={`mt-2 text-[22px] font-bold tabular-nums ${milestones.d30.balance < 0 ? "text-destructive" : "text-foreground"}`}>
                  {formatBRLNoCents(milestones.d30.balance)}
                </p>
                <p className="mt-1 text-[11px] text-muted-foreground">Saldo projetado</p>
              </div>
              <div className="metric-card">
                <p className="section-label">60 dias</p>
                <p className={`mt-2 text-[22px] font-bold tabular-nums ${milestones.d60.balance < 0 ? "text-destructive" : "text-foreground"}`}>
                  {formatBRLNoCents(milestones.d60.balance)}
                </p>
                <p className="mt-1 text-[11px] text-muted-foreground">Saldo projetado</p>
              </div>
              <div className="metric-card">
                <p className="section-label">90 dias</p>
                <p className={`mt-2 text-[22px] font-bold tabular-nums ${milestones.d90.balance < 0 ? "text-destructive" : "text-foreground"}`}>
                  {formatBRLNoCents(milestones.d90.balance)}
                </p>
                <p className="mt-1 text-[11px] text-muted-foreground">Saldo projetado</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
              <div className="lg:col-span-2 metric-card">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="min-w-0">
                    <p className="section-label">Previsao (90 dias)</p>
                    {milestones.daysUntilNegative !== null && (
                      <div className="mt-2 flex items-center gap-2 text-[12px] text-destructive">
                        <AlertTriangle className="h-4 w-4 shrink-0" />
                        <span className="font-semibold">Caixa negativo em {milestones.daysUntilNegative} dias.</span>
                      </div>
                    )}
                    {scenario?.daysUntilNegative !== null && (
                      <div className="mt-2 flex items-center gap-2 text-[12px] text-warning">
                        <AlertTriangle className="h-4 w-4 shrink-0" />
                        <span className="font-semibold">
                          No cenario: caixa negativo em {scenario?.daysUntilNegative} dias.
                        </span>
                      </div>
                    )}
                  </div>

                  {diff90 !== null && (
                    <div className="text-right shrink-0">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground/70">
                        Impacto (90d)
                      </p>
                      <p className={`mt-1 text-[16px] font-bold tabular-nums ${diff90 >= 0 ? "text-success" : "text-destructive"}`}>
                        {diff90 >= 0 ? "+" : ""}
                        {formatBRLNoCents(diff90)}
                      </p>
                    </div>
                  )}
                </div>

                <div className="h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="cashBaselineGrad" x1="0" y1="0" x2="0" y2="1">
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
                        dataKey="baseline"
                        stroke="hsl(var(--foreground))"
                        strokeWidth={2}
                        fill="url(#cashBaselineGrad)"
                        name="Baseline"
                      />
                      {scenario ? (
                        <Line
                          type="monotone"
                          dataKey="scenario"
                          stroke="hsl(var(--accent))"
                          strokeWidth={2}
                          dot={false}
                          name="Cenario"
                        />
                      ) : null}
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="metric-card">
                <p className="section-label mb-3">Simulacao</p>

                <div className="grid grid-cols-1 gap-2 mb-4">
                  <button
                    onClick={preset.revenueDrop20}
                    className="flex items-center justify-between rounded-lg border border-border bg-background px-3 py-2 text-[12px] font-semibold text-foreground hover:bg-secondary/40 transition-colors"
                  >
                    <span className="inline-flex items-center gap-2">
                      <TrendingDown className="h-4 w-4 text-muted-foreground" />
                      Receita -20%
                    </span>
                    <span className="text-muted-foreground">1 clique</span>
                  </button>
                  <button
                    onClick={preset.hire2}
                    className="flex items-center justify-between rounded-lg border border-border bg-background px-3 py-2 text-[12px] font-semibold text-foreground hover:bg-secondary/40 transition-colors"
                  >
                    <span className="inline-flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      Contratar +2
                    </span>
                    <span className="text-muted-foreground">R$ 14.200/mes</span>
                  </button>
                  <button
                    onClick={preset.marketing10}
                    className="flex items-center justify-between rounded-lg border border-border bg-background px-3 py-2 text-[12px] font-semibold text-foreground hover:bg-secondary/40 transition-colors"
                  >
                    <span className="inline-flex items-center gap-2">
                      <Wallet className="h-4 w-4 text-muted-foreground" />
                      Marketing
                    </span>
                    <span className="text-muted-foreground">R$ 10.000/mes</span>
                  </button>
                </div>

                <div className="space-y-5">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-[12px] font-semibold text-foreground">Variacao de receita</p>
                      <span className="text-[12px] font-semibold text-foreground tabular-nums">{revPct}%</span>
                    </div>
                    <Slider value={[revPct]} onValueChange={([v]) => setRevPct(v)} min={-30} max={50} step={5} />
                    <div className="mt-1.5 flex justify-between text-xxs text-muted-foreground">
                      <span>-30%</span>
                      <span>0%</span>
                      <span>+50%</span>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-[12px] font-semibold text-foreground">Variacao de despesas</p>
                      <span className="text-[12px] font-semibold text-foreground tabular-nums">{expPct}%</span>
                    </div>
                    <Slider value={[expPct]} onValueChange={([v]) => setExpPct(v)} min={-30} max={50} step={5} />
                    <div className="mt-1.5 flex justify-between text-xxs text-muted-foreground">
                      <span>-30%</span>
                      <span>0%</span>
                      <span>+50%</span>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-[12px] font-semibold text-foreground">Custo extra (R$/mes)</p>
                      <span className="text-[12px] font-semibold text-foreground tabular-nums">{formatBRLNoCents(extraMonthly)}</span>
                    </div>
                    <Slider value={[extraMonthly]} onValueChange={([v]) => setExtraMonthly(v)} min={0} max={80000} step={1000} />
                    <div className="mt-1.5 flex justify-between text-xxs text-muted-foreground">
                      <span>0</span>
                      <span>40k</span>
                      <span>80k</span>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-[12px] font-semibold text-foreground">Investimento unico (R$)</p>
                      <span className="text-[12px] font-semibold text-foreground tabular-nums">{formatBRLNoCents(oneTime)}</span>
                    </div>
                    <Slider value={[oneTime]} onValueChange={([v]) => setOneTime(v)} min={0} max={300000} step={5000} />
                    <div className="mt-1.5 flex justify-between text-xxs text-muted-foreground">
                      <span>0</span>
                      <span>150k</span>
                      <span>300k</span>
                    </div>
                  </div>

                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Simulacao e uma aproximacao. Para maior precisao, mantenha faturas (A/R e A/P) e impostos atualizados.
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </AppLayout>
  );
}

