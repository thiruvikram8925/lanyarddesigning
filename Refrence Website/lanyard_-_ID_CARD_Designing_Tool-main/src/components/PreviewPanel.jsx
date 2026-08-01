import { createPortal } from 'react-dom';
import {
  ChevronUp,
  ChevronDown,
  Expand,
  Undo2,
  Redo2,
  Trash2,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  Printer,
  RotateCcw,
  RotateCw,
  Save,
  X,
  CreditCard,
  LayoutTemplate,
  Move,
  MousePointer2,
  Layout,
  Box,
  Layers,
  User
} from 'lucide-react';

import { useEffect, useState, useRef, useCallback, memo } from 'react';
import { useConfiguratorStore } from '../store/useConfiguratorStore';
import LanyardStage from './LanyardStage';
import IdCardPreview from './IdCardPreview';
import StudentWearPreview from './StudentWearPreview';
import ThreeDBackground from './ThreeDBackground';
import { Group, Layer, Stage } from 'react-konva';
import CanvasEditingToolbar from './editor/CanvasEditingToolbar';

function PreviewPanel({ stageRef, idCardStageRef, zoom, setZoom, currentStep, onEditStrap, projectType = 'lanyard', onZoneSelect: onZoneSelectProp }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activePreviewTab, setActivePreviewTab] = useState(projectType === 'id-card' ? 'idcard' : 'lanyard'); 
  const [containerSize, setContainerSize] = useState({ width: 800, height: 700 });
  const [selectedZone, setSelectedZone] = useState(null);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (let entry of entries) {
        setContainerSize({
          width: entry.contentRect.width,
          height: entry.contentRect.height
        });
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [currentStep, activePreviewTab]);
  
  const design = useConfiguratorStore((s) => s.design);
  const { size, showBothSides } = design.idCard;

  const isHorizontal = size === '100x70';
  const cardW = isHorizontal ? 283 : (size === '70x100' ? 198 : 153);
  const cardH = isHorizontal ? 198 : (size === '70x100' ? 283 : 244);
  const baseCardW = cardW;
  const baseCardH = cardH;

  // Canvas Pan & Cursor Pointer Zoom
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isCanvasDragging, setIsCanvasDragging] = useState(false);
  const [isSpaceDown, setIsSpaceDown] = useState(false);
  const canvasDragStart = useRef({ x: 0, y: 0, px: 0, py: 0 });
  const isSpaceRef = useRef(false); // use ref for event handler closure

  // Space key = pan mode (like Figma)
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.code === 'Space' && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
        e.preventDefault();
        isSpaceRef.current = true;
        setIsSpaceDown(true);
      }
    };
    const onKeyUp = (e) => {
      if (e.code === 'Space') {
        isSpaceRef.current = false;
        setIsSpaceDown(false);
        setIsCanvasDragging(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const handleWheel = (e) => {
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      const mouseX = e.clientX - rect.left - rect.width / 2;
      const mouseY = e.clientY - rect.top - rect.height / 2;

      const zoomFactor = e.deltaY < 0 ? 1.08 : 0.92;
      const minZoom = 0.25;
      const maxZoom = 4.0;

      setZoom((prevZoom) => {
        const newZoom = Math.min(Math.max(minZoom, prevZoom * zoomFactor), maxZoom);
        if (newZoom === prevZoom) return prevZoom;

        const scaleRatio = newZoom / prevZoom;
        setPan((prevPan) => ({
          x: mouseX - (mouseX - prevPan.x) * scaleRatio,
          y: mouseY - (mouseY - prevPan.y) * scaleRatio,
        }));

        return newZoom;
      });
    };

    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, [setZoom]);

  const handleCanvasPointerDown = (e) => {
    // Only pan with middle-mouse OR Space+left-click
    // Left-click alone is reserved for Konva element interaction
    const isMiddleMouse = e.button === 1;
    const isSpacePan = e.button === 0 && isSpaceRef.current;
    if (!isMiddleMouse && !isSpacePan) return;
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'BUTTON' || e.target.tagName === 'TEXTAREA') return;
    e.preventDefault();
    setIsCanvasDragging(true);
    canvasDragStart.current = {
      x: e.clientX,
      y: e.clientY,
      px: pan.x,
      py: pan.y,
    };
  };

  const handleCanvasPointerMove = (e) => {
    if (!isCanvasDragging) return;
    const dx = e.clientX - canvasDragStart.current.x;
    const dy = e.clientY - canvasDragStart.current.y;
    setPan({
      x: canvasDragStart.current.px + dx,
      y: canvasDragStart.current.py + dy,
    });
  };

  const handleCanvasPointerUp = () => {
    setIsCanvasDragging(false);
  };

  // Expanded View zoom and pan
  const [fullZoom, setFullZoom] = useState(1);
  const [fullPan, setFullPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartInfo = useRef({ x: 0, y: 0, px: 0, py: 0 });

  const handleFullWheel = (e) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    const mouseX = e.clientX - rect.left - rect.width / 2;
    const mouseY = e.clientY - rect.top - rect.height / 2;

    const scaleBy = 1.08;
    const newZoom = Math.min(Math.max(0.2, e.deltaY < 0 ? fullZoom * scaleBy : fullZoom / scaleBy), 5);
    if (newZoom === fullZoom) return;

    const scaleRatio = newZoom / fullZoom;
    setFullPan({
      x: mouseX - (mouseX - fullPan.x) * scaleRatio,
      y: mouseY - (mouseY - fullPan.y) * scaleRatio,
    });
    setFullZoom(newZoom);
  };

  const handleFullPointerDown = (e) => {
    if (e.button !== 0) return;
    setIsDragging(true);
    dragStartInfo.current = {
      x: e.clientX,
      y: e.clientY,
      px: fullPan.x,
      py: fullPan.y,
    };
  };

  const handleFullPointerMove = (e) => {
    if (!isDragging) return;
    setFullPan({
      x: dragStartInfo.current.px + (e.clientX - dragStartInfo.current.x),
      y: dragStartInfo.current.py + (e.clientY - dragStartInfo.current.y),
    });
  };

  const handleFullPointerUp = () => {
    setIsDragging(false);
  };

  const isReviewStep = currentStep === 3;
  const isIdCardStep = (currentStep === 2 || isReviewStep) && projectType === 'id-card';
  const editingText = useConfiguratorStore(s => s.editingText);
  const setEditingText = useConfiguratorStore(s => s.setEditingText);
  const fileInputRef = useRef(null);
  const [activeImageUpload, setActiveImageUpload] = useState(null);
  const idCardState = design.idCard;

  const undo = useConfiguratorStore(s => s.undo);
  const redo = useConfiguratorStore(s => s.redo);
  const canUndo = useConfiguratorStore(s => (s.past ? s.past.length > 0 : false));
  const canRedo = useConfiguratorStore(s => (s.future ? s.future.length > 0 : false));

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file || !activeImageUpload) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const url = event.target.result;
      const { id, sideName } = activeImageUpload;
      const elements = idCardState[sideName].elements;
      useConfiguratorStore.getState().setField(`idCard.${sideName}.elements`, elements.map(el => el.id === id ? { ...el, src: url } : el));
      setActiveImageUpload(null);
    };
    reader.readAsDataURL(file);
  };

  const gap = 30;
  const totalW = (isHorizontal || !idCardState.showBothSides) ? (isHorizontal ? baseCardW : baseCardW) : ((baseCardW * 2) + gap);
  const totalH = (isHorizontal && idCardState.showBothSides) ? ((baseCardH * 2) + gap) : baseCardH;
  const cardScale = Math.min(Math.min(750 / totalW, 600 / totalH), 2.2); 
  
  const cx = (containerSize.width / zoom - totalW * cardScale) / 2;
  const cy = (containerSize.height / zoom - totalH * cardScale) / 2;

  useEffect(() => {
    if (isIdCardStep) setActivePreviewTab('idcard');
  }, [isIdCardStep]);

  return (
    <div className="flex h-full flex-col bg-slate-900 overflow-hidden font-sans select-none">
      <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageUpload} className="hidden" />

      {/* Top Professional Canvas Control Bar */}
      <div className="h-12 bg-slate-950 border-b border-slate-800 flex items-center justify-between px-4 shrink-0 z-30">
        {/* Left: View Mode Tabs */}
        <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800">
          <button
            type="button"
            onClick={() => setActivePreviewTab('lanyard')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
              activePreviewTab === 'lanyard' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            <LayoutTemplate size={14} />
            <span>Lanyard</span>
          </button>

          {projectType !== 'lanyard' && (
            <>
              <button
                type="button"
                onClick={() => setActivePreviewTab('idcard')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                  activePreviewTab === 'idcard' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                <CreditCard size={14} />
                <span>ID Card</span>
              </button>

              <button
                type="button"
                onClick={() => setActivePreviewTab('student')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                  activePreviewTab === 'student' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                <User size={14} />
                <span>Avatar Try-On</span>
              </button>
            </>
          )}
        </div>

        {/* Right: Viewport Controls */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); useConfiguratorStore.getState().triggerViewReset(); }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
            title="Reset View"
          >
            <RotateCcw size={15} />
          </button>

          <div className="h-4 w-px bg-slate-800" />

          <button type="button" onClick={undo} disabled={!canUndo} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30 transition-all cursor-pointer">
            <Undo2 size={15} />
          </button>
          <button type="button" onClick={redo} disabled={!canRedo} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30 transition-all cursor-pointer">
            <Redo2 size={15} />
          </button>

          <div className="h-4 w-px bg-slate-800" />

          <div className="flex items-center gap-2 px-2">
            <ZoomIn size={14} className="text-indigo-400" />
            <input
              type="range"
              min="0.5"
              max="1.5"
              step="0.05"
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="w-20 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
            />
            <ZoomOut size={14} className="text-slate-500" />
          </div>

          <button
            type="button"
            onClick={() => setIsExpanded(true)}
            className="p-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 transition-all cursor-pointer ml-2"
            title="Full Screen Proof"
          >
            <Expand size={15} />
          </button>
        </div>
      </div>

      {/* Main 3D Canvas Viewport — Full Height */}
      <div 
        ref={containerRef}
        className={`flex-1 w-full relative overflow-hidden bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 ${
          isCanvasDragging ? 'cursor-grabbing' : isSpaceDown ? 'cursor-grab' : 'cursor-default'
        }`}
        onPointerDown={handleCanvasPointerDown}
        onPointerMove={handleCanvasPointerMove}
        onPointerUp={handleCanvasPointerUp}
        onPointerLeave={handleCanvasPointerUp}
      >
        <ThreeDBackground className="w-full h-full">
          <div 
            className="absolute inset-0 flex items-center justify-center z-10 transition-transform duration-75 ease-out origin-center"
            style={{
              transform: `translate3d(${pan.x}px, ${pan.y}px, 0px)`
            }}
          >
            {activePreviewTab === 'student' ? (
              <div className="relative z-10 w-full h-full flex items-center justify-center p-4 overflow-y-auto">
                <StudentWearPreview lanyardColor={design.lanyardColor} idCardSize={design.idCard.size} />
              </div>
            ) : isIdCardStep && activePreviewTab === 'idcard' ? (
              <div className="relative z-10 w-full h-full flex items-center justify-center">
                <Stage width={containerSize.width} height={containerSize.height} scaleX={zoom} scaleY={zoom} ref={idCardStageRef}>
                  <Layer>
                    <Group x={cx} y={cy} scaleX={cardScale} scaleY={cardScale}>
                      <IdCardPreview 
                        isReviewStep={isReviewStep}
                        onSelectElement={(id, sideName) => {
                          useConfiguratorStore.getState().setField('idCard.selected', id);
                          if (sideName) useConfiguratorStore.getState().setField('idCard.activeSide', sideName);
                        }}  
                        onUpdateElement={(id, pos, sideName) => {
                          const side = sideName || idCardState.activeSide;
                          const elements = idCardState[side].elements;
                          useConfiguratorStore.getState().setField(`idCard.${side}.elements`, elements.map(el => el.id === id ? { ...el, ...pos } : el));
                        }} 
                        onDblClickElement={(id, sideName, e) => {
                          const side = sideName || idCardState.activeSide;
                          const el = idCardState[side].elements.find(el => el.id === id);
                          if (!el) return;
                          if (el.type === 'text') {
                            const node = e.target;
                            const textPosition = node.absolutePosition();
                            const scaleY = node.getAbsoluteScale().y;
                            setEditingText({
                              id, side, value: el.content, fontStyle: el.fontStyle, color: el.fill, align: el.align || 'left',
                              fontSize: (el.fontSize || 12) * scaleY, x: textPosition.x, y: textPosition.y,
                              width: node.width() * node.getAbsoluteScale().x + 10, height: node.height() * scaleY + 10,
                            });
                          } else if (el.type === 'image') {
                            setActiveImageUpload({ id, sideName: side });
                            if (fileInputRef.current) fileInputRef.current.click();
                          }
                        }}
                      />
                    </Group>
                  </Layer>
                </Stage>
                {editingText && (
                  <textarea
                    value={editingText.value}
                    onChange={(e) => setEditingText({ ...editingText, value: e.target.value })}
                    onBlur={() => {
                      const elements = idCardState[editingText.side].elements;
                      useConfiguratorStore.getState().setField(`idCard.${editingText.side}.elements`, elements.map(el => el.id === editingText.id ? { ...el, content: editingText.value } : el));
                      setEditingText(null);
                    }}
                    autoFocus
                    style={{
                      position: 'absolute', top: editingText.y, left: editingText.x, width: editingText.width, height: editingText.height,
                      fontSize: editingText.fontSize, fontFamily: 'sans-serif', fontWeight: editingText.fontStyle?.includes('bold') ? 'bold' : 'normal',
                      color: editingText.color, background: 'rgba(255, 255, 255, 0.9)', border: '2px solid #4f46e5', zIndex: 100,
                    }}
                  />
                )}
              </div>
            ) : (
              <div className="relative z-10 w-full h-full flex items-center justify-center">
                <CanvasEditingToolbar
                  selectedZone={selectedZone}
                  onZoneSelect={(z) => { setSelectedZone(z); onZoneSelectProp?.(z); }}
                  onClose={() => setSelectedZone(null)}
                />
                <LanyardStage
                  stageRef={stageRef}
                  zoom={zoom}
                  currentStep={currentStep}
                  onEditStrap={onEditStrap}
                  alwaysShowControls={true}
                  onZoneSelect={(z) => { setSelectedZone(z); onZoneSelectProp?.(z); }}
                  externalSelectedZone={selectedZone}
                />
              </div>
            )}
          </div>
        </ThreeDBackground>
      </div>

      {/* Fullscreen Review Modal */}
      {isExpanded && createPortal(
        <div className="fixed inset-0 z-[999999] flex items-center justify-center bg-slate-950 p-4">
          <div className="w-full h-full bg-slate-900 rounded-2xl flex flex-col overflow-hidden border border-slate-800">
            <div className="px-6 py-4 flex items-center justify-between border-b border-slate-800 bg-slate-950 shrink-0">
              <div>
                <h3 className="text-base font-bold text-white">Full Screen Production Proof</h3>
                <p className="text-xs text-slate-400 font-medium">Scroll to Zoom · Drag to Pan Artwork Proof</p>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={() => { setFullZoom(1); setFullPan({x:0, y:0}); }} className="px-3 py-1.5 text-xs font-bold text-slate-300 bg-slate-800 rounded-lg hover:bg-slate-700">
                  Reset View
                </button>
                <button onClick={() => setIsExpanded(false)} className="p-2 bg-rose-500/20 text-rose-400 hover:bg-rose-600 hover:text-white rounded-lg transition-colors">
                  <X size={18} />
                </button>
              </div>
            </div>

            <div 
              className="flex-1 relative bg-slate-950 overflow-hidden cursor-grab active:cursor-grabbing flex items-center justify-center" 
              onWheel={handleFullWheel} 
              onPointerDown={handleFullPointerDown} 
              onPointerMove={handleFullPointerMove} 
              onPointerUp={handleFullPointerUp} 
              onPointerLeave={handleFullPointerUp}
            >
              <div className="transition-transform duration-75 ease-out" style={{ transform: `translate(${fullPan.x}px, ${fullPan.y}px) scale(${fullZoom})` }}>
                <LanyardStage stageRef={null} zoom={1.3} currentStep={currentStep} />
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

const PreviewPanelMemo = memo(PreviewPanel);
export default PreviewPanelMemo;
