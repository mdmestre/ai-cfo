import { AppLayout } from "@/components/layout/AppLayout";
import { useAccounts } from "@/hooks/use-accounts";
import { useCompany } from "@/hooks/use-company";
import { useBankConnections } from "@/hooks/use-bank-connections";
import { BankConnectionCard } from "@/components/accounts/BankConnectionCard";
import { AccountCard } from "@/components/accounts/AccountCard";
import { BelvoConnectButton } from "@/components/accounts/BelvoConnectButton";
import { BelvoSyncButton } from "@/components/accounts/BelvoSyncButton";
import { Plus, Loader2, DollarSign, Wallet, RefreshCw, Building2, Zap } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

const availableBanks = [
  { name: "Itaú Unibanco", provider: "open_finance_br" },
  { name: "Nubank", provider: "open_finance_br" },
  { name: "Bradesco", provider: "open_finance_br" },
  { name: "Banco do Brasil", provider: "open_finance_br" },
  { name: "Santander", provider: "open_finance_br" },
  { name: "Inter", provider: "open_finance_br" },
  { name: "C6 Bank", provider: "open_finance_br" },
  { name: "BTG Pactual", provider: "open_finance_br" },
];

const Accounts = () => {
  const { accounts, isLoading: accountsLoading, createAccount, updateAccount, deleteAccount, totalBalance } = useAccounts();
  const { connections, isLoading: connectionsLoading, connectBank, disconnectBank, syncConnection } = useBankConnections();
  const { company } = useCompany();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ bank_name: "", account_type: "checking", balance: "" });
  const [connectingId, setConnectingId] = useState<string | null>(null);
  const [syncingId, setSyncingId] = useState<string | null>(null);

  const handleConnect = async (institution: string, provider: string) => {
    setConnectingId(institution);
    try {
      await connectBank.mutateAsync({ provider, institution });
      toast.success(`${institution} conectado com sucesso!`);
    } catch {
      toast.error("Falha ao conectar instituição.");
    } finally {
      setConnectingId(null);
    }
  };

  const handleDisconnect = async (connectionId: string, name: string) => {
    try {
      await disconnectBank.mutateAsync(connectionId);
      toast.success(`${name} desconectado.`);
    } catch {
      toast.error("Falha ao desconectar.");
    }
  };

  const handleSync = async (connectionId: string) => {
    setSyncingId(connectionId);
    try {
      await syncConnection.mutateAsync(connectionId);
      toast.success("Dados sincronizados!");
    } catch {
      toast.error("Falha na sincronização.");
    } finally {
      setSyncingId(null);
    }
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createAccount.mutate(
      { bank_name: formData.bank_name, account_type: formData.account_type, balance: parseFloat(formData.balance) || 0 },
      {
        onSuccess: () => {
          toast.success("Conta criada com sucesso!");
          setFormData({ bank_name: "", account_type: "checking", balance: "" });
          setShowForm(false);
        },
      }
    );
  };

  const handleUpdate = (id: string, data: { bank_name?: string; account_type?: string; balance?: number }) => {
    updateAccount.mutate(
      { id, ...data },
      { onSuccess: () => toast.success("Conta atualizada!") }
    );
  };

  const handleDelete = (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta conta?")) return;
    deleteAccount.mutate(id, { onSuccess: () => toast.success("Conta excluída.") });
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

  const connectedCount = connections.filter((c) => c.status === "connected").length;

  return (
    <AppLayout>
      <div className="max-w-[1200px] space-y-8 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-foreground tracking-tight">Contas</h1>
            <p className="mt-0.5 text-[13px] text-muted-foreground">
              {company?.name} — gerencie contas bancárias e conexões
            </p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-[12px] font-bold text-primary-foreground hover:opacity-90 transition-all active:scale-[0.98] shadow-sm"
          >
            <Plus className="h-3.5 w-3.5" />
            Adicionar Conta
          </button>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="metric-card bg-gradient-to-br from-primary to-primary/80 text-primary-foreground border-0">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="h-4 w-4 opacity-60" />
              <p className="text-[12px] font-medium opacity-70">Posição Total</p>
            </div>
            <p className="text-2xl font-bold tracking-tight">{formatCurrency(totalBalance)}</p>
            <p className="mt-1 text-[11px] opacity-50">{accounts.length} conta(s) ativa(s)</p>
          </div>
          <div className="metric-card">
            <div className="flex items-center gap-2 mb-1">
              <Wallet className="h-4 w-4 text-muted-foreground" />
              <p className="text-[12px] font-medium text-muted-foreground">Conexões Bancárias</p>
            </div>
            <p className="text-2xl font-bold text-foreground">{connectedCount}</p>
            <p className="mt-1 text-[11px] text-muted-foreground">{availableBanks.length} disponíveis</p>
          </div>
          <div className="metric-card">
            <div className="flex items-center gap-2 mb-1">
              <RefreshCw className="h-4 w-4 text-muted-foreground" />
              <p className="text-[12px] font-medium text-muted-foreground">Status de Sync</p>
            </div>
            <p className={`text-2xl font-bold ${connectedCount > 0 ? "text-success" : "text-muted-foreground"}`}>
              {connectedCount > 0 ? "Saudável" : "Nenhum"}
            </p>
            <p className="mt-1 text-[11px] text-muted-foreground">Open Finance Brasil</p>
          </div>
        </div>

        {/* Manual Account Form */}
        {showForm && (
          <form onSubmit={handleCreate} className="metric-card space-y-4 animate-slide-up border-primary/20 ring-1 ring-primary/10">
            <p className="text-[13px] font-bold text-foreground">Nova Conta Manual</p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
              <div className="space-y-1">
                <Label className="text-[11px] font-bold uppercase text-muted-foreground">Banco</Label>
                <Input
                  placeholder="Ex: Nubank, Itaú..."
                  value={formData.bank_name}
                  onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                  required
                  className="h-9 text-[13px]"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[11px] font-bold uppercase text-muted-foreground">Tipo</Label>
                <Select value={formData.account_type} onValueChange={(v) => setFormData({ ...formData, account_type: v })}>
                  <SelectTrigger className="h-9 text-[13px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="checking">Conta Corrente</SelectItem>
                    <SelectItem value="savings">Poupança</SelectItem>
                    <SelectItem value="credit">Crédito Corporativo</SelectItem>
                    <SelectItem value="investment">Investimento</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-[11px] font-bold uppercase text-muted-foreground">Saldo Atual (R$)</Label>
                <Input
                  placeholder="0,00"
                  value={formData.balance}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^\d,]/g, '').replace(',', '.');
                    setFormData({ ...formData, balance: val });
                  }}
                  className="h-9 text-[13px]"
                />
              </div>
              <div className="flex items-end">
                <button
                  type="submit"
                  disabled={createAccount.isPending}
                  className="w-full flex items-center justify-center gap-2 rounded-md bg-foreground px-3 py-2 text-[13px] font-bold text-background hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {createAccount.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Criar Conta
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Belvo Open Finance */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-[15px] font-bold text-foreground flex items-center gap-2">
                <Zap className="h-4 w-4 text-primary" />
                Open Finance Brasil — Belvo
              </h2>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Conecte seus bancos automaticamente e sincronize saldos, transações e investimentos em tempo real.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <BelvoSyncButton />
            </div>
          </div>

          <div className="metric-card border-primary/10 bg-gradient-to-br from-primary/5 to-transparent">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <p className="text-[13px] font-bold text-foreground">Conectar novo banco</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Conecte qualquer banco brasileiro via Open Finance. Suporte a saldos, extratos, investimentos e pagamentos.
                </p>
              </div>
              <BelvoConnectButton />
            </div>
          </div>

          {/* Existing connections */}
          {connections.length > 0 && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {connections.map((conn) => (
                <BankConnectionCard
                  key={conn.id}
                  institution={conn.institution_name}
                  provider={conn.provider}
                  status={conn.status === "connected" ? "connected" : "not_connected"}
                  lastSynced={conn.last_synced_at}
                  isSyncing={syncingId === conn.id}
                  onDisconnect={() => handleDisconnect(conn.id, conn.institution_name)}
                  onSync={() => handleSync(conn.id)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Manual Bank Connections */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-[15px] font-bold text-foreground">Conexão Manual</h2>
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 bg-secondary px-2.5 py-1 rounded-full">
              Manual
            </span>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {availableBanks.map((bank) => {
              const connection = connections.find((c) => c.institution_name === bank.name && c.provider !== "belvo");
              const isConnected = !!connection;
              return (
                <BankConnectionCard
                  key={bank.name}
                  institution={bank.name}
                  provider={bank.provider}
                  status={isConnected ? "connected" : "not_connected"}
                  lastSynced={connection?.last_synced_at}
                  isConnecting={connectingId === bank.name}
                  isSyncing={!!connection && syncingId === connection.id}
                  onConnect={() => handleConnect(bank.name, bank.provider)}
                  onDisconnect={() => connection && handleDisconnect(connection.id, bank.name)}
                  onSync={() => connection && handleSync(connection.id)}
                />
              );
            })}
          </div>
        </div>

        {/* Accounts List */}
        <div className="space-y-4">
          <h2 className="text-[15px] font-bold text-foreground">Suas Contas</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {accounts.length === 0 ? (
              <div className="col-span-full py-12 flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-secondary/10">
                <Building2 className="h-8 w-8 text-muted-foreground/30 mb-3" />
                <p className="text-[13px] font-medium text-muted-foreground text-center">
                  Nenhuma conta ativa. Conecte um banco acima ou adicione manualmente.
                </p>
              </div>
            ) : (
              accounts.map((account) => (
                <AccountCard
                  key={account.id}
                  account={account}
                  onUpdate={handleUpdate}
                  onDelete={handleDelete}
                  isUpdating={updateAccount.isPending}
                />
              ))
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Accounts;
