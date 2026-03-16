import { AppLayout } from "@/components/layout/AppLayout";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { HealthScoreCard } from "@/components/dashboard/HealthScoreCard";
import { FinancialAlerts } from "@/components/dashboard/FinancialAlerts";
import { SmartRecommendations } from "@/components/dashboard/SmartRecommendations";
import { RunwayCard } from "@/components/dashboard/RunwayCard";
import { RecentInvoices } from "@/components/dashboard/RecentInvoices";
import { ExpenseBreakdown } from "@/components/dashboard/ExpenseBreakdown";
import { AccountsOverview } from "@/components/dashboard/AccountsOverview";
import { CashForecast90Card } from "@/components/dashboard/CashForecast90Card";
import { SpendingGuidanceCard } from "@/components/dashboard/SpendingGuidanceCard";
import { Loader2, FileDown, TrendingUp, TrendingDown, Wallet, Landmark, Receipt, CreditCard } from "lucide-react";
import { useAccounts } from "@/hooks/use-accounts";
import { useTransactions } from "@/hooks/use-transactions";
import { useProfile } from "@/hooks/use-profile";
import { useReports } from "@/hooks/use-reports";
import { useInvoices } from "@/hooks/use-invoices";
import { useExpenses } from "@/hooks/use-expenses";
import { useWallets } from "@/hooks/use-wallets";
import { useFiscal } from "@/hooks/use-fiscal";
import { useCashForecast90d } from "@/hooks/use-cash-forecast-90d";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { format, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { formatBRLCompact, formatBRLNoCents } from "@/lib/format";

const OPEN_STATUSES = new Set(["open", "pending", "partial"]);
const OPEN_TAX_STATUSES = new Set(["open", "overdue"]);

const Dashboard = () => {
  const { profile } = useProfile();
  const { accounts, totalBalance, isLoading: accountsLoading } = useAccounts();
  const { transactions, monthlyRevenue, monthlyExpenses, isLoading: txLoading } = useTransactions();
  const { exportCSV } = useReports();
  const { invoices: invoicesQuery, receivables: receivablesQuery, payables: payablesQuery } = useInvoices();
  const { expenses, totalPending: pendingExpenses } = useExpenses();
  const { wallets, totalWalletBalance, isLoading: walletsLoading } = useWallets();
  const { apurations } = useFiscal();
  const { points: forecastPoints, milestones: forecastMilestones, isLoading: forecastLoading } = useCashForecast90d();

  const invoices = invoicesQuery.data || [];
  const receivables = receivablesQuery.data || [];
  const payables = payablesQuery.data || [];

  const firstName = profile?.name?.split(" ")[0] || "por aqui";
  const totalCashPosition = totalBalance + totalWalletBalance;

  const totalReceivable = receivables
    .filter((r: any) => OPEN_STATUSES.has(String(r.status || "").toLowerCase()))
    .reduce((s: number, r: any) => s + Number(r.amount || 0), 0);

  const totalPayable = payables
    .filter((p: any) => OPEN_STATUSES.has(String(p.status || "").toLowerCase()))
    .reduce((s: number, p: any) => s + Number(p.amount || 0), 0);

  const profitThisMonth = monthlyRevenue - monthlyExpenses;
  const marginThisMonth = monthlyRevenue > 0 ? profitThisMonth / monthlyRevenue : null;

  const openTaxesTotal = (apurations.data || [])
    .filter((t: any) => OPEN_TAX_STATUSES.has(String(t.status || "").toLowerCase()))
    .reduce((s: number, t: any) => {
      const remaining = (Number(t.amount_due) || 0) - (Number(t.amount_paid) || 0);
      return s + Math.max(0, remaining);
    }, 0);
  const estimatedTaxes = openTaxesTotal > 0 ? openTaxesTotal : Math.max(0, monthlyRevenue * 0.06);

  const monthlyData = Array.from({ length: 6 }, (_, i) => {
    const d = subMonths(new Date(), 5 - i);
    const month = format(d, "MMM", { locale: ptBR });
    const monthTxs = transactions.filter((t: any) => {
      const td = new Date(t.date);
      return td.getMonth() === d.getMonth() && td.getFullYear() === d.getFullYear();
    });
    const revenue = monthTxs.filter((t: any) => Number(t.amount) > 0).reduce((s: number, t: any) => s + Number(t.amount), 0);
    const exp = monthTxs.filter((t: any) => Number(t.amount) < 0).reduce((s: number, t: any) => s + Math.abs(Number(t.amount)), 0);
    return { month, revenue, expenses: exp, net: revenue - exp };
  });

  const runwayMonths = monthlyExpenses > 0 ? totalCashPosition / monthlyExpenses : Infinity;
  const liquidityScore = runwayMonths === Infinity ? 90 : runwayMonths >= 12 ? 100 : runwayMonths >= 6 ? 80 : runwayMonths >= 3 ? 60 : runwayMonths >= 1 ? 40 : 20;
  const marginScore = marginThisMonth === null ? 0 : marginThisMonth >= 0.2 ? 100 : marginThisMonth >= 0.1 ? 80 : marginThisMonth >= 0 ? 60 : marginThisMonth >= -0.1 ? 40 : 20;
  const cashRiskPenalty = forecastMilestones.daysUntilNegative !== null && forecastMilestones.daysUntilNegative <= 90 ? -20 : 0;
  const healthScore = Math.max(0, Math.min(100, Math.round(liquidityScore * 0.6 + marginScore * 0.4 + cashRiskPenalty)));

  const isLoading = accountsLoading || txLoading || walletsLoading || forecastLoading;

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      </AppLayout>
    );
  }

  const dateLabel = format(new Date(), "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR });

  return (
    <AppLayout>
      <div className="max-w-[1120px] space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[20px] font-bold text-foreground tracking-tight">Ola, {firstName}</h1>
            <p className="mt-0.5 text-[13px] text-muted-foreground">{dateLabel}</p>
          </div>
          <button
            onClick={exportCSV}
            className="flex items-center gap-2 rounded-lg border border-border/60 bg-card px-3.5 py-2 text-[12px] font-semibold text-foreground hover:bg-secondary transition-all active:scale-[0.98] shadow-xs"
          >
            <FileDown className="h-3.5 w-3.5" />
            Exportar CSV
          </button>
        </div>

        {/* Primary KPIs */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <div className="metric-card animate-slide-up lg:col-span-2">
            <p className="section-label">Caixa hoje</p>
            <p className="mt-3 text-[32px] font-bold tracking-tight text-foreground leading-none tabular-nums">
              {formatBRLNoCents(totalCashPosition)}
            </p>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Landmark className="h-3.5 w-3.5" />
                Bancos: <span className="font-semibold text-foreground">{formatBRLCompact(totalBalance)}</span>
              </span>
              <span className="flex items-center gap-1.5">
                <Wallet className="h-3.5 w-3.5" />
                Carteiras: <span className="font-semibold text-foreground">{formatBRLCompact(totalWalletBalance)}</span>
              </span>
              <span className="flex items-center gap-1.5">
                <TrendingUp className="h-3.5 w-3.5" />
                A receber: <span className="font-semibold text-foreground">{formatBRLCompact(totalReceivable)}</span>
              </span>
              <span className="flex items-center gap-1.5">
                <TrendingDown className="h-3.5 w-3.5" />
                A pagar: <span className="font-semibold text-foreground">{formatBRLCompact(totalPayable)}</span>
              </span>
            </div>
          </div>

          <MetricCard
            title="Receita (mes)"
            value={formatBRLCompact(monthlyRevenue)}
            icon={<TrendingUp className="h-4 w-4" />}
          />
          <MetricCard
            title="Despesas (mes)"
            value={formatBRLCompact(monthlyExpenses)}
            subtitle={pendingExpenses > 0 ? `Pendentes: ${formatBRLCompact(pendingExpenses)}` : undefined}
            icon={<TrendingDown className="h-4 w-4" />}
          />
          <MetricCard
            title="Lucro (mes)"
            value={formatBRLCompact(profitThisMonth)}
            change={marginThisMonth === null ? "-" : `Margem: ${(marginThisMonth * 100).toFixed(0)}%`}
            changeType={profitThisMonth >= 0 ? "positive" : "negative"}
            icon={<Receipt className="h-4 w-4" />}
          />
          <MetricCard
            title="Impostos (a pagar)"
            value={formatBRLCompact(estimatedTaxes)}
            subtitle={openTaxesTotal > 0 ? "Guias registradas" : "Estimativa (Simples 6%)"}
            icon={<CreditCard className="h-4 w-4" />}
          />
        </div>

        {/* Forecast + Runway + Spend Guidance */}
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <CashForecast90Card points={forecastPoints} milestones={forecastMilestones} />
          </div>
          <RunwayCard totalCash={totalCashPosition} monthlyBurn={monthlyExpenses} />
          <SpendingGuidanceCard currentCash={totalCashPosition} monthlyBurn={monthlyExpenses} />
        </div>

        {/* Revenue vs Expenses + Health */}
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
          <div className="lg:col-span-2 metric-card animate-slide-up">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="section-label">Receita vs Despesas</p>
                <p className="mt-2 text-[24px] font-bold tracking-tight text-foreground leading-none">
                  {formatBRLCompact(monthlyRevenue)}{" "}
                  <span className="text-[15px] font-normal text-muted-foreground">/ {formatBRLCompact(monthlyExpenses)}</span>
                </p>
              </div>
              <div className="flex gap-4 text-[11px] text-muted-foreground">
                <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-foreground" />Receita</span>
                <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-border" />Despesas</span>
              </div>
            </div>
            {monthlyData.some((d) => d.revenue > 0 || d.expenses > 0) ? (
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }} barGap={2}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} tickFormatter={(v: number) => formatBRLCompact(v)} />
                    <Tooltip formatter={(value: number) => [formatBRLNoCents(value), ""]} />
                    <Bar dataKey="revenue" fill="hsl(var(--foreground))" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="expenses" fill="hsl(var(--border))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-[13px] text-muted-foreground py-8 text-center">Sem dados de transacoes ainda.</p>
            )}
          </div>
          <HealthScoreCard score={transactions.length > 0 ? healthScore : 0} />
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
