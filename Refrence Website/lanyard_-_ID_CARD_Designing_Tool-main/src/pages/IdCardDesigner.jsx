import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import LeftSidebar from '../components/id-card-designer/LeftSidebar';
import CenterWorkspace from '../components/id-card-designer/CenterWorkspace';
import RightSidebar from '../components/id-card-designer/RightSidebar';
import { useIdCardDesignerStore } from '../store/useIdCardDesignerStore';
import { useProjectStore } from '../store/useProjectStore';
import EditorTopBar from '../components/editor/EditorTopBar';
import { showToast } from '../components/Toast';

export default function IdCardDesigner() {
  const navigate = useNavigate();
  const stageRef = useRef(null);
  const { 
    zoom, 
    setZoom, 
    undo, 
    redo, 
    historyIndex, 
    history,
    activeSide,
    setActiveSide 
  } = useIdCardDesignerStore();

  const { activeProject, updateActiveProject, saveProject } = useProjectStore();

  const [saveState, setSaveState] = useState('saved');
  const [isSaving, setIsSaving] = useState(false);

  // Load project design when activeProject changes
  useEffect(() => {
    if (activeProject && activeProject.design) {
      useIdCardDesignerStore.setState({
        frontElements: activeProject.design.frontElements || [],
        backElements: activeProject.design.backElements || [],
        cardSettings: activeProject.design.cardSettings || {
          width: 54,
          height: 86,
          orientation: 'portrait',
          background: '#ffffff',
          material: 'PVC',
          borderThickness: 3,
          borderColor: '#4f46e5',
          roundedCorners: 12,
          frameStyle: 'corporate',
          slotType: 'oval',
          slotColor: '#cbd5e1',
        },
        history: [
          {
            frontElements: activeProject.design.frontElements || [],
            backElements: activeProject.design.backElements || [],
            cardSettings: activeProject.design.cardSettings || {},
          }
        ],
        historyIndex: 0,
        selectedId: null,
        activeSide: 'front'
      });
    }
  }, [activeProject]);

  const handleSave = useCallback((updates) => {
    if (updates && updates.name) {
      if (updateActiveProject) {
        updateActiveProject(updates);
      }
      return;
    }

    setIsSaving(true);
    setSaveState('saving');
    
    const store = useIdCardDesignerStore.getState();
    const idCardDesign = {
      frontElements: store.frontElements,
      backElements: store.backElements,
      cardSettings: store.cardSettings,
    };

    if (updateActiveProject) {
      updateActiveProject({ design: idCardDesign });
    }

    setTimeout(() => {
      if (saveProject) saveProject();
      setSaveState('saved');
      setIsSaving(false);
      showToast('Draft saved successfully!', 'success');
    }, 500);
  }, [activeProject, saveProject, updateActiveProject]);

  // ⌨️ Keyboard shortcuts
  useEffect(() => {
    const handler = (e) => {
      const ctrl = e.ctrlKey || e.metaKey;
      if (!ctrl) return;
      if (e.key === 'z' && !e.shiftKey) { e.preventDefault(); undo(); }
      if ((e.key === 'y') || (e.key === 'z' && e.shiftKey)) { e.preventDefault(); redo(); }
      if (e.key === 's') { e.preventDefault(); handleSave(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [undo, redo, handleSave]);

  const handleExport = async (format) => {
    try {
      const store = useIdCardDesignerStore.getState();
      const currentSide = store.activeSide;
      const stage = stageRef.current;

      if (!stage) {
        showToast('Canvas stage is not ready', 'error');
        return;
      }

      // 1. Capture current active side
      const activeDataUrl = stage.toDataURL({ pixelRatio: 4.0 });
      const frontDataUrl = currentSide === 'front' ? activeDataUrl : null;
      const backDataUrl = currentSide === 'back' ? activeDataUrl : null;

      // 2. Flip programmatically to capture other side
      const otherSide = currentSide === 'front' ? 'back' : 'front';
      store.setActiveSide(otherSide);

      // Wait a brief tick for render
      await new Promise(resolve => setTimeout(resolve, 100));

      const otherDataUrl = stage.toDataURL({ pixelRatio: 4.0 });
      const finalFront = currentSide === 'front' ? frontDataUrl : otherDataUrl;
      const finalBack = currentSide === 'back' ? backDataUrl : otherDataUrl;

      // Restore side
      store.setActiveSide(currentSide);

      // Save output snapshots for ExportFlow
      localStorage.setItem('lanyard_temp_preview', finalFront);
      localStorage.setItem('lanyard_temp_card_preview', finalFront);
      localStorage.setItem('lanyard_temp_flat_front_preview', finalFront);
      localStorage.setItem('lanyard_temp_flat_back_preview', finalBack);

      if (format === 'Order') {
        navigate('/export');
      } else {
        // Trigger file download
        const link = document.createElement('a');
        link.download = `id-card-${currentSide}.png`;
        link.href = currentSide === 'front' ? finalFront : finalBack;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showToast('Design exported successfully!', 'success');
      }
    } catch (e) {
      console.error(e);
      showToast('Could not export canvas', 'error');
    }
  };

  return (
    <div className="flex flex-col h-[100dvh] bg-slate-50 text-slate-800 overflow-hidden font-sans">
      <EditorTopBar
        project={activeProject || { name: 'ID Card Design' }}
        onSave={handleSave}
        zoom={zoom}
        setZoom={setZoom}
        canUndo={historyIndex > 0}
        canRedo={historyIndex < history.length - 1}
        onUndo={undo}
        onRedo={redo}
        saveState={saveState}
        isSaving={isSaving}
        onExport={(format) => handleExport(format)}
        onOrder={() => handleExport('Order')}
        onPreview={() => {
          showToast('2D previews generated successfully.', 'success');
        }}
      />

      {/* Main Workspace 3-Panel Layout */}
      <div className="flex-1 flex overflow-hidden relative">
        <LeftSidebar />
        <CenterWorkspace stageRef={stageRef} />
        <RightSidebar />
      </div>
    </div>
  );
}
