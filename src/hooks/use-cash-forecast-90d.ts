import { useMemo } from "react";
import { addDays, format, getDaysInMonth, parseISO, startOfDay, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useAccounts } from "@/hooks/use-accounts";
import { useFiscal } from "@/hooks/use-fiscal";
import { useInvoices } from "@/hooks/use-invoices";
import { useTransactions } from "@/hooks/use-transactions";
import { useWallets } from "@/hooks/use-wallets";

export type CashForecastPoint = {
  date: Date;
  label: string;
  balance: number;
  inflow: number;
  outflow: number;
};

export type CashForecastMilestones = {
  today: CashForecastPoint;
  d30: CashForecastPoint;
  d60: CashForecastPoint;
  d90: CashForecastPoint;
  daysUntilNegative: number | null;
};

const OPEN_STATUSES = new Set(["open", "pending", "partial"]);
const TAX_OPEN_STATUSES = new Set(["open", "overdue"]);

function addToDayMap(map: Record<string, number>, dayKey: string, amount: number) {
  map[dayKey] = (map[dayKey] || 0) + amount;
}

export function useCashForecast90d() {
  const { totalBalance, isLoading: accountsLoading } = useAccounts();
  const { totalWalletBalance, isLoading: walletsLoading } = useWallets();
  const { transactions, isLoading: txLoading, monthlyRevenue, monthlyExpenses } = useTransactions();
  const { receivables, payables } = useInvoices();
  const { apurations, isLoading: fiscalLoading } = useFiscal();

  const startingCash = totalBalance + totalWalletBalance;

  const isLoading =
    accountsLoading ||
    walletsLoading ||
    txLoading ||
    receivables.isLoading ||
    payables.isLoading ||
    fiscalLoading;

  const { points, milestones } = useMemo(() => {
    const today = startOfDay(new Date());
    const dayKeys = Array.from({ length: 91 }, (_, i) => format(addDays(today, i), "yyyy-MM-dd"));

    const inflowsByDay: Record<string, number> = {};
    const outflowsByDay: Record<string, number> = {};

    for (const r of receivables.data || []) {
      if (!r?.due_date) continue;
      if (!OPEN_STATUSES.has(String(r.status || "").toLowerCase())) continue;
      const due = parseISO(r.due_date);
      const key = format(due, "yyyy-MM-dd");
      if (!dayKeys.includes(key)) continue;
      addToDayMap(inflowsByDay, key, Number(r.amount) || 0);
    }

    for (const p of payables.data || []) {
      if (!p?.due_date) continue;
      if (!OPEN_STATUSES.has(String(p.status || "").toLowerCase())) continue;
      const due = parseISO(p.due_date);
      const key = format(due, "yyyy-MM-dd");
      if (!dayKeys.includes(key)) continue;
      addToDayMap(outflowsByDay, key, Number(p.amount) || 0);
    }

    for (const t of apurations.data || []) {
      if (!t?.due_date) continue;
      if (!TAX_OPEN_STATUSES.has(String(t.status || "").toLowerCase())) continue;
      const due = parseISO(t.due_date);
      const key = format(due, "yyyy-MM-dd");
      if (!dayKeys.includes(key)) continue;
      const remaining = (Number(t.amount_due) || 0) - (Number(t.amount_paid) || 0);
      if (remaining <= 0) continue;
      addToDayMap(outflowsByDay, key, remaining);
    }

    // Baseline trend from last 30 days of real transactions (rolling window).
    const windowStart = subDays(today, 30);
    const netWindow = transactions
      .filter((t: any) => {
        const d = new Date(t.date);
        return d >= windowStart && d <= today;
      })
      .reduce((sum: number, t: any) => sum + Number(t.amount), 0);

    const fallbackDailyNet = (monthlyRevenue - monthlyExpenses) / Math.max(1, getDaysInMonth(today));
    const avgDailyNet = Number.isFinite(netWindow / 30) && transactions.length > 0 ? netWindow / 30 : fallbackDailyNet;

    const series: CashForecastPoint[] = [];
    let balance = startingCash;

    for (let i = 0; i <= 90; i++) {
      const date = addDays(today, i);
      const key = format(date, "yyyy-MM-dd");
      const inflow = inflowsByDay[key] || 0;
      const outflow = outflowsByDay[key] || 0;

      if (i === 0) {
        balance = startingCash;
      } else {
        balance = balance + avgDailyNet + inflow - outflow;
      }

      series.push({
        date,
        label: format(date, "dd/MM", { locale: ptBR }),
        balance,
        inflow,
        outflow,
      });
    }

    const firstNegativeIndex = series.findIndex((p) => p.balance < 0);

    return {
      points: series,
      milestones: {
        today: series[0],
        d30: series[30],
        d60: series[60],
        d90: series[90],
        daysUntilNegative: firstNegativeIndex === -1 ? null : firstNegativeIndex,
      } satisfies CashForecastMilestones,
    };
  }, [
    startingCash,
    transactions,
    monthlyRevenue,
    monthlyExpenses,
    receivables.data,
    payables.data,
    apurations.data,
  ]);

  return { startingCash, points, milestones, isLoading };
}

