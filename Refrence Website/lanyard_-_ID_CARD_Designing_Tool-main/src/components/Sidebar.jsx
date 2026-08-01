import { Home, Palette, Heart, ShieldCheck, LogOut, GripVertical, BookOpen, Shirt, Layers } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';

const SidebarLink = ({ icon: Icon, label, active = false, onClick }) => (
  <div
    onClick={onClick}
    className={`flex items-center gap-3 px-4 py-2.5 mx-2 rounded-lg cursor-pointer transition-all duration-200 group ${
      active 
        ? 'bg-indigo-600 text-white font-medium shadow-sm' 
        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-medium'
    }`}
  >
    <Icon size={18} className={`${active ? 'text-white' : 'text-slate-400 group-hover:text-slate-600'}`} />
    <span className="text-[13px]">{label}</span>
    {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white opacity-80" />}
  </div>
);

export default function Sidebar({ activePage, onNavigate, isAdmin, onLogout, children, onSave, saveMessage }) {
  const isCustomizer = activePage === 'Customizer';
  const [width, setWidth] = useState(isCustomizer ? 500 : 240);
  const [isResizing, setIsResizing] = useState(false);

  // Sync width when mode changes
  useEffect(() => {
    setWidth(isCustomizer ? 500 : 240);
  }, [isCustomizer]);

  const startResizing = useCallback((e) => {
    setIsResizing(true);
    e.preventDefault();
  }, []);

  const stopResizing = useCallback(() => {
    setIsResizing(false);
  }, []);

  const resize = useCallback((e) => {
    if (isResizing) {
      const newWidth = e.clientX;
      if (newWidth >= 240 && newWidth <= 600) {
        setWidth(newWidth);
      }
    }
  }, [isResizing]);

  useEffect(() => {
    if (isResizing) {
      window.addEventListener('mousemove', resize);
      window.addEventListener('mouseup', stopResizing);
    } else {
      window.removeEventListener('mousemove', resize);
      window.removeEventListener('mouseup', stopResizing);
    }
    return () => {
      window.removeEventListener('mousemove', resize);
      window.removeEventListener('mouseup', stopResizing);
    };
  }, [isResizing, resize, stopResizing]);

  return (
    <aside 
      style={{ width: isCustomizer ? `${width}px` : '240px' }}
      className={`bg-white h-screen sticky top-0 border-r border-[#f1f1f1] flex flex-col overflow-hidden z-50 group/sidebar relative ${isResizing ? 'transition-none' : 'transition-all duration-300'}`}
    >
      {/* Resize Handle — design workspace only */}
      {isCustomizer ? (
        <div
          onMouseDown={startResizing}
          className={`absolute right-0 top-0 w-1.5 h-full cursor-col-resize hover:bg-[#5d5fef]/30 transition-colors z-50 flex items-center justify-center group ${isResizing ? 'bg-[#5d5fef]/50' : ''}`}
        >
          <div className={`w-4 h-8 rounded-full bg-white border border-[#eef2f6] shadow-sm flex items-center justify-center absolute -right-2 opacity-0 group-hover:opacity-100 transition-opacity ${isResizing ? 'opacity-100' : ''}`}>
            <GripVertical size={10} className="text-[#919191]" />
          </div>
        </div>
      ) : null}

      <div className="p-5 mb-1 shrink-0 border-b border-slate-100">
        <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => onNavigate('Dashboard')}>
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-base shadow-sm">
            M
          </div>
          <div>
            <h1 className="text-[15px] font-bold text-slate-900 tracking-tight leading-none">MyLanyard</h1>
            <p className="text-[10px] text-slate-400 font-medium mt-0.5">Enterprise Studio</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto panel-scroll flex flex-col">
        {isCustomizer ? (
          <div className="flex flex-col h-full flex-1">
            <div className="flex-1 flex flex-col min-h-0">
              {children}
            </div>
          </div>
        ) : (
          <div className="min-w-[200px] space-y-1.5 pr-3">
            {!isAdmin && (
              <>
                <SidebarLink icon={Home} label="Dashboard & Orders" active={activePage === 'Dashboard'} onClick={() => onNavigate('Dashboard')} />
                <SidebarLink icon={Palette} label="Design Studio" active={activePage === 'Customizer'} onClick={() => onNavigate('Customizer')} />
                <SidebarLink icon={Layers} label="Bulk Institution Order" active={activePage === 'IdCardPro'} onClick={() => onNavigate('IdCardPro')} />
              </>
            )}
            
            {isAdmin && (
              <>
                <div className="px-4 py-2 mt-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Admin Area</div>
                <SidebarLink icon={ShieldCheck} label="Order Management" active={activePage === 'AdminDashboard'} onClick={() => onNavigate('AdminDashboard')} />
              </>
            )}
          </div>
        )}
      </nav>

      <div className="p-4 border-t border-[#f1f1f1] bg-white shrink-0">
        <button 
          onClick={onLogout}
          className="flex items-center gap-3 px-5 py-3 w-full text-[#b2b2b2] hover:text-red-500 transition-colors font-semibold text-[14px] whitespace-nowrap"
        >
          <LogOut size={20} />
          Logout
        </button>
      </div>
    </aside>
  );
}
