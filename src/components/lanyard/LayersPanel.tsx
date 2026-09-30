import React from 'react';
import { useConfiguratorStore, LanyardLogoItem } from '../../store/useConfiguratorStore';
import { 
  Layers, Eye, EyeOff, Type, Image as ImageIcon, Sparkles, 
  Trash2, MoveUp, MoveDown, Crop, Sliders, Lock, Unlock,
  Plus, Disc, Check, Palette
} from 'lucide-react';
import { toast } from 'sonner';

interface LayersPanelProps {
  onOpenCropModal?: (url: string) => void;
  onOpenUpload?: () => void;
  onOpenText?: () => void;
}

export default function LayersPanel({
  onOpenCropModal,
  onOpenUpload,
  onOpenText,
}: LayersPanelProps) {
  const design = useConfiguratorStore(s => s.design);
  const setField = useConfiguratorStore(s => s.setField);

  const logos: LanyardLogoItem[] = (design.lanyardLogos && design.lanyardLogos.length > 0)
    ? design.lanyardLogos
    : (design.logoUrl ? [{
        id: 'primary-logo',
        url: design.logoUrl,
        name: design.logoName || 'Main Logo',
        xOffset: design.logoOffset || 0,
        scale: design.logoScale || 1,
        rotation: design.logoRotation || 0,
        borderWidth: design.logoBorderWidth || 0,
        borderColor: design.logoBorderColor || '#ffffff',
        borderRadius: design.logoBorderRadius || 0,
        opacity: design.logoOpacity ?? 1,
      }] : []);

  const handleToggleLogoVisibility = (logoId: string, currentOpacity?: number) => {
    if (logos.length === 0) return;
    const isHidden = (currentOpacity ?? 1) === 0;
    const newOpacity = isHidden ? 1 : 0;

    if (design.lanyardLogos && design.lanyardLogos.length > 0) {
      const updated = design.lanyardLogos.map(l => 
        l.id === logoId ? { ...l, opacity: newOpacity } : l
      );
      setField('lanyardLogos', updated);
    } else {
      setField('logoOpacity', newOpacity);
    }
    toast.info(isHidden ? 'Image layer visible' : 'Image layer hidden');
  };

  const handleMoveLogo = (index: number, direction: 'up' | 'down') => {
    if (!design.lanyardLogos || design.lanyardLogos.length <= 1) return;
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= design.lanyardLogos.length) return;

    const list = [...design.lanyardLogos];
    const temp = list[index];
    list[index] = list[newIndex];
    list[newIndex] = temp;
    setField('lanyardLogos', list);
  };

  const handleRemoveLogo = (logoId: string) => {
    if (design.lanyardLogos && design.lanyardLogos.length > 0) {
      const updated = design.lanyardLogos.filter(l => l.id !== logoId);
      setField('lanyardLogos', updated);
      if (updated.length === 0) {
        setField('logoUrl', '');
        setField('logoName', '');
      } else {
        setField('logoUrl', updated[0].url);
        setField('logoName', updated[0].name);
      }
    } else {
      setField('logoUrl', '');
      setField('logoName', '');
    }
    toast.info('Removed image layer');
  };

  const hasText = Boolean(
    (design.customTextLeft && design.customTextLeft.trim()) ||
    (design.customTextCenter && design.customTextCenter.trim()) ||
    (design.customTextRight && design.customTextRight.trim())
  );

  const isTextHidden = (design.fontSize || 18) <= 0;

  const handleToggleTextVisibility = () => {
    if (isTextHidden) {
      setField('fontSize', 18);
      toast.info('Text layer visible');
    } else {
      setField('fontSize', 0);
      toast.info('Text layer hidden');
    }
  };

  const isPatternHidden = (design.strapPatternOpacity ?? 0.85) === 0;
  const handleTogglePatternVisibility = () => {
    if (isPatternHidden) {
      setField('strapPatternOpacity', 0.85);
      toast.info('Pattern layer visible');
    } else {
      setField('strapPatternOpacity', 0);
      toast.info('Pattern layer hidden');
    }
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto bg-white">
      {/* Header */}
      <div className="px-4 pt-4 pb-2 border-b border-slate-100">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-xs font-bold text-slate-700 tracking-wider uppercase flex items-center gap-1.5">
            <Layers size={14} className="text-indigo-600" />
            Layers
          </h3>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-600">
            {1 + (hasText ? 1 : 0) + logos.length + (design.strapPattern ? 1 : 0) + 1} LAYERS
          </span>
        </div>
        <p className="text-[11px] text-slate-400">Manage layer order, visibility & properties</p>
      </div>

      {/* Quick Add Actions */}
      <div className="p-3 bg-slate-50 border-b border-slate-100 flex items-center gap-2">
        <button
          onClick={onOpenText}
          className="flex-1 py-1.5 px-2 bg-white border border-slate-200 hover:border-indigo-300 hover:text-indigo-600 text-slate-600 rounded-md text-[11px] font-bold transition flex items-center justify-center gap-1 shadow-2xs"
        >
          <Type size={12} />
          + Text
        </button>
        <button
          onClick={onOpenUpload}
          className="flex-1 py-1.5 px-2 bg-white border border-slate-200 hover:border-indigo-300 hover:text-indigo-600 text-slate-600 rounded-md text-[11px] font-bold transition flex items-center justify-center gap-1 shadow-2xs"
        >
          <ImageIcon size={12} />
          + Image
        </button>
      </div>

      {/* Layer Stack (Top to Bottom visual rendering) */}
      <div className="p-3 space-y-2.5 flex-1 overflow-y-auto">
        
        {/* 1. Hardware & Clip Layer (Top layer) */}
        <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg hover:border-indigo-200 transition group shadow-2xs">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-100 border border-amber-200 flex items-center justify-center text-amber-700 shrink-0 text-sm">
              🪝
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 truncate">Hardware & Attachment</span>
                <span className="text-[9px] font-semibold text-slate-400 uppercase">Top Layer</span>
              </div>
              <p className="text-[10px] text-slate-500 truncate">{design.clipType || 'Metal Hook'} • {design.width || '20mm'}</p>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-6 h-6 flex items-center justify-center text-slate-400 text-xs">
                <Lock size={12} />
              </span>
            </div>
          </div>
        </div>

        {/* 2. Uploaded Logo/Image Layers */}
        {logos.map((logoItem, idx) => {
          const isHidden = (logoItem.opacity ?? 1) === 0;
          const isSelected = design.selectedLanyardElement === 'logo';

          return (
            <div
              key={logoItem.id || idx}
              onClick={() => setField('selectedLanyardElement', 'logo')}
              className={`p-2.5 rounded-lg border transition shadow-2xs cursor-pointer ${
                isSelected
                  ? 'bg-indigo-50/60 border-indigo-300 ring-1 ring-indigo-200'
                  : 'bg-white border-slate-200 hover:border-indigo-200 hover:bg-slate-50/50'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 p-0.5 flex items-center justify-center shrink-0 overflow-hidden">
                  <img src={logoItem.url} alt={logoItem.name} className="w-full h-full object-contain" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 truncate">
                      {logoItem.name || `Stripe Image ${idx + 1}`}
                    </span>
                    <span className="text-[9px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">
                      Image
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 truncate">
                    Scale: {logoItem.scale || design.logoScale || 1}x • {design.logoMode === 'single' ? 'Single' : 'Repeated'}
                  </p>
                </div>

                {/* Layer Control Buttons */}
                <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                  {onOpenCropModal && (
                    <button
                      onClick={() => onOpenCropModal(logoItem.url)}
                      className="w-6 h-6 rounded flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition"
                      title="Crop/Edit Image"
                    >
                      <Crop size={12} />
                    </button>
                  )}
                  <button
                    onClick={() => handleToggleLogoVisibility(logoItem.id, logoItem.opacity)}
                    className="w-6 h-6 rounded flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
                    title={isHidden ? 'Show Layer' : 'Hide Layer'}
                  >
                    {isHidden ? <EyeOff size={13} className="text-slate-300" /> : <Eye size={13} className="text-indigo-600" />}
                  </button>
                  {logos.length > 1 && (
                    <div className="flex flex-col">
                      <button
                        onClick={() => handleMoveLogo(idx, 'up')}
                        disabled={idx === 0}
                        className="w-4 h-3 flex items-center justify-center text-slate-400 hover:text-slate-700 disabled:opacity-20"
                        title="Move Up"
                      >
                        <MoveUp size={10} />
                      </button>
                      <button
                        onClick={() => handleMoveLogo(idx, 'down')}
                        disabled={idx === logos.length - 1}
                        className="w-4 h-3 flex items-center justify-center text-slate-400 hover:text-slate-700 disabled:opacity-20"
                        title="Move Down"
                      >
                        <MoveDown size={10} />
                      </button>
                    </div>
                  )}
                  <button
                    onClick={() => handleRemoveLogo(logoItem.id)}
                    className="w-6 h-6 rounded flex items-center justify-center text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
                    title="Delete Layer"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {/* 3. Text Layer */}
        <div
          onClick={() => {
            setField('selectedLanyardElement', 'text');
            if (onOpenText) onOpenText();
          }}
          className={`p-2.5 rounded-lg border transition shadow-2xs cursor-pointer ${
            design.selectedLanyardElement === 'text'
              ? 'bg-indigo-50/60 border-indigo-300 ring-1 ring-indigo-200'
              : 'bg-white border-slate-200 hover:border-indigo-200 hover:bg-slate-50/50'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 border border-indigo-200 flex items-center justify-center text-indigo-700 shrink-0">
              <Type size={14} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 truncate">
                  Strap Text
                </span>
                <span className="text-[9px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">
                  Text
                </span>
              </div>
              <p className="text-[10px] text-slate-500 font-mono truncate">
                {design.customTextLeft || design.customTextCenter || design.customTextRight || '(No text entered)'}
              </p>
            </div>

            <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
              <button
                onClick={handleToggleTextVisibility}
                className="w-6 h-6 rounded flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
                title={isTextHidden ? 'Show Text' : 'Hide Text'}
              >
                {isTextHidden ? <EyeOff size={13} className="text-slate-300" /> : <Eye size={13} className="text-indigo-600" />}
              </button>
            </div>
          </div>

          {/* Quick text styling bar */}
          <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
            <span>Font: <strong className="text-slate-600">{design.fontFamily || 'Montserrat'}</strong></span>
            <span>Size: <strong className="text-slate-600">{design.fontSize || 18}px</strong></span>
            <div className="flex items-center gap-1">
              <span>Color:</span>
              <div
                className="w-3 h-3 rounded-full border border-slate-300"
                style={{ backgroundColor: design.fontColor || '#ffffff' }}
              />
            </div>
          </div>
        </div>

        {/* 4. Strap Pattern / Texture Layer (If present) */}
        {design.strapPattern && (
          <div className="p-2.5 bg-white border border-slate-200 rounded-lg hover:border-indigo-200 transition shadow-2xs">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-purple-100 border border-purple-200 flex items-center justify-center text-purple-700 shrink-0">
                <Sparkles size={14} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 truncate">
                    Texture Pattern
                  </span>
                  <span className="text-[9px] font-bold text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded">
                    Pattern
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 truncate">
                  Scale: {design.patternScale || 100}% • Opacity: {Math.round((design.strapPatternOpacity ?? 0.85) * 100)}%
                </p>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={handleTogglePatternVisibility}
                  className="w-6 h-6 rounded flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
                  title={isPatternHidden ? 'Show Pattern' : 'Hide Pattern'}
                >
                  {isPatternHidden ? <EyeOff size={13} className="text-slate-300" /> : <Eye size={13} className="text-indigo-600" />}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 5. Base Strap Color Layer (Bottom Base) */}
        <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg hover:border-indigo-200 transition shadow-2xs">
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-lg border border-slate-300 flex items-center justify-center shrink-0 shadow-2xs"
              style={{
                background: design.lanyardColor?.includes('gradient')
                  ? 'linear-gradient(135deg, #4f46e5, #06b6d4)'
                  : (design.lanyardColor || '#ffffff'),
              }}
            >
              <Palette size={13} className={design.lanyardColor === '#ffffff' ? 'text-slate-400' : 'text-white'} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 truncate">Strap Base Color</span>
                <span className="text-[9px] font-semibold text-slate-400 uppercase">Base</span>
              </div>
              <p className="text-[10px] text-slate-500 font-mono truncate">
                {design.customColorCode?.toUpperCase() || design.lanyardColor || '#FFFFFF'} • {design.printingMethod}
              </p>
            </div>
            <div className="flex items-center gap-1">
              <input
                type="color"
                value={design.customColorCode || '#ffffff'}
                onChange={e => {
                  setField('lanyardColor', e.target.value);
                  setField('customColorCode', e.target.value);
                }}
                className="w-6 h-6 rounded cursor-pointer border-0 p-0 bg-transparent"
                title="Change Base Color"
              />
            </div>
          </div>
        </div>

      </div>

      {/* Footer Info */}
      <div className="p-3 border-t border-slate-100 bg-slate-50/50 text-[11px] text-slate-400 flex items-center justify-between">
        <span>Click any layer to select & configure</span>
        <span className="font-semibold text-indigo-600">Active</span>
      </div>
    </div>
  );
}
