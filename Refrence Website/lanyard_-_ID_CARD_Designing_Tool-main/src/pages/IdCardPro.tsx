import React, { useRef, useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useConfiguratorStore } from '../store/useConfiguratorStore';
import { loadBatchPhotosFromDB } from '../utils/batchImageStore';
import { 
  Cloud, CheckCircle2, LayoutTemplate, Database, Download, RotateCcw, 
  Loader2, FolderOpen, Scissors, ArrowRight, ArrowLeft, ShieldCheck, RefreshCw 
} from 'lucide-react';
import ToastContainer, { showToast } from '../components/customizer/Toast';
import SetupMode from '../components/customizer/workspace/SetupMode';
import DesignMode from '../components/customizer/workspace/DesignMode';
import ExportMode from '../components/customizer/workspace/ExportMode';
import FloatingToolbar from '../components/customizer/workspace/FloatingToolbar';
import ProjectSelector from '../components/customizer/ProjectSelector';

// Validation imports
import { projectService, studentService } from '@/services/dataService';
import { useOrder } from '@/hooks/useOrder';
import PhotoProcessor from '@/components/validation/PhotoProcessor';
import { PhotoMatch } from '@/types/validation';

const Badge = ({ children, className }: { children: React.ReactNode, className: string }) => (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${className}`}>
        {children}
    </span>
);

export default function IdCardPro() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('orderId');
  
  // Customizer state
  const design = useConfiguratorStore(state => state.design);
  const setField = useConfiguratorStore(state => state.setField);
  const saveLocal = useConfiguratorStore(state => state.saveLocal);
  const loadLocal = useConfiguratorStore(state => state.loadLocal);
  const resetDesign = useConfiguratorStore(state => state.resetDesign);
  const isSyncing = useConfiguratorStore(state => state.isSyncing);
  
  // Validation state
  const { currentOrder, loadOrderById, refreshOrder, isLoading: isOrderLoading } = useOrder();
  const [students, setStudents] = useState<Record<string, unknown>[]>([]);
  const [photoMatches, setPhotoMatches] = useState<PhotoMatch[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  
  const [recordCount, setRecordCount] = useState(0);
  const [matchedCount, setMatchedCount] = useState(0);
  const [unlinkedCount, setUnlinkedCount] = useState(0);

  // Main step state
  const [mainStep, setMainStep] = useState<1 | 2>(1); // 1 = Cropping Hub, 2 = Customizer

  const [isInitialLoading, setIsInitialLoading] = useState(!!orderId);
  const processedOrderIdRef = useRef<string | null>(null);
  const stageRef = useRef<unknown>(null);
  const idCardStageRef = useRef<unknown>(null);
  const [zoom, setZoom] = useState(1);
  const [saveMessage, setSaveMessage] = useState('');

  // Handle initialization and project loading
  useEffect(() => {
    if (orderId && processedOrderIdRef.current !== orderId) {
      processedOrderIdRef.current = orderId;
      setIsInitialLoading(true);
      
      const doLoad = async () => {
        await loadLocal(orderId);
        setField('idCard.selected', orderId);
        await loadBatchPhotosFromDB(orderId);
        if (!currentOrder || currentOrder.id !== orderId) {
           await loadOrderById(orderId);
        }
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
          await loadOrderById(design.idCard.selected);
        } else {
          await loadLocal();
          const currentState = useConfiguratorStore.getState();
          if (currentState.design.idCard.selected) {
            await loadBatchPhotosFromDB(currentState.design.idCard.selected);
            await loadOrderById(currentState.design.idCard.selected);
          }
        }
        setIsInitialLoading(false);
      };
      doLoadFallback();
    }
  }, [orderId, currentOrder, loadOrderById, loadLocal, setField, design.idCard.selected]);

  // Load students for Validation
  useEffect(() => {
    const loadDashboardData = async () => {
        if (!currentOrder) return;
        try {
            setLoadingStudents(true);
            const list = await studentService.getAll(currentOrder.projectId);
            setStudents(list || []);
            
            setRecordCount(list.length);
            const withPhotos = list.filter((s: Record<string, unknown>) => s.photoUrl).length;
            setMatchedCount(withPhotos);
            setUnlinkedCount(list.length - withPhotos);
        } catch (err) {
            console.error('Failed to load dashboard data:', err);
        } finally {
            setLoadingStudents(false);
        }
    };
    loadDashboardData();
  }, [currentOrder]);

  const handleStatsUpdate = (newStats: { total: number; valid: number; errors: number; warnings: number }) => {
      setRecordCount(newStats.total);
      setMatchedCount(newStats.valid);
      setUnlinkedCount(newStats.errors);
  };

  const handleClear = async () => {
    if (window.confirm('Are you sure you want to clear all design changes? This action cannot be undone.')) {
      await resetDesign();
      showToast('All changes cleared successfully!');
    }
  };

  const mode = design.idCard?.bulkWorkflow?.mode || 'setup';
  const customizerSteps = [
    { id: 'setup', label: 'Setup', icon: Database },
    { id: 'design', label: 'Design Workspace', icon: LayoutTemplate },
    { id: 'export', label: 'Review & Export', icon: Download },
  ];

  const datasetReady = (design.idCard?.bulkWorkflow?.datasetRecords?.length || 0) > 0;
  
  let proceedText = "Proceed to Setup";
  let targetMode: 'setup' | 'design' | 'export' = 'setup';

  if (!datasetReady) {
    proceedText = "Proceed to Setup";
    targetMode = 'setup';
  } else {
    if (mode === 'setup' || mode === 'design') {
      proceedText = "Proceed to Design Workspace";
      targetMode = 'design';
    } else if (mode === 'export') {
      proceedText = "Proceed to Review & Export";
      targetMode = 'export';
    }
  }

  if (isInitialLoading || isOrderLoading || (loadingStudents && !students.length)) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-7rem)] bg-white rounded-xl shadow-sm border border-slate-200">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600 mb-4" />
        <p className="text-gray-500 font-medium animate-pulse">Initializing ID Card Pro...</p>
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
          
          <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-100">
            <button
              onClick={() => setMainStep(1)}
              className={`flex items-center gap-2 px-4 py-1.5 text-sm font-bold rounded-lg transition-all ${
                mainStep === 1 ? 'bg-white shadow relative text-indigo-600' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Scissors size={16} />
              <span>Step 1: Cropping Hub</span>
            </button>
            <button
              onClick={() => {
                setMainStep(2);
                if (!design.idCard?.bulkWorkflow?.mode) {
                  setField('idCard.bulkWorkflow.mode', 'setup');
                }
              }}
              className={`flex items-center gap-2 px-4 py-1.5 text-sm font-bold rounded-lg transition-all ${
                mainStep === 2 ? 'bg-white shadow relative text-indigo-600' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <LayoutTemplate size={16} />
              <span>Step 2: Customizer</span>
            </button>
          </div>
          
          <div className="w-[1px] h-6 bg-slate-200" />
          <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-xl border border-slate-100">
            {customizerSteps.map((step, idx) => {
              const Icon = step.icon;
              const isActive = mainStep === 2 && mode === step.id;
              const isPast = mainStep === 2 && customizerSteps.findIndex(s => s.id === mode) > idx;
              return (
                <button
                  key={step.id}
                  onClick={() => {
                    setMainStep(2);
                    if (datasetReady || step.id === 'setup') {
                      setField('idCard.bulkWorkflow.mode', step.id);
                    }
                  }}
                  className={`flex items-center gap-2 px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                    isActive ? 'bg-white shadow relative text-indigo-600' : (!datasetReady && step.id !== 'setup') ? 'text-slate-400 cursor-not-allowed hidden md:flex' : 'text-slate-600 hover:bg-slate-100'
                  }`}
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
      <main className="flex-1 flex flex-col overflow-hidden relative">
        {mainStep === 1 ? (
            <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 bg-[#f8faff]">
               <p className="text-gray-500 font-medium text-sm">
                   The central nerve center for your photos. Upload data, enhance photos with AI, remove backgrounds, and verify everything before generation.
               </p>

                <PhotoProcessor 
                    students={students} 
                    currentOrder={currentOrder} 
                    photoMatches={photoMatches}
                    setPhotoMatches={setPhotoMatches}
                    onStatsUpdate={handleStatsUpdate}
                    onPhotosProcessed={(matches) => {
                        setPhotoMatches(matches);
                    }}
                    onComplete={async () => {
                        await refreshOrder();
                    }}
                    onProceedToStep2={() => {
                        setMainStep(2);
                        setField('idCard.bulkWorkflow.mode', targetMode);
                    }}
                    proceedButtonText={proceedText}
                />
            </div>
        ) : (
            <div className="flex-1 flex overflow-hidden relative">
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
            </div>
        )}
      </main>

      <ToastContainer />
    </div>
  );
}
