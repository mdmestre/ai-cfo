import { Building2 } from "lucide-react";
import { formatBRLCompact } from "@/lib/format";

interface Account {
  id: string;
  bank_name: string;
  account_type: string;
  balance: number;
}

interface Wallet {
  id: string;
  name: string;
  wallet_type: string;
  balance: number;
  currency: string;
}

export function AccountsOverview({ accounts, wallets }: { accounts: Account[]; wallets: Wallet[] }) {
  const all = [
    ...accounts.map((a) => ({
      id: a.id,
      name: a.bank_name,
      type: a.account_type,
      balance: Number(a.balance),
      currency: "BRL",
    })),
    ...wallets.map((w) => ({
      id: w.id,
      name: w.name,
      type: w.wallet_type,
      balance: Number(w.balance),
      currency: w.currency,
    })),
  ];

  return (
    <div className="metric-card animate-slide-up">
      <div className="flex items-center gap-2 mb-4">
        <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
        <p className="text-[13px] font-medium text-muted-foreground">Contas e carteiras</p>
      </div>

      {all.length > 0 ? (
        <div className="space-y-0">
          {all.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between py-2.5 border-b border-border/50 last:border-0"
            >
              <div>
                <p className="text-[13px] font-medium text-foreground">{item.name}</p>
                <p className="text-[11px] text-muted-foreground capitalize">
                  {item.type} - {item.currency}
                </p>
              </div>

              <p
                className={`text-[13px] font-semibold ${
                  item.balance >= 0 ? "text-foreground" : "text-destructive"
                }`}
              >
                {formatBRLCompact(item.balance)}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-[13px] text-muted-foreground py-8 text-center">
          Nenhuma conta conectada ainda.
        </p>
      )}
    </div>
  );
}

