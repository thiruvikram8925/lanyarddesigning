import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus, Package, LayoutTemplate, FileSpreadsheet, ArrowRight,
  CheckCircle2, Clock, MoreHorizontal, Trash2, Copy, ExternalLink,
  ChevronRight, TrendingUp, Layers, Activity, Search, Filter,
  CreditCard, Link2, BadgeCheck, Zap, Sparkles
} from 'lucide-react';
import { formatCurrency } from '../lib/pricing';
import { useProjectStore } from '../store/useProjectStore';

const ROUTE_MAP = {
  Dashboard: '/dashboard', NewProject: '/new-project', Editor: '/editor',
  Templates: '/templates', Orders: '/orders', AdminDashboard: '/admin',
  Customizer: '/editor', IdCardPro: '/bulk-import', ExportFlow: '/export',
};

// ---- Status colours ----
const STATUS_BADGES = {
  Pending:          'bg-amber-50 text-amber-700 border-amber-200',
  Processing:       'bg-blue-50 text-blue-700 border-blue-200',
  Shipping:         'bg-indigo-50 text-indigo-700 border-indigo-200',
  'Out for Delivery':'bg-purple-50 text-purple-700 border-purple-200',
  Delivered:        'bg-emerald-50 text-emerald-700 border-emerald-200',
};
const STATUS_STEPS = ['Pending', 'Processing', 'Shipping', 'Out for Delivery', 'Delivered'];

const PROJECT_COLORS = {
  'id-card': 'from-indigo-500 to-blue-600',
  lanyard:   'from-purple-500 to-pink-600',
  badge:     'from-emerald-500 to-teal-600',
  combo:     'from-orange-500 to-rose-600',
};

const PROJECT_ICONS = {
  'id-card': CreditCard,
  lanyard:   Link2,
  badge:     BadgeCheck,
  combo:     Layers,
};

function getGreeting(name) {
  const h = new Date().getHours();
  const g = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
  return `${g}${name ? `, ${name.split(' ')[0]}` : ''}`;
}

function timeAgo(iso) {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

// ---- Project Card ----
function ProjectCard({ project, onOpen, onDuplicate, onDelete }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const Icon = PROJECT_ICONS[project.type] || CreditCard;
  const gradClass = PROJECT_COLORS[project.type] || 'from-indigo-500 to-blue-600';

  return (
    <div
      onClick={() => onOpen(project)}
      className="group relative bg-white rounded-2xl border border-slate-200 hover:border-indigo-300 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 cursor-pointer overflow-hidden"
    >
      {/* Thumbnail area */}
      <div className={`h-28 bg-gradient-to-br ${gradClass} flex items-center justify-center relative overflow-hidden`}>
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-2 right-2 w-20 h-20 rounded-full bg-white/30 blur-2xl" />
          <div className="absolute -bottom-4 -left-4 w-24 h-24 rounded-full bg-white/20 blur-2xl" />
        </div>
        {/* Card mockup */}
        <div className="relative z-10 bg-white/20 backdrop-blur-sm border border-white/30 rounded-xl w-20 h-14 flex flex-col items-center justify-center gap-1 shadow-xl group-hover:scale-105 transition-transform">
          <Icon size={16} className="text-white" />
          <div className="w-10 h-1 rounded-full bg-white/60" />
          <div className="w-7 h-0.5 rounded-full bg-white/40" />
        </div>
        {/* Type badge */}
        <div className="absolute top-2.5 left-2.5 bg-black/20 backdrop-blur-sm text-white text-[9px] font-bold px-2 py-0.5 rounded-full capitalize">
          {project.type?.replace('-', ' ')}
        </div>
        {/* Status badge */}
        <div className={`absolute top-2.5 right-2.5 text-[9px] font-bold px-2 py-0.5 rounded-full border ${
          project.status === 'ORDERED' ? 'bg-emerald-500 text-white border-emerald-400' : 'bg-white/20 text-white border-white/30'
        }`}>
          {project.status}
        </div>
      </div>

      {/* Info section */}
      <div className="p-3.5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="text-[13px] font-bold text-slate-900 truncate group-hover:text-indigo-600 transition-colors">
              {project.name}
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5 font-medium">
              {timeAgo(project.lastEdited)} · {project.cardsCount || 1} cards
            </p>
          </div>
          {/* More menu */}
          <div className="relative shrink-0" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => setMenuOpen(v => !v)}
              className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-slate-100 transition-all"
            >
              <MoreHorizontal size={13} className="text-slate-500" />
            </button>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 top-full mt-1 w-40 bg-white border border-slate-200 rounded-xl shadow-xl py-1 z-20">
                  <button onClick={() => { setMenuOpen(false); onOpen(project); }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-[12px] text-slate-600 hover:bg-slate-50 transition-colors">
                    <ExternalLink size={12} className="text-slate-400" /> Open
                  </button>
                  <button onClick={() => { setMenuOpen(false); onDuplicate(project.id); }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-[12px] text-slate-600 hover:bg-slate-50 transition-colors">
                    <Copy size={12} className="text-slate-400" /> Duplicate
                  </button>
                  <div className="border-t border-slate-100 my-1" />
                  <button onClick={() => { setMenuOpen(false); onDelete(project.id); }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-[12px] text-red-500 hover:bg-red-50 transition-colors">
                    <Trash2 size={12} /> Delete
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ---- Main Dashboard ----
export default function Dashboard({ user }) {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  const { projects, duplicateProject, deleteProject, setActiveProject, loadProject } = useProjectStore();

  const greeting = getGreeting(user?.name);
  const currentDate = new Date().toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long' });

  useEffect(() => {
    const load = () => {
      const all = JSON.parse(localStorage.getItem('myLanyardOrders') || '[]');
      const userEmail = user?.email || '';
      setOrders(all.filter(o => o.userEmail === userEmail).slice(0, 3));
    };
    load();
    window.addEventListener('orderStatusUpdated', load);
    return () => window.removeEventListener('orderStatusUpdated', load);
  }, [user]);

  const filteredProjects = useMemo(() => {
    return projects.filter(p => {
      const matchType = typeFilter === 'all' || p.type === typeFilter;
      const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase());
      return matchType && matchSearch;
    });
  }, [projects, typeFilter, search]);

  const handleOpenProject = (project) => {
    setActiveProject(project);
    if (project.type === 'id-card') {
      navigate('/id-card-designer');
    } else {
      navigate('/editor');
    }
  };

  const handleNewProject = () => {
    navigate('/new-project');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-6 py-6 space-y-6 font-sans">

      {/* ── HERO HEADER ── */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 md:p-8 text-white shadow-xl">
        {/* Ambient glows */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-16 w-48 h-48 bg-purple-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-indigo-300 text-[11px] font-semibold mb-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>{currentDate}</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight">{greeting} 👋</h1>
            <p className="text-slate-400 text-[13px] mt-1">
              {projects.length} project{projects.length !== 1 ? 's' : ''} · {orders.length} active order{orders.length !== 1 ? 's' : ''}
            </p>
          </div>

          <button
            onClick={handleNewProject}
            className="flex items-center gap-2 px-5 py-2.5 bg-white text-slate-900 rounded-xl font-bold text-[13px] hover:bg-indigo-50 transition-all shadow-lg shrink-0 group"
          >
            <Plus size={16} className="group-hover:rotate-90 transition-transform" />
            New Project
          </button>
        </div>

        {/* Quick stats */}
        <div className="relative mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Total Projects', val: projects.length, icon: Layers, color: 'text-indigo-300' },
            { label: 'In Production', val: orders.length, icon: Package, color: 'text-amber-300' },
            { label: 'Cards Created', val: projects.reduce((a, p) => a + (p.cardsCount || 0), 0).toLocaleString(), icon: CreditCard, color: 'text-emerald-300' },
            { label: 'Platform', val: 'Operational', icon: Activity, color: 'text-green-400' },
          ].map(({ label, val, icon: Icon, color }) => (
            <div key={label} className="bg-white/5 border border-white/10 rounded-xl px-4 py-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">{label}</span>
                <Icon size={13} className={color} />
              </div>
              <p className="text-[18px] font-black text-white">{val}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── QUICK ACTIONS ROW ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          {
            icon: LayoutTemplate,
            label: 'Browse Templates',
            sub: '50+ professional layouts',
            color: 'text-indigo-600',
            bg: 'bg-indigo-50 border-indigo-100',
            page: 'Templates',
          },
          {
            icon: FileSpreadsheet,
            label: 'Bulk Roster Import',
            sub: 'Upload CSV for batch cards',
            color: 'text-emerald-600',
            bg: 'bg-emerald-50 border-emerald-100',
            page: 'IdCardPro',
          },
          {
            icon: Package,
            label: 'Orders & Tracking',
            sub: 'View production status',
            color: 'text-amber-600',
            bg: 'bg-amber-50 border-amber-100',
            page: 'Orders',
          },
        ].map(({ icon: Icon, label, sub, color, bg, page }) => (
          <button
            key={page}
            onClick={() => navigate(ROUTE_MAP[page])}
            className={`flex items-center gap-3.5 p-4 bg-white border rounded-xl hover:shadow-md hover:-translate-y-0.5 transition-all text-left cursor-pointer group ${bg}`}
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-white shadow-sm border ${bg}`}>
              <Icon size={18} className={color} />
            </div>
            <div className="min-w-0">
              <p className={`text-[13px] font-bold text-slate-900 group-hover:${color} transition-colors`}>{label}</p>
              <p className="text-[11px] text-slate-500 font-medium">{sub}</p>
            </div>
            <ArrowRight size={14} className="text-slate-300 ml-auto group-hover:text-slate-500 group-hover:translate-x-0.5 transition-all shrink-0" />
          </button>
        ))}
      </div>

      {/* ── PROJECTS SECTION ── */}
      <div>
        {/* Section header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-[16px] font-black text-slate-900">Your Projects</h2>
            <p className="text-[12px] text-slate-500 mt-0.5">{filteredProjects.length} project{filteredProjects.length !== 1 ? 's' : ''}</p>
          </div>
          <div className="flex items-center gap-2">
            {/* Type filter */}
            <div className="hidden sm:flex gap-1">
              {[
                { key: 'all', label: 'All' },
                { key: 'id-card', label: 'ID Card' },
                { key: 'lanyard', label: 'Lanyard' },
                { key: 'badge', label: 'Badge' },
              ].map(f => (
                <button key={f.key} onClick={() => setTypeFilter(f.key)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                    typeFilter === f.key ? 'bg-indigo-600 text-white' : 'bg-white border border-slate-200 text-slate-500 hover:border-indigo-300'
                  }`}
                >{f.label}</button>
              ))}
            </div>
            {/* Search */}
            <div className="relative">
              <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search…"
                className="pl-7 pr-3 py-1.5 text-[12px] border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-indigo-400 w-32"
              />
            </div>
          </div>
        </div>

        {/* Projects grid */}
        {filteredProjects.length === 0 ? (
          <div className="bg-white border border-dashed border-slate-300 rounded-2xl p-12 text-center">
            <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center mx-auto mb-4">
              <Layers size={28} className="text-indigo-400" />
            </div>
            <h3 className="text-[15px] font-bold text-slate-800 mb-1">
              {search || typeFilter !== 'all' ? 'No projects match' : 'Start your first project'}
            </h3>
            <p className="text-[12px] text-slate-500 mb-4">
              {search || typeFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'Create an ID card, lanyard, badge, or combo set'}
            </p>
            {(!search && typeFilter === 'all') && (
              <button
                onClick={handleNewProject}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[13px] font-bold transition-all shadow-sm"
              >
                <Plus size={15} /> New Project
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
            {/* New project card */}
            <button
              onClick={handleNewProject}
              className="h-full min-h-[160px] flex flex-col items-center justify-center gap-2 bg-white border-2 border-dashed border-slate-300 hover:border-indigo-400 hover:bg-indigo-50/30 rounded-2xl p-4 transition-all group"
            >
              <div className="w-10 h-10 rounded-full bg-slate-100 group-hover:bg-indigo-100 flex items-center justify-center transition-colors">
                <Plus size={20} className="text-slate-400 group-hover:text-indigo-600 group-hover:rotate-90 transition-all" />
              </div>
              <span className="text-[11px] font-semibold text-slate-400 group-hover:text-indigo-600 transition-colors">New Project</span>
            </button>

            {filteredProjects.map(project => (
              <ProjectCard
                key={project.id}
                project={project}
                onOpen={handleOpenProject}
                onDuplicate={duplicateProject}
                onDelete={deleteProject}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── ACTIVE ORDERS ── */}
      {orders.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-[14px] font-black text-slate-900">Active Orders</h2>
              <p className="text-[11px] text-slate-500">Live production status</p>
            </div>
            <button onClick={() => navigate(ROUTE_MAP['Orders'])}
              className="text-[12px] font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
              View All <ChevronRight size={13} />
            </button>
          </div>
          <div className="divide-y divide-slate-100 border border-slate-100 rounded-xl overflow-hidden">
            {orders.map(ord => {
              const idx = STATUS_STEPS.indexOf(ord.status);
              const pct = Math.max(20, Math.round(((idx + 1) / STATUS_STEPS.length) * 100));
              return (
                <div key={ord.id} onClick={() => navigate(ROUTE_MAP['Orders'])}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 hover:bg-slate-50/80 transition-colors cursor-pointer gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-100">
                      <Package size={15} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[12px] font-bold font-mono text-slate-900">{ord.id}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${STATUS_BADGES[ord.status] || 'bg-slate-100 text-slate-700 border-slate-200'}`}>
                          {ord.status}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">{ord.designName} · {ord.quantity} units</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 sm:ml-auto">
                    <div className="w-28 hidden sm:block">
                      <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                        <span>{ord.status}</span>
                        <span>{pct}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                    <span className="text-[12px] font-bold text-slate-900">{formatCurrency(ord.total)}</span>
                    <ChevronRight size={14} className="text-slate-300" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
}
