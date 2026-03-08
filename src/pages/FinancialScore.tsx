import { AppLayout } from "@/components/layout/AppLayout";
import { CheckCircle, AlertTriangle, TrendingUp, TrendingDown, ArrowRight, Info } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";

const overallScore = 78;

const factors = [
  {
    name: "Cash Flow Stability",
    score: 82,
    weight: 25,
    status: "good" as const,
    detail: "Consistent positive cash flow over the last 6 months",
    trend: "+3",
    subMetrics: [
      { label: "Monthly variance", value: "Low", good: true },
      { label: "Cash runway", value: "7.3 months", good: true },
      { label: "Operating cash flow", value: "+$170K/mo", good: true },
    ],
  },
  {
    name: "Revenue Predictability",
    score: 74,
    weight: 20,
    status: "good" as const,
    detail: "MRR growing steadily with low churn rate",
    trend: "+5",
    subMetrics: [
      { label: "MRR growth", value: "8.2%", good: true },
      { label: "Churn rate", value: "2.1%", good: true },
      { label: "Revenue variance", value: "Moderate", good: false },
    ],
  },
  {
    name: "Expense Ratio",
    score: 88,
    weight: 20,
    status: "good" as const,
    detail: "Operating expenses at 64% of revenue — within healthy range",
    trend: "+1",
    subMetrics: [
      { label: "OpEx ratio", value: "64%", good: true },
      { label: "Burn efficiency", value: "High", good: true },
      { label: "Cost trend", value: "+3.1%/mo", good: false },
    ],
  },
  {
    name: "Debt Exposure",
    score: 92,
    weight: 15,
    status: "good" as const,
    detail: "Minimal debt with healthy debt-to-equity ratio",
    trend: "0",
    subMetrics: [
      { label: "Debt-to-equity", value: "0.12", good: true },
      { label: "Interest coverage", value: "18x", good: true },
      { label: "Credit utilization", value: "8%", good: true },
    ],
  },
  {
    name: "Customer Concentration",
    score: 54,
    weight: 20,
    status: "warning" as const,
    detail: "Top client represents 38% of total revenue — high risk",
    trend: "-2",
    subMetrics: [
      { label: "Top client share", value: "38%", good: false },
      { label: "Top 3 clients", value: "61%", good: false },
      { label: "Client count", value: "24", good: true },
    ],
  },
];

const historyData = [
  { month: "Oct", score: 71 },
  { month: "Nov", score: 73 },
  { month: "Dec", score: 70 },
  { month: "Jan", score: 74 },
  { month: "Feb", score: 76 },
  { month: "Mar", score: 78 },
];

const recommendations = [
  { text: "Diversify client base — reduce top client dependency below 25%", priority: "High" },
  { text: "Build 3-month cash reserve to improve stability score", priority: "Medium" },
  { text: "Negotiate annual contracts to improve revenue predictability", priority: "Medium" },
];

const FinancialScore = () => {
  const circumference = 2 * Math.PI * 76;
  const progress = (overallScore / 100) * circumference;

  const getScoreColor = (s: number) => {
    if (s >= 75) return "text-success";
    if (s >= 50) return "text-warning";
    return "text-destructive";
  };

  const getBarColor = (s: number) => {
    if (s >= 75) return "hsl(152 69% 41%)";
    if (s >= 50) return "hsl(38 92% 50%)";
    return "hsl(0 72% 51%)";
  };

  return (
    <AppLayout>
      <div className="max-w-[1200px] space-y-6">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Financial Health Score</h1>
          <p className="mt-0.5 text-[13px] text-muted-foreground">
            Comprehensive assessment based on cash stability, expense ratio, revenue predictability, and more
          </p>
        </div>

        {/* Score hero + history */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="metric-card flex flex-col items-center py-8">
            <div className="relative">
              <svg width="170" height="170" viewBox="0 0 164 164">
                <circle cx="82" cy="82" r="76" fill="none" stroke="hsl(0 0% 94%)" strokeWidth="6" />
                <circle
                  cx="82" cy="82" r="76" fill="none"
                  stroke="hsl(152 69% 41%)"
                  strokeWidth="6" strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={circumference - progress}
                  transform="rotate(-90 82 82)"
                  className="transition-all duration-1000 ease-out"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-bold text-foreground">{overallScore}</span>
                <span className="text-[13px] text-muted-foreground mt-0.5">out of 100</span>
              </div>
            </div>
            <p className="mt-3 text-sm font-semibold text-success">Good Financial Health</p>
            <div className="mt-1 flex items-center gap-1">
              <TrendingUp className="h-3 w-3 text-success" />
              <span className="text-xxs text-success font-medium">+4 pts from last month</span>
            </div>
          </div>

          {/* Score history */}
          <div className="metric-card lg:col-span-2">
            <p className="text-[13px] font-medium text-muted-foreground mb-4">Score History (6 months)</p>
            <div className="h-[180px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={historyData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'hsl(0 0% 45%)' }} />
                  <YAxis domain={[50, 100]} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'hsl(0 0% 45%)' }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#fff', border: '1px solid hsl(0 0% 92%)', borderRadius: '8px', fontSize: '12px', boxShadow: '0 4px 12px rgb(0 0 0 / 0.08)' }}
                  />
                  <Bar dataKey="score" radius={[3, 3, 0, 0]} fill="hsl(0 0% 9%)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Factor breakdown */}
        <div>
          <h2 className="text-sm font-semibold text-foreground mb-3">Score Breakdown</h2>
          <div className="space-y-2">
            {factors.map((factor) => (
              <div key={factor.name} className="metric-card !py-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start gap-3">
                    {factor.status === "good" ? (
                      <CheckCircle className="h-4 w-4 text-success mt-0.5" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-warning mt-0.5" />
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-[13px] font-medium text-foreground">{factor.name}</p>
                        <span className="text-xxs text-muted-foreground">Weight: {factor.weight}%</span>
                      </div>
                      <p className="text-xxs text-muted-foreground mt-0.5">{factor.detail}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                      {Number(factor.trend) > 0 ? (
                        <TrendingUp className="h-3 w-3 text-success" />
                      ) : Number(factor.trend) < 0 ? (
                        <TrendingDown className="h-3 w-3 text-destructive" />
                      ) : (
                        <span className="h-3 w-3" />
                      )}
                      <span className={`text-xxs font-medium ${Number(factor.trend) > 0 ? "text-success" : Number(factor.trend) < 0 ? "text-destructive" : "text-muted-foreground"}`}>
                        {Number(factor.trend) > 0 ? `+${factor.trend}` : factor.trend}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-20 rounded-full bg-secondary overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{ width: `${factor.score}%`, backgroundColor: getBarColor(factor.score) }}
                        />
                      </div>
                      <span className={`text-[13px] font-semibold w-7 text-right ${getScoreColor(factor.score)}`}>{factor.score}</span>
                    </div>
                  </div>
                </div>

                {/* Sub-metrics */}
                <div className="ml-7 flex gap-4">
                  {factor.subMetrics.map((sub) => (
                    <div key={sub.label} className="flex items-center gap-1.5">
                      <span className={`h-1.5 w-1.5 rounded-full ${sub.good ? "bg-success" : "bg-warning"}`} />
                      <span className="text-xxs text-muted-foreground">{sub.label}:</span>
                      <span className={`text-xxs font-medium ${sub.good ? "text-foreground" : "text-warning"}`}>{sub.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recommendations */}
        <div>
          <h2 className="text-sm font-semibold text-foreground mb-3">Recommendations to Improve Score</h2>
          <div className="space-y-2">
            {recommendations.map((rec, i) => (
              <div key={i} className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3 group cursor-pointer hover:bg-secondary/30 transition-colors">
                <Info className="h-4 w-4 text-accent shrink-0" />
                <span className="text-[13px] text-foreground flex-1">{rec.text}</span>
                <span className={`text-xxs font-medium rounded-full px-2 py-0.5 ${rec.priority === "High" ? "bg-accent/8 text-accent" : "bg-secondary text-muted-foreground"}`}>
                  {rec.priority}
                </span>
                <ArrowRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default FinancialScore;
