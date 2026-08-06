import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { projectService } from '@/services/dataService';
import { useConfiguratorStore } from '@/store/useConfiguratorStore';
import LanyardStage from '@/components/customizer/LanyardStage';
import { formatDate } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { 
  X, ExternalLink, Calendar, User, Building2, Package, Tag, Palette, 
  Type, Image as ImageIcon, ShieldAlert, Layers, CheckCircle2, Clock, 
  AlertCircle, Truck, Copy
} from 'lucide-react';
import { toast } from 'sonner';

interface LanyardOrderDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: any;
  onStatusUpdate?: (orderId: string, newStatus: string) => void;
}

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  draft: { label: 'Draft', color: 'bg-gray-500', icon: Clock },
  submitted: { label: 'Submitted', color: 'bg-amber-500', icon: Package },
  uploaded: { label: 'Uploaded', color: 'bg-blue-500', icon: AlertCircle },
  validated: { label: 'Validated', color: 'bg-purple-500', icon: CheckCircle2 },
  generated: { label: 'Generated', color: 'bg-emerald-500', icon: CheckCircle2 },
  exported: { label: 'Exported', color: 'bg-green-600', icon: Truck },
};

export default function LanyardOrderDetailsModal({
  isOpen,
  onClose,
  order,
  onStatusUpdate
}: LanyardOrderDetailsModalProps) {
  const navigate = useNavigate();
  const [project, setProject] = useState<any>(null);
  const [design, setDesign] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [previewTab, setPreviewTab] = useState<'2d' | 'flat'>('2d');
  const [stageKey, setStageKey] = useState(0);

  useEffect(() => {
    if (!isOpen || !order) return;

    const loadProjectDesign = async () => {
      setIsLoading(true);
      try {
        const projectId = order.projectId || order.project?.id || order.id?.replace('order-', '');
        if (projectId) {
          const projectData = await projectService.getById(projectId);
          setProject(projectData);

          if (projectData && projectData.design_state) {
            try {
              const parsedDesign = typeof projectData.design_state === 'string'
                ? JSON.parse(projectData.design_state)
                : projectData.design_state;
              setDesign(parsedDesign);
              useConfiguratorStore.setState({ design: parsedDesign });
            } catch (e) {
              console.error('Failed to parse design state', e);
            }
          }
        }
      } catch (err) {
        console.error('Error fetching project for order:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadProjectDesign();
  }, [isOpen, order]);

  if (!order) return null;

  const orderId = order._id || order.id || 'N/A';
  const status = order.status || 'submitted';
  const statusInfo = statusConfig[status] || { label: status, color: 'bg-gray-500', icon: Clock };
  const StatusIcon = statusInfo.icon;

  const logosList = Array.isArray(design?.lanyardLogos) && design.lanyardLogos.length > 0
    ? design.lanyardLogos
    : (design?.logoUrl ? [{ id: '1', url: design.logoUrl, name: design.logoName || 'Logo' }] : []);

  const copyOrderId = () => {
    navigator.clipboard.writeText(orderId);
    toast.success('Order ID copied to clipboard!');
  };

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
      <DialogContent className="max-w-5xl max-h-[92vh] flex flex-col p-0 overflow-hidden rounded-2xl bg-white border border-slate-200 shadow-2xl">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center font-bold text-white shadow-md">
              <Package size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold tracking-tight">Lanyard Order Specification</h2>
                <button
                  onClick={copyOrderId}
                  className="px-2 py-0.5 text-[10px] bg-slate-800 hover:bg-slate-700 font-mono text-slate-300 rounded flex items-center gap-1 transition"
                  title="Copy Order ID"
                >
                  <Copy size={10} />
                  {orderId.slice(0, 12)}...
                </button>
              </div>
              <p className="text-[11px] text-slate-400">Full specs and design viewer for manufacturing</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Status Selector */}
            <Select
              value={status}
              onValueChange={newStatus => {
                onStatusUpdate?.(orderId, newStatus);
                toast.success(`Updated order status to ${newStatus}`);
              }}
            >
              <SelectTrigger className="w-[140px] h-8 text-xs bg-slate-800 border-slate-700 text-white font-bold">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="submitted">Submitted</SelectItem>
                <SelectItem value="uploaded">Uploaded</SelectItem>
                <SelectItem value="validated">Validated</SelectItem>
                <SelectItem value="generated">Generated</SelectItem>
                <SelectItem value="exported">Exported</SelectItem>
              </SelectContent>
            </Select>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50">
          {isLoading ? (
            <div className="py-20 flex flex-col items-center justify-center text-center">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 mb-3"></div>
              <p className="text-xs font-bold text-slate-500">Loading order design details...</p>
            </div>
          ) : (
            <>
              {/* Order Metadata Strip */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1">Status</span>
                  <Badge className={`${statusInfo.color} text-white px-2.5 py-0.5 text-xs font-bold flex items-center w-fit gap-1`}>
                    <StatusIcon size={12} />
                    {statusInfo.label}
                  </Badge>
                </div>

                <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1">Created Date</span>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                    <Calendar size={13} className="text-slate-400" />
                    {formatDate(order.createdAt || order.created_at || new Date().toISOString())}
                  </div>
                </div>

                <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1">Project / School</span>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 truncate">
                    <Building2 size={13} className="text-slate-400 shrink-0" />
                    <span className="truncate">{project?.name || (order.project as any)?.name || 'Lanyard Project'}</span>
                  </div>
                </div>

                <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1">Quantity</span>
                  <div className="flex items-center gap-1.5 text-xs font-extrabold text-indigo-600">
                    <Tag size={13} className="text-indigo-500" />
                    {design?.quantity || order.student_count || 100} Units
                  </div>
                </div>
              </div>

              {/* Main Content Grid: Preview + Specs */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* 2D Canvas Lanyard Preview */}
                <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                  <div className="px-4 py-3 bg-slate-100 border-b border-slate-200 flex items-center justify-between">
                    <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                      <ImageIcon size={14} className="text-indigo-600" />
                      Visual Lanyard Preview
                    </h3>
                    <div className="flex bg-white p-0.5 rounded-lg border border-slate-200">
                      <button
                        onClick={() => setPreviewTab('2d')}
                        className={`px-3 py-1 text-[11px] font-bold rounded-md transition ${
                          previewTab === '2d' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        2D Mode
                      </button>
                      <button
                        onClick={() => setPreviewTab('flat')}
                        className={`px-3 py-1 text-[11px] font-bold rounded-md transition ${
                          previewTab === 'flat' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Flat Layout
                      </button>
                    </div>
                  </div>

                  <div className="h-[400px] w-full relative bg-slate-50 flex items-center justify-center p-2">
                    <LanyardStage key={stageKey} isFlatMode={previewTab === 'flat'} currentStep={1} zoom={1} />
                  </div>
                </div>

                {/* Specs Panel */}
                <div className="lg:col-span-5 space-y-4">
                  {/* General Lanyard Specs */}
                  <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                    <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5 border-b pb-2">
                      <Palette size={14} className="text-indigo-600" />
                      Strap Specifications
                    </h3>

                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold block">Printing Method</span>
                        <span className="font-extrabold text-slate-700">{design?.printingMethod || 'Full Color Sublimation'}</span>
                      </div>

                      <div>
                        <span className="text-[10px] text-slate-400 font-bold block">Lanyard Style</span>
                        <span className="font-extrabold text-slate-700">{design?.lanyardStyle || 'Standard Lanyard'}</span>
                      </div>

                      <div>
                        <span className="text-[10px] text-slate-400 font-bold block">Strap Width</span>
                        <span className="font-extrabold text-slate-700">{design?.width || '20mm'}</span>
                      </div>

                      <div>
                        <span className="text-[10px] text-slate-400 font-bold block">Strap Color</span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <div
                            className="w-4 h-4 rounded-full border border-slate-300 shadow-xs"
                            style={{ backgroundColor: design?.lanyardColor || design?.customColorCode || '#cc1111' }}
                          />
                          <span className="font-mono text-xs font-extrabold text-slate-700">
                            {design?.lanyardColor || design?.customColorCode || '#cc1111'}
                          </span>
                        </div>
                      </div>

                      <div>
                        <span className="text-[10px] text-slate-400 font-bold block">Hardware Clip</span>
                        <span className="font-extrabold text-slate-700">{design?.clipType || 'Metal Hook'}</span>
                      </div>

                      <div>
                        <span className="text-[10px] text-slate-400 font-bold block">Accessories</span>
                        <span className="font-extrabold text-slate-700">
                          {Array.isArray(design?.accessories) && design.accessories.length > 0
                            ? design.accessories.join(', ')
                            : 'None'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Typography & Custom Text Specs */}
                  <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                    <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5 border-b pb-2">
                      <Type size={14} className="text-indigo-600" />
                      Text & Typography Specs
                    </h3>

                    <div className="space-y-2 text-xs">
                      <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-100 font-medium">
                        <div>
                          <span className="text-[9px] text-slate-400 font-bold uppercase block">Left Text</span>
                          <span className="font-extrabold text-slate-800">{design?.customTextLeft || '—'}</span>
                        </div>
                        <div>
                          <span className="text-[9px] text-slate-400 font-bold uppercase block">Center Text</span>
                          <span className="font-extrabold text-slate-800">{design?.customTextCenter || '—'}</span>
                        </div>
                        <div>
                          <span className="text-[9px] text-slate-400 font-bold uppercase block">Right Text</span>
                          <span className="font-extrabold text-slate-800">{design?.customTextRight || '—'}</span>
                        </div>
                        <div>
                          <span className="text-[9px] text-slate-400 font-bold uppercase block">Secondary Text</span>
                          <span className="font-extrabold text-slate-800">{design?.customTextSecondary || '—'}</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-1 text-slate-600">
                        <div>Font: <span className="font-bold text-slate-800">{design?.fontFamily || 'Montserrat'}</span></div>
                        <div>Size: <span className="font-bold text-slate-800">{design?.fontSize || 18}px</span></div>
                        <div>Angle: <span className="font-bold text-slate-800">{design?.textAngle || 0}°</span></div>
                        <div>Spacing: <span className="font-bold text-slate-800">{design?.textSpacing || 60}px</span></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Uploaded Images Gallery */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5 border-b pb-2">
                  <ImageIcon size={14} className="text-indigo-600" />
                  Uploaded Images on Lanyard ({logosList.length})
                </h3>

                {logosList.length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-2">No uploaded images attached to this lanyard design.</p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
                    {logosList.map((logo: any, i: number) => (
                      <div key={logo.id || i} className="p-2 bg-slate-50 rounded-xl border border-slate-200 text-center">
                        <div className="w-full h-16 bg-white rounded-lg border border-slate-200 p-1 flex items-center justify-center mb-1.5 overflow-hidden">
                          <img src={logo.url} alt={logo.name || 'Logo'} className="max-w-full max-h-full object-contain" />
                        </div>
                        <p className="text-[10px] font-bold text-slate-700 truncate">{logo.name || `Image ${i + 1}`}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-slate-100 border-t border-slate-200 flex items-center justify-between shrink-0">
          <Button
            variant="default"
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm flex items-center gap-1.5"
            onClick={() => {
              const projectId = order.projectId || order.project?.id || order.id?.replace('order-', '');
              if (projectId) {
                navigate(`/customizer?orderId=${projectId}`);
              } else {
                toast.error('No project associated with this order');
              }
            }}
          >
            <ExternalLink size={14} />
            Open in Workspace / Designer
          </Button>

          <Button
            variant="outline"
            onClick={onClose}
            className="text-xs font-bold border-slate-300 text-slate-700"
          >
            Close Specs
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
