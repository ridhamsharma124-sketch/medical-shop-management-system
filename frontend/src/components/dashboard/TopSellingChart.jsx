import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';


const data = [
  { name: 'Paracetamol 500mg', units: 482 },
  { name: 'Amoxicillin 250mg', units: 396 },
  { name: 'Cetirizine 10mg', units: 341 },
  { name: 'Vitamin D3 60k', units: 268 },
  { name: 'Azithromycin 500', units: 204 },
  { name: 'Omeprazole 20mg', units: 158 },
];

const maxUnits = Math.max(...data.map((d) => d.units));

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload || !payload.length) return null;
  const d = payload[0];
  return (
    <div className="rounded-lgx border border-line bg-surface px-3.5 py-2.5 shadow-float">
      <p className="text-[12px] font-semibold text-heading">{d.payload.name}</p>
      <p className="mt-0.5 text-[12px] text-body">
        <span className="font-display text-[15px] font-bold text-accent">{d.value}</span> units sold
      </p>
    </div>
  );
};

export default function TopSellingChart() {
  return (
    <div className="h-[280px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 0, right: 30, bottom: 0, left: 8 }} barCategoryGap="30%">
          <defs>
            <linearGradient id="topSellGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="var(--color-accent)" stopOpacity={0.45} />
              <stop offset="100%" stopColor="var(--color-accent)" stopOpacity={1} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-line)" horizontal={false} />
          <XAxis type="number" tick={{ fontSize: 12, fill: 'var(--color-body)' }} tickLine={false} axisLine={false} />
          <YAxis
            type="category"
            dataKey="name"
            width={132}
            tick={{ fontSize: 12.5, fill: 'var(--color-heading)', fontWeight: 500 }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--color-bgprimary)', opacity: 0.5 }} />
          <Bar dataKey="units" radius={[0, 8, 8, 0]} barSize={16}>
            {data.map((d) => (
              <Cell
                key={d.name}
                fill="url(#topSellGrad)"
                fillOpacity={0.4 + 0.6 * (d.units / maxUnits)}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}