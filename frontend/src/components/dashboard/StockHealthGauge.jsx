import { RadialBarChart, RadialBar, PolarAngleAxis, ResponsiveContainer } from 'recharts';
import { palette } from './TopSellingChart';

export default function StockHealthGauge({ value = 74 }) {
  const data = [{ name: 'Stock Health', value, fill: palette.accent }];

  return (
    <div>
      <div className="relative mx-auto h-[190px] w-full max-w-[260px]">
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart data={data} innerRadius="78%" outerRadius="100%" startAngle={220} endAngle={-40}>
            <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
            <RadialBar dataKey="value" angleAxisId={0} cornerRadius={12} fill={palette.accent} background={{ fill: palette.line }} />
          </RadialBarChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-display text-[32px] font-bold leading-none text-heading">{value}%</span>
          <span className="mt-1.5 text-[11px] font-semibold uppercase tracking-wide text-body">Stock Health</span>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
        <span className="rounded-full bg-mustard-soft px-2.5 py-1 text-[11px] font-semibold text-mustard-deep">18 Low stock</span>
        <span className="rounded-full bg-berry-soft px-2.5 py-1 text-[11px] font-semibold text-berry-deep">7 Expired</span>
        <span className="rounded-full bg-olive-soft px-2.5 py-1 text-[11px] font-semibold text-olive-deep">23 Near expiry</span>
      </div>
    </div>
  );
}