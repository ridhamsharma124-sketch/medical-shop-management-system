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
  ShoppingCart,
  Truck,
  UserCheck,
  Boxes,
  CalendarPlus,
  Trash2,
  IndianRupee,
  Loader2,
  ClipboardList,
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  fetchPurchaseOrdersList,
  fetchPurchaseOrderDetail,
  createNewPurchaseOrder,
  fetchAllPurchaseItems,
  clearPurchaseDetail,
  clearPurchaseItems,
} from '../../features/purchaseSlice';
import { fetchSuppliersList } from '../../features/supplierSlice';
import { fetchAllPharmacists } from '../../features/pharmacistSlice';
import { fetchMedicinesList } from '../../features/medicineSlice';

const formatDate = (d) => {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

const formatDateTime = (d) => {
  if (!d) return '—';
  return new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const inr = (n) => '₹' + Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const getPhName = (x) =>
  typeof x?.pharmacist === 'object' && x.pharmacist ? x.pharmacist.name || '—' : '—';

const emptyItem = { key: 1, medicineId: '', quantity: 1, purchasePrice: '' };

export default function PurchasesPage() {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);
  const role = 'pharmacist';
  const location = useLocation();
  const base = location.pathname.startsWith('/pharmacist') ? '/pharmacist' : '/admin';

  const { items: orders, loading, error: loadError, detail, detailLoading, detailError, creating } =
    useSelector((state) => state.purchases);
  const { purchaseItems, purchaseItemsLoading, purchaseItemsError } = useSelector((state) => state.purchases);
  const { items: suppliers } = useSelector((state) => state.suppliers);
  const { items: pharmacists } = useSelector((state) => state.pharmacists);
  const { items: medicines } = useSelector((state) => state.medicines);

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ supplierId: '', pharmacistId: '' });
  const [items, setItems] = useState([emptyItem]);
  const [itemSeq, setItemSeq] = useState(2);
  const [formError, setFormError] = useState('');
  const [viewId, setViewId] = useState(null);
  const [thisMonthOnly, setThisMonthOnly] = useState(false);
  const [itemsReportOpen, setItemsReportOpen] = useState(false);
  const [itemsSearch, setItemsSearch] = useState('');

  const loadData = useCallback(() => {
    dispatch(fetchPurchaseOrdersList({ role, params: { limit: 50 } }));
  }, [dispatch, role]);

  useEffect(() => {
    loadData();
    dispatch(fetchSuppliersList({ role, params: { limit: 200 } }));
    if (role === 'admin') dispatch(fetchAllPharmacists());
    dispatch(fetchMedicinesList({ role, params: { sort: 'newest', limit: 200 } }));
    return () => dispatch(clearPurchaseDetail());
  }, [loadData, dispatch, role]);

  const filtered = useMemo(() => {
    let list = [...orders];
    if (thisMonthOnly) {
      const now = new Date();
      list = list.filter((o) => {
        const d = new Date(o.createdAt);
        return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
      });
    }
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((o) =>
        o.orderNumber?.toLowerCase().includes(q) ||
        (o.supplier?.name || '').toLowerCase().includes(q) ||
        (typeof o.pharmacist === 'object' && o.pharmacist?.name || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [orders, search, thisMonthOnly]);

  const thisMonthCount = useMemo(() => {
    const now = new Date();
    return orders.filter((o) => {
      const d = new Date(o.createdAt);
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
    }).length;
  }, [orders]);

  const totalSpent = useMemo(() => orders.reduce((acc, o) => acc + (o.totalAmount || 0), 0), [orders]);

  const limit = 6;
  const totalPages = Math.max(Math.ceil(filtered.length / limit), 1);
  const paged = filtered.slice((page - 1) * limit, page * limit);

  const fallbackMedicines = useMemo(() => {
    const phId = form.pharmacistId;
    if (!phId) return medicines;
    return medicines.filter((m) => {
      const pid = typeof m.pharmacist === 'object' && m.pharmacist ? m.pharmacist._id : m.pharmacist;
      return pid === phId;
    });
  }, [medicines, form.pharmacistId]);

  const openCreate = () => {
    setForm({ supplierId: '', pharmacistId: role === 'admin' ? '' : user._id });
    setItems([emptyItem]);
    setItemSeq(2);
    setFormError('');
    setShowCreate(true);
  };

  const setItemField = (key, field, val) => {
    setItems((prev) => prev.map((it) => (it.key === key ? { ...it, [field]: val } : it)));
  };

  const addItemRow = () => {
    setItems((prev) => [...prev, { key: itemSeq, medicineId: '', quantity: 1, purchasePrice: '' }]);
    setItemSeq((s) => s + 1);
  };

  const removeItemRow = (key) => {
    setItems((prev) => prev.filter((it) => it.key !== key));
  };

  const selectedMedicines = new Set(items.map((it) => it.medicineId).filter(Boolean));

  const itemTotal = (it) => Number(it.quantity || 0) * Number(it.purchasePrice || 0);

  const grandTotal = useMemo(
    () => items.reduce((acc, it) => acc + itemTotal(it), 0),
    [items]
  );

  const handleCreate = async () => {
    setFormError('');
    if (!form.supplierId) {
      setFormError('Please select a supplier');
      toast.error('Please select a supplier');
      return;
    }
    if (role === 'admin' && !form.pharmacistId) {
      setFormError('Please select a pharmacist');
      toast.error('Please select a pharmacist');
      return;
    }
    const clean = items.filter((it) => it.medicineId);
    if (clean.length === 0) {
      setFormError('Add at least one medicine to the order');
      toast.error('Add at least one medicine to the order');
      return;
    }
    for (const it of clean) {
      if (!it.quantity || Number(it.quantity) < 1) {
        setFormError('Quantity must be at least 1 for each item');
        toast.error('Quantity must be at least 1 for each item');
        return;
      }
      if (it.purchasePrice === '' || Number(it.purchasePrice) < 0) {
        setFormError('Purchase price must be 0 or more for each item');
        toast.error('Purchase price must be 0 or more for each item');
        return;
      }
    }

    const payload = {
      supplier: form.supplierId,
      pharmacist: role === 'admin' ? form.pharmacistId : user._id,
      items: clean.map((it) => ({
        medicine: it.medicineId,
        quantity: Number(it.quantity),
        purchasePrice: Number(it.purchasePrice),
      })),
    };

    try {
      await dispatch(createNewPurchaseOrder({ role, payload })).unwrap();
      toast.success('Purchase order created — stock updated');
      setShowCreate(false);
      setForm({ supplierId: '', pharmacistId: role === 'admin' ? '' : user._id });
      setItems([emptyItem]);
      loadData();
    } catch (err) {
      const msg = typeof err === 'string' ? err : 'Failed to create purchase order';
      setFormError(msg);
      toast.error(msg);
    }
  };

  const openView = (id) => {
    setViewId(id);
    dispatch(fetchPurchaseOrderDetail({ role, id }));
  };

  const openItemsReport = () => {
    setItemsSearch('');
    dispatch(clearPurchaseItems());
    setItemsReportOpen(true);
    dispatch(fetchAllPurchaseItems({ role, params: { limit: 200 } }));
  };

  const reloadItemsReport = () => {
    dispatch(fetchAllPurchaseItems({ role, params: { search: itemsSearch || undefined, limit: 200 } }));
  };

  const itemsTotalSpent = useMemo(
    () => purchaseItems.reduce((acc, it) => acc + Number(it.total || 0), 0),
    [purchaseItems]
  );

  const inputCls =
    'h-10 w-full rounded-lg border border-line bg-bgprimary px-3.5 text-[14px] text-heading placeholder:text-[#B5A99A] focus:border-accent focus:outline-none focus:ring-[3px] focus:ring-accent/10';

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
            <h2 className="text-2xl font-bold text-heading md:text-3xl">Purchase Orders</h2>
            <p className="mt-1 text-[14px] text-body">Place medicine orders with suppliers — stock is updated automatically.</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={openItemsReport}
            className="inline-flex items-center gap-2 rounded-lgx border border-accent/30 bg-accent/5 px-5 py-2.5 text-[14px] font-semibold text-accent transition-colors hover:bg-accent/10"
          >
            <ClipboardList size={16} />
            Items Report
          </button>
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-2 rounded-lgx bg-accent px-5 py-2.5 text-[14px] font-semibold text-white transition-all hover:-translate-y-px hover:bg-accent-hover"
          >
            <Plus size={16} />
            New Purchase Order
          </button>
        </div>
      </div>

      {loadError && (
        <div className="flex items-center justify-between gap-3 rounded-lgx border border-red-200 bg-red-50 px-4 py-3 text-[13.5px] text-red-600">
          <span>{loadError}</span>
          <button onClick={loadData} className="shrink-0 rounded-lg px-3 py-1 text-[12px] font-bold text-red-600 transition-colors hover:bg-red-100">
            Retry
          </button>
        </div>
      )}

      {/* Summary */}
      <div className="flex flex-wrap items-center gap-2.5">
        <button
          onClick={() => { setThisMonthOnly(false); setPage(1); }}
          title="Show all orders"
          className={`inline-flex cursor-pointer items-center gap-2 rounded-lgx border px-4 py-2.5 transition-all hover:bg-bgsecondary ${
            !thisMonthOnly ? 'border-accent bg-accent/10' : 'border-line bg-surface'
          }`}
        >
          <ShoppingCart size={16} className="text-accent" />
          <span className="text-[13px] font-semibold text-heading">{loading ? '…' : orders.length}</span>
          <span className="text-[12px] text-body">Total Orders</span>
        </button>

        <button
          onClick={() => { setThisMonthOnly((o) => !o); setPage(1); }}
          title="Orders created this month"
          className={`inline-flex cursor-pointer items-center gap-2 rounded-lgx border px-4 py-2.5 transition-all hover:bg-bgsecondary ${
            thisMonthOnly ? 'border-accent bg-accent/10' : 'border-line bg-surface'
          }`}
        >
          <CalendarPlus size={16} className="text-mustard-deep" />
          <span className="text-[13px] font-semibold text-heading">{thisMonthCount}</span>
          <span className="text-[12px] text-body">This Month</span>
        </button>

        <span className={`inline-flex cursor-pointer items-center gap-2 rounded-lgx border px-4 py-2.5 ${loading ? 'border-line bg-surface' : 'border-line bg-surface'}`}>
          <IndianRupee size={16} className="text-emerald-600" />
          <span className="text-[13px] font-semibold text-heading">{loading ? '…' : inr(totalSpent)}</span>
          <span className="text-[12px] text-body">Total Spent</span>
        </span>
      </div>

      {/* Search */}
      <div className="relative w-full max-w-md">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-body" />
        <input
          type="text"
          placeholder={role === 'admin' ? 'Search by order number, supplier, pharmacist...' : 'Search by order number, supplier...'}
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="h-10 w-full rounded-lg border border-line bg-surface pl-10 pr-4 text-[14px] text-heading placeholder:text-[#B5A99A] transition-[border-color,box-shadow] focus:border-accent focus:outline-none focus:ring-[3px] focus:ring-accent/10"
        />
      </div>

      {/* Table */}
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
              <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.06em] text-body text-right">Total</th>
              <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.06em] text-body text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {loading && (
              <tr>
                <td colSpan={role === 'admin' ? 6 : 5} className="px-4 py-16 text-center text-[14px] text-body">Loading purchase orders...</td>
              </tr>
            )}
            {!loading && paged.length === 0 && (
              <tr>
                <td colSpan={role === 'admin' ? 6 : 5} className="px-4 py-16 text-center text-[14px] text-body">
                  <ShoppingCart size={36} className="mx-auto mb-3 text-line" />
                  No purchase orders found
                </td>
              </tr>
            )}
            {!loading && paged.map((o) => (
              <tr key={o._id} className="cursor-pointer transition-colors even:bg-bgprimary/35 hover:bg-bgprimary/60" onClick={() => openView(o._id)}>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-accent">
                      <ShoppingCart size={16} />
                    </span>
                    <div>
                      <span className="text-[14px] font-medium text-heading">{o.orderNumber}</span>
                      <span className="block text-[11px] text-body">{formatDate(o.createdAt)}</span>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-[13px] text-body hidden sm:table-cell">
                  <span className="inline-flex items-center gap-1.5">
                    <Truck size={14} className="text-accent" />
                    {o.supplier?.name || '—'}
                  </span>
                </td>
                {role === 'admin' && (
                <td className="px-4 py-3 hidden md:table-cell">
                  <span className="inline-flex items-center gap-1.5 text-[13px] text-body">
                    <UserCheck size={14} className="text-emerald-600" />
                    {getPhName(o)}
                  </span>
                </td>
                )}
                <td className="px-4 py-3 text-[13px] text-body hidden lg:table-cell">{formatDate(o.orderDate)}</td>
                <td className="px-4 py-3 text-right text-[14px] font-bold text-heading">{inr(o.totalAmount)}</td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <button
                      onClick={(e) => { e.stopPropagation(); openView(o._id); }}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-body transition-colors hover:bg-bgsecondary hover:text-heading"
                      title="View details"
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
        <div className="flex items-center justify-between">
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

      {/* CREATE MODAL */}
      {showCreate && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowCreate(false)} />
          <div className="relative flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-2xl">
            <div className="flex items-center justify-between border-b border-line bg-surface/95 px-6 py-4 backdrop-blur-md">
              <div>
                <h3 className="text-lg font-bold text-heading">New Purchase Order</h3>
                <p className="text-[12px] text-body">Select a supplier and add items — stock levels will be updated automatically.</p>
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
                <div>
                  <label className="mb-1.5 block text-[13px] font-medium text-heading">Supplier *</label>
                  <select
                    value={form.supplierId}
                    onChange={(e) => setForm((f) => ({ ...f, supplierId: e.target.value }))}
                    className="h-10 w-full rounded-lg border border-line bg-bgprimary px-3 text-[14px] text-heading focus:border-accent focus:outline-none focus:ring-[3px] focus:ring-accent/10"
                  >
                    <option value="">Select supplier</option>
                    {suppliers.map((s) => (
                      <option key={s._id} value={s._id}>{s.name}</option>
                    ))}
                  </select>
                </div>

                {role === 'admin' && (
                <div>
                  <label className="mb-1.5 block text-[13px] font-medium text-heading">Pharmacist *</label>
                  <select
                    value={form.pharmacistId}
                    onChange={(e) => setForm((f) => ({ ...f, pharmacistId: e.target.value }))}
                    className="h-10 w-full rounded-lg border border-line bg-bgprimary px-3 text-[14px] text-heading focus:border-accent focus:outline-none focus:ring-[3px] focus:ring-accent/10"
                  >
                    <option value="">Select pharmacist</option>
                    {pharmacists.map((p) => (
                      <option key={p._id} value={p._id}>{p.name}</option>
                    ))}
                  </select>
                  <span className="mt-1 block text-[11px] text-body">Medicines will be assigned to the selected pharmacist — their stock will be updated accordingly.</span>
                </div>
              )}
              </div>

              {/* Items */}
              <div className="px-6 pb-5">
                <div className="mb-2 flex items-center justify-between">
                  <label className="text-[13px] font-medium text-heading">Items *</label>
                  <button
                    onClick={addItemRow}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-accent/30 bg-accent/5 px-3 py-1.5 text-[12.5px] font-semibold text-accent transition-colors hover:bg-accent/10"
                  >
                    <Plus size={14} />
                    Add Item
                  </button>
                </div>

                {items.length === 0 && (
                  <div className="rounded-lg border border-dashed border-line px-4 py-8 text-center text-[13px] text-body">
                    No items yet — use "Add Item" to include medicines in this order.
                  </div>
                )}

                <div className="flex flex-col gap-3">
                  {items.map((it) => (
                    <div
                      key={it.key}
                      className="grid grid-cols-12 items-end gap-3 rounded-xl border border-line bg-bgprimary/40 p-3"
                    >
                      <div className="col-span-12 sm:col-span-4">
                        <label className="mb-1 block text-[11px] font-medium text-body">Medicine</label>
                        <select
                          value={it.medicineId}
                          onChange={(e) => setItemField(it.key, 'medicineId', e.target.value)}
                          className="h-10 w-full rounded-lg border border-line bg-bgprimary px-3 text-[14px] text-heading focus:border-accent focus:outline-none focus:ring-[3px] focus:ring-accent/10"
                        >
                          <option value="">Select medicine</option>
                          {fallbackMedicines
                            .filter((m) => !selectedMedicines.has(m._id) || it.medicineId === m._id)
                            .map((m) => (
                              <option key={m._id} value={m._id}>
                                {m.name} — stock {m.stock}
                              </option>
                            ))}
                        </select>
                      </div>

                      <div className="col-span-6 sm:col-span-2">
                        <label className="mb-1 block text-[11px] font-medium text-body">Quantity</label>
                        <input
                          type="number"
                          min="1"
                          value={it.quantity}
                          onChange={(e) => setItemField(it.key, 'quantity', e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                          className={inputCls}
                          placeholder="1"
                        />
                      </div>

                      <div className="col-span-6 sm:col-span-3">
                        <label className="mb-1 block text-[11px] font-medium text-body">Purchase Price</label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={it.purchasePrice}
                          onChange={(e) => setItemField(it.key, 'purchasePrice', e.target.value)}
                          className={inputCls}
                          placeholder="0.00"
                        />
                      </div>

                      <div className="col-span-10 sm:col-span-2">
                        <div className="mb-1 hidden text-[11px] font-medium text-body sm:block">Line Total</div>
                        <div className="h-10 rounded-lg bg-bgsecondary/60 px-3 py-2.5 text-[13px] font-bold text-heading">
                          {inr(itemTotal(it))}
                        </div>
                      </div>

                      <div className="col-span-2 flex justify-end sm:col-span-1">
                        <button
                          onClick={() => removeItemRow(it.key)}
                          disabled={items.length === 1}
                          className="flex h-10 w-10 items-center justify-center rounded-lg text-body transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-30"
                          title="Remove item"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  ))}
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
              <div className="flex items-center gap-2 text-[14px]">
                <span className="text-body">Order Total</span>
                <span className="text-[18px] font-bold text-heading">{inr(grandTotal)}</span>
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
                      <ShoppingCart size={16} />
                      Create Order
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW DETAIL MODAL */}
      {viewId && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setViewId(null)} />
          <div className="relative flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-2xl">
            <div className="flex items-center justify-between border-b border-line bg-surface/95 px-6 py-4 backdrop-blur-md">
              <h3 className="text-lg font-bold text-heading">Purchase Order Details</h3>
              <button onClick={() => setViewId(null)} className="flex h-8 w-8 items-center justify-center rounded-lg text-body hover:bg-bgsecondary hover:text-heading">
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {detailLoading && (
                <div className="flex items-center justify-center gap-2 px-6 py-14 text-[14px] text-body">
                  <Loader2 size={18} className="animate-spin text-accent" />
                  Loading order...
                </div>
              )}

              {detailError && !detailLoading && (
                <div className="px-6 py-14 text-center text-[14px] text-red-600">{detailError}</div>
              )}

              {!detailLoading && detail && (
                <div className="px-6 py-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent-soft text-accent">
                        <ShoppingCart size={22} />
                      </span>
                      <div>
                        <div className="text-[17px] font-bold text-heading">{detail.order?.orderNumber || '—'}</div>
                        <div className="text-[12px] text-body">{formatDateTime(detail.order?.createdAt)}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[11px] font-medium uppercase tracking-wide text-body">Total Amount</div>
                      <div className="text-[20px] font-bold text-accent">{inr(detail.order?.totalAmount)}</div>
                    </div>
                  </div>

                  <div className={`mt-5 grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-line bg-line ${role === 'admin' ? 'sm:grid-cols-3' : 'sm:grid-cols-2'}`}>
                    <div className="flex flex-col gap-0.5 bg-surface px-4 py-3">
                      <span className="text-[11px] font-medium uppercase tracking-wide text-body">Supplier</span>
                      <span className="text-[14px] font-semibold text-heading">{detail.order?.supplier?.name || '—'}</span>
                      <span className="text-[11.5px] text-body">{detail.order?.supplier?.contactNumber || ''}</span>
                    </div>
                    {role === 'admin' && (
                    <div className="flex flex-col gap-0.5 bg-surface px-4 py-3">
                      <span className="text-[11px] font-medium uppercase tracking-wide text-body">Pharmacist</span>
                      <span className="text-[14px] font-semibold text-heading">
                        {typeof detail.order?.pharmacist === 'object' && detail.order.pharmacist ? detail.order.pharmacist.name || '—' : '—'}
                      </span>
                    </div>
                    )}
                    <div className="flex flex-col gap-0.5 bg-surface px-4 py-3">
                      <span className="text-[11px] font-medium uppercase tracking-wide text-body">Created By</span>
                      <span className="text-[14px] font-semibold text-heading">{detail.order?.performedBy?.name || '—'}</span>
                    </div>
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
                          <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-body hidden sm:table-cell">Batch</th>
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
                            <td className="px-4 py-3 text-[12px] font-mono text-body hidden sm:table-cell">{it.medicine?.batch || '—'}</td>
                            <td className="px-4 py-3 text-right text-[13px] font-semibold text-heading">{it.quantity}</td>
                            <td className="px-4 py-3 text-right text-[13px] text-body hidden md:table-cell">{inr(it.purchasePrice)}</td>
                            <td className="px-4 py-3 text-right text-[13px] font-bold text-heading">{inr(it.total)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end border-t border-line px-6 py-4">
              <button onClick={() => setViewId(null)} className="h-10 rounded-lg border border-line bg-surface px-5 text-[14px] font-semibold text-heading transition-colors hover:bg-bgsecondary">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ITEMS REPORT MODAL */}
      {itemsReportOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => { setItemsReportOpen(false); dispatch(clearPurchaseItems()); }} />
          <div className="relative flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-2xl">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-surface/95 px-6 py-4 backdrop-blur-md">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-soft text-accent">
                  <ClipboardList size={17} />
                </span>
                <div>
                  <h3 className="text-lg font-bold text-heading">Purchase Items Report</h3>
                  <p className="text-[12px] text-body">Every item from every order displayed line by line — comprehensive purchase report.</p>
                </div>
              </div>
              <button onClick={() => { setItemsReportOpen(false); dispatch(clearPurchaseItems()); }} className="flex h-8 w-8 items-center justify-center rounded-lg text-body hover:bg-bgsecondary hover:text-heading">
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-5">
              {purchaseItemsError && (
                <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-[13px] font-medium text-red-600">
                  {purchaseItemsError}
                </div>
              )}

              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div className="relative w-full max-w-sm">
                  <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-body" />
                  <input
                    type="text"
                    placeholder="Search by medicine name..."
                    value={itemsSearch}
                    onChange={(e) => setItemsSearch(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') reloadItemsReport(); }}
                    className="h-10 w-full rounded-lg border border-line bg-surface pl-10 pr-4 text-[14px] text-heading placeholder:text-[#B5A99A] transition-[border-color,box-shadow] focus:border-accent focus:outline-none focus:ring-[3px] focus:ring-accent/10"
                  />
                </div>
                <button
                  onClick={reloadItemsReport}
                  disabled={purchaseItemsLoading}
                  className="inline-flex items-center gap-2 rounded-lg border border-accent/30 bg-accent/5 px-4 py-2 text-[13px] font-semibold text-accent transition-colors hover:bg-accent/10 disabled:opacity-60"
                >
                  <Search size={14} />
                  Search
                </button>
              </div>

              {purchaseItemsLoading && (
                <div className="flex items-center justify-center gap-2 py-14 text-[14px] text-body">
                  <Loader2 size={18} className="animate-spin text-accent" />
                  Loading items...
                </div>
              )}

              {!purchaseItemsLoading && !purchaseItemsError && (
                <>
                  <div className="mb-3 rounded-xl border border-line bg-bgprimary/50 px-4 py-3">
                    <span className="text-[11px] font-medium uppercase tracking-wide text-body">Total Items</span>
                    <span className="ml-2 text-[15px] font-bold text-heading">{purchaseItems.length}</span>
                    <span className="ml-6 text-[11px] font-medium uppercase tracking-wide text-body">Total Value</span>
                    <span className="ml-2 text-[15px] font-bold text-emerald-600">{inr(itemsTotalSpent)}</span>
                  </div>

                  {purchaseItems.length === 0 && (
                    <div className="py-14 text-center text-[14px] text-body">
                      <ClipboardList size={36} className="mx-auto mb-3 text-line" />
                      No purchase items found
                    </div>
                  )}

                  {purchaseItems.length > 0 && (
                    <div className="overflow-x-auto rounded-xl border border-line">
                      <table className="w-full text-left">
                        <thead className="border-b border-line bg-bgprimary/50">
                          <tr>
                            <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-body">Medicine</th>
                            <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-body hidden sm:table-cell">Order No.</th>
                            <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-body hidden md:table-cell">Supplier</th>
                            {role === 'admin' && (
                            <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-body hidden lg:table-cell">Pharmacist</th>
                            )}
                            <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-body text-right">Qty</th>
                            <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-body text-right hidden md:table-cell">Price</th>
                            <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-body text-right">Total</th>
                            <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-body hidden lg:table-cell">Date</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-line">
                          {purchaseItems.map((it) => (
                            <tr key={it._id} className="transition-colors even:bg-bgprimary/35 hover:bg-bgprimary/60">
                              <td className="px-4 py-3">
                                <span className="text-[13.5px] font-medium text-heading">{it.medicine?.name || '—'}</span>
                                <span className="block text-[11px] text-body">
                                  {it.medicine?.genericName || ''} {it.medicine?.batch ? `· ${it.medicine.batch}` : ''}
                                </span>
                              </td>
                              <td className="px-4 py-3 hidden sm:table-cell">
                                <span className="text-[12.5px] font-mono text-body">{it.order?.orderNumber || '—'}</span>
                              </td>
                              <td className="px-4 py-3 hidden md:table-cell">
                                <span className="text-[13px] text-body">{it.supplier?.name || '—'}</span>
                              </td>
                              {role === 'admin' && (
                              <td className="px-4 py-3 hidden lg:table-cell">
                                <span className="text-[13px] text-body">
                                  {typeof it.pharmacist === 'object' && it.pharmacist ? it.pharmacist.name : '—'}
                                </span>
                              </td>
                              )}
                              <td className="px-4 py-3 text-right text-[13px] font-semibold text-heading">{it.quantity}</td>
                              <td className="px-4 py-3 text-right text-[13px] text-body hidden md:table-cell">{inr(it.purchasePrice)}</td>
                              <td className="px-4 py-3 text-right text-[13px] font-bold text-heading">{inr(it.total)}</td>
                              <td className="px-4 py-3 hidden lg:table-cell">
                                <span className="text-[12px] text-body">{formatDate(it.createdAt)}</span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="flex items-center justify-end border-t border-line px-6 py-4">
              <button
                onClick={() => { setItemsReportOpen(false); dispatch(clearPurchaseItems()); }}
                className="h-10 rounded-lg border border-line bg-surface px-5 text-[14px] font-semibold text-heading transition-colors hover:bg-bgsecondary"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}