import { AppLayout } from "@/components/layout/AppLayout";
import { useState } from "react";
import {
  CreditCard, RotateCcw, Bell, Calendar, ArrowUpRight, ArrowDownRight,
  CheckCircle2, AlertTriangle, Clock, Zap, ChevronRight, Pause, Play,
  TrendingDown, DollarSign, Filter, Search, MoreHorizontal, Settings,
  RefreshCw, Tag, Eye, EyeOff, Loader2
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell } from "recharts";
import { AutomationBuilder } from "@/components/automation/AutomationBuilder";
import { useAutomations } from "@/hooks/use-automations";
import { useAccounts } from "@/hooks/use-accounts";

// ─── Subscriptions Data ───
const subscriptions = [
  { id: 1, name: "AWS", category: "Infrastructure", amount: 12400, frequency: "Monthly", nextPayment: "Apr 1", status: "active", trend: +8.2, logo: "☁️" },
  { id: 2, name: "Gusto", category: "Payroll", amount: 89200, frequency: "Bi-weekly", nextPayment: "Mar 22", status: "active", trend: +2.1, logo: "👥" },
  { id: 3, name: "HubSpot", category: "Software", amount: 3600, frequency: "Monthly", nextPayment: "Apr 6", status: "active", trend: 0, logo: "🧡" },
  { id: 4, name: "Slack", category: "Software", amount: 1850, frequency: "Monthly", nextPayment: "Apr 1", status: "active", trend: -5.0, logo: "💬" },
  { id: 5, name: "Google Workspace", category: "Software", amount: 1200, frequency: "Monthly", nextPayment: "Apr 5", status: "active", trend: 0, logo: "📧" },
  { id: 6, name: "WeWork", category: "Rent", amount: 8500, frequency: "Monthly", nextPayment: "Apr 1", status: "active", trend: 0, logo: "🏢" },
  { id: 7, name: "Figma", category: "Software", amount: 450, frequency: "Monthly", nextPayment: "Apr 3", status: "active", trend: +12.5, logo: "🎨" },
  { id: 8, name: "Notion", category: "Software", amount: 320, frequency: "Monthly", nextPayment: "Apr 1", status: "paused", trend: 0, logo: "📝" },
  { id: 9, name: "Datadog", category: "Infrastructure", amount: 2800, frequency: "Monthly", nextPayment: "Apr 10", status: "active", trend: +15.3, logo: "🐶" },
  { id: 10, name: "Zendesk", category: "Support", amount: 1600, frequency: "Monthly", nextPayment: "Apr 8", status: "active", trend: -2.1, logo: "💚" },
];

const categorySpend = [
  { name: "Payroll", value: 89200, color: "hsl(0 0% 9%)" },
  { name: "Infrastructure", value: 15200, color: "hsl(24 95% 53%)" },
  { name: "Software", value: 9020, color: "hsl(220 70% 50%)" },
  { name: "Rent", value: 8500, color: "hsl(160 84% 39%)" },
  { name: "Support", value: 1600, color: "hsl(0 0% 45%)" },
];

const monthlyTrend = [
  { month: "Oct", amount: 108000 },
  { month: "Nov", amount: 112000 },
  { month: "Dec", amount: 115000 },
  { month: "Jan", amount: 118000 },
  { month: "Feb", amount: 120000 },
  { month: "Mar", amount: 123520 },
];

// ─── Smart Payment Schedule ───
const upcomingPayments = [
  { id: 1, vendor: "Gusto", amount: 89200, dueDate: "Mar 22", suggestedDate: "Mar 22", reason: "Payroll — cannot defer", priority: "critical", category: "Payroll" },
  { id: 2, vendor: "AWS", amount: 12400, dueDate: "Apr 1", suggestedDate: "Apr 3", reason: "3-day grace period saves $180 in float", priority: "optimized", category: "Infrastructure" },
  { id: 3, vendor: "WeWork", amount: 8500, dueDate: "Apr 1", suggestedDate: "Apr 1", reason: "No flexibility — fixed lease terms", priority: "fixed", category: "Rent" },
  { id: 4, vendor: "HubSpot", amount: 3600, dueDate: "Apr 6", suggestedDate: "Apr 10", reason: "Net-15 terms, pay later to optimize cash", priority: "optimized", category: "Software" },
  { id: 5, vendor: "Google Workspace", amount: 1200, dueDate: "Apr 5", suggestedDate: "Apr 5", reason: "Auto-debit — no flexibility", priority: "fixed", category: "Software" },
  { id: 6, vendor: "Datadog", amount: 2800, dueDate: "Apr 10", suggestedDate: "Apr 14", reason: "Net-30 terms, defer for cash optimization", priority: "optimized", category: "Infrastructure" },
  { id: 7, vendor: "Figma", amount: 450, dueDate: "Apr 3", suggestedDate: "Apr 3", reason: "Small amount — pay on time", priority: "normal", category: "Software" },
  { id: 8, vendor: "Zendesk", amount: 1600, dueDate: "Apr 8", suggestedDate: "Apr 12", reason: "Defer 4 days, saves $45 in float", priority: "optimized", category: "Support" },
];

// ─── Alert Rules ───
interface AlertRule {
  id: number;
  name: string;
  description: string;
  condition: string;
  enabled: boolean;
  triggered: boolean;
  lastTriggered?: string;
  severity: "critical" | "warning" | "info";
}

const defaultAlertRules: AlertRule[] = [
  { id: 1, name: "Low Cash Warning", description: "Balance drops below $500K", condition: "balance < 500000", enabled: true, triggered: false, severity: "critical" },
  { id: 2, name: "Expense Spike", description: "Monthly expenses increase >15%", condition: "expense_increase > 15%", enabled: true, triggered: true, lastTriggered: "Mar 5, 2026", severity: "warning" },
  { id: 3, name: "Revenue Drop", description: "Revenue declines >10% month-over-month", condition: "revenue_decline > 10%", enabled: true, triggered: false, severity: "critical" },
  { id: 4, name: "New Recurring Charge", description: "New subscription or recurring payment detected", condition: "new_recurring_detected", enabled: true, triggered: true, lastTriggered: "Mar 2, 2026", severity: "info" },
  { id: 5, name: "Payment Due Soon", description: "Payment due within 3 days", condition: "payment_due < 3d", enabled: true, triggered: true, lastTriggered: "Mar 8, 2026", severity: "warning" },
  { id: 6, name: "Burn Rate Alert", description: "Monthly burn rate exceeds $150K", condition: "burn_rate > 150000", enabled: false, triggered: false, severity: "critical" },
  { id: 7, name: "Duplicate Charge", description: "Possible duplicate payment detected", condition: "duplicate_detected", enabled: true, triggered: false, severity: "warning" },
  { id: 8, name: "Unused Subscription", description: "No activity on subscription for 30+ days", condition: "no_activity > 30d", enabled: true, triggered: true, lastTriggered: "Feb 28, 2026", severity: "info" },
];

type Tab = "subscriptions" | "payments" | "alerts";

const formatCurrency = (value: number) => `$${value.toLocaleString()}`;

const Automation = () => {
  const [activeTab, setActiveTab] = useState<Tab>("subscriptions");
  const { automations, isLoading: automationsLoading } = useAutomations();
  const { accounts, totalBalance, isLoading: accountsLoading } = useAccounts();
  const [searchQuery, setSearchQuery] = useState("");

  const isLoading = automationsLoading || accountsLoading;

  const totalMonthly = subscriptions.filter(s => s.status === "active").reduce((sum, s) => sum + s.amount, 0);
  const totalOptimizedSavings = 225;
  const activeAlerts = automations.filter(r => r.is_active).length;

  const tabs: { key: Tab; label: string; icon: React.ReactNode; badge?: number }[] = [
    { key: "subscriptions", label: "Subscriptions", icon: <CreditCard className="h-3.5 w-3.5" /> },
    { key: "payments", label: "Payment Scheduler", icon: <Calendar className="h-3.5 w-3.5" /> },
    { key: "alerts", label: "Financial Rules", icon: <Bell className="h-3.5 w-3.5" />, badge: activeAlerts },
  ];

  if (isLoading) {
    return <AppLayout><div className="flex items-center justify-center h-64"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div></AppLayout>;
  }

  return (
    <AppLayout>
      <div className="max-w-[1200px] space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground tracking-tight">Automation OS</h1>
            <p className="mt-0.5 text-[13px] text-muted-foreground">Financial guardrails and automated cash flow management</p>
          </div>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-1.5 rounded-lg border border-border/60 bg-white px-3 py-2 text-[13px] font-bold text-foreground hover:bg-secondary transition-all active:scale-95 shadow-sm">
              <Settings className="h-3.5 w-3.5" />
              Settings
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          <div className="metric-card">
            <p className="text-[13px] font-bold text-muted-foreground uppercase tracking-widest text-[10px]">Subscriptions</p>
            <p className="mt-2 text-2xl font-bold tracking-tight text-foreground">{subscriptions.filter(s => s.status === "active").length}</p>
            <div className="mt-2 flex items-center gap-1">
              <span className="text-[12px] font-bold text-success">Healthy Sync</span>
            </div>
          </div>
          <div className="metric-card">
            <p className="text-[13px] font-bold text-muted-foreground uppercase tracking-widest text-[10px]">Total Liquid</p>
            <p className="mt-2 text-2xl font-bold tracking-tight text-foreground">${totalBalance.toLocaleString()}</p>
            <div className="mt-2 flex items-center gap-1">
              <span className="text-[12px] text-muted-foreground">Across all banks</span>
            </div>
          </div>
          <div className="metric-card">
            <p className="text-[13px] font-bold text-muted-foreground uppercase tracking-widest text-[10px]">Float Yield</p>
            <p className="mt-2 text-2xl font-bold tracking-tight text-accent">${totalOptimizedSavings}/mo</p>
            <p className="mt-2 text-[12px] text-muted-foreground">Optimization gain</p>
          </div>
          <div className="metric-card bg-primary text-white border-0">
            <p className="text-[13px] font-bold text-white/60 uppercase tracking-widest text-[10px]">Active Sentinels</p>
            <p className="mt-2 text-2xl font-bold tracking-tight text-white">{activeAlerts}</p>
            <p className="mt-2 text-[12px] text-white/70">Guardians active</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-border">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-[13px] font-medium transition-colors ${activeTab === tab.key
                ? "border-foreground text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
            >
              {tab.icon}
              {tab.label}
              {tab.badge ? (
                <span className="flex h-4.5 min-w-[18px] items-center justify-center rounded-full bg-destructive/10 px-1.5 text-xxs font-semibold text-destructive">
                  {tab.badge}
                </span>
              ) : null}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === "subscriptions" && <SubscriptionsTab searchQuery={searchQuery} setSearchQuery={setSearchQuery} />}
        {activeTab === "payments" && <PaymentsTab />}
        {activeTab === "alerts" && (
          <div className="space-y-8">
            <AutomationBuilder />
          </div>
        )}
      </div>
    </AppLayout>
  );
};

// ─── Subscriptions Tab ───
function SubscriptionsTab({ searchQuery, setSearchQuery }: { searchQuery: string; setSearchQuery: (v: string) => void }) {
  const [categoryFilter, setCategoryFilter] = useState("All");
  const categories = ["All", ...Array.from(new Set(subscriptions.map(s => s.category)))];

  const filtered = subscriptions.filter(s =>
    (categoryFilter === "All" || s.category === categoryFilter) &&
    s.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Charts Row */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="metric-card">
          <p className="text-[13px] font-medium text-muted-foreground mb-4">Recurring Spend by Category</p>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={categorySpend} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="value" paddingAngle={2}>
                  {categorySpend.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => [formatCurrency(value), ""]} contentStyle={{ backgroundColor: '#fff', border: '1px solid hsl(0 0% 92%)', borderRadius: '8px', fontSize: '12px', boxShadow: '0 4px 12px rgb(0 0 0 / 0.08)' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 flex flex-wrap gap-3 justify-center">
            {categorySpend.map(c => (
              <span key={c.name} className="flex items-center gap-1.5 text-xxs text-muted-foreground">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: c.color }} />
                {c.name}
              </span>
            ))}
          </div>
        </div>
        <div className="metric-card">
          <p className="text-[13px] font-medium text-muted-foreground mb-4">Monthly Recurring Trend</p>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyTrend} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(0 0% 94%)" vertical={false} />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'hsl(0 0% 45%)' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'hsl(0 0% 45%)' }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}K`} />
                <Tooltip formatter={(value: number) => [formatCurrency(value), "Recurring"]} contentStyle={{ backgroundColor: '#fff', border: '1px solid hsl(0 0% 92%)', borderRadius: '8px', fontSize: '12px', boxShadow: '0 4px 12px rgb(0 0 0 / 0.08)' }} />
                <Bar dataKey="amount" fill="hsl(0 0% 9%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Subscription List */}
      <div className="flex items-center gap-2">
        <div className="flex flex-1 items-center gap-2 rounded-md border border-border bg-card px-3 py-1.5 max-w-sm">
          <Search className="h-3.5 w-3.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search subscriptions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent text-[13px] text-foreground placeholder:text-muted-foreground outline-none"
          />
        </div>
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setCategoryFilter(cat)}
            className={`rounded-md px-3 py-1.5 text-[13px] font-medium transition-colors ${cat === categoryFilter
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
              <th className="px-4 py-2.5 text-left text-xxs font-medium uppercase tracking-wider text-muted-foreground">Service</th>
              <th className="px-4 py-2.5 text-left text-xxs font-medium uppercase tracking-wider text-muted-foreground">Category</th>
              <th className="px-4 py-2.5 text-right text-xxs font-medium uppercase tracking-wider text-muted-foreground">Amount</th>
              <th className="px-4 py-2.5 text-left text-xxs font-medium uppercase tracking-wider text-muted-foreground">Frequency</th>
              <th className="px-4 py-2.5 text-left text-xxs font-medium uppercase tracking-wider text-muted-foreground">Next Payment</th>
              <th className="px-4 py-2.5 text-right text-xxs font-medium uppercase tracking-wider text-muted-foreground">Trend</th>
              <th className="px-4 py-2.5 text-left text-xxs font-medium uppercase tracking-wider text-muted-foreground">Status</th>
              <th className="px-4 py-2.5 w-10"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(s => (
              <tr key={s.id} className="border-b border-border last:border-0 hover:bg-secondary/50 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <span className="text-lg">{s.logo}</span>
                    <span className="text-[13px] font-medium text-foreground">{s.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="rounded-full bg-secondary px-2 py-0.5 text-xxs font-medium text-secondary-foreground">{s.category}</span>
                </td>
                <td className="px-4 py-3 text-right text-[13px] font-semibold tabular-nums text-foreground">{formatCurrency(s.amount)}</td>
                <td className="px-4 py-3 text-[13px] text-muted-foreground">{s.frequency}</td>
                <td className="px-4 py-3 text-[13px] text-muted-foreground">{s.nextPayment}</td>
                <td className="px-4 py-3 text-right">
                  {s.trend !== 0 ? (
                    <div className="flex items-center justify-end gap-1">
                      {s.trend > 0 ? <ArrowUpRight className="h-3 w-3 text-destructive" /> : <ArrowDownRight className="h-3 w-3 text-success" />}
                      <span className={`text-xxs font-medium ${s.trend > 0 ? "text-destructive" : "text-success"}`}>
                        {s.trend > 0 ? "+" : ""}{s.trend}%
                      </span>
                    </div>
                  ) : (
                    <span className="text-xxs text-muted-foreground">—</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xxs font-medium ${s.status === "active" ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"
                    }`}>
                    {s.status === "active" ? <CheckCircle2 className="h-3 w-3" /> : <Pause className="h-3 w-3" />}
                    {s.status === "active" ? "Active" : "Paused"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <button className="rounded p-1 hover:bg-secondary transition-colors">
                    <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Payments Tab ───
function PaymentsTab() {
  return (
    <div className="space-y-6">
      {/* Optimization Banner */}
      <div className="flex items-start gap-3 rounded-lg border border-accent/20 bg-accent/5 p-4">
        <Zap className="h-4 w-4 text-accent mt-0.5 shrink-0" />
        <div>
          <p className="text-[13px] font-medium text-foreground">Smart Payment Optimization Active</p>
          <p className="text-xxs text-muted-foreground mt-0.5">
            AI has identified 4 payments that can be deferred to optimize cash position, saving an estimated <span className="font-semibold text-foreground">$225/month</span> in float costs.
          </p>
        </div>
      </div>

      {/* Payment Schedule */}
      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <div className="border-b border-border px-4 py-3 flex items-center justify-between">
          <p className="text-[13px] font-medium text-foreground">Upcoming Payment Schedule</p>
          <div className="flex gap-2 text-xxs text-muted-foreground">
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-destructive" />Critical</span>
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-accent" />Optimized</span>
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-muted-foreground" />Fixed</span>
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-foreground" />Normal</span>
          </div>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="px-4 py-2.5 text-left text-xxs font-medium uppercase tracking-wider text-muted-foreground">Vendor</th>
              <th className="px-4 py-2.5 text-right text-xxs font-medium uppercase tracking-wider text-muted-foreground">Amount</th>
              <th className="px-4 py-2.5 text-left text-xxs font-medium uppercase tracking-wider text-muted-foreground">Due Date</th>
              <th className="px-4 py-2.5 text-left text-xxs font-medium uppercase tracking-wider text-muted-foreground">Suggested Date</th>
              <th className="px-4 py-2.5 text-left text-xxs font-medium uppercase tracking-wider text-muted-foreground">AI Reasoning</th>
              <th className="px-4 py-2.5 text-left text-xxs font-medium uppercase tracking-wider text-muted-foreground">Priority</th>
            </tr>
          </thead>
          <tbody>
            {upcomingPayments.map(p => {
              const priorityColors: Record<string, string> = {
                critical: "bg-destructive/10 text-destructive",
                optimized: "bg-accent/10 text-accent",
                fixed: "bg-muted text-muted-foreground",
                normal: "bg-secondary text-foreground",
              };
              const isDeferred = p.dueDate !== p.suggestedDate;
              return (
                <tr key={p.id} className="border-b border-border last:border-0 hover:bg-secondary/50 transition-colors">
                  <td className="px-4 py-3">
                    <div>
                      <p className="text-[13px] font-medium text-foreground">{p.vendor}</p>
                      <p className="text-xxs text-muted-foreground">{p.category}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right text-[13px] font-semibold tabular-nums text-foreground">{formatCurrency(p.amount)}</td>
                  <td className="px-4 py-3 text-[13px] text-muted-foreground">{p.dueDate}</td>
                  <td className="px-4 py-3">
                    <span className={`text-[13px] font-medium ${isDeferred ? "text-accent" : "text-foreground"}`}>
                      {p.suggestedDate}
                    </span>
                    {isDeferred && <span className="ml-1.5 text-xxs text-accent">↗ deferred</span>}
                  </td>
                  <td className="px-4 py-3 text-xxs text-muted-foreground max-w-[240px]">{p.reason}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xxs font-medium capitalize ${priorityColors[p.priority]}`}>
                      {p.priority}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Cash Impact */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="metric-card">
          <p className="text-[13px] font-medium text-muted-foreground">Total Due (Next 30d)</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
            {formatCurrency(upcomingPayments.reduce((s, p) => s + p.amount, 0))}
          </p>
          <p className="mt-2 text-[13px] text-muted-foreground">{upcomingPayments.length} payments scheduled</p>
        </div>
        <div className="metric-card">
          <p className="text-[13px] font-medium text-muted-foreground">Deferrable Amount</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-accent">
            {formatCurrency(upcomingPayments.filter(p => p.priority === "optimized").reduce((s, p) => s + p.amount, 0))}
          </p>
          <p className="mt-2 text-[13px] text-muted-foreground">4 payments can be optimized</p>
        </div>
        <div className="metric-card">
          <p className="text-[13px] font-medium text-muted-foreground">Float Savings</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-success">$225/mo</p>
          <p className="mt-2 text-[13px] text-muted-foreground">By optimizing payment timing</p>
        </div>
      </div>
    </div>
  );
}

// ─── Alerts Tab ───
function AlertsTab({ alertRules, toggleAlert }: { alertRules: AlertRule[]; toggleAlert: (id: number) => void }) {
  return (
    <div className="space-y-6">
      {/* Active Alerts */}
      {alertRules.filter(r => r.enabled && r.triggered).length > 0 && (
        <div className="space-y-2">
          <p className="text-[13px] font-medium text-foreground">Triggered Alerts</p>
          {alertRules.filter(r => r.enabled && r.triggered).map(rule => {
            const severityStyle: Record<string, string> = {
              critical: "border-destructive/20 bg-destructive/5",
              warning: "border-accent/20 bg-accent/5",
              info: "border-border bg-secondary/30",
            };
            const iconStyle: Record<string, string> = {
              critical: "text-destructive",
              warning: "text-accent",
              info: "text-muted-foreground",
            };
            return (
              <div key={rule.id} className={`flex items-start gap-3 rounded-lg border p-3.5 ${severityStyle[rule.severity]}`}>
                <AlertTriangle className={`h-4 w-4 mt-0.5 shrink-0 ${iconStyle[rule.severity]}`} />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-[13px] font-medium text-foreground">{rule.name}</p>
                    <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium uppercase ${rule.severity === "critical" ? "bg-destructive/10 text-destructive" :
                      rule.severity === "warning" ? "bg-accent/10 text-accent" : "bg-muted text-muted-foreground"
                      }`}>{rule.severity}</span>
                  </div>
                  <p className="text-xxs text-muted-foreground mt-0.5">{rule.description}</p>
                  {rule.lastTriggered && <p className="text-xxs text-muted-foreground mt-1">Last triggered: {rule.lastTriggered}</p>}
                </div>
                <button className="rounded-md border border-border px-2.5 py-1 text-xxs font-medium text-foreground hover:bg-secondary transition-colors">
                  Dismiss
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* All Rules */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-[13px] font-medium text-foreground">Alert Rules</p>
          <button className="flex items-center gap-1.5 rounded-md bg-foreground px-3 py-1.5 text-[13px] font-medium text-background hover:opacity-90 transition-opacity">
            <Bell className="h-3.5 w-3.5" />
            New Rule
          </button>
        </div>
        <div className="overflow-hidden rounded-lg border border-border bg-card">
          {alertRules.map((rule, i) => (
            <div key={rule.id} className={`flex items-center gap-4 px-4 py-3.5 ${i < alertRules.length - 1 ? "border-b border-border" : ""} hover:bg-secondary/30 transition-colors`}>
              <button
                onClick={() => toggleAlert(rule.id)}
                className={`flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${rule.enabled ? "bg-foreground" : "bg-border"}`}
              >
                <span className={`h-3.5 w-3.5 rounded-full bg-background shadow-sm transition-transform ${rule.enabled ? "translate-x-[18px]" : "translate-x-[3px]"}`} />
              </button>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className={`text-[13px] font-medium ${rule.enabled ? "text-foreground" : "text-muted-foreground"}`}>{rule.name}</p>
                  <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium uppercase ${rule.severity === "critical" ? "bg-destructive/10 text-destructive" :
                    rule.severity === "warning" ? "bg-accent/10 text-accent" : "bg-muted text-muted-foreground"
                    }`}>{rule.severity}</span>
                  {rule.triggered && rule.enabled && (
                    <span className="h-1.5 w-1.5 rounded-full bg-destructive animate-pulse" />
                  )}
                </div>
                <p className="text-xxs text-muted-foreground mt-0.5">{rule.description}</p>
              </div>
              {rule.lastTriggered && (
                <p className="text-xxs text-muted-foreground hidden sm:block">Last: {rule.lastTriggered}</p>
              )}
              <button className="rounded p-1 hover:bg-secondary transition-colors">
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Automation;
