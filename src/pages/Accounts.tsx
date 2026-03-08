import { AppLayout } from "@/components/layout/AppLayout";
import { useState } from "react";
import {
  Building2, Plus, ExternalLink, ArrowUpRight, ArrowDownRight,
  RefreshCw, Eye, EyeOff, ChevronRight, Wifi, WifiOff,
  TrendingUp, Shield, Clock, CheckCircle2, AlertCircle,
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell } from "recharts";

interface Account {
  id: string;
  name: string;
  bank: string;
  balance: number;
  type: "Checking" | "Savings" | "Credit" | "Investment" | "Money Market";
  last4: string;
  logo: string;
  connected: boolean;
  lastSync: string;
  change: number;
  currency: string;
}

const accounts: Account[] = [
  { id: "1", name: "Operating Account", bank: "Silicon Valley Bank", balance: 842300, type: "Checking", last4: "4521", logo: "🏦", connected: true, lastSync: "2 min ago", change: +3.2, currency: "USD" },
  { id: "2", name: "Payroll Account", bank: "Mercury", balance: 215400, type: "Checking", last4: "7832", logo: "🪙", connected: true, lastSync: "5 min ago", change: -1.8, currency: "USD" },
  { id: "3", name: "Savings Reserve", bank: "Mercury", balance: 180000, type: "Savings", last4: "9104", logo: "🪙", connected: true, lastSync: "5 min ago", change: +0.4, currency: "USD" },
  { id: "4", name: "Corporate Card", bank: "Brex", balance: -12400, type: "Credit", last4: "3356", logo: "💳", connected: true, lastSync: "1 min ago", change: +8.5, currency: "USD" },
  { id: "5", name: "Growth Fund", bank: "JP Morgan", balance: 520000, type: "Investment", last4: "6721", logo: "📈", connected: true, lastSync: "15 min ago", change: +12.3, currency: "USD" },
  { id: "6", name: "Reserve Fund", bank: "Chase", balance: 340000, type: "Money Market", last4: "1198", logo: "🏛️", connected: true, lastSync: "8 min ago", change: +1.1, currency: "USD" },
  { id: "7", name: "EU Operations", bank: "Revolut Business", balance: 95200, type: "Checking", last4: "4402", logo: "🔵", connected: true, lastSync: "12 min ago", change: -2.4, currency: "EUR" },
  { id: "8", name: "UK Revenue", bank: "Wise Business", balance: 68500, type: "Checking", last4: "8810", logo: "🟢", connected: false, lastSync: "3 hours ago", change: 0, currency: "GBP" },
];

const bankBreakdown = [
  { name: "Silicon Valley Bank", value: 842300, color: "hsl(0 0% 9%)" },
  { name: "Mercury", value: 395400, color: "hsl(24 95% 53%)" },
  { name: "JP Morgan", value: 520000, color: "hsl(220 70% 50%)" },
  { name: "Chase", value: 340000, color: "hsl(160 84% 39%)" },
  { name: "Brex", value: 12400, color: "hsl(0 72% 51%)" },
  { name: "Revolut", value: 95200, color: "hsl(250 60% 55%)" },
  { name: "Wise", value: 68500, color: "hsl(45 90% 50%)" },
];

const liquidityTrend = [
  { month: "Oct", total: 1850000 },
  { month: "Nov", total: 1920000 },
  { month: "Dec", total: 1980000 },
  { month: "Jan", total: 2050000 },
  { month: "Feb", total: 2150000 },
  { month: "Mar", total: 2249000 },
];

const formatCurrency = (value: number) => {
  if (Math.abs(value) >= 1000000) return `$${(value / 1000000).toFixed(2)}M`;
  if (Math.abs(value) >= 1000) return `$${(value / 1000).toFixed(0)}K`;
  return `$${value.toLocaleString()}`;
};

type ViewMode = "grid" | "list";
type FilterType = "all" | "checking" | "savings" | "credit" | "investment";

const Accounts = () => {
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [filter, setFilter] = useState<FilterType>("all");
  const [balancesVisible, setBalancesVisible] = useState(true);
  const [syncing, setSyncing] = useState(false);

  const connectedAccounts = accounts.filter(a => a.connected);
  const totalBalance = accounts.reduce((sum, a) => sum + a.balance, 0);
  const totalLiquidity = accounts.filter(a => a.type !== "Credit" && a.type !== "Investment").reduce((sum, a) => sum + a.balance, 0);
  const totalInvestments = accounts.filter(a => a.type === "Investment").reduce((sum, a) => sum + a.balance, 0);
  const totalDebt = Math.abs(accounts.filter(a => a.balance < 0).reduce((sum, a) => sum + a.balance, 0));

  const filtered = accounts.filter(a => {
    if (filter === "all") return true;
    if (filter === "checking") return a.type === "Checking";
    if (filter === "savings") return a.type === "Savings" || a.type === "Money Market";
    if (filter === "credit") return a.type === "Credit";
    if (filter === "investment") return a.type === "Investment";
    return true;
  });

  const handleSync = () => {
    setSyncing(true);
    setTimeout(() => setSyncing(false), 2000);
  };

  return (
    <AppLayout>
      <div className="max-w-[1200px] space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-foreground">Financial Hub</h1>
            <p className="mt-0.5 text-[13px] text-muted-foreground">
              Unified view of {connectedAccounts.length} connected accounts across {new Set(accounts.map(a => a.bank)).size} institutions
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setBalancesVisible(!balancesVisible)} className="flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-[13px] font-medium text-foreground hover:bg-secondary transition-colors">
              {balancesVisible ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
              {balancesVisible ? "Hide" : "Show"}
            </button>
            <button onClick={handleSync} className="flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-[13px] font-medium text-foreground hover:bg-secondary transition-colors">
              <RefreshCw className={`h-3.5 w-3.5 ${syncing ? "animate-spin" : ""}`} />
              {syncing ? "Syncing..." : "Sync All"}
            </button>
            <button className="flex items-center gap-1.5 rounded-md bg-foreground px-3 py-1.5 text-[13px] font-medium text-background hover:opacity-90 transition-opacity">
              <Plus className="h-3.5 w-3.5" />
              Connect Bank
            </button>
          </div>
        </div>

        {/* KPI Strip */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          <div className="metric-card">
            <p className="text-[13px] font-medium text-muted-foreground">Net Worth</p>
            <p className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
              {balancesVisible ? formatCurrency(totalBalance) : "••••••"}
            </p>
            <div className="mt-2 flex items-center gap-1">
              <ArrowUpRight className="h-3.5 w-3.5 text-success" />
              <span className="text-[13px] font-medium text-success">+4.6%</span>
              <span className="text-[13px] text-muted-foreground">this month</span>
            </div>
          </div>
          <div className="metric-card">
            <p className="text-[13px] font-medium text-muted-foreground">Liquid Cash</p>
            <p className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
              {balancesVisible ? formatCurrency(totalLiquidity) : "••••••"}
            </p>
            <p className="mt-2 text-[13px] text-muted-foreground">Immediately available</p>
          </div>
          <div className="metric-card">
            <p className="text-[13px] font-medium text-muted-foreground">Investments</p>
            <p className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
              {balancesVisible ? formatCurrency(totalInvestments) : "••••••"}
            </p>
            <div className="mt-2 flex items-center gap-1">
              <ArrowUpRight className="h-3.5 w-3.5 text-success" />
              <span className="text-[13px] font-medium text-success">+12.3%</span>
              <span className="text-[13px] text-muted-foreground">YTD</span>
            </div>
          </div>
          <div className="metric-card">
            <p className="text-[13px] font-medium text-muted-foreground">Outstanding Debt</p>
            <p className="mt-2 text-2xl font-semibold tracking-tight text-destructive">
              {balancesVisible ? formatCurrency(totalDebt) : "••••••"}
            </p>
            <p className="mt-2 text-[13px] text-muted-foreground">Credit card balance</p>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="metric-card">
            <p className="text-[13px] font-medium text-muted-foreground mb-4">Bank Breakdown</p>
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={bankBreakdown} cx="50%" cy="50%" innerRadius={60} outerRadius={90} dataKey="value" paddingAngle={2}>
                    {bankBreakdown.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => [formatCurrency(value), ""]} contentStyle={{ backgroundColor: '#fff', border: '1px solid hsl(0 0% 92%)', borderRadius: '8px', fontSize: '12px', boxShadow: '0 4px 12px rgb(0 0 0 / 0.08)' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 flex flex-wrap gap-3 justify-center">
              {bankBreakdown.map(b => (
                <span key={b.name} className="flex items-center gap-1.5 text-xxs text-muted-foreground">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: b.color }} />
                  {b.name}
                </span>
              ))}
            </div>
          </div>
          <div className="metric-card">
            <p className="text-[13px] font-medium text-muted-foreground mb-4">Total Liquidity Trend</p>
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={liquidityTrend} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(0 0% 94%)" vertical={false} />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'hsl(0 0% 45%)' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'hsl(0 0% 45%)' }} tickFormatter={v => `$${(v/1000000).toFixed(1)}M`} />
                  <Tooltip formatter={(value: number) => [`$${value.toLocaleString()}`, "Total"]} contentStyle={{ backgroundColor: '#fff', border: '1px solid hsl(0 0% 92%)', borderRadius: '8px', fontSize: '12px', boxShadow: '0 4px 12px rgb(0 0 0 / 0.08)' }} />
                  <Bar dataKey="total" fill="hsl(0 0% 9%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex items-center justify-between">
          <div className="flex gap-1">
            {([
              { key: "all", label: "All Accounts" },
              { key: "checking", label: "Checking" },
              { key: "savings", label: "Savings" },
              { key: "credit", label: "Credit" },
              { key: "investment", label: "Investment" },
            ] as const).map(f => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`rounded-md px-3 py-1.5 text-[13px] font-medium transition-colors ${
                  filter === f.key
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:bg-secondary"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
          <div className="flex gap-1">
            {(["grid", "list"] as const).map(mode => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`rounded-md px-2.5 py-1 text-xxs font-medium transition-colors capitalize ${
                  viewMode === mode ? "bg-foreground text-background" : "text-muted-foreground hover:bg-secondary"
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>

        {/* Account Cards / List */}
        {viewMode === "grid" ? (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {filtered.map(account => (
              <div key={account.id} className="metric-card group cursor-pointer transition-all hover:bg-secondary/30">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary text-lg">
                      {account.logo}
                    </div>
                    <div>
                      <p className="text-[13px] font-medium text-foreground">{account.name}</p>
                      <p className="text-xxs text-muted-foreground">{account.bank} · ••{account.last4}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {account.connected ? (
                      <span className="flex items-center gap-1 text-xxs text-success">
                        <Wifi className="h-3 w-3" />
                        <span className="hidden sm:inline">{account.lastSync}</span>
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-xxs text-destructive">
                        <WifiOff className="h-3 w-3" />
                        Disconnected
                      </span>
                    )}
                    <ExternalLink className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
                <div className="mt-4 flex items-end justify-between">
                  <div>
                    <p className={`text-xl font-semibold tracking-tight ${account.balance < 0 ? "text-destructive" : "text-foreground"}`}>
                      {balancesVisible ? `${account.currency === "USD" ? "$" : account.currency === "EUR" ? "€" : "£"}${Math.abs(account.balance).toLocaleString()}` : "••••••"}
                      {account.balance < 0 && balancesVisible && <span className="text-[13px] ml-0.5">CR</span>}
                    </p>
                    {account.change !== 0 && (
                      <div className="mt-1.5 flex items-center gap-1">
                        {account.change > 0 ? (
                          <ArrowUpRight className={`h-3 w-3 ${account.type === "Credit" ? "text-destructive" : "text-success"}`} />
                        ) : (
                          <ArrowDownRight className={`h-3 w-3 ${account.type === "Credit" ? "text-success" : "text-destructive"}`} />
                        )}
                        <span className={`text-xxs font-medium ${
                          (account.change > 0 && account.type !== "Credit") || (account.change < 0 && account.type === "Credit")
                            ? "text-success" : "text-destructive"
                        }`}>
                          {account.change > 0 ? "+" : ""}{account.change}%
                        </span>
                        <span className="text-xxs text-muted-foreground">this month</span>
                      </div>
                    )}
                  </div>
                  <span className="rounded-full bg-secondary px-2 py-0.5 text-xxs font-medium text-secondary-foreground">
                    {account.type}
                  </span>
                </div>
              </div>
            ))}

            {/* Add Account Card */}
            <div className="flex items-center justify-center rounded-xl border-2 border-dashed border-border p-8 cursor-pointer hover:border-foreground/20 hover:bg-secondary/20 transition-all group">
              <div className="text-center">
                <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-secondary group-hover:bg-foreground/10 transition-colors">
                  <Plus className="h-5 w-5 text-muted-foreground" />
                </div>
                <p className="text-[13px] font-medium text-foreground">Connect New Bank</p>
                <p className="text-xxs text-muted-foreground mt-0.5">Link via Open Finance</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border border-border bg-card">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-4 py-2.5 text-left text-xxs font-medium uppercase tracking-wider text-muted-foreground">Account</th>
                  <th className="px-4 py-2.5 text-left text-xxs font-medium uppercase tracking-wider text-muted-foreground">Bank</th>
                  <th className="px-4 py-2.5 text-left text-xxs font-medium uppercase tracking-wider text-muted-foreground">Type</th>
                  <th className="px-4 py-2.5 text-right text-xxs font-medium uppercase tracking-wider text-muted-foreground">Balance</th>
                  <th className="px-4 py-2.5 text-right text-xxs font-medium uppercase tracking-wider text-muted-foreground">Change</th>
                  <th className="px-4 py-2.5 text-left text-xxs font-medium uppercase tracking-wider text-muted-foreground">Status</th>
                  <th className="px-4 py-2.5 text-left text-xxs font-medium uppercase tracking-wider text-muted-foreground">Last Sync</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(account => (
                  <tr key={account.id} className="border-b border-border last:border-0 hover:bg-secondary/50 transition-colors cursor-pointer">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <span className="text-lg">{account.logo}</span>
                        <div>
                          <p className="text-[13px] font-medium text-foreground">{account.name}</p>
                          <p className="text-xxs text-muted-foreground">••{account.last4}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[13px] text-muted-foreground">{account.bank}</td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-secondary px-2 py-0.5 text-xxs font-medium text-secondary-foreground">{account.type}</span>
                    </td>
                    <td className={`px-4 py-3 text-right text-[13px] font-semibold tabular-nums ${account.balance < 0 ? "text-destructive" : "text-foreground"}`}>
                      {balancesVisible ? `$${Math.abs(account.balance).toLocaleString()}` : "••••••"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {account.change !== 0 ? (
                        <span className={`text-xxs font-medium ${account.change > 0 ? "text-success" : "text-destructive"}`}>
                          {account.change > 0 ? "+" : ""}{account.change}%
                        </span>
                      ) : (
                        <span className="text-xxs text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {account.connected ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 text-xxs font-medium text-success">
                          <CheckCircle2 className="h-3 w-3" />
                          Connected
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2 py-0.5 text-xxs font-medium text-destructive">
                          <AlertCircle className="h-3 w-3" />
                          Offline
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xxs text-muted-foreground">{account.lastSync}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Connection Status */}
        <div className="metric-card">
          <div className="flex items-center justify-between mb-4">
            <p className="text-[13px] font-medium text-foreground">Open Finance Connections</p>
            <span className="text-xxs text-muted-foreground">{connectedAccounts.length}/{accounts.length} connected</span>
          </div>
          <div className="space-y-2">
            {Array.from(new Set(accounts.map(a => a.bank))).map(bank => {
              const bankAccounts = accounts.filter(a => a.bank === bank);
              const allConnected = bankAccounts.every(a => a.connected);
              const bankTotal = bankAccounts.reduce((s, a) => s + a.balance, 0);
              return (
                <div key={bank} className="flex items-center justify-between rounded-lg border border-border px-4 py-3 hover:bg-secondary/30 transition-colors cursor-pointer">
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{bankAccounts[0].logo}</span>
                    <div>
                      <p className="text-[13px] font-medium text-foreground">{bank}</p>
                      <p className="text-xxs text-muted-foreground">{bankAccounts.length} account{bankAccounts.length > 1 ? "s" : ""}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <p className="text-[13px] font-semibold tabular-nums text-foreground">
                      {balancesVisible ? formatCurrency(bankTotal) : "••••••"}
                    </p>
                    {allConnected ? (
                      <span className="flex items-center gap-1 text-xxs text-success">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Live
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-xxs text-destructive">
                        <AlertCircle className="h-3.5 w-3.5" />
                        Reconnect
                      </span>
                    )}
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Accounts;
