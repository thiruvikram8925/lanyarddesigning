import React, { useMemo, useRef, useState, useEffect } from 'react';
import { Group, Layer, Stage } from 'react-konva';
import { Rnd } from 'react-rnd';
import studentBoy from '../../assets/student-boy.png';
import studentGirl from '../../assets/student-girl.png';
import { useConfiguratorStore } from '../../store/useConfiguratorStore';
import IdCardPreview from '../IdCardPreview';
import { cardSizes, SAFETY_MARGIN } from '../../data/cardConfig';

class RndErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="absolute top-0 left-0 z-50 bg-red-100 border border-red-400 text-red-700 px-2 py-1 rounded text-xs shadow-sm">
          Drag tool unavailable.
        </div>
      );
    }
    return this.props.children;
  }
}

/* ── Color helpers ────────────────────────────────────────────── */
function extractHex(v) {
  if (typeof v !== 'string' || !v.trim()) return null;
  if (v.includes('gradient')) {
    const m = v.match(/#(?:[0-9a-fA-F]{3}){1,2}/);
    return m ? m[0] : null;
  }
  return v.startsWith('#') ? v : v;
}
function hexToRgb(h) {
  const hex = extractHex(h) || '#5d5fef';
  const c = hex.replace('#', '');
  const f = c.length === 3 ? c.split('').map(x => x + x).join('') : c;
  const n = parseInt(f, 16);
  if (isNaN(n)) return [93, 95, 239];
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function adj([r, g, b], a) {
  return [
    Math.min(255, Math.max(0, (r + a * 255) | 0)),
    Math.min(255, Math.max(0, (g + a * 255) | 0)),
    Math.min(255, Math.max(0, (b + a * 255) | 0)),
  ];
}
function rgbStr([r, g, b]) {
  return `rgb(${r},${g},${b})`;
}

/* ─────────────────────────────────────────────────────────────────
   Clip paths calibrated for the close-up character images.
   These images show the characters from waist up, filling 
   most of the frame. The character occupies ~94% of the image.
   
   Image layout (approximate % of image height):
   ├── 0-5%    : top margin/hair
   ├── 5-30%   : head + hair  
   ├── 30-37%  : neck + collar
   ├── 37-75%  : shirt/polo torso + sleeves
   ├── 75-100% : pants/skirt waist area (lower body)
   
   Image layout (approximate % of image width):
   ├── 10-90%  : body width
   ├── 15-85%  : shoulder span
   ├── 35-65%  : torso/shirt center
   ───────────────────────────────────────────────────────────────── */

/* BOY — tight fitting boxes */
const BOY_SHIRT_CLIP =
  'polygon(38.9% 0%, 61.1% 0%, 80.5% 10.3%, 100% 62%, 86.1% 62%, 75% 34.4%, 66.6% 100%, 33.3% 100%, 25% 34.4%, 13.8% 62%, 0% 62%, 19.4% 10.3%)';

const BOY_PANTS_CLIP =
  'polygon(26% 0%, 74% 0%, 100% 100%, 0% 100%)';

/* GIRL — tight fitting boxes */
const GIRL_SHIRT_CLIP =
  'polygon(38.9% 0%, 61.1% 0%, 80.5% 10.3%, 100% 62%, 86.1% 62%, 75% 34.4%, 66.6% 100%, 33.3% 100%, 25% 34.4%, 13.8% 62%, 0% 62%, 19.4% 10.3%)';

const GIRL_SKIRT_CLIP =
  'polygon(35% 0%, 65% 0%, 100% 100%, 0% 100%)';


/* ── Single Character Card ──────────────────────────────────── */
export function CharacterCard({
  characterImg,
  maskImg,
  label,
  activeTab,
  isEditingFit,
  editingPart,
  lanyardColor,
  shirtColor,
  shirtTextureUrl,
  bottomColor,
  bottomTextureUrl,
  fontColor,
  customText,
  idCardSize,
}) {
  const setField = useConfiguratorStore(s => s.setField);
  const design = useConfiguratorStore(s => s.design);
  const uniformConfig = design.uniformConfig[activeTab];
  
  const maskFit = uniformConfig?.maskFit || {
    shirt: { x: 14, y: 38, width: 72, height: 29 }
  };

  const containerRef = useRef(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver(entries => {
      for (let entry of entries) {
        setContainerSize({
          width: entry.contentRect.width,
          height: entry.contentRect.height
        });
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const getNum = (val, defaultVal) => {
    if (typeof val === 'number') return val;
    if (typeof val === 'string') {
      const parsed = parseFloat(val);
      if (!isNaN(parsed)) return parsed;
    }
    return defaultVal;
  };

  const getPixelBounds = (mask, type) => {
    if (!containerSize.width || !mask) return { x: 0, y: 0, width: 0, height: 0 };
    
    const def = type === 'shirt' 
      ? { x: 14, y: 38, width: 72, height: 29 }
      : { x: 20, y: 67, width: 60, height: 33 };

    let x = getNum(mask.x, def.x);
    let y = getNum(mask.y, def.y);
    let w = getNum(mask.width, def.width);
    let h = getNum(mask.height, def.height);
    
    // Auto-recover from old localstorage state that used 100% full-screen boxes
    if (w === 100 && h === 100) {
      x = def.x; y = def.y; w = def.width; h = def.height;
    }

    return {
      x: (x / 100) * containerSize.width,
      y: (y / 100) * containerSize.height,
      width: (w / 100) * containerSize.width,
      height: (h / 100) * containerSize.height,
    };
  };

  const shirtPx = getPixelBounds(maskFit?.shirt, 'shirt');

  const handleDragStop = (type, d) => {
    if (!activeTab || !containerSize.width) return;
    setField(`uniformConfig.${activeTab}.maskFit.${type}.x`, (d.x / containerSize.width) * 100);
    setField(`uniformConfig.${activeTab}.maskFit.${type}.y`, (d.y / containerSize.height) * 100);
  };

  const handleResizeStop = (type, ref, position) => {
    if (!activeTab || !containerSize.width) return;
    const newWidth = parseFloat(ref.style.width);
    const newHeight = parseFloat(ref.style.height);
    setField(`uniformConfig.${activeTab}.maskFit.${type}.width`, (newWidth / containerSize.width) * 100);
    setField(`uniformConfig.${activeTab}.maskFit.${type}.height`, (newHeight / containerSize.height) * 100);
    setField(`uniformConfig.${activeTab}.maskFit.${type}.x`, (position.x / containerSize.width) * 100);
    setField(`uniformConfig.${activeTab}.maskFit.${type}.y`, (position.y / containerSize.height) * 100);
  };

  const displayImg = characterImg;
  const rgb = useMemo(() => hexToRgb(lanyardColor), [lanyardColor]);
  const light = useMemo(() => rgbStr(adj(rgb, 0.25)), [rgb]);
  const dark = useMemo(() => rgbStr(adj(rgb, -0.3)), [rgb]);
  const shadow = 'rgba(15, 23, 42, 0.5)';

  /* ID Card sizing */
  const sizeKey = idCardSize || '86x54';
  const { width: rawW, height: rawH } = cardSizes[sizeKey] || cardSizes['86x54'];
  const drawW = rawW - SAFETY_MARGIN * 2;
  const drawH = rawH - SAFETY_MARGIN * 2;
  const targetW = 34; // Scaled down to match the character size
  const cardFitSc = targetW / drawW;
  const cardW = targetW;
  const cardH = Math.round(drawH * cardFitSc);

  const strapRepeated = ((customText || 'STUDENT') + '      ').repeat(8);

  /* Whether we have a real uniform color/texture to overlay */
  const hasShirtColor = shirtColor && shirtColor !== '#f1f5f9';
  const hasShirtTexture = Boolean(shirtTextureUrl);
  
  const preciseShirtClip = label === 'Boy' ? BOY_SHIRT_CLIP : GIRL_SHIRT_CLIP;

  const maskStyles = maskImg ? {
    WebkitMaskImage: `url(${maskImg})`,
    maskImage: `url(${maskImg})`,
    WebkitMaskSize: 'contain',
    maskSize: 'contain',
    WebkitMaskRepeat: 'no-repeat',
    maskRepeat: 'no-repeat',
    WebkitMaskPosition: 'bottom center',
    maskPosition: 'bottom center',
    width: '100%',
    height: '100%',
  } : {
    clipPath: preciseShirtClip,
    WebkitClipPath: preciseShirtClip,
    width: '100%',
    height: '100%',
  };

  const shirtStyles = {
    ...maskStyles,
    backgroundColor: hasShirtColor ? shirtColor : 'transparent',
    ...(hasShirtTexture
      ? {
          backgroundImage: `url(${shirtTextureUrl})`,
          backgroundSize: '60px',
          backgroundRepeat: 'repeat',
          backgroundPosition: 'center',
          backgroundBlendMode: 'multiply',
          mixBlendMode: 'multiply',
          opacity: 0.95,
        }
      : {
          mixBlendMode: 'multiply',
          opacity: 0.85,
        }),
  };

  return (
    <div className="premium-char-card relative w-full h-full flex flex-col justify-end items-center">
      <div className="premium-char-img-wrap relative w-full aspect-square flex justify-center items-end" ref={containerRef}>
        <img
          src={displayImg}
          alt={label}
          className="premium-char-img"
          draggable={false}
        />

        {/* ── CSS Uniform Overlay (Shirt) ── */}
        {(hasShirtColor || hasShirtTexture) && containerSize.width > 0 && containerSize.height > 0 && (
          isEditingFit && editingPart === 'shirt' && !maskImg ? (
            <RndErrorBoundary>
              <Rnd
                size={{ width: shirtPx.width, height: shirtPx.height }}
                position={{ x: shirtPx.x, y: shirtPx.y }}
                onDragStop={(e, d) => handleDragStop('shirt', d)}
                onResizeStop={(e, dir, ref, delta, pos) => handleResizeStop('shirt', ref, pos)}
                enableUserSelectHack={false}
                className="absolute z-20 border-2 border-dashed border-indigo-500 bg-indigo-500/10 shadow-[0_0_15px_rgba(99,102,241,0.5)] cursor-move"
                style={{ position: 'absolute', top: 0, left: 0 }}
              >
                <div className="premium-uniform-overlay" style={shirtStyles} />
              </Rnd>
            </RndErrorBoundary>
          ) : (
            <div
              className="absolute z-10 pointer-events-none"
              style={maskImg ? { top: 0, left: 0, width: '100%', height: '100%' } : { top: shirtPx.y, left: shirtPx.x, width: shirtPx.width, height: shirtPx.height }}
            >
              <div className="premium-uniform-overlay" style={shirtStyles} />
            </div>
          )
        )}

        {/* ── SVG Lanyard Straps ── 
             Neck at Y=42, chest at Y=68 */}
        <svg
          viewBox="0 0 100 100"
          className="premium-char-lanyard"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            <linearGradient id={`sg-${label}`} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor={dark} />
              <stop offset="25%" stopColor={light} />
              <stop offset="50%" stopColor={lanyardColor} />
              <stop offset="75%" stopColor={light} />
              <stop offset="100%" stopColor={dark} />
            </linearGradient>
            <filter id={`shadow-${label}`} x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="1.5" stdDeviation="1.5" floodColor={shadow} floodOpacity="0.8" />
            </filter>
            <filter id={`clip-shadow-${label}`} x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="1" stdDeviation="0.8" floodColor="#000" floodOpacity="0.5" />
            </filter>
          </defs>

          {/* Back strap (behind neck) - darker, no shadow */}
          <path
            d="M 38 42 Q 50 38 62 42"
            stroke={dark}
            strokeWidth="2.5"
            fill="none"
            strokeLinecap="round"
            opacity="0.8"
          />

          {/* Left strap front */}
          <path
            d="M 38 42 C 38 52, 46 60, 49 68"
            stroke={`url(#sg-${label})`}
            strokeWidth="2.6"
            fill="none"
            strokeLinecap="round"
            filter={`url(#shadow-${label})`}
          />
          <path
            d="M 38 42 C 38 52, 46 60, 49 68"
            stroke="rgba(255,255,255,0.4)"
            strokeWidth="0.8"
            fill="none"
            strokeLinecap="round"
          />

          {/* Right strap front */}
          <path
            d="M 62 42 C 62 52, 54 60, 51 68"
            stroke={`url(#sg-${label})`}
            strokeWidth="2.6"
            fill="none"
            strokeLinecap="round"
            filter={`url(#shadow-${label})`}
          />
          <path
            d="M 62 42 C 62 52, 54 60, 51 68"
            stroke="rgba(255,255,255,0.4)"
            strokeWidth="0.8"
            fill="none"
            strokeLinecap="round"
          />

          {/* Strap text paths */}
          <defs>
            <path id={`lt-${label}`} d="M 38 42 C 38 52, 46 60, 49 68" />
            <path id={`rt-${label}`} d="M 62 42 C 62 52, 54 60, 51 68" />
          </defs>
          <text fontSize="1.2" fill={fontColor} opacity="0.9" fontWeight="900"
            fontFamily="Montserrat, sans-serif" letterSpacing="0.5">
            <textPath href={`#lt-${label}`} startOffset="5%" dy="0.6">
              {strapRepeated}
            </textPath>
          </text>
          <text fontSize="1.2" fill={fontColor} opacity="0.9" fontWeight="900"
            fontFamily="Montserrat, sans-serif" letterSpacing="0.5">
            <textPath href={`#rt-${label}`} startOffset="5%" dy="0.6">
              {strapRepeated}
            </textPath>
          </text>

          {/* Metal buckle/clip assembly at convergence */}
          <g filter={`url(#clip-shadow-${label})`}>
            {/* Crimp */}
            <rect x="47.5" y="68" width="5" height="2.5" rx="0.5" fill="#1e293b" />
            <rect x="48" y="68.5" width="4" height="0.6" rx="0.2" fill="rgba(255,255,255,0.25)" />
            
            {/* Connecting rod */}
            <line x1="50" y1="70.5" x2="50" y2="72.5" stroke="#94a3b8" strokeWidth="1.2" />
            <line x1="49.8" y1="70.5" x2="49.8" y2="72.5" stroke="#f1f5f9" strokeWidth="0.4" />
            
            {/* Swivel ring */}
            <circle cx="50" cy="73.5" r="1.5" fill="none" stroke="#cbd5e1" strokeWidth="0.8" />
            <circle cx="50" cy="73.5" r="1" fill="none" stroke="#64748b" strokeWidth="0.3" />
            
            {/* Bulldog clip base */}
            <path d="M 48 75 L 52 75 L 51 77 L 49 77 Z" fill="#cbd5e1" stroke="#64748b" strokeWidth="0.3" />
          </g>
        </svg>

        {/* ── ID Card — positioned precisely below the buckle ── */}
        <div
          className="premium-char-idcard"
          style={{
            width: `${cardW}px`,
            left: `calc(50% - ${cardW / 2}px)`,
            top: '77%', 
          }}
        >
          <div className="premium-card-shadow" style={{ filter: 'blur(3px)', background: 'rgba(0,0,0,0.4)', inset: '3px -1px -6px 4px' }} />
          <div
            className="premium-card-inner"
            style={{ 
              aspectRatio: `${cardW} / ${cardH}`,
              transform: 'perspective(400px) rotateX(8deg) rotateY(-1deg)', 
              transformOrigin: 'top center'
            }}
          >
            <Stage
              width={cardW * 3}
              height={cardH * 3}
              listening={false}
              style={{ width: '100%', height: '100%', display: 'block' }}
            >
              <Layer listening={false}>
                <Group
                  x={0} y={0}
                  scaleX={cardFitSc * 3}
                  scaleY={cardFitSc * 3}
                  listening={false}
                >
                  <IdCardPreview isReviewStep={true} forceSide="front" />
                </Group>
              </Layer>
            </Stage>
            <div className="absolute inset-0 pointer-events-none gloss-shimmer opacity-20 mix-blend-overlay" />
          </div>
        </div>
      </div>

      {/* ── Character Label ── */}
      <div className="premium-char-label">{label}</div>
    </div>
  );
}

/* ── Main Premium Character Preview ─────────────────────────── */
export default function PremiumCharacterPreview({ lanyardColor, idCardSize }) {
  const design = useConfiguratorStore((s) => s.design);

  const uniformColor = design.premiumUniformColor || '#f1f5f9';
  const fontColor = design.fontColor || '#ffffff';
  const customText = design.customTextCenter || design.customTextLeft || '';

  const resolvedLanyard =
    typeof lanyardColor === 'string' && lanyardColor.trim()
      ? lanyardColor
      : typeof design.lanyardColor === 'string' &&
          design.lanyardColor.trim() &&
          design.lanyardColor !== '#ffffff'
        ? design.lanyardColor
        : '#5d5fef';

  return (
    <div className="premium-preview-root">
      {/* Background */}
      <div className="premium-preview-bg" />

      {/* AI Mode badge */}
      <div className="premium-ai-badge">
        <span className="premium-ai-dot" />
        <div className="premium-chars-title">
          Uniform Mode
        </div>
      </div>
      {/* Two characters side by side */}
      <div className="premium-chars-row">
        <CharacterCard
          characterImg={studentBoy}
          maskImg="/student-boy-mask.png"
          label="Boy"
          lanyardColor={design.lanyardColor}
          shirtColor={design.premiumUniformColor}
          shirtTextureUrl={design.premiumUniformTextureUrl}
          fontColor={design.fontColor}
          customText={design.customText}
          idCardSize={design.idCardSize}
        />
        <CharacterCard
          characterImg={studentGirl}
          maskImg="/student-girl-mask.png"
          label="Girl"
          lanyardColor={design.lanyardColor}
          shirtColor={design.premiumUniformColor}
          shirtTextureUrl={design.premiumUniformTextureUrl}
          fontColor={design.fontColor}
          customText={design.customText}
          idCardSize={design.idCardSize}
        />
      </div>

      {/* Uniform color indicator */}
      {uniformColor && uniformColor !== '#f1f5f9' && (
        <div className="premium-color-tag">
          <span
            className="premium-color-swatch"
            style={{ backgroundColor: uniformColor }}
          />
          <span className="premium-color-label">
            {uniformColor.toUpperCase()}
          </span>
        </div>
      )}

      {/* Decorative floor gradient */}
      <div className="premium-floor-grad" />
    </div>
  );
}
