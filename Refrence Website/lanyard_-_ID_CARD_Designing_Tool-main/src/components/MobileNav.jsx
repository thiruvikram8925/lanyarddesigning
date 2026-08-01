import React, { useState } from 'react';
import { 
  Menu, X, Home, Palette, Heart, LogOut, 
  ShieldCheck, Bell, User, Settings, ShoppingBag, 
  HelpCircle, ChevronRight, Zap, BookOpen, Layers
} from 'lucide-react';

export default function MobileNav({ activePage, onNavigate, isAdmin, onLogout, user }) {
  const [isOpen, setIsOpen] = useState(false);

  const handleNavigate = (page) => {
    onNavigate(page);
    setIsOpen(false);
  };

  const NavLink = ({ icon: Icon, label, page }) => (
    <button
      onClick={() => handleNavigate(page)}
      className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all ${
        activePage === page 
          ? 'bg-[#5d5fef] text-white shadow-lg shadow-[#5d5fef]/20' 
          : 'bg-white border border-[#eef2f6] text-[#919191]'
      }`}
    >
      <div className="flex items-center gap-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
          activePage === page ? 'bg-white/20' : 'bg-[#f8faff]'
        }`}>
          <Icon size={20} />
        </div>
        <span className="font-black text-xs uppercase tracking-widest">{label}</span>
      </div>
      <ChevronRight size={16} className={activePage === page ? 'text-white/50' : 'text-slate-300'} />
    </button>
  );

  return (
    <div className="lg:hidden">
      {/* Top Bar */}
      <div className="fixed top-0 left-0 right-0 h-20 bg-white/80 backdrop-blur-md border-b border-[#eef2f6] z-[100] px-6 flex items-center justify-between">
        <h1 
          className="text-xl font-black italic flex items-center gap-2 text-[#5d5fef]"
          onClick={() => handleNavigate('Dashboard')}
        >
          MyLanyard
          <Heart size={18} fill="#5d5fef" />
        </h1>
        
        <div className="flex items-center gap-3">
          <button className="w-10 h-10 rounded-xl bg-[#f8faff] flex items-center justify-center text-[#919191]">
            <Bell size={20} />
          </button>
          <button 
            onClick={() => setIsOpen(true)}
            className="w-10 h-10 rounded-xl bg-[#5d5fef] flex items-center justify-center text-white shadow-lg shadow-[#5d5fef]/20"
          >
            <Menu size={20} />
          </button>
        </div>
      </div>

      {/* Spacer for Top Bar */}
      <div className="h-20" />

      {/* Slide-over Menu */}
      {isOpen && (
        <div className="fixed inset-0 z-[110] bg-[#1a1a1a]/40 backdrop-blur-sm animate-fade-in">
          <div className="absolute top-0 right-0 bottom-0 w-[85%] max-w-sm bg-[#f8faff] shadow-2xl animate-slide-in flex flex-col">
            
            {/* Header */}
            <div className="p-6 bg-white border-b border-[#eef2f6] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#5d5fef] rounded-xl flex items-center justify-center text-white font-black">
                  {user?.name?.[0] || 'U'}
                </div>
                <div>
                  <p className="text-xs font-black text-[#1a1a1a]">{user?.name || 'User'}</p>
                  <p className="text-[9px] font-black text-[#5d5fef] uppercase tracking-widest">Premium Member</p>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-2 bg-slate-50 rounded-lg text-[#919191]"
              >
                <X size={20} />
              </button>
            </div>

            {/* Links */}
            <div className="flex-1 overflow-y-auto p-6 space-y-3">
              <NavLink icon={Home} label="Home" page="Dashboard" />
              <NavLink icon={Palette} label="Projects" page="Customizer" />
              <NavLink icon={BookOpen} label="Learning" page="Learning" />
              <NavLink icon={ShoppingBag} label="Order History" page="Dashboard" />
              <NavLink icon={ShieldCheck} label="Enterprise" page="Dashboard" />
              
              <div className="pt-6 pb-2">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Support & Settings</p>
                <div className="space-y-3">
                   <button className="w-full flex items-center gap-4 p-4 rounded-2xl bg-white border border-[#eef2f6] text-[#919191]">
                      <div className="w-10 h-10 bg-amber-50 text-amber-500 rounded-xl flex items-center justify-center">
                        <HelpCircle size={20} />
                      </div>
                      <span className="font-black text-xs uppercase tracking-widest">Help Center</span>
                   </button>
                   <button className="w-full flex items-center gap-4 p-4 rounded-2xl bg-white border border-[#eef2f6] text-[#919191]">
                      <div className="w-10 h-10 bg-slate-50 text-slate-400 rounded-xl flex items-center justify-center">
                        <Settings size={20} />
                      </div>
                      <span className="font-black text-xs uppercase tracking-widest">Settings</span>
                   </button>
                </div>
              </div>

              {/* Promo Card */}
              <div className="bg-gradient-to-br from-[#5d5fef] to-[#82e9ff] p-6 rounded-[32px] text-white shadow-xl shadow-[#5d5fef]/20 relative overflow-hidden">
                 <Zap className="absolute -right-4 -top-4 w-24 h-24 text-white/10 -rotate-12" />
                 <h4 className="text-lg font-black mb-1">Go Pro Plus</h4>
                 <p className="text-white/70 text-[10px] font-medium leading-relaxed mb-4">Unlimited designs, priority support, and 24h express production.</p>
                 <button className="w-full py-3 bg-white text-[#5d5fef] rounded-xl font-black text-[10px] uppercase tracking-widest">
                    Upgrade
                 </button>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 bg-white border-t border-[#eef2f6]">
              <button 
                onClick={onLogout}
                className="w-full flex items-center justify-center gap-3 p-4 bg-rose-50 text-rose-500 rounded-2xl font-black text-xs uppercase tracking-widest border border-rose-100"
              >
                <LogOut size={18} />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
