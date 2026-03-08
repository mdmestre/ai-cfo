import { AppLayout } from "@/components/layout/AppLayout";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { ArrowUpRight, ArrowDownRight, Calendar } from "lucide-react";

const cashFlowData = [
  { date: "Mar 1", balance: 1240000 },
  { date: "Mar 5", balance: 1215000 },
  { date: "Mar 10", balance: 1305000 },
  { date: "Mar 15", balance: 1205000 },
  { date: "Mar 20", balance: 1175000 },
  { date: "Mar 25", balance: 1345000 },
  { date: "Mar 31", balance: 1310000 },
  { date: "Apr 5", balance: 1280000 },
  { date: "Apr 10", balance: 1380000 },
  { date: "Apr 15", balance: 1280000 },
  { date: "Apr 20", balance: 1250000 },
  { date: "Apr 25", balance: 1460000 },
  { date: "Apr 30", balance: 1425000 },
  { date: "May 5", balance: 1395000 },
  { date: "May 10", balance: 1505000 },
  { date: "May 15", balance: 1405000 },
];

const formatCurrency = (value: number) => `$${(value / 1000000).toFixed(2)}M`;

const CashFlow = () => {
  return (
    <AppLayout>
      <div className="max-w-[1200px] space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-foreground">Cash Flow</h1>
            <p className="mt-0.5 text-[13px] text-muted-foreground">Track and forecast your company's cash position</p>
          </div>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-2 rounded-md border border-border bg-card px-3 py-1.5 text-[13px] font-medium text-foreground hover:bg-secondary transition-colors">
              <Calendar className="h-3.5 w-3.5" />
              Last 90 days
            </button>
            <button className="rounded-md bg-foreground px-3 py-1.5 text-[13px] font-medium text-background hover:opacity-90 transition-opacity">
              Export
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="metric-card">
            <p className="text-[13px] font-medium text-muted-foreground">Current Balance</p>
            <p className="mt-2 text-2xl font-semibold tracking-tight text-foreground">$1.31M</p>
            <div className="mt-2 flex items-center gap-1">
              <ArrowUpRight className="h-3.5 w-3.5 text-success" />
              <span className="text-[13px] font-medium text-success">+5.6%</span>
              <span className="text-[13px] text-muted-foreground">this month</span>
            </div>
          </div>
          <div className="metric-card">
            <p className="text-[13px] font-medium text-muted-foreground">Expected Income (90d)</p>
            <p className="mt-2 text-2xl font-semibold tracking-tight text-foreground">$830K</p>
            <p className="mt-2 text-[13px] text-muted-foreground">From 12 expected payments</p>
          </div>
          <div className="metric-card">
            <p className="text-[13px] font-medium text-muted-foreground">Expected Expenses (90d)</p>
            <p className="mt-2 text-2xl font-semibold tracking-tight text-foreground">$590K</p>
            <div className="mt-2 flex items-center gap-1">
              <ArrowDownRight className="h-3.5 w-3.5 text-destructive" />
              <span className="text-[13px] font-medium text-destructive">+3.2%</span>
              <span className="text-[13px] text-muted-foreground">vs prior period</span>
            </div>
          </div>
        </div>

        <div className="metric-card">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-[13px] font-medium text-muted-foreground">Cash Balance Timeline</p>
            <div className="flex gap-1">
              {["1M", "3M", "6M", "1Y"].map((period) => (
                <button
                  key={period}
                  className={`rounded-md px-2.5 py-1 text-xxs font-medium transition-colors ${
                    period === "3M"
                      ? "bg-foreground text-background"
                      : "text-muted-foreground hover:bg-secondary"
                  }`}
                >
                  {period}
                </button>
              ))}
            </div>
          </div>
          <div className="h-[380px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={cashFlowData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="balanceGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(0 0% 9%)" stopOpacity={0.06} />
                    <stop offset="100%" stopColor="hsl(0 0% 9%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(0 0% 94%)" vertical={false} />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'hsl(0 0% 45%)' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'hsl(0 0% 45%)' }} tickFormatter={formatCurrency} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid hsl(0 0% 92%)', borderRadius: '8px', fontSize: '12px', boxShadow: '0 4px 12px rgb(0 0 0 / 0.08)' }}
                  formatter={(value: number) => [`$${value.toLocaleString()}`, 'Balance']}
                />
                <ReferenceLine y={1000000} stroke="hsl(0 72% 51%)" strokeDasharray="6 4" strokeOpacity={0.5} />
                <Area type="monotone" dataKey="balance" stroke="hsl(0 0% 9%)" strokeWidth={1.5} fill="url(#balanceGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default CashFlow;
