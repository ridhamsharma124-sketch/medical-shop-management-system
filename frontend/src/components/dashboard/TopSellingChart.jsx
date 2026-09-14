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

function cssVar(name, fallback = '') {
  if (typeof document === 'undefined') return fallback;
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;
}

export const palette = {
  accent: cssVar('--color-accent'),
  accentHover: cssVar('--color-accent-hover'),
  heading: cssVar('--color-heading'),
  body: cssVar('--color-body'),
  line: cssVar('--color-line'),
  surface: cssVar('--color-surface'),
  bgPrimary: cssVar('--color-bgprimary'),
  olive: cssVar('--color-olive'),
  oliveSoft: cssVar('--color-olive-soft'),
  oliveDeep: cssVar('--color-olive-deep'),
  mustard: cssVar('--color-mustard'),
  mustardSoft: cssVar('--color-mustard-soft'),
  mustardDeep: cssVar('--color-mustard-deep'),
  berry: cssVar('--color-berry'),
  berrySoft: cssVar('--color-berry-soft'),
  berryDeep: cssVar('--color-berry-deep'),
  teal: cssVar('--color-teal'),
};

const data = [
  { name: 'Paracetamol 500mg', units: 482 },
  { name: 'Amoxicillin 250mg', units: 396 },
  { name: 'Cetirizine 10mg', units: 341 },
  { name: 'Vitamin D3 60k', units: 268 },
  { name: 'Azithromycin 500', units: 204 },
  { name: 'Omeprazole 20mg', units: 158 },
];

const maxUnits = Math.max(...data.map((d) => d.units));

export default function TopSellingChart() {
  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 0, right: 28, bottom: 0, left: 10 }} barCategoryGap="28%">
          <CartesianGrid strokeDasharray="3 3" stroke={palette.line} horizontal={false} />
          <XAxis type="number" tick={{ fontSize: 12, fill: palette.body }} tickLine={false} axisLine={false} />
          <YAxis
            type="category"
            dataKey="name"
            width={135}
            tick={{ fontSize: 12.5, fill: palette.heading }}
            tickLine={false}
            axisLine={false}
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
            formatter={(v) => [`${v} units`, 'Sold']}
          />
          <Bar dataKey="units" radius={[0, 8, 8, 0]} barSize={18}>
            {data.map((d) => (
              <Cell
                key={d.name}
                fill={palette.accent}
                fillOpacity={0.35 + 0.65 * (d.units / maxUnits)}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}