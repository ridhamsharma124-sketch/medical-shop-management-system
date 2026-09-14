import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  Pill,
  Truck,
  Users,
  Receipt,
  Banknote,
  PackageX,
  CalendarClock,
  PackageSearch,
  FileText,
  ChevronDown,
  Plus,
  ScanBarcode,
} from 'lucide-react';
import StatCard from '../../components/dashboard/StatCard';
import HighlightCard from '../../components/dashboard/HighlightCard';
import CategoryChart from '../../components/dashboard/CategoryChart';
import TopSellingChart from '../../components/dashboard/TopSellingChart';
import AlertsList from '../../components/dashboard/AlertsList';
import RevenueInvoiceChart from '../../components/dashboard/RevenueInvoiceChart';
import StockHealthGauge from '../../components/dashboard/StockHealthGauge';

const periods = ['Today', 'This Week', 'This Month'];

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

const sparks = {
  medicines: [820, 905, 990, 1120, 1090, 1215, 1284],
  suppliers: [14, 18, 22, 25, 29, 33, 36],
  customers: [3120, 3880, 4210, 4670, 5050, 5560, 5812],
  sales: [6200, 8940, 7450, 11200, 13800, 16200, 18450],
  invoices: [142, 168, 155, 189, 203, 268, 312],
};

const cardBase = 'rounded-lgx border border-line bg-surface shadow-card';

export default function AdminDashboard() {
  const user = useSelector((state) => state.auth.user);
  const [period, setPeriod] = useState('This Month');

  const firstName = user?.name?.split(' ')[0] || 'there';
  const today = new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="flex flex-col gap-5">
      {/* Hero banner */}
      <div className="relative overflow-hidden rounded-lgx border border-line bg-gradient-to-br from-accent via-[#b24a26] to-[#7d3318] p-5 text-white shadow-float sm:p-6">
        <div className="pointer-events-none absolute -right-12 -top-12 h-44 w-44 rounded-full bg-white/10 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-16 right-24 h-32 w-32 rounded-full bg-black/10 blur-xl" />

        <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-[11.5px] font-semibold uppercase tracking-[0.18em] text-white/70">{today}</p>
            <h2 className="mt-1 font-display text-[24px] font-bold leading-tight md:text-[28px]">
              {getGreeting()}, {firstName}
            </h2>
            <p className="mt-1 text-[13.5px] text-white/85">Here&apos;s how your pharmacy is performing today.</p>
          </div>

          <div className="flex flex-col items-start gap-2.5 sm:items-end">
            <div className="relative">
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className="appearance-none rounded-lgx border border-white/25 bg-white/15 py-2 pl-3 pr-8 text-[12.5px] font-semibold text-white outline-none backdrop-blur-sm transition-colors hover:bg-white/25"
              >
                {periods.map((p) => (
                  <option key={p} value={p} className="text-heading">
                    {p}
                  </option>
                ))}
              </select>
              <ChevronDown size={15} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-white/80" />
            </div>

            <div className="flex flex-wrap gap-2.5">
              <Link
                to="/admin/medicines"
                className="inline-flex items-center gap-2 rounded-lgx border border-white/25 bg-white/15 px-4 py-2.5 text-[13px] font-semibold text-white backdrop-blur-sm transition-all hover:-translate-y-px hover:bg-white/25"
              >
                <Plus size={15} />
                Add Medicine
              </Link>
              <Link
                to="/admin/suppliers"
                className="inline-flex items-center gap-2 rounded-lgx border border-white/25 bg-white/15 px-4 py-2.5 text-[13px] font-semibold text-white backdrop-blur-sm transition-all hover:-translate-y-px hover:bg-white/25"
              >
                <Truck size={15} />
                Add Supplier
              </Link>
              <button className="inline-flex items-center gap-2 rounded-lgx bg-white px-4 py-2.5 text-[13px] font-semibold text-accent shadow-md transition-all hover:-translate-y-px hover:bg-white/90">
                <ScanBarcode size={15} />
                New Sale
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Summary cards — with sparklines */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard icon={Pill} label="Total Medicines" value="1,284" trend={{ label: '+4.2%', up: true }} spark={sparks.medicines} />
        <StatCard icon={Truck} label="Total Suppliers" value="36" trend={{ label: '+2', up: true }} spark={sparks.suppliers} />
        <StatCard icon={Users} label="Total Customers" value="5,812" trend={{ label: '+8.7%', up: true }} spark={sparks.customers} />
        <StatCard icon={Receipt} label="Today's Sales" value="₹18,450" trend={{ label: '+12.4%', up: true }} spark={sparks.sales} />
        <StatCard icon={FileText} label="Total Invoices" value="312" trend={{ label: '+9.1%', up: true }} spark={sparks.invoices} />
      </div>

      {/* Highlight cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <HighlightCard variant="accent" icon={Banknote} value="₹4.2L" label="Monthly Revenue" sub="+12.4%" />
        <HighlightCard variant="mustard" icon={PackageSearch} value="18" label="Low Stock Medicines" sub="Needs restock" />
        <HighlightCard variant="berry" icon={PackageX} value="7" label="Expired Medicines" sub="Discard needed" />
        <HighlightCard variant="olive" icon={CalendarClock} value="23" label="Near Expiry Medicines" sub="In 90 days" />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className={`${cardBase} p-5 sm:p-6 xl:col-span-2`}>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-[16px] font-semibold text-heading">Revenue &amp; Invoices</h3>
              <p className="mt-0.5 text-[12.5px] text-body">Invoices issued vs revenue earned, month by month</p>
            </div>
            <span className="rounded-lg bg-mustard-soft px-2.5 py-1 text-[12px] font-semibold text-mustard-deep">
              {new Date().getFullYear()}
            </span>
          </div>
          <RevenueInvoiceChart />
        </div>

        <div className={`${cardBase} p-5 sm:p-6`}>
          <div className="mb-4">
            <h3 className="text-[16px] font-semibold text-heading">Category-wise Sales</h3>
            <p className="mt-0.5 text-[12.5px] text-body">Share of units sold by category</p>
          </div>
          <CategoryChart />
        </div>
      </div>

      {/* Bottom row — stock health + top selling + alerts */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className={`${cardBase} p-5 sm:p-6`}>
          <div className="mb-3">
            <h3 className="text-[16px] font-semibold text-heading">Stock Health</h3>
            <p className="mt-0.5 text-[12.5px] text-body">Overall inventory level</p>
          </div>
          <StockHealthGauge />
        </div>

        <div className={`${cardBase} p-5 sm:p-6`}>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-[16px] font-semibold text-heading">Top Selling Medicines</h3>
              <p className="mt-0.5 text-[12.5px] text-body">Most units sold this month</p>
            </div>
            <button className="text-[12.5px] font-semibold text-accent transition-opacity hover:opacity-75">
              View all
            </button>
          </div>
          <TopSellingChart />
        </div>

        <div className={`${cardBase} p-5 sm:p-6`}>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-[16px] font-semibold text-heading">Stock &amp; Expiry Alerts</h3>
              <p className="mt-0.5 text-[12.5px] text-body">Medicines that need your attention</p>
            </div>
            <span className="rounded-lg bg-berry-soft px-2.5 py-1 text-[12px] font-semibold text-berry-deep">
              7 alerts
            </span>
          </div>
          <AlertsList />
        </div>
      </div>
    </div>
  );
}