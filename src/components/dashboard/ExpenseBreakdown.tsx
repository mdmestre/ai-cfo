import { PieChart } from "lucide-react";
import { formatBRLCompact } from "@/lib/format";

interface Expense {
  amount: number;
  expense_categories?: { name: string; code: string } | null;
  status: string;
}

const COLORS = [
  "bg-primary",
  "bg-success",
  "bg-warning",
  "bg-destructive",
  "bg-info",
  "bg-muted-foreground",
];

export function ExpenseBreakdown({ expenses }: { expenses: Expense[] }) {
  // Group by category
  const byCategory = expenses.reduce<Record<string, number>>((acc, e) => {
    const cat = e.expense_categories?.name || "Sem categoria";
    acc[cat] = (acc[cat] || 0) + Number(e.amount);
    return acc;
  }, {});

  const sorted = Object.entries(byCategory)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);

  const total = sorted.reduce((s, [, v]) => s + v, 0);

  return (
    <div className="metric-card animate-slide-up">
      <div className="flex items-center gap-2 mb-4">
        <PieChart className="h-3.5 w-3.5 text-muted-foreground" />
        <p className="text-[13px] font-medium text-muted-foreground">Despesas por categoria</p>
      </div>
      {sorted.length > 0 ? (
        <>
          {/* Bar visualization */}
          <div className="flex h-3 rounded-full overflow-hidden mb-4">
            {sorted.map(([cat, amount], i) => (
              <div
                key={cat}
                className={`${COLORS[i % COLORS.length]} transition-all`}
                style={{ width: `${(amount / total) * 100}%` }}
              />
            ))}
          </div>
          <div className="space-y-2">
            {sorted.map(([cat, amount], i) => (
              <div key={cat} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${COLORS[i % COLORS.length]}`} />
                  <span className="text-[12px] text-muted-foreground">{cat}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[12px] font-medium text-foreground">{formatBRLCompact(amount)}</span>
                  <span className="text-[11px] text-muted-foreground w-8 text-right">
                    {Math.round((amount / total) * 100)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <p className="text-[13px] text-muted-foreground py-8 text-center">Nenhuma despesa registrada ainda.</p>
      )}
    </div>
  );
}
