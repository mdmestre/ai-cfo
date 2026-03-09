import { AppLayout } from "@/components/layout/AppLayout";
import { useLedger } from "@/hooks/use-ledger";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2, Plus, BookOpen, Wallet, BarChart3 } from "lucide-react";
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

const accountTypeLabels: Record<string, string> = {
  asset: "Ativo",
  liability: "Passivo",
  equity: "Patrimônio",
  revenue: "Receita",
  expense: "Despesa",
};

const walletTypeLabels: Record<string, string> = {
  operating: "Operacional",
  reserve: "Reserva",
  investment: "Investimento",
  escrow: "Custódia",
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

  const [acctForm, setAcctForm] = useState({ code: "", name: "", account_type: "asset" });
  const [walletForm, setWalletForm] = useState({ name: "", wallet_type: "operating" });
  const [jeForm, setJeForm] = useState({ description: "", reference: "", entry_date: "" });
  const [jeLines, setJeLines] = useState([
    { ledger_account_id: "", debit: 0, credit: 0 },
    { ledger_account_id: "", debit: 0, credit: 0 },
  ]);

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createLedgerAccount.mutateAsync(acctForm);
      toast.success("Conta contábil criada");
      setAcctForm({ code: "", name: "", account_type: "asset" });
      setShowAccountForm(false);
    } catch (err: any) { toast.error(err.message || "Falha ao criar"); }
  };

  const handleCreateWallet = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createWallet.mutateAsync(walletForm);
      toast.success("Carteira criada");
      setWalletForm({ name: "", wallet_type: "operating" });
      setShowWalletForm(false);
    } catch (err: any) { toast.error(err.message || "Falha ao criar"); }
  };

  const handleCreateJournalEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    const validLines = jeLines.filter((l) => l.ledger_account_id && (l.debit > 0 || l.credit > 0));
    if (validLines.length < 2) return toast.error("Mínimo de 2 linhas necessário");
    try {
      await createJournalEntry.mutateAsync({
        description: jeForm.description,
        reference: jeForm.reference || undefined,
        entry_date: jeForm.entry_date || undefined,
        lines: validLines,
      });
      toast.success("Lançamento registrado");
      setJeForm({ description: "", reference: "", entry_date: "" });
      setJeLines([{ ledger_account_id: "", debit: 0, credit: 0 }, { ledger_account_id: "", debit: 0, credit: 0 }]);
      setShowJournalForm(false);
    } catch (err: any) { toast.error(err.message || "Falha ao registrar"); }
  };

  const addLine = () => setJeLines([...jeLines, { ledger_account_id: "", debit: 0, credit: 0 }]);
  const updateLine = (idx: number, field: string, value: any) => {
    const updated = [...jeLines];
    (updated[idx] as any)[field] = field === "debit" || field === "credit" ? Number(value) || 0 : value;
    setJeLines(updated);
  };

  const totalDebit = jeLines.reduce((s, l) => s + l.debit, 0);
  const totalCredit = jeLines.reduce((s, l) => s + l.credit, 0);
  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01 && totalDebit > 0;

  if (isLoading) {
    return <AppLayout><div className="flex items-center justify-center h-64"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div></AppLayout>;
  }

  const tabs = [
    { key: "journal", label: "Diário", icon: BookOpen },
    { key: "accounts", label: "Plano de Contas", icon: BarChart3 },
    { key: "wallets", label: "Carteiras", icon: Wallet },
  ] as const;

  return (
    <AppLayout>
      <div className="max-w-[1200px] space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-foreground tracking-tight">Livro Contábil</h1>
            <p className="mt-0.5 text-[13px] text-muted-foreground">Sistema de partidas dobradas</p>
          </div>
          <div className="flex gap-2">
            {activeTab === "journal" && (
              <button onClick={() => setShowJournalForm(!showJournalForm)} className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-[13px] font-medium text-primary-foreground hover:opacity-90">
                <Plus className="h-3.5 w-3.5" /> Novo Lançamento
              </button>
            )}
            {activeTab === "accounts" && (
              <button onClick={() => setShowAccountForm(!showAccountForm)} className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-[13px] font-medium text-primary-foreground hover:opacity-90">
                <Plus className="h-3.5 w-3.5" /> Nova Conta
              </button>
            )}
            {activeTab === "wallets" && (
              <button onClick={() => setShowWalletForm(!showWalletForm)} className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-[13px] font-medium text-primary-foreground hover:opacity-90">
                <Plus className="h-3.5 w-3.5" /> Nova Carteira
              </button>
            )}
          </div>
        </div>

        {/* Resumo */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="metric-card"><div className="flex items-center gap-2 mb-1"><BookOpen className="h-4 w-4 text-muted-foreground" /><p className="text-[13px] font-medium text-muted-foreground">Lançamentos</p></div><p className="text-2xl font-semibold text-foreground">{journalEntries.length}</p></div>
          <div className="metric-card"><div className="flex items-center gap-2 mb-1"><BarChart3 className="h-4 w-4 text-muted-foreground" /><p className="text-[13px] font-medium text-muted-foreground">Contas Contábeis</p></div><p className="text-2xl font-semibold text-foreground">{ledgerAccounts.length}</p></div>
          <div className="metric-card bg-primary text-primary-foreground border-0"><div className="flex items-center gap-2 mb-1"><Wallet className="h-4 w-4 text-primary-foreground/60" /><p className="text-[13px] font-medium text-primary-foreground/70">Saldo das Carteiras</p></div><p className="text-2xl font-semibold">{fmt(totalWalletBalance)}</p></div>
        </div>

        {/* Abas */}
        <div className="flex gap-1 border-b border-border">
          {tabs.map((tab) => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)} className={`flex items-center gap-1.5 px-3 py-2 text-[13px] font-medium border-b-2 transition-colors ${activeTab === tab.key ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
              <tab.icon className="h-3.5 w-3.5" />{tab.label}
            </button>
          ))}
        </div>

        {/* Formulário de Conta */}
        {activeTab === "accounts" && showAccountForm && (
          <form onSubmit={handleCreateAccount} className="metric-card space-y-3 animate-slide-up">
            <p className="text-[14px] font-bold text-foreground">Nova Conta Contábil</p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
              <div className="space-y-1">
                <Label className="text-[11px] text-muted-foreground">Código</Label>
                <Input placeholder="Ex: 1000" value={acctForm.code} onChange={(e) => setAcctForm({ ...acctForm, code: e.target.value })} required className="h-9 text-[13px]" />
              </div>
              <div className="space-y-1">
                <Label className="text-[11px] text-muted-foreground">Nome</Label>
                <Input placeholder="Nome da conta" value={acctForm.name} onChange={(e) => setAcctForm({ ...acctForm, name: e.target.value })} required className="h-9 text-[13px]" />
              </div>
              <div className="space-y-1">
                <Label className="text-[11px] text-muted-foreground">Tipo</Label>
                <Select value={acctForm.account_type} onValueChange={(v) => setAcctForm({ ...acctForm, account_type: v })}>
                  <SelectTrigger className="h-9 text-[13px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(accountTypeLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <button type="submit" disabled={createLedgerAccount.isPending} className="w-full rounded-md bg-foreground px-3 py-2 text-[13px] font-medium text-background hover:opacity-90 disabled:opacity-50 h-9">Criar</button>
              </div>
            </div>
          </form>
        )}

        {/* Formulário de Carteira */}
        {activeTab === "wallets" && showWalletForm && (
          <form onSubmit={handleCreateWallet} className="metric-card space-y-3 animate-slide-up">
            <p className="text-[14px] font-bold text-foreground">Nova Carteira</p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="space-y-1">
                <Label className="text-[11px] text-muted-foreground">Nome</Label>
                <Input placeholder="Nome da carteira" value={walletForm.name} onChange={(e) => setWalletForm({ ...walletForm, name: e.target.value })} required className="h-9 text-[13px]" />
              </div>
              <div className="space-y-1">
                <Label className="text-[11px] text-muted-foreground">Tipo</Label>
                <Select value={walletForm.wallet_type} onValueChange={(v) => setWalletForm({ ...walletForm, wallet_type: v })}>
                  <SelectTrigger className="h-9 text-[13px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(walletTypeLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <button type="submit" disabled={createWallet.isPending} className="w-full rounded-md bg-foreground px-3 py-2 text-[13px] font-medium text-background hover:opacity-90 disabled:opacity-50 h-9">Criar</button>
              </div>
            </div>
          </form>
        )}

        {/* Formulário de Lançamento */}
        {activeTab === "journal" && showJournalForm && (
          <form onSubmit={handleCreateJournalEntry} className="metric-card space-y-4 animate-slide-up">
            <p className="text-[14px] font-bold text-foreground">Novo Lançamento</p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="space-y-1">
                <Label className="text-[11px] text-muted-foreground">Descrição</Label>
                <Input placeholder="Descrição" value={jeForm.description} onChange={(e) => setJeForm({ ...jeForm, description: e.target.value })} required className="h-9 text-[13px]" />
              </div>
              <div className="space-y-1">
                <Label className="text-[11px] text-muted-foreground">Referência (opcional)</Label>
                <Input placeholder="Referência" value={jeForm.reference} onChange={(e) => setJeForm({ ...jeForm, reference: e.target.value })} className="h-9 text-[13px]" />
              </div>
              <div className="space-y-1">
                <Label className="text-[11px] text-muted-foreground">Data</Label>
                <Input type="date" value={jeForm.entry_date} onChange={(e) => setJeForm({ ...jeForm, entry_date: e.target.value })} className="h-9 text-[13px]" />
              </div>
            </div>
            <div className="space-y-2">
              <div className="grid grid-cols-4 gap-2 text-xxs font-bold uppercase text-muted-foreground px-1"><span>Conta</span><span>Débito (R$)</span><span>Crédito (R$)</span><span></span></div>
              {jeLines.map((line, idx) => (
                <div key={idx} className="grid grid-cols-4 gap-2">
                  <Select value={line.ledger_account_id || "placeholder"} onValueChange={(v) => updateLine(idx, "ledger_account_id", v === "placeholder" ? "" : v)}>
                    <SelectTrigger className="h-9 text-[13px]"><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      {ledgerAccounts.map((a: any) => <SelectItem key={a.id} value={a.id}>{a.code} - {a.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Input placeholder="0,00" value={line.debit || ""} onChange={(e) => {
                    const val = e.target.value.replace(/[^\d,]/g, '').replace(',', '.');
                    updateLine(idx, "debit", val);
                  }} className="h-9 text-[13px]" />
                  <Input placeholder="0,00" value={line.credit || ""} onChange={(e) => {
                    const val = e.target.value.replace(/[^\d,]/g, '').replace(',', '.');
                    updateLine(idx, "credit", val);
                  }} className="h-9 text-[13px]" />
                  <button type="button" onClick={() => setJeLines(jeLines.filter((_, i) => i !== idx))} className="text-muted-foreground hover:text-foreground text-[13px]">×</button>
                </div>
              ))}
              <button type="button" onClick={addLine} className="text-[13px] text-primary hover:underline">+ Adicionar linha</button>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-border">
              <div className="flex gap-4 text-[13px]">
                <span>Débito: <strong>{fmt(totalDebit)}</strong></span>
                <span>Crédito: <strong>{fmt(totalCredit)}</strong></span>
                <span className={isBalanced ? "text-primary font-bold" : "text-destructive font-bold"}>{isBalanced ? "✓ Balanceado" : "✗ Desbalanceado"}</span>
              </div>
              <button type="submit" disabled={createJournalEntry.isPending || !isBalanced} className="rounded-md bg-primary px-4 py-2 text-[13px] font-bold text-primary-foreground hover:opacity-90 disabled:opacity-50">
                {createJournalEntry.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Registrar"}
              </button>
            </div>
          </form>
        )}

        {/* Conteúdo */}
        {activeTab === "journal" && (
          <div className="overflow-hidden rounded-lg border border-border bg-card">
            <table className="w-full">
              <thead><tr className="border-b border-border">{["Data", "Descrição", "Referência", "Status", "Linhas"].map((h) => <th key={h} className="px-4 py-2.5 text-left text-xxs font-medium uppercase tracking-wider text-muted-foreground">{h}</th>)}</tr></thead>
              <tbody>
                {journalEntries.length === 0 ? (
                  <tr><td colSpan={5} className="px-4 py-12 text-center text-[13px] text-muted-foreground">Nenhum lançamento ainda.</td></tr>
                ) : journalEntries.map((je: any) => (
                  <tr key={je.id} className="border-b border-border last:border-0 hover:bg-secondary/50">
                    <td className="px-4 py-3 text-[13px] text-muted-foreground">{format(new Date(je.entry_date), "dd/MM/yyyy", { locale: ptBR })}</td>
                    <td className="px-4 py-3 text-[13px] font-medium text-foreground">{je.description || "—"}</td>
                    <td className="px-4 py-3 text-[13px] text-muted-foreground">{je.reference || "—"}</td>
                    <td className="px-4 py-3"><span className={`rounded-full px-2 py-0.5 text-xxs font-medium ${je.status === "posted" ? "bg-primary/10 text-primary" : "bg-secondary text-muted-foreground"}`}>{je.status === "posted" ? "Lançado" : je.status}</span></td>
                    <td className="px-4 py-3 text-[13px] text-muted-foreground">{je.ledger_entries?.length || 0} linhas</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === "accounts" && (
          <div className="overflow-hidden rounded-lg border border-border bg-card">
            <table className="w-full">
              <thead><tr className="border-b border-border">{["Código", "Nome", "Tipo", "Status"].map((h) => <th key={h} className="px-4 py-2.5 text-left text-xxs font-medium uppercase tracking-wider text-muted-foreground">{h}</th>)}</tr></thead>
              <tbody>
                {ledgerAccounts.length === 0 ? (
                  <tr><td colSpan={4} className="px-4 py-12 text-center text-[13px] text-muted-foreground">Nenhuma conta ainda.</td></tr>
                ) : ledgerAccounts.map((a: any) => (
                  <tr key={a.id} className="border-b border-border last:border-0 hover:bg-secondary/50">
                    <td className="px-4 py-3 text-[13px] font-mono font-bold text-foreground">{a.code}</td>
                    <td className="px-4 py-3 text-[13px] text-foreground">{a.name}</td>
                    <td className="px-4 py-3"><span className="rounded-full bg-secondary px-2 py-0.5 text-xxs font-medium capitalize">{accountTypeLabels[a.account_type] || a.account_type}</span></td>
                    <td className="px-4 py-3"><span className="text-xxs font-bold text-primary">Ativa</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === "wallets" && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {wallets.length === 0 ? (
              <div className="col-span-full py-12 flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-secondary/10">
                <Wallet className="h-8 w-8 text-muted-foreground/30 mb-3" />
                <p className="text-[13px] font-medium text-muted-foreground">Nenhuma carteira ainda.</p>
              </div>
            ) : wallets.map((w: any) => (
              <div key={w.id} className="metric-card group hover:border-primary/20 transition-all">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary group-hover:bg-primary/5"><Wallet className="h-4 w-4 text-muted-foreground group-hover:text-primary" /></div>
                  <div>
                    <p className="text-[13px] font-bold text-foreground">{w.name}</p>
                    <p className="text-xxs font-bold uppercase text-muted-foreground/60">{walletTypeLabels[w.wallet_type] || w.wallet_type} · {w.currency}</p>
                  </div>
                </div>
                <p className="text-2xl font-bold tracking-tight text-foreground">{fmt(Number(w.balance))}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default Ledger;
