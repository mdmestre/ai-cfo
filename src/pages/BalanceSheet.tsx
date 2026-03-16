import { AppLayout } from "@/components/layout/AppLayout";
import { useAccounting } from "@/hooks/use-accounting";
import { useReportHashes } from "@/hooks/use-report-hashes";
import { useMemo, useState } from "react";
import { Loader2, Scale, Download } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

function formatCurrency(val: number) {
  return `R$ ${val.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function BalanceSheet() {
  const { journalEntries, accounts, periods, isLoading } = useAccounting();
  const { registerReportHash } = useReportHashes();
  const [selectedPeriod, setSelectedPeriod] = useState<string>("all"); // Ideally, balance sheet includes ALL entries UP TO the period date. 

  // Balanço é acumulado. Se filtrarmos um período, pegaremos tudo até o fim daquele período.
  // Para simplificar o MVP, se "all" pega tudo. Se um período for escolhido, pegamos até a data de fim do período.
  const balanceData = useMemo(() => {
    if (!journalEntries.data || !accounts.data) return null;

    let filteredEntries = journalEntries.data;
    if (selectedPeriod !== "all") {
      const period = periods.data?.find(p => p.id === selectedPeriod);
      if (period) {
        const endDate = new Date(period.period_end).getTime();
        filteredEntries = filteredEntries.filter(entry => new Date(entry.entry_date).getTime() <= endDate);
      }
    }

    let totalAsset = 0;
    let totalLiability = 0;
    let totalEquity = 0;

    const assetAccounts: Record<string, number> = {};
    const liabilityAccounts: Record<string, number> = {};
    const equityAccounts: Record<string, number> = {};

    filteredEntries.forEach(entry => {
      if (!entry.journal_lines) return;
      
      entry.journal_lines.forEach(line => {
        const acc = accounts.data.find(a => a.id === line.account_id);
        if (!acc) return;

        const debit = Number(line.debit || 0);
        const credit = Number(line.credit || 0);

        if (acc.account_type === "asset") {
          // Asset: Debit increases, Credit decreases
          const val = debit - credit;
          totalAsset += val;
          assetAccounts[acc.name] = (assetAccounts[acc.name] || 0) + val;
        } else if (acc.account_type === "liability") {
          // Liability: Credit increases, Debit decreases
          const val = credit - debit;
          totalLiability += val;
          liabilityAccounts[acc.name] = (liabilityAccounts[acc.name] || 0) + val;
        } else if (acc.account_type === "equity") {
          // Equity: Credit increases, Debit decreases
          const val = credit - debit;
          totalEquity += val;
          equityAccounts[acc.name] = (equityAccounts[acc.name] || 0) + val;
        }
      });
    });

    const isBalanced = Math.abs(totalAsset - (totalLiability + totalEquity)) < 0.01;

    return {
      totalAsset,
      totalLiability,
      totalEquity,
      assetAccounts,
      liabilityAccounts,
      equityAccounts,
      isBalanced
    };
  }, [journalEntries.data, accounts.data, periods.data, selectedPeriod]);

  const downloadJson = (filename: string, obj: unknown) => {
    const blob = new Blob([JSON.stringify(obj, null, 2)], { type: "application/json;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExport = async () => {
    if (!balanceData) return toast.error("Sem dados para exportar.");

    const period = selectedPeriod !== "all" ? periods.data?.find((p) => p.id === selectedPeriod) : null;
    const payload = {
      report_type: "balance_sheet",
      generated_at: new Date().toISOString(),
      position_until: period ? String(period.period_end) : new Date().toISOString().slice(0, 10),
      period: period ? { id: period.id, period_start: period.period_start, period_end: period.period_end } : null,
      data: balanceData,
    };

    try {
      const hash = await registerReportHash({
        report_type: "balance_sheet",
        period_start: period ? String(period.period_start) : null,
        period_end: period ? String(period.period_end) : null,
        payload,
      });

      const suffix = period ? String(period.period_end) : "today";
      downloadJson(`balance-sheet-${suffix}.json`, payload);

      toast.success("Relatorio exportado e assinado", { description: `SHA-256: ${hash.slice(0, 12)}…` });
    } catch (e: any) {
      toast.error(e?.message || "Falha ao exportar/assinar relatorio");
    }
  };

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
      <div className="max-w-[1200px] mx-auto space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-foreground tracking-tight">Balanço Patrimonial</h1>
            <p className="mt-0.5 text-[13px] text-muted-foreground">Visão consolidada do Ativo, Passivo e Patrimônio Líquido</p>
          </div>
          <div className="flex items-center gap-3">
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className="w-[180px] h-9 text-[13px]">
                <SelectValue placeholder="Posição até..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Posição Atual (Hoje)</SelectItem>
                {periods.data?.map(p => (
                  <SelectItem key={p.id} value={p.id}>
                    Até {format(new Date(p.period_end), "dd/MM/yyyy")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <button
              onClick={handleExport}
              className="flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-[13px] font-medium text-foreground hover:bg-secondary"
            >
              <Download className="h-3.5 w-3.5" /> Exportar
            </button>
          </div>
        </div>

        {balanceData && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Lado do Ativo */}
            <div className="metric-card space-y-6">
              <div className="flex items-center gap-2 mb-2 pb-2 border-b border-border">
                <Scale className="h-5 w-5 text-primary" />
                <h2 className="text-[15px] font-bold">Ativo (Aplicações)</h2>
              </div>

              <div className="space-y-4 text-[13px]">
                <div className="space-y-1">
                  <div className="flex justify-between font-bold text-foreground">
                    <span>Total Ativo</span>
                    <span>{formatCurrency(balanceData.totalAsset)}</span>
                  </div>
                  <div className="pt-2"></div>
                  {Object.entries(balanceData.assetAccounts).map(([name, val]) => (
                    <div key={name} className="flex justify-between text-muted-foreground pl-2">
                      <span>{name}</span>
                      <span>{formatCurrency(val)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Lado do Passivo e PL */}
            <div className="metric-card space-y-6">
              <div className="flex items-center gap-2 mb-2 pb-2 border-b border-border">
                <Scale className="h-5 w-5 text-primary opacity-50" />
                <h2 className="text-[15px] font-bold">Passivo + PL (Origens)</h2>
              </div>

              <div className="space-y-4 text-[13px]">
                {/* PASSIVO */}
                <div className="space-y-1">
                  <div className="flex justify-between font-bold text-foreground">
                    <span>Total Passivo</span>
                    <span>{formatCurrency(balanceData.totalLiability)}</span>
                  </div>
                  <div className="pt-2"></div>
                  {Object.entries(balanceData.liabilityAccounts).map(([name, val]) => (
                    <div key={name} className="flex justify-between text-muted-foreground pl-2">
                      <span>{name}</span>
                      <span>{formatCurrency(val)}</span>
                    </div>
                  ))}
                </div>

                <div className="border-t border-border my-4"></div>

                {/* PATRIMÔNIO LÍQUIDO */}
                <div className="space-y-1 pt-2">
                  <div className="flex justify-between font-bold text-foreground">
                    <span>Patrimônio Líquido</span>
                    <span>{formatCurrency(balanceData.totalEquity)}</span>
                  </div>
                  <div className="pt-2"></div>
                  {Object.entries(balanceData.equityAccounts).map(([name, val]) => (
                    <div key={name} className="flex justify-between text-muted-foreground pl-2">
                      <span>{name}</span>
                      <span>{formatCurrency(val)}</span>
                    </div>
                  ))}
                </div>

                {/* TOTAL PASSIVO + PL */}
                <div className="flex justify-between font-bold text-[15px] pt-4 border-t-2 border-border mt-4">
                  <span>(=) Total Passivo + PL</span>
                  <span>{formatCurrency(balanceData.totalLiability + balanceData.totalEquity)}</span>
                </div>
              </div>
            </div>

            {/* Equação de Balanço */}
            <div className="col-span-full">
              <div className={`p-3 rounded-lg flex items-center justify-between text-[13px] font-bold ${balanceData.isBalanced ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'}`}>
                <span>Equação Fundamental da Contabilidade:</span>
                <span>Ativo ({formatCurrency(balanceData.totalAsset)}) = Passivo + PL ({formatCurrency(balanceData.totalLiability + balanceData.totalEquity)})</span>
                <span>{balanceData.isBalanced ? "✓ BALANÇO EQUILIBRADO" : "✗ DIFERENÇA ENCONTRADA"}</span>
              </div>
            </div>

          </div>
        )}
      </div>
    </AppLayout>
  );
}
