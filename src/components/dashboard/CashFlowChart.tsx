import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const data = [
  { month: "Jan", actual: 420000, forecast: null },
  { month: "Feb", actual: 395000, forecast: null },
  { month: "Mar", actual: 450000, forecast: null },
  { month: "Apr", actual: 480000, forecast: null },
  { month: "May", actual: 460000, forecast: null },
  { month: "Jun", actual: null, forecast: 490000 },
  { month: "Jul", actual: null, forecast: 520000 },
  { month: "Aug", actual: null, forecast: 510000 },
];

const formatCurrency = (value: number) => {
  return `$${(value / 1000).toFixed(0)}K`;
};

export function CashFlowChart() {
  return (
    <div className="metric-card animate-slide-up">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">Cash Flow Forecast</p>
          <p className="mt-1 text-2xl font-semibold text-foreground">$460,000</p>
        </div>
        <div className="flex gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-primary" />
            Actual
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-info opacity-50" />
            Forecast
          </span>
        </div>
      </div>
      <div className="h-[220px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="actualGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(222 47% 11%)" stopOpacity={0.15} />
                <stop offset="100%" stopColor="hsl(222 47% 11%)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="forecastGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(217 91% 60%)" stopOpacity={0.1} />
                <stop offset="100%" stopColor="hsl(217 91% 60%)" stopOpacity={0} />
              </linearGradient>
            </defs>
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
            <Area
              type="monotone"
              dataKey="actual"
              stroke="hsl(222 47% 11%)"
              strokeWidth={2}
              fill="url(#actualGradient)"
              connectNulls={false}
            />
            <Area
              type="monotone"
              dataKey="forecast"
              stroke="hsl(217 91% 60%)"
              strokeWidth={2}
              strokeDasharray="6 4"
              fill="url(#forecastGradient)"
              connectNulls={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
