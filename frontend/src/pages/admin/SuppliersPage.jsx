import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
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
  Truck,
  AlertTriangle,
  UserCheck,
  BadgeCheck,
} from 'lucide-react';

const mockSuppliers = [
  { _id: '1', name: 'MedSupply Co.', contact: 'Rajesh Patel', phone: '+91 98765 43210', email: 'rajesh@medsupply.co.in', gst: '24AAMCS1234F1Z7', address: 'Plot 21, GIDC Estate, Vatva, Ahmedabad, Gujarat 382445', status: 'Active' },
  { _id: '2', name: 'Pharma Distributors', contact: 'Sunita Sharma', phone: '+91 98220 12345', email: 'sunita@pharmadistributors.in', gst: '27AACPD5678K1Z9', address: 'Shop 5, Lamington Road, Grant Road West, Mumbai, Maharashtra 400007', status: 'Active' },
  { _id: '3', name: 'HealthFirst Supplies', contact: 'Anil Kumar Verma', phone: '+91 98110 67890', email: 'anil@healthfirstsupplies.in', gst: '07AAHFS9012B1Z4', address: 'B-14, Okhla Industrial Area Phase 1, New Delhi, Delhi 110020', status: 'Inactive' },
  { _id: '4', name: 'Globe Medicare', contact: 'Meena Iyer', phone: '+91 94440 11223', email: 'meena@globemedicare.in', gst: '33AACGM3456N1Z2', address: '42, Anna Nagar, 2nd Avenue, Chennai, Tamil Nadu 600040', status: 'Active' },
  { _id: '5', name: 'LifeCare Distributors', contact: 'Vikram Singh', phone: '+91 93100 99887', email: 'vikram@lifecaredistributors.in', gst: '09AACLD7890R1Z8', address: 'C-18, Vibhuti Khand, Gomti Nagar, Lucknow, Uttar Pradesh 226010', status: 'Active' },
  { _id: '6', name: 'Wellness Chemist Supplies', contact: 'Priya Nair', phone: '+91 93456 77889', email: 'priya@wellnesschemist.in', gst: '32AACWC2345T1Z5', address: 'MP Road, Vyttila Junction, Kochi, Kerala 682019', status: 'Active' },
];

const emptySupplier = {
  name: '', contact: '', phone: '', email: '', gst: '', address: '', status: 'Active',
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

const getStatusBadge = (status) =>
  status === 'Active'
    ? { color: 'bg-emerald-50 text-emerald-600', dot: 'bg-emerald-500' }
    : { color: 'bg-bgsecondary text-body', dot: 'bg-body/40' };

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState(mockSuppliers);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(null);
  const [form, setForm] = useState(emptySupplier);
  const [deleteId, setDeleteId] = useState(null);
  const [viewId, setViewId] = useState(null);

  const filtered = useMemo(() => {
    let list = [...suppliers];

    if (search) {
      const q = search.toLowerCase();
      list = list.filter((s) =>
        s.name.toLowerCase().includes(q) ||
        s.contact.toLowerCase().includes(q) ||
        (s.phone || '').toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q) ||
        s.gst.toLowerCase().includes(q) ||
        (s.status || '').toLowerCase().includes(q) ||
        s.address.toLowerCase().includes(q)
      );
    }

    return list;
  }, [suppliers, search]);

  const limit = 5;
  const totalPages = Math.max(Math.ceil(filtered.length / limit), 1);
  const paged = filtered.slice((page - 1) * limit, page * limit);

  const setField = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const handleSave = () => {
    if (!form.name) return;
    if (showModal === 'add') {
      setSuppliers((prev) => [{ ...form, _id: Date.now().toString() }, ...prev]);
    } else {
      setSuppliers((prev) =>
        prev.map((s) => (s._id === showModal ? { ...s, ...form } : s))
      );
    }
    setShowModal(null);
    setForm(emptySupplier);
  };

  const handleDelete = () => {
    setSuppliers((prev) => prev.filter((s) => s._id !== deleteId));
    setDeleteId(null);
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
            <h2 className="text-2xl font-bold text-heading md:text-3xl">Supplier Management</h2>
            <p className="mt-1 text-[14px] text-body">Manage medicine suppliers and distributors.</p>
          </div>
        </div>
        <button
          onClick={() => { setForm(emptySupplier); setShowModal('add'); }}
          className="inline-flex items-center gap-2 rounded-lgx bg-accent px-5 py-2.5 text-[14px] font-semibold text-white transition-all hover:-translate-y-px hover:bg-accent-hover"
        >
          <Plus size={16} />
          Add Supplier
        </button>
      </div>

      {/* Summary */}
      <div className="flex flex-wrap items-center gap-2.5">
        <div className="inline-flex items-center gap-2.5 rounded-lgx border border-line bg-surface px-4 py-2.5">
          <Truck size={16} className="text-accent" />
          <span className="text-[13px] font-semibold text-heading">{suppliers.length}</span>
          <span className="text-[12px] text-body">Total Suppliers</span>
        </div>
        <div className="inline-flex items-center gap-2.5 rounded-lgx border border-line bg-surface px-4 py-2.5">
          <UserCheck size={16} className="text-emerald-600" />
          <span className="text-[13px] font-semibold text-heading">{suppliers.filter((s) => s.status === 'Active').length}</span>
          <span className="text-[12px] text-body">Active</span>
        </div>
        <div className="inline-flex items-center gap-2.5 rounded-lgx border border-line bg-surface px-4 py-2.5">
          <BadgeCheck size={16} className="text-mustard-deep" />
          <span className="text-[13px] font-semibold text-heading">{suppliers.filter((s) => s.gst).length}</span>
          <span className="text-[12px] text-body">GST Registered</span>
        </div>
      </div>

      {/* Search */}
      <div className="relative w-full max-w-md">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-body" />
        <input
          type="text"
          placeholder="Search by name, contact, email, GST, address..."
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
              <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.06em] text-body hidden md:table-cell">GST Number</th>
              <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.06em] text-body hidden md:table-cell">Status</th>
              <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.06em] text-body text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {paged.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-16 text-center text-[14px] text-body">
                  <Truck size={36} className="mx-auto mb-3 text-line" />
                  No suppliers found
                </td>
              </tr>
            )}
            {paged.map((s) => {
              const status = getStatusBadge(s.status);
              return (
              <tr key={s._id} className="transition-colors even:bg-bgprimary/35 hover:bg-bgprimary/60">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[12px] font-bold ${getAvatarColor(s.name)}`}>
                      {getInitials(s.name)}
                    </span>
                    <span className="text-[14px] font-medium text-heading">{s.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-[13px] text-body hidden sm:table-cell">{s.contact}</td>
                <td className="px-4 py-3 text-[13px] text-body hidden md:table-cell">{s.email}</td>
                <td className="px-4 py-3 text-[13px] font-mono text-body hidden md:table-cell">{s.gst}</td>
                <td className="px-4 py-3 hidden md:table-cell">
                  <span className={`inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-[12px] font-semibold ${status.color}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
                    {s.status}
                  </span>
                </td>
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
                      onClick={() => { setForm({ ...s }); setShowModal(s._id); }}
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
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
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
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowModal(null)} />
          <div className="relative w-full max-w-[640px] max-h-[90vh] overflow-y-auto rounded-2xl border border-line bg-surface shadow-2xl">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-line bg-surface/95 px-6 py-4 backdrop-blur-md">
              <h3 className="text-lg font-bold text-heading">{showModal === 'add' ? 'Add Supplier' : 'Edit Supplier'}</h3>
              <button onClick={() => setShowModal(null)} className="flex h-8 w-8 items-center justify-center rounded-lg text-body hover:bg-bgsecondary hover:text-heading">
                <X size={18} />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4 px-6 py-5 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-[13px] font-medium text-heading">Supplier Name *</label>
                <input value={form.name} onChange={(e) => setField('name', e.target.value)} className="h-10 w-full rounded-lg border border-line bg-bgprimary px-3.5 text-[14px] text-heading placeholder:text-[#B5A99A] focus:border-accent focus:outline-none focus:ring-[3px] focus:ring-accent/10" placeholder="e.g. MedSupply Co." />
              </div>

              <div>
                <label className="mb-1.5 block text-[13px] font-medium text-heading">Contact Person</label>
                <input value={form.contact} onChange={(e) => setField('contact', e.target.value)} className="h-10 w-full rounded-lg border border-line bg-bgprimary px-3.5 text-[14px] text-heading placeholder:text-[#B5A99A] focus:border-accent focus:outline-none focus:ring-[3px] focus:ring-accent/10" placeholder="e.g. Rajesh Patel" />
              </div>

              <div>
                <label className="mb-1.5 block text-[13px] font-medium text-heading">Contact Number</label>
                <input value={form.phone || ''} onChange={(e) => setField('phone', e.target.value)} className="h-10 w-full rounded-lg border border-line bg-bgprimary px-3.5 text-[14px] text-heading placeholder:text-[#B5A99A] focus:border-accent focus:outline-none focus:ring-[3px] focus:ring-accent/10" placeholder="+91 98765 43210" />
              </div>

              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-[13px] font-medium text-heading">Email</label>
                <input type="email" value={form.email} onChange={(e) => setField('email', e.target.value)} className="h-10 w-full rounded-lg border border-line bg-bgprimary px-3.5 text-[14px] text-heading placeholder:text-[#B5A99A] focus:border-accent focus:outline-none focus:ring-[3px] focus:ring-accent/10" placeholder="supplier@example.com" />
              </div>

              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-[13px] font-medium text-heading">GST Number</label>
                <input value={form.gst} onChange={(e) => setField('gst', e.target.value)} className="h-10 w-full rounded-lg border border-line bg-bgprimary px-3.5 text-[14px] text-heading placeholder:text-[#B5A99A] focus:border-accent focus:outline-none focus:ring-[3px] focus:ring-accent/10" placeholder="e.g. 24AAMCS1234F1Z7" />
              </div>

              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-[13px] font-medium text-heading">Status</label>
                <select value={form.status || 'Active'} onChange={(e) => setField('status', e.target.value)} className="h-10 w-full rounded-lg border border-line bg-bgprimary px-3 text-[14px] text-heading focus:border-accent focus:outline-none focus:ring-[3px] focus:ring-accent/10">
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
            </div>

            <div className="sticky bottom-0 flex items-center justify-end gap-3 border-t border-line bg-surface/95 px-6 py-4 backdrop-blur-md">
              <button onClick={() => setShowModal(null)} className="h-10 rounded-lg border border-line bg-surface px-5 text-[14px] font-semibold text-heading transition-colors hover:bg-bgsecondary">
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={!form.name}
                className="h-10 rounded-lg bg-accent px-6 text-[14px] font-semibold text-white transition-all hover:-translate-y-px hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-60"
              >
                {showModal === 'add' ? 'Add Supplier' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VIEW DETAIL MODAL */}
      {viewId && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setViewId(null)} />
          <div className="relative w-full max-w-[520px] rounded-2xl border border-line bg-surface shadow-2xl">
            <div className="flex items-center justify-between border-b border-line px-6 py-4">
              <h3 className="text-lg font-bold text-heading">Supplier Details</h3>
              <button onClick={() => setViewId(null)} className="flex h-8 w-8 items-center justify-center rounded-lg text-body hover:bg-bgsecondary hover:text-heading">
                <X size={18} />
              </button>
            </div>

            {(() => {
              const s = suppliers.find((x) => x._id === viewId);
              if (!s) return null;
              const rows = [
                { label: 'Status', value: s.status },
                { label: 'Contact Person', value: s.contact },
                { label: 'Contact Number', value: s.phone || '—' },
                { label: 'Email', value: s.email },
                { label: 'GST Number', value: s.gst },
                { label: 'Address', value: s.address || '—' },
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
                          <div className="text-[12px] font-mono text-body">GST {s.gst}</div>
                        </div>
                      </div>
                      <span className={`shrink-0 rounded-lg px-2 py-1 text-[12px] font-semibold ${getStatusBadge(s.status).color}`}>
                        {s.status}
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

            <div className="flex items-center justify-end border-t border-line px-6 py-4">
              <button
                onClick={() => { setForm({ ...suppliers.find((s) => s._id === viewId) }); setViewId(null); setShowModal(viewId); }}
                className="inline-flex items-center gap-2 rounded-lg bg-accent px-5 py-2.5 text-[14px] font-semibold text-white transition-all hover:-translate-y-px hover:bg-accent-hover"
              >
                <Edit2 size={15} />
                Edit Supplier
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteId && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setDeleteId(null)} />
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
              <button onClick={handleDelete} className="h-10 rounded-lg bg-red-600 px-5 text-[14px] font-semibold text-white transition-all hover:-translate-y-px hover:bg-red-700">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}