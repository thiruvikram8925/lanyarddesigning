import { useConfiguratorStore } from '../../store/useConfiguratorStore';
import {
  Bold, Italic, AlignLeft, AlignCenter, AlignRight,
  Minus, Plus, RotateCw, Palette, Type, X, ChevronDown
} from 'lucide-react';
import { useState } from 'react';
import { presetColors, gradientPresets } from '../../data/options';

const ZONE_LABELS = { left: 'Left Strap', center: 'Center', right: 'Right Strap' };
const ZONE_TEXT_FIELDS = { left: 'customTextLeft', right: 'customTextRight', center: 'customTextCenter' };

const FONT_FAMILIES = [
  'Montserrat', 'Roboto', 'Open Sans', 'Inter', 'Arial',
  'Lato', 'Poppins', 'Oswald', 'Raleway', 'Ubuntu', 'Bebas Neue',
];

const QUICK_COLORS = [
  '#ffffff', '#000000', '#1e3a8a', '#dc2626',
  '#059669', '#d97706', '#7c3aed', '#0ea5e9',
];

export default function CanvasEditingToolbar({ selectedZone, onZoneSelect, onClose }) {
  const design = useConfiguratorStore(s => s.design);
  const setField = useConfiguratorStore(s => s.setField);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showFontPicker, setShowFontPicker] = useState(false);
  const [showStrapColor, setShowStrapColor] = useState(false);

  if (!selectedZone) return null;

  const textField = ZONE_TEXT_FIELDS[selectedZone];
  const currentText = design[textField] || '';
  const currentFontSize = design.fontSize || 16;
  const currentFontColor = design.fontColor || design.textColor || '#000000';
  const currentFontFamily = design.fontFamily || 'Montserrat';
  const currentFontWeight = design.fontWeight || 'bold';
  const currentLetterSpacing = design.letterSpacing || 0;
  const currentTextAlign = design.textAlign || 'center';
  const currentLanyardColor = design.lanyardColor || '#ffffff';
  const currentTextAngle = design.textAngle || 0;
  const currentShadow = design.textShadowBlur || 0;
  const currentStrokeW = design.textStrokeWidth || 0;
  const currentStrokeColor = design.textStrokeColor || '#000000';

  const set = (field, value) => setField(field, value);
  const closeAllPickers = () => { setShowColorPicker(false); setShowFontPicker(false); setShowStrapColor(false); };

  return (
    <div
      className="absolute top-2 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-1 pointer-events-auto"
      onPointerDown={e => e.stopPropagation()}
    >
      <div className="flex items-center gap-1">
        {['left', 'center', 'right'].map(z => (
          <button
            key={z}
            onClick={() => { closeAllPickers(); onZoneSelect(z); }}
            className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all shadow-sm ${
              selectedZone === z
                ? 'bg-indigo-600 text-white shadow-indigo-500/40 shadow-md'
                : 'bg-slate-900/80 text-slate-300 hover:bg-slate-700 backdrop-blur-sm border border-white/10'
            }`}
          >
            {ZONE_LABELS[z]}
          </button>
        ))}
        <button onClick={onClose} className="ml-1 w-6 h-6 rounded-full bg-slate-900/70 text-slate-400 hover:text-white hover:bg-rose-600 flex items-center justify-center transition-all backdrop-blur-sm border border-white/10"><X size={10} /></button>
      </div>

      <div className="flex items-center gap-1 px-3 py-2 bg-slate-950/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl">
        <div className="flex items-center gap-1 pr-2 border-r border-white/10">
          <Type size={11} className="text-indigo-400 shrink-0" />
          <input type="text" value={currentText} onChange={e => set(textField, e.target.value)} placeholder={ZONE_LABELS[selectedZone] + '…'} className="bg-transparent text-white text-[11px] font-medium outline-none placeholder-slate-600 w-28" />
        </div>

        <div className="relative pr-2 border-r border-white/10">
          <button onClick={() => { setShowFontPicker(v => !v); setShowColorPicker(false); setShowStrapColor(false); }} className="flex items-center gap-1 px-1.5 py-1 rounded-lg text-[10px] text-slate-300 hover:bg-white/10 transition-all">
            <span style={{ fontFamily: currentFontFamily }} className="max-w-[58px] truncate">{currentFontFamily}</span>
            <ChevronDown size={9} />
          </button>
          {showFontPicker && (
            <div className="absolute top-full mt-1 left-0 bg-slate-900 border border-white/10 rounded-xl shadow-2xl p-1.5 z-[200] w-40 max-h-48 overflow-y-auto">
              {FONT_FAMILIES.map(f => (
                <button key={f} onClick={() => { set('fontFamily', f); setShowFontPicker(false); }} className={'w-full text-left px-2.5 py-1.5 rounded-lg text-[11px] transition-all ' + (currentFontFamily === f ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-white/10')} style={{ fontFamily: f }}>{f}</button>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-0.5 pr-2 border-r border-white/10">
          <button onClick={() => set('fontSize', Math.max(6, currentFontSize - 1))} className="w-5 h-5 rounded text-slate-400 hover:text-white hover:bg-white/10 flex items-center justify-center"><Minus size={9} /></button>
          <input type="number" value={currentFontSize} min={6} max={120} onChange={e => set('fontSize', Number(e.target.value))} className="w-8 text-center text-white text-[11px] font-mono bg-transparent outline-none" />
          <button onClick={() => set('fontSize', Math.min(120, currentFontSize + 1))} className="w-5 h-5 rounded text-slate-400 hover:text-white hover:bg-white/10 flex items-center justify-center"><Plus size={9} /></button>
        </div>

        <div className="flex items-center gap-0.5 pr-2 border-r border-white/10">
          <button onClick={() => set('fontWeight', currentFontWeight === 'bold' ? 'normal' : 'bold')} className={'w-6 h-6 rounded flex items-center justify-center transition-all ' + (currentFontWeight === 'bold' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white hover:bg-white/10')}><Bold size={11} /></button>
          <button onClick={() => set('fontStyle', design.fontStyle === 'italic' ? 'normal' : 'italic')} className={'w-6 h-6 rounded flex items-center justify-center transition-all ' + (design.fontStyle === 'italic' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white hover:bg-white/10')}><Italic size={11} /></button>
        </div>

        <div className="flex items-center gap-0.5 pr-2 border-r border-white/10">
          {[{icon: AlignLeft, a:'left'},{icon: AlignCenter, a:'center'},{icon: AlignRight, a:'right'}].map(({icon: Icon, a}) => (
            <button key={a} onClick={() => set('textAlign', a)} className={'w-6 h-6 rounded flex items-center justify-center transition-all ' + (currentTextAlign === a ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white hover:bg-white/10')}><Icon size={11} /></button>
          ))}
        </div>

        <div className="flex items-center gap-1 pr-2 border-r border-white/10">
          <span className="text-[8px] text-slate-500 uppercase font-bold">Spc</span>
          <input type="range" min={-5} max={30} step={0.5} value={currentLetterSpacing} onChange={e => set('letterSpacing', Number(e.target.value))} className="w-14 h-1 accent-indigo-500 cursor-pointer" />
          <span className="text-[9px] text-slate-400 font-mono w-5">{currentLetterSpacing}</span>
        </div>

        <div className="relative pr-2 border-r border-white/10">
          <button onClick={() => { setShowColorPicker(v => !v); setShowStrapColor(false); setShowFontPicker(false); }} className="flex items-center gap-1.5 px-1.5 py-1 rounded-lg hover:bg-white/10 transition-all" title="Text Color">
            <div className="w-4 h-4 rounded-full border border-white/20" style={{ background: currentFontColor }} />
            <Type size={10} className="text-slate-400" />
          </button>
          {showColorPicker && (
            <div className="absolute top-full mt-1 left-0 bg-slate-900 border border-white/10 rounded-xl shadow-2xl p-2.5 z-[200] w-52">
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-2">Text Color</p>
              <div className="grid grid-cols-8 gap-1 mb-2">
                {QUICK_COLORS.map(c => (<button key={c} onClick={() => { set('fontColor', c); set('textColor', c); }} className={'w-5 h-5 rounded-full border-2 transition-all hover:scale-110 ' + (currentFontColor === c ? 'border-indigo-400' : 'border-transparent')} style={{ background: c }} />))}
              </div>
              <div className="flex items-center gap-2 mb-2">
                <input type="color" value={currentFontColor.startsWith('#') ? currentFontColor : '#000000'} onChange={e => { set('fontColor', e.target.value); set('textColor', e.target.value); }} className="w-8 h-8 rounded-lg cursor-pointer p-0.5 border border-white/10" />
                <input type="text" value={currentFontColor} onChange={e => { if (/^#[0-9a-fA-F]{0,6}$/.test(e.target.value)) { set('fontColor', e.target.value); set('textColor', e.target.value); } }} className="flex-1 text-[10px] font-mono text-slate-300 bg-slate-800 border border-white/10 rounded-lg px-2 py-1 outline-none" />
              </div>
              <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-2 mb-1">Stroke</p>
              <div className="flex items-center gap-2 mb-1">
                <input type="color" value={currentStrokeColor.startsWith('#') ? currentStrokeColor : '#000000'} onChange={e => set('textStrokeColor', e.target.value)} className="w-6 h-6 rounded cursor-pointer p-0.5 border border-white/10" />
                <input type="range" min={0} max={8} step={0.5} value={currentStrokeW} onChange={e => set('textStrokeWidth', Number(e.target.value))} className="flex-1 h-1 accent-indigo-500" />
                <span className="text-[9px] text-slate-400 w-4 font-mono">{currentStrokeW}</span>
              </div>
              <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-2 mb-1">Shadow Blur</p>
              <div className="flex items-center gap-2">
                <input type="range" min={0} max={20} step={1} value={currentShadow} onChange={e => set('textShadowBlur', Number(e.target.value))} className="flex-1 h-1 accent-indigo-500" />
                <span className="text-[9px] text-slate-400 w-4 font-mono">{currentShadow}</span>
              </div>
            </div>
          )}
        </div>

        <div className="relative pr-2 border-r border-white/10">
          <button onClick={() => { setShowStrapColor(v => !v); setShowColorPicker(false); setShowFontPicker(false); }} className="flex items-center gap-1.5 px-1.5 py-1 rounded-lg hover:bg-white/10 transition-all" title="Strap Color">
            <div className="w-4 h-4 rounded-full border border-white/20" style={{ background: currentLanyardColor }} />
            <Palette size={10} className="text-slate-400" />
          </button>
          {showStrapColor && (
            <div className="absolute top-full mt-1 left-0 bg-slate-900 border border-white/10 rounded-xl shadow-2xl p-2.5 z-[200] w-56">
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-2">Strap Color</p>
              <div className="grid grid-cols-9 gap-1 mb-2">
                {presetColors.map(c => (<button key={c.value} onClick={() => set('lanyardColor', c.value)} className={'w-5 h-5 rounded-full border-2 transition-all hover:scale-110 ' + (currentLanyardColor === c.value ? 'border-indigo-400' : 'border-transparent')} style={{ background: c.value }} title={c.name} />))}
              </div>
              <div className="flex items-center gap-2 mb-2">
                <input type="color" value={currentLanyardColor.startsWith('#') ? currentLanyardColor : '#ffffff'} onChange={e => set('lanyardColor', e.target.value)} className="w-8 h-8 rounded-lg cursor-pointer p-0.5 border border-white/10" />
                <input type="text" value={currentLanyardColor.startsWith('#') ? currentLanyardColor : ''} onChange={e => { if (/^#[0-9a-fA-F]{0,6}$/.test(e.target.value)) set('lanyardColor', e.target.value); }} placeholder="Custom color" className="flex-1 text-[10px] font-mono text-slate-300 bg-slate-800 border border-white/10 rounded-lg px-2 py-1 outline-none" />
              </div>
              <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Gradient Presets</p>
              <div className="grid grid-cols-7 gap-1">
                {gradientPresets.slice(0, 14).map(g => (<button key={g.name} onClick={() => set('lanyardColor', g.value)} className="w-6 h-6 rounded-lg border border-white/10 hover:scale-110 transition-all" style={{ background: g.value }} title={g.name} />))}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1">
          <RotateCw size={10} className="text-slate-400" />
          <input type="number" value={currentTextAngle} min={-180} max={180} step={1} onChange={e => set('textAngle', Number(e.target.value))} className="w-10 text-center text-white text-[11px] font-mono bg-transparent outline-none" title="Text Angle" />
          <span className="text-[9px] text-slate-500">deg</span>
        </div>
      </div>
    </div>
  );
}
