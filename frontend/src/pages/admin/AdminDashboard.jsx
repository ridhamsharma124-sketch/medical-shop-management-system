import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
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
  AlertTriangle,
  Clock,
} from 'lucide-react';
import KpiStrip from '../../components/dashboard/KpiStrip';
import CardPanel from '../../components/dashboard/CardPanel';
import MonthlySalesChart from '../../components/dashboard/MonthlySalesChart';
import CategoryChart from '../../components/dashboard/CategoryChart';
import TopSellingChart from '../../components/dashboard/TopSellingChart';
import StockOverview from '../../components/dashboard/StockOverview';
import { fetchDashboardSummaryData, fetchDashboardChartsData } from '../../features/dashboardSlice';
import { fetchMedicinesList } from '../../features/medicineSlice';
import { fetchSalesBillsList } from '../../features/salesSlice';

const fmt = (n) => (n === undefined || n === null ? '…' : Number(n).toLocaleString('en-IN'));
const inr = (n) => (n === undefined || n === null ? '…' : `₹${fmt(n)}`);
const inrL = (n) => {
  if (n === undefined || n === null) return '…';
  const lakh = Number(n) / 100000;
  return lakh >= 1 ? `₹${(Math.round(lakh * 10) / 10).toFixed(1)}L` : `₹${Number(n).toLocaleString('en-IN')}`;
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

export default function AdminDashboard() {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);
  const { summary, charts } = useSelector((state) => state.dashboard);
  const dashboardMedicines = useSelector((state) => state.medicines.items);
  const fetchedBills = useSelector((state) => state.sales.items);

  useEffect(() => {
    if (user?.role) {
      dispatch(fetchDashboardSummaryData({ role: user.role }));
      dispatch(fetchDashboardChartsData({ role: user.role }));
      dispatch(fetchMedicinesList({ role: user.role, params: { limit: 200 } }));
      dispatch(fetchSalesBillsList({ role: user.role, params: { limit: 1000 } }));
    }
  }, [dispatch, user?.role]);

  const firstName = user?.name?.split(' ')[0] || 'there';

  const dateLine = new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const s = summary || {};
  const sales = s.sales || {};
  const bills = s.bills || {};
  const medicines = s.medicines || {};
  const suppliers = s.suppliers || {};
  const customers = s.customers || {};
  const stockAlerts = (() => {
    const meds = Array.isArray(dashboardMedicines) ? dashboardMedicines : [];
    return {
      totalStock: meds.reduce((acc, m) => acc + (Number(m.stock) || 0), 0),
      lowStock: meds.filter((m) => Number(m.stock) > 0 && Number(m.stock) <= (Number(m.lowStockThreshold) || 10)).length,
      outOfStock: meds.filter((m) => Number(m.stock) === 0).length,
    };
  })();
  const expiry = s.medicineExpiry || {};

  const MONTH_NAMES = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ];
  const invoiceMap = {};
  (Array.isArray(fetchedBills) ? fetchedBills : []).forEach((b) => {
    const dt = b.billDate ? new Date(b.billDate) : null;
    if (!dt || Number.isNaN(dt.getTime())) return;
    const key = `${dt.getFullYear()}-${MONTH_NAMES[dt.getMonth()]}`;
    invoiceMap[key] = (invoiceMap[key] || 0) + 1;
  });

  const salesOverTime = (charts?.salesOverTime || []).map((d) => ({
    ...d,
    saleAmount: Number(d.saleAmount) || 0,
    invoiceCount: invoiceMap[`${d.year}-${d.month}`] || 0,
  }));
  const best = charts?.salesOverTime
    ? charts.salesOverTime.reduce((p, c) => (Number(c.saleAmount) > Number(p.saleAmount) ? c : p), {
        saleAmount: 0,
      })
    : { month: '—' };
  const avgInvoice = bills.total ? Math.round(sales.total / bills.total) : null;

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
            <h1 className="font-display text-[26px] font-bold leading-none tracking-tight text-heading sm:text-[32px]">
              {getGreeting()}, {firstName}
            </h1>
            <p className="mt-2 text-[13.5px] text-body">Here&apos;s your pharmacy at a glance today.</p>
          </div>
          <div className="hidden items-center gap-6 pb-1 sm:flex">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-body/70">Monthly revenue</p>
                <p className="font-display text-[18px] font-bold text-heading">{inrL(sales.thisMonth)}</p>
              </div>
              <div className="h-8 w-px bg-line" />
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-body/70">Bills this month</p>
                <p className="font-display text-[18px] font-bold text-olive-deep">{fmt(bills.thisMonth)}</p>
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
              icon: Pill,
              label: 'Total Medicines',
              value: fmt(medicines.total),
              trend: { label: `+${fmt(medicines.addedThisMonth)}`, up: true },
              to: '/admin/medicines',
            },
            {
              icon: Truck,
              label: 'Total Suppliers',
              value: fmt(suppliers.total),
              trend: { label: `+${fmt(suppliers.newThisMonth)}`, up: true },
              to: '/admin/suppliers',
            },
            {
              icon: Users,
              label: 'Total Customers',
              value: fmt(customers.total),
              trend: { label: `+${fmt(customers.newThisMonth)}`, up: true },
              to: '/admin/customers',
            },
            {
              icon: Receipt,
              label: 'Total Sales',
              value: inrL(sales.total),
              trend: { label: `₹${fmt(sales.thisMonth)}`, up: true },
              to: '/admin/billing',
            },
            {
              icon: FileText,
              label: 'Reports',
              value: fmt(bills.total),
              trend: { label: '+available reports', up: true },
              to: '/admin/reports',
            },
            {
              icon: Boxes,
              label: 'Total Stock',
              value: fmt(stockAlerts.totalStock),
              trend: { label: 'inventory units', up: true },
              to: '/admin/inventory',
            },
            {
              icon: AlertTriangle,
              label: 'Low Stock',
              value: fmt(stockAlerts.lowStock),
              trend: { label: `${fmt(stockAlerts.outOfStock)} out of stock`, up: false },
              to: '/admin/inventory?filter=low',
            },
            {
              icon: Clock,
              label: 'Expiring Soon',
              value: fmt(expiry.nearExpiryWithin30Days),
              trend: { label: `${fmt(expiry.totalExpired)} expired`, up: false },
              to: '/admin/inventory?filter=expiring',
            },
          ]}
        />
      </section>

      {/* ─────────── PERFORMANCE ─────────── */}
      <section className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <CardPanel
          className="animate-fade-up stagger-2 xl:col-span-2"
          title="Revenue & Invoices"
          subtitle="Monthly revenue vs invoices issued"
          icon={IndianRupee}
          tone="accent"
        >
          {/* mini summary row */}
          <div className="mb-5 flex flex-wrap items-center justify-between gap-4 rounded-lgx border border-line bg-bgprimary/60 px-5 py-3.5">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-body/70">Total revenue</p>
              <p className="mt-1 font-display text-[22px] font-bold leading-none text-heading">{inrL(sales.total)}</p>
            </div>
            <div className="h-8 w-px bg-line" />
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-body/70">Total invoices</p>
              <p className="mt-1 font-display text-[22px] font-bold leading-none text-heading">{fmt(bills.total)}</p>
            </div>
            <div className="h-8 w-px bg-line" />
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-body/70">Avg. invoice</p>
              <p className="mt-1 font-display text-[22px] font-bold leading-none text-heading">{avgInvoice ? inr(avgInvoice) : '—'}</p>
            </div>
            <span className="rounded-full bg-accent-soft px-3 py-1.5 text-[11.5px] font-bold text-accent">
              Best month · {best.month}
            </span>
          </div>
          <MonthlySalesChart data={salesOverTime} />
        </CardPanel>

        <CardPanel
          className="animate-fade-up stagger-3"
          title="Category Sales"
          subtitle="Share of sales by category"
          icon={PieChart}
          tone="mustard"
        >
          <CategoryChart data={charts?.categoryWiseSales || []} />
        </CardPanel>
      </section>

      {/* ─────────── INVENTORY ─────────── */}
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <CardPanel
          className="animate-fade-up stagger-3 lg:col-span-2"
          title="Top Selling"
          subtitle="Top medicines by revenue"
          icon={BarChart3}
          tone="teal"
          right={<ViewAll to="/admin/billing" />}
        >
          <TopSellingChart data={charts?.topSellingMedicines || []} />
        </CardPanel>

        <CardPanel
          className="animate-fade-up stagger-4"
          title="Stock & Expiry"
          subtitle="Low stock, near expiry & expired medicines"
          icon={Boxes}
          tone="olive"
        >
          <StockOverview
            inventoryTo="/admin/inventory"
            medicines={dashboardMedicines}
            data={{
              lowStock: stockAlerts.lowStock,
              outOfStock: stockAlerts.outOfStock,
              nearExpiry: expiry.nearExpiryWithin30Days,
              expired: expiry.totalExpired,
            }}
          />
        </CardPanel>
      </section>
    </div>
  );
}