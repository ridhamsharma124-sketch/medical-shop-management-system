import { useSelector } from 'react-redux';
import {
  Pill,
  Truck,
  Users,
  Receipt,
  FileText,
  ArrowUpRight,
  IndianRupee,
  PieChart,
  BarChart3,
  Boxes,
} from 'lucide-react';
import KpiStrip from '../../components/dashboard/KpiStrip';
import CardPanel from '../../components/dashboard/CardPanel';
import RevenueInvoiceChart from '../../components/dashboard/RevenueInvoiceChart';
import CategoryChart from '../../components/dashboard/CategoryChart';
import TopSellingChart from '../../components/dashboard/TopSellingChart';
import StockOverview from '../../components/dashboard/StockOverview';

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

export default function AdminDashboard() {
  const user = useSelector((state) => state.auth.user);
  const firstName = user?.name?.split(' ')[0] || 'there';

  const dateLine = new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="flex flex-col gap-6">
      {/* ─────────── EDITORIAL HEADER ─────────── */}
      <header className="animate-fade-up">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-accent">
          Admin Console
          <span className="mx-2 text-line">·</span>
          <span className="text-body/70 normal-case tracking-normal">{dateLine}</span>
        </p>
        <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-[32px] font-bold leading-none tracking-tight text-heading sm:text-[40px]">
              {getGreeting()}, {firstName}
            </h1>
            <p className="mt-2.5 text-[14px] text-body">Here&apos;s your pharmacy at a glance today.</p>
          </div>
          <div className="hidden items-center gap-8 pb-1 sm:flex">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-body/70">Monthly revenue</p>
              <p className="font-display text-[22px] font-bold text-heading">₹4.2L</p>
            </div>
            <div className="h-8 w-px bg-line" />
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-body/70">Growth</p>
              <p className="font-display text-[22px] font-bold text-olive-deep">+12.4%</p>
            </div>
          </div>
        </div>
      </header>

      {/* ─────────── KPI PANEL ─────────── */}
      <section className="animate-fade-up stagger-1">
        <KpiStrip
          items={[
            { icon: Pill, label: 'Total Medicines', value: '1,284', trend: { label: '+4.2%', up: true }, to: '/admin/medicines' },
            { icon: Truck, label: 'Total Suppliers', value: '36', trend: { label: '+2', up: true }, to: '/admin/suppliers' },
            { icon: Users, label: 'Total Customers', value: '5,812', trend: { label: '+8.7%', up: true }, to: '/admin/customers' },
            { icon: Receipt, label: "Today's Sales", value: '₹18,450', trend: { label: '+12.4%', up: true }, to: '/admin/billing' },
            { icon: FileText, label: 'Total Invoices', value: '312', trend: { label: '+9.1%', up: true }, to: '/admin/billing' },
          ]}
        />
      </section>

      {/* ─────────── PERFORMANCE ─────────── */}
      <section className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <CardPanel
          className="animate-fade-up stagger-2 xl:col-span-2"
          title="Revenue & Invoices"
          subtitle="Invoices issued against revenue earned"
          icon={IndianRupee}
          tone="accent"
          right={
            <span className="flex items-center gap-1.5 rounded-full bg-olive-soft px-3 py-1 text-[11.5px] font-semibold text-olive-deep">
              <ArrowUpRight size={12} />
              24.5% growth
            </span>
          }
        >
          {/* mini summary row */}
          <div className="mb-5 flex flex-wrap items-center justify-between gap-4 rounded-lgx border border-line bg-bgprimary/60 px-5 py-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-body/70">Total revenue</p>
              <p className="mt-1 font-display text-[28px] font-bold leading-none text-heading">₹26.1L</p>
            </div>
            <div className="h-9 w-px bg-line" />
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-body/70">Invoices (FY)</p>
              <p className="mt-1 font-display text-[28px] font-bold leading-none text-heading">2,731</p>
            </div>
            <div className="h-9 w-px bg-line" />
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-body/70">Avg. invoice</p>
              <p className="mt-1 font-display text-[28px] font-bold leading-none text-heading">₹955</p>
            </div>
            <span className="rounded-full bg-accent-soft px-3 py-1.5 text-[11.5px] font-bold text-accent">
              Best month · Dec
            </span>
          </div>
          <RevenueInvoiceChart />
        </CardPanel>

        <CardPanel
          className="animate-fade-up stagger-3"
          title="Category Sales"
          subtitle="Share of units sold by category"
          icon={PieChart}
          tone="mustard"
        >
          <CategoryChart />
        </CardPanel>
      </section>

      {/* ─────────── INVENTORY ─────────── */}
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <CardPanel
          className="animate-fade-up stagger-3 lg:col-span-2"
          title="Top Selling"
          subtitle="Most units sold this month"
          icon={BarChart3}
          tone="teal"
          right={<ViewAll />}
        >
          <TopSellingChart />
        </CardPanel>

        <CardPanel
          className="animate-fade-up stagger-4"
          title="Stock & Expiry"
          subtitle="Low stock, near expiry & expired medicines"
          icon={Boxes}
          tone="olive"
        >
          <StockOverview />
        </CardPanel>
      </section>
    </div>
  );
}