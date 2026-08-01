import { useConfiguratorStore } from '../../store/useConfiguratorStore';
import { printingMethods, lanyardStyles, presetColors, gradientPresets } from '../../data/options';
import { Printer, Scissors, Palette, ChevronRight } from 'lucide-react';

const ICONS: Record<string, React.ReactNode> = {
  'Screen Printed': <Printer size={16} className="text-slate-500" />,
  'Woven': <Scissors size={16} className="text-slate-500" />,
  'Sublimated': <Palette size={16} className="text-indigo-500" />,
};

export default function ElementsPanel() {
  const design = useConfiguratorStore(s => s.design);
  const setField = useConfiguratorStore(s => s.setField);

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Header */}
      <div className="px-4 pt-4 pb-2">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-xs font-bold text-slate-500 tracking-wider uppercase">Elements</h3>
          <span className="text-[10px] text-slate-400 font-medium">SETUP</span>
        </div>
      </div>

      {/* Printing Method */}
      <div className="px-4 mb-4">
        <h4 className="text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-2">Printing Method</h4>
        <div className="space-y-2">
          {printingMethods.map(m => {
            const isActive = design.printingMethod === m.label;
            return (
              <button
                key={m.label}
                onClick={() => setField('printingMethod', m.label)}
                className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-all text-left ${
                  isActive
                    ? 'bg-indigo-50 border-indigo-300 ring-1 ring-indigo-200'
                    : 'bg-white border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${isActive ? 'bg-indigo-100' : 'bg-slate-100'}`}>
                  {ICONS[m.label] || <Palette size={16} />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-700">{m.label}</span>
                    {m.price > 0 && (
                      <span className="px-1.5 py-0.5 text-[9px] font-bold bg-emerald-100 text-emerald-700 rounded">+${m.price}</span>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-400 truncate">{m.description}</p>
                </div>
                {isActive && <ChevronRight size={14} className="text-indigo-500" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Lanyard Style */}
      <div className="px-4 mb-4">
        <h4 className="text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-2">Lanyard Style</h4>
        <div className="grid grid-cols-2 gap-2">
          {lanyardStyles.map(s => {
            const isActive = design.lanyardStyle === s.label;
            return (
              <button
                key={s.label}
                onClick={() => setField('lanyardStyle', s.label)}
                className={`flex flex-col items-center p-3 rounded-lg border transition-all ${
                  isActive
                    ? 'bg-indigo-50 border-indigo-300 ring-1 ring-indigo-200'
                    : 'bg-white border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="text-2xl mb-1">{s.label === 'Single Ended' ? '🪝' : '🔗'}</div>
                <span className="text-[11px] font-bold text-slate-700">{s.label}</span>
                <span className="text-[9px] text-slate-400">{s.description.substring(0, 30)}...</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Strap Solid Colors */}
      <div className="px-4 mb-4">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">Strap Solid Colors</h4>
          <span className="text-[9px] text-slate-400 font-medium">SOLID</span>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {/* White */}
          <button
            onClick={() => { setField('lanyardColor', '#ffffff'); setField('customColorCode', '#ffffff'); }}
            className={`flex flex-col items-center gap-1 p-2 rounded-lg border transition-all ${
              design.lanyardColor === '#ffffff' ? 'border-indigo-300 ring-1 ring-indigo-200 bg-indigo-50' : 'border-slate-200 hover:bg-slate-50'
            }`}
          >
            <div className="w-8 h-8 rounded-full border-2 border-slate-200" style={{ backgroundColor: '#ffffff' }} />
            <span className="text-[9px] font-semibold text-slate-500">White</span>
          </button>
          {presetColors.map(c => {
            const isActive = design.lanyardColor === c.value;
            return (
              <button
                key={c.name}
                onClick={() => { setField('lanyardColor', c.value); setField('customColorCode', c.value); }}
                className={`flex flex-col items-center gap-1 p-2 rounded-lg border transition-all ${
                  isActive ? 'border-indigo-300 ring-1 ring-indigo-200 bg-indigo-50' : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="w-8 h-8 rounded-full border border-slate-200" style={{ backgroundColor: c.value }} />
                <span className="text-[9px] font-semibold text-slate-500">{c.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Custom Solid Color */}
      <div className="px-4 mb-4">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">Custom Solid Color</h4>
          <span className="text-[9px] text-slate-400 font-mono">{design.customColorCode?.toUpperCase()}</span>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={design.customColorCode || '#1E3A8A'}
            onChange={e => { setField('lanyardColor', e.target.value); setField('customColorCode', e.target.value); }}
            className="w-10 h-10 rounded-lg border border-slate-200 cursor-pointer"
          />
          <input
            type="text"
            value={design.customColorCode || '#1E3A8A'}
            onChange={e => { setField('lanyardColor', e.target.value); setField('customColorCode', e.target.value); }}
            className="flex-1 px-3 py-2.5 text-xs font-mono border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300"
            placeholder="#1E3A8A"
          />
        </div>
      </div>

      {/* Gradient Presets */}
      <div className="px-4 mb-4 pb-4">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">Gradient Presets</h4>
          <span className="text-[9px] text-emerald-600 font-bold cursor-pointer hover:underline">3d Presets</span>
          <span className="text-[9px] text-indigo-600 font-bold cursor-pointer hover:underline">Custom</span>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {gradientPresets.map(g => {
            const isActive = design.lanyardColor === g.value;
            const colors = g.value.match(/#[a-fA-F0-9]{6}/g);
            const bg = colors && colors.length >= 2
              ? `linear-gradient(135deg, ${colors[0]}, ${colors[1]})`
              : g.value;
            return (
              <button
                key={g.name}
                onClick={() => { setField('lanyardColor', g.value); setField('customColorCode', g.value); }}
                className={`w-full aspect-square rounded-lg border-2 transition-all ${
                  isActive ? 'border-indigo-500 ring-2 ring-indigo-200 scale-105' : 'border-transparent hover:border-slate-300'
                }`}
                style={{ background: bg }}
                title={g.name}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
