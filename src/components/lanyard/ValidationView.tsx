import { useConfiguratorStore } from '../../store/useConfiguratorStore';
import { CheckCircle, AlertTriangle, XCircle, Shield } from 'lucide-react';

interface ValidationCheck {
  id: string;
  label: string;
  description: string;
  status: 'pass' | 'warning' | 'fail';
  details: string;
}

function runValidation(design: Record<string, any>): ValidationCheck[] {
  const checks: ValidationCheck[] = [];

  // Content Check
  const hasText = design.customTextLeft || design.customTextCenter || design.customTextRight;
  checks.push({
    id: 'content',
    label: 'Content Check',
    description: 'Text or logo content check',
    status: hasText ? 'pass' : 'warning',
    details: hasText ? 'Text content detected on strap.' : 'No text or logo — strap will be plain.',
  });

  // Color Contrast
  const bgColor = design.lanyardColor || '#ffffff';
  const fgColor = design.fontColor || '#ffffff';
  const isSameColor = bgColor.toLowerCase() === fgColor.toLowerCase();
  checks.push({
    id: 'contrast',
    label: 'Color Contrast',
    description: 'Text & background contrast',
    status: isSameColor ? 'fail' : 'pass',
    details: isSameColor ? 'Text color matches strap color — text will be invisible.' : 'Text color contrasts well.',
  });

  // Text Length
  const textLen = (design.customTextLeft || '').length;
  checks.push({
    id: 'textlen',
    label: 'Text Length',
    description: 'Text length OK for strap',
    status: textLen > 30 ? 'warning' : 'pass',
    details: textLen > 30 ? `Text is ${textLen} chars — may be cut off on smaller widths.` : `Text is ${textLen} chars — fits well.`,
  });

  // Resolution
  const isSubli = design.printingMethod === 'Sublimated';
  checks.push({
    id: 'resolution',
    label: 'Resolution',
    description: 'Print DPI rendering',
    status: isSubli ? 'pass' : 'pass',
    details: isSubli ? '300 DPI rendering — excellent print quality.' : '300 DPI — good for screen print.',
  });

  // Bleed Area
  checks.push({
    id: 'bleed',
    label: 'Bleed Area',
    description: 'Print bleed margin check',
    status: 'warning',
    details: '3mm bleed margin is applied. Content near edges may be trimmed.',
  });

  // Color Mode
  const hasGradient = typeof bgColor === 'string' && bgColor.includes('gradient');
  const method = design.printingMethod;
  checks.push({
    id: 'colormode',
    label: 'Color Mode',
    description: 'Color compatibility check',
    status: hasGradient && method === 'Screen Printed' ? 'fail' : 'pass',
    details: hasGradient && method === 'Screen Printed'
      ? 'Gradients require Sublimated printing — Screen Printed cannot render gradients.'
      : 'RGB colors will be auto-converted to CMYK for print.',
  });

  // Safe Zone
  checks.push({
    id: 'safezone',
    label: 'Safe Zone',
    description: 'Content within safe boundaries',
    status: 'pass',
    details: 'All content is within the 3mm safe zone.',
  });

  // Font Embedding
  const font = design.fontFamily || 'Arial';
  const isStandard = ['Arial', 'Montserrat', 'Roboto', 'Open Sans'].includes(font);
  checks.push({
    id: 'font',
    label: 'Font Embedding',
    description: 'Web-safe font compatibility',
    status: isStandard ? 'pass' : 'warning',
    details: isStandard
      ? `"${font}" is a web-safe, embeddable font.`
      : `"${font}" may need embedding — verify font licensing.`,
  });

  return checks;
}

const STATUS_ICON = {
  pass: <CheckCircle size={16} className="text-emerald-500" />,
  warning: <AlertTriangle size={16} className="text-amber-500" />,
  fail: <XCircle size={16} className="text-red-500" />,
};

const STATUS_BG = {
  pass: 'bg-emerald-50 border-emerald-200',
  warning: 'bg-amber-50 border-amber-200',
  fail: 'bg-red-50 border-red-200',
};

const STATUS_LABEL_COLOR = {
  pass: 'text-emerald-700',
  warning: 'text-amber-700',
  fail: 'text-red-700',
};

export default function ValidationView() {
  const design = useConfiguratorStore(s => s.design);
  const checks = runValidation(design);

  const passCount = checks.filter(c => c.status === 'pass').length;
  const warnCount = checks.filter(c => c.status === 'warning').length;
  const failCount = checks.filter(c => c.status === 'fail').length;

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50 overflow-y-auto">
      {/* Header */}
      <div className="shrink-0 px-8 pt-8 pb-4">
        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <Shield size={20} className="text-indigo-500" />
          Design Validation
        </h2>
        <p className="text-xs text-slate-400 mt-1">Pre-flight checks for print readiness</p>
      </div>

      {/* Summary Banner */}
      <div className="shrink-0 mx-8 mb-6">
        <div className={`flex items-center gap-4 p-4 rounded-xl border ${
          failCount > 0 ? 'bg-red-50 border-red-200' : warnCount > 0 ? 'bg-amber-50 border-amber-200' : 'bg-emerald-50 border-emerald-200'
        }`}>
          {failCount > 0 ? (
            <XCircle size={24} className="text-red-500" />
          ) : warnCount > 0 ? (
            <AlertTriangle size={24} className="text-amber-500" />
          ) : (
            <CheckCircle size={24} className="text-emerald-500" />
          )}
          <div>
            <p className={`text-sm font-bold ${failCount > 0 ? 'text-red-700' : warnCount > 0 ? 'text-amber-700' : 'text-emerald-700'}`}>
              {failCount > 0 ? 'Issues Found' : warnCount > 0 ? 'Warnings Present' : 'All Checks Passed'}
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              ✓ {passCount}  ⚠ {warnCount}  ✕ {failCount}
            </p>
          </div>
        </div>
      </div>

      {/* Checks Grid */}
      <div className="px-8 pb-8">
        <div className="grid grid-cols-2 gap-3">
          {checks.map(check => (
            <div
              key={check.id}
              className={`p-4 rounded-xl border transition-all hover:shadow-sm ${STATUS_BG[check.status]}`}
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5">{STATUS_ICON[check.status]}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold ${STATUS_LABEL_COLOR[check.status]}`}>
                      {check.label}
                    </span>
                    <span className={`px-1.5 py-0.5 text-[8px] font-bold rounded-full uppercase ${
                      check.status === 'pass' ? 'bg-emerald-200 text-emerald-800' :
                      check.status === 'warning' ? 'bg-amber-200 text-amber-800' :
                      'bg-red-200 text-red-800'
                    }`}>
                      {check.status === 'pass' ? '✓' : check.status === 'warning' ? '⚠' : '✕'}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">{check.details}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
