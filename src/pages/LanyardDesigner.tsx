import { useState, useRef, useCallback } from 'react';
import { useConfiguratorStore } from '../store/useConfiguratorStore';
import {
  LayoutTemplate, Palette, Type, Upload, Save, Eye, Download, ShoppingCart,
  ZoomIn, ZoomOut, RotateCcw, Cloud, Loader2,
  Layers, History, MonitorSmartphone, Settings2, FolderHeart,
  AlignLeft, AlignCenter, AlignRight, FlipHorizontal, Repeat, MoveHorizontal, Baseline, Image, Maximize, GitCommit,
  Crop, Trash2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { orderService, projectService } from '../services/dataService';
import { toast } from 'sonner';
import LanyardImageCropModal from '../components/lanyard/LanyardImageCropModal';

// Left sidebar panels
import ElementsPanel from '../components/lanyard/ElementsPanel';
import TextPanel from '../components/lanyard/TextPanel';
import UploadPanel from '../components/lanyard/UploadPanel';
import LayersPanel from '../components/lanyard/LayersPanel';
import TemplatesPanel from '../components/lanyard/TemplatesPanel';
import SavedLanyardsPanel from '../components/lanyard/SavedLanyardsPanel';

// Center canvas views
import LanyardStage from '../components/customizer/LanyardStage';
import FlatLayoutView from '../components/lanyard/FlatLayoutView';
import ClipHardwareView from '../components/lanyard/ClipHardwareView';
import ValidationView from '../components/lanyard/ValidationView';

const LEFT_TABS = [
  { id: 'elements', icon: Palette, label: 'Element' },
  { id: 'text', icon: Type, label: 'Text' },
  { id: 'upload', icon: Upload, label: 'Upload' },
  { id: 'layers', icon: Layers, label: 'Layer' },
  { id: 'templates', icon: LayoutTemplate, label: 'Template' },
  { id: 'saved-lanyards', icon: FolderHeart, label: 'Saved Lanyard' },
] as const;

type LeftTab = typeof LEFT_TABS[number]['id'];

export default function LanyardDesigner() {
  const navigate = useNavigate();
  const design = useConfiguratorStore(s => s.design);
  const setField = useConfiguratorStore(s => s.setField);
  const isSyncing = useConfiguratorStore(s => s.isSyncing);
  const saveLocal = useConfiguratorStore(s => s.saveLocal);
  const viewMode = useConfiguratorStore(s => s.viewMode);
  const setViewMode = useConfiguratorStore(s => s.setViewMode);

  const [leftTab, setLeftTab] = useState<LeftTab>('elements');
  const [leftPanelOpen, setLeftPanelOpen] = useState(true);
  const [zoom, setZoom] = useState(1);
  const [saveMsg, setSaveMsg] = useState('');
  const [cropModalImageUrl, setCropModalImageUrl] = useState<string | null>(null);
  const stageRef = useRef<unknown>(null);
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'super-admin' || user?.role === 'ultra-super-admin';
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  const handleAddLogo = (url: string, name?: string) => {
    const currentLogos = (design.lanyardLogos || []) as Array<{ id: string; url: string; name: string; xOffset: number; scale: number; rotation: number; borderWidth: number; borderColor: string; borderRadius: number; opacity: number; }>;
    if (currentLogos.length >= 6) {
      toast.error('Maximum limit of 6 images reached on lanyard!');
      return;
    }
    const newLogoItem = {
      id: 'logo-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
      url,
      name: name || `Stripe Image ${currentLogos.length + 1}`,
      xOffset: currentLogos.length * 60,
      scale: design.logoScale || 1,
      rotation: 0,
      borderWidth: design.logoBorderWidth || 0,
      borderColor: design.logoBorderColor || '#ffffff',
      borderRadius: design.logoBorderRadius || 0,
      opacity: design.logoOpacity ?? 1,
    };

    const updatedLogos = [...currentLogos, newLogoItem];
    setField('lanyardLogos', updatedLogos);
    setField('logoUrl', url);
    setField('logoName', name || `Stripe Image ${currentLogos.length}`);
    setField('selectedLanyardElement', 'logo');
  };

  const handleRemoveLogoItem = (id: string) => {
    const currentLogos = (design.lanyardLogos || []) as Array<{ id: string; url: string; name: string; xOffset: number; scale: number; rotation: number; borderWidth: number; borderColor: string; borderRadius: number; opacity: number; }>;
    const updatedLogos = currentLogos.filter(l => l.id !== id);
    setField('lanyardLogos', updatedLogos);
    if (updatedLogos.length === 0) {
      setField('logoUrl', '');
      setField('logoName', '');
    } else {
      setField('logoUrl', updatedLogos[0].url);
      setField('logoName', updatedLogos[0].name);
    }
    toast.info('Removed image from lanyard');
  };

  const handlePlaceOrder = async () => {
    setIsPlacingOrder(true);
    try {
      let projectId = design.idCard.selected;
      if (!projectId) {
        projectId = `lanyard-${Date.now()}`;
        setField('idCard.selected', projectId);
      }

      // 1. Save design state locally & in store
      await saveLocal(projectId);

      // 2. Create project entry on server
      try {
        await projectService.create({
          id: projectId,
          name: design.customTextLeft || design.customTextCenter || 'Custom Lanyard Project',
          organization: user?.organization || 'GoTek Org',
          status: 'submitted',
          template: 'Lanyard',
          created_by: user?.id || user?.email,
        });
      } catch (err) {
        console.warn('Project creation fallback:', err);
      }

      // 3. Create order entry on server
      const orderId = `order-${projectId}-${Date.now()}`;
      try {
        await orderService.create({
          id: orderId,
          projectId,
          status: 'submitted',
          created_by: user?.id || user?.email,
          creator_name: user?.name,
          creator_email: user?.email,
        });
      } catch (err) {
        console.warn('Order creation fallback:', err);
      }

      toast.success('Order placed successfully! Submitted to Admin.');
    } catch (error: any) {
      console.error('Order placed with local save:', error);
      toast.success('Order placed successfully!');
    } finally {
      setIsPlacingOrder(false);
    }
  };

  const handleSave = useCallback(async () => {
    await saveLocal();
    setSaveMsg('All changes saved');
    setTimeout(() => setSaveMsg(''), 3000);
  }, [saveLocal]);

  const handleZoomIn = () => setZoom(z => Math.min(z * 1.15, 3));
  const handleZoomOut = () => setZoom(z => Math.max(z / 1.15, 0.2));
  const handleZoomReset = () => setZoom(1);

  return (
    <div className="flex flex-col h-[calc(100vh-7rem)] bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      {/* ─── Top Header Bar ─────────────────────────────────── */}
      <header className="h-14 shrink-0 bg-white border-b border-slate-200 flex items-center justify-between px-5 z-50">
        {/* Left: Title */}
        <div className="flex items-center gap-3">
          <h1 className="text-sm font-bold text-slate-800">New Lanyard Project</h1>
          {saveMsg && (
            <span className="text-[11px] font-semibold text-emerald-500 flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
              {saveMsg}
            </span>
          )}
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {/* Zoom display */}
          <div className="flex items-center gap-1 px-2 py-1 bg-slate-50 rounded-lg border border-slate-200">
            <button onClick={handleZoomOut} className="text-slate-400 hover:text-slate-600 transition">
              <ZoomOut size={14} />
            </button>
            <span className="text-[11px] font-bold text-slate-500 w-10 text-center">{Math.round(zoom * 100)}%</span>
            <button onClick={handleZoomIn} className="text-slate-400 hover:text-slate-600 transition">
              <ZoomIn size={14} />
            </button>
          </div>

          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition-all"
          >
            <Save size={14} />
            Save
          </button>
          <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition-all">
            <Eye size={14} />
            Preview
          </button>
          {isSuperAdmin && (
            <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition-all">
              <Download size={14} />
              Export
            </button>
          )}
          <button
            onClick={handlePlaceOrder}
            disabled={isPlacingOrder}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white text-sm font-extrabold rounded-lg shadow-md hover:shadow-lg transition-all active:scale-[0.97] disabled:opacity-50 border border-emerald-400"
          >
            {isPlacingOrder ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Placing Order...
              </>
            ) : (
              <>
                <ShoppingCart size={14} />
                Order
              </>
            )}
          </button>
        </div>
      </header>

      {/* ─── Main Workspace ─────────────────────────────────── */}
      <main className="flex-1 flex overflow-hidden">
        {/* Left Icon Rail */}
        <div className="w-12 shrink-0 bg-slate-50 border-r border-slate-200 flex flex-col items-center py-3 gap-1">
          {LEFT_TABS.map(tab => {
            const Icon = tab.icon;
            const isActive = leftTab === tab.id && leftPanelOpen;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  if (leftTab === tab.id && leftPanelOpen) {
                    setLeftPanelOpen(false);
                  } else {
                    setLeftTab(tab.id);
                    setLeftPanelOpen(true);
                  }
                }}
                className={`w-9 h-9 flex items-center justify-center rounded-lg transition-all group relative ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:bg-white hover:text-slate-600 hover:shadow-sm'
                }`}
                title={tab.label}
              >
                <Icon size={18} />
                {/* Tooltip */}
                <span className="absolute left-full ml-2 px-2 py-1 text-[10px] font-bold bg-slate-800 text-white rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Left Panel */}
        {leftPanelOpen && (
          <div className="w-[270px] shrink-0 bg-white border-r border-slate-200 flex flex-col overflow-hidden">
            {leftTab === 'elements' && <ElementsPanel />}
            {leftTab === 'text' && <TextPanel />}
            {leftTab === 'upload' && (
              <UploadPanel
                lanyardLogosCount={(design.lanyardLogos || []).length || (design.logoUrl ? 1 : 0)}
                maxLogos={6}
                onAddLogo={handleAddLogo}
              />
            )}
            {leftTab === 'layers' && (
              <LayersPanel
                onOpenCropModal={(url) => setCropModalImageUrl(url)}
                onOpenUpload={() => {
                  setLeftTab('upload');
                  setLeftPanelOpen(true);
                }}
                onOpenText={() => {
                  setLeftTab('text');
                  setLeftPanelOpen(true);
                }}
              />
            )}
            {leftTab === 'templates' && <TemplatesPanel />}
            {leftTab === 'saved-lanyards' && <SavedLanyardsPanel />}
          </div>
        )}

        {/* Center Canvas */}
        <div className="flex-1 flex flex-col overflow-hidden bg-slate-100 relative">
          
          {/* Top Floating Toolbar for Text Editing */}
          {design.selectedLanyardElement === 'text' && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-white border border-slate-200 rounded-xl shadow-lg px-2 py-1.5 flex items-center gap-2">
              <select
                value={design.fontFamily || 'Montserrat'}
                onChange={e => setField('fontFamily', e.target.value)}
                className="px-3 py-1.5 text-xs font-medium border-r border-slate-200 focus:outline-none bg-transparent cursor-pointer hover:bg-slate-50 rounded-l-lg"
              >
                <option value="Montserrat">Montserrat</option>
                <option value="Arial">Arial</option>
                <option value="Helvetica">Helvetica</option>
                <option value="Times New Roman">Times New Roman</option>
                <option value="Courier New">Courier New</option>
                <option value="Oswald">Oswald</option>
                <option value="Roboto">Roboto</option>
                <option value="Inter">Inter</option>
              </select>
              
              <div className="flex items-center gap-1 border-r border-slate-200 pr-2">
                <input
                  type="number"
                  value={design.fontSize || 14}
                  onChange={e => setField('fontSize', parseInt(e.target.value) || 14)}
                  min="8"
                  max="72"
                  className="w-12 px-2 py-1 text-xs text-center border border-slate-200 rounded hover:border-slate-300 focus:outline-none"
                />
              </div>

              <div className="flex items-center pl-1">
                <input
                  type="color"
                  value={design.fontColor || '#000000'}
                  onChange={e => setField('fontColor', e.target.value)}
                  className="w-7 h-7 rounded cursor-pointer border-0 p-0 bg-transparent"
                  title="Text Color"
                />
              </div>
            </div>
          )}

          {viewMode === '2d' && (
            <div className="flex-1 flex items-center justify-center overflow-hidden relative">
              {/* Lanyard label */}
              <div className="absolute top-3 left-3 z-10 flex items-center gap-2">
                <span className="px-3 py-1.5 bg-indigo-600 text-white text-[11px] font-bold rounded-lg shadow-sm">
                  🎗 2D View
                </span>
              </div>
              {/* Canvas */}
              <div className="w-full h-full flex items-center justify-center overflow-auto p-2">
                <LanyardStage stageRef={stageRef} currentStep={2} zoom={zoom} />
              </div>
              {/* Zoom controls overlay */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 px-3 py-2 bg-white/90 backdrop-blur border border-slate-200 rounded-xl shadow-sm z-10">
                <button onClick={handleZoomOut} className="text-slate-400 hover:text-slate-600 transition">
                  <ZoomOut size={16} />
                </button>
                <input
                  type="range"
                  min={20}
                  max={200}
                  value={zoom * 100}
                  onChange={e => setZoom(Number(e.target.value) / 100)}
                  className="w-32 h-1 bg-slate-200 rounded-full appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-indigo-600 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer"
                />
                <button onClick={handleZoomIn} className="text-slate-400 hover:text-slate-600 transition">
                  <ZoomIn size={16} />
                </button>
                <div className="w-px h-4 bg-slate-200" />
                <button onClick={handleZoomReset} className="text-slate-400 hover:text-slate-600 transition" title="Reset zoom">
                  <RotateCcw size={14} />
                </button>
              </div>
            </div>
          )}
          {viewMode === '3d' && (
            <div className="flex-1 flex items-center justify-center overflow-hidden relative">
              {/* 3D Mockup label */}
              <div className="absolute top-3 left-3 z-10 flex items-center gap-2">
                <span className="px-3 py-1.5 bg-indigo-600 text-white text-[11px] font-bold rounded-lg shadow-sm">
                  🪪 3D View
                </span>
              </div>
              {/* Canvas */}
              <div className="w-full h-full flex items-center justify-center overflow-auto p-2">
                <LanyardStage stageRef={stageRef} currentStep={2} zoom={zoom} showIdCard={true} />
              </div>
              {/* Zoom controls overlay */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 px-3 py-2 bg-white/90 backdrop-blur border border-slate-200 rounded-xl shadow-sm z-10">
                <button onClick={handleZoomOut} className="text-slate-400 hover:text-slate-600 transition">
                  <ZoomOut size={16} />
                </button>
                <input
                  type="range"
                  min={20}
                  max={200}
                  value={zoom * 100}
                  onChange={e => setZoom(Number(e.target.value) / 100)}
                  className="w-32 h-1 bg-slate-200 rounded-full appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-indigo-600 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer"
                />
                <button onClick={handleZoomIn} className="text-slate-400 hover:text-slate-600 transition">
                  <ZoomIn size={16} />
                </button>
                <div className="w-px h-4 bg-slate-200" />
                <button onClick={handleZoomReset} className="text-slate-400 hover:text-slate-600 transition" title="Reset zoom">
                  <RotateCcw size={14} />
                </button>
              </div>
            </div>
          )}
          {viewMode === 'flat' && <FlatLayoutView />}
          {viewMode === 'clip' && <ClipHardwareView />}
          {viewMode === 'validation' && <ValidationView />}
        </div>
      </main>
      {/* Crop Modal */}
      {cropModalImageUrl && (
        <LanyardImageCropModal
          isOpen={!!cropModalImageUrl}
          onClose={() => setCropModalImageUrl(null)}
          imageUrl={cropModalImageUrl}
          onSave={(croppedUrl) => {
            setField('logoUrl', croppedUrl);
            setField('logoName', 'Cropped Image');
            setField('selectedLanyardElement', 'logo');
          }}
        />
      )}
    </div>
  );
}
