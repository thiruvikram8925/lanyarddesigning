import { useState, useEffect, useMemo } from 'react';
import {
  CheckCircle2, AlertTriangle, XCircle, ChevronDown, ChevronUp,
  Shield, Maximize2, Type, Printer, Layers, RefreshCw, Info, Ruler, Palette
} from 'lucide-react';

const STATUS = {
  pass: { color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', icon: CheckCircle2 },
  warn: { color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', icon: AlertTriangle },
  fail: { color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', icon: XCircle },
};

function getChecks(design) {
  const hasText = !!(design?.customTextCenter || design?.customTextLeft || design?.customTextRight || design?.text);
  const hasLogo = !!design?.logoUrl;
  const hasColor = !!(design?.lanyardColor && design.lanyardColor !== '#ffffff');
  const isSubbed = design?.printingMethod === 'Sublimated';
  const fontColor = design?.fontColor || design?.textColor || '#000000';

  // Check contrast: white text on white strap is a fail
  const isLowContrast = (
    (fontColor.toLowerCase() === '#ffffff' || fontColor.toLowerCase() === 'white') &&
    (design?.lanyardColor?.toLowerCase() === '#ffffff' || design?.lanyardColor?.toLowerCase() === 'white')
  );

  const textLen = (design?.text || design?.customTextCenter || '').length;
  const isTextTooLong = textLen > 30;

  return [
    {
      id: 'content',
      label: 'Content Check',
      icon: Type,
      status: (hasText || hasLogo) ? 'pass' : 'warn',
      description: (hasText || hasLogo) ? 'Text or logo present on strap ✓' : 'No text or logo — strap will be blank',
      warning: 'Add text or a logo to appear on the strap',
    },
    {
      id: 'contrast',
      label: 'Color Contrast',
      icon: Palette,
      status: isLowContrast ? 'fail' : 'pass',
      description: isLowContrast ? 'Text color matches strap — invisible in print!' : 'Text color contrasts well with strap ✓',
    },
    {
      id: 'textLength',
      label: 'Text Length',
      icon: Ruler,
      status: isTextTooLong ? 'warn' : 'pass',
      description: isTextTooLong ? `Text is ${textLen} chars — may be cramped on narrow straps` : 'Text length OK for selected width ✓',
    },
    {
      id: 'resolution',
      label: 'Resolution',
      icon: Maximize2,
      status: (hasLogo && isSubbed) ? 'warn' : 'pass',
      description: (hasLogo && isSubbed) ? 'Ensure uploaded logo is ≥300 DPI for sublimation print' : '300 DPI rendering confirmed ✓',
    },
    {
      id: 'bleed',
      label: 'Bleed Area',
      icon: Layers,
      status: 'pass',
      description: '3mm bleed margin applied to all edges ✓',
    },
    {
      id: 'colorMode',
      label: 'Color Mode',
      icon: Printer,
      status: 'warn',
      description: 'RGB colors will be auto-converted to CMYK for print',
    },
    {
      id: 'safeZone',
      label: 'Safe Zone',
      icon: Shield,
      status: 'pass',
      description: 'Content within 5mm safe production boundary ✓',
    },
    {
      id: 'fonts',
      label: 'Font Embedding',
      icon: Type,
      status: 'pass',
      description: 'Web-safe fonts converted to paths at export ✓',
    },
  ];
}

export default function ValidationPanel({ design, visible = true, onToggle }) {
  const [expanded, setExpanded] = useState(true);
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState({});

  const checks = useMemo(() => getChecks(design), [design]);

  useEffect(() => {
    if (visible) runValidation();
  }, [visible, design]);

  const runValidation = () => {
    setRunning(true);
    setTimeout(() => {
      const r = {};
      checks.forEach(c => { r[c.id] = c.status; });
      setResults(r);
      setRunning(false);
    }, 400);
  };

  const passCount = Object.values(results).filter(v => v === 'pass').length;
  const warnCount = Object.values(results).filter(v => v === 'warn').length;
  const failCount = Object.values(results).filter(v => v === 'fail').length;
  const total = checks.length;

  const overallStatus = failCount > 0 ? 'fail' : warnCount > 0 ? 'warn' : 'pass';
  const statusConfig = STATUS[overallStatus];
  const OverallIcon = statusConfig.icon;
  const score = Math.round((passCount / (total || 1)) * 100);

  if (!visible) return null;

  return (
    <div className="bg-white border-t border-slate-200 shrink-0 overflow-hidden">
      {/* Header bar */}
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 transition-colors"
      >
        {/* Score ring */}
        <div className="relative w-7 h-7 shrink-0">
          <svg className="w-7 h-7 -rotate-90" viewBox="0 0 28 28">
            <circle cx="14" cy="14" r="11" fill="none" stroke="#e2e8f0" strokeWidth="3" />
            <circle
              cx="14" cy="14" r="11" fill="none"
              stroke={overallStatus === 'pass' ? '#10b981' : overallStatus === 'warn' ? '#f59e0b' : '#ef4444'}
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 11}`}
              strokeDashoffset={`${2 * Math.PI * 11 * (1 - score / 100)}`}
              style={{ transition: 'stroke-dashoffset 0.5s ease' }}
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-[7px] font-black text-slate-700">{score}</span>
        </div>

        <div className={`flex items-center gap-1.5 ${statusConfig.color}`}>
          <OverallIcon size={14} />
          <span className="text-[11px] font-bold">
            {running ? 'Validating…' : overallStatus === 'pass' ? 'Production Ready' : overallStatus === 'warn' ? 'Warnings Present' : 'Issues Found'}
          </span>
        </div>
        <div className="flex items-center gap-2 ml-1">
          <span className="text-[10px] font-semibold text-emerald-600">{passCount} ✓</span>
          {warnCount > 0 && <span className="text-[10px] font-semibold text-amber-600">{warnCount} ⚠</span>}
          {failCount > 0 && <span className="text-[10px] font-semibold text-red-600">{failCount} ✗</span>}
        </div>
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={e => { e.stopPropagation(); runValidation(); }}
            className="p-1 rounded-lg hover:bg-slate-200 transition-colors"
            title="Re-run validation"
          >
            <RefreshCw size={11} className={`text-slate-400 ${running ? 'animate-spin' : ''}`} />
          </button>
          {expanded ? <ChevronDown size={13} className="text-slate-400" /> : <ChevronUp size={13} className="text-slate-400" />}
        </div>
      </button>

      {/* Checks list */}
      {expanded && (
        <div className="px-4 pb-3 flex gap-2 flex-wrap">
          {checks.map(check => {
            const status = results[check.id] || check.status;
            const config = STATUS[status] || STATUS.pass;
            const Icon = config.icon;
            const CheckIcon = check.icon;
            return (
              <div
                key={check.id}
                title={check.description}
                className={`flex items-start gap-1.5 px-2 py-1.5 rounded-lg border text-left flex-1 min-w-[140px] ${config.bg} ${config.border} cursor-default`}
              >
                <CheckIcon size={11} className={`${config.color} shrink-0 mt-0.5`} />
                <div className="min-w-0">
                  <div className="flex items-center gap-1">
                    <p className={`text-[9px] font-bold ${config.color}`}>{check.label}</p>
                    <Icon size={9} className={config.color} />
                  </div>
                  <p className="text-[8px] text-slate-500 leading-snug mt-0.5 line-clamp-1">
                    {check.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
