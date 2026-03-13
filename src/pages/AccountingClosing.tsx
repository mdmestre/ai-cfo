import { AppLayout } from "@/components/layout/AppLayout";
import { useAccounting } from "@/hooks/use-accounting";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2, Plus, Lock, Unlock, Key, Bot, CheckCircle } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const mockAiSuggestions = [
  { id: "1", description: "Provisão de 13º Salário", amount: 15400.00, account_debit: "Despesas com Pessoal", account_credit: "Provisões Trabalhistas (Passivo)" },
  { id: "2", description: "Depreciação de Equipamentos de TI", amount: 2350.50, account_debit: "Despesa de Depreciação", account_credit: "Depreciação Acumulada (Ativo)" },
  { id: "3", description: "Ajuste de Variação Cambial", amount: 890.20, account_debit: "Variação Cambial Passiva", account_credit: "Fornecedores Estrangeiros" },
];

export default function AccountingClosing() {
  const { periods, createPeriod, updatePeriodStatus, isLoading } = useAccounting();
  const [showForm, setShowForm] = useState(false);
  const [showAiDialog, setShowAiDialog] = useState(false);
  const [selectedPeriodForAi, setSelectedPeriodForAi] = useState<string | null>(null);
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const [form, setForm] = useState({
    period_start: "",
    period_end: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.period_start > form.period_end) {
      toast.error("Data de início não pode ser maior que a data de fim.");
      return;
    }

    try {
      await createPeriod.mutateAsync(form);
      toast.success("Período contábil criado com sucesso!");
      setForm({ period_start: "", period_end: "" });
      setShowForm(false);
    } catch (err: any) {
      toast.error(err.message || "Erro ao criar período.");
    }
  };

  const handleStatusChange = async (id: string, newStatus: "open" | "closing" | "closed") => {
    try {
      await updatePeriodStatus.mutateAsync({ id, status: newStatus });
      toast.success(`Período alterado para ${newStatus}`);
    } catch (err: any) {
      toast.error(err.message || "Erro ao atualizar período.");
    }
  };

  const handleRunAiClosing = (id: string) => {
    setSelectedPeriodForAi(id);
    setIsAiProcessing(true);
    setShowAiDialog(true);
    
    // Simula tempo de processamento da IA
    setTimeout(() => {
      setIsAiProcessing(false);
    }, 2000);
  };

  const handleApproveAiSuggestions = () => {
    toast.success("Lançamentos da IA aprovados e registrados com sucesso no diário!");
    setShowAiDialog(false);
    setSelectedPeriodForAi(null);
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
      <div className="max-w-[1200px] space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-foreground tracking-tight">Fechamento Contábil</h1>
            <p className="mt-0.5 text-[13px] text-muted-foreground">Gerenciamento de períodos para travamento do DRE/Balanço</p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-[13px] font-medium text-primary-foreground hover:opacity-90 transition-opacity"
          >
            <Plus className="h-3.5 w-3.5" /> Abrir Novo Período
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleSubmit} className="metric-card space-y-4 animate-slide-up bg-card w-full sm:w-1/2">
            <h3 className="text-[14px] font-bold text-foreground">Abrir Período</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <Label className="text-[11px] text-muted-foreground">Início do Período</Label>
                <Input type="date" value={form.period_start} onChange={e => setForm({...form, period_start: e.target.value})} required className="h-9 text-[13px]" />
              </div>
              <div className="space-y-1">
                <Label className="text-[11px] text-muted-foreground">Fim do Período</Label>
                <Input type="date" value={form.period_end} onChange={e => setForm({...form, period_end: e.target.value})} required className="h-9 text-[13px]" />
              </div>
            </div>
            <div className="flex justify-end pt-4">
              <button type="submit" disabled={createPeriod.isPending} className="rounded-md bg-foreground px-4 py-2 text-[13px] font-medium text-background hover:opacity-90 disabled:opacity-50">
                {createPeriod.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Abrir Período"}
              </button>
            </div>
          </form>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {periods.data?.length === 0 ? (
            <div className="col-span-full p-8 text-center text-muted-foreground border border-dashed rounded-lg bg-secondary/10">
              <Lock className="h-8 w-8 mb-2 opacity-20 mx-auto" />
              Nenhum período contábil registrado.
            </div>
          ) : (
            periods.data?.map(period => (
              <div key={period.id} className="metric-card border border-border bg-card group">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-[15px] font-bold text-foreground">
                      {format(new Date(period.period_start), "MMM / yyyy", { locale: ptBR }).toUpperCase()}
                    </h3>
                    <p className="text-[12px] text-muted-foreground">
                      {format(new Date(period.period_start), "dd/MM/yyyy")} a {format(new Date(period.period_end), "dd/MM/yyyy")}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold uppercase
                      ${period.status === "open" ? "bg-success/10 text-success" : 
                        period.status === "closing" ? "bg-warning/10 text-warning" : 
                        "bg-destructive/10 text-destructive"}
                    `}>
                      {period.status === "open" ? "Aberto" : period.status === "closing" ? "Em Fechamento" : "Fechado"}
                    </span>
                  </div>
                </div>

                <div className="pt-4 border-t border-border flex items-center justify-between">
                  <div className="flex gap-2">
                    {period.status === "open" && (
                      <button onClick={() => handleStatusChange(period.id, "closing")} className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold rounded bg-secondary text-foreground hover:bg-secondary/80">
                        <Key className="h-3 w-3" /> Iniciar Fechamento
                      </button>
                    )}
                    {period.status === "closing" && (
                      <>
                        <button onClick={() => handleStatusChange(period.id, "closed")} className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold rounded bg-destructive text-destructive-foreground hover:bg-destructive/90">
                          <Lock className="h-3 w-3" /> Travar Período
                        </button>
                        <button onClick={() => handleStatusChange(period.id, "open")} className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold rounded border border-border text-muted-foreground hover:bg-secondary">
                          <Unlock className="h-3 w-3" /> Reabrir
                        </button>
                      </>
                    )}
                  </div>
                  {period.status !== "closed" && (
                    <button onClick={() => handleRunAiClosing(period.id)} className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold rounded bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
                      <Bot className="h-3 w-3" /> Fechamento IA
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        <Dialog open={showAiDialog} onOpenChange={setShowAiDialog}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Bot className="h-5 w-5 text-primary" />
                CFO Copilot: Sugestões de Fechamento
              </DialogTitle>
            </DialogHeader>
            <div className="pt-4">
              {isAiProcessing ? (
                <div className="flex flex-col items-center justify-center py-12 space-y-4">
                  <div className="relative">
                    <div className="absolute inset-0 rounded-full blur-xl bg-primary/20 animate-pulse"></div>
                    <Bot className="h-12 w-12 text-primary relative animate-bounce" />
                  </div>
                  <div className="text-center">
                    <h3 className="text-[15px] font-bold text-foreground">Analisando o período...</h3>
                    <p className="text-[13px] text-muted-foreground mt-1">
                      Processando faturas, reconhecendo competências e calculando depreciações em lote.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="p-3 rounded-lg bg-info/10 text-info text-[13px] border border-info/20">
                    A IA analisou suas transações financeiras e notas fiscais emitidas no período e encontrou 3 registros que necessitam de aprovação para compor a contabilidade gerencial.
                  </div>

                  <div className="border border-border rounded-lg overflow-hidden">
                    <table className="w-full text-[13px] text-left">
                      <thead className="bg-muted/30 border-b border-border">
                        <tr>
                          <th className="p-3 font-medium">Lançamento Sugerido</th>
                          <th className="p-3 font-medium">Conta Débito</th>
                          <th className="p-3 font-medium">Conta Crédito</th>
                          <th className="p-3 font-medium text-right">Valor (R$)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {mockAiSuggestions.map((sug) => (
                          <tr key={sug.id} className="border-b border-border last:border-0 hover:bg-muted/10">
                            <td className="p-3 font-medium">{sug.description}</td>
                            <td className="p-3 text-muted-foreground">{sug.account_debit}</td>
                            <td className="p-3 text-muted-foreground">{sug.account_credit}</td>
                            <td className="p-3 text-right font-mono">{sug.amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex justify-end gap-3 pt-2">
                    <button onClick={() => setShowAiDialog(false)} className="px-4 py-2 rounded-md border border-border text-[13px] font-medium hover:bg-secondary">
                      Ignorar Sugestões
                    </button>
                    <button onClick={handleApproveAiSuggestions} className="px-4 py-2 rounded-md bg-foreground text-background text-[13px] font-medium hover:opacity-90 flex items-center gap-2">
                      <CheckCircle className="h-4 w-4" /> Aprovar Lançamentos
                    </button>
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
