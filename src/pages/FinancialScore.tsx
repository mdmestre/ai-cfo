import { AppLayout } from "@/components/layout/AppLayout";
import { useAccounts } from "@/hooks/use-accounts";
import { useInvoices } from "@/hooks/use-invoices";
import { useTransactions } from "@/hooks/use-transactions";
import { useWallets } from "@/hooks/use-wallets";
import { formatBRLCompact } from "@/lib/format";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from "recharts";
import { useMemo } from "react";
import { format, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ShieldCheck, TrendingUp, TrendingDown, Wallet, Scale } from "lucide-react";

function clamp01(x: number) {
  return Math.max(0, Math.min(1, x));
}

function scoreLiquidity(runwayMonths: number) {
  if (!Number.isFinite(runwayMonths)) return 90;
  if (runwayMonths >= 12) return 100;
  if (runwayMonths >= 6) return 80;
  if (runwayMonths >= 3) return 60;
  if (runwayMonths >= 1) return 40;
  return 20;
}

function scoreMargin(margin: number | null) {
  if (margin === null) return 0;
  if (margin >= 0.2) return 100;
  if (margin >= 0.1) return 80;
  if (margin >= 0) return 60;
  if (margin >= -0.1) return 40;
  return 20;
}

function scoreGrowth(growth: number | null) {
  if (growth === null) return 0;
  if (growth >= 0.15) return 100;
  if (growth >= 0.05) return 80;
  if (growth >= 0) return 65;
  if (growth >= -0.1) return 45;
  return 25;
}

function scoreDebt(openPayables: number, monthlyRevenue: number) {
  if (monthlyRevenue <= 0) return openPayables > 0 ? 30 : 60;
  const ratio = openPayables / monthlyRevenue; // how many months of revenue are already committed
  if (ratio <= 0.25) return 90;
  if (ratio <= 0.5) return 75;
  if (ratio <= 1) return 55;
  return 35;
}

function scoreLabel(score: number) {
  if (score >= 80) return "Excelente";
  if (score >= 60) return "Boa";
  if (score >= 40) return "Regular";
  return "Critica";
}

export default function FinancialScore() {
  const { totalBalance, isLoading: accLoading } = useAccounts();
  const { totalWalletBalance, isLoading: walletLoading } = useWallets();
  const { transactions, monthlyRevenue, monthlyExpenses, isLoading: txLoading } = useTransactions();
  const { payables } = useInvoices();

  const openStatuses = useMemo(() => new Set(["open", "pending", "partial"]), []);
  const openPayables = (payables.data || [])
    .filter((p: any) => openStatuses.has(String(p.status || "").toLowerCase()))
    .reduce((s: number, p: any) => s + Number(p.amount || 0), 0);

  const cash = totalBalance + totalWalletBalance;
  const profit = monthlyRevenue - monthlyExpenses;
  const margin = monthlyRevenue > 0 ? profit / monthlyRevenue : null;

  const lastMonthRevenue = useMemo(() => {
    const d = subMonths(new Date(), 1);
    return transactions
      .filter((t: any) => {
        const td = new Date(t.date);
        return td.getMonth() === d.getMonth() && td.getFullYear() === d.getFullYear() && Number(t.amount) > 0;
      })
      .reduce((s: number, t: any) => s + Number(t.amount), 0);
  }, [transactions]);

  const growth = lastMonthRevenue > 0 ? (monthlyRevenue - lastMonthRevenue) / lastMonthRevenue : null;

  const runwayMonths = monthlyExpenses > 0 ? cash / monthlyExpenses : Infinity;

  const factors = useMemo(() => {
    const liquidity = scoreLiquidity(runwayMonths);
    const marginScoreVal = scoreMargin(margin);
    const growthScoreVal = scoreGrowth(growth);
    const debt = scoreDebt(openPayables, monthlyRevenue);

    const overall = Math.round(liquidity * 0.35 + marginScoreVal * 0.25 + growthScoreVal * 0.2 + debt * 0.2);

    return {
      overall,
      liquidity,
      margin: marginScoreVal,
      growth: growthScoreVal,
      debt,
    };
  }, [growth, margin, monthlyRevenue, openPayables, runwayMonths]);

  const history = useMemo(() => {
    return Array.from({ length: 6 }, (_, i) => {
      const d = subMonths(new Date(), 5 - i);
      const monthTx = transactions.filter((t: any) => {
        const td = new Date(t.date);
        return td.getMonth() === d.getMonth() && td.getFullYear() === d.getFullYear();
      });
      const rev = monthTx.filter((t: any) => Number(t.amount) > 0).reduce((s: number, t: any) => s + Number(t.amount), 0);
      const exp = monthTx.filter((t: any) => Number(t.amount) < 0).reduce((s: number, t: any) => s + Math.abs(Number(t.amount)), 0);
      const prof = rev - exp;
      const m = rev > 0 ? prof / rev : null;

      // Very rough: use current cash + net as proxy (MVP) to avoid reconstructing historical balance.
      const runway = exp > 0 ? clamp01((cash / exp) / 12) : 0.75;
      const liq = Math.round(runway * 100);
      const marg = scoreMargin(m);
      const ov = Math.round(liq * 0.35 + marg * 0.65);

      return { month: format(d, "MMM", { locale: ptBR }), score: ov };
    });
  }, [cash, transactions]);

  const isLoading = accLoading || walletLoading || txLoading || payables.isLoading;

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-[13px] text-muted-foreground">Carregando...</div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-[1120px] space-y-6">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-accent" />
            <h1 className="text-xl font-semibold text-foreground">Saude Financeira</h1>
          </div>
          <p className="mt-0.5 text-[13px] text-muted-foreground">
            Um score simples para acompanhar liquidez, margem, crescimento e endividamento.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
          <div className="metric-card animate-slide-up">
            <p className="section-label">Score</p>
            <p className="mt-3 text-[36px] font-bold text-foreground leading-none tabular-nums">{factors.overall}</p>
            <p className="mt-2 text-[13px] font-semibold text-muted-foreground">{scoreLabel(factors.overall)}</p>
            <div className="mt-4 grid grid-cols-2 gap-2 text-[12px] text-muted-foreground">
              <div className="rounded-lg bg-secondary/20 p-3">
                <p className="text-xxs font-bold uppercase tracking-wider">Caixa</p>
                <p className="mt-1 font-semibold text-foreground">{formatBRLCompact(cash)}</p>
              </div>
              <div className="rounded-lg bg-secondary/20 p-3">
                <p className="text-xxs font-bold uppercase tracking-wider">Runway</p>
                <p className="mt-1 font-semibold text-foreground">{Number.isFinite(runwayMonths) ? `${runwayMonths.toFixed(1)} meses` : "Ilimitado"}</p>
              </div>
            </div>
          </div>

          <div className="metric-card animate-slide-up lg:col-span-2">
            <p className="section-label mb-3">Historico (6 meses)</p>
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={history} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                  <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                  <Tooltip formatter={(value: number) => [`${value}/100`, "Score"]} />
                  <Bar dataKey="score" fill="hsl(var(--foreground))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 lg:grid-cols-4">
          <div className="metric-card animate-slide-up">
            <div className="flex items-center justify-between">
              <p className="section-label">Liquidez</p>
              <Wallet className="h-4 w-4 text-muted-foreground/60" />
            </div>
            <p className="mt-3 text-[28px] font-bold text-foreground tabular-nums">{factors.liquidity}</p>
            <p className="mt-1 text-[12px] text-muted-foreground">Baseado no runway (meses de caixa).</p>
          </div>

          <div className="metric-card animate-slide-up">
            <div className="flex items-center justify-between">
              <p className="section-label">Margem</p>
              <TrendingUp className="h-4 w-4 text-muted-foreground/60" />
            </div>
            <p className="mt-3 text-[28px] font-bold text-foreground tabular-nums">{factors.margin}</p>
            <p className="mt-1 text-[12px] text-muted-foreground">
              {margin === null ? "Sem dados" : `Margem do mes: ${(margin * 100).toFixed(0)}%`}
            </p>
          </div>

          <div className="metric-card animate-slide-up">
            <div className="flex items-center justify-between">
              <p className="section-label">Crescimento</p>
              <TrendingDown className="h-4 w-4 text-muted-foreground/60" />
            </div>
            <p className="mt-3 text-[28px] font-bold text-foreground tabular-nums">{factors.growth}</p>
            <p className="mt-1 text-[12px] text-muted-foreground">
              {growth === null ? "Sem historico suficiente" : `Receita vs mes anterior: ${(growth * 100).toFixed(0)}%`}
            </p>
          </div>

          <div className="metric-card animate-slide-up">
            <div className="flex items-center justify-between">
              <p className="section-label">Endividamento</p>
              <Scale className="h-4 w-4 text-muted-foreground/60" />
            </div>
            <p className="mt-3 text-[28px] font-bold text-foreground tabular-nums">{factors.debt}</p>
            <p className="mt-1 text-[12px] text-muted-foreground">
              A pagar (aberto): {formatBRLCompact(openPayables)}
            </p>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

