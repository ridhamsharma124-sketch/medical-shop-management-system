import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus,
  Search,
  ArrowLeft,
  Edit2,
  Trash2,
  X,
  ChevronLeft,
  ChevronRight,
  Users,
  Mail,
  Phone,
  CalendarClock,
  AlertTriangle,
  Eye,
  Boxes,
  ShoppingCart,
  Receipt,
  TrendingUp,
  Loader2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useDispatch, useSelector } from 'react-redux';
import { fetchAllPharmacists, fetchPharmacistDetail, createNewPharmacist, updateExistingPharmacist, deleteExistingPharmacist } from '../../features/pharmacistSlice';

const emptyForm = {
  name: '',
  email: '',
  phone: '',
  password: '',
};

function getInitials(name) {
  return (name || 'U')
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

const inr = (n) => '₹' + Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const avatarColors = [
  'bg-accent',
  'bg-olive-deep',
  'bg-mustard-deep',
  'bg-berry-deep',
  'bg-teal',
];

export default function PharmacistsPage() {
  const dispatch = useDispatch();
  const { items: pharmacists, total, loading, error: loadError, detail, detailLoading, detailError } = useSelector((state) => state.pharmacists);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit] = useState(8);
  const [showModal, setShowModal] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [viewId, setViewId] = useState(null);
  const [errorDismissed, setErrorDismissed] = useState(false);
  const displayError = loadError && !errorDismissed ? loadError : '';

  const loadData = useCallback(() => {
    dispatch(fetchAllPharmacists({ page, limit, search: search || undefined }));
  }, [dispatch, page, limit, search]);

  useEffect(() => {
    const t = setTimeout(() => {
      setPage(1);
      loadData();
    }, search ? 300 : 0);
    return () => clearTimeout(t);
  }, [search, loadData]);

  const totalPages = Math.max(Math.ceil(total / limit), 1);

  const setField = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const openView = (id) => {
    setViewId(id);
    dispatch(fetchPharmacistDetail(id));
  };

  const openAdd = () => {
    setForm(emptyForm);
    setFormError('');
    setShowModal('add');
  };

  const openEdit = (p) => {
    setForm({ name: p.name, email: p.email, phone: p.phone, password: '' });
    setFormError('');
    setShowModal(p._id);
  };

  const handleSave = async () => {
    setFormError('');
    if (!form.name || !form.email || !form.phone) {
      setFormError('Name, Email and Phone are required');
      return;
    }
    if (!/^\+?[0-9]{10,15}$/.test(form.phone.trim())) {
      toast.error('Phone number must be 10-15 digits');
      return;
    }
    if (showModal === 'add' && !form.password) {
      setFormError('Password is required for a new pharmacist');
      return;
    }
    setSaving(true);
    try {
      if (showModal === 'add') {
        await dispatch(createNewPharmacist(form)).unwrap();
        toast.success('Pharmacist added successfully');
      } else {
        const payload = { name: form.name, phone: form.phone };
        if (form.password) payload.password = form.password;
        await dispatch(updateExistingPharmacist({ id: showModal, payload })).unwrap();
        toast.success('Pharmacist updated successfully');
      }
      setShowModal(null);
      setForm(emptyForm);
    } catch (err) {
      const msg = typeof err === 'string' ? err : 'Failed to save pharmacist';
      setFormError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await dispatch(deleteExistingPharmacist(deleteId)).unwrap();
      toast.success('Pharmacist deleted successfully');
      setDeleteId(null);
  } catch {
    toast.error('Failed to delete pharmacist');
    setDeleteId(null);
  } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link
            to="/admin"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-line bg-surface text-heading transition-colors hover:bg-bgsecondary hover:text-accent"
            title="Back to dashboard"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h2 className="text-2xl font-bold text-heading md:text-3xl">Pharmacists</h2>
            <p className="mt-1 text-[14px] text-body">Manage pharmacy staff accounts and access.</p>
          </div>
        </div>
        <button
          onClick={openAdd}
          className="inline-flex items-center gap-2 rounded-lgx bg-accent px-5 py-2.5 text-[14px] font-semibold text-white transition-all hover:-translate-y-px hover:bg-accent-hover"
        >
          <Plus size={16} />
          Add Pharmacist
        </button>
      </div>

      {displayError && (
        <div className="flex items-center justify-between gap-3 rounded-lgx border border-red-200 bg-red-50 px-4 py-3 text-[13.5px] text-red-600">
          <span>{displayError}</span>
          <button onClick={() => setErrorDismissed(true)} className="flex h-7 w-7 items-center justify-center rounded-lg text-red-500 hover:bg-red-100">
            <X size={15} />
          </button>
        </div>
      )}

      {/* Search */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-body" />
          <input
            type="text"
            placeholder="Search by name, email or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-10 w-full rounded-lg border border-line bg-surface pl-10 pr-4 text-[14px] text-heading placeholder:text-[#B5A99A] transition-[border-color,box-shadow] focus:border-accent focus:outline-none focus:ring-[3px] focus:ring-accent/10"
          />
        </div>
        <span className="text-[13px] text-body">{total} pharmacist{total === 1 ? '' : 's'}</span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lgx border border-line bg-surface shadow-card">
        <table className="w-full text-left">
          <thead className="border-b border-line">
            <tr>
              <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.06em] text-body">Pharmacist</th>
              <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.06em] text-body hidden sm:table-cell">Email</th>
              <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.06em] text-body hidden md:table-cell">Phone</th>
              <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.06em] text-body hidden lg:table-cell">Joined</th>
              <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.06em] text-body text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {loading && (
              <tr>
                <td colSpan={5} className="px-4 py-16 text-center text-[14px] text-body">Loading pharmacists...</td>
              </tr>
            )}
            {!loading && pharmacists.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-16 text-center text-[14px] text-body">
                  <Users size={36} className="mx-auto mb-3 text-line" />
                  No pharmacists found
                </td>
              </tr>
            )}
            {!loading && pharmacists.map((p, i) => (
              <tr key={p._id} className="transition-colors hover:bg-bgprimary/50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[13px] font-bold text-white ${avatarColors[i % avatarColors.length]}`}>
                      {getInitials(p.name)}
                    </span>
                    <span className="text-[14px] font-semibold text-heading">{p.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-[13px] text-body hidden sm:table-cell">{p.email}</td>
                <td className="px-4 py-3 text-[13px] text-body hidden md:table-cell">{p.phone}</td>
                <td className="px-4 py-3 text-[13px] text-body hidden lg:table-cell">{formatDate(p.createdAt)}</td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <button
                      onClick={() => openView(p._id)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-body transition-colors hover:bg-bgsecondary hover:text-heading"
                      title="View details"
                    >
                      <Eye size={15} />
                    </button>
                    <button
                      onClick={() => openEdit(p)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-body transition-colors hover:bg-bgsecondary hover:text-heading"
                      title="Edit"
                    >
                      <Edit2 size={15} />
                    </button>
                    <button
                      onClick={() => setDeleteId(p._id)}
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
            Showing {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total}
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
          <div className="relative w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-2xl border border-line bg-surface shadow-2xl">
            <div className="flex items-center justify-between border-b border-line px-6 py-4">
              <h3 className="text-lg font-bold text-heading">{showModal === 'add' ? 'Add Pharmacist' : 'Edit Pharmacist'}</h3>
              <button onClick={() => setShowModal(null)} className="flex h-8 w-8 items-center justify-center rounded-lg text-body hover:bg-bgsecondary hover:text-heading">
                <X size={18} />
              </button>
            </div>

            {formError && (
              <div className="mx-6 mt-4 flex items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-[13px] text-red-600">
                <span>{formError}</span>
                <button onClick={() => setFormError('')} className="text-red-500 hover:text-red-700"><X size={14} /></button>
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 px-6 py-5">
              <div>
                <label className="mb-1.5 block text-[13px] font-medium text-heading">Full Name *</label>
                <input value={form.name} onChange={(e) => setField('name', e.target.value)} className="h-10 w-full rounded-lg border border-line bg-bgprimary px-3.5 text-[14px] text-heading placeholder:text-[#B5A99A] focus:border-accent focus:outline-none focus:ring-[3px] focus:ring-accent/10" placeholder="e.g. Rahul Verma" />
              </div>

              <div>
                <label className="mb-1.5 block text-[13px] font-medium text-heading">Email *</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setField('email', e.target.value)}
                  disabled={showModal !== 'add'}
                  className="h-10 w-full rounded-lg border border-line bg-bgprimary px-3.5 text-[14px] text-heading placeholder:text-[#B5A99A] focus:border-accent focus:outline-none focus:ring-[3px] focus:ring-accent/10 disabled:opacity-50"
                  placeholder="e.g. rahul@pharmacy.com"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-[13px] font-medium text-heading">Phone *</label>
                <input value={form.phone} onChange={(e) => setField('phone', e.target.value)} className="h-10 w-full rounded-lg border border-line bg-bgprimary px-3.5 text-[14px] text-heading placeholder:text-[#B5A99A] focus:border-accent focus:outline-none focus:ring-[3px] focus:ring-accent/10" placeholder="e.g. 9876543210" />
              </div>

              <div>
                <label className="mb-1.5 block text-[13px] font-medium text-heading">{showModal === 'add' ? 'Password *' : 'New Password (optional)'}</label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setField('password', e.target.value)}
                  className="h-10 w-full rounded-lg border border-line bg-bgprimary px-3.5 text-[14px] text-heading placeholder:text-[#B5A99A] focus:border-accent focus:outline-none focus:ring-[3px] focus:ring-accent/10"
                  placeholder={showModal === 'add' ? 'Min 8 chars, 1 uppercase, 1 number, 1 special' : 'Leave blank to keep current'}
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-line px-6 py-4">
              <button onClick={() => setShowModal(null)} className="h-10 rounded-lg border border-line bg-surface px-5 text-[14px] font-semibold text-heading transition-colors hover:bg-bgsecondary">
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="h-10 rounded-lg bg-accent px-6 text-[14px] font-semibold text-white transition-all hover:-translate-y-px hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? 'Saving...' : showModal === 'add' ? 'Add Pharmacist' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VIEW DETAIL MODAL */}
      {viewId && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setViewId(null)} />
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-line bg-surface shadow-2xl">
            <div className="flex items-center justify-between border-b border-line px-6 py-4">
              <h3 className="text-lg font-bold text-heading">Pharmacist Details</h3>
              <button onClick={() => setViewId(null)} className="flex h-8 w-8 items-center justify-center rounded-lg text-body hover:bg-bgsecondary hover:text-heading">
                <X size={18} />
              </button>
            </div>

            {detailLoading && (
              <div className="flex items-center justify-center gap-2 px-6 py-16 text-[14px] text-body">
                <Loader2 size={18} className="animate-spin text-accent" />
                Loading pharmacist details...
              </div>
            )}

            {!detailLoading && detailError && (
              <div className="px-6 py-16 text-center text-[14px] text-red-600">{detailError}</div>
            )}

            {!detailLoading && !detailError && detail && (
              <>
                <div className="px-6 pt-5">
                  <div className="flex items-center gap-3">
                    <span className={`flex h-14 w-14 items-center justify-center rounded-full text-[16px] font-bold text-white ${avatarColors[pharmacists.findIndex((x) => x._id === viewId) % avatarColors.length]}`}>
                      {getInitials(detail.pharmacist?.name)}
                    </span>
                    <div>
                      <div className="text-[17px] font-bold text-heading">{detail.pharmacist?.name}</div>
                      <span className="mt-0.5 inline-block rounded-md bg-accent-soft px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-accent">Pharmacist</span>
                    </div>
                  </div>
                </div>

                <div className="px-6 py-5">
                  <div className="grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-line bg-line">
                    <div className="flex flex-col gap-0.5 bg-surface px-4 py-3">
                      <span className="text-[11px] font-medium uppercase tracking-wide text-body">Email</span>
                      <span className="flex items-center gap-1.5 text-[14px] font-semibold text-heading"><Mail size={14} className="text-body" />{detail.pharmacist?.email}</span>
                    </div>
                    <div className="flex flex-col gap-0.5 bg-surface px-4 py-3">
                      <span className="text-[11px] font-medium uppercase tracking-wide text-body">Phone</span>
                      <span className="flex items-center gap-1.5 text-[14px] font-semibold text-heading"><Phone size={14} className="text-body" />{detail.pharmacist?.phone}</span>
                    </div>
                    <div className="flex flex-col gap-0.5 bg-surface px-4 py-3">
                      <span className="text-[11px] font-medium uppercase tracking-wide text-body">Joined</span>
                      <span className="flex items-center gap-1.5 text-[14px] font-semibold text-heading"><CalendarClock size={14} className="text-body" />{formatDate(detail.pharmacist?.createdAt)}</span>
                    </div>
                  </div>

                  <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-3">
                    <div className="flex flex-col rounded-xl border border-line bg-bgprimary/40 px-4 py-3">
                      <span className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-body"><Boxes size={13} className="text-accent" />Medicines</span>
                      <span className="mt-1 text-[20px] font-bold text-heading">{detail.medicines?.total ?? 0}</span>
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        <span className="rounded-md bg-red-50 px-1.5 py-0.5 text-[10.5px] font-semibold text-red-600">{detail.medicines?.outOfStock ?? 0} out of stock</span>
                        <span className="rounded-md bg-amber-50 px-1.5 py-0.5 text-[10.5px] font-semibold text-amber-600">{detail.medicines?.lowStock ?? 0} low</span>
                      </div>
                      <div className="mt-1 flex flex-wrap gap-1.5">
                        <span className="rounded-md bg-orange-50 px-1.5 py-0.5 text-[10.5px] font-semibold text-orange-600">{detail.medicines?.expired ?? 0} expired</span>
                        <span className="rounded-md bg-sky-50 px-1.5 py-0.5 text-[10.5px] font-semibold text-sky-600">{detail.medicines?.nearExpiryWithin30Days ?? 0} expiring soon</span>
                      </div>
                    </div>

                    <div className="flex flex-col rounded-xl border border-line bg-bgprimary/40 px-4 py-3">
                      <span className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-body"><Users size={13} className="text-accent" />Customers</span>
                      <span className="mt-1 text-[20px] font-bold text-heading">{detail.customers?.total ?? 0}</span>
                      <span className="mt-1 text-[11px] text-body">registered</span>
                    </div>

                    <div className="flex flex-col rounded-xl border border-line bg-bgprimary/40 px-4 py-3">
                      <span className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-body"><Receipt size={13} className="text-accent" />Sales</span>
                      <span className="mt-1 text-[20px] font-bold text-emerald-600">{inr(detail.sales?.totalRevenue)}</span>
                      <span className="mt-1 text-[11px] text-body">{detail.sales?.totalBills ?? 0} bills</span>
                    </div>

                    <div className="flex flex-col rounded-xl border border-line bg-bgprimary/40 px-4 py-3">
                      <span className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-body"><ShoppingCart size={13} className="text-accent" />Purchases</span>
                      <span className="mt-1 text-[20px] font-bold text-heading">{inr(detail.purchases?.totalPurchaseAmount)}</span>
                      <span className="mt-1 text-[11px] text-body">{detail.purchases?.orderCount ?? 0} orders</span>
                    </div>

                    <div className="flex flex-col rounded-xl border border-accent/30 bg-accent/5 px-4 py-3 md:col-span-2">
                      <span className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-accent"><TrendingUp size={13} />Profit</span>
                      <span className="mt-1 text-[20px] font-bold text-heading">{inr(detail.profit?.totalProfit)}</span>
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        <span className="rounded-md bg-emerald-50 px-1.5 py-0.5 text-[10.5px] font-semibold text-emerald-600">Revenue {inr(detail.profit?.totalRevenue)}</span>
                        <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10.5px] font-semibold text-slate-600">Cost {inr(detail.profit?.totalCost)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            <div className="flex items-center justify-end gap-3 border-t border-line px-6 py-4">
              <button
                onClick={() => { const p = pharmacists.find((x) => x._id === viewId); setViewId(null); openEdit(p); }}
                className="inline-flex items-center gap-2 rounded-lg bg-accent px-5 py-2.5 text-[14px] font-semibold text-white transition-all hover:-translate-y-px hover:bg-accent-hover"
              >
                <Edit2 size={15} />
                Edit Pharmacist
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
            <h3 className="mt-4 text-lg font-bold text-heading">Delete Pharmacist</h3>
            <p className="mt-2 text-[14px] leading-relaxed text-body">
              Are you sure you want to delete <span className="font-semibold text-heading">{pharmacists.find((p) => p._id === deleteId)?.name}</span>? Their medicines will become unassigned.
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