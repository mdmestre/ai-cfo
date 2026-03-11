import { AppLayout } from "@/components/layout/AppLayout";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ReferenceLine, Line,
} from "recharts";
import { ArrowUpRight, ArrowDownRight, Calendar, Play, RotateCcw, TrendingDown, Users, DollarSign, AlertTriangle, Loader2 } from "lucide-react";
import { useState, useMemo } from "react";
import { Slider } from "@/components/ui/slider";
import { useTransactions } from "@/hooks/use-transactions";
import { useAccounts } from "@/hooks/use-accounts";
import { useForecasts } from "@/hooks/use-forecasts";
import { useWallets } from "@/hooks/use-wallets";
import { format, subMonths, addDays } from "date-fns";

const formatCurrency = (value: number) => {
  if (Math.abs(value) >= 1_000_000) return `R$ ${(value / 1_000_000).toFixed(2)}M`;
  if (Math.abs(value) >= 1_000) return `R$ ${(value / 1_000).toFixed(0)}K`;
  return `R$ ${value.toFixed(0)}`;
};

interface Scenario {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
  color: string;
  revenueChange: number;
  expenseChange: number;
}

const presetScenarios: Scenario[] = [
  {
    id: "revenue-drop",
    name: "Receita cai 20%",
    icon: <TrendingDown className="h-4 w-4" />,
    description: "E se perdermos um grande cliente ou o mercado retrair?",
    color: "hsl(0 72% 51%)",
    revenueChange: -20,
    expenseChange: 0,
  },
  {
    id: "hire-3",
    name: "Contratar 3 funcionários",
    icon: <Users className="h-4 w-4" />,
    description: "Adição de 3 engenheiros com salário médio + encargos",
    color: "hsl(220 70% 50%)",
    revenueChange: 0,
    expenseChange: 15,
  },
  {
    id: "growth",
    name: "Receita cresce 30%",
    icon: <DollarSign className="h-4 w-4" />,
    description: "Cenário otimista com lançamento de produto",
    color: "hsl(160 84% 39%)",
    revenueChange: 30,
    expenseChange: 10,
  },
];

const CashFlow = () => {
  const { transactions, monthlyRevenue, monthlyExpenses, isLoading: txLoading } = useTransactions();
  const { totalBalance, isLoading: accLoading } = useAccounts();
  const { totalWalletBalance } = useWallets();
  const { forecasts } = useForecasts();

  const [selectedPeriod, setSelectedPeriod] = useState("3M");
  const [activeScenarios, setActiveScenarios] = useState<string[]>([]);
  const [customRevenue, setCustomRevenue] = useState(0);
  const [customExpense, setCustomExpense] = useState(0);
  const [showCustom, setShowCustom] = useState(false);

  const currentBalance = totalBalance + totalWalletBalance;
  const monthlyBurn = monthlyExpenses || 1;

  // Build historical data from real transactions (last 6 months)
  const historicalData = useMemo(() => {
    if (transactions.length === 0) return [];
    const points: { date: string; actual: number }[] = [];
    let runningBalance = currentBalance;

    // Group transactions by month, compute balance going backwards
    const months = Array.from({ length: 6 }, (_, i) => subMonths(new Date(), i));
    const monthlyNet: number[] = months.map((m) => {
      return transactions
        .filter((t) => {
          const td = new Date(t.date);
          return td.getMonth() === m.getMonth() && td.getFullYear() === m.getFullYear();
        })
        .reduce((s, t) => s + Number(t.amount), 0);
    });

    // Current month is index 0
    let bal = currentBalance;
    const balances: { date: string; balance: number }[] = [];
    for (let i = 0; i < months.length; i++) {
      balances.unshift({ date: format(months[i], "MMM yy"), balance: Math.round(bal) });
      if (i < months.length - 1) {
        bal -= monthlyNet[i]; // Remove current month net to get previous month end
      }
    }

    return balances.map((b) => ({ date: b.date, actual: b.balance }));
  }, [transactions, currentBalance]);

  // Build forecast from real forecasts or project from current data
  const baselineForecast = useMemo(() => {
    if (forecasts.length > 0) {
      return forecasts.map((f) => ({
        date: format(new Date(f.forecast_date), "MMM dd"),
        baseline: Number(f.predicted_balance),
      }));
    }
    // Generate simple projection based on current net
    const monthlyNet = monthlyRevenue - monthlyExpenses;
    return Array.from({ length: 6 }, (_, i) => {
      const d = addDays(new Date(), (i + 1) * 15);
      return {
        date: format(d, "MMM dd"),
        baseline: Math.round(currentBalance + monthlyNet * ((i + 1) * 0.5)),
      };
    });
  }, [forecasts, currentBalance, monthlyRevenue, monthlyExpenses]);

  const toggleScenario = (id: string) => {
    setActiveScenarios((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const applyScenario = (baseline: number, index: number, revenueChange: number, expenseChange: number) => {
    const rev = monthlyRevenue || 1;
    const exp = monthlyExpenses || 1;
    const adjustedRevenue = rev * (1 + revenueChange / 100);
    const adjustedExpense = exp * (1 + expenseChange / 100);
    const netChange = (adjustedRevenue - adjustedExpense) - (rev - exp);
    return Math.round(baseline + netChange * (index * 0.5));
  };

  const chartData = useMemo(() => {
    const combined = [
      ...historicalData.map((d) => ({ date: d.date, actual: d.actual })),
      ...baselineForecast.map((d, i) => {
        const point: Record<string, unknown> = { date: d.date, baseline: d.baseline };

        activeScenarios.forEach((scenarioId) => {
          const scenario = presetScenarios.find((s) => s.id === scenarioId);
          if (scenario) {
            point[scenarioId] = applyScenario(d.baseline, i, scenario.revenueChange, scenario.expenseChange);
          }
        });

        if (showCustom && (customRevenue !== 0 || customExpense !== 0)) {
          point["custom"] = applyScenario(d.baseline, i, customRevenue, customExpense);
        }

        return point;
      }),
    ];
    return combined;
  }, [historicalData, baselineForecast, activeScenarios, customRevenue, customExpense, showCustom]);

  const endingCash = useMemo(() => {
    const last = baselineForecast[baselineForecast.length - 1];
    if (!last) return { baseline: currentBalance };
    const results: Record<string, number> = { baseline: last.baseline };

    activeScenarios.forEach((scenarioId) => {
      const scenario = presetScenarios.find((s) => s.id === scenarioId);
      if (scenario) {
        results[scenarioId] = applyScenario(last.baseline, baselineForecast.length - 1, scenario.revenueChange, scenario.expenseChange);
      }
    });

    if (showCustom && (customRevenue !== 0 || customExpense !== 0)) {
      results["custom"] = applyScenario(last.baseline, baselineForecast.length - 1, customRevenue, customExpense);
    }

    return results;
  }, [baselineForecast, activeScenarios, customRevenue, customExpense, showCustom, currentBalance]);

  const runwayMonths = monthlyBurn > 0 ? currentBalance / monthlyBurn : Infinity;
  const lowestProjection = Math.min(...Object.values(endingCash));
  const criticalThreshold = monthlyBurn * 2;
  const daysUntilCritical = lowestProjection < criticalThreshold ? Math.round((lowestProjection / currentBalance) * 90) : null;

  const resetAll = () => {
    setActiveScenarios([]);
    setCustomRevenue(0);
    setCustomExpense(0);
    setShowCustom(false);
  };

  const isLoading = txLoading || accLoading;

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-[1200px] space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-foreground">Previsão de Fluxo de Caixa</h1>
            <p className="mt-0.5 text-[13px] text-muted-foreground">Projeção de 90 dias com simulações de cenário</p>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          <div className="metric-card">
            <p className="text-[13px] font-medium text-muted-foreground">Saldo Atual</p>
            <p className="mt-2 text-2xl font-semibold tracking-tight text-foreground">{formatCurrency(currentBalance)}</p>
          </div>
          <div className="metric-card">
            <p className="text-[13px] font-medium text-muted-foreground">Projetado (90d)</p>
            <p className="mt-2 text-2xl font-semibold tracking-tight text-foreground">{formatCurrency(endingCash.baseline)}</p>
            <div className="mt-2 flex items-center gap-1">
              {endingCash.baseline >= currentBalance ? (
                <ArrowUpRight className="h-3.5 w-3.5 text-success" />
              ) : (
                <ArrowDownRight className="h-3.5 w-3.5 text-destructive" />
              )}
              <span className={`text-[13px] font-medium ${endingCash.baseline >= currentBalance ? "text-success" : "text-destructive"}`}>
                {currentBalance > 0 ? `${(((endingCash.baseline - currentBalance) / currentBalance) * 100).toFixed(1)}%` : "—"}
              </span>
            </div>
          </div>
          <div className="metric-card">
            <p className="text-[13px] font-medium text-muted-foreground">Despesas Mensais</p>
            <p className="mt-2 text-2xl font-semibold tracking-tight text-foreground">{formatCurrency(monthlyExpenses)}</p>
          </div>
          <div className="metric-card">
            <p className="text-[13px] font-medium text-muted-foreground">Runway</p>
            <p className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
              {runwayMonths === Infinity ? "∞" : `${runwayMonths.toFixed(1)}`} {runwayMonths !== Infinity && "meses"}
            </p>
          </div>
        </div>

        {/* Warning banner */}
        {daysUntilCritical && daysUntilCritical > 0 && (
          <div className="flex items-center gap-3 rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3">
            <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
            <p className="text-[13px] text-destructive font-medium">
              Alerta: No pior cenário ativo, o caixa pode atingir níveis críticos em ~{daysUntilCritical} dias.
            </p>
          </div>
        )}

        {/* Forecast Chart */}
        <div className="metric-card">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-[13px] font-medium text-muted-foreground">Previsão de Fluxo de Caixa — 90 dias</p>
              <p className="text-xxs text-muted-foreground mt-0.5">Real → Baseline → Cenários</p>
            </div>
            <div className="flex gap-4 text-xxs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-foreground" />
                Real
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-0.5 w-4 rounded bg-foreground opacity-40" style={{ borderTop: '2px dashed' }} />
                Baseline
              </span>
            </div>
          </div>
          {chartData.length > 0 ? (
            <div className="h-[380px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="actualGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--foreground))" stopOpacity={0.06} />
                      <stop offset="100%" stopColor="hsl(var(--foreground))" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="baselineGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--accent))" stopOpacity={0.06} />
                      <stop offset="100%" stopColor="hsl(var(--accent))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} tickFormatter={formatCurrency} />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }}
                    formatter={(value: number, name: string) => {
                      const labels: Record<string, string> = {
                        actual: "Real",
                        baseline: "Baseline",
                        "revenue-drop": "Receita -20%",
                        "hire-3": "Contratar 3",
                        growth: "Receita +30%",
                        custom: "Cenário customizado",
                      };
                      return [formatCurrency(value), labels[name] || name];
                    }}
                  />
                  {criticalThreshold > 0 && (
                    <ReferenceLine y={criticalThreshold} stroke="hsl(var(--destructive))" strokeDasharray="6 4" strokeOpacity={0.4} />
                  )}
                  <Area type="monotone" dataKey="actual" stroke="hsl(var(--foreground))" strokeWidth={2} fill="url(#actualGrad)" connectNulls={false} />
                  <Area type="monotone" dataKey="baseline" stroke="hsl(var(--foreground))" strokeWidth={1.5} strokeDasharray="6 4" fill="url(#baselineGrad)" connectNulls={false} />

                  {activeScenarios.map((scenarioId) => {
                    const scenario = presetScenarios.find((s) => s.id === scenarioId);
                    return scenario ? (
                      <Line key={scenarioId} type="monotone" dataKey={scenarioId} stroke={scenario.color} strokeWidth={2} dot={false} connectNulls={false} />
                    ) : null;
                  })}

                  {showCustom && (customRevenue !== 0 || customExpense !== 0) && (
                    <Line type="monotone" dataKey="custom" stroke="hsl(270 70% 55%)" strokeWidth={2} strokeDasharray="4 2" dot={false} connectNulls={false} />
                  )}
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-[13px] text-muted-foreground py-12 text-center">Sem dados de transações para projetar. Conecte um banco ou adicione transações.</p>
          )}
        </div>

        {/* Scenario Simulations */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="metric-card">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-[15px] font-semibold text-foreground">Simulação de Cenários</p>
                <p className="text-xxs text-muted-foreground mt-0.5">Ative cenários para ver o impacto no fluxo de caixa</p>
              </div>
              <button onClick={resetAll} className="flex items-center gap-1.5 text-xxs text-muted-foreground hover:text-foreground transition-colors">
                <RotateCcw className="h-3 w-3" />
                Resetar
              </button>
            </div>
            <div className="space-y-3">
              {presetScenarios.map((scenario) => {
                const isActive = activeScenarios.includes(scenario.id);
                const projected = endingCash[scenario.id];
                return (
                  <button
                    key={scenario.id}
                    onClick={() => toggleScenario(scenario.id)}
                    className={`w-full rounded-lg border p-3.5 text-left transition-all ${
                      isActive
                        ? "border-foreground/20 bg-secondary/50"
                        : "border-border hover:border-foreground/10 hover:bg-secondary/30"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div
                          className="mt-0.5 flex h-7 w-7 items-center justify-center rounded-md"
                          style={{ backgroundColor: `${scenario.color}15`, color: scenario.color }}
                        >
                          {scenario.icon}
                        </div>
                        <div>
                          <p className="text-[13px] font-medium text-foreground">{scenario.name}</p>
                          <p className="text-xxs text-muted-foreground mt-0.5">{scenario.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {isActive && projected && (
                          <span className="text-xxs font-medium" style={{ color: scenario.color }}>
                            {formatCurrency(projected)}
                          </span>
                        )}
                        <div className={`h-4 w-4 rounded-full border-2 transition-colors ${
                          isActive ? "border-foreground bg-foreground" : "border-border"
                        }`}>
                          {isActive && (
                            <svg viewBox="0 0 16 16" fill="none" className="h-full w-full">
                              <path d="M5 8l2 2 4-4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Scenario Builder */}
          <div className="metric-card">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-[15px] font-semibold text-foreground">Cenário Customizado</p>
                <p className="text-xxs text-muted-foreground mt-0.5">Ajuste receita e despesas para modelar qualquer situação</p>
              </div>
              <button
                onClick={() => setShowCustom(!showCustom)}
                className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xxs font-medium transition-colors ${
                  showCustom ? "bg-foreground text-background" : "border border-border text-foreground hover:bg-secondary"
                }`}
              >
                <Play className="h-3 w-3" />
                {showCustom ? "Ativo" : "Simular"}
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-[13px] font-medium text-foreground">Variação de Receita</p>
                  <span className={`text-[13px] font-semibold tabular-nums ${customRevenue >= 0 ? "text-success" : "text-destructive"}`}>
                    {customRevenue >= 0 ? "+" : ""}{customRevenue}%
                  </span>
                </div>
                <Slider
                  value={[customRevenue]}
                  onValueChange={([val]) => setCustomRevenue(val)}
                  min={-50}
                  max={50}
                  step={5}
                  className="w-full"
                />
                <div className="mt-1.5 flex justify-between text-xxs text-muted-foreground">
                  <span>-50%</span>
                  <span>0%</span>
                  <span>+50%</span>
                </div>
              </div>

              <div>
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-[13px] font-medium text-foreground">Variação de Despesas</p>
                  <span className={`text-[13px] font-semibold tabular-nums ${customExpense <= 0 ? "text-success" : "text-destructive"}`}>
                    {customExpense >= 0 ? "+" : ""}{customExpense}%
                  </span>
                </div>
                <Slider
                  value={[customExpense]}
                  onValueChange={([val]) => setCustomExpense(val)}
                  min={-30}
                  max={50}
                  step={5}
                  className="w-full"
                />
                <div className="mt-1.5 flex justify-between text-xxs text-muted-foreground">
                  <span>-30%</span>
                  <span>0%</span>
                  <span>+50%</span>
                </div>
              </div>

              {showCustom && (customRevenue !== 0 || customExpense !== 0) && endingCash["custom"] && (
                <div className="rounded-lg border border-border bg-secondary/30 p-3.5">
                  <p className="text-xxs font-medium text-muted-foreground mb-2">Impacto Projetado (90d)</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xxs text-muted-foreground">Caixa Final</p>
                      <p className="text-lg font-semibold text-foreground">{formatCurrency(endingCash["custom"])}</p>
                    </div>
                    <div>
                      <p className="text-xxs text-muted-foreground">vs Baseline</p>
                      <p className={`text-lg font-semibold ${endingCash["custom"] >= endingCash.baseline ? "text-success" : "text-destructive"}`}>
                        {endingCash["custom"] >= endingCash.baseline ? "+" : ""}
                        {formatCurrency(endingCash["custom"] - endingCash.baseline)}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Scenario Comparison Table */}
        {(activeScenarios.length > 0 || (showCustom && (customRevenue !== 0 || customExpense !== 0))) && (
          <div className="metric-card">
            <p className="text-[15px] font-semibold text-foreground mb-4">Comparação de Cenários</p>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="pb-3 text-left text-xxs font-medium text-muted-foreground">Cenário</th>
                    <th className="pb-3 text-right text-xxs font-medium text-muted-foreground">Caixa Final</th>
                    <th className="pb-3 text-right text-xxs font-medium text-muted-foreground">vs Baseline</th>
                    <th className="pb-3 text-right text-xxs font-medium text-muted-foreground">Runway</th>
                    <th className="pb-3 text-right text-xxs font-medium text-muted-foreground">Risco</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-border/50">
                    <td className="py-3 text-[13px] font-medium text-foreground">Baseline</td>
                    <td className="py-3 text-right text-[13px] tabular-nums text-foreground">{formatCurrency(endingCash.baseline)}</td>
                    <td className="py-3 text-right text-[13px] text-muted-foreground">—</td>
                    <td className="py-3 text-right text-[13px] tabular-nums text-foreground">{runwayMonths === Infinity ? "∞" : `${runwayMonths.toFixed(1)} m`}</td>
                    <td className="py-3 text-right">
                      <span className="rounded-full bg-success/10 px-2 py-0.5 text-xxs font-medium text-success">Baixo</span>
                    </td>
                  </tr>
                  {activeScenarios.map((scenarioId) => {
                    const scenario = presetScenarios.find((s) => s.id === scenarioId);
                    if (!scenario || !endingCash[scenarioId]) return null;
                    const diff = endingCash[scenarioId] - endingCash.baseline;
                    const runway = monthlyBurn > 0 ? endingCash[scenarioId] / monthlyBurn : Infinity;
                    const risk = runway < 4 ? "Alto" : runway < 6 ? "Médio" : "Baixo";
                    const riskColor = risk === "Alto" ? "text-destructive bg-destructive/10" : risk === "Médio" ? "text-warning bg-warning/10" : "text-success bg-success/10";
                    return (
                      <tr key={scenarioId} className="border-b border-border/50">
                        <td className="py-3">
                          <div className="flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: scenario.color }} />
                            <span className="text-[13px] font-medium text-foreground">{scenario.name}</span>
                          </div>
                        </td>
                        <td className="py-3 text-right text-[13px] tabular-nums text-foreground">{formatCurrency(endingCash[scenarioId])}</td>
                        <td className={`py-3 text-right text-[13px] tabular-nums font-medium ${diff >= 0 ? "text-success" : "text-destructive"}`}>
                          {diff >= 0 ? "+" : ""}{formatCurrency(diff)}
                        </td>
                        <td className="py-3 text-right text-[13px] tabular-nums text-foreground">{runway === Infinity ? "∞" : `${runway.toFixed(1)} m`}</td>
                        <td className="py-3 text-right">
                          <span className={`rounded-full px-2 py-0.5 text-xxs font-medium ${riskColor}`}>{risk}</span>
                        </td>
                      </tr>
                    );
                  })}
                  {showCustom && (customRevenue !== 0 || customExpense !== 0) && endingCash["custom"] && (
                    <tr className="border-b border-border/50">
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: "hsl(270 70% 55%)" }} />
                          <span className="text-[13px] font-medium text-foreground">Custom (Rec {customRevenue >= 0 ? "+" : ""}{customRevenue}%, Desp {customExpense >= 0 ? "+" : ""}{customExpense}%)</span>
                        </div>
                      </td>
                      <td className="py-3 text-right text-[13px] tabular-nums text-foreground">{formatCurrency(endingCash["custom"])}</td>
                      <td className={`py-3 text-right text-[13px] tabular-nums font-medium ${(endingCash["custom"] - endingCash.baseline) >= 0 ? "text-success" : "text-destructive"}`}>
                        {(endingCash["custom"] - endingCash.baseline) >= 0 ? "+" : ""}{formatCurrency(endingCash["custom"] - endingCash.baseline)}
                      </td>
                      <td className="py-3 text-right text-[13px] tabular-nums text-foreground">{monthlyBurn > 0 ? `${(endingCash["custom"] / monthlyBurn).toFixed(1)} m` : "∞"}</td>
                      <td className="py-3 text-right">
                        {(() => {
                          const r = monthlyBurn > 0 ? endingCash["custom"] / monthlyBurn : Infinity;
                          const risk = r < 4 ? "Alto" : r < 6 ? "Médio" : "Baixo";
                          const c = risk === "Alto" ? "text-destructive bg-destructive/10" : risk === "Médio" ? "text-warning bg-warning/10" : "text-success bg-success/10";
                          return <span className={`rounded-full px-2 py-0.5 text-xxs font-medium ${c}`}>{risk}</span>;
                        })()}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default CashFlow;
