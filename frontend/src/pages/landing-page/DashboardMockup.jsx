import {
  LayoutDashboard,
  Package,
  Receipt,
  Truck,
  Users,
  BarChart3,
  Bell,
  Settings,
  IndianRupee,
  ShoppingCart,
  TrendingUp,
  AlertTriangle,
} from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  PieChart,
  Pie,
} from 'recharts';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', active: true },
  { icon: Package, label: 'Inventory' },
  { icon: Receipt, label: 'Billing' },
  { icon: Truck, label: 'Suppliers' },
  { icon: Users, label: 'Customers' },
  { icon: BarChart3, label: 'Reports' },
  { icon: Bell, label: 'Expiry Alerts' },
  { icon: Settings, label: 'Settings' },
];

const stats = [
  { icon: IndianRupee, label: 'Total Sales', value: '₹2.45L', delta: '+12.4%', tone: 'green' },
  { icon: ShoppingCart, label: 'Orders', value: '842', delta: '+8.1%', tone: 'green' },
  { icon: TrendingUp, label: 'Profit', value: '₹68K', delta: '+9.7%', tone: 'green' },
  { icon: AlertTriangle, label: 'Low Stock', value: '23', delta: '3.2%', tone: 'red' },
];

const salesData = [
  { m: 'Jan', sales: 32 },
  { m: 'Feb', sales: 28 },
  { m: 'Mar', sales: 45 },
  { m: 'Apr', sales: 38 },
  { m: 'May', sales: 52 },
  { m: 'Jun', sales: 61 },
];

const topMeds = [
  { name: 'Paracetamol', value: 42, color: '#C1592E' },
  { name: 'Amoxicillin', value: 27, color: '#2B211B' },
  { name: 'Cetirizine', value: 18, color: '#6FCF97' },
  { name: 'Vitamin D3', value: 13, color: '#E7D8C4' },
];

const expiryRows = [
  { med: 'Paracetamol 500mg', batch: 'AC-2201', expiry: '12 Sep', alert: true },
  { med: 'Cetirizine 10mg', batch: 'CT-0877', expiry: '09 Oct', alert: false },
  { med: 'Azithromycin 500', batch: 'AZ-3345', expiry: '21 Oct', alert: true },
];

const inventoryRows = [
  { med: 'Paracetamol 500mg', stock: 'In Stock', qty: '2,450', low: false },
  { med: 'Amoxicillin 250mg', stock: 'In Stock', qty: '1,180', low: false },
  { med: 'Cetirizine 10mg', stock: 'Low Stock', qty: '8', low: true },
];

export default function DashboardMockup() {
  return (
    <div className="w-full max-w-[600px]">
      <div className="rounded-t-2xl rounded-b-md bg-[#262422] p-2 shadow-float">
        <div className="overflow-hidden rounded-lg bg-bgprimary">
          <div className="flex">
            <aside className="w-[132px] shrink-0 bg-darkpanel p-2 text-darktext">
              <div className="mb-2 flex items-center gap-1.5">
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-accent text-[7px] text-white">
                  MH
                </span>
                <span className="text-[9px] font-bold">MedHeritage</span>
              </div>

              <nav className="flex flex-col gap-[2px]">
                {navItems.map((item) => (
                  <div
                    key={item.label}
                    className={`flex items-center gap-1 rounded px-1.5 py-[2px] text-[7.5px] ${
                      item.active
                        ? 'bg-accent font-semibold text-white'
                        : 'font-medium text-darktext/55'
                    }`}
                  >
                    <item.icon size={8} strokeWidth={2.2} />
                    {item.label}
                  </div>
                ))}
              </nav>

              <div className="mt-2 flex items-center gap-1.5 rounded-md bg-white/5 px-1.5 py-1">
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-accent-soft text-[6px] font-bold text-accent">
                  AV
                </span>
                <div className="leading-tight">
                  <div className="text-[7px] font-semibold text-darktext">Arjun Varma</div>
                  <div className="text-[6px] text-darktext/45">Admin</div>
                </div>
              </div>
            </aside>

            <main className="min-w-0 flex-1 p-2">
              <div className="mb-1.5 flex items-center justify-between">
                <h3 className="text-[10px] font-bold text-accent">Dashboard Overview</h3>
                <div className="flex items-center gap-1">
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-accent-soft text-accent">
                    <Bell size={7.5} />
                  </span>
                  <span className="rounded bg-accent px-1.5 py-[2px] text-[7px] font-semibold text-white">
                    + New Bill
                  </span>
                </div>
              </div>

              <div className="mb-1.5 grid grid-cols-4 gap-1.5">
                {stats.map((s) => (
                  <div key={s.label} className="rounded-md border border-line bg-surface p-1.5 shadow-card">
                    <div className="mb-0.5 flex items-center justify-between">
                      <span className="flex h-4 w-4 items-center justify-center rounded-full bg-accent-soft text-accent">
                        <s.icon size={8} />
                      </span>
                      <span
                        className={`rounded px-[3px] text-[6px] font-semibold ${
                          s.tone === 'red' ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'
                        }`}
                      >
                        {s.delta}
                      </span>
                    </div>
                    <div className="text-[11px] font-bold tracking-tight text-heading">{s.value}</div>
                    <div className="text-[6px] font-medium uppercase tracking-wide text-body">{s.label}</div>
                  </div>
                ))}
              </div>

              <div className="mb-1.5 grid grid-cols-2 gap-1.5">
                <div className="rounded-md border border-line bg-surface p-1.5 shadow-card">
                  <div className="mb-0.5 flex items-center justify-between">
                    <span className="text-[8px] font-semibold text-heading">Sales Overview</span>
                    <span className="rounded bg-bgsecondary px-1 text-[6px] font-medium text-body">Year</span>
                  </div>
                  <div className="h-[58px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={salesData} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
                        <defs>
                          <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#C1592E" />
                            <stop offset="100%" stopColor="#A84A24" />
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="m" tick={{ fontSize: 6.5, fill: '#5C5049' }} tickLine={false} axisLine={false} interval={0} />
                        <YAxis hide domain={[0, 70]} />
                        <Bar dataKey="sales" fill="url(#barGrad)" barSize={6} radius={[2, 2, 0, 0]} />
                        <Line type="monotone" dataKey="sales" stroke="#C1592E" strokeWidth={1} dot={false} />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="rounded-md border border-line bg-surface p-1.5 shadow-card">
                  <div className="mb-0.5 text-[8px] font-semibold text-heading">Top Selling</div>
                  <div className="flex items-center gap-1.5">
                    <div className="relative h-[58px] w-[58px] shrink-0">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={topMeds} dataKey="value" innerRadius={19} outerRadius={27} paddingAngle={2} stroke="none" />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-[10px] font-bold text-heading">842</span>
                        <span className="text-[5.5px] font-medium uppercase tracking-wide text-body">Sold</span>
                      </div>
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col gap-[2px]">
                      {topMeds.map((m) => (
                        <div key={m.name} className="flex items-center justify-between gap-1">
                          <span className="flex min-w-0 items-center gap-1">
                            <span className="h-[4px] w-[4px] shrink-0 rounded-full" style={{ background: m.color }} />
                            <span className="truncate text-[6.5px] font-medium text-heading">{m.name}</span>
                          </span>
                          <span className="shrink-0 text-[6.5px] text-body">{m.value}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-1.5">
                <div className="rounded-md border border-line bg-surface p-1.5 shadow-card">
                  <div className="mb-0.5 flex items-center justify-between">
                    <span className="text-[8px] font-semibold text-heading">Expiry Alerts</span>
                    <span className="rounded bg-red-50 px-1 text-[6px] font-semibold text-red-600">5</span>
                  </div>
                  <table className="w-full text-left">
                    <thead>
                      <tr className="text-[6px] font-semibold uppercase tracking-wide text-body">
                        <th className="pb-0.5">Medicine</th>
                        <th className="pb-0.5">Batch</th>
                        <th className="pb-0.5 text-right">Expiry</th>
                      </tr>
                    </thead>
                    <tbody>
                      {expiryRows.map((r) => (
                        <tr key={r.batch} className="border-t border-line">
                          <td className="truncate py-[2px] pr-1 text-[6.5px] font-medium text-heading">{r.med}</td>
                          <td className="py-[2px] pr-1 text-[6px] text-body">{r.batch}</td>
                          <td
                            className={`py-[2px] text-right text-[6px] font-semibold ${
                              r.alert ? 'text-red-600' : 'text-accent'
                            }`}
                          >
                            {r.expiry}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="rounded-md border border-line bg-surface p-1.5 shadow-card">
                  <div className="mb-0.5 text-[8px] font-semibold text-heading">Inventory</div>
                  <table className="w-full text-left">
                    <thead>
                      <tr className="text-[6px] font-semibold uppercase tracking-wide text-body">
                        <th className="pb-0.5">Medicine</th>
                        <th className="pb-0.5">Status</th>
                        <th className="pb-0.5 text-right">Qty</th>
                      </tr>
                    </thead>
                    <tbody>
                      {inventoryRows.map((r) => (
                        <tr key={r.med} className="border-t border-line">
                          <td className="truncate py-[2px] pr-1 text-[6.5px] font-medium text-heading">{r.med}</td>
                          <td className="py-[2px] pr-1">
                            <span
                              className={`rounded px-1 py-[1px] text-[5.5px] font-semibold ${
                                r.low ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'
                              }`}
                            >
                              {r.stock}
                            </span>
                          </td>
                          <td className={`py-[2px] text-right text-[6.5px] font-semibold ${r.low ? 'text-red-600' : 'text-heading'}`}>
                            {r.qty}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </main>
          </div>
        </div>

        <div className="mx-5 h-2 rounded-b-md bg-[#3b3937]" />
      </div>
    </div>
  );
}