import { AppLayout } from "@/components/layout/AppLayout";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { HealthScoreCard } from "@/components/dashboard/HealthScoreCard";
import { FinancialAlerts } from "@/components/dashboard/FinancialAlerts";
import { SmartRecommendations } from "@/components/dashboard/SmartRecommendations";
import { RunwayCard } from "@/components/dashboard/RunwayCard";
import { RecentInvoices } from "@/components/dashboard/RecentInvoices";
import { ExpenseBreakdown } from "@/components/dashboard/ExpenseBreakdown";
import { AccountsOverview } from "@/components/dashboard/AccountsOverview";
import { DollarSign, TrendingUp, CreditCard, PiggyBank, Loader2, FileDown, Wallet, Receipt } from "lucide-react";
import { useAccounts } from "@/hooks/use-accounts";
import { useTransactions } from "@/hooks/use-transactions";
import { useProfile } from "@/hooks/use-profile";
import { useForecasts } from "@/hooks/use-forecasts";
import { useReports } from "@/hooks/use-reports";
import { useInvoices } from "@/hooks/use-invoices";
import { useExpenses } from "@/hooks/use-expenses";
import { useCards } from "@/hooks/use-cards";
import { useWallets } from "@/hooks/use-wallets";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { format, subMonths } from "date-fns";

const formatCurrency = (value: number) => {
  if (Math.abs(value) >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
  if (Math.abs(value) >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
  return `$${value.toFixed(0)}`;
};

const Dashboard = () => {
  const { profile } = useProfile();
  const { accounts, totalBalance, isLoading: accountsLoading } = useAccounts();
  const { transactions, monthlyRevenue, monthlyExpenses, isLoading: txLoading } = useTransactions();
  const { forecasts } = useForecasts();
  const { exportCSV } = useReports();
  const { invoices: invoicesQuery, receivables: receivablesQuery, payables: payablesQuery } = useInvoices();
  const { expenses, totalPending: pendingExpenses, totalThisMonth: expensesThisMonth } = useExpenses();
  const { cards, totalSpent: cardSpent, totalSpendLimit: cardLimit } = useCards();
  const { wallets, totalWalletBalance } = useWallets();

  const invoices = invoicesQuery.data || [];
  const receivables = receivablesQuery.data || [];
  const payables = payablesQuery.data || [];

  const netCashFlow = monthlyRevenue - monthlyExpenses;
  const firstName = profile?.name?.split(" ")[0] || "there";
  const totalCashPosition = totalBalance + totalWalletBalance;

  // Receivables/Payables totals
  const totalReceivable = receivables.filter(r => r.status === "open").reduce((s, r) => s + Number(r.amount_due) - Number(r.amount_paid), 0);
  const totalPayable = payables.filter(p => p.status === "open").reduce((s, p) => s + Number(p.amount_due) - Number(p.amount_paid), 0);

  // Build monthly chart data
  const monthlyData = Array.from({ length: 6 }, (_, i) => {
    const d = subMonths(new Date(), 5 - i);
    const month = format(d, "MMM");
    const monthTxs = transactions.filter((t) => {
      const td = new Date(t.date);
      return td.getMonth() === d.getMonth() && td.getFullYear() === d.getFullYear();
    });
    const revenue = monthTxs.filter((t) => t.amount > 0).reduce((s, t) => s + Number(t.amount), 0);
    const exp = monthTxs.filter((t) => t.amount < 0).reduce((s, t) => s + Math.abs(Number(t.amount)), 0);
    return { month, revenue, expenses: exp, net: revenue - exp };
  });

  // Forecast data
  const forecastData = forecasts.map((f) => ({
    date: format(new Date(f.forecast_date), "MMM dd"),
    balance: Number(f.predicted_balance),
  }));

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
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-foreground tracking-tight">Good morning, {firstName}</h1>
            <p className="mt-0.5 text-[13px] text-muted-foreground">
              Financial overview for {format(new Date(), "MMMM yyyy")}
            </p>
          </div>
          <button
            onClick={exportCSV}
            className="flex items-center gap-2 rounded-lg border border-border/60 bg-card px-3 py-1.5 text-[12px] font-bold text-foreground hover:bg-secondary transition-all active:scale-95 shadow-sm"
          >
            <FileDown className="h-3.5 w-3.5" />
            Export
          </button>
        </div>

        {/* KPI Row */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            title="Total Cash Position"
            value={formatCurrency(totalCashPosition)}
            subtitle={wallets.length > 0 ? `${accounts.length} accounts · ${wallets.length} wallets` : `${accounts.length} accounts`}
            icon={<DollarSign className="h-4 w-4" />}
          />
          <MetricCard
            title="Monthly Revenue"
            value={formatCurrency(monthlyRevenue)}
            subtitle={`${totalReceivable > 0 ? formatCurrency(totalReceivable) + " receivable" : "No open receivables"}`}
            icon={<TrendingUp className="h-4 w-4" />}
          />
          <MetricCard
            title="Monthly Expenses"
            value={formatCurrency(monthlyExpenses + expensesThisMonth)}
            subtitle={`${pendingExpenses > 0 ? formatCurrency(pendingExpenses) + " pending approval" : "All approved"}`}
            icon={<Receipt className="h-4 w-4" />}
          />
          <MetricCard
            title="Net Cash Flow"
            value={formatCurrency(netCashFlow)}
            change={netCashFlow >= 0 ? "Positive" : "Negative"}
            changeType={netCashFlow >= 0 ? "positive" : "negative"}
            icon={<PiggyBank className="h-4 w-4" />}
          />
        </div>

        {/* Secondary KPIs */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <MetricCard
            title="Cards Active"
            value={`${cards.filter(c => c.status === "active").length}`}
            subtitle={cardSpent > 0 ? `${formatCurrency(cardSpent)} of ${formatCurrency(cardLimit)} spent` : "No card spend this month"}
            icon={<CreditCard className="h-4 w-4" />}
          />
          <MetricCard
            title="Open Receivables"
            value={formatCurrency(totalReceivable)}
            subtitle={`${receivables.filter(r => r.status === "open").length} invoices pending`}
            icon={<TrendingUp className="h-4 w-4" />}
          />
          <MetricCard
            title="Open Payables"
            value={formatCurrency(totalPayable)}
            subtitle={`${payables.filter(p => p.status === "open").length} bills due`}
            icon={<Wallet className="h-4 w-4" />}
          />
        </div>

        {/* Charts Row */}
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
                    <Area type="monotone" dataKey="balance" stroke="hsl(var(--primary))" strokeWidth={2} fill="hsl(var(--primary) / 0.08)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-[13px] text-muted-foreground py-8 text-center">No forecast data yet.</p>
            )}
          </div>
          <RunwayCard totalCash={totalCashPosition} monthlyBurn={monthlyExpenses + expensesThisMonth} />
        </div>

        {/* Revenue vs Expenses + Health Score */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2 metric-card animate-slide-up">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-[13px] font-medium text-muted-foreground">Revenue vs Expenses</p>
                <p className="mt-1.5 text-2xl font-semibold tracking-tight text-foreground">
                  {formatCurrency(monthlyRevenue)} <span className="text-base font-normal text-muted-foreground">/ {formatCurrency(monthlyExpenses)}</span>
                </p>
              </div>
              <div className="flex gap-4 text-[11px] text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-primary" />Revenue
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
                    <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[3, 3, 0, 0]} />
                    <Bar dataKey="expenses" fill="hsl(var(--border))" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-[13px] text-muted-foreground py-8 text-center">No transaction data yet.</p>
            )}
          </div>
          <HealthScoreCard score={transactions.length > 0 ? Math.min(100, Math.round((monthlyRevenue / (monthlyExpenses || 1)) * 40)) : 0} />
        </div>

        {/* Invoices + Expenses + Alerts */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <RecentInvoices invoices={invoices} />
          <ExpenseBreakdown expenses={expenses} />
          <FinancialAlerts />
        </div>

        {/* Accounts + Recommendations */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <AccountsOverview accounts={accounts} wallets={wallets} />
          <SmartRecommendations />
        </div>
      </div>
    </AppLayout>
  );
};

export default Dashboard;
