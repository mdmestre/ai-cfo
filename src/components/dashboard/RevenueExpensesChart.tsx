import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const data = [
  { month: "Oct", revenue: 380000, expenses: 290000 },
  { month: "Nov", revenue: 420000, expenses: 310000 },
  { month: "Dec", revenue: 390000, expenses: 320000 },
  { month: "Jan", revenue: 450000, expenses: 280000 },
  { month: "Feb", revenue: 430000, expenses: 300000 },
  { month: "Mar", revenue: 480000, expenses: 310000 },
];

const formatCurrency = (value: number) => `$${(value / 1000).toFixed(0)}K`;

export function RevenueExpensesChart() {
  return (
    <div className="metric-card animate-slide-up">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">Revenue vs Expenses</p>
          <p className="mt-1 text-2xl font-semibold text-foreground">$480K / $310K</p>
        </div>
        <div className="flex gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-primary" />
            Revenue
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground opacity-40" />
            Expenses
          </span>
        </div>
      </div>
      <div className="h-[220px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }} barGap={4}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 13% 91%)" vertical={false} />
            <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'hsl(220 9% 46%)' }} />
            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'hsl(220 9% 46%)' }} tickFormatter={formatCurrency} />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(0 0% 100%)',
                border: '1px solid hsl(220 13% 91%)',
                borderRadius: '8px',
                fontSize: '13px',
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
              }}
              formatter={(value: number) => [`$${value.toLocaleString()}`, '']}
            />
            <Bar dataKey="revenue" fill="hsl(222 47% 11%)" radius={[4, 4, 0, 0]} />
            <Bar dataKey="expenses" fill="hsl(220 13% 91%)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
