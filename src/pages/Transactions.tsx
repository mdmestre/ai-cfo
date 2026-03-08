import { AppLayout } from "@/components/layout/AppLayout";
import { Search, Filter, Download, ArrowUpDown, Plus, Loader2 } from "lucide-react";
import { useState } from "react";
import { useTransactions } from "@/hooks/use-transactions";
import { useAccounts } from "@/hooks/use-accounts";
import { format } from "date-fns";

const formatCurrency = (value: number) => {
  if (Math.abs(value) >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
  if (Math.abs(value) >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
  return `$${Math.abs(value).toFixed(2)}`;
};

const Transactions = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");
  const { transactions, isLoading, createTransaction } = useTransactions();
  const { accounts } = useAccounts();

  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ account_id: "", amount: "", category: "", description: "", date: "" });

  const filtered = transactions.filter(
    (t) =>
      ((t.description || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.category.toLowerCase().includes(searchQuery.toLowerCase())) &&
      (activeFilter === "All" ||
        (activeFilter === "Revenue" && t.amount > 0) ||
        (activeFilter === "Expenses" && t.amount < 0))
  );

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createTransaction.mutate({
      account_id: formData.account_id,
      amount: parseFloat(formData.amount),
      category: formData.category,
      description: formData.description,
      date: formData.date || new Date().toISOString(),
    });
    setFormData({ account_id: "", amount: "", category: "", description: "", date: "" });
    setShowForm(false);
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
            <h1 className="text-xl font-semibold text-foreground">Transactions</h1>
            <p className="mt-0.5 text-[13px] text-muted-foreground">View and manage all financial transactions</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowForm(!showForm)}
              className="flex items-center gap-1.5 rounded-md bg-accent px-3 py-1.5 text-[13px] font-medium text-accent-foreground hover:opacity-90 transition-opacity"
            >
              <Plus className="h-3.5 w-3.5" />
              Add
            </button>
          </div>
        </div>

        {showForm && (
          <form onSubmit={handleCreate} className="metric-card space-y-3">
            <p className="text-[13px] font-medium text-foreground">New Transaction</p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
              <select
                value={formData.account_id}
                onChange={(e) => setFormData({ ...formData, account_id: e.target.value })}
                required
                className="rounded-md border border-border bg-card px-3 py-1.5 text-[13px] text-foreground outline-none"
              >
                <option value="">Select account</option>
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>{a.bank_name} ({a.account_type})</option>
                ))}
              </select>
              <input
                type="number"
                step="0.01"
                placeholder="Amount (negative for expense)"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                required
                className="rounded-md border border-border bg-card px-3 py-1.5 text-[13px] text-foreground placeholder:text-muted-foreground outline-none"
              />
              <input
                type="text"
                placeholder="Category"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                required
                className="rounded-md border border-border bg-card px-3 py-1.5 text-[13px] text-foreground placeholder:text-muted-foreground outline-none"
              />
              <input
                type="text"
                placeholder="Description"
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
                  {createTransaction.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Save"}
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
              placeholder="Search transactions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent text-[13px] text-foreground placeholder:text-muted-foreground outline-none"
            />
          </div>
          {["All", "Revenue", "Expenses"].map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveFilter(cat)}
              className={`rounded-md px-3 py-1.5 text-[13px] font-medium transition-colors ${
                cat === activeFilter
                  ? "bg-foreground text-background"
                  : "border border-border bg-card text-foreground hover:bg-secondary"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="overflow-hidden rounded-lg border border-border bg-card">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                {["Date", "Description", "Category", "Amount", "Account"].map((h) => (
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
                    No transactions found. Add your first transaction above.
                  </td>
                </tr>
              ) : (
                filtered.map((t) => (
                  <tr key={t.id} className="border-b border-border last:border-0 hover:bg-secondary/50 transition-colors">
                    <td className="px-4 py-3 text-[13px] text-muted-foreground">{format(new Date(t.date), "MMM d, yyyy")}</td>
                    <td className="px-4 py-3 text-[13px] font-medium text-foreground">{t.description || "—"}</td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-secondary px-2 py-0.5 text-xxs font-medium text-secondary-foreground">
                        {t.category}
                      </span>
                    </td>
                    <td className={`px-4 py-3 text-[13px] font-semibold ${t.amount > 0 ? "text-success" : "text-foreground"}`}>
                      {t.amount > 0 ? "+" : "-"}${formatCurrency(Number(t.amount))}
                    </td>
                    <td className="px-4 py-3 text-[13px] text-muted-foreground">
                      {(t as any).accounts?.bank_name || "—"}
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
