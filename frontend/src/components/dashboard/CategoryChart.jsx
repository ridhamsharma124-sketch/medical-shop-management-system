import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

const COLORS = [
  'var(--color-accent)',
  'var(--color-mustard)',
  'var(--color-olive)',
  'var(--color-teal)',
  'var(--color-berry)',
  '#8A5A9E',
];

const inr = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload || !payload.length) return null;
  const d = payload[0];
  return (
    <div className="rounded-lgx border border-line bg-surface px-3.5 py-2.5 shadow-float">
      <div className="flex items-center gap-2">
        <span className="h-2 w-2 rounded-full" style={{ background: d.payload.color }} />
        <span className="text-[12px] font-semibold text-heading">{d.name}</span>
      </div>
      <p className="mt-1 font-display text-[14px] font-bold text-accent">
        {d.value.toFixed(1)}% · {inr(d.payload.saleAmount)}
      </p>
    </div>
  );
};

export default function CategoryChart({ data = [] }) {
  const total = data.reduce((s, d) => s + (Number(d.saleAmount) || 0), 0);

  const chartData = data
    .map((d, i) => ({
      name: d.category || 'Others',
      saleAmount: Number(d.saleAmount) || 0,
      value: total > 0 ? ((Number(d.saleAmount) || 0) / total) * 100 : 0,
      color: COLORS[i % COLORS.length],
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);

  if (!chartData.length) {
    return (
      <div className="flex min-h-0 flex-1 items-center justify-center rounded-lgx border border-dashed border-line bg-bgprimary/40">
        <p className="text-[13px] text-body/70">No category sales yet</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col justify-between gap-4">
      <div className="relative mx-auto w-full max-w-[240px]" style={{ height: 'min(240px, 100%)' }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="name"
              innerRadius={58}
              outerRadius={86}
              paddingAngle={4}
              stroke="none"
              cornerRadius={6}
            >
              {chartData.map((d) => (
                <Cell key={d.name} fill={d.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} offset={42} />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-display text-[26px] font-bold text-heading">
            {Math.round(chartData[0].value)}%
          </span>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-body">
            {chartData[0].name}
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-2.5">
        {chartData.map((d) => (
          <div key={d.name} className="group flex items-center justify-between gap-3">
            <span className="flex min-w-0 items-center gap-2.5">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full transition-transform duration-200 group-hover:scale-125"
                style={{ background: d.color }}
              />
              <span className="truncate text-[13px] font-medium text-heading">{d.name}</span>
            </span>
            <span className="flex shrink-0 items-center gap-2">
              <span className="w-16 overflow-hidden rounded-full bg-bgsecondary">
                <span
                  className="block h-1.5 rounded-full transition-all duration-700"
                  style={{ width: `${d.value}%`, background: d.color }}
                />
              </span>
              <span className="w-16 text-right font-display text-[13px] font-bold text-body">
                {d.value.toFixed(1)}%
              </span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}