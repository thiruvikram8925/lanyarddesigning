import React, { useRef, useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useConfiguratorStore } from '../store/useConfiguratorStore';
import { loadBatchPhotosFromDB } from '../utils/batchImageStore';
import { Cloud, CheckCircle2, LayoutTemplate, Database, Download, RotateCcw, Loader2, FolderOpen, ArrowRight, Square, Sparkles, FileEdit, Check } from 'lucide-react';
import ToastContainer, { showToast } from '../components/customizer/Toast';
import SetupMode from '../components/customizer/workspace/SetupMode';
import DesignMode from '../components/customizer/workspace/DesignMode';
import ExportMode from '../components/customizer/workspace/ExportMode';
import FloatingToolbar from '../components/customizer/workspace/FloatingToolbar';
import ProjectSelector from '../components/customizer/ProjectSelector';

export default function Customizer() {
  const [searchParams, setSearchParams] = useSearchParams();
  const orderId = searchParams.get('orderId');
  const templateMode = searchParams.get('templateMode'); // 'with-template' | 'without-template' | null

  const design = useConfiguratorStore(state => state.design);
  const setField = useConfiguratorStore(state => state.setField);
  const saveLocal = useConfiguratorStore(state => state.saveLocal);
  const loadLocal = useConfiguratorStore(state => state.loadLocal);
  const resetDesign = useConfiguratorStore(state => state.resetDesign);
  const isSyncing = useConfiguratorStore(state => state.isSyncing);
  
  const [isInitialLoading, setIsInitialLoading] = useState(!!orderId);
  const processedOrderIdRef = useRef<string | null>(null);
  
  // Auto-restore saved draft on mount
  useEffect(() => {
    if (orderId && processedOrderIdRef.current !== orderId) {
      processedOrderIdRef.current = orderId;
      setIsInitialLoading(true);
      
      const doLoad = async () => {
        await loadLocal(orderId);
        setField('idCard.selected', orderId);
        await loadBatchPhotosFromDB(orderId);
        setIsInitialLoading(false);
      };
      doLoad();
    } else if (!orderId && processedOrderIdRef.current !== 'no-order') {
      processedOrderIdRef.current = 'no-order';
      setIsInitialLoading(true);
      
      const doLoadFallback = async () => {
        if (design.idCard.selected) {
          await loadLocal(design.idCard.selected);
          await loadBatchPhotosFromDB(design.idCard.selected);
        } else {
          await loadLocal();
          const currentState = useConfiguratorStore.getState();
          if (currentState.design.idCard.selected) {
            await loadBatchPhotosFromDB(currentState.design.idCard.selected);
          }
        }
        setIsInitialLoading(false);
      };
      doLoadFallback();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);
  
  const mode = design.idCard.bulkWorkflow.mode || 'setup';
  
  const stageRef = useRef<unknown>(null);
  const idCardStageRef = useRef<unknown>(null);
  const [zoom, setZoom] = useState(1);
  const [saveMessage, setSaveMessage] = useState('');

  const handleClear = async () => {
    if (window.confirm('Are you sure you want to clear all design changes? This action cannot be undone.')) {
      await resetDesign();
      showToast('All changes cleared successfully!');
    }
  };

  const selectTemplateMode = (selectedMode: 'with-template' | 'create-new-template') => {
    const params = new URLSearchParams(searchParams);
    params.set('templateMode', selectedMode);
    setSearchParams(params);

    // Auto-ensure a selected workspace project ID exists so ProjectSelector is not shown
    if (!useConfiguratorStore.getState().design.idCard.selected) {
      setField('idCard.selected', 'default-project');
    }

    if (selectedMode === 'create-new-template') {
      // Jump directly to design workspace canvas
      setField('idCard.bulkWorkflow.mode', 'design');
    } else if (selectedMode === 'with-template') {
      // Open setup page (Upload template, dataset, photos)
      setField('idCard.bulkWorkflow.mode', 'setup');
    }
  };

  // Ensure project selection when templateMode is active
  useEffect(() => {
    if (templateMode) {
      if (!design.idCard.selected) {
        setField('idCard.selected', 'default-project');
      }
      if (templateMode === 'create-new-template' && mode === 'setup') {
        setField('idCard.bulkWorkflow.mode', 'design');
      }
    }
  }, [templateMode, design.idCard.selected, mode, setField]);

  const steps = [
    { id: 'setup', label: 'Setup', icon: Database },
    { id: 'design', label: 'Design Workspace', icon: LayoutTemplate },
    { id: 'export', label: 'Review & Export', icon: Download },
  ];

  if (isInitialLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-white">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600 mb-4" />
        <p className="text-gray-500 font-medium animate-pulse">Restoring Workspace Design...</p>
      </div>
    );
  }

  // 1. Initial Choice Screen: 2 Boxes (With Template & Create New Template)
  if (!templateMode) {
    return (
      <div className="flex flex-col min-h-[calc(100vh-7rem)] bg-gradient-to-br from-slate-50 via-indigo-50/20 to-blue-50/30 items-center justify-center p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="max-w-4xl w-full text-center my-auto">
          {/* Header Badge & Title */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-100/80 text-indigo-700 font-bold text-xs mb-4">
            <Sparkles size={14} />
            <span>ID Card Customizer Mode</span>
          </div>

          <h1 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight mb-3">
            How would you like to start?
          </h1>
          <p className="text-slate-600 font-medium text-base md:text-lg mb-10 max-w-xl mx-auto">
            Select an option below to begin your ID card design:
          </p>

          {/* 2 Big Option Boxes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            {/* Box 1: With Template */}
            <button
              onClick={() => selectTemplateMode('with-template')}
              className="group relative bg-white border-2 border-slate-200/90 hover:border-indigo-500 rounded-3xl p-8 text-left transition-all duration-300 hover:shadow-2xl hover:shadow-indigo-500/10 hover:-translate-y-1.5 flex flex-col justify-between overflow-hidden cursor-pointer"
            >
              <div className="absolute top-0 right-0 w-36 h-36 bg-indigo-500/10 rounded-full blur-2xl group-hover:bg-indigo-500/20 transition-all" />
              
              <div>
                <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-md shadow-indigo-100">
                  <LayoutTemplate size={32} />
                </div>

                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2.5 py-0.5 rounded-md text-[11px] font-black uppercase tracking-wider bg-indigo-100 text-indigo-700">
                    Option 1
                  </span>
                </div>

                <h2 className="text-2xl font-bold text-slate-900 mb-2 group-hover:text-indigo-600 transition-colors">
                  With Template
                </h2>
                <p className="text-sm text-slate-600 leading-relaxed font-medium mb-6">
                  Upload a base design exported from Canva/Illustrator (JPG/WMF), along with ID dataset Excel & batch photos.
                </p>

                <ul className="space-y-2 mb-6 text-xs text-slate-600 font-medium">
                  <li className="flex items-center gap-2">
                    <Check size={14} className="text-indigo-600 flex-shrink-0" />
                    <span>Upload Front & Back base designs</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={14} className="text-indigo-600 flex-shrink-0" />
                    <span>Import Excel data & student photos</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={14} className="text-indigo-600 flex-shrink-0" />
                    <span>Full guided setup workflow</span>
                  </li>
                </ul>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-sm font-extrabold text-indigo-600">
                <span>Open Setup Page</span>
                <div className="w-8 h-8 rounded-full bg-indigo-50 group-hover:bg-indigo-600 group-hover:text-white flex items-center justify-center transition-all">
                  <ArrowRight size={16} />
                </div>
              </div>
            </button>

            {/* Box 2: Create New Template */}
            <button
              onClick={() => selectTemplateMode('create-new-template')}
              className="group relative bg-white border-2 border-slate-200/90 hover:border-emerald-500 rounded-3xl p-8 text-left transition-all duration-300 hover:shadow-2xl hover:shadow-emerald-500/10 hover:-translate-y-1.5 flex flex-col justify-between overflow-hidden cursor-pointer"
            >
              <div className="absolute top-0 right-0 w-36 h-36 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-all" />
              
              <div>
                <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-emerald-600 group-hover:text-white transition-all shadow-md shadow-emerald-100">
                  <FileEdit size={32} />
                </div>

                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2.5 py-0.5 rounded-md text-[11px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-700">
                    Option 2
                  </span>
                </div>

                <h2 className="text-2xl font-bold text-slate-900 mb-2 group-hover:text-emerald-600 transition-colors">
                  Create New Template
                </h2>
                <p className="text-sm text-slate-600 leading-relaxed font-medium mb-6">
                  Skip the setup page and jump straight into a new blank canvas workspace to build a custom card design.
                </p>

                <ul className="space-y-2 mb-6 text-xs text-slate-600 font-medium">
                  <li className="flex items-center gap-2">
                    <Check size={14} className="text-emerald-600 flex-shrink-0" />
                    <span>Direct blank canvas workspace</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={14} className="text-emerald-600 flex-shrink-0" />
                    <span>Add text, shapes, QR & barcodes manually</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={14} className="text-emerald-600 flex-shrink-0" />
                    <span>Instant interactive design mode</span>
                  </li>
                </ul>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-sm font-extrabold text-emerald-600">
                <span>Open New Canvas</span>
                <div className="w-8 h-8 rounded-full bg-emerald-50 group-hover:bg-emerald-600 group-hover:text-white flex items-center justify-center transition-all">
                  <ArrowRight size={16} />
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!design.idCard.selected && !templateMode) {
    return (
      <div className="relative">
        <ProjectSelector />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-7rem)] bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Top Header */}
      <header className="h-16 shrink-0 bg-white border-b border-slate-200 flex items-center justify-between px-6 z-50">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-black text-slate-800 tracking-tight">Gotek ID Pro</h1>
          <div className="w-[1px] h-6 bg-slate-200" />
          
          <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-xl border border-slate-100">
            {steps.map((step, idx) => {
              const Icon = step.icon;
              const isActive = mode === step.id;
              const isPast = steps.findIndex(s => s.id === mode) > idx;
              const datasetReady = design.idCard.bulkWorkflow.datasetRecords?.length > 0;
              return (
                <button
                  key={step.id}
                  onClick={() => {
                    if (datasetReady || step.id === 'setup') setField('idCard.bulkWorkflow.mode', step.id);
                  }}
                  className={`flex items-center gap-2 px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${isActive ? 'bg-white shadow relative text-indigo-600' : (!datasetReady && step.id !== 'setup') ? 'text-slate-400 cursor-not-allowed hidden md:flex' : 'text-slate-600 hover:bg-slate-100'}`}
                  disabled={!datasetReady && step.id !== 'setup'}
                >
                  {isPast ? <CheckCircle2 size={14} className="text-emerald-500" /> : <Icon size={14} />}
                  <span>{step.label}</span>
                </button>
              );
            })}
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {saveMessage && (
            <span className="text-[12px] font-bold text-emerald-600 animate-in fade-in slide-in-from-right-2 whitespace-nowrap">
              {saveMessage}
            </span>
          )}
          <button
            onClick={() => {
              const params = new URLSearchParams(searchParams);
              params.delete('templateMode');
              setSearchParams(params);
            }}
            className="flex items-center gap-2 px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-200 transition-all shadow-xs cursor-pointer"
            title="Switch between With Template and Create New Template"
          >
            <Sparkles size={14} className="text-indigo-600" />
            <span>Switch Mode</span>
          </button>
          <button
            onClick={() => setField('idCard.selected', null)}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-indigo-600 hover:bg-indigo-50 hover:border-indigo-100 transition-all shadow-sm active:scale-95"
            title="Switch to a different project"
          >
            <FolderOpen size={14} />
            Change Project
          </button>
          <button
            onClick={handleClear}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-red-500 hover:bg-red-50 hover:border-red-100 transition-all shadow-sm active:scale-95"
          >
            <RotateCcw size={14} />
            Clear
          </button>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-500 min-w-[120px] justify-center transition-all">
            {isSyncing ? (
              <>
                <Loader2 size={14} className="animate-spin text-indigo-500" />
                <span className="text-indigo-600">Auto-saving...</span>
              </>
            ) : (
              <>
                <Cloud size={14} className="text-emerald-500" />
                <span>Saved to Cloud</span>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Workspace Area */}
      <main className="flex-1 flex overflow-hidden relative">
        {mode === 'setup' && <SetupMode />}
        
        {mode === 'design' && (
          <DesignMode 
            stageRef={stageRef} 
            idCardStageRef={idCardStageRef} 
            zoom={zoom} 
            setZoom={setZoom} 
          />
        )}
        
        {mode === 'export' && (
          <ExportMode 
            stageRef={stageRef} 
            idCardStageRef={idCardStageRef} 
          />
        )}

        {/* Floating Context Toolbar renders on top of everything if in design mode */}
        {mode === 'design' && <FloatingToolbar stageRef={stageRef} />}

        {/* Bottom-Right Navigation Buttons */}
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3">
          {mode === 'setup' && (
            <button
              onClick={() => setField('idCard.bulkWorkflow.mode', 'design')}
              className="flex items-center gap-2.5 px-6 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-sm rounded-2xl shadow-xl hover:shadow-indigo-500/20 hover:scale-105 active:scale-95 transition-all group border border-indigo-500/30"
            >
              <span>Next: Design Workspace</span>
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </button>
          )}

          {mode === 'design' && (
            <button
              onClick={() => setField('idCard.bulkWorkflow.mode', 'export')}
              className="flex items-center gap-2.5 px-6 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-sm rounded-2xl shadow-xl hover:shadow-indigo-500/20 hover:scale-105 active:scale-95 transition-all group border border-indigo-500/30"
            >
              <span>Next: Review & Export</span>
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </button>
          )}
        </div>
      </main>

      <ToastContainer />
    </div>
  );
}
