import { useState } from 'react';
import LanyardStage from '../customizer/LanyardStage';
import { Ruler, ZoomIn, ZoomOut, RotateCcw, Sparkles } from 'lucide-react';

export default function FlatLayoutView() {
  const [zoom, setZoom] = useState(1);

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-100 overflow-hidden">
      {/* Top Professional Toolbar */}
      <div className="shrink-0 flex flex-wrap items-center justify-between gap-3 px-6 py-3 bg-white border-b border-slate-200 shadow-sm z-10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-200">
            <Ruler className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-extrabold text-slate-900 tracking-tight">20 mm Adult Lanyard Flat Editor</h2>
              <span className="px-2.5 py-0.5 text-[10px] font-bold bg-indigo-100 text-indigo-700 rounded-full border border-indigo-200">
                20 mm Finish • 23.1 mm Bleed
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium">
              38 Inches Total Length • Left Ext (2") • Left Side (14") • Neck (4") • Right Side Flipped (14") • Right Ext (4")
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Zoom Controls */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
            <button
              onClick={() => setZoom(z => Math.max(0.5, parseFloat((z - 0.1).toFixed(2))))}
              className="p-1 text-slate-600 hover:text-slate-900 hover:bg-white rounded transition-colors"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="px-1.5 text-[11px] font-bold text-slate-700 min-w-[42px] text-center">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={() => setZoom(z => Math.min(3, parseFloat((z + 0.1).toFixed(2))))}
              className="p-1 text-slate-600 hover:text-slate-900 hover:bg-white rounded transition-colors"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setZoom(1)}
              className="p-1 text-slate-500 hover:text-slate-900 hover:bg-white rounded transition-colors"
              title="Reset Zoom"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Info Callout Bar */}
      <div className="shrink-0 mx-6 mt-3 px-4 py-2 bg-slate-900 text-white rounded-xl shadow-sm flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
          <span>
            <strong>Safe Content Area Active:</strong> Text & logos remain inside Main Content Starting Points. Extensions (Left 2" & Right 4") contain background color/pattern design only.
          </span>
        </div>
        <div className="flex items-center gap-4 text-[11px] text-slate-300 font-medium">
          <span>Logo Max: <strong className="text-white">14 mm</strong></span>
          <span>Name Max: <strong className="text-white">12 mm</strong> (Min 8 mm)</span>
        </div>
      </div>

      {/* Main Flat Stage Area */}
      <div className="flex-1 flex items-center justify-center p-4 relative overflow-auto">
        <LanyardStage isFlatMode={true} currentStep={2} zoom={zoom} />
      </div>
    </div>
  );
}

