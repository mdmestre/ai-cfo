import { AppLayout } from "@/components/layout/AppLayout";
import { ArrowRight, CheckCircle, AlertTriangle } from "lucide-react";

const factors = [
  { name: "Cash Flow Stability", score: 82, weight: "25%", status: "good" as const, detail: "Consistent positive cash flow over the last 6 months" },
  { name: "Revenue Predictability", score: 74, weight: "20%", status: "good" as const, detail: "MRR growing steadily with low churn rate" },
  { name: "Expense Ratio", score: 88, weight: "20%", status: "good" as const, detail: "Operating expenses at 64% of revenue" },
  { name: "Debt Exposure", score: 92, weight: "15%", status: "good" as const, detail: "Minimal debt with healthy debt-to-equity ratio" },
  { name: "Customer Concentration", score: 54, weight: "20%", status: "warning" as const, detail: "Top client represents 38% of total revenue" },
];

const overallScore = 78;

const FinancialScore = () => {
  const circumference = 2 * Math.PI * 80;
  const progress = (overallScore / 100) * circumference;

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Financial Score</h1>
          <p className="mt-1 text-sm text-muted-foreground">A comprehensive assessment of your company's financial health</p>
        </div>

        {/* Score hero */}
        <div className="metric-card flex flex-col items-center py-10">
          <div className="relative">
            <svg width="200" height="200" viewBox="0 0 180 180">
              <circle cx="90" cy="90" r="80" fill="none" stroke="hsl(var(--secondary))" strokeWidth="10" />
              <circle
                cx="90" cy="90" r="80" fill="none"
                stroke="hsl(160 84% 39%)"
                strokeWidth="10" strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={circumference - progress}
                transform="rotate(-90 90 90)"
                className="transition-all duration-1000 ease-out"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-5xl font-bold text-foreground">{overallScore}</span>
              <span className="text-sm text-muted-foreground mt-1">out of 100</span>
            </div>
          </div>
          <p className="mt-4 text-lg font-semibold text-success">Good Financial Health</p>
          <p className="mt-1 text-sm text-muted-foreground max-w-md text-center">
            Your company has a strong financial position with room for improvement in customer diversification.
          </p>
        </div>

        {/* Factors */}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">Score Breakdown</h2>
          {factors.map((factor) => (
            <div key={factor.name} className="metric-card">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {factor.status === "good" ? (
                    <CheckCircle className="h-5 w-5 text-success" />
                  ) : (
                    <AlertTriangle className="h-5 w-5 text-warning" />
                  )}
                  <div>
                    <p className="text-sm font-medium text-foreground">{factor.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{factor.detail}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-xs text-muted-foreground">Weight: {factor.weight}</span>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-24 rounded-full bg-secondary overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${
                          factor.status === "good" ? "bg-success" : "bg-warning"
                        }`}
                        style={{ width: `${factor.score}%` }}
                      />
                    </div>
                    <span className="text-sm font-semibold text-foreground w-8">{factor.score}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
};

export default FinancialScore;
