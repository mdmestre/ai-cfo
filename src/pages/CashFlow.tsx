import { AppLayout } from "@/components/layout/AppLayout";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ReferenceLine, LineChart, Line, Legend,
} from "recharts";
import { ArrowUpRight, ArrowDownRight, Calendar, Play, RotateCcw, TrendingDown, Users, DollarSign, AlertTriangle } from "lucide-react";
import { useState, useMemo } from "react";
import { Slider } from "@/components/ui/slider";

// Historical data (actual)
const historicalData = [
  { date: "Jan 1", actual: 1100000 },
  { date: "Jan 15", actual: 1150000 },
  { date: "Feb 1", actual: 1180000 },
  { date: "Feb 15", actual: 1210000 },
  { date: "Mar 1", actual: 1240000 },
  { date: "Mar 15", actual: 1205000 },
  { date: "Mar 31", actual: 1310000 },
  { date: "Apr 15", actual: 1280000 },
  { date: "Apr 30", actual: 1425000 },
  { date: "May 15", actual: 1405000 },
];

// Baseline forecast
const baselineForecast = [
  { date: "May 15", baseline: 1405000 },
  { date: "Jun 1", baseline: 1380000 },
  { date: "Jun 15", baseline: 1420000 },
  { date: "Jul 1", baseline: 1460000 },
  { date: "Jul 15", baseline: 1440000 },
  { date: "Aug 1", baseline: 1510000 },
  { date: "Aug 15", baseline: 1550000 },
];

const formatCurrency = (value: number) => `$${(value / 1000000).toFixed(2)}M`;
const formatCurrencyShort = (value: number) => {
  if (value >= 1000000) return `$${(value / 1000000).toFixed(2)}M`;
  return `$${(value / 1000).toFixed(0)}K`;
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
    name: "Revenue drops 20%",
    icon: <TrendingDown className="h-4 w-4" />,
    description: "What if we lose a major client or market downturn hits?",
    color: "hsl(0 72% 51%)",
    revenueChange: -20,
    expenseChange: 0,
  },
  {
    id: "hire-3",
    name: "Hire 3 employees",
    icon: <Users className="h-4 w-4" />,
    description: "Adding 3 engineers at $120K avg salary + benefits",
    color: "hsl(220 70% 50%)",
    revenueChange: 0,
    expenseChange: 15,
  },
  {
    id: "growth",
    name: "Revenue grows 30%",
    icon: <DollarSign className="h-4 w-4" />,
    description: "Optimistic scenario with new product launch",
    color: "hsl(160 84% 39%)",
    revenueChange: 30,
    expenseChange: 10,
  },
];

const CashFlow = () => {
  const [selectedPeriod, setSelectedPeriod] = useState("3M");
  const [activeScenarios, setActiveScenarios] = useState<string[]>([]);
  const [customRevenue, setCustomRevenue] = useState(0);
  const [customExpense, setCustomExpense] = useState(0);
  const [showCustom, setShowCustom] = useState(false);

  const toggleScenario = (id: string) => {
    setActiveScenarios((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const applyScenario = (baseline: number, index: number, revenueChange: number, expenseChange: number) => {
    const monthlyRevenue = 280000;
    const monthlyExpense = 200000;
    const adjustedRevenue = monthlyRevenue * (1 + revenueChange / 100);
    const adjustedExpense = monthlyExpense * (1 + expenseChange / 100);
    const netChange = (adjustedRevenue - adjustedExpense) - (monthlyRevenue - monthlyExpense);
    return baseline + netChange * (index * 0.5);
  };

  const chartData = useMemo(() => {
    const combined = [
      ...historicalData.map((d) => ({ date: d.date, actual: d.actual })),
      ...baselineForecast.map((d, i) => {
        const point: Record<string, any> = { date: d.date, baseline: d.baseline };

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
  }, [activeScenarios, customRevenue, customExpense, showCustom]);

  const endingCash = useMemo(() => {
    const last = baselineForecast[baselineForecast.length - 1];
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
  }, [activeScenarios, customRevenue, customExpense, showCustom]);

  const lowestProjection = Math.min(...Object.values(endingCash));
  const daysUntilCritical = lowestProjection < 500000 ? Math.round((lowestProjection / 1405000) * 90) : null;

  const resetAll = () => {
    setActiveScenarios([]);
    setCustomRevenue(0);
    setCustomExpense(0);
    setShowCustom(false);
  };

  return (
    <AppLayout>
      <div className="max-w-[1200px] space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-foreground">Cash Flow Forecast</h1>
            <p className="mt-0.5 text-[13px] text-muted-foreground">90-day predictive forecast with scenario simulations</p>
          </div>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-2 rounded-md border border-border bg-card px-3 py-1.5 text-[13px] font-medium text-foreground hover:bg-secondary transition-colors">
              <Calendar className="h-3.5 w-3.5" />
              Next 90 days
            </button>
            <button className="rounded-md bg-foreground px-3 py-1.5 text-[13px] font-medium text-background hover:opacity-90 transition-opacity">
              Export
            </button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          <div className="metric-card">
            <p className="text-[13px] font-medium text-muted-foreground">Current Balance</p>
            <p className="mt-2 text-2xl font-semibold tracking-tight text-foreground">$1.41M</p>
            <div className="mt-2 flex items-center gap-1">
              <ArrowUpRight className="h-3.5 w-3.5 text-success" />
              <span className="text-[13px] font-medium text-success">+5.6%</span>
              <span className="text-[13px] text-muted-foreground">this month</span>
            </div>
          </div>
          <div className="metric-card">
            <p className="text-[13px] font-medium text-muted-foreground">Projected (90d)</p>
            <p className="mt-2 text-2xl font-semibold tracking-tight text-foreground">{formatCurrencyShort(endingCash.baseline)}</p>
            <div className="mt-2 flex items-center gap-1">
              <ArrowUpRight className="h-3.5 w-3.5 text-success" />
              <span className="text-[13px] font-medium text-success">+10.3%</span>
              <span className="text-[13px] text-muted-foreground">baseline</span>
            </div>
          </div>
          <div className="metric-card">
            <p className="text-[13px] font-medium text-muted-foreground">Monthly Burn Rate</p>
            <p className="mt-2 text-2xl font-semibold tracking-tight text-foreground">$200K</p>
            <div className="mt-2 flex items-center gap-1">
              <ArrowDownRight className="h-3.5 w-3.5 text-destructive" />
              <span className="text-[13px] font-medium text-destructive">+3.2%</span>
              <span className="text-[13px] text-muted-foreground">vs prior</span>
            </div>
          </div>
          <div className="metric-card">
            <p className="text-[13px] font-medium text-muted-foreground">Runway</p>
            <p className="mt-2 text-2xl font-semibold tracking-tight text-foreground">7.0 months</p>
            <p className="mt-2 text-[13px] text-muted-foreground">At current burn rate</p>
          </div>
        </div>

        {/* Warning banner */}
        {daysUntilCritical && (
          <div className="flex items-center gap-3 rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3">
            <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
            <p className="text-[13px] text-destructive font-medium">
              Warning: Under the worst active scenario, cash could reach critical levels in ~{daysUntilCritical} days.
            </p>
          </div>
        )}

        {/* Forecast Chart */}
        <div className="metric-card">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-[13px] font-medium text-muted-foreground">90-Day Cash Flow Forecast</p>
              <p className="text-xxs text-muted-foreground mt-0.5">Actual → Baseline → Scenarios</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex gap-4 text-xxs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-foreground" />
                  Actual
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-0.5 w-4 rounded bg-foreground opacity-40" style={{ borderTop: '2px dashed' }} />
                  Baseline
                </span>
              </div>
              <div className="flex gap-1">
                {["1M", "3M", "6M", "1Y"].map((period) => (
                  <button
                    key={period}
                    onClick={() => setSelectedPeriod(period)}
                    className={`rounded-md px-2.5 py-1 text-xxs font-medium transition-colors ${
                      period === selectedPeriod
                        ? "bg-foreground text-background"
                        : "text-muted-foreground hover:bg-secondary"
                    }`}
                  >
                    {period}
                  </button>
                ))}
              </div>
            </div>
          </div>
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
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(0 0% 94%)" vertical={false} />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'hsl(0 0% 45%)' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'hsl(0 0% 45%)' }} tickFormatter={formatCurrency} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid hsl(0 0% 92%)', borderRadius: '8px', fontSize: '12px', boxShadow: '0 4px 12px rgb(0 0 0 / 0.08)' }}
                  formatter={(value: number, name: string) => {
                    const labels: Record<string, string> = {
                      actual: "Actual",
                      baseline: "Baseline",
                      "revenue-drop": "Revenue -20%",
                      "hire-3": "Hire 3 employees",
                      growth: "Revenue +30%",
                      custom: "Custom scenario",
                    };
                    return [`$${value.toLocaleString()}`, labels[name] || name];
                  }}
                />
                <ReferenceLine y={500000} stroke="hsl(0 72% 51%)" strokeDasharray="6 4" strokeOpacity={0.4} label={{ value: "Critical", position: "insideTopRight", fontSize: 10, fill: "hsl(0 72% 51%)" }} />
                <Area type="monotone" dataKey="actual" stroke="hsl(0 0% 9%)" strokeWidth={2} fill="url(#actualGrad)" connectNulls={false} />
                <Area type="monotone" dataKey="baseline" stroke="hsl(0 0% 9%)" strokeWidth={1.5} strokeDasharray="6 4" fill="url(#baselineGrad)" connectNulls={false} />

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
        </div>

        {/* Scenario Simulations */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Preset Scenarios */}
          <div className="metric-card">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-[15px] font-semibold text-foreground">Scenario Simulations</p>
                <p className="text-xxs text-muted-foreground mt-0.5">Toggle scenarios to see their impact on cash flow</p>
              </div>
              <button onClick={resetAll} className="flex items-center gap-1.5 text-xxs text-muted-foreground hover:text-foreground transition-colors">
                <RotateCcw className="h-3 w-3" />
                Reset
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
                            {formatCurrencyShort(projected)}
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
                <p className="text-[15px] font-semibold text-foreground">Custom Scenario</p>
                <p className="text-xxs text-muted-foreground mt-0.5">Adjust revenue and expenses to model any situation</p>
              </div>
              <button
                onClick={() => setShowCustom(!showCustom)}
                className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xxs font-medium transition-colors ${
                  showCustom ? "bg-foreground text-background" : "border border-border text-foreground hover:bg-secondary"
                }`}
              >
                <Play className="h-3 w-3" />
                {showCustom ? "Active" : "Simulate"}
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-[13px] font-medium text-foreground">Revenue Change</p>
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
                  <p className="text-[13px] font-medium text-foreground">Expense Change</p>
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

              {showCustom && (customRevenue !== 0 || customExpense !== 0) && (
                <div className="rounded-lg border border-border bg-secondary/30 p-3.5">
                  <p className="text-xxs font-medium text-muted-foreground mb-2">Projected Impact (90d)</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xxs text-muted-foreground">Ending Cash</p>
                      <p className="text-lg font-semibold text-foreground">{formatCurrencyShort(endingCash["custom"] || endingCash.baseline)}</p>
                    </div>
                    <div>
                      <p className="text-xxs text-muted-foreground">vs Baseline</p>
                      <p className={`text-lg font-semibold ${(endingCash["custom"] || endingCash.baseline) >= endingCash.baseline ? "text-success" : "text-destructive"}`}>
                        {((endingCash["custom"] || endingCash.baseline) >= endingCash.baseline ? "+" : "")}
                        {formatCurrencyShort((endingCash["custom"] || endingCash.baseline) - endingCash.baseline)}
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
            <p className="text-[15px] font-semibold text-foreground mb-4">Scenario Comparison</p>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="pb-3 text-left text-xxs font-medium text-muted-foreground">Scenario</th>
                    <th className="pb-3 text-right text-xxs font-medium text-muted-foreground">Ending Cash</th>
                    <th className="pb-3 text-right text-xxs font-medium text-muted-foreground">vs Baseline</th>
                    <th className="pb-3 text-right text-xxs font-medium text-muted-foreground">Runway</th>
                    <th className="pb-3 text-right text-xxs font-medium text-muted-foreground">Risk</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-border/50">
                    <td className="py-3 text-[13px] font-medium text-foreground">Baseline</td>
                    <td className="py-3 text-right text-[13px] tabular-nums text-foreground">{formatCurrencyShort(endingCash.baseline)}</td>
                    <td className="py-3 text-right text-[13px] text-muted-foreground">—</td>
                    <td className="py-3 text-right text-[13px] tabular-nums text-foreground">7.0 mo</td>
                    <td className="py-3 text-right">
                      <span className="rounded-full bg-success/10 px-2 py-0.5 text-xxs font-medium text-success">Low</span>
                    </td>
                  </tr>
                  {activeScenarios.map((scenarioId) => {
                    const scenario = presetScenarios.find((s) => s.id === scenarioId);
                    if (!scenario || !endingCash[scenarioId]) return null;
                    const diff = endingCash[scenarioId] - endingCash.baseline;
                    const runway = endingCash[scenarioId] / 200000;
                    const risk = runway < 4 ? "High" : runway < 6 ? "Medium" : "Low";
                    const riskColor = risk === "High" ? "text-destructive bg-destructive/10" : risk === "Medium" ? "text-accent bg-accent/10" : "text-success bg-success/10";
                    return (
                      <tr key={scenarioId} className="border-b border-border/50">
                        <td className="py-3">
                          <div className="flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: scenario.color }} />
                            <span className="text-[13px] font-medium text-foreground">{scenario.name}</span>
                          </div>
                        </td>
                        <td className="py-3 text-right text-[13px] tabular-nums text-foreground">{formatCurrencyShort(endingCash[scenarioId])}</td>
                        <td className={`py-3 text-right text-[13px] tabular-nums font-medium ${diff >= 0 ? "text-success" : "text-destructive"}`}>
                          {diff >= 0 ? "+" : ""}{formatCurrencyShort(diff)}
                        </td>
                        <td className="py-3 text-right text-[13px] tabular-nums text-foreground">{runway.toFixed(1)} mo</td>
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
                          <span className="text-[13px] font-medium text-foreground">Custom (Rev {customRevenue >= 0 ? "+" : ""}{customRevenue}%, Exp {customExpense >= 0 ? "+" : ""}{customExpense}%)</span>
                        </div>
                      </td>
                      <td className="py-3 text-right text-[13px] tabular-nums text-foreground">{formatCurrencyShort(endingCash["custom"])}</td>
                      <td className={`py-3 text-right text-[13px] tabular-nums font-medium ${(endingCash["custom"] - endingCash.baseline) >= 0 ? "text-success" : "text-destructive"}`}>
                        {(endingCash["custom"] - endingCash.baseline) >= 0 ? "+" : ""}{formatCurrencyShort(endingCash["custom"] - endingCash.baseline)}
                      </td>
                      <td className="py-3 text-right text-[13px] tabular-nums text-foreground">{(endingCash["custom"] / 200000).toFixed(1)} mo</td>
                      <td className="py-3 text-right">
                        {(() => {
                          const r = endingCash["custom"] / 200000;
                          const risk = r < 4 ? "High" : r < 6 ? "Medium" : "Low";
                          const c = risk === "High" ? "text-destructive bg-destructive/10" : risk === "Medium" ? "text-accent bg-accent/10" : "text-success bg-success/10";
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
