import { Group, Layer, Stage } from 'react-konva';
import { createPortal } from 'react-dom';
import IdCardPreview from './IdCardPreview';
import StudentPortraitArtwork from './studentWear/StudentPortraitArtwork';
import LiveStudentCharacterPreview from './studentWear/LiveStudentCharacterPreview';
import PremiumCharacterPreview from './studentWear/PremiumCharacterPreview';
import Student3DPreview from './studentWear/Student3DPreview';
import { getAccentColor, getPreviewFrame, PORTRAIT_FRAME_CLASSNAME } from './studentWear/studentWearPreviewUtils';
import { Suspense, useState, useEffect, useCallback } from 'react';
import { useConfiguratorStore } from '../store/useConfiguratorStore';

function LanyardOverlay({ strapSurface }) {
  // This is the old 2D overlay, we keep it as a fallback or if 3D fails
  return (
    <>
      <div
        className="absolute left-[45%] top-[54%] h-[44px] w-[8px] origin-bottom rounded-full border border-white/20 shadow-[0_8px_18px_rgba(15,23,42,0.18)]"
        style={{ background: strapSurface, transform: 'rotate(28deg)' }}
      />
      <div
        className="absolute left-[51.5%] top-[54%] h-[44px] w-[8px] origin-bottom rounded-full border border-white/20 shadow-[0_8px_18px_rgba(15,23,42,0.18)]"
        style={{ background: strapSurface, transform: 'rotate(-28deg)' }}
      />
      <div className="absolute left-1/2 top-[67.5%] h-[14px] w-[24px] -translate-x-1/2 rounded-[6px] border border-slate-300 bg-[linear-gradient(180deg,#f8fafc_0%,#cbd5e1_100%)] shadow-sm" />
      <div className="absolute left-1/2 top-[72%] h-[24px] w-[7px] -translate-x-1/2 rounded-full border border-white/20 shadow-[0_8px_18px_rgba(15,23,42,0.18)]" style={{ background: strapSurface }} />
      <div className="absolute left-1/2 top-[79%] h-[16px] w-[20px] -translate-x-1/2 rounded-full border border-slate-400/60 bg-[linear-gradient(180deg,#ffffff_0%,#cbd5e1_100%)] shadow-sm" />
    </>
  );
}

function LiveBadgeCard({ idCardSize }) {
  const frame = getPreviewFrame(idCardSize);
  const badgeWidth = 90;
  const cardFitScale = badgeWidth / frame.frameWidth;
  const badgeHeight = Math.round(frame.frameHeight * cardFitScale);

  return (
    <div className="card-overlay">
      <div className="card-overlay-body">
        <div className="card-overlay-hook">
          <svg viewBox="0 0 40 40" className="absolute inset-0 h-full w-full">
            <rect x="13" y="2" width="14" height="9" rx="2.2" fill="#0f172a" />
            <rect x="14" y="3" width="12" height="1.7" rx="0.8" fill="rgba(255,255,255,0.35)" />
            <circle cx="20" cy="7" r="2" fill="#0b1220" stroke="rgba(255,255,255,0.2)" strokeWidth="0.4" />
            <line x1="20" y1="11" x2="20" y2="20" stroke="rgba(148,163,184,0.95)" strokeWidth="1.4" />
            <circle cx="20" cy="23" r="2.8" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="0.7" />
            <line x1="20" y1="26" x2="20" y2="32" stroke="rgba(148,163,184,0.8)" strokeWidth="1.2" />
            <rect x="14" y="32" width="12" height="6" rx="1.5" fill="#d1d5db" stroke="#9ca3af" strokeWidth="0.6" />
          </svg>
        </div>

        <div className="card-overlay-card" style={{ height: `${badgeHeight}px` }}>
          <Stage width={badgeWidth} height={badgeHeight} listening={false}>
            <Layer listening={false}>
              <Group
                x={frame.previewOffsetX * cardFitScale}
                y={frame.previewOffsetY * cardFitScale}
                scaleX={frame.cardScale * cardFitScale}
                scaleY={frame.cardScale * cardFitScale}
                listening={false}
              >
                <IdCardPreview isReviewStep={true} forceSide="front" />
              </Group>
            </Layer>
          </Stage>
        </div>
      </div>
    </div>
  );
}

/* ── Fullscreen expand button icon ([ ] symbol) ── */
function ExpandIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      {/* Top-left corner */}
      <polyline points="1,5 1,1 5,1" />
      {/* Top-right corner */}
      <polyline points="11,1 15,1 15,5" />
      {/* Bottom-right corner */}
      <polyline points="15,11 15,15 11,15" />
      {/* Bottom-left corner */}
      <polyline points="5,15 1,15 1,11" />
    </svg>
  );
}

/* ── Collapse / close icon (minimize) ── */
function CollapseIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      {/* Top-left inward */}
      <polyline points="5,1 5,5 1,5" />
      {/* Top-right inward */}
      <polyline points="11,5 15,5 11,1" />
      {/* Bottom-right inward */}
      <polyline points="11,15 11,11 15,11" />
      {/* Bottom-left inward */}
      <polyline points="1,11 5,11 5,15" />
    </svg>
  );
}

/* ── Fullscreen Modal Overlay ── */
function FullscreenOverlay({ onClose, children }) {
  // Close on ESC key
  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleKey);
    // Prevent body scroll while fullscreen is open
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  return createPortal(
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(8, 10, 18, 0.88)',
        backdropFilter: 'blur(18px)',
        animation: 'swp-fullscreen-in 0.32s cubic-bezier(0.22, 1, 0.36, 1) forwards',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Close / collapse button — top right */}
      <button
        onClick={onClose}
        title="Close fullscreen"
        style={{
          position: 'absolute',
          top: 24,
          right: 28,
          zIndex: 10001,
          width: 44,
          height: 44,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '50%',
          border: '1px solid rgba(255,255,255,0.15)',
          background: 'rgba(255,255,255,0.08)',
          color: '#e2e8f0',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          backdropFilter: 'blur(8px)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(255,255,255,0.18)';
          e.currentTarget.style.color = '#fff';
          e.currentTarget.style.transform = 'scale(1.08)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
          e.currentTarget.style.color = '#e2e8f0';
          e.currentTarget.style.transform = 'scale(1)';
        }}
      >
        <CollapseIcon size={20} />
      </button>

      {/* Label at top */}
      <div style={{
        position: 'absolute',
        top: 30,
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        zIndex: 10001,
      }}>
        <span style={{
          fontSize: 10,
          fontWeight: 900,
          letterSpacing: '0.22em',
          textTransform: 'uppercase',
          color: 'rgba(255,255,255,0.45)',
          fontFamily: "'Montserrat', sans-serif",
        }}>Live Wear View</span>
        <span style={{
          fontSize: 9,
          fontWeight: 800,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: 'rgba(255,255,255,0.3)',
          padding: '2px 8px',
          borderRadius: 999,
          border: '1px solid rgba(255,255,255,0.12)',
          background: 'rgba(255,255,255,0.05)',
        }}>Fullscreen</span>
      </div>

      {/* Main enlarged preview container */}
      <div
        style={{
          width: '90vh',
          maxWidth: '680px',
          height: '90vh',
          maxHeight: '90vh',
          borderRadius: 32,
          overflow: 'hidden',
          position: 'relative',
          boxShadow: '0 40px 100px -20px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.06)',
          animation: 'swp-scale-in 0.35s cubic-bezier(0.22, 1, 0.36, 1) forwards',
        }}
      >
        {children}
      </div>

      {/* Hint at bottom */}
      <div style={{
        position: 'absolute',
        bottom: 24,
        left: '50%',
        transform: 'translateX(-50%)',
        fontSize: 11,
        color: 'rgba(255,255,255,0.3)',
        fontFamily: "'Montserrat', sans-serif",
        fontWeight: 500,
        letterSpacing: '0.06em',
      }}>
        Press <kbd style={{
          padding: '2px 7px',
          borderRadius: 4,
          border: '1px solid rgba(255,255,255,0.15)',
          background: 'rgba(255,255,255,0.06)',
          fontSize: 10,
          fontWeight: 700,
        }}>ESC</kbd> or click outside to close
      </div>
    </div>,
    document.body
  );
}

export default function StudentWearPreview({ lanyardColor, idCardSize }) {
  const [useEnhancedPreview, setUseEnhancedPreview] = useState(false);
  const [lowPowerMode, setLowPowerMode] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const designColor = useConfiguratorStore(s => s.design.lanyardColor);
  const strapSurface = (typeof lanyardColor === 'string' && lanyardColor.trim())
    ? lanyardColor
    : (typeof designColor === 'string' && designColor.trim() && designColor !== '#ffffff'
        ? designColor
        : '#5d5fef');
  const accentColor = getAccentColor(lanyardColor || designColor);

  const handleCloseFullscreen = useCallback(() => setIsFullscreen(false), []);

  const design = useConfiguratorStore(s => s.design);

  // Lazy-load the richer preview and keep a safe fallback for low-end devices.
  useEffect(() => {
    const cpuCores = navigator.hardwareConcurrency ?? 8;
    const memory = navigator.deviceMemory ?? 8;
    const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ?? false;
    setLowPowerMode(cpuCores <= 4 || memory <= 4 || reducedMotion);

    const timer = setTimeout(() => setUseEnhancedPreview(true), 100);
    return () => clearTimeout(timer);
  }, []);

  /* Shared preview content — same in both mini and fullscreen.
     AI Uniform Mode (boy + girl) is available for ALL users. */
  const previewContent = useEnhancedPreview && !lowPowerMode ? (
    <PremiumCharacterPreview lanyardColor={strapSurface} idCardSize={idCardSize} />
  ) : (
    <>
      <StudentPortraitArtwork />
      <LanyardOverlay strapSurface={strapSurface} />
      <LiveBadgeCard idCardSize={idCardSize} />
    </>
  );

  return (
    <>
      <div className="pointer-events-auto absolute bottom-5 right-5 z-20 w-[336px] max-w-[92vw]">
        <div className="rounded-[28px] border border-white/60 bg-white/88 p-3 shadow-[0_24px_55px_rgba(15,23,42,0.18)] backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.24em] text-slate-400">Live Wear View</p>
              <p className="mt-1 text-[12px] font-bold text-slate-700">Student Preview</p>
            </div>
            <div className="flex items-center gap-2">
              <div
                className="rounded-full border border-white/70 px-2 py-1 text-[9px] font-black uppercase tracking-[0.18em] shadow-sm"
                style={{ color: accentColor, background: `${accentColor}16` }}
              >
                3D HD
              </div>
              {/* ── Expand / fullscreen button ── */}
              <button
                id="student-preview-expand-btn"
                onClick={() => setIsFullscreen(true)}
                title="Expand to fullscreen"
                className="swp-expand-btn"
                style={{
                  width: 30,
                  height: 30,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 8,
                  border: '1px solid rgba(148,163,184,0.25)',
                  background: 'rgba(248,250,252,0.8)',
                  color: '#64748b',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  flexShrink: 0,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = accentColor + '14';
                  e.currentTarget.style.borderColor = accentColor + '40';
                  e.currentTarget.style.color = accentColor;
                  e.currentTarget.style.transform = 'scale(1.08)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(248,250,252,0.8)';
                  e.currentTarget.style.borderColor = 'rgba(148,163,184,0.25)';
                  e.currentTarget.style.color = '#64748b';
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                <ExpandIcon size={15} />
              </button>
            </div>
          </div>

          <div className={PORTRAIT_FRAME_CLASSNAME}>
            {previewContent}
          </div>
        </div>
      </div>

      {/* ── Fullscreen overlay portal ── */}
      {isFullscreen && (
        <FullscreenOverlay onClose={handleCloseFullscreen}>
          <div style={{ width: '100%', height: '100%', position: 'relative' }}>
            {previewContent}
          </div>
        </FullscreenOverlay>
      )}
    </>
  );
}
