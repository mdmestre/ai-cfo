import { AppLayout } from "@/components/layout/AppLayout";
import { useAccounts } from "@/hooks/use-accounts";
import { useCompany } from "@/hooks/use-company";
import { useBankConnections } from "@/hooks/use-bank-connections";
import { BankConnectionCard } from "@/components/accounts/BankConnectionCard";
import { Building2, Plus, Loader2, DollarSign, Wallet, RefreshCw } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const formatCurrency = (value: number) => {
  if (Math.abs(value) >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
  if (Math.abs(value) >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
  return `$${value.toFixed(2)}`;
};

const banks = [
  { name: "Itau Unibanco", provider: "open_finance_br" },
  { name: "Nubank", provider: "open_finance_br" },
  { name: "Bradesco", provider: "open_finance_br" },
  { name: "JP Morgan Chase", provider: "plaid" },
];

const Accounts = () => {
  const { accounts, isLoading: accountsLoading, createAccount, totalBalance } = useAccounts();
  const { connections, isLoading: connectionsLoading, connectBank } = useBankConnections();
  const { company } = useCompany();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ bank_name: "", account_type: "checking" as string, balance: "" });

  const handleConnect = async (institution: string, provider: string) => {
    try {
      await connectBank.mutateAsync({ provider, institution });
      toast.success(`Successfully connected to ${institution}`);
    } catch (error) {
      toast.error("Failed to connect institution.");
    }
  };

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

  const isLoading = accountsLoading || connectionsLoading;

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
      <div className="max-w-[1200px] space-y-8 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-foreground tracking-tight">Accounts</h1>
            <p className="mt-0.5 text-[13px] text-muted-foreground">{company?.name} — manage your financial backbone</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowForm(!showForm)}
              className="flex items-center gap-1.5 rounded-md bg-secondary px-3 py-1.5 text-[13px] font-medium text-foreground hover:bg-secondary/80 transition-all active:scale-95"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Manual
            </button>
          </div>
        </div>

        {/* Financial Highlights */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="metric-card bg-primary text-white border-0">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="h-4 w-4 text-white/60" />
              <p className="text-[13px] font-medium text-white/70">Total Net Position</p>
            </div>
            <p className="text-2xl font-semibold tracking-tight">{formatCurrency(totalBalance)}</p>
          </div>
          <div className="metric-card">
            <div className="flex items-center gap-2 mb-1">
              <Wallet className="h-4 w-4 text-muted-foreground" />
              <p className="text-[13px] font-medium text-muted-foreground">Connected Accounts</p>
            </div>
            <p className="text-2xl font-semibold text-foreground">{accounts.length}</p>
          </div>
          <div className="metric-card">
            <div className="flex items-center gap-2 mb-1">
              <RefreshCw className="h-4 w-4 text-muted-foreground" />
              <p className="text-[13px] font-medium text-muted-foreground">Sync Health</p>
            </div>
            <p className="text-2xl font-semibold text-success">Healthy</p>
          </div>
        </div>

        {/* Bank Connection Section (The Brex Approach) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-[15px] font-bold text-foreground">Connect Institutions</h2>
            <span className="text-xxs font-bold uppercase tracking-widest text-primary/40 bg-primary/5 px-2 py-0.5 rounded">Via Open Finance</span>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {banks.map((bank) => {
              const isConnected = connections.some((c: any) => c.institution_name === bank.name);
              return (
                <BankConnectionCard
                  key={bank.name}
                  institution={bank.name}
                  status={isConnected ? 'connected' : 'not_connected'}
                  onConnect={() => handleConnect(bank.name, bank.provider)}
                />
              );
            })}
          </div>
        </div>

        {showForm && (
          <form onSubmit={handleCreate} className="metric-card space-y-4 animate-slide-up bg-secondary/20">
            <p className="text-[14px] font-bold text-foreground">Manual Account Onboarding</p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase text-muted-foreground/70">Bank Name</label>
                <input type="text" placeholder="e.g. Atlas Internal" value={formData.bank_name} onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })} required className="w-full rounded-md border border-border/50 bg-white px-3 py-2 text-[13px] text-foreground placeholder:text-muted-foreground/40 outline-none focus:ring-1 focus:ring-primary shadow-xs" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase text-muted-foreground/70">Category</label>
                <select value={formData.account_type} onChange={(e) => setFormData({ ...formData, account_type: e.target.value })} className="w-full rounded-md border border-border/50 bg-white px-3 py-2 text-[13px] text-foreground outline-none focus:ring-1 focus:ring-primary shadow-xs">
                  <option value="checking">Checking</option>
                  <option value="savings">Savings</option>
                  <option value="credit">Corporate Credit</option>
                  <option value="investment">Treasury</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase text-muted-foreground/70">Current Balance</label>
                <input type="number" step="0.01" placeholder="0.00" value={formData.balance} onChange={(e) => setFormData({ ...formData, balance: e.target.value })} className="w-full rounded-md border border-border/50 bg-white px-3 py-2 text-[13px] text-foreground placeholder:text-muted-foreground/40 outline-none focus:ring-1 focus:ring-primary shadow-xs" />
              </div>
              <div className="flex items-end">
                <button type="submit" disabled={createAccount.isPending} className="w-full flex items-center justify-center gap-2 rounded-md bg-primary px-3 py-2 text-[13px] font-bold text-white hover:opacity-90 transition-opacity disabled:opacity-50 shadow-sm">
                  {createAccount.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Finalize Setup
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Existing Accounts List */}
        <div className="space-y-4">
          <h2 className="text-[15px] font-bold text-foreground">Financial Architecture</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {accounts.length === 0 ? (
              <div className="col-span-full py-12 flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-secondary/10">
                <Building2 className="h-8 w-8 text-muted-foreground/30 mb-3" />
                <p className="text-[13px] font-medium text-muted-foreground text-center">No active accounts. Use Open Finance above to sync real data.</p>
              </div>
            ) : (
              accounts.map((account: any) => (
                <div key={account.id} className="metric-card group hover:border-primary/20 transition-all cursor-default">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary group-hover:bg-primary/5 transition-colors">
                        <Building2 className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                      </div>
                      <div>
                        <p className="text-[13px] font-bold text-foreground">{account.bank_name}</p>
                        <p className="text-xxs font-bold uppercase tracking-tight text-muted-foreground/60">{account.account_type}</p>
                      </div>
                    </div>
                    <div className="h-1.5 w-1.5 rounded-full bg-success ring-4 ring-success/10" title="System Synced" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-2xl font-bold tracking-tight text-foreground">{formatCurrency(Number(account.balance))}</p>
                    <p className="text-xxs font-medium text-muted-foreground/60 uppercase">Last Sync: Just now</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Accounts;
