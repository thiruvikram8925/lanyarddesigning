import { Circle, Ellipse, Group, Line, Rect } from 'react-konva';

export function SwivelHook({ x, y, strapW }) {
  return (
    <Group x={x} y={y}>
      <Ellipse x={0} y={60} radiusX={24} radiusY={6} fill="rgba(0,0,0,0.15)" blurRadius={10} listening={false} />
      <Rect
        x={-strapW / 2} y={-4} width={strapW} height={10}
        fillLinearGradientStartPoint={{ x: -strapW / 2, y: 0 }}
        fillLinearGradientEndPoint={{ x: strapW / 2, y: 0 }}
        fillLinearGradientColorStops={[0, '#8a8e98', 0.2, '#e8eaed', 0.5, '#ffffff', 0.8, '#e8eaed', 1, '#8a8e98']}
        stroke="#4b5563" strokeWidth={0.6} cornerRadius={1}
      />
      <Line
        points={[-(strapW / 2 + 4), 2, strapW / 2 + 4, 2, strapW / 2 + 10, 12, strapW / 2 + 7, 22, -(strapW / 2 + 7), 22, -(strapW / 2 + 10), 12]}
        closed
        fillLinearGradientStartPoint={{ x: -20, y: 2 }}
        fillLinearGradientEndPoint={{ x: 20, y: 22 }}
        fillLinearGradientColorStops={[0, '#9ca3af', 0.3, '#f3f4f6', 0.5, '#ffffff', 0.8, '#d1d5db', 1, '#4b5563']}
        stroke="#374151" strokeWidth={1.2} tension={0.15}
      />
      <Rect
        x={-6} y={22} width={12} height={18}
        fillLinearGradientStartPoint={{ x: -6, y: 0 }}
        fillLinearGradientEndPoint={{ x: 6, y: 0 }}
        fillLinearGradientColorStops={[0, '#4b5563', 0.3, '#e5e7eb', 0.5, '#ffffff', 0.8, '#e5e7eb', 1, '#4b5563']}
        stroke="#374151" strokeWidth={1} cornerRadius={2}
      />
      <Group y={40}>
        <Line
          points={[-12, 0, 12, 0, 18, 15, 18, 45, 0, 58, -18, 45, -18, 15]}
          closed
          fillLinearGradientStartPoint={{ x: -18, y: 0 }}
          fillLinearGradientEndPoint={{ x: 18, y: 58 }}
          fillLinearGradientColorStops={[0, '#d1d5db', 0.2, '#f9fafb', 0.5, '#ffffff', 0.8, '#9ca3af', 1, '#374151']}
          stroke="#1f2937" strokeWidth={1.4} tension={0.35}
        />
        <Line points={[-10, 15, -10, 40, 0, 50]} stroke="rgba(0,0,0,0.25)" strokeWidth={2.5} lineCap="round" tension={0.2} />
        <Line points={[14, 15, 14, 40, 0, 52]} stroke="rgba(255,255,255,0.6)" strokeWidth={1} lineCap="round" tension={0.2} />
        <Circle
          x={12} y={30} radius={3.2}
          fillLinearGradientStartPoint={{ x: -3, y: -3 }}
          fillLinearGradientEndPoint={{ x: 3, y: 3 }}
          fillLinearGradientColorStops={[0, '#f3f4f6', 0.4, '#9ca3af', 1, '#1f2937']}
          stroke="#111827" strokeWidth={0.8}
        />
      </Group>
    </Group>
  );
}

export function PlasticHook({ x, y, strapW }) {
  const hw = strapW / 2 + 4;
  return (
    <Group x={x} y={y}>
      <Ellipse x={0} y={65} radiusX={28} radiusY={7} fill="rgba(0,0,0,0.18)" blurRadius={12} listening={false} />
      <Rect x={-strapW / 2} y={-4} width={strapW} height={10} fill="#1a1a1a" stroke="#000" strokeWidth={0.5} cornerRadius={1} />
      <Line
        points={[-hw, 0, hw, 0, hw + 8, 10, hw + 4, 24, -hw - 4, 24, -hw - 8, 10]}
        closed
        fillLinearGradientStartPoint={{ x: -hw, y: 0 }}
        fillLinearGradientEndPoint={{ x: hw, y: 24 }}
        fillLinearGradientColorStops={[0, '#333', 0.5, '#1a1a1a', 1, '#000']}
        stroke="#000" strokeWidth={1.5} tension={0.2}
      />
      <Rect
        x={-7} y={20} width={14} height={20}
        fillLinearGradientStartPoint={{ x: -7, y: 0 }}
        fillLinearGradientEndPoint={{ x: 7, y: 0 }}
        fillLinearGradientColorStops={[0, '#222', 0.5, '#333', 1, '#222']}
        stroke="#000" strokeWidth={1.5} cornerRadius={3}
      />
      <Group y={40}>
        <Line
          points={[-16, 0, 16, 0, 22, 22, 22, 50, 0, 65, -22, 50, -22, 18, -14, 18, -14, 45, 0, 55, 12, 45, 12, 22, 0, 0]}
          closed
          fillLinearGradientStartPoint={{ x: -22, y: 0 }}
          fillLinearGradientEndPoint={{ x: 22, y: 65 }}
          fillLinearGradientColorStops={[0, '#333', 0.5, '#222', 1, '#111']}
          stroke="#000" strokeWidth={1.8} tension={0.4}
        />
        <Line points={[-18, 25, -18, 45, 0, 58]} stroke="rgba(255,255,255,0.08)" strokeWidth={1.5} tension={0.3} />
      </Group>
    </Group>
  );
}

export function CrocodileClip({ x, y, strapW }) {
  return (
    <Group x={x} y={y}>
      <Ellipse x={0} y={55} radiusX={22} radiusY={6} fill="rgba(0,0,0,0.12)" blurRadius={8} listening={false} />
      <Rect
        x={-strapW / 2} y={-4} width={strapW} height={10}
        fillLinearGradientStartPoint={{ x: -strapW / 2, y: 0 }}
        fillLinearGradientEndPoint={{ x: strapW / 2, y: 0 }}
        fillLinearGradientColorStops={[0, '#9ca3af', 0.5, '#f3f4f6', 1, '#9ca3af']}
        stroke="#4b5563" strokeWidth={0.6}
      />
      <Circle x={0} y={12} radius={7} fill="#e5e7eb" stroke="#374151" strokeWidth={2.5} />
      <Circle x={0} y={12} radius={4} fill="#fff" stroke="#9ca3af" strokeWidth={0.5} />
      <Group y={18}>
        <Rect
          x={-14} y={0} width={28} height={46}
          fillLinearGradientStartPoint={{ x: -14, y: 0 }}
          fillLinearGradientEndPoint={{ x: 14, y: 46 }}
          fillLinearGradientColorStops={[0, '#d1d5db', 0.15, '#ffffff', 0.5, '#f3f4f6', 0.85, '#d1d5db', 1, '#9ca3af']}
          stroke="#374151" strokeWidth={1.2} cornerRadius={3}
        />
        {[10, 18, 26, 34, 40].map((gap, index) => (
          <Line key={index} points={[-10, gap, 10, gap]} stroke="rgba(0,0,0,0.15)" strokeWidth={1} />
        ))}
        <Circle x={0} y={38} radius={2.5} fill="#374151" />
      </Group>
    </Group>
  );
}

export function SkiReel({ x, y, strapW }) {
  return (
    <Group x={x} y={y}>
      <Ellipse x={0} y={65} radiusX={30} radiusY={8} fill="rgba(0,0,0,0.15)" blurRadius={10} listening={false} />
      <Rect x={-strapW / 2} y={-4} width={strapW} height={10} fill="#111" stroke="#000" strokeWidth={0.5} />
      <Group y={36}>
        <Circle
          radius={26}
          fillLinearGradientStartPoint={{ x: -26, y: -26 }}
          fillLinearGradientEndPoint={{ x: 26, y: 26 }}
          fillLinearGradientColorStops={[0, '#4b5563', 0.4, '#1f2937', 0.7, '#111827', 1, '#000']}
          stroke="#000" strokeWidth={1.5}
          shadowBlur={10} shadowColor="rgba(0,0,0,0.3)" shadowOffset={{ x: 2, y: 4 }}
        />
        <Circle radius={23} stroke="rgba(255,255,255,0.05)" strokeWidth={1} listening={false} />
        <Rect x={-4} y={-18} width={8} height={14} fill="#6b7280" cornerRadius={1} opacity={0.6} />
        <Group y={26}>
          <Line points={[0, 0, 0, 22]} stroke="#1f2937" strokeWidth={2} />
          <Group y={22}>
            <Rect
              x={-10} y={0} width={20} height={24}
              fillLinearGradientStartPoint={{ x: -10, y: 0 }}
              fillLinearGradientEndPoint={{ x: 10, y: 24 }}
              fillLinearGradientColorStops={[0, '#f3f4f6', 0.5, '#ffffff', 1, '#d1d5db']}
              stroke="#9ca3af" strokeWidth={0.5} cornerRadius={4}
            />
            <Circle x={0} y={12} radius={5} fillLinearGradientStartPoint={{ x: -5, y: -5 }} fillLinearGradientEndPoint={{ x: 5, y: 5 }} fillLinearGradientColorStops={[0, '#f9fafb', 1, '#9ca3af']} stroke="#4b5563" strokeWidth={0.8} />
          </Group>
        </Group>
      </Group>
    </Group>
  );
}

export function SideReleaseBuckle({ x, y, strapW, strapColor }) {
  const hw = Math.max(26, strapW * 0.98);
  return (
    <Group x={x} y={y}>
      <Ellipse x={0} y={60} radiusX={35} radiusY={10} fill="rgba(0,0,0,0.12)" blurRadius={15} listening={false} />
      <Rect x={-strapW / 2} y={-5} width={strapW} height={12} fill={strapColor} stroke="rgba(0,0,0,0.1)" strokeWidth={0.6} />
      <Line
        points={[-hw, 0, hw, 0, hw + 8, 10, hw + 8, 45, hw, 55, -hw, 55, -hw - 8, 45, -hw - 8, 10]}
        closed
        fillLinearGradientStartPoint={{ x: -hw, y: 0 }}
        fillLinearGradientEndPoint={{ x: hw, y: 55 }}
        fillLinearGradientColorStops={[0, '#333', 0.3, '#444', 0.5, '#222', 1, '#111']}
        stroke="#000" strokeWidth={1} lineCap="round" lineJoin="round"
      />
      <Rect x={-strapW / 2 + 4} y={12} width={strapW - 8} height={32} fill="#111" stroke="#000" strokeWidth={0.6} cornerRadius={2} />
      <Group y={65}>
        <Circle
          radius={22}
          fillLinearGradientStartPoint={{ x: -22, y: -22 }}
          fillLinearGradientEndPoint={{ x: 22, y: 22 }}
          fillLinearGradientColorStops={[0, '#f9fafb', 0.5, '#ffffff', 1, '#d1d5db']}
          stroke="#9ca3af" strokeWidth={3.5}
        />
        <Circle radius={18} stroke="rgba(0,0,0,0.05)" strokeWidth={1} />
      </Group>
    </Group>
  );
}

export function MetalCrimp({ x, y, strapW }) {
  const width = strapW + 12;
  return (
    <Group x={x} y={y}>
      <Rect
        x={-width / 2} y={0} width={width} height={34}
        fillLinearGradientStartPoint={{ x: -width / 2, y: 0 }}
        fillLinearGradientEndPoint={{ x: width / 2, y: 0 }}
        fillLinearGradientColorStops={[0, '#8a8e98', 0.15, '#d1d5db', 0.45, '#ffffff', 0.8, '#d1d5db', 1, '#8a8e98']}
        stroke="#374151" strokeWidth={0.8} cornerRadius={2}
      />
      <Line points={[-width / 2 + 3, 8, width / 2 - 3, 8]} stroke="rgba(0,0,0,0.1)" strokeWidth={0.6} />
      <Line points={[-width / 2 + 3, 26, width / 2 - 3, 26]} stroke="rgba(0,0,0,0.1)" strokeWidth={0.6} />
      {[12, 16, 20].map((ridgeY) => (
        <Line key={ridgeY} points={[-width / 2 + 5, ridgeY, width / 2 - 5, ridgeY]} stroke="rgba(255,255,255,0.3)" strokeWidth={0.5} opacity={0.5} />
      ))}
    </Group>
  );
}

export function SafetyBreakaway({ x, y, strapW }) {
  const width = Math.max(34, strapW * 1.15);
  return (
    <Group x={x} y={y}>
      {/* Left split clasp */}
      <Rect
        x={-width / 2} y={-7} width={width / 2 - 1} height={14}
        fillLinearGradientStartPoint={{ x: -width / 2, y: -7 }}
        fillLinearGradientEndPoint={{ x: 0, y: 7 }}
        fillLinearGradientColorStops={[0, '#334155', 0.5, '#1e293b', 1, '#0f172a']}
        stroke="#000" strokeWidth={0.8} cornerRadius={[4, 0, 0, 4]}
      />
      {/* Right split clasp */}
      <Rect
        x={1} y={-7} width={width / 2 - 1} height={14}
        fillLinearGradientStartPoint={{ x: 0, y: -7 }}
        fillLinearGradientEndPoint={{ x: width / 2, y: 7 }}
        fillLinearGradientColorStops={[0, '#475569', 0.5, '#334155', 1, '#1e293b']}
        stroke="#000" strokeWidth={0.8} cornerRadius={[0, 4, 4, 0]}
      />
      {/* Red safety indicator seam */}
      <Line points={[0, -9, 0, 9]} stroke="#ef4444" strokeWidth={1.5} lineCap="round" />
    </Group>
  );
}

export function CardHolder({
  x,
  y,
  cardWidth = 130,
  cardHeight = 210,
  cardScale = 0.68,
  children,
}) {
  const displayCardWidth = cardWidth * cardScale;
  const displayCardHeight = cardHeight * cardScale;
  const sleevePadX = 8;
  const sleevePadTop = 10;
  const sleevePadBottom = 10;
  const sleeveWidth = displayCardWidth + sleevePadX * 2;
  const sleeveHeight = displayCardHeight + sleevePadTop + sleevePadBottom;
  const sleeveY = 38;

  return (
    <Group x={x} y={y}>
      <Ellipse
        x={0}
        y={sleeveY + sleeveHeight + 8}
        radiusX={Math.max(34, sleeveWidth * 0.34)}
        radiusY={8}
        fill="rgba(15,23,42,0.14)"
        blurRadius={12}
        listening={false}
      />

      {/* Short connecting pin from clip to card */}
      <Line
        points={[0, 0, 0, 12]}
        stroke="#cbd5e1"
        strokeWidth={2.2}
        lineCap="round"
        listening={false}
      />

      {/* Small ring */}
      <Group y={14}>
        <Circle
          radius={8}
          fillLinearGradientStartPoint={{ x: -8, y: -8 }}
          fillLinearGradientEndPoint={{ x: 8, y: 8 }}
          fillLinearGradientColorStops={[0, '#e2e8f0', 0.48, '#ffffff', 1, '#94a3b8']}
          stroke="#4b5563"
          strokeWidth={1.2}
        />
        <Circle radius={4.5} fill="transparent" stroke="#cbd5e1" strokeWidth={1} />
      </Group>

      {/* Card clip tab */}
      <Group y={sleeveY - 12}>
        <Rect
          x={-14}
          y={0}
          width={28}
          height={16}
          fillLinearGradientStartPoint={{ x: -14, y: 0 }}
          fillLinearGradientEndPoint={{ x: 14, y: 16 }}
          fillLinearGradientColorStops={[0, '#e2e8f0', 0.5, '#f8fafc', 1, '#cbd5e1']}
          stroke="rgba(148,163,184,0.6)"
          strokeWidth={1}
          cornerRadius={4}
        />
        <Rect
          x={-8}
          y={4}
          width={16}
          height={5}
          fill="rgba(255,255,255,0.8)"
          stroke="rgba(148,163,184,0.4)"
          strokeWidth={0.7}
          cornerRadius={3}
        />
      </Group>

      <Group y={sleeveY}>
        {children ? (
          <Group
            x={-(displayCardWidth / 2)}
            y={sleevePadTop}
            scaleX={cardScale}
            scaleY={cardScale}
          >
            {children}
          </Group>
        ) : null}

        <Rect
          x={-(sleeveWidth / 2)}
          y={0}
          width={sleeveWidth}
          height={sleeveHeight}
          fill="rgba(255,255,255,0.18)"
          stroke="rgba(148,163,184,0.64)"
          strokeWidth={1.6}
          cornerRadius={10}
          shadowColor="rgba(15,23,42,0.08)"
          shadowBlur={10}
          shadowOffsetY={6}
        />
        <Rect
          x={-(sleeveWidth / 2) + 6}
          y={6}
          width={sleeveWidth - 12}
          height={sleeveHeight - 12}
          fill="rgba(255,255,255,0.07)"
          stroke="rgba(255,255,255,0.55)"
          strokeWidth={0.8}
          cornerRadius={7}
        />
        <Line
          points={[
            -(sleeveWidth / 2) + 12, 8,
            -(sleeveWidth / 2) + 24, 8,
            (sleeveWidth / 2) - 18, sleeveHeight - 10,
            (sleeveWidth / 2) - 8, sleeveHeight - 10,
          ]}
          stroke="rgba(255,255,255,0.32)"
          strokeWidth={4}
          lineCap="round"
          listening={false}
        />
      </Group>
    </Group>
  );
}
