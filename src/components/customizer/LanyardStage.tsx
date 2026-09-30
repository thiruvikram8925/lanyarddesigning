import { useEffect, useMemo, useRef, useState } from 'react';
import { Circle, Group, Image, Layer, Line, Rect, Stage, Text, Transformer } from 'react-konva';
import { useCanvasImage } from '../../hooks/useCanvasImage';
import { useConfiguratorStore } from '../../store/useConfiguratorStore';
import { getPatternById } from '../../data/strapPatterns';
import StrapPatternRenderer from './StrapPatternRenderer';
import IdCardPreview from './IdCardPreview';

// ─── Canvas constants ──────────────────────────────────────────────────────────
const BASE_WIDTH = 820;
const BASE_HEIGHT = 840;

// ─── Responsive container dimensions ───────────────────────────────────────────────
function useContainerDimensions(): [React.RefObject<HTMLDivElement>, { width: number, height: number }] {
  const ref = useRef<HTMLDivElement>(null);
  const [dims, setDims] = useState({ width: BASE_WIDTH, height: BASE_HEIGHT });
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => {
      setDims({
        width: e.contentRect.width || BASE_WIDTH,
        height: e.contentRect.height || BASE_HEIGHT
      });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, dims];
}

// ─── Color helpers ────────────────────────────────────────────────────────────
function shadeHex(hex: string, pct: number) {
  const c = (hex || '#888').replace('#', '');
  if (c.length !== 6) return hex || '#888';
  const n = parseInt(c, 16);
  const r = Math.min(255, Math.max(0, (n >> 16) + pct));
  const g = Math.min(255, Math.max(0, ((n >> 8) & 0xff) + pct));
  const b = Math.min(255, Math.max(0, (n & 0xff) + pct));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}
function isGrad(c: unknown) { return typeof c === 'string' && c.includes('gradient'); }
function baseColor(color: string) {
  if (isGrad(color)) { const m = color.match(/#[a-fA-F0-9]{6}/g); return m ? m[0] : '#888'; }
  return color || '#888';
}
function gradFill(color: string, p1: { x: number; y: number }, p2: { x: number; y: number }) {
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
function edgeStitchSegs(pts: number[], d: number, minLen: number) {
  const n = pts.length / 2;
  const out = [];
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    const x0 = pts[i * 2], y0 = pts[i * 2 + 1];
    const x1 = pts[j * 2], y1 = pts[j * 2 + 1];
    const dx = x1 - x0, dy = y1 - y0;
    const len = Math.hypot(dx, dy);
    if (!len || len < minLen) continue;
    const nx = (-dy / len) * d;
    const ny = (dx / len) * d;
    out.push([x0 + nx, y0 + ny, x1 + nx, y1 + ny]);
  }
  return out;
}

// ─── Strap with professional fabric edges + stitching ─────────────────────────
function ProStrap({ points, color, strapW, pattern, patternOpacity }: Record<string, unknown>) {
  const bc = baseColor(color);
  const hiColor = shadeHex(bc, 50);
  const shColor = shadeHex(bc, -60);
  const fillProp = gradFill(color, { x: points[0], y: 0 }, { x: points[2], y: 0 });
  const stitchD = Math.min(2.8, strapW * 0.08);
  const segs = edgeStitchSegs(points, stitchD, strapW * 1.4);

  return (
    <Group>
      <Line points={points} closed stroke={shColor} strokeWidth={0.9} lineJoin="miter" {...fillProp} />
      <StrapPatternRenderer clipPoints={points} pattern={pattern} strapW={strapW} opacity={patternOpacity} />
      <Line points={points} closed stroke="transparent" strokeWidth={0} listening={false}
        fillLinearGradientStartPoint={{ x: points[0], y: 0 }}
        fillLinearGradientEndPoint={{ x: points[0], y: strapW }}
        fillLinearGradientColorStops={[0, 'rgba(255,255,255,0.20)', 0.4, 'rgba(255,255,255,0.05)', 0.6, 'rgba(0,0,0,0)', 1, 'rgba(0,0,0,0.12)']}
      />
      <Line points={points} closed stroke={hiColor} strokeWidth={2} opacity={0.18} fill="transparent" listening={false} />
      {segs.map((seg, i) => (
        <Line key={i} points={seg} stroke="rgba(255,255,255,0.55)" strokeWidth={0.9} dash={[4, 3]} lineCap="round" listening={false} />
      ))}
    </Group>
  );
}

// ─── Realistic folded corner ──────────────────────────────────────────────────
function CornerFold({ side, ox, oy, strapW, color }: Record<string, unknown>) {
  const bc = baseColor(color);
  const foldCol = shadeHex(bc, -70);
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
function StaticLogo({ cx, cy, angle, logo, strapW, logoScale, logoOffset, logoRotation, onRemove, onDrag, showControls, design }: Record<string, unknown>) {
  if (!logo) return null;
  const imgRatio = logo.width / logo.height;
  const scale = logoScale || 1;
  const targetH = strapW * 0.8 * scale;
  const targetW = targetH * imgRatio;

  const borderWidth = (design.logoBorderWidth as number) || 0;
  const borderColor = (design.logoBorderColor as string) || '#ffffff';
  const borderRadius = (design.logoBorderRadius as number) || 0;
  const opacity = (design.logoOpacity as number) ?? 1;

  const cropConfig = (design.logoCropWidth && design.logoCropHeight) ? {
    x: (design.logoCropX as number) || 0,
    y: (design.logoCropY as number) || 0,
    width: design.logoCropWidth as number,
    height: design.logoCropHeight as number
  } : undefined;

  return (
    <Group 
      x={cx} y={cy} rotation={angle}
      draggable={showControls}
      onDragEnd={(e) => {
        if (design.snapToGrid) {
          const node = e.target;
          const gridSize = design.gridSize || 20;
          const newX = Math.round(node.x() / gridSize) * gridSize;
          const newY = Math.round(node.y() / gridSize) * gridSize;
          node.position({ x: newX, y: newY });
          onDrag(newX - cx, newY - cy, 'center');
        } else {
          onDrag(e.target.x() - cx, e.target.y() - cy, 'center');
        }
      }}
      onTransformEnd={(e: import('konva/lib/Node').KonvaEventObject<Event>) => {
        const node = e.target;
        const scaleX = node.scaleX();
        const rotation = node.rotation();
        onDrag(node.x() - cx, node.y() - cy, 'center', scaleX, rotation);
        node.scaleX(1);
        node.scaleY(1);
      }}
      onMouseEnter={(e: import('konva/lib/Node').KonvaEventObject<MouseEvent>) => { if (showControls) e.target.getStage()!.container().style.cursor = 'grab'; }}
      onMouseLeave={(e: import('konva/lib/Node').KonvaEventObject<MouseEvent>) => { e.target.getStage()!.container().style.cursor = 'default'; }}
    >
      {borderWidth > 0 && (
        <Rect
          x={(logoOffset || 0)} y={0}
          width={targetW + borderWidth * 2} height={targetH + borderWidth * 2}
          offsetX={(targetW + borderWidth * 2) / 2} offsetY={(targetH + borderWidth * 2) / 2}
          stroke={borderColor} strokeWidth={borderWidth} cornerRadius={borderRadius}
          rotation={logoRotation || 0} opacity={opacity}
        />
      )}
      <Image 
        image={logo} 
        x={(logoOffset || 0)} y={0}
        width={targetW} height={targetH}
        offsetX={targetW / 2} offsetY={targetH / 2}
        rotation={logoRotation || 0}
        opacity={opacity}
        crop={cropConfig}
        cornerRadius={borderRadius}
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

// ─── Hardware Components (Swivel, Plastic, Crocodile, Ski Reel, Side Release) ───
function SwivelHook({ x, y, strapW }: Record<string, unknown>) {
  return (
    <Group x={x} y={y}>
      <Rect x={-strapW/2} y={-4} width={strapW} height={8} fillLinearGradientStartPoint={{x:-strapW/2,y:0}} fillLinearGradientEndPoint={{x:strapW/2,y:0}} fillLinearGradientColorStops={[0,'#b0b5be',0.5,'#e8eaed',1,'#9ca3af']} stroke="#6b7280" strokeWidth={0.5} />
      <Line points={[-(strapW/2+3),0, strapW/2+3,0, strapW/2+9,9, strapW/2+6,20, -(strapW/2+6),20, -(strapW/2+9),9]} closed fillLinearGradientStartPoint={{x:-20,y:0}} fillLinearGradientEndPoint={{x:20,y:20}} fillLinearGradientColorStops={[0,'#d1d5db',0.45,'#f3f4f6',1,'#9ca3af']} stroke="#6b7280" strokeWidth={1.2} tension={0.15} />
      <Rect x={-5} y={20} width={10} height={16} fillLinearGradientStartPoint={{x:-5,y:0}} fillLinearGradientEndPoint={{x:5,y:0}} fillLinearGradientColorStops={[0,'#9ca3af',0.5,'#e5e7eb',1,'#9ca3af']} stroke="#6b7280" strokeWidth={1} cornerRadius={3} />
      <Group y={36}>
        <Line points={[-11,0, 11,0, 16,13, 16,40, 0,53, -16,40, -16,13]} closed fillLinearGradientStartPoint={{x:-16,y:0}} fillLinearGradientEndPoint={{x:16,y:53}} fillLinearGradientColorStops={[0,'#d1d5db',0.4,'#f3f4f6',1,'#9ca3af']} stroke="#6b7280" strokeWidth={1.2} tension={0.35} />
        <Line points={[-9,13,-9,36,0,46]} stroke="#555" strokeWidth={2.5} lineCap="round" />
        <Circle x={11} y={27} radius={2.8} fillLinearGradientStartPoint={{x:-3,y:-3}} fillLinearGradientEndPoint={{x:3,y:3}} fillLinearGradientColorStops={[0,'#9ca3af',1,'#374151']} stroke="#374151" strokeWidth={0.5} />
      </Group>
    </Group>
  );
}
function PlasticHook({ x, y, strapW }: Record<string, unknown>) {
  const hw = strapW / 2 + 3;
  return (
    <Group x={x} y={y}>
      <Rect x={-strapW/2} y={-4} width={strapW} height={8} fill="#222" stroke="#111" strokeWidth={0.5} />
      <Line points={[-hw,0, hw,0, hw+6,9, hw+3,22, -hw-3,22, -hw-6,9]} closed fill="#2d2d2d" stroke="#111" strokeWidth={1.5} tension={0.2} />
      <Rect x={-6} y={18} width={12} height={18} fill="#2d2d2d" stroke="#111" strokeWidth={1.5} cornerRadius={3} />
      <Group y={36}><Line points={[-14,0, 14,0, 20,20, 20,45, 0,60, -20,45, -20,15, -12,15, -12,40, 0,50, 10,40, 10,20, 0,0]} closed fill="#2d2d2d" stroke="#111" strokeWidth={1.5} tension={0.4} /></Group>
    </Group>
  );
}
function CrocodileClip({ x, y, strapW }: Record<string, unknown>) {
  return (
    <Group x={x} y={y}>
      <Rect x={-strapW/2} y={-4} width={strapW} height={8} fillLinearGradientStartPoint={{x:-strapW/2,y:0}} fillLinearGradientEndPoint={{x:strapW/2,y:0}} fillLinearGradientColorStops={[0,'#9ea3af',0.5,'#f3f4f6',1,'#9ea3af']} stroke="#6b7280" strokeWidth={0.5} />
      <Circle x={0} y={10} radius={6} stroke="#4b5563" strokeWidth={2.5} />
      <Circle x={0} y={10} radius={3.5} fill="#fff" stroke="#9ca3af" strokeWidth={0.5} />
      <Group y={16}>
        <Rect x={-12} y={0} width={24} height={42} fillLinearGradientStartPoint={{x:-12,y:0}} fillLinearGradientEndPoint={{x:12,y:42}} fillLinearGradientColorStops={[0,'#d1d5db',0.4,'#fdfdfd',1,'#9ca3af']} stroke="#4b5563" strokeWidth={1.2} cornerRadius={2} />
        {[8, 14, 20, 26, 32].map((gap, i) => (<Line key={i} points={[-8, gap, 8, gap]} stroke="#9ca3af" strokeWidth={0.8} opacity={0.6} />))}
        <Circle x={0} y={34} radius={1.8} fill="#4b5563" />
      </Group>
    </Group>
  );
}
function SkiReel({ x, y, strapW }: Record<string, unknown>) {
  return (
    <Group x={x} y={y}>
      <Rect x={-strapW/2} y={-4} width={strapW} height={8} fill="#222" stroke="#000" strokeWidth={0.5} />
      <Group y={34}>
        <Circle radius={24} fillLinearGradientStartPoint={{x:-24,y:-24}} fillLinearGradientEndPoint={{x:24,y:24}} fillLinearGradientColorStops={[0,'#374151',0.5,'#111827',1,'#000']} stroke="#000" strokeWidth={1.5} shadowBlur={6} shadowColor="rgba(0,0,0,0.4)" shadowOffset={{x:2,y:3}} />
        <Circle radius={21} stroke="rgba(255,255,255,0.06)" strokeWidth={1.5} listening={false} />
        <Circle radius={16} fill="#000" opacity={0.3} />
        <Rect x={-3} y={-18} width={6} height={16} fill="#6b7280" cornerRadius={1} opacity={0.7} />
        <Group y={24}><Line points={[0, 0, 0, 20]} stroke="#333" strokeWidth={1.5} /><Group y={20}><Rect x={-8} y={0} width={16} height={22} fill="rgba(255,255,255,0.85)" stroke="#ccc" strokeWidth={0.5} cornerRadius={3} /><Circle x={0} y={11} radius={4} fillLinearGradientStartPoint={{x:-4,y:-4}} fillLinearGradientEndPoint={{x:4,y:4}} fillLinearGradientColorStops={[0,'#f3f4f6',1,'#9ca3af']} stroke="#4b5563" strokeWidth={0.8} /><Rect x={-5} y={22} width={10} height={12} fill="#9ca3af" cornerRadius={1} /></Group></Group>
      </Group>
    </Group>
  );
}
function SideReleaseBuckle({ x, y, strapW, strapColor }: Record<string, unknown>) {
  const hw = Math.max(24, strapW * 0.95);
  return (
    <Group x={x} y={y}>
      <Rect x={-strapW/2} y={-5} width={strapW} height={10} fill={strapColor} stroke="#00000022" strokeWidth={0.6} />
      <Line points={[-hw,0, hw,0, hw+6,9, hw+6,40, hw,48, -hw,48, -hw-6,40, -hw-6,9]} closed fillLinearGradientStartPoint={{x:-hw,y:0}} fillLinearGradientEndPoint={{x:hw,y:48}} fillLinearGradientColorStops={[0,'#555',0.4,'#888',1,'#333']} stroke="#222" strokeWidth={1} lineCap="round" lineJoin="round" />
      <Rect x={-strapW/2+3} y={9} width={strapW-6} height={30} fill="#222" stroke="#111" strokeWidth={0.6} cornerRadius={2} />
      <Group y={58}><Circle radius={20} fillLinearGradientStartPoint={{x:-20,y:-20}} fillLinearGradientEndPoint={{x:20,y:20}} fillLinearGradientColorStops={[0,'#e5e7eb',0.5,'#fff',1,'#d1d5db']} stroke="#888" strokeWidth={4} /></Group>
    </Group>
  );
}
function MetalCrimp({ x, y, strapW }: Record<string, unknown>) {
  const w = strapW + 10, h = 30;
  return (
    <Group x={x} y={y}>
      <Rect x={-w/2} y={0} width={w} height={h} fillLinearGradientStartPoint={{x:-w/2, y:0}} fillLinearGradientEndPoint={{x:w/2, y:0}} fillLinearGradientColorStops={[0,'#9ca3af', 0.15, '#e5e7eb', 0.5, '#ffffff', 0.85, '#e5e7eb', 1, '#9ca3af']} stroke="#4b5563" strokeWidth={0.8} cornerRadius={1.5} />
      <Line points={[-w/2+2, 6, w/2-2, 6]} stroke="rgba(0,0,0,0.12)" strokeWidth={0.6} />
      <Line points={[-w/2+2, 24, w/2-2, 24]} stroke="rgba(0,0,0,0.12)" strokeWidth={0.6} />
    </Group>
  );
}

// ─── Production proof panel ──────────────────────────────────────────────────
function FlatStrap({ x, y, w, h, color, pattern, patternOpacity, children }: Record<string, unknown>) {
  const bc = baseColor(color);
  const sh = shadeHex(bc, -55);
  return (
    <Group x={x} y={y}>
      <Rect width={w} height={h} stroke={sh} strokeWidth={0.8} {...gradFill(color, { x: 0, y: 0 }, { x: w, y: 0 })} />
      <StrapPatternRenderer clipPoints={[0,0,w,0,w,h,0,h]} pattern={pattern} strapW={w} opacity={patternOpacity} />
      {children}
    </Group>
  );
}

function DimLine({ x1, y1, x2, y2, label }: Record<string, unknown>) {
  const isVert = x1 === x2;
  return (
    <Group opacity={0.55}>
      <Line points={[x1, y1, x2, y2]} stroke="#888" strokeWidth={0.8} dash={[4, 4]} />
      {isVert ? (<><Line points={[x1-5, y1, x1+5, y1]} stroke="#888" strokeWidth={0.8} /><Line points={[x1-5, y2, x1+5, y2]} stroke="#888" strokeWidth={0.8} /><Text text={label} x={x1-38} y={(y1+y2)/2 - 6} fontSize={10} fill="#666" align="right" width={30} /></>) : (<><Line points={[x1, y1-5, x1, y1+5]} stroke="#888" strokeWidth={0.8} /><Line points={[x2, y1-5, x2, y1+5]} stroke="#888" strokeWidth={0.8} /><Text text={label} x={(x1+x2)/2 - 15} y={y1-16} fontSize={10} fill="#666" align="center" width={30} /></>)}
    </Group>
  );
}

function IndividualLanyardLogo({
  logoItem,
  x1, y1, dx, dy, dist, angle, strapW, showControls, onRemoveLogo, onUpdateLogoItem, design
}: Record<string, unknown>) {
  const logoImg = useCanvasImage(logoItem.url as string);
  if (!logoImg) return null;

  const itemScale = (logoItem.scale as number) || (design.logoScale as number) || 1;
  const itemRotation = (logoItem.rotation as number) || (design.logoRotation as number) || 0;
  const borderWidth = (logoItem.borderWidth as number) || (design.logoBorderWidth as number) || 0;
  const borderColor = (logoItem.borderColor as string) || (design.logoBorderColor as string) || '#ffffff';
  const borderRadius = (logoItem.borderRadius as number) || (design.logoBorderRadius as number) || 0;
  const opacity = (logoItem.opacity as number) ?? (design.logoOpacity as number) ?? 1;

  const imgRatio = logoImg.width / logoImg.height;
  const lgW = (strapW as number) * 0.8 * imgRatio * itemScale;

  const baseT = (logoItem.tRatio as number) ?? 0.5;
  const rawT = baseT + ((logoItem.xOffset as number) || 0) / (dist as number);
  const logoT = Math.min(0.98, Math.max(0.02, rawT));

  const px = (x1 as number) + (dx as number) * logoT;
  const py = (y1 as number) + (dy as number) * logoT;

  return (
    <Group
      key={logoItem.id as string}
      x={px}
      y={py}
      rotation={angle as number}
      draggable={showControls as boolean}
      onDragEnd={(e: import('konva/lib/Node').KonvaEventObject<DragEvent>) => {
        const node = e.target;
        const dragX = node.x() - px;
        const dragY = node.y() - py;
        const ux = (dx as number) / (dist as number);
        const uy = (dy as number) / (dist as number);
        const projOffset = dragX * ux + dragY * uy;
        (onUpdateLogoItem as Function)(logoItem.id, projOffset);
        node.position({ x: px, y: py });
      }}
      onClick={(e: any) => {
        e.cancelBubble = true;
        useConfiguratorStore.getState().setField('selectedLanyardElement', 'logo');
      }}
      onTap={(e: any) => {
        e.cancelBubble = true;
        useConfiguratorStore.getState().setField('selectedLanyardElement', 'logo');
      }}
      onMouseEnter={(e: import('konva/lib/Node').KonvaEventObject<MouseEvent>) => {
        if (showControls) e.target.getStage()!.container().style.cursor = 'grab';
      }}
      onMouseLeave={(e: import('konva/lib/Node').KonvaEventObject<MouseEvent>) => {
        e.target.getStage()!.container().style.cursor = 'default';
      }}
    >
      {borderWidth > 0 && (
        <Rect
          width={lgW + borderWidth * 2}
          height={(strapW as number) * 0.8 * itemScale + borderWidth * 2}
          offsetY={((strapW as number) * 0.8 * itemScale + borderWidth * 2) / 2}
          offsetX={(lgW + borderWidth * 2) / 2}
          stroke={borderColor}
          strokeWidth={borderWidth}
          cornerRadius={borderRadius}
          rotation={itemRotation}
          opacity={opacity}
        />
      )}
      <Image
        image={logoImg}
        width={lgW}
        height={(strapW as number) * 0.8 * itemScale}
        offsetY={((strapW as number) * 0.8 * itemScale) / 2}
        offsetX={lgW / 2}
        rotation={itemRotation}
        opacity={opacity}
        cornerRadius={borderRadius}
      />
      {showControls && (
        <Group
          x={lgW / 2 + 6}
          y={-((strapW as number) * 0.8 * itemScale) / 2}
          onClick={(e: any) => {
            e.cancelBubble = true;
            (onRemoveLogo as Function)(logoItem.id);
          }}
          onTap={(e: any) => {
            e.cancelBubble = true;
            (onRemoveLogo as Function)(logoItem.id);
          }}
        >
          <Circle radius={7} fill="#ef4444" cursor="pointer" />
          <Text text="✕" x={-3.5} y={-4} fontSize={8} fill="#fff" fontStyle="bold" listening={false} />
        </Group>
      )}
    </Group>
  );
}

// ─── INDEPENDENT Content with Independent Drills ──────────────────────────
function UnifiedStrapContent({ x1, y1, x2, y2, design, logoImg, strapW, forceNoLogo, forceNoText, onUpdateText, onUpdateLogo, onUpdateLogoItem, onRemoveText, onRemoveLogo, showControls, zone }: Record<string, unknown>) {
  const { lanyardDesignStyle, customText, customTextSecondary, predefinedWord, fontColor, fontFamily, fontSize, textSpacing, logoScale, logoRotation, textOffset, logoOffset, copyMode, customTextLeft, customTextCenter, customTextRight } = design;
  
  const dx = x2 - x1, dy = y2 - y1;
  const dist = Math.hypot(dx, dy);
  const angle = Math.atan2(dy, dx) * (180 / Math.PI);
  const mainText = lanyardDesignStyle === 'predefined' ? predefinedWord : (forceNoText ? '' : (copyMode === 'synchronized' ? (customTextLeft || customTextCenter || customTextRight) : (zone === 'left' ? customTextLeft : (zone === 'right' ? customTextRight : customTextCenter))));
  const subText = lanyardDesignStyle === 'stacked-text' ? customTextSecondary : null;

  if (!mainText && !logoImg) return null;

  const fs = Math.min(fontSize, Math.max(6, strapW * 0.7));
  const hasLogo = logoImg && (lanyardDesignStyle === 'repeated' || (lanyardDesignStyle === 'central-logo' && forceNoLogo === false)) && !forceNoLogo;
  const hasSubText = subText && lanyardDesignStyle === 'stacked-text';

  const tOffset = copyMode === 'synchronized' ? (textOffset || 0) : (zone === 'left' ? (design.textOffsetLeft || 0) : (zone === 'right' ? (design.textOffsetRight || 0) : (design.textOffsetCenter || 0)));
  const lOffset = copyMode === 'synchronized' ? (logoOffset || 0) : (zone === 'left' ? (design.logoOffsetLeft || 0) : (zone === 'right' ? (design.logoOffsetRight || 0) : (design.logoOffsetCenter || 0)));

  const textW = mainText ? mainText.length * fs * 0.55 : 0;
  const lgW = hasLogo ? (strapW * 0.8 * (logoImg.width / logoImg.height) * logoScale) : 0;
  
  const logoSpacing = (design.logoSpacing as number) || 40;
  const isLogoRepeated = (design.logoMode !== 'single') && (lanyardDesignStyle === 'repeated' || design.logoRepeat !== false);
  
  const stepGap = Math.max(30, logoSpacing + lgW + (mainText ? textW + 15 : 0));

  const items = [];
  const customLogos = (design.lanyardLogos as Array<any>) || [];

  if (customLogos.length > 0 && !forceNoLogo) {
    // Filter custom logos by zone to prevent auto-duplicating logos across left, center, and right zones
    const zoneLogos = customLogos.filter((logoItem: any) => {
      if (logoItem.zone) return logoItem.zone === zone;
      return zone === 'left';
    });

    return (
      <Group>
        {/* Render text items if present */}
        {mainText && (
          <Group>
            {Array.from({ length: Math.max(1, Math.floor(dist / Math.max(30, (textSpacing || 60) * 2 + textW))) }).map((_, i) => {
              const textT = (Math.max(30, (textSpacing || 60) * 2 + textW) * i + (tOffset || 0)) / dist;
              if (textT < -0.1 || textT > 1.1) return null;
              const px = x1 + dx * textT;
              const py = y1 + dy * textT;
              const totalHeight = hasSubText ? fs + fs * 0.55 : fs;
              return (
                <Group
                  key={`text-${i}`}
                  x={px}
                  y={py}
                  rotation={angle + (design.textAngle || 0)}
                  draggable={showControls}
                  onClick={(e: any) => { e.cancelBubble = true; useConfiguratorStore.getState().setField('selectedLanyardElement', 'text'); }}
                  onTap={(e: any) => { e.cancelBubble = true; useConfiguratorStore.getState().setField('selectedLanyardElement', 'text'); }}
                  onDragEnd={(e: import('konva/lib/Node').KonvaEventObject<DragEvent>) => {
                    const node = e.target;
                    const dragX = node.x() - px;
                    const dragY = node.y() - py;
                    const ux = dx / dist;
                    const uy = dy / dist;
                    const projOffset = dragX * ux + dragY * uy;
                    onUpdateText(projOffset, zone);
                    node.position({ x: px, y: py });
                  }}
                >
                  <Text
                    text={mainText}
                    fontSize={fs}
                    fontFamily={fontFamily}
                    fontStyle="bold"
                    fill={fontColor}
                    align={design.textPosition === 'Left' ? 'left' : (design.textPosition === 'Right' ? 'right' : 'center')}
                    width={textW}
                    offsetX={design.textPosition === 'Left' ? 0 : (design.textPosition === 'Right' ? textW : textW / 2)}
                    offsetY={totalHeight / 2}
                  />
                  {showControls && i === 0 && (
                    <Group x={(design.textPosition === 'Left' ? textW : (design.textPosition === 'Right' ? 0 : textW / 2)) + 8} y={-fs / 2}>
                      <Circle radius={6} fill="#ef4444" onClick={() => onRemoveText(zone)} cursor="pointer" />
                      <Text text="✕" x={-3} y={-3.5} fontSize={7} fill="#fff" fontStyle="bold" listening={false} />
                    </Group>
                  )}
                </Group>
              );
            })}
          </Group>
        )}

        {/* Render distinct added images without repeating across zones */}
        {zoneLogos.map((logoItem: any) => (
          <IndividualLanyardLogo
            key={logoItem.id}
            logoItem={logoItem}
            x1={x1} y1={y1} dx={dx} dy={dy} dist={dist} angle={angle}
            strapW={strapW} showControls={showControls}
            onRemoveLogo={onRemoveLogo}
            onUpdateLogoItem={onUpdateLogoItem}
            design={design}
            zone={zone}
          />
        ))}
      </Group>
    );
  }

  if (mainText) {
    const textGap = Math.max(30, (textSpacing || 60) * 2 + textW + (hasLogo ? lgW : 0));
    const count = Math.max(1, Math.floor(dist / textGap));
    for (let i = 0; i < count; i++) {
      const baseT = (textGap * i) / dist;
      const textT = baseT + (tOffset / dist);
      if (textT >= -0.1 && textT <= 1.1) {
        items.push({ type: 'text', t: textT, i });
      }
    }
  }

  return (
    <Group>
      {items.map((item, idx) => {
        const px = x1 + dx * item.t, py = y1 + dy * item.t;

        if (item.type === 'text') {
          const totalHeight = hasSubText ? fs + fs * 0.55 : fs;
              return (
                <Group
                  key={`${item.type}-${item.i}`}
                  x={px}
                  y={py}
                  rotation={angle + (design.textAngle || 0)}
                  draggable={showControls}
                  onClick={(e: any) => { e.cancelBubble = true; useConfiguratorStore.getState().setField('selectedLanyardElement', 'text'); }}
                  onTap={(e: any) => { e.cancelBubble = true; useConfiguratorStore.getState().setField('selectedLanyardElement', 'text'); }}
                  onDragEnd={(e: import('konva/lib/Node').KonvaEventObject<DragEvent>) => {
                    const node = e.target;
                    const dragX = node.x() - px;
                    const dragY = node.y() - py;
                    const ux = dx / dist;
                    const uy = dy / dist;
                    const projOffset = dragX * ux + dragY * uy;
                    onUpdateText(projOffset, zone);
                    node.position({ x: px, y: py });
                  }}
                  onTransformEnd={(e: import('konva/lib/Node').KonvaEventObject<Event>) => {
                    const node = e.target;
                    const scaleX = node.scaleX();
                    const rotation = node.rotation();
                    onUpdateText(node.x() - px, node.y() - py, zone, scaleX, rotation);
                    node.scaleX(1);
                    node.scaleY(1);
                  }}
                  onMouseEnter={(e: import('konva/lib/Node').KonvaEventObject<MouseEvent>) => {
                    if (showControls) e.target.getStage().container().style.cursor = 'grab';
                  }}
                  onMouseLeave={(e: import('konva/lib/Node').KonvaEventObject<MouseEvent>) => {
                    e.target.getStage().container().style.cursor = 'default';
                  }}
                >
                  <Text
                    text={mainText}
                    fontSize={fs}
                    fontFamily={fontFamily}
                    fontStyle="bold"
                    fill={fontColor}
                    align={design.textPosition === 'Left' ? 'left' : (design.textPosition === 'Right' ? 'right' : 'center')}
                    width={textW}
                    offsetX={design.textPosition === 'Left' ? 0 : (design.textPosition === 'Right' ? textW : textW / 2)}
                    offsetY={totalHeight / 2}
                  />
                  {hasSubText && (
                    <Text
                      text={subText}
                      fontSize={fs * 0.55}
                      fontFamily={fontFamily}
                      fill={fontColor}
                      opacity={0.8}
                      align={design.textPosition === 'Left' ? 'left' : (design.textPosition === 'Right' ? 'right' : 'center')}
                      width={textW}
                      x={0}
                      y={fs * 0.8}
                      offsetX={design.textPosition === 'Left' ? 0 : (design.textPosition === 'Right' ? textW : textW / 2)}
                      offsetY={totalHeight / 2}
                    />
                  )}
                  {showControls &&
                    item.i === 0 && (
                      <Group 
                        x={(design.textPosition === 'Left' ? textW : (design.textPosition === 'Right' ? 0 : textW / 2)) + 8} 
                        y={-fs / 2}
                      >
                        <Circle radius={6} fill="#ef4444" onClick={() => onRemoveText(zone)} cursor="pointer" />
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

        const borderWidth = (design.logoBorderWidth as number) || 0;
        const borderColor = (design.logoBorderColor as string) || '#ffffff';
        const borderRadius = (design.logoBorderRadius as number) || 0;
        const opacity = (design.logoOpacity as number) ?? 1;

        const cropConfig = (design.logoCropWidth && design.logoCropHeight) ? {
          x: (design.logoCropX as number) || 0,
          y: (design.logoCropY as number) || 0,
          width: design.logoCropWidth as number,
          height: design.logoCropHeight as number
        } : undefined;

        return (
          <Group 
            key={`${item.type}-${item.i}`} x={px} y={py} rotation={angle}
            draggable={showControls as boolean}
            onDragEnd={(e: import('konva/lib/Node').KonvaEventObject<DragEvent>) => {
              const node = e.target;
              const dragX = node.x() - px;
              const dragY = node.y() - py;
              const ux = dx / dist;
              const uy = dy / dist;
              const projOffset = dragX * ux + dragY * uy;
              (onUpdateLogo as Function)(projOffset, zone);
              node.position({ x: px, y: py });
            }}
            onClick={(e: any) => { e.cancelBubble = true; useConfiguratorStore.getState().setField('selectedLanyardElement', 'logo'); }}
            onTap={(e: any) => { e.cancelBubble = true; useConfiguratorStore.getState().setField('selectedLanyardElement', 'logo'); }}
            onMouseEnter={(e: import('konva/lib/Node').KonvaEventObject<MouseEvent>) => { if (showControls) e.target.getStage()!.container().style.cursor = 'grab'; }}
            onMouseLeave={(e: import('konva/lib/Node').KonvaEventObject<MouseEvent>) => { e.target.getStage()!.container().style.cursor = 'default'; }}
          >
            {borderWidth > 0 && (
              <Rect
                width={lgW + borderWidth * 2}
                height={strapW * 0.8 * logoScale + borderWidth * 2}
                offsetY={(strapW * 0.8 * logoScale + borderWidth * 2) / 2}
                offsetX={(lgW + borderWidth * 2) / 2}
                stroke={borderColor}
                strokeWidth={borderWidth}
                cornerRadius={borderRadius}
                rotation={logoRotation || 0}
                opacity={opacity}
              />
            )}
            <Image
              image={logoImg}
              width={lgW}
              height={strapW * 0.8 * logoScale}
              offsetY={(strapW * 0.8 * logoScale) / 2}
              offsetX={lgW / 2}
              rotation={logoRotation || 0}
              opacity={opacity}
              crop={cropConfig}
              cornerRadius={borderRadius}
            />
            {showControls && item.i === 0 && (
              <Group x={lgW/2 + 8} y={-(strapW*0.8*logoScale)/2}>
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

export default function LanyardStage({ zoom = 1, stageRef, currentStep, showIdCard = false, isFlatMode = false, flatLength }: { zoom?: number; stageRef?: React.RefObject<unknown>; currentStep?: number; showIdCard?: boolean; isFlatMode?: boolean; flatLength?: number }) {
  const showControls = currentStep === 2;
  const design = useConfiguratorStore((s: Record<string, unknown>) => s.design as Record<string, unknown>);
  const setField = useConfiguratorStore((s: Record<string, unknown>) => s.setField as Function);
  const [containerRef, dims] = useContainerDimensions();
  const containerWidth = dims.width;
  const containerHeight = dims.height;
  const logoImg = useCanvasImage(design.logoUrl);
  const strapColor = design.lanyardColor || '#cc1111';
  const scale = Math.max(0.35, (Math.min(containerWidth - 32, BASE_WIDTH) / BASE_WIDTH) * zoom);
  const activePattern = getPatternById(design.strapPattern);
  const patternOpacity = design.strapPatternOpacity ?? 0.85;

  const strapW = useMemo(() => {
    const mmStr = design.width || '20mm';
    const mm = parseInt(mmStr.replace('mm', ''), 10);
    return Math.max(14, (mm / 20) * 36);
  }, [design.width]);
  
  const CX = 305, TOP_Y = 100, HALF_W = 190, TIP_Y = 615, LX = CX - HALF_W, RX = CX + HALF_W;
  const CRIMP_H = 32, CRIMP_Y = TIP_Y - 55;
  
  const idCardSize = design.idCard.size;
  const isHorizontal = idCardSize === '100x70';
  const cardW = isHorizontal ? 283 : (idCardSize === '70x100' ? 198 : 153);
  const cardH = isHorizontal ? 198 : (idCardSize === '70x100' ? 283 : 244);
  const cardScale = 0.7;
  const barPts = [LX + strapW, TOP_Y, RX - strapW, TOP_Y, RX - strapW, TOP_Y + strapW, LX + strapW, TOP_Y + strapW];
  const leftStrap = [LX, TOP_Y + strapW, LX + strapW, TOP_Y + strapW, CX+strapW/2, CRIMP_Y, CX-strapW/2, CRIMP_Y];
  const rightStrap = [RX, TOP_Y + strapW, CX+strapW/2, CRIMP_Y, CX-strapW/2, CRIMP_Y, RX-strapW, TOP_Y + strapW];
  const connectorPts = [CX-strapW/2, CRIMP_Y+CRIMP_H-2, CX+strapW/2, CRIMP_Y+CRIMP_H-2, CX+strapW/2, TIP_Y, CX-strapW/2, TIP_Y];

  const leftCL = { x1: LX + strapW * 0.5, y1: TOP_Y + strapW * 1.5, x2: CX - strapW * 0.3, y2: CRIMP_Y - 20 };
  const rightCL = { x1: RX - strapW * 0.5, y1: TOP_Y + strapW * 1.5, x2: CX + strapW * 0.3, y2: CRIMP_Y - 20 };

  const onUpdateText = (dx: number, dy: number, zone: string, scale?: number, rotation?: number) => {
    if (design.copyMode === 'synchronized') {
      setField('textOffset', (design.textOffset || 0) + dx);
    } else {
      const fieldPath = zone === 'left' ? 'textOffsetLeft' : (zone === 'right' ? 'textOffsetRight' : 'textOffsetCenter');
      setField(fieldPath, (design[fieldPath] || 0) + dx);
    }
    setField('fontSize', design.fontSize * (scale || 1));
    setField('textAngle', (design.textAngle || 0) + (rotation || 0));
  };
  const onUpdateLogo = (dx: number, dy: number, zone: string, scale?: number, rotation?: number) => {
    if (design.copyMode === 'synchronized') {
      setField('logoOffset', (design.logoOffset || 0) + dx);
    } else {
      const fieldPath = zone === 'left' ? 'logoOffsetLeft' : (zone === 'right' ? 'logoOffsetRight' : 'logoOffsetCenter');
      setField(fieldPath, (design[fieldPath] || 0) + dx);
    }
    setField('logoScale', design.logoScale * (scale || 1));
    setField('logoRotation', (design.logoRotation || 0) + (rotation || 0));
  };
  const onRemoveText = (zone: string) => {
    if (design.copyMode === 'synchronized') {
      setField('customTextLeft', '');
      setField('customTextCenter', '');
      setField('customTextRight', '');
    } else {
      const fieldPath = zone === 'left' ? 'customTextLeft' : (zone === 'right' ? 'customTextRight' : 'customTextCenter');
      setField(fieldPath, '');
    }
  };
  const onRemoveLogo = (logoId?: string) => {
    if (typeof logoId === 'string' && logoId) {
      const currentLogos = (design.lanyardLogos as Array<any>) || [];
      const updated = currentLogos.filter(l => l.id !== logoId);
      setField('lanyardLogos', updated);
      if (updated.length === 0) {
        setField('logoUrl', '');
        setField('logoName', '');
      } else {
        setField('logoUrl', updated[0].url);
        setField('logoName', updated[0].name);
      }
    } else {
      setField('logoUrl', '');
      setField('logoName', '');
      setField('lanyardLogos', []);
    }
  };

  const onUpdateLogoItem = (logoId: string, deltaOffset: number) => {
    const currentLogos = (design.lanyardLogos as Array<any>) || [];
    const updated = currentLogos.map(l => {
      if (l.id === logoId) {
        return { ...l, xOffset: ((l.xOffset as number) || 0) + deltaOffset };
      }
      return l;
    });
    setField('lanyardLogos', updated);
  };

  const [stageScale, setStageScale] = useState(scale);
  const [stagePos, setStagePos] = useState({ x: 0, y: 0 });
  const [isDraggableStage, setIsDraggableStage] = useState(true);
  const [idCardPos, setIdCardPos] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    setStageScale(scale);
  }, [scale]);

  useEffect(() => {
    if (zoom === 1) {
      setStagePos({ x: 0, y: 0 });
      setIdCardPos(null);
    }
  }, [zoom]);

  const handleWheel = (e: any) => {
    e.evt.preventDefault();
    const stage = e.target.getStage();
    if (!stage) return;

    const oldScale = stageScale;
    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    const mousePointTo = {
      x: (pointer.x - stagePos.x) / oldScale,
      y: (pointer.y - stagePos.y) / oldScale,
    };

    // Reduced zoom sensitivity (2.5% step factor for flat mode)
    const stepFactor = isFlatMode ? 0.025 : 0.05;
    const direction = e.evt.deltaY < 0 ? 1 : -1;
    let newScale = oldScale * (1 + direction * stepFactor);
    newScale = Math.max(0.5, Math.min(newScale, 3.5));

    const newPos = {
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    };

    setStageScale(newScale);
    setStagePos(newPos);
  };

  const handleDblClick = (e: any) => {
    if (e.target === e.target.getStage()) {
      setIsDraggableStage(!isDraggableStage);
    }
  };

  const handleMouseDown = (e: any) => {
    // If middle mouse or background drag
    if (e.evt.button === 1) {
      e.evt.preventDefault();
      const stage = e.target.getStage();
      if (stage) {
        stage.startDrag();
      }
    }
  };

  const handleMouseUp = () => {};

  const handleDragEnd = (e: any) => {
    if (e.target === e.target.getStage()) {
      setStagePos({
        x: e.target.x(),
        y: e.target.y(),
      });
    }
  };

  const [selectedShape, setSelectedShape] = useState<string | null>(null);
  const trRef = useRef<unknown>(null);
  const layerRef = useRef<unknown>(null);

  useEffect(() => {
    if (trRef.current) {
      trRef.current.nodes(selectedShape ? [selectedShape] : []);
      trRef.current.getLayer().batchDraw();
    }
  }, [selectedShape]);

  const onSelect = (e: import('konva/lib/Node').KonvaEventObject<Event>) => {
    if (
      e.target === e.target.getStage() ||
      e.target.name() === 'idCardGroup' ||
      e.target.attrs?.name === 'idCardGroup' ||
      (e.target.findAncestor && e.target.findAncestor('.idCardGroup'))
    ) {
      setSelectedShape(null);
      setField('selectedLanyardElement', null);
      return;
    }
    if (e.target.attrs.draggable && e.target.name() !== 'idCardGroup') {
      setSelectedShape(e.target as any);
    } else {
      setSelectedShape(null);
      setField('selectedLanyardElement', null);
    }
  };

  if (isFlatMode) {
    const fw = containerWidth || 980;
    const fh = containerHeight || 560;
    
    const mmStr = (design.width as string) || '20mm';
    const finishMm = parseInt(mmStr.replace('mm', ''), 10) || 20;
    const bleedMm = parseFloat((finishMm * 1.155).toFixed(1)); // 23.1 mm for 20mm finish

    // Responsive horizontal strip layout (Zoomed & Centered) based on selected width/length (28"-38")
    const totalLen = flatLength || (design.flatLength as number) || 38;
    const baseStrapLen = Math.min(800, Math.max(600, fw - 160));
    const STRAP_LEN = baseStrapLen * (totalLen / 38);
    const startX = (fw - STRAP_LEN) / 2 + 40; // Shift right to make room for badges on left

    // Total breakdown: Left Ext (2"), Neck (4"), Right Ext (4"), Left & Right sides split remainder
    const leftExt = 2;
    const neck = 4;
    const rightExt = 4;
    const sideLen = Math.max(0, (totalLen - leftExt - neck - rightExt) / 2);

    const x0 = startX;
    const x1 = startX + STRAP_LEN * (leftExt / totalLen);
    const x2 = x1 + STRAP_LEN * (sideLen / totalLen);
    const x3 = x2 + STRAP_LEN * (neck / totalLen);
    const x4 = x3 + STRAP_LEN * (sideLen / totalLen);
    const x5 = x4 + STRAP_LEN * (rightExt / totalLen);

    const finishH = Math.max(34, Math.min(52, (finishMm / 20) * 42)); // High-detail enlarged strap height
    const bleedH = finishH * (bleedMm / finishMm); // 23.1mm bleed scale height
    
    const stripGap = 80; // Spacious gap between Front and Back strips
    const frontStrapY = fh / 2 - finishH - stripGap / 2 + 10;
    const backStrapY = fh / 2 + stripGap / 2 + 10;

    const frontBleedY = frontStrapY - (bleedH - finishH) / 2;
    const backBleedY = backStrapY - (bleedH - finishH) / 2;

    const dimensions = [
      { x: x0, w: x1 - x0, label: '2mm' },
      { x: x1, w: x2 - x1, label: 'left part' },
      { x: x2, w: x3 - x2, label: 'center' },
      { x: x3, w: x4 - x3, label: 'right part' },
      { x: x4, w: x5 - x4, label: '4mm' }
    ];

    return (
      <div className={`w-full h-full flex justify-center items-center bg-white overflow-hidden ${isDraggableStage ? 'cursor-grab active:cursor-grabbing' : ''}`} ref={containerRef}>
        <Stage 
          width={fw} 
          height={fh} 
          scaleX={stageScale} 
          scaleY={stageScale} 
          x={stagePos.x} 
          y={stagePos.y} 
          className="bg-white" 
          onClick={onSelect} 
          onTap={onSelect}
          onWheel={handleWheel}
          onDblClick={handleDblClick}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          draggable={isDraggableStage}
          onDragEnd={handleDragEnd}
        >
          <Layer ref={layerRef}>
            {/* Clean White Studio Canvas Background */}
            <Rect x={0} y={0} width={fw} height={fh} fill="#ffffff" />

            {/* FRONT SIDE BADGE / LABEL (Positioned cleanly above dimension marks) */}
            <Group x={x0} y={frontStrapY - 38}>
              <Rect x={0} y={0} width={75} height={18} fill="#4f46e5" cornerRadius={4} />
              <Text text="FRONT SIDE" x={0} y={4.5} width={75} align="center" fontSize={9} fill="#ffffff" fontStyle="bold" />
            </Group>

            {/* BACK SIDE BADGE / LABEL (Positioned cleanly below back strip dimension marks) */}
            <Group x={x0} y={backStrapY + finishH + 32}>
              <Rect x={0} y={0} width={75} height={18} fill="#64748b" cornerRadius={4} />
              <Text text="BACK SIDE" x={0} y={4.5} width={75} align="center" fontSize={9} fill="#ffffff" fontStyle="bold" />
            </Group>

            {/* TOP OUTER DIMENSION MARKS (ABOVE FRONT STRIP) */}
            <Group y={frontBleedY - 18}>
              {dimensions.map((dim, i) => (
                <Group key={`dim-top-${i}`} x={dim.x}>
                  <Line points={[0, 10, 0, 5, dim.w, 5, dim.w, 10]} stroke="#94a3b8" strokeWidth={1.5} />
                  <Text text={dim.label} x={0} y={-7} width={dim.w} align="center" fontSize={11} fill="#64748b" fontStyle="bold" />
                </Group>
              ))}
            </Group>

            {/* BOTTOM OUTER DIMENSION MARKS (BELOW BACK STRIP) */}
            <Group y={backBleedY + bleedH + 8}>
              {dimensions.map((dim, i) => (
                <Group key={`dim-bot-${i}`} x={dim.x}>
                  <Line points={[0, 0, 0, 5, dim.w, 5, dim.w, 0]} stroke="#94a3b8" strokeWidth={1.5} />
                  <Text text={dim.label} x={0} y={10} width={dim.w} align="center" fontSize={11} fill="#64748b" fontStyle="bold" />
                </Group>
              ))}
            </Group>

            {/* FRONT BLEED OUTLINE (23.1 mm) */}
            {design.showBleed !== false && (
              <Rect 
                x={x0} 
                y={frontBleedY} 
                width={STRAP_LEN} 
                height={bleedH} 
                stroke="rgba(239, 68, 68, 0.45)" 
                strokeWidth={1.2} 
                dash={[5, 4]} 
              />
            )}

            {/* BACK BLEED OUTLINE (23.1 mm) */}
            {design.showBleed !== false && (
              <Rect 
                x={x0} 
                y={backBleedY} 
                width={STRAP_LEN} 
                height={bleedH} 
                stroke="rgba(239, 68, 68, 0.45)" 
                strokeWidth={1.2} 
                dash={[5, 4]} 
              />
            )}

            {/* ==================== FRONT SIDE STRIP ==================== */}
            <FlatStrap x={x0} y={frontStrapY} w={STRAP_LEN} h={finishH} color={strapColor} pattern={activePattern} patternOpacity={patternOpacity}>
              {/* Left Side Design Area */}
              <UnifiedStrapContent 
                x1={x1 + 6 - x0} y1={finishH / 2} x2={x2 - 6 - x0} y2={finishH / 2} 
                design={design} logoImg={logoImg} strapW={finishH} 
                onUpdateText={onUpdateText} onUpdateLogo={onUpdateLogo} onUpdateLogoItem={onUpdateLogoItem}
                onRemoveText={onRemoveText} onRemoveLogo={onRemoveLogo} showControls={showControls} zone="left" 
              />

              {/* Center Neck Area */}
              {design.lanyardDesignStyle === 'central-logo' ? (
                <StaticLogo 
                  cx={(x2 + x3) / 2 - x0} cy={finishH / 2} angle={0} logo={logoImg} strapW={finishH} 
                  logoScale={design.logoScale} logoOffset={design.copyMode === 'synchronized' ? design.logoOffset : design.logoOffsetCenter} 
                  logoRotation={design.logoRotation} onRemove={onRemoveLogo} onDrag={onUpdateLogo} showControls={showControls} design={design} 
                />
              ) : (
                <UnifiedStrapContent 
                  x1={x2 + 6 - x0} y1={finishH / 2} x2={x3 - 6 - x0} y2={finishH / 2} 
                  design={design} logoImg={logoImg} strapW={finishH} 
                  onUpdateText={onUpdateText} onUpdateLogo={onUpdateLogo} onUpdateLogoItem={onUpdateLogoItem}
                  onRemoveText={onRemoveText} onRemoveLogo={onRemoveLogo} showControls={showControls} zone="center" 
                />
              )}

              {/* Right Side Design Area (Rotated 180°) */}
              <UnifiedStrapContent 
                x1={x4 - 6 - x0} y1={finishH / 2} x2={x3 + 6 - x0} y2={finishH / 2} 
                design={design} logoImg={logoImg} strapW={finishH} 
                onUpdateText={onUpdateText} onUpdateLogo={onUpdateLogo} onUpdateLogoItem={onUpdateLogoItem}
                onRemoveText={onRemoveText} onRemoveLogo={onRemoveLogo} showControls={showControls} zone="right" 
              />
            </FlatStrap>

            {/* ==================== BACK SIDE STRIP ==================== */}
            <FlatStrap x={x0} y={backStrapY} w={STRAP_LEN} h={finishH} color={strapColor} pattern={activePattern} patternOpacity={patternOpacity}>
              {/* Back Left Side Design Area */}
              <UnifiedStrapContent 
                x1={x2 - 6 - x0} y1={finishH / 2} x2={x1 + 6 - x0} y2={finishH / 2} 
                design={design} logoImg={logoImg} strapW={finishH} 
                onUpdateText={onUpdateText} onUpdateLogo={onUpdateLogo} onUpdateLogoItem={onUpdateLogoItem}
                onRemoveText={onRemoveText} onRemoveLogo={onRemoveLogo} showControls={showControls} zone="back-left" 
              />

              {/* Back Center Neck Area */}
              {design.lanyardDesignStyle === 'central-logo' ? (
                <StaticLogo 
                  cx={(x2 + x3) / 2 - x0} cy={finishH / 2} angle={180} logo={logoImg} strapW={finishH} 
                  logoScale={design.logoScale} logoOffset={design.copyMode === 'synchronized' ? design.logoOffset : design.logoOffsetCenter} 
                  logoRotation={design.logoRotation} onRemove={onRemoveLogo} onDrag={onUpdateLogo} showControls={showControls} design={design} 
                />
              ) : (
                <UnifiedStrapContent 
                  x1={x3 - 6 - x0} y1={finishH / 2} x2={x2 + 6 - x0} y2={finishH / 2} 
                  design={design} logoImg={logoImg} strapW={finishH} 
                  onUpdateText={onUpdateText} onUpdateLogo={onUpdateLogo} onUpdateLogoItem={onUpdateLogoItem}
                  onRemoveText={onRemoveText} onRemoveLogo={onRemoveLogo} showControls={showControls} zone="back-center" 
                />
              )}

              {/* Back Right Side Design Area */}
              <UnifiedStrapContent 
                x1={x3 + 6 - x0} y1={finishH / 2} x2={x4 - 6 - x0} y2={finishH / 2} 
                design={design} logoImg={logoImg} strapW={finishH} 
                onUpdateText={onUpdateText} onUpdateLogo={onUpdateLogo} onUpdateLogoItem={onUpdateLogoItem}
                onRemoveText={onRemoveText} onRemoveLogo={onRemoveLogo} showControls={showControls} zone="back-right" 
              />
            </FlatStrap>

            {/* Subtle Vertical Section Alignment Lines Across Both Straps */}
            {[x1, x2, x3, x4].map((x, i) => (
              <Line 
                key={`section-guide-${i}`} 
                points={[x, frontBleedY - 4, x, backBleedY + bleedH + 4]} 
                stroke="rgba(148, 163, 184, 0.35)" 
                strokeWidth={1} 
                dash={[3, 3]} 
              />
            ))}

            <Transformer ref={trRef} boundBoxFunc={(oldB, newB) => (newB.width < 5 || newB.height < 5) ? oldB : newB} />
          </Layer>
        </Stage>
      </div>
    );
  }

  return (
    <div ref={containerRef} className={`flex h-full w-full items-center justify-center overflow-hidden bg-white ${isDraggableStage ? 'cursor-grab active:cursor-grabbing' : ''}`}>
      <Stage 
        ref={stageRef} 
        width={BASE_WIDTH * scale} 
        height={BASE_HEIGHT * scale} 
        scaleX={stageScale} 
        scaleY={stageScale} 
        x={stagePos.x} 
        y={stagePos.y} 
        onClick={onSelect}
        onWheel={handleWheel}
        onDblClick={handleDblClick}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        draggable={isDraggableStage}
        onDragEnd={handleDragEnd}
      >
        <Layer ref={layerRef}>
          {design.showGrid && (
            <Group>
              {
                Array.from(Array(Math.floor(BASE_WIDTH / design.gridSize)).keys()).map((i) => (
                  <Line
                    key={`v-${i}`}
                    points={[i * design.gridSize, 0, i * design.gridSize, BASE_HEIGHT]}
                    stroke="#e0e0e0"
                    strokeWidth={0.5}
                  />
                ))
              }
              {
                Array.from(Array(Math.floor(BASE_HEIGHT / design.gridSize)).keys()).map((i) => (
                  <Line
                    key={`h-${i}`}
                    points={[0, i * design.gridSize, BASE_WIDTH, i * design.gridSize]}
                    stroke="#e0e0e0"
                    strokeWidth={0.5}
                  />
                ))
              }
            </Group>
          )}
          <Rect x={0} y={0} width={BASE_WIDTH} height={BASE_HEIGHT} fill="#ffffff" />
          <DimLine x1={LX - 25} y1={TOP_Y} x2={LX - 25} y2={TOP_Y + strapW} label={design.width || '20mm'} />
          <Group>
            <ProStrap points={rightStrap} color={strapColor} strapW={strapW} pattern={activePattern} patternOpacity={patternOpacity} />
            <UnifiedStrapContent {...rightCL} design={design} logoImg={logoImg} strapW={strapW} onUpdateText={onUpdateText} onUpdateLogo={onUpdateLogo} onUpdateLogoItem={onUpdateLogoItem} onRemoveText={onRemoveText} onRemoveLogo={onRemoveLogo} showControls={showControls} zone="right" />

            <ProStrap points={barPts} color={strapColor} strapW={strapW} pattern={activePattern} patternOpacity={patternOpacity} />
            {design.lanyardDesignStyle === 'central-logo' ? (
              <StaticLogo cx={CX} cy={TOP_Y + strapW/2} angle={0} logo={logoImg} strapW={strapW} logoScale={design.logoScale} logoOffset={design.copyMode === 'synchronized' ? design.logoOffset : design.logoOffsetCenter} logoRotation={design.logoRotation} onRemove={onRemoveLogo} onDrag={onUpdateLogo} showControls={showControls} design={design} />
            ) : (
              <UnifiedStrapContent x1={LX+strapW+10} y1={TOP_Y+strapW/2} x2={RX-strapW-10} y2={TOP_Y+strapW/2} design={design} logoImg={logoImg} strapW={strapW} onUpdateText={onUpdateText} onUpdateLogo={onUpdateLogo} onUpdateLogoItem={onUpdateLogoItem} onRemoveText={onRemoveText} onRemoveLogo={onRemoveLogo} showControls={showControls} zone="center" />
            )}

            <ProStrap points={leftStrap} color={strapColor} strapW={strapW} pattern={activePattern} patternOpacity={patternOpacity} />
            <UnifiedStrapContent {...leftCL} design={design} logoImg={logoImg} strapW={strapW} onUpdateText={onUpdateText} onUpdateLogo={onUpdateLogo} onUpdateLogoItem={onUpdateLogoItem} onRemoveText={onRemoveText} onRemoveLogo={onRemoveLogo} showControls={showControls} zone="left" />

            <CornerFold side="left" ox={LX} oy={TOP_Y} strapW={strapW} color={strapColor} />
            <CornerFold side="right" ox={RX} oy={TOP_Y} strapW={strapW} color={strapColor} />
            <ProStrap points={connectorPts} color={strapColor} strapW={strapW} pattern={activePattern} patternOpacity={patternOpacity} />
            <MetalCrimp x={CX} y={CRIMP_Y} strapW={strapW} />

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
            
            {showIdCard && (
              <Group 
                x={idCardPos ? idCardPos.x : CX} 
                y={idCardPos ? idCardPos.y : TIP_Y + 20} 
                scaleX={cardScale} 
                scaleY={cardScale} 
                offsetX={cardW / 2}
                draggable={true}
                name="idCardGroup"
                onDragStart={(e) => {
                  e.cancelBubble = true;
                  const container = e.target.getStage()?.container();
                  if (container) container.style.cursor = 'grabbing';
                }}
                onDragMove={(e) => {
                  e.cancelBubble = true;
                }}
                onDragEnd={(e) => {
                  e.cancelBubble = true;
                  setIdCardPos({ x: e.target.x(), y: e.target.y() });
                  const container = e.target.getStage()?.container();
                  if (container) container.style.cursor = 'grab';
                }}
                onMouseEnter={(e) => {
                  const container = e.target.getStage()?.container();
                  if (container) container.style.cursor = 'grab';
                }}
                onMouseLeave={(e) => {
                  const container = e.target.getStage()?.container();
                  if (container) container.style.cursor = isDraggableStage ? 'grab' : 'default';
                }}
              >
                <Rect 
                  x={cardW / 2 - 15} 
                  y={5} 
                  width={30} 
                  height={10} 
                  cornerRadius={5} 
                  fill="#f3f4f6" 
                  stroke="#eef2f6" 
                  strokeWidth={1} 
                />
                <IdCardPreview isReviewStep={true} forceSide="front" />
              </Group>
            )}
          </Group>


          <Transformer
            ref={trRef}
            boundBoxFunc={(oldBox, newBox) => {
              if (newBox.width < 5 || newBox.height < 5) {
                return oldBox;
              }
              return newBox;
            }}
          />
        </Layer>
      </Stage>
    </div>
  );
}
