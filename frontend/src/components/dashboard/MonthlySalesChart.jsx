import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LabelList,
  ResponsiveContainer,
} from 'recharts';

const toK = (v) => {
  const n = Number(v) || 0;
  return `₹${(n / 1000).toFixed(2)}k`;
};

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload || !payload.length) return null;
  const d = payload[0]?.payload;
  const rev = payload.find((p) => p.dataKey === 'saleAmount');
  const inv = payload.find((p) => p.dataKey === 'invoiceCount');
  return (
    <div className="rounded-lgx border border-line bg-surface px-3.5 py-2.5 shadow-float">
      <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-body">{d?.month || '—'}</p>
      {rev && (
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full" style={{ background: 'var(--color-accent)' }} />
          <span className="text-[12px] font-medium text-heading">
            Revenue:{' '}
            <span className="font-bold text-accent">
              {d ? `₹${Number(rev.value).toLocaleString('en-IN')}` : '—'}
            </span>
          </span>
        </div>
      )}
      {inv && (
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full" style={{ background: 'var(--color-olive-deep)' }} />
          <span className="text-[12px] font-medium text-heading">
            Invoices: <span className="font-bold text-olive-deep">{Number(inv.value) || 0}</span>
          </span>
        </div>
      )}
    </div>
  );
};

export default function MonthlySalesChart({ data = [] }) {
  const hasInvoices = data.some((d) => d.invoiceCount != null);

  const chartData = data.map((d) => ({
    month: d.month,
    saleAmount: Number(d.saleAmount) || 0,
    invoiceCount: hasInvoices ? Number(d.invoiceCount) || 0 : undefined,
    revLabel: toK(Number(d.saleAmount) || 0),
  }));

  if (!chartData.length) {
    return (
      <div className="flex h-[280px] items-center justify-center rounded-lgx border border-dashed border-line bg-bgprimary/40">
        <p className="text-[13px] text-body/70">No sales data yet</p>
      </div>
    );
  }

  return (
    <div className="min-h-[340px] w-full flex-1">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 26, right: 8, bottom: 6, left: 0 }} barGap={2}>
          <CartesianGrid strokeDasharray="4 4" stroke="var(--color-line)" vertical={false} />
          <XAxis
            dataKey="month"
            interval={0}
            tickMargin={10}
            height={34}
            tick={{ fontSize: 12, fill: 'var(--color-body)' }}
            tickLine={{ stroke: 'var(--color-line)' }}
            axisLine={{ stroke: 'var(--color-line)' }}
          />
          <YAxis
            yAxisId="revenue"
            tick={{ fontSize: 12, fill: 'var(--color-body)' }}
            tickLine={false}
            axisLine={{ stroke: 'var(--color-line)' }}
            tickFormatter={toK}
            width={62}
          />
          {hasInvoices && (
            <YAxis
              yAxisId="invoices"
              orientation="right"
              tick={{ fontSize: 12, fill: 'var(--color-body)' }}
              tickLine={false}
              axisLine={{ stroke: 'var(--color-line)' }}
              allowDecimals={false}
              width={30}
            />
          )}
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--color-bgprimary)', opacity: 0.5 }} />
          <Legend
            iconType="circle"
            iconSize={8}
            wrapperStyle={{ fontSize: 12, fontWeight: 500 }}
            formatter={(value) => <span style={{ color: 'var(--color-body)' }}>{value}</span>}
          />
          <Bar
            yAxisId="revenue"
            dataKey="saleAmount"
            name="Revenue"
            fill="var(--color-accent)"
            radius={[6, 6, 0, 0]}
            barSize={28}
            minPointSize={3}
          >
            <LabelList
              dataKey="revLabel"
              position="top"
              offset={6}
              style={{ fontSize: 11.5, fill: 'var(--color-heading)', fontWeight: 700 }}
            />
          </Bar>
          {hasInvoices && (
            <Bar
              yAxisId="invoices"
              dataKey="invoiceCount"
              name="Invoices"
              fill="var(--color-olive-deep)"
radius={[6, 6, 0, 0]}
            barSize={28}
            minPointSize={3}
          >
            <LabelList
              dataKey="invoiceCount"
              position="top"
              offset={6}
              style={{ fontSize: 11.5, fill: 'var(--color-olive-deep)', fontWeight: 700 }}
            />
            </Bar>
          )}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}