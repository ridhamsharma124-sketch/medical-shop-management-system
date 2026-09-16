import { useSelector } from 'react-redux';
import { Receipt, ShoppingCart, Package, AlertTriangle, ArrowUpRight, LineChart, CalendarClock, PackageX, Clock } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

import KpiStrip from '../../components/dashboard/KpiStrip';
import CardPanel from '../../components/dashboard/CardPanel';

const hourData = [
  { h: '9A', sales: 12 },
  { h: '10A', sales: 18 },
  { h: '11A', sales: 22 },
  { h: '12P', sales: 30 },
  { h: '1P', sales: 24 },
  { h: '2P', sales: 28 },
  { h: '3P', sales: 26 },
  { h: '4P', sales: 31 },
  { h: '5P', sales: 35 },
  { h: '6P', sales: 40 },
  { h: '7P', sales: 33 },
  { h: '8P', sales: 22 },
];

const recentBills = [
  { id: 'INV-2026-048', customer: 'Walk-in Customer', items: 4, total: '₹362', status: 'Paid', time: '2:35 PM' },
  { id: 'INV-2026-047', customer: 'Sunita Sharma', items: 2, total: '₹128', status: 'Paid', time: '2:12 PM' },
  { id: 'INV-2026-046', customer: 'Rajesh Kumar', items: 6, total: '₹845', status: 'Paid', time: '1:48 PM' },
  { id: 'INV-2026-045', customer: 'Walk-in Customer', items: 1, total: '₹45', status: 'Paid', time: '1:20 PM' },
  { id: 'INV-2026-044', customer: 'Meena Iyer', items: 3, total: '₹276', status: 'Paid', time: '12:58 PM' },
];

const expiring = [
  { med: 'Paracetamol 500mg', batch: 'AC-2201', expiry: '12 Sep', critical: true },
  { med: 'Cetirizine 10mg', batch: 'CT-0877', expiry: '09 Oct', critical: false },
  { med: 'Azithromycin 500', batch: 'AZ-3345', expiry: '21 Oct', critical: true },
];

const customTooltip = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="rounded-lgx border border-line bg-surface px-3.5 py-2.5 shadow-float">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-body">{label}</p>
      <p className="mt-0.5 text-[13px] font-bold text-heading">
        <span className="text-accent">₹{payload[0].value}</span> sales
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

function ViewAll() {
  return (
    <button className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[12.5px] font-semibold text-accent transition-colors hover:bg-accent-soft">
      View all <ArrowUpRight size={14} />
    </button>
  );
}

export default function PharmacistDashboard() {
  const user = useSelector((state) => state.auth.user);
  const firstName = user?.name?.split(' ')[0] || 'there';

  const dateLine = new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

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
            <h1 className="font-display text-[32px] font-bold leading-none tracking-tight text-heading sm:text-[40px]">
              {getGreeting()}, {firstName}
            </h1>
            <p className="mt-2.5 text-[14px] text-body">Here&apos;s what&apos;s happening at your counter today.</p>
          </div>
          <div className="hidden items-center gap-8 pb-1 sm:flex">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-body/70">Today&apos;s sales</p>
              <p className="font-display text-[22px] font-bold text-heading">₹18,450</p>
            </div>
            <div className="h-8 w-px bg-line" />
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-body/70">vs yesterday</p>
              <p className="font-display text-[22px] font-bold text-olive-deep">+6.2%</p>
            </div>
          </div>
        </div>
      </header>

      {/* ─────────── KPI PANEL ─────────── */}
      <section className="animate-fade-up stagger-1">
        <KpiStrip
          items={[
            { icon: Receipt, label: "Today's Sales", value: '₹18,450', trend: { label: '+6.2%', up: true }, to: '/pharmacist/billing' },
            { icon: ShoppingCart, label: 'Bills Today', value: '48', trend: { label: '+3.1%', up: true }, to: '/pharmacist/billing' },
            { icon: Package, label: 'Medicines Dispensed', value: '132', trend: { label: '+5.4%', up: true }, to: '/pharmacist/medicines' },
            { icon: AlertTriangle, label: 'Low Stock', value: '8', trend: { label: '2 critical', up: false }, to: '/pharmacist/inventory' },
          ]}
        />
      </section>

      {/* ─────────── SALES + EXPIRING ─────────── */}
      <section className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <CardPanel
          className="animate-fade-up stagger-2 xl:col-span-2"
          title="Today's Sales"
          subtitle="Hourly billing trend"
          icon={LineChart}
          tone="accent"
          right={
            <span className="flex items-center gap-1.5 rounded-full bg-olive-soft px-3 py-1 text-[11.5px] font-semibold text-olive-deep">
              <ArrowUpRight size={12} />
              12.7% vs yesterday
            </span>
          }
        >
          {/* mini summary row */}
          <div className="mb-5 flex flex-wrap items-center justify-between gap-4 rounded-lgx border border-line bg-bgprimary/60 px-5 py-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-body/70">Total today</p>
              <p className="mt-1 font-display text-[28px] font-bold leading-none text-heading">₹18,450</p>
            </div>
            <div className="h-9 w-px bg-line" />
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-body/70">Bills</p>
              <p className="mt-1 font-display text-[28px] font-bold leading-none text-heading">48</p>
            </div>
            <div className="h-9 w-px bg-line" />
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-body/70">Avg. bill</p>
              <p className="mt-1 font-display text-[28px] font-bold leading-none text-heading">₹385</p>
            </div>
            <span className="rounded-full bg-accent-soft px-3 py-1.5 text-[11.5px] font-bold text-accent">
              Peak · 6 PM
            </span>
          </div>
          <div className="h-[230px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={hourData} margin={{ top: 10, right: 10, bottom: 0, left: -20 }}>
                <defs>
                  <linearGradient id="saleGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-accent)" stopOpacity={0.18} />
                    <stop offset="100%" stopColor="var(--color-accent)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="4 4" stroke="var(--color-line)" vertical={false} />
                <XAxis dataKey="h" tick={{ fontSize: 12, fill: 'var(--color-body)' }} tickLine={false} axisLine={false} interval={1} dy={6} />
                <YAxis tick={{ fontSize: 12, fill: 'var(--color-body)' }} tickLine={false} axisLine={false} />
                <Tooltip content={customTooltip} cursor={{ stroke: 'var(--color-accent)', strokeDasharray: '4 4', strokeOpacity: 0.4 }} />
                <Area type="monotone" dataKey="sales" stroke="var(--color-accent)" strokeWidth={2.2} fill="url(#saleGrad)" activeDot={{ r: 5, fill: 'var(--color-accent)', stroke: 'var(--color-surface)', strokeWidth: 2 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardPanel>

        <CardPanel
          className="animate-fade-up stagger-3"
          title="Expiring Soon"
          subtitle="Stock that needs attention"
          icon={CalendarClock}
          tone="berry"
          right={<ViewAll />}
        >
          {/* status tiles */}
          <div className="mb-4 grid grid-cols-3 gap-2.5">
            <div className="rounded-lgx bg-berry-soft p-3 text-berry-deep">
              <span className="flex h-6 w-6 items-center justify-center rounded-md bg-berry/12">
                <PackageX size={13} strokeWidth={2.1} />
              </span>
              <p className="mt-1.5 font-display text-[18px] font-bold leading-none">2</p>
              <p className="mt-0.5 text-[10px] font-semibold">Critical</p>
            </div>
            <div className="rounded-lgx bg-olive-soft p-3 text-olive-deep">
              <span className="flex h-6 w-6 items-center justify-center rounded-md bg-olive/12">
                <Clock size={13} strokeWidth={2.1} />
              </span>
              <p className="mt-1.5 font-display text-[18px] font-bold leading-none">1</p>
              <p className="mt-0.5 text-[10px] font-semibold">Near</p>
            </div>
            <div className="rounded-lgx bg-mustard-soft p-3 text-mustard-deep">
              <span className="flex h-6 w-6 items-center justify-center rounded-md bg-mustard/12">
                <AlertTriangle size={13} strokeWidth={2.1} />
              </span>
              <p className="mt-1.5 font-display text-[18px] font-bold leading-none">8</p>
              <p className="mt-0.5 text-[10px] font-semibold">Low stock</p>
            </div>
          </div>

          <div className="flex flex-col gap-2.5">
            {expiring.map((e) => (
              <div
                key={e.batch}
                className="flex items-center justify-between rounded-lgx border border-line bg-bgprimary/50 px-4 py-3"
              >
                <div className="min-w-0">
                  <div className="truncate text-[13.5px] font-semibold text-heading">{e.med}</div>
                  <div className="font-mono text-[11px] text-body">Batch {e.batch}</div>
                </div>
                <span
                  className={`shrink-0 rounded-md px-2.5 py-1 text-[11px] font-semibold ${
                    e.critical ? 'bg-berry-soft text-berry-deep' : 'bg-accent-soft text-accent'
                  }`}
                >
                  {e.expiry}
                </span>
              </div>
            ))}
          </div>
        </CardPanel>
      </section>

      {/* ─────────── RECENT BILLS ─────────── */}
      <CardPanel
        className="animate-fade-up stagger-4 overflow-hidden"
        title="Recent Bills"
        subtitle="Latest transactions at the counter"
        icon={Receipt}
        tone="mustard"
        right={<ViewAll />}
      >
        <div className="-mx-5 overflow-x-auto px-5">
          <table className="w-full min-w-[620px] text-left">
            <thead>
              <tr className="border-b border-line">
                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-body">Invoice</th>
                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-body">Customer</th>
                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-body">Items</th>
                <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-[0.08em] text-body">Total</th>
                <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-[0.08em] text-body">Time</th>
                <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-[0.08em] text-body">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {recentBills.map((b) => (
                <tr key={b.id} className="transition-colors hover:bg-bgprimary/60">
                  <td className="px-4 py-3.5 text-[13.5px] font-semibold text-accent">{b.id}</td>
                  <td className="px-4 py-3.5 text-[13.5px] font-medium text-heading">{b.customer}</td>
                  <td className="px-4 py-3.5 text-[13px] text-body">{b.items} items</td>
                  <td className="px-4 py-3.5 text-right text-[14px] font-semibold text-heading">{b.total}</td>
                  <td className="px-4 py-3.5 text-right text-[13px] text-body">{b.time}</td>
                  <td className="px-4 py-3.5 text-right">
                    <span className="inline-flex items-center gap-1.5 rounded-md bg-olive-soft px-2.5 py-1 text-[11px] font-semibold text-olive-deep">
                      <span className="h-1.5 w-1.5 rounded-full bg-current" />
                      {b.status}
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