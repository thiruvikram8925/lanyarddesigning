import { useState, useRef, useCallback, lazy, Suspense, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import EditorTopBar from '../components/editor/EditorTopBar';
import LeftToolbar from '../components/editor/LeftToolbar';
import RightProperties from '../components/editor/RightProperties';
import ValidationPanel from '../components/editor/ValidationPanel';
import FlatStrapView from '../components/FlatStrapView';
import { useConfiguratorStore } from '../store/useConfiguratorStore';
import { useProjectStore } from '../store/useProjectStore';
import { Loader2, Eye, EyeOff, Maximize2, LayoutTemplate } from 'lucide-react';

// Lazy-load the heavy canvas + preview components
const CustomizationPanel = lazy(() => import('../components/CustomizationPanel'));
const PreviewPanel = lazy(() => import('../components/PreviewPanel'));

const CANVAS_MODES = [
  { key: 'front', label: 'Front' },
  { key: 'back', label: 'Back' },
  { key: 'both', label: 'Both Sides' },
];

export default function Editor() {
  const navigate = useNavigate();
  const stageRef = useRef(null);
  const idCardStageRef = useRef(null);
  const frontFlatStageRef = useRef(null);
  const backFlatStageRef = useRef(null);

  const design = useConfiguratorStore(s => s.design);
  const saveLocal = useConfiguratorStore(s => s.saveLocal);
  const { activeProject, saveProject, updateActiveProject } = useProjectStore();

  const projectType = activeProject?.type || 'lanyard';

  const [zoom, setZoom] = useState(0.65);
  const [currentStep, setCurrentStep] = useState(0);
  const [canvasMode, setCanvasMode] = useState(
    projectType === 'lanyard' ? 'strap' : projectType === 'combo' ? 'full' : 'front'
  );
  const [validationVisible, setValidationVisible] = useState(true);
  const [previewExpanded, setPreviewExpanded] = useState(false);
  const [selectedElement, setSelectedElement] = useState(null);
  const [selectedZone, setSelectedZone] = useState(null);
  const [saveState, setSaveState] = useState('saved');
  const [isSaving, setIsSaving] = useState(false);

  // Load project design when activeProject changes
  useEffect(() => {
    if (activeProject && activeProject.design) {
      const applyDesignSnapshot = useConfiguratorStore.getState().applyDesignSnapshot;
      applyDesignSnapshot(activeProject.design);
    }
  }, [activeProject]);

  // ⌨️ Keyboard shortcuts
  useEffect(() => {
    const undo = useConfiguratorStore.getState().undo;
    const redo = useConfiguratorStore.getState().redo;
    const handler = (e) => {
      const ctrl = e.ctrlKey || e.metaKey;
      if (!ctrl) {
        if (e.key === 'Escape') setPreviewExpanded(false);
        return;
      }
      if (e.key === 'z' && !e.shiftKey) { e.preventDefault(); undo(); }
      if ((e.key === 'y') || (e.key === 'z' && e.shiftKey)) { e.preventDefault(); redo(); }
      if (e.key === 's') { e.preventDefault(); handleSave(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const canvasModes = projectType === 'lanyard'
    ? [
        { key: 'strap', label: '2D View' },
        { key: 'flat', label: 'Flat Layout' },
        { key: 'hardware', label: 'Clip & Hardware' },
      ]
    : projectType === 'combo'
    ? [{ key: 'full', label: 'Full Set' }, { key: 'lanyard', label: 'Lanyard' }, { key: 'idcard', label: 'ID Card' }]
    : [{ key: 'front', label: 'Front' }, { key: 'back', label: 'Back' }, { key: 'both', label: 'Both Sides' }];

  // Derive layers dynamically based on project type
  const layers = (projectType === 'lanyard'
    ? [
        { id: 'lanyard-bg', type: 'color', name: 'Strap Base Color', color: design.lanyardColor || '#4f46e5' },
        { id: 'strap-text-left', type: 'text', name: 'Left Strap Text', text: design.customTextLeft || 'COMPANY NAME' },
        { id: 'strap-text-center', type: 'text', name: 'Center Logo / Text', text: design.customTextCenter || 'STAFF' },
        { id: 'strap-text-right', type: 'text', name: 'Right Strap Text', text: design.customTextRight || 'COMPANY NAME' },
        { id: 'strap-logo', type: 'image', name: 'Strap Logo', url: design.logoUrl },
      ]
    : [
        ...(design?.idCard?.front?.elements || []),
        ...(design?.idCard?.back?.elements || []),
      ]
  ).map((el, i) => ({
    ...el,
    name: el.name || (el.type === 'text' ? (el.text || 'Text Layer') : el.type === 'image' ? 'Image' : el.type || `Layer ${i + 1}`),
    visible: el.visible !== false,
  }));

  const handleSave = useCallback((updates = {}) => {
    setSaveState('saving');
    setIsSaving(true);
    if (updates.name) {
      updateActiveProject({ name: updates.name });
    }
    saveLocal();
    setTimeout(() => {
      saveProject();
      setSaveState('saved');
      setIsSaving(false);
    }, 500);
  }, [saveLocal, saveProject, updateActiveProject]);

  const handleExport = (format) => {
    try {
      const preview = stageRef.current?.toDataURL({ pixelRatio: 4.0 }) || '';
      const cardPreview = idCardStageRef.current?.toDataURL({ pixelRatio: 4.0 }) || '';
      const flatFront = frontFlatStageRef.current?.toDataURL({ pixelRatio: 4.0 }) || '';
      const flatBack = backFlatStageRef.current?.toDataURL({ pixelRatio: 4.0 }) || '';

      localStorage.setItem('lanyard_temp_preview', preview);
      localStorage.setItem('lanyard_temp_card_preview', cardPreview);
      localStorage.setItem('lanyard_temp_flat_front_preview', flatFront);
      localStorage.setItem('lanyard_temp_flat_back_preview', flatBack);
    } catch (e) {
      console.warn('Could not save temp preview', e);
    }
    navigate('/export');
  };

  const handlePreview = () => {
    setPreviewExpanded(v => !v);
  };

  const handleApplyTemplate = (template) => {
    const store = useConfiguratorStore.getState();
    const setField = store.setField;

    // Apply Lanyard Strap Configuration
    const colorVal = template.lanyardColor || template.color;
    if (colorVal) {
      setField('lanyardColor', colorVal);
      setField('customColorCode', colorVal);
    }
    const widthVal = template.width || template.lanyardWidth;
    if (widthVal) {
      setField('width', widthVal);
      setField('lanyardWidth', widthVal);
    }
    if (template.length) setField('length', template.length);
    if (template.printingMethod) setField('printingMethod', template.printingMethod);
    if (template.clipType) setField('clipType', template.clipType);
    if (template.accessory) {
      setField('accessory', template.accessory);
      setField('accessories', [template.accessory]);
    }
    if (template.strapPattern) setField('strapPattern', template.strapPattern);
    if (template.elements) setField('elements', template.elements);
    if (template.text) setField('text', template.text);
    if (template.logoUrl) setField('logoUrl', template.logoUrl);

    // Apply ID Card Elements if present
    if (template.front?.elements) {
      const els = template.front.elements.map(el => ({ ...el, id: `${el.id}-${Date.now()}` }));
      setField('idCard.front.elements', els);
    }
    if (template.idCardBgColor) {
      setField('idCard.front.backgroundColor', template.idCardBgColor);
    }
  };

  const handleAddElement = (element) => {
    // Would integrate with Konva stage to add shape
    console.log('Add element:', element);
  };

  const handleUpload = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const setField = useConfiguratorStore.getState().setField;
      setField('idCard.photoUrl', e.target.result);
    };
    reader.readAsDataURL(file);
  };

  // Full-screen 3D preview overlay
  if (previewExpanded) {
    return (
      <div className="fixed inset-0 z-[200] bg-slate-950 flex flex-col">
        <div className="h-12 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-4 shrink-0">
          <div className="flex items-center gap-2">
            <Eye size={14} className="text-slate-400" />
            <span className="text-[13px] font-semibold text-white">2D Preview</span>
          </div>
          <button
            onClick={() => setPreviewExpanded(false)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
          >
            <EyeOff size={13} /> Close Preview
          </button>
        </div>
        <div className="flex-1 min-h-0">
          <Suspense fallback={<div className="flex-1 flex items-center justify-center"><Loader2 className="animate-spin text-white" /></div>}>
            <PreviewPanel
              projectType={projectType}
              stageRef={stageRef}
              idCardStageRef={idCardStageRef}
              zoom={zoom}
              setZoom={setZoom}
              currentStep={currentStep}
              onEditStrap={() => {}}
            />
          </Suspense>
        </div>
      </div>
    );
  }

  return (
    <div className="editor-workspace flex flex-col h-full bg-slate-100 overflow-hidden">
      {/* Top bar */}
      <EditorTopBar
        project={activeProject}
        zoom={zoom}
        setZoom={setZoom}
        canUndo={false}
        canRedo={false}
        onUndo={() => {}}
        onRedo={() => {}}
        onBack={() => navigate('/dashboard')}
        onSave={handleSave}
        onPreview={handlePreview}
        onExport={handleExport}
        onOrder={handleExport}
        saveState={saveState}
        isSaving={isSaving}
      />

      {/* Canvas mode switcher */}
      <div className="flex items-center justify-center gap-1 py-1.5 bg-white border-b border-slate-200 shrink-0">
        {canvasModes.map(m => (
          <button
            key={m.key}
            onClick={() => setCanvasMode(m.key)}
            className={`px-3 py-1 rounded-lg text-[11px] font-semibold transition-all ${
              canvasMode === m.key
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
            }`}
          >
            {m.label}
          </button>
        ))}
        <div className="ml-4 flex items-center gap-1">
          <button
            onClick={() => setValidationVisible(v => !v)}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
              validationVisible ? 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100' : 'text-slate-400 hover:bg-slate-100'
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${validationVisible ? 'bg-emerald-500' : 'bg-slate-300'}`} />
            Validation
          </button>
        </div>
      </div>

      {/* Main 3-panel workspace */}
      <div className="flex flex-1 min-h-0 overflow-hidden">

        {/* LEFT — Toolbar */}
        <LeftToolbar
          projectType={projectType}
          onApplyTemplate={handleApplyTemplate}
          onAddElement={handleAddElement}
          onUpload={handleUpload}
          onTabChange={(tab) => {
            if (tab === 'text' && projectType === 'lanyard') {
              setCanvasMode('flat');
            }
          }}
        />

        {/* CENTER — Canvas area */}
        <div className="flex-1 min-w-0 flex flex-col overflow-hidden">

          {/* Canvas itself */}
          <div className="flex-1 min-h-0 relative overflow-hidden">
            <div className={`w-full h-full ${canvasMode === 'flat' && projectType === 'lanyard' ? 'flex flex-col' : 'hidden'}`}>
              {/* Header bar inside canvas */}
              <div className="flex items-center gap-2 px-5 py-3 bg-white border-b border-slate-200 shrink-0">
                <LayoutTemplate size={14} className="text-indigo-500" />
                <span className="text-[13px] font-bold text-slate-800">Flat Print Layout</span>
                <span className="ml-2 text-[10px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">Actual Print Preview</span>
                <span className="ml-auto text-[10px] text-slate-400">Front (left) · Back mirror (right)</span>
              </div>
              <div className="flex-1 overflow-auto bg-slate-100">
                <FlatStrapView frontStageRef={frontFlatStageRef} backStageRef={backFlatStageRef} />
              </div>
            </div>

            <div className={`w-full h-full ${canvasMode === 'flat' && projectType === 'lanyard' ? 'hidden' : 'block'}`}>
              <Suspense fallback={
                <div className="flex-1 flex items-center justify-center h-full">
                  <div className="flex flex-col items-center gap-3">
                    <Loader2 size={28} className="animate-spin text-indigo-500" />
                    <p className="text-[13px] font-medium text-slate-500">Loading canvas…</p>
                  </div>
                </div>
              }>
                <PreviewPanel
                  stageRef={stageRef}
                  idCardStageRef={idCardStageRef}
                  zoom={zoom}
                  setZoom={setZoom}
                  currentStep={currentStep}
                  onEditStrap={() => {}}
                  onZoneSelect={(zone) => setSelectedZone(zone)}
                />
              </Suspense>
            </div>

            {/* 3D Preview strip toggle button — only in 3D mode */}
            {canvasMode !== 'flat' && (
              <button
                onClick={handlePreview}
                className="absolute bottom-3 right-3 flex items-center gap-1.5 px-3 py-1.5 bg-slate-900/80 hover:bg-slate-900 backdrop-blur-sm text-white text-[11px] font-semibold rounded-full shadow-lg transition-all border border-white/10"
              >
                <Maximize2 size={11} />
                Full Preview
              </button>
            )}
          </div>

          {/* Validation strip — hidden when in flat layout mode */}
          {canvasMode !== 'flat' && (
            <ValidationPanel
              design={design}
              visible={validationVisible}
              onToggle={() => setValidationVisible(v => !v)}
            />
          )}
        </div>

        {/* RIGHT — Properties panel */}
        <RightProperties
          projectType={projectType}
          selectedElement={selectedElement}
          selectedZone={selectedZone}
          onZoneSelect={(zone) => setSelectedZone(zone)}
          layers={layers}
          history={[]}
          onChangeElement={(updates) => {
            if (!selectedElement) return;
            const { setField } = useConfiguratorStore.getState();
            Object.entries(updates).forEach(([key, val]) => {
              setField(key, val);
            });
          }}
          onSelectLayer={(id) => {
            const el = layers.find(l => l.id === id);
            setSelectedElement(el || null);
            setSelectedZone(null);
          }}
          onDeleteLayer={(id) => {
            console.log('Delete layer:', id);
          }}
        />
      </div>

      {/* Hidden customization panel — used for state management only */}
      <div className="hidden">
        <Suspense fallback={null}>
          <CustomizationPanel
            currentStep={currentStep}
            setCurrentStep={setCurrentStep}
            onSubmit={() => navigate('/export')}
            loading={false}
            pricing={{ pricePerUnit: 45, total: 45 }}
            stageRef={stageRef}
          />
        </Suspense>
        {/* Hidden flat strap view used to capture flat print layout preview */}
        <FlatStrapView frontStageRef={frontFlatStageRef} backStageRef={backFlatStageRef} />
      </div>
    </div>
  );
}
