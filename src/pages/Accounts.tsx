import { AppLayout } from "@/components/layout/AppLayout";
import { Building2, Plus, ExternalLink } from "lucide-react";

const accounts = [
  { name: "Operating Account", bank: "Silicon Valley Bank", balance: "$842,300", type: "Checking", last4: "4521" },
  { name: "Payroll Account", bank: "Mercury", balance: "$215,400", type: "Checking", last4: "7832" },
  { name: "Savings Reserve", bank: "Mercury", balance: "$180,000", type: "Savings", last4: "9104" },
  { name: "Corporate Card", bank: "Brex", balance: "-$12,400", type: "Credit", last4: "3356" },
];

const Accounts = () => {
  const totalBalance = 842300 + 215400 + 180000 - 12400;

  return (
    <AppLayout>
      <div className="max-w-[1200px] space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-foreground">Accounts</h1>
            <p className="mt-0.5 text-[13px] text-muted-foreground">Manage all connected bank accounts</p>
          </div>
          <button className="flex items-center gap-1.5 rounded-md bg-foreground px-3 py-1.5 text-[13px] font-medium text-background hover:opacity-90 transition-opacity">
            <Plus className="h-3.5 w-3.5" />
            Connect Account
          </button>
        </div>

        <div className="metric-card">
          <p className="text-[13px] font-medium text-muted-foreground">Total Balance</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-foreground">${totalBalance.toLocaleString()}</p>
          <p className="mt-1 text-[13px] text-muted-foreground">Across {accounts.length} accounts</p>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {accounts.map((account) => (
            <div key={account.last4} className="metric-card group cursor-pointer transition-colors hover:bg-secondary/30">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-md bg-secondary">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-[13px] font-medium text-foreground">{account.name}</p>
                    <p className="text-xxs text-muted-foreground">{account.bank} · ••{account.last4}</p>
                  </div>
                </div>
                <ExternalLink className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <div className="mt-4">
                <p className={`text-xl font-semibold tracking-tight ${account.balance.startsWith("-") ? "text-destructive" : "text-foreground"}`}>
                  {account.balance}
                </p>
                <span className="mt-1.5 inline-block rounded-full bg-secondary px-2 py-0.5 text-xxs font-medium text-secondary-foreground">
                  {account.type}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
};

export default Accounts;
