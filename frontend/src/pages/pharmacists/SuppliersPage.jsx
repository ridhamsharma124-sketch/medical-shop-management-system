import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  Plus,
  Search,
  ArrowLeft,
  Eye,
  Edit2,
  Trash2,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Truck,
  AlertTriangle,
  UserCheck,
  CalendarPlus,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { fetchSuppliersList, fetchSupplierDetail, createNewSupplier, updateExistingSupplier, deleteExistingSupplier } from '../../features/supplierSlice';
import { fetchAllPharmacists } from '../../features/pharmacistSlice';
import { fetchSupplierPurchasesList, clearSupplierPurchases } from '../../features/purchaseSlice';
import { ShoppingCart, Loader2 } from 'lucide-react';

const emptySupplier = {
  name: '', contactNumber: '', email: '', address: '', gstNumber: '', pharmacistId: '',
};

const avatarColors = [
  'bg-accent-soft text-accent',
  'bg-mustard-soft text-mustard-deep',
  'bg-olive-soft text-olive-deep',
  'bg-berry-soft text-berry-deep',
  'bg-bgsecondary text-heading',
];

const getInitials = (name) =>
  name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

const getAvatarColor = (name) =>
  avatarColors[name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % avatarColors.length];

const formatDate = (d) => {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

const inr = (n) => '₹' + Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const getSupplierPharmacist = (s) => {
  if (typeof s?.pharmacist === 'object' && s.pharmacist) {
    return { _id: s.pharmacist._id, name: s.pharmacist.name || '—' };
  }
  return { _id: s?.pharmacist || '', name: '' };
};

const validateForm = (f, role) => {
  if (!f.name.trim()) return 'Supplier name is required';
  if (!f.contactNumber.trim()) return 'Contact number is required';
  if (!/^[0-9]{10}$/.test(f.contactNumber)) return 'Contact number must be 10 digits';
  if (!f.email.trim()) return 'Email is required';
  if (!/^\S+@\S+\.\S+$/.test(f.email)) return 'Please provide a valid email';
  if (!f.address.trim()) return 'Address is required';
  if (!f.gstNumber.trim()) return 'GST number is required';
  if (!/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(f.gstNumber.toUpperCase())) {
    return 'Please provide a valid GST number (e.g. 24AAMCS1234F1Z7)';
  }
  if (role === 'admin' && !f.pharmacistId) return 'Please select a pharmacist';
  return '';
};

export default function SuppliersPage() {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);
  const role = 'pharmacist';
  const location = useLocation();
  const base = location.pathname.startsWith('/pharmacist') ? '/pharmacist' : '/admin';

  const { items: suppliers, loading, error: loadError, detail: supplierDetail, detailLoading, detailError } = useSelector((state) => state.suppliers);
  const { items: pharmacists } = useSelector((state) => state.pharmacists);
  const {
    supplierPurchases,
    supplierPurchasesLoading,
    supplierPurchasesError,
  } = useSelector((state) => state.purchases);

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(null);
  const [form, setForm] = useState(emptySupplier);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [viewId, setViewId] = useState(null);
  const [purchaseView, setPurchaseView] = useState(false);
  const [phFilter, setPhFilter] = useState('all');
  const [monthOnly, setMonthOnly] = useState(false);
  const [phMenuOpen, setPhMenuOpen] = useState(false);
  const phMenuRef = useRef(null);

  const loadData = useCallback(() => {
    dispatch(fetchSuppliersList({ role, params: { limit: 200 } }));
  }, [dispatch, role]);

  useEffect(() => {
    loadData();
    if (role === 'admin') dispatch(fetchAllPharmacists());
  }, [loadData, dispatch, role]);

  useEffect(() => {
    if (viewId) dispatch(fetchSupplierDetail({ role, id: viewId }));
  }, [viewId, role, dispatch]);

  useEffect(() => {
    if (!phMenuOpen) return undefined;
    const handler = (e) => {
      if (phMenuRef.current && !phMenuRef.current.contains(e.target)) setPhMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [phMenuOpen]);

  const filtered = useMemo(() => {
    let list = [...suppliers];

    if (phFilter !== 'all') {
      list = list.filter((s) => getSupplierPharmacist(s)._id === phFilter);
    }

    if (monthOnly) {
      const now = new Date();
      list = list.filter((s) => {
        if (!s.createdAt) return false;
        const d = new Date(s.createdAt);
        return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
      });
    }

    if (search) {
      const q = search.toLowerCase();
      list = list.filter((s) =>
        s.name.toLowerCase().includes(q) ||
        s.contactNumber.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q) ||
        s.gstNumber.toLowerCase().includes(q) ||
        s.address.toLowerCase().includes(q) ||
        (getSupplierPharmacist(s).name || '').toLowerCase().includes(q)
      );
    }

    return list;
  }, [suppliers, search, phFilter, monthOnly]);

  const thisMonthCount = useMemo(() => {
    const now = new Date();
    return suppliers.filter((s) => {
      if (!s.createdAt) return false;
      const d = new Date(s.createdAt);
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
    }).length;
  }, [suppliers]);

  const distinctPharmacistCount = useMemo(
    () => new Set(suppliers.map((s) => getSupplierPharmacist(s)._id).filter(Boolean)).size,
    [suppliers]
  );

  const limit = 5;
  const totalPages = Math.max(Math.ceil(filtered.length / limit), 1);
  const paged = filtered.slice((page - 1) * limit, page * limit);

  const setField = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const handleOpenAdd = () => {
    setForm({ ...emptySupplier, pharmacistId: role === 'admin' ? '' : user._id });
    setFormError('');
    setShowModal('add');
  };

  const handleOpenEdit = (s) => {
    const ph = getSupplierPharmacist(s);
    setForm({
      name: s.name,
      contactNumber: s.contactNumber,
      email: s.email,
      address: s.address,
      gstNumber: s.gstNumber,
      pharmacistId: role === 'admin' ? (ph._id || '') : user._id,
    });
    setFormError('');
    setShowModal(s._id);
  };

  const handleSave = async () => {
    setFormError('');
    const error = validateForm(form, role);
    if (error) {
      setFormError(error);
      toast.error(error);
      return;
    }

    const payload = {
      name: form.name.trim(),
      contactNumber: form.contactNumber,
      email: form.email.trim().toLowerCase(),
      address: form.address.trim(),
      gstNumber: form.gstNumber.toUpperCase(),
      pharmacist: role === 'admin' ? form.pharmacistId : user._id,
    };

    setSaving(true);
    try {
      if (showModal === 'add') {
        await dispatch(createNewSupplier({ role, payload })).unwrap();
        toast.success('Supplier added successfully');
      } else {
        await dispatch(updateExistingSupplier({ role, id: showModal, payload })).unwrap();
        toast.success('Supplier updated successfully');
      }
      setShowModal(null);
      setForm(emptySupplier);
    } catch (err) {
      const msg = typeof err === 'string' ? err : 'Failed to save supplier';
      setFormError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await dispatch(deleteExistingSupplier({ role, id: deleteId })).unwrap();
      toast.success('Supplier deleted successfully');
      setDeleteId(null);
    } catch (err) {
      toast.error(typeof err === 'string' ? err : 'Failed to delete supplier');
      setDeleteId(null);
    } finally {
      setDeleting(false);
    }
  };

  const pharmacistName = (id) => pharmacists.find((p) => p._id === id)?.name || '—';
  const displayPharmacistName = (s) => {
    const ph = getSupplierPharmacist(s);
    if (ph.name) return ph.name;
    return pharmacistName(ph._id);
  };

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
            <h2 className="text-2xl font-bold text-heading md:text-3xl">Supplier Management</h2>
            <p className="mt-1 text-[14px] text-body">Manage medicine suppliers linked to pharmacists.</p>
          </div>
        </div>
        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 rounded-lgx bg-accent px-5 py-2.5 text-[14px] font-semibold text-white transition-all hover:-translate-y-px hover:bg-accent-hover"
        >
          <Plus size={16} />
          Add Supplier
        </button>
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
          onClick={() => { setPhFilter('all'); setMonthOnly(false); setPage(1); }}
          title="Show all suppliers"
          className={`inline-flex cursor-pointer items-center gap-2 rounded-lgx border px-4 py-2.5 transition-all hover:bg-bgsecondary ${
            phFilter === 'all' && !monthOnly ? 'border-accent bg-accent/10' : 'border-line bg-surface'
          }`}
        >
          <Truck size={16} className="text-accent" />
          <span className="text-[13px] font-semibold text-heading">{loading ? '…' : suppliers.length}</span>
          <span className="text-[12px] text-body">Total Suppliers</span>
        </button>

        {role === 'admin' && (
        <div className="relative" ref={phMenuRef}>
          <button
            onClick={() => setPhMenuOpen((o) => !o)}
            title="Filter by pharmacist"
            className={`inline-flex cursor-pointer items-center gap-2 rounded-lgx border px-4 py-2.5 transition-all hover:bg-bgsecondary ${
              phFilter !== 'all' ? 'border-accent bg-accent/10' : 'border-line bg-surface'
            }`}
          >
            <UserCheck size={16} className="text-emerald-600" />
            <span className="text-[13px] font-semibold text-heading">{loading ? '…' : distinctPharmacistCount}</span>
            <span className="text-[12px] text-body">Pharmacists</span>
            <ChevronDown size={14} className={`text-body transition-transform ${phMenuOpen ? 'rotate-180' : ''}`} />
          </button>

          {phMenuOpen && (
            <div className="absolute left-0 top-full z-30 mt-2 w-64 overflow-hidden rounded-xl border border-line bg-surface shadow-2xl">
              <button
                onClick={() => { setPhFilter('all'); setPhMenuOpen(false); setPage(1); }}
                className={`flex w-full items-center justify-between px-4 py-2.5 text-left text-[13px] font-medium transition-colors hover:bg-bgsecondary ${
                  phFilter === 'all' ? 'bg-accent/10 text-accent' : 'text-heading'
                }`}
              >
                All Pharmacists
                <span className="text-[12px] font-semibold text-body">{loading ? '…' : suppliers.length}</span>
              </button>
              {pharmacists.map((p) => {
                const active = phFilter === p._id;
                const count = suppliers.filter((s) => getSupplierPharmacist(s)._id === p._id).length;
                return (
                  <button
                    key={p._id}
                    onClick={() => { setPhFilter(p._id); setPhMenuOpen(false); setPage(1); }}
                    className={`flex w-full items-center justify-between border-t border-line px-4 py-2.5 text-left text-[13px] font-medium transition-colors hover:bg-bgsecondary ${
                      active ? 'bg-accent/10 text-accent' : 'text-heading'
                    }`}
                  >
                    {p.name}
                    <span className="text-[12px] font-semibold text-body">{count}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
        )}

        <button
          onClick={() => { setMonthOnly((o) => !o); setPage(1); }}
          title="Suppliers added this month"
          className={`inline-flex cursor-pointer items-center gap-2 rounded-lgx border px-4 py-2.5 transition-all hover:bg-bgsecondary ${
            monthOnly ? 'border-accent bg-accent/10' : 'border-line bg-surface'
          }`}
        >
          <CalendarPlus size={16} className="text-mustard-deep" />
          <span className="text-[13px] font-semibold text-heading">{thisMonthCount}</span>
          <span className="text-[12px] text-body">This Month</span>
        </button>
      </div>

      {/* Search */}
      <div className="relative w-full max-w-md">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-body" />
        <input
          type="text"
          placeholder={role === 'admin' ? 'Search by name, phone, email, GST, pharmacist...' : 'Search by name, phone, email, GST...'}
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
              <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.06em] text-body">Supplier Name</th>
              <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.06em] text-body hidden sm:table-cell">Contact</th>
              <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.06em] text-body hidden md:table-cell">Email</th>
              <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.06em] text-body hidden lg:table-cell">GST Number</th>
              {role === 'admin' && (
              <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.06em] text-body hidden lg:table-cell">Pharmacist</th>
              )}
              <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.06em] text-body text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {loading && (
              <tr>
                <td colSpan={role === 'admin' ? 6 : 5} className="px-4 py-16 text-center text-[14px] text-body">Loading suppliers...</td>
              </tr>
            )}
            {!loading && paged.length === 0 && (
              <tr>
                <td colSpan={role === 'admin' ? 6 : 5} className="px-4 py-16 text-center text-[14px] text-body">
                  <Truck size={36} className="mx-auto mb-3 text-line" />
                  No suppliers found
                </td>
              </tr>
            )}
            {!loading && paged.map((s) => (
              <tr key={s._id} className="transition-colors even:bg-bgprimary/35 hover:bg-bgprimary/60">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[12px] font-bold ${getAvatarColor(s.name)}`}>
                      {getInitials(s.name)}
                    </span>
                    <div>
                      <span className="text-[14px] font-medium text-heading">{s.name}</span>
                      <span className="block text-[11px] text-body">{formatDate(s.createdAt)}</span>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-[13px] font-mono text-body hidden sm:table-cell">{s.contactNumber}</td>
                <td className="px-4 py-3 text-[13px] text-body hidden md:table-cell">{s.email}</td>
                <td className="px-4 py-3 text-[13px] font-mono text-body hidden lg:table-cell">{s.gstNumber}</td>
                {role === 'admin' && (
                <td className="px-4 py-3 hidden lg:table-cell">
                  <span className="inline-flex items-center gap-1.5 text-[13px] text-body">
                    <UserCheck size={14} className="text-accent" />
                    {displayPharmacistName(s)}
                  </span>
                </td>
                )}
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <button
                      onClick={() => setViewId(s._id)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-body transition-colors hover:bg-bgsecondary hover:text-heading"
                      title="View details"
                    >
                      <Eye size={15} />
                    </button>
                    <button
                      onClick={() => handleOpenEdit(s)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-body transition-colors hover:bg-bgsecondary hover:text-heading"
                      title="Edit"
                    >
                      <Edit2 size={15} />
                    </button>
                    <button
                      onClick={() => setDeleteId(s._id)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-body transition-colors hover:bg-red-50 hover:text-red-600"
                      title="Delete"
                    >
                      <Trash2 size={15} />
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

      {/* ADD / EDIT MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowModal(null)} />
          <div className="relative w-full max-w-[760px] max-h-[90vh] overflow-y-auto rounded-2xl border border-line bg-surface shadow-2xl">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-line bg-surface/95 px-6 py-4 backdrop-blur-md">
              <h3 className="text-lg font-bold text-heading">{showModal === 'add' ? 'Add Supplier' : 'Edit Supplier'}</h3>
              <button onClick={() => setShowModal(null)} className="flex h-8 w-8 items-center justify-center rounded-lg text-body hover:bg-bgsecondary hover:text-heading">
                <X size={18} />
              </button>
            </div>

            {formError && (
              <div className="mx-6 mt-4 rounded-lg bg-red-50 px-4 py-3 text-[13px] font-medium text-red-600">
                {formError}
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 px-6 py-5 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-[13px] font-medium text-heading">Supplier Name *</label>
                <input
                  value={form.name}
                  onChange={(e) => setField('name', e.target.value)}
                  className={inputCls}
                  placeholder="e.g. MedSupply Co."
                />
              </div>

              {role === 'admin' && (
              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-[13px] font-medium text-heading">Pharmacist *</label>
                <select
                  value={form.pharmacistId}
                  onChange={(e) => setField('pharmacistId', e.target.value)}
                  className="h-10 w-full rounded-lg border border-line bg-bgprimary px-3 text-[14px] text-heading focus:border-accent focus:outline-none focus:ring-[3px] focus:ring-accent/10"
                >
                  <option value="">Select pharmacist</option>
                  {pharmacists.map((p) => (
                    <option key={p._id} value={p._id}>{p.name}</option>
                  ))}
                </select>
              </div>
            )}

              <div>
                <label className="mb-1.5 block text-[13px] font-medium text-heading">Contact Number *</label>
                <input
                  value={form.contactNumber}
                  onChange={(e) => setField('contactNumber', e.target.value.replace(/[^0-9]/g, '').slice(0, 10))}
                  className={inputCls}
                  placeholder="10-digit number e.g. 9876543210"
                  inputMode="numeric"
                />
                <span className="mt-1 block text-[11px] text-body">Exactly 10 digits, no +91</span>
              </div>

              <div>
                <label className="mb-1.5 block text-[13px] font-medium text-heading">Email *</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setField('email', e.target.value)}
                  className={inputCls}
                  placeholder="supplier@example.com"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-[13px] font-medium text-heading">GST Number *</label>
                <input
                  value={form.gstNumber}
                  onChange={(e) => setField('gstNumber', e.target.value.toUpperCase().slice(0, 15))}
                  className={`${inputCls} font-mono`}
                  placeholder="e.g. 24AAMCS1234F1Z7"
                />
                <span className="mt-1 block text-[11px] text-body">Format: 2 digits, 5 letters, 4 digits, 1 letter, 1 alphanumeric, Z, 1 alphanumeric</span>
              </div>

              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-[13px] font-medium text-heading">Address *</label>
                <textarea
                  value={form.address}
                  onChange={(e) => setField('address', e.target.value)}
                  rows={3}
                  className="w-full rounded-lg border border-line bg-bgprimary px-3.5 py-2.5 text-[14px] text-heading placeholder:text-[#B5A99A] focus:border-accent focus:outline-none focus:ring-[3px] focus:ring-accent/10"
                  placeholder="e.g. Plot 21, GIDC Estate, Vatva, Ahmedabad, Gujarat 382445"
                />
              </div>
            </div>

            <div className="sticky bottom-0 flex items-center justify-end gap-3 border-t border-line bg-surface/95 px-6 py-4 backdrop-blur-md">
              <button onClick={() => setShowModal(null)} className="h-10 rounded-lg border border-line bg-surface px-5 text-[14px] font-semibold text-heading transition-colors hover:bg-bgsecondary">
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="h-10 rounded-lg bg-accent px-6 text-[14px] font-semibold text-white transition-all hover:-translate-y-px hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? 'Saving...' : showModal === 'add' ? 'Add Supplier' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VIEW DETAIL MODAL */}
      {viewId && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setViewId(null)} />
          <div className="relative w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-2xl border border-line bg-surface shadow-2xl">
            <div className="flex items-center justify-between border-b border-line px-6 py-4">
              <h3 className="text-lg font-bold text-heading">Supplier Details</h3>
              <button onClick={() => setViewId(null)} className="flex h-8 w-8 items-center justify-center rounded-lg text-body hover:bg-bgsecondary hover:text-heading">
                <X size={18} />
              </button>
            </div>

            {detailError && !detailLoading && (
              <div className="px-6 pt-5">
                <div className="rounded-lg bg-red-50 px-4 py-3 text-[13px] font-medium text-red-600">{detailError}</div>
              </div>
            )}

            {detailLoading && (
              <div className="flex items-center justify-center gap-2 py-16 text-[14px] text-body">
                <Loader2 size={18} className="animate-spin text-accent" />
                Loading supplier details...
              </div>
            )}

            {!detailLoading && !detailError && supplierDetail && (() => {
              const s = supplierDetail;
              const rows = [
                { label: 'Contact Number', value: s.contactNumber },
                { label: 'Email', value: s.email },
                { label: 'GST Number', value: s.gstNumber },
                { label: 'Pharmacist', value: displayPharmacistName(s) },
                { label: 'Address', value: s.address || '—' },
                { label: 'Added On', value: formatDate(s.createdAt) },
              ];
              return (
                <>
                  <div className="px-6 pt-5">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent-soft text-accent">
                          <Truck size={22} />
                        </span>
                        <div>
                          <div className="text-[17px] font-bold text-heading">{s.name}</div>
                          <div className="text-[12px] font-mono text-body">GST {s.gstNumber}</div>
                        </div>
                      </div>
                      <span className="shrink-0 rounded-lg bg-emerald-50 px-2 py-1 text-[12px] font-semibold text-emerald-600">
                        Active
                      </span>
                    </div>
                  </div>

                  <div className="px-6 py-5">
                    <div className="grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-2">
                      {rows.map((r) => (
                        <div key={r.label} className="flex flex-col gap-0.5 bg-surface px-4 py-3">
                          <span className="text-[11px] font-medium uppercase tracking-wide text-body">{r.label}</span>
                          <span className="text-[14px] font-semibold text-heading">{r.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              );
            })()}

            <div className="flex items-center justify-end gap-3 border-t border-line px-6 py-4">
              <button
                onClick={() => { setViewId(null); dispatch(clearSupplierPurchases()); setPurchaseView(true); dispatch(fetchSupplierPurchasesList({ role, supplierId: viewId, params: { limit: 100 } })); }}
                className="inline-flex items-center gap-2 rounded-lg border border-accent/30 bg-accent/5 px-5 py-2.5 text-[14px] font-semibold text-accent transition-colors hover:bg-accent/10"
              >
                <ShoppingCart size={15} />
                View Purchases
              </button>
              <button
                onClick={() => { const s = supplierDetail || suppliers.find((x) => x._id === viewId); setViewId(null); handleOpenEdit(s); }}
                className="inline-flex items-center gap-2 rounded-lg bg-accent px-5 py-2.5 text-[14px] font-semibold text-white transition-all hover:-translate-y-px hover:bg-accent-hover"
              >
                <Edit2 size={15} />
                Edit Supplier
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUPPLIER PURCHASES MODAL */}
      {purchaseView && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => { setPurchaseView(false); dispatch(clearSupplierPurchases()); }} />
          <div className="relative flex max-h-[88vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-2xl">
            <div className="flex items-center justify-between border-b border-line bg-surface/95 px-6 py-4 backdrop-blur-md">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-soft text-accent">
                  <ShoppingCart size={17} />
                </span>
                <div>
                  <h3 className="text-lg font-bold text-heading">Supplier Purchases</h3>
                  <p className="text-[12px] text-body">{suppliers.find((s) => s._id === viewId)?.name || ''}</p>
                </div>
              </div>
              <button onClick={() => { setPurchaseView(false); dispatch(clearSupplierPurchases()); }} className="flex h-8 w-8 items-center justify-center rounded-lg text-body hover:bg-bgsecondary hover:text-heading">
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-5">
              {supplierPurchasesError && (
                <div className="rounded-lg bg-red-50 px-4 py-3 text-[13px] font-medium text-red-600">
                  {supplierPurchasesError}
                </div>
              )}

              {supplierPurchasesLoading && (
                <div className="flex items-center justify-center gap-2 py-14 text-[14px] text-body">
                  <Loader2 size={18} className="animate-spin text-accent" />
                  Loading purchases...
                </div>
              )}

              {!supplierPurchasesLoading && !supplierPurchasesError && supplierPurchases.length === 0 && (
                <div className="py-14 text-center text-[14px] text-body">
                  <ShoppingCart size={36} className="mx-auto mb-3 text-line" />
                  No purchase orders found for this supplier
                </div>
              )}

              {!supplierPurchasesLoading && supplierPurchases.length > 0 && (
                <>
                  <div className="mb-4 rounded-xl border border-line bg-bgprimary/50 px-4 py-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <div className="text-[11px] font-medium uppercase tracking-wide text-body">Total Orders</div>
                        <div className="text-[18px] font-bold text-heading">{supplierPurchases.length}</div>
                      </div>
                      <div>
                        <div className="text-[11px] font-medium uppercase tracking-wide text-body">Total Spent</div>
                        <div className="text-[18px] font-bold text-emerald-600">
                          {inr(supplierPurchases.reduce((acc, o) => acc + (o.totalAmount || 0), 0))}
                        </div>
                      </div>
                      <div>
                        <div className="text-[11px] font-medium uppercase tracking-wide text-body">Last Order</div>
                        <div className="text-[15px] font-semibold text-heading">
                          {formatDate(Array.from(supplierPurchases).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0]?.createdAt)}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="overflow-x-auto rounded-xl border border-line">
                    <table className="w-full text-left">
                      <thead className="border-b border-line bg-bgprimary/50">
                        <tr>
                          <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-body">Order No.</th>
                          {role === 'admin' && (
                          <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-body hidden sm:table-cell">Pharmacist</th>
                          )}
                          <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-body hidden md:table-cell">Date</th>
                          <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-body text-right">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-line">
                        {supplierPurchases.map((o) => (
                          <tr key={o._id} className="transition-colors even:bg-bgprimary/35 hover:bg-bgprimary/60">
                            <td className="px-4 py-3 text-[13.5px] font-medium text-heading">{o.orderNumber}</td>
                            {role === 'admin' && (
                            <td className="px-4 py-3 text-[13px] text-body hidden sm:table-cell">
                              {typeof o.pharmacist === 'object' && o.pharmacist ? o.pharmacist.name : '—'}
                            </td>
                            )}
                            <td className="px-4 py-3 text-[13px] text-body hidden md:table-cell">{formatDate(o.createdAt)}</td>
                            <td className="px-4 py-3 text-right text-[14px] font-bold text-heading">{inr(o.totalAmount)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>

            <div className="flex items-center justify-end border-t border-line px-6 py-4">
              <button
                onClick={() => { setPurchaseView(false); dispatch(clearSupplierPurchases()); }}
                className="h-10 rounded-lg border border-line bg-surface px-5 text-[14px] font-semibold text-heading transition-colors hover:bg-bgsecondary"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteId && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setDeleteId(null)} />
          <div className="relative w-full max-w-[400px] rounded-2xl border border-line bg-surface p-6 shadow-2xl">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50">
              <AlertTriangle size={22} className="text-red-600" />
            </div>
            <h3 className="mt-4 text-lg font-bold text-heading">Delete Supplier</h3>
            <p className="mt-2 text-[14px] leading-relaxed text-body">
              Are you sure you want to delete <span className="font-semibold text-heading">{suppliers.find((s) => s._id === deleteId)?.name}</span>? This action cannot be undone.
            </p>
            <div className="mt-6 flex items-center justify-end gap-3">
              <button onClick={() => setDeleteId(null)} className="h-10 rounded-lg border border-line bg-surface px-5 text-[14px] font-semibold text-heading transition-colors hover:bg-bgsecondary">
                Cancel
              </button>
              <button onClick={handleDelete} disabled={deleting} className="h-10 rounded-lg bg-red-600 px-5 text-[14px] font-semibold text-white transition-all hover:-translate-y-px hover:bg-red-700 disabled:opacity-60">
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}