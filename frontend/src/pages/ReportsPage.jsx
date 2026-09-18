import { useState, useMemo, useEffect, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  ArrowLeft,
  BarChart3,
  TrendingUp,
  ShoppingCart,
  Trophy,
  Wallet,
  IndianRupee,
  Percent,
  FileText,
  Loader2,
  UserCheck,
  PackageSearch,
  Boxes,
  FileDown,
  Sheet,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  Legend,
  Cell,
  LabelList,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import {
  fetchSalesReportData,
  fetchProfitReportData,
  fetchProfitReportByPharmacistData,
  fetchPurchaseReportData,
  fetchBestSellingReportData,
} from '../features/reportSlice';
import { fetchAllPharmacists } from '../features/pharmacistSlice';
import { exportTablePdf, exportExcel } from '../utils/exportUtils';
import CustomSelect from '../components/ui/CustomSelect';

const formatDate = (d) => {
  if (!d) return '—';
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return '—';
  return isNaN(dt.getDay()) ? '—' : dt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

const inr = (n) => '₹' + Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const ChartTooltip = ({ active, payload }) => {
  if (!active || !payload || !payload.length) return null;
  const d = payload[0];
  return (
    <div className="rounded-lgx border border-line bg-surface px-3.5 py-2.5 shadow-float">
      <p className="text-[12px] font-semibold text-heading">{d.payload?.name}</p>
      <p className="mt-0.5 text-[12px] text-body">
        <span className="font-display text-[15px] font-bold text-accent">{inr(d.value)}</span>
      </p>
    </div>
  );
};

const TABS = [
  { id: 'sales', label: 'Sales Report', icon: Wallet },
  { id: 'profit', label: 'Profit Report', icon: TrendingUp },
  { id: 'purchase', label: 'Purchase Report', icon: ShoppingCart },
  { id: 'best', label: 'Best Selling', icon: Trophy },
];

const QUICK_RANGES = [
  { label: 'Overall', build: () => ({ startDate: '2020-01-01', endDate: new Date().toISOString().slice(0, 10) }) },
  { label: 'Last 7 Days', build: () => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 6);
    return { startDate: start.toISOString().slice(0, 10), endDate: end.toISOString().slice(0, 10) };
  } },
  { label: 'Last 30 Days', build: () => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 29);
    return { startDate: start.toISOString().slice(0, 10), endDate: end.toISOString().slice(0, 10) };
  } },
  { label: 'This Month', build: () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return { startDate: start.toISOString().slice(0, 10), endDate: end.toISOString().slice(0, 10) };
  } },
];

export default function ReportsPage() {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);
  const role = user?.role || 'admin';
  const location = useLocation();
  const base = location.pathname.startsWith('/pharmacist') ? '/pharmacist' : '/admin';

  const {
    sales, salesLoading, salesError,
    profit, profitLoading, profitError,
    profitByPharmacist, profitByPharmacistLoading, profitByPharmacistError,
    purchase, purchaseLoading, purchaseError,
    bestSelling, bestSellingLoading, bestSellingError,
  } = useSelector((state) => state.reports);
  const { items: pharmacists } = useSelector((state) => state.pharmacists);

  const [activeTab, setActiveTab] = useState('sales');
  const [rangeKey, setRangeKey] = useState('Overall');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [pharmacistFilter, setPharmacistFilter] = useState('');

  useEffect(() => {
    if (role === 'admin') dispatch(fetchAllPharmacists());
  }, [role, dispatch]);

  const effectiveRange = useMemo(() => {
    if (startDate || endDate) {
      return {
        startDate: startDate || endDate,
        endDate: endDate || startDate,
        manual: true,
      };
    }
    const found = QUICK_RANGES.find((r) => r.label === rangeKey);
    return found ? { ...found.build(), manual: false } : {};
  }, [startDate, endDate, rangeKey]);

  const refetch = useCallback(() => {
    const params = { ...effectiveRange, ...(role === 'admin' && pharmacistFilter ? { pharmacist: pharmacistFilter } : {}) };
    if (activeTab === 'sales') {
      dispatch(fetchSalesReportData({ role, params: { ...params, limit: 50 } }));
    } else if (activeTab === 'profit') {
      if (role === 'admin') {
        dispatch(fetchProfitReportByPharmacistData({ role, params }));
      } else {
        dispatch(fetchProfitReportData({ role, params }));
      }
    } else if (activeTab === 'purchase') {
      dispatch(fetchPurchaseReportData({ role, params: { ...params, limit: 50 } }));
    } else if (activeTab === 'best') {
      dispatch(fetchBestSellingReportData({ role, params: { ...params, limit: 20 } }));
    }
  }, [dispatch, role, activeTab, effectiveRange, pharmacistFilter]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const rangeLabel = rangeKey + (startDate || endDate ? ` (${startDate || '…'} → ${endDate || '…'})` : '');

  const exportReport = (format) => {
    const date = new Date().toISOString().slice(0, 10);
    let filename;
    let title;
    let headers;
    let rows;
    let summaryLines = [];
    let alignRight;

    if (activeTab === 'sales') {
      filename = `sales-report-${date}`;
      title = 'Sales Report';
      const bills = sales?.data || [];
      headers = ['Invoice', 'Customer', 'Phone', ...(role === 'admin' ? ['Pharmacist'] : []), 'Date', 'Total'];
      rows = bills.map((b) => [
        b.invoiceNumber,
        b.customerName || b.customer?.name || '—',
        b.customerPhone || b.customer?.phoneNumber || '',
        ...(role === 'admin' ? [(typeof b.pharmacist === 'object' && b.pharmacist ? b.pharmacist.name : '—')] : []),
        formatDate(b.billDate || b.createdAt),
        Number(b.grandTotal || 0),
      ]);
      alignRight = rows.length ? [rows[0].length - 1] : [1];
      if (sales?.summary) {
        summaryLines = [
          `Revenue: ${inr(sales.summary.totalRevenue)}`,
          `GST: ${inr(sales.summary.totalGst)}`,
          `Discount: ${inr(sales.summary.totalDiscount)}`,
          `Bills: ${sales.summary.billCount || 0}`,
        ];
      }
    } else if (activeTab === 'profit') {
      filename = `profit-report-${date}`;
      if (role === 'admin') {
        title = 'Profit by Pharmacist';
        headers = ['Pharmacist', 'Email', 'Revenue', 'Cost', 'Profit', 'Items Sold', 'Bills'];
        rows = (profitByPharmacist?.data || []).map((r) => [
          r.pharmacist?.name || 'Deleted user',
          r.pharmacist?.email || '',
          Number(r.totalRevenue || 0),
          Number(r.totalCost || 0),
          Number(r.totalProfit || 0),
          r.itemsSold || 0,
          r.billCount || 0,
        ]);
        alignRight = [2, 3, 4, 5, 6];
      } else {
        title = 'Profit Report';
        headers = ['Medicine', 'Qty Sold', 'Revenue', 'Cost', 'Profit'];
        rows = (profit?.byMedicine || []).map((m) => [
          m.medicineName || '—',
          m.quantitySold || 0,
          Number(m.revenue || 0),
          Number(m.cost || 0),
          Number(m.profit || 0),
        ]);
        alignRight = [1, 2, 3, 4];
        if (profit?.summary) {
          summaryLines = [
            `Revenue: ${inr(profit.summary.totalRevenue)}`,
            `Cost: ${inr(profit.summary.totalCost)}`,
            `Profit: ${inr(profit.summary.totalProfit)}`,
            `Items: ${profit.summary.itemsSold || 0}`,
          ];
        }
      }
    } else if (activeTab === 'purchase') {
      filename = `purchase-report-${date}`;
      title = 'Purchase Report';
      const orders = purchase?.data || [];
      headers = ['Order No.', 'Supplier', ...(role === 'admin' ? ['Pharmacist'] : []), 'Date', 'Amount'];
      rows = orders.map((o) => [
        o.orderNumber,
        o.supplier?.name || '—',
        ...(role === 'admin' ? [(typeof o.pharmacist === 'object' && o.pharmacist ? o.pharmacist.name : '—')] : []),
        formatDate(o.orderDate || o.createdAt),
        Number(o.totalAmount || 0),
      ]);
      alignRight = rows.length ? [rows[0].length - 1] : [1];
      if (purchase?.summary) {
        summaryLines = [
          `Total: ${inr(purchase.summary.totalPurchaseAmount)}`,
          `Orders: ${purchase.summary.orderCount || 0}`,
        ];
      }
    } else {
      filename = `best-selling-${date}`;
      title = 'Best Selling Medicines';
      headers = ['#', 'Medicine', 'Category', 'Sold', 'Revenue'];
      rows = (bestSelling?.data || []).map((m, i) => [
        i + 1,
        m.medicineName || m.medicineId || 'Unknown',
        m.category || 'Medicine',
        m.totalQuantitySold || 0,
        Number(m.totalRevenue || 0),
      ]);
      alignRight = [3, 4];
      summaryLines = [`Top ${rows.length} medicines by units sold`];
    }

    const subtitle = `Range: ${rangeLabel}${phName !== 'All Pharmacists' ? ` · ${phName}` : ''}`;
    if (format === 'excel') {
      exportExcel(filename, [{ name: title, headers, rows }]);
    } else {
      exportTablePdf({ filename, title, subtitle, headers, rows, summaryLines, alignRight: alignRight || [] });
    }
  };

  const phLabel = sales?.pharmacist || purchase?.pharmacist || null;
  const phName = phLabel && typeof phLabel === 'object' ? phLabel.name : 'All Pharmacists';

  const salesTrend = useMemo(() => {
    if (!sales?.data) return [];
    const map = new Map();
    for (const b of sales.data) {
      const d = new Date(b.billDate || b.createdAt);
      if (Number.isNaN(d.getTime())) continue;
      const iso = d.toISOString().slice(0, 10);
      if (!map.has(iso)) map.set(iso, { label: iso, revenue: 0, bills: 0 });
      const day = map.get(iso);
      day.revenue += b.grandTotal || 0;
      day.bills += 1;
    }
    return [...map.values()].sort((a, b) => (a.label < b.label ? -1 : 1)).map((d) => ({ ...d, label: formatDate(d.label) }));
  }, [sales]);

  const bestBarData = useMemo(() => {
    if (!bestSelling?.data) return [];
    return bestSelling.data.slice(0, 10).map((m) => ({
      name: m.medicineName || m.medicineId || 'Unknown',
      value: m.totalQuantitySold || 0,
    }));
  }, [bestSelling]);

  const profitByMedData = useMemo(() => {
    if (!profit?.byMedicine) return [];
    return profit.byMedicine.map((m) => ({
      name: m.medicineName || m._id || 'Unknown',
      revenue: m.revenue || 0,
      cost: m.cost || 0,
      profit: m.profit || 0,
    }));
  }, [profit]);

  const profitChartData = useMemo(() => {
    if (!profitByPharmacist?.data) return [];
    return profitByPharmacist.data.map((r) => ({
      name: r.pharmacist?.name || 'Deleted user',
      profit: r.totalProfit || 0,
      revenue: r.totalRevenue || 0,
      cost: r.totalCost || 0,
    }));
  }, [profitByPharmacist]);

  const purchaseTrend = useMemo(() => {
    if (!purchase?.data) return [];
    const map = new Map();
    for (const o of purchase.data) {
      const d = new Date(o.orderDate || o.createdAt);
      if (Number.isNaN(d.getTime())) continue;
      const iso = d.toISOString().slice(0, 10);
      if (!map.has(iso)) map.set(iso, { label: iso, amount: 0, orders: 0 });
      const day = map.get(iso);
      day.amount += o.totalAmount || 0;
      day.orders += 1;
    }
    return [...map.values()].sort((a, b) => (a.label < b.label ? -1 : 1)).map((d) => ({ ...d, label: formatDate(d.label) }));
  }, [purchase]);

  const stats = (tab) => {
    if (tab === 'sales' && sales) {
      return [
        { label: 'Total Revenue', value: inr(sales.summary?.totalRevenue), icon: Wallet, color: 'emerald' },
        { label: 'GST Collected', value: inr(sales.summary?.totalGst), icon: Percent, color: 'accent' },
        { label: 'Discount Given', value: inr(sales.summary?.totalDiscount), icon: IndianRupee, color: 'red' },
        { label: 'Total Bills', value: sales.summary?.billCount || 0, icon: FileText, color: 'mustard' },
      ];
    }
    if (tab === 'profit' && role === 'pharmacist' && profit) {
      return [
        { label: 'Total Revenue', value: inr(profit.summary?.totalRevenue), icon: Wallet, color: 'emerald' },
        { label: 'Total Cost', value: inr(profit.summary?.totalCost), icon: IndianRupee, color: 'accent' },
        { label: 'Total Profit', value: inr(profit.summary?.totalProfit), icon: TrendingUp, color: 'green' },
        { label: 'Items Sold', value: profit.summary?.itemsSold || 0, icon: Boxes, color: 'mustard' },
      ];
    }
    if (tab === 'purchase' && purchase) {
      return [
        { label: 'Total Purchase Amount', value: inr(purchase.summary?.totalPurchaseAmount), icon: Wallet, color: 'accent' },
        { label: 'Total Orders', value: purchase.summary?.orderCount || 0, icon: ShoppingCart, color: 'mustard' },
      ];
    }
    return [];
  };

  const toolbar = (
    <div className="print:hidden flex flex-wrap items-center justify-between gap-3">
      <div className="flex flex-wrap items-center gap-2">
        {QUICK_RANGES.map((r) => (
          <button
            key={r.label}
            onClick={() => { setRangeKey(r.label); setStartDate(''); setEndDate(''); }}
            className={`cursor-pointer rounded-lgx border px-3.5 py-2 text-[12.5px] font-semibold transition-all hover:bg-bgsecondary ${
              !startDate && !endDate && rangeKey === r.label ? 'border-accent bg-accent/10 text-accent' : 'border-line bg-surface text-heading'
            }`}
          >
            {r.label}
          </button>
        ))}
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="h-9 rounded-lg border border-line bg-surface px-3 text-[12.5px] text-heading focus:border-accent focus:outline-none focus:ring-[3px] focus:ring-accent/10"
        />
        <span className="text-body">→</span>
        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          className="h-9 rounded-lg border border-line bg-surface px-3 text-[12.5px] text-heading focus:border-accent focus:outline-none focus:ring-[3px] focus:ring-accent/10"
        />
        {role === 'admin' && activeTab !== 'profit' && (
          <CustomSelect
            value={pharmacistFilter}
            onChange={setPharmacistFilter}
            size="sm"
            className="w-44"
            options={[
              { value: '', label: 'All Pharmacists' },
              ...pharmacists.map((p) => ({ value: p._id, label: p.name })),
            ]}
          />
        )}
        <button
          onClick={refetch}
          className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-[12.5px] font-semibold text-white transition-all hover:-translate-y-px hover:bg-accent-hover"
        >
          <BarChart3 size={14} />
          Apply
        </button>
      </div>
      <span className="flex items-center gap-2">
        <span className="text-[12px] text-body">{phName !== 'All Pharmacists' ? `Filtered by ${phName}` : ''}</span>
        <button
          onClick={() => exportReport('pdf')}
          className="inline-flex items-center gap-2 rounded-lgx border border-line bg-surface px-3.5 py-2 text-[12.5px] font-semibold text-heading transition-colors hover:bg-bgsecondary"
        >
          <FileDown size={14} />
          Export PDF
        </button>
        <button
          onClick={() => exportReport('excel')}
          className="inline-flex items-center gap-2 rounded-lgx border border-line bg-surface px-3.5 py-2 text-[12.5px] font-semibold text-heading transition-colors hover:bg-bgsecondary"
        >
          <Sheet size={14} />
          Export Excel
        </button>
      </span>
    </div>
  );

  const renderSales = () => {
    if (salesLoading) return <LoadingRow text="Loading sales report..." />;
    if (salesError) return <ErrorBox message={salesError} onRetry={refetch} />;
    if (!sales) return null;
    const bills = sales.data || [];
    const statsData = stats('sales');
    return (
      <>
        <StatGrid stats={statsData} />
        {bills.length === 0 && <EmptyState title="No sales in this range" icon={Wallet} />}
        <div className="rounded-lgx border border-line bg-surface p-5 shadow-card">
          <h3 className="text-[15px] font-bold text-heading">Revenue Over Time</h3>
          <p className="mb-3 text-[12px] text-body">Daily revenue across the selected range</p>
          {bills.length === 0 || salesTrend.length === 0 ? (
            <div className="flex h-52 items-center justify-center text-[13px] text-body">No sales data in this range</div>
          ) : (
            <div className="h-52 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={salesTrend} margin={{ top: 10, right: 10, bottom: 0, left: -14 }}>
                  <defs>
                    <linearGradient id="repRevGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#C1592E" stopOpacity={0.16} />
                      <stop offset="100%" stopColor="#C1592E" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="4 4" stroke="#E7D8C4" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#5C5049' }} tickLine={false} axisLine={false} dy={6} />
                  <YAxis tick={{ fontSize: 12, fill: '#5C5049' }} tickLine={false} axisLine={false} />
                  <Tooltip
                    formatter={(value, name) => (name === 'revenue' ? [inr(value), 'Revenue'] : [value, 'Bills'])}
                    contentStyle={{ borderRadius: 12, border: '1px solid #E7D8C4', fontSize: 13 }}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#C1592E" strokeWidth={2.2} fill="url(#repRevGrad)" activeDot={{ r: 5, fill: '#C1592E', stroke: '#FFFDF9', strokeWidth: 2 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
        {bills.length > 0 && (
          <div className="overflow-x-auto rounded-lgx border border-line bg-surface shadow-card">
            <table className="w-full text-left">
              <thead className="border-b border-line">
                <tr>
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.06em] text-body">Invoice</th>
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.06em] text-body hidden sm:table-cell">Customer</th>
                  {role === 'admin' && (
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.06em] text-body hidden md:table-cell">Pharmacist</th>
                  )}
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.06em] text-body hidden lg:table-cell">Date</th>
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.06em] text-body text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {bills.map((b) => (
                  <tr key={b._id} className="transition-colors even:bg-bgprimary/35 hover:bg-bgprimary/60">
                    <td className="px-4 py-3">
                      <span className="text-[13.5px] font-medium text-heading">{b.invoiceNumber}</span>
                      <span className="block text-[11px] text-body">{b.items?.length || 0} items</span>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span className="text-[13px] text-heading">{b.customerName || b.customer?.name || '—'}</span>
                      <span className="block text-[11px] text-body">{b.customerPhone || b.customer?.phoneNumber || ''}</span>
                    </td>
                    {role === 'admin' && (
                    <td className="px-4 py-3 hidden md:table-cell text-[13px] text-body">
                      {typeof b.pharmacist === 'object' && b.pharmacist ? b.pharmacist.name : '—'}
                    </td>
                    )}
                    <td className="px-4 py-3 hidden lg:table-cell text-[13px] text-body">{formatDate(b.billDate || b.createdAt)}</td>
                    <td className="px-4 py-3 text-right text-[14px] font-bold text-heading">{inr(b.grandTotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </>
    );
  };

  const renderProfit = () => {
    if (role === 'admin') {
      if (profitByPharmacistLoading) return <LoadingRow text="Loading pharmacist profit report..." />;
      if (profitByPharmacistError) return <ErrorBox message={profitByPharmacistError} onRetry={refetch} />;
      if (!profitByPharmacist) return null;
      const rows = profitByPharmacist.data || [];
      return (
        <>
          <div className="rounded-lgx border border-line bg-surface p-5 shadow-card">
              <h3 className="text-[15px] font-bold text-heading">Profit by Pharmacist</h3>
              <p className="mb-3 text-[12px] text-body">Total profit earned by each pharmacist</p>
              {profitChartData.length === 0 ? (
                <div className="flex h-52 items-center justify-center text-[13px] text-body">No profit data in this range</div>
              ) : (
                <div className="h-52 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={profitChartData} layout="vertical" margin={{ top: 0, right: 40, bottom: 0, left: 8 }} barCategoryGap="30%">
                      <defs>
                        <linearGradient id="profitGrad" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor="#C1592E" stopOpacity={0.45} />
                          <stop offset="100%" stopColor="#C1592E" stopOpacity={1} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E7D8C4" horizontal={false} />
                      <XAxis type="number" tick={{ fontSize: 12, fill: '#5C5049' }} tickLine={false} axisLine={false} />
                      <YAxis
                        type="category"
                        dataKey="name"
                        width={130}
                        tick={{ fontSize: 12.5, fill: '#2B211B', fontWeight: 500 }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <Tooltip content={<ChartTooltip />} cursor={{ fill: '#FBF3E7', opacity: 0.5 }} />
                      <Bar dataKey="profit" radius={[0, 8, 8, 0]} barSize={16}>
                        {profitChartData.map((d) => (
                          <Cell key={d.name} fill="url(#profitGrad)" fillOpacity={0.4 + 0.6 * (d.profit / Math.max(...profitChartData.map((x) => x.profit)))} />
                        ))}
                        <LabelList dataKey="profit" position="right" formatter={(v) => inr(v).replace('₹', '₹')} style={{ fill: '#2B211B', fontSize: 12, fontWeight: 600 }} />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {rows.map((r) => (
              <div key={r.pharmacist?._id || r._id} className="rounded-lgx border border-line bg-surface p-5 shadow-card">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-soft text-accent">
                    <UserCheck size={18} />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-[14px] font-semibold text-heading">{r.pharmacist?.name || 'Deleted user'}</p>
                    <p className="truncate text-[11.5px] text-body">{r.pharmacist?.email || ''}</p>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="rounded-lg bg-bgprimary/60 p-3">
                    <div className="text-[10.5px] font-medium uppercase tracking-wide text-body">Revenue</div>
                    <div className="text-[15px] font-bold text-heading">{inr(r.totalRevenue)}</div>
                  </div>
                  <div className="rounded-lg bg-bgprimary/60 p-3">
                    <div className="text-[10.5px] font-medium uppercase tracking-wide text-body">Cost</div>
                    <div className="text-[15px] font-bold text-heading">{inr(r.totalCost)}</div>
                  </div>
                  <div className="rounded-lg bg-emerald-50 p-3">
                    <div className="text-[10.5px] font-medium uppercase tracking-wide text-emerald-600">Profit</div>
                    <div className="text-[15px] font-bold text-emerald-700">{inr(r.totalProfit)}</div>
                  </div>
                  <div className="rounded-lg bg-bgprimary/60 p-3">
                    <div className="text-[10.5px] font-medium uppercase tracking-wide text-body">Items Sold</div>
                    <div className="text-[15px] font-bold text-heading">{r.itemsSold}</div>
                  </div>
                </div>
                <p className="mt-3 text-[11.5px] text-body">Bills: <span className="font-semibold text-heading">{r.billCount}</span></p>
              </div>
            ))}
          </div>
          {rows.length === 0 && <EmptyState title="No profit data in this range" icon={TrendingUp} />}
        </>
      );
    }

    if (profitLoading) return <LoadingRow text="Loading profit report..." />;
    if (profitError) return <ErrorBox message={profitError} onRetry={refetch} />;
    if (!profit) return null;
    return (
      <>
        <StatGrid stats={stats('profit')} />
        <div className="rounded-lgx border border-line bg-surface p-5 shadow-card">
          <h3 className="text-[15px] font-bold text-heading">Revenue · Cost · Profit</h3>
          <p className="mb-3 text-[12px] text-body">Comparison across top medicines</p>
          {profitByMedData.length === 0 ? (
            <div className="flex h-52 items-center justify-center text-[13px] text-body">No profit data in this range</div>
          ) : (
            <div className="overflow-x-auto">
              <div className="min-w-[520px]" style={{ height: Math.max(220, profitByMedData.length * 34) }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={profitByMedData} layout="vertical" margin={{ top: 0, right: 16, bottom: 0, left: 8 }} barCategoryGap="25%">
                    <CartesianGrid strokeDasharray="4 4" stroke="#E7D8C4" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 12, fill: '#5C5049' }} tickLine={false} axisLine={false} />
                    <YAxis
                      type="category"
                      dataKey="name"
                      width={150}
                      tick={{ fontSize: 11.5, fill: '#2B211B', fontWeight: 500 }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey="revenue" name="Revenue" fill="#C1592E" radius={[0, 2, 2, 0]} barSize={10} />
                    <Bar dataKey="cost" name="Cost" fill="#D9A441" radius={[0, 2, 2, 0]} barSize={10} />
                    <Bar dataKey="profit" name="Profit" fill="#10B981" radius={[0, 4, 4, 0]} barSize={10} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
        {(profit.byMedicine || []).length === 0 && <EmptyState title="No profit data in this range" icon={TrendingUp} />}
        {(profit.byMedicine || []).length > 0 && (
          <div className="overflow-x-auto rounded-lgx border border-line bg-surface shadow-card">
            <table className="w-full text-left">
              <thead className="border-b border-line">
                <tr>
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.06em] text-body">Medicine</th>
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.06em] text-body text-right">Qty Sold</th>
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.06em] text-body text-right hidden md:table-cell">Revenue</th>
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.06em] text-body text-right hidden md:table-cell">Cost</th>
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.06em] text-body text-right">Profit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {profit.byMedicine.map((m) => (
                  <tr key={m._id} className="transition-colors even:bg-bgprimary/35 hover:bg-bgprimary/60">
                    <td className="px-4 py-3">
                      <span className="text-[13.5px] font-medium text-heading">{m.medicineName || '—'}</span>
                    </td>
                    <td className="px-4 py-3 text-right text-[13px] font-semibold text-heading">{m.quantitySold}</td>
                    <td className="px-4 py-3 text-right text-[13px] text-body hidden md:table-cell">{inr(m.revenue)}</td>
                    <td className="px-4 py-3 text-right text-[13px] text-body hidden md:table-cell">{inr(m.cost)}</td>
                    <td className={`px-4 py-3 text-right text-[13px] font-bold ${m.profit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{inr(m.profit)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </>
    );
  };

  const renderPurchase = () => {
    if (purchaseLoading) return <LoadingRow text="Loading purchase report..." />;
    if (purchaseError) return <ErrorBox message={purchaseError} onRetry={refetch} />;
    if (!purchase) return null;
    const orders = purchase.data || [];
    const statsData = stats('purchase');
    return (
      <>
        <StatGrid stats={statsData} />
        {orders.length === 0 && <EmptyState title="No purchase orders in this range" icon={ShoppingCart} />}
        <div className="rounded-lgx border border-line bg-surface p-5 shadow-card">
          <h3 className="text-[15px] font-bold text-heading">Purchase Spend Over Time</h3>
          <p className="mb-3 text-[12px] text-body">Order amount across the selected range</p>
          {orders.length === 0 || purchaseTrend.length === 0 ? (
            <div className="flex h-52 items-center justify-center text-[13px] text-body">No purchase data in this range</div>
          ) : (
            <div className="h-52 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={purchaseTrend} margin={{ top: 10, right: 10, bottom: 0, left: -14 }}>
                  <CartesianGrid strokeDasharray="4 4" stroke="#E7D8C4" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#5C5049' }} tickLine={false} axisLine={false} dy={6} />
                  <YAxis tick={{ fontSize: 12, fill: '#5C5049' }} tickLine={false} axisLine={false} />
                  <Tooltip
                    formatter={(value, name) => (name === 'amount' ? [inr(value), 'Amount'] : [value, 'Orders'])}
                    contentStyle={{ borderRadius: 12, border: '1px solid #E7D8C4', fontSize: 13 }}
                  />
                  <Line type="monotone" dataKey="amount" name="Amount" stroke="#6B7A4F" strokeWidth={2.2} dot={{ r: 4, fill: '#6B7A4F', strokeWidth: 0 }} activeDot={{ r: 6, fill: '#6B7A4F' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
        {orders.length > 0 && (
          <div className="overflow-x-auto rounded-lgx border border-line bg-surface shadow-card">
            <table className="w-full text-left">
              <thead className="border-b border-line">
                <tr>
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.06em] text-body">Order No.</th>
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.06em] text-body hidden sm:table-cell">Supplier</th>
                  {role === 'admin' && (
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.06em] text-body hidden md:table-cell">Pharmacist</th>
                  )}
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.06em] text-body hidden lg:table-cell">Date</th>
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.06em] text-body text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {orders.map((o) => (
                  <tr key={o._id} className="transition-colors even:bg-bgprimary/35 hover:bg-bgprimary/60">
                    <td className="px-4 py-3">
                      <span className="text-[13.5px] font-medium text-heading">{o.orderNumber}</span>
                      <span className="block text-[11px] text-body">{o.items?.length || 0} items</span>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span className="text-[13px] text-heading">{o.supplier?.name || '—'}</span>
                    </td>
                    {role === 'admin' && (
                    <td className="px-4 py-3 hidden md:table-cell text-[13px] text-body">
                      {typeof o.pharmacist === 'object' && o.pharmacist ? o.pharmacist.name : '—'}
                    </td>
                    )}
                    <td className="px-4 py-3 hidden lg:table-cell text-[13px] text-body">{formatDate(o.orderDate || o.createdAt)}</td>
                    <td className="px-4 py-3 text-right text-[14px] font-bold text-heading">{inr(o.totalAmount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </>
    );
  };

  const renderBest = () => {
    if (bestSellingLoading) return <LoadingRow text="Loading best selling medicines..." />;
    if (bestSellingError) return <ErrorBox message={bestSellingError} onRetry={refetch} />;
    if (!bestSelling) return null;
    const rows = bestSelling.data || [];
    return (
      <>
        {rows.length === 0 && <EmptyState title="No sales in this range" icon={Trophy} />}
        <div className="rounded-lgx border border-line bg-surface p-5 shadow-card">
          <h3 className="text-[15px] font-bold text-heading">Top Medicines</h3>
          <p className="mb-3 text-[12px] text-body">Units sold by medicine</p>
          {rows.length === 0 || bestBarData.length === 0 ? (
            <div className="flex h-64 items-center justify-center text-[13px] text-body">No sales data in this range</div>
          ) : (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={bestBarData} layout="vertical" margin={{ top: 0, right: 40, bottom: 0, left: 8 }} barCategoryGap="30%">
                  <defs>
                    <linearGradient id="bestGrad" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#C1592E" stopOpacity={0.45} />
                      <stop offset="100%" stopColor="#C1592E" stopOpacity={1} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E7D8C4" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 12, fill: '#5C5049' }} tickLine={false} axisLine={false} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={132}
                    tick={{ fontSize: 12.5, fill: '#2B211B', fontWeight: 500 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip content={<ChartTooltip />} cursor={{ fill: '#FBF3E7', opacity: 0.5 }} />
                  <Bar dataKey="value" radius={[0, 8, 8, 0]} barSize={16}>
                    {bestBarData.map((d) => (
                      <Cell key={d.name} fill="url(#bestGrad)" fillOpacity={0.4 + 0.6 * (d.value / Math.max(...bestBarData.map((x) => x.value)))} />
                    ))}
                    <LabelList dataKey="value" position="right" style={{ fill: '#2B211B', fontSize: 12, fontWeight: 600 }} formatter={(v) => v} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
        {rows.length > 0 && (
          <div className="flex flex-col gap-3">
            {rows.map((m, i) => (
              <div key={m.medicineId} className="flex flex-wrap items-center justify-between gap-3 rounded-lgx border border-line bg-surface px-5 py-4 shadow-card">
                <div className="flex items-center gap-3">
                  <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-bold ${i < 3 ? 'bg-mustard-deep text-white' : 'bg-accent-soft text-accent'}`}>
                    {i + 1}
                  </span>
                  <div>
                    <p className="text-[14px] font-semibold text-heading">{m.medicineName}</p>
                    <p className="text-[11.5px] text-body">{m.category || 'Medicine'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <div className="flex items-center gap-1.5 text-[15px] font-bold text-heading">
                      <PackageSearch size={15} className="text-accent" />
                      {m.totalQuantitySold}
                    </div>
                    <div className="text-[10.5px] font-medium uppercase tracking-wide text-body">Sold</div>
                  </div>
                  <div className="text-center">
                    <div className="text-[15px] font-bold text-emerald-600">{inr(m.totalRevenue)}</div>
                    <div className="text-[10.5px] font-medium uppercase tracking-wide text-body">Revenue</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </>
    );
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link
            to={base}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-line bg-surface text-heading transition-colors hover:bg-bgsecondary hover:text-accent"
            title="Back to dashboard"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h2 className="text-2xl font-bold text-heading md:text-3xl">Reports</h2>
            <p className="mt-1 text-[14px] text-body">Sales, profit, purchase and top-selling medicine reports.</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 print:hidden">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => {
              setActiveTab(t.id);
              setStartDate('');
              setEndDate('');
              setRangeKey('Overall');
            }}
            className={`inline-flex cursor-pointer items-center gap-2 rounded-lgx border px-4 py-2.5 text-[13px] font-semibold transition-all hover:bg-bgsecondary ${
              activeTab === t.id ? 'border-accent bg-accent/10 text-accent' : 'border-line bg-surface text-heading'
            }`}
          >
            <t.icon size={15} />
            {t.label}
          </button>
        ))}
      </div>

      {toolbar}

      <div className="flex flex-col gap-5">
        {activeTab === 'sales' && renderSales()}
        {activeTab === 'profit' && renderProfit()}
        {activeTab === 'purchase' && renderPurchase()}
        {activeTab === 'best' && renderBest()}
      </div>
    </div>
  );
}

function StatGrid({ stats }) {
  if (!stats.length) return null;
  const colorMap = {
    emerald: 'bg-emerald-50 text-emerald-600',
    accent: 'bg-accent-soft text-accent',
    red: 'bg-red-50 text-red-500',
    mustard: 'bg-mustard-soft text-mustard-deep',
    green: 'bg-emerald-50 text-emerald-600',
  };
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 print:hidden">
      {stats.map((s) => (
        <div key={s.label} className="rounded-lgx border border-line bg-surface p-5 shadow-card">
          <span className={`inline-flex h-9 w-9 items-center justify-center rounded-lg ${colorMap[s.color] || colorMap.accent}`}>
            <s.icon size={17} />
          </span>
          <div className="mt-3 text-[21px] font-bold leading-none text-heading">{s.value}</div>
          <div className="mt-1.5 text-[11.5px] font-medium uppercase tracking-wide text-body">{s.label}</div>
        </div>
      ))}
    </div>
  );
}

function LoadingRow({ text }) {
  return (
    <div className="flex items-center justify-center gap-2 rounded-lgx border border-line bg-surface px-6 py-14 text-[14px] text-body">
      <Loader2 size={18} className="animate-spin text-accent" />
      {text}
    </div>
  );
}

function ErrorBox({ message, onRetry }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lgx border border-red-200 bg-red-50 px-4 py-3 text-[13.5px] text-red-600">
      <span>{message}</span>
      <button onClick={onRetry} className="shrink-0 rounded-lg px-3 py-1 text-[12px] font-bold text-red-600 transition-colors hover:bg-red-100">
        Retry
      </button>
    </div>
  );
}

function EmptyState({ title, icon: Icon }) {
  return (
    <div className="rounded-lgx border border-line bg-surface px-6 py-14 text-center text-[14px] text-body">
      <Icon size={36} className="mx-auto mb-3 text-line" />
      {title}
    </div>
  );
}