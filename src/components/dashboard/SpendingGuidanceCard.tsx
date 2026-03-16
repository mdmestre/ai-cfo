import { Shield, Gauge, Flame } from "lucide-react";
import { formatBRLNoCents } from "@/lib/format";

export function SpendingGuidanceCard({
  currentCash,
  monthlyBurn,
}: {
  currentCash: number;
  monthlyBurn: number;
}) {
  const burn = Math.max(0, Number(monthlyBurn) || 0);
  const cash = Number.isFinite(currentCash) ? currentCash : 0;

  // Extra monthly spend that keeps runway above the target (in months).
  const extraForTarget = (targetMonths: number) => {
    if (targetMonths <= 0) return 0;
    const maxBurn = cash / targetMonths;
    return Math.max(0, maxBurn - burn);
  };

  const safe = extraForTarget(6);
  const moderate = extraForTarget(4);
  const risky = extraForTarget(2);

  const items = [
    { label: "Seguro", value: safe, icon: Shield, hint: ">= 6 meses" },
    { label: "Moderado", value: moderate, icon: Gauge, hint: ">= 4 meses" },
    { label: "Arriscado", value: risky, icon: Flame, hint: ">= 2 meses" },
  ] as const;

  return (
    <div className="metric-card animate-slide-up">
      <div className="flex items-center justify-between mb-4">
        <p className="section-label">Quanto posso gastar por mes?</p>
        <span className="text-xxs text-muted-foreground">Guia rapido</span>
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        {items.map((it) => (
          <div key={it.label} className="rounded-lg border border-border/60 bg-secondary/20 p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <it.icon className="h-3.5 w-3.5 text-muted-foreground" />
                <p className="text-[12px] font-semibold text-foreground">{it.label}</p>
              </div>
              <span className="text-xxs text-muted-foreground">{it.hint}</span>
            </div>
            <p className="mt-2 text-[16px] font-bold text-foreground tabular-nums">
              {formatBRLNoCents(it.value)}
            </p>
          </div>
        ))}
      </div>

      <p className="mt-3 text-[11px] text-muted-foreground">
        Baseado no seu caixa atual e na queima media mensal. Use como referencia para orcar marketing, contratacoes e projetos.
      </p>
    </div>
  );
}

