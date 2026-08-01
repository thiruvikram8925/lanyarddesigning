import { Group, Rect, Text, Image, Transformer, Circle, RegularPolygon } from 'react-konva';
import { useConfiguratorStore } from '../store/useConfiguratorStore';
import { useCanvasImage } from '../hooks/useCanvasImage';
import { getImageTransformUpdates, getTextTransformUpdates } from '../lib/konvaTransforms';
import React, { useRef, useEffect } from 'react';
import { cardSizes, SAFETY_MARGIN } from '../data/cardConfig';



const getKonvaFill = (fill, width, height) => {
  if (!fill) return { fill: '#ffffff' };
  if (typeof fill === 'string' && fill.includes('linear-gradient')) {
    const colors = fill.match(/#(?:[0-9a-fA-F]{3}){1,2}/g);
    if (colors && colors.length >= 2) {
      return {
        fillLinearGradientStartPoint: { x: 0, y: 0 },
        fillLinearGradientEndPoint: { x: width, y: height },
        fillLinearGradientColorStops: [0, colors[0], 1, colors[colors.length - 1]],
      };
    }
  }
  return { fill };
};

function CanvasElement({ element, onDragEnd, onTransformEnd, onClick, onDblClick, isSelected, isReviewStep, safetyMargin, cardWidth, cardHeight }) {
  const image = useCanvasImage(element.src);
  const lastClickTimeRef = useRef(0);
  const shapeRef = useRef(null);
  const trRef = useRef(null);

  // Simplified dragBoundFunc for smoother, Canva-like freedom
  const dragBoundFunc = (pos) => {
    // We allow moving anywhere, but we can add snapping logic later if needed
    return pos;
  };

  useEffect(() => {
    if (isSelected && trRef.current && shapeRef.current) {
      trRef.current.nodes([shapeRef.current]);
      trRef.current.getLayer().batchDraw();
    }
  }, [isSelected, element]);

  // Handle keyboard nudge
  useEffect(() => {
    if (!isSelected || isReviewStep) return;

    const handleKeyDown = (e) => {
      const step = e.shiftKey ? 10 : 1;
      let dx = 0;
      let dy = 0;

      if (e.key === 'ArrowLeft') dx = -step;
      if (e.key === 'ArrowRight') dx = step;
      if (e.key === 'ArrowUp') dy = -step;
      if (e.key === 'ArrowDown') dy = step;

      if (dx !== 0 || dy !== 0) {
        e.preventDefault();
        onDragEnd(element.id, { x: element.x + dx, y: element.y + dy });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSelected, isReviewStep, element.x, element.y, element.id, onDragEnd]);

  const handleTap = (e) => {
    e.cancelBubble = true;
    const time = new Date().getTime();
    if (time - lastClickTimeRef.current < 400) {
      if (onDblClick) onDblClick(element.id, e);
    } else {
      if (onClick) onClick(element.id, e);
    }
    lastClickTimeRef.current = time;
  };

  // Check if element is outside safe zone for visual warning
  const isOutsideSafeZone = () => {
    if (!shapeRef.current) return false;
    const node = shapeRef.current;
    const x = node.x();
    const y = node.y();
    const width = node.width() * node.scaleX();
    const height = node.height() * node.scaleY();
    
    return (
      x < safetyMargin || 
      y < safetyMargin || 
      x + width > cardWidth - safetyMargin || 
      y + height > cardHeight - safetyMargin
    );
  };

  const commonProps = {
    ref: shapeRef,
    id: element.id,
    x: element.x,
    y: element.y,
    rotation: element.rotation || 0,
    scaleX: element.scaleX || 1,
    scaleY: element.scaleY || 1,
    draggable: !isReviewStep,
    // Removed restrictive dragBoundFunc for better Canva-like experience
    onDragStart: () => {
      if (shapeRef.current) shapeRef.current.moveToTop();
    },
    onDragEnd: (e) => onDragEnd(element.id, { x: e.target.x(), y: e.target.y() }),
    onTransformEnd: (e) => {
      const node = shapeRef.current;

      if (element.type === 'text') {
        onTransformEnd(element.id, getTextTransformUpdates(node, element.width || 120, element.fontSize || 12, 5, 5));
      } else {
        onTransformEnd(element.id, getImageTransformUpdates(node, 5, 5));
      }
    },
    onClick: handleTap,
    onTap: handleTap,
    onMouseEnter: (e) => {
      const container = e.target.getStage().container();
      container.style.cursor = 'move';
    },
    onMouseLeave: (e) => {
      const container = e.target.getStage().container();
      container.style.cursor = 'default';
    }
  };

  let NodeComponent = null;
  switch (element.type) {
    case 'text':
      NodeComponent = <Text {...commonProps} text={element.content} fontSize={element.fontSize} fontFamily={element.fontFamily || 'Montserrat'} fill={element.fill} width={element.width} align={element.align} fontStyle={element.fontStyle} lineHeight={element.lineHeight || 1.2} letterSpacing={element.letterSpacing || 0} wrap="none" />;
      break;
    case 'image':
      NodeComponent = <Image {...commonProps} image={image} width={element.width} height={element.height} cornerRadius={element.cornerRadius || 0} />;
      break;
    case 'rect':
      NodeComponent = <Rect {...commonProps} width={element.width} height={element.height} fill={element.fill} cornerRadius={element.cornerRadius || 0} stroke={element.stroke} strokeWidth={element.strokeWidth} />;
      break;
    case 'circle':
      NodeComponent = <Circle {...commonProps} radius={element.width / 2} fill={element.fill} stroke={element.stroke} strokeWidth={element.strokeWidth} />;
      break;
    case 'triangle':
      NodeComponent = <RegularPolygon {...commonProps} sides={3} radius={element.width / 1.5} fill={element.fill} stroke={element.stroke} strokeWidth={element.strokeWidth} />;
      break;
    case 'rhombus':
      NodeComponent = <RegularPolygon {...commonProps} sides={4} radius={element.width / 1.4} fill={element.fill} stroke={element.stroke} strokeWidth={element.strokeWidth} />;
      break;
  }

  return (
    <Group>
      {NodeComponent}
      {isSelected && !isReviewStep && (
        <Transformer
          ref={trRef}
          rotateEnabled={true}
          enabledAnchors={['top-left', 'top-right', 'bottom-left', 'bottom-right', 'top-center', 'bottom-center', 'middle-left', 'middle-right']}
          boundBoxFunc={(oldBox, newBox) => {
            // Only restrict minimum size for smoothness
            if (Math.abs(newBox.width) < 5 || Math.abs(newBox.height) < 5) {
              return oldBox;
            }
            return newBox;
          }}
          anchorSize={9}
          anchorCornerRadius={10}
          anchorStroke="#5d5fef"
          anchorFill="#ffffff"
          anchorStrokeWidth={2}
          borderStroke="#5d5fef"
          borderStrokeWidth={1.5}
          borderDash={[4, 4]}
          padding={5}
          keepRatio={true}
          shiftStrokeWidth={1}
        />
      )}
    </Group>
  );
}

export default function IdCardPreview({ onSelectElement, onUpdateElement, onDblClickElement, isReviewStep, forceSide }) {
  const design = useConfiguratorStore((state) => state.design);
  const setField = useConfiguratorStore((state) => state.setField);
  const { size, activeSide, showBothSides } = design.idCard;
  
  const { width, height } = cardSizes[size] || cardSizes['86x54'];
  const isHorizontal = width > height;

  // Safe area toggle state
  const showSafeZone = design.idCard.showSafeZone;

  const renderSide = (sideName, offsetX, offsetY = 0) => {
    const sideData = design.idCard[sideName];
    const isActive = sideName === activeSide;
    
    // If forceSide is provided, we only render that specific side
    if (forceSide && sideName !== forceSide) return null;

    // Dimensions for the preview (shrunken if review step)
    const drawWidth = isReviewStep ? width - SAFETY_MARGIN * 2 : width;
    const drawHeight = isReviewStep ? height - SAFETY_MARGIN * 2 : height;
    const cornerRadius = isReviewStep ? 10 : 15;

    return (
      <Group 
        x={offsetX} 
        y={offsetY} 
        opacity={showBothSides && !isActive && !forceSide ? 0.7 : 1}
      >
        {/* Outer Shadow Rect */}
        <Rect 
          width={drawWidth} 
          height={drawHeight} 
          fill="white"
          cornerRadius={cornerRadius} 
          shadowColor="rgba(0,0,0,0.3)" 
          shadowBlur={isReviewStep ? 15 : 25} 
          shadowOffsetX={isReviewStep ? 5 : 10}
          shadowOffsetY={isReviewStep ? 8 : 15} 
          shadowOpacity={0.4}
        />

        {/* Card Body */}
        <Rect 
          width={drawWidth} 
          height={drawHeight} 
          {...getKonvaFill(sideData.backgroundColor, drawWidth, drawHeight)} 
          cornerRadius={cornerRadius} 
          stroke={isActive && !isReviewStep ? "#5d5fef" : "rgba(0,0,0,0.1)"} 
          strokeWidth={isActive && !isReviewStep ? 2 : 1} 
          onMouseDown={(e) => {
            if (isReviewStep) return;
            e.cancelBubble = true;
            onSelectElement && onSelectElement(null, sideName);
          }}
          onTap={(e) => {
            if (isReviewStep) return;
            e.cancelBubble = true;
            onSelectElement && onSelectElement(null, sideName);
          }}
        />

        {/* Glossy Overlay / Texture */}
        <Rect
          width={drawWidth}
          height={drawHeight}
          cornerRadius={cornerRadius}
          listening={false}
          fillLinearGradientStartPoint={{ x: 0, y: 0 }}
          fillLinearGradientEndPoint={{ x: drawWidth, y: drawHeight }}
          fillLinearGradientColorStops={[
            0, 'rgba(255,255,255,0.15)',
            0.4, 'rgba(255,255,255,0.05)',
            0.5, 'rgba(255,255,255,0)',
            1, 'rgba(0,0,0,0.05)'
          ]}
        />

        <Group 
          x={isReviewStep ? -SAFETY_MARGIN : 0} 
          y={isReviewStep ? -SAFETY_MARGIN : 0}
          clipFunc={(ctx) => {
            // Clip to safe area if reviewing, or full card otherwise
            if (isReviewStep) {
              ctx.beginPath();
              ctx.rect(SAFETY_MARGIN, SAFETY_MARGIN, width - SAFETY_MARGIN * 2, height - SAFETY_MARGIN * 2);
              ctx.closePath();
            } else {
              ctx.beginPath();
              ctx.moveTo(15, 0);
              ctx.lineTo(width - 15, 0);
              ctx.quadraticCurveTo(width, 0, width, 15);
              ctx.lineTo(width, height - 15);
              ctx.quadraticCurveTo(width, height, width - 15, height);
              ctx.lineTo(15, height);
              ctx.quadraticCurveTo(0, height, 0, height - 15);
              ctx.lineTo(0, 15);
              ctx.quadraticCurveTo(0, 0, 15, 0);
              ctx.closePath();
            }
          }}
        >
          {sideData.elements.map((el) => (
              <CanvasElement 
                key={el.id} 
                element={el} 
                onDragEnd={(id, pos) => onUpdateElement(id, pos, sideName)} 
                onTransformEnd={(id, pos) => onUpdateElement(id, pos, sideName)}
                onClick={(id) => onSelectElement(id, sideName)} 
                onDblClick={(id, e) => onDblClickElement && onDblClickElement(id, sideName, e)}
                isSelected={design.idCard.selected === el.id}
                isReviewStep={isReviewStep}
                safetyMargin={SAFETY_MARGIN}
                cardWidth={width}
                cardHeight={height}
              />
          ))}
        </Group>

        {/* Plastic Card Reflection Effect */}
        <Rect
          x={width * 0.1}
          y={0}
          width={width * 0.3}
          height={height}
          fillLinearGradientStartPoint={{ x: 0, y: 0 }}
          fillLinearGradientEndPoint={{ x: width * 0.3, y: 0 }}
          fillLinearGradientColorStops={[0, 'rgba(255,255,255,0)', 0.5, 'rgba(255,255,255,0.08)', 1, 'rgba(255,255,255,0)']}
          rotation={15}
          listening={false}
        />

      </Group>
    );
  };

  return (
    <Group 
      onMouseDown={(e) => {
        if (isReviewStep) return;
        if (e.target === e.target.getStage()) {
          onSelectElement && onSelectElement(null);
        }
      }}
    >
      {renderSide(forceSide || (showBothSides ? 'front' : activeSide), 0, 0)}
      {showBothSides && !forceSide && renderSide('back', isHorizontal ? 0 : width + 40, isHorizontal ? height + 40 : 0)}
    </Group>
  );
}
