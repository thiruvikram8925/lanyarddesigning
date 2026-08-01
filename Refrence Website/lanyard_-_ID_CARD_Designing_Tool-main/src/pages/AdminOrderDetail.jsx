import { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, ShieldCheck, DollarSign, ShoppingBag, Clock, User, 
  MapPin, Phone, Mail, FileSpreadsheet, Package, Truck, CheckCircle2, 
  Trash2, Download, Eye, Palette, CreditCard, ExternalLink, ZoomIn, 
  ZoomOut, Maximize2, X, Clipboard, Check, Layers, Code, Settings, RefreshCcw
} from 'lucide-react';
import { showToast } from '../components/Toast';
import { formatCurrency } from '../lib/pricing';
import InvoiceModal from '../components/InvoiceModal';

const STATUS_OPTIONS = ['Pending', 'Processing', 'Shipping', 'Out for Delivery', 'Delivered'];

export default function AdminOrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [showInvoice, setShowInvoice] = useState(false);
  const [copiedText, setCopiedText] = useState(null);

  // Zoom & Pan Lightbox States
  const [zoomImage, setZoomImage] = useState(null);
  const [zoomScale, setZoomScale] = useState(1);
  const [zoomOffset, setZoomOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const imageContainerRef = useRef(null);

  useEffect(() => {
    const savedOrders = JSON.parse(localStorage.getItem('myLanyardOrders') || '[]');
    const found = savedOrders.find(o => o.id === id);
    if (found) {
      setOrder(found);
    } else {
      showToast('Order not found', 'error');
      navigate('/admin');
    }
  }, [id, navigate]);

  // Lightbox wheel zoom handler
  useEffect(() => {
    const container = imageContainerRef.current;
    if (!container) return;

    const onWheel = (e) => {
      e.preventDefault();
      const zoomFactor = 1.15;
      const newScale = e.deltaY < 0 ? zoomScale * zoomFactor : zoomScale / zoomFactor;
      setZoomScale(Math.max(0.5, Math.min(8, newScale)));
    };

    container.addEventListener('wheel', onWheel, { passive: false });
    return () => container.removeEventListener('wheel', onWheel);
  }, [zoomImage, zoomScale]);

  const handleMouseDown = (e) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX - zoomOffset.x, y: e.clientY - zoomOffset.y });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    setZoomOffset({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  const resetZoom = () => {
    setZoomScale(1);
    setZoomOffset({ x: 0, y: 0 });
  };

  const closeZoom = () => {
    setZoomImage(null);
    resetZoom();
  };

  const updateOrderStatus = (newStatus) => {
    if (!order) return;
    const savedOrders = JSON.parse(localStorage.getItem('myLanyardOrders') || '[]');
    const updated = savedOrders.map(o => 
      o.id === order.id ? { ...o, status: newStatus } : o
    );
    localStorage.setItem('myLanyardOrders', JSON.stringify(updated));
    setOrder({ ...order, status: newStatus });

    showToast(`Order status updated to ${newStatus}.`, 'success', 'Status Updated');
    window.dispatchEvent(new Event('orderStatusUpdated'));
  };

  const deleteOrder = () => {
    if (!order) return;
    if (window.confirm(`Are you sure you want to delete order ${order.id}? This action cannot be undone.`)) {
      const savedOrders = JSON.parse(localStorage.getItem('myLanyardOrders') || '[]');
      const filtered = savedOrders.filter(o => o.id !== order.id);
      localStorage.setItem('myLanyardOrders', JSON.stringify(filtered));
      showToast(`Order ${order.id} has been deleted.`, 'success');
      window.dispatchEvent(new Event('orderStatusUpdated'));
      navigate('/admin');
    }
  };

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    showToast(`${label} copied to clipboard!`, 'success');
    setTimeout(() => setCopiedText(null), 2000);
  };

  if (!order) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-slate-400">
        <div className="flex items-center gap-3">
          <RefreshCcw className="animate-spin text-indigo-500" />
          <span>Loading Order Details…</span>
        </div>
      </div>
    );
  }

  const design = order.design || {};

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans pb-20">
      
      {/* ── Top Bar / Navigation ── */}
      <div className="bg-slate-950 border-b border-slate-800 py-4 px-4 sm:px-8 sticky top-0 z-40 backdrop-blur-md bg-opacity-90">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/admin')}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20 font-mono uppercase">
                  {order.id}
                </span>
                <h1 className="text-sm sm:text-base font-bold text-white hidden sm:block">Production Specifications</h1>
              </div>
              <p className="text-[10px] sm:text-xs text-slate-500 font-medium">{order.customer} ({order.email})</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowInvoice(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-bold transition-all cursor-pointer"
            >
              <Download size={13} /> Invoice
            </button>
            <button
              onClick={deleteOrder}
              className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white transition-colors cursor-pointer"
              title="Delete Order"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* ── Main Layout (2 Columns) ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* ── Left Column: Visual Proofs & Downloadable Assets (5 cols) ── */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-slate-950 border border-slate-800/80 rounded-3xl p-6">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Palette size={14} className="text-indigo-400" /> Visual Proofing Suite
            </h2>

            <div className="space-y-6">
              {/* 2D Mockup */}
              <div className="bg-slate-900/60 rounded-2xl p-4 border border-slate-800/80 flex flex-col items-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">2D Lanyard Hanging View</span>
                {order.previewImage && order.previewImage !== 'Preview too large for storage' ? (
                  <div 
                    onClick={() => setZoomImage(order.previewImage)}
                    className="w-full h-56 bg-slate-950 rounded-xl border border-slate-800/80 p-3 flex items-center justify-center cursor-zoom-in group relative"
                  >
                    <img src={order.previewImage} alt="2D Lanyard Proof" className="max-h-full max-w-full object-contain" />
                    <div className="absolute inset-0 bg-indigo-600/10 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center text-xs font-bold text-white">
                      <Maximize2 size={18} />
                    </div>
                  </div>
                ) : (
                  <div className="w-full h-56 bg-slate-950 rounded-xl border border-slate-800 flex flex-col items-center justify-center text-slate-600 text-xs">
                    No 2D Preview Available
                  </div>
                )}
              </div>

              {/* Flat Print Layouts */}
              <div className="bg-slate-900/60 rounded-2xl p-4 border border-slate-800/80 flex flex-col">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3 text-center">Flat Strap Print Proofs</span>
                <div className="grid grid-cols-2 gap-3">
                  {order.flatFrontPreview ? (
                    <div 
                      onClick={() => setZoomImage(order.flatFrontPreview)}
                      className="h-40 bg-slate-950 rounded-xl border border-slate-800/80 p-2 flex flex-col items-center justify-center cursor-zoom-in group relative"
                    >
                      <img src={order.flatFrontPreview} alt="Flat Front" className="max-h-[90%] max-w-full object-contain" />
                      <span className="text-[8px] font-black text-slate-500 uppercase mt-1">Front</span>
                      <div className="absolute inset-0 bg-indigo-600/10 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center text-xs font-bold text-white">
                        <Maximize2 size={16} />
                      </div>
                    </div>
                  ) : (
                    <div className="h-40 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-center text-slate-650 text-[10px]">No Front Flat</div>
                  )}

                  {order.flatBackPreview ? (
                    <div 
                      onClick={() => setZoomImage(order.flatBackPreview)}
                      className="h-40 bg-slate-950 rounded-xl border border-slate-800/80 p-2 flex flex-col items-center justify-center cursor-zoom-in group relative"
                    >
                      <img src={order.flatBackPreview} alt="Flat Back" className="max-h-[90%] max-w-full object-contain" />
                      <span className="text-[8px] font-black text-slate-500 uppercase mt-1">Back</span>
                      <div className="absolute inset-0 bg-indigo-600/10 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center text-xs font-bold text-white">
                        <Maximize2 size={16} />
                      </div>
                    </div>
                  ) : (
                    <div className="h-40 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-center text-slate-650 text-[10px]">No Back Flat</div>
                  )}
                </div>
              </div>

              {/* ID Card Previews */}
              {order.idCardPreview && (
                <div className="bg-slate-900/60 rounded-2xl p-4 border border-slate-800/80 flex flex-col items-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">ID Card Design Proof</span>
                  <div 
                    onClick={() => setZoomImage(order.idCardPreview)}
                    className="w-full h-56 bg-slate-950 rounded-xl border border-slate-800/80 p-3 flex items-center justify-center cursor-zoom-in group relative"
                  >
                    <img src={order.idCardPreview} alt="ID Card Proof" className="max-h-full max-w-full object-contain" />
                    <div className="absolute inset-0 bg-indigo-600/10 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center text-xs font-bold text-white">
                      <Maximize2 size={18} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Downloadable Client Uploaded Files */}
          {(design.logoUrl || design.customPatternUrl || design.idCard?.photoUrl || design.idCard?.logoUrl) && (
            <div className="bg-slate-950 border border-slate-800/80 rounded-3xl p-6">
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <ExternalLink size={14} className="text-indigo-400" /> Client Graphics & Logo Assets
              </h2>

              <div className="space-y-3">
                {design.logoUrl && design.logoUrl !== 'Stored locally' && (
                  <div className="bg-slate-900 p-3 rounded-2xl border border-slate-800/80 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <img src={design.logoUrl} alt="Lanyard Logo" className="w-10 h-10 object-contain bg-slate-950 rounded-lg p-1 border border-slate-850" />
                      <div>
                        <p className="text-xs font-bold text-white">Strap Logo Asset</p>
                        <p className="text-[9px] text-slate-500 font-mono truncate max-w-[150px]">{design.logoName || 'Uploaded Image'}</p>
                      </div>
                    </div>
                    <a href={design.logoUrl} download={design.logoName || 'lanyard_logo'} className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-indigo-600/20 text-indigo-300 hover:bg-indigo-600 hover:text-white text-xs font-bold transition-all">
                      <Download size={12} /> Download
                    </a>
                  </div>
                )}

                {design.customPatternUrl && design.customPatternUrl !== 'Stored locally' && (
                  <div className="bg-slate-900 p-3 rounded-2xl border border-slate-800/80 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <img src={design.customPatternUrl} alt="Pattern Logo" className="w-10 h-10 object-contain bg-slate-950 rounded-lg p-1 border border-slate-850" />
                      <div>
                        <p className="text-xs font-bold text-white">Strap Pattern Asset</p>
                        <p className="text-[9px] text-slate-500 font-mono truncate max-w-[150px]">{design.customPatternName || 'Uploaded Pattern'}</p>
                      </div>
                    </div>
                    <a href={design.customPatternUrl} download={design.customPatternName || 'lanyard_pattern'} className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-indigo-600/20 text-indigo-300 hover:bg-indigo-600 hover:text-white text-xs font-bold transition-all">
                      <Download size={12} /> Download
                    </a>
                  </div>
                )}

                {design.idCard?.photoUrl && design.idCard?.photoUrl !== 'Stored locally' && (
                  <div className="bg-slate-900 p-3 rounded-2xl border border-slate-800/80 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <img src={design.idCard.photoUrl} alt="ID Photo" className="w-10 h-10 object-contain bg-slate-950 rounded-lg p-1 border border-slate-850" />
                      <div>
                        <p className="text-xs font-bold text-white">ID Card Photo Upload</p>
                        <p className="text-[9px] text-slate-500 font-mono truncate max-w-[150px]">Student / Employee Photo</p>
                      </div>
                    </div>
                    <a href={design.idCard.photoUrl} download="id_photo" className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-indigo-600/20 text-indigo-300 hover:bg-indigo-600 hover:text-white text-xs font-bold transition-all">
                      <Download size={12} /> Download
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ── Right Column: Specs & Data grids (7 cols) ── */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Order Meta & Status */}
          <div className="bg-slate-950 border border-slate-800/80 rounded-3xl p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
              <div>
                <span className="text-xs font-black text-indigo-300 uppercase tracking-widest block">Client Purchase Info</span>
                <p className="text-sm font-mono text-slate-350 mt-1">Ordered on {order.date}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold text-slate-300 shrink-0">Stage Status:</span>
                <select
                  value={order.status}
                  onChange={(e) => updateOrderStatus(e.target.value)}
                  className="bg-slate-900 border border-slate-700 text-slate-200 text-sm font-semibold rounded-xl px-3 py-1.5 focus:outline-none focus:border-indigo-500 cursor-pointer"
                >
                  {STATUS_OPTIONS.map(st => (
                    <option key={st} value={st}>{st}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
              <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800/80">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Quantity Order</span>
                <span className="text-2xl font-black text-white mt-1 block">{order.design?.quantity || 100} Units</span>
              </div>
              <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800/80">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Unit Cost</span>
                <span className="text-2xl font-black text-white mt-1 block">{formatCurrency(order.pricing?.unitPrice || 0)}</span>
              </div>
              <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800/80">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Total Revenue</span>
                <span className="text-2xl font-black text-emerald-400 mt-1 block">{formatCurrency(order.price || order.pricing?.totalPrice || 0)}</span>
              </div>
            </div>

            {/* Client Info Grid */}
            <div className="bg-slate-900/40 p-4 rounded-2xl border border-slate-850/80 mt-4 space-y-3.5">
              <div className="flex items-center gap-3 text-sm">
                <User size={15} className="text-indigo-400 shrink-0" />
                <span className="text-slate-300 w-20 font-bold">Customer:</span>
                <span className="font-extrabold text-white">{order.customer}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Mail size={15} className="text-indigo-400 shrink-0" />
                <span className="text-slate-300 w-20 font-bold">Email:</span>
                <span className="font-extrabold text-white">{order.email}</span>
                <button onClick={() => copyToClipboard(order.email, 'Email')} className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 ml-auto transition-colors">
                  <Clipboard size={12} />
                </button>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <MapPin size={15} className="text-indigo-400 shrink-0" />
                <span className="text-slate-300 w-20 font-bold shrink-0">Shipping:</span>
                <span className="font-bold text-slate-200 leading-relaxed text-xs truncate max-w-[340px]">{order.shippingAddress || 'No shipping address provided'}</span>
                <button onClick={() => copyToClipboard(order.shippingAddress || '', 'Address')} className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 ml-auto transition-colors shrink-0">
                  <Clipboard size={12} />
                </button>
              </div>
            </div>
          </div>

          {/* Lanyard Specifications */}
          <div className="bg-slate-950 border border-slate-800/80 rounded-3xl p-6">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Palette size={14} className="text-indigo-400" /> Complete Lanyard Specification
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              {/* Strap dimensions */}
              <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800/80 space-y-3">
                <span className="text-xs font-black text-indigo-300 uppercase tracking-wider block border-b border-slate-800 pb-2">Strap Dimensions</span>
                <div className="flex justify-between">
                  <span className="text-slate-300 font-semibold">Strap Width:</span>
                  <span className="font-bold text-white">{design.width || '20mm'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-300 font-semibold">Strap Length:</span>
                  <span className="font-bold text-white">{design.length || '38'} in</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-300 font-semibold">Printing Tech:</span>
                  <span className="font-bold text-white">{design.printingMethod || 'Sublimated'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-300 font-semibold">Lanyard Style:</span>
                  <span className="font-bold text-white">{design.lanyardStyle || 'Single Ended'}</span>
                </div>
              </div>

              {/* Hardware attachment details */}
              <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800/80 space-y-3">
                <span className="text-xs font-black text-indigo-300 uppercase tracking-wider block border-b border-slate-800 pb-2">Hardware & Attachments</span>
                <div className="flex justify-between">
                  <span className="text-slate-300 font-semibold">Clip Attachment:</span>
                  <span className="font-bold text-white">{design.clipType || 'Metal Hook'}</span>
                </div>
                <div className="flex justify-between col-span-2">
                  <span className="text-slate-300 font-semibold">Accessories:</span>
                  <span className="font-bold text-indigo-400">{(design.accessories || ['Badge Holder']).join(', ')}</span>
                </div>
              </div>

              {/* Base colors */}
              <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800/80 space-y-3 md:col-span-2">
                <span className="text-xs font-black text-indigo-300 uppercase tracking-wider block border-b border-slate-800 pb-2">Base Color Configuration</span>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Front Color Swatch</span>
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full border border-slate-750 shrink-0 shadow-md" style={{ backgroundColor: design.lanyardColor || '#ffffff' }} />
                      <div>
                        <p className="font-mono font-black text-white">{design.lanyardColor || '#ffffff'}</p>
                        <p className="text-xs font-semibold text-slate-400">Pantone: {design.pantone || 'White'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 border-l border-slate-800 pl-6">
                    <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Back Color (Dual-Sided)</span>
                    {design.isDualSided ? (
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full border border-slate-750 shrink-0 shadow-md" style={{ backgroundColor: design.lanyardColorBack || '#ffffff' }} />
                        <div>
                          <p className="font-mono font-black text-white">{design.lanyardColorBack || '#ffffff'}</p>
                          <p className="text-xs font-semibold text-slate-400">Pantone: {design.pantoneBack || 'White'}</p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 italic mt-1">Single Sided Print Mode</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Pattern geometries */}
              {(design.strapPattern || design.customPatternUrl) && (
                <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800/80 space-y-3 md:col-span-2">
                  <span className="text-xs font-black text-indigo-300 uppercase tracking-wider block border-b border-slate-800 pb-2">Pattern Settings</span>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <span className="text-[11px] font-bold text-slate-300 block uppercase tracking-wider">Strap Pattern</span>
                      <span className="font-bold text-white text-sm mt-0.5 block">{design.strapPattern || 'Custom Pattern Upload'}</span>
                    </div>
                    <div>
                      <span className="text-[11px] font-bold text-slate-300 block uppercase tracking-wider">Opacity</span>
                      <span className="font-mono font-bold text-white text-sm mt-0.5 block">{Math.round((design.strapPatternOpacity || 0.85) * 100)}%</span>
                    </div>
                    <div>
                      <span className="text-[11px] font-bold text-slate-300 block uppercase tracking-wider">Scale</span>
                      <span className="font-mono font-bold text-white text-sm mt-0.5 block">{design.patternScale || 100}%</span>
                    </div>
                    <div>
                      <span className="text-[11px] font-bold text-slate-300 block uppercase tracking-wider">Spacing</span>
                      <span className="font-mono font-bold text-white text-sm mt-0.5 block">{design.patternSpacing || 30}px</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Typography Branding Details */}
              <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800/80 space-y-3 md:col-span-2">
                <span className="text-xs font-black text-indigo-300 uppercase tracking-wider block border-b border-slate-800 pb-2">Custom Typography & Branding</span>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <span className="text-[11px] font-bold text-slate-300 block uppercase tracking-wider">Font Family</span>
                    <span className="font-bold text-white text-sm mt-0.5 block">{design.fontFamily || 'Montserrat'}</span>
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-slate-300 block uppercase tracking-wider">Text Color</span>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="w-4 h-4 rounded-full border border-slate-750" style={{ backgroundColor: design.textColor || '#000000' }} />
                      <span className="font-mono font-black text-white text-sm">{design.textColor || '#000000'}</span>
                    </div>
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-slate-300 block uppercase tracking-wider">Base Size</span>
                    <span className="font-mono font-bold text-white text-sm mt-0.5 block">{design.fontSize || 18} px</span>
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-slate-300 block uppercase tracking-wider">Branding Style</span>
                    <span className="font-bold text-white text-sm mt-0.5 block capitalize">{design.lanyardDesignStyle || 'repeated'}</span>
                  </div>
                </div>

                {/* Custom texts */}
                <div className="mt-4 pt-4 border-t border-slate-800 space-y-3">
                  <span className="text-xs font-bold text-slate-300 uppercase tracking-widest block">Text Strings</span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="bg-slate-950 p-3 rounded-xl border border-slate-850 font-mono text-xs">
                      <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider mb-1">Left Strap Text</span>
                      <span className="font-bold text-indigo-300 text-sm">{design.customTextLeft || '(None)'}</span>
                    </div>
                    <div className="bg-slate-950 p-3 rounded-xl border border-slate-850 font-mono text-xs">
                      <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider mb-1">Center Attachment / Logo Text</span>
                      <span className="font-bold text-indigo-300 text-sm">{design.customTextCenter || '(None)'}</span>
                    </div>
                    <div className="bg-slate-950 p-3 rounded-xl border border-slate-850 font-mono text-xs">
                      <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider mb-1">Right Strap Text</span>
                      <span className="font-bold text-indigo-300 text-sm">{design.customTextRight || '(None)'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ID Card Layer Elements List */}
          {design.idCard && (
            <div className="bg-slate-950 border border-slate-800/80 rounded-3xl p-6">
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <CreditCard size={14} className="text-indigo-400" /> ID Card Specs & Elements
              </h2>

              <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800/80 text-sm space-y-3">
                <div className="flex justify-between border-b border-slate-800 pb-2">
                  <span className="text-slate-300 font-semibold">ID Card Size (CR80):</span>
                  <span className="font-bold text-white">{design.idCard.size || '86x54'} mm</span>
                </div>

                {design.idCard.front?.elements && (
                  <div className="space-y-2">
                    <span className="text-xs font-black text-indigo-300 uppercase tracking-wider block">Front Layout Elements ({design.idCard.front.elements.length})</span>
                    <div className="space-y-1.5 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                      {design.idCard.front.elements.map((el, i) => (
                        <div key={el.id || i} className="bg-slate-950 p-2.5 rounded-xl border border-slate-850 flex items-center justify-between text-xs">
                          <div className="min-w-0">
                            <p className="font-bold text-slate-200 truncate max-w-[200px]">{el.content || el.text || el.id || `Layer ${i + 1}`}</p>
                            <p className="text-[10px] text-slate-400 font-mono">X: {Math.round(el.x || 0)} · Y: {Math.round(el.y || 0)}</p>
                          </div>
                          <span className="text-[10px] font-mono font-bold text-indigo-300 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20 uppercase shrink-0">
                            {el.type}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Stand-alone ID Card Designer Specs */}
          {(order.frontElements || order.backElements) && (
            <div className="bg-slate-950 border border-slate-800/80 rounded-3xl p-6">
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <CreditCard size={14} className="text-indigo-400" /> ID Card Designer Elements
              </h2>

              <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800/80 text-sm space-y-3">
                <div className="flex justify-between border-b border-slate-800 pb-2">
                  <span className="text-slate-300 font-semibold">Card Dimensions:</span>
                  <span className="font-bold text-white">
                    {order.cardSettings?.width || 54}x{order.cardSettings?.height || 86} mm ({order.cardSettings?.orientation || 'portrait'})
                  </span>
                </div>
                <div className="flex justify-between border-b border-slate-800 pb-2">
                  <span className="text-slate-300 font-semibold">Material & Border:</span>
                  <span className="font-bold text-white">
                    {order.cardSettings?.material || 'PVC'} · Thickness: {order.cardSettings?.borderThickness || 3}px
                  </span>
                </div>

                {order.frontElements && order.frontElements.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-xs font-black text-indigo-300 uppercase tracking-wider block">Front Card Elements ({order.frontElements.length})</span>
                    <div className="space-y-1.5 max-h-[180px] overflow-y-auto pr-2 custom-scrollbar">
                      {order.frontElements.map((el, i) => (
                        <div key={el.id || i} className="bg-slate-950 p-2.5 rounded-xl border border-slate-850 flex items-center justify-between text-xs">
                          <div className="min-w-0">
                            <p className="font-bold text-slate-200 truncate max-w-[200px]">{el.text || el.content || el.id || `Layer ${i + 1}`}</p>
                            <p className="text-[10px] text-slate-400 font-mono">X: {Math.round(el.x || 0)} · Y: {Math.round(el.y || 0)}</p>
                          </div>
                          <span className="text-[10px] font-mono font-bold text-indigo-300 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20 uppercase shrink-0">
                            {el.type}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {order.backElements && order.backElements.length > 0 && (
                  <div className="space-y-2 mt-4">
                    <span className="text-xs font-black text-indigo-300 uppercase tracking-wider block">Back Card Elements ({order.backElements.length})</span>
                    <div className="space-y-1.5 max-h-[180px] overflow-y-auto pr-2 custom-scrollbar">
                      {order.backElements.map((el, i) => (
                        <div key={el.id || i} className="bg-slate-950 p-2.5 rounded-xl border border-slate-850 flex items-center justify-between text-xs">
                          <div className="min-w-0">
                            <p className="font-bold text-slate-200 truncate max-w-[200px]">{el.text || el.content || el.id || `Layer ${i + 1}`}</p>
                            <p className="text-[10px] text-slate-400 font-mono">X: {Math.round(el.x || 0)} · Y: {Math.round(el.y || 0)}</p>
                          </div>
                          <span className="text-[10px] font-mono font-bold text-indigo-300 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20 uppercase shrink-0">
                            {el.type}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Collapsible raw design configuration data (JSON viewer) */}
          <div className="bg-slate-950 border border-slate-800/80 rounded-3xl p-6">
            <details className="group">
              <summary className="text-xs font-bold text-slate-400 uppercase tracking-widest cursor-pointer list-none flex items-center justify-between select-none">
                <span className="flex items-center gap-2">
                  <Code size={14} className="text-indigo-400" /> Collapsible Raw JSON Data Specs
                </span>
                <span className="transition-transform group-open:rotate-180">
                  <X size={14} className="rotate-45" />
                </span>
              </summary>
              <div className="mt-4 pt-4 border-t border-slate-800/80">
                <pre className="bg-slate-900 border border-slate-850 p-4 rounded-2xl text-[10px] font-mono text-indigo-300 overflow-x-auto select-text custom-scrollbar max-h-72">
                  {JSON.stringify(order.design || order, null, 2)}
                </pre>
              </div>
            </details>
          </div>
        </div>
      </div>

      {/* ── Interactive Zoom & Pan Lightbox Modal ── */}
      {zoomImage && (
        <div 
          className="fixed inset-0 z-[300] bg-black/90 backdrop-blur-xl flex flex-col select-none animate-fade-in"
          onMouseUp={handleMouseUp}
        >
          {/* Lightbox Controls Header */}
          <div className="h-14 bg-slate-950/80 border-b border-slate-800 px-6 flex items-center justify-between shrink-0 z-10">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Proofing Inspector</span>
              <span className="text-xs font-mono font-bold text-indigo-400 bg-indigo-500/10 px-2.5 py-0.5 rounded-full border border-indigo-500/20">
                {Math.round(zoomScale * 100)}%
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button 
                onClick={() => setZoomScale(s => Math.min(8, s * 1.25))}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer" 
                title="Zoom In"
              >
                <ZoomIn size={16} />
              </button>
              <button 
                onClick={() => setZoomScale(s => Math.max(0.5, s / 1.25))}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer" 
                title="Zoom Out"
              >
                <ZoomOut size={16} />
              </button>
              <button 
                onClick={resetZoom}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
              >
                Reset Zoom
              </button>
              <button 
                onClick={closeZoom}
                className="p-2 rounded-xl bg-rose-500/20 text-rose-400 hover:bg-rose-500 hover:text-white transition-colors cursor-pointer ml-4"
                title="Close Inspector"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Lightbox Interactive Image Canvas */}
          <div 
            ref={imageContainerRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            className={`flex-1 overflow-hidden flex items-center justify-center p-8 relative cursor-${isDragging ? 'grabbing' : 'grab'}`}
          >
            <img 
              src={zoomImage} 
              alt="Inspect Proof" 
              draggable={false}
              className="max-w-none transition-transform duration-75 ease-out shadow-2xl rounded-2xl border-4 border-slate-700 bg-white"
              style={{
                transform: `translate(${zoomOffset.x}px, ${zoomOffset.y}px) scale(${zoomScale})`,
              }}
            />
          </div>
        </div>
      )}

      {/* Invoice Printable Modal */}
      {showInvoice && order && (
        <InvoiceModal 
          order={order} 
          onClose={() => setShowInvoice(false)} 
        />
      )}

    </div>
  );
}
