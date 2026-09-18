import { Link } from 'react-router-dom';
import { AlertTriangle, Clock, PackageX, XCircle, ArrowUpRight } from 'lucide-react';

const toneStyles = {
  mustard: {
    tile: 'bg-mustard-soft text-mustard-deep',
    icon: 'bg-mustard/12 text-mustard-deep',
  },
  olive: {
    tile: 'bg-olive-soft text-olive-deep',
    icon: 'bg-olive/12 text-olive-deep',
  },
  berry: {
    tile: 'bg-berry-soft text-berry-deep',
    icon: 'bg-berry/12 text-berry-deep',
  },
  red: {
    tile: 'bg-red-50 text-red-600',
    icon: 'bg-red-100 text-red-600',
  },
};

const isExpired = (d) => !!d && new Date(d).getTime() < Date.now();

const isExpiringSoon = (d, days = 30) => {
  if (!d) return false;
  const diff = new Date(d).getTime() - Date.now();
  return diff > 0 && diff <= days * 86400000;
};

const formatDate = (d) => {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

const getAlert = (m) => {
  const stock = Number(m.stock) || 0;
  const threshold = Number(m.lowStockThreshold) || 10;
  if (isExpired(m.expiry)) return { label: 'Expired', cls: 'bg-red-50 text-red-600', rank: 0 };
  if (stock === 0) return { label: 'Out of Stock', cls: 'bg-red-50 text-red-600', rank: 1 };
  if (stock <= threshold) return { label: 'Low Stock', cls: 'bg-amber-50 text-amber-600', rank: 2 };
  if (isExpiringSoon(m.expiry)) return { label: 'Expiring', cls: 'bg-mustard-soft text-mustard-deep', rank: 3 };
  return null;
};

export default function StockOverview({ data = {}, inventoryTo = '/admin/inventory', medicines }) {
  const meds = Array.isArray(medicines) ? medicines : [];
  const hasMeds = meds.length > 0;

  const count = (fn, fallback) => (hasMeds ? meds.filter(fn).length : fallback);

  const outOfStock = count((m) => Number(m.stock) === 0, data.outOfStock);
  const lowStock = count(
    (m) => Number(m.stock) > 0 && Number(m.stock) <= (Number(m.lowStockThreshold) || 10),
    data.lowStock
  );
  const nearExpiry = count((m) => isExpiringSoon(m.expiry), data.nearExpiry);
  const expired = count((m) => isExpired(m.expiry), data.expired);

  const tiles = [
    {
      label: 'Low Stock',
      value: lowStock === undefined ? '—' : lowStock,
      hint: 'Restock soon',
      icon: AlertTriangle,
      tone: 'mustard',
      to: `${inventoryTo}?filter=low`,
      active: lowStock !== undefined,
    },
    {
      label: 'Out of Stock',
      value: outOfStock === undefined ? '—' : outOfStock,
      hint: 'Reorder now',
      icon: PackageX,
      tone: 'red',
      to: `${inventoryTo}?filter=out`,
      active: outOfStock !== undefined,
    },
    {
      label: 'Near Expiry',
      value: nearExpiry === undefined ? '—' : nearExpiry,
      hint: 'Sell / rotate',
      icon: Clock,
      tone: 'olive',
      to: `${inventoryTo}?filter=expiring`,
      active: nearExpiry !== undefined,
    },
    {
      label: 'Expired',
      value: expired === undefined ? '—' : expired,
      hint: 'Discard needed',
      icon: XCircle,
      tone: 'berry',
      to: `${inventoryTo}?filter=expired`,
      active: expired !== undefined,
    },
  ];

  const alertMeds = meds
    .map((m) => ({ m, alert: getAlert(m) }))
    .filter((x) => x.alert)
    .sort((a, b) => a.alert.rank - b.alert.rank)
    .slice(0, 6);

  return (
    <div>
      <div className="grid grid-cols-2 gap-2.5">
        {tiles.map((t) => {
          const s = toneStyles[t.tone];
          const Icon = t.icon;
          return (
            <Link
              key={t.label}
              to={t.to}
              className={`group relative rounded-lgx p-3.5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${s.tile} ${
                t.active ? '' : 'opacity-60'
              }`}
            >
              <span className="absolute right-3 top-3 text-current opacity-0 transition-opacity duration-200 group-hover:opacity-100">
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

      {hasMeds ? (
        <div className="mt-4">
          <div className="mb-2 flex items-center justify-between px-0.5">
            <p className="text-[11px] font-bold uppercase tracking-wide text-body">Medicine alerts</p>
            <Link
              to={inventoryTo}
              className="inline-flex items-center gap-0.5 rounded-lg px-1.5 py-0.5 text-[11.5px] font-semibold text-accent transition-colors hover:bg-accent-soft"
            >
              View all <ArrowUpRight size={12} />
            </Link>
          </div>
          {alertMeds.length === 0 ? (
            <div className="rounded-lgx border border-dashed border-line bg-bgprimary/40 p-3.5 text-center">
              <p className="text-[11.5px] font-medium text-body">All medicines are in good shape.</p>
            </div>
          ) : (
            <div className="divide-y divide-line overflow-hidden rounded-lgx border border-line">
              {alertMeds.map(({ m, alert }) => (
                <div key={m._id} className="flex items-center justify-between gap-2 px-3 py-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-[12.5px] font-semibold text-heading">{m.name}</p>
                    <p className="truncate text-[10.5px] text-body">
                      {m.category}
                      {m.batch ? ` · ${m.batch}` : ''} · Stock {Number(m.stock) || 0} · {formatDate(m.expiry)}
                    </p>
                  </div>
                  <span className={`shrink-0 rounded-lg px-2 py-1 text-[10.5px] font-semibold ${alert.cls}`}>
                    {alert.label}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="mt-4 rounded-lgx border border-dashed border-line bg-bgprimary/40 p-3.5 text-center">
          <p className="text-[11.5px] font-medium text-body">Track, restock & dispose medicines from the inventory screen.</p>
        </div>
      )}
    </div>
  );
}