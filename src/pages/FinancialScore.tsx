import { AppLayout } from "@/components/layout/AppLayout";
import { CheckCircle, AlertTriangle } from "lucide-react";

const factors = [
  { name: "Cash Flow Stability", score: 82, weight: "25%", status: "good" as const, detail: "Consistent positive cash flow over the last 6 months" },
  { name: "Revenue Predictability", score: 74, weight: "20%", status: "good" as const, detail: "MRR growing steadily with low churn rate" },
  { name: "Expense Ratio", score: 88, weight: "20%", status: "good" as const, detail: "Operating expenses at 64% of revenue" },
  { name: "Debt Exposure", score: 92, weight: "15%", status: "good" as const, detail: "Minimal debt with healthy debt-to-equity ratio" },
  { name: "Customer Concentration", score: 54, weight: "20%", status: "warning" as const, detail: "Top client represents 38% of total revenue" },
];

const overallScore = 78;

const FinancialScore = () => {
  const circumference = 2 * Math.PI * 76;
  const progress = (overallScore / 100) * circumference;

  return (
    <AppLayout>
      <div className="max-w-[1200px] space-y-6">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Financial Score</h1>
          <p className="mt-0.5 text-[13px] text-muted-foreground">A comprehensive assessment of your company's financial health</p>
        </div>

        <div className="metric-card flex flex-col items-center py-10">
          <div className="relative">
            <svg width="180" height="180" viewBox="0 0 164 164">
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
          <p className="mt-4 text-sm font-semibold text-success">Good Financial Health</p>
          <p className="mt-1 text-[13px] text-muted-foreground max-w-md text-center leading-snug">
            Your company has a strong financial position with room for improvement in customer diversification.
          </p>
        </div>

        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-foreground mb-3">Score Breakdown</h2>
          {factors.map((factor) => (
            <div key={factor.name} className="metric-card !py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {factor.status === "good" ? (
                    <CheckCircle className="h-4 w-4 text-success" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-warning" />
                  )}
                  <div>
                    <p className="text-[13px] font-medium text-foreground">{factor.name}</p>
                    <p className="text-xxs text-muted-foreground mt-0.5">{factor.detail}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-xxs text-muted-foreground">Weight: {factor.weight}</span>
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-20 rounded-full bg-secondary overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${
                          factor.status === "good" ? "bg-success" : "bg-warning"
                        }`}
                        style={{ width: `${factor.score}%` }}
                      />
                    </div>
                    <span className="text-[13px] font-semibold text-foreground w-7 text-right">{factor.score}</span>
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
