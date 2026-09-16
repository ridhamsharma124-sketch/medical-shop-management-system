import { Link } from 'react-router-dom';
import { AlertTriangle, Clock, PackageX, ArrowUpRight } from 'lucide-react';

const tiles = [
  { label: 'Low Stock', value: 18, hint: 'Restock soon', icon: AlertTriangle, tone: 'mustard', to: '/admin/inventory?filter=low' },
  { label: 'Near Expiry', value: 23, hint: 'Sell / rotate', icon: Clock, tone: 'olive', to: '/admin/inventory?filter=expiring' },
  { label: 'Expired', value: 7, hint: 'Discard needed', icon: PackageX, tone: 'berry', to: '/admin/inventory?filter=expired' },
];

const items = [
  { name: 'Cetirizine 10mg', batch: 'CT-0877', company: 'Cipla', status: 'Low stock', days: 'Only 8 left', tone: 'mustard' },
  { name: 'Vitamin D3 60k', batch: 'VD-1120', company: 'Zydus', status: 'Expired', days: 'Expired 2 days ago', tone: 'berry' },
  { name: 'Metformin 500mg', batch: 'MF-4456', company: 'USV', status: 'Near expiry', days: '19 days left', tone: 'olive' },
  { name: 'Amoxicillin 250mg', batch: 'AM-5541', company: 'Sun Pharma', status: 'Near expiry', days: '30 days left', tone: 'olive' },
  { name: 'Azithromycin 500', batch: 'AZ-3345', company: "Dr. Reddy's", status: 'Low stock', days: 'Only 15 left', tone: 'mustard' },
  { name: 'Ibuprofen 400mg', batch: 'IB-9901', company: 'Zydus', status: 'Expired', days: 'Expired 5 days ago', tone: 'berry' },
];

const toneStyles = {
  mustard: {
    tile: 'bg-mustard-soft text-mustard-deep',
    icon: 'bg-mustard/12 text-mustard-deep',
    dot: 'bg-mustard',
    badge: 'bg-mustard-soft text-mustard-deep',
  },
  olive: {
    tile: 'bg-olive-soft text-olive-deep',
    icon: 'bg-olive/12 text-olive-deep',
    dot: 'bg-olive',
    badge: 'bg-olive-soft text-olive-deep',
  },
  berry: {
    tile: 'bg-berry-soft text-berry-deep',
    icon: 'bg-berry/12 text-berry-deep',
    dot: 'bg-berry',
    badge: 'bg-berry-soft text-berry-deep',
  },
};

export default function StockOverview() {
  return (
    <div>
      {/* status tiles */}
      <div className="grid grid-cols-3 gap-2.5">
        {tiles.map((t) => {
          const s = toneStyles[t.tone];
          const Icon = t.icon;
          return (
            <Link
              key={t.label}
              to={t.to}
              className={`group relative rounded-lgx p-3.5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${s.tile}`}
            >
              <span
                className="absolute right-3 top-3 text-current opacity-0 transition-opacity duration-200 group-hover:opacity-100"
              >
                <ArrowUpRight size={13} strokeWidth={2.4} />
              </span>
              <span className={`flex h-7 w-7 items-center justify-center rounded-lg ${s.icon}`}>
                <Icon size={14} strokeWidth={2.1} />
              </span>
              <p className="mt-2 font-display text-[22px] font-bold leading-none">{t.value}</p>
              <p className="mt-1 text-[10.5px] font-semibold">{t.label}</p>
              <p className="text-[9.5px] opacity-70">{t.hint}</p>
            </Link>
          );
        })}
      </div>

      {/* list */}
      <ul className="mt-4 flex max-h-[220px] flex-col divide-y divide-line overflow-y-auto pr-1 [scrollbar-width:thin] [scrollbar-color:var(--color-line)_transparent]">
        {items.map((it) => {
          const s = toneStyles[it.tone];
          return (
            <li key={`${it.batch}-${it.status}`} className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
              <div className="flex min-w-0 items-center gap-2.5">
                <span className={`h-2 w-2 shrink-0 rounded-full ${s.dot}`} />
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-semibold text-heading">{it.name}</p>
                  <p className="truncate text-[11px] text-body">
                    {it.company}
                    <span className="mx-1 text-line">·</span>
                    <span className="font-mono">Batch {it.batch}</span>
                  </p>
                </div>
              </div>
              <div className="shrink-0 text-right">
                <span className={`inline-block rounded-md px-2 py-0.5 text-[10px] font-semibold leading-none ${s.badge}`}>
                  {it.status}
                </span>
                <p className="mt-1 text-[10px] text-body/70">{it.days}</p>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}