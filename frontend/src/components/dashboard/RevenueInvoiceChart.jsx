import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';


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

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="rounded-lgx border border-line bg-surface px-3.5 py-2.5 shadow-float">
      <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-body">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2 py-0.5">
          <span className="h-2 w-2 rounded-full" style={{ background: p.color }} />
          <span className="text-[12px] font-medium text-heading">
            {p.name}:{' '}
            <span className="font-bold">
              {p.name === 'Revenue' ? `₹${p.value}L` : p.value}
            </span>
          </span>
        </div>
      ))}
    </div>
  );
};

export default function RevenueInvoiceChart() {
  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 10, right: 12, bottom: 0, left: -18 }}>
          <defs>
            <linearGradient id="invoiceGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-mustard)" stopOpacity={1} />
              <stop offset="100%" stopColor="var(--color-mustard)" stopOpacity={0.65} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="4 4" stroke="var(--color-line)" vertical={false} />
          <XAxis dataKey="m" tick={{ fontSize: 12, fill: 'var(--color-body)' }} tickLine={false} axisLine={false} dy={6} />
          <YAxis
            yAxisId="invoices"
            tick={{ fontSize: 12, fill: 'var(--color-body)' }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            yAxisId="revenue"
            orientation="right"
            tick={{ fontSize: 12, fill: 'var(--color-body)' }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => `₹${v}L`}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--color-bgprimary)', opacity: 0.5 }} />
          <Legend
            iconType="circle"
            iconSize={9}
            wrapperStyle={{ fontSize: 12.5, color: 'var(--color-body)', paddingTop: 8 }}
          />
          <Bar
            yAxisId="invoices"
            dataKey="invoices"
            name="Invoices"
            fill="url(#invoiceGrad)"
            radius={[6, 6, 2, 2]}
            barSize={18}
          />
          <Line
            yAxisId="revenue"
            type="monotone"
            dataKey="revenue"
            name="Revenue"
            stroke="var(--color-accent)"
            strokeWidth={2.6}
            strokeLinecap="round"
            activeDot={{ r: 6.5, fill: 'var(--color-accent)', stroke: 'var(--color-surface)', strokeWidth: 2.5 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}