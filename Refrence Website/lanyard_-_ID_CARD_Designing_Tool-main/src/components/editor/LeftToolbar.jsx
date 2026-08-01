import { useState, useRef, useMemo } from 'react';
import {
  LayoutTemplate, ImageIcon, Type, Shapes, Upload, Sparkles,
  Palette, ChevronRight, ChevronLeft, Search, X, Star, Clock, TrendingUp,
  Plus, Grid, Layers, AlignLeft, AlignCenter, Bold, Italic,
  Circle, Square, Triangle, Minus, SlidersHorizontal, CheckCircle2, Shield,
  Printer, Paperclip, Info, Maximize2, Minimize2, Save, Bookmark, Trash2, FolderHeart, Check
} from 'lucide-react';
import { useConfiguratorStore } from '../../store/useConfiguratorStore';
import {
  printingMethods,
  lanyardStyles,
  widths,
  lengths,
  clipTypes,
  accessoryOptions,
  presetColors,
  gradientPresets,
} from '../../data/options';

const OPTION_ARTWORK_DETAILS = {
  // Printing Methods
  'Screen Printed': {
    title: 'Screen Printed Lanyard',
    tag: 'Crisp & Bold',
    whatIsIt: 'Ink is pressed directly onto smooth polyester, creating crisp, solid brand logos and bold text with high contrast.',
    artworkLook: 'Flat, sharp vector line edges. Best for 1–2 solid Pantone brand colors.'
  },
  'Woven': {
    title: 'Woven Jacquard Strap',
    tag: 'Premium Stitched',
    whatIsIt: 'Your design and text are woven directly into the fabric thread-by-thread during strap manufacturing.',
    artworkLook: 'Embroidered 3D texture with thread stitches visible on both front & back. Never fades or wears off.'
  },
  'Sublimated': {
    title: 'Dye-Sublimated Full Color',
    tag: 'HD Photo Finish',
    whatIsIt: 'High-temperature heat transfer infuses liquid dyes deep into polyester fibers for edge-to-edge full-bleed graphics.',
    artworkLook: 'Renders photographic gradients, complex artwork, and infinite color blends smoothly with zero tactile bumps.'
  },

  // Styles
  'Single Ended': {
    title: 'Single-Ended Loop',
    tag: 'Classic Standard',
    whatIsIt: 'The lanyard loops around the neck and converges to a single central attachment clip at the bottom crimp.',
    artworkLook: 'Artwork runs continuously down both left and right sides to meet in a single central attachment clip.'
  },
  'Double Ended': {
    title: 'Double-Ended Dual Clip',
    tag: 'Anti-Flip Balance',
    whatIsIt: 'Features two separate lower clips attached to the left and right sides of extra-wide pouches.',
    artworkLook: 'Keeps large event badges & VIP passes facing forward at all times without spinning or twisting.'
  },

  // Widths
  '12mm': {
    title: '12mm (Slim Strap)',
    tag: 'Light & Discrete',
    whatIsIt: 'Narrow 12mm width designed for minimal weight and subtle neck profile.',
    artworkLook: 'Renders compact single-line typography or small repeating icon marks cleanly down the strap center.'
  },
  '16mm': {
    title: '16mm (Sleek Width)',
    tag: 'Modern Professional',
    whatIsIt: 'A sleek, versatile middle-width suitable for corporate badges and trade show passes.',
    artworkLook: 'Provides balanced space for medium text sizes and brand logos with crisp margin clearance.'
  },
  '20mm': {
    title: '20mm (Popular Standard)',
    tag: 'Best-Seller Choice',
    whatIsIt: 'The industry-standard 20mm width chosen by 85% of corporate clients worldwide.',
    artworkLook: 'Offers optimal visual real estate for high-visibility logos, website URLs, and repeating patterns.'
  },
  '25mm': {
    title: '25mm (Extra Wide)',
    tag: 'Maximum Impact',
    whatIsIt: 'Heavy-duty 25mm wide strap designed for high-impact sponsor branding and large typography.',
    artworkLook: 'Provides massive artwork surface area, making dual-line text, complex patterns, and sponsor logos pop.'
  },

  // Lengths
  '28"': {
    title: '28 Inch Strap Length',
    tag: 'Short / Youth Fit',
    whatIsIt: 'Compact 28" loop length resting higher on the chest.',
    artworkLook: 'Reduces hanging drop height, keeping badges elevated near mid-chest for active environments.'
  },
  '30"': {
    title: '30 Inch Strap Length',
    tag: 'Compact Fit',
    whatIsIt: 'Slightly shorter drop length than standard corporate lanyards.',
    artworkLook: 'Ideal for machinery operators or hospital staff to prevent catching on desk edges.'
  },
  '32"': {
    title: '32 Inch Strap Length',
    tag: 'Standard Adult Fit',
    whatIsIt: 'Balanced 32" drop length suitable for average height personnel.',
    artworkLook: 'Positions the badge holder comfortably around upper abdominal height.'
  },
  '34"': {
    title: '34 Inch Strap Length',
    tag: 'Comfort Adult Fit',
    whatIsIt: 'Relaxed 34" loop length providing extra slack for ease of scanning at access gates.',
    artworkLook: 'Positions badge near waist level for effortless tap-and-go RFID card readers.'
  },
  '38"': {
    title: '38 Inch Strap Length',
    tag: 'Extra-Long Drop',
    whatIsIt: 'Full 38" loop length for tall individuals or cross-body wearing.',
    artworkLook: 'Extended drop length providing maximum flexibility when pulling badges up to scanners.'
  },

  // Clips
  'Metal Hook': {
    title: 'Heavy-Duty Metal Swivel Hook',
    tag: 'Zinc Alloy Chrome',
    whatIsIt: 'Chrome-plated zinc alloy swivel clip that rotates 360 degrees.',
    artworkLook: 'Sleek metallic reflection; snap latch secures badge holders, keys, or USB drives.'
  },
  'Plastic Hook': {
    title: 'Molded Polymer Plastic Hook',
    tag: 'Lightweight & Quiet',
    whatIsIt: 'High-impact molded plastic clip designed for noise-free, lightweight daily wear.',
    artworkLook: 'Matte composite finish; gentle on badge slots without metallic clinking.'
  },
  'Crocodile Clip': {
    title: 'Spring-Loaded Crocodile Clip',
    tag: 'Pinch Grip',
    whatIsIt: 'Sturdy spring crocodile clip with teeth for gripping clothing or punched cards.',
    artworkLook: 'Clean steel clamp design; holds badges tightly without needing a hole punch.'
  },
  'Ski Reel': {
    title: 'Retractable Badge Ski Reel',
    tag: '30-Inch Extension',
    whatIsIt: 'Spring-loaded retractable cord reel allowing card extension for contactless door access.',
    artworkLook: 'Circular composite housing attached to lanyard tip with smooth auto-recoil.'
  },

  // Accessories
  'Safety Break': {
    title: 'Safety Breakaway Clasp',
    tag: 'OSHA / School Safe',
    whatIsIt: 'Two-piece breakaway safety clasp installed at the back of the neck.',
    artworkLook: 'Automatically snaps open if pulled or caught, preventing neck injury. Snaps back together instantly.'
  },
  'Quick Release Buckle': {
    title: 'Quick Release Detachable Buckle',
    tag: 'Fast Detach',
    whatIsIt: 'Side-squeeze plastic buckle located above the clip section.',
    artworkLook: 'Lets users quickly unclip keys or USB drives from the main strap without taking off the neck loop.'
  },
  'Badge Holder': {
    title: 'Clear Vinyl ID Card Pouch',
    tag: 'Waterproof Pouch',
    whatIsIt: 'Crystal-clear PVC plastic pouch with reinforced slot & chain holes.',
    artworkLook: 'Protects printed ID cards from moisture and dust while keeping barcode scans 100% readable.'
  },

  // Colors
  'White': {
    title: 'Solid Bright White',
    tag: 'Pantone White C',
    whatIsIt: 'Clean, brilliant solid white polyester strap base.',
    artworkLook: 'Provides maximum contrast for dark logos, vibrant text, and colorful brand graphics.'
  },
  'Navy': {
    title: 'Solid Navy Blue',
    tag: 'Pantone 294 C',
    whatIsIt: 'Deep executive navy blue strap color.',
    artworkLook: 'Rich dark background that makes white, gold, and light yellow text pop cleanly.'
  },
  'Black': {
    title: 'Solid Jet Black',
    tag: 'Pantone Black C',
    whatIsIt: 'Classic deep black polyester strap base.',
    artworkLook: 'Ultra-versatile, high-contrast dark background for white and metallic logos.'
  }
};

function OptionCardWithTooltip({ optionKey, children, className = "" }) {
  const [showTooltip, setShowTooltip] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const containerRef = useRef(null);
  const timerRef = useRef(null);
  const info = OPTION_ARTWORK_DETAILS[optionKey] || {
    title: optionKey,
    tag: 'Strap Customization',
    whatIsIt: `Custom ${optionKey} selection for lanyard artwork.`,
    artworkLook: `Updates the lanyard strap finish and canvas render in real-time.`
  };

  const handleMouseEnter = () => {
    timerRef.current = setTimeout(() => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setCoords({
          top: rect.top + rect.height / 2,
          left: rect.right + 12,
        });
        setShowTooltip(true);
      }
    }, 200);
  };

  const handleMouseLeave = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setShowTooltip(false);
  };

  return (
    <div
      ref={containerRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`relative ${className}`}
    >
      {children}

      {showTooltip && (
        <div
          style={{
            position: 'fixed',
            top: `${coords.top}px`,
            left: `${coords.left}px`,
            transform: 'translateY(-50%)',
            zIndex: 99999,
          }}
          className="w-72 p-3.5 rounded-2xl bg-slate-900/95 backdrop-blur-md border border-indigo-500/30 text-white shadow-2xl pointer-events-none animate-fadeIn"
        >
          <div className="flex items-center justify-between gap-2 border-b border-slate-700/60 pb-2 mb-2">
            <span className="text-[11px] font-extrabold text-indigo-300 truncate">{info.title}</span>
            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 shrink-0">
              {info.tag}
            </span>
          </div>

          <div className="space-y-2 text-[10px]">
            <div>
              <p className="font-bold text-slate-400 uppercase tracking-widest text-[8px] mb-0.5">What is it?</p>
              <p className="text-slate-200 leading-relaxed">{info.whatIsIt}</p>
            </div>

            <div>
              <p className="font-bold text-indigo-400 uppercase tracking-widest text-[8px] mb-0.5">Artwork & Print Finish</p>
              <p className="text-slate-300 leading-relaxed">{info.artworkLook}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// --- Templates Panel (Real Save & Design Template System) ---
function TemplatesPanel({ projectType, onApply }) {
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('saved'); // 'saved' | 'presets'
  const [category, setCategory] = useState('All');
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);

  const design = useConfiguratorStore(s => s.design);

  // Load custom saved templates from localStorage
  const [savedTemplates, setSavedTemplates] = useState(() => {
    try {
      const stored = localStorage.getItem('lanyard_user_saved_templates');
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      return [];
    }
  });

  // Built-in Enterprise Pro Presets
  const presets = [
    {
      id: 'p1',
      name: 'Tech Summit Indigo Gradient',
      category: 'Event',
      lanyardColor: 'linear-gradient(90deg, #4b6cb7, #182848)',
      width: '20mm',
      length: '34',
      printingMethod: 'Sublimated',
      clipType: 'Metal Hook',
      accessory: 'Badge Holder',
    },
    {
      id: 'p2',
      name: 'Executive Navy Blue',
      category: 'Corporate',
      lanyardColor: '#1e3a8a',
      width: '16mm',
      length: '32',
      printingMethod: 'Screen Printed',
      clipType: 'Plastic Hook',
      accessory: 'Badge Holder',
    },
    {
      id: 'p3',
      name: 'Sunset Neon Event',
      category: 'Event',
      lanyardColor: 'linear-gradient(90deg, #ff7e5f, #feb47b)',
      width: '25mm',
      length: '38',
      printingMethod: 'Sublimated',
      clipType: 'Ski Reel',
      accessory: 'Quick Release Buckle',
    },
    {
      id: 'p4',
      name: 'Emerald Health Staff',
      category: 'Healthcare',
      lanyardColor: '#059669',
      width: '16mm',
      length: '30',
      printingMethod: 'Woven',
      clipType: 'Crocodile Clip',
      accessory: 'Safety Break',
    },
    {
      id: 'p5',
      name: 'Crimson Security Officer',
      category: 'Corporate',
      lanyardColor: '#dc2626',
      width: '20mm',
      length: '34',
      printingMethod: 'Screen Printed',
      clipType: 'Metal Hook',
      accessory: 'Safety Break',
    },
    {
      id: 'p6',
      name: 'University Violet VIP',
      category: 'School',
      lanyardColor: '#7c3aed',
      width: '20mm',
      length: '34',
      printingMethod: 'Sublimated',
      clipType: 'Metal Hook',
      accessory: 'Badge Holder',
    },
  ];

  // Save current design as a new custom template
  const handleSaveCurrentDesign = () => {
    const title = newTemplateName.trim() || `Custom Template #${savedTemplates.length + 1}`;
    const customTemplate = {
      id: `tpl-${Date.now()}`,
      name: title,
      createdAt: new Date().toLocaleDateString(),
      lanyardColor: design.lanyardColor || '#1e3a8a',
      width: design.width || '20mm',
      length: design.length || '34',
      printingMethod: design.printingMethod || 'Sublimated',
      clipType: design.clipType || 'Metal Hook',
      accessory: design.accessory || 'Badge Holder',
      accessories: design.accessories || ['Badge Holder'],
      strapPattern: design.strapPattern || 'none',
      elements: design.elements || [],
      text: design.text || '',
      logoUrl: design.logoUrl || ''
    };

    const updated = [customTemplate, ...savedTemplates];
    setSavedTemplates(updated);
    try {
      localStorage.setItem('lanyard_user_saved_templates', JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }

    setNewTemplateName('');
    setSaveModalOpen(false);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  // Delete a saved custom template
  const handleDeleteTemplate = (id, e) => {
    e.stopPropagation();
    const updated = savedTemplates.filter(t => t.id !== id);
    setSavedTemplates(updated);
    try {
      localStorage.setItem('lanyard_user_saved_templates', JSON.stringify(updated));
    } catch (err) {
      console.error(err);
    }
  };

  const categories = ['All', 'Corporate', 'School', 'Event', 'Healthcare'];
  const activeList = activeTab === 'saved' ? savedTemplates : presets;

  const filtered = activeList.filter(t =>
    (category === 'All' || t.category === category) &&
    (!search || t.name.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Top Banner & Tab Toggle */}
      <div className="p-3 border-b border-slate-100 bg-slate-50/70 space-y-2.5">
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Template Studio</p>
          {savedSuccess && (
            <span className="text-[9px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1 animate-fadeIn">
              <Check size={10} /> Saved to Templates!
            </span>
          )}
        </div>

        {/* 1-Click Save Current Canvas Button */}
        <button
          onClick={() => setSaveModalOpen(v => !v)}
          className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-700 hover:from-indigo-700 hover:to-purple-800 text-white text-[11px] font-bold shadow-md hover:shadow-indigo-500/20 transition-all cursor-pointer flex items-center justify-center gap-2"
        >
          <Save size={14} /> Save Current Canvas as Template
        </button>

        {/* Inline Save Template Form Modal */}
        {saveModalOpen && (
          <div className="p-2.5 rounded-xl bg-white border border-indigo-200 shadow-lg space-y-2 animate-fadeIn">
            <p className="text-[10px] font-bold text-indigo-900">Name your custom template:</p>
            <input
              type="text"
              value={newTemplateName}
              onChange={e => setNewTemplateName(e.target.value)}
              placeholder="e.g. Acme Corp 20mm Blue Lanyard"
              className="w-full text-[11px] border border-slate-200 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              autoFocus
            />
            <div className="flex gap-1.5 justify-end">
              <button
                onClick={() => setSaveModalOpen(false)}
                className="px-2.5 py-1 rounded-lg text-[10px] text-slate-500 font-semibold hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveCurrentDesign}
                className="px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold shadow-sm"
              >
                Save Template
              </button>
            </div>
          </div>
        )}

        {/* Sub-tab Navigation (My Saved vs Pro Presets) */}
        <div className="flex bg-slate-200/80 p-0.5 rounded-xl text-[10px] font-bold">
          <button
            onClick={() => setActiveTab('saved')}
            className={`flex-1 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'saved' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FolderHeart size={12} /> My Saved ({savedTemplates.length})
          </button>
          <button
            onClick={() => setActiveTab('presets')}
            className={`flex-1 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'presets' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sparkles size={12} /> Pro Presets ({presets.length})
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search saved templates…"
            className="w-full pl-7 pr-3 py-1.5 text-[11px] border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-1 focus:ring-indigo-400 shadow-xs"
          />
        </div>
      </div>

      {/* Category Pills */}
      <div className="px-3 py-2 flex gap-1 flex-wrap border-b border-slate-100 bg-white">
        {categories.map(c => (
          <button
            key={c} onClick={() => setCategory(c)}
            className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold transition-all cursor-pointer ${
              category === c ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {/* Templates Grid List */}
      <div className="flex-1 overflow-y-auto p-3 panel-scroll space-y-2.5">
        {filtered.length === 0 ? (
          <div className="text-center py-8 px-4 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50">
            <Bookmark size={28} className="mx-auto text-slate-300 mb-2" />
            <p className="text-[12px] font-bold text-slate-600">No Templates Found</p>
            <p className="text-[10px] text-slate-400 mt-1">
              {activeTab === 'saved'
                ? "You haven't saved any custom templates yet. Click 'Save Current Canvas as Template' above!"
                : "No pro presets found matching your filter."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-2.5">
            {filtered.map(t => (
              <div
                key={t.id}
                onClick={() => onApply?.(t)}
                className="group relative rounded-2xl border border-slate-200 bg-white hover:border-indigo-500 hover:shadow-md transition-all p-2.5 cursor-pointer flex flex-col gap-2"
              >
                {/* Visual Swatch Header Bar */}
                <div
                  className="h-10 w-full rounded-xl shadow-inner flex items-center justify-between px-3 relative overflow-hidden"
                  style={{ background: t.lanyardColor || '#1e3a8a' }}
                >
                  <span className="text-[9px] font-mono font-bold text-white drop-shadow bg-black/30 px-2 py-0.5 rounded-md">
                    {t.width || '20mm'} • {t.printingMethod || 'Sublimated'}
                  </span>
                  {activeTab === 'saved' && (
                    <button
                      onClick={(e) => handleDeleteTemplate(t.id, e)}
                      title="Delete Saved Template"
                      className="p-1 rounded-lg bg-red-500/80 hover:bg-red-600 text-white transition-colors cursor-pointer"
                    >
                      <Trash2 size={11} />
                    </button>
                  )}
                </div>

                {/* Info & Badges */}
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold text-slate-800 truncate group-hover:text-indigo-600 transition-colors">
                      {t.name}
                    </p>
                    <p className="text-[9px] text-slate-400 mt-0.5">
                      Hardware: <span className="text-slate-600 font-semibold">{t.clipType || 'Metal Hook'}</span> {t.accessory ? `+ ${t.accessory}` : ''}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); onApply?.(t); }}
                    className="shrink-0 px-2.5 py-1 rounded-lg bg-indigo-50 group-hover:bg-indigo-600 text-indigo-600 group-hover:text-white text-[9px] font-bold transition-all shadow-xs"
                  >
                    Apply
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Hardware Artwork Illustrations
function ClipGraphic({ type, active }) {
  if (type === 'Plastic Hook') {
    return (
      <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
        <svg className="w-7 h-7" viewBox="0 0 36 36" fill="none">
          <rect x="10" y="4" width="16" height="6" rx="2" fill="#334155" />
          <path d="M14 10V18C14 22 22 22 22 18V12" stroke="#1e293b" strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="18" cy="26" r="3" fill="#475569" />
        </svg>
      </div>
    );
  }
  if (type === 'Crocodile Clip') {
    return (
      <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
        <svg className="w-7 h-7" viewBox="0 0 36 36" fill="none">
          <rect x="8" y="6" width="20" height="8" rx="2" fill="#94a3b8" />
          <path d="M12 14L10 28H26L24 14" stroke="#475569" strokeWidth="2" fill="#cbd5e1" />
          <path d="M12 28L14 32H22L24 28" stroke="#334155" strokeWidth="1.5" />
          <circle cx="18" cy="10" r="2" fill="#475569" />
        </svg>
      </div>
    );
  }
  if (type === 'Ski Reel') {
    return (
      <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center shrink-0 shadow-sm">
        <svg className="w-7 h-7" viewBox="0 0 36 36" fill="none">
          <circle cx="18" cy="16" r="10" fill="#1e293b" stroke="#6366f1" strokeWidth="1.5" />
          <circle cx="18" cy="16" r="5" fill="#818cf8" />
          <line x1="18" y1="26" x2="18" y2="33" stroke="#cbd5e1" strokeWidth="2" strokeDasharray="2 2" />
          <rect x="14" y="32" width="8" height="3" rx="1.5" fill="#475569" />
        </svg>
      </div>
    );
  }
  // Default: Metal Hook / Swivel Hook
  return (
    <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
      <svg className="w-7 h-7" viewBox="0 0 36 36" fill="none">
        <rect x="11" y="4" width="14" height="5" rx="1.5" fill="#94a3b8" stroke="#475569" />
        <path d="M13 9V17C13 22 23 22 23 17V11" stroke="#64748b" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M16 17L22 13" stroke="#4f46e5" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="18" cy="27" r="4" fill="#cbd5e1" stroke="#475569" strokeWidth="1.5" />
      </svg>
    </div>
  );
}

// Accessory Artwork Illustrations
function AccessoryGraphic({ label, active }) {
  if (label === 'Safety Break') {
    return (
      <div className="w-12 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center relative overflow-hidden shrink-0">
        <svg className="w-8 h-8" viewBox="0 0 32 32" fill="none">
          <rect x="4" y="11" width="10" height="10" rx="3" fill={active ? '#6366f1' : '#475569'} />
          <rect x="18" y="11" width="10" height="10" rx="3" fill={active ? '#818cf8' : '#64748b'} />
          <path d="M14 16H18" stroke="#38bdf8" strokeWidth="2" strokeDasharray="1 1" />
          <path d="M16 10V22" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </div>
    );
  }
  if (label === 'Quick Release Buckle') {
    return (
      <div className="w-12 h-10 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center relative overflow-hidden shrink-0 shadow-sm">
        <svg className="w-8 h-8" viewBox="0 0 32 32" fill="none">
          <rect x="5" y="10" width="22" height="12" rx="3" fill={active ? '#312e81' : '#1e293b'} stroke="#6366f1" strokeWidth="1" />
          <line x1="16" y1="10" x2="16" y2="22" stroke="#475569" strokeWidth="1.5" />
          <circle cx="10" cy="16" r="2" fill="#818cf8" />
          <circle cx="22" cy="16" r="2" fill="#818cf8" />
        </svg>
      </div>
    );
  }
  // Badge Holder
  return (
    <div className="w-12 h-10 rounded-xl bg-indigo-50/80 border border-indigo-200 flex items-center justify-center relative overflow-hidden shrink-0 shadow-sm">
      <svg className="w-7 h-8" viewBox="0 0 28 32" fill="none">
        <rect x="3" y="2" width="22" height="28" rx="2" fill="rgba(255,255,255,0.85)" stroke="#6366f1" strokeWidth="1.5" />
        <rect x="10" y="5" width="8" height="3" rx="1.5" fill="#475569" />
        <rect x="6" y="11" width="16" height="15" rx="1" fill="#e0e7ff" stroke="#818cf8" strokeWidth="0.75" />
        <circle cx="14" cy="16" r="3" fill="#6366f1" opacity="0.7" />
      </svg>
    </div>
  );
}

// --- Elements Panel ---
function ElementsPanel({ projectType, onAdd, onUpload }) {
  const shapes = [
    { type: 'rect', icon: Square, label: 'Rectangle' },
    { type: 'circle', icon: Circle, label: 'Circle' },
    { type: 'line', icon: Minus, label: 'Line' },
    { type: 'triangle', icon: Triangle, label: 'Triangle' },
  ];

  const design = useConfiguratorStore(s => s.design);
  const setField = useConfiguratorStore(s => s.setField);

  // Custom Solid & Gradient Color Picker State
  const [customSolidColor, setCustomSolidColor] = useState('#1e3a8a');
  const [customGrad1, setCustomGrad1] = useState('#4f46e5');
  const [customGrad2, setCustomGrad2] = useState('#ec4899');
  const [gradAngle, setGradAngle] = useState(90);

  // Helper to trigger dual-field store updates for 3D/2D sync
  const setOption = (key, val, extra = {}) => {
    setField(key, val);
    Object.entries(extra).forEach(([k, v]) => setField(k, v));
  };

  const handleApplyCustomGradient = (c1 = customGrad1, c2 = customGrad2, angle = gradAngle) => {
    const gradStr = `linear-gradient(${angle}deg, ${c1}, ${c2})`;
    setOption('lanyardColor', gradStr, { customGradient: gradStr });
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto p-3 panel-scroll gap-4">
      {/* LANYARD SPECIFIC CONTROLS */}
      {(projectType === 'lanyard' || projectType === 'combo') && (
        <>
          {/* Printing Method with Visual Icons & Tooltips */}
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Printing Method</p>
            <div className="space-y-1.5">
              {printingMethods.map(m => {
                const active = design.printingMethod === m.label;
                return (
                  <OptionCardWithTooltip key={m.label} optionKey={m.label}>
                    <button
                      onClick={() => setOption('printingMethod', m.label)}
                      className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                        active
                          ? 'border-indigo-600 bg-indigo-50/80 text-indigo-900 font-bold shadow-sm'
                          : 'border-slate-200 bg-white hover:border-indigo-300 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${active ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                          {m.label === 'Screen Printed' ? <Printer size={14} /> : m.label === 'Woven' ? <Grid size={14} /> : <Sparkles size={14} />}
                        </div>
                        <div className="min-w-0">
                          <p className="text-[11px] font-bold leading-none">{m.label}</p>
                          <p className="text-[9px] text-slate-400 mt-1 truncate">{m.description}</p>
                        </div>
                      </div>
                      {m.price > 0 && <span className="text-[9px] font-mono font-bold text-indigo-600 bg-indigo-100 px-1.5 py-0.5 rounded ml-1 shrink-0">+₹{m.price}</span>}
                    </button>
                  </OptionCardWithTooltip>
                );
              })}
            </div>
          </div>

          {/* Lanyard Style with Visual Illustrations & Tooltips */}
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Lanyard Style</p>
            <div className="grid grid-cols-2 gap-2">
              {lanyardStyles.map(s => {
                const active = design.lanyardStyle === s.label;
                return (
                  <OptionCardWithTooltip key={s.label} optionKey={s.label}>
                    <button
                      onClick={() => setOption('lanyardStyle', s.label)}
                      className={`w-full p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                        active
                          ? 'border-indigo-600 bg-indigo-50/80 text-indigo-900 font-bold shadow-sm'
                          : 'border-slate-200 bg-white hover:border-indigo-300 text-slate-700'
                      }`}
                    >
                      {/* Style mini illustration */}
                      <div className="h-8 w-full bg-slate-100 rounded-lg mb-2 flex items-center justify-center relative overflow-hidden">
                        {s.label === 'Single Ended' ? (
                          <div className="w-4 h-6 border-b-2 border-x-2 border-indigo-500 rounded-b-full flex items-end justify-center pb-0.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
                          </div>
                        ) : (
                          <div className="w-8 h-6 border-b-2 border-x-2 border-indigo-500 rounded-b-xl flex justify-between px-1 items-end pb-0.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
                            <div className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
                          </div>
                        )}
                      </div>
                      <p className="text-[11px] font-bold leading-tight">{s.label}</p>
                      <p className="text-[9px] text-slate-400 mt-0.5 line-clamp-1">{s.description}</p>
                    </button>
                  </OptionCardWithTooltip>
                );
              })}
            </div>
          </div>

          {/* Strap Color (Pantone Swatches & Custom Solid Color Picker) */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Strap Solid Color</p>
              {design.pantone && <span className="text-[9px] font-mono text-indigo-600 font-bold">{design.pantone}</span>}
            </div>
            <div className="grid grid-cols-4 gap-2 mb-2.5">
              {presetColors.map(c => {
                const active = (design.lanyardColor || '').toLowerCase() === c.value.toLowerCase();
                return (
                  <OptionCardWithTooltip key={c.name} optionKey={c.name}>
                    <button
                      onClick={() => {
                        setCustomSolidColor(c.value);
                        setOption('lanyardColor', c.value, { customColorCode: c.value, pantone: c.pantone });
                      }}
                      className={`w-full group flex flex-col items-center p-1.5 rounded-xl border transition-all cursor-pointer ${
                        active ? 'border-indigo-600 bg-indigo-50 ring-2 ring-indigo-500/30' : 'border-slate-200 bg-white hover:border-indigo-300 hover:scale-105'
                      }`}
                      title={`${c.name} (${c.pantone})`}
                    >
                      <div className="w-7 h-7 rounded-full border-2 border-slate-200 shadow-md relative" style={{ background: c.value }}>
                        {active && <CheckCircle2 size={12} className={`absolute inset-0 m-auto drop-shadow ${c.name === 'White' ? 'text-indigo-600' : 'text-white'}`} />}
                      </div>
                      <span className="text-[9px] font-semibold text-slate-600 mt-1 truncate max-w-full">{c.name}</span>
                    </button>
                  </OptionCardWithTooltip>
                );
              })}
            </div>

            {/* Custom Solid Color Picker Control */}
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 space-y-1.5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                  <Palette size={12} className="text-indigo-600" /> Custom Solid Color
                </span>
                <span className="text-[9px] font-mono text-indigo-600 font-bold uppercase">{customSolidColor}</span>
              </div>
              <div className="flex items-center gap-2 bg-white p-1.5 rounded-lg border border-slate-200">
                <input
                  type="color"
                  value={customSolidColor}
                  onChange={(e) => {
                    setCustomSolidColor(e.target.value);
                    setOption('lanyardColor', e.target.value, { customColorCode: e.target.value });
                  }}
                  className="w-6 h-6 rounded-md cursor-pointer border-0 bg-transparent shrink-0"
                />
                <input
                  type="text"
                  value={customSolidColor}
                  onChange={(e) => {
                    setCustomSolidColor(e.target.value);
                    setOption('lanyardColor', e.target.value, { customColorCode: e.target.value });
                  }}
                  className="w-full bg-transparent text-[11px] font-mono font-bold text-slate-700 focus:outline-none uppercase"
                  placeholder="#FFFFFF"
                />
              </div>
            </div>
          </div>

          {/* Gradient Presets & Custom Gradient Builder */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Gradient Presets</p>
              <span className="text-[9px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">34 Presets + Custom</span>
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {gradientPresets.slice(0, 12).map(g => {
                const active = design.lanyardColor === g.value;
                return (
                  <OptionCardWithTooltip key={g.name} optionKey={g.name}>
                    <button
                      onClick={() => setOption('lanyardColor', g.value)}
                      className={`w-full h-9 rounded-xl border border-white shadow-sm hover:scale-105 transition-transform relative group overflow-hidden cursor-pointer ${
                        active ? 'ring-2 ring-indigo-500 ring-offset-1' : ''
                      }`}
                      style={{ background: g.value }}
                      title={g.name}
                    >
                      <span className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 text-[9px] text-white font-bold transition-opacity">
                        {g.name}
                      </span>
                    </button>
                  </OptionCardWithTooltip>
                );
              })}
            </div>

            {/* Custom Gradient Builder Box (Light Enterprise SaaS Theme) */}
            <div className="mt-3 p-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-800 space-y-2.5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <Sparkles size={13} className="text-indigo-600" /> Custom Gradient Builder
                </span>
                <span className="text-[9px] font-mono text-indigo-600 font-bold">{gradAngle}° Angle</span>
              </div>

              {/* Live Gradient Preview Bar */}
              <div
                className="w-full h-7 rounded-xl border border-slate-300 shadow-sm flex items-center justify-center relative overflow-hidden transition-all"
                style={{ background: `linear-gradient(${gradAngle}deg, ${customGrad1}, ${customGrad2})` }}
              >
                <span className="text-[9px] font-bold text-white drop-shadow px-2 py-0.5 rounded bg-black/40 font-mono">
                  {customGrad1} → {customGrad2}
                </span>
              </div>

              {/* Dual Color Pickers */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[9px] text-slate-500 font-semibold block mb-1">Color 1 (Start)</label>
                  <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-slate-200">
                    <input
                      type="color"
                      value={customGrad1}
                      onChange={(e) => {
                        setCustomGrad1(e.target.value);
                        handleApplyCustomGradient(e.target.value, customGrad2, gradAngle);
                      }}
                      className="w-5 h-5 rounded-md cursor-pointer border-0 bg-transparent shrink-0"
                    />
                    <input
                      type="text"
                      value={customGrad1}
                      onChange={(e) => {
                        setCustomGrad1(e.target.value);
                        handleApplyCustomGradient(e.target.value, customGrad2, gradAngle);
                      }}
                      className="w-full bg-transparent text-[10px] font-mono font-bold text-slate-700 focus:outline-none uppercase"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[9px] text-slate-500 font-semibold block mb-1">Color 2 (End)</label>
                  <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-slate-200">
                    <input
                      type="color"
                      value={customGrad2}
                      onChange={(e) => {
                        setCustomGrad2(e.target.value);
                        handleApplyCustomGradient(customGrad1, e.target.value, gradAngle);
                      }}
                      className="w-5 h-5 rounded-md cursor-pointer border-0 bg-transparent shrink-0"
                    />
                    <input
                      type="text"
                      value={customGrad2}
                      onChange={(e) => {
                        setCustomGrad2(e.target.value);
                        handleApplyCustomGradient(customGrad1, e.target.value, gradAngle);
                      }}
                      className="w-full bg-transparent text-[10px] font-mono font-bold text-slate-700 focus:outline-none uppercase"
                    />
                  </div>
                </div>
              </div>

              {/* Direction Angles */}
              <div>
                <label className="text-[9px] text-slate-500 font-semibold block mb-1">Gradient Angle</label>
                <div className="flex gap-1.5">
                  {[
                    { angle: 90, label: '90°' },
                    { angle: 180, label: '180°' },
                    { angle: 45, label: '45°' }
                  ].map(a => (
                    <button
                      key={a.angle}
                      type="button"
                      onClick={() => {
                        setGradAngle(a.angle);
                        handleApplyCustomGradient(customGrad1, customGrad2, a.angle);
                      }}
                      className={`flex-1 py-1 rounded-lg text-[9px] font-bold border transition-all cursor-pointer ${
                        gradAngle === a.angle
                          ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm'
                          : 'bg-white border-slate-200 text-slate-600 hover:border-indigo-300'
                      }`}
                    >
                      {a.angle}°
                    </button>
                  ))}
                </div>
              </div>

              {/* Apply Custom Gradient Button */}
              <button
                type="button"
                onClick={() => handleApplyCustomGradient(customGrad1, customGrad2, gradAngle)}
                className="w-full py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold shadow-sm transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Sparkles size={13} /> Apply Custom Gradient
              </button>
            </div>
          </div>

          {/* Strap Width Visual Bars & Tooltips */}
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Strap Width</p>
            <div className="grid grid-cols-2 gap-2">
              {widths.map(w => {
                const active = design.width === w.label || design.lanyardWidth === w.label;
                const barHeight = w.label === '12mm' ? 4 : w.label === '16mm' ? 7 : w.label === '20mm' ? 10 : 13;
                return (
                  <OptionCardWithTooltip key={w.label} optionKey={w.label}>
                    <button
                      onClick={() => setOption('lanyardWidth', w.label, { width: w.label })}
                      className={`w-full p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                        active
                          ? 'border-indigo-600 bg-indigo-50/80 text-indigo-900 font-bold shadow-sm'
                          : 'border-slate-200 bg-white hover:border-indigo-300 text-slate-700'
                      }`}
                    >
                      {/* Visual width bar */}
                      <div className="w-full bg-slate-100 h-5 rounded-md flex items-center justify-center mb-1.5 px-2">
                        <div className="w-full bg-indigo-500 rounded-full transition-all" style={{ height: `${barHeight}px` }} />
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-[11px] font-bold">{w.label}</p>
                        {w.price > 0 && <span className="text-[8px] font-mono text-indigo-600 font-bold">+₹{w.price}</span>}
                      </div>
                      <p className="text-[9px] text-slate-400 mt-0.5 truncate">{w.description}</p>
                    </button>
                  </OptionCardWithTooltip>
                );
              })}
            </div>
          </div>

          {/* Strap Length & Tooltips */}
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Strap Length</p>
            <div className="flex gap-1">
              {lengths.map(l => {
                const active = design.length === l.label;
                return (
                  <OptionCardWithTooltip key={l.label} optionKey={l.label} className="flex-1">
                    <button
                      onClick={() => setOption('length', l.label)}
                      className={`w-full py-2 rounded-xl border text-center transition-all cursor-pointer ${
                        active
                          ? 'border-indigo-600 bg-indigo-600 text-white font-bold shadow-sm'
                          : 'border-slate-200 bg-white hover:border-indigo-300 text-slate-700'
                      }`}
                    >
                      <p className="text-[11px] font-bold">{l.label}"</p>
                    </button>
                  </OptionCardWithTooltip>
                );
              })}
            </div>
          </div>

          {/* Clip & Hook Hardware with Custom Artworks & Tooltips */}
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Clip & Hook Hardware</p>
            <div className="space-y-2">
              {clipTypes.map(c => {
                const active = design.clipType === c.label;
                return (
                  <OptionCardWithTooltip key={c.label} optionKey={c.label}>
                    <button
                      onClick={() => setOption('clipType', c.label)}
                      className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                        active
                          ? 'border-indigo-600 bg-indigo-50/80 text-indigo-900 font-bold shadow-sm'
                          : 'border-slate-200 bg-white hover:border-indigo-300 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <ClipGraphic type={c.label} active={active} />
                        <div className="min-w-0">
                          <p className="text-[11px] font-bold leading-tight">{c.label}</p>
                          <p className="text-[9px] text-slate-400 mt-0.5 leading-snug">{c.description}</p>
                        </div>
                      </div>
                      {c.price > 0 && <span className="text-[9px] font-mono font-bold text-indigo-600 bg-indigo-100 px-1.5 py-0.5 rounded shrink-0 ml-1">+₹{c.price}</span>}
                    </button>
                  </OptionCardWithTooltip>
                );
              })}
            </div>
          </div>

          {/* Accessories & Safety with Custom Artworks & Tooltips */}
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Accessories & Safety</p>
            <div className="space-y-2">
              {accessoryOptions.map(a => {
                const active = design.accessory === a.label || (design.accessories && design.accessories.includes(a.label));
                return (
                  <OptionCardWithTooltip key={a.label} optionKey={a.label}>
                    <button
                      onClick={() => setOption('accessory', a.label, { accessories: [a.label] })}
                      className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                        active
                          ? 'border-indigo-600 bg-indigo-50/80 text-indigo-900 font-bold shadow-sm'
                          : 'border-slate-200 bg-white hover:border-indigo-300 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <AccessoryGraphic label={a.label} active={active} />
                        <div className="min-w-0">
                          <p className="text-[11px] font-bold leading-none">{a.label}</p>
                          <p className="text-[9px] text-slate-400 mt-1 leading-snug">{a.description}</p>
                        </div>
                      </div>
                      {a.price > 0 && <span className="text-[9px] font-mono font-bold text-indigo-600 bg-indigo-100 px-1.5 py-0.5 rounded shrink-0 ml-1">+₹{a.price}</span>}
                    </button>
                  </OptionCardWithTooltip>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* ID CARD / BADGE SPECIFIC CONTROLS */}
      {(projectType === 'id-card' || projectType === 'badge' || projectType === 'combo') && (
        <>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Card Fields</p>
            <div className="space-y-1.5">
              {['Photo Placeholder', 'Name Field', 'ID Number', 'QR Code', 'Barcode', 'Department', 'Designation'].map(f => (
                <button key={f} onClick={() => onAdd?.({ type: 'field', field: f })}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50 transition-all text-left"
                >
                  <Plus size={11} className="text-slate-400 shrink-0" />
                  <span className="text-[11px] font-medium text-slate-600">{f}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Basic Shapes</p>
            <div className="grid grid-cols-2 gap-2">
              {shapes.map(({ type, icon: Icon, label }) => (
                <button key={type} onClick={() => onAdd?.({ type })}
                  className="flex flex-col items-center gap-1.5 p-3 rounded-lg border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50 transition-all group"
                >
                  <Icon size={20} className="text-slate-400 group-hover:text-indigo-600 transition-colors" />
                  <span className="text-[10px] font-medium text-slate-500 group-hover:text-indigo-600">{label}</span>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// --- Text Panel (Comprehensive 3D Lanyard Typography Suite) ---
function TextPanel({ onAdd }) {
  const design = useConfiguratorStore(s => s.design);
  const setField = useConfiguratorStore(s => s.setField);
  const [selectedBlockId, setSelectedBlockId] = useState('block-1');

  const textColors = [
    { name: 'White', value: '#ffffff' },
    { name: 'Gold', value: '#fbbf24' },
    { name: 'Silver', value: '#e2e8f0' },
    { name: 'Black', value: '#0f172a' },
    { name: 'Red', value: '#ef4444' },
    { name: 'Cyan', value: '#06b6d4' },
  ];

  const textBlocks = useMemo(() => {
    const list = design.textBlocks || [];
    if (list.length > 0) return list;
    const legacy = [design.text || '', design.textLine2 || '', design.textLine3 || ''].filter(Boolean);
    const hasLegacy = legacy.length > 0;
    return [{
      id: 'block-1',
      text: hasLegacy ? (design.text || '') : 'COMPANY NAME',
      textLine2: design.textLine2 || '',
      textLine3: design.textLine3 || '',
      textOffset: design.textOffset || 0,
      textYOffset: design.textYOffset || 0,
      textColor: design.textColor || '#000000',
      fontSize: design.fontSize || 16,
      letterSpacing: design.letterSpacing || 0,
      textStrokeWidth: design.textStrokeWidth || 0,
      textStrokeColor: design.textStrokeColor || '#000000',
      textShadowBlur: design.textShadowBlur || 0,
      fontFamily: design.fontFamily || 'Montserrat',
      fontWeight: design.fontWeight || 'bold',
    }];
  }, [design.textBlocks, design.text, design.textLine2, design.textLine3, design.textOffset, design.textYOffset, design.textColor, design.fontSize, design.letterSpacing, design.textStrokeWidth, design.textStrokeColor, design.textShadowBlur, design.fontFamily, design.fontWeight]);

  const selectedBlock = useMemo(() => {
    return textBlocks.find(b => b.id === selectedBlockId) || textBlocks[0] || {};
  }, [textBlocks, selectedBlockId]);

  const textColor = selectedBlock.textColor || '#000000';
  const fontFamily = selectedBlock.fontFamily || 'Inter';
  const fontSize = selectedBlock.fontSize || 16;
  const letterSpacing = selectedBlock.letterSpacing || 0;
  const strokeWidth = selectedBlock.textStrokeWidth || 0;
  const strokeColor = selectedBlock.textStrokeColor || '#000000';
  const shadowBlur = selectedBlock.textShadowBlur || 0;
  const textSpacing = design.textSpacing || 60;
  const fontOptions = ['Inter', 'Roboto', 'Poppins', 'Montserrat', 'Open Sans', 'Lato'];
  const designStyle = design.lanyardDesignStyle || 'repeated';

  const updateSelectedBlockField = (field, value) => {
    const updated = textBlocks.map(b => {
      if (b.id === selectedBlock.id) {
        return { ...b, [field]: value };
      }
      return b;
    });
    setField('textBlocks', updated);
    
    // Legacy support for block-1
    if (selectedBlock.id === 'block-1') {
      setField(field, value);
    }
  };

  const textLines = useMemo(() => {
    return [selectedBlock.text || '', selectedBlock.textLine2 || '', selectedBlock.textLine3 || ''].filter(Boolean);
  }, [selectedBlock]);

  const updateLine = (idx, value) => {
    const updatedLines = [...textLines];
    updatedLines[idx] = value;
    
    const updated = textBlocks.map(b => {
      if (b.id === selectedBlock.id) {
        return {
          ...b,
          text: updatedLines[0] || '',
          textLine2: updatedLines[1] || '',
          textLine3: updatedLines[2] || '',
        };
      }
      return b;
    });
    setField('textBlocks', updated);

    // Legacy support for block-1
    if (selectedBlock.id === 'block-1') {
      if (idx === 0) setField('text', value);
      if (idx === 1) setField('textLine2', value);
      if (idx === 2) setField('textLine3', value);
    }
  };

  const removeLine = (idx) => {
    const updatedLines = textLines.filter((_, i) => i !== idx);
    const updated = textBlocks.map(b => {
      if (b.id === selectedBlock.id) {
        return {
          ...b,
          text: updatedLines[0] || '',
          textLine2: updatedLines[1] || '',
          textLine3: updatedLines[2] || '',
        };
      }
      return b;
    });
    setField('textBlocks', updated);

    // Legacy support for block-1
    if (selectedBlock.id === 'block-1') {
      setField('text', updatedLines[0] || '');
      setField('textLine2', updatedLines[1] || '');
      setField('textLine3', updatedLines[2] || '');
    }
  };

  const addLine = () => {
    if (textLines.length >= 3) return;
    const updatedLines = [...textLines, ''];
    const updated = textBlocks.map(b => {
      if (b.id === selectedBlock.id) {
        return {
          ...b,
          text: updatedLines[0] || '',
          textLine2: updatedLines[1] || '',
          textLine3: updatedLines[2] || '',
        };
      }
      return b;
    });
    setField('textBlocks', updated);
  };

  const convertAllToUppercase = () => {
    const updatedLines = textLines.map(t => t.toUpperCase());
    const updated = textBlocks.map(b => {
      if (b.id === selectedBlock.id) {
        return {
          ...b,
          text: updatedLines[0] || '',
          textLine2: updatedLines[1] || '',
          textLine3: updatedLines[2] || '',
        };
      }
      return b;
    });
    setField('textBlocks', updated);
    if (selectedBlock.id === 'block-1') {
      if (updatedLines[0]) setField('text', updatedLines[0]);
      if (updatedLines[1]) setField('textLine2', updatedLines[1]);
      if (updatedLines[2]) setField('textLine3', updatedLines[2]);
    }
  };

  const addTextBlock = () => {
    const nextId = `block-${Date.now()}`;
    const offsetCount = textBlocks.length;
    const newBlock = {
      id: nextId,
      text: 'TEXT BOX ' + (offsetCount + 1),
      textLine2: '',
      textLine3: '',
      textOffset: 0,
      textYOffset: offsetCount * 160,
      textColor: '#fbbf24',
      fontSize: 16,
      letterSpacing: 0,
      textStrokeWidth: 0,
      textStrokeColor: '#000000',
      textShadowBlur: 0,
      fontFamily: 'Montserrat',
      fontWeight: 'bold',
    };
    setField('textBlocks', [...textBlocks, newBlock]);
    setSelectedBlockId(nextId);
  };

  const removeTextBlock = (blockId) => {
    if (textBlocks.length <= 1) return;
    const updated = textBlocks.filter(b => b.id !== blockId);
    setField('textBlocks', updated);
    if (selectedBlockId === blockId) {
      setSelectedBlockId(updated[0].id);
    }
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto p-3 panel-scroll gap-4">
      {/* Tab bar for active text boxes */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Separate Text Boxes</p>
        </div>
        <div className="flex flex-wrap gap-1.5 items-center bg-slate-50 p-2 rounded-2xl border border-slate-200 shadow-xs">
          {textBlocks.map((b, idx) => (
            <div key={b.id} className="relative group/tab">
              <button
                type="button"
                onClick={() => setSelectedBlockId(b.id)}
                className={`px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all cursor-pointer ${
                  selectedBlock.id === b.id
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200'
                }`}
              >
                Box {idx + 1}
              </button>
              {textBlocks.length > 1 && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeTextBlock(b.id);
                  }}
                  className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center text-[7px] font-bold opacity-0 group-hover/tab:opacity-100 transition-opacity cursor-pointer shadow-xs border border-white"
                  title="Delete Box"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={addTextBlock}
            className="p-1.5 bg-white hover:bg-indigo-50 border border-dashed border-indigo-300 rounded-xl text-indigo-600 cursor-pointer transition-all flex items-center justify-center shadow-xs"
            title="Add new text box"
          >
            <Plus size={11} />
          </button>
        </div>
      </div>

      {/* Live Text String Input */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active Box Text</p>
          <button
            onClick={convertAllToUppercase}
            className="text-[9px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md hover:bg-indigo-100 transition-colors"
            title="Convert all lines to Uppercase"
          >
            TT UPPERCASE
          </button>
        </div>
        <div className="space-y-3">
          {textLines.map((line, idx) => (
            <div key={idx} className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Line {idx + 1}</span>
                {textLines.length > 1 && (
                  <button
                    onClick={() => removeLine(idx)}
                    className="p-1 rounded-md text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
                    title="Remove text line"
                  >
                    <Trash2 size={10} />
                  </button>
                )}
              </div>
              <input
                type="text"
                value={line}
                onChange={(e) => updateLine(idx, e.target.value)}
                placeholder={idx === 0 ? "Enter Company or Event Name…" : `Line ${idx + 1} text…`}
                className="w-full text-[11px] font-semibold border border-slate-200 rounded-xl p-2.5 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all shadow-xs"
              />
            </div>
          ))}
          
          {textLines.length < 3 && (
            <button
              onClick={addLine}
              className="w-full flex items-center justify-center gap-1.5 py-2 px-3 border border-dashed border-indigo-300 rounded-xl text-[10px] font-bold text-indigo-600 hover:bg-indigo-50/50 hover:border-indigo-400 transition-all cursor-pointer"
            >
              <Plus size={11} /> Add New Text Line
            </button>
          )}
          
          <p className="text-[9px] text-slate-400 mt-1">
            Updates real-time on the 2D & 3D lanyard strap canvas. Drag text directly on canvas to reposition.
          </p>
        </div>
      </div>

      {/* Repeat & Placement Mode */}
      <div>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Text Pattern Placement</p>
        <div className="flex bg-slate-100 p-1 rounded-xl text-[10px] font-bold gap-1 border border-slate-200">
          <button
            onClick={() => setField('lanyardDesignStyle', 'repeated')}
            className={`flex-1 py-1.5 rounded-lg transition-all cursor-pointer ${
              designStyle === 'repeated' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Repeated Loop
          </button>
          <button
            onClick={() => setField('lanyardDesignStyle', 'central-logo')}
            className={`flex-1 py-1.5 rounded-lg transition-all cursor-pointer ${
              designStyle === 'central-logo' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Single Center
          </button>
        </div>
      </div>

      {/* Text Repeat Gap Slider (Only when repeated) */}
      {designStyle === 'repeated' && (
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Text Repeat Spacing</p>
            <span className="text-[10px] font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
              {textSpacing}px Gap
            </span>
          </div>
          <input
            type="range"
            min="20"
            max="160"
            step="5"
            value={textSpacing}
            onChange={(e) => setField('textSpacing', Number(e.target.value))}
            className="w-full accent-indigo-600 cursor-pointer"
          />
        </div>
      )}

      {/* Font Size & Letter Spacing Sliders */}
      <div className="space-y-3">
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Font Size</p>
            <span className="text-[10px] font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
              {fontSize}px
            </span>
          </div>
          <input
            type="range"
            min="8"
            max="36"
            step="1"
            value={fontSize}
            onChange={(e) => updateSelectedBlockField('fontSize', Number(e.target.value))}
            className="w-full accent-indigo-600 cursor-pointer"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Letter Spacing</p>
            <span className="text-[10px] font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
              {letterSpacing}px
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="15"
            step="1"
            value={letterSpacing}
            onChange={(e) => updateSelectedBlockField('letterSpacing', Number(e.target.value))}
            className="w-full accent-indigo-600 cursor-pointer"
          />
        </div>
      </div>

      {/* Text Color Swatches */}
      <div>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Text Fill Color</p>
        <div className="flex items-center gap-2 mb-2">
          {textColors.map(c => (
            <button
              key={c.name}
              onClick={() => updateSelectedBlockField('textColor', c.value)}
              className={`w-7 h-7 rounded-full border-2 transition-transform cursor-pointer relative ${
                textColor.toLowerCase() === c.value.toLowerCase() ? 'border-indigo-600 scale-110 ring-2 ring-indigo-500/30' : 'border-slate-200 hover:scale-105'
              }`}
              style={{ background: c.value }}
              title={c.name}
            >
              {textColor.toLowerCase() === c.value.toLowerCase() && (
                <CheckCircle2 size={12} className={`absolute inset-0 m-auto ${c.value === '#ffffff' ? 'text-indigo-600' : 'text-white'}`} />
              )}
            </button>
          ))}
          <input
            type="color"
            value={textColor}
            onChange={(e) => updateSelectedBlockField('textColor', e.target.value)}
            className="w-7 h-7 rounded-full cursor-pointer border-0 bg-transparent shrink-0"
            title="Custom Text Color"
          />
        </div>
      </div>

      {/* Text Stroke Outline & 3D Shadow Box */}
      <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-800 space-y-3 shadow-xs">
        <p className="text-[10px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
          <Sparkles size={12} className="text-indigo-600" /> Text Effects (Outline & 3D Depth)
        </p>

        {/* Outline Stroke Width */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-[9px] text-slate-500 font-semibold">Stroke Outline Width</label>
            <span className="text-[9px] font-mono font-bold text-indigo-600">{strokeWidth}px</span>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="range"
              min="0"
              max="5"
              step="0.5"
              value={strokeWidth}
              onChange={(e) => updateSelectedBlockField('textStrokeWidth', Number(e.target.value))}
              className="w-full accent-indigo-600 cursor-pointer"
            />
            <input
              type="color"
              value={strokeColor}
              onChange={(e) => updateSelectedBlockField('textStrokeColor', e.target.value)}
              className="w-6 h-6 rounded-md cursor-pointer border-0 bg-transparent shrink-0"
              title="Outline Color"
            />
          </div>
        </div>

        {/* 3D Drop Shadow Blur */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-[9px] text-slate-500 font-semibold">3D Fabric Shadow Blur</label>
            <span className="text-[9px] font-mono font-bold text-indigo-600">{shadowBlur}px</span>
          </div>
          <input
            type="range"
            min="0"
            max="10"
            step="1"
            value={shadowBlur}
            onChange={(e) => updateSelectedBlockField('textShadowBlur', Number(e.target.value))}
            className="w-full accent-indigo-600 cursor-pointer"
          />
        </div>
      </div>

      {/* Reverse Mode selector */}
      <div>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Back Strap Reverse Mode</p>
        <div className="flex bg-slate-100 p-1 rounded-xl text-[9px] font-bold gap-1 border border-slate-200">
          {[
            { key: 'none', label: 'None' },
            { key: 'horizontal', label: 'H Mirror' },
            { key: 'production', label: 'Print Ready' },
          ].map(m => (
            <button
              key={m.key}
              onClick={() => setField('textReverseMode', m.key)}
              className={`flex-1 py-1.5 rounded-lg transition-all cursor-pointer ${
                (design.textReverseMode || 'production') === m.key
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
        <p className="text-[9px] text-slate-400 mt-1">"Print Ready" auto-mirrors text on the back strap for correct production output.</p>
      </div>

      {/* Font Typography Selector */}
      <div>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Font Typography</p>
        <div className="grid grid-cols-2 gap-1.5">
          {fontOptions.map(f => (
            <button
              key={f}
              onClick={() => updateSelectedBlockField('fontFamily', f)}
              className={`w-full text-left px-3 py-2 rounded-xl text-[12px] border transition-all cursor-pointer ${
                fontFamily === f
                  ? 'border-indigo-600 bg-indigo-50 text-indigo-900 font-bold shadow-xs'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-indigo-300'
              }`}
              style={{ fontFamily: f }}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Designer Presets */}
      <div>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">1-Click Typography Presets</p>
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: 'VIP Metallic Gold', text: 'VIP ALL ACCESS', color: '#fbbf24', font: 'Montserrat', strokeW: 0 },
            { label: 'Cyberpunk Neon', text: 'CYBERPUNK 2026', color: '#06b6d4', font: 'Inter', strokeW: 1.5, strokeC: '#000000' },
            { label: 'Executive White', text: 'ACME CORP', color: '#ffffff', font: 'Inter', strokeW: 0 },
            { label: 'Security Red Alert', text: 'SECURITY STAFF', color: '#ef4444', font: 'Roboto', strokeW: 1, strokeC: '#ffffff' },
          ].map(p => (
            <button
              key={p.label}
              onClick={() => {
                const updated = textBlocks.map(b => {
                  if (b.id === selectedBlock.id) {
                    return {
                      ...b,
                      text: p.text,
                      textColor: p.color,
                      fontFamily: p.font,
                      textStrokeWidth: p.strokeW,
                      textStrokeColor: p.strokeC || b.textStrokeColor,
                    };
                  }
                  return b;
                });
                setField('textBlocks', updated);
                if (selectedBlock.id === 'block-1') {
                  setField('text', p.text);
                  setField('textColor', p.color);
                  setField('fontFamily', p.font);
                  setField('textStrokeWidth', p.strokeW);
                  if (p.strokeC) setField('textStrokeColor', p.strokeC);
                }
              }}
              className="p-2.5 rounded-xl border border-slate-200 bg-white hover:border-indigo-400 hover:shadow-sm text-left transition-all cursor-pointer space-y-1"
            >
              <p className="text-[10px] font-bold text-slate-800 truncate">{p.label}</p>
              <p className="text-[9px] font-mono font-bold truncate" style={{ color: p.color, fontFamily: p.font }}>
                {p.text}
              </p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// --- Upload Panel ---
function UploadPanel({ onUpload }) {
  const [dragging, setDragging] = useState(false);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) onUpload?.(file);
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto p-3 panel-scroll gap-4">
      <div
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer ${
          dragging ? 'border-indigo-500 bg-indigo-50' : 'border-slate-300 hover:border-indigo-400 hover:bg-slate-50'
        }`}
        onClick={() => {
          const input = document.createElement('input');
          input.type = 'file';
          input.accept = 'image/*';
          input.onchange = e => onUpload?.(e.target.files?.[0]);
          input.click();
        }}
      >
        <Upload size={24} className={`mx-auto mb-2 ${dragging ? 'text-indigo-500' : 'text-slate-400'}`} />
        <p className="text-[12px] font-semibold text-slate-600">Drop files here</p>
        <p className="text-[10px] text-slate-400 mt-0.5">or click to browse</p>
        <p className="text-[9px] text-slate-300 mt-2">PNG, JPG, SVG up to 10MB</p>
      </div>
      <div>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Uploaded Images</p>
        <div className="grid grid-cols-3 gap-1.5">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="aspect-square rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center">
              <ImageIcon size={16} className="text-slate-300" />
            </div>
          ))}
        </div>
        <p className="text-[10px] text-slate-400 text-center mt-3">Your uploaded images will appear here</p>
      </div>
    </div>
  );
}

// --- AI Panel ---
function AIPanel() {
  const [prompt, setPrompt] = useState('');
  const suggestions = [
    'Generate a professional background pattern',
    'Create a gradient header for corporate ID',
    'Design a QR code placeholder frame',
    'Add a watermark pattern',
  ];

  return (
    <div className="flex flex-col h-full overflow-y-auto p-3 panel-scroll gap-4">
      <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-4 border border-indigo-100">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
            <Sparkles size={12} className="text-white" />
          </div>
          <p className="text-[12px] font-bold text-slate-800">AI Design Assistant</p>
        </div>
        <textarea
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          placeholder="Describe what you want to add or change…"
          className="w-full text-[12px] border border-indigo-200 rounded-lg p-2.5 resize-none bg-white focus:outline-none focus:ring-1 focus:ring-indigo-400 h-20"
        />
        <button className="w-full mt-2 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white text-[12px] font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5">
          <Sparkles size={12} />
          Generate
        </button>
      </div>
      <div>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Quick Prompts</p>
        <div className="space-y-1.5">
          {suggestions.map(s => (
            <button key={s} onClick={() => setPrompt(s)}
              className="w-full text-left px-3 py-2 rounded-lg border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50 text-[11px] text-slate-600 transition-all"
            >
              {s}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// --- Brand Kit Panel ---
function BrandKitPanel() {
  const colors = ['#0284c7', '#4f46e5', '#059669', '#dc2626', '#d97706', '#7c3aed', '#0f172a', '#ffffff'];

  return (
    <div className="flex flex-col h-full overflow-y-auto p-3 panel-scroll gap-4">
      <div>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Brand Colors</p>
        <div className="flex flex-wrap gap-2 mb-3">
          {colors.map(c => (
            <button key={c} className="w-8 h-8 rounded-lg border-2 border-white shadow-md hover:scale-110 transition-transform"
              style={{ background: c }} title={c}
            />
          ))}
          <button className="w-8 h-8 rounded-lg border-2 border-dashed border-slate-300 hover:border-indigo-400 flex items-center justify-center transition-colors">
            <Plus size={12} className="text-slate-400" />
          </button>
        </div>
      </div>
      <div>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Brand Fonts</p>
        <div className="space-y-1.5">
          {['Primary: Inter', 'Secondary: DM Sans', 'Mono: JetBrains Mono'].map(f => (
            <div key={f} className="px-3 py-2 rounded-lg bg-slate-50 border border-slate-200">
              <p className="text-[11px] text-slate-600 font-medium">{f}</p>
            </div>
          ))}
        </div>
      </div>
      <div>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Logos & Assets</p>
        <div className="grid grid-cols-3 gap-1.5">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="aspect-square rounded-lg bg-slate-50 border border-dashed border-slate-300 flex items-center justify-center">
              <Plus size={14} className="text-slate-300" />
            </div>
          ))}
        </div>
        <p className="text-[10px] text-slate-400 text-center mt-2">Upload brand assets</p>
      </div>
    </div>
  );
}

const TABS = [
  { key: 'templates', icon: LayoutTemplate, label: 'Templates' },
  { key: 'elements', icon: Shapes, label: 'Elements' },
  { key: 'text', icon: Type, label: 'Text' },
  { key: 'upload', icon: Upload, label: 'Upload' },
];

// --- Main Left Toolbar ---
export default function LeftToolbar({ projectType = 'lanyard', onApplyTemplate, onAddElement, onUpload, onTabChange }) {
  const [activeTab, setActiveTab] = useState('templates');
  const [panelOpen, setPanelOpen] = useState(true);
  const [panelWidth, setPanelWidth] = useState(340);
  const isDraggingRef = useRef(false);

  const handleTabClick = (key) => {
    if (activeTab === key && panelOpen) {
      setPanelOpen(false);
    } else {
      setActiveTab(key);
      setPanelOpen(true);
      onTabChange?.(key);
    }
  };

  const toggleExpand = () => {
    setPanelWidth(prev => (prev >= 440 ? 340 : 480));
  };

  const handleMouseDown = (e) => {
    e.preventDefault();
    isDraggingRef.current = true;
    const startX = e.clientX;
    const startW = panelWidth;

    const handleMouseMove = (moveEvent) => {
      if (!isDraggingRef.current) return;
      const delta = moveEvent.clientX - startX;
      const newW = Math.min(Math.max(260, startW + delta), 650);
      setPanelWidth(newW);
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const renderPanel = () => {
    switch (activeTab) {
      case 'templates': return <TemplatesPanel projectType={projectType} onApply={onApplyTemplate} />;
      case 'elements': return <ElementsPanel projectType={projectType} onAdd={onAddElement} onUpload={onUpload} />;
      case 'text': return <TextPanel onAdd={onAddElement} />;
      case 'upload': return <UploadPanel onUpload={onUpload} />;
      case 'ai': return <AIPanel />;
      case 'brand': return <BrandKitPanel />;
      default: return null;
    }
  };

  return (
    <div className="editor-left-toolbar flex h-full shrink-0 relative select-none">
      {/* Icon Sidebar */}
      <div className="w-14 bg-slate-900 flex flex-col items-center py-3 gap-1 border-r border-slate-800 shrink-0 z-20">
        {TABS.map(({ key, icon: Icon, label }) => (
          <button
            key={key}
            onClick={() => handleTabClick(key)}
            title={label}
            className={`w-10 h-10 flex flex-col items-center justify-center rounded-xl gap-0.5 transition-all group relative cursor-pointer ${
              activeTab === key && panelOpen
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/40'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Icon size={16} />
            <span className="text-[8px] font-semibold leading-none">{label}</span>
          </button>
        ))}
      </div>

      {/* Resizable / Expandable Sliding Panel */}
      {panelOpen && (
        <div
          style={{ width: `${panelWidth}px` }}
          className="bg-white border-r border-slate-200 flex flex-col h-full overflow-hidden relative shrink-0 transition-all duration-75"
        >
          {/* Panel Header */}
          <div className="h-10 px-3 flex items-center justify-between border-b border-slate-100 shrink-0 bg-slate-50/50">
            <p className="text-[11px] font-bold text-slate-700 uppercase tracking-widest flex items-center gap-1.5">
              <span>{TABS.find(t => t.key === activeTab)?.label}</span>
              <span className="text-[9px] font-mono font-normal text-slate-400">({panelWidth}px)</span>
            </p>

            <div className="flex items-center gap-1">
              <button
                onClick={toggleExpand}
                className="p-1 rounded-lg hover:bg-slate-200 text-slate-500 hover:text-slate-700 transition-colors cursor-pointer"
                title={panelWidth >= 440 ? "Collapse Width" : "Expand Width"}
              >
                {panelWidth >= 440 ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
              </button>
              <button
                onClick={() => setPanelOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-200 text-slate-500 hover:text-slate-700 transition-colors cursor-pointer"
                title="Close Panel"
              >
                <X size={13} />
              </button>
            </div>
          </div>

          {/* Panel Content */}
          <div className="flex-1 min-h-0 overflow-hidden">
            {renderPanel()}
          </div>

          {/* Drag Resize Handle border */}
          <div
            onMouseDown={handleMouseDown}
            className="absolute top-0 right-0 w-1.5 h-full cursor-col-resize hover:bg-indigo-500/50 active:bg-indigo-600 transition-colors z-30 group"
            title="Drag to resize panel width"
          >
            <div className="w-full h-full group-hover:bg-indigo-500" />
          </div>
        </div>
      )}
    </div>
  );
}
