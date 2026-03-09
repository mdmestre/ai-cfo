import { Building2, Pencil, Trash2, X, Check, Loader2 } from "lucide-react";
import { useState } from "react";

interface AccountCardProps {
  account: {
    id: string;
    bank_name: string;
    account_type: string;
    balance: number;
  };
  onUpdate: (id: string, data: { bank_name?: string; account_type?: string; balance?: number }) => void;
  onDelete: (id: string) => void;
  isUpdating?: boolean;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
};

const typeLabels: Record<string, string> = {
  checking: "Conta Corrente",
  savings: "Poupança",
  credit: "Crédito Corporativo",
  investment: "Investimento",
};

export function AccountCard({ account, onUpdate, onDelete, isUpdating }: AccountCardProps) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    bank_name: account.bank_name,
    account_type: account.account_type,
    balance: String(account.balance),
  });

  const handleSave = () => {
    onUpdate(account.id, {
      bank_name: form.bank_name,
      account_type: form.account_type,
      balance: parseFloat(form.balance) || 0,
    });
    setEditing(false);
  };

  if (editing) {
    return (
      <div className="metric-card space-y-3 border-primary/20 ring-1 ring-primary/10">
        <div className="flex items-center justify-between">
          <p className="text-[12px] font-bold uppercase tracking-wider text-primary">Editando</p>
          <div className="flex gap-1">
            <button onClick={() => setEditing(false)} className="rounded-md p-1.5 hover:bg-secondary">
              <X className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
            <button onClick={handleSave} disabled={isUpdating} className="rounded-md p-1.5 hover:bg-success/10">
              {isUpdating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5 text-success" />}
            </button>
          </div>
        </div>
        <input
          value={form.bank_name}
          onChange={(e) => setForm({ ...form, bank_name: e.target.value })}
          className="w-full rounded-md border border-border bg-card px-3 py-1.5 text-[13px] text-foreground outline-none focus:ring-1 focus:ring-primary"
          placeholder="Nome do banco"
        />
        <select
          value={form.account_type}
          onChange={(e) => setForm({ ...form, account_type: e.target.value })}
          className="w-full rounded-md border border-border bg-card px-3 py-1.5 text-[13px] text-foreground outline-none focus:ring-1 focus:ring-primary"
        >
          <option value="checking">Conta Corrente</option>
          <option value="savings">Poupança</option>
          <option value="credit">Crédito Corporativo</option>
          <option value="investment">Investimento</option>
        </select>
        <input
          type="number"
          step="0.01"
          value={form.balance}
          onChange={(e) => setForm({ ...form, balance: e.target.value })}
          className="w-full rounded-md border border-border bg-card px-3 py-1.5 text-[13px] text-foreground outline-none focus:ring-1 focus:ring-primary"
          placeholder="Saldo"
        />
      </div>
    );
  }

  return (
    <div className="metric-card group hover:border-primary/20 transition-all">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary group-hover:bg-primary/5 transition-colors">
            <Building2 className="h-4.5 w-4.5 text-muted-foreground group-hover:text-primary transition-colors" />
          </div>
          <div>
            <p className="text-[13px] font-bold text-foreground">{account.bank_name}</p>
            <p className="text-[11px] font-medium uppercase tracking-tight text-muted-foreground/60">
              {typeLabels[account.account_type] || account.account_type}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={() => setEditing(true)} className="rounded-md p-1.5 hover:bg-secondary" title="Editar">
            <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
          <button onClick={() => onDelete(account.id)} className="rounded-md p-1.5 hover:bg-destructive/10" title="Excluir">
            <Trash2 className="h-3.5 w-3.5 text-destructive/70" />
          </button>
        </div>
      </div>
      <div>
        <p className="text-2xl font-bold tracking-tight text-foreground">{formatCurrency(Number(account.balance))}</p>
        <div className="mt-1 flex items-center gap-1.5">
          <div className="h-1.5 w-1.5 rounded-full bg-success ring-2 ring-success/10" />
          <p className="text-[11px] font-medium text-muted-foreground/60">Sincronizado</p>
        </div>
      </div>
    </div>
  );
}
