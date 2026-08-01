import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Save, Undo2, Redo2, ZoomIn, ZoomOut,
  Eye, Download, MoreHorizontal, ChevronDown, CheckCircle2,
  Loader2, Monitor, Smartphone, Maximize2, Share2
} from 'lucide-react';

const SAVE_STATES = {
  saved: { icon: CheckCircle2, label: 'All changes saved', color: 'text-emerald-500' },
  saving: { icon: Loader2, label: 'Saving…', color: 'text-slate-400', spin: true },
  unsaved: { icon: null, label: 'Unsaved changes', color: 'text-amber-500' },
};

export default function EditorTopBar({
  project,
  onSave,
  onPreview,
  onExport,
  zoom,
  setZoom,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  saveState = 'saved',
  isSaving = false,
  onOrder,
}) {
  const navigate = useNavigate();
  const [nameEditing, setNameEditing] = useState(false);
  const [nameValue, setNameValue] = useState(project?.name || 'Untitled Project');
  const [exportOpen, setExportOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const nameRef = useRef(null);
  const exportRef = useRef(null);

  useEffect(() => {
    if (nameEditing && nameRef.current) nameRef.current.select();
  }, [nameEditing]);

  useEffect(() => {
    setNameValue(project?.name || 'Untitled Project');
  }, [project?.name]);

  useEffect(() => {
    const handler = (e) => {
      if (exportRef.current && !exportRef.current.contains(e.target)) {
        setExportOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleNameBlur = () => {
    setNameEditing(false);
    if (nameValue.trim() && nameValue !== project?.name) {
      // bubble up name change
      onSave?.({ name: nameValue.trim() });
    }
  };

  const currentSave = isSaving ? SAVE_STATES.saving : SAVE_STATES[saveState] || SAVE_STATES.saved;
  const SaveIcon = currentSave.icon;

  const ZOOM_LEVELS = [25, 50, 75, 100, 125, 150, 200];

  return (
    <div className="editor-topbar h-12 bg-white border-b border-slate-200 flex items-center gap-1 px-3 shrink-0 z-50 relative select-none">
      
      {/* ← Back */}
      <button
        onClick={() => navigate('/dashboard')}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-all text-[12px] font-medium shrink-0"
        title="Back to Dashboard"
      >
        <ArrowLeft size={14} />
        <span className="hidden sm:inline">Dashboard</span>
      </button>

      <div className="w-px h-5 bg-slate-200 mx-1 shrink-0" />

      {/* Project Name — inline editable */}
      <div className="flex items-center gap-1.5 min-w-0 flex-1 max-w-[240px]">
        {nameEditing ? (
          <input
            ref={nameRef}
            value={nameValue}
            onChange={e => setNameValue(e.target.value)}
            onBlur={handleNameBlur}
            onKeyDown={e => { if (e.key === 'Enter') handleNameBlur(); if (e.key === 'Escape') { setNameValue(project?.name || ''); setNameEditing(false); } }}
            className="text-[13px] font-semibold text-slate-900 bg-slate-100 border border-indigo-400 rounded-md px-2 py-0.5 outline-none w-full min-w-0"
            maxLength={60}
          />
        ) : (
          <button
            onClick={() => setNameEditing(true)}
            className="text-[13px] font-semibold text-slate-900 hover:text-indigo-600 hover:bg-slate-100 px-2 py-0.5 rounded-md transition-colors truncate max-w-full"
            title="Click to rename"
          >
            {nameValue}
          </button>
        )}
      </div>

      {/* Save status */}
      <div className={`hidden sm:flex items-center gap-1 text-[11px] font-medium shrink-0 ${currentSave.color}`}>
        {SaveIcon && <SaveIcon size={12} className={currentSave.spin ? 'animate-spin' : ''} />}
        <span>{currentSave.label}</span>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Undo / Redo */}
      <div className="flex items-center gap-0.5">
        <button
          onClick={onUndo}
          disabled={!canUndo}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          title="Undo (⌘Z)"
        >
          <Undo2 size={14} />
        </button>
        <button
          onClick={onRedo}
          disabled={!canRedo}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          title="Redo (⌘⇧Z)"
        >
          <Redo2 size={14} />
        </button>
      </div>

      <div className="w-px h-5 bg-slate-200 mx-1 shrink-0" />

      {/* Zoom control */}
      <div className="relative" ref={null}>
        <button
          onClick={() => setViewOpen(v => !v)}
          className="flex items-center gap-1 px-2 py-1 rounded-lg text-[12px] font-mono font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-all"
        >
          {Math.round((zoom || 1) * 100)}%
          <ChevronDown size={11} className="text-slate-400" />
        </button>
        {viewOpen && (
          <div className="absolute top-full right-0 mt-1 w-32 bg-white border border-slate-200 rounded-xl shadow-lg py-1 z-50">
            {ZOOM_LEVELS.map(z => (
              <button
                key={z}
                onClick={() => { setZoom?.(z / 100); setViewOpen(false); }}
                className={`w-full text-left px-3 py-1.5 text-[12px] font-mono transition-colors ${
                  Math.round((zoom || 1) * 100) === z ? 'text-indigo-600 font-semibold bg-indigo-50' : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                {z}%
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="w-px h-5 bg-slate-200 mx-1 shrink-0 hidden sm:block" />

      {/* Save */}
      <button
        onClick={() => onSave?.()}
        className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-all"
        title="Save (⌘S)"
      >
        <Save size={13} />
        <span>Save</span>
      </button>

      {/* Preview */}
      <button
        onClick={onPreview}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-all"
        title="Preview"
      >
        <Eye size={13} />
        <span className="hidden sm:inline">Preview</span>
      </button>

      {/* Export dropdown */}
      <div className="relative" ref={exportRef}>
        <button
          onClick={() => setExportOpen(v => !v)}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[12px] font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-all"
        >
          <Download size={13} />
          <span>Export</span>
          <ChevronDown size={11} className="text-slate-400" />
        </button>
        {exportOpen && (
          <div className="absolute right-0 top-full mt-1.5 w-52 bg-white border border-slate-200 rounded-xl shadow-xl py-1.5 z-50">
            <div className="px-3 py-1 mb-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Export As</p>
            </div>
            {[
              { label: 'PNG (High-Res)', icon: Image, sub: 'For digital use' },
              { label: 'PDF (Print-Ready)', icon: FileText, sub: '300 DPI, CMYK + bleed', highlight: true },
              { label: 'SVG', icon: Maximize2, sub: 'Vector format' },
            ].map(({ label, sub, highlight }) => (
              <button
                key={label}
                onClick={() => { setExportOpen(false); onExport?.(label); }}
                className={`w-full flex items-start gap-2.5 px-3 py-2 hover:bg-slate-50 transition-colors text-left ${highlight ? 'bg-indigo-50/50' : ''}`}
              >
                <div className="min-w-0">
                  <p className={`text-[12px] font-semibold ${highlight ? 'text-indigo-700' : 'text-slate-800'}`}>{label}</p>
                  <p className="text-[10px] text-slate-400">{sub}</p>
                </div>
                {highlight && <span className="ml-auto text-[9px] font-bold bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded-full uppercase shrink-0">Best</span>}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Order & Print button replacing main Export */}
      <button
        onClick={() => { if (onOrder) onOrder(); else navigate('/export'); }}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[12px] font-semibold transition-all shadow-sm"
      >
        <Package size={13} className="text-white" />
        <span>Order & Print</span>
      </button>
    </div>
  );
}

// Needed imports used inside JSX above
function Image(props) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={props.size || 16} height={props.size || 16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect width="18" height="18" x="3" y="3" rx="2" ry="2"/>
      <circle cx="9" cy="9" r="2"/>
      <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
    </svg>
  );
}

function FileText(props) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={props.size || 16} height={props.size || 16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/>
      <path d="M14 2v4a2 2 0 0 0 2 2h4"/>
      <path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/>
    </svg>
  );
}

function Package(props) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={props.size || 16} height={props.size || 16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M11 21.73a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73z"/>
      <path d="M12 22V12"/><path d="m3.3 7 7.703 4.734a2 2 0 0 0 1.994 0L20.7 7"/>
      <path d="m7.5 4.27 9 5.15"/>
    </svg>
  );
}
