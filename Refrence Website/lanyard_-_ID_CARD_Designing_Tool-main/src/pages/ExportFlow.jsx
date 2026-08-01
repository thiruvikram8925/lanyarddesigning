import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useConfiguratorStore } from '../store/useConfiguratorStore';
import {
  CheckCircle2,
  Package,
  FileText,
  Image,
  Printer,
  Download,
  ArrowLeft,
  ArrowRight,
  Truck,
  ShieldCheck,
  Zap,
} from 'lucide-react';

// ─── Pricing tiers ───────────────────────────────────────────────────────────
const getPricePerUnit = (qty) => {
  if (qty >= 1000) return 28;
  if (qty >= 250) return 32;
  if (qty >= 50) return 38;
  return 45;
};

// ─── Format definitions ───────────────────────────────────────────────────────
const FORMAT_OPTIONS = [
  {
    id: 'png',
    label: 'PNG (High-Res)',
    description: 'For digital use, presentations, email',
    icon: Image,
    badge: null,
  },
  {
    id: 'pdf-screen',
    label: 'PDF (Screen)',
    description: 'Optimized for digital sharing',
    icon: FileText,
    badge: null,
  },
  {
    id: 'pdf-print',
    label: 'PDF (Print-Ready)',
    description: 'CMYK, 300 DPI, with bleed & crop marks',
    icon: Printer,
    badge: 'RECOMMENDED',
  },
  {
    id: 'print-pkg',
    label: 'Print Package',
    description: 'ZIP with all production files',
    icon: Package,
    badge: 'PREMIUM',
  },
];

const QUICK_PICKS = [10, 50, 100, 250, 500, 1000];

const VALIDATION_ITEMS = [
  { label: 'Resolution', detail: '300 DPI', pass: true },
  { label: 'Bleed Area', detail: '3mm included', pass: true },
  { label: 'Safe Zone', detail: 'Content within bounds', pass: true },
  { label: 'Color Mode', detail: 'CMYK ready', pass: true },
  { label: 'Fonts', detail: 'All embedded', pass: true },
];

const STEPS = ['Quantity', 'Review', 'Confirm'];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const generateOrderId = () =>
  'ORD-' + Math.floor(1000 + Math.random() * 9000);

const formatLabel = (id) =>
  FORMAT_OPTIONS.find((f) => f.id === id)?.label ?? id;

// ─── Sub-components ───────────────────────────────────────────────────────────

/** Step indicator bar */
function StepIndicator({ currentStep }) {
  return (
    <div className="flex items-center justify-center gap-0 mb-10">
      {STEPS.map((label, idx) => {
        const stepNum = idx + 1;
        const isDone = stepNum < currentStep;
        const isActive = stepNum === currentStep;

        return (
          <div key={label} className="flex items-center">
            {/* Circle */}
            <div className="flex flex-col items-center">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all duration-300
                  ${isDone
                    ? 'bg-emerald-500 border-emerald-500 text-white'
                    : isActive
                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-200'
                    : 'bg-white border-slate-300 text-slate-400'
                  }`}
              >
                {isDone ? (
                  <CheckCircle2 size={18} strokeWidth={2.5} />
                ) : (
                  stepNum
                )}
              </div>
              <span
                className={`mt-1.5 text-xs font-medium whitespace-nowrap ${
                  isActive
                    ? 'text-indigo-600'
                    : isDone
                    ? 'text-emerald-600'
                    : 'text-slate-400'
                }`}
              >
                {label}
              </span>
            </div>

            {/* Connector */}
            {idx < STEPS.length - 1 && (
              <div
                className={`w-16 sm:w-24 h-0.5 mb-5 mx-1 transition-all duration-300 ${
                  isDone ? 'bg-emerald-400' : 'bg-slate-200'
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

/** Step 1 — Format picker */
function FormatStep({ selected, onSelect }) {
  return (
    <div>
      <h2 className="text-xl font-semibold text-slate-800 mb-1">
        Choose Export Format
      </h2>
      <p className="text-sm text-slate-500 mb-6">
        Select the format that best suits your use case.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {FORMAT_OPTIONS.map(({ id, label, description, icon: Icon, badge }) => {
          const isSelected = selected === id;
          return (
            <button
              key={id}
              onClick={() => onSelect(id)}
              className={`relative text-left p-5 rounded-xl border-2 bg-white transition-all duration-200
                hover:shadow-md
                ${
                  isSelected
                    ? 'border-indigo-500 ring-2 ring-indigo-200 shadow-md'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
            >
              {/* Badge */}
              {badge && (
                <span
                  className={`absolute top-3 right-3 text-[10px] font-bold tracking-wider px-2 py-0.5 rounded-full
                    ${badge === 'RECOMMENDED'
                      ? 'bg-indigo-100 text-indigo-700'
                      : 'bg-amber-100 text-amber-700'
                    }`}
                >
                  {badge}
                </span>
              )}

              <div className="flex items-start gap-3">
                <div
                  className={`p-2.5 rounded-lg ${
                    isSelected
                      ? 'bg-indigo-100 text-indigo-600'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  <Icon size={20} />
                </div>
                <div>
                  <p
                    className={`font-semibold text-sm ${
                      isSelected ? 'text-indigo-700' : 'text-slate-800'
                    }`}
                  >
                    {label}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                    {description}
                  </p>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** Step 2 — Quantity picker */
function QuantityStep({ quantity, onChange }) {
  const unitPrice = getPricePerUnit(quantity);
  const total = unitPrice * quantity;

  const handleInput = (val) => {
    const n = parseInt(val, 10);
    if (!isNaN(n)) onChange(Math.min(10000, Math.max(1, n)));
  };

  const increment = () => onChange(Math.min(10000, quantity + 1));
  const decrement = () => onChange(Math.max(1, quantity - 1));

  return (
    <div>
      <h2 className="text-xl font-semibold text-slate-800 mb-1">
        Set Quantity
      </h2>
      <p className="text-sm text-slate-500 mb-6">
        Choose how many units you need. Bulk orders get better rates.
      </p>

      {/* Number input row */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={decrement}
          className="w-11 h-11 rounded-lg border border-slate-300 bg-white text-slate-700 text-xl font-bold hover:bg-slate-50 active:scale-95 transition-all"
        >
          {'\u2212'}
        </button>
        <input
          type="number"
          min={1}
          max={10000}
          value={quantity}
          onChange={(e) => handleInput(e.target.value)}
          className="w-28 h-11 text-center text-lg font-semibold border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
        />
        <button
          onClick={increment}
          className="w-11 h-11 rounded-lg border border-slate-300 bg-white text-slate-700 text-xl font-bold hover:bg-slate-50 active:scale-95 transition-all"
        >
          +
        </button>
        <span className="text-sm text-slate-500 ml-1">units (max 10,000)</span>
      </div>

      {/* Quick picks */}
      <div className="flex flex-wrap gap-2 mb-8">
        {QUICK_PICKS.map((q) => (
          <button
            key={q}
            onClick={() => onChange(q)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-all
              ${
                quantity === q
                  ? 'bg-indigo-600 border-indigo-600 text-white shadow'
                  : 'bg-white border-slate-300 text-slate-600 hover:border-indigo-400 hover:text-indigo-600'
              }`}
          >
            {q}
          </button>
        ))}
      </div>

      {/* Pricing card */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        <div className="px-5 py-3 bg-slate-50 border-b border-slate-100">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Pricing Breakdown
          </p>
        </div>
        <div className="px-5 py-4 space-y-2">
          {/* Tiers */}
          <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm text-slate-500 mb-3">
            {[
              { range: '1 \u2013 49 units', price: '\u20b945/unit' },
              { range: '50 \u2013 249 units', price: '\u20b938/unit' },
              { range: '250 \u2013 999 units', price: '\u20b932/unit' },
              { range: '1000+ units', price: '\u20b928/unit' },
            ].map(({ range, price }) => (
              <div key={range} className="flex justify-between">
                <span>{range}</span>
                <span className="font-medium text-slate-700">{price}</span>
              </div>
            ))}
          </div>
          <div className="border-t border-slate-100 pt-3 flex items-end justify-between">
            <div>
              <p className="text-sm text-slate-500">
                Unit Price at{' '}
                <span className="font-semibold text-slate-700">{quantity}</span>{' '}
                units
              </p>
              <p className="text-2xl font-bold text-indigo-600 mt-0.5">
                {'\u20b9'}{unitPrice}
                <span className="text-sm font-normal text-slate-400">
                  /unit
                </span>
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-slate-500">Estimated Total</p>
              <p className="text-3xl font-extrabold text-slate-800">
                {'\u20b9'}{total.toLocaleString('en-IN')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Step 3 — Review */
function ReviewStep({ project, format, quantity }) {
  const unitPrice = getPricePerUnit(quantity);
  const total = unitPrice * quantity;

  return (
    <div>
      <h2 className="text-xl font-semibold text-slate-800 mb-1">
        Review &amp; Validate
      </h2>
      <p className="text-sm text-slate-500 mb-6">
        We have checked your design. Everything looks good to go.
      </p>

      {/* Validation checklist */}
      <div className="rounded-xl border border-slate-200 bg-white mb-6 overflow-hidden">
        <div className="px-5 py-3 bg-slate-50 border-b border-slate-100 flex items-center gap-2">
          <ShieldCheck size={15} className="text-indigo-500" />
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Pre-flight Checks
          </p>
        </div>
        <ul className="divide-y divide-slate-100">
          {VALIDATION_ITEMS.map(({ label, detail, pass }) => (
            <li
              key={label}
              className="flex items-center justify-between px-5 py-3.5"
            >
              <div className="flex items-center gap-3">
                <CheckCircle2
                  size={18}
                  className={pass ? 'text-emerald-500' : 'text-red-400'}
                  strokeWidth={2.5}
                />
                <span className="text-sm font-medium text-slate-700">
                  {label}
                </span>
              </div>
              <span
                className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${
                  pass
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'bg-red-50 text-red-600'
                }`}
              >
                {detail}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* Order summary */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        <div className="px-5 py-3 bg-slate-50 border-b border-slate-100 flex items-center gap-2">
          <Package size={15} className="text-indigo-500" />
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Order Summary
          </p>
        </div>
        <div className="px-5 py-4 space-y-3 text-sm">
          <Row label="Product" value={project?.name ?? 'Untitled Design'} />
          <Row label="Type" value={project?.type ?? 'ID Card'} capitalize />
          <Row label="Format" value={formatLabel(format)} />
          <Row label="Quantity" value={`${quantity.toLocaleString('en-IN')} units`} />
          <Row label="Unit Price" value={`\u20b9${unitPrice}`} />
          <div className="border-t border-slate-100 pt-3 flex justify-between items-center">
            <span className="font-semibold text-slate-700">Total</span>
            <span className="text-xl font-extrabold text-slate-800">
              {'\u20b9'}{total.toLocaleString('en-IN')}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, capitalize }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-slate-500">{label}</span>
      <span
        className={`font-medium text-slate-800 ${
          capitalize ? 'capitalize' : ''
        }`}
      >
        {value}
      </span>
    </div>
  );
}

/** Step 4 — Confirm */
function ConfirmStep({ project, format, quantity, onPlaceOrder, success }) {
  const unitPrice = getPricePerUnit(quantity);
  const total = unitPrice * quantity;
  const [address, setAddress] = useState('');

  if (success) {
    return (
      <div className="flex flex-col items-center text-center py-8">
        <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mb-5">
          <CheckCircle2 size={40} className="text-emerald-500" strokeWidth={2} />
        </div>
        <h2 className="text-2xl font-bold text-slate-800 mb-1">
          Order Placed!
        </h2>
        <p className="text-sm text-slate-500 mb-6">
          Your order has been confirmed and is being processed.
        </p>

        <div className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-5 text-left space-y-3 mb-8">
          <Row label="Order ID" value={success.orderId} />
          <Row label="Format" value={formatLabel(format)} />
          <Row
            label="Quantity"
            value={`${quantity.toLocaleString('en-IN')} units`}
          />
          <Row label="Total Paid" value={`\u20b9${total.toLocaleString('en-IN')}`} />
          <div className="flex items-center gap-2 pt-2 border-t border-slate-100 text-emerald-600">
            <Truck size={16} />
            <span className="text-sm font-medium">
              Estimated delivery: {success.delivery}
            </span>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={success.onDashboard}
            className="px-5 py-2.5 rounded-lg border border-slate-300 text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 transition-all"
          >
            Back to Dashboard
          </button>
          <button
            onClick={success.onViewOrders}
            className="px-5 py-2.5 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-all shadow"
          >
            View Orders
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-xl font-semibold text-slate-800 mb-1">
        Confirm Your Order
      </h2>
      <p className="text-sm text-slate-500 mb-6">
        Review the details below and provide a shipping address to place your
        order.
      </p>

      {/* Summary */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden mb-5">
        <div className="px-5 py-3 bg-slate-50 border-b border-slate-100 flex items-center gap-2">
          <Package size={15} className="text-indigo-500" />
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Order Summary
          </p>
        </div>
        <div className="px-5 py-4 space-y-3 text-sm">
          <Row label="Product" value={project?.name ?? 'Untitled Design'} />
          <Row label="Format" value={formatLabel(format)} />
          <Row label="Quantity" value={`${quantity.toLocaleString('en-IN')} units`} />
          <Row label="Unit Price" value={`\u20b9${unitPrice}`} />
          <div className="border-t border-slate-100 pt-3 flex justify-between items-center">
            <span className="font-semibold text-slate-700">Total</span>
            <span className="text-xl font-extrabold text-slate-800">
              {'\u20b9'}{total.toLocaleString('en-IN')}
            </span>
          </div>
        </div>
      </div>

      {/* Shipping address */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-slate-700 mb-1.5">
          Shipping Address
        </label>
        <textarea
          rows={4}
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="Enter full delivery address including city, state and PIN code..."
          className="w-full px-4 py-3 text-sm border border-slate-300 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent text-slate-700 placeholder-slate-400"
        />
      </div>

      {/* Trust badges */}
      <div className="flex flex-wrap gap-4 text-xs text-slate-500 mb-6">
        <span className="flex items-center gap-1.5">
          <ShieldCheck size={14} className="text-emerald-500" />
          Secure payment
        </span>
        <span className="flex items-center gap-1.5">
          <Truck size={14} className="text-indigo-500" />
          3-5 business days delivery
        </span>
        <span className="flex items-center gap-1.5">
          <Zap size={14} className="text-amber-500" />
          Express options available
        </span>
      </div>

      {/* CTA */}
      <button
        onClick={() => onPlaceOrder(address)}
        disabled={!address.trim()}
        className="w-full py-3.5 rounded-xl text-white font-semibold text-base tracking-wide transition-all duration-200
          bg-gradient-to-r from-emerald-500 to-green-600
          hover:from-emerald-600 hover:to-green-700
          active:scale-[0.99] shadow-lg shadow-green-200
          disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
      >
        Place Order {'\u2014'} {'\u20b9'}{total.toLocaleString('en-IN')}
      </button>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function ExportFlow({ project, pricing, user }) {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [selectedFormat, setSelectedFormat] = useState('pdf-print');
  const [quantity, setQuantity] = useState(pricing?.quantity ?? 100);
  const [successInfo, setSuccessInfo] = useState(null);
  
  const design = useConfiguratorStore((s) => s.design);

  const canProceed = () => {
    if (step === 1) return quantity >= 1 && quantity <= 10000;
    return true;
  };

  const handleNext = () => {
    if (step < 3) setStep((s) => s + 1);
  };

  const handleBack = () => {
    if (step === 1) {
      navigate(-1);
    } else {
      setStep((s) => s - 1);
    }
  };

  const handlePlaceOrder = (address) => {
    const orderId = generateOrderId();
    const unitPrice = getPricePerUnit(quantity);
    const total = unitPrice * quantity;

    // Retrieve captured canvas previews
    const previewImage = localStorage.getItem('lanyard_temp_preview') || '';
    const idCardPreviewImage = localStorage.getItem('lanyard_temp_card_preview') || '';
    const flatFrontPreview = localStorage.getItem('lanyard_temp_flat_front_preview') || '';
    const flatBackPreview = localStorage.getItem('lanyard_temp_flat_back_preview') || '';

    // Clear temporary items
    localStorage.removeItem('lanyard_temp_preview');
    localStorage.removeItem('lanyard_temp_card_preview');
    localStorage.removeItem('lanyard_temp_flat_front_preview');
    localStorage.removeItem('lanyard_temp_flat_back_preview');

    const newOrder = {
      id: orderId,
      customer: user?.name || 'Guest User',
      email: user?.email || 'guest@test.com',
      userEmail: user?.email || 'guest@test.com',
      date: new Date().toISOString().split('T')[0],
      status: 'Pending',
      total: total,
      designName: project?.name || design?.idCard?.name || 'Custom Design',
      quantity: quantity,
      pricePerUnit: unitPrice,
      address: address,
      format: formatLabel(selectedFormat),
      previewImage: previewImage.length > 1500000 ? '' : previewImage,
      idCardPreview: idCardPreviewImage.length > 1500000 ? '' : idCardPreviewImage,
      flatFrontPreview: flatFrontPreview.length > 1500000 ? '' : flatFrontPreview,
      flatBackPreview: flatBackPreview.length > 1500000 ? '' : flatBackPreview,
      design: {
        ...design,
        printingMethod: design?.printingMethod,
        lanyardStyle: design?.lanyardStyle,
        width: design?.width,
        length: design?.length,
        lanyardColor: design?.lanyardColor,
        clipType: design?.clipType,
        accessories: design?.accessories,
        idCardSize: design?.idCard?.size,
        idCardFrontBg: design?.idCard?.front?.backgroundColor,
        idCardBackBg: design?.idCard?.back?.backgroundColor,
        customTextLeft: design?.customTextLeft,
        customTextCenter: design?.customTextCenter,
        customTextRight: design?.customTextRight,
        textColor: design?.textColor,
        fontFamily: design?.fontFamily,
        logoUrl: design?.logoUrl || '',
        customPatternUrl: design?.customPatternUrl || '',
        idCardPhotoUrl: design?.idCard?.photoUrl || '',
        idCardLogoUrl: design?.idCard?.logoUrl || '',
      }
    };

    // Save to localStorage
    try {
      const existingOrders = JSON.parse(localStorage.getItem('myLanyardOrders') || '[]');
      localStorage.setItem('myLanyardOrders', JSON.stringify([newOrder, ...existingOrders].slice(0, 15)));
    } catch (e) {
      localStorage.setItem('myLanyardOrders', JSON.stringify([newOrder]));
    }

    // Attempt backend sync
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4001';
    fetch(`${API_URL}/api/design-requests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        design: { ...design, customText: design.customTextLeft || design.customTextCenter || design.customTextRight || '', previewImage: previewImage.length > 1500000 ? '' : previewImage },
        order: { quantity, pricePerUnit: unitPrice, totalPriceInInr: total },
      }),
    }).catch(e => console.warn('Backend unavailable, saved locally.', e));

    // Trigger update event
    window.dispatchEvent(new Event('orderStatusUpdated'));

    setSuccessInfo({
      orderId: orderId,
      delivery: '3-5 business days',
      address,
      onDashboard: () => navigate('/dashboard'),
      onViewOrders: () => navigate('/orders'),
    });
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top bar */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-3">
          <button
            onClick={handleBack}
            className="flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors"
          >
            <ArrowLeft size={16} />
            Back
          </button>
          <div className="h-5 w-px bg-slate-200" />
          <div className="flex items-center gap-2">
            <Download size={16} className="text-indigo-500" />
            <span className="text-sm font-semibold text-slate-700">
              Export &amp; Order
            </span>
            {project?.name && (
              <span className="text-sm text-slate-400">— {project.name}</span>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
        <StepIndicator currentStep={step} />

        {/* Step panels */}
        <div>
          {step === 1 && (
            <QuantityStep quantity={quantity} onChange={setQuantity} />
          )}

          {step === 2 && (
            <ReviewStep
              project={project}
              format={selectedFormat}
              quantity={quantity}
            />
          )}

          {step === 3 && (
            <ConfirmStep
              project={project}
              format={selectedFormat}
              quantity={quantity}
              onPlaceOrder={handlePlaceOrder}
              success={successInfo}
            />
          )}
        </div>

        {/* Navigation row — hide in success state on step 3 */}
        {!(step === 3 && successInfo) && (
          <div className="mt-8 flex justify-between items-center">
            <button
              onClick={handleBack}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg border border-slate-300 text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 active:scale-95 transition-all"
            >
              <ArrowLeft size={16} />
              {step === 1 ? 'Cancel' : 'Back'}
            </button>

            {step < 3 && (
              <button
                onClick={handleNext}
                disabled={!canProceed()}
                className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 active:scale-95 transition-all shadow shadow-indigo-200 disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
              >
                {step === 2 ? 'Proceed to Confirm' : 'Next'}
                <ArrowRight size={16} />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
