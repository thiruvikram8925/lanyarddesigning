import React, { useMemo, useState, useCallback } from 'react';
import { Stage, Layer, Group, Text, Rect, Image, Transformer } from 'react-konva';
import { useConfiguratorStore } from '../store/useConfiguratorStore';
import { useCanvasImage } from '../hooks/useCanvasImage';
import StrapPatternRenderer from './StrapPatternRenderer';
import { getPatternById } from '../data/strapPatterns';

const RULER_H = 18;

function RulerMarks({ widthMm, strapWidthPx }) {
  const marks = [];
  const step = widthMm <= 16 ? 4 : 5;
  for (let i = 0; i <= widthMm; i += step) {
    const x = (i / widthMm) * strapWidthPx;
    marks.push(<Rect key={`t${i}`} x={x} y={0} width={1} height={i % 10 === 0 ? 8 : 4} fill="#94a3b8" />);
    if (i > 0 && i < widthMm && i % 10 === 0) {
      marks.push(<Text key={`l${i}`} text={`${i}mm`} x={x + 2} y={2} fontSize={6} fill="#64748b" />);
    }
  }
  return <>{marks}</>;
}

export default function FlatStrapView({ frontStageRef, backStageRef }) {
  const storeDesign = useConfiguratorStore((s) => s.design);
  const livePreviewPatch = useConfiguratorStore((s) => s.livePreviewPatch);
  const setField = useConfiguratorStore((s) => s.setField);
  const design = useMemo(() => ({ ...storeDesign, ...livePreviewPatch }), [storeDesign, livePreviewPatch]);

  const logoImg = useCanvasImage(design.logoUrl);
  const customPatternImg = useCanvasImage(design.customPatternUrl);

  // Panel dimensions
  const panelHeight = 580;
  const widthMm = parseInt(design.width || '20');
  const strapWidthPx = Math.max(48, widthMm * 3.2);

  const strapColor = design.lanyardColor || '#cc1111';
  const patternOpacity = design.strapPatternOpacity ?? 0.85;
  const activePattern = getPatternById(design.strapPattern);

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

  const fontSize = Math.min(design.fontSize || 16, strapWidthPx * 0.55);
  const textColor = design.textColor || design.fontColor || '#000000';
  const fontFamily = design.fontFamily || 'Montserrat';
  const fontStyle = design.fontWeight || 'bold';

  // Gradient or solid fill
  const isGrad = typeof strapColor === 'string' && strapColor.includes('gradient');
  const baseColorMatch = isGrad ? strapColor.match(/#[a-fA-F0-9]{6}/g) : null;
  const fillProps = isGrad && baseColorMatch?.length >= 2
    ? { fillLinearGradientStartPoint: { x: 0, y: 0 }, fillLinearGradientEndPoint: { x: strapWidthPx, y: 0 }, fillLinearGradientColorStops: [0, baseColorMatch[0], 1, baseColorMatch[1]] }
    : { fill: strapColor || '#cc1111' };

  // Custom pattern image tiled
  const renderCustomPattern = useCallback(() => {
    if (!customPatternImg) return null;
    const scale = (design.patternScale || 100) / 100;
    const imgW = Math.max(customPatternImg.width * scale, 10);
    const imgH = Math.max(customPatternImg.height * scale, 10);
    const tiles = [];
    for (let tx = 0; tx < strapWidthPx + imgW; tx += imgW) {
      for (let ty = 0; ty < panelHeight + imgH; ty += imgH) {
        tiles.push(<Image key={`${tx}-${ty}`} image={customPatternImg} x={tx} y={ty} width={imgW} height={imgH} listening={false} />);
      }
    }
    return (
      <Group
        clipFunc={(ctx) => { ctx.beginPath(); ctx.rect(0, 0, strapWidthPx, panelHeight); ctx.closePath(); }}
        opacity={patternOpacity}
        listening={false}
      >
        {tiles}
      </Group>
    );
  }, [customPatternImg, design.patternScale, strapWidthPx, panelHeight, patternOpacity]);

  // Render text items (draggable on front panel only)
  const renderTextItems = (isBack, isDraggable) => {
    const items = [];
    const alongScale = panelHeight / 800;
    const crossScale = strapWidthPx / 60;

    textBlocks.forEach((block) => {
      const bText = block.text || '';
      const bL2 = block.textLine2 || '';
      const bL3 = block.textLine3 || '';
      if (!bText) return;

      const bLines = [bText, bL2, bL3].filter(Boolean);
      const bMaxLen = bLines.length > 0 ? Math.max(...bLines.map(l => l.length || 0)) : 0;
      const bFs = Math.min(block.fontSize || 16, strapWidthPx * 0.55);
      const bTextW = bMaxLen * bFs;
      const bLineCount = bLines.length;
      const bLineH = bFs * 1.4;
      const bBlockH = bLineCount * bLineH;

      const fsVirtual = Math.min(block.fontSize || 16, 60 * 0.7);
      const textWVirtual = bMaxLen * fsVirtual * 1.1;
      const lgWVirtual = logoImg ? (60 * 0.8 * (logoImg.width / logoImg.height) * (design.logoScale || 1)) : 0;

      const gapVirtual = Math.max(30, (design.textSpacing || 60) * 2 + textWVirtual + lgWVirtual);
      const count = Math.max(1, Math.floor(800 / gapVirtual));

      for (let i = 0; i < count; i++) {
        const baseDistanceVirtual = (800 / (count + 1)) * (i + 1);
        let dVirtualText = baseDistanceVirtual + (block.textOffset || 0);
        dVirtualText = (dVirtualText % 800 + 800) % 800;

        const baseY = dVirtualText * alongScale;
        const baseX = strapWidthPx / 2 + (block.textYOffset || 0) * crossScale;
        const clampedX = Math.max(bBlockH / 2, Math.min(strapWidthPx - bBlockH / 2, baseX));
        const clampedY = Math.max(RULER_H + bTextW / 2, Math.min(panelHeight - bTextW / 2, baseY));

        items.push(
          <Group
            key={`text-g-${block.id}-${i}`}
            x={clampedX}
            y={clampedY}
            rotation={90}
            scaleX={isBack ? -1 : 1}
            draggable={isDraggable && i === 0}
            onDragEnd={(e) => {
              if (!isDraggable || i !== 0) return;
              const node = e.currentTarget;
              
              const newAlongOffset = (node.y() / alongScale) - baseDistanceVirtual;
              const newCrossOffset = (node.x() - strapWidthPx / 2) / crossScale;

              const setField = useConfiguratorStore.getState().setField;
              setField(`design.textBlocks`, textBlocks.map(b => b.id === block.id ? { ...b, textOffset: newAlongOffset, textYOffset: newCrossOffset } : b));
            }}
            onMouseEnter={(e) => { if (isDraggable && i === 0) e.currentTarget.getStage().container().style.cursor = 'grab'; }}
            onMouseLeave={(e) => { e.currentTarget.getStage().container().style.cursor = 'default'; }}
          >
            {bLines.map((lineText, li) => (
              <Text
                key={`line-${li}`}
                text={lineText}
                fontSize={bFs}
                fontFamily={block.fontFamily || fontFamily}
                fontStyle={block.fontWeight || fontStyle}
                fill={block.textColor || textColor}
                align="center"
                width={bTextW}
                x={0}
                y={-bBlockH / 2 + li * bLineH}
                offsetX={bTextW / 2}
                offsetY={0}
                listening={isDraggable && i === 0}
              />
            ))}
            {isDraggable && i === 0 && (
              <Rect
                x={-bTextW / 2 - 4}
                y={-bBlockH / 2 - 4}
                width={bTextW + 8}
                height={bBlockH + 8}
                stroke="rgba(99,102,241,0.6)"
                strokeWidth={1}
                dash={[4, 3]}
                fill="rgba(99,102,241,0.05)"
                cornerRadius={3}
                listening={true}
              />
            )}
          </Group>
        );
      }
    });

    if (logoImg && !design.forceNoLogo) {
      const logoScale = design.logoScale || 1;
      const targetH = strapWidthPx * 0.7 * logoScale;
      const targetW = targetH * (logoImg.width / logoImg.height);

      const fsVirtual = 16;
      const maxLen = textBlocks.length > 0 ? Math.max(...textBlocks.map(b => (b.text || '').length)) : 0;
      const textWVirtual = maxLen * fsVirtual * 1.1;
      const lgWVirtual = 60 * 0.8 * (logoImg.width / logoImg.height) * logoScale;

      const gapVirtual = Math.max(30, (design.textSpacing || 60) * 2 + textWVirtual + lgWVirtual);
      const count = Math.max(1, Math.floor(800 / gapVirtual));
      
      for (let i = 0; i < count; i++) {
        const baseDistanceVirtual = (800 / (count + 1)) * (i + 1);
        const refTextOffset = textBlocks[0]?.textOffset || 0;
        let dVirtualLogo = baseDistanceVirtual + refTextOffset + (textWVirtual + 15);
        dVirtualLogo = (dVirtualLogo % 800 + 800) % 800;

        const logoY = dVirtualLogo * alongScale + (design.logoYOffset || 0);
        const logoX = strapWidthPx / 2 + (design.logoOffset || 0) * crossScale;
        items.push(
          <Group
            key={`logo-g-${i}`}
            x={logoX}
            y={Math.min(panelHeight - targetH / 2 - 5, logoY)}
            rotation={90}
            scaleX={isBack ? -1 : 1}
          >
            <Image
              image={logoImg}
              width={targetW}
              height={targetH}
              offsetX={targetW / 2}
              offsetY={targetH / 2}
              rotation={design.logoRotation || 0}
              listening={false}
            />
          </Group>
        );
      }
    }

    return items;
  };

  const hasContent = textBlocks.some(b => b.text) || logoImg;

  return (
    <div className="flex flex-col items-center gap-6 p-6 bg-[#f0f4f8] min-h-full">
      {/* Hint */}
      {hasContent && (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 border border-indigo-200 rounded-full text-[10px] font-semibold text-indigo-700">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
          Drag the dashed selection on Front to reposition text — updates live in 3D
        </div>
      )}

      <div className="flex gap-10 items-start justify-center flex-wrap">
        {/* FRONT Panel */}
        <div className="flex flex-col items-center gap-3">
          <div
            className="rounded-2xl shadow-xl overflow-hidden border-2 border-slate-300 bg-white"
            style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.14)' }}
          >
            <Stage width={strapWidthPx} height={panelHeight + RULER_H} ref={frontStageRef}>
              <Layer>
                {/* Ruler */}
                <Rect x={0} y={0} width={strapWidthPx} height={RULER_H} fill="#f8fafc" />
                <RulerMarks widthMm={widthMm} strapWidthPx={strapWidthPx} />
                {/* Strap */}
                <Group y={RULER_H}>
                  <Rect x={0} y={0} width={strapWidthPx} height={panelHeight} {...fillProps} />
                  {/* Pattern: custom image OR built-in */}
                  {customPatternImg ? renderCustomPattern() : (
                    <StrapPatternRenderer
                      clipPoints={[0, 0, strapWidthPx, 0, strapWidthPx, panelHeight, 0, panelHeight]}
                      pattern={activePattern}
                      strapW={strapWidthPx}
                      opacity={patternOpacity}
                    />
                  )}
                  {/* Edge stitching lines */}
                  <Rect x={2} y={0} width={1} height={panelHeight} fill="rgba(255,255,255,0.25)" listening={false} />
                  <Rect x={strapWidthPx - 3} y={0} width={1} height={panelHeight} fill="rgba(255,255,255,0.25)" listening={false} />
                  {/* Bleed zone */}
                  <Rect x={3} y={3} width={strapWidthPx - 6} height={panelHeight - 6} stroke="rgba(255,100,100,0.35)" strokeWidth={0.8} dash={[5, 3]} fill="transparent" cornerRadius={1} listening={false} />
                  {!hasContent && (
                    <Text text="← Add text or upload a logo" x={4} y={panelHeight / 2 - 8} fontSize={8} fill="rgba(255,255,255,0.5)" rotation={90} align="center" width={panelHeight} offsetY={8} listening={false} />
                  )}
                  {renderTextItems(false, true)}
                </Group>
              </Layer>
            </Stage>
          </div>
          <div className="flex flex-col items-center gap-1">
            <span className="text-[11px] font-black text-slate-700 uppercase tracking-widest">Front</span>
            <span className="text-[9px] text-slate-400">Drag to reposition</span>
          </div>
        </div>

        {/* Separator */}
        <div className="flex flex-col items-center justify-center h-full gap-2 pt-16 opacity-40">
          <div className="w-px bg-slate-400" style={{ height: panelHeight / 2 }} />
          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest rotate-90 whitespace-nowrap">Mirror</span>
          <div className="w-px bg-slate-400" style={{ height: panelHeight / 2 }} />
        </div>

        {/* BACK Panel */}
        <div className="flex flex-col items-center gap-3">
          <div
            className="rounded-2xl shadow-xl overflow-hidden border-2 border-slate-300 bg-white opacity-90"
            style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.10)' }}
          >
            <Stage width={strapWidthPx} height={panelHeight + RULER_H} ref={backStageRef}>
              <Layer>
                <Rect x={0} y={0} width={strapWidthPx} height={RULER_H} fill="#f8fafc" />
                <RulerMarks widthMm={widthMm} strapWidthPx={strapWidthPx} />
                <Group y={RULER_H}>
                  <Rect x={0} y={0} width={strapWidthPx} height={panelHeight} {...fillProps} />
                  {customPatternImg ? renderCustomPattern() : (
                    <StrapPatternRenderer
                      clipPoints={[0, 0, strapWidthPx, 0, strapWidthPx, panelHeight, 0, panelHeight]}
                      pattern={activePattern}
                      strapW={strapWidthPx}
                      opacity={patternOpacity}
                    />
                  )}
                  <Rect x={2} y={0} width={1} height={panelHeight} fill="rgba(255,255,255,0.25)" listening={false} />
                  <Rect x={strapWidthPx - 3} y={0} width={1} height={panelHeight} fill="rgba(255,255,255,0.25)" listening={false} />
                  <Rect x={3} y={3} width={strapWidthPx - 6} height={panelHeight - 6} stroke="rgba(255,100,100,0.35)" strokeWidth={0.8} dash={[5, 3]} fill="transparent" cornerRadius={1} listening={false} />
                  {renderTextItems(true, false)}
                </Group>
              </Layer>
            </Stage>
          </div>
          <div className="flex flex-col items-center gap-1">
            <span className="text-[11px] font-black text-slate-700 uppercase tracking-widest">Back</span>
            <span className="text-[9px] text-slate-400">Auto-mirrored</span>
          </div>
        </div>
      </div>

      {/* Size / spec bar */}
      <div className="flex items-center gap-4 px-5 py-2 bg-white rounded-xl border border-slate-200 text-[10px] text-slate-500 shadow-sm">
        <span>Width: <strong className="text-slate-700">{design.width || '20mm'}</strong></span>
        <span className="w-px h-3 bg-slate-200" />
        <span>Length: <strong className="text-slate-700">{design.length || '38'}cm</strong></span>
        <span className="w-px h-3 bg-slate-200" />
        <span>Print: <strong className="text-slate-700">{design.printingMethod || 'Sublimated'}</strong></span>
        <span className="w-px h-3 bg-slate-200" />
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-sm border border-slate-300 inline-block" style={{ background: strapColor.includes('gradient') ? `linear-gradient(90deg, ${(strapColor.match(/#[a-fA-F0-9]{6}/g) || ['#888','#888']).join(',')})` : strapColor }} />
          <strong className="text-slate-700">{design.lanyardColor || '#ffffff'}</strong>
        </span>
        <span className="w-px h-3 bg-slate-200" />
        <span className="text-red-500 font-semibold">— Bleed zone</span>
      </div>
    </div>
  );
}
