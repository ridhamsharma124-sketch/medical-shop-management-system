import { ResponsiveContainer, AreaChart, Area } from 'recharts';

function cssVar(name, fallback = '') {
  if (typeof document === 'undefined') return fallback;
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;
}

export default function StatCard({ icon: Icon, label, value, progress = 0, trend, spark = [] }) {
  const accent = cssVar('--color-accent');
  const hasSpark = spark.length > 1;
  const data = spark.map((v, i) => ({ i, v }));
  const sparkId = `spark-${label.replace(/[^A-Za-z0-9]/g, '')}`;

  return (
    <div className="rounded-lgx border border-line bg-surface p-3 shadow-card transition-all hover:-translate-y-px hover:shadow-float">
      <div className="flex items-center justify-between">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-soft text-accent">
          <Icon size={15} />
        </span>
        {trend && (
          <span
            className={`rounded px-1.5 py-0.5 text-[10px] font-semibold leading-none ${
              trend.up ? 'bg-olive-soft text-olive-deep' : 'bg-berry-soft text-berry-deep'
            }`}
          >
            {trend.label}
          </span>
        )}
      </div>
      <div className="mt-2 font-display text-[20px] font-bold leading-none tracking-tight text-heading">{value}</div>
      <div className="mt-0.5 text-[11.5px] text-body">{label}</div>

      {hasSpark ? (
        <div className="mt-2 h-[34px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id={sparkId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={accent} stopOpacity={0.28} />
                  <stop offset="100%" stopColor={accent} stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="v"
                stroke={accent}
                strokeWidth={1.6}
                fill={`url(#${sparkId})`}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="mt-2.5 h-1 w-full overflow-hidden rounded-full bg-bgsecondary">
          <div
            className="h-full rounded-full bg-accent transition-all duration-700"
            style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
          />
        </div>
      )}
    </div>
  );
}