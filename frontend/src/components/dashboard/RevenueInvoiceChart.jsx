import {
  ComposedChart,
  Bar,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { palette } from './TopSellingChart';

const data = [
  { m: 'Jan', invoices: 148, revenue: 1.6 },
  { m: 'Feb', invoices: 162, revenue: 1.9 },
  { m: 'Mar', invoices: 155, revenue: 1.5 },
  { m: 'Apr', invoices: 189, revenue: 2.3 },
  { m: 'May', invoices: 196, revenue: 2.1 },
  { m: 'Jun', invoices: 224, revenue: 2.8 },
  { m: 'Jul', invoices: 218, revenue: 2.5 },
  { m: 'Aug', invoices: 247, revenue: 3.1 },
  { m: 'Sep', invoices: 238, revenue: 2.9 },
  { m: 'Oct', invoices: 275, revenue: 3.4 },
  { m: 'Nov', invoices: 293, revenue: 3.8 },
  { m: 'Dec', invoices: 326, revenue: 4.2 },
];

export default function RevenueInvoiceChart() {
  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 10, right: 12, bottom: 0, left: -18 }}>
          <defs>
            <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={palette.accent} stopOpacity={0.28} />
              <stop offset="100%" stopColor={palette.accent} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={palette.line} vertical={false} />
          <XAxis dataKey="m" tick={{ fontSize: 12, fill: palette.body }} tickLine={false} axisLine={false} dy={6} />
          <YAxis
            yAxisId="invoices"
            tick={{ fontSize: 12, fill: palette.body }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            yAxisId="revenue"
            orientation="right"
            tick={{ fontSize: 12, fill: palette.body }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => `₹${v}L`}
          />
          <Tooltip
            cursor={{ fill: palette.bgPrimary }}
            contentStyle={{
              background: palette.surface,
              border: `1px solid ${palette.line}`,
              borderRadius: 12,
              boxShadow: '0 8px 24px rgba(43,33,27,0.08)',
              fontSize: 13,
              color: palette.heading,
            }}
            formatter={(v, name) => (name === 'Revenue' ? [`₹${v}L`, name] : [`${v}`, name])}
          />
          <Legend
            iconType="circle"
            iconSize={8}
            wrapperStyle={{ fontSize: 12.5, color: palette.body, paddingTop: 6 }}
          />
          <Bar yAxisId="invoices" dataKey="invoices" name="Invoices" fill={palette.mustard} radius={[5, 5, 0, 0]} barSize={16} />
          <Area
            yAxisId="revenue"
            type="monotone"
            dataKey="revenue"
            name="Revenue"
            stroke={palette.accent}
            strokeWidth={2.5}
            fill="url(#revenueGrad)"
            dot={false}
            activeDot={{ r: 5, fill: palette.accent, stroke: palette.surface, strokeWidth: 2 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}