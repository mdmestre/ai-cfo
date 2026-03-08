import { AppLayout } from "@/components/layout/AppLayout";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { HealthScoreCard } from "@/components/dashboard/HealthScoreCard";
import { FinancialAlerts } from "@/components/dashboard/FinancialAlerts";
import { SmartRecommendations } from "@/components/dashboard/SmartRecommendations";
import { DollarSign, TrendingUp, CreditCard, PiggyBank, Loader2 } from "lucide-react";
import { useAccounts } from "@/hooks/use-accounts";
import { useTransactions } from "@/hooks/use-transactions";
import { useProfile } from "@/hooks/use-profile";
import { useForecasts } from "@/hooks/use-forecasts";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { format, subMonths } from "date-fns";

const formatCurrency = (value: number) => {
  if (Math.abs(value) >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
  if (Math.abs(value) >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
  return `$${value.toFixed(0)}`;
};

const Dashboard = () => {
  const { profile } = useProfile();
  const { totalBalance, isLoading: accountsLoading } = useAccounts();
  const { transactions, monthlyRevenue, monthlyExpenses, isLoading: txLoading } = useTransactions();
  const { forecasts } = useForecasts();

  const netCashFlow = monthlyRevenue - monthlyExpenses;
  const firstName = profile?.name?.split(" ")[0] || "there";

  // Build monthly chart data from real transactions
  const monthlyData = Array.from({ length: 6 }, (_, i) => {
    const d = subMonths(new Date(), 5 - i);
    const month = format(d, "MMM");
    const monthTxs = transactions.filter((t) => {
      const td = new Date(t.date);
      return td.getMonth() === d.getMonth() && td.getFullYear() === d.getFullYear();
    });
    const revenue = monthTxs.filter((t) => t.amount > 0).reduce((s, t) => s + Number(t.amount), 0);
    const expenses = monthTxs.filter((t) => t.amount < 0).reduce((s, t) => s + Math.abs(Number(t.amount)), 0);
    return { month, revenue, expenses, net: revenue - expenses };
  });

  // Forecast chart data
  const forecastData = forecasts.map((f) => ({
    date: format(new Date(f.forecast_date), "MMM dd"),
    balance: Number(f.predicted_balance),
  }));

  const upcomingTxs = transactions
    .filter((t) => new Date(t.date) >= new Date())
    .slice(0, 5);

  const isLoading = accountsLoading || txLoading;

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-[1200px] space-y-6">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Good morning, {firstName}</h1>
          <p className="mt-0.5 text-[13px] text-muted-foreground">
            Here's your financial overview for {format(new Date(), "MMMM yyyy")}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            title="Total Cash Position"
            value={formatCurrency(totalBalance)}
            change="—"
            changeType="positive"
            icon={<DollarSign className="h-4 w-4 text-muted-foreground" />}
          />
          <MetricCard
            title="Monthly Revenue"
            value={formatCurrency(monthlyRevenue)}
            change="—"
            changeType="positive"
            icon={<TrendingUp className="h-4 w-4 text-muted-foreground" />}
          />
          <MetricCard
            title="Monthly Expenses"
            value={formatCurrency(monthlyExpenses)}
            change="—"
            changeType="negative"
            icon={<CreditCard className="h-4 w-4 text-muted-foreground" />}
          />
          <MetricCard
            title="Net Cash Flow"
            value={formatCurrency(netCashFlow)}
            change="—"
            changeType={netCashFlow >= 0 ? "positive" : "negative"}
            icon={<PiggyBank className="h-4 w-4 text-muted-foreground" />}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2 metric-card animate-slide-up">
            <p className="text-[13px] font-medium text-muted-foreground mb-1">Cash Flow Forecast</p>
            {forecastData.length > 0 ? (
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={forecastData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} tickFormatter={formatCurrency} />
                    <Tooltip formatter={(value: number) => [formatCurrency(value), "Balance"]} />
                    <Area type="monotone" dataKey="balance" stroke="hsl(var(--accent))" strokeWidth={2} fill="hsl(var(--accent) / 0.1)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-[13px] text-muted-foreground py-8 text-center">No forecast data yet. Add cashflow forecasts to see projections.</p>
            )}
          </div>
          <HealthScoreCard score={transactions.length > 0 ? Math.min(100, Math.round((monthlyRevenue / (monthlyExpenses || 1)) * 40)) : 0} />
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {/* Revenue vs Expenses from real data */}
          <div className="metric-card animate-slide-up">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-[13px] font-medium text-muted-foreground">Revenue vs Expenses</p>
                <p className="mt-1.5 text-2xl font-semibold tracking-tight text-foreground">
                  {formatCurrency(monthlyRevenue)} <span className="text-base font-normal text-muted-foreground">/ {formatCurrency(monthlyExpenses)}</span>
                </p>
              </div>
              <div className="flex gap-4 text-xxs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-foreground" />Revenue
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-border" />Expenses
                </span>
              </div>
            </div>
            {monthlyData.some((d) => d.revenue > 0 || d.expenses > 0) ? (
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }} barGap={3}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} tickFormatter={formatCurrency} />
                    <Tooltip formatter={(value: number) => [formatCurrency(value), ""]} />
                    <Bar dataKey="revenue" fill="hsl(var(--foreground))" radius={[3, 3, 0, 0]} />
                    <Bar dataKey="expenses" fill="hsl(var(--border))" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-[13px] text-muted-foreground py-8 text-center">No transaction data yet.</p>
            )}
          </div>
          <FinancialAlerts />
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {/* Upcoming transactions from real data */}
          <div className="metric-card animate-slide-up">
            <p className="text-[13px] font-medium text-muted-foreground mb-4">Upcoming Transactions</p>
            {upcomingTxs.length > 0 ? (
              <div className="space-y-0">
                {upcomingTxs.map((t) => (
                  <div key={t.id} className="flex items-center justify-between py-2.5 border-b border-border last:border-0">
                    <div>
                      <p className="text-[13px] font-medium text-foreground">{t.description || t.category}</p>
                      <p className="text-xxs text-muted-foreground">{format(new Date(t.date), "MMM dd")} · {t.category}</p>
                    </div>
                    <p className={`text-[13px] font-semibold ${t.amount > 0 ? "text-success" : "text-foreground"}`}>
                      {t.amount > 0 ? "+" : ""}{formatCurrency(Number(t.amount))}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[13px] text-muted-foreground py-8 text-center">No upcoming transactions.</p>
            )}
          </div>
          <SmartRecommendations />
        </div>
      </div>
    </AppLayout>
  );
};

export default Dashboard;
