import { useState, useEffect, useRef } from 'react';
import { Link, NavLink, Outlet, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  ShieldCheck,
  X,
  ChevronsLeft,
  LogOut,
  Menu,
  Bell,
  LayoutDashboard,
  FlaskConical,
  Archive,
  Truck,
  ClipboardList,
  Users,
  Receipt,
  BarChart3,
  UserPlus,
  UserCircle,
} from 'lucide-react';
import { logout } from '../features/authSlice';

const NAV_ITEMS = (base) => [
  { to: base, label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'pharmacist'], end: true },
  { to: `${base}/medicines`, label: 'Medicine Management', icon: FlaskConical, roles: ['admin', 'pharmacist'] },
  { to: `${base}/suppliers`, label: 'Supplier Management', icon: Truck, roles: ['admin'] },
  { to: `${base}/inventory`, label: 'Inventory Management', icon: Archive, roles: ['admin', 'pharmacist'] },
  // { to: `${base}/pharmacists`, label: 'Pharmacist Management', icon: UserPlus, roles: ['admin'] },
  // { to: `${base}/purchases`, label: 'Purchase Orders', icon: ClipboardList, roles: ['admin'] },
  { to: `${base}/customers`, label: 'Customer Management', icon: Users, roles: ['admin', 'pharmacist'] },
  { to: `${base}/billing`, label: 'Billing', icon: Receipt, roles: ['admin', 'pharmacist'] },
  { to: `${base}/reports`, label: 'Reports', icon: BarChart3, roles: ['admin'] },
  { to: `${base}/notifications`, label: 'Notifications', icon: Bell, roles: ['admin', 'pharmacist'] },
  { to: `${base}/profile`, label: 'My Profile', icon: UserCircle, roles: ['admin', 'pharmacist'] },
];

const matchesItem = (item, pathname) =>
  item.end ? pathname === item.to : pathname === item.to || pathname.startsWith(`${item.to}/`);

const getPageTitle = (pathname, base) => {
  const item = NAV_ITEMS(base).find((i) => matchesItem(i, pathname));
  return item ? item.label : 'Dashboard';
};

function Sidebar({ base, role, collapsed, onToggleCollapse, mobileOpen, onCloseMobile }) {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);
  const items = NAV_ITEMS(base).filter((i) => i.roles.includes(role));

  const initials = (user?.name || 'U')
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const handleLogout = async () => {
    await dispatch(logout());
    navigate('/login', { replace: true });
  };

  return (
    <>
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden" onClick={onCloseMobile} />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[260px] flex-col bg-darkpanel text-darktext transition-all duration-300 ${
          collapsed ? 'lg:w-[78px]' : 'lg:w-[260px]'
        } ${mobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'} lg:translate-x-0`}
      >
        {/* Brand */}
        <div className="flex h-16 shrink-0 items-center gap-2.5 px-5">
          <Link to={base} className="flex min-w-0 items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-accent text-white shadow-[0_4px_12px_rgba(193,89,46,0.45)]">
              <ShieldCheck size={20} strokeWidth={2.4} />
            </span>
            <span
              className={`font-display whitespace-nowrap text-[1.1rem] font-bold tracking-tight text-darktext ${
                collapsed ? 'lg:hidden' : ''
              }`}
            >
              MedHeritage
            </span>
          </Link>

          <button
            type="button"
            onClick={onCloseMobile}
            aria-label="Close menu"
            className="ml-auto flex h-8 w-8 items-center justify-center rounded-lg text-darktext/50 transition-colors hover:bg-white/10 hover:text-darktext lg:hidden"
          >
            <X size={18} />
          </button>
        </div>

        <div className="mx-5 mb-1 h-px bg-white/10" />

        {/* Nav */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          <p
            className={`mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-darktext/40 ${
              collapsed ? 'lg:hidden' : ''
            }`}
          >
            Main Menu
          </p>
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={onCloseMobile}
              title={collapsed ? item.label : undefined}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13.5px] transition-all ${
                  isActive
                    ? 'bg-accent font-semibold text-white shadow-[0_4px_14px_rgba(193,89,46,0.35)]'
                    : 'font-medium text-darktext/55 hover:bg-white/5 hover:text-darktext'
                } ${collapsed ? 'lg:justify-center lg:px-0' : ''}`
              }
            >
              <item.icon size={20} strokeWidth={2.1} className="shrink-0" />
              <span className={`whitespace-nowrap ${collapsed ? 'lg:hidden' : ''}`}>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="shrink-0 space-y-2 border-t border-white/10 p-3">
          <div className={`flex items-center gap-3 rounded-xl bg-white/5 p-3 ${collapsed ? 'lg:hidden' : ''}`}>
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent-soft text-[13px] font-bold text-accent">
              {initials}
            </span>
            <div className="min-w-0 leading-tight">
              <p className="truncate text-[13.5px] font-semibold text-darktext">{user?.name}</p>
              <p className="text-[11px] capitalize text-darktext/45">{role}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            title={collapsed ? 'Logout' : undefined}
            className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-semibold text-darktext/50 transition-colors hover:bg-white/10 hover:text-red-400 ${
              collapsed ? 'lg:justify-center lg:px-0' : ''
            }`}
          >
            <LogOut size={18} className="shrink-0" />
            <span className={collapsed ? 'lg:hidden' : ''}>Logout</span>
          </button>
          <button
            type="button"
            onClick={onToggleCollapse}
            title={collapsed ? 'Expand' : 'Collapse'}
            className={`hidden w-full items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-semibold text-darktext/50 transition-colors hover:bg-white/10 hover:text-darktext lg:flex ${
              collapsed ? 'lg:justify-center lg:px-0' : ''
            }`}
          >
            <ChevronsLeft size={18} className={`shrink-0 transition-transform duration-300 ${collapsed ? 'rotate-180' : ''}`} />
            <span className={collapsed ? 'lg:hidden' : ''}>Collapse</span>
          </button>
        </div>
      </aside>
    </>
  );
}

function TopNavbar({ base, onMenuClick }) {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const location = useLocation();
  const user = useSelector((state) => state.auth.user);
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const menuRef = useRef(null);
  const notifRef = useRef(null);

  useEffect(() => {
    if (!menuOpen) return undefined;
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menuOpen]);

  useEffect(() => {
    if (!notifOpen) return undefined;
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [notifOpen]);

  const role = user?.role || 'pharmacist';
  const title = getPageTitle(location.pathname, base);

  const initials = (user?.name || 'U')
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const handleLogout = async () => {
    await dispatch(logout());
    navigate('/login', { replace: true });
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-line bg-surface/85 px-4 backdrop-blur sm:gap-4 sm:px-6">
      <button
        type="button"
        onClick={onMenuClick}
        aria-label="Open menu"
        className="flex h-9 w-9 items-center justify-center rounded-lg text-heading transition-colors hover:bg-bgsecondary lg:hidden"
      >
        <Menu size={22} />
      </button>

      <div className="min-w-0">
        <h1 className="truncate text-[15px] font-bold text-heading sm:text-[17px]">{title}</h1>
        <p className="hidden text-[12px] text-body sm:block">
          {role === 'admin' ? 'manage your pharmacy here' : 'serve your customers here'}
        </p>
      </div>

      <div className="flex-1" />

      <div className="relative" ref={notifRef}>
        <button
          type="button"
          aria-label="Notifications"
          onClick={() => {
            setNotifOpen(!notifOpen);
            setMenuOpen(false);
          }}
          className={`flex h-9 w-9 items-center justify-center rounded-lg transition-colors ${
            notifOpen ? 'bg-bgsecondary text-accent' : 'text-body hover:bg-bgsecondary hover:text-accent'
          }`}
        >
          <Bell size={19} />
        </button>
        {notifOpen && (
          <div className="absolute right-0 z-50 mt-2 w-80 max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl border border-line bg-surface shadow-xl">
            <p className="border-b border-line px-4 py-3 text-[12px] font-bold uppercase tracking-wider text-body">
              Notifications
            </p>
            <div className="px-4 py-8 text-center">
              <Bell size={22} className="mx-auto mb-2 text-body/40" />
              <p className="text-[12.5px] text-body">No notifications yet</p>
            </div>
            <Link
              to={`${base}/notifications`}
              onClick={() => setNotifOpen(false)}
              className="block w-full px-4 py-2.5 text-center text-[12px] font-bold text-accent transition-colors hover:bg-bgsecondary"
            >
              View All
            </Link>
          </div>
        )}
      </div>

      <div className="hidden h-6 w-px bg-line sm:block" />

      <div className="relative" ref={menuRef}>
        <button
          type="button"
          onClick={() => {
            setMenuOpen(!menuOpen);
            setNotifOpen(false);
          }}
          className="flex items-center gap-2.5 rounded-lg p-1.5 pr-2 transition-colors hover:bg-bgsecondary"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent text-[12px] font-bold text-white">
            {initials}
          </span>
          <span className="hidden text-left sm:block">
            <span className="block max-w-[140px] truncate text-[13px] font-bold leading-tight text-heading">
              {user?.name}
            </span>
            <span className="block text-[10.5px] capitalize leading-tight text-body">{user?.role}</span>
          </span>
        </button>
        {menuOpen && (
          <div className="absolute right-0 z-50 mt-2 w-56 overflow-hidden rounded-xl border border-line bg-surface shadow-xl">
            <div className="border-b border-line px-4 py-3">
              <p className="truncate text-[13px] font-bold text-heading">{user?.name}</p>
              <p className="truncate text-[11.5px] text-body">{user?.email}</p>
            </div>
            <Link
              to={`${base}/profile`}
              onClick={() => setMenuOpen(false)}
              className="flex w-full items-center gap-2.5 px-4 py-3 text-[13px] font-semibold text-heading transition-colors hover:bg-bgsecondary"
            >
              <UserCircle size={16} />
              My Profile
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="flex w-full items-center gap-2.5 px-4 py-3 text-[13px] font-semibold text-red-600 transition-colors hover:bg-red-50"
            >
              <LogOut size={16} />
              Logout
            </button>
          </div>
        )}
      </div>
    </header>
  );
}

export default function DashboardLayout() {
  const user = useSelector((state) => state.auth.user);
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const role = user?.role || 'pharmacist';
  const base = role === 'admin' ? '/admin' : '/pharmacist';

  const items = NAV_ITEMS(base).filter((i) => i.roles.includes(role));
  const isAllowed = items.some((i) => matchesItem(i, location.pathname));

  if (!isAllowed) {
    return <Navigate to={base} replace />;
  }

  return (
    <div className="min-h-screen bg-bgprimary">
      <Sidebar
        base={base}
        role={role}
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed(!collapsed)}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />
      <div className={`transition-all duration-300 ${collapsed ? 'lg:pl-[78px]' : 'lg:pl-[260px]'}`}>
        <TopNavbar base={base} onMenuClick={() => setMobileOpen(true)} />
        <main className="mx-auto max-w-[1400px] p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}