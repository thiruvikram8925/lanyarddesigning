import { useState } from 'react';
import { Save, Search, BookOpen, Star, X } from 'lucide-react';
import { useConfiguratorStore } from '../../store/useConfiguratorStore';

const CATEGORIES = ['All', 'Corporate', 'School', 'Event', 'Healthcare'] as const;

interface SavedTemplate {
  id: string;
  name: string;
  category: string;
  thumbnail?: string;
  designSnapshot: Record<string, unknown>;
  createdAt: number;
}

const STORAGE_KEY = 'lanyard-designer-templates';

function loadTemplates(): SavedTemplate[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveTemplates(templates: SavedTemplate[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(templates));
}

export default function TemplatesPanel() {
  const design = useConfiguratorStore(s => s.design);
  const loadPreset = useConfiguratorStore(s => s.loadPreset);
  const [templates, setTemplates] = useState<SavedTemplate[]>(loadTemplates);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [activeTab, setActiveTab] = useState<'saved' | 'pro'>('saved');
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState('Corporate');

  const handleSave = () => {
    if (!newName.trim()) return;
    const template: SavedTemplate = {
      id: Date.now().toString(),
      name: newName.trim(),
      category: newCategory,
      designSnapshot: {
        printingMethod: design.printingMethod,
        lanyardStyle: design.lanyardStyle,
        lanyardColor: design.lanyardColor,
        customColorCode: design.customColorCode,
        fontFamily: design.fontFamily,
        fontColor: design.fontColor,
        fontSize: design.fontSize,
        customTextLeft: design.customTextLeft,
        customTextRight: design.customTextRight,
        customTextCenter: design.customTextCenter,
        textSpacing: design.textSpacing,
        lanyardDesignStyle: design.lanyardDesignStyle,
        strapPattern: design.strapPattern,
        strapPatternOpacity: design.strapPatternOpacity,
        clipType: design.clipType,
        width: design.width,
      },
      createdAt: Date.now(),
    };
    const updated = [template, ...templates];
    setTemplates(updated);
    saveTemplates(updated);
    setShowSaveDialog(false);
    setNewName('');
  };

  const handleLoad = (t: SavedTemplate) => {
    loadPreset(t.designSnapshot as any);
  };

  const handleDelete = (id: string) => {
    const updated = templates.filter(t => t.id !== id);
    setTemplates(updated);
    saveTemplates(updated);
  };

  const filtered = templates.filter(t => {
    if (activeCategory !== 'All' && t.category !== activeCategory) return false;
    if (search && !t.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 pt-4 pb-2">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-xs font-bold text-slate-500 tracking-wider uppercase">Templates</h3>
          <span className="text-[10px] text-slate-400 font-medium">{templates.length} saved</span>
        </div>
        <p className="text-[11px] text-slate-400 mb-3">Template Studio</p>
      </div>

      {/* Save Button */}
      <div className="px-4 mb-3">
        <button
          onClick={() => setShowSaveDialog(true)}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition-all active:scale-[0.97] shadow-sm"
        >
          <Save size={14} />
          Save Current Canvas as Template
        </button>
      </div>

      {/* Save Dialog */}
      {showSaveDialog && (
        <div className="px-4 mb-3 p-3 bg-indigo-50 border border-indigo-100 rounded-lg mx-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-700">Save Template</span>
            <button onClick={() => setShowSaveDialog(false)} className="text-slate-400 hover:text-slate-600">
              <X size={14} />
            </button>
          </div>
          <input
            type="text"
            placeholder="Template name..."
            value={newName}
            onChange={e => setNewName(e.target.value)}
            className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg mb-2 focus:outline-none focus:ring-2 focus:ring-indigo-300"
          />
          <select
            value={newCategory}
            onChange={e => setNewCategory(e.target.value)}
            className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg mb-2 focus:outline-none focus:ring-2 focus:ring-indigo-300"
          >
            {CATEGORIES.filter(c => c !== 'All').map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <button
            onClick={handleSave}
            disabled={!newName.trim()}
            className="w-full py-2 text-xs font-bold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            Save
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="px-4 mb-3 flex gap-1 bg-slate-100 rounded-lg p-1 mx-4">
        <button
          onClick={() => setActiveTab('saved')}
          className={`flex-1 text-[11px] font-bold py-1.5 rounded-md transition-all ${activeTab === 'saved' ? 'bg-white shadow text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
        >
          <BookOpen size={12} className="inline mr-1 -mt-0.5" />
          My Saved ({templates.length})
        </button>
        <button
          onClick={() => setActiveTab('pro')}
          className={`flex-1 text-[11px] font-bold py-1.5 rounded-md transition-all ${activeTab === 'pro' ? 'bg-white shadow text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
        >
          <Star size={12} className="inline mr-1 -mt-0.5" />
          Pro Presets (6)
        </button>
      </div>

      {/* Search */}
      <div className="px-4 mb-3">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search saved templates..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300"
          />
        </div>
      </div>

      {/* Category Pills */}
      <div className="px-4 mb-3 flex flex-wrap gap-1.5">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-3 py-1 text-[11px] font-semibold rounded-full transition-all ${activeCategory === cat ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Template List */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {activeTab === 'saved' && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <BookOpen size={40} className="text-slate-200 mb-3" />
            <p className="text-xs font-bold text-slate-500 mb-1">No Templates Found</p>
            <p className="text-[11px] text-slate-400 max-w-[180px]">
              You haven't saved any custom templates yet. Click 'Save Current Canvas as Template' above.
            </p>
          </div>
        )}
        {activeTab === 'saved' && filtered.map(t => (
          <div
            key={t.id}
            className="group flex items-center gap-3 p-3 mb-2 bg-slate-50 hover:bg-indigo-50 border border-slate-100 hover:border-indigo-200 rounded-lg cursor-pointer transition-all"
            onClick={() => handleLoad(t)}
          >
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-[10px] font-bold shrink-0">
              {t.name.substring(0, 2).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-slate-700 truncate">{t.name}</p>
              <p className="text-[10px] text-slate-400">{t.category}</p>
            </div>
            <button
              onClick={e => { e.stopPropagation(); handleDelete(t.id); }}
              className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition-all"
            >
              <X size={14} />
            </button>
          </div>
        ))}
        {activeTab === 'pro' && (
          <div className="space-y-2">
            {[
              { name: 'Corporate Classic', cat: 'Corporate', colors: 'from-blue-600 to-blue-800' },
              { name: 'School Spirit', cat: 'School', colors: 'from-emerald-500 to-teal-600' },
              { name: 'Event VIP', cat: 'Event', colors: 'from-amber-500 to-orange-600' },
              { name: 'Healthcare Pro', cat: 'Healthcare', colors: 'from-cyan-500 to-blue-500' },
              { name: 'Tech Conference', cat: 'Event', colors: 'from-violet-500 to-purple-600' },
              { name: 'Government ID', cat: 'Corporate', colors: 'from-slate-600 to-slate-800' },
            ].map((preset, i) => (
              <div
                key={i}
                className="flex items-center gap-3 p-3 bg-slate-50 hover:bg-indigo-50 border border-slate-100 hover:border-indigo-200 rounded-lg cursor-pointer transition-all"
              >
                <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${preset.colors} flex items-center justify-center`}>
                  <Star size={14} className="text-white" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-700">{preset.name}</p>
                  <p className="text-[10px] text-slate-400">{preset.cat}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
