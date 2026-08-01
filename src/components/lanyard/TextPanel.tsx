import { useState } from 'react';
import { useConfiguratorStore } from '../../store/useConfiguratorStore';
import { fonts } from '../../data/options';
import { Plus, Type as TypeIcon, CaseSensitive } from 'lucide-react';

const TEXT_COLORS = [
  '#ffffff', '#fde68a', '#d1d5db', '#94a3b8',
  '#f87171', '#fb923c', '#a78bfa', '#22d3ee',
  '#111827',
];

export default function TextPanel() {
  const design = useConfiguratorStore(s => s.design);
  const setField = useConfiguratorStore(s => s.setField);
  const [activeBox, setActiveBox] = useState(0);
  const [isUppercase, setIsUppercase] = useState(false);

  const textBoxes = [
    { label: 'Box 1', field: 'customTextLeft' as const, value: design.customTextLeft },
  ];

  const [extraBoxes, setExtraBoxes] = useState<{ label: string; field: string; value: string }[]>([]);

  const allBoxes = [...textBoxes, ...extraBoxes];
  const currentBox = allBoxes[activeBox] || allBoxes[0];

  const handleTextChange = (val: string) => {
    const finalVal = isUppercase ? val.toUpperCase() : val;
    if (activeBox === 0) {
      setField('customTextLeft', finalVal);
    } else {
      const updated = [...extraBoxes];
      updated[activeBox - 1] = { ...updated[activeBox - 1], value: finalVal };
      setExtraBoxes(updated);
      // Also push to center/right text fields
      if (activeBox === 1) setField('customTextCenter', finalVal);
      if (activeBox === 2) setField('customTextRight', finalVal);
    }
  };

  const addTextBox = () => {
    const idx = extraBoxes.length + 2;
    setExtraBoxes([...extraBoxes, { label: `Box ${idx}`, field: `custom_${idx}`, value: '' }]);
    setActiveBox(allBoxes.length);
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Header */}
      <div className="px-4 pt-4 pb-2">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-xs font-bold text-slate-500 tracking-wider uppercase">Text</h3>
          <span className="text-[10px] text-slate-400 font-medium">EDITOR</span>
        </div>
      </div>

      {/* Text Boxes Selector */}
      <div className="px-4 mb-3">
        <h4 className="text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-2">Separate Text Boxes</h4>
        <div className="flex items-center gap-2 flex-wrap">
          {allBoxes.map((box, i) => (
            <button
              key={i}
              onClick={() => setActiveBox(i)}
              className={`px-3 py-1.5 text-[11px] font-bold rounded-lg border transition-all ${
                activeBox === i
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {box.label}
            </button>
          ))}
          <button
            onClick={addTextBox}
            className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-indigo-600 border border-dashed border-slate-300 hover:border-indigo-300 rounded-lg transition-all"
          >
            <Plus size={14} />
          </button>
        </div>
      </div>

      {/* Active Box Text */}
      <div className="px-4 mb-3">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">Active Box Text</h4>
          <button
            onClick={() => setIsUppercase(!isUppercase)}
            className={`flex items-center gap-1 px-2 py-1 text-[10px] font-bold rounded transition-all ${
              isUppercase ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
            }`}
          >
            <CaseSensitive size={12} />
            TT UPPERCASE
          </button>
        </div>
        <div className="mb-1">
          <label className="text-[10px] text-slate-400 font-medium">LINE 1</label>
        </div>
        <input
          type="text"
          placeholder="COMPANY NAME"
          value={currentBox?.value || ''}
          onChange={e => handleTextChange(e.target.value)}
          className="w-full px-3 py-2.5 text-sm font-semibold border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300"
        />
      </div>

      {/* Add New Text Line */}
      <div className="px-4 mb-4">
        <button
          onClick={addTextBox}
          className="w-full flex items-center justify-center gap-2 py-2.5 border-2 border-dashed border-slate-200 hover:border-indigo-300 rounded-lg text-xs font-bold text-slate-400 hover:text-indigo-500 transition-all"
        >
          <Plus size={14} />
          Add New Text Line
        </button>
        <p className="text-[10px] text-slate-400 mt-1.5 leading-relaxed">
          Updates real-time on the 2D & 3D lanyard strap canvas. Drag text directly on canvas to reposition.
        </p>
      </div>

      {/* Text Pattern Placement */}
      <div className="px-4 mb-4">
        <h4 className="text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-2">Text Pattern Placement</h4>
        <div className="flex bg-slate-100 rounded-lg p-1">
          <button
            onClick={() => setField('lanyardDesignStyle', 'repeated')}
            className={`flex-1 py-2 text-[11px] font-bold rounded-md transition-all ${
              design.lanyardDesignStyle === 'repeated' ? 'bg-indigo-600 text-white shadow' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Repeated Loop
          </button>
          <button
            onClick={() => setField('lanyardDesignStyle', 'centered')}
            className={`flex-1 py-2 text-[11px] font-bold rounded-md transition-all ${
              design.lanyardDesignStyle === 'centered' ? 'bg-indigo-600 text-white shadow' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Single Center
          </button>
        </div>
      </div>

      {/* Text Repeat Spacing */}
      <div className="px-4 mb-4">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">Text Repeat Spacing</h4>
          <div className="flex gap-2 text-[9px] text-slate-400 font-medium">
            <span>Min</span>
            <span>Max</span>
          </div>
        </div>
        <input
          type="range"
          min={10}
          max={200}
          value={design.textSpacing}
          onChange={e => setField('textSpacing', Number(e.target.value))}
          className="w-full h-1.5 bg-slate-200 rounded-full appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-indigo-600 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer"
        />
      </div>

      {/* Font Size */}
      <div className="px-4 mb-4">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider">Font Size</h4>
          <span className="text-[11px] font-bold text-indigo-600">{design.fontSize}px</span>
        </div>
        <input
          type="range"
          min={8}
          max={72}
          value={design.fontSize}
          onChange={e => setField('fontSize', Number(e.target.value))}
          className="w-full h-1.5 bg-slate-200 rounded-full appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-indigo-600 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer"
        />
      </div>

      {/* Letter Spacing */}
      <div className="px-4 mb-4">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">Letter Spacing</h4>
          <span className="text-[11px] font-bold text-slate-500">{design.textAngle || 0}px</span>
        </div>
        <input
          type="range"
          min={-5}
          max={30}
          value={design.textAngle || 0}
          onChange={e => setField('textAngle', Number(e.target.value))}
          className="w-full h-1.5 bg-slate-200 rounded-full appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-indigo-600 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer"
        />
      </div>

      {/* Font Family */}
      <div className="px-4 mb-4">
        <h4 className="text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-2">Font Family</h4>
        <select
          value={design.fontFamily}
          onChange={e => setField('fontFamily', e.target.value)}
          className="w-full px-3 py-2.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300"
        >
          {fonts.map(f => (
            <option key={f} value={f}>{f}</option>
          ))}
        </select>
      </div>

      {/* Text Fill Color */}
      <div className="px-4 mb-4">
        <h4 className="text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-2">Text Fill Color</h4>
        <div className="flex gap-2 flex-wrap">
          {TEXT_COLORS.map(color => (
            <button
              key={color}
              onClick={() => setField('fontColor', color)}
              className={`w-8 h-8 rounded-full border-2 transition-all ${
                design.fontColor === color ? 'border-indigo-500 ring-2 ring-indigo-200 scale-110' : 'border-slate-200 hover:scale-105'
              }`}
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
      </div>

      {/* Text Effects */}
      <div className="px-4 mb-4 pb-4">
        <h4 className="text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-1">
          ✨ Text Effects (Outline & 3D Depth)
        </h4>
        <div className="space-y-3">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] text-slate-500 font-medium">Stroke Outline Width</span>
              <span className="text-[10px] text-slate-400 font-medium">0%</span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              defaultValue={0}
              className="w-full h-1.5 bg-slate-200 rounded-full appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-slate-500 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer"
            />
            <div className="flex items-center gap-2 mt-1">
              <div className="w-4 h-4 bg-slate-200 rounded" />
              <div className="flex-1 h-1.5 bg-slate-100 rounded" />
              <div className="w-4 h-4 bg-slate-800 rounded" />
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] text-slate-500 font-medium">3D Fabric Shadow Blur</span>
              <span className="text-[10px] text-slate-400 font-medium">0%</span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              defaultValue={0}
              className="w-full h-1.5 bg-slate-200 rounded-full appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-slate-500 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
