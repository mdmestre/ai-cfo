import { AppLayout } from "@/components/layout/AppLayout";
import { Search, Plus, Loader2, Sparkles } from "lucide-react";
import { useState } from "react";
import { useTransactions } from "@/hooks/use-transactions";
import { useAccounts } from "@/hooks/use-accounts";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { formatBRL } from "@/lib/format";
import { toast } from "sonner";

const Transactions = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<"All" | "Revenue" | "Expenses">("All");
  const { transactions, isLoading, createTransaction, autoCategorizeTransactions } = useTransactions();
  const { accounts } = useAccounts();

  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ account_id: "", amount: "", category: "", description: "", date: "" });

  const filtered = transactions.filter((t: any) => {
    const q = searchQuery.trim().toLowerCase();
    const hay = `${t.description || ""} ${t.category || ""}`.toLowerCase();
    const matchesQuery = q.length === 0 || hay.includes(q);
    const matchesFilter =
      activeFilter === "All" ||
      (activeFilter === "Revenue" && Number(t.amount) > 0) ||
      (activeFilter === "Expenses" && Number(t.amount) < 0);
    return matchesQuery && matchesFilter;
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createTransaction.mutate(
      {
        account_id: formData.account_id,
        amount: parseFloat(formData.amount),
        category: formData.category || "Uncategorized",
        description: formData.description,
        date: formData.date ? new Date(formData.date).toISOString() : new Date().toISOString(),
      },
      {
        onSuccess: () => toast.success("Transacao criada"),
        onError: (err: any) => toast.error(err?.message || "Erro ao criar transacao"),
      }
    );
    setFormData({ account_id: "", amount: "", category: "", description: "", date: "" });
    setShowForm(false);
  };

  const handleAutoCategorize = async () => {
    try {
      const res = await autoCategorizeTransactions.mutateAsync();
      toast.success("Classificacao concluida", { description: `${res.updated} transacao(oes) atualizada(s).` });
    } catch (err: any) {
      toast.error(err?.message || "Falha ao auto-classificar");
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
      <div className="max-w-[1200px] space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-foreground">Transacoes</h1>
            <p className="mt-0.5 text-[13px] text-muted-foreground">Todas as movimentacoes de caixa (bancos e carteiras)</p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleAutoCategorize}
              disabled={autoCategorizeTransactions.isPending}
              className="flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-[13px] font-semibold text-foreground hover:bg-secondary transition-colors disabled:opacity-50"
              title="Auto-classifica transacoes sem categoria"
            >
              {autoCategorizeTransactions.isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Sparkles className="h-3.5 w-3.5" />
              )}
              Auto-classificar
            </button>

            <button
              onClick={() => setShowForm(!showForm)}
              className="flex items-center gap-1.5 rounded-md bg-accent px-3 py-1.5 text-[13px] font-medium text-accent-foreground hover:opacity-90 transition-opacity"
            >
              <Plus className="h-3.5 w-3.5" />
              Adicionar
            </button>
          </div>
        </div>

        {showForm && (
          <form onSubmit={handleCreate} className="metric-card space-y-3">
            <p className="text-[13px] font-medium text-foreground">Nova transacao</p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
              <select
                value={formData.account_id}
                onChange={(e) => setFormData({ ...formData, account_id: e.target.value })}
                required
                className="rounded-md border border-border bg-card px-3 py-1.5 text-[13px] text-foreground outline-none"
              >
                <option value="">Selecione a conta</option>
                {accounts.map((a: any) => (
                  <option key={a.id} value={a.id}>
                    {a.bank_name} ({a.account_type})
                  </option>
                ))}
              </select>

              <input
                type="number"
                step="0.01"
                placeholder="Valor (negativo = despesa)"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                required
                className="rounded-md border border-border bg-card px-3 py-1.5 text-[13px] text-foreground placeholder:text-muted-foreground outline-none"
              />

              <input
                type="text"
                placeholder="Categoria"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="rounded-md border border-border bg-card px-3 py-1.5 text-[13px] text-foreground placeholder:text-muted-foreground outline-none"
              />

              <input
                type="text"
                placeholder="Descricao"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="rounded-md border border-border bg-card px-3 py-1.5 text-[13px] text-foreground placeholder:text-muted-foreground outline-none"
              />

              <div className="flex gap-2">
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="flex-1 rounded-md border border-border bg-card px-3 py-1.5 text-[13px] text-foreground outline-none"
                />
                <button
                  type="submit"
                  disabled={createTransaction.isPending}
                  className="rounded-md bg-foreground px-3 py-1.5 text-[13px] font-medium text-background hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {createTransaction.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Salvar"}
                </button>
              </div>
            </div>
          </form>
        )}

        <div className="flex items-center gap-2">
          <div className="flex flex-1 items-center gap-2 rounded-md border border-border bg-card px-3 py-1.5 max-w-sm">
            <Search className="h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar transacoes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent text-[13px] text-foreground placeholder:text-muted-foreground outline-none"
            />
          </div>
          {(["All", "Revenue", "Expenses"] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveFilter(cat)}
              className={`rounded-md px-3 py-1.5 text-[13px] font-medium transition-colors ${
                cat === activeFilter
                  ? "bg-foreground text-background"
                  : "border border-border bg-card text-foreground hover:bg-secondary"
              }`}
            >
              {cat === "All" ? "Tudo" : cat === "Revenue" ? "Receitas" : "Despesas"}
            </button>
          ))}
        </div>

        <div className="overflow-hidden rounded-lg border border-border bg-card">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                {["Data", "Descricao", "Categoria", "Valor", "Conta"].map((h) => (
                  <th key={h} className="px-4 py-2.5 text-left text-xxs font-medium uppercase tracking-wider text-muted-foreground">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-[13px] text-muted-foreground">
                    Nenhuma transacao encontrada.
                  </td>
                </tr>
              ) : (
                filtered.map((t: any) => (
                  <tr key={t.id} className="border-b border-border last:border-0 hover:bg-secondary/50 transition-colors">
                    <td className="px-4 py-3 text-[13px] text-muted-foreground">
                      {t.date ? format(new Date(t.date), "dd/MM/yyyy", { locale: ptBR }) : "-"}
                    </td>
                    <td className="px-4 py-3 text-[13px] font-medium text-foreground">{t.description || "-"}</td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-secondary px-2 py-0.5 text-xxs font-medium text-secondary-foreground">
                        {t.category || "Uncategorized"}
                      </span>
                    </td>
                    <td className={`px-4 py-3 text-[13px] font-semibold ${Number(t.amount) > 0 ? "text-success" : "text-foreground"}`}>
                      {Number(t.amount) > 0 ? "+" : "-"}
                      {formatBRL(Math.abs(Number(t.amount) || 0))}
                    </td>
                    <td className="px-4 py-3 text-[13px] text-muted-foreground">
                      {(t as any).accounts?.bank_name || "-"}
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

export default Transactions;
