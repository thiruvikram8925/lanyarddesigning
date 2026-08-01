import { useState, useEffect, useMemo } from 'react';
import { Package, Truck, CheckCircle2, Box, MapPin, Search, Download, Eye, FileText, ChevronRight, Clock } from 'lucide-react';
import InvoiceModal from '../components/InvoiceModal';
import OrderDetailsModal from '../components/OrderDetailsModal';
import { formatCurrency } from '../lib/pricing';

const STATUS_STEPS = ['Pending', 'Processing', 'Shipping', 'Out for Delivery', 'Delivered'];
const STATUS_ICONS = { Pending: Box, Processing: Package, Shipping: Truck, 'Out for Delivery': MapPin, Delivered: CheckCircle2 };

const STATUS_COLORS = {
  Pending: 'bg-amber-100 text-amber-700 border-amber-200',
  Processing: 'bg-blue-100 text-blue-700 border-blue-200',
  Shipping: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  'Out for Delivery': 'bg-purple-100 text-purple-700 border-purple-200',
  Delivered: 'bg-emerald-100 text-emerald-700 border-emerald-200',
};

function StatusBadge({ status }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${STATUS_COLORS[status] || 'bg-slate-100 text-slate-600 border-slate-200'}`}>
      {status}
    </span>
  );
}

function OrderProgress({ status }) {
  const currentIndex = STATUS_STEPS.indexOf(status);
  return (
    <div className="flex items-center gap-1 mt-3">
      {STATUS_STEPS.map((step, i) => (
        <div key={step} className="flex items-center gap-1 flex-1 last:flex-none">
          <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-all ${
            i <= currentIndex ? 'bg-indigo-600' : 'bg-slate-200'
          }`}>
            {i < currentIndex && <CheckCircle2 size={12} className="text-white" />}
            {i === currentIndex && <div className="w-2 h-2 rounded-full bg-white" />}
          </div>
          {i < STATUS_STEPS.length - 1 && (
            <div className={`flex-1 h-0.5 ${i < currentIndex ? 'bg-indigo-600' : 'bg-slate-200'}`} />
          )}
        </div>
      ))}
    </div>
  );
}

export default function Orders({ user }) {
  const [orders, setOrders] = useState([]);
  const [activeTab, setActiveTab] = useState('active');
  const [search, setSearch] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showInvoice, setShowInvoice] = useState(false);

  useEffect(() => {
    const loadOrders = () => {
      const all = JSON.parse(localStorage.getItem('myLanyardOrders') || '[]');
      const userEmail = user?.email || '';
      let filtered = all.filter(o => o.userEmail === userEmail);
      if (filtered.length === 0 && userEmail === 'user@test.com') {
        filtered = [
          { id: 'PRO-2852', customer: 'Test User', email: 'user@test.com', userEmail: 'user@test.com', date: '2026-03-20', status: 'Processing', total: 12500, designName: 'Elite Corporate Blue', quantity: 250, pricePerUnit: 50 },
          { id: 'PRO-2853', customer: 'Test User', email: 'user@test.com', userEmail: 'user@test.com', date: '2026-04-10', status: 'Delivered', total: 8500, designName: 'Tech Innovator Green', quantity: 150, pricePerUnit: 56.6 },
        ];
      }
      setOrders(filtered);
    };
    loadOrders();
    window.addEventListener('orderStatusUpdated', loadOrders);
    return () => window.removeEventListener('orderStatusUpdated', loadOrders);
  }, [user]);

  const filtered = useMemo(() => {
    let list = orders;
    if (activeTab === 'active') list = list.filter(o => o.status !== 'Delivered');
    if (activeTab === 'history') list = list.filter(o => o.status === 'Delivered');
    if (search) list = list.filter(o =>
      o.id.toLowerCase().includes(search.toLowerCase()) ||
      o.designName?.toLowerCase().includes(search.toLowerCase())
    );
    return list;
  }, [orders, activeTab, search]);

  const tabs = [
    { key: 'active', label: 'Active Orders', count: orders.filter(o => o.status !== 'Delivered').length },
    { key: 'history', label: 'Completed', count: orders.filter(o => o.status === 'Delivered').length },
    { key: 'all', label: 'All Orders', count: orders.length },
  ];

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 lg:px-0">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Orders</h1>
          <p className="text-sm text-slate-500 mt-0.5">Track your lanyard and ID card orders</p>
        </div>
      </div>

      {/* Tabs + Search */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
        <div className="flex gap-1 bg-slate-100 rounded-lg p-1">
          {tabs.map(t => (
            <button key={t.key} onClick={() => setActiveTab(t.key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] font-semibold transition-all ${
                activeTab === t.key ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {t.label}
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                activeTab === t.key ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-200 text-slate-500'
              }`}>{t.count}</span>
            </button>
          ))}
        </div>
        <div className="relative sm:ml-auto">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by order ID or design..."
            className="pl-9 pr-4 py-2 text-[13px] border border-slate-200 rounded-lg bg-white w-full sm:w-64 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Order List */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-slate-200">
          <Package size={32} className="mx-auto text-slate-300 mb-3" />
          <p className="text-[14px] font-semibold text-slate-500">No orders found</p>
          <p className="text-[12px] text-slate-400 mt-1">Orders you place will appear here</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(order => {
            const StatusIcon = STATUS_ICONS[order.status] || Package;
            return (
              <div key={order.id} className="bg-white rounded-xl border border-slate-200 p-5 hover:border-indigo-300 transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                  {/* Left: Order info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="text-[13px] font-bold text-slate-900 font-mono">{order.id}</span>
                      <StatusBadge status={order.status} />
                    </div>
                    <p className="text-[13px] text-slate-600 font-medium mb-0.5">{order.designName}</p>
                    <div className="flex items-center gap-3 text-[11px] text-slate-400">
                      <span className="flex items-center gap-1"><Clock size={11} />{new Date(order.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                      <span>{order.quantity} units</span>
                      <span className="font-semibold text-slate-600">{formatCurrency(order.total)}</span>
                    </div>
                    {order.status !== 'Delivered' && <OrderProgress status={order.status} />}
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button onClick={() => { setSelectedOrder(order); }}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                    >
                      <Eye size={13} />Details
                    </button>
                    {order.status === 'Delivered' && (
                      <button onClick={() => { setSelectedOrder(order); setShowInvoice(true); }}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium text-indigo-600 border border-indigo-200 rounded-lg hover:bg-indigo-50 transition-colors"
                      >
                        <Download size={13} />Invoice
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selectedOrder && !showInvoice && (
        <OrderDetailsModal order={selectedOrder} onClose={() => setSelectedOrder(null)} onShowInvoice={() => setShowInvoice(true)} />
      )}
      {showInvoice && selectedOrder && (
        <InvoiceModal order={selectedOrder} onClose={() => { setShowInvoice(false); setSelectedOrder(null); }} />
      )}
    </div>
  );
}
