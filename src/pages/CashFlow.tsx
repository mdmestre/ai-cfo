import { AppLayout } from "@/components/layout/AppLayout";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { ArrowUpRight, ArrowDownRight, Calendar } from "lucide-react";

const cashFlowData = [
  { date: "Mar 1", balance: 1240000, income: 0, expenses: 0 },
  { date: "Mar 5", balance: 1215000, income: 0, expenses: 25000 },
  { date: "Mar 10", balance: 1305000, income: 120000, expenses: 30000 },
  { date: "Mar 15", balance: 1205000, income: 0, expenses: 100000 },
  { date: "Mar 20", balance: 1175000, income: 0, expenses: 30000 },
  { date: "Mar 25", balance: 1345000, income: 200000, expenses: 30000 },
  { date: "Mar 31", balance: 1310000, income: 0, expenses: 35000 },
  { date: "Apr 5", balance: 1280000, income: 0, expenses: 30000 },
  { date: "Apr 10", balance: 1380000, income: 130000, expenses: 30000 },
  { date: "Apr 15", balance: 1280000, income: 0, expenses: 100000 },
  { date: "Apr 20", balance: 1250000, income: 0, expenses: 30000 },
  { date: "Apr 25", balance: 1460000, income: 240000, expenses: 30000 },
  { date: "Apr 30", balance: 1425000, income: 0, expenses: 35000 },
  { date: "May 5", balance: 1395000, income: 0, expenses: 30000 },
  { date: "May 10", balance: 1505000, income: 140000, expenses: 30000 },
  { date: "May 15", balance: 1405000, income: 0, expenses: 100000 },
];

const formatCurrency = (value: number) => `$${(value / 1000000).toFixed(2)}M`;

const CashFlow = () => {
  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Cash Flow</h1>
            <p className="mt-1 text-sm text-muted-foreground">Track and forecast your company's cash position</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium text-foreground hover:bg-secondary transition-colors">
              <Calendar className="h-4 w-4" />
              Last 90 days
            </button>
            <button className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity">
              Export
            </button>
          </div>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="metric-card">
            <p className="text-sm font-medium text-muted-foreground">Current Balance</p>
            <p className="mt-2 text-3xl font-semibold text-foreground">$1.31M</p>
            <div className="mt-2 flex items-center gap-1.5">
              <ArrowUpRight className="h-4 w-4 text-success" />
              <span className="text-sm font-medium text-success">+5.6%</span>
              <span className="text-sm text-muted-foreground">this month</span>
            </div>
          </div>
          <div className="metric-card">
            <p className="text-sm font-medium text-muted-foreground">Expected Income (90d)</p>
            <p className="mt-2 text-3xl font-semibold text-foreground">$830K</p>
            <p className="mt-2 text-sm text-muted-foreground">From 12 expected payments</p>
          </div>
          <div className="metric-card">
            <p className="text-sm font-medium text-muted-foreground">Expected Expenses (90d)</p>
            <p className="mt-2 text-3xl font-semibold text-foreground">$590K</p>
            <div className="mt-2 flex items-center gap-1.5">
              <ArrowDownRight className="h-4 w-4 text-destructive" />
              <span className="text-sm font-medium text-destructive">+3.2%</span>
              <span className="text-sm text-muted-foreground">vs prior period</span>
            </div>
          </div>
        </div>

        {/* Main chart */}
        <div className="metric-card">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm font-medium text-muted-foreground">Cash Balance Timeline</p>
            <div className="flex gap-2">
              {["1M", "3M", "6M", "1Y"].map((period) => (
                <button
                  key={period}
                  className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                    period === "3M"
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-secondary"
                  }`}
                >
                  {period}
                </button>
              ))}
            </div>
          </div>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={cashFlowData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="balanceGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(222 47% 11%)" stopOpacity={0.12} />
                    <stop offset="100%" stopColor="hsl(222 47% 11%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 13% 91%)" vertical={false} />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'hsl(220 9% 46%)' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'hsl(220 9% 46%)' }} tickFormatter={formatCurrency} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(0 0% 100%)',
                    border: '1px solid hsl(220 13% 91%)',
                    borderRadius: '8px',
                    fontSize: '13px',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                  }}
                  formatter={(value: number) => [`$${value.toLocaleString()}`, 'Balance']}
                />
                <ReferenceLine y={1000000} stroke="hsl(0 84% 60%)" strokeDasharray="6 4" label={{ value: "Min threshold", fill: "hsl(0 84% 60%)", fontSize: 11 }} />
                <Area
                  type="monotone"
                  dataKey="balance"
                  stroke="hsl(222 47% 11%)"
                  strokeWidth={2}
                  fill="url(#balanceGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default CashFlow;
