import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Receipt, ShoppingCart, Package, AlertTriangle, PackageX, Clock, ArrowUpRight, LineChart, CalendarClock, FileText, Boxes } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

import KpiStrip from '../../components/dashboard/KpiStrip';
import CardPanel from '../../components/dashboard/CardPanel';
import { fetchDashboardSummaryData, fetchDashboardChartsData } from '../../features/dashboardSlice';
import { fetchSalesBillsList } from '../../features/salesSlice';
import { fetchMedicinesList } from '../../features/medicineSlice';

const fmt = (n) => (n === undefined || n === null ? '…' : Number(n).toLocaleString('en-IN'));
const inrL = (n) => {
  if (n === undefined || n === null) return '…';
  const lakh = Number(n) / 100000;
  return lakh >= 1 ? `₹${(Math.round(lakh * 10) / 10).toFixed(1)}L` : `₹${Number(n).toLocaleString('en-IN')}`;
};

const customTooltip = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="rounded-lgx border border-line bg-surface px-3.5 py-2.5 shadow-float">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-body">{label}</p>
      <p className="mt-0.5 text-[13px] font-bold text-heading">
        <span className="text-accent">₹{Number(payload[0].value).toLocaleString('en-IN')}</span> sales
      </p>
    </div>
  );
};

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function ViewAll({ to }) {
  return (
    <Link
      to={to}
      className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[12.5px] font-semibold text-accent transition-colors hover:bg-accent-soft"
    >
      View all <ArrowUpRight size={14} />
    </Link>
  );
}

const fmtTime = (d) =>
  d
    ? new Date(d).toLocaleTimeString('en-IN', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      })
    : '—';

const daysLeft = (d) => {
  const t = new Date(d).getTime();
  return Number.isFinite(t) ? Math.ceil((t - Date.now()) / 86400000) : null;
};

export default function PharmacistDashboard() {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);
  const { summary, charts } = useSelector((state) => state.dashboard);
  const recentBills = useSelector((state) => state.sales.items);
  const dashboardMedicines = useSelector((state) => state.medicines.items);
  const role = user?.role;

  useEffect(() => {
    if (role) {
      dispatch(fetchDashboardSummaryData({ role }));
      dispatch(fetchDashboardChartsData({ role }));
      dispatch(fetchSalesBillsList({ role, params: { limit: 5 } }));
      dispatch(fetchMedicinesList({ role, params: { limit: 200 } }));
    }
  }, [dispatch, role]);

  const firstName = user?.name?.split(' ')[0] || 'there';

  const dateLine = new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  const s = summary || {};
  const sales = s.sales || {};
  const medicines = s.medicines || {};
  const bills = s.bills || {};
  const stockAlerts = (() => {
    const meds = Array.isArray(dashboardMedicines) ? dashboardMedicines : [];
    const threshold = (m) => Number(m.lowStockThreshold) || 10;
    const today = new Date();
    const in30 = new Date(today.getTime() + 30 * 86400000);
    return {
      totalStock: meds.reduce((a, m) => a + (Number(m.stock) || 0), 0),
      lowStock: meds.filter((m) => Number(m.stock) > 0 && Number(m.stock) <= threshold(m)).length,
      outOfStock: meds.filter((m) => Number(m.stock) === 0).length,
      lowList: meds
        .filter((m) => Number(m.stock) > 0 && Number(m.stock) <= threshold(m))
        .sort((a, b) => (Number(a.stock) || 0) - (Number(b.stock) || 0)),
      expList: meds
        .filter((m) => m.expiry && new Date(m.expiry) >= today && new Date(m.expiry) <= in30)
        .sort((a, b) => new Date(a.expiry) - new Date(b.expiry)),
      expiredList: meds.filter((m) => m.expiry && new Date(m.expiry) < today),
    };
  })();
  const expiry = s.medicineExpiry || {};

  const salesOverTime = (charts?.salesOverTime || []).map((d) => ({
    ...d,
    saleAmount: Number(d.saleAmount) || 0,
  }));
  const best = charts?.salesOverTime
    ? charts.salesOverTime.reduce((p, c) => (Number(c.saleAmount) > Number(p.saleAmount) ? c : p), {
        saleAmount: 0,
      })
    : { month: '—' };

  const alertRows = [
    ...stockAlerts.expiredList.slice(0, 2).map((m) => ({
      m,
      tone: 'bg-berry/12 text-berry-deep',
      detail: 'Expired',
    })),
    ...stockAlerts.lowList.slice(0, 2).map((m) => ({
      m,
      tone: 'bg-mustard/12 text-mustard-deep',
      detail: `${Number(m.stock)} left`,
    })),
    ...stockAlerts.expList.slice(0, 2).map((m) => ({
      m,
      tone: 'bg-olive/12 text-olive-deep',
      detail: daysLeft(m.expiry) === null ? 'Expiring' : `${daysLeft(m.expiry)}d left`,
    })),
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* ─────────── EDITORIAL HEADER ─────────── */}
      <header className="animate-fade-up">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-accent">
          Pharmacist
          <span className="mx-2 text-line">·</span>
          <span className="text-body/70 normal-case tracking-normal">{dateLine}</span>
        </p>
        <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-[26px] font-bold leading-none tracking-tight text-heading sm:text-[32px]">
              {getGreeting()}, {firstName}
            </h1>
            <p className="mt-2 text-[13.5px] text-body">Here&apos;s what&apos;s happening at your counter today.</p>
          </div>
          <div className="hidden items-center gap-6 pb-1 sm:flex">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-body/70">Sales this month</p>
              <p className="font-display text-[18px] font-bold text-heading">{inrL(sales.thisMonth)}</p>
            </div>
            <div className="h-8 w-px bg-line" />
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-body/70">Medicines</p>
              <p className="font-display text-[18px] font-bold text-olive-deep">{fmt(medicines.total)}</p>
            </div>
          </div>
        </div>
      </header>

      {/* ─────────── KPI PANEL ─────────── */}
      <section className="animate-fade-up stagger-1">
        <KpiStrip
          cols="grid-cols-2 sm:grid-cols-4 xl:grid-cols-4"
          items={[
            {
              icon: Receipt,
              label: 'Total Sales',
              value: inrL(sales.total),
              trend: { label: `+₹${fmt(sales.thisMonth)}`, up: true },
              to: '/pharmacist/billing',
            },
            {
              icon: ShoppingCart,
              label: 'Sales this Month',
              value: inrL(sales.thisMonth),
              trend: { label: `Total ₹${fmt(sales.total)}`, up: true },
              to: '/pharmacist/billing',
            },
            {
              icon: Package,
              label: 'Total Medicines',
              value: fmt(medicines.total),
              trend: { label: `+${fmt(medicines.addedThisMonth)}`, up: true },
              to: '/pharmacist/medicines',
            },
            {
              icon: FileText,
              label: 'Total Bills',
              value: fmt(bills.total),
              trend: { label: 'billing records', up: true },
              to: '/pharmacist/billing',
            },
            {
              icon: Boxes,
              label: 'Total Stock',
              value: fmt(stockAlerts.totalStock),
              trend: { label: 'inventory units', up: true },
              to: '/pharmacist/inventory',
            },
            {
              icon: AlertTriangle,
              label: 'Low Stock',
              value: fmt(stockAlerts.lowStock),
              trend: { label: `${fmt(stockAlerts.outOfStock)} out of stock`, up: false },
              to: '/pharmacist/inventory?filter=low',
            },
            {
              icon: PackageX,
              label: 'Out of Stock',
              value: fmt(stockAlerts.outOfStock),
              trend: { label: `${fmt(stockAlerts.lowStock)} low stock`, up: false },
              to: '/pharmacist/inventory?filter=out',
            },
            {
              icon: Clock,
              label: 'Expiring Soon',
              value: fmt(expiry.nearExpiryWithin30Days),
              trend: { label: `${fmt(expiry.totalExpired)} expired`, up: false },
              to: '/pharmacist/inventory?filter=expiring',
            },
          ]}
        />
      </section>

      {/* ─────────── SALES + EXPIRING ─────────── */}
      <section className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <CardPanel
          className="animate-fade-up stagger-2 xl:col-span-2"
          title="Sales Trend"
          subtitle="Monthly revenue over the last 6 months"
          icon={LineChart}
          tone="accent"
        >
          {/* mini summary row */}
          <div className="mb-5 flex flex-wrap items-center justify-between gap-4 rounded-lgx border border-line bg-bgprimary/60 px-5 py-3.5">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-body/70">Total sales</p>
              <p className="mt-1 font-display text-[22px] font-bold leading-none text-heading">{inrL(sales.total)}</p>
            </div>
            <div className="h-8 w-px bg-line" />
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-body/70">This month</p>
              <p className="mt-1 font-display text-[22px] font-bold leading-none text-heading">{inrL(sales.thisMonth)}</p>
            </div>
            <div className="h-8 w-px bg-line" />
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-body/70">Low stock</p>
              <p className="mt-1 font-display text-[22px] font-bold leading-none text-heading">{fmt(stockAlerts.lowStock)}</p>
            </div>
            <span className="rounded-full bg-accent-soft px-3 py-1.5 text-[11.5px] font-bold text-accent">
              Peak month · {best.month}
            </span>
          </div>
          {salesOverTime.length === 0 ? (
            <div className="flex h-[230px] items-center justify-center rounded-lgx border border-dashed border-line bg-bgprimary/40">
              <p className="text-[13px] text-body/70">No sales data yet</p>
            </div>
          ) : (
            <div className="h-[230px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={salesOverTime} margin={{ top: 10, right: 10, bottom: 0, left: -16 }}>
                  <defs>
                    <linearGradient id="saleGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--color-accent)" stopOpacity={0.18} />
                      <stop offset="100%" stopColor="var(--color-accent)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="4 4" stroke="var(--color-line)" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 12, fill: 'var(--color-body)' }} tickLine={false} axisLine={false} dy={6} />
                  <YAxis tick={{ fontSize: 12, fill: 'var(--color-body)' }} tickLine={false} axisLine={false} />
                  <Tooltip content={customTooltip} cursor={{ stroke: 'var(--color-accent)', strokeDasharray: '4 4', strokeOpacity: 0.4 }} />
                  <Area type="monotone" dataKey="saleAmount" stroke="var(--color-accent)" strokeWidth={2.2} fill="url(#saleGrad)" activeDot={{ r: 5, fill: 'var(--color-accent)', stroke: 'var(--color-surface)', strokeWidth: 2 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardPanel>

        <CardPanel
          className="animate-fade-up stagger-3"
          title="Stock Alerts"
          subtitle="Expiry & low-stock overview"
          icon={CalendarClock}
          tone="berry"
          right={<ViewAll to="/pharmacist/inventory" />}
        >
          <div className="mb-4 grid grid-cols-3 gap-2.5">
            {[
              {
                label: 'Expired',
                value: fmt(expiry.totalExpired),
                bg: 'bg-berry-soft text-berry-deep',
                iconBg: 'bg-berry/12',
                Icon: PackageX,
              },
              {
                label: 'Near',
                value: fmt(expiry.nearExpiryWithin30Days),
                bg: 'bg-olive-soft text-olive-deep',
                iconBg: 'bg-olive/12',
                Icon: Clock,
              },
              {
                label: 'Low stock',
                value: fmt(stockAlerts.lowStock),
                bg: 'bg-mustard-soft text-mustard-deep',
                iconBg: 'bg-mustard/12',
                Icon: AlertTriangle,
              },
            ].map((t) => (
              <Link
                key={t.label}
                to="/pharmacist/inventory"
                className={`group rounded-lgx p-3 transition-shadow hover:shadow-md ${t.bg}`}
              >
                <span className={`flex h-6 w-6 items-center justify-center rounded-md ${t.iconBg}`}>
                  <t.Icon size={13} strokeWidth={2.1} />
                </span>
                <p className="mt-1.5 font-display text-[18px] font-bold leading-none">{t.value}</p>
                <p className="mt-0.5 flex items-center gap-1 text-[10px] font-semibold">
                  {t.label}
                  <ArrowUpRight size={11} className="opacity-0 transition-opacity group-hover:opacity-100" />
                </p>
              </Link>
            ))}
          </div>

          <div className="divide-y divide-line rounded-lgx border border-line bg-bgprimary/40">
            {alertRows.length === 0 ? (
              <p className="px-4 py-5 text-center text-[12px] text-body/70">
                All medicines healthy right now.
              </p>
            ) : (
              alertRows.map((row) => (
                <Link
                  key={row.m._id}
                  to="/pharmacist/inventory"
                  className="flex items-center justify-between gap-2 px-4 py-2.5 transition-colors hover:bg-bgprimary"
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${row.tone.split(' ')[0]}`} />
                    <span className="truncate text-[12px] font-semibold text-heading">{row.m.name}</span>
                  </span>
                  <span className={`shrink-0 rounded-md px-2 py-0.5 text-[10.5px] font-bold ${row.tone}`}>
                    {row.detail}
                  </span>
                </Link>
              ))
            )}
          </div>

          <p className="mt-3 text-center text-[11px] font-medium text-body">
            Reviews, restock & dispose medicines from the{' '}
            <Link to="/pharmacist/inventory" className="font-bold text-accent hover:underline">
              inventory screen
            </Link>
            .
          </p>
        </CardPanel>
      </section>

      {/* ─────────── RECENT BILLS ─────────── */}
      <CardPanel
        className="animate-fade-up stagger-4 overflow-hidden"
        title="Recent Bills"
        subtitle="Latest transactions at the counter"
        icon={Receipt}
        tone="mustard"
        right={<ViewAll to="/pharmacist/billing" />}
      >
        <div className="-mx-5 overflow-x-auto px-5">
          <table className="w-full min-w-[620px] text-left">
            <thead>
              <tr className="border-b border-line">
                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-body">Invoice</th>
                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-body">Customer</th>
                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-body">Payment</th>
                <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-[0.08em] text-body">Total</th>
                <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-[0.08em] text-body">Time</th>
                <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-[0.08em] text-body">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {recentBills.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-[13px] text-body/70">
                    No bills yet
                  </td>
                </tr>
              )}
              {recentBills.map((b) => (
                <tr key={b._id || b.invoiceNumber} className="transition-colors hover:bg-bgprimary/60">
                  <td className="px-4 py-3.5 text-[13.5px] font-semibold text-accent">{b.invoiceNumber}</td>
                  <td className="px-4 py-3.5 text-[13.5px] font-medium text-heading">{b.customerName || 'Walk-in Customer'}</td>
                  <td className="px-4 py-3.5 text-[13px] capitalize text-body">{b.paymentMethod}</td>
                  <td className="px-4 py-3.5 text-right text-[14px] font-semibold text-heading">₹{fmt(b.grandTotal)}</td>
                  <td className="px-4 py-3.5 text-right text-[13px] text-body">{fmtTime(b.billDate || b.createdAt)}</td>
                  <td className="px-4 py-3.5 text-right">
                    <span className="inline-flex items-center gap-1.5 rounded-md bg-olive-soft px-2.5 py-1 text-[11px] font-semibold text-olive-deep">
                      <span className="h-1.5 w-1.5 rounded-full bg-current" />
                      Paid
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardPanel>
    </div>
  );
}