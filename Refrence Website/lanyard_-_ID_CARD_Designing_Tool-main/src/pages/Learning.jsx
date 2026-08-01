import { useState } from 'react';
import {
  Palette,
  LayoutTemplate,
  SlidersHorizontal,
  Eye,
  Download,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Paintbrush,
  Grid3X3,
  Type,
  Star,
  Upload,
  Play,
  RotateCcw,
  Minus,
  Plus,
  Maximize2,
} from 'lucide-react';

/* ────────────────────────────────────────────────────────────────
   Step data for the top horizontal stepper
   ──────────────────────────────────────────────────────────────── */
const STEPS = [
  {
    number: 1,
    title: 'Design Your Lanyard',
    subtitle: 'Choose colors, patterns, and add your branding.',
    icon: Palette,
    color: '#6366f1',
  },
  {
    number: 2,
    title: 'Create Your ID Card',
    subtitle: 'Pick a template and customize it.',
    icon: LayoutTemplate,
    color: '#0ea5e9',
  },
  {
    number: 3,
    title: 'Customize Your Design',
    subtitle: 'Fine-tune every element.',
    icon: SlidersHorizontal,
    color: '#f59e0b',
  },
  {
    number: 4,
    title: 'See It in Real Life',
    subtitle: 'View your design instantly in 3D.',
    icon: Eye,
    color: '#10b981',
  },
  {
    number: 5,
    title: 'Export & Place Order',
    subtitle: 'Finalize your design and get it ready.',
    icon: Download,
    color: '#ef4444',
  },
];

/* ────────────────────────────────────────────────────────────────
   Example lanyard design entries (for the "Example Lanyard Designs" section)
   ──────────────────────────────────────────────────────────────── */
const LANYARD_EXAMPLES = [
  { name: 'Tech Blue', dotColor: '#2563eb' },
  { name: 'Innovate Orange', dotColor: '#f59e0b' },
  { name: 'Green Earth', dotColor: '#16a34a' },
  { name: 'Creative Purple', dotColor: '#7c3aed' },
  { name: 'Global Red', dotColor: '#dc2626' },
  { name: 'Academy Gold', dotColor: '#eab308' },
  { name: 'Future Minds', dotColor: '#14b8a6' },
  { name: 'Digital Core', dotColor: '#334155' },
];

/* ────────────────────────────────────────────────────────────────
   Step card in the horizontal stepper (top)
   ──────────────────────────────────────────────────────────────── */
function StepChip({ step, isFirst, isLast }) {
  const Icon = step.icon;
  return (
    <div className="learning-step-chip">
      {/* Connector dashes */}
      {!isFirst && (
        <div className="learning-step-connector">
          <svg width="40" height="2" viewBox="0 0 40 2">
            <line x1="0" y1="1" x2="40" y2="1" stroke={step.color} strokeWidth="2" strokeDasharray="5,4" opacity="0.35" />
          </svg>
        </div>
      )}
      <div
        className="learning-step-chip-card"
        style={{ borderColor: `${step.color}25` }}
      >
        <div className="learning-step-chip-header">
          <span
            className="learning-step-number"
            style={{ background: `${step.color}14`, color: step.color }}
          >
            {step.number}
          </span>
          <div
            className="learning-step-icon"
            style={{ background: `${step.color}12`, color: step.color }}
          >
            <Icon size={14} />
          </div>
        </div>
        <h4 className="learning-step-title">{step.title}</h4>
        <p className="learning-step-sub">{step.subtitle}</p>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────
   Sidebar tool buttons for Step 1 detail section
   ──────────────────────────────────────────────────────────────── */
function ToolSidebar({ onNavigate }) {
  const tools = [
    { icon: Paintbrush, label: 'Colors' },
    { icon: Grid3X3, label: 'Patterns' },
    { icon: Type, label: 'Text' },
    { icon: Star, label: 'Elements' },
    { icon: Upload, label: 'Uploads' },
  ];
  return (
    <div className="learning-tool-sidebar">
      {tools.map((t) => {
        const TIcon = t.icon;
        return (
          <button 
            key={t.label} 
            type="button"
            className="learning-tool-btn w-full text-left"
            onClick={() => onNavigate('Customizer')}
          >
            <TIcon size={16} />
            <span>{t.label}</span>
          </button>
        );
      })}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────
   Main Learning Page
   ──────────────────────────────────────────────────────────────── */
export default function Learning({ onNavigate }) {
  const [viewMode, setViewMode] = useState('2D');

  return (
    <div className="learning-page">
      {/* ── Header ── */}
      <header className="learning-header">
        <div className="learning-badge">
          <Sparkles size={12} />
          QUICK GUIDE
        </div>
        <h1 className="learning-title">How to Design Your Lanyard & ID Card</h1>
        <p className="learning-subtitle">
          Follow these simple steps to create your design and preview it in real-time.
        </p>
      </header>

      {/* ── Horizontal Step Stepper ── */}
      <div className="learning-stepper">
        {STEPS.map((step, idx) => (
          <StepChip
            key={step.number}
            step={step}
            isFirst={idx === 0}
            isLast={idx === STEPS.length - 1}
          />
        ))}
      </div>

      {/* ── STEP 1: Design Your Lanyard (full-width section) ── */}
      <section className="learning-detail-section">
        <div className="learning-detail-grid">
          {/* Left column — description */}
          <div className="learning-detail-left">
            <span className="learning-step-label" style={{ color: '#6366f1' }}>
              STEP 1
            </span>
            <h2 className="learning-detail-heading">Design Your Lanyard</h2>
            <p className="learning-detail-desc">
              Create a unique lanyard by choosing colors, applying patterns, and adding your logo and text.
            </p>

            <div className="learning-feature-list">
              <button type="button" onClick={() => onNavigate('Customizer')} className="learning-feature-item text-left w-full hover:bg-indigo-50/50 transition-colors rounded-xl p-2 -ml-2 cursor-pointer">
                <div className="learning-feature-icon" style={{ background: '#6366f114', color: '#6366f1' }}>
                  <Paintbrush size={16} />
                </div>
                <div>
                  <h5 className="learning-feature-title">Pick Strap Color</h5>
                  <p className="learning-feature-desc">Choose a solid color or gradient that matches your brand.</p>
                </div>
              </button>

              <button type="button" onClick={() => onNavigate('Customizer')} className="learning-feature-item text-left w-full hover:bg-indigo-50/50 transition-colors rounded-xl p-2 -ml-2 cursor-pointer">
                <div className="learning-feature-icon" style={{ background: '#6366f114', color: '#6366f1' }}>
                  <Grid3X3 size={16} />
                </div>
                <div>
                  <h5 className="learning-feature-title">Apply Patterns</h5>
                  <p className="learning-feature-desc">Use our pattern library or upload your own design.</p>
                </div>
              </button>

              <button type="button" onClick={() => onNavigate('Customizer')} className="learning-feature-item text-left w-full hover:bg-indigo-50/50 transition-colors rounded-xl p-2 -ml-2 cursor-pointer">
                <div className="learning-feature-icon" style={{ background: '#6366f114', color: '#6366f1' }}>
                  <Type size={16} />
                </div>
                <div>
                  <h5 className="learning-feature-title">Add Text</h5>
                  <p className="learning-feature-desc">Add your brand name, slogan or any text and adjust the style.</p>
                </div>
              </button>

              <button type="button" onClick={() => onNavigate('Customizer')} className="learning-feature-item text-left w-full hover:bg-indigo-50/50 transition-colors rounded-xl p-2 -ml-2 cursor-pointer">
                <div className="learning-feature-icon" style={{ background: '#6366f114', color: '#6366f1' }}>
                  <Upload size={16} />
                </div>
                <div>
                  <h5 className="learning-feature-title">Upload Logo</h5>
                  <p className="learning-feature-desc">Upload your logo or icon and place it anywhere on the strap.</p>
                </div>
              </button>
            </div>

            <button
              type="button"
              onClick={() => onNavigate('Customizer')}
              className="learning-cta-btn"
            >
              <Palette size={15} />
              Open Lanyard Designer
            </button>
          </div>

          {/* Center column — lanyard preview with toolbar */}
          <div className="learning-detail-center">
            {/* 2D / 3D toggle */}
            <div className="learning-view-toggle">
              <button
                type="button"
                className={`learning-view-btn ${viewMode === '2D' ? 'active' : ''}`}
                onClick={() => setViewMode('2D')}
              >
                2D
              </button>
              <button
                type="button"
                className={`learning-view-btn ${viewMode === '3D' ? 'active' : ''}`}
                onClick={() => setViewMode('3D')}
              >
                3D
              </button>
            </div>

            <div className="learning-preview-area">
              {/* Tool sidebar */}
              <ToolSidebar onNavigate={onNavigate} />

              {/* Main lanyard image */}
              <div className="learning-lanyard-showcase">
                <img
                  src="/assets/lanyard-designs-grid.png"
                  alt="Example Lanyard Designs"
                  className="learning-lanyard-img"
                />
              </div>
            </div>

            {/* Bottom brand name bar */}
            <div className="learning-brand-bar">
              <span>BRAND NAME</span>
              <span className="learning-brand-separator" />
              <span>BRAND NAME</span>
            </div>

            {/* Bottom controls */}
            <div className="learning-preview-controls">
              <button type="button" onClick={() => onNavigate('Customizer')} className="learning-ctrl-btn"><RotateCcw size={15} /></button>
              <button type="button" onClick={() => onNavigate('Customizer')} className="learning-ctrl-btn"><Minus size={15} /></button>
              <button type="button" onClick={() => onNavigate('Customizer')} className="learning-ctrl-btn"><Plus size={15} /></button>
              <button type="button" onClick={() => onNavigate('Customizer')} className="learning-ctrl-btn"><Maximize2 size={15} /></button>
            </div>
          </div>

          {/* Right column — Tips + Example Preview */}
          <div className="learning-detail-right">
            {/* Tips */}
            <div className="learning-tips-card">
              <div className="learning-tips-header">
                <span className="learning-tips-icon">💡</span>
                <span className="learning-tips-title">Tips</span>
              </div>
              <ul className="learning-tips-list">
                <li>
                  <CheckCircle2 size={14} className="text-emerald-500 shrink-0 mt-0.5" />
                  <span>Use high contrast colors for better visibility.</span>
                </li>
                <li>
                  <CheckCircle2 size={14} className="text-emerald-500 shrink-0 mt-0.5" />
                  <span>Keep important text within the safe zone.</span>
                </li>
                <li>
                  <CheckCircle2 size={14} className="text-emerald-500 shrink-0 mt-0.5" />
                  <span>Preview in 3D to see the final look.</span>
                </li>
              </ul>
            </div>

            {/* Example Preview */}
            <div className="learning-example-preview">
              <h5 className="learning-example-title">Example Preview</h5>
              <div className="learning-student-img-wrapper">
                <img
                  src="/assets/student-3d-preview.png"
                  alt="Student wearing lanyard preview"
                  className="learning-student-img"
                />
              </div>
            </div>
          </div>
        </div>
      </section>


    </div>
  );
}
