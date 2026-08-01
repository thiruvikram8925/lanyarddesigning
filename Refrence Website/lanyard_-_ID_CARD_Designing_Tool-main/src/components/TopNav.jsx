import { Home, Palette, LayoutTemplate, Package, ShieldCheck, LogOut, Menu, X, ChevronDown, FolderOpen, Bell } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const NAV_ITEMS = [
  { key: 'Dashboard', label: 'Home', icon: Home },
  { key: 'NewProject', label: 'Create', icon: Palette },
  { key: 'Templates', label: 'Templates', icon: LayoutTemplate },
  { key: 'Orders', label: 'Orders', icon: Package },
];

const ROUTE_MAP = {
  Dashboard: '/dashboard', NewProject: '/new-project', Editor: '/editor',
  Templates: '/templates', Orders: '/orders', AdminDashboard: '/admin',
  Customizer: '/editor', IdCardPro: '/bulk-import', ExportFlow: '/export',
};

export default function TopNav({ user, onLogout, isAdmin }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Hide entirely in editor mode
  if (location.pathname === '/editor' || location.pathname === '/id-card-designer') return null;

  useEffect(() => {
    const handler = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const go = (key) => {
    let dest = ROUTE_MAP[key] || '/dashboard';
    if (isAdmin && (key === 'Dashboard' || dest === '/dashboard')) {
      dest = '/admin';
    }
    navigate(dest);
    setMobileOpen(false);
    setUserMenuOpen(false);
  };

  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : user?.email?.[0]?.toUpperCase() || 'U';

  return (
    <>
      <header className="h-14 bg-white border-b border-slate-200 flex items-center px-4 lg:px-6 shrink-0 z-50 relative">
        {/* Logo */}
        <div
          className="flex items-center gap-2.5 cursor-pointer mr-8 shrink-0"
          onClick={() => go('Dashboard')}
        >
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white font-black text-sm shadow-sm">M</div>
          <span className="text-[14px] font-black text-slate-900 hidden sm:block tracking-tight">MyLanyard</span>
          <span className="hidden sm:block text-[9px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded uppercase tracking-widest">Studio</span>
        </div>

        {/* Desktop Nav */}
        <nav className="hidden lg:flex items-center gap-0.5 flex-1">
          {NAV_ITEMS.map(({ key, label, icon: Icon }) => {
            const active = location.pathname === ROUTE_MAP[key];
            return (
              <button
                key={key}
                onClick={() => go(key)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-[13px] font-semibold transition-all duration-150 ${
                  active
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon size={15} className={active ? 'text-indigo-600' : 'text-slate-400'} />
                {label}
              </button>
            );
          })}

          {isAdmin && (
            <button
              onClick={() => go('AdminDashboard')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-[13px] font-semibold transition-all ml-2 border ${
                location.pathname === ROUTE_MAP['AdminDashboard']
                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                  : 'text-slate-500 hover:bg-slate-100 border-transparent'
              }`}
            >
              <ShieldCheck size={15} className={location.pathname === ROUTE_MAP['AdminDashboard'] ? 'text-rose-500' : 'text-slate-400'} />
              Admin
            </button>
          )}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-2 ml-auto">
          {/* Notification bell */}
          <button className="hidden sm:flex p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors relative">
            <Bell size={16} />
          </button>

          {/* User menu */}
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setUserMenuOpen(v => !v)}
              className="flex items-center gap-2 pl-1.5 pr-2.5 py-1.5 rounded-xl hover:bg-slate-100 transition-colors"
            >
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white text-[11px] font-black flex items-center justify-center shrink-0 shadow-sm">
                {initials}
              </div>
              <span className="hidden sm:block text-[13px] font-semibold text-slate-700 max-w-[100px] truncate">{user?.name || user?.email}</span>
              <ChevronDown size={13} className="text-slate-400 hidden sm:block" />
            </button>

            {userMenuOpen && (
              <div className="absolute right-0 top-full mt-1.5 w-56 bg-white border border-slate-200 rounded-2xl shadow-xl py-2 z-50 overflow-hidden">
                <div className="px-4 py-2.5 border-b border-slate-100 mb-1">
                  <p className="text-[13px] font-bold text-slate-900 truncate">{user?.name}</p>
                  <p className="text-[11px] text-slate-400 truncate">{user?.email}</p>
                </div>
                <button
                  onClick={() => go('Dashboard')}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-[13px] text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  <Home size={14} className="text-slate-400" /> Dashboard
                </button>
                <button
                  onClick={() => go('Orders')}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-[13px] text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  <Package size={14} className="text-slate-400" /> My Orders
                </button>
                <div className="border-t border-slate-100 my-1" />
                <button
                  onClick={() => { setUserMenuOpen(false); onLogout(); }}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-[13px] text-red-500 hover:bg-red-50 transition-colors"
                >
                  <LogOut size={14} /> Sign Out
                </button>
              </div>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen(v => !v)}
            className="lg:hidden p-2 rounded-xl hover:bg-slate-100 text-slate-600 transition-colors"
          >
            {mobileOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </header>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40 flex" onClick={() => setMobileOpen(false)}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div className="relative ml-auto w-72 bg-white h-full shadow-2xl flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b border-slate-100 flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white font-black shadow-sm">M</div>
              <div>
                <p className="text-[14px] font-black text-slate-900">MyLanyard Studio</p>
                <p className="text-[11px] text-slate-400">{user?.email}</p>
              </div>
            </div>
            <nav className="flex-1 p-3 space-y-0.5">
              {NAV_ITEMS.map(({ key, label, icon: Icon }) => {
                const active = location.pathname === ROUTE_MAP[key];
                return (
                  <button
                    key={key}
                    onClick={() => go(key)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[13px] font-semibold transition-all ${
                      active ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <Icon size={16} className={active ? 'text-indigo-600' : 'text-slate-400'} />{label}
                  </button>
                );
              })}
              {isAdmin && (
                <button
                  onClick={() => go('AdminDashboard')}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[13px] text-slate-600 hover:bg-slate-100"
                >
                  <ShieldCheck size={16} className="text-slate-400" /> Admin
                </button>
              )}
            </nav>
            <div className="p-3 border-t border-slate-100">
              <button
                onClick={() => { setMobileOpen(false); onLogout(); }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[13px] text-red-500 hover:bg-red-50 transition-colors"
              >
                <LogOut size={16} /> Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
