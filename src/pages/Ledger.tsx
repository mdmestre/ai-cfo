import { AppLayout } from "@/components/layout/AppLayout";
import { useLedger } from "@/hooks/use-ledger";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2, Plus, BookOpen, Wallet, BarChart3, ArrowRightLeft } from "lucide-react";
import { format } from "date-fns";

const formatCurrency = (v: number) => {
  if (Math.abs(v) >= 1_000_000) return `R$ ${(v / 1_000_000).toFixed(2)}M`;
  if (Math.abs(v) >= 1_000) return `R$ ${(v / 1_000).toFixed(1)}K`;
  return `R$ ${v.toFixed(2)}`;
};

const Ledger = () => {
  const {
    ledgerAccounts, createLedgerAccount,
    wallets, createWallet, totalWalletBalance,
    journalEntries, createJournalEntry,
    isLoading,
  } = useLedger();

  const [activeTab, setActiveTab] = useState<"journal" | "accounts" | "wallets">("journal");
  const [showAccountForm, setShowAccountForm] = useState(false);
  const [showWalletForm, setShowWalletForm] = useState(false);
  const [showJournalForm, setShowJournalForm] = useState(false);

  // Account form state
  const [acctForm, setAcctForm] = useState({ code: "", name: "", account_type: "asset" });
  // Wallet form state
  const [walletForm, setWalletForm] = useState({ name: "", wallet_type: "operating" });
  // Journal entry form state
  const [jeForm, setJeForm] = useState({ description: "", reference: "", entry_date: "" });
  const [jeLines, setJeLines] = useState([
    { ledger_account_id: "", debit: 0, credit: 0 },
    { ledger_account_id: "", debit: 0, credit: 0 },
  ]);

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createLedgerAccount.mutateAsync(acctForm);
      toast.success("Ledger account created");
      setAcctForm({ code: "", name: "", account_type: "asset" });
      setShowAccountForm(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to create account");
    }
  };

  const handleCreateWallet = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createWallet.mutateAsync(walletForm);
      toast.success("Wallet created");
      setWalletForm({ name: "", wallet_type: "operating" });
      setShowWalletForm(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to create wallet");
    }
  };

  const handleCreateJournalEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    const validLines = jeLines.filter((l) => l.ledger_account_id && (l.debit > 0 || l.credit > 0));
    if (validLines.length < 2) return toast.error("At least 2 lines required");
    try {
      await createJournalEntry.mutateAsync({
        description: jeForm.description,
        reference: jeForm.reference || undefined,
        entry_date: jeForm.entry_date || undefined,
        lines: validLines,
      });
      toast.success("Journal entry posted");
      setJeForm({ description: "", reference: "", entry_date: "" });
      setJeLines([
        { ledger_account_id: "", debit: 0, credit: 0 },
        { ledger_account_id: "", debit: 0, credit: 0 },
      ]);
      setShowJournalForm(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to post entry");
    }
  };

  const addJournalLine = () => setJeLines([...jeLines, { ledger_account_id: "", debit: 0, credit: 0 }]);
  const updateJournalLine = (idx: number, field: string, value: any) => {
    const updated = [...jeLines];
    (updated[idx] as any)[field] = field === "debit" || field === "credit" ? Number(value) || 0 : value;
    updated[idx] = { ...updated[idx] };
    setJeLines(updated);
  };

  const totalDebit = jeLines.reduce((s, l) => s + l.debit, 0);
  const totalCredit = jeLines.reduce((s, l) => s + l.credit, 0);
  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01 && totalDebit > 0;

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </AppLayout>
    );
  }

  const tabs = [
    { key: "journal", label: "Journal", icon: BookOpen },
    { key: "accounts", label: "Chart of Accounts", icon: BarChart3 },
    { key: "wallets", label: "Wallets", icon: Wallet },
  ] as const;

  return (
    <AppLayout>
      <div className="max-w-[1200px] space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-foreground tracking-tight">Financial Ledger</h1>
            <p className="mt-0.5 text-[13px] text-muted-foreground">Double-entry accounting system</p>
          </div>
          <div className="flex gap-2">
            {activeTab === "journal" && (
              <button onClick={() => setShowJournalForm(!showJournalForm)} className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-[13px] font-medium text-primary-foreground hover:opacity-90">
                <Plus className="h-3.5 w-3.5" /> New Entry
              </button>
            )}
            {activeTab === "accounts" && (
              <button onClick={() => setShowAccountForm(!showAccountForm)} className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-[13px] font-medium text-primary-foreground hover:opacity-90">
                <Plus className="h-3.5 w-3.5" /> New Account
              </button>
            )}
            {activeTab === "wallets" && (
              <button onClick={() => setShowWalletForm(!showWalletForm)} className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-[13px] font-medium text-primary-foreground hover:opacity-90">
                <Plus className="h-3.5 w-3.5" /> New Wallet
              </button>
            )}
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="metric-card">
            <div className="flex items-center gap-2 mb-1">
              <BookOpen className="h-4 w-4 text-muted-foreground" />
              <p className="text-[13px] font-medium text-muted-foreground">Journal Entries</p>
            </div>
            <p className="text-2xl font-semibold text-foreground">{journalEntries.length}</p>
          </div>
          <div className="metric-card">
            <div className="flex items-center gap-2 mb-1">
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
              <p className="text-[13px] font-medium text-muted-foreground">Ledger Accounts</p>
            </div>
            <p className="text-2xl font-semibold text-foreground">{ledgerAccounts.length}</p>
          </div>
          <div className="metric-card bg-primary text-primary-foreground border-0">
            <div className="flex items-center gap-2 mb-1">
              <Wallet className="h-4 w-4 text-primary-foreground/60" />
              <p className="text-[13px] font-medium text-primary-foreground/70">Total Wallet Balance</p>
            </div>
            <p className="text-2xl font-semibold">{formatCurrency(totalWalletBalance)}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-border">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 px-3 py-2 text-[13px] font-medium border-b-2 transition-colors ${
                activeTab === tab.key
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <tab.icon className="h-3.5 w-3.5" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Account Form */}
        {activeTab === "accounts" && showAccountForm && (
          <form onSubmit={handleCreateAccount} className="metric-card space-y-3 animate-slide-up">
            <p className="text-[14px] font-bold text-foreground">New Ledger Account</p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
              <input type="text" placeholder="Code (e.g. 1000)" value={acctForm.code} onChange={(e) => setAcctForm({ ...acctForm, code: e.target.value })} required className="rounded-md border border-border bg-card px-3 py-2 text-[13px] outline-none" />
              <input type="text" placeholder="Account name" value={acctForm.name} onChange={(e) => setAcctForm({ ...acctForm, name: e.target.value })} required className="rounded-md border border-border bg-card px-3 py-2 text-[13px] outline-none" />
              <select value={acctForm.account_type} onChange={(e) => setAcctForm({ ...acctForm, account_type: e.target.value })} className="rounded-md border border-border bg-card px-3 py-2 text-[13px]">
                <option value="asset">Asset</option>
                <option value="liability">Liability</option>
                <option value="equity">Equity</option>
                <option value="revenue">Revenue</option>
                <option value="expense">Expense</option>
              </select>
              <button type="submit" disabled={createLedgerAccount.isPending} className="rounded-md bg-foreground px-3 py-2 text-[13px] font-medium text-background hover:opacity-90 disabled:opacity-50">
                {createLedgerAccount.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin mx-auto" /> : "Create"}
              </button>
            </div>
          </form>
        )}

        {/* Wallet Form */}
        {activeTab === "wallets" && showWalletForm && (
          <form onSubmit={handleCreateWallet} className="metric-card space-y-3 animate-slide-up">
            <p className="text-[14px] font-bold text-foreground">New Wallet</p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <input type="text" placeholder="Wallet name" value={walletForm.name} onChange={(e) => setWalletForm({ ...walletForm, name: e.target.value })} required className="rounded-md border border-border bg-card px-3 py-2 text-[13px] outline-none" />
              <select value={walletForm.wallet_type} onChange={(e) => setWalletForm({ ...walletForm, wallet_type: e.target.value })} className="rounded-md border border-border bg-card px-3 py-2 text-[13px]">
                <option value="operating">Operating</option>
                <option value="reserve">Reserve</option>
                <option value="investment">Investment</option>
                <option value="escrow">Escrow</option>
              </select>
              <button type="submit" disabled={createWallet.isPending} className="rounded-md bg-foreground px-3 py-2 text-[13px] font-medium text-background hover:opacity-90 disabled:opacity-50">
                {createWallet.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin mx-auto" /> : "Create"}
              </button>
            </div>
          </form>
        )}

        {/* Journal Entry Form */}
        {activeTab === "journal" && showJournalForm && (
          <form onSubmit={handleCreateJournalEntry} className="metric-card space-y-4 animate-slide-up">
            <p className="text-[14px] font-bold text-foreground">New Journal Entry</p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <input type="text" placeholder="Description" value={jeForm.description} onChange={(e) => setJeForm({ ...jeForm, description: e.target.value })} required className="rounded-md border border-border bg-card px-3 py-2 text-[13px] outline-none" />
              <input type="text" placeholder="Reference (optional)" value={jeForm.reference} onChange={(e) => setJeForm({ ...jeForm, reference: e.target.value })} className="rounded-md border border-border bg-card px-3 py-2 text-[13px] outline-none" />
              <input type="date" value={jeForm.entry_date} onChange={(e) => setJeForm({ ...jeForm, entry_date: e.target.value })} className="rounded-md border border-border bg-card px-3 py-2 text-[13px] outline-none" />
            </div>
            <div className="space-y-2">
              <div className="grid grid-cols-4 gap-2 text-xxs font-bold uppercase text-muted-foreground px-1">
                <span>Account</span><span>Debit</span><span>Credit</span><span></span>
              </div>
              {jeLines.map((line, idx) => (
                <div key={idx} className="grid grid-cols-4 gap-2">
                  <select value={line.ledger_account_id} onChange={(e) => updateJournalLine(idx, "ledger_account_id", e.target.value)} className="rounded-md border border-border bg-card px-2 py-1.5 text-[13px]">
                    <option value="">Select account</option>
                    {ledgerAccounts.map((a: any) => (
                      <option key={a.id} value={a.id}>{a.code} - {a.name}</option>
                    ))}
                  </select>
                  <input type="number" step="0.01" min="0" placeholder="0.00" value={line.debit || ""} onChange={(e) => updateJournalLine(idx, "debit", e.target.value)} className="rounded-md border border-border bg-card px-2 py-1.5 text-[13px] outline-none" />
                  <input type="number" step="0.01" min="0" placeholder="0.00" value={line.credit || ""} onChange={(e) => updateJournalLine(idx, "credit", e.target.value)} className="rounded-md border border-border bg-card px-2 py-1.5 text-[13px] outline-none" />
                  <button type="button" onClick={() => setJeLines(jeLines.filter((_, i) => i !== idx))} className="text-muted-foreground hover:text-foreground text-[13px]">×</button>
                </div>
              ))}
              <button type="button" onClick={addJournalLine} className="text-[13px] text-primary hover:underline">+ Add line</button>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-border">
              <div className="flex gap-4 text-[13px]">
                <span>Debit: <strong>{formatCurrency(totalDebit)}</strong></span>
                <span>Credit: <strong>{formatCurrency(totalCredit)}</strong></span>
                <span className={isBalanced ? "text-primary font-bold" : "text-destructive font-bold"}>
                  {isBalanced ? "✓ Balanced" : "✗ Unbalanced"}
                </span>
              </div>
              <button type="submit" disabled={createJournalEntry.isPending || !isBalanced} className="rounded-md bg-primary px-4 py-2 text-[13px] font-bold text-primary-foreground hover:opacity-90 disabled:opacity-50">
                {createJournalEntry.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Post Entry"}
              </button>
            </div>
          </form>
        )}

        {/* Tab Content */}
        {activeTab === "journal" && (
          <div className="overflow-hidden rounded-lg border border-border bg-card">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  {["Date", "Description", "Reference", "Status", "Lines"].map((h) => (
                    <th key={h} className="px-4 py-2.5 text-left text-xxs font-medium uppercase tracking-wider text-muted-foreground">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {journalEntries.length === 0 ? (
                  <tr><td colSpan={5} className="px-4 py-12 text-center text-[13px] text-muted-foreground">No journal entries. Create your first double-entry above.</td></tr>
                ) : (
                  journalEntries.map((je: any) => (
                    <tr key={je.id} className="border-b border-border last:border-0 hover:bg-secondary/50">
                      <td className="px-4 py-3 text-[13px] text-muted-foreground">{format(new Date(je.entry_date), "MMM d, yyyy")}</td>
                      <td className="px-4 py-3 text-[13px] font-medium text-foreground">{je.description || "—"}</td>
                      <td className="px-4 py-3 text-[13px] text-muted-foreground">{je.reference || "—"}</td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2 py-0.5 text-xxs font-medium ${
                          je.status === "posted" ? "bg-primary/10 text-primary" : "bg-secondary text-muted-foreground"
                        }`}>{je.status}</span>
                      </td>
                      <td className="px-4 py-3 text-[13px] text-muted-foreground">
                        {je.ledger_entries?.length || 0} entries
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === "accounts" && (
          <div className="overflow-hidden rounded-lg border border-border bg-card">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  {["Code", "Name", "Type", "Status"].map((h) => (
                    <th key={h} className="px-4 py-2.5 text-left text-xxs font-medium uppercase tracking-wider text-muted-foreground">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ledgerAccounts.length === 0 ? (
                  <tr><td colSpan={4} className="px-4 py-12 text-center text-[13px] text-muted-foreground">No accounts. Create your chart of accounts above.</td></tr>
                ) : (
                  ledgerAccounts.map((a: any) => (
                    <tr key={a.id} className="border-b border-border last:border-0 hover:bg-secondary/50">
                      <td className="px-4 py-3 text-[13px] font-mono font-bold text-foreground">{a.code}</td>
                      <td className="px-4 py-3 text-[13px] text-foreground">{a.name}</td>
                      <td className="px-4 py-3">
                        <span className="rounded-full bg-secondary px-2 py-0.5 text-xxs font-medium text-secondary-foreground capitalize">{a.account_type}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xxs font-bold text-primary">Active</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === "wallets" && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {wallets.length === 0 ? (
              <div className="col-span-full py-12 flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-secondary/10">
                <Wallet className="h-8 w-8 text-muted-foreground/30 mb-3" />
                <p className="text-[13px] font-medium text-muted-foreground">No wallets yet. Create your first wallet above.</p>
              </div>
            ) : (
              wallets.map((w: any) => (
                <div key={w.id} className="metric-card group hover:border-primary/20 transition-all">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary group-hover:bg-primary/5 transition-colors">
                        <Wallet className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                      </div>
                      <div>
                        <p className="text-[13px] font-bold text-foreground">{w.name}</p>
                        <p className="text-xxs font-bold uppercase tracking-tight text-muted-foreground/60">{w.wallet_type} · {w.currency}</p>
                      </div>
                    </div>
                  </div>
                  <p className="text-2xl font-bold tracking-tight text-foreground">{formatCurrency(Number(w.balance))}</p>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default Ledger;
