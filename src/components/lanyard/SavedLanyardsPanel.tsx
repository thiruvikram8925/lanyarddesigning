import React, { useState, useEffect } from 'react';
import { useConfiguratorStore, Design } from '../../store/useConfiguratorStore';
import { 
  FolderHeart, Save, Search, Trash2, Copy, ArrowRight,
  Clock, Check, Tag, Sparkles, FolderArchive, Download, X
} from 'lucide-react';
import { toast } from 'sonner';

export interface SavedLanyardItem {
  id: string;
  name: string;
  organization?: string;
  createdAt: number;
  design: Partial<Design>;
}

const STORAGE_KEY = 'gotek_saved_lanyards_list';

const INITIAL_SAMPLES: SavedLanyardItem[] = [
  {
    id: 'saved-sample-1',
    name: 'Tech Summit 2026 VIP',
    organization: 'Acme Global',
    createdAt: Date.now() - 3600000 * 24 * 2,
    design: {
      printingMethod: 'Sublimated',
      lanyardStyle: 'Single Ended',
      width: '20mm',
      lanyardColor: '#1e3a8a',
      customColorCode: '#1e3a8a',
      fontFamily: 'Montserrat',
      fontColor: '#ffffff',
      fontSize: 18,
      customTextLeft: 'TECH SUMMIT 2026',
      customTextCenter: 'VIP ALL-ACCESS',
      customTextRight: 'TECH SUMMIT 2026',
      clipType: 'Metal Hook',
      lanyardDesignStyle: 'repeated',
      textSpacing: 70,
    }
  },
  {
    id: 'saved-sample-2',
    name: 'Corporate Emerald Staff',
    organization: 'GoTek Industries',
    createdAt: Date.now() - 3600000 * 5,
    design: {
      printingMethod: 'Woven',
      lanyardStyle: 'Single Ended',
      width: '25mm',
      lanyardColor: '#065f46',
      customColorCode: '#065f46',
      fontFamily: 'Inter',
      fontColor: '#a7f3d0',
      fontSize: 16,
      customTextLeft: 'GOTEK INDUSTRIES',
      customTextCenter: 'STAFF PASS',
      customTextRight: 'GOTEK INDUSTRIES',
      clipType: 'Lobster Claw',
      lanyardDesignStyle: 'repeated',
      textSpacing: 60,
    }
  }
];

function loadSavedLanyards(): SavedLanyardItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_SAMPLES));
      return INITIAL_SAMPLES;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_SAMPLES;
  }
}

function persistSavedLanyards(items: SavedLanyardItem[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch (err) {
    console.error('Failed to persist saved lanyards:', err);
  }
}

export default function SavedLanyardsPanel() {
  const design = useConfiguratorStore(s => s.design);
  const loadPreset = useConfiguratorStore(s => s.loadPreset);
  const setField = useConfiguratorStore(s => s.setField);
  const saveLocal = useConfiguratorStore(s => s.saveLocal);

  const [savedList, setSavedList] = useState<SavedLanyardItem[]>(loadSavedLanyards);
  const [search, setSearch] = useState('');
  const [projectName, setProjectName] = useState('');
  const [organization, setOrganization] = useState('');
  const [showSaveModal, setShowSaveModal] = useState(false);

  useEffect(() => {
    persistSavedLanyards(savedList);
  }, [savedList]);

  const handleSaveCurrent = () => {
    const title = projectName.trim() || design.customTextLeft || design.customTextCenter || 'My Custom Lanyard';
    const newItem: SavedLanyardItem = {
      id: `saved-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: title,
      organization: organization.trim() || 'Custom Order',
      createdAt: Date.now(),
      design: {
        printingMethod: design.printingMethod,
        lanyardStyle: design.lanyardStyle,
        width: design.width,
        lanyardColor: design.lanyardColor,
        customColorCode: design.customColorCode,
        pantone: design.pantone,
        customPatternUrl: design.customPatternUrl,
        patternScale: design.patternScale,
        strapPattern: design.strapPattern,
        strapPatternOpacity: design.strapPatternOpacity,
        copyMode: design.copyMode,
        customTextLeft: design.customTextLeft,
        customTextCenter: design.customTextCenter,
        customTextRight: design.customTextRight,
        customTextSecondary: design.customTextSecondary,
        lanyardDesignStyle: design.lanyardDesignStyle,
        textOffset: design.textOffset,
        fontFamily: design.fontFamily,
        fontColor: design.fontColor,
        fontSize: design.fontSize,
        textAngle: design.textAngle,
        textSpacing: design.textSpacing,
        textPosition: design.textPosition,
        logoUrl: design.logoUrl,
        logoName: design.logoName,
        logoScale: design.logoScale,
        logoRotation: design.logoRotation,
        logoBorderWidth: design.logoBorderWidth,
        logoBorderColor: design.logoBorderColor,
        logoBorderRadius: design.logoBorderRadius,
        logoOpacity: design.logoOpacity,
        lanyardLogos: design.lanyardLogos ? [...design.lanyardLogos] : [],
        logoRepeat: design.logoRepeat,
        logoSpacing: design.logoSpacing,
        logoMode: design.logoMode,
        clipType: design.clipType,
        accessories: design.accessories ? [...design.accessories] : [],
        quantity: design.quantity || 100,
      }
    };

    const updated = [newItem, ...savedList];
    setSavedList(updated);
    saveLocal(newItem.id);
    setShowSaveModal(false);
    setProjectName('');
    setOrganization('');
    toast.success(`Saved "${newItem.name}" successfully!`);
  };

  const handleLoadItem = (item: SavedLanyardItem) => {
    loadPreset(item.design);
    setField('idCard.selected', item.id);
    toast.success(`Loaded "${item.name}" onto canvas!`);
  };

  const handleDeleteItem = (id: string, name: string) => {
    const updated = savedList.filter(item => item.id !== id);
    setSavedList(updated);
    toast.info(`Deleted "${name}"`);
  };

  const handleDuplicateItem = (item: SavedLanyardItem) => {
    const copy: SavedLanyardItem = {
      ...item,
      id: `saved-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: `${item.name} (Copy)`,
      createdAt: Date.now(),
    };
    const updated = [copy, ...savedList];
    setSavedList(updated);
    toast.success(`Duplicated "${item.name}"`);
  };

  const filtered = savedList.filter(item => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      item.name.toLowerCase().includes(q) ||
      (item.organization && item.organization.toLowerCase().includes(q)) ||
      (item.design.customTextLeft && item.design.customTextLeft.toLowerCase().includes(q)) ||
      (item.design.customTextCenter && item.design.customTextCenter.toLowerCase().includes(q))
    );
  });

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto bg-white">
      {/* Header */}
      <div className="px-4 pt-4 pb-2 border-b border-slate-100">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-xs font-bold text-slate-700 tracking-wider uppercase flex items-center gap-1.5">
            <FolderHeart size={14} className="text-indigo-600" />
            Saved Lanyards
          </h3>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-600">
            {savedList.length} SAVED
          </span>
        </div>
        <p className="text-[11px] text-slate-400">Save, restore and manage custom designs</p>
      </div>

      {/* Save Current Button */}
      <div className="p-3 border-b border-slate-100 bg-slate-50/50">
        <button
          onClick={() => setShowSaveModal(true)}
          className="w-full py-2.5 px-3 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white text-xs font-bold rounded-lg transition-all shadow-sm active:scale-[0.98] flex items-center justify-center gap-2"
        >
          <Save size={14} />
          Save Current Lanyard Design
        </button>
      </div>

      {/* Save Modal Popup */}
      {showSaveModal && (
        <div className="m-3 p-3 bg-indigo-50/80 border border-indigo-200 rounded-xl space-y-2.5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-indigo-900 flex items-center gap-1">
              <Sparkles size={13} className="text-indigo-600" />
              Save Lanyard Project
            </span>
            <button
              onClick={() => setShowSaveModal(false)}
              className="text-slate-400 hover:text-slate-600"
            >
              <X size={14} />
            </button>
          </div>

          <div>
            <label className="text-[10px] font-semibold text-slate-500 block mb-1">Design / Project Name</label>
            <input
              type="text"
              placeholder={design.customTextLeft || "e.g. Acme Tech Summit 2026"}
              value={projectName}
              onChange={e => setProjectName(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
          </div>

          <div>
            <label className="text-[10px] font-semibold text-slate-500 block mb-1">Organization / Client (Optional)</label>
            <input
              type="text"
              placeholder="e.g. Acme Corp"
              value={organization}
              onChange={e => setOrganization(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
          </div>

          <div className="flex gap-2 pt-1">
            <button
              onClick={() => setShowSaveModal(false)}
              className="flex-1 py-1.5 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveCurrent}
              className="flex-1 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition shadow-2xs"
            >
              Confirm Save
            </button>
          </div>
        </div>
      )}

      {/* Search Input */}
      <div className="p-3">
        <div className="relative">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search saved designs..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-300"
          />
        </div>
      </div>

      {/* Saved Lanyards List */}
      <div className="flex-1 px-3 pb-4 space-y-2.5 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <FolderArchive size={36} className="text-slate-200 mb-2" />
            <p className="text-xs font-bold text-slate-600 mb-0.5">No Saved Lanyards</p>
            <p className="text-[10px] text-slate-400 max-w-[170px]">
              {search ? 'No designs match your search query.' : 'Click "Save Current Lanyard Design" to save your work.'}
            </p>
          </div>
        ) : (
          filtered.map(item => {
            const strapBg = item.design.lanyardColor || '#ffffff';
            const textColor = item.design.fontColor || '#ffffff';
            const displayText = item.design.customTextLeft || item.design.customTextCenter || item.design.customTextRight || item.name;

            return (
              <div
                key={item.id}
                className="p-3 bg-white border border-slate-200 hover:border-indigo-300 rounded-xl transition shadow-2xs hover:shadow-sm group space-y-2.5"
              >
                {/* Lanyard Preview Ribbon */}
                <div 
                  className="h-9 w-full rounded-lg flex items-center justify-between px-3 border border-black/10 overflow-hidden relative shadow-inner"
                  style={{ backgroundColor: strapBg }}
                >
                  <span 
                    className="text-[11px] font-extrabold truncate max-w-[160px] drop-shadow-2xs tracking-wider"
                    style={{ color: textColor, fontFamily: item.design.fontFamily || 'Montserrat' }}
                  >
                    {displayText}
                  </span>
                  <span className="text-[10px] opacity-80 shrink-0">
                    🪝 {item.design.width || '20mm'}
                  </span>
                </div>

                {/* Details */}
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs font-bold text-slate-800 truncate">{item.name}</h4>
                    <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                      {item.organization && (
                        <span className="truncate max-w-[100px] text-slate-500 font-medium">
                          {item.organization}
                        </span>
                      )}
                      <span>•</span>
                      <span className="flex items-center gap-0.5">
                        <Clock size={10} />
                        {formatDate(item.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5 pt-1 border-t border-slate-100">
                  <button
                    onClick={() => handleLoadItem(item)}
                    className="flex-1 py-1.5 px-2 bg-indigo-50 hover:bg-indigo-600 text-indigo-600 hover:text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-1"
                  >
                    <ArrowRight size={12} />
                    Load to Canvas
                  </button>
                  <button
                    onClick={() => handleDuplicateItem(item)}
                    className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
                    title="Duplicate"
                  >
                    <Copy size={13} />
                  </button>
                  <button
                    onClick={() => handleDeleteItem(item.id, item.name)}
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                    title="Delete"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
