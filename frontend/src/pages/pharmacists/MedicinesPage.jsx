import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
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
  Pill,
  AlertTriangle,
  Filter,
  RotateCcw,
  ImagePlus,
  Loader2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { fetchMedicinesList, fetchMedicineDetail, searchMedicinesList, createNewMedicine, updateExistingMedicine, deleteExistingMedicine } from '../../features/medicineSlice';
import { fetchAllPharmacists } from '../../features/pharmacistSlice';

const allCategories = ['Tablet', 'Capsule', 'Syrup', 'Injection', 'Ointment', 'Drops'];
const allUnits = ['strip', 'tablet', 'bottle', 'box', 'vial', 'sachet'];

const emptyMedicine = {
  name: '',
  genericName: '',
  category: 'Tablet',
  company: '',
  batch: '',
  unit: 'strip',
  manufacturingDate: '',
  expiry: '',
  sellingPrice: '',
  purchasePrice: '',
  gst: '0',
  stock: '0',
  lowStockThreshold: '10',
  description: '',
  pharmacist: '',
};

function getStatus(stock, threshold) {
  if (stock === 0) return { label: 'Out of Stock', color: 'bg-red-50 text-red-600' };
  if (stock <= threshold) return { label: 'Low Stock', color: 'bg-amber-50 text-amber-600' };
  return { label: 'In Stock', color: 'bg-emerald-50 text-emerald-600' };
}

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function toDateInput(v) {
  if (!v) return '';
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return '';
  return d.toISOString().split('T')[0];
}

function isExpiringSoon(d, days = 30) {
  if (!d) return false;
  const diff = new Date(d).getTime() - Date.now();
  return diff > 0 && diff <= days * 86400000;
}

export default function MedicinesPage() {
    const role = 'pharmacist';
  const location = useLocation();
  const base = location.pathname.startsWith('/pharmacist') ? '/pharmacist' : '/admin';
  const dispatch = useDispatch();
  const { items: medicines, loading, error: loadError, viewItem, viewLoading, viewError, searchResults, searchLoading } = useSelector((state) => state.medicines);
  const { items: pharmacists } = useSelector((state) => state.pharmacists);
  const [errorDismissed, setErrorDismissed] = useState(false);
  const displayError = loadError && !errorDismissed ? loadError : '';
  const [search, setSearch] = useState('');
  const [searchingFor, setSearchingFor] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [companyFilter, setCompanyFilter] = useState('All');
  const [filterOpen, setFilterOpen] = useState(false);
  const filterRef = useRef(null);
  const [sort, setSort] = useState('newest');
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(null);
  const [form, setForm] = useState(emptyMedicine);
  const [imageFile, setImageFile] = useState(null);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [viewId, setViewId] = useState(null);

  const loadData = useCallback(() => {
    dispatch(fetchMedicinesList({ role, params: { sort: 'newest', limit: 200 } }));
  }, [dispatch, role]);

  useEffect(() => {
    const t = setTimeout(() => loadData(), 0);
    return () => clearTimeout(t);
  }, [loadData]);

  useEffect(() => {
    if (role === 'admin') {
      dispatch(fetchAllPharmacists({ page: 1, limit: 200 }));
    }
  }, [dispatch, role]);

  useEffect(() => {
    if (!search.trim()) return undefined;
    const t = setTimeout(() => {
      setSearchingFor(search.trim());
      dispatch(searchMedicinesList({ role, params: { q: search.trim(), limit: 200 } }));
    }, 300);
    return () => clearTimeout(t);
  }, [search, role, dispatch]);

  useEffect(() => {
    if (!filterOpen) return undefined;
    const handler = (e) => {
      if (filterRef.current && !filterRef.current.contains(e.target)) setFilterOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [filterOpen]);

  const allCompanies = ['All', ...new Set(medicines.map((m) => m.company).filter(Boolean))];

  const activeFilterCount = (categoryFilter !== 'All' ? 1 : 0) + (companyFilter !== 'All' ? 1 : 0);

  const resetFilters = () => {
    setCategoryFilter('All');
    setCompanyFilter('All');
    setPage(1);
  };

  const filtered = useMemo(() => {
    const isSearching = search.trim() !== '';
    if (isSearching && (searchLoading || searchingFor !== search.trim())) return [];
    const base = isSearching ? searchResults : medicines;
    let list = [...base];

    if (categoryFilter !== 'All') {
      list = list.filter((m) => m.category === categoryFilter);
    }

    if (companyFilter !== 'All') {
      list = list.filter((m) => m.company === companyFilter);
    }

    const sortMap = {
      newest: (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0),
      oldest: (a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0),
      name: (a, b) => a.name.localeCompare(b.name),
      price: (a, b) => (b.sellingPrice || 0) - (a.sellingPrice || 0),
      stock: (a, b) => (a.stock || 0) - (b.stock || 0),
    };
    list.sort(sortMap[sort] || sortMap.newest);

    return list;
  }, [medicines, searchResults, searchLoading, searchingFor, search, categoryFilter, companyFilter, sort]);

  const limit = 6;
  const totalPages = Math.max(Math.ceil(filtered.length / limit), 1);
  const paged = filtered.slice((page - 1) * limit, page * limit);

  const setField = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const buildFormData = (data) => {
    const fd = new FormData();
    const fields = [
      'name',
      'genericName',
      'category',
      'company',
      'batch',
      'unit',
      'manufacturingDate',
      'expiry',
      'sellingPrice',
      'purchasePrice',
      'gst',
      'stock',
      'lowStockThreshold',
      'description',
    ];
    for (const key of fields) {
      if (data[key] !== undefined && data[key] !== null && data[key] !== '') {
        fd.append(key, data[key]);
      }
    }
    if (role === 'admin' && data.pharmacist) {
      fd.append('pharmacist', data.pharmacist);
    }
    if (imageFile) {
      fd.append('image', imageFile);
    }
    return fd;
  };

  const handleSave = async () => {
    setFormError('');
    if (!form.name || !form.genericName || !form.company || !form.batch || !form.unit) {
      setFormError('Name, Generic Name, Company, Batch and Unit are required');
      return;
    }
    if (!form.sellingPrice || !form.purchasePrice) {
      setFormError('Selling Price and Purchase Price are required');
      return;
    }
    if (!form.manufacturingDate || !form.expiry) {
      setFormError('Manufacturing Date and Expiry Date are required');
      return;
    }
    if (role === 'admin' && !form.pharmacist) {
      setFormError('Please select a pharmacist for this medicine');
      return;
    }
    if (imageFile && imageFile.size > 2 * 1024 * 1024) {
      setFormError('Image file must be less than 2MB');
      return;
    }

    setSaving(true);
    try {
      const fd = buildFormData(form);
      if (showModal === 'add') {
        await dispatch(createNewMedicine({ role, payload: fd })).unwrap();
        toast.success('Medicine added successfully');
      } else {
        await dispatch(updateExistingMedicine({ role, id: showModal, payload: fd })).unwrap();
        toast.success('Medicine updated successfully');
      }
      setShowModal(null);
      setForm(emptyMedicine);
      setImageFile(null);
    } catch (err) {
      const msg = typeof err === 'string' ? err : 'Failed to save medicine';
      setFormError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await dispatch(deleteExistingMedicine({ role, id: deleteId })).unwrap();
      toast.success('Medicine deleted successfully');
      setDeleteId(null);
  } catch {
    toast.error('Failed to delete medicine');
    setDeleteId(null);
  } finally {
      setDeleting(false);
    }
  };

  const openAdd = () => {
    setForm(emptyMedicine);
    setImageFile(null);
    setFormError('');
    setShowModal('add');
  };

  const openEdit = (m) => {
    setForm({
      name: m.name || '',
      genericName: m.genericName || '',
      category: m.category || 'Tablet',
      company: m.company || '',
      batch: m.batch || '',
      unit: m.unit || 'strip',
      manufacturingDate: toDateInput(m.manufacturingDate),
      expiry: toDateInput(m.expiry),
      sellingPrice: m.sellingPrice ?? '',
      purchasePrice: m.purchasePrice ?? '',
      gst: m.gst ?? '0',
      stock: m.stock ?? '0',
      lowStockThreshold: m.lowStockThreshold ?? '10',
      description: m.description || '',
      pharmacist: m.pharmacist || '',
    });
    setImageFile(null);
    setFormError('');
    setShowModal(m._id);
  };

  const handleView = (id) => {
    setViewId(id);
    dispatch(fetchMedicineDetail({ role, id }));
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
            <h2 className="text-2xl font-bold text-heading md:text-3xl">Medicines</h2>
            <p className="mt-1 text-[14px] text-body">Manage pharmacy medicines and stock.</p>
          </div>
        </div>
        <button
          onClick={openAdd}
          className="inline-flex items-center gap-2 rounded-lgx bg-accent px-5 py-2.5 text-[14px] font-semibold text-white transition-all hover:-translate-y-px hover:bg-accent-hover"
        >
          <Plus size={16} />
          Add Medicine
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

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-body" />
          <input
            type="text"
            placeholder="Search by name, generic, batch, company..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="h-10 w-full rounded-lg border border-line bg-surface pl-10 pr-4 text-[14px] text-heading placeholder:text-[#B5A99A] transition-[border-color,box-shadow] focus:border-accent focus:outline-none focus:ring-[3px] focus:ring-accent/10"
          />
        </div>

        {/* Filter popover */}
        <div className="relative" ref={filterRef}>
          <button
            onClick={() => setFilterOpen(!filterOpen)}
            className={`inline-flex h-10 items-center gap-2 rounded-lg border px-4 text-[14px] font-semibold transition-colors ${
              filterOpen || activeFilterCount > 0
                ? 'border-accent bg-accent-soft text-accent'
                : 'border-line bg-surface text-heading hover:bg-bgsecondary'
            }`}
          >
            <Filter size={16} />
            Filter
            {activeFilterCount > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1.5 text-[10.5px] font-bold text-white">
                {activeFilterCount}
              </span>
            )}
            <ChevronDown size={14} className={`transition-transform ${filterOpen ? 'rotate-180' : ''}`} />
          </button>

          {filterOpen && (
            <div className="absolute right-0 z-50 mt-2 w-[280px] rounded-xl border border-line bg-surface p-4 shadow-xl">
              <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.12em] text-body">Filter Medicines</p>

              <div className="mb-3">
                <label className="mb-1.5 block text-[13px] font-medium text-heading">Category</label>
                <select
                  value={categoryFilter}
                  onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
                  className="h-10 w-full rounded-lg border border-line bg-bgprimary px-3 text-[14px] text-heading focus:border-accent focus:outline-none focus:ring-[3px] focus:ring-accent/10"
                >
                  <option value="All">All Categories</option>
                  {allCategories.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div className="mb-3">
                <label className="mb-1.5 block text-[13px] font-medium text-heading">Company</label>
                <select
                  value={companyFilter}
                  onChange={(e) => { setCompanyFilter(e.target.value); setPage(1); }}
                  className="h-10 w-full rounded-lg border border-line bg-bgprimary px-3 text-[14px] text-heading focus:border-accent focus:outline-none focus:ring-[3px] focus:ring-accent/10"
                >
                  {allCompanies.map((c) => (
                    <option key={c} value={c}>{c === 'All' ? 'All Companies' : c}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-line pt-3">
                <button
                  onClick={resetFilters}
                  disabled={activeFilterCount === 0}
                  className="inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-[13px] font-semibold text-heading transition-colors hover:bg-bgsecondary disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <RotateCcw size={14} />
                  Reset
                </button>
                <button
                  onClick={() => setFilterOpen(false)}
                  className="rounded-lg bg-accent px-4 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-accent-hover"
                >
                  Apply
                </button>
              </div>
            </div>
          )}
        </div>

        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="h-10 rounded-lg border border-line bg-surface px-3 text-[14px] text-heading focus:border-accent focus:outline-none focus:ring-[3px] focus:ring-accent/10"
        >
          <option value="newest">Expiry: Newest</option>
          <option value="oldest">Expiry: Oldest</option>
          <option value="name">Name</option>
          <option value="price">Price: High to Low</option>
          <option value="stock">Stock: Low to High</option>
        </select>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lgx border border-line bg-surface shadow-card">
        <table className="w-full text-left">
          <thead className="border-b border-line">
            <tr>
              <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.06em] text-body">Name</th>
              <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.06em] text-body hidden sm:table-cell">Category</th>
              <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.06em] text-body hidden md:table-cell">Company</th>
              <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.06em] text-body hidden lg:table-cell">Batch</th>
              <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.06em] text-body text-right">Stock</th>
              <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.06em] text-body text-right">Price</th>
              <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.06em] text-body text-right hidden sm:table-cell">Expiry</th>
              <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.06em] text-body text-right">Status</th>
              <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.06em] text-body text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {loading && (
              <tr>
                <td colSpan={9} className="px-4 py-16 text-center text-[14px] text-body">Loading medicines...</td>
              </tr>
            )}
            {!loading && search.trim() && (searchLoading || searchingFor !== search.trim()) && (
              <tr>
                <td colSpan={9} className="px-4 py-16 text-center text-[14px] text-body">
                  <Loader2 size={20} className="mx-auto mb-2 animate-spin text-accent" />
                  Searching medicines...
                </td>
              </tr>
            )}
            {!loading && !(search.trim() && (searchLoading || searchingFor !== search.trim())) && paged.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-16 text-center text-[14px] text-body">
                  <Pill size={36} className="mx-auto mb-3 text-line" />
                  No medicines found {search.trim() && <>for <span className="font-medium text-heading">"{search.trim()}"</span></>}
                </td>
              </tr>
            )}
            {!loading && !(search.trim() && (searchLoading || searchingFor !== search.trim())) && paged.map((m) => {
              const status = getStatus(m.stock, m.lowStockThreshold);
              const expiring = isExpiringSoon(m.expiry);
              return (
                <tr key={m._id} className="transition-colors hover:bg-bgprimary/50">
                  <td className="px-4 py-3 text-[14px] font-medium text-heading">{m.name}</td>
                  <td className="px-4 py-3 text-[13px] text-body hidden sm:table-cell">{m.category}</td>
                  <td className="px-4 py-3 text-[13px] text-body hidden md:table-cell">{m.company}</td>
                  <td className="px-4 py-3 text-[13px] font-mono text-body hidden lg:table-cell">{m.batch}</td>
                  <td className="px-4 py-3 text-right text-[14px] font-semibold text-heading">{Number(m.stock).toLocaleString()}</td>
                  <td className="px-4 py-3 text-right text-[14px] font-semibold text-heading">₹{m.sellingPrice}</td>
                  <td className={`px-4 py-3 text-right text-[13px] font-semibold hidden sm:table-cell ${expiring ? 'text-red-600' : 'text-body'}`}>
                    {formatDate(m.expiry)}
                    {expiring && <AlertTriangle size={13} className="ml-1 inline text-red-500" />}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className={`inline-block rounded-lg px-2 py-1 text-[12px] font-semibold ${status.color}`}>
                      {status.label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => handleView(m._id)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-body transition-colors hover:bg-bgsecondary hover:text-heading"
                        title="View details"
                      >
                        <Eye size={15} />
                      </button>
                      <button
                        onClick={() => openEdit(m)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-body transition-colors hover:bg-bgsecondary hover:text-heading"
                        title="Edit"
                      >
                        <Edit2 size={15} />
                      </button>
                      <button
                        onClick={() => setDeleteId(m._id)}
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
              <h3 className="text-lg font-bold text-heading">{showModal === 'add' ? 'Add Medicine' : 'Edit Medicine'}</h3>
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

            <div className="grid grid-cols-1 gap-4 px-6 py-5 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-[13px] font-medium text-heading">Medicine Name *</label>
                <input value={form.name} onChange={(e) => setField('name', e.target.value)} className="h-10 w-full rounded-lg border border-line bg-bgprimary px-3.5 text-[14px] text-heading placeholder:text-[#B5A99A] focus:border-accent focus:outline-none focus:ring-[3px] focus:ring-accent/10" placeholder="e.g. Paracetamol 500mg" />
              </div>

              <div>
                <label className="mb-1.5 block text-[13px] font-medium text-heading">Generic Name *</label>
                <input value={form.genericName} onChange={(e) => setField('genericName', e.target.value)} className="h-10 w-full rounded-lg border border-line bg-bgprimary px-3.5 text-[14px] text-heading placeholder:text-[#B5A99A] focus:border-accent focus:outline-none focus:ring-[3px] focus:ring-accent/10" placeholder="e.g. Paracetamol" />
              </div>

              <div>
                <label className="mb-1.5 block text-[13px] font-medium text-heading">Category *</label>
                <select value={form.category} onChange={(e) => setField('category', e.target.value)} className="h-10 w-full rounded-lg border border-line bg-bgprimary px-3 text-[14px] text-heading focus:border-accent focus:outline-none focus:ring-[3px] focus:ring-accent/10">
                  {allCategories.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-[13px] font-medium text-heading">Company *</label>
                <input value={form.company} onChange={(e) => setField('company', e.target.value)} className="h-10 w-full rounded-lg border border-line bg-bgprimary px-3.5 text-[14px] text-heading placeholder:text-[#B5A99A] focus:border-accent focus:outline-none focus:ring-[3px] focus:ring-accent/10" placeholder="e.g. Cipla" />
              </div>

              <div>
                <label className="mb-1.5 block text-[13px] font-medium text-heading">Batch Number *</label>
                <input value={form.batch} onChange={(e) => setField('batch', e.target.value)} className="h-10 w-full rounded-lg border border-line bg-bgprimary px-3.5 text-[14px] text-heading placeholder:text-[#B5A99A] focus:border-accent focus:outline-none focus:ring-[3px] focus:ring-accent/10" placeholder="e.g. AC-2201" />
              </div>

              <div>
                <label className="mb-1.5 block text-[13px] font-medium text-heading">Unit *</label>
                <select value={form.unit} onChange={(e) => setField('unit', e.target.value)} className="h-10 w-full rounded-lg border border-line bg-bgprimary px-3 text-[14px] text-heading focus:border-accent focus:outline-none focus:ring-[3px] focus:ring-accent/10">
                  {allUnits.map((u) => <option key={u} value={u}>{u.charAt(0).toUpperCase() + u.slice(1)}</option>)}
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-[13px] font-medium text-heading">Manufacturing Date *</label>
                <input type="date" value={form.manufacturingDate} onChange={(e) => setField('manufacturingDate', e.target.value)} className="h-10 w-full rounded-lg border border-line bg-bgprimary px-3.5 text-[14px] text-heading focus:border-accent focus:outline-none focus:ring-[3px] focus:ring-accent/10" />
              </div>

              <div>
                <label className="mb-1.5 block text-[13px] font-medium text-heading">Expiry Date *</label>
                <input type="date" value={form.expiry} onChange={(e) => setField('expiry', e.target.value)} className="h-10 w-full rounded-lg border border-line bg-bgprimary px-3.5 text-[14px] text-heading focus:border-accent focus:outline-none focus:ring-[3px] focus:ring-accent/10" />
              </div>

              <div>
                <label className="mb-1.5 block text-[13px] font-medium text-heading">Selling Price (₹) *</label>
                <input type="number" min="0" step="0.01" value={form.sellingPrice} onChange={(e) => setField('sellingPrice', e.target.value)} className="h-10 w-full rounded-lg border border-line bg-bgprimary px-3.5 text-[14px] text-heading placeholder:text-[#B5A99A] focus:border-accent focus:outline-none focus:ring-[3px] focus:ring-accent/10" placeholder="0" />
              </div>

              <div>
                <label className="mb-1.5 block text-[13px] font-medium text-heading">Purchase Price (₹) *</label>
                <input type="number" min="0" step="0.01" value={form.purchasePrice} onChange={(e) => setField('purchasePrice', e.target.value)} className="h-10 w-full rounded-lg border border-line bg-bgprimary px-3.5 text-[14px] text-heading placeholder:text-[#B5A99A] focus:border-accent focus:outline-none focus:ring-[3px] focus:ring-accent/10" placeholder="0" />
              </div>

              <div>
                <label className="mb-1.5 block text-[13px] font-medium text-heading">GST (%)</label>
                <input type="number" min="0" max="100" step="0.01" value={form.gst} onChange={(e) => setField('gst', e.target.value)} className="h-10 w-full rounded-lg border border-line bg-bgprimary px-3.5 text-[14px] text-heading placeholder:text-[#B5A99A] focus:border-accent focus:outline-none focus:ring-[3px] focus:ring-accent/10" placeholder="0" />
              </div>

              <div>
                <label className="mb-1.5 block text-[13px] font-medium text-heading">Stock Qty *</label>
                <input type="number" min="0" value={form.stock} onChange={(e) => setField('stock', e.target.value)} className="h-10 w-full rounded-lg border border-line bg-bgprimary px-3.5 text-[14px] text-heading placeholder:text-[#B5A99A] focus:border-accent focus:outline-none focus:ring-[3px] focus:ring-accent/10" placeholder="0" />
              </div>

              <div>
                <label className="mb-1.5 block text-[13px] font-medium text-heading">Low Stock Threshold</label>
                <input type="number" min="0" value={form.lowStockThreshold} onChange={(e) => setField('lowStockThreshold', e.target.value)} className="h-10 w-full rounded-lg border border-line bg-bgprimary px-3.5 text-[14px] text-heading placeholder:text-[#B5A99A] focus:border-accent focus:outline-none focus:ring-[3px] focus:ring-accent/10" placeholder="10" />
              </div>

              {role === 'admin' && (
                <div>
                  <label className="mb-1.5 block text-[13px] font-medium text-heading">Pharmacist *</label>
                  <select value={form.pharmacist} onChange={(e) => setField('pharmacist', e.target.value)} className="h-10 w-full rounded-lg border border-line bg-bgprimary px-3 text-[14px] text-heading focus:border-accent focus:outline-none focus:ring-[3px] focus:ring-accent/10">
                    <option value="">Select pharmacist...</option>
                    {pharmacists.map((p) => <option key={p._id} value={p._id}>{p.name} ({p.email})</option>)}
                  </select>
                </div>
              )}

              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-[13px] font-medium text-heading">Description</label>
                <textarea value={form.description} onChange={(e) => setField('description', e.target.value)} rows={2} className="w-full rounded-lg border border-line bg-bgprimary px-3.5 py-2.5 text-[14px] text-heading placeholder:text-[#B5A99A] focus:border-accent focus:outline-none focus:ring-[3px] focus:ring-accent/10" placeholder="Optional description" />
              </div>

              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-[13px] font-medium text-heading">Medicine Image</label>
                <label className="flex h-12 w-full cursor-pointer items-center gap-2.5 rounded-lg border border-dashed border-line bg-bgprimary px-3.5 text-[14px] text-body transition-colors hover:border-accent hover:text-accent">
                  <ImagePlus size={17} />
                  {imageFile ? imageFile.name : 'Choose an image (optional)'}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    className="hidden"
                    onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                  />
                </label>
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
                {saving ? 'Saving...' : showModal === 'add' ? 'Add Medicine' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VIEW DETAIL MODAL */}
      {viewId && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setViewId(null)} />
          <div className="relative flex max-h-[85vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-2xl">
            <div className="sticky top-0 z-10 flex shrink-0 items-center justify-between border-b border-line bg-surface px-6 py-4">
              <h3 className="text-lg font-bold text-heading">Medicine Details</h3>
              <button onClick={() => setViewId(null)} className="flex h-8 w-8 items-center justify-center rounded-lg text-body hover:bg-bgsecondary hover:text-heading">
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">

            {(() => {
              const listItem = medicines.find((x) => x._id === viewId);
              const m = viewItem && viewItem._id === viewId ? viewItem : listItem;
              if (!m) return null;

              if (viewLoading) {
                return (
                  <div className="flex flex-col items-center justify-center gap-3 px-6 py-16">
                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
                    <span className="text-[13px] text-body">Loading medicine details...</span>
                  </div>
                );
              }

              if (viewError && !m) {
                return (
                  <div className="px-6 py-10 text-center text-[13px] text-red-600">
                    {viewError}
                  </div>
                );
              }

              const status = getStatus(m.stock, m.lowStockThreshold);
              const pharmacistName = pharmacists.find((p) => p._id === m.pharmacist)?.name;
              const rows = [
                { label: 'Generic Name', value: m.genericName || '—' },
                { label: 'Category', value: m.category },
                { label: 'Company', value: m.company || '—' },
                { label: 'Batch Number', value: m.batch || '—' },
                { label: 'Unit', value: m.unit ? m.unit.charAt(0).toUpperCase() + m.unit.slice(1) : '—' },
                { label: 'Stock Quantity', value: Number(m.stock).toLocaleString() },
                { label: 'Low Stock Threshold', value: m.lowStockThreshold },
                { label: 'Selling Price', value: m.sellingPrice != null ? `₹${m.sellingPrice}` : '—' },
                { label: 'Purchase Price', value: m.purchasePrice != null ? `₹${m.purchasePrice}` : '—' },
                { label: 'GST', value: m.gst ? `${m.gst}%` : '—' },
                { label: 'Manufacturing Date', value: formatDate(m.manufacturingDate) },
                { label: 'Expiry Date', value: formatDate(m.expiry) },
              ];
              if (role === 'admin') {
                rows.push({ label: 'Pharmacist', value: pharmacistName || 'Unassigned' });
              }
              if (m.description) {
                rows.push({ label: 'Description', value: m.description });
              }
              return (
                <>
                  {m.image && (
                    <div className="flex justify-center px-6 pt-5">
                      <img src={m.image} alt={m.name} className="max-h-40 rounded-xl border border-line object-contain" />
                    </div>
                  )}
                  <div className="px-6 pt-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent-soft text-accent">
                          <Pill size={22} />
                        </span>
                        <div>
                          <div className="text-[17px] font-bold text-heading">{m.name}</div>
                          <div className="text-[12px] text-body">{m.batch}</div>
                        </div>
                      </div>
                      <span className={`rounded-lg px-2.5 py-1 text-[12px] font-semibold ${status.color}`}>{status.label}</span>
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

            {viewItem && viewItem._id === viewId && (
                <div className="flex items-center justify-end border-t border-line px-6 py-4">
                  <button
                    onClick={() => { setViewId(null); openEdit(viewItem); }}
                    className="inline-flex items-center gap-2 rounded-lg bg-accent px-5 py-2.5 text-[14px] font-semibold text-white transition-all hover:-translate-y-px hover:bg-accent-hover"
                  >
                    <Edit2 size={15} />
                    Edit Medicine
                  </button>
                </div>
              )}

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
            <h3 className="mt-4 text-lg font-bold text-heading">Delete Medicine</h3>
            <p className="mt-2 text-[14px] leading-relaxed text-body">
              Are you sure you want to delete <span className="font-semibold text-heading">{medicines.find((m) => m._id === deleteId)?.name}</span>? This action cannot be undone.
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
