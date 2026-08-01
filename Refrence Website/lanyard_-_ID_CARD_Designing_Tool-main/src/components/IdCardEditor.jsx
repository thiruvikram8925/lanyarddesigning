import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Stage, Layer, Group } from 'react-konva';
import {
  Search, Filter, Type, Image as ImageIcon, Square, QrCode,
  MousePointer2, Eye, EyeOff, ChevronLeft, ChevronRight, Plus,
  Save, Download, X, Palette, Trash2, Upload
} from 'lucide-react';
import { useConfiguratorStore } from '../store/useConfiguratorStore';
import IdCardPreview from './IdCardPreview';
import PhotoEditor from './PhotoEditor';
import { cardSizes } from '../data/cardConfig';

export default function IdCardEditor({ onClose }) {
  const design = useConfiguratorStore((s) => s.design);
  const setField = useConfiguratorStore((s) => s.setField);
  const idCardState = design.idCard;

  const [activeTab, setActiveTab] = useState('front');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [orientationFilter, setOrientationFilter] = useState('all');
  const [selectedTool, setSelectedTool] = useState('select');
  const [livePreviewSide, setLivePreviewSide] = useState('front');
  const fileInputRef = useRef(null);
  const [pendingImageUpload, setPendingImageUpload] = useState(null);
  const [photoEditorSrc, setPhotoEditorSrc] = useState(null);
  const [editingElementId, setEditingElementId] = useState(null);

  // Template API State
  const [templates, setTemplates] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const containerRef = useRef(null);
  const [stageSize, setStageSize] = useState({ width: 600, height: 600 });

  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        setStageSize({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight,
        });
      }
    };
    window.addEventListener('resize', updateSize);
    updateSize();
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Sync activeTab to store's activeSide
  useEffect(() => {
    if (activeTab !== 'both') {
      setField('idCard.activeSide', activeTab);
    }
  }, [activeTab]);

  // When activeTab is 'both', set showBothSides in store
  useEffect(() => {
    setField('idCard.showBothSides', activeTab === 'both');
  }, [activeTab]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
    setTemplates([]);
    setHasMore(true);
  }, [orientationFilter, categoryFilter, searchTerm]);

  // Fetch templates whenever page or filters change
  useEffect(() => {
    const fetchTemplates = async () => {
      setLoading(true);
      try {
        let url = `/api/templates?page=${page}&limit=20`;
        if (orientationFilter !== 'all') url += `&orientation=${orientationFilter}`;
        if (categoryFilter !== 'All')    url += `&category=${encodeURIComponent(categoryFilter)}`;
        if (searchTerm)                  url += `&search=${encodeURIComponent(searchTerm)}`;

        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();

        const fetched = data.templates || [];
        setTemplates(prev => page === 1 ? fetched : [...prev, ...fetched]);
        setHasMore(fetched.length >= 20);
      } catch (err) {
        console.error('Error fetching templates:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchTemplates();
  }, [page, orientationFilter, categoryFilter, searchTerm]);

  const applyTemplate = (template) => {
    const ts = Date.now().toString() + Math.random().toString(36).substr(2, 5);
    const size = template.size || (template.orientation === 'horizontal' ? '100x70' : '54x86');
    setField('idCard.size', size);
    setField('idCard.front.backgroundColor', template.front.backgroundColor);
    
    let hubPhotoUsed = false;
    const processElements = (elements) => elements.map(el => {
      const newEl = { ...el, id: el.id.replace(/\${ts}/g, ts) };
      if (newEl.type === 'image' && !newEl.src && !hubPhotoUsed && idCardState.photoUrl) {
         newEl.src = idCardState.photoUrl;
         hubPhotoUsed = true;
      }
      return newEl;
    });

    setField('idCard.front.elements', processElements(template.front.elements));
    setField('idCard.back.backgroundColor', template.back.backgroundColor);
    setField('idCard.back.elements', processElements(template.back.elements));
  };

  const currentSide = activeTab === 'both' ? 'front' : activeTab;

  const handleUpdateText = (id, newContent) => {
    const elements = idCardState[currentSide].elements;
    setField(`idCard.${currentSide}.elements`, elements.map(el => el.id === id ? { ...el, content: newContent } : el));
  };

  const handleLayerVisibility = (id) => {
    const elements = idCardState[currentSide].elements;
    setField(`idCard.${currentSide}.elements`, elements.map(el => el.id === id ? { ...el, hidden: !el.hidden } : el));
  };

  const addTextElement = () => {
    const newEl = { id: `text-${Date.now()}`, type: 'text', content: 'New Text', x: 30, y: 30, fontSize: 14, fill: '#000000', fontFamily: 'Montserrat', width: 120 };
    setField(`idCard.${currentSide}.elements`, [...idCardState[currentSide].elements, newEl]);
    setField('idCard.selected', newEl.id);
    setSelectedTool('select');
  };

  const addImageElement = () => {
    setPendingImageUpload('new');
    if (fileInputRef.current) fileInputRef.current.click();
  };

  const addLogoElement = () => {
    setPendingImageUpload('logo');
    if (fileInputRef.current) fileInputRef.current.click();
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setPhotoEditorSrc(event.target.result);
    };
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const addRectElement = () => {
    const newEl = { id: `rect-${Date.now()}`, type: 'rect', x: 20, y: 20, width: 60, height: 60, fill: '#f1f5f9', stroke: '#cbd5e1', strokeWidth: 1 };
    setField(`idCard.${currentSide}.elements`, [...idCardState[currentSide].elements, newEl]);
    setField('idCard.selected', newEl.id);
    setSelectedTool('select');
  };

  const changeBackground = () => {
    const colors = ['#ffffff', '#f8fafc', '#fef3c7', '#dbeafe', '#fce7f3', '#d1fae5', '#ede9fe', '#1e293b'];
    const current = idCardState[currentSide].backgroundColor || '#ffffff';
    const idx = colors.indexOf(current);
    const next = colors[(idx + 1) % colors.length];
    setField(`idCard.${currentSide}.backgroundColor`, next);
  };

  const handleToolClick = (toolId) => {
    setSelectedTool(toolId);
    switch (toolId) {
      case 'text': addTextElement(); break;
      case 'image': addImageElement(); break;
      case 'logo': addLogoElement(); break;
      case 'bg': changeBackground(); break;
      case 'qr': addRectElement(); break;
      default: break;
    }
  };

  // Card dimensions
  const size = idCardState.size;
  const isHorizontal = size === '100x70';
  const cardW = isHorizontal ? 283 : (size === '70x100' ? 198 : 153);
  const cardH = isHorizontal ? 198 : (size === '70x100' ? 283 : 244);
  const gap = 40;

  const cardCount = activeTab === 'both' ? 2 : 1;
  const totalW = isHorizontal ? cardW : ((cardW * cardCount) + (gap * (cardCount - 1)));
  const totalH = (isHorizontal && activeTab === 'both') ? ((cardH * 2) + gap) : cardH;

  // Scale card down so it fits nicely (max 1.5x instead of 2.2x)
  const maxScale = 1.5;
  const cardScale = Math.min(Math.min((stageSize.width - 160) / totalW, (stageSize.height - 120) / totalH), maxScale);
  const cx = (stageSize.width - totalW * cardScale) / 2;
  const cy = (stageSize.height - totalH * cardScale) / 2;

  // Appearance: read actual background color from current side
  const bgColor = idCardState[currentSide].backgroundColor || '#ffffff';

  return (
    <div className="fixed inset-0 z-[99999] flex bg-[#f8faff] overflow-hidden font-sans">
      <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />

      {photoEditorSrc && (
        <PhotoEditor
          initialImageSrc={photoEditorSrc}
          onClose={() => {
            setPhotoEditorSrc(null);
            setPendingImageUpload(null);
            setEditingElementId(null);
          }}
          onSave={(editedSrc) => {
            if (editingElementId) {
               // Update existing element
               const elements = idCardState[currentSide].elements;
               setField(`idCard.${currentSide}.elements`, elements.map(el => el.id === editingElementId ? { ...el, src: editedSrc } : el));
            } else {
               // Add new element
               const isLogo = pendingImageUpload === 'logo';
               const newEl = {
                 id: `image-${Date.now()}`, type: 'image', x: 20, y: 20,
                 width: isLogo ? 40 : 80, height: isLogo ? 40 : 80, src: editedSrc
               };
               setField(`idCard.${currentSide}.elements`, [...idCardState[currentSide].elements, newEl]);
               setField('idCard.selected', newEl.id);
            }
            setPhotoEditorSrc(null);
            setPendingImageUpload(null);
            setEditingElementId(null);
            setSelectedTool('select');
          }}
        />
      )}

      {/* 1. Left Sidebar: Templates */}
      <div className="w-[280px] bg-white border-r border-slate-200 flex flex-col shrink-0 z-20">
        <div className="p-4 border-b border-slate-100 flex items-center gap-3">
          <button onClick={onClose} className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-all">
            <X size={16} />
          </button>
          <div>
            <h2 className="text-[14px] font-black tracking-tight text-slate-900">Templates</h2>
            <p className="text-[10px] text-slate-500 font-medium">{(templates || []).length} designs</p>
          </div>
        </div>
        {/* Sticky Filters Section */}
        <div className="p-3 border-b border-slate-100 flex flex-col gap-3 bg-white">
          <div className="relative flex items-center">
            <div className="absolute left-3 text-slate-400"><Search size={14} /></div>
            <input type="text" placeholder="Search templates..." value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-2 bg-[#f8faff] border border-slate-200 rounded-xl text-[12px] outline-none focus:border-indigo-500 transition-all" />
          </div>

          {/* Orientation Filter */}
          <div className="flex gap-1 bg-slate-50 rounded-lg p-0.5">
            {[{ id: 'all', label: 'All' }, { id: 'horizontal', label: '⬜ Horizontal' }, { id: 'vertical', label: '▯ Vertical' }].map(o => (
              <button key={o.id} onClick={() => setOrientationFilter(o.id)}
                className={`flex-1 py-1 rounded-md text-[9px] font-bold transition-all ${
                  orientationFilter === o.id ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}>{o.label}</button>
            ))}
          </div>

          {/* Category Filter */}
          <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-hide">
            {['All', 'Corporate', 'Modern', 'Creative', 'Tech', 'Education', 'Medical', 'Event', 'Government'].map(cat => (
              <button key={cat} onClick={() => setCategoryFilter(cat)}
                className={`px-2 py-1 rounded-full text-[9px] font-bold whitespace-nowrap transition-all ${
                  categoryFilter === cat ? 'bg-indigo-600 text-white shadow-md' : 'bg-white border border-slate-200 text-slate-600 hover:border-indigo-300'
                }`}>{cat}</button>
            ))}
          </div>
        </div>

        {/* Scrollable Templates Grid */}
        <div className="p-3 overflow-y-auto flex-1 custom-scrollbar flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-2">
            {(templates || []).map(template => {
              const isHoriz = template.orientation === 'horizontal';
              const cardW = isHoriz ? 270 : 170;
              const cardH = isHoriz ? 170 : 270;
              const previewW = 110;
              const previewScale = previewW / cardW;
              const previewH = cardH * previewScale;
              const bgColor = template.front?.backgroundColor || '#ffffff';

              return (
                <button key={template.id} onClick={() => applyTemplate(template)}
                  className="group rounded-xl border border-slate-100 bg-white p-1.5 text-left hover:border-indigo-500 hover:shadow-lg transition-all active:scale-[0.97]">
                  <div className="w-full flex items-center justify-center rounded-lg overflow-hidden mb-1.5" style={{ background: '#f1f5f9', minHeight: isHoriz ? 58 : 85 }}>
                    <div style={{ width: previewW, height: previewH, position: 'relative', overflow: 'hidden', borderRadius: 6, background: bgColor, boxShadow: '0 1px 4px rgba(0,0,0,0.12)' }}>
                      {template.front?.elements?.map((el, idx) => {
                        const style = {
                          position: 'absolute',
                          left: el.x * previewScale,
                          top: el.y * previewScale,
                          width: (el.width || 0) * previewScale,
                          height: (el.height || 0) * previewScale,
                        };
                        if (el.type === 'rect') {
                          return <div key={idx} style={{ ...style, background: el.fill === 'transparent' ? 'transparent' : (el.fill || '#ccc'), borderRadius: (el.cornerRadius || 0) * previewScale, border: el.stroke ? `${(el.strokeWidth||1)*previewScale}px solid ${el.stroke}` : 'none' }} />;
                        }
                        if (el.type === 'text') {
                          return <div key={idx} style={{ ...style, fontSize: Math.max(4, (el.fontSize || 10) * previewScale), fontWeight: el.fontStyle === 'bold' ? 700 : 400, color: el.fill || '#000', textAlign: el.align || 'left', lineHeight: 1.1, overflow: 'hidden', whiteSpace: 'nowrap' }}>{el.content}</div>;
                        }
                        if (el.type === 'image' && el.src) {
                          return <img key={idx} src={el.src} alt="" style={{ ...style, objectFit: 'cover', borderRadius: (el.cornerRadius || 0) * previewScale }} crossOrigin="anonymous" />;
                        }
                        if (el.type === 'image' && !el.src) {
                          return <div key={idx} style={{ ...style, background: '#e2e8f0', borderRadius: (el.cornerRadius || 0) * previewScale, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={{fontSize: 6, color: '#94a3b8'}}>📷</span></div>;
                        }
                        return null;
                      })}
                    </div>
                  </div>
                  <div className="px-0.5">
                    <div className="text-[8px] font-bold text-slate-800 truncate leading-tight">{template.name}</div>
                    <div className="text-[7px] text-slate-400 capitalize leading-tight">{template.category} · {template.orientation}</div>
                  </div>
                </button>
              );
            })}
          </div>
          {hasMore && (
            <button 
              onClick={() => setPage(p => p + 1)} 
              disabled={loading}
              className="mt-2 w-full py-2 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-bold hover:bg-indigo-100 disabled:opacity-50 transition-all">
              {loading ? 'Loading...' : 'Load More'}
            </button>
          )}
        </div>
      </div>

      {/* 2. Center: Canvas Area */}
      <div className="flex-1 flex flex-col relative bg-[#f0f2f5]">
        {/* Top Controls */}
        <div className="h-14 border-b border-slate-200/60 bg-white/80 backdrop-blur-md flex items-center justify-center gap-4 z-10 px-6">
          <div className="flex bg-white border border-slate-200 rounded-xl p-1 shadow-sm">
            {['front', 'back', 'both'].map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`px-4 py-1.5 rounded-lg text-[12px] font-bold capitalize transition-all ${
                  activeTab === tab ? 'bg-indigo-50 text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                }`}>
                {tab === 'both' ? 'Both Sides' : tab}
              </button>
            ))}
          </div>
        </div>

        {/* Floating Toolbar */}
        <div className="absolute left-5 top-1/2 -translate-y-1/2 bg-white rounded-2xl shadow-xl border border-slate-100 p-1.5 flex flex-col gap-1 z-20">
          {[
            { id: 'select', icon: MousePointer2, label: 'Select' },
            { id: 'text', icon: Type, label: 'Text' },
            { id: 'image', icon: ImageIcon, label: 'Image' },
            { id: 'logo', icon: Palette, label: 'Logo' },
            { id: 'bg', icon: Square, label: 'BG' },
            { id: 'qr', icon: QrCode, label: 'Shape' },
          ].map(tool => (
            <button key={tool.id} onClick={() => handleToolClick(tool.id)} title={tool.label}
              className={`w-10 h-10 flex flex-col items-center justify-center rounded-xl transition-all ${
                selectedTool === tool.id ? 'bg-indigo-100 text-indigo-700' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-700'
              }`}>
              <tool.icon size={15} strokeWidth={selectedTool === tool.id ? 2.5 : 2} />
              <span className="text-[7px] font-black uppercase mt-0.5">{tool.label}</span>
            </button>
          ))}
        </div>

        {/* Canvas */}
        <div className="flex-1 relative" ref={containerRef}>
          <Stage width={stageSize.width} height={stageSize.height}>
            <Layer>
              <Group x={cx} y={cy} scaleX={cardScale} scaleY={cardScale}>
                <IdCardPreview
                  isReviewStep={false}
                  forceSide={activeTab === 'both' ? null : activeTab}
                  onSelectElement={(id, sideName) => {
                    setField('idCard.selected', id);
                    if (sideName) setField('idCard.activeSide', sideName);
                  }}
                  onUpdateElement={(id, pos, sideName) => {
                    const side = sideName || currentSide;
                    const elements = idCardState[side].elements;
                    setField(`idCard.${side}.elements`, elements.map(el => el.id === id ? { ...el, ...pos } : el));
                  }}
                  onDblClickElement={(id, sideName, e) => {
                    const side = sideName || currentSide;
                    const el = idCardState[side].elements.find(el => el.id === id);
                    if (el && el.type === 'image' && el.src) {
                      setEditingElementId(id);
                      setPhotoEditorSrc(el.src);
                    } else if (el && el.type === 'image' && !el.src) {
                      setPendingImageUpload('replace-' + id + '-' + side);
                      if (fileInputRef.current) fileInputRef.current.click();
                    }
                  }}
                />
              </Group>
            </Layer>
          </Stage>
        </div>

        {/* Bottom bar */}
        <div className="h-12 border-t border-slate-200/60 bg-white/80 backdrop-blur-md flex items-center justify-center gap-4 z-10 px-6">
          <div className="text-[11px] text-slate-400 font-bold">
            Size: {idCardState.size} • Side: {currentSide} • Elements: {idCardState[currentSide].elements.length}
          </div>
        </div>
      </div>

      {/* 3. Right Sidebar: Properties */}
      <div className="w-[300px] bg-white border-l border-slate-200 flex flex-col shrink-0 z-20">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="text-[14px] font-black tracking-tight text-slate-900">Properties</div>
          <button onClick={onClose} className="px-3 py-1.5 bg-indigo-600 text-white font-bold text-[11px] rounded-xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all">
            Done
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-6 custom-scrollbar">
          
          <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3 text-[10px] text-indigo-800 font-medium shadow-sm">
            <strong>Important:</strong> ID card designs must be kept within the safe design box area. To adjust shape/image corners, please adjust the corner directly on the canvas rather than using sliders.
          </div>

          {/* Live Preview with clickable front/back */}
          {(() => {
            const previewW = 120;
            const previewH = Math.round(previewW * (cardH / cardW));
            const scaleVal = previewW / cardW;
            return (
              <div>
                <h3 className="text-[11px] font-black text-slate-800 mb-2 uppercase tracking-tight">Live Preview</h3>
                <div className="flex gap-3">
                  <div className="flex-1 flex flex-col items-center gap-1.5 cursor-pointer" onClick={() => { setLivePreviewSide('front'); setActiveTab('front'); }}>
                    <div className={`text-[9px] font-bold uppercase tracking-widest pb-1 w-full text-center transition-all ${livePreviewSide === 'front' ? 'text-indigo-600 border-b-2 border-indigo-500' : 'text-slate-400'}`}>Front</div>
                    <div className={`w-full bg-slate-50 rounded-lg shadow-sm border overflow-hidden ${livePreviewSide === 'front' ? 'border-indigo-400 ring-2 ring-indigo-100' : 'border-slate-200'}`} style={{ height: previewH }}>
                      <Stage width={previewW} height={previewH} scaleX={scaleVal} scaleY={scaleVal}>
                        <Layer><IdCardPreview forceSide="front" isReviewStep={true} onSelectElement={() => {}} onUpdateElement={() => {}} /></Layer>
                      </Stage>
                    </div>
                  </div>
                  <div className="flex-1 flex flex-col items-center gap-1.5 cursor-pointer" onClick={() => { setLivePreviewSide('back'); setActiveTab('back'); }}>
                    <div className={`text-[9px] font-bold uppercase tracking-widest pb-1 w-full text-center transition-all ${livePreviewSide === 'back' ? 'text-indigo-600 border-b-2 border-indigo-500' : 'text-slate-400'}`}>Back</div>
                    <div className={`w-full bg-slate-50 rounded-lg shadow-sm border overflow-hidden ${livePreviewSide === 'back' ? 'border-indigo-400 ring-2 ring-indigo-100' : 'border-slate-200'}`} style={{ height: previewH }}>
                      <Stage width={previewW} height={previewH} scaleX={scaleVal} scaleY={scaleVal}>
                        <Layer><IdCardPreview forceSide="back" isReviewStep={true} onSelectElement={() => {}} onUpdateElement={() => {}} /></Layer>
                      </Stage>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Edit Content */}
          <div>
            <h3 className="text-[11px] font-black text-slate-800 mb-3 uppercase tracking-tight">Edit Content</h3>
            <div className="flex flex-col gap-2">
              {(() => {
                const textElements = idCardState[currentSide].elements.filter(el => el.type === 'text');
                if (textElements.length === 0) return <div className="text-[11px] text-slate-400 italic">No text elements on this side.</div>;
                return textElements.map((el, i) => (
                  <div key={el.id}>
                    <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">{el.content?.substring(0, 15) || `Field ${i+1}`}</label>
                    <div className="flex gap-1.5">
                      <input type="text" value={el.content} onChange={(e) => handleUpdateText(el.id, e.target.value)}
                        className="flex-1 px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-[11px] font-medium text-slate-800 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-100 transition-all" />
                      <button onClick={() => {
                        setField(`idCard.${currentSide}.elements`, idCardState[currentSide].elements.filter(e => e.id !== el.id));
                        if (idCardState.selected === el.id) setField('idCard.selected', null);
                      }} className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"><Trash2 size={12} /></button>
                    </div>
                  </div>
                ));
              })()}
              <button onClick={addTextElement}
                className="mt-1 flex items-center justify-center gap-1.5 w-full py-2 bg-indigo-50 text-indigo-600 font-bold text-[10px] rounded-lg hover:bg-indigo-100 transition-all">
                <Plus size={12} /> Add Text Field
              </button>
            </div>
          </div>

          {/* Appearance */}
          <div>
            <h3 className="text-[11px] font-black text-slate-800 mb-3 uppercase tracking-tight">Appearance</h3>
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 transition-all">
                <span className="text-[11px] font-bold text-slate-600">Background</span>
                <div className="flex items-center gap-2">
                  <input type="color" value={bgColor} onChange={(e) => setField(`idCard.${currentSide}.backgroundColor`, e.target.value)}
                    className="w-6 h-6 rounded-full border border-slate-200 cursor-pointer p-0" />
                  <span className="text-[9px] font-mono text-slate-400">{bgColor}</span>
                </div>
              </div>
              {/* Quick color swatches */}
              <div className="flex gap-1.5 flex-wrap px-2">
                {['#ffffff', '#f8fafc', '#1e293b', '#1d4ed8', '#dc2626', '#059669', '#7c3aed', '#f59e0b'].map(c => (
                  <button key={c} onClick={() => setField(`idCard.${currentSide}.backgroundColor`, c)}
                    className={`w-6 h-6 rounded-full border-2 transition-all ${bgColor === c ? 'border-indigo-500 scale-110' : 'border-slate-200 hover:border-slate-400'}`}
                    style={{ background: c }} />
                ))}
              </div>
            </div>
          </div>

          {/* Layers */}
          <div>
            <h3 className="text-[11px] font-black text-slate-800 mb-3 uppercase tracking-tight">Layers ({currentSide})</h3>
            <div className="flex flex-col gap-1.5">
              {(() => {
                const elements = [...idCardState[currentSide].elements].reverse();
                if (elements.length === 0) return <div className="text-[11px] text-slate-400 italic">No elements on this side.</div>;
                return elements.map(el => (
                  <div key={el.id}
                    onClick={() => setField('idCard.selected', el.id)}
                    className={`flex items-center justify-between p-2 rounded-lg border cursor-pointer transition-all ${
                      idCardState.selected === el.id ? 'bg-indigo-50 border-indigo-300' : 'bg-slate-50 border-slate-100 hover:border-slate-300'
                    }`}>
                    <div className="flex items-center gap-2">
                      <div className="text-slate-400">
                        {el.type === 'text' ? <Type size={11} /> : el.type === 'image' ? <ImageIcon size={11} /> : <Square size={11} />}
                      </div>
                      <span className="text-[10px] font-bold text-slate-700 capitalize truncate max-w-[120px]">
                        {el.type === 'text' ? `"${(el.content || '').substring(0, 12)}"` : el.type}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={(e) => { e.stopPropagation(); handleLayerVisibility(el.id); }}
                        className="p-1 text-slate-400 hover:text-slate-700 rounded">
                        {el.hidden ? <EyeOff size={12} /> : <Eye size={12} />}
                      </button>
                      <button onClick={(e) => {
                        e.stopPropagation();
                        setField(`idCard.${currentSide}.elements`, idCardState[currentSide].elements.filter(e => e.id !== el.id));
                        if (idCardState.selected === el.id) setField('idCard.selected', null);
                      }} className="p-1 text-slate-400 hover:text-red-500 rounded">
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                ));
              })()}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
