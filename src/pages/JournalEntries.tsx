import { AppLayout } from "@/components/layout/AppLayout";
import { useAccounting } from "@/hooks/use-accounting";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2, Plus, Receipt, Search } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

function formatCurrency(val: number) {
  return `R$ ${val.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function JournalEntries() {
  const { journalEntries, accounts, createJournalEntry, isLoading } = useAccounting();
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const [form, setForm] = useState({
    description: "",
    entry_date: format(new Date(), "yyyy-MM-dd"),
    reference_id: "",
  });

  const [lines, setLines] = useState([
    { account_id: "", debit: 0, credit: 0 },
    { account_id: "", debit: 0, credit: 0 },
  ]);

  const totalDebit = lines.reduce((s, l) => s + (Number(l.debit) || 0), 0);
  const totalCredit = lines.reduce((s, l) => s + (Number(l.credit) || 0), 0);
  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01 && totalDebit > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isBalanced) {
      toast.error("O lançamento precisa estar balanceado (Débito = Crédito).");
      return;
    }

    const validLines = lines.filter((l) => l.account_id && (l.debit > 0 || l.credit > 0));
    if (validLines.length < 2) {
      toast.error("Informe pelo menos duas linhas contábeis válidas.");
      return;
    }

    try {
      await createJournalEntry.mutateAsync({
        ...form,
        lines: validLines,
      });
      toast.success("Lançamento Contábil salvo com sucesso!");
      setForm({ description: "", entry_date: format(new Date(), "yyyy-MM-dd"), reference_id: "" });
      setLines([{ account_id: "", debit: 0, credit: 0 }, { account_id: "", debit: 0, credit: 0 }]);
      setShowForm(false);
    } catch (err: any) {
      toast.error(err.message || "Erro ao salvar o lançamento.");
    }
  };

  const updateLine = (idx: number, field: string, value: any) => {
    const nextLines = [...lines];
    if (field === "debit" || field === "credit") {
      const numValue = Number(value.replace(/[^0-9.]/g, ''));
      (nextLines[idx] as any)[field] = isNaN(numValue) ? 0 : numValue;
      if (field === "debit" && numValue > 0) nextLines[idx].credit = 0;
      if (field === "credit" && numValue > 0) nextLines[idx].debit = 0;
    } else {
      (nextLines[idx] as any)[field] = value;
    }
    setLines(nextLines);
  };

  const addLine = () => setLines([...lines, { account_id: "", debit: 0, credit: 0 }]);
  const removeLine = (idx: number) => setLines(lines.filter((_, i) => i !== idx));

  const filteredEntries = journalEntries.data?.filter(entry => 
    entry.description.toLowerCase().includes(searchTerm.toLowerCase()) || 
    entry.reference_id?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

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
            <h1 className="text-xl font-semibold text-foreground tracking-tight">Lançamentos Contábeis</h1>
            <p className="mt-0.5 text-[13px] text-muted-foreground">Registro de diário contábil, independente do ledger geral</p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-[13px] font-medium text-primary-foreground hover:opacity-90 transition-opacity"
          >
            <Plus className="h-3.5 w-3.5" /> Novo Lançamento
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleSubmit} className="metric-card space-y-4 animate-slide-up bg-card">
            <h3 className="text-[14px] font-bold text-foreground">Novo Lançamento (Manual)</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="space-y-1">
                <Label className="text-[11px] text-muted-foreground">Data do Lançamento</Label>
                <Input type="date" value={form.entry_date} onChange={e => setForm({...form, entry_date: e.target.value})} required className="h-9 text-[13px]" />
              </div>
              <div className="space-y-1">
                <Label className="text-[11px] text-muted-foreground">Descrição</Label>
                <Input placeholder="Ex: Provisão de Férias" value={form.description} onChange={e => setForm({...form, description: e.target.value})} required className="h-9 text-[13px]" />
              </div>
              <div className="space-y-1">
                <Label className="text-[11px] text-muted-foreground">Documento Referência</Label>
                <Input placeholder="Ex: NF 1234" value={form.reference_id} onChange={e => setForm({...form, reference_id: e.target.value})} className="h-9 text-[13px]" />
              </div>
            </div>

            <div className="space-y-2 mt-4">
              <div className="grid grid-cols-[1fr_120px_120px_40px] gap-2 px-1 text-xs font-semibold text-muted-foreground">
                <span>Conta Contábil</span>
                <span className="text-right">Débito (R$)</span>
                <span className="text-right">Crédito (R$)</span>
                <span></span>
              </div>
              {lines.map((line, idx) => (
                <div key={idx} className="grid grid-cols-[1fr_120px_120px_40px] gap-2 items-center">
                  <Select value={line.account_id} onValueChange={(v) => updateLine(idx, "account_id", v)}>
                    <SelectTrigger className="h-9 text-[13px]">
                      <SelectValue placeholder="Selecione a conta" />
                    </SelectTrigger>
                    <SelectContent>
                      {accounts.data?.map(acc => (
                        <SelectItem key={acc.id} value={acc.id}>{acc.code} - {acc.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input type="number" step="0.01" value={line.debit || ""} onChange={e => updateLine(idx, "debit", e.target.value)} placeholder="0.00" className="h-9 text-[13px] text-right" disabled={line.credit > 0} />
                  <Input type="number" step="0.01" value={line.credit || ""} onChange={e => updateLine(idx, "credit", e.target.value)} placeholder="0.00" className="h-9 text-[13px] text-right" disabled={line.debit > 0}  />
                  <button type="button" onClick={() => removeLine(idx)} className="text-muted-foreground hover:text-destructive h-9 flex items-center justify-center">×</button>
                </div>
              ))}
              <button type="button" onClick={addLine} className="text-[12px] text-primary hover:underline mt-2">
                + Adicionar linha
              </button>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-border mt-4">
              <div className="flex gap-4 text-[13px]">
                <span>Débitos: <strong className="font-mono">{formatCurrency(totalDebit)}</strong></span>
                <span>Créditos: <strong className="font-mono">{formatCurrency(totalCredit)}</strong></span>
                <span>Status: <strong className={isBalanced ? "text-success" : "text-destructive"}>{isBalanced ? "Balanceado" : "Desbalanceado"}</strong></span>
              </div>
              <button type="submit" disabled={!isBalanced || createJournalEntry.isPending} className="rounded-md bg-foreground px-4 py-2 text-[13px] font-medium text-background hover:opacity-90 disabled:opacity-50">
                {createJournalEntry.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Registrar Diário"}
              </button>
            </div>
          </form>
        )}

        <div className="overflow-hidden rounded-lg border border-border bg-card">
          <div className="p-4 border-b border-border flex justify-between items-center bg-muted/20">
            <div className="relative w-72">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar lançamentos..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-9 h-9 text-[13px] bg-background" />
            </div>
          </div>
          
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="p-3 font-medium">Data</th>
                <th className="p-3 font-medium">Descrição</th>
                <th className="p-3 font-medium">Ref</th>
                <th className="p-3 font-medium text-right">Valor Total (D/C)</th>
                <th className="p-3 font-medium text-center">IA</th>
              </tr>
            </thead>
            <tbody>
              {filteredEntries.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center">
                      <Receipt className="h-8 w-8 mb-2 opacity-20" />
                      Nenhum lançamento no diário encontrado.
                    </div>
                  </td>
                </tr>
              ) : (
                filteredEntries.map(entry => {
                  const entryTotal = entry.journal_lines?.reduce((sum, line) => sum + Number(line.debit || 0), 0) || 0;
                  return (
                    <tr key={entry.id} className="border-b last:border-0 hover:bg-muted/30 group">
                      <td className="p-3">{format(new Date(entry.entry_date), "dd/MM/yyyy", { locale: ptBR })}</td>
                      <td className="p-3 font-medium">{entry.description}</td>
                      <td className="p-3 text-muted-foreground">{entry.reference_id || "—"}</td>
                      <td className="p-3 text-right font-mono">{formatCurrency(entryTotal)}</td>
                      <td className="p-3 text-center">
                        {entry.is_auto_suggested ? <span className="text-xxs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">SIM</span> : "—"}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AppLayout>
  );
}
