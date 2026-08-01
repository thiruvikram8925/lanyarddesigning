import { useEffect, useRef, useState } from 'react';
import { Stage, Layer, Rect, Text as KonvaText, Circle, Transformer, RegularPolygon, Star, Ring, Path, Ellipse, Line } from 'react-konva';
import { useIdCardDesignerStore } from '../../store/useIdCardDesignerStore';
import { ZoomIn, ZoomOut, Maximize, RotateCw, Copy, Expand, Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, ArrowUpToLine, ArrowDownToLine, Trash2, ChevronDown, ChevronUp, Strikethrough } from 'lucide-react';

const MM_TO_PX = 3.7795275591; // 1 mm = 3.78px approx

function ElementRenderer({ element, isSelected, onSelect }) {
  const shapeRef = useRef();
  const trRef = useRef();

  useEffect(() => {
    if (isSelected && trRef.current && shapeRef.current) {
      trRef.current.nodes([shapeRef.current]);
      trRef.current.getLayer().batchDraw();
    }
  }, [isSelected]);

  const commonProps = {
    onClick: () => onSelect(element.id),
    onTap: () => onSelect(element.id),
    ref: shapeRef,
    draggable: true,
    x: element.x,
    y: element.y,
    fill: element.fill,
    stroke: element.stroke || null,
    strokeWidth: element.strokeWidth || 0,
    opacity: element.opacity,
    onDragEnd: (e) => {
      useIdCardDesignerStore.getState().updateElement(element.id, {
        x: e.target.x(),
        y: e.target.y(),
      });
    },
    onTransformEnd: (e) => {
      const node = shapeRef.current;
      const scaleX = node.scaleX();
      const scaleY = node.scaleY();
      node.scaleX(1);
      node.scaleY(1);
      
      let newProps = {
        x: node.x(),
        y: node.y(),
        rotation: node.rotation(),
      };

      if (element.type === 'shape' || element.type === 'qrcode') {
        newProps.width = Math.max(5, node.width() * scaleX);
        newProps.height = Math.max(5, node.height() * scaleY);
      }
      if (element.type === 'text') {
        newProps.fontSize = Math.max(5, node.fontSize() * scaleX);
        newProps.width = Math.max(10, node.width() * scaleX);
      }
      
      useIdCardDesignerStore.getState().updateElement(element.id, newProps);
    }
  };

  let NodeComponent = null;

  if (element.type === 'text') {
    let fontStyle = 'normal';
    const isBold = element.isBold || element.fontWeight === 'bold' || element.fontWeight === '600';
    const isItalic = element.isItalic;
    
    if (isBold && isItalic) fontStyle = 'bold italic';
    else if (isBold) fontStyle = 'bold';
    else if (isItalic) fontStyle = 'italic';

    NodeComponent = (
      <KonvaText 
        {...commonProps} 
        text={element.text} 
        fontSize={element.fontSize} 
        fontFamily={element.fontFamily || 'Inter'}
        fontStyle={fontStyle}
        textDecoration={[
          element.isUnderline ? 'underline' : '',
          element.isStrikethrough ? 'line-through' : ''
        ].filter(Boolean).join(' ')}
        align={element.align || 'left'}
        width={element.width}
        letterSpacing={element.letterSpacing || 0}
        lineHeight={element.lineHeight || 1}
      />
    );
  } else if (element.type === 'shape') {
    const st = element.shapeType;
    const w = element.width || 50;
    const h = element.height || 50;
    const r = w / 2;

    if (st === 'rect') {
      NodeComponent = <Rect {...commonProps} width={w} height={h} />;
    } else if (st === 'rounded_rect') {
      NodeComponent = <Rect {...commonProps} width={w} height={h} cornerRadius={element.cornerRadius || 10} />;
    } else if (st === 'circle') {
      NodeComponent = <Circle {...commonProps} radius={r} offsetX={-r} offsetY={-r} />;
    } else if (st === 'ellipse') {
      NodeComponent = <Ellipse {...commonProps} radiusX={w / 2} radiusY={h / 2} offsetX={-w / 2} offsetY={-h / 2} />;
    } else if (st === 'triangle') {
      NodeComponent = <RegularPolygon {...commonProps} sides={3} radius={r} offsetX={-r} offsetY={-r} />;
    } else if (st === 'diamond') {
      NodeComponent = <RegularPolygon {...commonProps} sides={4} radius={r} rotation={45} offsetX={-r} offsetY={-r} />;
    } else if (st === 'pentagon') {
      NodeComponent = <RegularPolygon {...commonProps} sides={5} radius={r} offsetX={-r} offsetY={-r} />;
    } else if (st === 'hexagon') {
      NodeComponent = <RegularPolygon {...commonProps} sides={6} radius={r} offsetX={-r} offsetY={-r} />;
    } else if (st === 'octagon') {
      NodeComponent = <RegularPolygon {...commonProps} sides={8} radius={r} offsetX={-r} offsetY={-r} />;
    } else if (st === 'star') {
      NodeComponent = <Star {...commonProps} numPoints={5} innerRadius={r * 0.4} outerRadius={r} offsetX={-r} offsetY={-r} />;
    } else if (st === 'burst_star') {
      NodeComponent = <Star {...commonProps} numPoints={8} innerRadius={r * 0.6} outerRadius={r} offsetX={-r} offsetY={-r} />;
    } else if (st === 'ring') {
      NodeComponent = <Ring {...commonProps} innerRadius={r * 0.5} outerRadius={r} offsetX={-r} offsetY={-r} />;
    } else if (st === 'line') {
      NodeComponent = <Line {...commonProps} points={[0, h / 2, w, h / 2]} stroke={element.fill} strokeWidth={element.strokeWidth || 3} />;
    } else if (st === 'heart') {
      const scaleX = w / 100;
      const scaleY = h / 100;
      NodeComponent = <Path {...commonProps} data="M 50 30 C 50 15, 20 10, 10 35 C 0 60, 40 80, 50 95 C 60 80, 100 60, 90 35 C 80 10, 50 15, 50 30 Z" scaleX={scaleX} scaleY={scaleY} />;
    } else if (st === 'shield') {
      const scaleX = w / 100;
      const scaleY = h / 100;
      NodeComponent = <Path {...commonProps} data="M 10 10 L 90 10 L 90 50 C 90 75 50 95 50 95 C 50 95 10 75 10 50 Z" scaleX={scaleX} scaleY={scaleY} />;
    } else if (st === 'badge') {
      const scaleX = w / 100;
      const scaleY = h / 100;
      NodeComponent = <Path {...commonProps} data="M 20 10 L 80 10 L 80 85 L 50 70 L 20 85 Z" scaleX={scaleX} scaleY={scaleY} />;
    } else if (st === 'arrow') {
      const scaleX = w / 100;
      const scaleY = h / 100;
      NodeComponent = <Path {...commonProps} data="M 10 35 L 65 35 L 65 15 L 95 50 L 65 85 L 65 65 L 10 65 Z" scaleX={scaleX} scaleY={scaleY} />;
    } else if (st === 'speech') {
      const scaleX = w / 100;
      const scaleY = h / 100;
      NodeComponent = <Path {...commonProps} data="M 10 10 L 90 10 Q 98 10 98 18 L 98 60 Q 98 68 90 68 L 40 68 L 20 88 L 25 68 L 10 68 Q 2 68 2 60 L 2 18 Q 2 10 10 10 Z" scaleX={scaleX} scaleY={scaleY} />;
    } else {
      NodeComponent = <Rect {...commonProps} width={w} height={h} />;
    }
  } else if (element.type === 'qrcode') {
    NodeComponent = (
      <Rect {...commonProps} width={element.width} height={element.height} fill={element.background} stroke={element.fill} strokeWidth={2} />
    );
  }

  return (
    <>
      {NodeComponent}
      {isSelected && (
        <Transformer
          ref={trRef}
          boundBoxFunc={(oldBox, newBox) => {
            if (newBox.width < 5 || newBox.height < 5) {
              return oldBox;
            }
            return newBox;
          }}
        />
      )}
    </>
  );
}

export default function CenterWorkspace({ stageRef }) {
  const activeSide = useIdCardDesignerStore(s => s.activeSide);
  const { 
    setActiveSide, 
    flipCard,
    copyFrontToBack,
    zoom, 
    setZoom, 
    cardSettings, 
    frontElements, 
    backElements, 
    selectedId, 
    selectElement,
    updateElement,
    addElement,
    removeElement,
    bringForward,
    sendBackward,
    bringToFront,
    sendToBack
  } = useIdCardDesignerStore();

  const containerRef = useRef(null);

  // Card dimensions in pixels
  const cardWidth = cardSettings.width * MM_TO_PX;
  const cardHeight = cardSettings.height * MM_TO_PX;

  const elements = activeSide === 'front' ? frontElements : backElements;

  const handleStageClick = (e) => {
    // Clicked on stage (empty area)
    if (e.target === e.target.getStage() || e.target.attrs.id === 'card-bg') {
      selectElement(null);
    }
  };

  const handleFitToScreen = () => {
    if (containerRef.current) {
      const containerWidth = containerRef.current.clientWidth - 100;
      const containerHeight = containerRef.current.clientHeight - 120;
      if (containerWidth > 0 && containerHeight > 0) {
        const scaleX = containerWidth / cardWidth;
        const scaleY = containerHeight / cardHeight;
        const fitZoom = Math.min(scaleX, scaleY);
        setZoom(Math.max(0.3, Math.min(2.5, Number(fitZoom.toFixed(2)))));
        return;
      }
    }
    setZoom(1);
  };

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
    }
  };

  const selectedElement = elements.find(el => el.id === selectedId);

  const handleDuplicate = () => {
    if (!selectedElement) return;
    const newElement = {
      ...selectedElement,
      id: `${selectedElement.type}_${Date.now()}`,
      x: selectedElement.x + 15,
      y: selectedElement.y + 15,
    };
    addElement(newElement);
  };

  const handleDelete = () => {
    if (!selectedId) return;
    removeElement(selectedId);
  };

  const handleCaseToggle = () => {
    if (!selectedElement || selectedElement.type !== 'text') return;
    const currentText = selectedElement.text || '';
    let newText = currentText;
    if (currentText === currentText.toUpperCase()) {
      newText = currentText.toLowerCase();
    } else if (currentText === currentText.toLowerCase()) {
      newText = currentText.replace(/\b\w/g, c => c.toUpperCase());
    } else {
      newText = currentText.toUpperCase();
    }
    updateElement(selectedId, { text: newText });
  };

  return (
    <div className="flex-1 bg-slate-100 relative flex flex-col items-center justify-center overflow-hidden">
      
      {/* Top Toolbar (Tabs & Zoom) */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-2.5 bg-white p-1.5 rounded-2xl border border-slate-200 z-10 shadow-md whitespace-nowrap shrink-0 max-w-max select-none">
        {/* Side Switcher Tabs */}
        <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1 shrink-0">
          <button 
            onClick={() => setActiveSide('front')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
              activeSide === 'front' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span className="whitespace-nowrap">Front Side</span>
            <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-extrabold flex items-center justify-center leading-none ${activeSide === 'front' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'}`}>
              {frontElements.length}
            </span>
          </button>
          
          <button 
            onClick={() => setActiveSide('back')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
              activeSide === 'back' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span className="whitespace-nowrap">Back Side</span>
            <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-extrabold flex items-center justify-center leading-none ${activeSide === 'back' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'}`}>
              {backElements.length}
            </span>
          </button>
        </div>

        {/* Flip Action */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={flipCard}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-all cursor-pointer whitespace-nowrap shrink-0"
            title="Flip Card (Toggle Front/Back)"
          >
            <RotateCw className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
            <span className="whitespace-nowrap">Flip</span>
          </button>
        </div>
        
        <div className="w-px h-5 bg-slate-200 shrink-0 mx-0.5" />

        {/* Zoom & Full Size Controls */}
        <div className="flex items-center gap-1 shrink-0">
          <button onClick={() => setZoom(Math.max(0.2, Number((zoom - 0.1).toFixed(2))))} className="p-1.5 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors shrink-0 cursor-pointer" title="Zoom Out">
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-xs font-mono font-semibold w-11 text-center text-slate-700 whitespace-nowrap shrink-0">{Math.round(zoom * 100)}%</span>
          <button onClick={() => setZoom(Math.min(3, Number((zoom + 0.1).toFixed(2))))} className="p-1.5 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors shrink-0 cursor-pointer" title="Zoom In">
            <ZoomIn className="w-4 h-4" />
          </button>
          <button onClick={handleFitToScreen} className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200/80 text-indigo-700 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1" title="Fit Card to Screen Size">
            <Maximize className="w-3.5 h-3.5 text-indigo-600" />
            <span className="whitespace-nowrap">Full Size</span>
          </button>
          <button onClick={toggleFullScreen} className="p-1.5 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors shrink-0 cursor-pointer" title="Toggle Window Fullscreen">
            <Expand className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Floating Contextual Formatting Bar */}
      {selectedElement && (
        <div className="absolute top-[76px] left-1/2 -translate-x-1/2 flex items-center gap-2 bg-white/95 backdrop-blur-md px-3.5 py-1.5 border border-slate-200/90 rounded-2xl shadow-xl z-20 transition-all select-none max-w-[90vw] overflow-x-auto scrollbar-none animate-in fade-in slide-in-from-top-2 duration-200">
          
          {/* TEXT CONTROLS */}
          {selectedElement.type === 'text' && (
            <>
              {/* Font Family */}
              <select 
                value={selectedElement.fontFamily || 'Inter'} 
                onChange={(e) => updateElement(selectedId, { fontFamily: e.target.value })} 
                className="bg-slate-50 border border-slate-200 text-slate-700 rounded-lg px-2 py-1 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer h-7"
              >
                <option value="Inter">Inter</option>
                <option value="Roboto">Roboto</option>
                <option value="Arial">Arial</option>
                <option value="Times New Roman">Times New Roman</option>
                <option value="Georgia">Georgia</option>
                <option value="Playfair Display">Playfair</option>
                <option value="Fira Code">Fira Code</option>
                <option value="Outfit">Outfit</option>
              </select>

              {/* Font Size */}
              <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-slate-50 shrink-0 h-7">
                <button 
                  onClick={() => updateElement(selectedId, { fontSize: Math.max(5, (selectedElement.fontSize || 12) - 1) })} 
                  className="px-2 hover:bg-slate-200 text-xs font-bold text-slate-600 transition-colors h-full flex items-center"
                >-</button>
                <input 
                  type="number" 
                  value={Math.round(selectedElement.fontSize || 12)} 
                  onChange={(e) => updateElement(selectedId, { fontSize: Math.max(5, Number(e.target.value)) })} 
                  className="w-8 bg-transparent text-center text-xs font-bold text-slate-700 outline-none h-full border-none p-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" 
                />
                <button 
                  onClick={() => updateElement(selectedId, { fontSize: Math.min(100, (selectedElement.fontSize || 12) + 1) })} 
                  className="px-2 hover:bg-slate-200 text-xs font-bold text-slate-600 transition-colors h-full flex items-center"
                >+</button>
              </div>

              {/* Text Color Swatch */}
              <div className="relative flex items-center justify-center w-7 h-7 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition-all cursor-pointer shrink-0" title="Text Color">
                <div className="w-4 h-4 rounded border border-slate-200" style={{ backgroundColor: selectedElement.fill || '#000000' }} />
                <input 
                  type="color" 
                  value={selectedElement.fill || '#000000'} 
                  onChange={(e) => updateElement(selectedId, { fill: e.target.value })} 
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" 
                />
              </div>

              {/* Divider */}
              <div className="w-px h-5 bg-slate-200 shrink-0 mx-0.5" />

              {/* Style Buttons */}
              <div className="flex items-center gap-0.5">
                <button 
                  onClick={() => updateElement(selectedId, { isBold: !selectedElement.isBold })} 
                  className={`p-1 rounded-lg transition-all cursor-pointer ${selectedElement.isBold ? 'bg-indigo-100 text-indigo-700 font-bold' : 'text-slate-500 hover:bg-slate-100'}`} 
                  title="Bold"
                >
                  <Bold size={13} />
                </button>
                <button 
                  onClick={() => updateElement(selectedId, { isItalic: !selectedElement.isItalic })} 
                  className={`p-1 rounded-lg transition-all cursor-pointer ${selectedElement.isItalic ? 'bg-indigo-100 text-indigo-700' : 'text-slate-500 hover:bg-slate-100'}`} 
                  title="Italic"
                >
                  <Italic size={13} />
                </button>
                <button 
                  onClick={() => updateElement(selectedId, { isUnderline: !selectedElement.isUnderline })} 
                  className={`p-1 rounded-lg transition-all cursor-pointer ${selectedElement.isUnderline ? 'bg-indigo-100 text-indigo-700' : 'text-slate-500 hover:bg-slate-100'}`} 
                  title="Underline"
                >
                  <Underline size={13} />
                </button>
                <button 
                  onClick={() => updateElement(selectedId, { isStrikethrough: !selectedElement.isStrikethrough })} 
                  className={`p-1 rounded-lg transition-all cursor-pointer ${selectedElement.isStrikethrough ? 'bg-indigo-100 text-indigo-700' : 'text-slate-500 hover:bg-slate-100'}`} 
                  title="Strikethrough"
                >
                  <Strikethrough size={13} />
                </button>
                <button 
                  onClick={handleCaseToggle} 
                  className="p-1 rounded-lg text-slate-500 hover:bg-slate-100 transition-all font-mono text-[11px] font-bold cursor-pointer h-6 flex items-center" 
                  title="Toggle Case"
                >
                  aA
                </button>
              </div>

              {/* Divider */}
              <div className="w-px h-5 bg-slate-200 shrink-0 mx-0.5" />

              {/* Alignment */}
              <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200 shrink-0">
                {['left', 'center', 'right'].map(align => (
                  <button 
                    key={align} 
                    onClick={() => updateElement(selectedId, { align })} 
                    className={`p-1 rounded-md transition-all cursor-pointer ${selectedElement.align === align || (!selectedElement.align && align === 'left') ? 'bg-white text-indigo-600 shadow-2xs' : 'text-slate-400 hover:text-slate-700'}`} 
                    title={`Align ${align}`}
                  >
                    {align === 'left' && <AlignLeft size={11} />}
                    {align === 'center' && <AlignCenter size={11} />}
                    {align === 'right' && <AlignRight size={11} />}
                  </button>
                ))}
              </div>

              {/* Divider */}
              <div className="w-px h-5 bg-slate-200 shrink-0 mx-0.5" />

              {/* Spacing Controls */}
              <div className="flex items-center gap-2 shrink-0">
                <div className="flex items-center gap-1">
                  <span className="text-[9px] font-bold text-slate-400">Letter</span>
                  <input 
                    type="number" 
                    min="-5" 
                    max="20" 
                    step="0.5" 
                    value={selectedElement.letterSpacing || 0} 
                    onChange={(e) => updateElement(selectedId, { letterSpacing: Number(e.target.value) })} 
                    className="w-9 bg-slate-50 border border-slate-200 rounded px-1 py-0.5 text-center text-xs font-bold text-slate-700 focus:outline-none" 
                  />
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-[9px] font-bold text-slate-400">Line</span>
                  <input 
                    type="number" 
                    min="0.5" 
                    max="3" 
                    step="0.1" 
                    value={selectedElement.lineHeight || 1} 
                    onChange={(e) => updateElement(selectedId, { lineHeight: Number(e.target.value) })} 
                    className="w-9 bg-slate-50 border border-slate-200 rounded px-1 py-0.5 text-center text-xs font-bold text-slate-700 focus:outline-none" 
                  />
                </div>
              </div>
            </>
          )}

          {/* SHAPE CONTROLS */}
          {selectedElement.type === 'shape' && (
            <>
              {/* Fill Color */}
              <div className="flex items-center gap-1 shrink-0">
                <span className="text-[10px] font-bold text-slate-400">Fill</span>
                <div className="relative flex items-center justify-center w-7 h-7 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition-all cursor-pointer" title="Fill Color">
                  <div className="w-4 h-4 rounded border border-slate-200" style={{ backgroundColor: selectedElement.fill || '#3b82f6' }} />
                  <input 
                    type="color" 
                    value={selectedElement.fill || '#3b82f6'} 
                    onChange={(e) => updateElement(selectedId, { fill: e.target.value })} 
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" 
                  />
                </div>
              </div>

              {/* Border Color */}
              <div className="flex items-center gap-1 shrink-0">
                <span className="text-[10px] font-bold text-slate-400">Border</span>
                <div className="relative flex items-center justify-center w-7 h-7 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition-all cursor-pointer" title="Border Color">
                  <div className="w-4 h-4 rounded border border-slate-200" style={{ backgroundColor: selectedElement.stroke || '#000000' }} />
                  <input 
                    type="color" 
                    value={selectedElement.stroke || '#000000'} 
                    onChange={(e) => updateElement(selectedId, { stroke: e.target.value })} 
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" 
                  />
                </div>
              </div>

              {/* Divider */}
              <div className="w-px h-5 bg-slate-200 shrink-0 mx-0.5" />

              {/* Stroke Width */}
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-[10px] font-bold text-slate-400">Border Width</span>
                <input 
                  type="range" 
                  min="0" 
                  max="20" 
                  step="1" 
                  value={selectedElement.strokeWidth || 0} 
                  onChange={(e) => updateElement(selectedId, { strokeWidth: Number(e.target.value) })} 
                  className="w-16 accent-indigo-600 cursor-pointer h-1 rounded bg-slate-200" 
                />
                <span className="text-[10px] font-mono font-bold text-slate-500 w-6">{selectedElement.strokeWidth || 0}px</span>
              </div>

              {/* Corner Radius (rect only) */}
              {(selectedElement.shapeType === 'rect' || selectedElement.shapeType === 'rounded_rect') && (
                <>
                  {/* Divider */}
                  <div className="w-px h-5 bg-slate-200 shrink-0 mx-0.5" />
                  
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-[10px] font-bold text-slate-400">Corners</span>
                    <input 
                      type="range" 
                      min="0" 
                      max="30" 
                      step="1" 
                      value={selectedElement.cornerRadius || 0} 
                      onChange={(e) => updateElement(selectedId, { cornerRadius: Number(e.target.value), shapeType: 'rounded_rect' })} 
                      className="w-16 accent-indigo-600 cursor-pointer h-1 rounded bg-slate-200" 
                    />
                    <span className="text-[10px] font-mono font-bold text-slate-500 w-6">{selectedElement.cornerRadius || 0}px</span>
                  </div>
                </>
              )}
            </>
          )}

          {/* QR CODE CONTROLS */}
          {selectedElement.type === 'qrcode' && (
            <>
              {/* QR Value */}
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-[10px] font-bold text-slate-400 font-sans">QR Text / URL</span>
                <input 
                  type="text" 
                  value={selectedElement.qrValue || ''} 
                  onChange={(e) => updateElement(selectedId, { qrValue: e.target.value })} 
                  className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500 w-36 h-7" 
                />
              </div>

              {/* Divider */}
              <div className="w-px h-5 bg-slate-200 shrink-0 mx-0.5" />

              {/* Foreground Color */}
              <div className="flex items-center gap-1 shrink-0">
                <span className="text-[10px] font-bold text-slate-400">QR Color</span>
                <div className="relative flex items-center justify-center w-7 h-7 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition-all cursor-pointer" title="QR Foreground Color">
                  <div className="w-4 h-4 rounded border border-slate-200" style={{ backgroundColor: selectedElement.fill || '#000000' }} />
                  <input 
                    type="color" 
                    value={selectedElement.fill || '#000000'} 
                    onChange={(e) => updateElement(selectedId, { fill: e.target.value })} 
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" 
                  />
                </div>
              </div>

              {/* Background Color */}
              <div className="flex items-center gap-1 shrink-0">
                <span className="text-[10px] font-bold text-slate-400">Background</span>
                <div className="relative flex items-center justify-center w-7 h-7 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition-all cursor-pointer" title="Background Color">
                  <div className="w-4 h-4 rounded border border-slate-200" style={{ backgroundColor: selectedElement.background || '#ffffff' }} />
                  <input 
                    type="color" 
                    value={selectedElement.background || '#ffffff'} 
                    onChange={(e) => updateElement(selectedId, { background: e.target.value })} 
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" 
                  />
                </div>
              </div>
            </>
          )}

          {/* Divider */}
          <div className="w-px h-5 bg-slate-200 shrink-0 mx-0.5" />

          {/* Opacity (Shared) */}
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-[10px] font-bold text-slate-400">Opacity</span>
            <input 
              type="range" 
              min="0" 
              max="1" 
              step="0.05" 
              value={selectedElement.opacity ?? 1} 
              onChange={(e) => updateElement(selectedId, { opacity: Number(e.target.value) })} 
              className="w-16 accent-indigo-600 cursor-pointer h-1 rounded bg-slate-200" 
            />
            <span className="text-[10px] font-mono font-bold text-slate-500 w-8">{Math.round((selectedElement.opacity ?? 1) * 100)}%</span>
          </div>

          {/* Layer Ordering (Shared) */}
          <div className="flex items-center gap-0.5 border-l border-slate-200 pl-1.5 shrink-0">
            <button 
              onClick={() => bringToFront(selectedId)} 
              className="p-1 rounded-lg text-slate-500 hover:bg-slate-100 transition-all cursor-pointer" 
              title="Bring to Front"
            >
              <ArrowUpToLine size={13} />
            </button>
            <button 
              onClick={() => bringForward(selectedId)} 
              className="p-1 rounded-lg text-slate-500 hover:bg-slate-100 transition-all cursor-pointer" 
              title="Bring Forward"
            >
              <ChevronUp size={13} />
            </button>
            <button 
              onClick={() => sendBackward(selectedId)} 
              className="p-1 rounded-lg text-slate-500 hover:bg-slate-100 transition-all cursor-pointer" 
              title="Send Backward"
            >
              <ChevronDown size={13} />
            </button>
            <button 
              onClick={() => sendToBack(selectedId)} 
              className="p-1 rounded-lg text-slate-500 hover:bg-slate-100 transition-all cursor-pointer" 
              title="Send to Back"
            >
              <ArrowDownToLine size={13} />
            </button>
          </div>

          {/* Action Buttons (Shared) */}
          <div className="flex items-center gap-0.5 border-l border-slate-200 pl-1.5 shrink-0">
            <button 
              onClick={handleDuplicate} 
              className="p-1 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-indigo-600 transition-all cursor-pointer" 
              title="Duplicate Element"
            >
              <Copy size={13} />
            </button>
            <button 
              onClick={handleDelete} 
              className="p-1 rounded-lg text-slate-500 hover:bg-red-50 hover:text-red-600 transition-all cursor-pointer" 
              title="Delete Element"
            >
              <Trash2 size={13} />
            </button>
          </div>
        </div>
      )}

      {/* Canvas Area */}
      <div 
        ref={containerRef}
        className="w-full h-full flex items-center justify-center overflow-auto p-10"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(0,0,0,0.08) 1px, transparent 1px)',
          backgroundSize: '20px 20px'
        }}
      >
        <div 
          className="shadow-2xl shadow-slate-400/50 transition-transform origin-center border border-slate-300/70 rounded-lg"
          style={{ transform: `scale(${zoom})` }}
        >
          <Stage 
            ref={stageRef}
            width={cardWidth} 
            height={cardHeight} 
            onMouseDown={handleStageClick}
            onTouchStart={handleStageClick}
            style={{ backgroundColor: cardSettings.background }}
          >
            <Layer>
              <Rect id="card-bg" width={cardWidth} height={cardHeight} fill={cardSettings.background} cornerRadius={cardSettings.roundedCorners} />
              
              {/* Render Elements */}
              {elements.map((el) => (
                <ElementRenderer 
                  key={el.id} 
                  element={el} 
                  isSelected={selectedId === el.id} 
                  onSelect={selectElement} 
                />
              ))}

              {/* Frame Border Overlay */}
              {cardSettings.borderThickness > 0 && (
                <Rect 
                  width={cardWidth} 
                  height={cardHeight} 
                  stroke={cardSettings.borderColor} 
                  strokeWidth={cardSettings.borderThickness * 2} 
                  cornerRadius={cardSettings.roundedCorners} 
                  listening={false} 
                />
              )}

              {/* Lanyard Attachment Slot Punch Holes */}
              {cardSettings.slotType === 'oval' && (
                <Rect 
                  x={cardWidth / 2 - 16} 
                  y={10} 
                  width={32} 
                  height={8} 
                  cornerRadius={4} 
                  fill={cardSettings.slotColor || '#e2e8f0'} 
                  stroke="#64748b" 
                  strokeWidth={1} 
                  listening={false} 
                />
              )}
              {cardSettings.slotType === 'round' && (
                <Circle 
                  x={cardWidth / 2} 
                  y={14} 
                  radius={7} 
                  fill={cardSettings.slotColor || '#e2e8f0'} 
                  stroke="#64748b" 
                  strokeWidth={1} 
                  listening={false} 
                />
              )}
              {cardSettings.slotType === 'double' && (
                <>
                  <Circle 
                    x={cardWidth / 2 - 24} 
                    y={14} 
                    radius={6} 
                    fill={cardSettings.slotColor || '#e2e8f0'} 
                    stroke="#64748b" 
                    strokeWidth={1} 
                    listening={false} 
                  />
                  <Circle 
                    x={cardWidth / 2 + 24} 
                    y={14} 
                    radius={6} 
                    fill={cardSettings.slotColor || '#e2e8f0'} 
                    stroke="#64748b" 
                    strokeWidth={1} 
                    listening={false} 
                  />
                </>
              )}
            </Layer>
          </Stage>
        </div>
      </div>
      
      {/* Bottom helper text */}
      <div className="absolute bottom-6 flex items-center gap-3 text-xs text-slate-500 font-semibold bg-white/90 backdrop-blur-xs px-4 py-1.5 rounded-full border border-slate-200 shadow-xs">
        <span className="flex items-center gap-1.5">
          <span className={`w-2 h-2 rounded-full ${activeSide === 'front' ? 'bg-indigo-600' : 'bg-purple-600'}`} />
          Editing: <strong className="text-slate-800 uppercase">{activeSide} Side</strong> ({elements.length} elements)
        </span>
        <span className="text-slate-300">•</span>
        <span>Size: {cardSettings.width}x{cardSettings.height}mm</span>
      </div>
    </div>
  );
}
