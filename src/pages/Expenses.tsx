import { AppLayout } from "@/components/layout/AppLayout";
import { useExpenses } from "@/hooks/use-expenses";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2, Plus, Receipt, CheckCircle, XCircle, Clock, Upload, DollarSign, TrendingDown, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const fmt = (v: number) => {
  if (Math.abs(v) >= 1_000_000) return `R$ ${(v / 1_000_000).toFixed(2)}M`;
  if (Math.abs(v) >= 1_000) return `R$ ${(v / 1_000).toFixed(1)}K`;
  return `R$ ${v.toFixed(2)}`;
};

const ExpenseManagement = () => {
  const {
    expenses, categories, createExpense, createCategory, approveExpense, uploadReceipt,
    totalPending, totalApproved, totalThisMonth, isLoading,
  } = useExpenses();

  const [showForm, setShowForm] = useState(false);
  const [showCatForm, setShowCatForm] = useState(false);
  const [activeTab, setActiveTab] = useState<"all" | "pending" | "approved" | "rejected">("all");
  const [form, setForm] = useState({ amount: "", description: "", merchant: "", category_id: "", expense_date: "" });
  const [catForm, setCatForm] = useState({ name: "", code: "", budget_limit: "" });
  const [receiptFile, setReceiptFile] = useState<File | null>(null);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let receipt_url: string | undefined;
      if (receiptFile) {
        receipt_url = await uploadReceipt(receiptFile);
      }
      await createExpense.mutateAsync({
        amount: Number(form.amount),
        description: form.description,
        merchant: form.merchant || undefined,
        category_id: form.category_id || undefined,
        expense_date: form.expense_date || undefined,
        receipt_url,
      });
      toast.success("Despesa enviada com sucesso");
      setForm({ amount: "", description: "", merchant: "", category_id: "", expense_date: "" });
      setReceiptFile(null);
      setShowForm(false);
    } catch (err: any) {
      toast.error(err.message || "Falha ao enviar despesa");
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createCategory.mutateAsync({
        name: catForm.name,
        code: catForm.code,
        budget_limit: catForm.budget_limit ? Number(catForm.budget_limit) : undefined,
      });
      toast.success("Categoria criada");
      setCatForm({ name: "", code: "", budget_limit: "" });
      setShowCatForm(false);
    } catch (err: any) {
      toast.error(err.message || "Falha ao criar categoria");
    }
  };

  const filtered = activeTab === "all" ? expenses : expenses.filter((e: any) => e.status === activeTab);

  const tabLabels: Record<string, string> = {
    all: "Todas",
    pending: "Pendentes",
    approved: "Aprovadas",
    rejected: "Rejeitadas",
  };

  const statusIcon = (status: string) => {
    switch (status) {
      case "approved": return <CheckCircle className="h-4 w-4 text-primary" />;
      case "rejected": return <XCircle className="h-4 w-4 text-destructive" />;
      case "reimbursed": return <DollarSign className="h-4 w-4 text-primary" />;
      default: return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  if (isLoading) {
    return <AppLayout><div className="flex items-center justify-center h-64"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div></AppLayout>;
  }

  return (
    <AppLayout>
      <div className="max-w-[1200px] space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-foreground tracking-tight">Gestão de Despesas</h1>
            <p className="mt-0.5 text-[13px] text-muted-foreground">Registre, aprove e gerencie despesas corporativas</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowCatForm(!showCatForm)} className="flex items-center gap-1.5 rounded-md bg-secondary px-3 py-1.5 text-[13px] font-medium text-foreground hover:bg-secondary/80">
              Categorias
            </button>
            <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-[13px] font-medium text-primary-foreground hover:opacity-90">
              <Plus className="h-3.5 w-3.5" /> Nova Despesa
            </button>
          </div>
        </div>

        {/* Resumo */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="metric-card">
            <div className="flex items-center gap-2 mb-1">
              <TrendingDown className="h-4 w-4 text-muted-foreground" />
              <p className="text-[13px] font-medium text-muted-foreground">Este Mês</p>
            </div>
            <p className="text-2xl font-semibold text-foreground">{fmt(totalThisMonth)}</p>
          </div>
          <div className="metric-card">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              <p className="text-[13px] font-medium text-muted-foreground">Aguardando Aprovação</p>
            </div>
            <p className="text-2xl font-semibold text-foreground">{fmt(totalPending)}</p>
          </div>
          <div className="metric-card bg-primary text-primary-foreground border-0">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle className="h-4 w-4 text-primary-foreground/60" />
              <p className="text-[13px] font-medium text-primary-foreground/70">Aprovadas</p>
            </div>
            <p className="text-2xl font-semibold">{fmt(totalApproved)}</p>
          </div>
        </div>

        {/* Formulário de Categoria */}
        {showCatForm && (
          <form onSubmit={handleCreateCategory} className="metric-card space-y-3 animate-slide-up">
            <p className="text-[14px] font-bold text-foreground">Nova Categoria</p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
              <input type="text" placeholder="Nome" value={catForm.name} onChange={(e) => setCatForm({ ...catForm, name: e.target.value })} required className="rounded-md border border-border bg-card px-3 py-2 text-[13px] outline-none" />
              <input type="text" placeholder="Código (ex: VIAGEM)" value={catForm.code} onChange={(e) => setCatForm({ ...catForm, code: e.target.value })} required className="rounded-md border border-border bg-card px-3 py-2 text-[13px] outline-none" />
              <input type="number" step="0.01" placeholder="Limite de orçamento (opcional)" value={catForm.budget_limit} onChange={(e) => setCatForm({ ...catForm, budget_limit: e.target.value })} className="rounded-md border border-border bg-card px-3 py-2 text-[13px] outline-none" />
              <button type="submit" disabled={createCategory.isPending} className="rounded-md bg-foreground px-3 py-2 text-[13px] font-medium text-background hover:opacity-90 disabled:opacity-50">Criar</button>
            </div>
          </form>
        )}

        {/* Formulário de Despesa */}
        {showForm && (
          <form onSubmit={handleCreate} className="metric-card space-y-3 animate-slide-up">
            <p className="text-[14px] font-bold text-foreground">Registrar Despesa</p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/60 text-[13px]">R$</span>
                <input type="number" step="0.01" placeholder="0,00" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required className="w-full rounded-md border border-border bg-card pl-9 pr-3 py-2 text-[13px] outline-none" />
              </div>
              <input type="text" placeholder="Descrição" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required className="rounded-md border border-border bg-card px-3 py-2 text-[13px] outline-none" />
              <input type="text" placeholder="Fornecedor" value={form.merchant} onChange={(e) => setForm({ ...form, merchant: e.target.value })} className="rounded-md border border-border bg-card px-3 py-2 text-[13px] outline-none" />
              <select value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })} className="rounded-md border border-border bg-card px-3 py-2 text-[13px]">
                <option value="">Sem categoria</option>
                {categories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <input type="date" value={form.expense_date} onChange={(e) => setForm({ ...form, expense_date: e.target.value })} className="rounded-md border border-border bg-card px-3 py-2 text-[13px] outline-none" />
              <div className="flex gap-2">
                <label className="flex-1 flex items-center gap-2 rounded-md border border-dashed border-border bg-card px-3 py-2 text-[13px] text-muted-foreground cursor-pointer hover:bg-secondary/50">
                  <Upload className="h-3.5 w-3.5" />
                  {receiptFile ? receiptFile.name : "Anexar recibo"}
                  <input type="file" accept="image/*,.pdf" onChange={(e) => setReceiptFile(e.target.files?.[0] || null)} className="hidden" />
                </label>
              </div>
            </div>
            <button type="submit" disabled={createExpense.isPending} className="rounded-md bg-primary px-4 py-2 text-[13px] font-bold text-primary-foreground hover:opacity-90 disabled:opacity-50">
              {createExpense.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Enviar Despesa"}
            </button>
          </form>
        )}

        {/* Abas */}
        <div className="flex gap-1">
          {(["all", "pending", "approved", "rejected"] as const).map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`rounded-md px-3 py-1.5 text-[13px] font-medium transition-colors ${activeTab === tab ? "bg-foreground text-background" : "border border-border bg-card text-foreground hover:bg-secondary"}`}>
              {tabLabels[tab]} {tab !== "all" && `(${expenses.filter((e: any) => e.status === tab).length})`}
            </button>
          ))}
        </div>

        {/* Tabela */}
        <div className="overflow-hidden rounded-lg border border-border bg-card">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                {["Status", "Data", "Descrição", "Fornecedor", "Categoria", "Valor", "Ações"].map((h) => (
                  <th key={h} className="px-4 py-2.5 text-left text-xxs font-medium uppercase tracking-wider text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-[13px] text-muted-foreground">Nenhuma despesa encontrada.</td></tr>
              ) : (
                filtered.map((e: any) => (
                  <tr key={e.id} className="border-b border-border last:border-0 hover:bg-secondary/50">
                    <td className="px-4 py-3">{statusIcon(e.status)}</td>
                    <td className="px-4 py-3 text-[13px] text-muted-foreground">{format(new Date(e.expense_date), "dd/MM", { locale: ptBR })}</td>
                    <td className="px-4 py-3 text-[13px] font-medium text-foreground">{e.description}</td>
                    <td className="px-4 py-3 text-[13px] text-muted-foreground">{e.merchant || "—"}</td>
                    <td className="px-4 py-3"><span className="rounded-full bg-secondary px-2 py-0.5 text-xxs font-medium">{e.expense_categories?.name || "—"}</span></td>
                    <td className="px-4 py-3 text-[13px] font-semibold text-foreground">{fmt(Number(e.amount))}</td>
                    <td className="px-4 py-3">
                      {e.status === "pending" && (
                        <div className="flex gap-1">
                          <button onClick={() => approveExpense.mutate({ id: e.id, approved: true })} className="rounded p-1 text-primary hover:bg-primary/10" title="Aprovar">
                            <CheckCircle className="h-4 w-4" />
                          </button>
                          <button onClick={() => approveExpense.mutate({ id: e.id, approved: false })} className="rounded p-1 text-destructive hover:bg-destructive/10" title="Rejeitar">
                            <XCircle className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                      {e.receipt_url && (
                        <a href={e.receipt_url} target="_blank" rel="noopener noreferrer" className="rounded p-1 text-muted-foreground hover:text-foreground">
                          <Receipt className="h-4 w-4" />
                        </a>
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
};

export default ExpenseManagement;
