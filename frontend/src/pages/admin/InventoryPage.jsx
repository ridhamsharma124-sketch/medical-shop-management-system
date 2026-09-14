import { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
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
  Download,
  Package,
  PackageX,
  AlarmClock,
  PackagePlus,
} from 'lucide-react';

const mockMedicines = [
  { _id: '1', name: 'Paracetamol 500mg', category: 'Tablet', company: 'Cipla', supplier: 'MedSupply Co.', batch: 'AC-2201', stock: 2450, lowStockThreshold: 50, price: 50, cost: 32, unit: 'strip', expiry: '2026-12-15' },
  { _id: '2', name: 'Amoxicillin 250mg', category: 'Capsule', company: 'Sun Pharma', supplier: 'Pharma Distributors', batch: 'AM-5541', stock: 1180, lowStockThreshold: 50, price: 95, cost: 68, unit: 'strip', expiry: '2026-08-20' },
  { _id: '3', name: 'Cetirizine 10mg', category: 'Tablet', company: 'Cipla', supplier: 'MedSupply Co.', batch: 'CT-0877', stock: 8, lowStockThreshold: 50, price: 35, cost: 20, unit: 'strip', expiry: '2026-10-09' },
  { _id: '4', name: 'Vitamin D3 60k', category: 'Capsule', company: 'Zydus', supplier: 'HealthFirst Supplies', batch: 'VD-1120', stock: 0, lowStockThreshold: 20, price: 120, cost: 85, unit: 'strip', expiry: '2027-03-10' },
  { _id: '5', name: 'Azithromycin 500', category: 'Tablet', company: "Dr. Reddy's", supplier: 'Pharma Distributors', batch: 'AZ-3345', stock: 320, lowStockThreshold: 40, price: 145, cost: 98, unit: 'strip', expiry: '2026-10-21' },
  { _id: '6', name: 'Omeprazole 20mg', category: 'Capsule', company: 'Alkem', supplier: 'MedSupply Co.', batch: 'OM-7890', stock: 540, lowStockThreshold: 50, price: 65, cost: 42, unit: 'strip', expiry: '2027-01-15' },
  { _id: '7', name: 'Metformin 500mg', category: 'Tablet', company: 'USV', supplier: 'HealthFirst Supplies', batch: 'MF-4456', stock: 15, lowStockThreshold: 40, price: 28, cost: 15, unit: 'strip', expiry: '2026-09-30' },
  { _id: '8', name: 'Ibuprofen 400mg', category: 'Tablet', company: 'Zydus', supplier: 'Pharma Distributors', batch: 'IB-9901', stock: 890, lowStockThreshold: 60, price: 40, cost: 25, unit: 'strip', expiry: '2027-06-20' },
];

const allCategories = ['All', 'Tablet', 'Capsule', 'Syrup', 'Injection', 'Ointment', 'Drops'];
const allCompanies = ['All', ...new Set(mockMedicines.map((m) => m.company))];
const allSuppliers = ['All', ...new Set(mockMedicines.map((m) => m.supplier))];

const emptyMedicine = {
  name: '', category: 'Tablet', company: '', batch: '', stock: '', lowStockThreshold: '10', price: '', cost: '', unit: 'strip', expiry: '',
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

function isExpiringSoon(d, days = 30) {
  if (!d) return false;
  const diff = new Date(d).getTime() - Date.now();
  return diff > 0 && diff <= days * 86400000;
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
  const location = useLocation();
  const base = location.pathname.startsWith('/pharmacist') ? '/pharmacist' : '/admin';

  const [medicines, setMedicines] = useState(mockMedicines);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [companyFilter, setCompanyFilter] = useState('All');
  const [supplierFilter, setSupplierFilter] = useState('All');
  const [filterOpen, setFilterOpen] = useState(false);
  const filterRef = useRef(null);
  const [sort, setSort] = useState('newest');
  const [stockFilter, setStockFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(null);
  const [form, setForm] = useState(emptyMedicine);
  const [deleteId, setDeleteId] = useState(null);
  const [viewId, setViewId] = useState(null);

  useEffect(() => {
    if (!filterOpen) return undefined;
    const handler = (e) => {
      if (filterRef.current && !filterRef.current.contains(e.target)) setFilterOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [filterOpen]);

  const activeFilterCount =
    (categoryFilter !== 'All' ? 1 : 0) +
    (companyFilter !== 'All' ? 1 : 0) +
    (supplierFilter !== 'All' ? 1 : 0);

  const resetFilters = () => {
    setCategoryFilter('All');
    setCompanyFilter('All');
    setSupplierFilter('All');
    setStockFilter('all');
    setPage(1);
  };

  const chips = [
    { key: 'all', label: 'All', icon: Package, count: medicines.length },
    { key: 'low', label: 'Low Stock', icon: AlertTriangle, count: medicines.filter((m) => m.stock > 0 && m.stock <= m.lowStockThreshold).length },
    { key: 'out', label: 'Out of Stock', icon: PackageX, count: medicines.filter((m) => m.stock === 0).length },
    { key: 'expiring', label: 'Near Expiry', icon: AlarmClock, count: medicines.filter((m) => isExpiringSoon(m.expiry)).length },
  ];

  const chipActiveStyles = {
    all: 'border-accent bg-accent text-white',
    low: 'border-amber-500 bg-amber-500 text-white',
    out: 'border-red-600 bg-red-600 text-white',
    expiring: 'border-mustard-deep bg-mustard-deep text-white',
  };

  const chipCountStyles = {
    all: 'bg-accent-soft text-accent',
    low: 'bg-amber-50 text-amber-600',
    out: 'bg-red-50 text-red-600',
    expiring: 'bg-mustard-soft text-mustard-deep',
  };

  const exportCsv = () => {
    const headers = ['Name', 'Category', 'Company', 'Batch', 'Stock', 'Price', 'Cost', 'Unit', 'Expiry'];
    const rows = filtered.map((m) => [
      m.name, m.category, m.company, m.batch, m.stock, m.price, m.cost, m.unit, m.expiry,
    ]);
    const csv = [headers, ...rows]
      .map((r) => r.map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `inventory-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const computeFiltered = () => {
    let list = [...medicines];

    if (search) {
      const q = search.toLowerCase();
      list = list.filter((m) =>
        m.name.toLowerCase().includes(q) ||
        m.category.toLowerCase().includes(q) ||
        m.company.toLowerCase().includes(q) ||
        m.batch.toLowerCase().includes(q)
      );
    }

    if (categoryFilter !== 'All') {
      list = list.filter((m) => m.category === categoryFilter);
    }

    if (companyFilter !== 'All') {
      list = list.filter((m) => m.company === companyFilter);
    }

    if (supplierFilter !== 'All') {
      list = list.filter((m) => m.supplier === supplierFilter);
    }

    if (stockFilter === 'low') {
      list = list.filter((m) => m.stock > 0 && m.stock <= m.lowStockThreshold);
    } else if (stockFilter === 'out') {
      list = list.filter((m) => m.stock === 0);
    } else if (stockFilter === 'expiring') {
      list = list.filter((m) => isExpiringSoon(m.expiry));
    }

    const sortMap = {
      newest: (a, b) => new Date(b.expiry) - new Date(a.expiry),
      oldest: (a, b) => new Date(a.expiry) - new Date(b.expiry),
      name: (a, b) => a.name.localeCompare(b.name),
      price: (a, b) => b.price - a.price,
      stock: (a, b) => a.stock - b.stock,
    };
    list.sort(sortMap[sort] || sortMap.newest);

    return list;
  };

  const filtered = computeFiltered();

  const limit = 6;
  const totalPages = Math.max(Math.ceil(filtered.length / limit), 1);
  const paged = filtered.slice((page - 1) * limit, page * limit);

  const setField = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const handleSave = () => {
    if (!form.name || !form.category || !form.price || !form.stock) return;
    if (showModal === 'add') {
      setMedicines((prev) => [
        { ...form, _id: Date.now().toString(), stock: Number(form.stock), price: Number(form.price), cost: Number(form.cost || 0), lowStockThreshold: Number(form.lowStockThreshold || 10) },
        ...prev,
      ]);
    } else {
      setMedicines((prev) =>
        prev.map((m) =>
          m._id === showModal
            ? { ...m, ...form, stock: Number(form.stock), price: Number(form.price), cost: Number(form.cost || 0), lowStockThreshold: Number(form.lowStockThreshold || 10) }
            : m
        )
      );
    }
    setShowModal(null);
    setForm(emptyMedicine);
  };

  const handleDelete = () => {
    setMedicines((prev) => prev.filter((m) => m._id !== deleteId));
    setDeleteId(null);
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
            <h2 className="text-2xl font-bold text-heading md:text-3xl">Inventory Management</h2>
            <p className="mt-1 text-[14px] text-body">Track medicine stock, reorder levels and expiry.</p>
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={exportCsv}
            className="inline-flex items-center gap-2 rounded-lgx border border-line bg-surface px-4 py-2.5 text-[14px] font-semibold text-heading transition-colors hover:bg-bgsecondary"
          >
            <Download size={16} />
            Export CSV
          </button>
          <button
            onClick={() => { setForm(emptyMedicine); setShowModal('add'); }}
            className="inline-flex items-center gap-2 rounded-lgx bg-accent px-5 py-2.5 text-[14px] font-semibold text-white transition-all hover:-translate-y-px hover:bg-accent-hover"
          >
            <Plus size={16} />
            Add Stock
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-body" />
          <input
            type="text"
            placeholder="Search by name, batch, company..."
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
              <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.12em] text-body">Filter Inventory</p>

              <div className="mb-3">
                <label className="mb-1.5 block text-[13px] font-medium text-heading">Category</label>
                <select
                  value={categoryFilter}
                  onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
                  className="h-10 w-full rounded-lg border border-line bg-bgprimary px-3 text-[14px] text-heading focus:border-accent focus:outline-none focus:ring-[3px] focus:ring-accent/10"
                >
                  {allCategories.map((c) => (
                    <option key={c} value={c}>{c === 'All' ? 'All Categories' : c}</option>
                  ))}
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

              <div className="mb-4">
                <label className="mb-1.5 block text-[13px] font-medium text-heading">Supplier</label>
                <select
                  value={supplierFilter}
                  onChange={(e) => { setSupplierFilter(e.target.value); setPage(1); }}
                  className="h-10 w-full rounded-lg border border-line bg-bgprimary px-3 text-[14px] text-heading focus:border-accent focus:outline-none focus:ring-[3px] focus:ring-accent/10"
                >
                  {allSuppliers.map((s) => (
                    <option key={s} value={s}>{s === 'All' ? 'All Suppliers' : s}</option>
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

      {/* Stock status chips */}
      <div className="flex flex-wrap items-center gap-2.5">
        {chips.map((c) => {
          const active = stockFilter === c.key;
          return (
            <button
              key={c.key}
              onClick={() => setStockFilter(c.key)}
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
            {paged.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-16 text-center text-[14px] text-body">
                  <Pill size={36} className="mx-auto mb-3 text-line" />
                  No medicines found
                </td>
              </tr>
            )}
            {paged.map((m) => {
              const status = getStatus(m.stock, m.lowStockThreshold);
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
                  <td className="px-4 py-3 text-right text-[14px] font-semibold text-heading">{m.stock.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right text-[14px] font-semibold text-heading">₹{m.price}</td>
                  <td className={`px-4 py-3 text-right text-[13px] font-semibold hidden sm:table-cell ${expiring ? 'text-red-600' : 'text-body'}`}>
                    {formatDate(m.expiry)}
                    {expiring && <AlertTriangle size={13} className="ml-1 inline text-red-500" />}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className={`inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-[12px] font-semibold ${status.color}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
                      {status.label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => setViewId(m._id)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-body transition-colors hover:bg-bgsecondary hover:text-heading"
                        title="View details"
                      >
                        <Eye size={15} />
                      </button>
                      <button
                        onClick={() => { setForm({ ...m }); setShowModal(m._id); }}
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
              <h3 className="text-lg font-bold text-heading">{showModal === 'add' ? 'Add Stock Item' : 'Edit Stock Item'}</h3>
              <button onClick={() => setShowModal(null)} className="flex h-8 w-8 items-center justify-center rounded-lg text-body hover:bg-bgsecondary hover:text-heading">
                <X size={18} />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4 px-6 py-5 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-[13px] font-medium text-heading">Medicine Name *</label>
                <input value={form.name} onChange={(e) => setField('name', e.target.value)} className="h-10 w-full rounded-lg border border-line bg-bgprimary px-3.5 text-[14px] text-heading placeholder:text-[#B5A99A] focus:border-accent focus:outline-none focus:ring-[3px] focus:ring-accent/10" placeholder="e.g. Paracetamol 500mg" />
              </div>

              <div>
                <label className="mb-1.5 block text-[13px] font-medium text-heading">Category *</label>
                <select value={form.category} onChange={(e) => setField('category', e.target.value)} className="h-10 w-full rounded-lg border border-line bg-bgprimary px-3 text-[14px] text-heading focus:border-accent focus:outline-none focus:ring-[3px] focus:ring-accent/10">
                  {allCategories.filter((c) => c !== 'All').map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-[13px] font-medium text-heading">Company</label>
                <input value={form.company} onChange={(e) => setField('company', e.target.value)} className="h-10 w-full rounded-lg border border-line bg-bgprimary px-3.5 text-[14px] text-heading placeholder:text-[#B5A99A] focus:border-accent focus:outline-none focus:ring-[3px] focus:ring-accent/10" placeholder="e.g. Cipla" />
              </div>

              <div>
                <label className="mb-1.5 block text-[13px] font-medium text-heading">Batch Number</label>
                <input value={form.batch} onChange={(e) => setField('batch', e.target.value)} className="h-10 w-full rounded-lg border border-line bg-bgprimary px-3.5 text-[14px] text-heading placeholder:text-[#B5A99A] focus:border-accent focus:outline-none focus:ring-[3px] focus:ring-accent/10" placeholder="e.g. AC-2201" />
              </div>

              <div>
                <label className="mb-1.5 block text-[13px] font-medium text-heading">Unit</label>
                <select value={form.unit} onChange={(e) => setField('unit', e.target.value)} className="h-10 w-full rounded-lg border border-line bg-bgprimary px-3 text-[14px] text-heading focus:border-accent focus:outline-none focus:ring-[3px] focus:ring-accent/10">
                  {['strip', 'tablet', 'bottle', 'box', 'vial', 'sachet'].map((u) => <option key={u} value={u}>{u.charAt(0).toUpperCase() + u.slice(1)}</option>)}
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-[13px] font-medium text-heading">Selling Price (₹) *</label>
                <input type="number" min="0" value={form.price} onChange={(e) => setField('price', e.target.value)} className="h-10 w-full rounded-lg border border-line bg-bgprimary px-3.5 text-[14px] text-heading placeholder:text-[#B5A99A] focus:border-accent focus:outline-none focus:ring-[3px] focus:ring-accent/10" placeholder="0" />
              </div>

              <div>
                <label className="mb-1.5 block text-[13px] font-medium text-heading">Purchase Price (₹)</label>
                <input type="number" min="0" value={form.cost} onChange={(e) => setField('cost', e.target.value)} className="h-10 w-full rounded-lg border border-line bg-bgprimary px-3.5 text-[14px] text-heading placeholder:text-[#B5A99A] focus:border-accent focus:outline-none focus:ring-[3px] focus:ring-accent/10" placeholder="0" />
              </div>

              <div>
                <label className="mb-1.5 block text-[13px] font-medium text-heading">Stock Qty *</label>
                <input type="number" min="0" value={form.stock} onChange={(e) => setField('stock', e.target.value)} className="h-10 w-full rounded-lg border border-line bg-bgprimary px-3.5 text-[14px] text-heading placeholder:text-[#B5A99A] focus:border-accent focus:outline-none focus:ring-[3px] focus:ring-accent/10" placeholder="0" />
              </div>

              <div>
                <label className="mb-1.5 block text-[13px] font-medium text-heading">Low Stock Threshold</label>
                <input type="number" min="0" value={form.lowStockThreshold} onChange={(e) => setField('lowStockThreshold', e.target.value)} className="h-10 w-full rounded-lg border border-line bg-bgprimary px-3.5 text-[14px] text-heading placeholder:text-[#B5A99A] focus:border-accent focus:outline-none focus:ring-[3px] focus:ring-accent/10" placeholder="10" />
              </div>

              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-[13px] font-medium text-heading">Expiry Date</label>
                <input type="date" value={form.expiry ? new Date(form.expiry).toISOString().split('T')[0] : ''} onChange={(e) => setField('expiry', e.target.value)} className="h-10 w-full rounded-lg border border-line bg-bgprimary px-3.5 text-[14px] text-heading focus:border-accent focus:outline-none focus:ring-[3px] focus:ring-accent/10" />
              </div>
            </div>

            <div className="sticky bottom-0 flex items-center justify-end gap-3 border-t border-line bg-surface/95 px-6 py-4 backdrop-blur-md">
              <button onClick={() => setShowModal(null)} className="h-10 rounded-lg border border-line bg-surface px-5 text-[14px] font-semibold text-heading transition-colors hover:bg-bgsecondary">
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={!form.name || !form.price || !form.stock}
                className="h-10 rounded-lg bg-accent px-6 text-[14px] font-semibold text-white transition-all hover:-translate-y-px hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-60"
              >
                {showModal === 'add' ? 'Add Stock' : 'Save Changes'}
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
              <h3 className="text-lg font-bold text-heading">Stock Item Details</h3>
              <button onClick={() => setViewId(null)} className="flex h-8 w-8 items-center justify-center rounded-lg text-body hover:bg-bgsecondary hover:text-heading">
                <X size={18} />
              </button>
            </div>

            {(() => {
              const m = medicines.find((x) => x._id === viewId);
              if (!m) return null;
              const status = getStatus(m.stock, m.lowStockThreshold);
              const rows = [
                { label: 'Category', value: m.category },
                { label: 'Company', value: m.company || '—' },
                { label: 'Batch Number', value: m.batch || '—' },
                { label: 'Unit', value: m.unit.charAt(0).toUpperCase() + m.unit.slice(1) },
                { label: 'Stock Quantity', value: m.stock.toLocaleString() },
                { label: 'Low Stock Threshold', value: m.lowStockThreshold },
                { label: 'Selling Price', value: `₹${m.price}` },
                { label: 'Purchase Price', value: m.cost ? `₹${m.cost}` : '—' },
                { label: 'Expiry Date', value: formatDate(m.expiry) },
              ];
              return (
                <>
                  <div className="px-6 pt-5">
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
                onClick={() => { setForm({ ...medicines.find((m) => m._id === viewId) }); setViewId(null); setShowModal(viewId); }}
                className="inline-flex items-center gap-2 rounded-lg bg-accent px-5 py-2.5 text-[14px] font-semibold text-white transition-all hover:-translate-y-px hover:bg-accent-hover"
              >
                <Edit2 size={15} />
                Edit Stock Item
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
            <h3 className="mt-4 text-lg font-bold text-heading">Delete Stock Item</h3>
            <p className="mt-2 text-[14px] leading-relaxed text-body">
              Are you sure you want to delete <span className="font-semibold text-heading">{medicines.find((m) => m._id === deleteId)?.name}</span>? This action cannot be undone.
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