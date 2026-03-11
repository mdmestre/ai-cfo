import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useTransactions } from "@/hooks/use-transactions";
import { useMemo } from "react";
import { format, subMonths } from "date-fns";

const formatCurrency = (value: number) => {
  if (Math.abs(value) >= 1_000_000) return `R$ ${(value / 1_000_000).toFixed(2)}M`;
  if (Math.abs(value) >= 1_000) return `R$ ${(value / 1_000).toFixed(0)}K`;
  return `R$ ${value.toFixed(0)}`;
};

export function RevenueExpensesChart() {
  const { transactions, monthlyRevenue, monthlyExpenses } = useTransactions();

  const data = useMemo(() => {
    return Array.from({ length: 6 }, (_, i) => {
      const d = subMonths(new Date(), 5 - i);
      const monthTxs = transactions.filter((t) => {
        const td = new Date(t.date);
        return td.getMonth() === d.getMonth() && td.getFullYear() === d.getFullYear();
      });
      const revenue = monthTxs.filter((t) => t.amount > 0).reduce((s, t) => s + Number(t.amount), 0);
      const expenses = monthTxs.filter((t) => t.amount < 0).reduce((s, t) => s + Math.abs(Number(t.amount)), 0);
      return { month: format(d, "MMM"), revenue, expenses };
    });
  }, [transactions]);

  return (
    <div className="metric-card animate-slide-up">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <p className="text-[13px] font-medium text-muted-foreground">Receita vs Despesas</p>
          <p className="mt-1.5 text-2xl font-semibold tracking-tight text-foreground">
            {formatCurrency(monthlyRevenue)} <span className="text-base font-normal text-muted-foreground">/ {formatCurrency(monthlyExpenses)}</span>
          </p>
        </div>
        <div className="flex gap-4 text-xxs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-foreground" />
            Receita
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-border" />
            Despesas
          </span>
        </div>
      </div>
      <div className="h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }} barGap={3}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
            <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} tickFormatter={formatCurrency} />
            <Tooltip formatter={(value: number) => [formatCurrency(value), '']} />
            <Bar dataKey="revenue" fill="hsl(var(--foreground))" radius={[3, 3, 0, 0]} />
            <Bar dataKey="expenses" fill="hsl(var(--border))" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
