import { useEffect, useMemo, useRef, useState, useCallback, memo } from 'react';
import { Circle, Group, Image, Layer, Line, Rect, Stage, Text, Transformer } from 'react-konva';
import { motion, useMotionValue, useSpring } from 'framer-motion';
import { useCanvasImage } from '../hooks/useCanvasImage';
import { useConfiguratorStore } from '../store/useConfiguratorStore';
import { cardSizes, SAFETY_MARGIN } from '../data/cardConfig';
import { getPatternById } from '../data/strapPatterns';
import {
  getElementBoundsPx,
  getLanyardStageGeometry,
  getStageStrapWidthPx,
  getStrapLengthInches,
  mapEditorElementToStrap,
  STRAP_EDITOR_HEIGHT_PX,
  STRAP_EDITOR_WIDTH_PX,
} from '../lib/strapArtwork';
import StrapPatternRenderer from './StrapPatternRenderer';
import IdCardPreview from './IdCardPreview';
import { CrocodileClip, MetalCrimp, PlasticHook, SideReleaseBuckle, SkiReel, SwivelHook, CardHolder } from './hardware/LanyardHardware';
import { Move3D, Rotate3d } from 'lucide-react';

function useArtworkImages(elements) {
  const [images, setImages] = useState({});

  useEffect(() => {
    let cancelled = false;
    const imageElements = (elements || []).filter((element) => element.type === 'image' && element.src);

    if (!imageElements.length) {
      setImages({});
      return undefined;
    }

    Promise.all(
      imageElements.map(
        (element) =>
          new Promise((resolve) => {
            const nextImage = new window.Image();
            nextImage.crossOrigin = 'anonymous';
            nextImage.onload = () => resolve([element.id, nextImage]);
            nextImage.onerror = () => resolve([element.id, null]);
            nextImage.src = element.src;
          }),
      ),
    ).then((entries) => {
      if (cancelled) return;
      setImages(Object.fromEntries(entries.filter(([, image]) => image)));
    });

    return () => {
      cancelled = true;
    };
  }, [elements]);

  return images;
}

function buildStrapClipPoints(x1, y1, x2, y2, strapW, padding = 2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const distance = Math.hypot(dx, dy) || 1;
  const tangentX = dx / distance;
  const tangentY = dy / distance;
  const normalX = -tangentY;
  const normalY = tangentX;
  const halfWidth = (strapW / 2) + padding;

  return [
    x1 - (tangentX * padding) + (normalX * halfWidth),
    y1 - (tangentY * padding) + (normalY * halfWidth),
    x2 + (tangentX * padding) + (normalX * halfWidth),
    y2 + (tangentY * padding) + (normalY * halfWidth),
    x2 + (tangentX * padding) - (normalX * halfWidth),
    y2 + (tangentY * padding) - (normalY * halfWidth),
    x1 - (tangentX * padding) - (normalX * halfWidth),
    y1 - (tangentY * padding) - (normalY * halfWidth),
  ];
}

function clipPolygon(ctx, points) {
  if (!points?.length) return;
  ctx.beginPath();
  ctx.moveTo(points[0], points[1]);
  for (let index = 2; index < points.length; index += 2) {
    ctx.lineTo(points[index], points[index + 1]);
  }
  ctx.closePath();
}

function CustomElements3D({ elements, strapW, x1, y1, x2, y2, showValidation = true, width, clipType, textDirection, isRightStrap, dualCanvasMode }) {
  const images = useArtworkImages(elements);
  const strapClipPoints = buildStrapClipPoints(0, 0, x2 - x1, y2 - y1, strapW, 1.5);
  
  if (!elements || elements.length === 0) return null;

  return (
    <Group x={x1} y={y1} clipFunc={(ctx) => clipPolygon(ctx, strapClipPoints)}>
      {elements.map((element) => {
        const mapped = mapEditorElementToStrap(
          element,
          { x1, y1, x2, y2, strapW },
          { width, clipType, textDirection, isRightStrap, dualCanvasMode },
        );
        // Use element.width for text elements instead of computed bounds
        const bounds = element.type === 'text' && element.width 
          ? { width: element.width, height: element.fontSize || 16 }
          : getElementBoundsPx(element);
        const image = element.type === 'image' ? images[element.id] : null;
        const warningLabel = mapped.warnings[0]?.label;
        const clipWidth = Math.max(mapped.clipRectPx.width, 0);
        const clipHeight = Math.max(mapped.clipRectPx.height, 0);

        // Don't skip rendering if image is loading - show placeholder
        if (mapped.isOutOfPrintBounds) return null;
        if (element.type !== 'image' && (clipWidth === 0 || clipHeight === 0)) return null;

        return (
          <Group
            key={element.id}
            x={mapped.x - x1}
            y={mapped.y - y1}
            rotation={mapped.angle + (element.rotation || 0)}
            scaleX={mapped.surfaceScale}
            scaleY={mapped.surfaceScale}
            opacity={(element.opacity ?? 1) * (1 - (mapped.hiddenAreaRatio * 0.35))}
          >
            <Group
                      clipX={mapped.clipRectPx.x}
                      clipY={mapped.clipRectPx.y}
                      clipWidth={mapped.clipRectPx.width}
                      clipHeight={mapped.clipRectPx.height}
                    >
              {element.type === 'text' ? (
                <Text
                  text={element.content}
                  width={bounds.width}
                  fontSize={element.fontSize || 16}
                  fontFamily={element.fontFamily || 'Montserrat'}
                  fill={element.fill || '#ffffff'}
                  opacity={element.opacity ?? 1}
                  fontStyle={element.fontStyle || 'bold'}
                  lineHeight={element.lineHeight || 1.2}
                  letterSpacing={element.letterSpacing || 0}
                  align={element.align || 'center'}
                  offsetX={bounds.width / 2}
                  offsetY={bounds.height / 2}
                />
              ) : image ? (
                <Image
                  image={image}
                  width={element.width}
                  height={element.height}
                  opacity={element.opacity ?? 1}
                  offsetX={element.width / 2}
                  offsetY={element.height / 2}
                  crop={{
                    x: element.cropX || 0,
                    y: element.cropY || 0,
                    width: element.cropWidth || element.sourceWidth || image.width || element.width,
                    height: element.cropHeight || element.sourceHeight || image.height || element.height,
                  }}
                />
              ) : element.type === 'image' ? (
                <Rect
                  width={element.width || 40}
                  height={element.height || 40}
                  fill="rgba(200, 200, 200, 0.3)"
                  stroke="#cccccc"
                  strokeWidth={1}
                  cornerRadius={4}
                  offsetX={(element.width || 40) / 2}
                  offsetY={(element.height || 40) / 2}
                />
              ) : (
                <Rect
                  width={element.width || 40}
                  height={element.height || 40}
                  fill="#ffffff"
                  stroke={mapped.warnings.length ? '#ef4444' : '#cccccc'}
                  strokeWidth={1}
                  cornerRadius={4}
                  offsetX={(element.width || 40) / 2}
                  offsetY={(element.height || 40) / 2}
                />
              )}
            </Group>
            {showValidation && warningLabel ? (
              <Group y={-(bounds.height / 2) - 18}>
                <Rect
                  width={82}
                  height={18}
                  fill={mapped.isObscured ? '#ef4444' : '#f59e0b'}
                  cornerRadius={6}
                  offsetX={41}
                />
                <Text
                  text={warningLabel}
                  fontSize={8}
                  fill="#ffffff"
                  fontStyle="bold"
                  width={82}
                  align="center"
                  offsetX={41}
                  y={4.5}
                />
              </Group>
            ) : null}
          </Group>
        );
      })}
    </Group>
  );
}

// ─── Canvas constants ──────────────────────────────────────────────────────────
const BASE_WIDTH  = 820;
const BASE_HEIGHT = 840;

// ─── Responsive container width ───────────────────────────────────────────────
function useContainerWidth() {
  const ref = useRef(null);
  const [width, setWidth] = useState(BASE_WIDTH);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setWidth(e.contentRect.width || BASE_WIDTH));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, width];
}

// ─── Color helpers ────────────────────────────────────────────────────────────
function shadeHex(hex, pct) {
  const c = (hex || '#888').replace('#', '');
  if (c.length !== 6) return hex || '#888';
  const n = parseInt(c, 16);
  const r = Math.min(255, Math.max(0, (n >> 16) + pct));
  const g = Math.min(255, Math.max(0, ((n >> 8) & 0xff) + pct));
  const b = Math.min(255, Math.max(0, (n & 0xff) + pct));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}
function isGrad(c) { return typeof c === 'string' && c.includes('gradient'); }
function baseColor(color) {
  if (isGrad(color)) { const m = color.match(/#[a-fA-F0-9]{6}/g); return m ? m[0] : '#888'; }
  return color || '#888';
}
function gradFill(color, p1, p2) {
  if (!isGrad(color)) return { fill: color };
  const cols = color.match(/#[a-fA-F0-9]{6}/g);
  if (cols && cols.length >= 2)
    return {
      fill: undefined,
      fillLinearGradientStartPoint: p1,
      fillLinearGradientEndPoint: p2,
      fillLinearGradientColorStops: [0, cols[0], 1, cols[1]],
    };
  return { fill: color };
}

// ─── Per-edge inset stitching segments ────────────────────────────────────────
const clampRotation = (value, min, max) => Math.min(Math.max(value, min), max);

function edgeStitchSegs(pts, d, minLen) {
  const n   = pts.length / 2;
  const out = [];
  for (let i = 0; i < n; i++) {
    const j  = (i + 1) % n;
    const x0 = pts[i * 2], y0 = pts[i * 2 + 1];
    const x1 = pts[j * 2], y1 = pts[j * 2 + 1];
    const dx = x1 - x0,    dy = y1 - y0;
    const len = Math.hypot(dx, dy);
    if (!len || len < minLen) continue;
    const nx = (-dy / len) * d;
    const ny = ( dx / len) * d;
    out.push([x0 + nx, y0 + ny, x1 + nx, y1 + ny]);
  }
  return out;
}

// ─── Strap with professional fabric edges + stitching ─────────────────────────
function ProStrap({ points, color, strapW, pattern, patternOpacity, isSelected, onClick }) {
  const bc       = baseColor(color);
  const hiColor  = shadeHex(bc,  50);
  const shColor  = shadeHex(bc, -60);
  const fillProp = gradFill(color, { x: points[0], y: 0 }, { x: points[2], y: 0 });
  const stitchD  = Math.min(2.8, strapW * 0.08);
  const segs = edgeStitchSegs(points, stitchD, strapW * 1.4);

  return (
    <Group onClick={onClick} cursor="pointer">
      <Line points={points} closed stroke={isSelected ? '#5d5fef' : shColor} strokeWidth={isSelected ? 2 : 0.9} lineJoin="miter" {...fillProp} />
      <StrapPatternRenderer clipPoints={points} pattern={pattern} strapW={strapW} opacity={patternOpacity} />
      <Line points={points} closed stroke="transparent" strokeWidth={0} listening={false}
        fillLinearGradientStartPoint={{ x: points[0], y: 0 }}
        fillLinearGradientEndPoint={{ x: points[0], y: strapW }}
        fillLinearGradientColorStops={[0,'rgba(255,255,255,0.20)',0.4,'rgba(255,255,255,0.05)',0.6,'rgba(0,0,0,0)',1,'rgba(0,0,0,0.12)']}
      />
      <Line points={points} closed stroke={isSelected ? '#5d5fef' : hiColor} strokeWidth={isSelected ? 3 : 2} opacity={isSelected ? 0.5 : 0.18} fill="transparent" listening={false} />
      {segs.map((seg, i) => (
        <Line key={i} points={seg} stroke="rgba(255,255,255,0.55)" strokeWidth={0.9} dash={[4, 3]} lineCap="round" listening={false} />
      ))}
    </Group>
  );
}

// ─── Realistic folded corner ──────────────────────────────────────────────────
function CornerFold({ side, ox, oy, strapW, color }) {
  const bc = baseColor(color);
  const foldCol  = shadeHex(bc, -70);
  if (side === 'left') {
    const ax = ox, bx = ox + strapW, cx = ox, dx = ox + strapW;
    const ay = oy, by = oy, cy = oy + strapW, dy = oy + strapW;
    return (
      <Group>
        <Line points={[ax, ay, bx, by, cx, cy]} closed fill="#ffffff" stroke="transparent" />
        <Line points={[bx, by, dx, dy, cx, cy]} closed fill={foldCol} stroke="transparent" />
        <Line points={[bx, by, cx, cy]} stroke="rgba(0,0,0,0.40)" strokeWidth={1.4} lineCap="round" />
        <Line points={[bx + 0.6, by + 0.6, cx + 0.6, cy - 0.6]} stroke="rgba(255,255,255,0.25)" strokeWidth={0.7} lineCap="round" />
      </Group>
    );
  }
  const ax = ox, bx = ox - strapW, cx = ox, dx = ox - strapW;
  const ay = oy, by = oy, cy = oy + strapW, dy = oy + strapW;
  return (
    <Group>
      <Line points={[ax, ay, bx, by, cx, cy]} closed fill="#ffffff" stroke="transparent" />
      <Line points={[bx, by, cx, cy, dx, dy]} closed fill={foldCol} stroke="transparent" />
      <Line points={[bx, by, cx, cy]} stroke="rgba(0,0,0,0.40)" strokeWidth={1.4} lineCap="round" />
      <Line points={[bx - 0.6, by + 0.6, cx - 0.6, cy - 0.6]} stroke="rgba(255,255,255,0.25)" strokeWidth={0.7} lineCap="round" />
    </Group>
  );
}

// ─── Static Logo placed near the clip ──────────────────────────────────────────
function StaticLogo({ cx, cy, angle, logo, strapW, logoScale, logoOffset, logoYOffset, logoRotation, onRemove, onDrag, showControls }) {
  if (!logo) return null;
  const imgRatio = logo.width / logo.height;
  const scale = logoScale || 1;
  const targetH = strapW * 0.8 * scale;
  const targetW = targetH * imgRatio;

  return (
    <Group 
      x={cx} y={cy} rotation={angle}
      draggable={showControls}
                  onDragEnd={(e) => {
        onDrag(e.target.x() - cx, e.target.y() - cy, 'center');
      }}
      onTransformEnd={(e) => {
        const node = e.target;
        const scaleX = node.scaleX();
        const rotation = node.rotation();
        onDrag(node.x() - cx, node.y() - cy, 'center', scaleX, rotation);
        node.scaleX(1);
        node.scaleY(1);
      }}
      onMouseEnter={(e) => { if (showControls) e.target.getStage().container().style.cursor = 'grab'; }}
      onMouseLeave={(e) => { e.target.getStage().container().style.cursor = 'default'; }}
    >
      <Image 
        image={logo} 
        x={(logoOffset || 0)} y={(logoYOffset || 0)}
        width={targetW} height={targetH}
        offsetX={targetW / 2} offsetY={targetH / 2}
        rotation={logoRotation || 0}
      />
      {showControls && (
        <Group x={logoOffset + targetW/2 + 10} y={-targetH/2}>
          <Circle radius={7} fill="#ef4444" onClick={onRemove} cursor="pointer" />
          <Text text="✕" x={-3.5} y={-4} fontSize={8} fill="#fff" fontStyle="bold" listening={false} />
        </Group>
      )}
    </Group>
  );
}

// ─── Hardware Components (Enhanced Realism) ──────────────────────────────────

// ─── Production proof panel ──────────────────────────────────────────────────
function FlatStrap({ x, y, w, h, color, pattern, patternOpacity, children }) {
  const bc = baseColor(color);
  const sh = shadeHex(bc, -55);
  const isHorizontal = w > h;
  return (
    <Group x={x} y={y}>
      <Rect 
        width={w} 
        height={h} 
        stroke={sh} 
        strokeWidth={0.8} 
        {...gradFill(color, { x: 0, y: 0 }, isHorizontal ? { x: 0, y: h } : { x: w, y: 0 })} 
      />
      <StrapPatternRenderer clipPoints={[0,0,w,0,w,h,0,h]} pattern={pattern} strapW={isHorizontal ? h : w} opacity={patternOpacity} />
      {children}
    </Group>
  );
}

function DimLine({ x1, y1, x2, y2, label }) {
  const isVert = x1 === x2;
  return (
    <Group opacity={0.55}>
      <Line points={[x1, y1, x2, y2]} stroke="#888" strokeWidth={0.8} dash={[4, 4]} />
      {isVert ? (<><Line points={[x1-5, y1, x1+5, y1]} stroke="#888" strokeWidth={0.8} /><Line points={[x1-5, y2, x1+5, y2]} stroke="#888" strokeWidth={0.8} /><Text text={label} x={x1-58} y={(y1+y2)/2 - 6} fontSize={10} fill="#666" align="right" width={50} wrap="none" /></>) : (<><Line points={[x1, y1-5, x1, y1+5]} stroke="#888" strokeWidth={0.8} /><Line points={[x2, y1-5, x2, y1+5]} stroke="#888" strokeWidth={0.8} /><Text text={label} x={(x1+x2)/2 - 25} y={y1-16} fontSize={10} fill="#666" align="center" width={50} wrap="none" /></>)}
    </Group>
  );
}

// ─── INDEPENDENT Content with Independent Drills ──────────────────────────
function UnifiedStrapContent({
  x1,
  y1,
  x2,
  y2,
  design,
  logoImg,
  strapW,
  forceNoLogo,
  forceNoText,
  onUpdateText,
  onUpdateLogo,
  onRemoveText,
  onRemoveLogo,
  showControls,
  zone,
  items = [],
}) {
  const {
    lanyardDesignStyle,
    fontColor,
    fontFamily,
    fontSize,
    fontWeight,
    lineHeight,
    textAlign,
    logoScale,
    logoRotation,
    logoOffset,
    copyMode,
  } = design;

  const dx = x2 - x1, dy = y2 - y1;
  const localClipPoints = buildStrapClipPoints(0, 0, dx, dy, strapW, 1.5);
  const dist = Math.hypot(dx, dy);
  const angle = Math.atan2(dy, Math.abs(dx)) * (180 / Math.PI);

  const tx = dx / dist;
  const ty = dy / dist;
  let nx = ty;
  let ny = -tx;
  if (zone === 'center') {
    ny = tx;
  }

  const editorAlongScale = Math.max(dist / STRAP_EDITOR_WIDTH_PX, 0.001);
  const editorCrossScale = Math.max(strapW / STRAP_EDITOR_HEIGHT_PX, 0.001);

  return (
    <Group x={x1} y={y1} clipFunc={(ctx) => clipPolygon(ctx, localClipPoints)}>
      {items.map((item, idx) => {
        let px = dx * item.t, py = dy * item.t;
        if (item.t < -0.1 || item.t > 1.1) return null;

        const block = item.block || {};

        if (item.type === 'text') {
          const mainText = forceNoText ? '' : (block.text || '');
          const subText = lanyardDesignStyle === 'stacked-text' ? (block.textLine2 || '') : null;
          const hasSubText = subText && lanyardDesignStyle === 'stacked-text';
          
          const fs = block.fontSize || fontSize || 16;
          const lines = [mainText, subText].filter(Boolean);
          const maxLen = lines.length > 0 ? Math.max(...lines.map(l => l.length || 0)) : 0;
          const textW = maxLen * fs * 1.1;
          const subTextFs = fs * 0.55;
          const totalHeight = hasSubText ? fs + subTextFs : fs;

          const rawTextOffset = block.textOffset || 0;
          const rawTextYOffset = block.textYOffset || 0;
          const pxOff = (rawTextOffset * editorAlongScale) * tx + (rawTextYOffset * editorCrossScale) * nx;
          const pyOff = (rawTextOffset * editorAlongScale) * ty + (rawTextYOffset * editorCrossScale) * ny;

          const finalX = px + pxOff;
          const finalY = py + pyOff;

          return (
            <Group
              key={`${item.type}-${item.id || idx}`}
              x={finalX}
              y={finalY}
              rotation={angle}
              scaleX={editorAlongScale}
              scaleY={editorCrossScale}
              draggable={showControls}
              onDragEnd={(e) => {
                const node = e.target;
                onUpdateText(block.id, (node.x() - px) / editorAlongScale, (node.y() - py) / editorCrossScale);
              }}
              onTransformEnd={(e) => {
                const node = e.target;
                const scaleX = node.scaleX() / editorAlongScale;
                const rotation = node.rotation();
                onUpdateText(block.id, (node.x() - px) / editorAlongScale, (node.y() - py) / editorCrossScale, scaleX, rotation);
                node.scaleX(editorAlongScale);
                node.scaleY(editorCrossScale);
              }}
              onMouseEnter={(e) => {
                if (showControls) e.target.getStage().container().style.cursor = 'grab';
              }}
              onMouseLeave={(e) => {
                e.target.getStage().container().style.cursor = 'default';
              }}
            >
              <Text
                text={mainText}
                fontSize={fs}
                fontFamily={block.fontFamily || fontFamily || 'Montserrat'}
                fontStyle={block.fontWeight || fontWeight || 'bold'}
                lineHeight={block.lineHeight || lineHeight || 1.2}
                fill={block.textColor || fontColor || '#000000'}
                align={block.textAlign || textAlign || 'center'}
                wrap="none"
                width={textW}
                offsetX={textW / 2}
                y={hasSubText ? -totalHeight / 2 + fs / 2 : 0}
                offsetY={fs / 2}
              />
              {hasSubText && (
                <Text
                  text={subText}
                  fontSize={subTextFs}
                  fontFamily={block.fontFamily || fontFamily || 'Montserrat'}
                  fill={block.textColor || fontColor || '#000000'}
                  opacity={0.8}
                  align={block.textAlign || textAlign || 'center'}
                  wrap="none"
                  width={textW}
                  x={0}
                  y={totalHeight / 2 - subTextFs / 2}
                  offsetX={textW / 2}
                  offsetY={subTextFs / 2}
                />
              )}
              {showControls && item.i === 0 && (
                <Group x={textW / 2 + 8} y={-fs / 2}>
                  <Circle radius={6} fill="#ef4444" onClick={() => onRemoveText(block.id)} cursor="pointer" />
                  <Text
                    text="✕"
                    x={-3}
                    y={-3.5}
                    fontSize={7}
                    fill="#fff"
                    fontStyle="bold"
                    listening={false}
                  />
                </Group>
              )}
            </Group>
          );
        }

        // Logo type
        const rawLogoOffset = copyMode === 'synchronized' ? (logoOffset || 0) : (zone === 'left' ? (design.logoOffsetLeft || 0) : (zone === 'right' ? (design.logoOffsetRight || 0) : (design.logoOffsetCenter || 0)));
        const rawLogoYOffset = copyMode === 'synchronized' ? (design.logoYOffset || 0) : (zone === 'left' ? (design.logoYOffsetLeft || 0) : (zone === 'right' ? (design.logoYOffsetRight || 0) : (design.logoYOffsetCenter || 0)));
        const lpxOff = (rawLogoOffset * editorAlongScale) * tx + (rawLogoYOffset * editorCrossScale) * nx;
        const lpyOff = (rawLogoOffset * editorAlongScale) * ty + (rawLogoYOffset * editorCrossScale) * ny;

        const baseLogoX = px;
        const baseLogoY = py;
        const lFinalX = px + lpxOff;
        const lFinalY = py + lpyOff;

        if (!logoImg || forceNoLogo) return null;

        const lgH = 70 * 0.8 * logoScale;
        const lgW = lgH * (logoImg.width / logoImg.height);

        return (
          <Group
            key={`${item.type}-${item.id || idx}`}
            x={lFinalX}
            y={lFinalY}
            rotation={angle}
            scaleX={editorAlongScale}
            scaleY={editorCrossScale}
            draggable={showControls}
            onDragEnd={(e) => {
              const node = e.target;
              onUpdateLogo((node.x() - baseLogoX) / editorAlongScale, (node.y() - baseLogoY) / editorCrossScale, zone);
            }}
            onTransformEnd={(e) => {
              const node = e.target;
              const scaleX = node.scaleX() / editorAlongScale;
              const rotation = node.rotation();
              onUpdateLogo((node.x() - baseLogoX) / editorAlongScale, (node.y() - baseLogoY) / editorCrossScale, zone, scaleX, rotation);
              node.scaleX(editorAlongScale);
              node.scaleY(editorCrossScale);
            }}
            onMouseEnter={(e) => {
              if (showControls) e.target.getStage().container().style.cursor = 'grab';
            }}
            onMouseLeave={(e) => {
              e.target.getStage().container().style.cursor = 'default';
            }}
          >
            <Image
              image={logoImg}
              width={lgW}
              height={lgH}
              offsetY={lgH / 2}
              offsetX={lgW / 2}
              rotation={logoRotation || 0}
            />
            {showControls && item.i === 0 && (
              <Group x={lgW / 2 + 8} y={-lgH / 2}>
                <Circle radius={6} fill="#ef4444" onClick={() => onRemoveLogo(zone)} cursor="pointer" />
                <Text text="✕" x={-3} y={-3.5} fontSize={7} fill="#fff" fontStyle="bold" listening={false} />
              </Group>
            )}
          </Group>
        );
      })}
    </Group>
  );
}

const getClipHeight = (clipType) => {
  switch (clipType) {
    case 'Plastic Hook': return 105;
    case 'Crocodile Clip': return 64;
    case 'Ski Reel': return 108;
    default: return 98; // Swivel Hook
  }
};

function getSingleLanyardGeometry(CX, width, length) {
  const strapW = getStageStrapWidthPx(width);
  const lengthInches = getStrapLengthInches(length);
  const LOOP_H = Math.round((lengthInches / 38) * 450);
  const TOP_Y = 50;
  const SPREAD = 135;
  const TIP_Y = TOP_Y + LOOP_H;
  const CRIMP_Y = TIP_Y - 50;
  const CRIMP_H = 32;

  return {
    strapW,
    CX,
    TOP_Y,
    LOOP_H,
    SPREAD,
    TIP_Y,
    CRIMP_Y,
    CRIMP_H,
    barPts: [
      CX - SPREAD, TOP_Y,
      CX + SPREAD, TOP_Y,
      CX + SPREAD, TOP_Y + strapW,
      CX - SPREAD, TOP_Y + strapW,
    ],
    leftStrap: [
      CX - SPREAD, TOP_Y + strapW,
      CX - SPREAD + strapW, TOP_Y + strapW,
      CX + strapW / 2, CRIMP_Y,
      CX - strapW / 2, CRIMP_Y,
    ],
    rightStrap: [
      CX + SPREAD, TOP_Y + strapW,
      CX + strapW / 2, CRIMP_Y,
      CX - strapW / 2, CRIMP_Y,
      CX + SPREAD - strapW, TOP_Y + strapW,
    ],
    connectorPts: [
      CX - strapW / 2, CRIMP_Y + CRIMP_H - 2,
      CX + strapW / 2, CRIMP_Y + CRIMP_H - 2,
      CX + strapW / 2, TIP_Y,
      CX - strapW / 2, TIP_Y,
    ],
    leftCL: {
      x1: CX - SPREAD + strapW / 2,
      y1: TOP_Y + strapW + 20,
      x2: CX,
      y2: CRIMP_Y - 20,
    },
    rightCL: {
      x1: CX + SPREAD - strapW / 2,
      y1: TOP_Y + strapW + 20,
      x2: CX,
      y2: CRIMP_Y - 20,
    },
  };
}

const STAGE_2D_WIDTH = 900;
const STAGE_2D_HEIGHT = 820;

function LanyardStage({
  zoom = 1,
  stageRef,
  currentStep,
  showIdCard = false,
  onEditStrap,
  tempDesign,
  onZoneSelect,
  alwaysShowControls = false,
  externalSelectedZone,
}) {
  const showControls = alwaysShowControls || currentStep === 2;
  const storeDesign = useConfiguratorStore((s) => s.design);
  const livePreviewPatch = useConfiguratorStore((s) => s.livePreviewPatch);
  const design = useMemo(() => {
    const withLivePreview = livePreviewPatch ? { ...storeDesign, ...livePreviewPatch } : storeDesign;
    return tempDesign ? { ...withLivePreview, ...tempDesign } : withLivePreview;
  }, [livePreviewPatch, storeDesign, tempDesign]);
  const setField = useConfiguratorStore((s) => s.setField);
  const [containerRef, containerWidth] = useContainerWidth();
  const logoImg = useCanvasImage(design.logoUrl);
  const strapColor = design.lanyardColor || '#cc1111';
  const activePattern = getPatternById(design.strapPattern);
  const patternOpacity = design.strapPatternOpacity ?? 0.85;
  const [selectedZone, setSelectedZone] = useState('center');
  const activeSelectedZone = externalSelectedZone !== undefined ? externalSelectedZone : selectedZone;
  const handleZoneSelect = (zone) => {
    setSelectedZone(zone);
    onZoneSelect?.(zone);
  };
  const reviewCardMetrics = useMemo(() => {
    const size = cardSizes[design.idCard.size] || cardSizes['86x54'];
    const reviewWidth = Math.max(72, size.width - (SAFETY_MARGIN * 2));
    const reviewHeight = Math.max(96, size.height - (SAFETY_MARGIN * 2));

    return {
      width: reviewWidth,
      height: reviewHeight,
      scale: Math.min(0.72, 108 / reviewWidth),
      isHorizontal: reviewWidth > reviewHeight,
    };
  }, [design.idCard.size]);

  const scale = Math.max(0.35, (Math.min(containerWidth - 32, STAGE_2D_WIDTH) / STAGE_2D_WIDTH) * zoom);
  
  // Left lanyard (Front View) & Right lanyard (Back View) geometry
  const geomFront = useMemo(() => getSingleLanyardGeometry(250, design.width, design.length), [design.width, design.length]);
  const geomBack = useMemo(() => getSingleLanyardGeometry(650, design.width, design.length), [design.width, design.length]);
  
  const textBlocks = useMemo(() => {
    const list = design.textBlocks || [];
    if (list.length > 0) return list;
    const legacy = [design.text || '', design.textLine2 || '', design.textLine3 || ''].filter(Boolean);
    const hasLegacy = legacy.length > 0;
    return [{
      id: 'block-1',
      text: hasLegacy ? (design.text || '') : 'COMPANY NAME',
      textLine2: design.textLine2 || '',
      textLine3: design.textLine3 || '',
      textOffset: design.textOffset || 0,
      textYOffset: design.textYOffset || 0,
      textColor: design.textColor || '#000000',
      fontSize: design.fontSize || 16,
      letterSpacing: design.letterSpacing || 0,
      textStrokeWidth: design.textStrokeWidth || 0,
      textStrokeColor: design.textStrokeColor || '#000000',
      textShadowBlur: design.textShadowBlur || 0,
      fontFamily: design.fontFamily || 'Montserrat',
      fontWeight: design.fontWeight || 'bold',
    }];
  }, [design.textBlocks, design.text, design.textLine2, design.textLine3, design.textOffset, design.textYOffset, design.textColor, design.fontSize, design.letterSpacing, design.textStrokeWidth, design.textStrokeColor, design.textShadowBlur, design.fontFamily, design.fontWeight]);

  const getVirtualItemsForZone = useCallback((zone, isBackView = false) => {
    let zoneText = '';
    if (!isBackView) {
      if (zone === 'left') zoneText = design.customTextLeft || design.text || 'RAVENCLAW';
      else if (zone === 'right') zoneText = design.customTextRight || design.text || 'UNIVERSITY';
      else zoneText = design.customTextCenter || 'STAFF / VIP';
    } else {
      if (zone === 'left') zoneText = design.customTextRight || design.text || 'UNIVERSITY';
      else if (zone === 'right') zoneText = design.customTextLeft || design.text || 'RAVENCLAW';
      else zoneText = design.customTextCenter || '';
    }

    const items = [];

    if (zoneText) {
      const fs = design.fontSize || 16;
      const textW = zoneText.length * fs * 1.1;
      const lgW = (logoImg && !isBackView) ? (70 * 0.8 * (logoImg.width / logoImg.height) * (design.logoScale || 1)) : 0;
      const gap = Math.max(30, (design.textSpacing || 60) * 2 + textW + lgW);
      const count = Math.max(1, Math.floor(700 / gap));

      for (let i = 0; i < count; i++) {
        const baseDistance = (700 / (count + 1)) * (i + 1);
        let dText = baseDistance + (design.textOffset || 0);
        dText = (dText % 700 + 700) % 700;

        items.push({
          id: `${zone}-${isBackView ? 'back' : 'front'}-${i}-text`,
          block: {
            text: zoneText,
            fontSize: fs,
            fontFamily: design.fontFamily || 'Montserrat',
            fontWeight: design.fontWeight || 'bold',
            textColor: design.textColor || design.fontColor || '#000000',
          },
          type: 'text',
          t: dText / 700,
          i,
          textW,
          fs,
        });

        if (logoImg && !design.forceNoLogo && !isBackView) {
          let dLogo = dText + (textW + 15);
          dLogo = (dLogo % 700 + 700) % 700;
          items.push({
            id: `${zone}-${isBackView ? 'back' : 'front'}-${i}-logo`,
            block: { text: '' },
            type: 'logo',
            t: dLogo / 700,
            i,
            textW,
            fs,
          });
        }
      }
    }

    if (isBackView && zone === 'center' && logoImg && !design.forceNoLogo) {
      items.push({
        id: `back-center-logo`,
        block: { text: '' },
        type: 'logo',
        t: 0.5,
        i: 0,
        textW: 0,
        fs: design.fontSize || 16,
      });
    }

    return items;
  }, [design.customTextLeft, design.customTextRight, design.customTextCenter, design.text, design.fontSize, design.fontFamily, design.fontWeight, design.textColor, design.fontColor, design.textSpacing, design.textOffset, design.logoScale, design.forceNoLogo, logoImg]);

  const onUpdateTextBlockText = (blockId, dX, dY, scale, rotation) => {
    const updated = textBlocks.map(b => {
      if (b.id === blockId) {
        return {
          ...b,
          textOffset: dX,
          textYOffset: dY,
          fontSize: b.fontSize * (scale || 1),
        };
      }
      return b;
    });
    setField('textBlocks', updated);
    
    if (blockId === 'block-1') {
      setField('textOffset', dX);
      setField('textYOffset', dY);
      setField('fontSize', design.fontSize * (scale || 1));
    }
  };

  const onRemoveTextBlock = (blockId) => {
    if (textBlocks.length <= 1) {
      const updated = [{ ...textBlocks[0], text: '' }];
      setField('textBlocks', updated);
      setField('text', '');
      return;
    }
    const updated = textBlocks.filter(b => b.id !== blockId);
    setField('textBlocks', updated);
    if (blockId === 'block-1') {
      setField('text', updated[0]?.text || '');
    }
  };

  const onUpdateLogo = (dX, dY, zone, scale, rotation) => {
    if (design.copyMode === 'synchronized') {
      setField('logoOffset', dX);
      setField('logoYOffset', dY);
    } else {
      const alongFieldByZone = { left: 'logoOffsetLeft', center: 'logoOffsetCenter', right: 'logoOffsetRight' };
      const perpFieldByZone = { left: 'logoYOffsetLeft', center: 'logoYOffsetCenter', right: 'logoYOffsetRight' };
      setField(alongFieldByZone[zone] || 'logoOffsetCenter', dX);
      setField(perpFieldByZone[zone] || 'logoYOffsetCenter', dY);
    }
    setField('logoScale', design.logoScale * (scale || 1));
    setField('logoRotation', (design.logoRotation || 0) + (rotation || 0));
  };

  const onRemoveLogo = () => {
    setField('logoUrl', '');
  };

  const [selectedShape, setSelectedShape] = useState(null);
  const trRef = useRef();
  const layerRef = useRef();

  useEffect(() => {
    if (trRef.current) {
      const transformer = trRef.current;
      transformer.nodes(selectedShape ? [selectedShape] : []);
      const layer = transformer.getLayer();
      if (layer) layer.batchDraw();
    }
  }, [selectedShape]);

  const onSelect = (e) => {
    if (e.target === e.target.getStage()) {
      setSelectedShape(null);
      return;
    }
    if (e.target.attrs.draggable) {
      setSelectedShape(e.target);
    } else {
      setSelectedShape(null);
    }
  };

  const renderSingleLanyard = (geom, isBackView = false) => {
    const { strapW, CX, TOP_Y, SPREAD, TIP_Y, CRIMP_Y, barPts, leftStrap, rightStrap, connectorPts, leftCL, rightCL } = geom;

    const leftItems = getVirtualItemsForZone('left', isBackView);
    const rightItems = getVirtualItemsForZone('right', isBackView);
    const centerItems = getVirtualItemsForZone('center', isBackView);

    return (
      <Group key={isBackView ? 'back-lanyard' : 'front-lanyard'}>
        {/* Layer 1: Under-strap (Left on Front, Right on Back) */}
        {!isBackView ? (
          <>
            <ProStrap 
              points={leftStrap} 
              color={strapColor} 
              strapW={strapW} 
              pattern={activePattern} 
              patternOpacity={patternOpacity} 
              isSelected={activeSelectedZone === 'left'}
              onClick={() => handleZoneSelect('left')}
            />
            <UnifiedStrapContent 
              {...leftCL} 
              design={design} 
              items={leftItems} 
              logoImg={logoImg} 
              strapW={strapW} 
              onUpdateText={onUpdateTextBlockText} 
              onUpdateLogo={onUpdateLogo} 
              onRemoveText={onRemoveTextBlock} 
              onRemoveLogo={onRemoveLogo} 
              showControls={showControls} 
              zone="left" 
            />
            <CustomElements3D elements={design.strapElements?.left} strapW={strapW} {...leftCL} width={design.width} clipType={design.clipType} textDirection={design.textDirection} />
          </>
        ) : (
          <>
            <ProStrap 
              points={rightStrap} 
              color={strapColor} 
              strapW={strapW} 
              pattern={activePattern} 
              patternOpacity={patternOpacity} 
              isSelected={false}
            />
            <UnifiedStrapContent 
              {...rightCL} 
              design={design} 
              items={rightItems} 
              logoImg={logoImg} 
              strapW={strapW} 
              onUpdateText={onUpdateTextBlockText} 
              onUpdateLogo={onUpdateLogo} 
              onRemoveText={onRemoveTextBlock} 
              onRemoveLogo={onRemoveLogo} 
              showControls={false} 
              zone="right" 
            />
            <CustomElements3D elements={design.strapElements?.right} strapW={strapW} {...rightCL} width={design.width} clipType={design.clipType} textDirection={design.textDirection} isRightStrap={true} dualCanvasMode={design.dualCanvasMode} />
          </>
        )}

        {/* Top/Center Neck Strap */}
        <ProStrap 
          points={barPts} 
          color={strapColor} 
          strapW={strapW} 
          pattern={activePattern} 
          patternOpacity={patternOpacity} 
          isSelected={activeSelectedZone === 'center' && !isBackView}
          onClick={() => !isBackView && handleZoneSelect('center')}
        />
        <UnifiedStrapContent 
          x1={CX - SPREAD + 10} 
          y1={TOP_Y + strapW/2} 
          x2={CX + SPREAD - 10} 
          y2={TOP_Y + strapW/2} 
          design={design} 
          items={centerItems} 
          logoImg={logoImg} 
          strapW={strapW} 
          onUpdateText={onUpdateTextBlockText} 
          onUpdateLogo={onUpdateLogo} 
          onRemoveText={onRemoveTextBlock} 
          onRemoveLogo={onRemoveLogo} 
          showControls={showControls && !isBackView} 
          zone="center" 
        />
        <CustomElements3D elements={design.strapElements?.center} strapW={strapW} x1={CX - SPREAD + 10} y1={TOP_Y + strapW/2} x2={CX + SPREAD - 10} y2={TOP_Y + strapW/2} width={design.width} clipType={design.clipType} textDirection={design.textDirection} />

        {/* Layer 2: Over-strap (Right on Front, Left on Back) - Crosses over at bottom join */}
        {!isBackView ? (
          <>
            <ProStrap 
              points={rightStrap} 
              color={strapColor} 
              strapW={strapW} 
              pattern={activePattern} 
              patternOpacity={patternOpacity} 
              isSelected={activeSelectedZone === 'right'}
              onClick={() => handleZoneSelect('right')}
            />
            <UnifiedStrapContent 
              {...rightCL} 
              design={design} 
              items={rightItems} 
              logoImg={logoImg} 
              strapW={strapW} 
              onUpdateText={onUpdateTextBlockText} 
              onUpdateLogo={onUpdateLogo} 
              onRemoveText={onRemoveTextBlock} 
              onRemoveLogo={onRemoveLogo} 
              showControls={showControls} 
              zone="right" 
            />
            <CustomElements3D elements={design.strapElements?.right} strapW={strapW} {...rightCL} width={design.width} clipType={design.clipType} textDirection={design.textDirection} isRightStrap={true} dualCanvasMode={design.dualCanvasMode} />
          </>
        ) : (
          <>
            <ProStrap 
              points={leftStrap} 
              color={strapColor} 
              strapW={strapW} 
              pattern={activePattern} 
              patternOpacity={patternOpacity} 
              isSelected={false}
            />
            <UnifiedStrapContent 
              {...leftCL} 
              design={design} 
              items={leftItems} 
              logoImg={logoImg} 
              strapW={strapW} 
              onUpdateText={onUpdateTextBlockText} 
              onUpdateLogo={onUpdateLogo} 
              onRemoveText={onRemoveTextBlock} 
              onRemoveLogo={onRemoveLogo} 
              showControls={false} 
              zone="left" 
            />
            <CustomElements3D elements={design.strapElements?.left} strapW={strapW} {...leftCL} width={design.width} clipType={design.clipType} textDirection={design.textDirection} />
          </>
        )}

        {/* Fold crease shadow where straps cross at bottom crimp */}
        <Line 
          points={[CX - strapW/2, CRIMP_Y - 4, CX + strapW/2, CRIMP_Y + 8]} 
          stroke="rgba(0,0,0,0.35)" 
          strokeWidth={1.5} 
          listening={false} 
        />

        {/* Corner folds */}
        <CornerFold side="left" ox={CX - SPREAD} oy={TOP_Y} strapW={strapW} color={strapColor} />
        <CornerFold side="right" ox={CX + SPREAD} oy={TOP_Y} strapW={strapW} color={strapColor} />
        <ProStrap points={connectorPts} color={strapColor} strapW={strapW} pattern={activePattern} patternOpacity={patternOpacity} />
        <MetalCrimp x={CX} y={CRIMP_Y} strapW={strapW} />

        {/* Hardware Clip */}
        {(() => {
          const props = { x: CX, y: TIP_Y, strapW };
          switch (design.clipType) {
            case 'Plastic Hook': return <PlasticHook {...props} />;
            case 'Crocodile Clip': return <CrocodileClip {...props} />;
            case 'Ski Reel': return <SkiReel {...props} />;
            default: return <SwivelHook {...props} />;
          }
        })()}
        {design.accessories?.includes('Quick Release Buckle') && <SideReleaseBuckle x={CX} y={TIP_Y - 90} strapW={strapW} strapColor={strapColor} />}
        
        {showIdCard && !isBackView && (
          <CardHolder 
            x={CX} 
            y={TIP_Y + getClipHeight(design.clipType) - 8}
            cardWidth={reviewCardMetrics.width}
            cardHeight={reviewCardMetrics.height}
            cardScale={reviewCardMetrics.scale}
          >
            <IdCardPreview isReviewStep={true} forceSide="front" />
          </CardHolder>
        )}
      </Group>
    );
  };

  return (
    <div ref={containerRef} className="w-full h-full flex flex-col items-center justify-center relative select-none">
      <Stage 
        ref={stageRef} 
        width={STAGE_2D_WIDTH * scale} 
        height={STAGE_2D_HEIGHT * scale} 
        scaleX={scale} 
        scaleY={scale} 
        onClick={onSelect}
        className="rounded-[24px] shadow-2xl overflow-hidden"
      >
        <Layer ref={layerRef}>
          {/* Background fill */}
          <Rect x={0} y={0} width={STAGE_2D_WIDTH} height={STAGE_2D_HEIGHT} fill="transparent" />
          
          {/* Dimension ruler line */}
          <DimLine x1={geomFront.CX - geomFront.SPREAD - 25} y1={geomFront.TOP_Y} x2={geomFront.CX - geomFront.SPREAD - 25} y2={geomFront.TOP_Y + geomFront.strapW} label={design.width || '20mm'} />

          {/* FRONT LANYARD */}
          {renderSingleLanyard(geomFront, false)}

          {/* BACK LANYARD */}
          {renderSingleLanyard(geomBack, true)}

          <Transformer
            ref={trRef}
            boundBoxFunc={(oldBox, newBox) => {
              if (newBox.width < 5 || newBox.height < 5) return oldBox;
              return newBox;
            }}
          />
        </Layer>
      </Stage>
    </div>
  );
}

export default memo(LanyardStage);

