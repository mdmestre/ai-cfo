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
      <div className="mb-5 flex items-center justify-between">
        <div>
          <p className="text-[13px] font-medium text-muted-foreground">Revenue vs Expenses</p>
          <p className="mt-1.5 text-2xl font-semibold tracking-tight text-foreground">$480K <span className="text-base font-normal text-muted-foreground">/ $310K</span></p>
        </div>
        <div className="flex gap-4 text-xxs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-foreground" />
            Revenue
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-border" />
            Expenses
          </span>
        </div>
      </div>
      <div className="h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }} barGap={3}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(0 0% 94%)" vertical={false} />
            <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'hsl(0 0% 45%)' }} />
            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'hsl(0 0% 45%)' }} tickFormatter={formatCurrency} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid hsl(0 0% 92%)',
                borderRadius: '8px',
                fontSize: '12px',
                boxShadow: '0 4px 12px rgb(0 0 0 / 0.08)',
              }}
              formatter={(value: number) => [`$${value.toLocaleString()}`, '']}
            />
            <Bar dataKey="revenue" fill="hsl(0 0% 9%)" radius={[3, 3, 0, 0]} />
            <Bar dataKey="expenses" fill="hsl(0 0% 88%)" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
