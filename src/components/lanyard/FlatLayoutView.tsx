import { useConfiguratorStore } from '../../store/useConfiguratorStore';
import { presetColors } from '../../data/options';
import LanyardStage from '../customizer/LanyardStage';

function isGrad(c: unknown) { return typeof c === 'string' && (c as string).includes('gradient'); }

function getGradientStyle(color: string): React.CSSProperties {
  if (isGrad(color)) {
    const colors = color.match(/#[a-fA-F0-9]{6}/g);
    if (colors && colors.length >= 2) {
      return { background: `linear-gradient(180deg, ${colors[0]}, ${colors[1]})` };
    }
  }
  return { backgroundColor: color || '#1e3a8a' };
}

function getContrastColor(hex: string): string {
  if (isGrad(hex)) {
    const m = hex.match(/#[a-fA-F0-9]{6}/g);
    hex = m ? m[0] : '#000';
  }
  const c = (hex || '#000').replace('#', '');
  if (c.length !== 6) return '#ffffff';
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? '#111827' : '#ffffff';
}

export default function FlatLayoutView() {
  const design = useConfiguratorStore(s => s.design);
  const strapColor = design.lanyardColor || '#1e3a8a';
  const textColor = design.fontColor || getContrastColor(strapColor);
  const text = design.customTextLeft || design.predefinedWord || 'COMPANY NAME';
  const isRepeated = design.lanyardDesignStyle === 'repeated';
  const fontSize = Math.min(design.fontSize || 18, 24);

  const strapStyle = getGradientStyle(strapColor);

  const repeatedText = isRepeated
    ? Array(6).fill(text).join('  •  ')
    : text;

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50">
      {/* Top Bar */}
      <div className="shrink-0 flex items-center gap-4 px-6 py-3 bg-white border-b border-slate-200">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded bg-indigo-100 flex items-center justify-center">
            <span className="text-[10px] font-bold text-indigo-600">📐</span>
          </div>
          <span className="text-xs font-bold text-slate-700">Flat Print Layout</span>
        </div>
        <button className="text-[11px] font-bold text-indigo-600 hover:underline">Actual Print Preview</button>
        <div className="flex-1" />
        <span className="text-[10px] text-slate-400">Front: left · Back: mirror (right)</span>
      </div>

      {/* Info Banner */}
      <div className="shrink-0 mx-6 mt-4 px-4 py-2 bg-emerald-50 border border-emerald-200 rounded-lg">
        <p className="text-[11px] text-emerald-700 font-medium text-center">
          ◆ Drag the dashed selection on Front to reposition text → updates live in 2D
        </p>
      </div>

      {/* Flat Straps */}
      <div className="flex-1 flex items-center justify-center p-8 relative">
        <LanyardStage isFlatMode={true} currentStep={2} />
        
        {/* Labels Overlay */}
        <div className="absolute inset-x-0 bottom-12 flex justify-center gap-16 pointer-events-none">
          <div className="text-center w-[90px] -translate-x-[45px]">
            <p className="text-xs font-bold text-slate-700">FRONT</p>
            <p className="text-[10px] text-slate-400">Left Strap</p>
          </div>
          <div className="text-center w-[90px] translate-x-[35px]">
            <p className="text-xs font-bold text-slate-700">BACK</p>
            <p className="text-[10px] text-slate-400">Right Strap</p>
          </div>
        </div>
      </div>
    </div>
  );
}
