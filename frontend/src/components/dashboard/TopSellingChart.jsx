import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  LabelList,
  ResponsiveContainer,
} from 'recharts';

const toK = (v) => {
  const n = Number(v) || 0;
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`.replace('.0L', 'L');
  if (n >= 1000) return `₹${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k`;
  return `₹${n}`;
};

const shortName = (name = '') => (name.length > 13 ? `${name.slice(0, 12)}…` : name);

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload || !payload.length) return null;
  const d = payload[0]?.payload;
  return (
    <div className="rounded-lgx border border-line bg-surface px-3.5 py-2.5 shadow-float">
      <p className="text-[12px] font-semibold text-heading">{d?.name || '—'}</p>
      <p className="mt-0.5 font-display text-[14px] font-bold text-teal-deep">
        {d ? toK(d.saleAmount) : '—'}
      </p>
    </div>
  );
};

export default function TopSellingChart({ data = [] }) {
  const chartData = data.map((d, i) => {
    const name = d.name || `Item ${i + 1}`;
    return {
      name,
      shortName: shortName(name),
      saleAmount: Number(d.saleAmount) || 0,
      topLabel: toK(Number(d.saleAmount) || 0),
    };
  });

  if (!chartData.length) {
    return (
      <div className="flex h-[280px] items-center justify-center rounded-lgx border border-dashed border-line bg-bgprimary/40">
        <p className="text-[13px] text-body/70">No top selling medicines yet</p>
      </div>
    );
  }

  return (
    <div className="min-h-0 w-full flex-1">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 24, right: 8, bottom: 6, left: 0 }}>
          <CartesianGrid strokeDasharray="4 4" stroke="var(--color-line)" vertical={false} />
          <XAxis
            dataKey="shortName"
            tick={{ fontSize: 11.5, fill: 'var(--color-body)' }}
            tickLine={false}
            axisLine={{ stroke: 'var(--color-line)' }}
            interval={0}
            height={34}
            tickMargin={8}
          />
          <YAxis
            tick={{ fontSize: 12, fill: 'var(--color-body)' }}
            tickLine={false}
            axisLine={{ stroke: 'var(--color-line)' }}
            tickFormatter={toK}
            width={56}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--color-bgprimary)', opacity: 0.5 }} />
          <Bar
            dataKey="saleAmount"
            name="Revenue"
            fill="var(--color-teal)"
            radius={[6, 6, 0, 0]}
            barSize={36}
            minPointSize={3}
          >
            <LabelList
              dataKey="topLabel"
              position="top"
              offset={6}
              style={{ fontSize: 10.5, fill: 'var(--color-heading)', fontWeight: 700 }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}