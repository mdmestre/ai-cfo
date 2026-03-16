import { useMemo } from "react";
import { differenceInCalendarDays, endOfMonth, startOfDay, startOfMonth, subMonths, subDays } from "date-fns";
import { useTransactions } from "@/hooks/use-transactions";

export type SavingsOpportunityType =
  | "recurring_expense"
  | "category_spike"
  | "uncategorized";

export type SavingsOpportunity = {
  id: string;
  type: SavingsOpportunityType;
  title: string;
  description: string;
  potentialSavingsMonthly: number;
  confidence: number; // 0..100
  actionLabel?: string;
  actionUrl?: string;
};

function stripDiacritics(input: string) {
  try {
    return input.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  } catch {
    return input;
  }
}

function normalizeMerchant(description: string) {
  const raw = stripDiacritics(String(description || "").toLowerCase());
  const cleaned = raw
    .replace(/\d+/g, " ")
    .replace(/[^a-z\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return cleaned.slice(0, 32) || "outros";
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export function useSavingsOpportunities() {
  const { transactions, isLoading } = useTransactions();

  const opportunities = useMemo<SavingsOpportunity[]>(() => {
    const now = startOfDay(new Date());
    const windowStart = subDays(now, 90);

    const expenses90 = transactions.filter((t: any) => {
      const d = new Date(t.date);
      return d >= windowStart && d <= now && Number(t.amount) < 0;
    });

    const groups: Record<
      string,
      {
        merchantKey: string;
        sampleDesc: string;
        count: number;
        total: number;
        amounts: number[];
        dates: Date[];
      }
    > = {};

    for (const t of expenses90) {
      const desc = String(t.description || "");
      const key = normalizeMerchant(desc);
      const amt = Math.abs(Number(t.amount) || 0);
      const dt = new Date(t.date);

      if (!groups[key]) {
        groups[key] = {
          merchantKey: key,
          sampleDesc: desc,
          count: 0,
          total: 0,
          amounts: [],
          dates: [],
        };
      }
      groups[key].count += 1;
      groups[key].total += amt;
      groups[key].amounts.push(amt);
      groups[key].dates.push(dt);
    }

    const items: SavingsOpportunity[] = [];

    // 1) Recurring expenses (subscriptions-like)
    for (const g of Object.values(groups)) {
      if (g.count < 3) continue;

      const dates = [...g.dates].sort((a, b) => a.getTime() - b.getTime());
      const gaps = dates.slice(1).map((d, i) => differenceInCalendarDays(d, dates[i]));
      gaps.sort((a, b) => a - b);
      const medianGap = gaps.length ? gaps[Math.floor(gaps.length / 2)] : null;

      const mean = g.amounts.reduce((s, v) => s + v, 0) / Math.max(1, g.amounts.length);
      const maxDev = g.amounts.reduce((m, v) => Math.max(m, Math.abs(v - mean) / Math.max(1, mean)), 0);

      // Roughly monthly recurring: median gap in [20..40] and amounts not too volatile.
      const looksMonthly = medianGap !== null && medianGap >= 20 && medianGap <= 40;
      const consistentAmount = maxDev <= 0.25;
      if (!looksMonthly || !consistentAmount) continue;

      const monthlySpendEstimate = g.total / 3; // 90d ~= 3 months
      const potential = monthlySpendEstimate * 0.1; // suggest 10% renegotiation/cancellation
      const confidence = clamp(Math.round(50 + g.count * 8 - maxDev * 60), 35, 95);

      items.push({
        id: `recurring:${g.merchantKey}`,
        type: "recurring_expense",
        title: `Rever gasto recorrente: ${g.sampleDesc.slice(0, 28) || "Despesa"}`,
        description: `Detectamos ${g.count} cobrancas semelhantes nos ultimos 90 dias. Media estimada: ~R$ ${monthlySpendEstimate.toFixed(
          0
        )}/mes.`,
        potentialSavingsMonthly: Math.max(0, potential),
        confidence,
        actionLabel: "Ver transacoes",
        actionUrl: "/transactions",
      });
    }

    // 2) Category spikes (this month vs last month)
    const thisStart = startOfMonth(now);
    const lastStart = startOfMonth(subMonths(now, 1));
    const lastEnd = endOfMonth(subMonths(now, 1));

    const sumByCategory = (from: Date, to: Date) => {
      const by: Record<string, number> = {};
      for (const t of transactions) {
        const d = new Date((t as any).date);
        if (d < from || d > to) continue;
        if (Number((t as any).amount) >= 0) continue;
        const cat = String((t as any).category || "Sem categoria").trim() || "Sem categoria";
        by[cat] = (by[cat] || 0) + Math.abs(Number((t as any).amount) || 0);
      }
      return by;
    };

    const thisBy = sumByCategory(thisStart, now);
    const lastBy = sumByCategory(lastStart, lastEnd);

    const spikes = Object.entries(thisBy)
      .map(([cat, thisVal]) => {
        const lastVal = lastBy[cat] || 0;
        const delta = thisVal - lastVal;
        const pct = lastVal > 0 ? delta / lastVal : null;
        return { cat, thisVal, lastVal, delta, pct };
      })
      .filter((x) => x.delta > 2000 && (x.pct === null || x.pct >= 0.25))
      .sort((a, b) => b.delta - a.delta)
      .slice(0, 3);

    for (const s of spikes) {
      const potential = s.delta * 0.2; // a conservative "cut 20% of the increase" suggestion
      const confidence = clamp(Math.round(55 + (s.pct ? s.pct * 30 : 10)), 40, 90);
      items.push({
        id: `spike:${s.cat}`,
        type: "category_spike",
        title: `Despesas subiram em ${s.cat}`,
        description:
          s.pct === null
            ? `Este mes voce ja gastou ${Math.round(s.thisVal)}. No mes passado foi zero.`
            : `Aumento de ${(s.pct * 100).toFixed(0)}% vs mes passado (+R$ ${Math.round(s.delta)}).`,
        potentialSavingsMonthly: Math.max(0, potential),
        confidence,
        actionLabel: "Analisar",
        actionUrl: "/transactions",
      });
    }

    // 3) Uncategorized expenses (operational hygiene)
    const uncategorizedCount = expenses90.filter((t: any) => {
      const c = String(t.category || "").trim().toLowerCase();
      return c === "" || c === "uncategorized" || c === "sem categoria";
    }).length;

    if (uncategorizedCount >= 10) {
      items.push({
        id: "uncategorized",
        type: "uncategorized",
        title: "Muitas despesas sem categoria",
        description: `Existem ${uncategorizedCount} transacoes sem categoria nos ultimos 90 dias. Isso atrapalha alertas e previsao.`,
        potentialSavingsMonthly: 0,
        confidence: 80,
        actionLabel: "Auto-categorizar",
        actionUrl: "/transactions",
      });
    }

    return items.sort((a, b) => b.potentialSavingsMonthly - a.potentialSavingsMonthly);
  }, [transactions]);

  const totals = useMemo(() => {
    const potential = opportunities.reduce((s, o) => s + (Number(o.potentialSavingsMonthly) || 0), 0);
    // For "spend analyzed", sum only recurring baseline (avoid double counting category spikes).
    const analyzed = opportunities
      .filter((o) => o.type === "recurring_expense")
      .reduce((s, o) => s + (Number(o.potentialSavingsMonthly) || 0) * 10, 0); // inverse of 10% heuristic
    return { potentialSavingsMonthly: potential, analyzedSpendMonthly: analyzed };
  }, [opportunities]);

  return { opportunities, totals, isLoading };
}

