import { memo, useMemo } from 'react';
import { Circle, Group, Line, Rect, Shape } from 'react-konva';

function seededRandom(seed) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function HazardStripesPatternComponent({ minX, minY, maxX, maxY, w, h, strapW, colors }) {
  const colorA = colors[0];
  const colorB = colors[1] || 'rgba(255,255,255,0.16)';
  const colorKey = colors.join('|');
  const items = useMemo(() => {
    const nodes = [];
    const isHoriz = w > h * 1.5;
    const spacing = Math.max(18, strapW * 0.8);
    let idx = 0;

    if (isHoriz) {
      for (let x = minX - 120; x < maxX + 120; x += spacing) {
        nodes.push(
          <Line
            key={idx++}
            points={[x, minY - 24, x + strapW * 1.2, maxY + 24]}
            stroke={colorA}
            strokeWidth={Math.max(6, strapW * 0.24)}
            opacity={0.85}
            lineCap="round"
          />,
        );
        nodes.push(
          <Line
            key={idx++}
            points={[x + spacing * 0.45, minY - 24, x + spacing * 0.45 + strapW * 1.2, maxY + 24]}
            stroke={colorB}
            strokeWidth={1.2}
            opacity={0.6}
            dash={[3, 5]}
          />,
        );
      }
    } else {
      for (let y = minY - 120; y < maxY + 120; y += spacing) {
        nodes.push(
          <Line
            key={idx++}
            points={[minX - 24, y, maxX + 24, y + strapW * 1.2]}
            stroke={colorA}
            strokeWidth={Math.max(6, strapW * 0.24)}
            opacity={0.85}
            lineCap="round"
          />,
        );
        nodes.push(
          <Line
            key={idx++}
            points={[minX - 24, y + spacing * 0.45, maxX + 24, y + spacing * 0.45 + strapW * 1.2]}
            stroke={colorB}
            strokeWidth={1.2}
            opacity={0.6}
            dash={[3, 5]}
          />,
        );
      }
    }

    return nodes;
  }, [colorA, colorB, colorKey, h, maxX, maxY, minX, minY, strapW, w]);

  return <Group>{items}</Group>;
}

function PinstripesPatternComponent({ minX, minY, maxX, maxY, w, h, strapW, colors }) {
  const base = colors[0];
  const accent = colors[1] || colors[0];
  const colorKey = colors.join('|');
  const items = useMemo(() => {
    const nodes = [];
    const isHoriz = w > h * 1.5;
    const spacing = Math.max(7, strapW * 0.18);
    let idx = 0;

    if (isHoriz) {
      for (let y = minY; y <= maxY; y += spacing) {
        const isAccent = Math.round((y - minY) / spacing) % 6 === 0;
        nodes.push(
          <Line
            key={idx++}
            points={[minX - 10, y, maxX + 10, y]}
            stroke={isAccent ? accent : base}
            strokeWidth={isAccent ? 1.2 : 0.7}
            opacity={isAccent ? 0.55 : 0.28}
          />,
        );
      }
    } else {
      for (let x = minX; x <= maxX; x += spacing) {
        const isAccent = Math.round((x - minX) / spacing) % 6 === 0;
        nodes.push(
          <Line
            key={idx++}
            points={[x, minY - 10, x, maxY + 10]}
            stroke={isAccent ? accent : base}
            strokeWidth={isAccent ? 1.2 : 0.7}
            opacity={isAccent ? 0.55 : 0.28}
          />,
        );
      }
    }

    return nodes;
  }, [accent, base, colorKey, h, maxX, maxY, minX, minY, strapW, w]);

  return <Group>{items}</Group>;
}

function RoleBandsPatternComponent({ minX, minY, maxX, maxY, w, h, strapW, colors }) {
  const colorKey = colors.join('|');
  const items = useMemo(() => {
    const nodes = [];
    const isHoriz = w > h * 1.5;
    const total = isHoriz ? w : h;
    const band = Math.max(24, strapW * 1.05);
    let idx = 0;

    for (let offset = 0; offset < total + band; offset += band * 1.45) {
      const primary = colors[(idx / 2) % colors.length];
      if (isHoriz) {
        nodes.push(<Rect key={idx++} x={minX + offset} y={minY} width={band} height={h} fill={primary} opacity={0.78} />);
        nodes.push(<Rect key={idx++} x={minX + offset + band * 0.48} y={minY} width={Math.max(8, band * 0.14)} height={h} fill={colors[2] || 'rgba(255,255,255,0.9)'} opacity={0.9} />);
      } else {
        nodes.push(<Rect key={idx++} x={minX} y={minY + offset} width={w} height={band} fill={primary} opacity={0.78} />);
        nodes.push(<Rect key={idx++} x={minX} y={minY + offset + band * 0.48} width={w} height={Math.max(8, band * 0.14)} fill={colors[2] || 'rgba(255,255,255,0.9)'} opacity={0.9} />);
      }
    }

    return nodes;
  }, [colorKey, colors, h, minX, minY, strapW, w]);

  return <Group>{items}</Group>;
}

function ModularNodesPatternComponent({ minX, minY, maxX, maxY, w, h, strapW, colors }) {
  const colorKey = colors.join('|');
  const items = useMemo(() => {
    const nodes = [];
    const isHoriz = w > h * 1.5;
    const spacing = Math.max(28, strapW * 1.1);
    const railStroke = Math.max(2, strapW * 0.08);
    let idx = 0;

    if (isHoriz) {
      const centerY = (minY + maxY) / 2;
      nodes.push(<Line key={idx++} points={[minX - 10, centerY, maxX + 10, centerY]} stroke={colors[2] || colors[0]} strokeWidth={railStroke} opacity={0.42} />);
      for (let x = minX + spacing * 0.4; x < maxX; x += spacing) {
        nodes.push(<Circle key={idx++} x={x} y={centerY} radius={Math.max(4, strapW * 0.14)} fill={colors[0]} opacity={0.82} />);
        nodes.push(<Rect key={idx++} x={x + 7} y={centerY - strapW * 0.1} width={Math.max(12, strapW * 0.45)} height={Math.max(4, strapW * 0.2)} cornerRadius={999} fill={colors[1] || colors[0]} opacity={0.5} />);
        nodes.push(<Line key={idx++} points={[x, centerY, x, centerY - strapW * 0.45]} stroke={colors[1] || colors[0]} strokeWidth={1.5} opacity={0.55} />);
      }
    } else {
      const centerX = (minX + maxX) / 2;
      nodes.push(<Line key={idx++} points={[centerX, minY - 10, centerX, maxY + 10]} stroke={colors[2] || colors[0]} strokeWidth={railStroke} opacity={0.42} />);
      for (let y = minY + spacing * 0.4; y < maxY; y += spacing) {
        nodes.push(<Circle key={idx++} x={centerX} y={y} radius={Math.max(4, strapW * 0.14)} fill={colors[0]} opacity={0.82} />);
        nodes.push(<Rect key={idx++} x={centerX - strapW * 0.1} y={y + 7} width={Math.max(4, strapW * 0.2)} height={Math.max(12, strapW * 0.45)} cornerRadius={999} fill={colors[1] || colors[0]} opacity={0.5} />);
        nodes.push(<Line key={idx++} points={[centerX, y, centerX + strapW * 0.45, y]} stroke={colors[1] || colors[0]} strokeWidth={1.5} opacity={0.55} />);
      }
    }

    return nodes;
  }, [colorKey, colors, maxX, maxY, minX, minY, strapW, w, h]);

  return <Group>{items}</Group>;
}

function LeafShape({ x, y, size, fill, rotation = 0 }) {
  return (
    <Shape
      x={x}
      y={y}
      rotation={rotation}
      fill={fill}
      opacity={0.88}
      sceneFunc={(ctx, shape) => {
        ctx.beginPath();
        ctx.moveTo(0, -size);
        ctx.bezierCurveTo(size * 0.72, -size * 0.45, size * 0.62, size * 0.52, 0, size);
        ctx.bezierCurveTo(-size * 0.62, size * 0.52, -size * 0.72, -size * 0.45, 0, -size);
        ctx.closePath();
        ctx.fillStrokeShape(shape);
      }}
    />
  );
}

function LeafSilhouettePatternComponent({ minX, minY, maxX, maxY, w, h, strapW, colors }) {
  const colorKey = colors.join('|');
  const items = useMemo(() => {
    const rand = seededRandom(616);
    const nodes = [];
    const count = Math.max(8, Math.floor(Math.max(w, h) / Math.max(18, strapW * 0.55)));

    for (let i = 0; i < count; i++) {
      const x = minX + rand() * w;
      const y = minY + rand() * h;
      const size = Math.max(10, strapW * (0.38 + rand() * 0.45));
      const rotation = -45 + rand() * 90;
      const fill = colors[i % colors.length];
      nodes.push(<LeafShape key={`leaf-${i}`} x={x} y={y} size={size} fill={fill} rotation={rotation} />);
      nodes.push(
        <Line
          key={`stem-${i}`}
          points={[x, y - size * 0.55, x, y + size * 0.55]}
          stroke={colors[2] || 'rgba(255,255,255,0.18)'}
          strokeWidth={0.8}
          opacity={0.45}
          rotation={rotation}
        />,
      );
    }

    return nodes;
  }, [colorKey, colors, h, minX, minY, strapW, w]);

  return <Group>{items}</Group>;
}

function WatercolorBloomPatternComponent({ minX, minY, maxX, maxY, w, h, strapW, colors }) {
  const colorKey = colors.join('|');
  const items = useMemo(() => {
    const rand = seededRandom(717);
    const nodes = [];
    const count = Math.max(6, Math.floor(Math.max(w, h) / Math.max(24, strapW)));

    for (let i = 0; i < count; i++) {
      const cx = minX + rand() * w;
      const cy = minY + rand() * h;
      const radius = strapW * (0.35 + rand() * 0.45);
      const pts = [];
      for (let a = 0; a < 9; a++) {
        const angle = (Math.PI * 2 * a) / 9;
        const dist = radius * (0.65 + rand() * 0.5);
        pts.push(cx + Math.cos(angle) * dist, cy + Math.sin(angle) * dist);
      }
      nodes.push(<Line key={`blob-${i}`} points={pts} closed fill={colors[i % colors.length]} tension={0.65} opacity={0.62} />);
      nodes.push(<Circle key={`core-${i}`} x={cx} y={cy} radius={radius * 0.28} fill={colors[(i + 1) % colors.length]} opacity={0.24} />);
    }

    return nodes;
  }, [colorKey, colors, h, minX, minY, strapW, w]);

  return <Group>{items}</Group>;
}

export const HazardStripesPattern = memo(HazardStripesPatternComponent);
export const PinstripesPattern = memo(PinstripesPatternComponent);
export const RoleBandsPattern = memo(RoleBandsPatternComponent);
export const ModularNodesPattern = memo(ModularNodesPatternComponent);
export const LeafSilhouettePattern = memo(LeafSilhouettePatternComponent);
export const WatercolorBloomPattern = memo(WatercolorBloomPatternComponent);
