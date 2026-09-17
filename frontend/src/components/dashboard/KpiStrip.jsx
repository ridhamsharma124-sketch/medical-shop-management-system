import { Link } from 'react-router-dom';

export default function KpiStrip({ items, cols = 'md:grid-cols-3 xl:grid-cols-5' }) {
  return (
    <div className={`grid grid-cols-2 ${cols} gap-3`}>
      {items.map((item) => {
        const Icon = item.icon;
        const classes = `group relative flex flex-col gap-1 rounded-lgx border border-line bg-surface p-3 shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md sm:p-3.5 ${
          item.to ? 'cursor-pointer' : ''
        }`;
        const inner = (
          <>
            <div className="flex items-center justify-between">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-accent-soft text-accent transition-transform duration-200 group-hover:scale-105">
                <Icon size={13} strokeWidth={2.1} />
              </span>
              {item.trend && (
                <span
                  className={`text-[10px] font-semibold ${
                    item.trend.up ? 'text-olive-deep' : 'text-berry-deep'
                  }`}
                >
                  {item.trend.up ? '↑' : '↓'} {item.trend.label}
                </span>
              )}
            </div>
            <div className="mt-0.5 font-display text-[16px] font-bold leading-none tracking-tight text-heading sm:text-[17px]">
              {item.value}
            </div>
            <div className="flex items-center gap-1 truncate text-[10.5px] font-medium text-body">
              {item.label}
              {item.to && (
                <span className="translate-x-[-4px] text-accent opacity-0 transition-all duration-200 group-hover:translate-x-0 group-hover:opacity-100">
                  →
                </span>
              )}
            </div>
          </>
        );
        return item.to ? (
          <Link key={item.label} to={item.to} className={classes}>
            {inner}
          </Link>
        ) : (
          <div key={item.label} className={classes}>
            {inner}
          </div>
        );
      })}
    </div>
  );
}