import { useMemo, useRef, useState, useEffect, lazy, Suspense } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import CustomizationPanel from './components/CustomizationPanel';
import PreviewPanel from './components/PreviewPanel';
import TopNav from './components/TopNav';
import Login from './pages/Login';
import { calculatePricing, formatCurrency } from './lib/pricing';
import { useConfiguratorStore } from './store/useConfiguratorStore';
import { PlusCircle, CheckCircle2, X, FileText, Calendar, Truck, ShieldCheck, Loader2 } from 'lucide-react';
import ToastContainer, { showToast } from './components/Toast';
import { useAuth } from './hooks/useAuth';
import { useProjectStore } from './store/useProjectStore';
import { useIdCardDesignerStore } from './store/useIdCardDesignerStore';

// ─── Code-split pages ────────────────────────────────────────────
const Dashboard      = lazy(() => import('./pages/Dashboard'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const AdminOrderDetail = lazy(() => import('./pages/AdminOrderDetail'));
const Orders         = lazy(() => import('./pages/Orders'));
const Templates      = lazy(() => import('./pages/Templates'));
const IdCardPro      = lazy(() => import('./pages/IdCardPro'));
const StrapEditor    = lazy(() => import('./components/StrapEditor'));
const IdCardEditor   = lazy(() => import('./components/IdCardEditor'));
const NewProject     = lazy(() => import('./pages/NewProject'));
const Editor         = lazy(() => import('./pages/Editor'));
const ExportFlow     = lazy(() => import('./pages/ExportFlow'));
const IdCardDesigner = lazy(() => import('./pages/IdCardDesigner'));

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4001';

// ─── File upload helper ───────────────────────────────────────────
async function uploadFile(file) {
  if (!file) return '';
  const formData = new FormData();
  formData.append('file', file);
  const token = localStorage.getItem('gotek_token');
  const headers = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const response = await fetch(`${API_URL}/api/uploads`, { method: 'POST', headers, body: formData });
  if (!response.ok) throw new Error('Upload failed');
  const payload = await response.json();
  return payload.url;
}

// ─── Page loading fallback ────────────────────────────────────────
function PageLoader() {
  return (
    <div className="flex min-h-[400px] items-center justify-center">
      <div className="flex items-center gap-3 bg-white px-6 py-4 rounded-xl shadow-sm border border-slate-200">
        <Loader2 size={20} className="animate-spin text-indigo-600" />
        <span className="text-sm font-medium text-slate-700">Loading…</span>
      </div>
    </div>
  );
}

// ─── Auth guard ───────────────────────────────────────────────────
function RequireAuth({ children, user }) {
  const location = useLocation();
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  return children;
}

function RequireAdmin({ children, user }) {
  if (!user?.isAdmin) return <Navigate to="/dashboard" replace />;
  return children;
}

// ─── Customizer page (legacy inline) ─────────────────────────────
function CustomizerPage({ stageRef, idCardStageRef, zoom, setZoom, currentStep, setCurrentStep, submitDesign, submitState, pricing }) {
  const customizationPanel = (
    <CustomizationPanel
      currentStep={currentStep}
      setCurrentStep={setCurrentStep}
      onSubmit={submitDesign}
      loading={submitState.loading}
      pricing={pricing}
      stageRef={stageRef}
    />
  );
  return (
    <div className="flex h-full">
      <div className="hidden lg:flex w-[340px] xl:w-[380px] shrink-0 border-r border-slate-200 bg-white overflow-y-auto flex-col">
        {customizationPanel}
      </div>
      <div className="flex-1 min-h-0 relative">
        <PreviewPanel
          stageRef={stageRef}
          idCardStageRef={idCardStageRef}
          zoom={zoom}
          setZoom={setZoom}
          currentStep={currentStep}
          onEditStrap={() => {}}
        />
      </div>
      <div className="lg:hidden absolute bottom-0 left-0 right-0 border-t border-slate-200 bg-white max-h-[50vh] overflow-y-auto">
        {customizationPanel}
      </div>
    </div>
  );
}

// ─── Main App shell ───────────────────────────────────────────────
export default function App() {
  const navigate = useNavigate();
  const location = useLocation();

  const stageRef = useRef(null);
  const idCardStageRef = useRef(null);
  const [zoom, setZoom]           = useState(0.65);
  const [currentStep, setCurrentStep]           = useState(0);
  const [editingStrapZone, setEditingStrapZone] = useState(null);
  const [isEditingIdCard, setIsEditingIdCard]   = useState(false);
  const [submitState, setSubmitState]           = useState({ loading: false, message: '', error: false });
  const [saveMessage, setSaveMessage]           = useState('');

  const { user, isLoading, signOut, updateUser } = useAuth();

  const design   = useConfiguratorStore(s => s.design);
  const uploads  = useConfiguratorStore(s => s.uploads);
  const saveLocal = useConfiguratorStore(s => s.saveLocal);
  const pricing  = useMemo(() => calculatePricing(design), [design]);
  const { activeProject } = useProjectStore();

  // ── Login handler ──────────────────────────────────────────────
  const handleLogin = (userData) => {
    updateUser(userData);
    navigate(userData.isAdmin ? '/admin' : '/dashboard', { replace: true });
  };

  // ── Logout handler ─────────────────────────────────────────────
  const handleLogout = () => {
    signOut();
    navigate('/login', { replace: true });
  };

  // ── Event bus listeners (used by inner components) ─────────────
  useEffect(() => {
    const handleOpenEditor = (e) => {
      if (e.detail?.zone) setEditingStrapZone(e.detail.zone);
    };
    const handleOpenIdCardEditor = () => setIsEditingIdCard(true);
    const handleDashboardNav     = () => navigate('/dashboard');
    const handleSaveProject      = () => handleSaveDraft();
    const handleOpenCroppingHub  = () => navigate('/bulk-import');

    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        handleSaveDraft();
      }
    };

    window.addEventListener('open-strap-editor',       handleOpenEditor);
    window.addEventListener('open-id-card-editor',     handleOpenIdCardEditor);
    window.addEventListener('navigate-dashboard',      handleDashboardNav);
    window.addEventListener('save-project',            handleSaveProject);
    window.addEventListener('navigate-to-cropping-hub',handleOpenCroppingHub);
    window.addEventListener('keydown',                 handleKeyDown);

    return () => {
      window.removeEventListener('open-strap-editor',       handleOpenEditor);
      window.removeEventListener('open-id-card-editor',     handleOpenIdCardEditor);
      window.removeEventListener('navigate-dashboard',      handleDashboardNav);
      window.removeEventListener('save-project',            handleSaveProject);
      window.removeEventListener('navigate-to-cropping-hub',handleOpenCroppingHub);
      window.removeEventListener('keydown',                 handleKeyDown);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSaveDraft = () => {
    saveLocal();
    setSaveMessage('Draft saved!');
    showToast('Draft saved successfully to local workspace.', 'success', 'Design Saved');
    setTimeout(() => setSaveMessage(''), 3000);
  };

  // ── Order submit ───────────────────────────────────────────────
  const submitDesign = async () => {
    try {
      setSubmitState({ loading: true, message: '', error: false });
      const confirmPayment = window.confirm('Demo Payment Simulation: Pay ₹2 to place order?');
      if (!confirmPayment) {
        setSubmitState({ loading: false, message: 'Payment cancelled.', error: true });
        return;
      }

      const previewImage      = stageRef.current?.toDataURL({ pixelRatio: 4.0 }) || '';
      const idCardPreviewImage = idCardStageRef.current?.toDataURL({ pixelRatio: 4.0 }) || '';

      let logoUrl         = design.logoUrl;
      let customPatternUrl = design.customPatternUrl;
      let photoUrl        = design.idCard.photoUrl;
      let cardLogoUrl     = design.idCard.logoUrl;

      if (uploads.strapLogoFile || uploads.customPatternFile || uploads.idPhotoFile || uploads.idLogoFile) {
        try {
          const results = await Promise.allSettled([
            uploads.strapLogoFile      ? uploadFile(uploads.strapLogoFile)      : Promise.resolve(design.logoUrl),
            uploads.customPatternFile  ? uploadFile(uploads.customPatternFile)  : Promise.resolve(design.customPatternUrl),
            uploads.idPhotoFile        ? uploadFile(uploads.idPhotoFile)        : Promise.resolve(design.idCard.photoUrl),
            uploads.idLogoFile         ? uploadFile(uploads.idLogoFile)         : Promise.resolve(design.idCard.logoUrl),
          ]);
          if (results[0].status === 'fulfilled') logoUrl         = results[0].value;
          if (results[1].status === 'fulfilled') customPatternUrl = results[1].value;
          if (results[2].status === 'fulfilled') photoUrl        = results[2].value;
          if (results[3].status === 'fulfilled') cardLogoUrl     = results[3].value;
        } catch (e) { console.warn('Upload failed, using local data.', e); }
      }

      const orderId    = `ORD-${Math.floor(Math.random() * 9000) + 1000}`;
      const storedDesign = { ...design };
      if (storedDesign.logoUrl?.startsWith('data:'))            storedDesign.logoUrl = 'Stored locally';
      if (storedDesign.customPatternUrl?.startsWith('data:'))   storedDesign.customPatternUrl = 'Stored locally';
      if (storedDesign.idCard?.photoUrl?.startsWith('data:'))   storedDesign.idCard = { ...storedDesign.idCard, photoUrl: 'Stored locally' };

      let finalOrderId = orderId;
      try {
        const res = await fetch(`${API_URL}/api/design-requests`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            design: { ...storedDesign, customText: design.customTextLeft || design.customTextCenter || design.customTextRight || '', previewImage: previewImage.length > 1500000 ? '' : previewImage },
            order:  { quantity: design.quantity, pricePerUnit: pricing.pricePerUnit, totalPriceInInr: pricing.total },
          }),
        });
        if (res.ok) { const d = await res.json(); if (d.orderId) finalOrderId = `ORD-${d.orderId}`; }
      } catch (e) { console.warn('Backend unavailable, saving locally.', e); }

      const newOrder = {
        id: finalOrderId, customer: user?.name || 'Guest', email: user?.email || 'guest@test.com',
        userEmail: user?.email || 'guest@test.com', date: new Date().toISOString().split('T')[0],
        status: 'Pending', total: pricing.total, designName: design.idCard.name || 'Custom Lanyard',
        design: storedDesign, quantity: design.quantity, pricePerUnit: pricing.pricePerUnit,
        previewImage: previewImage.length > 1500000 ? '' : previewImage,
        idCardPreview: idCardPreviewImage.length > 1500000 ? '' : idCardPreviewImage,
      };

      try {
        const existingOrders = JSON.parse(localStorage.getItem('myLanyardOrders') || '[]');
        localStorage.setItem('myLanyardOrders', JSON.stringify([newOrder, ...existingOrders].slice(0, 10)));
      } catch (e) { localStorage.setItem('myLanyardOrders', JSON.stringify([newOrder])); }

      try { saveLocal(); } catch (e) { /* quota */ }
      setSubmitState({ loading: false, message: `Order ${finalOrderId} placed!`, error: false, orderDetails: newOrder });
      setTimeout(() => showToast(`Confirmation sent to ${newOrder.email}`, 'success', 'Email Sent'), 1500);
      window.dispatchEvent(new Event('orderStatusUpdated'));
    } catch (error) {
      setSubmitState({ loading: false, message: error.message, error: true });
    }
  };

  // ── Loading state ──────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex min-h-[100dvh] w-full items-center justify-center bg-[#f8faff]">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
          <p className="text-sm font-semibold text-slate-500">Loading…</p>
        </div>
      </div>
    );
  }

  // ── Unauthenticated: show login ────────────────────────────────
  if (!user) {
    return (
      <div className="min-h-[100dvh] w-full overflow-y-auto overflow-x-hidden bg-[#f8faff]">
        <Login onLogin={handleLogin} />
      </div>
    );
  }

  // ── Determine if current route is the editor (hides TopNav) ───
  const isEditorRoute = location.pathname === '/editor' || location.pathname === '/id-card-designer';

  return (
    <div className="flex h-[100dvh] max-h-[100dvh] flex-col overflow-hidden bg-slate-50">

      {/* Persistent Top Navigation — hidden in editor */}
      {!isEditorRoute && (
        <TopNav
          activePage={location.pathname}
          onLogout={handleLogout}
          user={user}
          isAdmin={user.isAdmin}
        />
      )}

      {/* Overlay editors (strap / id-card) */}
      <Suspense fallback={null}>
        {editingStrapZone && (
          <StrapEditor
            zone={editingStrapZone}
            onClose={() => setEditingStrapZone(null)}
          />
        )}
        {isEditingIdCard && (
          <IdCardEditor onClose={() => setIsEditingIdCard(false)} />
        )}
      </Suspense>

      {/* Main content */}
      <main className={`relative flex-1 min-h-0 ${
        isEditorRoute || location.pathname === '/studio' ? 'overflow-hidden' : 'overflow-y-auto'
      }`}>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* ── Default redirect ── */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/login" element={<Navigate to="/dashboard" replace />} />

            {/* ── Dashboard ── */}
            <Route path="/dashboard" element={
              <RequireAuth user={user}>
                {user?.isAdmin ? <Navigate to="/admin" replace /> : <Dashboard user={user} />}
              </RequireAuth>
            } />

            {/* ── Admin ── */}
            <Route path="/admin" element={
              <RequireAdmin user={user}>
                <AdminDashboard />
              </RequireAdmin>
            } />
            <Route path="/admin/orders/:id" element={
              <RequireAdmin user={user}>
                <AdminOrderDetail />
              </RequireAdmin>
            } />

            {/* ── New Project picker ── */}
            <Route path="/new-project" element={
              <RequireAuth user={user}>
                <NewProject
                  onStart={(type, mode) => {
                    const createProject = useProjectStore.getState().createProject;
                    if (createProject) createProject(type);
                    useConfiguratorStore.getState().resetDesign();
                    useIdCardDesignerStore.setState({
                      frontElements: [],
                      backElements: [],
                      cardSettings: {
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
                      history: [],
                      historyIndex: -1,
                      selectedId: null,
                      activeSide: 'front'
                    });
                    if (mode === 'template') {
                      navigate('/templates');
                    } else if (mode === 'import') {
                      navigate('/bulk-import');
                    } else {
                      if (type === 'id-card') {
                        navigate('/id-card-designer');
                      } else {
                        navigate('/editor');
                      }
                    }
                  }}
                />
              </RequireAuth>
            } />

            {/* ── 3-panel Design Editor ── */}
            <Route path="/editor" element={
              <RequireAuth user={user}>
                <Editor />
              </RequireAuth>
            } />

            {/* ── Dedicated ID Card Designer Module ── */}
            <Route path="/id-card-designer" element={
              <RequireAuth user={user}>
                <IdCardDesigner />
              </RequireAuth>
            } />

            {/* ── Legacy Customizer Redirect ── */}
            <Route path="/studio" element={<Navigate to="/editor" replace />} />

            {/* ── Templates gallery ── */}
            <Route path="/templates" element={
              <RequireAuth user={user}>
                <Templates />
              </RequireAuth>
            } />

            {/* ── Orders & tracking ── */}
            <Route path="/orders" element={
              <RequireAuth user={user}>
                <Orders user={user} />
              </RequireAuth>
            } />

            {/* ── Bulk roster / ID Card Pro ── */}
            <Route path="/bulk-import" element={
              <RequireAuth user={user}>
                <IdCardPro />
              </RequireAuth>
            } />

            {/* ── Export & order flow ── */}
            <Route path="/export" element={
              <RequireAuth user={user}>
                <ExportFlow project={activeProject} pricing={pricing} user={user} />
              </RequireAuth>
            } />

            {/* ── 404 fallback ── */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Suspense>

        {/* ── Order confirmation modal ── */}
        {submitState.orderDetails && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 overflow-y-auto">
            <div className="bg-white rounded-[40px] shadow-2xl max-w-2xl w-full my-auto overflow-hidden border border-white/20">
              <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-8 text-center text-white relative">
                <div className="w-24 h-24 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce shadow-xl border border-white/30">
                  <CheckCircle2 size={56} className="text-white drop-shadow-lg" />
                </div>
                <h2 className="text-4xl font-black mb-2 tracking-tight">Order Confirmed!</h2>
                <p className="text-emerald-50 opacity-90 text-lg font-medium">Your order has been successfully placed</p>
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
                <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
              </div>

              <div className="p-10">
                <div className="flex items-center gap-4 bg-slate-50 p-6 rounded-3xl border border-slate-100 mb-8">
                  <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center shrink-0 shadow-sm">
                    <Truck size={28} />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 text-lg">Estimated Delivery</h4>
                    <p className="text-slate-500 font-medium">3-5 business working days</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-10 mb-10">
                  <div>
                    <div className="flex items-center gap-2 text-slate-400 mb-3">
                      <FileText size={14} />
                      <span className="text-xs font-bold uppercase tracking-widest">Order Details</span>
                    </div>
                    <p className="text-slate-800 font-black text-xl mb-1">{submitState.orderDetails.id}</p>
                    <p className="text-slate-500 font-bold">{submitState.orderDetails.designName}</p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-2 text-slate-400 mb-3 justify-end">
                      <Calendar size={14} />
                      <span className="text-xs font-bold uppercase tracking-widest">Order Date</span>
                    </div>
                    <p className="text-slate-800 font-black text-xl mb-1">
                      {new Date(submitState.orderDetails.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </p>
                    <p className="text-slate-500 font-bold">{submitState.orderDetails.quantity} Units</p>
                  </div>
                </div>

                <div className="space-y-4 pt-8 border-t-2 border-dashed border-slate-100 mb-10">
                  <div className="flex justify-between text-slate-500 font-bold">
                    <span>Price per Unit</span>
                    <span>{formatCurrency(submitState.orderDetails.pricePerUnit)}</span>
                  </div>
                  <div className="flex justify-between text-slate-800 font-black text-2xl pt-2">
                    <span>Amount Paid</span>
                    <span className="text-emerald-600">{formatCurrency(submitState.orderDetails.total)}</span>
                  </div>
                </div>

                <div className="bg-blue-50/50 p-6 rounded-3xl border border-blue-100 flex items-start gap-4 mb-10">
                  <ShieldCheck className="text-blue-500 shrink-0 mt-1" size={20} />
                  <p className="text-[13px] text-blue-700 font-bold leading-relaxed">
                    Admin will update you the progress for each step. You can track your order live from the user dashboard.
                  </p>
                </div>

                <button
                  onClick={() => {
                    setSubmitState({ loading: false, message: '', error: false, orderDetails: null });
                    navigate('/dashboard');
                  }}
                  className="w-full bg-indigo-600 text-white py-5 rounded-[24px] font-black text-xl shadow-2xl shadow-indigo-600/30 hover:bg-indigo-700 hover:scale-[1.02] transition-all flex items-center justify-center gap-3 group"
                >
                  Go to Dashboard
                  <PlusCircle size={24} className="group-hover:rotate-90 transition-transform" />
                </button>
              </div>
            </div>
          </div>
        )}

        <ToastContainer />

        {submitState.error && submitState.message && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-red-500 text-white px-6 py-3 rounded-xl shadow-lg z-[110] flex items-center gap-3">
            <span className="text-sm font-medium">{submitState.message}</span>
            <button onClick={() => setSubmitState({ ...submitState, message: '', error: false })} className="bg-white/20 p-1 rounded-full hover:bg-white/30">
              <X size={14} />
            </button>
          </div>
        )}
      </main>
    </div>
  );
}