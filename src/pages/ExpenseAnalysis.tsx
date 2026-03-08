import { AppLayout } from "@/components/layout/AppLayout";
import { ArrowUpRight, ArrowDownRight, Calendar, TrendingUp } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Area, AreaChart
} from "recharts";

const categoryData = [
  { name: "Payroll", amount: 178400, pct: 46, change: "+2.1%" },
  { name: "Infrastructure", amount: 48600, pct: 12, change: "+18.4%" },
  { name: "Software", amount: 38200, pct: 10, change: "+34.2%" },
  { name: "Rent & Facilities", amount: 34000, pct: 9, change: "0%" },
  { name: "Marketing", amount: 31500, pct: 8, change: "-5.3%" },
  { name: "Travel", amount: 22800, pct: 6, change: "+42.1%" },
  { name: "Professional Services", amount: 18400, pct: 5, change: "+12.0%" },
  { name: "Other", amount: 12100, pct: 4, change: "-8.2%" },
];

const pieColors = [
  "hsl(0 0% 9%)",
  "hsl(0 0% 25%)",
  "hsl(0 0% 40%)",
  "hsl(0 0% 52%)",
  "hsl(0 0% 64%)",
  "hsl(0 0% 74%)",
  "hsl(0 0% 82%)",
  "hsl(0 0% 90%)",
];

const trendData = [
  { month: "Oct", total: 290000, payroll: 170000, software: 22000, infra: 35000 },
  { month: "Nov", total: 310000, payroll: 172000, software: 24000, infra: 38000 },
  { month: "Dec", total: 320000, payroll: 174000, software: 26000, infra: 40000 },
  { month: "Jan", total: 280000, payroll: 175000, software: 28000, infra: 38000 },
  { month: "Feb", total: 300000, payroll: 176000, software: 32000, infra: 42000 },
  { month: "Mar", total: 384000, payroll: 178400, software: 38200, infra: 48600 },
];

const topVendors = [
  { name: "Gusto (Payroll)", amount: "$89,200", change: "+2.1%", positive: false },
  { name: "AWS", amount: "$48,600", change: "+18.4%", positive: false },
  { name: "WeWork", amount: "$25,500", change: "0%", positive: true },
  { name: "Hubspot", amount: "$12,800", change: "+34.2%", positive: false },
  { name: "Google Ads", amount: "$11,200", change: "-12.0%", positive: true },
  { name: "Figma", amount: "$4,500", change: "+8.0%", positive: false },
  { name: "Slack", amount: "$3,400", change: "0%", positive: true },
  { name: "Delta Airlines", amount: "$2,800", change: "+120%", positive: false },
];

const formatCurrency = (value: number) => `$${(value / 1000).toFixed(0)}K`;

const ExpenseAnalysis = () => {
  return (
    <AppLayout>
      <div className="max-w-[1200px] space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-foreground">Expense Analysis</h1>
            <p className="mt-0.5 text-[13px] text-muted-foreground">Detailed breakdown by category, vendor, and trend</p>
          </div>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-2 rounded-md border border-border bg-card px-3 py-1.5 text-[13px] font-medium text-foreground hover:bg-secondary transition-colors">
              <Calendar className="h-3.5 w-3.5" />
              March 2026
            </button>
          </div>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="metric-card">
            <p className="text-[13px] font-medium text-muted-foreground">Total Expenses</p>
            <p className="mt-2 text-2xl font-semibold tracking-tight text-foreground">$384,000</p>
            <div className="mt-2 flex items-center gap-1">
              <ArrowUpRight className="h-3.5 w-3.5 text-destructive" />
              <span className="text-[13px] font-medium text-destructive">+24%</span>
              <span className="text-[13px] text-muted-foreground">vs last month</span>
            </div>
          </div>
          <div className="metric-card">
            <p className="text-[13px] font-medium text-muted-foreground">Expense Ratio</p>
            <p className="mt-2 text-2xl font-semibold tracking-tight text-foreground">80%</p>
            <p className="mt-2 text-[13px] text-muted-foreground">of revenue ($480K)</p>
          </div>
          <div className="metric-card">
            <p className="text-[13px] font-medium text-muted-foreground">Largest Increase</p>
            <p className="mt-2 text-2xl font-semibold tracking-tight text-foreground">Travel</p>
            <div className="mt-2 flex items-center gap-1">
              <ArrowUpRight className="h-3.5 w-3.5 text-destructive" />
              <span className="text-[13px] font-medium text-destructive">+42%</span>
              <span className="text-[13px] text-muted-foreground">$22.8K this month</span>
            </div>
          </div>
        </div>

        {/* Category breakdown + Pie */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="metric-card lg:col-span-2">
            <p className="text-[13px] font-medium text-muted-foreground mb-4">By Category</p>
            <div className="space-y-0">
              {categoryData.map((cat) => (
                <div key={cat.name} className="flex items-center justify-between py-2.5 border-b border-border last:border-0">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-24 text-[13px] font-medium text-foreground">{cat.name}</div>
                    <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                      <div
                        className="h-full bg-foreground rounded-full transition-all duration-500"
                        style={{ width: `${cat.pct}%` }}
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-4 ml-4">
                    <span className="text-xxs text-muted-foreground w-8 text-right">{cat.pct}%</span>
                    <span className="text-[13px] font-medium text-foreground w-20 text-right">
                      ${(cat.amount / 1000).toFixed(1)}K
                    </span>
                    <span className={`text-xxs font-medium w-12 text-right ${
                      cat.change.startsWith("+") ? "text-destructive" : cat.change.startsWith("-") ? "text-success" : "text-muted-foreground"
                    }`}>
                      {cat.change}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="metric-card flex flex-col items-center justify-center">
            <p className="text-[13px] font-medium text-muted-foreground mb-4">Distribution</p>
            <PieChart width={200} height={200}>
              <Pie
                data={categoryData}
                cx={100}
                cy={100}
                innerRadius={55}
                outerRadius={85}
                dataKey="amount"
                paddingAngle={2}
                stroke="none"
              >
                {categoryData.map((_, index) => (
                  <Cell key={index} fill={pieColors[index]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ backgroundColor: '#fff', border: '1px solid hsl(0 0% 92%)', borderRadius: '8px', fontSize: '12px', boxShadow: '0 4px 12px rgb(0 0 0 / 0.08)' }}
                formatter={(value: number) => [`$${(value / 1000).toFixed(1)}K`, '']}
              />
            </PieChart>
          </div>
        </div>

        {/* Trend over time */}
        <div className="metric-card">
          <p className="text-[13px] font-medium text-muted-foreground mb-4">Expense Trend (6 months)</p>
          <div className="h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="totalExpGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(0 0% 9%)" stopOpacity={0.06} />
                    <stop offset="100%" stopColor="hsl(0 0% 9%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(0 0% 94%)" vertical={false} />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'hsl(0 0% 45%)' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'hsl(0 0% 45%)' }} tickFormatter={formatCurrency} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid hsl(0 0% 92%)', borderRadius: '8px', fontSize: '12px', boxShadow: '0 4px 12px rgb(0 0 0 / 0.08)' }}
                  formatter={(value: number) => [`$${value.toLocaleString()}`, '']}
                />
                <Area type="monotone" dataKey="total" stroke="hsl(0 0% 9%)" strokeWidth={2} fill="url(#totalExpGrad)" name="Total" />
                <Line type="monotone" dataKey="payroll" stroke="hsl(0 0% 45%)" strokeWidth={1.5} dot={false} strokeDasharray="4 3" name="Payroll" />
                <Line type="monotone" dataKey="software" stroke="hsl(24 95% 53%)" strokeWidth={1.5} dot={false} name="Software" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top vendors */}
        <div className="metric-card">
          <p className="text-[13px] font-medium text-muted-foreground mb-4">Top Vendors</p>
          <div className="overflow-hidden rounded-lg border border-border">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-4 py-2.5 text-left text-xxs font-medium uppercase tracking-wider text-muted-foreground">Vendor</th>
                  <th className="px-4 py-2.5 text-right text-xxs font-medium uppercase tracking-wider text-muted-foreground">Amount</th>
                  <th className="px-4 py-2.5 text-right text-xxs font-medium uppercase tracking-wider text-muted-foreground">Change</th>
                </tr>
              </thead>
              <tbody>
                {topVendors.map((v) => (
                  <tr key={v.name} className="border-b border-border last:border-0 hover:bg-secondary/30 transition-colors">
                    <td className="px-4 py-2.5 text-[13px] font-medium text-foreground">{v.name}</td>
                    <td className="px-4 py-2.5 text-[13px] font-medium text-foreground text-right">{v.amount}</td>
                    <td className={`px-4 py-2.5 text-[13px] font-medium text-right ${v.positive ? "text-success" : "text-destructive"}`}>
                      {v.change}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default ExpenseAnalysis;
