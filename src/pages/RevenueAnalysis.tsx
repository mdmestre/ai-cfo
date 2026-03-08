import { AppLayout } from "@/components/layout/AppLayout";
import { ArrowUpRight, Calendar, TrendingUp } from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell
} from "recharts";

const revenueHistory = [
  { month: "Oct", mrr: 345000, nonRecurring: 35000, total: 380000 },
  { month: "Nov", mrr: 368000, nonRecurring: 52000, total: 420000 },
  { month: "Dec", mrr: 355000, nonRecurring: 35000, total: 390000 },
  { month: "Jan", mrr: 392000, nonRecurring: 58000, total: 450000 },
  { month: "Feb", mrr: 402000, nonRecurring: 28000, total: 430000 },
  { month: "Mar", mrr: 418000, nonRecurring: 62000, total: 480000 },
];

const revenueBreakdown = [
  { name: "Recurring (MRR)", value: 418000, pct: 87 },
  { name: "Non-recurring", value: 62000, pct: 13 },
];

const customerSegments = [
  { segment: "Enterprise", revenue: 248000, clients: 4, avgDeal: "$62,000", growth: "+12%" },
  { segment: "Mid-Market", revenue: 142000, clients: 8, avgDeal: "$17,750", growth: "+18%" },
  { segment: "SMB", revenue: 90000, clients: 12, avgDeal: "$7,500", growth: "+4%" },
];

const growthMetrics = [
  { month: "Oct", growthRate: 5.2 },
  { month: "Nov", growthRate: 6.7 },
  { month: "Dec", growthRate: -3.6 },
  { month: "Jan", growthRate: 10.4 },
  { month: "Feb", growthRate: 2.6 },
  { month: "Mar", growthRate: 8.2 },
];

const topClients = [
  { name: "Acme Corp", revenue: "$182,400", share: "38%", risk: true },
  { name: "TechStart Inc", revenue: "$62,800", share: "13%", risk: false },
  { name: "Global Media", revenue: "$48,200", share: "10%", risk: false },
  { name: "Innovate Labs", revenue: "$38,600", share: "8%", risk: false },
  { name: "DataFlow Systems", revenue: "$31,400", share: "7%", risk: false },
];

const formatCurrency = (value: number) => `$${(value / 1000).toFixed(0)}K`;

const RevenueAnalysis = () => {
  return (
    <AppLayout>
      <div className="max-w-[1200px] space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5">
              <TrendingUp className="h-4 w-4 text-accent" />
              <h1 className="text-xl font-semibold text-foreground">Revenue Analysis</h1>
            </div>
            <p className="mt-0.5 text-[13px] text-muted-foreground">Growth metrics, recurring revenue, and client analysis</p>
          </div>
          <button className="flex items-center gap-2 rounded-md border border-border bg-card px-3 py-1.5 text-[13px] font-medium text-foreground hover:bg-secondary transition-colors">
            <Calendar className="h-3.5 w-3.5" />
            Last 6 months
          </button>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          <div className="metric-card">
            <p className="text-[13px] font-medium text-muted-foreground">Monthly Revenue</p>
            <p className="mt-2 text-2xl font-semibold tracking-tight text-foreground">$480K</p>
            <div className="mt-2 flex items-center gap-1">
              <ArrowUpRight className="h-3.5 w-3.5 text-success" />
              <span className="text-[13px] font-medium text-success">+8.2%</span>
            </div>
          </div>
          <div className="metric-card">
            <p className="text-[13px] font-medium text-muted-foreground">MRR</p>
            <p className="mt-2 text-2xl font-semibold tracking-tight text-foreground">$418K</p>
            <p className="mt-2 text-[13px] text-muted-foreground">87% of total revenue</p>
          </div>
          <div className="metric-card">
            <p className="text-[13px] font-medium text-muted-foreground">ARR</p>
            <p className="mt-2 text-2xl font-semibold tracking-tight text-foreground">$5.02M</p>
            <p className="mt-2 text-[13px] text-muted-foreground">Based on current MRR</p>
          </div>
          <div className="metric-card">
            <p className="text-[13px] font-medium text-muted-foreground">Avg Growth Rate</p>
            <p className="mt-2 text-2xl font-semibold tracking-tight text-foreground">4.9%</p>
            <p className="mt-2 text-[13px] text-muted-foreground">6-month average</p>
          </div>
        </div>

        {/* Revenue trend */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="metric-card lg:col-span-2">
            <p className="text-[13px] font-medium text-muted-foreground mb-4">Revenue Trend</p>
            <div className="flex gap-4 mb-3 text-xxs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-foreground" />
                Recurring
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-accent opacity-60" />
                Non-recurring
              </span>
            </div>
            <div className="h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueHistory} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(0 0% 94%)" vertical={false} />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'hsl(0 0% 45%)' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'hsl(0 0% 45%)' }} tickFormatter={formatCurrency} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#fff', border: '1px solid hsl(0 0% 92%)', borderRadius: '8px', fontSize: '12px', boxShadow: '0 4px 12px rgb(0 0 0 / 0.08)' }}
                    formatter={(value: number) => [`$${value.toLocaleString()}`, '']}
                  />
                  <Bar dataKey="mrr" stackId="a" fill="hsl(0 0% 9%)" radius={[0, 0, 0, 0]} name="Recurring" />
                  <Bar dataKey="nonRecurring" stackId="a" fill="hsl(24 95% 53%)" radius={[3, 3, 0, 0]} name="Non-recurring" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Recurring vs Non-recurring pie */}
          <div className="metric-card flex flex-col items-center">
            <p className="text-[13px] font-medium text-muted-foreground mb-4">Revenue Mix</p>
            <PieChart width={180} height={180}>
              <Pie
                data={revenueBreakdown}
                cx={90}
                cy={90}
                innerRadius={50}
                outerRadius={75}
                dataKey="value"
                paddingAngle={3}
                stroke="none"
              >
                <Cell fill="hsl(0 0% 9%)" />
                <Cell fill="hsl(24 95% 53%)" />
              </Pie>
            </PieChart>
            <div className="mt-3 space-y-1.5 w-full">
              {revenueBreakdown.map((item) => (
                <div key={item.name} className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-xxs text-muted-foreground">
                    <span className={`h-2 w-2 rounded-full ${item.name.includes("Recurring") ? "bg-foreground" : "bg-accent"}`} />
                    {item.name}
                  </span>
                  <span className="text-xxs font-medium text-foreground">{item.pct}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Growth rate chart */}
        <div className="metric-card">
          <p className="text-[13px] font-medium text-muted-foreground mb-4">Month-over-Month Growth Rate</p>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={growthMetrics} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(0 0% 94%)" vertical={false} />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'hsl(0 0% 45%)' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'hsl(0 0% 45%)' }} tickFormatter={(v) => `${v}%`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid hsl(0 0% 92%)', borderRadius: '8px', fontSize: '12px', boxShadow: '0 4px 12px rgb(0 0 0 / 0.08)' }}
                  formatter={(value: number) => [`${value}%`, 'Growth']}
                />
                <Bar
                  dataKey="growthRate"
                  radius={[3, 3, 0, 0]}
                  fill="hsl(0 0% 9%)"
                >
                  {growthMetrics.map((entry, index) => (
                    <Cell key={index} fill={entry.growthRate >= 0 ? "hsl(152 69% 41%)" : "hsl(0 72% 51%)"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Customer segments + Top clients */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="metric-card">
            <p className="text-[13px] font-medium text-muted-foreground mb-4">Revenue by Segment</p>
            <div className="space-y-0">
              {customerSegments.map((seg) => (
                <div key={seg.segment} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                  <div>
                    <p className="text-[13px] font-medium text-foreground">{seg.segment}</p>
                    <p className="text-xxs text-muted-foreground">{seg.clients} clients · Avg {seg.avgDeal}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[13px] font-semibold text-foreground">${(seg.revenue / 1000).toFixed(0)}K</p>
                    <p className="text-xxs font-medium text-success">{seg.growth}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="metric-card">
            <p className="text-[13px] font-medium text-muted-foreground mb-4">Top Clients by Revenue</p>
            <div className="space-y-0">
              {topClients.map((client) => (
                <div key={client.name} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                  <div className="flex items-center gap-2">
                    <p className="text-[13px] font-medium text-foreground">{client.name}</p>
                    {client.risk && (
                      <span className="rounded-full bg-destructive/8 px-1.5 py-0.5 text-[9px] font-medium text-destructive">
                        HIGH CONCENTRATION
                      </span>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-[13px] font-semibold text-foreground">{client.revenue}</p>
                    <p className="text-xxs text-muted-foreground">{client.share} of revenue</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default RevenueAnalysis;
