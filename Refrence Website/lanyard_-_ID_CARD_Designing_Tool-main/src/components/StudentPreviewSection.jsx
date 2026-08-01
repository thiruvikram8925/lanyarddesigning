import React, { useState } from 'react';
import { useConfiguratorStore } from '../store/useConfiguratorStore';
import { CharacterCard } from './studentWear/PremiumCharacterPreview';
import studentBoy from '../assets/student-boy.png';
import studentGirl from '../assets/student-girl.png';
import ProceduralStudentScene from './studentWear/ProceduralStudentScene';
import LanyardStage from './LanyardStage';
import IdCardPreview from './IdCardPreview';
import { Upload } from 'lucide-react';
import { Stage, Layer, Group } from 'react-konva';

const TN_SHIRT_PATTERNS = [
  { id: '#ffffff', name: 'White', color: '#ffffff' },
  { id: '#add8e6', name: 'Light Blue', color: '#add8e6' },
  { id: 'tn_sky_check', name: 'Sky Check', color: '#87ceeb' },
  { id: '#808080', name: 'Grey', color: '#808080' },
];

const TextureUploader = ({ label, value, options, onChange, type }) => {
  const handleUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => onChange(event.target.result);
      reader.readAsDataURL(file);
    }
  };

  const renderSwatch = (pat, isUpload = false) => {
    const isSelected = value === (isUpload ? value : pat.id);
    const patternId = `upload-pat-${type}`;
    const fill = isUpload ? `url(#${patternId})` : pat.color;
    const strokeColor = isSelected ? '#4f46e5' : '#cbd5e1';
    const strokeWidth = isSelected ? '4' : '2';

    const SVGShape = () => {
      if (type === 'shirt') {
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-sm overflow-visible">
            {isUpload && (
              <defs>
                <pattern id={patternId} patternUnits="userSpaceOnUse" width="100" height="100">
                  <image href={value} width="100" height="100" preserveAspectRatio="none" />
                </pattern>
              </defs>
            )}
            <path d="M 30 10 Q 50 25 70 10 L 95 35 L 80 45 L 75 35 L 75 90 L 25 90 L 25 35 L 20 45 L 5 35 Z" fill={fill} stroke={strokeColor} strokeWidth={strokeWidth} strokeLinejoin="round" />
          </svg>
        );
      }

      return null;
    };

    return (
      <button
        key={isUpload ? 'upload' : pat.id}
        onClick={() => onChange(isUpload ? value : pat.id)}
        draggable={!isUpload}
        onDragStart={!isUpload ? (e) => e.dataTransfer.setData('application/pattern-url', pat.id) : undefined}
        title={isUpload ? 'Custom Upload' : pat.name}
        className={`w-full aspect-square transition-all ${!isUpload ? 'cursor-grab active:cursor-grabbing' : ''} ${isSelected ? 'scale-110 z-10' : 'opacity-85 hover:opacity-100 hover:scale-105'}`}
      >
        <SVGShape />
      </button>
    );
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-[13px] font-bold text-slate-700">{label} Pattern</label>
        <label className="cursor-pointer text-[11px] font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-2 py-1 rounded-lg flex items-center gap-1 transition-all">
          <Upload size={12} /> Upload
          <input type="file" accept="image/*" className="hidden" onChange={handleUpload} />
        </label>
      </div>
      
      <div className="grid grid-cols-5 gap-2 items-center">
        {options.map((pat) => renderSwatch(pat))}
        {value && !options.find(p => p.id === value) && renderSwatch(null, true)}
      </div>
    </div>
  );
};

export default function StudentPreviewSection() {
  const design = useConfiguratorStore(s => s.design);
  const setField = useConfiguratorStore(s => s.setField);
  const [activeTab, setActiveTab] = useState('male'); // 'male' or 'female'
  const [viewMode, setViewMode] = useState('3D'); // '2D' or '3D'
  const [isEditingFit, setIsEditingFit] = useState(false);
  const [editingPart, setEditingPart] = useState('shirt'); // 'shirt' or 'bottom'

  const uniform = design.uniformConfig[activeTab];

  const handleTrapLanyard = () => {
    const isEquipped = design.equippedState.lanyardEquipped;
    setField('equippedState.lanyardEquipped', !isEquipped);
    setField('equippedState.idCardEquipped', !isEquipped);
  };

  const handleScaleChange = (e) => {
    setField('equippedState.lanyardScale', parseFloat(e.target.value));
  };

  const { size } = design.idCard;
  const isHorizontal = size === '100x70';
  const cardW = isHorizontal ? 283 : (size === '70x100' ? 198 : 153);
  const cardH = isHorizontal ? 198 : (size === '70x100' ? 283 : 244);
  const cardScale = Math.min(100 / cardW, 100 / cardH) * 0.9;

  const isShirtColor = uniform.shirtTextureUrl?.startsWith('#');
  const bottomUrl = activeTab === 'male' ? uniform.pantTextureUrl : uniform.skirtTextureUrl;
  const isBottomColor = bottomUrl?.startsWith('#');

  return (
    <div className="flex flex-col lg:flex-row h-full w-full gap-6 overflow-hidden">
      
      {/* LEFT PANEL: 3D Preview */}
      <div className="flex-1 relative bg-[#e5e9f0] rounded-[32px] overflow-hidden shadow-inner border border-slate-300/50">
        <div className="absolute top-6 left-6 z-20">
          <div className="bg-white/80 backdrop-blur-md px-1.5 py-1.5 rounded-2xl border border-white/50 shadow-sm flex items-center gap-1">
            <button 
               onClick={() => setViewMode('3D')} 
               className={`px-4 py-2 text-[12px] font-bold rounded-xl transition-all ${viewMode === '3D' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:bg-white hover:text-slate-800'}`}
            >
              True 3D Model
            </button>
            <button 
               onClick={() => setViewMode('2D')} 
               className={`px-4 py-2 text-[12px] font-bold rounded-xl transition-all ${viewMode === '2D' ? 'bg-emerald-500 text-white shadow-sm' : 'text-slate-500 hover:bg-white hover:text-slate-800'}`}
            >
              2D Image Overlay
            </button>
          </div>
        </div>

        {viewMode === '3D' ? (
          <div className="w-full h-full relative cursor-move">
            <ProceduralStudentScene activeStudent={activeTab} />
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 bg-black/40 backdrop-blur-md rounded-full text-white/90 text-xs font-bold tracking-widest uppercase pointer-events-none">
              Drag to Rotate • Scroll to Zoom
            </div>
          </div>
        ) : (
          /* 2.5D Overlay Scene - Full View 3D Illusion */
          <div 
            className="absolute inset-0 flex items-end justify-center overflow-hidden bg-gradient-to-b from-[#f4f7ff] via-[#e3eaf6] to-[#d8e2f2] perspective-scene"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const patternUrl = e.dataTransfer.getData('application/pattern-url');
              if (patternUrl) {
                setField(`uniformConfig.${activeTab}.shirtTextureUrl`, patternUrl);
                setField(`uniformConfig.${activeTab}.pantTextureUrl`, patternUrl);
                setField(`uniformConfig.${activeTab}.skirtTextureUrl`, patternUrl);
              }
            }}
          >
            {/* 3D Floor Shadow */}
            <div className="absolute bottom-[-10px] left-1/2 -translate-x-1/2 w-[70%] h-[60px] bg-black/15 blur-2xl rounded-[100%] pointer-events-none z-0"></div>
            <div className="absolute bottom-[20px] left-1/2 -translate-x-1/2 w-[40%] h-[20px] bg-slate-800/20 blur-md rounded-[100%] pointer-events-none z-0"></div>

            <div className="w-[90%] max-w-[600px] aspect-square relative z-10 transform origin-bottom scale-[1.1] 2xl:scale-[1.25] mb-8">
              <div className="w-full h-full flex justify-center [&>.premium-char-card]:max-w-full [&>.premium-char-card]:w-full [&>.premium-char-card]:h-full [&_.premium-char-img-wrap]:h-[95%] [&_.premium-char-img-wrap]:w-full [&_.premium-char-img-wrap]:aspect-auto [&_.premium-char-img]:object-contain">
                <CharacterCard
                  characterImg={activeTab === 'male' ? studentBoy : studentGirl}
                  label={activeTab === 'male' ? 'Boy' : 'Girl'}
                  activeTab={activeTab}
                  isEditingFit={isEditingFit}
                  editingPart={editingPart}
                  lanyardColor={design.lanyardColor}
                  shirtColor={isShirtColor ? uniform.shirtTextureUrl : undefined}
                  shirtTextureUrl={!isShirtColor ? uniform.shirtTextureUrl : undefined}
                  bottomColor={isBottomColor ? bottomUrl : undefined}
                  bottomTextureUrl={!isBottomColor ? bottomUrl : undefined}
                  fontColor={design.fontColor}
                  customText={design.customTextCenter || design.customTextLeft}
                  idCardSize={design.idCard.size}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* RIGHT PANEL: Controls */}
      <div className="w-full lg:w-[400px] shrink-0 bg-white rounded-[32px] shadow-sm border border-slate-200 flex flex-col h-full overflow-hidden">
        <div className="flex flex-col p-5 border-b border-slate-100 bg-slate-50/50 gap-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-black text-slate-800 tracking-tight">Uniform Customizer</h2>
              <p className="text-[12px] text-slate-500 font-medium">Configure uniform and attach accessories</p>
            </div>
            <button 
               onClick={() => setIsEditingFit(!isEditingFit)}
               className={`px-3 py-1.5 text-[11px] font-bold rounded-lg border transition-all shadow-sm ${isEditingFit ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
            >
               {isEditingFit ? 'Finish Editing Fit' : 'Adjust Fit'}
            </button>
          </div>

          {isEditingFit && (
            <div className="flex flex-col gap-2 p-3 bg-indigo-50 rounded-xl border border-indigo-100">
               <span className="text-[11px] font-bold text-indigo-800 uppercase tracking-wider">Select Layer to Edit</span>
               <div className="flex gap-2">
                 <button onClick={() => setEditingPart('shirt')} className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${editingPart === 'shirt' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-white text-indigo-600 hover:bg-indigo-100 border border-indigo-200'}`}>Edit Shirt</button>
               </div>
               <p className="text-[10px] text-indigo-600 leading-tight mt-1">
                 Drag the glowing box to move the uniform. Drag the corners to resize it.
               </p>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-6 custom-scrollbar">
          
          {/* Gender Toggle */}
          <div className="flex p-1 bg-slate-100/50 rounded-2xl">
            <button
              className={`flex-1 py-2 text-sm font-bold rounded-xl transition-all ${activeTab === 'male' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              onClick={() => setActiveTab('male')}
            >
              Boy
            </button>
            <button
              className={`flex-1 py-2 text-sm font-bold rounded-xl transition-all ${activeTab === 'female' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              onClick={() => setActiveTab('female')}
            >
              Girl
            </button>
          </div>

          <div className="h-[1px] w-full bg-slate-100"></div>

          {/* Uniform Configuration */}
          <div className="space-y-6">
            <TextureUploader 
              label="Shirt"
              type="shirt"
              options={TN_SHIRT_PATTERNS}
              value={uniform.shirtTextureUrl} 
              onChange={(val) => setField(`uniformConfig.${activeTab}.shirtTextureUrl`, val)}
            />
          </div>

          <div className="h-[1px] w-full bg-slate-100"></div>

          {/* Lanyard & ID Card Section */}
          <div className="space-y-4">
            <h3 className="text-[13px] font-black uppercase tracking-widest text-slate-400">Lanyard & ID Card</h3>
            
            <div className="flex gap-4">
              <div className="w-[100px] h-[100px] bg-slate-50 rounded-xl border border-slate-200 flex flex-col items-center justify-center relative overflow-hidden shrink-0">
                <div className="transform scale-[0.4] origin-top pointer-events-none absolute top-2">
                  <LanyardStage stageRef={null} zoom={0.8} currentStep={3} />
                </div>
                <div className="absolute bottom-2 pointer-events-none">
                  <Stage width={100} height={100} scaleX={1} scaleY={1}>
                    <Layer>
                      <Group x={(100 - cardW * cardScale) / 2} y={10} scaleX={cardScale} scaleY={cardScale}>
                        <IdCardPreview isReviewStep={true} forceSide="front" />
                      </Group>
                    </Layer>
                  </Stage>
                </div>
              </div>

              <div className="flex-1 flex flex-col justify-center space-y-4">
                <button
                  onClick={handleTrapLanyard}
                  className={`w-full py-3 text-sm font-bold rounded-xl transition-all shadow-sm ${design.equippedState.lanyardEquipped ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}
                >
                  {design.equippedState.lanyardEquipped ? 'Untrap Lanyard' : 'Trap Lanyard to Character'}
                </button>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <label className="text-[12px] font-bold text-slate-600">Card Size</label>
                    <span className="text-[12px] font-bold text-slate-400">{Math.round(design.equippedState.lanyardScale * 100)}%</span>
                  </div>
                  <input 
                    type="range" 
                    min="0.5" 
                    max="1.5" 
                    step="0.05"
                    value={design.equippedState.lanyardScale}
                    onChange={handleScaleChange}
                    className="w-full accent-indigo-600"
                  />
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
