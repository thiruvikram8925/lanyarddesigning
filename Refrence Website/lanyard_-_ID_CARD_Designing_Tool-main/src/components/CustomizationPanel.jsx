import {
  CheckCircle2,
  CreditCard,
  ImagePlus,
  Link2,
  Palette,
  Paperclip,
  Printer,
  Ruler,
  Shield,
  Type,
  Upload,
  Zap,
  Square,
  Eye,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Bold,
  Italic,
  Layers,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Save,
  Trash2,
  Circle,
  TrendingDown,
  ShoppingBag,
  ShieldCheck,
  Move,
  Copy,
  Repeat,
  ArrowRightLeft,
  LayoutTemplate,
  Camera,
  Crop,
  Sparkles
} from 'lucide-react';
import PhotoEditor from './PhotoEditor';

import { useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  accessoryOptions,
  clipTypes,
  fonts,
  gradientPresets,
  pantonePalette,
  presetColors,
  printingMethods,
  widths,
  lengths,
} from '../data/options';
import { parseColorCode, toHexColor } from '../lib/colorUtils';
import { prepareUploadAsset } from '../lib/fileReaders';
import { calculatePricing, formatCurrency } from '../lib/pricing';
import { generateTryOn } from '../services/fashnService';
import { useConfiguratorStore } from '../store/useConfiguratorStore';
import DropzoneField from './DropzoneField';
import { cardSizes } from '../data/cardConfig';
import { showToast } from './Toast';
import { getAllTemplates, getTemplatesByOrientation, getTemplatesByCategory } from '../data/schoolIdTemplates';

function OptionGrid({ items, selected, onChange, icon: Icon }) {
  return (
    <div className="grid grid-cols-2 gap-2.5">
      {items.map((item) => {
        const active = selected === item.label;
        return (
          <button
            key={item.label}
            type="button"
            title={item.description}
            onClick={() => onChange(item.label)}
            className={`min-h-[72px] rounded-xl border-2 p-3 text-left transition-all duration-200 relative overflow-hidden cursor-pointer ${
              active 
                ? 'border-indigo-600 bg-indigo-50/50 text-indigo-900 shadow-sm' 
                : 'border-slate-200/80 bg-white text-slate-800 hover:border-slate-300 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-start justify-between gap-2 mb-1.5 relative z-10">
              <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${active ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                {Icon ? <Icon size={14} /> : <CheckCircle2 size={14} />}
              </div>
              {active && <CheckCircle2 size={15} className="text-indigo-600 shrink-0" />}
            </div>
            <div className="text-xs font-bold text-slate-900 tracking-tight leading-snug">{item.label}</div>
            <div className="mt-0.5 text-[10px] text-slate-500 line-clamp-1 font-medium">{item.description}</div>
          </button>
        );
      })}
    </div>
  );
}

function FieldLabel({ label, hint }) {
  return (
    <div className="mb-1.5 flex flex-col gap-0.5">
      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{label}</span>
      {hint ? <span className="text-[9px] text-slate-400 font-medium italic">{hint}</span> : null}
    </div>
  );
}

function SummaryRow({ label, value, isColor }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-slate-100 last:border-0">
      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">{label}</span>
      <div className="flex items-center gap-2 font-bold text-[12px] text-slate-900">
        {isColor && <div className="w-3 h-3 rounded-full border border-slate-200" style={{ backgroundColor: value }} />}
        {value}
      </div>
    </div>
  );
}

function Input({ className = '', ...props }) {
  return (
    <input
      className={`w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-medium text-slate-900 outline-none transition-all focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 ${className}`}
      {...props}
    />
  );
}

function Select(props) {
  return (
    <select
      className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-medium text-slate-900 outline-none transition-all focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 appearance-none"
      {...props}
    />
  );
}

export default function CustomizationPanel({ currentStep, setCurrentStep, onSubmit, loading, pricing, stageRef }) {
  const design = useConfiguratorStore((state) => state.design);
  const setField = useConfiguratorStore((state) => state.setField);
  const resetDesign = useConfiguratorStore((state) => state.resetDesign);

  const [pantoneSearch, setPantoneSearch] = useState('');
  const [photoEditorOpen, setPhotoEditorOpen] = useState(false);

  const steps = [
    { title: '1. Strap & Hardware', subtitle: 'Strap width, color, printed text & hook clip', icon: Palette },
    { title: '2. ID Card Layout', subtitle: 'Select template, edit text fields & card photo', icon: LayoutTemplate },
    { title: '3. Quantity & Order', subtitle: 'Volume tier pricing, shipping address & payment', icon: ShoppingBag },
  ];

  const handleNext = () => setCurrentStep(Math.min(steps.length - 1, currentStep + 1));
  const handleBack = () => setCurrentStep(Math.max(0, currentStep - 1));

  // Render Step 1: Strap Specs
  const step1Strap = (
    <div className="space-y-6">
      <div>
        <FieldLabel label="Strap Width" hint="Standard widths for custom printing" />
        <OptionGrid
          items={widths}
          selected={design.width}
          onChange={(val) => setField('width', val)}
          icon={Ruler}
        />
      </div>

      <div>
        <FieldLabel label="Strap Length" hint="Total circumference in inches" />
        <OptionGrid
          items={lengths}
          selected={design.length}
          onChange={(val) => setField('length', val)}
          icon={Ruler}
        />
      </div>

      <div>
        <FieldLabel label="Attachment Clip" hint="End hardware clip connection" />
        <OptionGrid
          items={clipTypes}
          selected={design.clipType}
          onChange={(val) => setField('clipType', val)}
          icon={Paperclip}
        />
      </div>

      <div>
        <FieldLabel label="Strap Color" hint="Select Pantone or preset color" />
        <div className="flex items-center gap-2 mb-3">
          <input
            type="color"
            value={design.lanyardColor}
            onChange={(e) => setField('lanyardColor', e.target.value)}
            className="w-9 h-9 rounded-lg cursor-pointer border border-slate-200"
          />
          <Input
            type="text"
            value={design.lanyardColor}
            onChange={(e) => setField('lanyardColor', e.target.value)}
            placeholder="#4F46E5"
            className="font-mono text-xs"
          />
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          {presetColors.map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => setField('lanyardColor', color)}
              className={`w-7 h-7 rounded-lg border-2 transition-all ${
                design.lanyardColor === color ? 'border-indigo-600 scale-110 shadow-sm' : 'border-white hover:scale-105'
              }`}
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
      </div>

      <div>
        <FieldLabel label="Printed Strap Text" hint="Text printed continuously along lanyard" />
        <Input
          type="text"
          value={design.customTextCenter || ''}
          onChange={(e) => setField('customTextCenter', e.target.value)}
          placeholder="e.g. GOTEK ACADEMY · ACADEMIC SESSION 2026"
        />
      </div>
    </div>
  );

  // Render Step 2: ID Card Layout
  const step2Card = (
    <div className="space-y-6">
      <div>
        <FieldLabel label="ID Card Template" hint="Select base card design" />
        <div className="grid grid-cols-2 gap-2">
          {getAllTemplates().slice(0, 6).map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => {
                setField('idCard.size', t.size);
                if (t.front?.backgroundColor) setField('idCard.front.backgroundColor', t.front.backgroundColor);
                if (t.front?.elements) {
                  setField('idCard.front.elements', t.front.elements.map(el => ({ ...el, id: `${el.id}-${Date.now()}` })));
                }
                showToast(`Applied "${t.name}" template`, 'success');
              }}
              className="p-3 bg-white rounded-xl border border-slate-200 hover:border-indigo-500 hover:shadow-sm text-left transition-all"
            >
              <div className="text-xs font-bold text-slate-900 truncate">{t.name}</div>
              <div className="text-[10px] text-slate-400 capitalize mt-0.5">{t.orientation} · {t.category}</div>
            </button>
          ))}
        </div>
      </div>

      <div>
        <FieldLabel label="Card Side View" />
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setField('idCard.activeSide', 'front')}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all border ${
              design.idCard.activeSide === 'front' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-slate-50 text-slate-600 border-slate-200'
            }`}
          >
            Front Side
          </button>
          <button
            type="button"
            onClick={() => setField('idCard.activeSide', 'back')}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all border ${
              design.idCard.activeSide === 'back' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-slate-50 text-slate-600 border-slate-200'
            }`}
          >
            Back Side
          </button>
        </div>
      </div>

      <div>
        <FieldLabel label="Cardholder Photo" hint="Upload student/employee portrait" />
        <DropzoneField
          onFileSelect={(file) => {
            const reader = new FileReader();
            reader.onload = (e) => setField('idCard.photoUrl', e.target.result);
            reader.readAsDataURL(file);
          }}
          currentImage={design.idCard.photoUrl}
          label="Upload Photo"
        />
      </div>
    </div>
  );

  // Render Step 3: Order Summary & Checkout
  const step3Order = (
    <div className="space-y-6">
      <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200/80 space-y-3">
        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Order Specification Summary</h3>
        <SummaryRow label="Strap Width" value={design.width} />
        <SummaryRow label="Strap Color" value={design.lanyardColor} isColor={true} />
        <SummaryRow label="Attachment Clip" value={design.clipType} />
        <SummaryRow label="ID Card Format" value={design.idCard.size} />
      </div>

      <div>
        <FieldLabel label="Order Quantity" hint="Tiered volume discounts applied" />
        <div className="flex items-center gap-3">
          <input
            type="range"
            min="10"
            max="1000"
            step="10"
            value={design.quantity}
            onChange={(e) => setField('quantity', Number(e.target.value))}
            className="flex-1 accent-indigo-600 cursor-pointer"
          />
          <Input
            type="number"
            value={design.quantity}
            onChange={(e) => setField('quantity', Math.max(1, Number(e.target.value)))}
            className="w-24 font-bold text-center"
          />
        </div>
      </div>

      {/* Pricing Breakdown Card */}
      <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white rounded-2xl p-5 space-y-3 shadow-lg">
        <div className="flex justify-between text-xs text-indigo-200">
          <span>Unit Price ({design.quantity} units)</span>
          <span className="font-bold">{formatCurrency(pricing.pricePerUnit)} / unit</span>
        </div>
        <div className="flex justify-between text-base font-extrabold text-white pt-2 border-t border-indigo-700/50">
          <span>Total Investment</span>
          <span className="text-emerald-400">{formatCurrency(pricing.total)}</span>
        </div>
      </div>

      <button
        type="button"
        onClick={onSubmit}
        disabled={loading}
        className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition-all active:scale-[0.99] disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
      >
        <ShoppingBag size={16} />
        <span>{loading ? 'Processing Order…' : 'Submit Production Order'}</span>
      </button>
    </div>
  );

  const content = [step1Strap, step2Card, step3Order];

  return (
    <div className="flex flex-col h-full bg-white font-sans text-slate-900 border-r border-slate-200">
      
      {/* Step Stepper Header */}
      <div className="p-4 border-b border-slate-200 bg-slate-50/50 shrink-0">
        <div className="flex items-center justify-between gap-1 mb-2">
          {steps.map((st, i) => {
            const active = i === currentStep;
            const Icon = st.icon;
            return (
              <button
                key={i}
                type="button"
                onClick={() => setCurrentStep(i)}
                className={`flex-1 py-2 px-2 rounded-xl text-left transition-all cursor-pointer border ${
                  active 
                    ? 'bg-white border-indigo-600 shadow-sm text-indigo-700' 
                    : 'border-slate-200/60 bg-slate-100/50 text-slate-500 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <Icon size={13} className={active ? 'text-indigo-600' : 'text-slate-400'} />
                  <span className="text-[11px] font-bold truncate">{st.title.split('.')[1]}</span>
                </div>
              </button>
            );
          })}
        </div>

        <div className="flex items-center justify-between pt-1">
          <span className="text-[11px] font-bold text-slate-900">{steps[currentStep].title}</span>
          <span className="text-[10px] text-slate-400 font-semibold">Step {currentStep + 1} of 3</span>
        </div>
      </div>

      {/* Main Form Content Area */}
      <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
        {content[currentStep]}
      </div>

      {/* Bottom Step Navigation Bar */}
      <div className="p-4 border-t border-slate-200 bg-slate-50/50 flex items-center justify-between shrink-0">
        <button
          type="button"
          onClick={handleBack}
          disabled={currentStep === 0}
          className="px-3.5 py-2 rounded-lg text-xs font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-100 transition-all disabled:opacity-30 cursor-pointer flex items-center gap-1"
        >
          <ChevronLeft size={14} />
          <span>Back</span>
        </button>

        <div className="flex items-center gap-1.5">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all ${
                i === currentStep ? 'w-5 bg-indigo-600' : 'w-1.5 bg-slate-300'
              }`}
            />
          ))}
        </div>

        {currentStep < steps.length - 1 ? (
          <button
            type="button"
            onClick={handleNext}
            className="px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 transition-all shadow-sm cursor-pointer flex items-center gap-1"
          >
            <span>Next</span>
            <ChevronRight size={14} />
          </button>
        ) : (
          <button
            type="button"
            onClick={onSubmit}
            className="px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-lg hover:bg-emerald-700 transition-all shadow-sm cursor-pointer flex items-center gap-1"
          >
            <span>Checkout</span>
            <CheckCircle2 size={14} />
          </button>
        )}
      </div>

    </div>
  );
}
