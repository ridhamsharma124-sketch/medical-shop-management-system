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
  Users,
  UserCheck,
  CalendarPlus,
  AlertTriangle,
  Gift,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { fetchCustomersList, createNewCustomer, updateExistingCustomer, deleteExistingCustomer, fetchCustomerDetails } from '../../features/customerSlice';
import { fetchAllPharmacists } from '../../features/pharmacistSlice';

const emptyCustomer = {
  name: '', phoneNumber: '', email: '', address: '', pharmacistId: '',
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

const getCustomerPharmacist = (c) => {
  if (typeof c?.pharmacist === 'object' && c.pharmacist) {
    return { _id: c.pharmacist._id, name: c.pharmacist.name || '—' };
  }
  return { _id: c?.pharmacist || '', name: '' };
};

const validateForm = (f, role) => {
  if (!f.name.trim()) return 'Customer name is required';
  if (!f.phoneNumber.trim()) return 'Phone number is required';
  if (!/^[0-9]{10}$/.test(f.phoneNumber)) return 'Phone number must be 10 digits';
  if (f.email && !/^\S+@\S+\.\S+$/.test(f.email)) return 'Please provide a valid email';
  if (role === 'admin' && !f.pharmacistId) return 'Please select a pharmacist';
  return '';
};

export default function CustomersPage() {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);
  const role = user?.role || 'admin';
  const location = useLocation();
  const base = location.pathname.startsWith('/pharmacist') ? '/pharmacist' : '/admin';

  const { items: customers, loading, error: loadError, detail: customerDetail, detailLoading, detailError } = useSelector((state) => state.customers);
  const { items: pharmacists } = useSelector((state) => state.pharmacists);

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(null);
  const [form, setForm] = useState(emptyCustomer);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [viewId, setViewId] = useState(null);
  const [phFilter, setPhFilter] = useState('all');
  const [monthOnly, setMonthOnly] = useState(false);
  const [phMenuOpen, setPhMenuOpen] = useState(false);
  const phMenuRef = useRef(null);

  const loadData = useCallback(() => {
    dispatch(fetchCustomersList({ role, params: { limit: 200 } }));
  }, [dispatch, role]);

  useEffect(() => {
    loadData();
    if (role === 'admin') dispatch(fetchAllPharmacists());
  }, [loadData, dispatch, role]);

  useEffect(() => {
    if (!phMenuOpen) return undefined;
    const handler = (e) => {
      if (phMenuRef.current && !phMenuRef.current.contains(e.target)) setPhMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [phMenuOpen]);

  const filtered = useMemo(() => {
    let list = [...customers];

    if (phFilter !== 'all') {
      list = list.filter((c) => getCustomerPharmacist(c)._id === phFilter);
    }

    if (monthOnly) {
      const now = new Date();
      list = list.filter((c) => {
        if (!c.createdAt) return false;
        const d = new Date(c.createdAt);
        return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
      });
    }

    if (search) {
      const q = search.toLowerCase();
      list = list.filter((c) =>
        c.name.toLowerCase().includes(q) ||
        c.phoneNumber.toLowerCase().includes(q) ||
        (c.email || '').toLowerCase().includes(q) ||
        (c.address || '').toLowerCase().includes(q) ||
        (getCustomerPharmacist(c).name || '').toLowerCase().includes(q)
      );
    }

    return list;
  }, [customers, search, phFilter, monthOnly]);

  const thisMonthCount = useMemo(() => {
    const now = new Date();
    return customers.filter((c) => {
      if (!c.createdAt) return false;
      const d = new Date(c.createdAt);
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
    }).length;
  }, [customers]);

  const distinctPharmacistCount = useMemo(
    () => new Set(customers.map((c) => getCustomerPharmacist(c)._id).filter(Boolean)).size,
    [customers]
  );

  const limit = 5;
  const totalPages = Math.max(Math.ceil(filtered.length / limit), 1);
  const paged = filtered.slice((page - 1) * limit, page * limit);

  const setField = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const handleOpenAdd = () => {
    setForm({ ...emptyCustomer, pharmacistId: role === 'admin' ? '' : user._id });
    setFormError('');
    setShowModal('add');
  };

  const handleOpenEdit = (c) => {
    const ph = getCustomerPharmacist(c);
    setForm({
      name: c.name,
      phoneNumber: c.phoneNumber,
      email: c.email || '',
      address: c.address || '',
      pharmacistId: role === 'admin' ? (ph._id || '') : user._id,
    });
    setFormError('');
    setShowModal(c._id);
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
      phoneNumber: form.phoneNumber,
      email: form.email.trim().toLowerCase() || undefined,
      address: form.address.trim() || undefined,
      pharmacist: role === 'admin' ? form.pharmacistId : user._id,
    };

    setSaving(true);
    try {
      if (showModal === 'add') {
        await dispatch(createNewCustomer({ role, payload })).unwrap();
        toast.success('Customer added successfully');
      } else {
        await dispatch(updateExistingCustomer({ role, id: showModal, payload })).unwrap();
        toast.success('Customer updated successfully');
      }
      setShowModal(null);
      setForm(emptyCustomer);
    } catch (err) {
      const msg = typeof err === 'string' ? err : 'Failed to save customer';
      setFormError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await dispatch(deleteExistingCustomer({ role, id: deleteId })).unwrap();
      toast.success('Customer deleted successfully');
      setDeleteId(null);
    } catch (err) {
      toast.error(typeof err === 'string' ? err : 'Failed to delete customer');
      setDeleteId(null);
    } finally {
      setDeleting(false);
    }
  };

  const pharmacistName = (id) => pharmacists.find((p) => p._id === id)?.name || '—';
  const displayPharmacistName = (c) => {
    const ph = getCustomerPharmacist(c);
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
            <h2 className="text-2xl font-bold text-heading md:text-3xl">Customer Management</h2>
            <p className="mt-1 text-[14px] text-body">Manage pharmacy customers linked to pharmacists.</p>
          </div>
        </div>
        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 rounded-lgx bg-accent px-5 py-2.5 text-[14px] font-semibold text-white transition-all hover:-translate-y-px hover:bg-accent-hover"
        >
          <Plus size={16} />
          Add Customer
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
          title="Show all customers"
          className={`inline-flex cursor-pointer items-center gap-2 rounded-lgx border px-4 py-2.5 transition-all hover:bg-bgsecondary ${
            phFilter === 'all' && !monthOnly ? 'border-accent bg-accent/10' : 'border-line bg-surface'
          }`}
        >
          <Users size={16} className="text-accent" />
          <span className="text-[13px] font-semibold text-heading">{loading ? '…' : customers.length}</span>
          <span className="text-[12px] text-body">Total Customers</span>
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
                <span className="text-[12px] font-semibold text-body">{loading ? '…' : customers.length}</span>
              </button>
              {pharmacists.map((p) => {
                const active = phFilter === p._id;
                const count = customers.filter((c) => getCustomerPharmacist(c)._id === p._id).length;
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
          title="Customers added this month"
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
          placeholder={role === 'admin' ? 'Search by name, phone, email, pharmacist...' : 'Search by name, phone, email...'}
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
              <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.06em] text-body">Customer</th>
              <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.06em] text-body hidden sm:table-cell">Phone</th>
              <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.06em] text-body hidden md:table-cell">Email</th>
              {role === 'admin' && (
              <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.06em] text-body hidden lg:table-cell">Pharmacist</th>
              )}
              <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.06em] text-body hidden md:table-cell">Reward Points</th>
              <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.06em] text-body text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {loading && (
              <tr>
                <td colSpan={role === 'admin' ? 6 : 5} className="px-4 py-16 text-center text-[14px] text-body">Loading customers...</td>
              </tr>
            )}
            {!loading && paged.length === 0 && (
              <tr>
                <td colSpan={role === 'admin' ? 6 : 5} className="px-4 py-16 text-center text-[14px] text-body">
                  <Users size={36} className="mx-auto mb-3 text-line" />
                  No customers found
                </td>
              </tr>
            )}
            {!loading && paged.map((c) => (
              <tr key={c._id} className="transition-colors even:bg-bgprimary/35 hover:bg-bgprimary/60">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[12px] font-bold ${getAvatarColor(c.name)}`}>
                      {getInitials(c.name)}
                    </span>
                    <div>
                      <span className="text-[14px] font-medium text-heading">{c.name}</span>
                      <span className="block text-[11px] text-body">{formatDate(c.createdAt)}</span>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-[13px] font-mono text-body hidden sm:table-cell">{c.phoneNumber}</td>
                <td className="px-4 py-3 text-[13px] text-body hidden md:table-cell">{c.email || '—'}</td>
                {role === 'admin' && (
                <td className="px-4 py-3 hidden lg:table-cell">
                  <span className="inline-flex items-center gap-1.5 text-[13px] text-body">
                    <UserCheck size={14} className="text-accent" />
                    {displayPharmacistName(c)}
                  </span>
                </td>
                )}
                <td className="px-4 py-3 hidden md:table-cell">
                  <span className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-heading">
                    <Gift size={14} className="text-mustard-deep" />
                    {c.rewardPoints ?? 0}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <button
                      onClick={() => { setViewId(c._id); dispatch(fetchCustomerDetails({ role, id: c._id })); }}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-body transition-colors hover:bg-bgsecondary hover:text-heading"
                      title="View details"
                    >
                      <Eye size={15} />
                    </button>
                    <button
                      onClick={() => handleOpenEdit(c)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-body transition-colors hover:bg-bgsecondary hover:text-heading"
                      title="Edit"
                    >
                      <Edit2 size={15} />
                    </button>
                    <button
                      onClick={() => setDeleteId(c._id)}
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
              <h3 className="text-lg font-bold text-heading">{showModal === 'add' ? 'Add Customer' : 'Edit Customer'}</h3>
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
                <label className="mb-1.5 block text-[13px] font-medium text-heading">Customer Name *</label>
                <input
                  value={form.name}
                  onChange={(e) => setField('name', e.target.value)}
                  className={inputCls}
                  placeholder="e.g. Rahul Sharma"
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
                <label className="mb-1.5 block text-[13px] font-medium text-heading">Phone Number *</label>
                <input
                  value={form.phoneNumber}
                  onChange={(e) => setField('phoneNumber', e.target.value.replace(/[^0-9]/g, '').slice(0, 10))}
                  className={inputCls}
                  placeholder="10-digit number e.g. 9876543210"
                  inputMode="numeric"
                />
                <span className="mt-1 block text-[11px] text-body">Exactly 10 digits, no +91</span>
              </div>

              <div>
                <label className="mb-1.5 block text-[13px] font-medium text-heading">Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setField('email', e.target.value)}
                  className={inputCls}
                  placeholder="customer@example.com"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-[13px] font-medium text-heading">Address</label>
                <textarea
                  value={form.address}
                  onChange={(e) => setField('address', e.target.value)}
                  rows={3}
                  className="w-full rounded-lg border border-line bg-bgprimary px-3.5 py-2.5 text-[14px] text-heading placeholder:text-[#B5A99A] focus:border-accent focus:outline-none focus:ring-[3px] focus:ring-accent/10"
                  placeholder="e.g. 12, Gandhi Nagar, Delhi - 110008"
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
                {saving ? 'Saving...' : showModal === 'add' ? 'Add Customer' : 'Save Changes'}
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
              <h3 className="text-lg font-bold text-heading">Customer Details</h3>
              <button onClick={() => setViewId(null)} className="flex h-8 w-8 items-center justify-center rounded-lg text-body hover:bg-bgsecondary hover:text-heading">
                <X size={18} />
              </button>
            </div>

            <div className="px-6 py-5">
              {detailError && (
                <div className="rounded-lg bg-red-50 px-4 py-3 text-[13px] font-medium text-red-600">{detailError}</div>
              )}
              {detailLoading && (
                <div className="py-12 text-center text-[14px] text-body">Loading customer details...</div>
              )}
              {!detailLoading && customerDetail && (() => {
              const c = customerDetail;
              const rows = [
                { label: 'Phone Number', value: c.phoneNumber },
                { label: 'Email', value: c.email || '—' },
                { label: 'Reward Points', value: String(c.rewardPoints ?? 0) },
                { label: 'Pharmacist', value: displayPharmacistName(c) },
                { label: 'Address', value: c.address || '—' },
                { label: 'Added On', value: formatDate(c.createdAt) },
              ];
              return (
                <>
                  <div>
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent-soft text-accent">
                          <Users size={22} />
                        </span>
                        <div>
                          <div className="text-[17px] font-bold text-heading">{c.name}</div>
                          <div className="text-[12px] font-mono text-body">+91 {c.phoneNumber}</div>
                        </div>
                      </div>
                      <span className="shrink-0 rounded-lg bg-emerald-50 px-2 py-1 text-[12px] font-semibold text-emerald-600">
                        Active
                      </span>
                    </div>
                  </div>

                  <div className="mt-5">
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
            </div>

            <div className="flex items-center justify-end border-t border-line px-6 py-4">
              <button
                onClick={() => { setViewId(null); handleOpenEdit(customerDetail); }}
                className="inline-flex items-center gap-2 rounded-lg bg-accent px-5 py-2.5 text-[14px] font-semibold text-white transition-all hover:-translate-y-px hover:bg-accent-hover"
              >
                <Edit2 size={15} />
                Edit Customer
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
            <h3 className="mt-4 text-lg font-bold text-heading">Delete Customer</h3>
            <p className="mt-2 text-[14px] leading-relaxed text-body">
              Are you sure you want to delete <span className="font-semibold text-heading">{customers.find((c) => c._id === deleteId)?.name}</span>? This action cannot be undone.
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