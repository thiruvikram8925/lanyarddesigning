import { useState } from 'react';
import { useConfiguratorStore } from '../../store/useConfiguratorStore';
import LanyardStage from '../customizer/LanyardStage';
import { 
  Ruler, Eye, Download, Save, ZoomIn, ZoomOut, RotateCcw, 
  Sparkles, Layers, ShieldAlert, CheckCircle2, Type, Image as ImageIcon
} from 'lucide-react';
import { toast } from 'sonner';

export default function FlatLayoutView() {
  const design = useConfiguratorStore(s => s.design);
  const setField = useConfiguratorStore(s => s.setField);
  const [zoom, setZoom] = useState(1);
  const widthMm = (design.width as string) || '20mm';
  const showBleed = design.showBleed !== false;

  const handleToggleBleed = () => {
    setField('showBleed', !showBleed);
    toast.info(!showBleed ? 'Bleed guides enabled (23.1 mm)' : 'Bleed guides hidden');
  };

  const handleExportFlatDesign = () => {
    const stageCanvas = document.querySelector('.konvajs-content canvas') as HTMLCanvasElement;
    if (stageCanvas) {
      const dataUrl = stageCanvas.toDataURL('image/png', 1.0);
      const link = document.createElement('a');
      link.download = `20mm_Lanyard_Flat_Design_Template_${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
      toast.success('Flat design template exported successfully!');
    } else {
      toast.error('Unable to capture canvas for export.');
    }
  };

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
          {/* Zoom Preset Controls */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
            <button
              onClick={() => setZoom(1)}
              className={`px-2 py-1 text-[11px] font-bold rounded transition-all ${
                zoom === 1 ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600 hover:bg-white/60'
              }`}
              title="Center Fit View"
            >
              Fit Center
            </button>
            <button
              onClick={() => setZoom(1.4)}
              className={`px-2 py-1 text-[11px] font-bold rounded transition-all ${
                zoom === 1.4 ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600 hover:bg-white/60'
              }`}
              title="Zoom to See Details"
            >
              High Detail (140%)
            </button>
            <div className="w-[1px] h-3.5 bg-slate-300 mx-0.5" />
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

          {/* Bleed Toggle */}
          <button
            onClick={handleToggleBleed}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
              showBleed 
                ? 'bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100' 
                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
            <span>{showBleed ? 'Bleed Guides On (23.1mm)' : 'Show Bleed Guides'}</span>
          </button>

          {/* Export Flat Design */}
          <button
            onClick={handleExportFlatDesign}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-sm transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Flat Template</span>
          </button>
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

