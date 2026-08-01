import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, LayoutTemplate, ArrowRight, CheckCircle2 } from 'lucide-react';
import { getAllTemplates } from '../data/schoolIdTemplates';
import { useConfiguratorStore } from '../store/useConfiguratorStore';
import { useProjectStore } from '../store/useProjectStore';
import { showToast } from '../components/Toast';

const CATEGORIES = [
  { key: 'all', label: 'All' },
  { key: 'corporate', label: 'Corporate' },
  { key: 'school', label: 'School' },
  { key: 'college', label: 'College' },
  { key: 'event', label: 'Event' },
  { key: 'healthcare', label: 'Healthcare' },
];
const ORIENTATIONS = [
  { key: 'all', label: 'All' },
  { key: 'horizontal', label: 'Landscape' },
  { key: 'vertical', label: 'Portrait' },
];

const CATEGORY_COLORS = {
  corporate: 'bg-blue-100 text-blue-700',
  school: 'bg-indigo-100 text-indigo-700',
  college: 'bg-purple-100 text-purple-700',
  event: 'bg-amber-100 text-amber-700',
  healthcare: 'bg-emerald-100 text-emerald-700',
};

function TemplateCard({ template, onUse }) {
  const [hovered, setHovered] = useState(false);
  const isLandscape = template.orientation === 'horizontal';
  const bgColor = template.front?.backgroundColor || '#ffffff';
  const accentColor = template.front?.elements?.find(e => e.type === 'rect' && e.fill && e.fill !== '#ffffff')?.fill || '#4f46e5';

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="group relative bg-white rounded-xl border border-slate-200 overflow-hidden hover:border-indigo-400 hover:shadow-md transition-all duration-200 cursor-pointer"
      onClick={() => onUse(template)}
    >
      {/* Preview area */}
      <div className="h-36 bg-slate-50 flex items-center justify-center relative overflow-hidden">
        <div
          className={`shadow-md border border-white/50 flex flex-col items-center justify-center gap-1 transition-transform duration-200 group-hover:scale-105 ${
            isLandscape ? 'w-28 h-20 rounded-md' : 'w-16 h-24 rounded-lg'
          }`}
          style={{ backgroundColor: bgColor }}
        >
          {/* Header band */}
          <div className={`absolute top-0 left-0 right-0 h-5 rounded-t-md`} style={{ backgroundColor: accentColor, position: 'relative', width: '100%', height: isLandscape ? '22px' : '18px', borderRadius: '4px 4px 0 0', marginTop: '-1px', marginLeft: '-1px', marginRight: '-1px' }} />
          <div className="w-6 h-6 rounded-full bg-slate-300/60 mt-1" />
          <div className="w-10 h-1 rounded-full bg-slate-300/60 mt-0.5" />
          <div className="w-8 h-0.5 rounded-full bg-slate-300/40" />
          <div className="w-10 h-0.5 rounded-full bg-slate-300/30 mt-1" />
        </div>

        {hovered && (
          <div className="absolute inset-0 bg-indigo-600/10 flex items-center justify-center">
            <div className="bg-indigo-600 text-white text-[11px] font-semibold px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-lg">
              <CheckCircle2 size={12} /> Use Template
            </div>
          </div>
        )}
      </div>

      {/* Card info */}
      <div className="p-3">
        <div className="flex items-start justify-between gap-1.5">
          <p className="text-[12px] font-semibold text-slate-900 truncate leading-snug">{template.name}</p>
          <span className={`shrink-0 text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wide ${CATEGORY_COLORS[template.category] || 'bg-slate-100 text-slate-600'}`}>
            {template.category}
          </span>
        </div>
        <p className="text-[10px] text-slate-400 mt-0.5 capitalize">{template.orientation === 'horizontal' ? 'Landscape' : 'Portrait'}</p>
      </div>
    </div>
  );
}

export default function Templates() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [orientation, setOrientation] = useState('all');
  const setField = useConfiguratorStore(s => s.setField);
  const { activeProject, updateActiveProject } = useProjectStore();

  const allTemplates = useMemo(() => {
    try { return getAllTemplates(); } catch { return []; }
  }, []);

  const filtered = useMemo(() => {
    return allTemplates.filter(t => {
      const matchCat = category === 'all' || t.category === category;
      const matchOri = orientation === 'all' || t.orientation === orientation;
      const matchSearch = !search || t.name?.toLowerCase().includes(search.toLowerCase());
      return matchCat && matchOri && matchSearch;
    });
  }, [allTemplates, category, orientation, search]);

  const handleUse = (template) => {
    try {
      if (template.size) setField('idCard.size', template.size);
      if (template.front?.backgroundColor) setField('idCard.front.backgroundColor', template.front.backgroundColor);
      if (template.front?.elements) {
        const els = template.front.elements.map(el => ({ ...el, id: `${el.id}-${Date.now()}` }));
        setField('idCard.front.elements', els);
      }
      if (template.back?.backgroundColor) setField('idCard.back.backgroundColor', template.back.backgroundColor);
      if (template.back?.elements) {
        const els = template.back.elements.map(el => ({ ...el, id: `${el.id}-${Date.now()}` }));
        setField('idCard.back.elements', els);
      }

      // Automatically color the lanyard strap to match the template's accent color
      const accentColor = template.front?.elements?.find(e => e.type === 'rect' && e.fill && e.fill !== '#ffffff')?.fill;
      if (accentColor) {
        setField('lanyardColor', accentColor);
      }

      if (activeProject && activeProject.type === 'id-card') {
        const frontElements = template.front?.elements?.map(el => ({ ...el, id: `${el.id}-${Date.now()}` })) || [];
        const backElements = template.back?.elements?.map(el => ({ ...el, id: `${el.id}-${Date.now()}` })) || [];
        const cardSettings = {
          width: 54,
          height: 86,
          orientation: template.orientation || 'portrait',
          background: template.front?.backgroundColor || '#ffffff',
          material: 'PVC',
          borderThickness: 3,
          borderColor: '#4f46e5',
          roundedCorners: 12,
          frameStyle: 'corporate',
          slotType: 'oval',
          slotColor: '#cbd5e1',
        };
        updateActiveProject({
          design: {
            frontElements,
            backElements,
            cardSettings
          }
        });
      }

      const targetRoute = activeProject?.type === 'id-card' ? '/id-card-designer' : '/editor';
      showToast(`"${template.name}" applied! Opening Design Editor…`, 'success');
      setTimeout(() => navigate(targetRoute), 600);
    } catch {
      showToast('Could not apply template', 'error');
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 lg:px-0">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-900">Templates</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          {allTemplates.length} professional ID card templates — click any to apply it to the Design Studio.
        </p>
      </div>

      {/* Filters row */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search templates…"
            className="pl-8 pr-3 py-1.5 text-[13px] border border-slate-200 rounded-lg bg-white w-48 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="h-5 w-px bg-slate-200 hidden sm:block" />

        <div className="flex flex-wrap gap-1.5">
          {CATEGORIES.map(c => (
            <button key={c.key} onClick={() => setCategory(c.key)}
              className={`px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all ${
                category === c.key ? 'bg-indigo-600 text-white shadow-sm' : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-300'
              }`}
            >{c.label}</button>
          ))}
        </div>

        <div className="flex gap-1.5 sm:ml-auto">
          {ORIENTATIONS.map(o => (
            <button key={o.key} onClick={() => setOrientation(o.key)}
              className={`px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all ${
                orientation === o.key ? 'bg-slate-900 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-300'
              }`}
            >{o.label}</button>
          ))}
        </div>
      </div>

      <p className="text-[12px] text-slate-400 mb-4">{filtered.length} template{filtered.length !== 1 ? 's' : ''}</p>

      {filtered.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-slate-200">
          <LayoutTemplate size={32} className="mx-auto text-slate-300 mb-3" />
          <p className="text-[14px] font-semibold text-slate-500">No templates match</p>
          <button onClick={() => { setSearch(''); setCategory('all'); setOrientation('all'); }}
            className="mt-3 text-[12px] text-indigo-600 font-medium hover:underline"
          >Clear filters</button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {filtered.map((t, i) => (
            <TemplateCard key={t.id || i} template={t} onUse={handleUse} />
          ))}
        </div>
      )}
    </div>
  );
}
