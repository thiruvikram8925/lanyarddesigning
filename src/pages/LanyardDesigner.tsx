import { useState, useRef, useCallback } from 'react';
import { useConfiguratorStore } from '../store/useConfiguratorStore';
import {
  LayoutTemplate, Palette, Type, Upload, Save, Eye, Download, ShoppingCart,
  ZoomIn, ZoomOut, RotateCcw, Cloud, Loader2, ChevronLeft,
  Layers, History, MonitorSmartphone, Settings2,
  AlignLeft, AlignCenter, AlignRight, FlipHorizontal, Repeat, MoveHorizontal, Baseline, Image, Maximize, GitCommit
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { orderService, projectService } from '../services/dataService';
import { toast } from 'sonner';

// Left sidebar panels
import TemplatesPanel from '../components/lanyard/TemplatesPanel';
import ElementsPanel from '../components/lanyard/ElementsPanel';
import TextPanel from '../components/lanyard/TextPanel';
import UploadPanel from '../components/lanyard/UploadPanel';

// Center canvas views
import LanyardStage from '../components/customizer/LanyardStage';
import FlatLayoutView from '../components/lanyard/FlatLayoutView';
import ClipHardwareView from '../components/lanyard/ClipHardwareView';
import ValidationView from '../components/lanyard/ValidationView';

const LEFT_TABS = [
  { id: 'templates', icon: LayoutTemplate, label: 'Templates' },
  { id: 'elements', icon: Palette, label: 'Elements' },
  { id: 'text', icon: Type, label: 'Text' },
  { id: 'upload', icon: Upload, label: 'Upload' },
] as const;

type LeftTab = typeof LEFT_TABS[number]['id'];
type ViewMode = '2d' | 'flat' | 'clip' | 'validation';
type RightTab = 'props' | 'layers' | 'views' | 'history';

export default function LanyardDesigner() {
  const navigate = useNavigate();
  const design = useConfiguratorStore(s => s.design);
  const setField = useConfiguratorStore(s => s.setField);
  const isSyncing = useConfiguratorStore(s => s.isSyncing);
  const saveLocal = useConfiguratorStore(s => s.saveLocal);

  const [leftTab, setLeftTab] = useState<LeftTab>('templates');
  const [leftPanelOpen, setLeftPanelOpen] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('2d');
  const [rightTab, setRightTab] = useState<RightTab>('props');
  const [zoom, setZoom] = useState(1);
  const [saveMsg, setSaveMsg] = useState('');
  const stageRef = useRef<unknown>(null);
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'super-admin' || user?.role === 'ultra-super-admin';
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  const handlePlaceOrder = async () => {
    setIsPlacingOrder(true);
    try {
      let projectId = design.idCard.selected;
      if (!projectId) {
        projectId = `lanyard-${Date.now()}`;
        setField('idCard.selected', projectId);
      }

      // Check if project exists in database, otherwise create it first
      try {
        await projectService.getById(projectId);
      } catch (err) {
        await projectService.create({
          id: projectId,
          name: design.customTextLeft || design.customTextCenter || 'Lanyard Project',
          organization: user?.organization || 'Unknown Org',
          status: 'draft',
          template: 'Lanyard',
        });
      }

      await saveLocal(projectId);

      const orderId = `order-${projectId}`;
      try {
        await orderService.create({
          id: orderId,
          projectId,
          status: 'submitted',
        });
      } catch {
        await orderService.updateStatus(orderId, 'submitted');
      }

      toast.success('Order placed successfully! Submitted to Admin.');
    } catch (error: any) {
      console.error('Error placing order:', error);
      toast.error(error.response?.data?.message || 'Failed to place order');
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

  const VIEW_TABS: { id: ViewMode; label: string; dot?: boolean }[] = [
    { id: '2d', label: '2D View' },
    { id: 'flat', label: 'Flat Layout' },
    { id: 'clip', label: 'Clip & Hardware' },
    { id: 'validation', label: 'Validation', dot: true },
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-7rem)] bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      {/* ─── Top Header Bar ─────────────────────────────────── */}
      <header className="h-14 shrink-0 bg-white border-b border-slate-200 flex items-center justify-between px-5 z-50">
        {/* Left: Back + Title */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-indigo-600 transition-all"
          >
            <ChevronLeft size={16} />
            Dashboard
          </button>
          <div className="w-px h-5 bg-slate-200" />
          <h1 className="text-sm font-bold text-slate-800">New Lanyard Project</h1>
          {saveMsg && (
            <span className="text-[11px] font-semibold text-emerald-500 flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
              {saveMsg}
            </span>
          )}
        </div>

        {/* Center: View Mode Tabs */}
        <div className="flex items-center bg-slate-100 rounded-lg p-1">
          {VIEW_TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setViewMode(tab.id)}
              className={`relative px-4 py-1.5 text-[11px] font-bold rounded-md transition-all ${
                viewMode === tab.id
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {tab.label}
              {tab.dot && (
                <span className={`absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full ${
                  viewMode === tab.id ? 'bg-amber-300' : 'bg-amber-500'
                }`} />
              )}
            </button>
          ))}
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
          <div className="w-[240px] shrink-0 bg-white border-r border-slate-200 flex flex-col overflow-hidden">
            {leftTab === 'templates' && <TemplatesPanel />}
            {leftTab === 'elements' && <ElementsPanel />}
            {leftTab === 'text' && <TextPanel />}
            {leftTab === 'upload' && <UploadPanel />}
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
                  🎗 Lanyard
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
          {viewMode === 'flat' && <FlatLayoutView />}
          {viewMode === 'clip' && <ClipHardwareView />}
          {viewMode === 'validation' && <ValidationView />}
        </div>

        {/* Right Sidebar */}
        <div className="w-[320px] shrink-0 bg-white border-l border-slate-200 flex flex-col overflow-hidden">
          {/* Right Tabs */}
          <div className="shrink-0 flex border-b border-slate-200">
            {([
              { id: 'props' as RightTab, icon: Settings2, label: 'Props' },
              { id: 'layers' as RightTab, icon: Layers, label: 'Layers' },
              { id: 'views' as RightTab, icon: MonitorSmartphone, label: 'Views' },
              { id: 'history' as RightTab, icon: History, label: 'History' },
            ]).map(tab => {
              const Icon = tab.icon;
              const isActive = rightTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setRightTab(tab.id)}
                  className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 transition-all border-b-2 ${
                    isActive
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-slate-400 hover:text-slate-600'
                  }`}
                >
                  <Icon size={16} />
                  <span className="text-[9px] font-bold">{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Right Content */}
          <div className="flex-1 overflow-y-auto">
            {rightTab === 'props' && (
              <div className="p-4">
                <h3 className="text-sm font-bold text-slate-800 mb-1">Lanyard Settings</h3>
                <p className="text-[10px] text-indigo-500 font-medium mb-5">Click a strap zone to edit it</p>

                <div className="space-y-4">
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                    <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                      Lanyard Strap Text
                    </h4>

                    <div className="space-y-3">
                      {design.copyMode === 'synchronized' ? (
                        <div>
                          <label className="text-[10px] text-slate-400 font-medium block mb-1">Lanyard Text (Mirrored on all sides)</label>
                          <input
                            type="text"
                            placeholder="e.g. COMPANY NAME"
                            value={design.customTextLeft || ''}
                            onChange={e => {
                              setField('customTextLeft', e.target.value);
                              setField('customTextCenter', e.target.value);
                              setField('customTextRight', e.target.value);
                            }}
                            className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white"
                          />
                        </div>
                      ) : (
                        <>
                          <div>
                            <label className="text-[10px] text-slate-400 font-medium block mb-1">Left Strap Text</label>
                            <input
                              type="text"
                              placeholder="e.g. RAVENCLAW"
                              value={design.customTextLeft || ''}
                              onChange={e => setField('customTextLeft', e.target.value)}
                              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] text-slate-400 font-medium block mb-1">Right Strap Text</label>
                            <input
                              type="text"
                              placeholder="e.g. UNIVERSITY"
                              value={design.customTextRight || ''}
                              onChange={e => setField('customTextRight', e.target.value)}
                              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] text-slate-400 font-medium block mb-1">Center Text / Badge</label>
                            <input
                              type="text"
                              placeholder="e.g. STAFF / VIP"
                              value={design.customTextCenter || ''}
                              onChange={e => setField('customTextCenter', e.target.value)}
                              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white"
                            />
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Text Formatting */}
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                    <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                      Text Formatting
                    </h4>
                    <div className="space-y-3">
                      <div>
                        <label className="text-[10px] text-slate-400 font-medium block mb-1">Font Family</label>
                        <select
                          value={design.fontFamily || 'Montserrat'}
                          onChange={e => setField('fontFamily', e.target.value)}
                          className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white"
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
                      </div>
                      <div className="flex gap-2">
                        <div className="flex-1">
                          <label className="text-[10px] text-slate-400 font-medium block mb-1">Font Size</label>
                          <input
                            type="number"
                            value={design.fontSize || 14}
                            onChange={e => setField('fontSize', parseInt(e.target.value) || 14)}
                            min="8"
                            max="72"
                            className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white"
                          />
                        </div>
                        <div className="flex-1">
                          <label className="text-[10px] text-slate-400 font-medium block mb-1">Font Color</label>
                          <div className="flex items-center gap-2">
                            <input
                              type="color"
                              value={design.fontColor || '#000000'}
                              onChange={e => setField('fontColor', e.target.value)}
                              className="w-8 h-8 rounded cursor-pointer border-0 p-0 bg-transparent"
                            />
                            <input
                              type="text"
                              value={design.fontColor || '#000000'}
                              onChange={e => setField('fontColor', e.target.value)}
                              className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white uppercase font-mono"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Advanced Text Settings */}
                      <div className="pt-3 mt-3 border-t border-slate-200 space-y-3">
                        {/* Style Toggles */}
                        <div className="flex gap-1.5">
                          <button 
                            className={`flex-1 flex flex-col items-center justify-center py-2 px-1 rounded-lg border text-[9px] font-bold transition-colors ${design.copyMode === 'synchronized' ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                            onClick={() => setField('copyMode', design.copyMode === 'synchronized' ? 'multi-zone' : 'synchronized')}
                          >
                            <FlipHorizontal size={14} className="mb-1" />
                            {design.copyMode === 'synchronized' ? 'Mirrored' : 'Multi-Zone'}
                          </button>
                          
                          <button 
                            className={`flex-1 flex flex-col items-center justify-center py-2 px-1 rounded-lg border text-[9px] font-bold transition-colors ${design.lanyardDesignStyle === 'repeated' ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                            onClick={() => setField('lanyardDesignStyle', design.lanyardDesignStyle === 'repeated' ? 'central-logo' : 'repeated')}
                          >
                            <Repeat size={14} className="mb-1" />
                            {design.lanyardDesignStyle === 'repeated' ? 'Repeated' : 'Central'}
                          </button>
                        </div>

                        {/* Alignment */}
                        <div>
                          <label className="text-[10px] text-slate-400 font-medium block mb-1">Alignment</label>
                          <div className="flex p-0.5 bg-slate-100 rounded-lg">
                            {['Left', 'Center', 'Right'].map((align) => {
                              const Icon = align === 'Left' ? AlignLeft : align === 'Right' ? AlignRight : AlignCenter;
                              return (
                                <button
                                  key={align}
                                  onClick={() => setField('textPosition', align)}
                                  className={`flex-1 flex justify-center py-1.5 rounded-md transition-all ${design.textPosition === align ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                >
                                  <Icon size={14} />
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Sliders / Inputs */}
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <MoveHorizontal size={14} className="text-slate-400" />
                            <div className="flex-1">
                              <div className="flex justify-between mb-1">
                                <span className="text-[9px] text-slate-400 font-bold">Spacing</span>
                                <span className="text-[9px] text-slate-600 font-mono">{design.textSpacing || 60}px</span>
                              </div>
                              <input
                                type="range"
                                min="10" max="200"
                                value={design.textSpacing || 60}
                                onChange={e => setField('textSpacing', parseInt(e.target.value))}
                                className="w-full accent-indigo-500"
                              />
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <RotateCcw size={14} className="text-slate-400" />
                            <div className="flex-1">
                              <div className="flex justify-between mb-1">
                                <span className="text-[9px] text-slate-400 font-bold">Rotation</span>
                                <span className="text-[9px] text-slate-600 font-mono">{design.textAngle || 0}°</span>
                              </div>
                              <input
                                type="range"
                                min="-180" max="180"
                                value={design.textAngle || 0}
                                onChange={e => setField('textAngle', parseInt(e.target.value))}
                                className="w-full accent-indigo-500"
                              />
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Baseline size={14} className="text-slate-400" />
                            <div className="flex-1">
                              <div className="flex justify-between mb-1">
                                <span className="text-[9px] text-slate-400 font-bold">Offset</span>
                                <span className="text-[9px] text-slate-600 font-mono">{design.textOffset || 0}px</span>
                              </div>
                              <input
                                type="range"
                                min="-200" max="200"
                                value={design.textOffset || 0}
                                onChange={e => setField('textOffset', parseInt(e.target.value))}
                                className="w-full accent-indigo-500"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Logo & Pattern Settings */}
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                    <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-3">Logo & Pattern</h4>
                    
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Image size={14} className="text-slate-400" />
                        <div className="flex-1">
                          <div className="flex justify-between mb-1">
                            <span className="text-[9px] text-slate-400 font-bold">Logo Scale</span>
                            <span className="text-[9px] text-slate-600 font-mono">{design.logoScale || 1}x</span>
                          </div>
                          <input
                            type="range"
                            min="0.5" max="3" step="0.1"
                            value={design.logoScale || 1}
                            onChange={e => setField('logoScale', parseFloat(e.target.value))}
                            className="w-full accent-indigo-500"
                          />
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Maximize size={14} className="text-slate-400" />
                        <div className="flex-1">
                          <div className="flex justify-between mb-1">
                            <span className="text-[9px] text-slate-400 font-bold">Pattern Scale</span>
                            <span className="text-[9px] text-slate-600 font-mono">{design.patternScale || 100}%</span>
                          </div>
                          <input
                            type="range"
                            min="10" max="300"
                            value={design.patternScale || 100}
                            onChange={e => setField('patternScale', parseInt(e.target.value))}
                            className="w-full accent-indigo-500"
                          />
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <GitCommit size={14} className="text-slate-400" />
                        <div className="flex-1">
                          <div className="flex justify-between mb-1">
                            <span className="text-[9px] text-slate-400 font-bold">Pattern Opacity</span>
                            <span className="text-[9px] text-slate-600 font-mono">{Math.round((design.strapPatternOpacity ?? 0.85) * 100)}%</span>
                          </div>
                          <input
                            type="range"
                            min="10" max="100"
                            value={Math.round((design.strapPatternOpacity ?? 0.85) * 100)}
                            onChange={e => setField('strapPatternOpacity', parseInt(e.target.value) / 100)}
                            className="w-full accent-indigo-500"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Quick Info */}
                  <div className="p-3 bg-indigo-50 rounded-lg border border-indigo-100">
                    <h4 className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider mb-2">Current Config</h4>
                    <div className="space-y-1.5">
                      <div className="flex justify-between">
                        <span className="text-[10px] text-slate-500">Method</span>
                        <span className="text-[10px] font-bold text-slate-700">{design.printingMethod}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[10px] text-slate-500">Style</span>
                        <span className="text-[10px] font-bold text-slate-700">{design.lanyardStyle}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[10px] text-slate-500">Width</span>
                        <span className="text-[10px] font-bold text-slate-700">{design.width}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[10px] text-slate-500">Clip</span>
                        <span className="text-[10px] font-bold text-slate-700">{design.clipType}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[10px] text-slate-500">Font</span>
                        <span className="text-[10px] font-bold text-slate-700">{design.fontFamily}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-slate-500">Color</span>
                        <div className="flex items-center gap-1.5">
                          <div className="w-4 h-4 rounded-full border border-slate-200" style={{ backgroundColor: design.lanyardColor?.includes('gradient') ? '#888' : design.lanyardColor }} />
                          <span className="text-[10px] font-mono text-slate-500">
                            {design.lanyardColor?.includes('gradient') ? 'Gradient' : design.customColorCode?.toUpperCase()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {rightTab === 'layers' && (
              <div className="p-4">
                <h3 className="text-sm font-bold text-slate-800 mb-3">Layers</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-3 p-2.5 bg-indigo-50 border border-indigo-100 rounded-lg">
                    <div className="w-6 h-6 bg-indigo-100 rounded flex items-center justify-center">
                      <Type size={12} className="text-indigo-600" />
                    </div>
                    <span className="text-[11px] font-bold text-slate-700 flex-1">Strap Text</span>
                    <Eye size={12} className="text-slate-400" />
                  </div>
                  <div className="flex items-center gap-3 p-2.5 bg-slate-50 border border-slate-100 rounded-lg">
                    <div className="w-6 h-6 bg-slate-100 rounded flex items-center justify-center">
                      <Palette size={12} className="text-slate-500" />
                    </div>
                    <span className="text-[11px] font-bold text-slate-700 flex-1">Strap Color</span>
                    <Eye size={12} className="text-slate-400" />
                  </div>
                  <div className="flex items-center gap-3 p-2.5 bg-slate-50 border border-slate-100 rounded-lg">
                    <div className="w-6 h-6 bg-slate-100 rounded flex items-center justify-center">
                      <Layers size={12} className="text-slate-500" />
                    </div>
                    <span className="text-[11px] font-bold text-slate-700 flex-1">Background</span>
                    <Eye size={12} className="text-slate-400" />
                  </div>
                </div>
              </div>
            )}

            {rightTab === 'views' && (
              <div className="p-4">
                <h3 className="text-sm font-bold text-slate-800 mb-3">Views</h3>
                <div className="space-y-2">
                  {VIEW_TABS.map(v => (
                    <button
                      key={v.id}
                      onClick={() => setViewMode(v.id)}
                      className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-all text-left ${
                        viewMode === v.id
                          ? 'bg-indigo-50 border-indigo-300'
                          : 'bg-white border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${viewMode === v.id ? 'bg-indigo-100' : 'bg-slate-100'}`}>
                        <MonitorSmartphone size={14} className={viewMode === v.id ? 'text-indigo-600' : 'text-slate-400'} />
                      </div>
                      <span className="text-xs font-bold text-slate-700">{v.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {rightTab === 'history' && (
              <div className="p-4">
                <h3 className="text-sm font-bold text-slate-800 mb-3">History</h3>
                <div className="flex flex-col items-center py-8 text-center">
                  <History size={32} className="text-slate-200 mb-2" />
                  <p className="text-[11px] text-slate-400">Undo/redo history will appear here</p>
                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={() => useConfiguratorStore.getState().undo()}
                      className="px-3 py-1.5 text-[11px] font-bold bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition"
                    >
                      ↩ Undo
                    </button>
                    <button
                      onClick={() => useConfiguratorStore.getState().redo()}
                      className="px-3 py-1.5 text-[11px] font-bold bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition"
                    >
                      Redo ↪
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sync Status */}
          <div className="shrink-0 px-4 py-2.5 border-t border-slate-200 bg-slate-50">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
              {isSyncing ? (
                <>
                  <Loader2 size={12} className="animate-spin text-indigo-500" />
                  <span className="text-indigo-600">Saving...</span>
                </>
              ) : (
                <>
                  <Cloud size={12} className="text-emerald-500" />
                  <span>Saved</span>
                </>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
