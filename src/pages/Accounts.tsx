import { AppLayout } from "@/components/layout/AppLayout";
import { useAccounts } from "@/hooks/use-accounts";
import { useCompany } from "@/hooks/use-company";
import { Building2, Plus, Loader2, DollarSign, Wallet } from "lucide-react";
import { useState } from "react";

const formatCurrency = (value: number) => {
  if (Math.abs(value) >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
  if (Math.abs(value) >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
  return `$${value.toFixed(2)}`;
};

const Accounts = () => {
  const { accounts, isLoading, createAccount, totalBalance } = useAccounts();
  const { company } = useCompany();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ bank_name: "", account_type: "checking" as string, balance: "" });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createAccount.mutate({
      bank_name: formData.bank_name,
      account_type: formData.account_type,
      balance: parseFloat(formData.balance) || 0,
    });
    setFormData({ bank_name: "", account_type: "checking", balance: "" });
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
            <h1 className="text-xl font-semibold text-foreground">Accounts</h1>
            <p className="mt-0.5 text-[13px] text-muted-foreground">{company?.name} — manage connected bank accounts</p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-1.5 rounded-md bg-accent px-3 py-1.5 text-[13px] font-medium text-accent-foreground hover:opacity-90 transition-opacity"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Account
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="metric-card">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <p className="text-[13px] font-medium text-muted-foreground">Total Balance</p>
            </div>
            <p className="text-2xl font-semibold text-foreground">{formatCurrency(totalBalance)}</p>
          </div>
          <div className="metric-card">
            <div className="flex items-center gap-2 mb-1">
              <Wallet className="h-4 w-4 text-muted-foreground" />
              <p className="text-[13px] font-medium text-muted-foreground">Accounts</p>
            </div>
            <p className="text-2xl font-semibold text-foreground">{accounts.length}</p>
          </div>
          <div className="metric-card">
            <div className="flex items-center gap-2 mb-1">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <p className="text-[13px] font-medium text-muted-foreground">Banks Connected</p>
            </div>
            <p className="text-2xl font-semibold text-foreground">{new Set(accounts.map((a) => a.bank_name)).size}</p>
          </div>
        </div>

        {showForm && (
          <form onSubmit={handleCreate} className="metric-card space-y-3">
            <p className="text-[13px] font-medium text-foreground">New Account</p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
              <input type="text" placeholder="Bank name" value={formData.bank_name} onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })} required className="rounded-md border border-border bg-card px-3 py-1.5 text-[13px] text-foreground placeholder:text-muted-foreground outline-none" />
              <select value={formData.account_type} onChange={(e) => setFormData({ ...formData, account_type: e.target.value })} className="rounded-md border border-border bg-card px-3 py-1.5 text-[13px] text-foreground outline-none">
                <option value="checking">Checking</option>
                <option value="savings">Savings</option>
                <option value="credit">Credit</option>
                <option value="investment">Investment</option>
              </select>
              <input type="number" step="0.01" placeholder="Initial balance" value={formData.balance} onChange={(e) => setFormData({ ...formData, balance: e.target.value })} className="rounded-md border border-border bg-card px-3 py-1.5 text-[13px] text-foreground placeholder:text-muted-foreground outline-none" />
              <button type="submit" disabled={createAccount.isPending} className="flex items-center justify-center gap-2 rounded-md bg-foreground px-3 py-1.5 text-[13px] font-medium text-background hover:opacity-90 transition-opacity disabled:opacity-50">
                {createAccount.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Create
              </button>
            </div>
          </form>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {accounts.length === 0 ? (
            <div className="col-span-full metric-card">
              <p className="text-[13px] text-muted-foreground text-center py-8">No accounts yet. Add your first bank account above.</p>
            </div>
          ) : (
            accounts.map((account) => (
              <div key={account.id} className="metric-card">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-[13px] font-medium text-foreground">{account.bank_name}</p>
                    <p className="text-xxs text-muted-foreground capitalize">{account.account_type}</p>
                  </div>
                </div>
                <p className="text-2xl font-semibold text-foreground">{formatCurrency(Number(account.balance))}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default Accounts;
