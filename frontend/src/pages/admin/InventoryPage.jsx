import { useState, useRef, useEffect, useCallback } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
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
  Check,
  Pill,
  AlertTriangle,
  Filter,
  FileDown,
  Sheet,
  Package,
  PackageX,
  AlarmClock,
  PackagePlus,
  ImagePlus,
  XCircle,
  History,
  ArrowUpDown,
  ArrowDownRight,
  ArrowUpRight,
  Loader2,
  Minus,
  GripVertical,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { fetchMedicinesList, fetchMedicineDetail, createNewMedicine, updateExistingMedicine, deleteExistingMedicine } from '../../features/medicineSlice';
import { adjustStock, fetchStockHistory, fetchMedicinesByStatus } from '../../features/inventorySlice';
import { fetchAllPharmacists } from '../../features/pharmacistSlice';
import { fetchMedicines as fetchMedicinesApi } from '../../auth/medicineService';
import { fetchMedicinesByStatus as fetchMedicinesByStatusApi } from '../../auth/inventoryService';
import { exportTablePdf, exportExcel } from '../../utils/exportUtils';
import CustomSelect from '../../components/ui/CustomSelect';

const statusMap = { low: 'low', out: 'outOfStock', expiring: 'nearExpiry', expired: 'expired' };

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
  if (stock === 0) return { label: 'Out of Stock', color: 'bg-red-50 text-red-600', dot: 'bg-red-600' };
  if (stock <= threshold) return { label: 'Low Stock', color: 'bg-amber-50 text-amber-600', dot: 'bg-amber-500' };
  return { label: 'In Stock', color: 'bg-emerald-50 text-emerald-600', dot: 'bg-emerald-500' };
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

function isExpired(d) {
  if (!d) return false;
  return new Date(d).getTime() < Date.now();
}

const categoryColors = {
  Tablet: 'bg-accent-soft text-accent',
  Capsule: 'bg-olive-soft text-olive-deep',
  Syrup: 'bg-mustard-soft text-mustard-deep',
  Injection: 'bg-berry-soft text-berry-deep',
  Ointment: 'bg-teal/10 text-teal',
  Drops: 'bg-bgsecondary text-heading',
};

export default function InventoryPage() {
  const user = useSelector((state) => state.auth.user);
  const role = user?.role || 'admin';
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const base = location.pathname.startsWith('/pharmacist') ? '/pharmacist' : '/admin';

  const dispatch = useDispatch();
  const [errorDismissed, setErrorDismissed] = useState(false);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [companyFilter, setCompanyFilter] = useState('');
  const [categoryDraft, setCategoryDraft] = useState('');
  const [companyDraft, setCompanyDraft] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  const filterRef = useRef(null);
  const [gstOpen, setGstOpen] = useState(false);
  const gstRef = useRef(null);
  const [sort, setSort] = useState('newest');
  const [stockFilter, setStockFilter] = useState(() => {
    const valid = ['all', 'low', 'out', 'expiring', 'expired'];
    const f = searchParams.get('filter');
    return f && valid.includes(f) ? f : 'all';
  });
  const { items: medicinesAll, loading, error: loadError, total: totalMedicines, viewItem, viewLoading, viewError } = useSelector((state) => state.medicines);
  const { items: pharmacists } = useSelector((state) => state.pharmacists);
  const { statusItems, statusTotal, statusLoading, statusError, historyLogs, historyLoading, historyError, adjusting } = useSelector((state) => state.inventory);
  const activeStatus = stockFilter !== 'all';
  const medicines = activeStatus ? statusItems : medicinesAll;
  const tableTotal = activeStatus ? statusTotal : totalMedicines;
  const displayLoading = activeStatus ? statusLoading : loading;
  const currentError = activeStatus ? statusError : loadError;
  const displayError = currentError && !errorDismissed ? currentError : '';
  const [page, setPage] = useState(1);
  const [chipCounts, setChipCounts] = useState(null);
  const [chipTick, setChipTick] = useState(0);
  const LIMIT = 6;
  const [showModal, setShowModal] = useState(null);
  const [form, setForm] = useState(emptyMedicine);
  const [imageFile, setImageFile] = useState(null);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [viewId, setViewId] = useState(null);
  const [historyId, setHistoryId] = useState(null);
  const [adjustId, setAdjustId] = useState(null);
  const [adjustForm, setAdjustForm] = useState({ type: 'increase', quantity: '', reason: '', note: '' });
  const [adjustError, setAdjustError] = useState('');

  const [adjustPos, setAdjustPos] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const adjustDrag = useRef(null);

  const moveAdjustDrag = (e) => {
    const d = adjustDrag.current;
    if (!d) return;
    setAdjustPos({ x: d.offX + (e.clientX - d.startX), y: d.offY + (e.clientY - d.startY) });
  };
  const endAdjustDrag = () => {
    adjustDrag.current = null;
    setDragging(false);
    window.removeEventListener('mousemove', moveAdjustDrag);
    window.removeEventListener('mouseup', endAdjustDrag);
  };
  const startAdjustDrag = (e) => {
    if (e.button !== 0 || (e.target.closest && e.target.closest('button'))) return;
    e.preventDefault();
    e.stopPropagation();
    setDragging(true);
    adjustDrag.current = { startX: e.clientX, startY: e.clientY, offX: adjustPos.x, offY: adjustPos.y };
    window.addEventListener('mousemove', moveAdjustDrag);
    window.addEventListener('mouseup', endAdjustDrag);
  };

  const loadData = useCallback(() => {
    if (stockFilter === 'all') {
      const params = {
        search: search.trim() || undefined,
        category: categoryFilter || undefined,
        company: companyFilter || undefined,
        sort,
        page,
        limit: LIMIT,
      };
      dispatch(fetchMedicinesList({ role, params }));
    } else {
      dispatch(fetchMedicinesByStatus({ role, params: { status: statusMap[stockFilter], page, limit: LIMIT } }));
    }
  }, [dispatch, role, stockFilter, search, categoryFilter, companyFilter, sort, page]);

  useEffect(() => {
    const t = setTimeout(() => loadData(), search.trim() ? 300 : 0);
    return () => clearTimeout(t);
  }, [loadData, search]);

  useEffect(() => {
    if (role === 'admin') {
      dispatch(fetchAllPharmacists({ page: 1, limit: 200 }));
    }
  }, [dispatch, role]);

  useEffect(() => {
    let active = true;
    Promise.all([
      fetchMedicinesApi(role, { limit: 1 }),
      fetchMedicinesByStatusApi(role, { status: 'low', limit: 1 }),
      fetchMedicinesByStatusApi(role, { status: 'outOfStock', limit: 1 }),
      fetchMedicinesByStatusApi(role, { status: 'nearExpiry', limit: 1 }),
      fetchMedicinesByStatusApi(role, { status: 'expired', limit: 1 }),
    ])
      .then((res) => {
        if (!active) return;
        setChipCounts({
          all: res[0].data?.total || 0,
          low: res[1].data?.total || 0,
          out: res[2].data?.total || 0,
          expiring: res[3].data?.total || 0,
          expired: res[4].data?.total || 0,
        });
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [role, chipTick]);

  useEffect(() => {
    if (!filterOpen) return undefined;
    const handler = (e) => {
      if (filterRef.current && !filterRef.current.contains(e.target)) setFilterOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [filterOpen]);

  useEffect(() => {
    if (!gstOpen) return undefined;
    const handler = (e) => {
      if (gstRef.current && !gstRef.current.contains(e.target)) setGstOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [gstOpen]);

  const activeFilterCount = (categoryFilter ? 1 : 0) + (companyFilter ? 1 : 0);

  const toggleFilter = () => {
    if (!filterOpen) {
      setCategoryDraft(categoryFilter);
      setCompanyDraft(companyFilter);
    }
    setFilterOpen(!filterOpen);
  };

  const applyFilters = () => {
    setCategoryFilter(categoryDraft.trim());
    setCompanyFilter(companyDraft.trim());
    setPage(1);
    setFilterOpen(false);
  };

  const chips = [
    { key: 'all', label: 'All', icon: Package, count: chipCounts ? chipCounts.all : '…' },
    { key: 'low', label: 'Low Stock', icon: AlertTriangle, count: chipCounts ? chipCounts.low : '…' },
    { key: 'out', label: 'Out of Stock', icon: PackageX, count: chipCounts ? chipCounts.out : '…' },
    { key: 'expiring', label: 'Near Expiry', icon: AlarmClock, count: chipCounts ? chipCounts.expiring : '…' },
    { key: 'expired', label: 'Expired', icon: XCircle, count: chipCounts ? chipCounts.expired : '…' },
  ];

  const chipActiveStyles = {
    all: 'border-accent bg-accent text-white',
    low: 'border-amber-500 bg-amber-500 text-white',
    out: 'border-red-600 bg-red-600 text-white',
    expiring: 'border-mustard-deep bg-mustard-deep text-white',
    expired: 'border-red-600 bg-red-600 text-white',
  };

  const chipCountStyles = {
    all: 'bg-accent-soft text-accent',
    low: 'bg-amber-50 text-amber-600',
    out: 'bg-red-50 text-red-600',
    expiring: 'bg-mustard-soft text-mustard-deep',
    expired: 'bg-red-50 text-red-600',
  };

  const exportInventory = async (format) => {
    try {
      let rows = [];
      if (activeStatus) {
        const { data } = await fetchMedicinesByStatusApi(role, { status: statusMap[stockFilter], all: 'true' });
        rows = (data?.data || []).map((m) => [
          m.name, m.genericName, m.category, m.company, m.batch, m.stock, m.sellingPrice, m.purchasePrice, m.unit, m.expiry,
        ]);
      } else {
        const params = { limit: 200 };
        if (search.trim()) params.search = search.trim();
        if (categoryFilter) params.category = categoryFilter;
        if (companyFilter) params.company = companyFilter;
        if (sort) params.sort = sort;
        const { data } = await fetchMedicinesApi(role, params);
        rows = (data?.data || []).map((m) => [
          m.name, m.genericName, m.category, m.company, m.batch, m.stock, m.sellingPrice, m.purchasePrice, m.unit, m.expiry,
        ]);
      }
      const filename = `inventory-${new Date().toISOString().slice(0, 10)}`;
      const headers = ['Name', 'Generic', 'Category', 'Company', 'Batch', 'Stock', 'SellingPrice', 'PurchasePrice', 'Unit', 'Expiry'];
      if (format === 'excel') {
        exportExcel(filename, [{ name: 'Inventory', headers, rows }]);
      } else {
        exportTablePdf({
          filename,
          title: 'Inventory Report',
          subtitle: `Generated ${new Date().toLocaleDateString('en-IN')}`,
          headers,
          rows,
          alignRight: [5, 6, 7],
        });
      }
    } catch {
      toast.error('Failed to export inventory');
    }
  };

  const totalPages = Math.max(Math.ceil((tableTotal || 0) / LIMIT), 1);
  const displayStart = tableTotal === 0 ? 0 : (page - 1) * LIMIT + 1;
  const displayEnd = Math.min(page * LIMIT, tableTotal || 0);

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
      setChipTick((t) => t + 1);
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
      setChipTick((t) => t + 1);
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
      pharmacist: m.pharmacist?._id || m.pharmacist || '',
    });
    setImageFile(null);
    setFormError('');
    setShowModal(m._id);
  };

  const openHistory = (m) => {
    setHistoryId(m._id);
    dispatch(fetchStockHistory({ role, params: { medicineId: m._id, limit: 50 } }));
  };

  const handleView = (id) => {
    setViewId(id);
    dispatch(fetchMedicineDetail({ role, id }));
  };

  const openAdjust = (m) => {
    setAdjustId(m._id);
    setAdjustPos({ x: 0, y: 0 });
    setAdjustForm({ type: 'increase', quantity: '', reason: '', note: '' });
    setAdjustError('');
  };

  const handleAdjustStock = async () => {
    const qty = Number(adjustForm.quantity);
    if (!qty || qty < 1 || !Number.isInteger(qty)) {
      const msg = 'Quantity must be a whole number greater than 0';
      setAdjustError(msg);
      toast.error(msg);
      return;
    }
    if (!adjustForm.reason.trim()) {
      const msg = 'Reason is required';
      setAdjustError(msg);
      toast.error(msg);
      return;
    }
    try {
      await dispatch(
        adjustStock({
          role,
          id: adjustId,
          payload: {
            type: adjustForm.type,
            quantity: qty,
            reason: adjustForm.reason.trim(),
            note: adjustForm.note.trim() || undefined,
          },
        })
      ).unwrap();
      toast.success(`Stock ${adjustForm.type === 'increase' ? 'increased' : 'reduced'} by ${qty}`);
      setAdjustId(null);
      setAdjustForm({ type: 'increase', quantity: '', reason: '', note: '' });
      loadData();
    } catch (err) {
      const msg = typeof err === 'string' ? err : 'Failed to adjust stock';
      setAdjustError(msg);
      toast.error(msg);
    }
  };

  const adjustMedicine = adjustId ? medicines.find((x) => x._id === adjustId) : null;
  const historyMedicine = historyId ? medicines.find((x) => x._id === historyId) : null;

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
            <h2 className="text-2xl font-bold text-heading md:text-3xl">Inventory Management</h2>
            <p className="mt-1 text-[14px] text-body">Track medicine stock, reorder levels and expiry.</p>
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => exportInventory('pdf')}
            className="inline-flex items-center gap-2 rounded-lgx border border-line bg-surface px-4 py-2.5 text-[14px] font-semibold text-heading transition-colors hover:bg-bgsecondary"
          >
            <FileDown size={16} />
            Export PDF
          </button>
          <button
            onClick={() => exportInventory('excel')}
            className="inline-flex items-center gap-2 rounded-lgx border border-line bg-surface px-4 py-2.5 text-[14px] font-semibold text-heading transition-colors hover:bg-bgsecondary"
          >
            <Sheet size={16} />
            Export Excel
          </button>
          <button
            onClick={openAdd}
            className="inline-flex items-center gap-2 rounded-lgx bg-accent px-5 py-2.5 text-[14px] font-semibold text-white transition-all hover:-translate-y-px hover:bg-accent-hover"
          >
            <Plus size={16} />
            Add Stock
          </button>
        </div>
      </div>

      {currentError && !errorDismissed && (
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
            onClick={toggleFilter}
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
              <div className="mb-3">
                <label className="mb-1.5 block text-[13px] font-medium text-heading">Category</label>
                <input
                  type="text"
                  value={categoryDraft}
                  onChange={(e) => setCategoryDraft(e.target.value)}
                  placeholder="Type to filter category..."
                  className="h-10 w-full rounded-lg border border-line bg-bgprimary px-3.5 text-[14px] text-heading placeholder:text-[#B5A99A] focus:border-accent focus:outline-none focus:ring-[3px] focus:ring-accent/10"
                />
              </div>

              <div className="mb-4">
                <label className="mb-1.5 block text-[13px] font-medium text-heading">Company</label>
                <input
                  type="text"
                  value={companyDraft}
                  onChange={(e) => setCompanyDraft(e.target.value)}
                  placeholder="Type to filter company..."
                  className="h-10 w-full rounded-lg border border-line bg-bgprimary px-3.5 text-[14px] text-heading placeholder:text-[#B5A99A] focus:border-accent focus:outline-none focus:ring-[3px] focus:ring-accent/10"
                />
              </div>

              <div className="flex justify-end border-t border-line pt-3">
                <button
                  onClick={applyFilters}
                  className="rounded-lg bg-accent px-4 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-accent-hover"
                >
                  Apply
                </button>
              </div>
            </div>
          )}
        </div>

        <CustomSelect
          value={sort}
          onChange={setSort}
          options={[
            { value: 'newest', label: 'Expiry: Newest' },
            { value: 'oldest', label: 'Expiry: Oldest' },
            { value: 'name', label: 'Name' },
            { value: 'price', label: 'Price: High to Low' },
            { value: 'stock', label: 'Stock: Low to High' },
          ]}
        />
      </div>

      {/* Stock status chips */}
      <div className="flex flex-wrap items-center gap-2.5">
        {chips.map((c) => {
          const active = stockFilter === c.key;
          return (
            <button
              key={c.key}
              onClick={() => { setStockFilter(c.key); setPage(1); }}
              className={`inline-flex items-center gap-2 rounded-lgx border px-4 py-2 text-[13px] font-semibold transition-all ${
                active ? chipActiveStyles[c.key] : 'border-line bg-surface text-heading hover:bg-bgsecondary'
              }`}
            >
              <c.icon size={15} />
              {c.label}
              <span
                className={`rounded-md px-1.5 py-0.5 text-[11px] font-bold ${
                  active ? 'bg-white/20 text-white' : chipCountStyles[c.key]
                }`}
              >
                {c.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lgx border border-line bg-surface shadow-card">
        <table className="w-full text-left">
          <thead className="sticky top-0 z-10 border-b border-line bg-surface">
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
            {displayLoading && (
              <tr>
                <td colSpan={9} className="px-4 py-16 text-center text-[14px] text-body">Loading medicines...</td>
              </tr>
            )}
            {!displayLoading && medicines.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-16 text-center text-[14px] text-body">
                  <Pill size={36} className="mx-auto mb-3 text-line" />
                  No medicines found
                </td>
              </tr>
            )}
            {!displayLoading && medicines.map((m) => {
              const status = getStatus(m.stock, m.lowStockThreshold);
              const expired = isExpired(m.expiry);
              const expiring = isExpiringSoon(m.expiry);
              return (
                <tr key={m._id} className="transition-colors even:bg-bgprimary/35 hover:bg-bgprimary/60">
                  <td className="px-4 py-3 text-[14px] font-medium text-heading">{m.name}</td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <span className={`inline-block rounded-lg px-2 py-1 text-[12px] font-semibold ${categoryColors[m.category] || 'bg-bgsecondary text-body'}`}>
                      {m.category}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[13px] text-body hidden md:table-cell">{m.company}</td>
                  <td className="px-4 py-3 text-[13px] font-mono text-body hidden lg:table-cell">{m.batch}</td>
                  <td className="px-4 py-3 text-right text-[14px] font-semibold text-heading">{Number(m.stock).toLocaleString()}</td>
                  <td className="px-4 py-3 text-right text-[14px] font-semibold text-heading">₹{m.sellingPrice}</td>
                  <td className={`px-4 py-3 text-right text-[13px] font-semibold hidden sm:table-cell ${expired ? 'text-red-600' : expiring ? 'text-red-600' : 'text-body'}`}>
                    {formatDate(m.expiry)}
                    {expired && <XCircle size={13} className="ml-1 inline text-red-600" />}
                    {!expired && expiring && <AlertTriangle size={13} className="ml-1 inline text-red-500" />}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {expired ? (
                      <span className="inline-flex items-center gap-1.5 rounded-lg bg-red-50 px-2 py-1 text-[12px] font-semibold text-red-600">
                        <span className="h-1.5 w-1.5 rounded-full bg-red-600" />
                        Expired
                      </span>
                    ) : (
                      <span className={`inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-[12px] font-semibold ${status.color}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
                        {status.label}
                      </span>
                    )}
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
                        onClick={() => openHistory(m)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-body transition-colors hover:bg-bgsecondary hover:text-heading"
                        title="Stock history"
                      >
                        <History size={15} />
                      </button>
                      <button
                        onClick={() => openAdjust(m)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-body transition-colors hover:bg-accent-soft hover:text-accent"
                        title="Adjust stock"
                      >
                        <ArrowUpDown size={15} />
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
      {!displayLoading && totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-[13px] text-body">
            Showing {displayStart}–{displayEnd} of {tableTotal || 0}
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
              <h3 className="text-lg font-bold text-heading">{showModal === 'add' ? 'Add Stock Item' : 'Edit Stock Item'}</h3>
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
                <CustomSelect value={form.category} onChange={(v) => setField('category', v)} options={allCategories.map((c) => ({ value: c, label: c }))} placeholder="Select category" />
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
                <CustomSelect value={form.unit} onChange={(v) => setField('unit', v)} options={allUnits.map((u) => ({ value: u, label: u.charAt(0).toUpperCase() + u.slice(1) }))} placeholder="Select unit" />
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

              <div className="relative" ref={gstRef}>
                <label className="mb-1.5 block text-[13px] font-medium text-heading">GST (%)</label>
                <button
                  type="button"
                  onClick={() => setGstOpen((o) => !o)}
                  className="flex h-10 w-full items-center justify-between rounded-lg border border-line bg-bgprimary px-3.5 text-[14px] text-heading focus:border-accent focus:outline-none focus:ring-[3px] focus:ring-accent/10"
                >
                  <span>{Number(form.gst) || 0}%</span>
                  <ChevronDown size={16} className={`text-body transition-transform ${gstOpen ? 'rotate-180' : ''}`} />
                </button>
                {gstOpen && (
                  <div className="absolute left-0 right-0 top-full z-20 mt-1.5 rounded-lg border border-line bg-surface p-1.5 shadow-xl">
                    {[0, 5, 12, 18, 28].map((g) => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => { setField('gst', String(g)); setGstOpen(false); }}
                        className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-[14px] transition-colors hover:bg-bgsecondary ${Number(form.gst) === g ? 'font-semibold text-accent' : 'text-heading'}`}
                      >
                        {g}%
                        {Number(form.gst) === g && <Check size={15} className="text-accent" />}
                      </button>
                    ))}
                  </div>
                )}
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
                  <CustomSelect value={form.pharmacist} onChange={(v) => setField('pharmacist', v)} options={pharmacists.map((p) => ({ value: p._id, label: `${p.name} (${p.email})` }))} placeholder="Select pharmacist..." />
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
                {saving ? 'Saving...' : showModal === 'add' ? 'Add Stock' : 'Save Changes'}
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
              <h3 className="text-lg font-bold text-heading">Stock Item Details</h3>
              <button onClick={() => setViewId(null)} className="flex h-8 w-8 items-center justify-center rounded-lg text-body hover:bg-bgsecondary hover:text-heading">
                <X size={18} />
              </button>
            </div>

            {(() => {
              const listItem = medicines.find((x) => x._id === viewId);
              const m = viewItem && viewItem._id === viewId ? viewItem : listItem;
              if (!m) return null;

              if (viewLoading) {
                return (
                  <div className="flex flex-col items-center justify-center gap-3 px-6 py-16">
                    <Loader2 size={22} className="animate-spin text-accent" />
                    <span className="text-[13px] text-body">Loading stock item details...</span>
                  </div>
                );
              }

              if (viewError && !listItem) {
                return (
                  <div className="px-6 py-10 text-center text-[13px] text-red-600">{viewError}</div>
                );
              }

              const status = getStatus(m.stock, m.lowStockThreshold);
              const rows = [
                { label: 'Generic Name', value: m.genericName || '—' },
                { label: 'Category', value: m.category },
                { label: 'Company', value: m.company || '—' },
                { label: 'Batch Number', value: m.batch || '—' },
                { label: 'Unit', value: m.unit ? m.unit.charAt(0).toUpperCase() + m.unit.slice(1) : '—' },
                { label: 'Stock Quantity', value: Number(m.stock).toLocaleString() },
                { label: 'Low Stock Threshold', value: m.lowStockThreshold },
                { label: 'Selling Price', value: m.sellingPrice != null ? `₹${m.sellingPrice}` : '—' },
                { label: 'Purchase Price', value: m.purchasePrice ? `₹${m.purchasePrice}` : '—' },
                { label: 'GST', value: m.gst ? `${m.gst}%` : '—' },
                { label: 'Manufacturing Date', value: formatDate(m.manufacturingDate) },
                { label: 'Expiry Date', value: formatDate(m.expiry) },
              ];
              if (role === 'admin') {
                const phId = typeof m.pharmacist === 'object' && m.pharmacist ? m.pharmacist._id : m.pharmacist;
                const phName = typeof m.pharmacist === 'object' && m.pharmacist
                  ? m.pharmacist.name
                  : (pharmacists.find((p) => p._id === phId)?.name || 'Unassigned');
                rows.push({ label: 'Pharmacist', value: phName });
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
                          <PackagePlus size={22} />
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

            <div className="flex items-center justify-end border-t border-line px-6 py-4">
              <button
                onClick={() => { const m = medicines.find((x) => x._id === viewId); setViewId(null); openEdit(m); }}
                className="inline-flex items-center gap-2 rounded-lg bg-accent px-5 py-2.5 text-[14px] font-semibold text-white transition-all hover:-translate-y-px hover:bg-accent-hover"
              >
                <Edit2 size={15} />
                Edit Stock Item
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADJUST STOCK MODAL */}
      {adjustId && adjustMedicine && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setAdjustId(null)} />
          <div
            className="relative w-full max-w-[520px] rounded-2xl border border-line bg-surface shadow-2xl"
            style={adjustPos.x || adjustPos.y ? { transform: `translate(${adjustPos.x}px, ${adjustPos.y}px)` } : undefined}
          >
            <div
              onMouseDown={startAdjustDrag}
              className="sticky top-0 z-10 flex select-none items-center justify-between border-b border-line bg-surface/95 px-6 py-4 backdrop-blur-md"
              style={{ cursor: dragging ? 'grabbing' : 'grab', userSelect: dragging ? 'none' : undefined }}
            >
              <div className="flex items-start gap-2.5">
                <GripVertical size={17} className="mt-1 shrink-0 text-body/50" />
                <div>
                  <h3 className="text-lg font-bold text-heading">Adjust Stock</h3>
                  <p className="text-[12px] text-body">{adjustMedicine.name} · {adjustMedicine.batch || ''} · Current: <span className="font-semibold text-heading">{Number(adjustMedicine.stock).toLocaleString()}</span></p>
                </div>
              </div>
              <button type="button" onClick={() => setAdjustId(null)} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-body hover:bg-bgsecondary hover:text-heading">
                <X size={18} />
              </button>
            </div>

            {adjustError && (
              <div className="mx-6 mt-4 rounded-lg bg-red-50 px-4 py-3 text-[13px] font-medium text-red-600">
                {adjustError}
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 px-6 py-5">
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setAdjustForm((f) => ({ ...f, type: 'increase' }))}
                  className={`rounded-lg border px-4 py-3 text-[14px] font-semibold transition-all ${
                    adjustForm.type === 'increase'
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                      : 'border-line bg-bgprimary text-heading hover:bg-bgsecondary'
                  }`}
                >
                  <span className="block text-[13px]">➤ Increase (+)</span>
                  Increase stock
                </button>
                <button
                  onClick={() => setAdjustForm((f) => ({ ...f, type: 'reduce' }))}
                  className={`rounded-lg border px-4 py-3 text-[14px] font-semibold transition-all ${
                    adjustForm.type === 'reduce'
                      ? 'border-red-500 bg-red-50 text-red-700'
                      : 'border-line bg-bgprimary text-heading hover:bg-bgsecondary'
                  }`}
                >
                  <span className="block text-[13px]">➤ Reduce (–)</span>
                  Reduce stock
                </button>
              </div>

              <div>
                <label className="mb-1.5 block text-[13px] font-medium text-heading">Quantity *</label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setAdjustForm((f) => ({ ...f, quantity: String(Math.max(1, (Number(f.quantity) || 1) - 1)) }))}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-line bg-bgprimary text-heading transition-colors hover:bg-bgsecondary"
                    title="Decrease"
                  >
                    <Minus size={16} />
                  </button>
                  <input
                    type="number"
                    min="1"
                    value={adjustForm.quantity}
                    onChange={(e) => setAdjustForm((f) => ({ ...f, quantity: e.target.value }))}
                    className="h-10 w-full rounded-lg border border-line bg-bgprimary px-3.5 text-center text-[14px] text-heading focus:border-accent focus:outline-none focus:ring-[3px] focus:ring-accent/10"
                    placeholder="e.g. 10"
                  />
                  <button
                    type="button"
                    onClick={() => setAdjustForm((f) => ({ ...f, quantity: String((Number(f.quantity) || 1) + 1) }))}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-line bg-bgprimary text-heading transition-colors hover:bg-bgsecondary"
                    title="Increase"
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-[13px] font-medium text-heading">Reason *</label>
                <input
                  value={adjustForm.reason}
                  onChange={(e) => setAdjustForm((f) => ({ ...f, reason: e.target.value }))}
                  className="h-10 w-full rounded-lg border border-line bg-bgprimary px-3.5 text-[14px] text-heading placeholder:text-[#B5A99A] focus:border-accent focus:outline-none focus:ring-[3px] focus:ring-accent/10"
                  placeholder="e.g. purchase, damaged, expired, correction, other"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-[13px] font-medium text-heading">Note (optional)</label>
                <textarea
                  value={adjustForm.note}
                  onChange={(e) => setAdjustForm((f) => ({ ...f, note: e.target.value }))}
                  rows={2}
                  className="w-full rounded-lg border border-line bg-bgprimary px-3.5 py-2.5 text-[14px] text-heading placeholder:text-[#B5A99A] focus:border-accent focus:outline-none focus:ring-[3px] focus:ring-accent/10"
                  placeholder="Optional extra detail"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-line bg-surface/95 px-6 py-4">
              <button onClick={() => setAdjustId(null)} className="h-10 rounded-lg border border-line bg-surface px-5 text-[14px] font-semibold text-heading transition-colors hover:bg-bgsecondary">
                Cancel
              </button>
              <button
                onClick={handleAdjustStock}
                disabled={adjusting}
                className="h-10 rounded-lg bg-accent px-6 text-[14px] font-semibold text-white transition-all hover:-translate-y-px hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-60"
              >
                {adjusting ? 'Updating...' : 'Confirm Adjustment'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STOCK HISTORY MODAL */}
      {historyId && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setHistoryId(null)} />
          <div className="relative w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-2xl border border-line bg-surface shadow-2xl">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-line bg-surface/95 px-6 py-4 backdrop-blur-md">
              <div>
                <h3 className="text-lg font-bold text-heading">Stock History</h3>
                <p className="text-[12px] text-body">{historyMedicine?.name || 'Medicine'} · {historyMedicine?.batch || ''}</p>
              </div>
              <button onClick={() => setHistoryId(null)} className="flex h-8 w-8 items-center justify-center rounded-lg text-body hover:bg-bgsecondary hover:text-heading">
                <X size={18} />
              </button>
            </div>

            <div className="px-6 py-5">
              {historyError && (
                <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-[13px] font-medium text-red-600">
                  {historyError}
                </div>
              )}
              {historyLoading && (
                <div className="py-12 text-center text-[14px] text-body">Loading history...</div>
              )}
              {!historyLoading && historyLogs.length === 0 && (
                <div className="py-12 text-center text-[14px] text-body">
                  <History size={36} className="mx-auto mb-3 text-line" />
                  No stock movements found
                </div>
              )}
              {!historyLoading && historyLogs.length > 0 && (
                <div className="overflow-x-auto rounded-xl border border-line">
                  <table className="w-full text-left">
                    <thead className="border-b border-line bg-bgprimary/50">
                      <tr>
                        <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-body">Type</th>
                        <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-body">Quantity Change</th>
                        <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-body hidden sm:table-cell">Previous → New</th>
                        <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-body hidden md:table-cell">Reason / Note</th>
                        <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-body hidden lg:table-cell">By / Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line">
                      {historyLogs.map((log) => (
                        <tr key={log._id} className="transition-colors even:bg-bgprimary/35 hover:bg-bgprimary/60">
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[11px] font-bold ${
                              log.type === 'increase'
                                ? 'bg-emerald-50 text-emerald-600'
                                : 'bg-red-50 text-red-600'
                            }`}>
                              {log.type === 'increase' ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                              {log.type === 'increase' ? 'INCREASE' : 'REDUCE'}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`text-[14px] font-bold ${
                              log.type === 'increase' ? 'text-emerald-600' : 'text-red-600'
                            }`}>
                              {log.type === 'increase' ? '+' : '–'}{log.quantity}
                            </span>
                            <span className="ml-1 text-[11.5px] text-body">units</span>
                          </td>
                          <td className="px-4 py-3 hidden sm:table-cell">
                            <span className="text-[13px] font-semibold text-heading">
                              {log.previousStock} <span className="text-body/60">→</span> {log.newStock}
                            </span>
                          </td>
                          <td className="px-4 py-3 hidden md:table-cell">
                            <span className="text-[13px] text-body">{log.reason}</span>
                            {log.note ? <span className="block text-[11.5px] text-body/70">{log.note}</span> : null}
                          </td>
                          <td className="px-4 py-3 hidden lg:table-cell">
                            <span className="block text-[12px] text-body">{log.performedBy?.name || '—'}</span>
                            <span className="block text-[11px] text-body/70">{formatDate(log.createdAt)}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end border-t border-line px-6 py-4">
              <button
                onClick={() => setHistoryId(null)}
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
            <h3 className="mt-4 text-lg font-bold text-heading">Delete Stock Item</h3>
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