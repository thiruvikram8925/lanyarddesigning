import { useRef } from 'react';
import { Download, X } from 'lucide-react';
import { formatCurrency } from '../lib/pricing';
import { showToast } from './Toast';

export default function InvoiceModal({ order, onClose }) {
  const invoiceRef = useRef(null);

  if (!order) return null;

  return (
    <>
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #invoice-modal, #invoice-modal * {
            visibility: visible;
          }
          #invoice-modal {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 20px !important;
            background: white !important;
            box-shadow: none !important;
            border: none !important;
            border-radius: 0 !important;
            margin: 0 !important;
            transform: none !important;
          }
          .print-hide, .print-hide * {
            display: none !important;
          }
          /* Ensure background colors print correctly */
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>
      <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-md animate-fade-in p-4 overflow-y-auto">
        <div className="bg-white rounded-[16px] shadow-2xl max-w-2xl w-full my-4 transform animate-scale-in overflow-hidden border border-white/20 relative">
          <div className="absolute top-4 right-4 flex gap-2 z-10 print-hide">
            <button 
              onClick={() => {
                window.print();
                showToast('Invoice downloaded successfully', 'success', 'Downloaded');
              }}
              className="p-2.5 bg-[#5d5fef] text-white hover:bg-[#4a4cd9] rounded-lg transition-all shadow-lg flex items-center gap-1.5 font-bold text-[12px]"
            >
              <Download size={14} />
              Download PDF
            </button>
            <button 
              onClick={onClose}
              className="p-2.5 bg-slate-100 text-slate-500 hover:text-slate-800 hover:bg-slate-200 rounded-lg transition-all"
            >
              <X size={16} />
            </button>
          </div>

          <div id="invoice-modal" ref={invoiceRef} className="p-10 bg-white text-slate-800">
            {/* Header */}
            <div className="flex justify-between items-start border-b border-slate-100 pb-6 mb-6">
              <div className="flex items-center gap-4">
                <div className="w-40 h-16 flex items-center justify-center overflow-hidden">
                  <svg viewBox="0 0 240 80" className="w-full h-full object-contain" xmlns="http://www.w3.org/2000/svg">
                    <g transform="translate(0, 10)">
                      <text x="0" y="40" fontFamily="Arial, sans-serif" fontSize="46" fontWeight="900" fill="#003b8e" letterSpacing="-1">G</text>
                      <g transform="translate(35, 5)">
                        <path d="M18,0 C8,0 0,8 0,18 C0,32 18,50 18,50 C18,50 36,32 36,18 C36,8 28,0 18,0 Z" fill="#e30613"/>
                        <circle cx="18" cy="18" r="8" fill="#ffffff"/>
                        <circle cx="18" cy="18" r="4" fill="#e30613"/>
                      </g>
                      <text x="75" y="40" fontFamily="Arial, sans-serif" fontSize="46" fontWeight="900" fill="#003b8e" letterSpacing="-1">TEK</text>
                      <text x="78" y="58" fontFamily="Arial, sans-serif" fontSize="11" fill="#666666" letterSpacing="0.5">Tracking technology</text>
                      <text x="110" y="72" fontFamily="Arial, sans-serif" fontSize="11" fill="#666666" letterSpacing="0.5">you can trust</text>
                    </g>
                  </svg>
                </div>
                <div>
                  <h1 className="text-xl font-black text-slate-900 tracking-tight">Gotek</h1>
                  <p className="text-[11px] text-slate-500">info@gotek.in | +91 98765 43210</p>
                  <p className="text-[10px] text-slate-500 mt-0.5 max-w-[280px] leading-tight">
                    Old No. 166/1, New No. 317/1, 2nd Floor, Konnur High Rd, opposite to Ramanuja Arch, Vasantha nagar, Chinna Chembarambakkam, Ayanavaram, Chennai, Tamil Nadu 600023
                  </p>
                </div>
              </div>
              <div className="text-right">
                <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-1">INVOICE</h2>
                <p className="text-slate-500 font-bold text-sm">{order.id.replace('PRO-', 'INV-')}</p>
                <div className="inline-block mt-2 px-3 py-0.5 bg-emerald-100 text-emerald-700 font-black text-[9px] uppercase tracking-widest rounded-full border border-emerald-200">
                  Paid
                </div>
              </div>
            </div>

            {/* Bill To & Dates */}
            <div className="flex justify-between mb-8">
              <div>
                <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Bill To:</h3>
                <p className="text-base font-black text-slate-900">{order.customer}</p>
                <p className="text-[12px] text-slate-600">{order.email}</p>
                <p className="text-[11px] text-slate-600 mt-0.5 max-w-[200px] leading-tight">113 First Floor, A Block, Tech Village, Bangalore, Karnataka - 560100, India</p>
              </div>
              <div className="text-right space-y-1">
                <div className="flex justify-end gap-3 text-[12px]">
                  <span className="text-slate-500 font-bold">Issue Date:</span>
                  <span className="text-slate-900 font-black w-24">{order.date}</span>
                </div>
                <div className="flex justify-end gap-3 text-[12px]">
                  <span className="text-slate-500 font-bold">Due Date:</span>
                  <span className="text-slate-900 font-black w-24">{order.date}</span>
                </div>
              </div>
            </div>

            {/* Table */}
            <table className="w-full mb-6 text-[12px]">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 text-slate-600 font-bold">Description</th>
                  <th className="text-center py-3 text-slate-600 font-bold">HSN</th>
                  <th className="text-center py-3 text-slate-600 font-bold">Qty</th>
                  <th className="text-right py-3 text-slate-600 font-bold">Rate</th>
                  <th className="text-right py-3 text-slate-600 font-bold">Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-slate-100">
                  <td className="py-4 text-slate-800 font-bold">{order.designName}</td>
                  <td className="py-4 text-center text-slate-600">4836</td>
                  <td className="py-4 text-center text-slate-800 font-bold">{order.quantity}</td>
                  <td className="py-4 text-right text-slate-800 font-bold">{formatCurrency(order.pricePerUnit)}</td>
                  <td className="py-4 text-right text-slate-800 font-black">{formatCurrency(order.quantity * order.pricePerUnit)}</td>
                </tr>
              </tbody>
            </table>

            {/* Totals */}
            <div className="flex justify-end mb-10">
              <div className="w-60 space-y-2 text-[13px]">
                <div className="flex justify-between text-slate-600 font-bold">
                  <span className="text-right w-1/2">Sub Total:</span>
                  <span className="text-right w-1/2">{formatCurrency(order.quantity * order.pricePerUnit)}</span>
                </div>
                <div className="flex justify-between text-slate-600 font-bold border-b border-slate-200 pb-2">
                  <span className="text-right w-1/2">Tax (18%):</span>
                  <span className="text-right w-1/2">{formatCurrency((order.quantity * order.pricePerUnit) * 0.18)}</span>
                </div>
                <div className="flex justify-between text-slate-900 font-black text-lg pt-1">
                  <span className="text-right w-1/2">Grand Total:</span>
                  <span className="text-[#5d5fef] text-right w-1/2">{formatCurrency(order.total)}</span>
                </div>
              </div>
            </div>

            {/* Signature */}
            <div className="flex justify-end">
              <div className="text-center w-40">
                <div className="w-full h-16 bg-slate-50 border border-slate-200 rounded-lg mb-1.5 flex items-center justify-center">
                  <span className="font-signature text-2xl text-slate-800 opacity-80 italic">Gotek Admin</span>
                </div>
                <p className="text-[10px] font-black text-slate-900">Gotek Solutions</p>
                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">Authorised Signatory</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}