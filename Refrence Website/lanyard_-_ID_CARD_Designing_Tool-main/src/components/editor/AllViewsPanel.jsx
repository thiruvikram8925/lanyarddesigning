import { useState, useEffect, useRef } from 'react';
import { useConfiguratorStore } from '../../store/useConfiguratorStore';
import { getLanyardStageGeometry } from '../../lib/strapArtwork';
import { Stage, Layer, Group, Rect, Text, Line } from 'react-konva';

const THUMB_W = 90;
const THUMB_H = 130;

function StrapThumbnail({ zone, design, strapColor }) {
  const { CX, TOP_Y, SPREAD, strapW, TIP_Y, CRIMP_Y, leftCL, rightCL, barPts } = getLanyardStageGeometry(design.width, design.length);
  
  // Each thumbnail renders a simplified single-zone strap preview
  const scale = THUMB_W / 820;
  
  return (
    <Stage width={THUMB_W} height={THUMB_H} scaleX={scale} scaleY={scale}>
      <Layer>
        <Rect x={0} y={0} width={820} height={820/THUMB_W*THUMB_H} fill="#f1f5f9" />
        {/* Simplified strap lines */}
        {zone === 'left' && <Line points={[CX - SPREAD, TOP_Y, CX, CRIMP_Y]} stroke={strapColor} strokeWidth={strapW} lineCap="round" />}
        {zone === 'right' && <Line points={[CX + SPREAD, TOP_Y, CX, CRIMP_Y]} stroke={strapColor} strokeWidth={strapW} lineCap="round" />}
        {zone === 'center' && <Line points={[CX - SPREAD, TOP_Y + strapW/2, CX + SPREAD, TOP_Y + strapW/2]} stroke={strapColor} strokeWidth={strapW} lineCap="round" />}
        {zone === 'full' && (
          <>
            <Line points={[CX - SPREAD, TOP_Y, CX, CRIMP_Y]} stroke={strapColor} strokeWidth={strapW} lineCap="round" />
            <Line points={[CX + SPREAD, TOP_Y, CX, CRIMP_Y]} stroke={strapColor} strokeWidth={strapW} lineCap="round" />
            <Line points={[CX - SPREAD, TOP_Y + strapW/2, CX + SPREAD, TOP_Y + strapW/2]} stroke={strapColor} strokeWidth={strapW} lineCap="round" />
          </>
        )}
        {(design.text) && (
          <Text
            text={design.text}
            fontSize={Math.max(8, strapW * 0.5)}
            fill={design.textColor || '#000000'}
            fontFamily={design.fontFamily || 'Inter'}
            x={zone === 'left' ? CX - SPREAD + 10 : zone === 'right' ? CX + 10 : CX - 60}
            y={zone === 'center' ? TOP_Y : (CRIMP_Y + TOP_Y) / 2}
            rotation={zone === 'left' ? 68 : zone === 'right' ? -68 : 0}
            align="center"
            width={100}
            wrap="none"
          />
        )}
      </Layer>
    </Stage>
  );
}

const VIEWS = [
  { key: 'full-3d', label: '3D Wear View', icon: '👔' },
  { key: 'flat-front', label: 'Flat Front', icon: '▭' },
  { key: 'flat-back', label: 'Flat Back', icon: '↔' },
  { key: 'left', label: 'Left Strap', icon: '◁' },
  { key: 'right', label: 'Right Strap', icon: '▷' },
  { key: 'center', label: 'Neck Bar', icon: '—' },
];

export default function AllViewsPanel({ activeView = 'full-3d', onSelectView }) {
  const design = useConfiguratorStore(s => s.design);
  const strapColor = design.lanyardColor || '#ffffff';
  
  return (
    <div className="p-3 space-y-2">
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">All Views</p>
      <div className="grid grid-cols-2 gap-2">
        {VIEWS.map(view => (
          <button
            key={view.key}
            onClick={() => onSelectView?.(view.key)}
            className={`relative rounded-xl border-2 overflow-hidden transition-all cursor-pointer ${
              activeView === view.key
                ? 'border-indigo-500 ring-2 ring-indigo-500/30 shadow-sm'
                : 'border-slate-200 hover:border-indigo-300'
            }`}
          >
            <div className="bg-slate-100 flex items-center justify-center" style={{ height: 80 }}>
              {view.key === 'full-3d' || view.key === 'flat-front' || view.key === 'flat-back' ? (
                <StrapThumbnail zone="full" design={design} strapColor={strapColor} />
              ) : (
                <StrapThumbnail zone={view.key} design={design} strapColor={strapColor} />
              )}
            </div>
            <div className="bg-white px-2 py-1.5 text-center">
              <p className="text-[9px] font-bold text-slate-700">{view.icon} {view.label}</p>
            </div>
            {activeView === view.key && (
              <div className="absolute top-1 right-1 w-3 h-3 rounded-full bg-indigo-500" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
