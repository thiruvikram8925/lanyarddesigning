import React from 'react';
import { 
  X, Package, Truck, CheckCircle2, Box, MapPin, Calendar, 
  CreditCard, FileText, Download, Printer, Share2, Info, 
  ExternalLink, ArrowRight, ShieldCheck, HelpCircle
} from 'lucide-react';
import { formatCurrency } from '../lib/pricing';

const OrderProgress = ({ status }) => {
  const steps = ['Pending', 'Processing', 'Shipping', 'Out for Delivery', 'Delivered'];
  const currentIndex = steps.indexOf(status);

  return (
    <div className="py-10">
      <div className="flex justify-between mb-6">
        {steps.map((step, index) => (
          <div key={step} className="flex flex-col items-center gap-2 relative">
            {/* Connector line */}
            {index < steps.length - 1 && (
              <div className={`absolute left-1/2 top-5 w-full h-[2px] -z-10 ${
                index < currentIndex ? 'bg-[#5d5fef]' : 'bg-[#eef2f6]'
              }`} />
            )}
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center border-2 transition-all duration-500 ${
              index <= currentIndex 
                ? 'bg-[#5d5fef] border-[#5d5fef] text-white shadow-lg shadow-[#5d5fef]/25 scale-110' 
                : 'bg-white border-[#eef2f6] text-[#919191] scale-100'
            }`}>
              {step === 'Pending' && <Box size={18} />}
              {step === 'Processing' && <Package size={18} />}
              {step === 'Shipping' && <Truck size={18} />}
              {step === 'Out for Delivery' && <MapPin size={18} />}
              {step === 'Delivered' && <CheckCircle2 size={18} />}
            </div>
            <span className={`text-[10px] font-black uppercase tracking-widest text-center w-24 transition-colors duration-300 ${
              index <= currentIndex ? 'text-[#1a1a1a]' : 'text-[#919191]'
            }`}>{step}</span>
          </div>
        ))}
      </div>
      <div className="h-2 w-full bg-[#f8faff] rounded-full overflow-hidden border border-[#eef2f6] p-0.5">
        <div 
          className="h-full bg-gradient-to-r from-[#5d5fef] via-[#82e9ff] to-[#5d5fef] bg-[length:200%_100%] animate-gradient transition-all duration-1000 ease-out rounded-full"
          style={{ width: `${(currentIndex / (steps.length - 1)) * 100}%` }}
        />
      </div>
    </div>
  );
};

export default function OrderDetailsModal({ order, isOpen = true, onClose }) {
  if (!isOpen || !order) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-[#1a1a1a]/40 backdrop-blur-md animate-fade-in p-4 overflow-y-auto">
      <div className="bg-white rounded-[48px] shadow-2xl max-w-4xl w-full my-auto transform animate-scale-in overflow-hidden border border-white/20">
        
        {/* Header Section */}
        <div className="bg-gradient-to-br from-[#1a1a1a] to-[#2d2d2d] p-10 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#5d5fef]/10 rounded-full -mr-32 -mt-32 blur-3xl" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#82e9ff]/5 rounded-full -ml-24 -mb-24 blur-3xl" />
          
          <button 
            onClick={onClose}
            className="absolute top-8 right-8 p-3 bg-white/10 hover:bg-white/20 rounded-2xl text-white/70 hover:text-white transition-all backdrop-blur-md border border-white/10"
          >
            <X size={20} />
          </button>

          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-[#82e9ff] shadow-inner border border-white/10">
                  <ShieldCheck size={24} />
                </div>
                <div>
                  <span className="text-[#82e9ff] font-black uppercase tracking-[0.2em] text-[10px]">Production Order</span>
                  <h2 className="text-4xl font-black tracking-tight mt-1">{order.id}</h2>
                </div>
              </div>
              <p className="text-white/50 text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                <Calendar size={14} />
                Ordered on {new Date(order.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}
              </p>
            </div>
            <div className="text-left md:text-right">
              <div className="flex items-center md:justify-end gap-2 mb-2">
                 <span className={`text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full border ${
                   order.status === 'Delivered' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/20' : 'bg-amber-500/20 text-amber-400 border-amber-500/20'
                 }`}>
                   {order.status}
                 </span>
              </div>
              <p className="text-5xl font-black text-white tracking-tighter">{formatCurrency(order.total)}</p>
              <p className="text-white/40 text-[10px] font-black uppercase tracking-widest mt-1">Inclusive of all taxes & shipping</p>
            </div>
          </div>
        </div>

        <div className="p-10 space-y-10">
          
          {/* Order Progress */}
          <section className="bg-[#f8faff] p-8 rounded-[40px] border border-[#eef2f6]">
            <div className="flex items-center justify-between mb-4">
               <h3 className="text-lg font-black text-[#1a1a1a] tracking-tight">Delivery Timeline</h3>
               <button className="text-[#5d5fef] text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:gap-3 transition-all">
                  Track Live Shipment <ExternalLink size={12} />
               </button>
            </div>
            <OrderProgress status={order.status} />
          </section>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            
            {/* Design & Config */}
            <div className="space-y-6">
              <h3 className="text-lg font-black text-[#1a1a1a] tracking-tight uppercase tracking-widest border-b border-[#eef2f6] pb-4">Design Specification</h3>
              <div className="flex gap-6 items-start">
                <div className="w-32 h-40 bg-white rounded-[28px] overflow-hidden border border-[#eef2f6] p-2 shrink-0 shadow-inner group-hover:scale-105 transition-transform duration-500 flex items-center justify-center">
                  {order.previewImage && order.previewImage !== 'Preview too large for storage' ? (
                    <img src={order.previewImage} alt="Preview" className="w-full h-full object-contain" />
                  ) : order.idCardPreview && order.idCardPreview !== 'Preview too large for storage' ? (
                    <img src={order.idCardPreview} alt="Preview" className="w-full h-full object-contain" />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-slate-200">
                      <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">P</div>
                      <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">No Preview</span>
                    </div>
                  )}
                </div>
                <div className="space-y-4 flex-1">
                  <div>
                    <h4 className="text-2xl font-black text-[#1a1a1a] tracking-tight">{order.designName}</h4>
                    <p className="text-[#5d5fef] font-black text-xs uppercase tracking-widest mt-1">Lanyard Pro Series</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Quantity</p>
                      <p className="text-lg font-black text-slate-800">{order.quantity} Units</p>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Unit Price</p>
                      <p className="text-lg font-black text-slate-800">{formatCurrency(order.pricePerUnit)}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Complete Specifications Grid */}
              <div className="bg-slate-50 rounded-3xl p-6 border border-[#eef2f6] space-y-4">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-[#eef2f6] pb-2">Technical Specifications</h4>
                <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Width:</span>
                    <span className="font-bold text-slate-700">{order.design?.width || '20mm'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Length:</span>
                    <span className="font-bold text-slate-700">{order.design?.length || '38"'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Printing:</span>
                    <span className="font-bold text-slate-700">{order.design?.printingMethod || 'Sublimated'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Style:</span>
                    <span className="font-bold text-slate-700">{order.design?.lanyardStyle || 'Single Ended'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Strap Color:</span>
                    <span className="font-bold text-slate-700 flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded-full border border-slate-300 shrink-0" style={{ backgroundColor: order.design?.lanyardColor || '#ffffff' }} />
                      {order.design?.lanyardColor || '#ffffff'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Clip Type:</span>
                    <span className="font-bold text-slate-700">{order.design?.clipType || 'Metal Hook'}</span>
                  </div>
                  <div className="flex justify-between col-span-2">
                    <span className="text-slate-400">Accessories:</span>
                    <span className="font-bold text-slate-700">{(order.design?.accessories || ['Badge Holder']).join(', ')}</span>
                  </div>
                  {order.design?.customTextLeft || order.design?.customTextCenter || order.design?.customTextRight ? (
                    <div className="col-span-2 pt-2 border-t border-[#eef2f6] space-y-1">
                      <span className="text-[10px] text-slate-400 uppercase tracking-widest">Custom Lanyard Text:</span>
                      <div className="bg-white p-2 rounded-xl border border-slate-200 font-mono text-[10px] text-slate-600 break-all space-y-0.5">
                        {order.design?.customTextLeft && <p>Left: "{order.design.customTextLeft}"</p>}
                        {order.design?.customTextCenter && <p>Center: "{order.design.customTextCenter}"</p>}
                        {order.design?.customTextRight && <p>Right: "{order.design.customTextRight}"</p>}
                      </div>
                    </div>
                  ) : null}
                  {order.design?.idCardSize ? (
                    <div className="col-span-2 pt-2 border-t border-[#eef2f6] grid grid-cols-2 gap-x-4 gap-y-1.5">
                      <div className="flex justify-between col-span-2">
                        <span className="text-slate-400">ID Card Size:</span>
                        <span className="font-bold text-slate-700">{order.design?.idCardSize}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Front BG:</span>
                        <span className="font-bold text-slate-700 flex items-center gap-1">
                          <span className="w-2.5 h-2.5 rounded-full border border-slate-300 shrink-0" style={{ backgroundColor: order.design?.idCardFrontBg || '#ffffff' }} />
                          {order.design?.idCardFrontBg || '#ffffff'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Back BG:</span>
                        <span className="font-bold text-slate-700 flex items-center gap-1">
                          <span className="w-2.5 h-2.5 rounded-full border border-slate-300 shrink-0" style={{ backgroundColor: order.design?.idCardBackBg || '#ffffff' }} />
                          {order.design?.idCardBackBg || '#ffffff'}
                        </span>
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>

            {/* Shipping & Billing */}
            <div className="space-y-6">
              <h3 className="text-lg font-black text-[#1a1a1a] tracking-tight uppercase tracking-widest border-b border-[#eef2f6] pb-4">Delivery Details</h3>
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 shrink-0">
                    <MapPin size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Shipping Address</p>
                    <p className="text-sm font-bold text-slate-700 leading-relaxed">
                      {order.customer || 'Alexander Wright'}<br/>
                      Enterprise Tower, Floor 12<br/>
                      Business District, 560001
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 shrink-0">
                    <CreditCard size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Payment Method</p>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-slate-700">Visa ending in •••• 4242</p>
                      <span className="text-[8px] font-black uppercase tracking-widest bg-blue-50 text-blue-600 px-2 py-0.5 rounded border border-blue-100">Verified</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Footer */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-10 border-t border-[#eef2f6]">
            <div className="flex items-center gap-4">
               <button className="flex items-center gap-2 px-6 py-4 bg-white border border-[#eef2f6] rounded-2xl text-xs font-black text-slate-600 hover:bg-[#5d5fef] hover:text-white transition-all group/btn">
                  <Download size={16} className="group-hover/btn:-translate-y-0.5 transition-transform" />
                  DOWNLOAD INVOICE
               </button>
               <button className="flex items-center gap-2 px-6 py-4 bg-white border border-[#eef2f6] rounded-2xl text-xs font-black text-slate-600 hover:bg-slate-50 transition-all">
                  <Printer size={16} />
                  PRINT RECEIPT
               </button>
            </div>
            <div className="flex items-center gap-4 w-full sm:w-auto">
               <button className="flex-1 sm:flex-none px-10 py-4 bg-[#1a1a1a] text-white rounded-2xl text-xs font-black hover:bg-black shadow-xl transition-all">
                  REORDER DESIGN
               </button>
               <button 
                 onClick={onClose}
                 className="flex-1 sm:flex-none px-10 py-4 bg-[#5d5fef] text-white rounded-2xl text-xs font-black hover:bg-[#4a4cd9] shadow-lg shadow-[#5d5fef]/20 transition-all"
               >
                  DONE
               </button>
            </div>
          </div>
        </div>

        {/* Support Hint */}
        <div className="bg-[#f8faff] p-6 text-center border-t border-[#eef2f6]">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center justify-center gap-3">
             <HelpCircle size={14} className="text-amber-500" />
             Questions about this order? Contact Support at 1-800-LANYARD
          </p>
        </div>
      </div>
    </div>
  );
}
