import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CreditCard,
  Link2,
  BadgeCheck,
  Layers,
  LayoutTemplate,
  PenTool,
  Upload,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Zap,
  Users,
  Printer,
} from 'lucide-react';

/* ─────────────────────────────────────────
   Data
───────────────────────────────────────── */
const PRODUCT_TYPES = [
  {
    id: 'id-card',
    name: 'ID Card',
    icon: CreditCard,
    tagline: 'Employee, student, or membership cards',
    gradient: 'from-indigo-500 to-blue-600',
    shadowColor: 'shadow-indigo-500/20',
    features: [
      { icon: Users,    text: 'Employee & student IDs' },
      { icon: Printer,  text: 'CR80 & custom sizes' },
      { icon: Zap,      text: 'Both sides supported' },
    ],
  },
  {
    id: 'lanyard',
    name: 'Lanyard',
    icon: Link2,
    tagline: 'Custom printed neck straps with logo & text',
    gradient: 'from-purple-500 to-pink-600',
    shadowColor: 'shadow-purple-500/20',
    features: [
      { icon: Printer,      text: 'Full-color sublimation print' },
      { icon: Zap,          text: 'Logo, text & pattern support' },
      { icon: CheckCircle2, text: 'Various clip styles' },
    ],
  },
  {
    id: 'badge',
    name: 'Badge',
    icon: BadgeCheck,
    tagline: 'Event name badges & sticker labels',
    gradient: 'from-emerald-500 to-teal-600',
    shadowColor: 'shadow-emerald-500/20',
    features: [
      { icon: Users,    text: 'Event & conference badges' },
      { icon: Printer,  text: 'Sticker & label options' },
      { icon: Zap,      text: 'Quick-change inserts' },
    ],
  },
  {
    id: 'combo',
    name: 'Combo Set',
    icon: Layers,
    tagline: 'ID card + lanyard packaged together',
    gradient: 'from-orange-500 to-rose-600',
    shadowColor: 'shadow-orange-500/20',
    features: [
      { icon: CheckCircle2, text: 'Matched design system' },
      { icon: Printer,      text: 'Bundled print production' },
      { icon: Zap,          text: 'Bulk order discounts' },
    ],
  },
];

const START_MODES = [
  {
    id: 'template',
    name: 'Browse Templates',
    icon: LayoutTemplate,
    description: 'Start from a professional template',
    gradient: 'from-indigo-500 to-violet-600',
  },
  {
    id: 'blank',
    name: 'Blank Canvas',
    icon: PenTool,
    description: 'Start with an empty canvas',
    gradient: 'from-slate-500 to-slate-600',
  },
  {
    id: 'import',
    name: 'Import Existing',
    icon: Upload,
    description: 'Upload an existing design file',
    gradient: 'from-cyan-500 to-blue-600',
  },
];

/* ─────────────────────────────────────────
   Sub-components
───────────────────────────────────────── */
function ProductCard({ product, selected, onClick }) {
  const Icon = product.icon;

  return (
    <button
      onClick={onClick}
      className={[
        'group relative w-full text-left rounded-2xl p-6 transition-all duration-300 outline-none',
        'border backdrop-blur-sm',
        selected
          ? 'border-indigo-500 bg-indigo-500/10 ring-2 ring-indigo-500/30 shadow-xl shadow-indigo-500/10'
          : 'border-white/10 bg-white/5 hover:border-indigo-400/60 hover:bg-white/10 hover:shadow-lg',
      ].join(' ')}
    >
      {/* Selected checkmark */}
      <div
        className={[
          'absolute top-4 right-4 transition-all duration-200',
          selected ? 'opacity-100 scale-100' : 'opacity-0 scale-75',
        ].join(' ')}
      >
        <CheckCircle2 className="w-5 h-5 text-indigo-400" />
      </div>

      {/* Icon circle */}
      <div
        className={[
          'w-14 h-14 rounded-2xl flex items-center justify-center mb-4',
          'bg-gradient-to-br',
          product.gradient,
          'shadow-lg',
          'transition-transform duration-300 group-hover:scale-110',
        ].join(' ')}
      >
        <Icon className="w-7 h-7 text-white" strokeWidth={1.75} />
      </div>

      {/* Text */}
      <h3 className="text-lg font-semibold text-white mb-1">{product.name}</h3>
      <p className="text-sm text-slate-400 mb-4 leading-snug">{product.tagline}</p>

      {/* Feature bullets */}
      <ul className="space-y-2">
        {product.features.map(({ icon: FeatIcon, text }) => (
          <li key={text} className="flex items-center gap-2 text-xs text-slate-400">
            <FeatIcon className="w-3.5 h-3.5 shrink-0 text-slate-500" strokeWidth={2} />
            <span>{text}</span>
          </li>
        ))}
      </ul>
    </button>
  );
}

function ModeCard({ mode, selected, onClick }) {
  const Icon = mode.icon;

  return (
    <button
      onClick={onClick}
      className={[
        'group relative flex-1 min-w-0 text-left rounded-xl p-5 transition-all duration-300 outline-none',
        'border backdrop-blur-sm',
        selected
          ? 'border-indigo-500 bg-indigo-500/10 ring-2 ring-indigo-500/30 shadow-lg shadow-indigo-500/10'
          : 'border-white/10 bg-white/5 hover:border-indigo-400/60 hover:bg-white/10',
      ].join(' ')}
    >
      {/* Selected checkmark */}
      <div
        className={[
          'absolute top-3 right-3 transition-all duration-200',
          selected ? 'opacity-100 scale-100' : 'opacity-0 scale-75',
        ].join(' ')}
      >
        <CheckCircle2 className="w-4 h-4 text-indigo-400" />
      </div>

      {/* Icon */}
      <div
        className={[
          'w-10 h-10 rounded-xl flex items-center justify-center mb-3',
          'bg-gradient-to-br',
          mode.gradient,
          'shadow-md transition-transform duration-300 group-hover:scale-110',
        ].join(' ')}
      >
        <Icon className="w-5 h-5 text-white" strokeWidth={1.75} />
      </div>

      <p className="text-sm font-semibold text-white mb-0.5">{mode.name}</p>
      <p className="text-xs text-slate-400 leading-snug">{mode.description}</p>
    </button>
  );
}

/* ─────────────────────────────────────────
   Main component
───────────────────────────────────────── */
export default function NewProject({ onStart }) {
  const navigate = useNavigate();
  const [selectedType, setSelectedType] = useState(null);
  const [selectedMode, setSelectedMode] = useState(null);
  const [modeVisible, setModeVisible]   = useState(false);

  function handleSelectType(id) {
    setSelectedType(id);
    if (!modeVisible) {
      setTimeout(() => setModeVisible(true), 80);
    }
  }

  function handleContinue() {
    if (!selectedType || !selectedMode) return;

    if (typeof onStart === 'function') {
      onStart(selectedType, selectedMode, null);
    } else {
      if (selectedMode === 'template') {
        navigate('/templates');
      } else if (selectedMode === 'import') {
        navigate('/bulk-import');
      } else {
        if (selectedType === 'id-card') {
          navigate('/id-card-designer');
        } else {
          navigate('/editor');
        }
      }
    }
  }

  const canContinue = Boolean(selectedType && selectedMode);

  return (
    <div
      className="min-h-screen w-full flex flex-col"
      style={{
        background: 'linear-gradient(135deg, #020617 0%, #0f172a 50%, #1e1b4b 100%)',
        fontFamily: "'Inter', sans-serif",
      }}
    >
      {/* Ambient blobs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
        <div
          className="absolute -top-32 -left-32 w-96 h-96 rounded-full opacity-20"
          style={{ background: 'radial-gradient(circle, #6366f1 0%, transparent 70%)' }}
        />
        <div
          className="absolute top-1/2 -right-40 w-80 h-80 rounded-full opacity-15"
          style={{ background: 'radial-gradient(circle, #8b5cf6 0%, transparent 70%)' }}
        />
        <div
          className="absolute bottom-0 left-1/3 w-72 h-72 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #3b82f6 0%, transparent 70%)' }}
        />
      </div>

      {/* ── HEADER ── */}
      <header className="relative z-10 flex items-center gap-4 px-6 py-5 sm:px-10 sm:py-7">
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors duration-200 group"
        >
          <span className="flex items-center justify-center w-9 h-9 rounded-xl border border-white/10 bg-white/5 group-hover:bg-white/10 group-hover:border-white/20 transition-all duration-200">
            <ArrowLeft className="w-4 h-4" />
          </span>
          <span className="text-sm font-medium hidden sm:inline">Back to Dashboard</span>
        </button>

        {/* Step indicator */}
        <div className="ml-auto flex items-center gap-2 text-xs text-slate-500">
          <span
            className={[
              'px-2.5 py-1 rounded-full font-medium transition-colors duration-300',
              selectedType ? 'bg-indigo-500/20 text-indigo-300' : 'bg-white/5 text-slate-500',
            ].join(' ')}
          >
            1 Choose type
          </span>
          <span className="w-4 h-px bg-slate-700" />
          <span
            className={[
              'px-2.5 py-1 rounded-full font-medium transition-colors duration-300',
              selectedMode ? 'bg-indigo-500/20 text-indigo-300' : 'bg-white/5 text-slate-500',
            ].join(' ')}
          >
            2 Start mode
          </span>
        </div>
      </header>

      {/* ── MAIN ── */}
      <main className="relative z-10 flex-1 flex flex-col items-center px-4 pb-16 sm:px-6">
        <div className="w-full max-w-5xl">

          {/* Title */}
          <div className="text-center mb-10">
            <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight mb-3">
              What would you like to{' '}
              <span
                style={{
                  backgroundImage: 'linear-gradient(90deg, #818cf8, #a78bfa, #c084fc)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                create?
              </span>
            </h1>
            <p className="text-slate-400 text-base max-w-md mx-auto">
              Select a product type to get started with your design project.
            </p>
          </div>

          {/* ── STEP 1: Product Type ── */}
          <section>
            <div className="flex items-center gap-3 mb-5">
              <span className="w-6 h-6 rounded-full bg-indigo-500 text-white text-xs font-bold flex items-center justify-center shrink-0">
                1
              </span>
              <h2 className="text-base font-semibold text-slate-200">Choose your product type</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {PRODUCT_TYPES.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  selected={selectedType === product.id}
                  onClick={() => handleSelectType(product.id)}
                />
              ))}
            </div>
          </section>

          {/* ── STEP 2: Start Mode (animated) ── */}
          <div
            style={{
              maxHeight: modeVisible ? '600px' : '0',
              opacity: modeVisible ? 1 : 0,
              overflow: 'hidden',
              transition: 'max-height 0.45s cubic-bezier(0.4,0,0.2,1), opacity 0.35s ease',
            }}
          >
            <section className="mt-10">
              <div className="flex items-center gap-3 mb-5">
                <span className="w-6 h-6 rounded-full bg-indigo-500 text-white text-xs font-bold flex items-center justify-center shrink-0">
                  2
                </span>
                <h2 className="text-base font-semibold text-slate-200">How would you like to start?</h2>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                {START_MODES.map((mode) => (
                  <ModeCard
                    key={mode.id}
                    mode={mode}
                    selected={selectedMode === mode.id}
                    onClick={() => setSelectedMode(mode.id)}
                  />
                ))}
              </div>
            </section>
          </div>

          {/* ── Continue button ── */}
          <div
            className="flex justify-end mt-8"
            style={{
              opacity: modeVisible ? 1 : 0,
              transform: modeVisible ? 'translateY(0)' : 'translateY(12px)',
              transition: 'opacity 0.4s ease 0.2s, transform 0.4s ease 0.2s',
              pointerEvents: modeVisible ? 'auto' : 'none',
            }}
          >
            <button
              onClick={handleContinue}
              disabled={!canContinue}
              className={[
                'relative flex items-center gap-2.5 px-8 py-3.5 rounded-2xl font-semibold text-sm text-white',
                'transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/50',
                canContinue
                  ? 'bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/40 hover:scale-105 active:scale-95'
                  : 'bg-white/10 text-slate-500 cursor-not-allowed',
              ].join(' ')}
            >
              {canContinue && (
                <span
                  className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none"
                  aria-hidden="true"
                >
                  <span
                    className="absolute inset-0"
                    style={{
                      background:
                        'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.18) 50%, transparent 60%)',
                      animation: 'npShine 3s ease-in-out infinite',
                    }}
                  />
                </span>
              )}
              Continue to Design
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Helper hint */}
          {!selectedType && (
            <p className="text-center text-xs text-slate-600 mt-4">
              Select a product type above to continue
            </p>
          )}
          {selectedType && !selectedMode && (
            <p className="text-center text-xs text-slate-600 mt-4">
              Choose how you would like to start
            </p>
          )}
        </div>
      </main>

      <style>{`
        @keyframes npShine {
          0%   { transform: translateX(-130%); }
          60%  { transform: translateX(130%); }
          100% { transform: translateX(130%); }
        }
      `}</style>
    </div>
  );
}
