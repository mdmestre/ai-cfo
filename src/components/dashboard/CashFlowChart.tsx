import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useTransactions } from "@/hooks/use-transactions";
import { useAccounts } from "@/hooks/use-accounts";
import { useForecasts } from "@/hooks/use-forecasts";
import { useWallets } from "@/hooks/use-wallets";
import { useMemo } from "react";
import { format, subMonths, addDays } from "date-fns";

const formatCurrency = (value: number) => {
  if (Math.abs(value) >= 1_000_000) return `R$ ${(value / 1_000_000).toFixed(2)}M`;
  if (Math.abs(value) >= 1_000) return `R$ ${(value / 1_000).toFixed(0)}K`;
  return `R$ ${value.toFixed(0)}`;
};

export function CashFlowChart() {
  const { transactions, monthlyRevenue, monthlyExpenses } = useTransactions();
  const { totalBalance } = useAccounts();
  const { totalWalletBalance } = useWallets();
  const { forecasts } = useForecasts();

  const currentBalance = totalBalance + totalWalletBalance;

  const data = useMemo(() => {
    // Historical: derive from transactions
    const historical = Array.from({ length: 5 }, (_, i) => {
      const m = subMonths(new Date(), 4 - i);
      const monthTxs = transactions.filter((t) => {
        const td = new Date(t.date);
        return td.getMonth() === m.getMonth() && td.getFullYear() === m.getFullYear();
      });
      const net = monthTxs.reduce((s, t) => s + Number(t.amount), 0);
      return { month: format(m, "MMM"), actual: Math.round(net > 0 ? net : 0), forecast: null as number | null };
    });

    // Forecast
    if (forecasts.length > 0) {
      forecasts.slice(0, 3).forEach((f) => {
        historical.push({
          month: format(new Date(f.forecast_date), "MMM"),
          actual: null as unknown as number,
          forecast: Number((f as any).net_balance ?? 0),
        });
      });
    } else {
      const monthlyNet = monthlyRevenue - monthlyExpenses;
      for (let i = 1; i <= 3; i++) {
        const d = addDays(new Date(), i * 30);
        historical.push({
          month: format(d, "MMM"),
          actual: null as unknown as number,
          forecast: Math.round(currentBalance + monthlyNet * i),
        });
      }
    }

    return historical;
  }, [transactions, forecasts, currentBalance, monthlyRevenue, monthlyExpenses]);

  return (
    <div className="metric-card animate-slide-up">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <p className="text-[13px] font-medium text-muted-foreground">Previsão de Fluxo de Caixa</p>
          <p className="mt-1.5 text-2xl font-semibold tracking-tight text-foreground">{formatCurrency(currentBalance)}</p>
        </div>
        <div className="flex gap-4 text-xxs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-foreground" />
            Real
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-accent opacity-60" />
            Previsão
          </span>
        </div>
      </div>
      <div className="h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="actualGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(var(--foreground))" stopOpacity={0.08} />
                <stop offset="100%" stopColor="hsl(var(--foreground))" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="forecastGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(var(--accent))" stopOpacity={0.08} />
                <stop offset="100%" stopColor="hsl(var(--accent))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
            <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} tickFormatter={formatCurrency} />
            <Tooltip formatter={(value: number) => [formatCurrency(value), '']} />
            <Area type="monotone" dataKey="actual" stroke="hsl(var(--foreground))" strokeWidth={2} fill="url(#actualGradient)" connectNulls={false} />
            <Area type="monotone" dataKey="forecast" stroke="hsl(var(--accent))" strokeWidth={2} strokeDasharray="6 4" fill="url(#forecastGradient)" connectNulls={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
