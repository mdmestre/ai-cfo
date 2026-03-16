import { AppLayout } from "@/components/layout/AppLayout";
import { useFiscal } from "@/hooks/use-fiscal";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2, Calculator, Plus, CheckCircle, Clock, Sparkles } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { formatBRL } from "@/lib/format";

export default function TaxesApurations() {
  const {
    apurations,
    createApuration,
    updateApurationStatus,
    generateApurationsForPeriod,
    isLoading,
  } = useFiscal();

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    period: format(new Date(), "yyyy-MM"),
    tax_type: "Simples Nacional",
    amount_due: "",
    due_date: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createApuration.mutateAsync({
        ...form,
        amount_due: Number(form.amount_due) || 0,
        amount_paid: 0,
        status: "open",
      });
      toast.success("Guia registrada com sucesso!");
      setForm({ ...form, amount_due: "", due_date: "" });
      setShowForm(false);
    } catch (err: any) {
      toast.error(err.message || "Erro ao registrar guia.");
    }
  };

  const handlePay = async (id: string, amount_due: number) => {
    try {
      await updateApurationStatus.mutateAsync({ id, status: "paid", amount_paid: amount_due });
      toast.success("Guia marcada como paga!");
    } catch (err: any) {
      toast.error(err.message || "Erro ao atualizar guia.");
    }
  };

  const handleAutoEstimate = async () => {
    try {
      await generateApurationsForPeriod.mutateAsync({ period: form.period, simplesRate: 0.06 });
      toast.success("Estimativa automatica gerada!", {
        description: "Criamos/atualizamos Simples Nacional (DAS) para o periodo selecionado.",
      });
    } catch (err: any) {
      toast.error(err.message || "Erro ao gerar estimativa.");
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
      <div className="max-w-[1200px] space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-foreground tracking-tight">Impostos</h1>
            <p className="mt-0.5 text-[13px] text-muted-foreground">
              Estimativa automatica e controle de guias (DAS/DARF)
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleAutoEstimate}
              disabled={generateApurationsForPeriod.isPending}
              className="flex items-center gap-2 rounded-md border border-border bg-card px-3 py-1.5 text-[13px] font-semibold text-foreground hover:bg-secondary transition-colors disabled:opacity-50"
              title="Gera/atualiza uma estimativa automatica do periodo"
            >
              {generateApurationsForPeriod.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              Gerar estimativa
            </button>

            <button
              onClick={() => setShowForm(!showForm)}
              className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-[13px] font-medium text-primary-foreground hover:opacity-90 transition-opacity"
            >
              <Plus className="h-3.5 w-3.5" /> Nova guia (manual)
            </button>
          </div>
        </div>

        {showForm && (
          <form onSubmit={handleSubmit} className="metric-card space-y-4 animate-slide-up bg-card w-full sm:w-2/3">
            <h3 className="text-[14px] font-bold text-foreground">Registrar guia / apuracao (manual)</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <Label className="text-[11px] text-muted-foreground">Periodo (ex: 2026-03)</Label>
                <Input
                  type="month"
                  value={form.period}
                  onChange={(e) => setForm({ ...form, period: e.target.value })}
                  required
                  className="h-9 text-[13px]"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[11px] text-muted-foreground">Tipo de imposto</Label>
                <Select value={form.tax_type} onValueChange={(v) => setForm({ ...form, tax_type: v })}>
                  <SelectTrigger className="h-9 text-[13px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Simples Nacional">Simples Nacional</SelectItem>
                    <SelectItem value="ISS">ISS (Prefeitura)</SelectItem>
                    <SelectItem value="IRRF">IRRF (Retencao)</SelectItem>
                    <SelectItem value="INSS">INSS</SelectItem>
                    <SelectItem value="PIS/COFINS">PIS / COFINS</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-[11px] text-muted-foreground">Vencimento</Label>
                <Input
                  type="date"
                  value={form.due_date}
                  onChange={(e) => setForm({ ...form, due_date: e.target.value })}
                  required
                  className="h-9 text-[13px]"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[11px] text-muted-foreground">Valor devido (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={form.amount_due}
                  onChange={(e) => setForm({ ...form, amount_due: e.target.value })}
                  required
                  className="h-9 text-[13px]"
                />
              </div>
            </div>
            <div className="flex justify-end pt-4">
              <button
                type="submit"
                disabled={createApuration.isPending}
                className="rounded-md bg-foreground px-4 py-2 text-[13px] font-medium text-background hover:opacity-90 disabled:opacity-50"
              >
                {createApuration.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Registrar"}
              </button>
            </div>
          </form>
        )}

        <div className="overflow-hidden rounded-lg border border-border bg-card">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b text-left text-muted-foreground bg-muted/20">
                <th className="p-3 font-medium">Competencia</th>
                <th className="p-3 font-medium">Imposto</th>
                <th className="p-3 font-medium">Vencimento</th>
                <th className="p-3 font-medium text-right">Valor devido</th>
                <th className="p-3 font-medium text-right">Valor pago</th>
                <th className="p-3 font-medium">Status</th>
                <th className="p-3 font-medium text-right">Acao</th>
              </tr>
            </thead>
            <tbody>
              {apurations.data?.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center">
                      <Calculator className="h-8 w-8 mb-2 opacity-20" />
                      Nenhuma guia registrada ainda.
                    </div>
                  </td>
                </tr>
              ) : (
                apurations.data?.map((ap) => (
                  <tr key={ap.id} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="p-3 font-medium">{ap.period}</td>
                    <td className="p-3 font-bold">{ap.tax_type}</td>
                    <td className="p-3 text-muted-foreground">
                      {ap.due_date ? format(parseISO(ap.due_date), "dd/MM/yyyy", { locale: ptBR }) : "-"}
                    </td>
                    <td className="p-3 text-right text-destructive font-mono">{formatBRL(Number(ap.amount_due) || 0)}</td>
                    <td className="p-3 text-right text-success font-mono">{formatBRL(Number(ap.amount_paid) || 0)}</td>
                    <td className="p-3">
                      {ap.status === "paid" ? (
                        <Badge variant="outline" className="border-success/30 text-success bg-success/10">
                          <CheckCircle className="w-3 h-3 mr-1" /> Paga
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="border-warning/30 text-warning bg-warning/10">
                          <Clock className="w-3 h-3 mr-1" /> Aberta
                        </Badge>
                      )}
                    </td>
                    <td className="p-3 text-right">
                      {ap.status !== "paid" && (
                        <button
                          onClick={() => handlePay(ap.id, Number(ap.amount_due) || 0)}
                          className="text-[11px] font-bold text-success hover:underline px-2"
                        >
                          Dar baixa
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AppLayout>
  );
}

