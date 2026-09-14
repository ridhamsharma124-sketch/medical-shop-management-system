import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { palette } from './TopSellingChart';

const data = [
  { name: 'Antibiotics', value: 32, color: palette.accent },
  { name: 'Painkillers', value: 24, color: palette.mustard },
  { name: 'Vitamins & Supplements', value: 19, color: palette.olive },
  { name: 'Diabetic Care', value: 15, color: palette.teal },
  { name: 'Others', value: 10, color: palette.berry },
];

export default function CategoryChart() {
  return (
    <div>
      <div className="mx-auto h-[190px] w-full max-w-[260px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius={62}
              outerRadius={88}
              paddingAngle={3}
              stroke="none"
              cornerRadius={4}
            >
              {data.map((d) => (
                <Cell key={d.name} fill={d.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                background: palette.surface,
                border: `1px solid ${palette.line}`,
                borderRadius: 12,
                boxShadow: '0 8px 24px rgba(43,33,27,0.08)',
                fontSize: 13,
                color: palette.heading,
              }}
              formatter={(v, name) => [`${v}%`, name]}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-5 flex flex-col gap-2.5">
        {data.map((d) => (
          <div key={d.name} className="flex items-center justify-between gap-3">
            <span className="flex min-w-0 items-center gap-2.5">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: d.color }} />
              <span className="truncate text-[13px] font-medium text-heading">{d.name}</span>
            </span>
            <span className="shrink-0 font-display text-[14px] font-bold text-body">{d.value}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}