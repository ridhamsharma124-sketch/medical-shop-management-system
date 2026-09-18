import { useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Bell, Loader2, Search } from 'lucide-react';
import { fetchNotificationsList } from '../features/notificationSlice';
import {
  notificationMeta,
  timeAgo,
  notificationDetail,
  markNotificationsRead,
} from '../components/notifications/notificationHelpers';

const PAGE_SIZE = 40;

const FILTERS = [
  { key: 'all', label: 'All', types: null },
  { key: 'stock', label: 'Stock alerts', types: ['low_stock', 'out_of_stock'] },
  { key: 'expiry', label: 'Expiry', types: ['near_expiry', 'expired'] },
  { key: 'billing', label: 'Bills & orders', types: ['new_bill', 'new_order'] },
  { key: 'other', label: 'Others', types: ['other'] },
];

function formatDateTime(dateStr) {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return '—';
  return d
    .toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    })
    .replace(',', ' ·');
}

export default function NotificationsPage() {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);
  const { items, total, loading, error } = useSelector((state) => state.notifications);
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const markedRef = useRef(false);

  const role = user?.role;

  useEffect(() => {
    if (role) {
      dispatch(fetchNotificationsList({ role, params: { page: 1, limit: PAGE_SIZE } }));
    }
  }, [dispatch, role]);

  const combinedItems = items;
  const allCount = combinedItems.length;

  useEffect(() => {
    if (role && items.length > 0 && !loading && !markedRef.current) {
      markNotificationsRead(role);
      markedRef.current = true;
    }
  }, [role, items.length, loading]);

  const loadMore = () => {
    const next = page + 1;
    setPage(next);
    dispatch(fetchNotificationsList({ role, params: { page: next, limit: PAGE_SIZE }, append: true }));
  };

  const filtered = useMemo(() => {
    const activeFilter = FILTERS.find((f) => f.key === filter);
    const term = search.trim().toLowerCase();
    return combinedItems.filter((n) => {
      if (activeFilter?.types && !activeFilter.types.includes(n.type)) return false;
      if (!term) return true;
      return (n.title || '').toLowerCase().includes(term) || (n.message || '').toLowerCase().includes(term);
    });
  }, [combinedItems, filter, search]);

  return (
    <div className="flex flex-col gap-5">
      <header className="animate-fade-up">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-accent">
          {role === 'admin' ? 'Admin Console' : "Pharmacist's Counter"}
          <span className="mx-2 text-line">·</span>
          <span className="normal-case tracking-normal text-body/70">Notifications</span>
        </p>
        <h1 className="mt-3 font-display text-[32px] font-bold tracking-tight text-heading sm:text-[36px]">
          Notifications
        </h1>
        <p className="mt-1 text-[14px] text-body">
          {allCount > 0
            ? `${allCount} alert${allCount === 1 ? '' : 's'} · low stock, expiry, bills & orders`
            : 'Alerts for low stock, expiry, bills & orders will show up here.'}
        </p>
      </header>

      <div className="animate-fade-up stagger-1 flex flex-wrap items-center gap-2">
        <div className="relative min-w-[220px] flex-1 sm:max-w-[300px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-body/50" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search notifications…"
            className="h-9.5 w-full rounded-lg border border-line bg-surface py-2 pl-9 pr-3 text-[13px] text-heading placeholder:text-body/50 focus:border-accent focus:outline-none"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => {
            const active = filter === f.key;
            return (
              <button
                key={f.key}
                type="button"
                onClick={() => setFilter(f.key)}
                className={`rounded-full border px-3.5 py-1.5 text-[12px] font-semibold transition-colors ${
                  active
                    ? 'border-accent bg-accent text-white shadow-[0_4px_12px_rgba(193,89,46,0.25)]'
                    : 'border-line bg-surface text-body hover:border-accent/40 hover:text-accent'
                }`}
              >
                {f.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="animate-fade-up stagger-2 overflow-hidden rounded-xl border border-line bg-surface shadow-card">
        {loading && items.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center gap-3">
            <Loader2 size={24} className="animate-spin text-body/50" />
            <p className="text-[13px] text-body/70">Loading notifications…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center gap-2 px-6 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-bgsecondary">
              <Bell size={22} className="text-body/40" />
            </span>
            <p className="mt-1 text-[13.5px] font-semibold text-heading">
              {search || filter !== 'all' ? 'Nothing matches your search' : 'No notifications yet'}
            </p>
            <p className="text-[12px] text-body/70">
              {error ? error : 'New alerts will show up automatically.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left">
              <thead>
                <tr className="border-b border-line bg-bgprimary/60 text-[11px] uppercase tracking-[0.12em] text-body">
                  <th className="px-5 py-3 font-bold">Type</th>
                  <th className="px-5 py-3 font-bold">Notification</th>
                  <th className="px-5 py-3 font-bold">Change</th>
                  <th className="px-5 py-3 text-right font-bold">Date & time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {filtered.map((n) => {
                  const meta = notificationMeta(n.type);
                  const detail = notificationDetail(n);
                  const Icon = meta.icon;
                  return (
                    <tr key={n._id} className="align-top transition-colors hover:bg-bgprimary/50">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <span
                            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${meta.toneClass}`}
                          >
                            <Icon size={15} strokeWidth={2.2} />
                          </span>
                          <span className="rounded-md bg-bgsecondary px-2 py-0.5 text-[10.5px] font-semibold capitalize text-body">
                            {meta.label}
                          </span>
                        </div>
                      </td>
                      <td className="max-w-[320px] px-5 py-3.5">
                        <p className="text-[13px] font-bold text-heading">{n.title}</p>
                        <p className="mt-0.5 text-[12.5px] leading-relaxed text-body">
                          {n.message}
                          {detail.note && n.message && !n.message.includes(detail.note) && (
                            <span className="block text-[11px] font-semibold text-body/70">({detail.note})</span>
                          )}
                        </p>
                      </td>
                      <td className="px-5 py-3.5">
                        {detail.badge ? (
                          <span
                            className={`inline-block rounded-lg px-2.5 py-1 text-[12px] font-bold ${detail.tone}`}
                          >
                            {detail.badge}
                          </span>
                        ) : (
                          <span className="text-[11px] text-body/50">—</span>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-5 py-3.5 text-right">
                        <p className="text-[12px] font-semibold text-heading">{formatDateTime(n.createdAt)}</p>
                        <p className="mt-0.5 text-[10.5px] text-body/60">{timeAgo(n.createdAt)}</p>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {!loading && items.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 text-[12px] text-body">
          <p>
            Showing{' '}
            <span className="font-bold text-heading">
              {filtered.length}
            </span>{' '}
            of{' '}
            <span className="font-bold text-heading">{filter === 'all' ? allCount : filtered.length}</span>{' '}
            notification{allCount === 1 ? '' : 's'}
          </p>
          {filter === 'all' && items.length < total && (
            <button
              type="button"
              onClick={loadMore}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-lg border border-line bg-surface px-4 py-2 text-[12.5px] font-bold text-accent shadow-card transition-colors hover:bg-bgprimary/60 disabled:opacity-60"
            >
              {loading ? <Loader2 size={14} className="animate-spin" /> : `Load ${Math.min(total - items.length, PAGE_SIZE)} more`}
            </button>
          )}
        </div>
      )}
    </div>
  );
}