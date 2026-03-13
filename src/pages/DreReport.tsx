import { AppLayout } from "@/components/layout/AppLayout";
import { useAccounting } from "@/hooks/use-accounting";
import { useMemo, useState } from "react";
import { Loader2, Activity, Download } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

function formatCurrency(val: number) {
  return `R$ ${val.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function DreReport() {
  const { journalEntries, accounts, periods, isLoading } = useAccounting();
  const [selectedPeriod, setSelectedPeriod] = useState<string>("all");

  const dreData = useMemo(() => {
    if (!journalEntries.data || !accounts.data) return null;

    let filteredEntries = journalEntries.data;
    if (selectedPeriod !== "all") {
      filteredEntries = filteredEntries.filter(entry => entry.accounting_period_id === selectedPeriod);
    }

    let totalRevenue = 0;
    let totalCost = 0;
    let totalExpense = 0;

    const revenueAccounts: Record<string, number> = {};
    const costAccounts: Record<string, number> = {};
    const expenseAccounts: Record<string, number> = {};

    filteredEntries.forEach(entry => {
      if (!entry.journal_lines) return;
      
      entry.journal_lines.forEach(line => {
        const acc = accounts.data.find(a => a.id === line.account_id);
        if (!acc) return;

        const debit = Number(line.debit || 0);
        const credit = Number(line.credit || 0);

        if (acc.account_type === "revenue") {
          // Revenue: Credit increases, Debit decreases
          const val = credit - debit;
          totalRevenue += val;
          revenueAccounts[acc.name] = (revenueAccounts[acc.name] || 0) + val;
        } else if (acc.account_type === "cost") {
          // Cost: Debit increases, Credit decreases
          const val = debit - credit;
          totalCost += val;
          costAccounts[acc.name] = (costAccounts[acc.name] || 0) + val;
        } else if (acc.account_type === "expense") {
          // Expense: Debit increases, Credit decreases
          const val = debit - credit;
          totalExpense += val;
          expenseAccounts[acc.name] = (expenseAccounts[acc.name] || 0) + val;
        }
      });
    });

    const grossProfit = totalRevenue - totalCost;
    const netProfit = grossProfit - totalExpense;
    const margin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

    return {
      totalRevenue,
      totalCost,
      totalExpense,
      grossProfit,
      netProfit,
      margin,
      revenueAccounts,
      costAccounts,
      expenseAccounts,
    };
  }, [journalEntries.data, accounts.data, selectedPeriod]);

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
      <div className="max-w-[1000px] mx-auto space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-foreground tracking-tight">Demonstração do Resultado (DRE)</h1>
            <p className="mt-0.5 text-[13px] text-muted-foreground">Avaliação de Receitas e Despesas calculada em tempo real</p>
          </div>
          <div className="flex items-center gap-3">
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className="w-[180px] h-9 text-[13px]">
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todo o histórico</SelectItem>
                {periods.data?.map(p => (
                  <SelectItem key={p.id} value={p.id}>
                    {format(new Date(p.period_start), "MMM / yyyy", { locale: ptBR }).toUpperCase()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <button className="flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-[13px] font-medium text-foreground hover:bg-secondary">
              <Download className="h-3.5 w-3.5" /> Exportar
            </button>
          </div>
        </div>

        {dreData && (
          <div className="metric-card space-y-6">
            <div className="flex items-center gap-2 mb-2 pb-2 border-b border-border">
              <Activity className="h-5 w-5 text-primary" />
              <h2 className="text-[15px] font-bold">Resumo do Período</h2>
            </div>

            <div className="space-y-4 text-[13px]">
              {/* Receitas Brutas */}
              <div className="space-y-1">
                <div className="flex justify-between font-bold text-success">
                  <span>(+) Receita Bruta</span>
                  <span>{formatCurrency(dreData.totalRevenue)}</span>
                </div>
                {Object.entries(dreData.revenueAccounts).map(([name, val]) => (
                  <div key={name} className="flex justify-between text-muted-foreground pl-4">
                    <span>{name}</span>
                    <span>{formatCurrency(val)}</span>
                  </div>
                ))}
              </div>

              {/* Custos */}
              <div className="space-y-1">
                <div className="flex justify-between font-bold text-destructive">
                  <span>(-) Custos (CPV/CSV)</span>
                  <span>{formatCurrency(dreData.totalCost)}</span>
                </div>
                {Object.entries(dreData.costAccounts).map(([name, val]) => (
                  <div key={name} className="flex justify-between text-muted-foreground pl-4">
                    <span>{name}</span>
                    <span>{formatCurrency(val)}</span>
                  </div>
                ))}
              </div>

              {/* Lucro Bruto */}
              <div className="flex justify-between font-bold text-[14px] pt-2 border-t border-border">
                <span>(=) Lucro Bruto</span>
                <span>{formatCurrency(dreData.grossProfit)}</span>
              </div>

              {/* Despesas */}
              <div className="space-y-1 pt-2">
                <div className="flex justify-between font-bold text-destructive">
                  <span>(-) Despesas Operacionais</span>
                  <span>{formatCurrency(dreData.totalExpense)}</span>
                </div>
                {Object.entries(dreData.expenseAccounts).map(([name, val]) => (
                  <div key={name} className="flex justify-between text-muted-foreground pl-4">
                    <span>{name}</span>
                    <span>{formatCurrency(val)}</span>
                  </div>
                ))}
              </div>

              {/* Lucro Líquido */}
              <div className="flex justify-between font-bold text-[16px] pt-4 border-t-2 border-border mt-4">
                <span>(=) Resultado Líquido</span>
                <span className={dreData.netProfit >= 0 ? "text-success" : "text-destructive"}>
                  {formatCurrency(dreData.netProfit)}
                </span>
              </div>
              
              <div className="flex justify-between text-muted-foreground pt-1">
                <span>Margem Líquida</span>
                <span>{dreData.margin.toFixed(2)}%</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
