import { useConfiguratorStore } from '../../store/useConfiguratorStore';
import { clipTypes, accessoryOptions, widths } from '../../data/options';
import { Link2, Wrench, Ruler } from 'lucide-react';

const CLIP_EMOJIS: Record<string, string> = {
  'Metal Hook': '🪝',
  'Plastic Hook': '🔗',
  'Crocodile Clip': '🐊',
  'Ski Reel': '🎿',
};

export default function ClipHardwareView() {
  const design = useConfiguratorStore(s => s.design);
  const setField = useConfiguratorStore(s => s.setField);

  const toggleAccessory = (label: string) => {
    const current = design.accessories || [];
    const updated = current.includes(label)
      ? current.filter((a: string) => a !== label)
      : [...current, label];
    setField('accessories', updated);
  };

  return (
    <div className="flex-1 flex h-full bg-slate-50 overflow-y-auto">
      <div className="max-w-3xl mx-auto p-8 w-full">
        {/* Header */}
        <div className="mb-8">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Wrench size={20} className="text-indigo-500" />
            Clip & Hardware Configuration
          </h2>
          <p className="text-xs text-slate-400 mt-1">Select the physical hardware components for your lanyard</p>
        </div>

        {/* Clip Type */}
        <div className="mb-8">
          <h3 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
            <Link2 size={16} className="text-indigo-500" />
            Clip Type
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {clipTypes.map(clip => {
              const isActive = design.clipType === clip.label;
              return (
                <button
                  key={clip.label}
                  onClick={() => setField('clipType', clip.label)}
                  className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left ${
                    isActive
                      ? 'bg-indigo-50 border-indigo-300 ring-1 ring-indigo-200 shadow-sm'
                      : 'bg-white border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                  }`}
                >
                  <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-2xl ${
                    isActive ? 'bg-indigo-100' : 'bg-slate-100'
                  }`}>
                    {CLIP_EMOJIS[clip.label] || '🔗'}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-700">{clip.label}</span>
                      {clip.price > 0 && (
                        <span className="px-1.5 py-0.5 text-[9px] font-bold bg-emerald-100 text-emerald-700 rounded">+${clip.price}</span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">{clip.description}</p>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    isActive ? 'border-indigo-500 bg-indigo-500' : 'border-slate-300'
                  }`}>
                    {isActive && <div className="w-2 h-2 bg-white rounded-full" />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Width */}
        <div className="mb-8">
          <h3 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
            <Ruler size={16} className="text-indigo-500" />
            Strap Width
          </h3>
          <div className="grid grid-cols-4 gap-3">
            {widths.map(w => {
              const isActive = design.width === w.label;
              return (
                <button
                  key={w.label}
                  onClick={() => setField('width', w.label)}
                  className={`flex flex-col items-center p-4 rounded-xl border-2 transition-all ${
                    isActive
                      ? 'bg-indigo-50 border-indigo-300 ring-1 ring-indigo-200'
                      : 'bg-white border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {/* Visual width representation */}
                  <div className="mb-2 flex items-center justify-center h-10">
                    <div
                      className={`rounded-sm ${isActive ? 'bg-indigo-500' : 'bg-slate-300'}`}
                      style={{
                        width: `${parseInt(w.label) * 1.5}px`,
                        height: '40px',
                      }}
                    />
                  </div>
                  <span className="text-sm font-bold text-slate-700">{w.label}</span>
                  <span className="text-[10px] text-slate-400 mt-0.5 text-center">{w.description}</span>
                  {w.price > 0 && (
                    <span className="mt-1 px-2 py-0.5 text-[9px] font-bold bg-emerald-100 text-emerald-700 rounded">+${w.price}</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Accessories */}
        <div className="mb-8">
          <h3 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
            <Wrench size={16} className="text-indigo-500" />
            Accessories
          </h3>
          <div className="space-y-2">
            {accessoryOptions.map(acc => {
              const isActive = (design.accessories || []).includes(acc.label);
              return (
                <button
                  key={acc.label}
                  onClick={() => toggleAccessory(acc.label)}
                  className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left ${
                    isActive
                      ? 'bg-indigo-50 border-indigo-300'
                      : 'bg-white border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                    isActive ? 'bg-indigo-500 border-indigo-500' : 'border-slate-300'
                  }`}>
                    {isActive && (
                      <svg className="w-3 h-3 text-white" viewBox="0 0 12 12">
                        <path d="M10 3L4.5 8.5L2 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-700">{acc.label}</span>
                      <span className="px-1.5 py-0.5 text-[9px] font-bold bg-emerald-100 text-emerald-700 rounded">+${acc.price}</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">{acc.description}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Summary */}
        <div className="p-4 bg-white border border-slate-200 rounded-xl">
          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Current Selection</h4>
          <div className="flex flex-wrap gap-2">
            <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 text-[11px] font-bold rounded-full">{design.clipType}</span>
            <span className="px-2.5 py-1 bg-blue-50 text-blue-700 text-[11px] font-bold rounded-full">{design.width}</span>
            {(design.accessories || []).map((a: string) => (
              <span key={a} className="px-2.5 py-1 bg-emerald-50 text-emerald-700 text-[11px] font-bold rounded-full">{a}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
