import { useState, useMemo, useEffect, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  Plus,
  Search,
  ArrowLeft,
  Eye,
  X,
  ChevronLeft,
  ChevronRight,
  Receipt,
  Wallet,
  CalendarPlus,
  Loader2,
  IndianRupee,
  UserCheck,
  Boxes,
  Printer,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import toast from 'react-hot-toast';
import {
  fetchSalesBillsList,
  fetchSalesBillDetail,
  createNewSalesBill,
  clearSalesDetail,
} from '../features/salesSlice';
import { fetchCustomersList } from '../features/customerSlice';
import { fetchAllPharmacists } from '../features/pharmacistSlice';
import { fetchMedicinesList } from '../features/medicineSlice';

const formatDate = (d) => {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

const formatDateTime = (d) => {
  if (!d) return '—';
  return new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const inr = (n) => '₹' + Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const PAY_METHODS = [
  { value: 'cash', label: 'Cash' },
  { value: 'card', label: 'Card' },
  { value: 'upi', label: 'UPI' },
  { value: 'credit', label: 'Credit' },
  { value: 'other', label: 'Other' },
];

const PAYMENT_COLORS = {
  cash: '#10B981',
  card: '#C1592E',
  upi: '#3B82F6',
  credit: '#D9A441',
  other: '#94A3B8',
};

const emptyItem = { key: 1, medicineId: '', quantity: 1 };

export default function BillingPage() {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);
  const role = user?.role || 'admin';
  const location = useLocation();
  const base = location.pathname.startsWith('/pharmacist') ? '/pharmacist' : '/admin';

  const { items: bills, loading, error: loadError, detail, detailLoading, detailError, creating } =
    useSelector((state) => state.sales);
  const { items: customers } = useSelector((state) => state.customers);
  const { items: pharmacists } = useSelector((state) => state.pharmacists);
  const { items: medicines } = useSelector((state) => state.medicines);

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [thisMonthOnly, setThisMonthOnly] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ customerId: '', pharmacistId: role === 'admin' ? '' : user?._id, paymentMethod: 'cash', discountAmount: 0 });
  const [items, setItems] = useState([emptyItem]);
  const [itemSeq, setItemSeq] = useState(2);
  const [formError, setFormError] = useState('');
  const [viewId, setViewId] = useState(null);

  const loadData = useCallback(() => {
    dispatch(fetchSalesBillsList({ role, params: { limit: 50 } }));
  }, [dispatch, role]);

  useEffect(() => {
    loadData();
    dispatch(fetchCustomersList({ role, params: { limit: 200 } }));
    if (role === 'admin') dispatch(fetchAllPharmacists());
    dispatch(fetchMedicinesList({ role, params: { sort: 'newest', limit: 200 } }));
    return () => dispatch(clearSalesDetail());
  }, [loadData, dispatch, role]);

  const filtered = useMemo(() => {
    let list = [...bills];
    if (thisMonthOnly) {
      const now = new Date();
      list = list.filter((b) => {
        const d = new Date(b.billDate || b.createdAt);
        return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
      });
    }
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((b) =>
        b.invoiceNumber?.toLowerCase().includes(q) ||
        (b.customerName || b.customer?.name || '').toLowerCase().includes(q) ||
        (b.customerPhone || '').toLowerCase().includes(q) ||
        (typeof b.pharmacist === 'object' && b.pharmacist?.name || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [bills, search, thisMonthOnly]);

  const todayCount = useMemo(() => {
    const today = new Date().toDateString();
    return bills.filter((b) => new Date(b.billDate || b.createdAt).toDateString() === today).length;
  }, [bills]);

  const thisMonthCount = useMemo(() => {
    const now = new Date();
    return bills.filter((b) => {
      const d = new Date(b.billDate || b.createdAt);
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
    }).length;
  }, [bills]);

  const totalRevenue = useMemo(() => bills.reduce((acc, b) => acc + (b.grandTotal || 0), 0), [bills]);

  const dailyRevenue = useMemo(() => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      days.push({
        key: d.toDateString(),
        label: d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
        revenue: 0,
        bills: 0,
      });
    }
    for (const b of bills) {
      const day = days.find((x) => x.key === new Date(b.billDate || b.createdAt).toDateString());
      if (day) {
        day.revenue += b.grandTotal || 0;
        day.bills += 1;
      }
    }
    return days;
  }, [bills]);

  const paymentSplit = useMemo(() => {
    const map = {};
    for (const b of bills) {
      const m = b.paymentMethod || 'other';
      map[m] = (map[m] || 0) + (b.grandTotal || 0);
    }
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [bills]);

  const limit = 8;
  const totalPages = Math.max(Math.ceil(filtered.length / limit), 1);
  const paged = filtered.slice((page - 1) * limit, page * limit);

  const fallbackCustomers = useMemo(() => {
    const phId = form.pharmacistId;
    if (!phId || role !== 'admin') return customers;
    return customers.filter((c) => {
      const pid = typeof c.pharmacist === 'object' && c.pharmacist ? c.pharmacist._id : c.pharmacist;
      return pid === phId;
    });
  }, [customers, form.pharmacistId, role]);

  const fallbackMedicines = useMemo(() => {
    const phId = form.pharmacistId;
    if (!phId || role !== 'admin') return medicines;
    return medicines.filter((m) => {
      const pid = typeof m.pharmacist === 'object' && m.pharmacist ? m.pharmacist._id : m.pharmacist;
      return pid === phId;
    });
  }, [medicines, form.pharmacistId, role]);

  const openCreate = () => {
    setForm({ customerId: '', pharmacistId: role === 'admin' ? '' : user?._id, paymentMethod: 'cash', discountAmount: 0 });
    setItems([emptyItem]);
    setItemSeq(2);
    setFormError('');
    setShowCreate(true);
  };

  const setItemField = (key, field, val) => {
    setItems((prev) => prev.map((it) => (it.key === key ? { ...it, [field]: val } : it)));
  };

  const addItemRow = () => {
    setItems((prev) => [...prev, { key: itemSeq, medicineId: '', quantity: 1 }]);
    setItemSeq((s) => s + 1);
  };

  const removeItemRow = (key) => {
    setItems((prev) => prev.filter((it) => it.key !== key));
  };

  const selectedMedicines = new Set(items.map((it) => it.medicineId).filter(Boolean));

  const itemDetail = useCallback(
    (it) => fallbackMedicines.find((m) => m._id === it.medicineId),
    [fallbackMedicines]
  );

  const lineTotal = useCallback(
    (it) => {
      const m = itemDetail(it);
      const qty = Number(it.quantity || 0);
      if (!m) return 0;
      const subtotal = Number(m.sellingPrice || 0) * qty;
      const gst = (subtotal * Number(m.gst || 0)) / 100;
      return subtotal + gst;
    },
    [itemDetail]
  );

  const subtotal = useMemo(() => items.reduce((acc, it) => acc + lineTotal(it), 0), [items, lineTotal]);
  const discountAmount = Number(form.discountAmount || 0);
  const grandTotal = Math.max(subtotal - discountAmount, 0);

  const handleCreate = async () => {
    setFormError('');
    if (!form.customerId) {
      setFormError('Please select a customer');
      toast.error('Please select a customer');
      return;
    }
    if (role === 'admin' && !form.pharmacistId) {
      setFormError('Please select a pharmacist');
      toast.error('Please select a pharmacist');
      return;
    }
    const clean = items.filter((it) => it.medicineId);
    if (clean.length === 0) {
      setFormError('Add at least one medicine to the bill');
      toast.error('Add at least one medicine to the bill');
      return;
    }
    for (const it of clean) {
      if (Number(it.quantity) < 1) {
        setFormError('Quantity must be at least 1 for each item');
        toast.error('Quantity must be at least 1 for each item');
        return;
      }
      const m = itemDetail(it);
      if (Number(it.quantity) > Number(m?.stock || 0)) {
        setFormError(`Insufficient stock for ${m?.name}`);
        toast.error(`Insufficient stock for ${m?.name}`);
        return;
      }
    }
    if (discountAmount > subtotal) {
      setFormError('Discount cannot be more than the bill total');
      toast.error('Discount cannot be more than the bill total');
      return;
    }

    const payload = {
      customer: form.customerId,
      pharmacist: role === 'admin' ? form.pharmacistId : user?._id,
      paymentMethod: form.paymentMethod,
      discountAmount: discountAmount || 0,
      items: clean.map((it) => ({
        medicine: it.medicineId,
        quantity: Number(it.quantity),
      })),
    };

    try {
      await dispatch(createNewSalesBill({ role, payload })).unwrap();
      toast.success('Bill created — stock updated & reward points added');
      setShowCreate(false);
      setForm({ customerId: '', pharmacistId: role === 'admin' ? '' : user?._id, paymentMethod: 'cash', discountAmount: 0 });
      setItems([emptyItem]);
      loadData();
    } catch (err) {
      const msg = typeof err === 'string' ? err : 'Failed to create bill';
      setFormError(msg);
      toast.error(msg);
    }
  };

  const openView = (id) => {
    setViewId(id);
    dispatch(fetchSalesBillDetail({ role, id }));
  };

  const handlePrint = () => {
    window.print();
  };

  const inputCls =
    'h-10 w-full rounded-lg border border-line bg-bgprimary px-3.5 text-[14px] text-heading placeholder:text-[#B5A99A] focus:border-accent focus:outline-none focus:ring-[3px] focus:ring-accent/10';

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div className="flex items-center gap-3">
          <Link
            to={base}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-line bg-surface text-heading transition-colors hover:bg-bgsecondary hover:text-accent"
            title="Back to dashboard"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h2 className="text-2xl font-bold text-heading md:text-3xl">Billing & Sales</h2>
            <p className="mt-1 text-[14px] text-body">Create customer bills — stock, GST and reward points update automatically.</p>
          </div>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 rounded-lgx bg-accent px-5 py-2.5 text-[14px] font-semibold text-white transition-all hover:-translate-y-px hover:bg-accent-hover"
        >
          <Plus size={16} />
          New Bill
        </button>
      </div>

      {loadError && (
        <div className="flex items-center justify-between gap-3 rounded-lgx border border-red-200 bg-red-50 px-4 py-3 text-[13.5px] text-red-600 print:hidden">
          <span>{loadError}</span>
          <button onClick={loadData} className="shrink-0 rounded-lg px-3 py-1 text-[12px] font-bold text-red-600 transition-colors hover:bg-red-100">
            Retry
          </button>
        </div>
      )}

      {/* Summary */}
      <div className="flex flex-wrap items-center gap-2.5 print:hidden">
        <span className={`inline-flex cursor-pointer items-center gap-2 rounded-lgx border px-4 py-2.5 ${loading ? 'border-line bg-surface' : 'border-line bg-surface'}`}>
          <Receipt size={16} className="text-accent" />
          <span className="text-[13px] font-semibold text-heading">{loading ? '…' : bills.length}</span>
          <span className="text-[12px] text-body">Total Bills</span>
        </span>

        <button
          onClick={() => { setThisMonthOnly((o) => !o); setPage(1); }}
          title="Bills created this month"
          className={`inline-flex cursor-pointer items-center gap-2 rounded-lgx border px-4 py-2.5 transition-all hover:bg-bgsecondary ${
            thisMonthOnly ? 'border-accent bg-accent/10' : 'border-line bg-surface'
          }`}
        >
          <CalendarPlus size={16} className="text-mustard-deep" />
          <span className="text-[13px] font-semibold text-heading">{loading ? '…' : thisMonthCount}</span>
          <span className="text-[12px] text-body">This Month</span>
        </button>

        <span className={`inline-flex cursor-pointer items-center gap-2 rounded-lgx border px-4 py-2.5 ${loading ? 'border-line bg-surface' : 'border-line bg-surface'}`}>
          <Wallet size={16} className="text-emerald-600" />
          <span className="text-[13px] font-semibold text-heading">{loading ? '…' : todayCount}</span>
          <span className="text-[12px] text-body">Today</span>
        </span>

        <span className={`inline-flex cursor-pointer items-center gap-2 rounded-lgx border px-4 py-2.5 ${loading ? 'border-line bg-surface' : 'border-line bg-surface'}`}>
          <IndianRupee size={16} className="text-emerald-600" />
          <span className="text-[13px] font-semibold text-heading">{loading ? '…' : inr(totalRevenue)}</span>
          <span className="text-[12px] text-body">Total Revenue</span>
        </span>
      </div>

      {/* Charts */}
      {!loading && bills.length > 0 && (
        <div className="grid grid-cols-1 gap-4 print:hidden lg:grid-cols-3">
          <div className="rounded-lgx border border-line bg-surface p-5 shadow-card lg:col-span-2">
            <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-[15px] font-bold text-heading">Revenue Trend</h3>
                <p className="text-[12px] text-body">Daily billing · last 7 days</p>
              </div>
            </div>
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dailyRevenue} margin={{ top: 10, right: 10, bottom: 0, left: -14 }}>
                  <defs>
                    <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
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
                  <Area type="monotone" dataKey="revenue" stroke="#C1592E" strokeWidth={2.2} fill="url(#revGrad)" activeDot={{ r: 5, fill: '#C1592E', stroke: '#FFFDF9', strokeWidth: 2 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-lgx border border-line bg-surface p-5 shadow-card">
            <h3 className="text-[15px] font-bold text-heading">Payment Methods</h3>
            <p className="text-[12px] text-body">Revenue by payment type</p>
            {paymentSplit.length === 0 ? (
              <div className="flex h-48 items-center justify-center text-[13px] text-body">No data</div>
            ) : (
              <>
                <div className="h-40 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={paymentSplit} dataKey="value" nameKey="name" innerRadius={45} outerRadius={70} paddingAngle={3} strokeWidth={0}>
                        {paymentSplit.map((entry) => (
                          <Cell key={entry.name} fill={PAYMENT_COLORS[entry.name] || '#94A3B8'} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => inr(value)} contentStyle={{ borderRadius: 12, border: '1px solid #E7D8C4', fontSize: 13 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-1 flex flex-wrap justify-center gap-x-3 gap-y-1">
                  {paymentSplit.map((p) => (
                    <span key={p.name} className="inline-flex items-center gap-1.5 text-[11.5px] text-body">
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: PAYMENT_COLORS[p.name] || '#94A3B8' }} />
                      <span className="capitalize">{p.name}</span>
                      <span className="font-semibold text-heading">{inr(p.value)}</span>
                    </span>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Search */}
      <div className="relative w-full max-w-md print:hidden">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-body" />
        <input
          type="text"
          placeholder={role === 'admin' ? 'Search by invoice, customer, pharmacist...' : 'Search by invoice, customer...'}
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="h-10 w-full rounded-lg border border-line bg-surface pl-10 pr-4 text-[14px] text-heading placeholder:text-[#B5A99A] transition-[border-color,box-shadow] focus:border-accent focus:outline-none focus:ring-[3px] focus:ring-accent/10"
        />
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lgx border border-line bg-surface shadow-card print:hidden">
        <table className="w-full text-left">
          <thead className="border-b border-line">
            <tr>
              <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.06em] text-body">Invoice</th>
              <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.06em] text-body hidden sm:table-cell">Customer</th>
              {role === 'admin' && (
              <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.06em] text-body hidden md:table-cell">Pharmacist</th>
              )}
              <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.06em] text-body hidden lg:table-cell">Date</th>
              <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.06em] text-body hidden xl:table-cell">Pay</th>
              <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.06em] text-body text-right">Total</th>
              <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.06em] text-body text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {loading && (
              <tr>
                <td colSpan={role === 'admin' ? 7 : 6} className="px-4 py-16 text-center text-[14px] text-body">Loading bills...</td>
              </tr>
            )}
            {!loading && paged.length === 0 && (
              <tr>
                <td colSpan={role === 'admin' ? 7 : 6} className="px-4 py-16 text-center text-[14px] text-body">
                  <Receipt size={36} className="mx-auto mb-3 text-line" />
                  No bills found
                </td>
              </tr>
            )}
            {!loading && paged.map((b) => (
              <tr key={b._id} className="cursor-pointer transition-colors even:bg-bgprimary/35 hover:bg-bgprimary/60" onClick={() => openView(b._id)}>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-accent">
                      <Receipt size={16} />
                    </span>
                    <div>
                      <span className="text-[14px] font-medium text-heading">{b.invoiceNumber}</span>
                      <span className="block text-[11px] text-body">{formatDate(b.billDate || b.createdAt)}</span>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 hidden sm:table-cell">
                  <span className="text-[13px] font-medium text-heading">{b.customerName || b.customer?.name || '—'}</span>
                  <span className="block text-[11.5px] text-body">{b.customerPhone || b.customer?.phoneNumber || ''}</span>
                </td>
                {role === 'admin' && (
                <td className="px-4 py-3 hidden md:table-cell">
                  <span className="inline-flex items-center gap-1.5 text-[13px] text-body">
                    <UserCheck size={14} className="text-emerald-600" />
                    {typeof b.pharmacist === 'object' && b.pharmacist ? b.pharmacist.name : '—'}
                  </span>
                </td>
                )}
                <td className="px-4 py-3 text-[13px] text-body hidden lg:table-cell">{formatDateTime(b.billDate || b.createdAt)}</td>
                <td className="px-4 py-3 hidden xl:table-cell">
                  <span className="rounded-full bg-bgsecondary px-2.5 py-0.5 text-[11px] font-semibold capitalize text-heading">{b.paymentMethod}</span>
                </td>
                <td className="px-4 py-3 text-right text-[14px] font-bold text-heading">{inr(b.grandTotal)}</td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <button
                      onClick={(e) => { e.stopPropagation(); openView(b._id); }}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-body transition-colors hover:bg-bgsecondary hover:text-heading"
                      title="View bill"
                    >
                      <Eye size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-between print:hidden">
          <span className="text-[13px] text-body">
            Showing {(page - 1) * limit + 1}–{Math.min(page * limit, filtered.length)} of {filtered.length}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-line bg-surface text-body transition-colors hover:bg-bgsecondary hover:text-heading disabled:opacity-40"
            >
              <ChevronLeft size={16} />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`flex h-8 w-8 items-center justify-center rounded-lg text-[13px] font-semibold transition-colors ${
                  page === p
                    ? 'bg-accent text-white'
                    : 'border border-line bg-surface text-body hover:bg-bgsecondary hover:text-heading'
                }`}
              >
                {p}
              </button>
            ))}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-line bg-surface text-body transition-colors hover:bg-bgsecondary hover:text-heading disabled:opacity-40"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* CREATE BILL MODAL */}
      {showCreate && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowCreate(false)} />
          <div className="relative flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-2xl">
            <div className="flex items-center justify-between border-b border-line bg-surface/95 px-6 py-4 backdrop-blur-md">
              <div>
                <h3 className="text-lg font-bold text-heading">New Sales Bill</h3>
                <p className="text-[12px] text-body">Select a customer and add medicines — stock, GST and reward points adjust automatically.</p>
              </div>
              <button onClick={() => setShowCreate(false)} className="flex h-8 w-8 items-center justify-center rounded-lg text-body hover:bg-bgsecondary hover:text-heading">
                <X size={18} />
              </button>
            </div>

            {formError && (
              <div className="mx-6 mt-4 rounded-lg bg-red-50 px-4 py-3 text-[13px] font-medium text-red-600">
                {formError}
              </div>
            )}

            <div className="flex-1 overflow-y-auto">
              <div className="grid grid-cols-1 gap-4 px-6 py-5 sm:grid-cols-2">
                {role === 'admin' && (
                <div>
                  <label className="mb-1.5 block text-[13px] font-medium text-heading">Pharmacist *</label>
                  <select
                    value={form.pharmacistId}
                    onChange={(e) => { setForm((f) => ({ ...f, pharmacistId: e.target.value, customerId: '' })); setItems([emptyItem]); }}
                    className="h-10 w-full rounded-lg border border-line bg-bgprimary px-3 text-[14px] text-heading focus:border-accent focus:outline-none focus:ring-[3px] focus:ring-accent/10"
                  >
                    <option value="">Select pharmacist</option>
                    {pharmacists.map((p) => (
                      <option key={p._id} value={p._id}>{p.name}</option>
                    ))}
                  </select>
                  <span className="mt-1 block text-[11px] text-body">Bills are recorded against this pharmacist&apos;s sales & stock.</span>
                </div>
                )}
                <div>
                  <label className="mb-1.5 block text-[13px] font-medium text-heading">Customer *</label>
                  <select
                    value={form.customerId}
                    onChange={(e) => setForm((f) => ({ ...f, customerId: e.target.value }))}
                    className="h-10 w-full rounded-lg border border-line bg-bgprimary px-3 text-[14px] text-heading focus:border-accent focus:outline-none focus:ring-[3px] focus:ring-accent/10"
                  >
                    <option value="">Select customer</option>
                    {fallbackCustomers.map((c) => (
                      <option key={c._id} value={c._id}>{c.name} — {c.phoneNumber}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-[13px] font-medium text-heading">Payment Method *</label>
                  <select
                    value={form.paymentMethod}
                    onChange={(e) => setForm((f) => ({ ...f, paymentMethod: e.target.value }))}
                    className="h-10 w-full rounded-lg border border-line bg-bgprimary px-3 text-[14px] text-heading focus:border-accent focus:outline-none focus:ring-[3px] focus:ring-accent/10"
                  >
                    {PAY_METHODS.map((m) => (
                      <option key={m.value} value={m.value}>{m.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-[13px] font-medium text-heading">Discount (₹)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.discountAmount}
                    onChange={(e) => setForm((f) => ({ ...f, discountAmount: e.target.value }))}
                    className={inputCls}
                    placeholder="0.00"
                  />
                </div>
              </div>

              {/* Items */}
              <div className="px-6 pb-5">
                <div className="mb-2 flex items-center justify-between">
                  <label className="text-[13px] font-medium text-heading">Medicines *</label>
                  <button
                    onClick={addItemRow}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-accent/30 bg-accent/5 px-3 py-1.5 text-[12.5px] font-semibold text-accent transition-colors hover:bg-accent/10"
                  >
                    <Plus size={14} />
                    Add Medicine
                  </button>
                </div>

                {items.length === 0 && (
                  <div className="rounded-lg border border-dashed border-line px-4 py-8 text-center text-[13px] text-body">
                    No items yet — use "Add Medicine" to fill the bill.
                  </div>
                )}

                <div className="flex flex-col gap-3">
                  {items.map((it) => {
                    const m = itemDetail(it);
                    return (
                      <div
                        key={it.key}
                        className="grid grid-cols-12 items-end gap-3 rounded-xl border border-line bg-bgprimary/40 p-3"
                      >
                        <div className="col-span-12 sm:col-span-5">
                          <label className="mb-1 block text-[11px] font-medium text-body">Medicine</label>
                          <select
                            value={it.medicineId}
                            onChange={(e) => setItemField(it.key, 'medicineId', e.target.value)}
                            className="h-10 w-full rounded-lg border border-line bg-bgprimary px-3 text-[14px] text-heading focus:border-accent focus:outline-none focus:ring-[3px] focus:ring-accent/10"
                          >
                            <option value="">Select medicine</option>
                            {fallbackMedicines
                              .filter((x) => !selectedMedicines.has(x._id) || it.medicineId === x._id)
                              .map((x) => (
                                <option key={x._id} value={x._id}>
                                  {x.name} — stock {x.stock} · ₹{x.sellingPrice}
                                </option>
                              ))}
                          </select>
                          {m && (
                            <span className="mt-1 inline-flex items-center gap-1 text-[11px] text-body">
                              <Boxes size={12} className="text-accent" />
                              {m.genericName || m.company || ''} · GST {m.gst}% · Stock {m.stock}
                            </span>
                          )}
                        </div>

                        <div className="col-span-4 sm:col-span-2">
                          <label className="mb-1 block text-[11px] font-medium text-body">Qty</label>
                          <input
                            type="number"
                            min="1"
                            max={m?.stock || 99999}
                            value={it.quantity}
                            onChange={(e) => setItemField(it.key, 'quantity', e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                            className={inputCls}
                            placeholder="1"
                          />
                        </div>

                        <div className="col-span-5 sm:col-span-3">
                          <label className="mb-1 block text-[11px] font-medium text-body">Price (incl. GST)</label>
                          <div className="h-10 rounded-lg bg-bgsecondary/60 px-3 py-2.5 text-[13px] font-bold text-heading">
                            {inr(lineTotal(it))}
                          </div>
                        </div>

                        <div className="col-span-3 flex justify-end sm:col-span-2">
                          <button
                            onClick={() => removeItemRow(it.key)}
                            disabled={items.length === 1}
                            className="flex h-10 w-10 items-center justify-center rounded-lg text-body transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-30"
                            title="Remove item"
                          >
                            <X size={15} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {form.pharmacistId && items.some((it) => it.medicineId) && (
                  <div className="mt-1 text-[11.5px] text-body">
                    <span className="inline-flex items-center gap-1">
                      <Boxes size={13} className="text-accent" /> {fallbackMedicines.length} medicines available for selected pharmacist.
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="sticky bottom-0 flex flex-wrap items-center justify-between gap-3 border-t border-line bg-surface/95 px-6 py-4 backdrop-blur-md">
              <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-[14px]">
                <span className="text-body">Subtotal <span className="font-semibold text-heading">{inr(subtotal)}</span></span>
                <span className="text-body">Discount <span className="font-semibold text-red-500">− {inr(discountAmount)}</span></span>
                <span className="inline-flex items-center gap-2">
                  <span className="text-body">Grand Total</span>
                  <span className="text-[18px] font-bold text-heading">{inr(grandTotal)}</span>
                </span>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={() => setShowCreate(false)} className="h-10 rounded-lg border border-line bg-surface px-5 text-[14px] font-semibold text-heading transition-colors hover:bg-bgsecondary">
                  Cancel
                </button>
                <button
                  onClick={handleCreate}
                  disabled={creating}
                  className="inline-flex h-10 items-center gap-2 rounded-lg bg-accent px-6 text-[14px] font-semibold text-white transition-all hover:-translate-y-px hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {creating ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Receipt size={16} />
                      Create Bill
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW BILL MODAL / PRINT */}
      {viewId && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm print:hidden" onClick={() => setViewId(null)} />
          <div className="relative flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-2xl print:static print:max-h-none print:w-full print:overflow-visible print:rounded-none print:border-0 print:shadow-none">
            <div className="flex items-center justify-between border-b border-line bg-surface/95 px-6 py-4 backdrop-blur-md print:hidden">
              <h3 className="text-lg font-bold text-heading">Bill Details</h3>
              <button onClick={() => setViewId(null)} className="flex h-8 w-8 items-center justify-center rounded-lg text-body hover:bg-bgsecondary hover:text-heading">
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto print:overflow-visible">
              {detailLoading && (
                <div className="flex items-center justify-center gap-2 px-6 py-14 text-[14px] text-body print:hidden">
                  <Loader2 size={18} className="animate-spin text-accent" />
                  Loading bill...
                </div>
              )}

              {detailError && !detailLoading && (
                <div className="px-6 py-14 text-center text-[14px] text-red-600 print:hidden">{detailError}</div>
              )}

              {!detailLoading && detail && (
                <div className="px-6 py-5 print:px-0">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-dashed border-line pb-4">
                    <div className="flex items-center gap-3">
                      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent-soft text-accent print:hidden">
                        <Receipt size={22} />
                      </span>
                      <div>
                        <div className="font-display text-[15px] font-bold uppercase tracking-wide text-body">MedHeritage</div>
                        <div className="text-[17px] font-bold text-heading">{detail.bill?.invoiceNumber || '—'}</div>
                        <div className="text-[12px] text-body">{formatDateTime(detail.bill?.billDate || detail.bill?.createdAt)}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[11px] font-medium uppercase tracking-wide text-body">Grand Total</div>
                      <div className="text-[20px] font-bold text-accent">{inr(detail.bill?.grandTotal)}</div>
                      <div className="mt-0.5 inline-block rounded-full bg-bgsecondary px-2 py-0.5 text-[11px] font-semibold capitalize text-heading">
                        {detail.bill?.paymentMethod}
                      </div>
                    </div>
                  </div>

                  <div className={`mt-4 grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-line bg-line ${role === 'admin' ? 'sm:grid-cols-3' : 'sm:grid-cols-2'}`}>
                    <div className="flex flex-col gap-0.5 bg-surface px-4 py-3">
                      <span className="text-[11px] font-medium uppercase tracking-wide text-body">Customer</span>
                      <span className="text-[14px] font-semibold text-heading">{detail.bill?.customerName || detail.bill?.customer?.name || '—'}</span>
                      <span className="text-[11.5px] text-body">{detail.bill?.customerPhone || detail.bill?.customer?.phoneNumber || ''}</span>
                    </div>
                    <div className="flex flex-col gap-0.5 bg-surface px-4 py-3">
                      <span className="text-[11px] font-medium uppercase tracking-wide text-body">Cashier</span>
                      <span className="text-[14px] font-semibold text-heading">{detail.bill?.performedBy?.name || '—'}</span>
                    </div>
                    {role === 'admin' && (
                    <div className="flex flex-col gap-0.5 bg-surface px-4 py-3">
                      <span className="text-[11px] font-medium uppercase tracking-wide text-body">Pharmacist</span>
                      <span className="text-[14px] font-semibold text-heading">
                        {typeof detail.bill?.pharmacist === 'object' && detail.bill.pharmacist ? detail.bill.pharmacist.name || '—' : '—'}
                      </span>
                    </div>
                    )}
                  </div>

                  <h4 className="mt-5 mb-2 flex items-center gap-2 text-[13px] font-semibold text-heading">
                    <Boxes size={15} className="text-accent" />
                    Items ({detail.items?.length || 0})
                  </h4>
                  <div className="overflow-x-auto rounded-xl border border-line">
                    <table className="w-full text-left">
                      <thead className="border-b border-line bg-bgprimary/50">
                        <tr>
                          <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-body">Medicine</th>
                          <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-body hidden sm:table-cell">GST</th>
                          <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-body text-right">Qty</th>
                          <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-body text-right hidden md:table-cell">Price</th>
                          <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-body text-right">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-line">
                        {detail.items.map((it, i) => (
                          <tr key={i}>
                            <td className="px-4 py-3">
                              <span className="text-[13.5px] font-medium text-heading">{it.medicine?.name || '—'}</span>
                              <span className="block text-[11px] text-body">
                                {it.medicine?.genericName || ''} {it.medicine?.company ? `· ${it.medicine.company}` : ''}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-[12px] text-body hidden sm:table-cell">{it.gstPercentage ? `${it.gstPercentage}%` : '—'}</td>
                            <td className="px-4 py-3 text-right text-[13px] font-semibold text-heading">{it.quantity}</td>
                            <td className="px-4 py-3 text-right text-[13px] text-body hidden md:table-cell">{inr(it.price)}</td>
                            <td className="px-4 py-3 text-right text-[13px] font-bold text-heading">{inr(it.total)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="mt-4 flex flex-col items-end gap-1 border-t border-dashed border-line pt-4">
                    <div className="flex w-full max-w-xs items-center justify-between text-[13px]">
                      <span className="text-body">Subtotal</span>
                      <span className="font-semibold text-heading">{inr(detail.bill?.subtotal)}</span>
                    </div>
                    <div className="flex w-full max-w-xs items-center justify-between text-[13px]">
                      <span className="text-body">GST</span>
                      <span className="font-semibold text-heading">{inr(detail.bill?.gstAmount)}</span>
                    </div>
                    <div className="flex w-full max-w-xs items-center justify-between text-[13px]">
                      <span className="text-body">Discount</span>
                      <span className="font-semibold text-red-500">− {inr(detail.bill?.discountAmount)}</span>
                    </div>
                    <div className="flex w-full max-w-xs items-center justify-between border-t border-line pt-2">
                      <span className="text-[14px] font-semibold text-heading">Grand Total</span>
                      <span className="text-[18px] font-bold text-accent">{inr(detail.bill?.grandTotal)}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-6 py-4 print:hidden">
              <div id="print-trigger" />
              <span className="text-[12px] text-body">
                {detail?.bill?.customer?.rewardPoints !== undefined ? `Reward points: ${detail.bill.customer.rewardPoints}` : ''}
              </span>
              <div className="flex items-center gap-3">
                <button
                  onClick={handlePrint}
                  className="inline-flex h-10 items-center gap-2 rounded-lg border border-accent/30 bg-accent/5 px-5 text-[14px] font-semibold text-accent transition-colors hover:bg-accent/10"
                >
                  <Printer size={16} />
                  Print Bill
                </button>
                <button onClick={() => setViewId(null)} className="h-10 rounded-lg border border-line bg-surface px-5 text-[14px] font-semibold text-heading transition-colors hover:bg-bgsecondary">
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}