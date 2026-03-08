import { AppLayout } from "@/components/layout/AppLayout";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { HealthScoreCard } from "@/components/dashboard/HealthScoreCard";
import { CashFlowChart } from "@/components/dashboard/CashFlowChart";
import { RevenueExpensesChart } from "@/components/dashboard/RevenueExpensesChart";
import { FinancialAlerts } from "@/components/dashboard/FinancialAlerts";
import { UpcomingPayments } from "@/components/dashboard/UpcomingPayments";
import { SmartRecommendations } from "@/components/dashboard/SmartRecommendations";
import { DollarSign, TrendingUp, CreditCard, PiggyBank } from "lucide-react";

const Dashboard = () => {
  return (
    <AppLayout>
      <div className="max-w-[1200px] space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-xl font-semibold text-foreground">Good morning, John</h1>
          <p className="mt-0.5 text-[13px] text-muted-foreground">
            Here's your financial overview for March 2026
          </p>
        </div>

        {/* Top metrics */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            title="Total Cash Position"
            value="$1.24M"
            change="+12.5%"
            changeType="positive"
            icon={<DollarSign className="h-4 w-4 text-muted-foreground" />}
          />
          <MetricCard
            title="Monthly Revenue"
            value="$480K"
            change="+8.2%"
            changeType="positive"
            icon={<TrendingUp className="h-4 w-4 text-muted-foreground" />}
          />
          <MetricCard
            title="Monthly Expenses"
            value="$310K"
            change="+3.1%"
            changeType="negative"
            icon={<CreditCard className="h-4 w-4 text-muted-foreground" />}
          />
          <MetricCard
            title="Net Cash Flow"
            value="$170K"
            change="+24.3%"
            changeType="positive"
            icon={<PiggyBank className="h-4 w-4 text-muted-foreground" />}
          />
        </div>

        {/* Charts row */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <CashFlowChart />
          </div>
          <HealthScoreCard score={78} />
        </div>

        {/* Revenue vs Expenses + Alerts */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <RevenueExpensesChart />
          <FinancialAlerts />
        </div>

        {/* Bottom row */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <UpcomingPayments />
          <SmartRecommendations />
        </div>
      </div>
    </AppLayout>
  );
};

export default Dashboard;
