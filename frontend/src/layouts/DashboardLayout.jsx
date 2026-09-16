import { useState, useEffect, useRef } from 'react';
import { Link, NavLink, Outlet, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  ShieldCheck,
  X,
  LogOut,
  Menu,
  Bell,
  LayoutDashboard,
  FlaskConical,
  Archive,
  Truck,
  Users,
  UserCog,
  UserCircle,
  ShoppingCart,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { logout } from '../features/authSlice';

const NAV_ITEMS = (base) => [
  { to: base, label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'pharmacist'], end: true },
  { to: `${base}/medicines`, label: 'Medicine Management', icon: FlaskConical, roles: ['admin', 'pharmacist'] },
  { to: `${base}/pharmacists`, label: 'Pharmacist Management', icon: UserCog, roles: ['admin'] },
  { to: `${base}/suppliers`, label: 'Supplier Management', icon: Truck, roles: ['admin', 'pharmacist'] },
  { to: `${base}/purchases`, label: 'Purchase Orders', icon: ShoppingCart, roles: ['admin', 'pharmacist'] },
  { to: `${base}/inventory`, label: 'Inventory Management', icon: Archive, roles: ['admin', 'pharmacist'] },
  { to: `${base}/customers`, label: 'Customer Management', icon: Users, roles: ['admin', 'pharmacist'] },
  { to: `${base}/profile`, label: 'My Profile', icon: UserCircle, roles: ['admin', 'pharmacist'] },
];

const matchesItem = (item, pathname) =>
  item.end ? pathname === item.to : pathname === item.to || pathname.startsWith(`${item.to}/`);

const getPageTitle = (pathname, base) => {
  const item = NAV_ITEMS(base).find((i) => matchesItem(i, pathname));
  return item ? item.label : 'Dashboard';
};

function getInitials(name) {
  return (name || 'U')
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

function Sidebar({ base, role, open, onClose }) {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);
  const items = NAV_ITEMS(base).filter((i) => i.roles.includes(role));

  const handleLogout = async () => {
    await dispatch(logout());
    toast.success('Logged out successfully');
    navigate('/login', { replace: true });
  };

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-50 flex w-[280px] flex-col bg-surface shadow-2xl transition-transform duration-300 ease-out ${
        open ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      {/* Brand */}
      <div className="flex h-16 shrink-0 items-center justify-between border-b border-line px-5">
        <Link to={base} onClick={onClose} className="flex min-w-0 items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent text-white shadow-[0_4px_12px_rgba(193,89,46,0.35)]">
            <ShieldCheck size={19} strokeWidth={2.4} />
          </span>
          <span className="font-display whitespace-nowrap text-[1.15rem] font-bold tracking-tight text-heading">
            MedHeritage
          </span>
        </Link>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close menu"
          className="flex h-8 w-8 items-center justify-center rounded-lg text-body transition-colors hover:bg-bgsecondary hover:text-heading"
        >
          <X size={18} />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-5">
        <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-body/50">
          {role === 'admin' ? 'Admin Menu' : 'Menu'}
        </p>
        <div className="space-y-1">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={onClose}
              className={({ isActive }) =>
                `relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13.5px] transition-colors ${
                  isActive
                    ? 'bg-accent-soft font-semibold text-accent'
                    : 'font-medium text-body hover:bg-bgsecondary hover:text-heading'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-accent" />
                  )}
                  <item.icon size={19} strokeWidth={2.1} className="shrink-0" />
                  <span className="whitespace-nowrap">{item.label}</span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>

      {/* Footer */}
      <div className="shrink-0 space-y-2 border-t border-line p-3">
        <div className="flex items-center gap-3 rounded-xl bg-bgprimary/80 p-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent text-[13px] font-bold text-white">
            {getInitials(user?.name)}
          </span>
          <div className="min-w-0 leading-tight">
            <p className="truncate text-[13.5px] font-semibold text-heading">{user?.name}</p>
            <p className="text-[11px] capitalize text-body">{role}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-semibold text-body transition-colors hover:bg-red-50 hover:text-red-600"
        >
          <LogOut size={18} className="shrink-0" />
          Logout
        </button>
      </div>
    </aside>
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

  const handleLogout = async () => {
    await dispatch(logout());
    toast.success('Logged out successfully');
    navigate('/login', { replace: true });
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-line bg-surface/85 px-4 backdrop-blur sm:gap-4 sm:px-6">
      <button
        type="button"
        onClick={onMenuClick}
        aria-label="Open menu"
        className="flex h-10 w-10 items-center justify-center rounded-xl border border-line bg-surface text-heading shadow-sm transition-colors hover:bg-bgsecondary"
      >
        <Menu size={20} />
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
            {getInitials(user?.name)}
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
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const role = user?.role || 'pharmacist';
  const base = role === 'admin' ? '/admin' : '/pharmacist';

  const items = NAV_ITEMS(base).filter((i) => i.roles.includes(role));
  const isAllowed = items.some((i) => matchesItem(i, location.pathname));

  if (!isAllowed) {
    return <Navigate to={base} replace />;
  }

  return (
    <div className="min-h-screen bg-bgprimary">
      {/* backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <Sidebar
        base={base}
        role={role}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div>
        <TopNavbar base={base} onMenuClick={() => setSidebarOpen(true)} />
        <main className="mx-auto w-full max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}