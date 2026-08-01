import { useMemo } from 'react';
import { Group, Layer, Stage } from 'react-konva';
import characterStudent from '../../assets/student-3d.png';
import { useConfiguratorStore } from '../../store/useConfiguratorStore';
import IdCardPreview from '../IdCardPreview';
import { cardSizes, SAFETY_MARGIN } from '../../data/cardConfig';

// ── Color helpers ──────────────────────────────────────────────────────────────

// Extract usable hex color from any color value (hex, gradient string, etc.)
function extractHexColor(colorValue) {
  if (typeof colorValue !== 'string' || !colorValue.trim()) return null;
  // If it's a gradient, extract the first hex color from it
  if (colorValue.includes('gradient')) {
    const match = colorValue.match(/#(?:[0-9a-fA-F]{3}){1,2}/);
    return match ? match[0] : null;
  }
  // If it starts with # it's already a hex
  if (colorValue.startsWith('#')) return colorValue;
  return colorValue;
}

function hexToRgb(h) {
  if (!h || typeof h !== 'string') return [93, 95, 239];
  // Handle gradient strings — extract first color
  const hex = extractHexColor(h) || h;
  const c = hex.replace('#', ''), f = c.length === 3 ? c.split('').map(x => x + x).join('') : c;
  const n = parseInt(f, 16); if (isNaN(n)) return [93, 95, 239];
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function adj([r, g, b], a) { return [Math.min(255, Math.max(0, r + a * 255 | 0)), Math.min(255, Math.max(0, g + a * 255 | 0)), Math.min(255, Math.max(0, b + a * 255 | 0))]; }
function rgbStr([r, g, b], a = 1) { return `rgba(${r},${g},${b},${a})`; }

// ── ANCHOR POINTS (300×380 SVG space) ─────────────────────────────────────────
const SVG_W = 300;
const SVG_H = 380;

// Tighter V-shape: straps converge closer to center, matching reference proportions
const BACK_L  = { x: 133, y: 103 };
const BACK_CP = { x: 150, y:  91 };
const BACK_R  = { x: 167, y: 103 };
const LEFT_T  = { x: 131, y: 108 };
const LEFT_CP = { x: 137, y: 138 };
const LEFT_B  = { x: 148, y: 158 };
const RIGHT_T  = { x: 169, y: 108 };
const RIGHT_CP = { x: 163, y: 135 };
const RIGHT_B  = { x: 152, y: 158 };
const BKL_X = 150, BKL_Y = 158;

// Reduced card ratio to match reference image where card is noticeably smaller
const CARD_W_RATIO = 0.18;

function strapPath(p1, cp, p2) {
  return `M ${p1.x} ${p1.y} Q ${cp.x} ${cp.y} ${p2.x} ${p2.y}`;
}

export default function LiveStudentCharacterPreview({ lanyardColor, idCardSize }) {
  const design = useConfiguratorStore(s => s.design);
  const neckStrapText = design.copyMode === 'synchronized' ? (design.customTextCenter || 'STUDENT · ID') : (design.customTextCenter || 'STUDENT · ID');
  const leftStrapText = design.copyMode === 'synchronized' ? (design.customTextCenter || 'STUDENT · ID') : (design.customTextLeft || 'STUDENT · ID');
  const rightStrapText = design.copyMode === 'synchronized' ? (design.customTextCenter || 'STUDENT · ID') : (design.customTextRight || 'STUDENT · ID');

  const neckStrapRepeated = (neckStrapText + '          ').repeat(12);
  const leftStrapRepeated = (leftStrapText + '          ').repeat(12);
  const rightStrapRepeated = (rightStrapText + '          ').repeat(12);

  const fontColor = design.fontColor || '#ffffff';
  const logoUrl = design.logoUrl || '';

  // Use the passed lanyardColor, then fall back to the store's design color
  const storeLanyardColor = design.lanyardColor;
  const resolvedColor = (typeof lanyardColor === 'string' && lanyardColor.trim())
    ? lanyardColor
    : (typeof storeLanyardColor === 'string' && storeLanyardColor.trim() && storeLanyardColor !== '#ffffff'
        ? storeLanyardColor
        : '#5d5fef');
  // Extract a usable hex from gradient strings for SVG rendering
  const base = extractHexColor(resolvedColor) || '#5d5fef';
  const rgb = useMemo(() => hexToRgb(base), [base]);
  const light = useMemo(() => rgbStr(adj(rgb, 0.22)), [rgb]);
  const mid = useMemo(() => rgbStr(rgb), [rgb]);
  const dark = useMemo(() => rgbStr(adj(rgb, -0.22)), [rgb]);

  // ID card sizing — use REVIEW dimensions (IdCardPreview subtracts SAFETY_MARGIN when isReviewStep=true)
  const sizeKey = idCardSize || '86x54';
  const { width: rawCardW, height: rawCardH } = cardSizes[sizeKey] || cardSizes['86x54'];
  const drawW = rawCardW - SAFETY_MARGIN * 2;   // what IdCardPreview actually renders at
  const drawH = rawCardH - SAFETY_MARGIN * 2;
  const targetW = Math.round(SVG_W * CARD_W_RATIO);
  const cardFitSc = targetW / drawW;
  const cardW = targetW;
  const cardH = Math.round(drawH * cardFitSc);

  // Card position as percentage of SVG space (scales with container)
  const cardCenterX = BKL_X;
  const cardTopY = BKL_Y + 30;
  const cardLeftPct = ((cardCenterX - cardW / 2) / SVG_W) * 100;
  const cardTopPct = (cardTopY / SVG_H) * 100;
  const cardWPct = (cardW / SVG_W) * 100;

  const backD  = strapPath(BACK_L,  BACK_CP,  BACK_R);
  const leftD  = strapPath(LEFT_T,  LEFT_CP,  LEFT_B);
  const rightD = strapPath(RIGHT_T, RIGHT_CP, RIGHT_B);
  const rightDRev = strapPath(RIGHT_B, RIGHT_CP, RIGHT_T);

  const SW = 4.5;

  return (
    <div className="relative h-full w-full overflow-hidden rounded-[24px]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_10%,#f4f7ff_0%,#e3eaf6_60%,#d8e2f2_100%)]" />

      <svg
        viewBox={`0 0 ${SVG_W} ${SVG_H}`}
        className="character-float absolute inset-0 w-full h-full select-none pointer-events-none"
        style={{ filter: 'drop-shadow(0 12px 28px rgba(15,23,42,0.13))' }}
      >
        <defs>
          <linearGradient id="sg-l" gradientUnits="userSpaceOnUse" x1={LEFT_T.x - SW} y1="0" x2={LEFT_T.x + SW} y2="0">
            <stop offset="0%" stopColor={dark} />
            <stop offset="35%" stopColor={light} />
            <stop offset="50%" stopColor={rgbStr(adj(rgb, 0.32))} />
            <stop offset="65%" stopColor={light} />
            <stop offset="100%" stopColor={dark} />
          </linearGradient>
          <linearGradient id="sg-r" gradientUnits="userSpaceOnUse" x1={RIGHT_T.x - SW} y1="0" x2={RIGHT_T.x + SW} y2="0">
            <stop offset="0%" stopColor={dark} />
            <stop offset="35%" stopColor={light} />
            <stop offset="50%" stopColor={rgbStr(adj(rgb, 0.32))} />
            <stop offset="65%" stopColor={light} />
            <stop offset="100%" stopColor={dark} />
          </linearGradient>
          <linearGradient id="sg-b" gradientUnits="userSpaceOnUse" x1={BACK_L.x} y1={BACK_L.y - SW} x2={BACK_L.x} y2={BACK_L.y + SW}>
            <stop offset="0%" stopColor={dark} />
            <stop offset="50%" stopColor={mid} />
            <stop offset="100%" stopColor={dark} />
          </linearGradient>

          <linearGradient id="sg-depth-l" gradientUnits="userSpaceOnUse" x1="0" y1={LEFT_T.y} x2="0" y2={LEFT_B.y}>
            <stop offset="0%"   stopColor="rgba(255,255,255,0.2)" />
            <stop offset="40%"  stopColor="rgba(255,255,255,0)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0.15)" />
          </linearGradient>
          <linearGradient id="sg-depth-r" gradientUnits="userSpaceOnUse" x1="0" y1={RIGHT_T.y} x2="0" y2={RIGHT_B.y}>
            <stop offset="0%"   stopColor="rgba(255,255,255,0.2)" />
            <stop offset="40%"  stopColor="rgba(255,255,255,0)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0.15)" />
          </linearGradient>

          <radialGradient id="neck-fade" cx="50%" cy="0%" r="40%" fx="50%" fy="0%">
            <stop offset="0%"   stopColor="rgba(210,220,235,0.7)" />
            <stop offset="100%" stopColor="rgba(210,220,235,0)" />
          </radialGradient>

          <path id="lft" d={leftD} />
          <path id="rgt" d={rightD} />
          <path id="rgt-rev" d={rightDRev} />
          <path id="bck" d={backD} />

          <filter id="occ"><feGaussianBlur stdDeviation="4" /></filter>
          <filter id="strap-shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="1.2" dy="2.5" stdDeviation="2" floodColor="rgba(0,0,0,0.26)" />
          </filter>

          {logoUrl && (
            <>
              <pattern id="logo-l" patternUnits="userSpaceOnUse" width="30" height="20" patternTransform={`translate(${LEFT_T.x}, ${LEFT_T.y}) rotate(69.8) translate(0, ${-SW / 2})`}>
                <image href={logoUrl} x="12.5" y="0.5" width="5" height="5" preserveAspectRatio="xMidYMid meet" opacity="0.9" />
              </pattern>
              <pattern id="logo-r" patternUnits="userSpaceOnUse" width="30" height="20" patternTransform={`translate(${RIGHT_T.x}, ${RIGHT_T.y}) rotate(110.2) translate(0, ${-SW / 2})`}>
                <image href={logoUrl} x="12.5" y="0.5" width="5" height="5" preserveAspectRatio="xMidYMid meet" opacity="0.9" />
              </pattern>
              <pattern id="logo-b" patternUnits="userSpaceOnUse" width="30" height="20" patternTransform={`translate(${BACK_L.x}, ${BACK_L.y}) rotate(0) translate(0, ${-SW / 2})`}>
                <image href={logoUrl} x="12.5" y="0.5" width="5" height="5" preserveAspectRatio="xMidYMid meet" opacity="0.9" />
              </pattern>
            </>
          )}
        </defs>

        {/* ── Back strap (behind avatar) ── */}
        <use href="#bck" stroke="url(#sg-b)" strokeWidth={SW * 0.88} fill="none" strokeLinecap="round" opacity="0.88" />
        <use href="#bck" stroke="rgba(0,0,0,0.25)" strokeWidth="1.2" fill="none" transform="translate(0,1.2)" />
        {logoUrl && <use href="#bck" stroke="url(#logo-b)" strokeWidth={SW * 0.88} fill="none" />}
        <text fontSize="3" fill={fontColor} opacity="0.5" fontWeight="bold" fontFamily="Montserrat,sans-serif" letterSpacing="1.2">
          <textPath href="#bck" startOffset="4%" dy="1">{neckStrapRepeated}</textPath>
        </text>

        {/* ── Avatar image ── */}
        <image href={characterStudent} x="0" y="0" width="300" height="300" />

        {/* ── Occlusion shadows ── */}
        <use href="#lft" stroke="rgba(0,0,0,0.35)" strokeWidth={SW + 4} fill="none" filter="url(#occ)" opacity="0.22" />
        <use href="#rgt" stroke="rgba(0,0,0,0.35)" strokeWidth={SW + 4} fill="none" filter="url(#occ)" opacity="0.22" />

        {/* ── Left front strap ── */}
        <use href="#lft" stroke="url(#sg-l)" strokeWidth={SW} fill="none" strokeLinecap="butt" filter="url(#strap-shadow)" />
        <use href="#lft" stroke="url(#sg-depth-l)" strokeWidth={SW - 1} fill="none" strokeLinecap="butt" opacity="0.85" />
        <use href="#lft" stroke="rgba(0,0,0,0.28)" strokeWidth="1.1" fill="none" transform="translate(1.6,0.8)" opacity="0.65" />
        <use href="#lft" stroke="rgba(255,255,255,0.42)" strokeWidth="0.85" fill="none" transform="translate(-1.6,-0.8)" />
        <use href="#lft" stroke="rgba(255,255,255,0.4)" strokeWidth="0.7" fill="none" strokeDasharray="2 3" transform={`translate(${-SW * 0.38},0)`} opacity="0.7" />
        <use href="#lft" stroke="rgba(255,255,255,0.4)" strokeWidth="0.7" fill="none" strokeDasharray="2 3" transform={`translate(${SW * 0.38},0)`} opacity="0.7" />
        {logoUrl && <use href="#lft" stroke="url(#logo-l)" strokeWidth={SW} fill="none" strokeLinecap="butt" />}
        <text fontSize="3.2" fill={fontColor} opacity="0.95" fontWeight="700" fontFamily="Montserrat,sans-serif" letterSpacing="1.2">
          <textPath href="#lft" startOffset="5%" dy="1.1">{leftStrapRepeated}</textPath>
        </text>

        {/* ── Right front strap ── */}
        <use href="#rgt" stroke="url(#sg-r)" strokeWidth={SW} fill="none" strokeLinecap="butt" filter="url(#strap-shadow)" />
        <use href="#rgt" stroke="url(#sg-depth-r)" strokeWidth={SW - 1} fill="none" strokeLinecap="butt" opacity="0.85" />
        <use href="#rgt" stroke="rgba(0,0,0,0.28)" strokeWidth="1.1" fill="none" transform="translate(1.6,0.8)" opacity="0.65" />
        <use href="#rgt" stroke="rgba(255,255,255,0.42)" strokeWidth="0.85" fill="none" transform="translate(-1.6,-0.8)" />
        <use href="#rgt" stroke="rgba(255,255,255,0.4)" strokeWidth="0.7" fill="none" strokeDasharray="2 3" transform={`translate(${-SW * 0.38},0)`} opacity="0.7" />
        <use href="#rgt" stroke="rgba(255,255,255,0.4)" strokeWidth="0.7" fill="none" strokeDasharray="2 3" transform={`translate(${SW * 0.38},0)`} opacity="0.7" />
        {logoUrl && <use href="#rgt" stroke="url(#logo-r)" strokeWidth={SW} fill="none" strokeLinecap="butt" />}
        <text fontSize="3.2" fill={fontColor} opacity="0.95" fontWeight="700" fontFamily="Montserrat,sans-serif" letterSpacing="1.2">
          <textPath href="#rgt-rev" startOffset="5%" dy="1.1">{rightStrapRepeated.split('').reverse().join('')}</textPath>
        </text>

        {/* ── Neck-contact fade ── */}
        <rect x="118" y="96" width="64" height="22" fill="url(#neck-fade)" opacity="0.5" />

        {/* ── Buckle + clip → connects directly to card ── */}
        <g transform={`translate(${BKL_X}, ${BKL_Y})`}>
          {/* Metal crimp — compact */}
          <rect x="-5" y="0" width="10" height="7" rx="2" fill="#1a1a1e" />
          <rect x="-3.5" y="0.8" width="7" height="1.4" rx="0.8" fill="rgba(255,255,255,0.22)" />
          <circle cx="0" cy="4" r="1.6" fill="#2a2a2e" />
          <circle cx="0" cy="4" r="0.7" fill="#111" />
          {/* Short connecting rod */}
          <line x1="0" y1="7" x2="0" y2="13" stroke="#b0bec5" strokeWidth="1.4" />
          {/* Swivel ring — smaller */}
          <circle cx="0" cy="16" r="3" fill="none" stroke="#c8d4de" strokeWidth="1.4" />
          <circle cx="0" cy="16" r="1" fill="#aab4c0" />
          {/* Pin to card clip */}
          <line x1="0" y1="19" x2="0" y2="23" stroke="#aab4c0" strokeWidth="1.2" />
          {/* Clip tab — smaller */}
          <rect x="-6" y="23" width="12" height="6" rx="1.5" fill="#d1d5db" stroke="#9ca3af" strokeWidth="0.7" />
          <rect x="-4" y="24.5" width="8" height="2.2" rx="1" fill="rgba(255,255,255,0.5)" />
        </g>
      </svg>

      {/* ── ID Card: percentage-based positioning synced with SVG ── */}
      <div
        className="badge-sway absolute z-20 pointer-events-none"
        style={{
          left: `${cardLeftPct}%`,
          top: `${cardTopPct}%`,
          width: `${cardWPct}%`,
        }}
      >
        <div className="absolute -z-10 rounded-md bg-black/20 blur-lg" style={{ inset: '4px 3px -8px 3px' }} />
        <div
          className="swp-card-wrapper relative w-full overflow-hidden rounded-[5px] border border-slate-200 bg-white"
          style={{
            aspectRatio: `${cardW} / ${cardH}`,
            transform: 'perspective(360px) rotateX(4deg) rotateY(-3deg)',
            boxShadow: '0 6px 18px -4px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.7)',
          }}
        >
          <Stage width={cardW * 3} height={cardH * 3} listening={false}
            style={{ width: '100%', height: '100%', display: 'block' }}
          >
            <Layer listening={false}>
              <Group
                x={0}
                y={0}
                scaleX={cardFitSc * 3}
                scaleY={cardFitSc * 3}
                listening={false}
              >
                <IdCardPreview isReviewStep={true} forceSide="front" />
              </Group>
            </Layer>
          </Stage>
          <div className="absolute inset-0 pointer-events-none gloss-shimmer opacity-20" />
        </div>
      </div>
    </div>
  );
}
