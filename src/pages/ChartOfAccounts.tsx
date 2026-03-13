import { AppLayout } from "@/components/layout/AppLayout";
import { useAccounting } from "@/hooks/use-accounting";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2, Plus, FileText } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const accountTypeLabels: Record<string, string> = {
  asset: "Ativo",
  liability: "Passivo",
  equity: "Patrimônio Líquido",
  revenue: "Receita",
  expense: "Despesa",
  cost: "Custo",
};

export default function ChartOfAccounts() {
  const { accounts, createAccount, isLoading } = useAccounting();
  const [showForm, setShowForm] = useState(false);
  
  const [form, setForm] = useState({
    code: "",
    name: "",
    account_type: "asset",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createAccount.mutateAsync(form);
      toast.success("Conta contábil criada com sucesso");
      setForm({ code: "", name: "", account_type: "asset" });
      setShowForm(false);
    } catch (err: any) {
      toast.error(err.message || "Falha ao criar conta contábil");
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
            <h1 className="text-xl font-semibold text-foreground tracking-tight">Plano de Contas</h1>
            <p className="mt-0.5 text-[13px] text-muted-foreground">Estrutura contábil da empresa (Ativo, Passivo, DRE)</p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-[13px] font-medium text-primary-foreground hover:opacity-90 transition-opacity"
          >
            <Plus className="h-3.5 w-3.5" /> Nova Conta
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleSubmit} className="metric-card space-y-3 animate-slide-up">
            <p className="text-[14px] font-bold text-foreground">Nova Conta Contábil</p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
              <div className="space-y-1">
                <Label className="text-[11px] text-muted-foreground">Código (ex: 1.01.0001)</Label>
                <Input
                  placeholder="1.01.0001"
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value })}
                  required
                  className="h-9 text-[13px]"
                />
              </div>
              <div className="space-y-1 sm:col-span-2">
                <Label className="text-[11px] text-muted-foreground">Nome da Conta</Label>
                <Input
                  placeholder="Ex: Caixa Geral"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                  className="h-9 text-[13px]"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[11px] text-muted-foreground">Tipo</Label>
                <Select value={form.account_type} onValueChange={(v) => setForm({ ...form, account_type: v })}>
                  <SelectTrigger className="h-9 text-[13px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(accountTypeLabels).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={createAccount.isPending}
                className="rounded-md bg-foreground px-4 py-2 text-[13px] font-medium text-background hover:opacity-90 disabled:opacity-50 h-9"
              >
                {createAccount.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar"}
              </button>
            </div>
          </form>
        )}

        <div className="overflow-hidden rounded-lg border border-border bg-card">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                {["Código", "Nome", "Tipo", "Status"].map((h) => (
                  <th key={h} className="px-4 py-2.5 text-left text-xxs font-medium uppercase tracking-wider text-muted-foreground">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {accounts.data?.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-12 text-center text-[13px] text-muted-foreground">
                    <div className="flex flex-col items-center justify-center">
                      <FileText className="h-8 w-8 mb-2 opacity-20" />
                      Nenhuma conta cadastrada no plano de contas.
                    </div>
                  </td>
                </tr>
              ) : (
                accounts.data?.map((a) => (
                  <tr key={a.id} className="border-b border-border last:border-0 hover:bg-secondary/50">
                    <td className="px-4 py-3 text-[13px] font-mono font-bold text-foreground">
                      {a.code}
                    </td>
                    <td className="px-4 py-3 text-[13px] text-foreground">
                      {a.name}
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-secondary px-2 py-0.5 text-xxs font-medium capitalize">
                        {accountTypeLabels[a.account_type] || a.account_type}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xxs font-bold text-success/80">Ativa</span>
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
