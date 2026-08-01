import { useState } from 'react';
import {
  Move, RotateCcw, Maximize2, Layers, Clock, Trash2, Lock, Eye, EyeOff,
  ChevronDown, ChevronRight, Minus, Plus, Bold, Italic, Underline,
  AlignLeft, AlignCenter, AlignRight, Copy, Clipboard, X, GripVertical,
  SlidersHorizontal, LayoutGrid, Palette, Type, RotateCw, ZoomIn, ZoomOut,
  ImageIcon, Link, Unlink, RefreshCw
} from 'lucide-react';
import AllViewsPanel from './AllViewsPanel';
import { useConfiguratorStore } from '../../store/useConfiguratorStore';
import { presetColors, gradientPresets } from '../../data/options';

// --- Slider Control ---
function Slider({ label, value, min = 0, max = 100, step = 1, unit = '', onChange }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-medium text-slate-400">{label}</span>
        <span className="text-[10px] font-mono text-slate-600">{value}{unit}</span>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange?.(Number(e.target.value))}
        className="w-full h-1 accent-indigo-600 cursor-pointer"
      />
    </div>
  );
}

// --- NumberInput ---
function NumberInput({ label, value, min, max, step = 1, unit = '', onChange }) {
  return (
    <div>
      <label className="text-[10px] font-medium text-slate-400 block mb-1">{label}</label>
      <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-white">
        <button
          onClick={() => onChange?.(Math.max(min ?? -Infinity, (value || 0) - step))}
          className="px-2 py-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-colors"
        ><Minus size={10} /></button>
        <input
          type="number" value={value || 0} min={min} max={max} step={step}
          onChange={e => onChange?.(Number(e.target.value))}
          className="flex-1 text-center text-[11px] font-mono text-slate-700 border-0 outline-none bg-transparent w-0 min-w-0"
        />
        <button
          onClick={() => onChange?.(Math.min(max ?? Infinity, (value || 0) + step))}
          className="px-2 py-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-colors"
        ><Plus size={10} /></button>
      </div>
      {unit && <span className="text-[9px] text-slate-400 ml-1">{unit}</span>}
    </div>
  );
}

// --- Section heading ---
function Section({ label, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-slate-100 last:border-0">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-slate-50 transition-colors"
      >
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{label}</span>
        {open ? <ChevronDown size={11} className="text-slate-400" /> : <ChevronRight size={11} className="text-slate-400" />}
      </button>
      {open && <div className="px-4 pb-4 space-y-3">{children}</div>}
    </div>
  );
}

// --- Layer Item ---
function LayerItem({ layer, selected, onSelect, onToggleVisible, onDelete }) {
  return (
    <div
      onClick={() => onSelect?.(layer.id)}
      className={`flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer group transition-all ${
        selected ? 'bg-indigo-50 border border-indigo-200' : 'hover:bg-slate-50 border border-transparent'
      }`}
    >
      <GripVertical size={11} className="text-slate-300 shrink-0 cursor-grab" />
      <div className="w-5 h-5 rounded border border-slate-200 bg-slate-100 shrink-0 flex items-center justify-center text-[8px] font-bold text-slate-400">
        {layer.type?.[0]?.toUpperCase() || 'L'}
      </div>
      <span className="text-[11px] font-medium text-slate-700 flex-1 truncate">{layer.name || `Layer ${layer.id}`}</span>
      <button onClick={e => { e.stopPropagation(); onToggleVisible?.(layer.id); }}
        className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-slate-200 transition-all">
        {layer.visible !== false ? <Eye size={10} className="text-slate-500" /> : <EyeOff size={10} className="text-slate-400" />}
      </button>
      <button onClick={e => { e.stopPropagation(); onDelete?.(layer.id); }}
        className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-red-50 transition-all">
        <Trash2 size={10} className="text-red-400" />
      </button>
    </div>
  );
}

const ZONE_TEXT_FIELDS = { left: 'customTextLeft', right: 'customTextRight', center: 'customTextCenter' };
const ZONE_OFFSET_X = { left: 'textOffsetLeft', right: 'textOffsetRight', center: 'textOffsetCenter' };
const ZONE_OFFSET_Y = { left: 'textYOffsetLeft', right: 'textYOffsetRight', center: 'textYOffsetCenter' };
const ZONE_LOGO_X = { left: 'logoOffsetLeft', right: 'logoOffsetRight', center: 'logoOffsetCenter' };
const ZONE_LOGO_Y = { left: 'logoYOffsetLeft', right: 'logoYOffsetRight', center: 'logoYOffsetCenter' };

const FONT_FAMILIES = [
  'Montserrat', 'Roboto', 'Open Sans', 'Inter', 'Arial',
  'Lato', 'Poppins', 'Oswald', 'Raleway', 'Ubuntu', 'Bebas Neue', 'Anton', 'Exo 2',
];

const ZONE_LABELS = { left: 'Left Strap', center: 'Center Strap', right: 'Right Strap' };

function ColorSwatch({ value, selected, onClick, title }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`w-5 h-5 rounded-full border-2 transition-all hover:scale-110 ${selected ? 'border-indigo-500 scale-110' : 'border-transparent'}`}
      style={{ background: value }}
    />
  );
}

function LanyardZonePanel({ zone, onZoneSelect }) {
  const design = useConfiguratorStore(s => s.design);
  const setField = useConfiguratorStore(s => s.setField);
  const set = (field, value) => setField(field, value);

  const textField = ZONE_TEXT_FIELDS[zone];
  const offsetXField = ZONE_OFFSET_X[zone];
  const offsetYField = ZONE_OFFSET_Y[zone];
  const logoXField = ZONE_LOGO_X[zone];
  const logoYField = ZONE_LOGO_Y[zone];

  return (
    <div className="flex-1 overflow-y-auto panel-scroll">
      {/* Zone selector */}
      <div className="px-4 pt-3 pb-2 border-b border-slate-100">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Active Zone</p>
        <div className="flex gap-1">
          {['left','center','right'].map(z => (
            <button
              key={z}
              onClick={() => onZoneSelect(z)}
              className={`flex-1 py-1 rounded-lg text-[10px] font-bold transition-all border ${
                zone === z
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'border-slate-200 text-slate-500 hover:border-indigo-300 hover:text-indigo-600'
              }`}
            >
              {z.charAt(0).toUpperCase() + z.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <Section label="Zone Text">
        <div>
          <label className="text-[10px] font-medium text-slate-400 block mb-1">{ZONE_LABELS[zone]}</label>
          <input
            type="text"
            value={design[textField] || ''}
            onChange={e => set(textField, e.target.value)}
            placeholder={`e.g. COMPANY NAME`}
            className="w-full text-[11px] border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-400"
          />
        </div>
        <Slider label="Text Offset (X)" value={design[offsetXField] || 0} min={-350} max={350} step={1} unit="px"
          onChange={v => set(offsetXField, v)} />
        <Slider label="Text Offset (Y)" value={design[offsetYField] || 0} min={-30} max={30} step={0.5} unit="px"
          onChange={v => set(offsetYField, v)} />
      </Section>

      <Section label="Typography">
        <div>
          <label className="text-[10px] font-medium text-slate-400 block mb-1">Font Family</label>
          <select
            value={design.fontFamily || 'Montserrat'}
            onChange={e => set('fontFamily', e.target.value)}
            className="w-full text-[11px] border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-400 bg-white"
          >
            {FONT_FAMILIES.map(f => <option key={f} value={f} style={{ fontFamily: f }}>{f}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <NumberInput label="Font Size" value={design.fontSize || 16} min={6} max={120} unit="px"
            onChange={v => set('fontSize', v)} />
          <NumberInput label="Line Height" value={design.lineHeight || 1.2} min={0.5} max={3} step={0.1}
            onChange={v => set('lineHeight', v)} />
        </div>
        <Slider label="Letter Spacing" value={design.letterSpacing || 0} min={-5} max={40} step={0.5} unit="px"
          onChange={v => set('letterSpacing', v)} />
        <div className="flex gap-1">
          <button
            onClick={() => set('fontWeight', (design.fontWeight || 'bold') === 'bold' ? 'normal' : 'bold')}
            className={`flex-1 py-1.5 rounded-lg border transition-all flex items-center justify-center gap-1 ${
              (design.fontWeight || 'bold') === 'bold' ? 'bg-indigo-50 border-indigo-300 text-indigo-600' : 'border-slate-200 text-slate-400 hover:border-slate-300'
            }`}
          >
            <Bold size={11} /> <span className="text-[10px] font-medium">Bold</span>
          </button>
          <button
            onClick={() => set('fontStyle', design.fontStyle === 'italic' ? 'normal' : 'italic')}
            className={`flex-1 py-1.5 rounded-lg border transition-all flex items-center justify-center gap-1 ${
              design.fontStyle === 'italic' ? 'bg-indigo-50 border-indigo-300 text-indigo-600' : 'border-slate-200 text-slate-400 hover:border-slate-300'
            }`}
          >
            <Italic size={11} /> <span className="text-[10px] font-medium">Italic</span>
          </button>
        </div>
        <div>
          <label className="text-[10px] font-medium text-slate-400 block mb-1">Alignment</label>
          <div className="flex gap-1">
            {[{icon: AlignLeft, align:'left'},{icon: AlignCenter, align:'center'},{icon: AlignRight, align:'right'}].map(({icon: Icon, align}) => (
              <button key={align} onClick={() => set('textAlign', align)}
                className={`flex-1 py-1.5 rounded-lg border transition-all ${
                  (design.textAlign || 'center') === align ? 'bg-indigo-50 border-indigo-300 text-indigo-600' : 'border-slate-200 text-slate-400 hover:border-slate-300'
                }`}>
                <Icon size={12} className="mx-auto" />
              </button>
            ))}
          </div>
        </div>
        <NumberInput label="Text Angle" value={design.textAngle || 0} min={-180} max={180} unit="°"
          onChange={v => set('textAngle', v)} />
      </Section>

      <Section label="Text Color &amp; Effects">
        <div>
          <label className="text-[10px] font-medium text-slate-400 block mb-1">Font Color</label>
          <div className="flex items-center gap-2">
            <input type="color"
              value={(design.fontColor || design.textColor || '#000000').startsWith('#') ? (design.fontColor || design.textColor || '#000000') : '#000000'}
              onChange={e => { set('fontColor', e.target.value); set('textColor', e.target.value); }}
              className="w-8 h-8 rounded-lg border border-slate-200 cursor-pointer p-0.5"
            />
            <input type="text"
              value={design.fontColor || design.textColor || '#000000'}
              onChange={e => { if(/^#[0-9a-fA-F]{0,6}$/.test(e.target.value)){ set('fontColor', e.target.value); set('textColor', e.target.value); } }}
              className="flex-1 text-[11px] font-mono border border-slate-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-400"
            />
          </div>
          <div className="flex gap-1 mt-2 flex-wrap">
            {presetColors.map(c => (
              <ColorSwatch key={c.value} value={c.value} title={c.name}
                selected={(design.fontColor || design.textColor) === c.value}
                onClick={() => { set('fontColor', c.value); set('textColor', c.value); }}
              />
            ))}
          </div>
        </div>
        <div>
          <label className="text-[10px] font-medium text-slate-400 block mb-1">Stroke Color</label>
          <div className="flex items-center gap-2">
            <input type="color"
              value={(design.textStrokeColor || '#000000').startsWith('#') ? (design.textStrokeColor || '#000000') : '#000000'}
              onChange={e => set('textStrokeColor', e.target.value)}
              className="w-8 h-8 rounded-lg border border-slate-200 cursor-pointer p-0.5"
            />
            <NumberInput label="" value={design.textStrokeWidth || 0} min={0} max={10} step={0.5} unit="px"
              onChange={v => set('textStrokeWidth', v)} />
          </div>
        </div>
        <Slider label="Shadow Blur" value={design.textShadowBlur || 0} min={0} max={24} step={1} unit="px"
          onChange={v => set('textShadowBlur', v)} />
        <Slider label="Text Spacing" value={design.textSpacing || 60} min={20} max={300} step={5} unit="px"
          onChange={v => set('textSpacing', v)} />
      </Section>

      <Section label="Strap Color">
        <div>
          <label className="text-[10px] font-medium text-slate-400 block mb-1">Solid Color</label>
          <div className="flex items-center gap-2">
            <input type="color"
              value={(design.lanyardColor || '#ffffff').startsWith('#') ? (design.lanyardColor || '#ffffff') : '#ffffff'}
              onChange={e => set('lanyardColor', e.target.value)}
              className="w-8 h-8 rounded-lg border border-slate-200 cursor-pointer p-0.5"
            />
            <input type="text"
              value={design.lanyardColor || '#ffffff'}
              onChange={e => { if(/^#[0-9a-fA-F]{0,6}$/.test(e.target.value)) set('lanyardColor', e.target.value); }}
              className="flex-1 text-[11px] font-mono border border-slate-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-400"
            />
          </div>
          <div className="flex gap-1 mt-2 flex-wrap">
            {presetColors.map(c => (
              <ColorSwatch key={c.value} value={c.value} title={c.name}
                selected={design.lanyardColor === c.value}
                onClick={() => set('lanyardColor', c.value)}
              />
            ))}
          </div>
        </div>
        <div>
          <label className="text-[10px] font-medium text-slate-400 block mb-1">Gradient Presets</label>
          <div className="grid grid-cols-8 gap-1">
            {gradientPresets.slice(0, 16).map(g => (
              <button key={g.name} onClick={() => set('lanyardColor', g.value)}
                title={g.name}
                className={`w-6 h-6 rounded-md border-2 transition-all hover:scale-110 ${design.lanyardColor === g.value ? 'border-indigo-500' : 'border-transparent'}`}
                style={{ background: g.value }}
              />
            ))}
          </div>
        </div>
      </Section>

      {design.logoUrl && (
        <Section label="Logo / Image">
          <Slider label="Logo Scale" value={Math.round((design.logoScale || 1) * 100)} min={10} max={300} step={5} unit="%"
            onChange={v => set('logoScale', v / 100)} />
          <NumberInput label="Logo Offset X" value={design[logoXField] || design.logoOffset || 0} min={-200} max={200}
            onChange={v => set(logoXField, v)} />
          <NumberInput label="Logo Offset Y" value={design[logoYField] || design.logoYOffset || 0} min={-50} max={50}
            onChange={v => set(logoYField, v)} />
          <NumberInput label="Logo Rotation" value={design.logoRotation || 0} min={-180} max={180} unit="°"
            onChange={v => set('logoRotation', v)} />
          <button onClick={() => set('logoUrl', '')} className="w-full py-1.5 text-[11px] font-semibold text-red-500 border border-red-200 rounded-lg hover:bg-red-50 transition-all flex items-center justify-center gap-1.5">
            <Trash2 size={11} /> Remove Logo
          </button>
        </Section>
      )}

      <Section label="Strap Dimensions" defaultOpen={false}>
        <div>
          <label className="text-[10px] font-medium text-slate-400 block mb-1">Width</label>
          <div className="flex gap-1 flex-wrap">
            {['12mm','16mm','20mm','25mm'].map(w => (
              <button key={w} onClick={() => set('width', w)}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all border ${
                  design.width === w ? 'bg-indigo-600 text-white border-indigo-600' : 'border-slate-200 text-slate-500 hover:border-indigo-300'
                }`}
              >{w}</button>
            ))}
          </div>
        </div>
        <div>
          <label className="text-[10px] font-medium text-slate-400 block mb-1">Length</label>
          <div className="flex gap-1 flex-wrap">
            {['28','30','32','34','38'].map(l => (
              <button key={l} onClick={() => set('length', l)}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all border ${
                  design.length === l ? 'bg-indigo-600 text-white border-indigo-600' : 'border-slate-200 text-slate-500 hover:border-indigo-300'
                }`}
              >{l}cm</button>
            ))}
          </div>
        </div>
      </Section>
    </div>
  );
}

export default function RightProperties({
  projectType = 'lanyard',
  selectedElement,
  selectedZone,
  onZoneSelect,
  layers = [],
  history = [],
  onChangeElement,
  onSelectLayer,
  onToggleLayerVisible,
  onDeleteLayer,
  onHistoryRestore,
}) {
  const [tab, setTab] = useState('properties'); // 'properties' | 'layers' | 'history' | 'views'
  const [activeView, setActiveView] = useState('full-3d');

  const design = useConfiguratorStore(s => s.design);
  const setField = useConfiguratorStore(s => s.setField);
  const el = selectedElement;

  return (
    <div className="editor-right-panel w-64 bg-white border-l border-slate-200 flex flex-col h-full shrink-0">
      {/* Tab switcher */}
      <div className="flex border-b border-slate-100 shrink-0">
        {[
          { key: 'properties', label: 'Props', icon: SlidersHorizontal },
          { key: 'layers', label: 'Layers', icon: Layers },
          { key: 'views', label: 'Views', icon: LayoutGrid },
          { key: 'history', label: 'History', icon: Clock },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 text-[10px] font-semibold transition-all ${
              tab === key ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/50' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <Icon size={13} />
            {label}
          </button>
        ))}
      </div>

      {/* Properties Tab */}
      {tab === 'properties' && (
        selectedZone && projectType === 'lanyard' ? (
          <LanyardZonePanel zone={selectedZone} onZoneSelect={onZoneSelect || (() => {})} />
        ) : (
        <div className="flex-1 overflow-y-auto panel-scroll">
          {!el ? (
            <div className="p-4 space-y-4">
              <div className="text-center py-2">
                <p className="text-[12px] font-bold text-slate-800 capitalize">{projectType.replace('-', ' ')} Settings</p>
                {projectType === 'lanyard' && (
                  <p className="text-[10px] text-indigo-500 mt-1 font-medium">💡 Click a strap zone to edit it</p>
                )}
              </div>

              {projectType === 'lanyard' ? (
                <div className="space-y-3">
                  <Section label="Lanyard Strap Text">
                    <div>
                      <label className="text-[10px] font-medium text-slate-400 block mb-1">Left Strap Text</label>
                      <input
                        type="text"
                        value={design.customTextLeft || ''}
                        placeholder="e.g. RAVENCLAW"
                        className="w-full text-[11px] border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-400"
                        onChange={e => setField('customTextLeft', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-medium text-slate-400 block mb-1">Right Strap Text</label>
                      <input
                        type="text"
                        value={design.customTextRight || ''}
                        placeholder="e.g. UNIVERSITY"
                        className="w-full text-[11px] border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-400"
                        onChange={e => setField('customTextRight', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-medium text-slate-400 block mb-1">Center Text / Role</label>
                      <input
                        type="text"
                        value={design.customTextCenter || ''}
                        placeholder="e.g. STAFF / VIP"
                        className="w-full text-[11px] border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-400"
                        onChange={e => setField('customTextCenter', e.target.value)}
                      />
                    </div>
                  </Section>
                </div>
              ) : (
                <div className="space-y-3">
                  <Section label="ID Card Canvas">
                    <p className="text-[10px] text-slate-500">Standard CR-80 Size (85.6mm x 54mm)</p>
                  </Section>
                </div>
              )}
            </div>
          ) : (
            <>
              {/* Element header */}
              <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div>
                  <p className="text-[12px] font-bold text-slate-800">{el.type?.charAt(0).toUpperCase() + el.type?.slice(1) || 'Element'}</p>
                  <p className="text-[10px] text-slate-400 font-mono">{el.id?.slice(0, 12)}</p>
                </div>
                <div className="flex gap-1">
                  <button className="p-1.5 rounded-lg hover:bg-slate-200 transition-colors" title="Duplicate">
                    <Copy size={11} className="text-slate-500" />
                  </button>
                  <button className="p-1.5 rounded-lg hover:bg-red-50 transition-colors" title="Delete">
                    <Trash2 size={11} className="text-red-400" />
                  </button>
                </div>
              </div>

              <Section label="Transform">
                <div className="grid grid-cols-2 gap-2">
                  <NumberInput label="X" value={Math.round(el.x || 0)} onChange={v => onChangeElement?.({ x: v })} />
                  <NumberInput label="Y" value={Math.round(el.y || 0)} onChange={v => onChangeElement?.({ y: v })} />
                  <NumberInput label="W" value={Math.round(el.width || el.w || 0)} min={1} onChange={v => onChangeElement?.({ width: v })} />
                  <NumberInput label="H" value={Math.round(el.height || el.h || 0)} min={1} onChange={v => onChangeElement?.({ height: v })} />
                </div>
                <Slider label="Rotation" value={Math.round(el.rotation || 0)} min={-180} max={180} unit="°" onChange={v => onChangeElement?.({ rotation: v })} />
                <Slider label="Opacity" value={Math.round((el.opacity ?? 1) * 100)} min={0} max={100} unit="%" onChange={v => onChangeElement?.({ opacity: v / 100 })} />
              </Section>

              <Section label="Appearance">
                <div className="space-y-2">
                  <div>
                    <label className="text-[10px] font-medium text-slate-400 block mb-1">Fill Color</label>
                    <div className="flex items-center gap-2">
                      <input type="color" value={el.fill || el.color || '#4f46e5'}
                        onChange={e => onChangeElement?.({ fill: e.target.value })}
                        className="w-8 h-8 rounded-lg border border-slate-200 cursor-pointer p-0.5"
                      />
                      <input type="text" value={el.fill || el.color || '#4f46e5'}
                        onChange={e => onChangeElement?.({ fill: e.target.value })}
                        className="flex-1 text-[11px] font-mono border border-slate-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-400"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-medium text-slate-400 block mb-1">Stroke Color</label>
                    <div className="flex items-center gap-2">
                      <input type="color" value={el.stroke || '#000000'}
                        onChange={e => onChangeElement?.({ stroke: e.target.value })}
                        className="w-8 h-8 rounded-lg border border-slate-200 cursor-pointer p-0.5"
                      />
                      <NumberInput label="" value={el.strokeWidth || 0} min={0} max={20} unit="px"
                        onChange={v => onChangeElement?.({ strokeWidth: v })} />
                    </div>
                  </div>
                  <Slider label="Corner Radius" value={el.cornerRadius || el.radius || 0} min={0} max={50} unit="px"
                    onChange={v => onChangeElement?.({ cornerRadius: v })} />
                </div>
              </Section>

              {(el.type === 'text' || el.text !== undefined) && (
                <Section label="Typography">
                  <div>
                    <label className="text-[10px] font-medium text-slate-400 block mb-1">Font Family</label>
                    <select value={el.fontFamily || 'Inter'}
                      onChange={e => onChangeElement?.({ fontFamily: e.target.value })}
                      className="w-full text-[12px] border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-400 bg-white"
                    >
                      {['Inter', 'Roboto', 'Poppins', 'Montserrat', 'Open Sans', 'Lato', 'Arial'].map(f => (
                        <option key={f} value={f}>{f}</option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <NumberInput label="Size" value={el.fontSize || 12} min={6} max={200} unit="px"
                      onChange={v => onChangeElement?.({ fontSize: v })} />
                    <NumberInput label="Line Height" value={el.lineHeight || 1.2} min={0.5} max={3} step={0.1}
                      onChange={v => onChangeElement?.({ lineHeight: v })} />
                  </div>
                  <div className="flex gap-1">
                    {[
                      { icon: Bold, prop: 'fontStyle', value: 'bold' },
                      { icon: Italic, prop: 'fontStyle', value: 'italic' },
                      { icon: Underline, prop: 'textDecoration', value: 'underline' },
                    ].map(({ icon: Icon, prop, value }) => (
                      <button key={value}
                        onClick={() => onChangeElement?.({ [prop]: el[prop] === value ? 'normal' : value })}
                        className={`flex-1 py-1.5 rounded-lg border transition-all ${
                          el[prop] === value ? 'bg-indigo-50 border-indigo-300 text-indigo-600' : 'border-slate-200 text-slate-400 hover:border-slate-300'
                        }`}
                      >
                        <Icon size={12} className="mx-auto" />
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-1">
                    {[
                      { icon: AlignLeft, align: 'left' },
                      { icon: AlignCenter, align: 'center' },
                      { icon: AlignRight, align: 'right' },
                    ].map(({ icon: Icon, align }) => (
                      <button key={align}
                        onClick={() => onChangeElement?.({ align })}
                        className={`flex-1 py-1.5 rounded-lg border transition-all ${
                          (el.align || 'left') === align ? 'bg-indigo-50 border-indigo-300 text-indigo-600' : 'border-slate-200 text-slate-400 hover:border-slate-300'
                        }`}
                      >
                        <Icon size={12} className="mx-auto" />
                      </button>
                    ))}
                  </div>
                </Section>
              )}
            </>
          )}
        </div>
        )
      )}

      {/* Layers Tab */}
      {tab === 'layers' && (
        <div className="flex-1 overflow-y-auto panel-scroll">
          <div className="p-3 space-y-1">
            {layers.length === 0 ? (
              <div className="text-center py-8">
                <Layers size={24} className="text-slate-200 mx-auto mb-2" />
                <p className="text-[11px] text-slate-400">No layers yet</p>
                <p className="text-[10px] text-slate-300">Add elements to the canvas</p>
              </div>
            ) : (
              layers.map(layer => (
                <LayerItem key={layer.id} layer={layer}
                  selected={selectedElement?.id === layer.id}
                  onSelect={onSelectLayer}
                  onToggleVisible={onToggleLayerVisible}
                  onDelete={onDeleteLayer}
                />
              ))
            )}
          </div>
        </div>
      )}

      {/* History Tab */}
      {tab === 'history' && (
        <div className="flex-1 overflow-y-auto panel-scroll">
          <div className="p-3 space-y-1">
            {history.length === 0 ? (
              <div className="text-center py-8">
                <Clock size={24} className="text-slate-200 mx-auto mb-2" />
                <p className="text-[11px] text-slate-400">No history yet</p>
                <p className="text-[10px] text-slate-300">Your actions will be tracked here</p>
              </div>
            ) : (
              history.map((item, i) => (
                <button key={i} onClick={() => onHistoryRestore?.(i)}
                  className={`w-full text-left flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-slate-50 transition-colors ${i === 0 ? 'font-semibold' : ''}`}
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-300 shrink-0" />
                  <span className="text-[11px] text-slate-600 flex-1 truncate">{item.label || `Step ${history.length - i}`}</span>
                  <span className="text-[9px] text-slate-400 font-mono shrink-0">{item.time || '--:--'}</span>
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {/* Views Tab */}
      {tab === 'views' && (
        <div className="flex-1 overflow-y-auto panel-scroll">
          <AllViewsPanel
            activeView={activeView}
            onSelectView={(key) => {
              setActiveView(key);
            }}
          />
          <div className="px-3 pb-4 space-y-2">
            <div className="rounded-xl border border-indigo-100 bg-indigo-50 p-3 space-y-1.5">
              <p className="text-[9px] font-bold text-indigo-700 uppercase tracking-widest">Quick Guide</p>
              <p className="text-[10px] text-indigo-600 leading-relaxed">
                Click a view thumbnail to switch the active design view. Changes made in any view are reflected in all thumbnails in real time.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

