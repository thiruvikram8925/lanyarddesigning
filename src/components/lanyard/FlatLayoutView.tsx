import { useState } from 'react';
import LanyardStage from '../customizer/LanyardStage';
import { Ruler, ZoomIn, ZoomOut, RotateCcw, ChevronDown } from 'lucide-react';
import { useConfiguratorStore } from '../../store/useConfiguratorStore';

const WIDTH_OPTIONS = [38, 36, 34, 32, 30, 28] as const;

export default function FlatLayoutView() {
  const [zoom, setZoom] = useState(1);
  const design = useConfiguratorStore((s) => s.design);
  const setField = useConfiguratorStore((s) => s.setField);
  const selectedWidth = design.flatLength || 38;

  const handleWidthChange = (val: number) => {
    setField('flatLength', val);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-100 overflow-hidden">
      {/* Top Professional Toolbar */}
      <div className="shrink-0 flex flex-wrap items-center justify-between gap-3 px-6 py-3 bg-white border-b border-slate-200 shadow-sm z-10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-200">
            <Ruler className="w-5 h-5" />
          </div>
          <div className="flex items-center gap-2">
            <label htmlFor="flat-width-select" className="text-xs font-bold text-slate-700">
              Width:
            </label>
            <div className="relative">
              <select
                id="flat-width-select"
                value={selectedWidth}
                onChange={(e) => handleWidthChange(Number(e.target.value))}
                className="appearance-none bg-slate-50 hover:bg-slate-100 border border-slate-300 hover:border-slate-400 text-slate-900 text-xs font-bold rounded-lg pl-3 pr-8 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer transition-all"
              >
                {WIDTH_OPTIONS.map((w) => (
                  <option key={w} value={w}>
                    {w}”
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
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


      {/* Main Flat Stage Area */}
      <div className="flex-1 flex items-center justify-center p-4 relative overflow-auto">
        <LanyardStage isFlatMode={true} currentStep={2} zoom={zoom} flatLength={selectedWidth} />
      </div>
    </div>
  );
}

