import { Receipt, ShoppingCart, Package, AlertTriangle, Plus, ScanBarcode } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

const stats = [
  { icon: Receipt, label: "Today's Sales", value: '₹18,450', delta: '+6.2%', up: true },
  { icon: ShoppingCart, label: 'Bills Today', value: '48', delta: '+3.1%', up: true },
  { icon: Package, label: 'Medicines Dispensed', value: '132', delta: '+5.4%', up: true },
  { icon: AlertTriangle, label: 'Low Stock', value: '8', delta: '2 items critical', up: false },
];

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

const cardBase = 'rounded-lgx border border-line bg-surface p-5 shadow-card';
const thClass = 'px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-body';

export default function PharmacistDashboard() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-heading md:text-3xl">Welcome back</h2>
          <p className="mt-1 text-[14px] text-body">Here&apos;s what&apos;s happening at your counter today.</p>
        </div>
        <div className="flex gap-3">
          <button className="inline-flex items-center gap-2 rounded-lgx border border-line bg-surface px-5 py-2.5 text-[14px] font-semibold text-heading transition-colors hover:bg-bgsecondary">
            <ScanBarcode size={16} />
            New Sale
          </button>
          <button className="inline-flex items-center gap-2 rounded-lgx bg-accent px-5 py-2.5 text-[14px] font-semibold text-white transition-all hover:-translate-y-px hover:bg-accent-hover">
            <Plus size={16} />
            New Bill
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className={cardBase}>
            <div className="flex items-center justify-between">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent-soft text-accent">
                <s.icon size={20} />
              </span>
              <span
                className={`rounded-lg px-2 py-1 text-[12px] font-semibold ${
                  s.up ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
                }`}
              >
                {s.delta}
              </span>
            </div>
            <div className="mt-4 text-[28px] font-bold leading-none tracking-tight text-heading">{s.value}</div>
            <div className="mt-1.5 text-[13px] font-medium text-body">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className={`${cardBase} xl:col-span-2`}>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-[16px] font-semibold text-heading">Today&apos;s Sales</h3>
              <p className="text-[12px] text-body">Hourly billing trend</p>
            </div>
            <span className="rounded-lg bg-bgsecondary px-3 py-1 text-[12px] font-medium text-body">Today</span>
          </div>
          <div className="h-[240px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={hourData} margin={{ top: 10, right: 10, bottom: 0, left: -20 }}>
                <defs>
                  <linearGradient id="saleGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#C1592E" stopOpacity={0.32} />
                    <stop offset="100%" stopColor="#C1592E" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E7D8C4" vertical={false} />
                <XAxis dataKey="h" tick={{ fontSize: 12, fill: '#5C5049' }} tickLine={false} axisLine={false} interval={1} />
                <YAxis tick={{ fontSize: 12, fill: '#5C5049' }} tickLine={false} axisLine={false} />
                <Tooltip />
                <Area type="monotone" dataKey="sales" stroke="#C1592E" strokeWidth={2.5} fill="url(#saleGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className={`${cardBase}`}>
          <div className="mb-4">
            <h3 className="text-[16px] font-semibold text-heading">Expiring Soon</h3>
            <p className="text-[12px] text-body">Stock to check</p>
          </div>
          <div className="flex flex-col gap-3">
            {expiring.map((e) => (
              <div key={e.batch} className="flex items-center justify-between rounded-lg border border-line bg-surface px-3 py-2.5">
                <div className="min-w-0">
                  <div className="truncate text-[14px] font-medium text-heading">{e.med}</div>
                  <div className="text-[12px] text-body">{e.batch}</div>
                </div>
                <span
                  className={`shrink-0 rounded-lg px-2 py-1 text-[12px] font-semibold ${
                    e.critical ? 'bg-red-50 text-red-600' : 'bg-accent-soft text-accent'
                  }`}
                >
                  {e.expiry}
                </span>
              </div>
            ))}
            <button className="mt-1 text-[13px] font-semibold text-accent transition-opacity hover:opacity-80">
              View all alerts
            </button>
          </div>
        </div>
      </div>

      <div className={`${cardBase} overflow-hidden`}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-[16px] font-semibold text-heading">Recent Bills</h3>
            <p className="text-[12px] text-body">Latest transactions at the counter</p>
          </div>
          <button className="text-[13px] font-semibold text-accent transition-opacity hover:opacity-80">View all</button>
        </div>
        <table className="mt-4 w-full text-left">
          <thead className="border-b border-line">
            <tr>
              <th className={thClass}>Invoice</th>
              <th className={thClass}>Customer</th>
              <th className={thClass}>Items</th>
              <th className={`${thClass} text-right`}>Total</th>
              <th className={`${thClass} text-right`}>Time</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {recentBills.map((b) => (
              <tr key={b.id}>
                <td className="px-4 py-3 text-[14px] font-semibold text-accent">{b.id}</td>
                <td className="px-4 py-3 text-[14px] text-heading">{b.customer}</td>
                <td className="px-4 py-3 text-[13px] text-body">{b.items} items</td>
                <td className="px-4 py-3 text-right text-[14px] font-semibold text-heading">{b.total}</td>
                <td className="px-4 py-3 text-right text-[13px] text-body">{b.time}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}