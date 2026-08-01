import { useConfiguratorStore } from '../../store/useConfiguratorStore';
import { presetColors } from '../../data/options';

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
      <div className="flex-1 flex items-center justify-center gap-12 p-8">
        {/* Front Strap */}
        <div className="flex flex-col items-center">
          <div
            className="relative rounded-lg shadow-lg overflow-hidden"
            style={{
              width: 90,
              height: 420,
              ...strapStyle,
            }}
          >
            {/* Dashed selection overlay */}
            <div className="absolute inset-2 border-2 border-dashed border-white/40 rounded pointer-events-none" />
            
            {/* Stitching edges */}
            <div className="absolute inset-0 border-l-2 border-r-2 border-white/10 pointer-events-none" />

            {/* Text */}
            <div
              className="absolute inset-0 flex items-center justify-center"
              style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}
            >
              <span
                className="font-bold whitespace-nowrap overflow-hidden"
                style={{
                  color: textColor,
                  fontSize: `${fontSize}px`,
                  fontFamily: design.fontFamily || 'Montserrat',
                  letterSpacing: `${design.textAngle || 0}px`,
                  transform: 'rotate(180deg)',
                  maxHeight: '400px',
                }}
              >
                {repeatedText}
              </span>
            </div>
          </div>
          <div className="mt-3 text-center">
            <p className="text-xs font-bold text-slate-700">FRONT</p>
            <p className="text-[10px] text-slate-400">Design transparency</p>
          </div>
        </div>

        {/* Back Strap */}
        <div className="flex flex-col items-center">
          <div
            className="relative rounded-lg shadow-lg overflow-hidden"
            style={{
              width: 90,
              height: 420,
              ...strapStyle,
            }}
          >
            {/* Stitching edges */}
            <div className="absolute inset-0 border-l-2 border-r-2 border-white/10 pointer-events-none" />

            {/* Text (mirrored) */}
            <div
              className="absolute inset-0 flex items-center justify-center"
              style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}
            >
              <span
                className="font-bold whitespace-nowrap overflow-hidden"
                style={{
                  color: textColor,
                  fontSize: `${fontSize}px`,
                  fontFamily: design.fontFamily || 'Montserrat',
                  letterSpacing: `${design.textAngle || 0}px`,
                  maxHeight: '400px',
                }}
              >
                {repeatedText}
              </span>
            </div>
          </div>
          <div className="mt-3 text-center">
            <p className="text-xs font-bold text-slate-700">BACK</p>
            <p className="text-[10px] text-slate-400">Auto-mirrored</p>
          </div>
        </div>
      </div>
    </div>
  );
}
