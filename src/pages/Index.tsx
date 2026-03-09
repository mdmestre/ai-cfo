import { AppLayout } from "@/components/layout/AppLayout";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { HealthScoreCard } from "@/components/dashboard/HealthScoreCard";
import { FinancialAlerts } from "@/components/dashboard/FinancialAlerts";
import { SmartRecommendations } from "@/components/dashboard/SmartRecommendations";
import { RunwayCard } from "@/components/dashboard/RunwayCard";
import { RecentInvoices } from "@/components/dashboard/RecentInvoices";
import { ExpenseBreakdown } from "@/components/dashboard/ExpenseBreakdown";
import { AccountsOverview } from "@/components/dashboard/AccountsOverview";
import { DollarSign, TrendingUp, PiggyBank, Loader2, FileDown, CreditCard, Receipt, Wallet } from "lucide-react";
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

const fmt = (value: number) => {
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
  const totalReceivable = receivables.filter(r => r.status === "open").reduce((s, r) => s + Number(r.amount_due) - Number(r.amount_paid), 0);
  const totalPayable = payables.filter(p => p.status === "open").reduce((s, p) => s + Number(p.amount_due) - Number(p.amount_paid), 0);

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

  const forecastData = forecasts.map((f) => ({
    date: format(new Date(f.forecast_date), "MMM dd"),
    balance: Number(f.predicted_balance),
  }));

  const isLoading = accountsLoading || txLoading;

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
      <div className="max-w-[1120px] space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[20px] font-bold text-foreground tracking-tight">Welcome back, {firstName}</h1>
            <p className="mt-0.5 text-[13px] text-muted-foreground">{format(new Date(), "EEEE, MMMM d, yyyy")}</p>
          </div>
          <button
            onClick={exportCSV}
            className="flex items-center gap-2 rounded-lg border border-border/60 bg-card px-3.5 py-2 text-[12px] font-semibold text-foreground hover:bg-secondary transition-all active:scale-[0.98] shadow-xs"
          >
            <FileDown className="h-3.5 w-3.5" />
            Export
          </button>
        </div>

        {/* Primary KPIs */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            title="Cash Position"
            value={fmt(totalCashPosition)}
            subtitle={`${accounts.length} accounts · ${wallets.length} wallets`}
            icon={<DollarSign className="h-4 w-4" />}
          />
          <MetricCard
            title="Revenue"
            value={fmt(monthlyRevenue)}
            subtitle={totalReceivable > 0 ? `${fmt(totalReceivable)} receivable` : "No open receivables"}
            icon={<TrendingUp className="h-4 w-4" />}
          />
          <MetricCard
            title="Expenses"
            value={fmt(monthlyExpenses + expensesThisMonth)}
            subtitle={pendingExpenses > 0 ? `${fmt(pendingExpenses)} pending` : "All approved"}
            icon={<Receipt className="h-4 w-4" />}
          />
          <MetricCard
            title="Net Cash Flow"
            value={fmt(netCashFlow)}
            change={netCashFlow >= 0 ? "Positive" : "Negative"}
            changeType={netCashFlow >= 0 ? "positive" : "negative"}
            icon={<PiggyBank className="h-4 w-4" />}
          />
        </div>

        {/* Secondary KPIs */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <MetricCard
            title="Active Cards"
            value={`${cards.filter(c => c.status === "active").length}`}
            subtitle={cardSpent > 0 ? `${fmt(cardSpent)} / ${fmt(cardLimit)}` : "No spend"}
            icon={<CreditCard className="h-4 w-4" />}
          />
          <MetricCard
            title="Receivables"
            value={fmt(totalReceivable)}
            subtitle={`${receivables.filter(r => r.status === "open").length} open`}
            icon={<TrendingUp className="h-4 w-4" />}
          />
          <MetricCard
            title="Payables"
            value={fmt(totalPayable)}
            subtitle={`${payables.filter(p => p.status === "open").length} due`}
            icon={<Wallet className="h-4 w-4" />}
          />
        </div>

        {/* Forecast + Runway */}
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
          <div className="lg:col-span-2 metric-card animate-slide-up">
            <p className="section-label mb-3">Cash Flow Forecast</p>
            {forecastData.length > 0 ? (
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={forecastData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} tickFormatter={fmt} />
                    <Tooltip formatter={(value: number) => [fmt(value), "Balance"]} />
                    <Area type="monotone" dataKey="balance" stroke="hsl(var(--foreground))" strokeWidth={2} fill="hsl(var(--foreground) / 0.04)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-[13px] text-muted-foreground py-8 text-center">No forecast data yet.</p>
            )}
          </div>
          <RunwayCard totalCash={totalCashPosition} monthlyBurn={monthlyExpenses + expensesThisMonth} />
        </div>

        {/* Revenue vs Expenses + Health */}
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
          <div className="lg:col-span-2 metric-card animate-slide-up">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="section-label">Revenue vs Expenses</p>
                <p className="mt-2 text-[24px] font-bold tracking-tight text-foreground leading-none">
                  {fmt(monthlyRevenue)} <span className="text-[15px] font-normal text-muted-foreground">/ {fmt(monthlyExpenses)}</span>
                </p>
              </div>
              <div className="flex gap-4 text-[11px] text-muted-foreground">
                <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-foreground" />Revenue</span>
                <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-border" />Expenses</span>
              </div>
            </div>
            {monthlyData.some((d) => d.revenue > 0 || d.expenses > 0) ? (
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }} barGap={2}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} tickFormatter={fmt} />
                    <Tooltip formatter={(value: number) => [fmt(value), ""]} />
                    <Bar dataKey="revenue" fill="hsl(var(--foreground))" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="expenses" fill="hsl(var(--border))" radius={[4, 4, 0, 0]} />
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
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
          <RecentInvoices invoices={invoices} />
          <ExpenseBreakdown expenses={expenses} />
          <FinancialAlerts />
        </div>

        {/* Accounts + Recommendations */}
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          <AccountsOverview accounts={accounts} wallets={wallets} />
          <SmartRecommendations />
        </div>
      </div>
    </AppLayout>
  );
};

export default Dashboard;
