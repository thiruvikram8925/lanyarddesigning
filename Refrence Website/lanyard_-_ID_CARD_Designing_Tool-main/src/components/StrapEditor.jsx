import {
  AlertTriangle,
  AlignCenter,
  AlignLeft,
  AlignRight,
  Briefcase,
  Copy,
  Eye,
  Feather,
  FlipHorizontal,
  Hand,
  ImageIcon,
  Link2,
  Minus,
  Move,
  Palette,
  PartyPopper,
  Plus,
  Redo2,
  Rotate3d,
  RotateCw,
  Save,
  Sparkles,
  Trash2,
  Type,
  Undo2,
  X,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Group, Image, Layer, Rect, Stage, Text, Transformer } from 'react-konva';
import { fonts, gradientPresets, presetColors } from '../data/options';
import { getPatternById, inspirationPresets, patternCategories, strapPatterns } from '../data/strapPatterns';
import { instantiateStrapTypographyElements, typographyTemplates } from '../data/strapTypographyTemplates';
import { useCanvasImage } from '../hooks/useCanvasImage';
import { useHistory } from '../hooks/useHistory';
import { useStrapElementActions } from '../hooks/useStrapElementActions';
import { incrementInspirationApplyCount, recordStrapImageUpload } from '../lib/dashboardAnalytics';
import { prepareUploadAsset } from '../lib/fileReaders';
import { getImageTransformUpdates, getTextTransformUpdates } from '../lib/konvaTransforms';
import {
  getEditorSafeZones,
  getStrapWidthMm,
  getZoneValidation,
  STRAP_EDITOR_HEIGHT_PX,
  STRAP_EDITOR_WIDTH_PX,
} from '../lib/strapArtwork';
import { useConfiguratorStore } from '../store/useConfiguratorStore';
import DropzoneField from './DropzoneField';
import LanyardStage from './LanyardStage';
import StrapPatternRenderer from './StrapPatternRenderer';
import { showToast } from './Toast';

const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;
const ACCEPTED_IMAGE_TYPES = new Set(['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/svg+xml']);
const clampValue = (value, min, max) => Math.min(Math.max(value, min), max);
const STRAP_STAGE_WIDTH = STRAP_EDITOR_WIDTH_PX;
const STRAP_STAGE_HEIGHT = STRAP_EDITOR_HEIGHT_PX;
const STRAP_CLIP_RADIUS = 18;
const HEX_COLOR_PATTERN = /^#(?:[0-9a-fA-F]{3}){1,2}$/;
const BRAND_SLOT_X = [-160, -80, 0, 80, 160];
const STRAP_RENDER_ORDER = ['right', 'left', 'center'];
const BRAND_LAYOUT_LABELS = {
  'logo-name': 'Official',
  'name-logo': 'Name + Logo',
  'logo-only': 'Logo only',
  'name-only': 'Text only',
};
const hasSameElementFields = (current = {}, next = {}) => {
  const currentKeys = Object.keys(current).filter((key) => key !== 'zone');
  const nextKeys = Object.keys(next);
  if (currentKeys.length !== nextKeys.length) return false;
  return nextKeys.every((key) => current[key] === next[key]);
};

function normalizeImageCrop(element, sourceWidth, sourceHeight) {
  const width = Math.max(1, Math.round(sourceWidth || element.sourceWidth || element.width || 1));
  const height = Math.max(1, Math.round(sourceHeight || element.sourceHeight || element.height || 1));
  const cropWidth = clampValue(Math.round(element.cropWidth ?? width), 1, width);
  const cropHeight = clampValue(Math.round(element.cropHeight ?? height), 1, height);
  const cropX = clampValue(Math.round(element.cropX ?? 0), 0, Math.max(0, width - cropWidth));
  const cropY = clampValue(Math.round(element.cropY ?? 0), 0, Math.max(0, height - cropHeight));

  return {
    cropX,
    cropY,
    cropWidth,
    cropHeight,
    sourceWidth: width,
    sourceHeight: height,
  };
}

function fitImageIntoBox(sourceWidth, sourceHeight, maxSize = 60) {
  const safeWidth = Math.max(sourceWidth || 1, 1);
  const safeHeight = Math.max(sourceHeight || 1, 1);
  const ratio = Math.min(maxSize / safeWidth, maxSize / safeHeight);
  return {
    width: Math.max(20, Math.round(safeWidth * ratio)),
    height: Math.max(20, Math.round(safeHeight * ratio)),
  };
}

function loadImageMetadata(src) {
  return new Promise((resolve, reject) => {
    const image = new window.Image();
    image.crossOrigin = 'anonymous';
    image.onload = () => resolve({ width: image.naturalWidth || image.width, height: image.naturalHeight || image.height });
    image.onerror = () => reject(new Error('The uploaded image could not be processed.'));
    image.src = src;
  });
}

function getNodePositionUpdate(node) {
  return {
    x: node.x(),
    y: node.y(),
  };
}

function createPositionDragHandler(onUpdate) {
  return (event) => {
    onUpdate(getNodePositionUpdate(event.target));
  };
}

function createTextTransformHandler(onUpdate, element) {
  return (event) => {
    onUpdate(
      getTextTransformUpdates(
        event.target,
        element.width || 200,
        element.fontSize || 16,
      ),
    );
  };
}

function createImageTransformHandler(onUpdate) {
  return (event) => {
    onUpdate(getImageTransformUpdates(event.target));
  };
}

function StrapCropModal({ element, onApply, onCancel, onPreviewChange }) {
  const image = useCanvasImage(element?.src);
  const [crop, setCrop] = useState(null);
  const [dragState, setDragState] = useState(null);
  const [loadError, setLoadError] = useState('');
  const viewportWidth = 500;
  const viewportHeight = 320;
  const padding = 20;

  useEffect(() => {
    if (!element || !image) return;
    try {
      const nextCrop = normalizeImageCrop(element, image.width, image.height);
      if (!nextCrop) {
        setLoadError('Failed to initialize crop area');
        return;
      }
      setCrop(nextCrop);
      setLoadError('');
    } catch (err) {
      setLoadError('Error initializing crop: ' + (err?.message || 'Unknown error'));
    }
  }, [element?.id, element?.src, image]);

  useEffect(() => {
    if (!crop || !onPreviewChange) return;
    try {
      onPreviewChange(crop);
    } catch (err) {
      console.error('Preview change error:', err);
    }
  }, [crop?.cropX, crop?.cropY, crop?.cropWidth, crop?.cropHeight]);

  useEffect(() => {
    if (!element?.src) return undefined;
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.onerror = () => setLoadError('Unable to load image for cropping. Please try another file.');
    img.onload = () => setLoadError(''); // Clear error on successful load
    img.src = element.src;
    return undefined;
  }, [element?.src]);

  if (!element) return null;

  const sourceWidth = crop?.sourceWidth || element.sourceWidth || image?.width || 1;
  const sourceHeight = crop?.sourceHeight || element.sourceHeight || image?.height || 1;
  const scale = Math.min((viewportWidth - (padding * 2)) / sourceWidth, (viewportHeight - (padding * 2)) / sourceHeight);
  const displayWidth = sourceWidth * scale;
  const displayHeight = sourceHeight * scale;
  const offsetX = (viewportWidth - displayWidth) / 2;
  const offsetY = (viewportHeight - displayHeight) / 2;
  const cropDisplay = crop
    ? {
      x: offsetX + (crop.cropX * scale),
      y: offsetY + (crop.cropY * scale),
      width: crop.cropWidth * scale,
      height: crop.cropHeight * scale,
    }
    : null;

  const updateCrop = (nextCrop) => {
    if (!nextCrop) return;
    try {
      setCrop({
        ...nextCrop,
        sourceWidth,
        sourceHeight,
      });
    } catch (err) {
      console.error('Crop update error:', err);
    }
  };

  const getPointerSourcePosition = (stage) => {
    const pointer = stage?.getPointerPosition();
    if (!pointer) return null;
    return {
      x: clampValue((pointer.x - offsetX) / scale, 0, sourceWidth),
      y: clampValue((pointer.y - offsetY) / scale, 0, sourceHeight),
    };
  };

  const beginResize = (handle) => {
    if (!crop) return;
    setDragState({
      type: 'resize',
      handle,
      anchor: {
        left: crop.cropX,
        top: crop.cropY,
        right: crop.cropX + crop.cropWidth,
        bottom: crop.cropY + crop.cropHeight,
      },
      ratio: crop.cropWidth / Math.max(crop.cropHeight, 1),
    });
  };

  const beginMove = () => {
    if (!crop) return;
    setDragState({
      type: 'move',
      origin: {
        x: crop.cropX,
        y: crop.cropY,
      },
    });
  };

  const handlePointerMove = (event) => {
    if (!crop || !dragState) return;
    const pointer = getPointerSourcePosition(event.target.getStage());
    if (!pointer) return;
    const minSize = 24;

    if (dragState.type === 'move') {
      const nextX = clampValue(pointer.x - (crop.cropWidth / 2), 0, sourceWidth - crop.cropWidth);
      const nextY = clampValue(pointer.y - (crop.cropHeight / 2), 0, sourceHeight - crop.cropHeight);
      updateCrop({
        ...crop,
        cropX: nextX,
        cropY: nextY,
      });
      return;
    }

    const { left, top, right, bottom } = dragState.anchor;
    const handle = dragState.handle;
    let nextLeft = left;
    let nextTop = top;
    let nextRight = right;
    let nextBottom = bottom;

    if (handle.includes('w')) nextLeft = clampValue(pointer.x, 0, right - minSize);
    if (handle.includes('e')) nextRight = clampValue(pointer.x, left + minSize, sourceWidth);
    if (handle.includes('n')) nextTop = clampValue(pointer.y, 0, bottom - minSize);
    if (handle.includes('s')) nextBottom = clampValue(pointer.y, top + minSize, sourceHeight);

    if (handle.length === 2) {
      const ratio = dragState.ratio || 1;
      if (handle.includes('e') || handle.includes('w')) {
        const width = Math.max(minSize, nextRight - nextLeft);
        const height = width / ratio;
        if (handle.includes('n')) {
          nextTop = clampValue(bottom - height, 0, bottom - minSize);
        } else {
          nextBottom = clampValue(top + height, top + minSize, sourceHeight);
        }
      } else {
        const height = Math.max(minSize, nextBottom - nextTop);
        const width = height * ratio;
        if (handle.includes('w')) {
          nextLeft = clampValue(right - width, 0, right - minSize);
        } else {
          nextRight = clampValue(left + width, left + minSize, sourceWidth);
        }
      }
    }

    updateCrop({
      ...crop,
      cropX: nextLeft,
      cropY: nextTop,
      cropWidth: Math.max(minSize, nextRight - nextLeft),
      cropHeight: Math.max(minSize, nextBottom - nextTop),
    });
  };

  const handleApply = () => {
    if (!crop) {
      return;
    }
    try {
      onApply(crop);
    } catch (err) {
      console.error('Apply crop error:', err);
    }
  };

  const handles = cropDisplay
    ? [
      { key: 'nw', x: cropDisplay.x, y: cropDisplay.y, cursor: 'nwse-resize' },
      { key: 'n', x: cropDisplay.x + (cropDisplay.width / 2), y: cropDisplay.y, cursor: 'ns-resize' },
      { key: 'ne', x: cropDisplay.x + cropDisplay.width, y: cropDisplay.y, cursor: 'nesw-resize' },
      { key: 'e', x: cropDisplay.x + cropDisplay.width, y: cropDisplay.y + (cropDisplay.height / 2), cursor: 'ew-resize' },
      { key: 'se', x: cropDisplay.x + cropDisplay.width, y: cropDisplay.y + cropDisplay.height, cursor: 'nwse-resize' },
      { key: 's', x: cropDisplay.x + (cropDisplay.width / 2), y: cropDisplay.y + cropDisplay.height, cursor: 'ns-resize' },
      { key: 'sw', x: cropDisplay.x, y: cropDisplay.y + cropDisplay.height, cursor: 'nesw-resize' },
      { key: 'w', x: cropDisplay.x, y: cropDisplay.y + (cropDisplay.height / 2), cursor: 'ew-resize' },
    ]
    : [];

  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
      <div className="max-h-[92vh] w-full max-w-[1040px] overflow-y-auto rounded-[32px] bg-white shadow-2xl">
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-black text-slate-800 uppercase tracking-wide">Crop image</h3>
            <p className="text-xs font-semibold text-slate-500">{element.name || 'Adjust the visible artwork area in real time'}</p>
          </div>
          <button onClick={onCancel} className="w-10 h-10 rounded-2xl bg-slate-50 text-slate-500 hover:text-red-500 hover:bg-red-50 transition-all">
            <X size={18} className="mx-auto" />
          </button>
        </div>
        <div className="grid gap-6 p-6 lg:grid-cols-[minmax(0,1fr)_300px]">
          <div className="min-w-0 overflow-x-auto rounded-[28px] bg-slate-100 p-4">
            {image && crop ? (
              <Stage
                width={viewportWidth}
                height={viewportHeight}
                onMouseMove={handlePointerMove}
                onMouseUp={() => setDragState(null)}
                onMouseLeave={() => setDragState(null)}
              >
                <Layer>
                  <Rect x={0} y={0} width={viewportWidth} height={viewportHeight} fill="#e2e8f0" cornerRadius={18} />
                  <Image image={image} x={offsetX} y={offsetY} width={displayWidth} height={displayHeight} />
                  {cropDisplay && (
                    <>
                      <Rect x={offsetX} y={offsetY} width={displayWidth} height={Math.max(cropDisplay.y - offsetY, 0)} fill="rgba(15,23,42,0.52)" listening={false} />
                      <Rect x={offsetX} y={cropDisplay.y} width={Math.max(cropDisplay.x - offsetX, 0)} height={cropDisplay.height} fill="rgba(15,23,42,0.52)" listening={false} />
                      <Rect x={cropDisplay.x + cropDisplay.width} y={cropDisplay.y} width={Math.max((offsetX + displayWidth) - (cropDisplay.x + cropDisplay.width), 0)} height={cropDisplay.height} fill="rgba(15,23,42,0.52)" listening={false} />
                      <Rect x={offsetX} y={cropDisplay.y + cropDisplay.height} width={displayWidth} height={Math.max((offsetY + displayHeight) - (cropDisplay.y + cropDisplay.height), 0)} fill="rgba(15,23,42,0.52)" listening={false} />
                      <Rect
                        x={cropDisplay.x}
                        y={cropDisplay.y}
                        width={cropDisplay.width}
                        height={cropDisplay.height}
                        stroke="#5d5fef"
                        strokeWidth={2}
                        dash={[6, 4]}
                        draggable
                        onDragStart={beginMove}
                        onDragMove={handlePointerMove}
                        onDragEnd={(event) => {
                          handlePointerMove(event);
                          setDragState(null);
                        }}
                      />
                      {handles.map((handle) => (
                        <Rect
                          key={handle.key}
                          x={handle.x - 6}
                          y={handle.y - 6}
                          width={12}
                          height={12}
                          fill="#ffffff"
                          stroke="#5d5fef"
                          strokeWidth={2}
                          cornerRadius={3}
                          draggable
                          onDragStart={() => beginResize(handle.key)}
                          onDragMove={handlePointerMove}
                          onDragEnd={(event) => {
                            handlePointerMove(event);
                            setDragState(null);
                          }}
                          onMouseEnter={(event) => {
                            event.target.getStage().container().style.cursor = handle.cursor;
                          }}
                          onMouseLeave={(event) => {
                            event.target.getStage().container().style.cursor = 'default';
                          }}
                        />
                      ))}
                    </>
                  )}
                </Layer>
              </Stage>
            ) : (
              <div className="flex h-[320px] items-center justify-center rounded-[24px] bg-white text-sm font-semibold text-slate-500">
                {loadError || 'Loading image…'}
              </div>
            )}
          </div>
          <div className="min-w-0 space-y-4">
            <div className="rounded-[24px] border border-slate-200 p-4">
              <div className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Preview</div>
              <div className="mt-3 flex h-[180px] items-center justify-center rounded-[20px] bg-slate-100">
                {image && crop ? (
                  <Stage width={190} height={160}>
                    <Layer>
                      <Image
                        image={image}
                        x={25}
                        y={20}
                        width={140}
                        height={120}
                        crop={{
                          x: crop.cropX,
                          y: crop.cropY,
                          width: crop.cropWidth,
                          height: crop.cropHeight,
                        }}
                      />
                    </Layer>
                  </Stage>
                ) : (
                  <span className="text-xs font-semibold text-slate-500">Preview unavailable</span>
                )}
              </div>
            </div>
            <div className="rounded-[24px] border border-slate-200 p-4 space-y-2">
              <div className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Crop values</div>
              <div className="text-xs font-semibold text-slate-600">X: {Math.round(crop?.cropX || 0)} px</div>
              <div className="text-xs font-semibold text-slate-600">Y: {Math.round(crop?.cropY || 0)} px</div>
              <div className="text-xs font-semibold text-slate-600">Width: {Math.round(crop?.cropWidth || 0)} px</div>
              <div className="text-xs font-semibold text-slate-600">Height: {Math.round(crop?.cropHeight || 0)} px</div>
            </div>
            {loadError ? <div className="rounded-[20px] border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">{loadError}</div> : null}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={onCancel}
                className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-600 transition-all hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleApply}
                disabled={!crop}
                className="rounded-2xl bg-[#5d5fef] px-4 py-3 text-sm font-bold text-white transition-all hover:bg-[#4a4cd9] disabled:opacity-50"
              >
                Apply crop
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ImageElement({ element, isActive, onUpdate, onSelect }) {
  const image = useCanvasImage(element.src);
  const badgeEnabled = Boolean(element.badgeEnabled);
  const badgePadding = Math.max(0, Number(element.badgePadding ?? 0));
  const badgeCornerRadius = Math.max(0, Number(element.badgeCornerRadius ?? 8));
  const badgeFill = HEX_COLOR_PATTERN.test(element.badgeColor || '') ? element.badgeColor : '#ffffff';
  const badgeWidth = element.width + (badgePadding * 2);
  const badgeHeight = element.height + (badgePadding * 2);
  const commonProps = {
    id: element.id,
    x: element.x,
    y: element.y,
    width: element.width,
    height: element.height,
    rotation: element.rotation || 0,
    opacity: element.opacity ?? 1,
    offsetX: element.width / 2,
    offsetY: element.height / 2,
    draggable: isActive,
    onClick: () => onSelect(element),
    onTap: () => onSelect(element),
    onDragEnd: createPositionDragHandler(onUpdate),
    onTransformEnd: createImageTransformHandler(onUpdate),
  };

  if (!image) {
    return (
      <>
        {badgeEnabled ? (
          <Rect
            x={element.x}
            y={element.y}
            width={badgeWidth}
            height={badgeHeight}
            offsetX={badgeWidth / 2}
            offsetY={badgeHeight / 2}
            fill={badgeFill}
            cornerRadius={badgeCornerRadius}
            opacity={Math.min((element.opacity ?? 1), 0.95)}
            listening={false}
          />
        ) : null}
        <Rect
          {...commonProps}
          fill="rgba(255,255,255,0.25)"
          stroke="rgba(255,255,255,0.65)"
          strokeWidth={1}
          dash={[4, 4]}
          cornerRadius={6}
        />
      </>
    );
  }

  const cropData = normalizeImageCrop(element, image.width, image.height);

  return (
    <>
      {badgeEnabled ? (
        <Rect
          x={element.x}
          y={element.y}
          width={badgeWidth}
          height={badgeHeight}
          offsetX={badgeWidth / 2}
          offsetY={badgeHeight / 2}
          fill={badgeFill}
          cornerRadius={badgeCornerRadius}
          opacity={Math.min((element.opacity ?? 1), 0.95)}
          listening={false}
        />
      ) : null}
      <Image
        {...commonProps}
        image={image}
        crop={{
          x: cropData.cropX,
          y: cropData.cropY,
          width: cropData.cropWidth,
          height: cropData.cropHeight
        }}
      />
    </>
  );
}

function clipRoundedStrap(ctx) {
  const x = -STRAP_STAGE_WIDTH / 2;
  const y = -STRAP_STAGE_HEIGHT / 2;
  const w = STRAP_STAGE_WIDTH;
  const h = STRAP_STAGE_HEIGHT;
  const r = STRAP_CLIP_RADIUS;

  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function clipPrintableLane(ctx, safeZones) {
  const x = (safeZones.leftFold.x + safeZones.leftFold.width) - (STRAP_STAGE_WIDTH / 2);
  const y = safeZones.topStitch.height - (STRAP_STAGE_HEIGHT / 2);
  const width = STRAP_STAGE_WIDTH - safeZones.leftFold.width - safeZones.rightClip.width;
  const height = STRAP_STAGE_HEIGHT - safeZones.topStitch.height - safeZones.bottomStitch.height;
  ctx.beginPath();
  ctx.rect(x, y, Math.max(width, 0), Math.max(height, 0));
  ctx.closePath();
}

/** Consistent card for sidebar sections (Figma / design-tool style). */
function StudioPanelSection({ icon: Icon, title, description, children }) {
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm shadow-slate-200/40">
      {(Icon || title || description) ? (
        <header className="flex items-center gap-2.5 border-b border-slate-100 bg-slate-50/90 px-3 py-2 sm:px-3.5">
          {Icon ? (
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-[#5d5fef]">
              <Icon className="h-4 w-4" strokeWidth={2.2} />
            </span>
          ) : null}
          {(title || description) ? (
            <div className="sr-only">
              {title ? <h3>{title}</h3> : null}
              {description ? <p>{description}</p> : null}
            </div>
          ) : null}
        </header>
      ) : null}
      <div className="min-w-0 space-y-3.5 p-3.5 sm:p-4">{children}</div>
    </section>
  );
}

function StrapStepper({ label, value, onDecrease, onIncrease, suffix = '' }) {
  return (
    <div className="min-w-0 space-y-1.5">
      <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">{label}</span>
      <div className="flex w-full min-w-0 items-stretch overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
        <button
          type="button"
          onClick={onDecrease}
          className="flex shrink-0 items-center justify-center px-2.5 py-2 text-slate-600 transition hover:bg-white"
          aria-label={`Decrease ${label}`}
        >
          <Minus size={14} strokeWidth={2.5} />
        </button>
        <span className="flex min-w-0 flex-1 items-center justify-center px-1 text-center text-xs font-black tabular-nums text-slate-800">
          {value}
          {suffix}
        </span>
        <button
          type="button"
          onClick={onIncrease}
          className="flex shrink-0 items-center justify-center px-2.5 py-2 text-slate-600 transition hover:bg-white"
          aria-label={`Increase ${label}`}
        >
          <Plus size={14} strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
}

function StrapSlider({ label, valuePct, onChange }) {
  return (
    <div className="min-w-0 space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{label}</span>
        <span className="shrink-0 text-[10px] font-black tabular-nums text-[#5d5fef]">{valuePct}%</span>
      </div>
      <input
        type="range"
        min="0"
        max="100"
        value={valuePct}
        onChange={onChange}
        className="h-2 w-full min-w-0 cursor-pointer rounded-full accent-[#5d5fef]"
      />
    </div>
  );
}

function ImageControls({ selectedElement, updateElement, openCropEditor }) {
  if (!selectedElement || selectedElement.type !== 'image') return null;

  return (
    <div className="space-y-4 border-t border-slate-200/80 pt-4">
      <div className="flex items-center justify-between gap-2">
        <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500">Selected image</h4>
        <span className="truncate text-[10px] font-bold text-slate-400">Adjust size and crop</span>
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        <StrapStepper
          label="Width"
          value={selectedElement.width}
          suffix="px"
          onDecrease={() =>
            updateElement(selectedElement.zone, selectedElement.id, {
              width: Math.max(20, selectedElement.width - 5),
            })
          }
          onIncrease={() =>
            updateElement(selectedElement.zone, selectedElement.id, {
              width: Math.min(200, selectedElement.width + 5),
            })
          }
        />
        <StrapStepper
          label="Height"
          value={selectedElement.height}
          suffix="px"
          onDecrease={() =>
            updateElement(selectedElement.zone, selectedElement.id, {
              height: Math.max(20, selectedElement.height - 5),
            })
          }
          onIncrease={() =>
            updateElement(selectedElement.zone, selectedElement.id, {
              height: Math.min(200, selectedElement.height + 5),
            })
          }
        />
      </div>

      <div className="rounded-xl border border-slate-200/80 bg-slate-50/80 px-3 py-2.5 space-y-1">
        <div className="text-[9px] font-black uppercase tracking-widest text-slate-400">Crop and source</div>
        <p className="break-words text-[11px] font-semibold leading-relaxed text-slate-600">
          Source: {selectedElement.sourceWidth || selectedElement.cropWidth || selectedElement.width}px ×{' '}
          {selectedElement.sourceHeight || selectedElement.cropHeight || selectedElement.height}px
        </p>
        <p className="break-words text-[11px] font-semibold leading-relaxed text-slate-600">
          Visible: {selectedElement.cropWidth || selectedElement.sourceWidth || selectedElement.width}px ×{' '}
          {selectedElement.cropHeight || selectedElement.sourceHeight || selectedElement.height}px
        </p>
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => openCropEditor(selectedElement, selectedElement.zone)}
          className="rounded-xl border border-indigo-200 bg-indigo-50 py-2.5 text-center text-[10px] font-black uppercase tracking-wide text-indigo-700 transition hover:bg-indigo-100"
        >
          Open crop tool
        </button>
        <button
          type="button"
          onClick={() =>
            updateElement(
              selectedElement.zone,
              selectedElement.id,
              normalizeImageCrop(
                selectedElement,
                selectedElement.sourceWidth || selectedElement.cropWidth || selectedElement.width,
                selectedElement.sourceHeight || selectedElement.cropHeight || selectedElement.height,
              ),
            )
          }
          className="rounded-xl border border-slate-200 bg-white py-2.5 text-center text-[10px] font-black uppercase tracking-wide text-slate-600 transition hover:bg-slate-50"
        >
          Reset crop
        </button>
      </div>

      <div className="space-y-2 rounded-xl border border-slate-200/80 bg-slate-50/80 p-3">
        <div className="text-[9px] font-black uppercase tracking-widest text-slate-400">Logo badge</div>
        <button
          type="button"
          onClick={() =>
            updateElement(selectedElement.zone, selectedElement.id, {
              badgeEnabled: !selectedElement.badgeEnabled,
              badgeColor: selectedElement.badgeColor || '#ffffff',
              badgePadding: selectedElement.badgePadding ?? 6,
              badgeCornerRadius: selectedElement.badgeCornerRadius ?? 8,
            })
          }
          className={`w-full rounded-lg border px-3 py-2 text-left text-[10px] font-black uppercase tracking-wide transition ${selectedElement.badgeEnabled
              ? 'border-[#5d5fef] bg-indigo-50 text-[#5d5fef]'
              : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'
            }`}
        >
          {selectedElement.badgeEnabled ? 'Badge enabled' : 'Enable white badge'}
        </button>
        {selectedElement.badgeEnabled ? (
          <div className="grid grid-cols-3 gap-2">
            <input
              type="color"
              value={HEX_COLOR_PATTERN.test(selectedElement.badgeColor || '') ? selectedElement.badgeColor : '#ffffff'}
              onChange={(e) => updateElement(selectedElement.zone, selectedElement.id, { badgeColor: e.target.value })}
              className="h-10 w-full cursor-pointer rounded-lg border border-slate-200 bg-white p-1"
              aria-label="Logo badge color"
            />
            <StrapStepper
              label="Pad"
              value={selectedElement.badgePadding ?? 6}
              suffix="px"
              onDecrease={() => updateElement(selectedElement.zone, selectedElement.id, { badgePadding: Math.max(0, (selectedElement.badgePadding ?? 6) - 1) })}
              onIncrease={() => updateElement(selectedElement.zone, selectedElement.id, { badgePadding: Math.min(20, (selectedElement.badgePadding ?? 6) + 1) })}
            />
            <StrapStepper
              label="Round"
              value={selectedElement.badgeCornerRadius ?? 8}
              suffix="px"
              onDecrease={() => updateElement(selectedElement.zone, selectedElement.id, { badgeCornerRadius: Math.max(0, (selectedElement.badgeCornerRadius ?? 8) - 1) })}
              onIncrease={() => updateElement(selectedElement.zone, selectedElement.id, { badgeCornerRadius: Math.min(24, (selectedElement.badgeCornerRadius ?? 8) + 1) })}
            />
          </div>
        ) : null}
      </div>

      <StrapSlider
        label="Opacity"
        valuePct={Math.round((selectedElement.opacity ?? 1) * 100)}
        onChange={(e) =>
          updateElement(selectedElement.zone, selectedElement.id, {
            opacity: parseInt(e.target.value, 10) / 100,
          })
        }
      />

      <div className="space-y-1.5">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Rotate</span>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() =>
              updateElement(selectedElement.zone, selectedElement.id, {
                rotation: (selectedElement.rotation || 0) - 90,
              })
            }
            className="rounded-xl border border-slate-200 bg-white py-2.5 text-center text-[10px] font-black text-slate-700 transition hover:bg-slate-50"
          >
            −90°
          </button>
          <button
            type="button"
            onClick={() =>
              updateElement(selectedElement.zone, selectedElement.id, {
                rotation: (selectedElement.rotation || 0) + 90,
              })
            }
            className="rounded-xl border border-slate-200 bg-white py-2.5 text-center text-[10px] font-black text-slate-700 transition hover:bg-slate-50"
          >
            +90°
          </button>
        </div>
      </div>
    </div>
  );
}

function TextControls({ selectedElement, updateElement }) {
  if (!selectedElement || selectedElement.type !== 'text') return null;

  return (
    <div className="space-y-4 border-t border-slate-200/80 pt-4">
      <div className="flex items-center justify-between gap-2">
        <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500">Selected text</h4>
        <span className="truncate text-[10px] font-bold text-slate-400">Layer properties</span>
      </div>

      <div className="space-y-1.5">
        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500" htmlFor="strap-text-content-input">
          Content
        </label>
        <input
          id="strap-text-content-input"
          type="text"
          value={selectedElement.content}
          onChange={(e) =>
            updateElement(selectedElement.zone, selectedElement.id, {
              content: e.target.value,
            })
          }
          className="w-full min-w-0 rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2.5 text-sm font-bold text-slate-800 outline-none ring-0 transition focus:border-[#5d5fef] focus:bg-white"
        />
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        <div className="min-w-0 space-y-1.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Font</span>
          <select
            value={selectedElement.fontFamily || 'Montserrat'}
            onChange={(e) => updateElement(selectedElement.zone, selectedElement.id, { fontFamily: e.target.value })}
            className="h-10 w-full min-w-0 rounded-xl border border-slate-200 bg-white px-2.5 text-xs font-bold text-slate-800 outline-none focus:border-[#5d5fef]"
          >
            {fonts.map((font) => (
              <option key={font} value={font}>
                {font}
              </option>
            ))}
          </select>
        </div>
        <div className="min-w-0 space-y-1.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Color</span>
          <input
            type="color"
            value={selectedElement.fill || '#ffffff'}
            onChange={(e) =>
              updateElement(selectedElement.zone, selectedElement.id, {
                fill: e.target.value,
              })
            }
            className="h-10 w-full min-w-0 cursor-pointer rounded-xl border border-slate-200 bg-white p-1"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        <StrapStepper
          label="Size"
          value={Math.round(selectedElement.fontSize || 12)}
          suffix="px"
          onDecrease={() =>
            updateElement(selectedElement.zone, selectedElement.id, {
              fontSize: Math.max(6, (selectedElement.fontSize || 12) - 1),
            })
          }
          onIncrease={() =>
            updateElement(selectedElement.zone, selectedElement.id, {
              fontSize: Math.min(48, (selectedElement.fontSize || 12) + 1),
            })
          }
        />
        <div className="min-w-0 space-y-1.5">
          <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">Weight</span>
          <select
            value={selectedElement.fontStyle || 'bold'}
            onChange={(e) => updateElement(selectedElement.zone, selectedElement.id, { fontStyle: e.target.value })}
            className="h-10 w-full rounded-xl border border-slate-200 bg-white px-2.5 text-xs font-bold text-slate-800 outline-none focus:border-[#5d5fef]"
          >
            <option value="normal">Normal</option>
            <option value="bold">Bold</option>
            <option value="900">Black</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        <StrapStepper
          label="Line height"
          value={(selectedElement.lineHeight || 1.2).toFixed(1)}
          suffix=""
          onDecrease={() =>
            updateElement(selectedElement.zone, selectedElement.id, {
              lineHeight: Math.max(0.5, (selectedElement.lineHeight || 1.2) - 0.1),
            })
          }
          onIncrease={() =>
            updateElement(selectedElement.zone, selectedElement.id, {
              lineHeight: Math.min(3, (selectedElement.lineHeight || 1.2) + 0.1),
            })
          }
        />
        <StrapStepper
          label="Tracking"
          value={Math.round(selectedElement.letterSpacing || 0)}
          suffix="px"
          onDecrease={() =>
            updateElement(selectedElement.zone, selectedElement.id, {
              letterSpacing: Math.max(-5, (selectedElement.letterSpacing || 0) - 1),
            })
          }
          onIncrease={() =>
            updateElement(selectedElement.zone, selectedElement.id, {
              letterSpacing: Math.min(20, (selectedElement.letterSpacing || 0) + 1),
            })
          }
        />
      </div>

      <div className="space-y-1.5">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Align</span>
        <div className="grid grid-cols-3 gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1">
          {[
            { key: 'left', Icon: AlignLeft },
            { key: 'center', Icon: AlignCenter },
            { key: 'right', Icon: AlignRight },
          ].map(({ key, Icon }) => (
            <button
              key={key}
              type="button"
              onClick={() => updateElement(selectedElement.zone, selectedElement.id, { align: key })}
              className={`flex items-center justify-center rounded-lg py-2 transition ${selectedElement.align === key
                  ? 'bg-white text-[#5d5fef] shadow-sm'
                  : 'text-slate-400 hover:text-slate-600'
                }`}
            >
              <Icon size={16} strokeWidth={2.2} />
            </button>
          ))}
        </div>
      </div>

      <StrapSlider
        label="Opacity"
        valuePct={Math.round((selectedElement.opacity ?? 1) * 100)}
        onChange={(e) =>
          updateElement(selectedElement.zone, selectedElement.id, {
            opacity: parseInt(e.target.value, 10) / 100,
          })
        }
      />

      <div className="space-y-1.5">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Rotate</span>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() =>
              updateElement(selectedElement.zone, selectedElement.id, {
                rotation: (selectedElement.rotation || 0) - 90,
              })
            }
            className="rounded-xl border border-slate-200 bg-white py-2.5 text-center text-[10px] font-black text-slate-700 transition hover:bg-slate-50"
          >
            −90°
          </button>
          <button
            type="button"
            onClick={() =>
              updateElement(selectedElement.zone, selectedElement.id, {
                rotation: (selectedElement.rotation || 0) + 90,
              })
            }
            className="rounded-xl border border-slate-200 bg-white py-2.5 text-center text-[10px] font-black text-slate-700 transition hover:bg-slate-50"
          >
            +90°
          </button>
        </div>
      </div>
    </div>
  );
}

const PATTERN_CATEGORY_ICONS = {
  professional: Briefcase,
  kids: PartyPopper,
  artistic: Feather,
};

function InspirationLooksTiles({ presets, activeInspirationId, applyInspirationPreset }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {presets.map((preset) => {
        const isActive = activeInspirationId === preset.id;
        return (
          <button
            key={preset.id}
            type="button"
            title={`${preset.name} — ${preset.inspiration}`}
            onClick={() => applyInspirationPreset(preset)}
            className={`h-16 rounded-xl border-2 relative overflow-hidden text-left transition-all ${isActive ? 'border-[#5d5fef] ring-2 ring-[#5d5fef]/15' : 'border-slate-100 hover:border-[#5d5fef]/30'
              }`}
          >
            <div
              className="absolute inset-0 opacity-90"
              style={{ background: preset.preview, backgroundSize: '14px 14px' }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
            <div className="absolute top-1.5 left-2 right-8">
              <span className="inline-block max-w-full truncate rounded bg-white/90 px-1.5 py-0.5 text-[7px] font-black uppercase tracking-wider text-slate-600">
                {preset.family}
              </span>
            </div>
            <div className="absolute bottom-1.5 left-2 right-2">
              <span className="text-[8px] font-black uppercase tracking-tighter text-white line-clamp-2 leading-tight">
                {preset.name}
              </span>
            </div>
            {isActive ? (
              <span className="absolute top-1 right-1 rounded bg-[#5d5fef] px-1 py-0.5 text-[7px] font-black text-white shadow-sm">
                ON
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

function TypographyTemplateTiles({ templates, activeTemplateId, applyTypographyTemplate }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {templates.map((tmpl) => {
        const isActive = activeTemplateId === tmpl.id;
        return (
          <button
            key={tmpl.id}
            type="button"
            title={`${tmpl.name} — ${tmpl.caption}`}
            onClick={() => applyTypographyTemplate(tmpl)}
            className={`h-16 rounded-xl border-2 relative overflow-hidden text-left transition-all ${isActive ? 'border-[#5d5fef] ring-2 ring-[#5d5fef]/15' : 'border-slate-100 hover:border-[#5d5fef]/30'
              }`}
          >
            <div
              className="absolute inset-0 opacity-95"
              style={{ background: tmpl.preview, backgroundSize: 'auto' }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-white/5" />
            <div className="absolute top-1.5 left-2 right-8">
              <span className="inline-block max-w-full truncate rounded bg-white/90 px-1.5 py-0.5 text-[7px] font-black uppercase tracking-wider text-slate-600">
                {tmpl.family}
              </span>
            </div>
            <div className="absolute bottom-1.5 left-2 right-2">
              <span className="text-[8px] font-black uppercase tracking-tighter text-white line-clamp-2 leading-tight">
                {tmpl.name}
              </span>
            </div>
            {isActive ? (
              <span className="absolute top-1 right-1 rounded bg-[#5d5fef] px-1 py-0.5 text-[7px] font-black text-white shadow-sm">
                ON
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

export default function StrapEditor({ zone, onClose }) {
  const design = useConfiguratorStore((s) => s.design);
  const applyDesignSnapshot = useConfiguratorStore((s) => s.applyDesignSnapshot);
  const setLivePreviewPatch = useConfiguratorStore((s) => s.setLivePreviewPatch);
  const clearLivePreviewPatch = useConfiguratorStore((s) => s.clearLivePreviewPatch);
  const [activeTab, setActiveTab] = useState('design');
  const [viewMode, setViewMode] = useState('2D');
  const [showStrapElementDetails, setShowStrapElementDetails] = useState(false);
  const [currentZone, setCurrentZone] = useState(zone === 'right' ? 'right' : (zone === 'center' ? 'center' : 'left'));
  const [selectedTool, setSelectedTool] = useState('select');
  const [showAlignmentTools, setShowAlignmentTools] = useState(false);
  const [selectedElement, setSelectedElement] = useState(null);
  const [draftText, setDraftText] = useState('');
  const [showCustomColorInput, setShowCustomColorInput] = useState(false);
  const [customHexInput, setCustomHexInput] = useState(design.lanyardColor || '#1e40af');
  const [brandKit, setBrandKit] = useState({
    companyName: design.customTextCenter || '',
    tagline: '',
    layout: 'logo-name',
    applyTarget: 'both',
    useWhiteBadge: true,
    replaceExisting: false,
  });
  const [showBrandBuilderPanel, setShowBrandBuilderPanel] = useState(false);
  const [dragTargetZone, setDragTargetZone] = useState(null);
  const [cropTarget, setCropTarget] = useState(null);
  const [cropPreview, setCropPreview] = useState(null);
  const [elements, setElements] = useState({
    left: design.strapElements?.left || [],
    right: design.strapElements?.right || [],
    center: design.strapElements?.center || []
  });

  const safeElements = elements || { left: [], right: [], center: [] };

  // Ensure elements are preserved from design and initialized properly
  useEffect(() => {
    if (design.strapElements) {
      setElements((prevElements) => {
        // Only update if there's actually new data from design
        const hasNewData =
          (design.strapElements.left && design.strapElements.left.length > (prevElements.left?.length || 0)) ||
          (design.strapElements.right && design.strapElements.right.length > (prevElements.right?.length || 0)) ||
          (design.strapElements.center && design.strapElements.center.length > (prevElements.center?.length || 0));

        if (hasNewData || (!prevElements.left && !prevElements.right && !prevElements.center)) {
          return {
            left: design.strapElements.left || [],
            right: design.strapElements.right || [],
            center: design.strapElements.center || []
          };
        }
        return prevElements;
      });
    }
  }, [design.strapElements]);

  const getInitialState = () => {
    const savedColor = design.lanyardColor;

    return {
      copyMode: design.copyMode || 'synchronized',
      lanyardDesignStyle: design.lanyardDesignStyle || 'repeated',
      lanyardColor: savedColor && savedColor !== '#ffffff' ? savedColor : '#1e40af',
      isDualSided: design.isDualSided || false,
      lanyardColorBack: design.lanyardColorBack || '#1e40af',
      strapPattern: design.strapPattern || null,
      strapPatternOpacity: design.strapPatternOpacity || 0.85,
      fontFamily: design.fontFamily || 'Montserrat',
      fontColor: design.fontColor || '#ffffff',
      fontSize: design.fontSize || 18,
      fontWeight: design.fontWeight || 'bold',
      lineHeight: design.lineHeight || 1.2,
      textAlign: design.textAlign || 'center',
      textSpacing: design.textSpacing || 60,
      logoScale: design.logoScale || 1,
      logoRotation: design.logoRotation || 0,
      textOffset: design.textOffset || 0,
      textYOffset: design.textYOffset || 0,
      logoOffset: design.logoOffset || 0,
      logoYOffset: design.logoYOffset || 0,
      customTextLeft: design.customTextLeft || '',
      customTextCenter: design.customTextCenter || '',
      customTextRight: design.customTextRight || '',
      customTextSecondary: design.customTextSecondary || '',
      textOffsetLeft: design.textOffsetLeft || 0,
      textOffsetCenter: design.textOffsetCenter || 0,
      textOffsetRight: design.textOffsetRight || 0,
      textYOffsetLeft: design.textYOffsetLeft || 0,
      textYOffsetCenter: design.textYOffsetCenter || 0,
      textYOffsetRight: design.textYOffsetRight || 0,
      logoOffsetLeft: design.logoOffsetLeft || 0,
      logoOffsetCenter: design.logoOffsetCenter || 0,
      logoOffsetRight: design.logoOffsetRight || 0,
      logoYOffsetLeft: design.logoYOffsetLeft || 0,
      logoYOffsetCenter: design.logoYOffsetCenter || 0,
      logoYOffsetRight: design.logoYOffsetRight || 0,
      textDirection: design.textDirection || 'opposite',
    };
  };

  const { state, setState, undo, redo, canUndo, canRedo } = useHistory(getInitialState());
  const stageRefs = useRef({});
  const transformerRefs = useRef({});
  const [selectedId, setSelectedId] = useState(null);
  const logoImg = useCanvasImage(design.logoUrl);
  const [patternCategory, setPatternCategory] = useState('professional');
  const [inspirationMode, setInspirationMode] = useState('looks');
  const [appliedTemplateId, setAppliedTemplateId] = useState(null);
  const strapWidthMm = useMemo(() => getStrapWidthMm(design.width), [design.width]);
  const renderedElements = useMemo(() => {
    if (!cropPreview?.zone || !cropPreview?.elementId || !cropPreview?.updates) return safeElements;
    return {
      ...safeElements,
      [cropPreview.zone]: safeElements[cropPreview.zone].map((element) =>
        element.id === cropPreview.elementId ? { ...element, ...cropPreview.updates } : element,
      ),
    };
  }, [cropPreview, safeElements]);
  const validationByZone = useMemo(() => ({
    left: getZoneValidation(renderedElements.left, { width: strapWidthMm, clipType: design.clipType }),
    right: getZoneValidation(renderedElements.right, { width: strapWidthMm, clipType: design.clipType }),
    center: getZoneValidation(renderedElements.center || [], { width: strapWidthMm, clipType: design.clipType }),
  }), [design.clipType, renderedElements.left, renderedElements.right, renderedElements.center, strapWidthMm]);
  const editorSafeZones = useMemo(() => getEditorSafeZones({ width: strapWidthMm, clipType: design.clipType }), [design.clipType, strapWidthMm]);
  const saveDesign = useMemo(() => ({
    ...design,
    ...state,
    strapElements: safeElements,
    strapValidation: {
      left: getZoneValidation(safeElements.left, { width: strapWidthMm, clipType: design.clipType }),
      right: getZoneValidation(safeElements.right, { width: strapWidthMm, clipType: design.clipType }),
      center: getZoneValidation(safeElements.center || [], { width: strapWidthMm, clipType: design.clipType }),
    },
  }), [design, safeElements, state, strapWidthMm]);
  const previewDesign = useMemo(() => ({
    ...design,
    ...state,
    strapElements: renderedElements,
    strapValidation: validationByZone,
  }), [design, renderedElements, state, validationByZone]);
  const {
    addTextElement,
    addImageElement,
    updateElement,
    deleteElement,
    duplicateElementToZone,
    reorderElement,
    openCropEditor,
    handleImageSelection,
    applyCropToSelection,
  } = useStrapElementActions({
    state,
    design,
    setElements,
    setSelectedElement,
    cropTarget,
    setCropTarget,
    setCropPreview,
  });

  const handleSave = () => {
    applyDesignSnapshot(saveDesign);
    onClose(true);
  };

  const applyLanyardColor = (value) => {
    setState((current) => ({ ...current, lanyardColor: value }));
    setCustomHexInput(value);
  };

  const applyInspirationPreset = (preset) => {
    const linkedPattern = getPatternById(preset.patternId);
    if (linkedPattern?.category) {
      setPatternCategory(linkedPattern.category);
    }

    setState((current) => ({
      ...current,
      lanyardColor: preset.strapColor,
      strapPattern: preset.patternId,
      strapPatternOpacity: preset.strapPatternOpacity ?? current.strapPatternOpacity,
    }));
    setCustomHexInput(preset.strapColor);
    setAppliedTemplateId(null);
    incrementInspirationApplyCount();
  };

  const applyTypographyTemplate = (tmpl) => {
    const linkedPattern = getPatternById(tmpl.statePatch.strapPattern);
    if (linkedPattern?.category) {
      setPatternCategory(linkedPattern.category);
    }
    setElements(instantiateStrapTypographyElements(tmpl));
    setState((current) => ({
      ...current,
      ...tmpl.statePatch,
      customTextLeft: '',
      customTextCenter: '',
      customTextRight: '',
      customTextSecondary: '',
    }));
    setCustomHexInput(tmpl.statePatch.lanyardColor);
    setSelectedElement(null);
    setSelectedId(null);
    setAppliedTemplateId(tmpl.id);
    incrementInspirationApplyCount();
  };

  const syncCustomHexColor = (value, options = {}) => {
    const normalized = value.trim();
    setCustomHexInput(value);

    if (!HEX_COLOR_PATTERN.test(normalized)) {
      if (options.showInvalidToast) {
        showToast('Enter a valid HEX color like #1E40AF', 'error', 'Invalid HEX');
      }
      return false;
    }

    applyLanyardColor(normalized);

    if (options.closePopover) {
      setShowCustomColorInput(false);
    }

    return true;
  };

  const applyCustomHexColor = () => {
    syncCustomHexColor(customHexInput, {
      closePopover: true,
      showInvalidToast: true,
      showSuccessToast: true,
    });
  };

  const handleZoneDragOver = (event, zoneName) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
    setDragTargetZone(zoneName);
    if (currentZone !== zoneName) {
      setCurrentZone(zoneName);
    }
  };

  const handleZoneDragLeave = (event, zoneName) => {
    const nextTarget = event.relatedTarget;
    if (!nextTarget || !event.currentTarget.contains(nextTarget)) {
      setDragTargetZone((current) => (current === zoneName ? null : current));
    }
  };

  const handleZoneDrop = async (event, zoneName) => {
    event.preventDefault();
    setDragTargetZone(null);
    setCurrentZone(zoneName);
    const [file] = Array.from(event.dataTransfer?.files || []);
    if (file) {
      await handleUpload(file, zoneName);
    }
  };

  const handleUpload = async (file, targetZone = currentZone) => {
    if (!file) return;

    // Validate file type
    const extension = file.name.split('.').pop()?.toLowerCase() || '';
    const isAcceptedType = ACCEPTED_IMAGE_TYPES.has(file.type) || ['png', 'jpg', 'jpeg', 'svg', 'webp'].includes(extension);
    if (!isAcceptedType) {
      showToast('Supported formats: PNG, JPG, SVG, or WEBP.', 'error', 'Unsupported file type');
      return;
    }

    // Validate file size
    if (file.size > MAX_UPLOAD_BYTES) {
      const maxMB = (MAX_UPLOAD_BYTES / (1024 * 1024)).toFixed(0);
      const fileMB = (file.size / (1024 * 1024)).toFixed(1);
      showToast(`Image is ${fileMB}MB. Maximum is ${maxMB}MB.`, 'error', 'Image too large');
      return;
    }

    // Validate filename
    if (!file.name || file.name.length === 0) {
      showToast('File must have a valid name', 'error', 'Invalid filename');
      return;
    }

    try {
      const asset = await prepareUploadAsset(file);
      if (!asset || !asset.previewUrl) {
        showToast('Failed to process image', 'error', 'Processing error');
        return;
      }

      const meta = await loadImageMetadata(asset.previewUrl);
      if (!meta || !meta.width || !meta.height || meta.width <= 0 || meta.height <= 0) {
        showToast('Invalid image dimensions', 'error', 'Image error');
        return;
      }

      // Success - add the element
      addImageElement(asset, targetZone, {
        ...meta,
        imageSize: fitImageIntoBox(meta.width, meta.height, 60),
      });
      recordStrapImageUpload();
    } catch (error) {
      console.error('Image upload error:', error);
      const errorMsg = error?.message || 'Failed to upload image. Please try again.';
      showToast(errorMsg, 'error', 'Upload failed');
    }
  };

  const duplicateElement = (elementType, fromZone, toZone) => {
    const fromSuffix = fromZone === 'left' ? 'Left' : 'Right';
    const toSuffix = toZone === 'left' ? 'Left' : 'Right';

    if (elementType === 'logo') {
      const updates = {
        [`logoOffset${toSuffix}`]: state[`logoOffset${fromSuffix}`],
        [`logoYOffset${toSuffix}`]: state[`logoYOffset${fromSuffix}`],
      };
      setState({ ...state, ...updates });
    } else if (elementType === 'text') {
      const updates = {
        [`customText${toSuffix}`]: state[`customText${fromSuffix}`],
        [`textOffset${toSuffix}`]: state[`textOffset${fromSuffix}`],
        [`textYOffset${toSuffix}`]: state[`textYOffset${fromSuffix}`],
      };
      setState({ ...state, ...updates });
    }
  };

  const flipElement = (elementType, targetZone) => {
    if (elementType !== 'logo') return;
    setState({ ...state, logoRotation: state.logoRotation + 180 });
  };

  useEffect(() => {
    const zone = selectedElement?.zone || currentZone;
    const transformer = zone ? transformerRefs.current[zone] : null;
    const stage = zone ? stageRefs.current[zone] : null;
    if (!transformer) return;

    const nodes = [];
    if (selectedElement && stage) {
      const node = stage.findOne(`#${selectedElement.id}`);
      if (node) nodes.push(node);
    } else if (selectedId && stage) {
      const legacyNodeId = selectedId.endsWith(`-${zone}`) ? selectedId : `${selectedId}-${zone}`;
      const node = stage.findOne(`#${legacyNodeId}`);
      if (node) nodes.push(node);
    }

    transformer.nodes(nodes);
    const layer = transformer.getLayer();
    if (layer) layer.batchDraw();
  }, [currentZone, renderedElements, selectedElement, selectedId, state.copyMode]);

  useEffect(() => {
    if (!selectedElement?.id || !selectedElement?.zone) return;
    const latest = safeElements[selectedElement.zone]?.find((element) => element.id === selectedElement.id);
    if (!latest) {
      setSelectedElement(null);
      return;
    }
    setSelectedElement((current) => {
      if (!current || current.id !== latest.id || current.zone !== selectedElement.zone) {
        return { ...latest, zone: selectedElement.zone };
      }
      return hasSameElementFields(current, latest) ? current : { ...latest, zone: selectedElement.zone };
    });
  }, [safeElements, selectedElement?.id, selectedElement?.zone]);

  useEffect(() => {
    setLivePreviewPatch(previewDesign);
  }, [previewDesign, setLivePreviewPatch]);

  useEffect(() => () => {
    clearLivePreviewPatch();
  }, [clearLivePreviewPatch]);

  // Suffix helper for dynamic zone access
  const getSuffix = (z) => z === 'left' ? 'Left' : (z === 'right' ? 'Right' : 'Center');
  const currentSuffix = getSuffix(currentZone);
  const currentZoneWarnings = validationByZone[currentZone]?.filter((item) => item.warnings.length) || [];
  const getElementValidation = (targetZone, elementId) => validationByZone[targetZone]?.find((item) => item.elementId === elementId);
  const currentZoneImageLabel = [...(safeElements[currentZone] || [])].reverse().find((element) => element.type === 'image')?.name || 'PNG, JPG, SVG or WEBP up to 8 MB';
  const latestLogoElement = useMemo(
    () => (
      [...(safeElements[currentZone] || [])].reverse().find((element) => element.type === 'image' && element.src)
      || [...(safeElements.left || []), ...(safeElements.right || [])].reverse().find((element) => element.type === 'image' && element.src)
      || null
    ),
    [currentZone, safeElements],
  );
  const activeInspirationId = useMemo(
    () =>
      inspirationPresets.find(
        (preset) =>
          preset.patternId === state.strapPattern &&
          preset.strapColor === state.lanyardColor &&
          Math.abs((preset.strapPatternOpacity ?? 0.85) - state.strapPatternOpacity) < 0.001,
      )?.id ?? null,
    [state.lanyardColor, state.strapPattern, state.strapPatternOpacity],
  );

  const buildBrandElements = (targetZone) => {
    const normalizedName = brandKit.companyName.trim();
    if (!normalizedName) {
      showToast('Add a company name to generate a branded layout.', 'error', 'Company name required');
      return null;
    }

    const wantsLogo = brandKit.layout !== 'name-only';
    if (wantsLogo && !latestLogoElement?.src && !design.logoUrl) {
      showToast('Upload a company logo first, then apply the brand layout.', 'error', 'Logo required');
      return null;
    }

    const logoSource = latestLogoElement?.src || design.logoUrl;
    const sourceWidth = latestLogoElement?.sourceWidth || latestLogoElement?.cropWidth || 200;
    const sourceHeight = latestLogoElement?.sourceHeight || latestLogoElement?.cropHeight || 100;
    const ratio = sourceWidth / Math.max(sourceHeight, 1);
    const logoWidth = ratio >= 1 ? 44 : 30;
    const logoHeight = Math.round(logoWidth / Math.max(ratio, 0.1));
    const textColor = HEX_COLOR_PATTERN.test(state.fontColor || '') ? state.fontColor : '#000000';
    const tagline = brandKit.tagline.trim();
    const textContent = tagline ? `${normalizedName} · ${tagline}` : normalizedName;

    return BRAND_SLOT_X.map((x, index) => {
      const showLogo = brandKit.layout === 'logo-only'
        ? true
        : brandKit.layout === 'logo-name'
          ? index % 2 === 0
          : index % 2 !== 0;

      if (showLogo) {
        return {
          id: `brand-image-${targetZone}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          type: 'image',
          name: `${normalizedName} Logo`,
          src: logoSource,
          x,
          y: -2,
          width: logoWidth,
          height: logoHeight,
          cropX: 0,
          cropY: 0,
          cropWidth: sourceWidth,
          cropHeight: sourceHeight,
          sourceWidth,
          sourceHeight,
          opacity: 1,
          badgeEnabled: brandKit.useWhiteBadge,
          badgeColor: '#ffffff',
          badgePadding: brandKit.useWhiteBadge ? 5 : 0,
          badgeCornerRadius: 8,
        };
      }

      return {
        id: `brand-text-${targetZone}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        type: 'text',
        content: textContent,
        x,
        y: 0,
        fontSize: Math.max(12, Math.min(22, state.fontSize || 16)),
        fontFamily: state.fontFamily || 'Montserrat',
        fill: textColor,
        fontStyle: state.fontWeight || 'bold',
        lineHeight: state.lineHeight || 1.2,
        letterSpacing: 0.5,
        align: 'center',
        width: 170,
        height: 30,
        opacity: 1,
      };
    });
  };

  const applyBrandLayout = () => {
    const targetZones = brandKit.applyTarget === 'current' ? [currentZone] : ['left', 'right'];
    const generated = targetZones.map((z) => ({ zone: z, elements: buildBrandElements(z) })).filter((z) => z.elements?.length);
    if (!generated.length) return;

    setElements((prev) => {
      const next = { left: prev?.left || [], right: prev?.right || [] };
      generated.forEach(({ zone: z, elements: els }) => {
        next[z] = brandKit.replaceExisting ? [...els] : [...(next[z] || []), ...els];
      });
      return next;
    });

    if (brandKit.applyTarget === 'both' && state.copyMode !== 'synchronized') {
      setState((current) => ({ ...current, copyMode: 'synchronized' }));
    }

    const summaryLabel = brandKit.applyTarget === 'both' ? 'both straps' : `${currentZone} strap`;
    showToast(`Brand layout applied to ${summaryLabel}.`, 'success', 'Layout ready');
  };

  return (
    <>
      <div className="fixed inset-0 z-[100] flex bg-[#f8faff] animate-in fade-in duration-300 overflow-hidden">
        {/* 1. Tool Sidebar (Left) — Clean icon-based nav */}
        <div className="strap-studio-tool-sidebar w-[82px] bg-white border-r border-slate-100 flex flex-col z-20 shrink-0">
          {/* Brand Mark */}
          <div className="px-3 pt-5 pb-3 flex flex-col items-center border-b border-slate-100">
            <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-xl bg-gradient-to-br from-[#5d5fef] to-[#7c3aed] text-white shadow-lg shadow-indigo-200/50 hover:shadow-indigo-300/60 transition-all active:scale-95" title="Close editor">
              <X size={16} strokeWidth={2.5} />
            </button>
            <span className="mt-2 text-[8px] font-black text-slate-400 uppercase tracking-[0.15em]">Lanyard</span>
            <span className="text-[7px] font-bold text-slate-300 uppercase tracking-wider">Designer</span>
          </div>

          {/* Primary Nav Tabs */}
          <div className="flex-1 flex flex-col items-center py-4 gap-1 overflow-y-auto">
            {[
              { id: 'design', icon: Palette, label: 'Design' },
              { id: 'elements', icon: ImageIcon, label: 'Elements' },
              { id: 'patterns', icon: Sparkles, label: 'Patterns' },
              { id: 'text', icon: Type, label: 'Text' },
              { id: 'uploads', icon: ImageIcon, label: 'Uploads' },
            ].map(tab => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative flex flex-col items-center justify-center w-full py-3 gap-1.5 transition-all group ${isActive ? 'text-[#5d5fef]' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  {isActive && (
                    <div className="absolute left-0 top-2 bottom-2 w-[3px] bg-[#5d5fef] rounded-r-full shadow-[2px_0_8px_rgba(93,95,239,0.3)]" />
                  )}
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 ${isActive ? 'bg-indigo-50 shadow-sm scale-105' : 'group-hover:bg-slate-50'}`}>
                    <tab.icon size={18} strokeWidth={isActive ? 2.4 : 2} />
                  </div>
                  <span className={`text-[8px] font-black uppercase tracking-[0.08em] transition-colors ${isActive ? 'text-[#5d5fef]' : 'text-slate-400 group-hover:text-slate-500'}`}>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Bottom Actions */}
          <div className="px-3 pb-4 pt-2 border-t border-slate-100 flex flex-col items-center gap-2">
            <button className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-300 hover:text-slate-500 hover:bg-slate-50 transition-all" title="Help">
              <AlertTriangle size={15} />
            </button>
            <button className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-300 hover:text-slate-500 hover:bg-slate-50 transition-all" title="Settings">
              <Rotate3d size={15} />
            </button>
          </div>
        </div>

        <div className="flex w-[320px] min-w-0 shrink-0 flex-col border-r border-slate-100 bg-white z-10">
          <div className="border-b border-slate-100 px-5 py-4">
            <h2 className="text-[15px] font-black tracking-tight text-slate-900">
              {activeTab === 'design' ? 'Design' : activeTab === 'elements' ? 'Elements' : activeTab === 'patterns' ? 'Inspiration' : activeTab === 'text' ? 'Typography' : 'Uploads'}
            </h2>
            <p className="mt-0.5 text-[10px] font-medium text-slate-400">
              {activeTab === 'design' ? 'Colors, gradients & quick presets' : activeTab === 'elements' ? 'Logos, shapes & icons' : activeTab === 'patterns' ? 'Looks & Patterns' : activeTab === 'text' ? 'Add text, font styles & alignment' : 'User images & logos'}
            </p>
          </div>
          <div className="strap-studio-panel custom-scrollbar min-h-0 flex-1 flex flex-col overflow-y-auto overflow-x-hidden px-4 py-4 sm:px-5">
            {activeTab === 'uploads' ? (
              <div className="animate-in fade-in slide-in-from-left-2 duration-300 space-y-5 pb-2">
                {/* Upload dropzone — on upload: converts to image element, adds to canvas */}
                <StudioPanelSection icon={ImageIcon} title="Upload Assets" description="Upload images and logos to add to your strap design.">
                  <DropzoneField
                    label={state.lanyardDesignStyle === 'central-logo' ? 'Neck logo' : 'Upload image'}
                    hint="PNG, JPG, SVG or WEBP supported"
                    accept=".png,.svg,image/png,image/svg+xml,.jpg,.jpeg,.webp,image/webp"
                    fileName={currentZoneImageLabel}
                    onFileSelect={handleUpload}
                  />

                  {/* Uploaded assets list — these are canvas elements */}
                  {safeElements[currentZone]?.filter(el => el.type === 'image').length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                        Uploaded Assets · {currentZone} strap
                      </h4>
                      {safeElements[currentZone].filter(el => el.type === 'image').map((element) => {
                        const validation = getElementValidation(currentZone, element.id);
                        return (
                          <div
                            key={element.id}
                            className={`cursor-pointer rounded-xl border p-2.5 transition-all ${selectedElement?.id === element.id
                                ? 'border-[#5d5fef] bg-indigo-50/90 shadow-sm'
                                : validation?.warnings?.length
                                  ? 'border-amber-200 bg-amber-50/60 hover:border-amber-300'
                                  : 'border-slate-200/90 bg-white hover:border-slate-300'
                              }`}
                            onClick={() => setSelectedElement({ ...element, zone: currentZone })}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2 min-w-0">
                                <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 overflow-hidden border border-slate-200">
                                  {element.src ? <img src={element.src} className="w-full h-full object-contain" alt="" /> : <ImageIcon size={14} />}
                                </div>
                                <span className="text-xs font-black text-slate-700 truncate">Image</span>
                              </div>
                              <div className="flex shrink-0 gap-0.5">
                                <button type="button" onClick={(e) => { e.stopPropagation(); duplicateElementToZone(element, currentZone, currentZone === 'left' ? 'right' : 'left'); }} className="rounded-md p-1.5 text-slate-400 transition hover:bg-white hover:text-[#5d5fef]" title="Copy to other strap"><Copy size={12} /></button>
                                <button type="button" onClick={(e) => { e.stopPropagation(); deleteElement(currentZone, element.id); }} className="rounded-md p-1.5 text-slate-400 transition hover:bg-white hover:text-red-500" title="Remove"><Trash2 size={12} /></button>
                              </div>
                            </div>
                            {validation?.warnings?.length ? (
                              <div className="mt-2 flex items-start gap-1.5 text-[10px] font-bold text-amber-700">
                                <AlertTriangle size={12} className="mt-0.5 shrink-0" />
                                <span>{validation.warnings[0].label}: {validation.warnings[0].detail}</span>
                              </div>
                            ) : null}
                          </div>
                        );
                      })}
                    </div>
                  )}
                  <ImageControls
                    selectedElement={selectedElement}
                    updateElement={updateElement}
                    openCropEditor={openCropEditor}
                  />
                </StudioPanelSection>

                {/* Legacy logo controls */}
                {design.logoUrl ? (
                  <StudioPanelSection icon={ImageIcon} title="Legacy Logo" description="Adjust the canvas logo positioning.">
                    <div className="grid grid-cols-2 gap-2.5">
                      <StrapStepper
                        label="Scale"
                        value={state.logoScale.toFixed(1)}
                        suffix="×"
                        onDecrease={() => setState({ ...state, logoScale: Math.max(0.5, state.logoScale - 0.1) })}
                        onIncrease={() => setState({ ...state, logoScale: Math.min(2.5, state.logoScale + 0.1) })}
                      />
                      <StrapStepper
                        label="Rotate"
                        value={state.logoRotation}
                        suffix="°"
                        onDecrease={() => setState({ ...state, logoRotation: state.logoRotation - 15 })}
                        onIncrease={() => setState({ ...state, logoRotation: state.logoRotation + 15 })}
                      />
                    </div>
                  </StudioPanelSection>
                ) : null}

                {/* Quick tip */}
                <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 flex items-start gap-2.5">
                  <ImageIcon size={14} className="text-[#5d5fef] shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[10px] font-black text-slate-600">Tip</span>
                    <p className="text-[9px] text-slate-400 font-medium mt-0.5">Uploaded images are added as draggable canvas elements. Use the Elements tab for layer management.</p>
                  </div>
                </div>
              </div>
            ) : activeTab === 'design' ? (
              <div className="space-y-5 animate-in fade-in slide-in-from-left-2 duration-300">
                <section className="space-y-4 rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm shadow-slate-200/40">
                  <div>
                    <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-500">Base Strap Color</h3>
                    <p className="mt-1 text-[10px] font-semibold text-slate-400">Choose a solid color or add a custom HEX/gradient.</p>
                  </div>

                  <div className="grid grid-cols-4 gap-2.5">
                    {presetColors.map((color) => (
                      <button
                        key={color.name}
                        onClick={() => applyLanyardColor(color.value)}
                        className={`h-11 rounded-xl border-2 transition-all ${state.lanyardColor === color.value
                            ? 'border-[#5d5fef] shadow-md shadow-indigo-100 ring-2 ring-[#5d5fef]/10'
                            : 'border-slate-100 hover:border-slate-300'
                          }`}
                        style={{ backgroundColor: color.value }}
                        title={color.name}
                        aria-label={`Set strap color ${color.name}`}
                      />
                    ))}
                  </div>

                  <div className="space-y-1.5">
                    <span className="ml-1 text-[10px] font-black uppercase tracking-widest text-slate-400">Custom HEX / Gradient</span>
                    <div className="flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-2 transition focus-within:border-[#5d5fef]">
                      <input
                        type="text"
                        value={state.lanyardColor}
                        onChange={(e) => applyLanyardColor(e.target.value)}
                        placeholder="#1e40af"
                        className="h-full w-full min-w-0 border-0 bg-transparent px-1 text-xs font-bold text-slate-700 outline-none"
                        aria-label="Custom strap color value"
                      />
                      <input
                        type="color"
                        value={HEX_COLOR_PATTERN.test(state.lanyardColor || '') ? state.lanyardColor : '#1e40af'}
                        onChange={(e) => applyLanyardColor(e.target.value)}
                        className="h-7 w-8 shrink-0 cursor-pointer rounded-md border border-slate-200 bg-white p-0.5"
                        aria-label="Choose custom strap color"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2.5">
                    {gradientPresets.slice(0, 18).map((grad) => (
                      <button
                        key={grad.name}
                        onClick={() => applyLanyardColor(grad.value)}
                        className={`relative h-10 overflow-hidden rounded-xl border transition-all ${state.lanyardColor === grad.value
                            ? 'border-[#5d5fef] ring-2 ring-[#5d5fef]/10'
                            : 'border-slate-100 hover:border-slate-300'
                          }`}
                        style={{ background: grad.value }}
                        aria-label={`Apply ${grad.name} gradient`}
                      />
                    ))}
                  </div>
                  
                  {/* Dual Sided Checkbox & Back Color */}
                  <div className="mt-6 pt-4 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setState({ ...state, isDualSided: !state.isDualSided })}
                      className={`flex w-full min-w-0 items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition ${state.isDualSided ? 'border-[#5d5fef] bg-indigo-50/80 shadow-sm' : 'border-slate-200 bg-white hover:border-slate-300'}`}
                    >
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-[#5d5fef] shadow-sm">
                        <Plus size={16} strokeWidth={2.2} />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-[11px] font-black text-slate-900">Dual Sided Pattern</span>
                        <span className="mt-0.5 block text-[10px] font-medium leading-snug text-slate-500">Design front and back with different colors</span>
                      </span>
                    </button>
                    
                    {state.isDualSided && (
                      <div className="mt-3 space-y-1.5 animate-in fade-in duration-300">
                        <span className="ml-1 text-[10px] font-black uppercase tracking-widest text-slate-400">Back Color (HEX / Gradient)</span>
                        <div className="flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-2 transition focus-within:border-[#5d5fef]">
                          <input
                            type="text"
                            value={state.lanyardColorBack}
                            onChange={(e) => setState({ ...state, lanyardColorBack: e.target.value })}
                            placeholder="#1e40af"
                            className="h-full w-full min-w-0 border-0 bg-transparent px-1 text-xs font-bold text-slate-700 outline-none"
                            aria-label="Custom back color value"
                          />
                          <input
                            type="color"
                            value={HEX_COLOR_PATTERN.test(state.lanyardColorBack || '') ? state.lanyardColorBack : '#1e40af'}
                            onChange={(e) => setState({ ...state, lanyardColorBack: e.target.value })}
                            className="h-7 w-8 shrink-0 cursor-pointer rounded-md border border-slate-200 bg-white p-0.5"
                            aria-label="Choose custom back color"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </section>

                {/* Quick pattern shortcut in Design tab */}
                {state.strapPattern && (
                  <section className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm shadow-slate-200/40">
                    <div className="flex items-center justify-between">
                      <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-500">Active Pattern</h3>
                      <button type="button" onClick={() => setActiveTab('patterns')} className="text-[9px] font-black uppercase tracking-wider text-[#5d5fef] hover:underline">Edit →</button>
                    </div>
                    <div className="mt-2 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg border border-slate-200 overflow-hidden" style={{ background: strapPatterns.find(p => p.id === state.strapPattern)?.preview || '#eee', backgroundSize: '8px 8px' }} />
                      <div className="flex-1 min-w-0">
                        <span className="text-[11px] font-bold text-slate-700 truncate block">{strapPatterns.find(p => p.id === state.strapPattern)?.name || 'Pattern'}</span>
                        <span className="text-[9px] text-slate-400">{Math.round(state.strapPatternOpacity * 100)}% intensity</span>
                      </div>
                      <button type="button" onClick={() => setState({ ...state, strapPattern: null })} className="text-[9px] font-bold text-red-400 hover:text-red-600 transition-colors">Remove</button>
                    </div>
                  </section>
                )}

                {/* Accent color for text */}
                <section className="space-y-3 rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm shadow-slate-200/40">
                  <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-500">Text & Accent Color</h3>
                  <div className="flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-2 transition focus-within:border-[#5d5fef]">
                    <input type="color" value={HEX_COLOR_PATTERN.test(state.fontColor || '') ? state.fontColor : '#ffffff'} onChange={(e) => setState({ ...state, fontColor: e.target.value })} className="h-7 w-8 shrink-0 cursor-pointer rounded-md border border-slate-200 bg-white p-0.5" aria-label="Text accent color" />
                    <input type="text" value={state.fontColor || ''} onChange={(e) => setState({ ...state, fontColor: e.target.value })} placeholder="#ffffff" className="h-full w-full min-w-0 border-0 bg-transparent px-1 text-xs font-bold text-slate-700 outline-none" />
                  </div>
                </section>
              </div>
            ) : activeTab === 'patterns' ? (
              <div className="flex flex-col flex-1 gap-4 animate-in fade-in slide-in-from-left-2 duration-300">
                {/* Search */}
                <div className="relative">
                  <input type="text" placeholder="Search looks or patterns..." className="w-full rounded-xl border border-slate-200 bg-slate-50/80 pl-3 pr-9 py-2.5 text-xs font-medium text-slate-700 outline-none transition focus:border-[#5d5fef] focus:bg-white" />
                  <Sparkles size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300" />
                </div>
                {/* Looks / Patterns toggle */}
                <div className="flex items-center gap-1 bg-slate-50 rounded-xl p-1 border border-slate-100">
                  <button onClick={() => setInspirationMode('looks')} className={`flex-1 py-2 text-[10px] font-black uppercase tracking-wide rounded-lg transition-all ${inspirationMode === 'looks' ? 'bg-white text-[#5d5fef] shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>Looks</button>
                  <button onClick={() => setInspirationMode('typography')} className={`flex-1 py-2 text-[10px] font-black uppercase tracking-wide rounded-lg transition-all ${inspirationMode === 'typography' ? 'bg-white text-[#5d5fef] shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>Patterns</button>
                </div>
                {/* Category pills */}
                <div className="flex flex-wrap gap-1.5">
                  <button onClick={() => setPatternCategory('all')} className={`px-3 py-1.5 rounded-full text-[10px] font-bold transition-all ${patternCategory === 'all' ? 'bg-[#5d5fef] text-white shadow-sm' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>All</button>
                  {patternCategories.map((cat) => {
                    const active = patternCategory === cat.id;
                    return (
                      <button key={cat.id} onClick={() => setPatternCategory(cat.id)} className={`px-3 py-1.5 rounded-full text-[10px] font-bold transition-all ${active ? 'bg-[#5d5fef] text-white shadow-sm' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>{cat.label}</button>
                    );
                  })}
                </div>
                {/* Grid — patterns apply as background layer (replaces existing, not stacked) */}
                <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden pr-1 -mr-1">
                  {inspirationMode === 'looks' ? (
                    <InspirationLooksTiles presets={inspirationPresets} activeInspirationId={activeInspirationId} applyInspirationPreset={applyInspirationPreset} />
                  ) : (
                    <div className="grid grid-cols-3 gap-2">
                      <button type="button" onClick={() => setState({ ...state, strapPattern: null })} className={`h-20 rounded-xl border-2 px-2 text-[10px] font-black leading-tight transition-all ${state.strapPattern === null ? 'border-[#5d5fef] bg-indigo-50 text-[#5d5fef]' : 'border-slate-100 text-slate-500 hover:border-slate-300'}`}>None</button>
                      {strapPatterns.filter((p) => patternCategory === 'all' || p.category === patternCategory).map((pat) => (
                        <button key={pat.id} type="button" onClick={() => setState({ ...state, strapPattern: pat.id })} className={`relative h-20 overflow-hidden rounded-xl border-2 transition-all ${state.strapPattern === pat.id ? 'border-[#5d5fef] ring-2 ring-[#5d5fef]/15' : 'border-slate-100 hover:border-slate-300'}`}>
                          <div className="absolute inset-0 opacity-80" style={{ background: pat.preview, backgroundSize: '12px 12px' }} />
                          <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/50 to-transparent p-1.5">
                            <span className="line-clamp-2 text-left text-[8px] font-black uppercase leading-tight tracking-tight text-white">{pat.name}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {/* Opacity slider — only when a pattern is active */}
                {state.strapPattern && (
                  <div className="space-y-2 rounded-xl border border-slate-100 bg-slate-50/80 p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Pattern Opacity</span>
                      <span className="text-[10px] font-black text-[#5d5fef]">{Math.round(state.strapPatternOpacity * 100)}%</span>
                    </div>
                    <input type="range" min="0.1" max="1" step="0.05" value={state.strapPatternOpacity} onChange={(e) => setState({ ...state, strapPatternOpacity: parseFloat(e.target.value) })} className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-slate-200 accent-[#5d5fef]" />
                  </div>
                )}
                {/* Tip */}
                <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 flex items-start gap-2.5">
                  <Sparkles size={14} className="text-[#5d5fef] shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[10px] font-black text-slate-600">Tip</span>
                    <p className="text-[9px] text-slate-400 font-medium mt-0.5">Drag a pattern or look onto your design or click to apply.</p>
                  </div>
                </div>
              </div>
            ) : activeTab === 'text' ? (
              <div className="animate-in fade-in slide-in-from-left-2 duration-300 space-y-5 pb-2">
                <StudioPanelSection icon={Type} title="Typography" description="Add text blocks and tune repeating strap copy.">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">New text block</label>
                    <input type="text" placeholder="Type here, then add to strap…" value={draftText} className="w-full min-w-0 rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2.5 text-sm font-bold text-slate-800 outline-none transition focus:border-[#5d5fef] focus:bg-white" onChange={(e) => setDraftText(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && draftText.trim()) { addTextElement(draftText, currentZone, () => setDraftText('')); } }} />
                    <button type="button" onClick={() => { if (draftText.trim()) { addTextElement(draftText, currentZone, () => setDraftText('')); } }} className="w-full rounded-xl bg-[#5d5fef] py-2.5 text-center text-[11px] font-black uppercase tracking-wide text-white shadow-sm shadow-indigo-200/50 transition hover:bg-[#4f54e8]">Add text to strap</button>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Repeating strap copy ({currentZone})</label>
                    <textarea value={state[`customText${currentSuffix}`]} onChange={(e) => { const val = e.target.value; const updates = { [`customText${currentSuffix}`]: val }; if (state.copyMode === 'synchronized') { updates.customTextLeft = val; updates.customTextCenter = val; updates.customTextRight = val; } setState({ ...state, ...updates }); }} placeholder={`Text along the ${currentZone} strap…`} rows={3} className="w-full min-w-0 resize-none rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2.5 text-sm font-bold text-slate-800 outline-none transition focus:border-[#5d5fef] focus:bg-white" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="min-w-0 space-y-1.5"><span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Font</span><select value={state.fontFamily} onChange={(e) => setState({ ...state, fontFamily: e.target.value })} className="h-11 w-full min-w-0 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-800 outline-none transition focus:border-[#5d5fef]">{fonts.map((f) => (<option key={f} value={f}>{f}</option>))}</select></div>
                    <div className="min-w-0 space-y-1.5"><span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Color</span><div className="flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-2 transition focus-within:border-[#5d5fef]"><input type="color" value={HEX_COLOR_PATTERN.test(state.fontColor || '') ? state.fontColor : '#5d5fef'} onChange={(e) => setState({ ...state, fontColor: e.target.value })} className="h-7 w-8 min-w-0 cursor-pointer rounded-md border border-slate-200 bg-white p-0.5" /><input type="text" value={state.fontColor || ''} onChange={(e) => setState({ ...state, fontColor: e.target.value })} placeholder="#5d5fef" className="h-full w-full min-w-0 border-0 bg-transparent px-1 text-xs font-bold uppercase tracking-wide text-slate-700 outline-none" /></div></div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <StrapStepper label="Size" value={state.fontSize} suffix="px" onDecrease={() => setState({ ...state, fontSize: Math.max(10, state.fontSize - 1) })} onIncrease={() => setState({ ...state, fontSize: Math.min(32, state.fontSize + 1) })} />
                    <StrapStepper label="Repeat gap" value={state.textSpacing} suffix="px" onDecrease={() => setState({ ...state, textSpacing: Math.max(20, state.textSpacing - 5) })} onIncrease={() => setState({ ...state, textSpacing: Math.min(250, state.textSpacing + 5) })} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <StrapStepper label="Line height" value={state.lineHeight.toFixed(1)} suffix="" onDecrease={() => setState({ ...state, lineHeight: Math.max(0.8, state.lineHeight - 0.1) })} onIncrease={() => setState({ ...state, lineHeight: Math.min(2.5, state.lineHeight + 0.1) })} />
                    <div className="min-w-0 space-y-1.5"><span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">Weight</span><select value={state.fontWeight} onChange={(e) => setState({ ...state, fontWeight: e.target.value })} className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-800 outline-none transition focus:border-[#5d5fef]"><option value="normal">Normal</option><option value="bold">Bold</option><option value="900">Black</option></select></div>
                  </div>
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Alignment</span>
                    <div className="grid grid-cols-3 gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1">
                      {[{ k: 'left', I: AlignLeft }, { k: 'center', I: AlignCenter }, { k: 'right', I: AlignRight }].map(({ k, I }) => (<button key={k} type="button" onClick={() => setState({ ...state, textAlign: k })} className={`flex items-center justify-center rounded-lg py-2 transition ${state.textAlign === k ? 'bg-white text-[#5d5fef] shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}><I size={16} strokeWidth={2.2} /></button>))}
                    </div>
                  </div>
                  
                  <div className="space-y-1.5 pt-4 border-t border-slate-100">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Strap Print Direction</span>
                    <div className="grid grid-cols-1 gap-2">
                      <button
                        type="button"
                        onClick={() => setState({ ...state, textDirection: 'same' })}
                        className={`flex w-full min-w-0 items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition ${state.textDirection === 'same' ? 'border-[#5d5fef] bg-indigo-50/80 shadow-sm' : 'border-slate-200 bg-white hover:border-slate-300'}`}
                      >
                        <span className="min-w-0">
                          <span className="block text-[11px] font-black text-slate-900">✅ Same direction text</span>
                          <span className="mt-0.5 block text-[10px] font-medium leading-snug text-slate-500">Text runs neck-to-chest on both sides</span>
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setState({ ...state, textDirection: 'opposite' })}
                        className={`flex w-full min-w-0 items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition ${state.textDirection !== 'same' ? 'border-[#5d5fef] bg-indigo-50/80 shadow-sm' : 'border-slate-200 bg-white hover:border-slate-300'}`}
                      >
                        <span className="min-w-0">
                          <span className="block text-[11px] font-black text-slate-900">🔁 Opposite direction</span>
                          <span className="mt-0.5 block text-[10px] font-medium leading-snug text-slate-500">Real-life print style (rotates one side)</span>
                        </span>
                      </button>
                    </div>
                  </div>
                </StudioPanelSection>
                <TextControls selectedElement={selectedElement} updateElement={updateElement} />
              </div>
            ) : activeTab === 'elements' ? (
              <div className="animate-in fade-in slide-in-from-left-2 duration-300 space-y-5 pb-2">
                <StudioPanelSection icon={Link2} title="Control mode" description="Synchronized or Multi-zone editing.">
                  <div className="grid grid-cols-1 gap-2">
                    <button type="button" onClick={() => setState({ ...state, copyMode: 'synchronized' })} className={`flex w-full min-w-0 items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition ${state.copyMode === 'synchronized' ? 'border-[#5d5fef] bg-indigo-50/80 shadow-sm' : 'border-slate-200 bg-white hover:border-slate-300'}`}><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-[#5d5fef] shadow-sm"><Link2 size={16} strokeWidth={2.2} /></span><span className="min-w-0"><span className="block text-[11px] font-black text-slate-900">Synchronized</span><span className="mt-0.5 block text-[10px] font-medium leading-snug text-slate-500">Mirror changes to both straps</span></span></button>
                    <button type="button" onClick={() => setState({ ...state, copyMode: 'multi-zone' })} className={`flex w-full min-w-0 items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition ${state.copyMode === 'multi-zone' ? 'border-[#5d5fef] bg-indigo-50/80 shadow-sm' : 'border-slate-200 bg-white hover:border-slate-300'}`}><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-[#5d5fef] shadow-sm"><Move size={16} strokeWidth={2.2} /></span><span className="min-w-0"><span className="block text-[11px] font-black text-slate-900">Multi-zone</span><span className="mt-0.5 block text-[10px] font-medium leading-snug text-slate-500">Independent per strap</span></span></button>
                  </div>
                </StudioPanelSection>
                <StudioPanelSection icon={ImageIcon} title="Images & logos" description="Upload and manage graphic elements.">
                  <DropzoneField label={state.lanyardDesignStyle === 'central-logo' ? 'Neck logo' : 'Upload image'} hint="PNG, JPG, SVG or WEBP supported" accept=".png,.svg,image/png,image/svg+xml,.jpg,.jpeg,.webp,image/webp" fileName={currentZoneImageLabel} onFileSelect={handleUpload} />
                  {safeElements[currentZone]?.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2"><h4 className="text-[10px] font-black uppercase tracking-wider text-slate-500">Layers · {currentZone} strap</h4>{safeElements[currentZone].length > 3 ? (<button type="button" onClick={() => setShowStrapElementDetails((v) => !v)} className="shrink-0 text-[9px] font-black uppercase tracking-wider text-[#5d5fef] hover:underline">{showStrapElementDetails ? 'Show less' : 'Show all'}</button>) : null}</div>
                      {(showStrapElementDetails ? safeElements[currentZone] : safeElements[currentZone].slice(0, 3)).map((element) => { const validation = getElementValidation(currentZone, element.id); return (<div key={element.id} className={`cursor-pointer rounded-xl border p-2.5 transition-all ${selectedElement?.id === element.id ? 'border-[#5d5fef] bg-indigo-50/90 shadow-sm' : validation?.warnings?.length ? 'border-amber-200 bg-amber-50/60 hover:border-amber-300' : 'border-slate-200/90 bg-white hover:border-slate-300'}`} onClick={() => setSelectedElement({ ...element, zone: currentZone })}><div className="flex items-center justify-between"><div className="flex items-center gap-2 min-w-0"><div className="w-6 h-6 rounded bg-slate-100 flex items-center justify-center shrink-0">{element.type === 'text' ? <Type size={12} /> : <ImageIcon size={12} />}</div><span className="text-xs font-black text-slate-700 truncate">{element.type === 'text' ? element.content : 'Image'}</span></div><div className="flex shrink-0 flex-wrap justify-end gap-0.5"><button type="button" onClick={(e) => { e.stopPropagation(); reorderElement(currentZone, element.id, 'backward'); }} className="rounded-md p-1.5 text-slate-400 transition hover:bg-white hover:text-[#5d5fef]" title="Move backward">↑</button><button type="button" onClick={(e) => { e.stopPropagation(); reorderElement(currentZone, element.id, 'forward'); }} className="rounded-md p-1.5 text-slate-400 transition hover:bg-white hover:text-[#5d5fef]" title="Move forward">↓</button><button type="button" onClick={(e) => { e.stopPropagation(); duplicateElementToZone(element, currentZone, currentZone === 'left' ? 'right' : 'left'); }} className="rounded-md p-1.5 text-slate-400 transition hover:bg-white hover:text-[#5d5fef]" title="Copy to other strap"><Copy size={12} /></button><button type="button" onClick={(e) => { e.stopPropagation(); deleteElement(currentZone, element.id); }} className="rounded-md p-1.5 text-slate-400 transition hover:bg-white hover:text-red-500" title="Remove"><Trash2 size={12} /></button></div></div>{validation?.warnings?.length ? (<div className="mt-2 flex items-start gap-1.5 text-[10px] font-bold text-amber-700"><AlertTriangle size={12} className="mt-0.5 shrink-0" /><span>{validation.warnings[0].label}: {validation.warnings[0].detail}</span></div>) : null}</div>); })}
                    </div>
                  )}
                  <ImageControls selectedElement={selectedElement} updateElement={updateElement} openCropEditor={openCropEditor} />
                </StudioPanelSection>
                <StudioPanelSection icon={Briefcase} title="Brand Builder" description="Quick company layout setup.">
                  <button type="button" onClick={() => setShowBrandBuilderPanel(true)} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-left transition hover:border-[#5d5fef]"><span className="block text-[11px] font-bold text-slate-900">Open Brand Panel</span><span className="mt-0.5 block text-[10px] font-medium text-slate-500">Add company name, layout and advanced options.</span></button>
                </StudioPanelSection>
              </div>
            ) : null}
          </div>

          <div className="p-6 border-t border-slate-100 bg-white">
            <button
              type="button"
              onClick={handleSave}
              className="dash-btn-primary flex w-full items-center justify-center gap-2 py-4 text-sm shadow-lg transition-all active:scale-[0.98]"
            >
              <Save size={18} />
              APPLY DESIGN
            </button>
          </div>
        </div>


        {/* 2. Main Workspace (Center) */}
        <div className="flex-1 flex flex-col items-center justify-center p-8 relative overflow-hidden bg-[#f0f2f5]">
          {/* 2D / 3D Toggle */}
          <div className="absolute top-6 right-6 z-20 flex bg-white rounded-full p-1 shadow-sm border border-slate-200">
            <button 
              onClick={() => setViewMode('2D')} 
              className={`px-4 py-1.5 rounded-full text-[11px] font-bold transition-all ${viewMode === '2D' ? 'bg-[#5d5fef] text-white' : 'text-slate-500 hover:text-slate-700'}`}
            >
              2D
            </button>
            <button 
              onClick={() => setViewMode('3D')} 
              className={`px-4 py-1.5 rounded-full text-[11px] font-bold transition-all ${viewMode === '3D' ? 'bg-[#5d5fef] text-white' : 'text-slate-500 hover:text-slate-700'}`}
            >
              3D
            </button>
          </div>

          {viewMode === '2D' ? (
            <div className="flex flex-col gap-16 w-full max-w-[900px] animate-in slide-in-from-bottom-4 duration-500">
            {STRAP_RENDER_ORDER.map((z, strapIndex) => {
              const suffix = z === 'left' ? 'Left' : (z === 'center' ? 'Center' : 'Right');
              const isActive = currentZone === z;
              const isPrimaryStrip = strapIndex === 0;

              return (
                <div
                  key={z}
                  className={`relative group/strap transition-all duration-300 ${isActive ? 'scale-[1.02]' : 'hover:scale-[1.01]'
                    }`}
                  onClick={() => setCurrentZone(z)}
                  onDragOver={(event) => handleZoneDragOver(event, z)}
                  onDragEnter={(event) => handleZoneDragOver(event, z)}
                  onDragLeave={(event) => handleZoneDragLeave(event, z)}
                  onDrop={(event) => handleZoneDrop(event, z)}
                >
                  <div className="absolute top-[-25px] left-2 flex items-center gap-2">
                    <span className={`text-[11px] font-black uppercase tracking-[2px] ${isActive ? 'text-[#5d5fef]' : 'text-slate-400'
                      }`}>
                      {z === 'center' ? 'Neck Strap Design (Back)' : (isPrimaryStrip ? 'Primary Strap Design' : `${z} Strap Design`)}
                    </span>
                    {isActive && <div className="w-1.5 h-1.5 rounded-full bg-[#5d5fef] animate-pulse" />}
                  </div>

                  <div className={`
                  relative bg-white border-2 rounded-[20px] transition-all duration-500 overflow-hidden cursor-crosshair
                  ${isActive ? 'border-[#5d5fef] shadow-2xl ring-8 ring-indigo-50' : 'border-slate-200 shadow-sm hover:border-slate-300'}
                `}>
                    <Stage
                      ref={(node) => {
                        if (node) {
                          stageRefs.current[z] = node;
                        } else {
                          delete stageRefs.current[z];
                        }
                      }}
                      width={STRAP_STAGE_WIDTH}
                      height={STRAP_STAGE_HEIGHT}
                      onMouseDown={(e) => {
                        if (e.target === e.target.getStage()) {
                          setSelectedId(null);
                          setSelectedElement(null);
                          setCurrentZone(z);
                        }
                      }}
                    >
                      <Layer>
                        {(() => {
                          const renderColor = (state.isDualSided && z === 'center') ? state.lanyardColorBack : state.lanyardColor;
                          return renderColor && renderColor.includes('gradient') ? (
                            <Rect
                              width={STRAP_STAGE_WIDTH} height={STRAP_STAGE_HEIGHT}
                              fillLinearGradientStartPoint={{ x: 0, y: 0 }}
                              fillLinearGradientEndPoint={{ x: STRAP_STAGE_WIDTH, y: 0 }}
                              fillLinearGradientColorStops={[
                                0, renderColor.match(/#[a-fA-F0-9]{6}/g)?.[0] || '#000',
                                1, renderColor.match(/#[a-fA-F0-9]{6}/g)?.[1] || '#fff'
                              ]}
                              stroke="#eef2f6" strokeWidth={1}
                            />
                          ) : (
                            <Rect
                              width={STRAP_STAGE_WIDTH} height={STRAP_STAGE_HEIGHT}
                              fill={renderColor}
                              stroke="#eef2f6" strokeWidth={1}
                            />
                          );
                        })()}

                        {state.strapPattern && (
                          <Group x={STRAP_STAGE_WIDTH / 2} y={STRAP_STAGE_HEIGHT / 2} clipFunc={clipRoundedStrap} listening={false}>
                            <Group clipFunc={(ctx) => clipPrintableLane(ctx, editorSafeZones)}>
                              <StrapPatternRenderer
                                clipPoints={[
                                  (editorSafeZones.leftFold.x + editorSafeZones.leftFold.width) - (STRAP_STAGE_WIDTH / 2),
                                  editorSafeZones.topStitch.height - (STRAP_STAGE_HEIGHT / 2),
                                  (STRAP_STAGE_WIDTH / 2) - editorSafeZones.rightClip.width,
                                  editorSafeZones.topStitch.height - (STRAP_STAGE_HEIGHT / 2),
                                  (STRAP_STAGE_WIDTH / 2) - editorSafeZones.rightClip.width,
                                  (STRAP_STAGE_HEIGHT / 2) - editorSafeZones.bottomStitch.height,
                                  (editorSafeZones.leftFold.x + editorSafeZones.leftFold.width) - (STRAP_STAGE_WIDTH / 2),
                                  (STRAP_STAGE_HEIGHT / 2) - editorSafeZones.bottomStitch.height,
                                ]}
                                pattern={getPatternById(state.strapPattern)}
                                strapW={STRAP_STAGE_HEIGHT - editorSafeZones.topStitch.height - editorSafeZones.bottomStitch.height}
                                opacity={state.strapPatternOpacity}
                              />
                            </Group>
                          </Group>
                        )}

                        <Rect
                          x={editorSafeZones.leftFold.x}
                          y={editorSafeZones.leftFold.y}
                          width={editorSafeZones.leftFold.width}
                          height={editorSafeZones.leftFold.height}
                          fill="rgba(15, 23, 42, 0.08)"
                          listening={false}
                        />
                        <Rect
                          x={editorSafeZones.rightClip.x}
                          y={editorSafeZones.rightClip.y}
                          width={editorSafeZones.rightClip.width}
                          height={editorSafeZones.rightClip.height}
                          fill="rgba(15, 23, 42, 0.08)"
                          listening={false}
                        />
                        <Rect
                          x={editorSafeZones.topStitch.x}
                          y={editorSafeZones.topStitch.y}
                          width={editorSafeZones.topStitch.width}
                          height={editorSafeZones.topStitch.height}
                          fill="rgba(15, 23, 42, 0.08)"
                          listening={false}
                        />
                        <Rect
                          x={editorSafeZones.bottomStitch.x}
                          y={editorSafeZones.bottomStitch.y}
                          width={editorSafeZones.bottomStitch.width}
                          height={editorSafeZones.bottomStitch.height}
                          fill="rgba(15, 23, 42, 0.08)"
                          listening={false}
                        />
                        <Group x={STRAP_STAGE_WIDTH / 2} y={STRAP_STAGE_HEIGHT / 2} clipFunc={clipRoundedStrap}>
                          <Group clipFunc={(ctx) => clipPrintableLane(ctx, editorSafeZones)}>
                            {renderedElements[z]?.map((element) => {
                              const validation = getElementValidation(z, element.id);
                              if (element.type === 'text') {
                                return (
                                  <Group key={element.id}>
                                    <Text
                                      id={element.id}
                                      text={element.content}
                                      x={element.x}
                                      y={element.y}
                                      fontSize={element.fontSize}
                                      fontFamily={element.fontFamily}
                                      fill={element.fill}
                                      opacity={element.opacity ?? 1}
                                      fontStyle={element.fontStyle || 'bold'}
                                      letterSpacing={element.letterSpacing || 0}
                                      lineHeight={element.lineHeight || 1.2}
                                      align={element.align || 'center'}
                                      width={element.width}
                                      draggable={isActive}
                                      onClick={() => isActive && setSelectedElement({ ...element, zone: z })}
                                      onDragEnd={createPositionDragHandler((updates) => updateElement(z, element.id, updates))}
                                      onTransformEnd={createTextTransformHandler((updates) => updateElement(z, element.id, updates), element)}
                                      offsetX={element.width / 2}
                                      offsetY={element.fontSize / 2}
                                    />
                                    {validation?.warnings?.length ? (
                                      <Group x={element.x} y={element.y - (element.fontSize || 16) - 10} listening={false}>
                                        <Rect
                                          width={92}
                                          height={18}
                                          fill={validation.warnings[0].type === 'stitch' ? '#f59e0b' : '#ef4444'}
                                          cornerRadius={6}
                                          offsetX={46}
                                          shadowBlur={4}
                                          shadowColor="black"
                                          shadowOpacity={0.1}
                                        />
                                        <Text
                                          text={validation.warnings[0].label}
                                          width={92}
                                          align="center"
                                          y={4.5}
                                          offsetX={46}
                                          fontSize={8}
                                          fontStyle="bold"
                                          fill="#ffffff"
                                        />
                                      </Group>
                                    ) : null}
                                  </Group>
                                );
                              } else if (element.type === 'image' && element.src) {
                                return (
                                  <Group key={element.id}>
                                    <ImageElement
                                      element={element}
                                      isActive={isActive}
                                      onUpdate={(updates) => updateElement(z, element.id, updates)}
                                      onSelect={() => handleImageSelection(element, z, selectedElement)}
                                    />
                                    {validation?.warnings?.length ? (
                                      <Group x={element.x} y={element.y - (element.height / 2) - 14} listening={false}>
                                        <Rect
                                          width={92}
                                          height={18}
                                          fill={validation.warnings[0].type === 'stitch' ? '#f59e0b' : '#ef4444'}
                                          cornerRadius={6}
                                          offsetX={46}
                                          shadowBlur={4}
                                          shadowColor="black"
                                          shadowOpacity={0.1}
                                        />
                                        <Text
                                          text={validation.warnings[0].label}
                                          width={92}
                                          align="center"
                                          y={4.5}
                                          offsetX={46}
                                          fontSize={8}
                                          fontStyle="bold"
                                          fill="#ffffff"
                                        />
                                      </Group>
                                    ) : null}
                                  </Group>
                                );
                              }
                              return null;
                            })}

                            {/* Legacy Logo */}
                            {logoImg && (
                              <Image
                                id={`legacy-logo-${z}`}
                                image={logoImg}
                                x={state.copyMode === 'synchronized' ? state.logoOffset : state[`logoOffset${suffix}`]}
                                y={state.copyMode === 'synchronized' ? state.logoYOffset : state[`logoYOffset${suffix}`]}
                                width={40 * state.logoScale}
                                height={40 * state.logoScale}
                                offsetX={(40 * state.logoScale) / 2}
                                offsetY={(40 * state.logoScale) / 2}
                                rotation={state.logoRotation}
                                draggable={isActive}
                                onClick={() => isActive && setSelectedId('legacy-logo')}
                                onDragEnd={(e) => {
                                  const updates = state.copyMode === 'synchronized'
                                    ? { logoOffset: e.target.x(), logoYOffset: e.target.y() }
                                    : { [`logoOffset${suffix}`]: e.target.x(), [`logoYOffset${suffix}`]: e.target.y() };
                                  setState({ ...state, ...updates });
                                }}
                              />
                            )}

                            <Text
                              id={`legacy-text-${z}`}
                              text={state.copyMode === 'synchronized' ? state.customTextCenter : state[`customText${suffix}`]}
                              x={state.copyMode === 'synchronized' ? state.textOffset : state[`textOffset${suffix}`]}
                              y={state.copyMode === 'synchronized' ? state.textYOffset : state[`textYOffset${suffix}`]}
                              fontSize={state.fontSize}
                              fontFamily={state.fontFamily}
                              fill={state.fontColor}
                              opacity={1}
                              fontStyle={state.fontWeight || 'bold'}
                              align={state.textAlign || 'center'}
                              width={200}
                              draggable={isActive}
                              onClick={() => isActive && setSelectedId('legacy-text')}
                              onDragEnd={(e) => {
                                const updates = state.copyMode === 'synchronized'
                                  ? { textOffset: e.target.x(), textYOffset: e.target.y() }
                                  : { [`textOffset${suffix}`]: e.target.x(), [`textYOffset${suffix}`]: e.target.y() };
                                setState({ ...state, ...updates });
                              }}
                              offsetX={100}
                              offsetY={state.fontSize / 2}
                            />
                          </Group>
                        </Group>

                        {/* Transformer for custom elements */}
                        {selectedElement && selectedElement.zone === z && (
                          <Transformer
                            ref={(node) => {
                              if (node) {
                                transformerRefs.current[z] = node;
                              } else {
                                delete transformerRefs.current[z];
                              }
                            }}
                            rotateEnabled={true}
                            enabledAnchors={[
                              'top-left',
                              'top-center',
                              'top-right',
                              'middle-left',
                              'middle-right',
                              'bottom-left',
                              'bottom-center',
                              'bottom-right',
                            ]}
                            boundBoxFunc={(oldBox, newBox) => {
                              // Limit resize
                              if (newBox.width < 20 || newBox.height < 20) {
                                return oldBox;
                              }
                              return newBox;
                            }}
                          />
                        )}

                        {selectedId && isActive && selectedElement === null && (
                          <Transformer
                            ref={(node) => {
                              if (node) {
                                transformerRefs.current[z] = node;
                              } else {
                                delete transformerRefs.current[z];
                              }
                            }}
                            rotateEnabled={false}
                            enabledAnchors={['top-left', 'top-right', 'bottom-left', 'bottom-right']}
                          />
                        )}

                      </Layer>
                    </Stage>

                    {/* Measurement labels */}
                    <div className="absolute inset-0 pointer-events-none border border-slate-100/50" />
                    <div className="absolute bottom-1 left-4 text-[9px] font-bold text-slate-300 uppercase tracking-widest">
                      300mm x {strapWidthMm}mm
                    </div>
                    <div className="absolute top-2 left-1/2 -translate-x-1/2 flex items-center gap-3 text-[9px] font-black uppercase tracking-[0.18em] text-slate-400 pointer-events-none">
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500" /> Fold safe zone</span>
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500" /> Clip safe zone</span>
                    </div>
                    {dragTargetZone === z ? (
                      <div className="absolute inset-0 z-20 flex items-center justify-center rounded-[18px] border-2 border-dashed border-[#5d5fef] bg-indigo-50/80 text-center text-[11px] font-black uppercase tracking-[0.18em] text-[#4f46e5] backdrop-blur-sm pointer-events-none">
                        Drop PNG, JPG, SVG, or WEBP here
                      </div>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
          ) : (
            <div className="w-full h-full animate-in fade-in duration-500 flex items-center justify-center">
              <LanyardStage
                zoom={1.3}
                currentStep={1}
                showIdCard={false}
                tempDesign={previewDesign}
                showInspectControls={true}
              />
            </div>
          )}

          {/* Floating Bottom Toolbar (Enhanced) */}
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 bg-white/95 backdrop-blur-xl border border-slate-100 shadow-2xl rounded-[24px] p-2 flex items-center gap-1 z-30 scale-110">
            <div className="flex items-center px-2 py-1 gap-1 border-r border-slate-100 mr-1">
              <button
                onClick={() => setSelectedTool('select')}
                className={`p-2.5 rounded-xl transition-all ${selectedTool === 'select' ? 'bg-indigo-50 text-[#5d5fef]' : 'text-slate-400 hover:bg-slate-50'}`}
              >
                <Sparkles size={18} />
              </button>
              <button
                onClick={() => setSelectedTool('hand')}
                className={`p-2.5 rounded-xl transition-all ${selectedTool === 'hand' ? 'bg-indigo-50 text-[#5d5fef]' : 'text-slate-400 hover:bg-slate-50'}`}
              >
                <Hand size={18} />
              </button>
            </div>

            <div className="flex items-center px-2 py-1 gap-1 border-r border-slate-100 mr-1">
              <button onClick={undo} className="p-2.5 rounded-xl text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-all">
                <Undo2 size={18} />
              </button>
              <button onClick={redo} className="p-2.5 rounded-xl text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-all">
                <Redo2 size={18} />
              </button>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center px-2 py-1 gap-1 border-r border-slate-100 mr-1">
              <button
                onClick={() => duplicateElement('logo', currentZone, currentZone === 'left' ? 'right' : 'left')}
                className="p-2.5 rounded-xl text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-all"
                title="Copy logo to other strap"
              >
                <Copy size={18} />
              </button>
              <button
                onClick={() => flipElement('logo', currentZone)}
                className="p-2.5 rounded-xl text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-all"
                title="Rotate logo 180°"
              >
                <FlipHorizontal size={18} />
              </button>
            </div>

            <div className="flex items-center px-4 py-1 gap-5">
              <button className="text-slate-300 hover:text-slate-600"><Minus size={18} /></button>
              <span className="text-[11px] font-black text-slate-400 w-10 text-center uppercase tracking-tighter">100%</span>
              <button className="text-slate-300 hover:text-slate-600"><Plus size={18} /></button>
            </div>

            <div className="flex items-center px-2 py-1 gap-1 border-l border-slate-100 ml-1">
              <button className="p-2.5 rounded-xl text-slate-400 hover:bg-slate-50 transition-all">
                <RotateCw size={18} />
              </button>
              <button className="p-2.5 rounded-xl text-slate-400 hover:bg-slate-50 transition-all">
                <Eye size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* 3. 3D Mini Preview (Right) */}
        <div className="w-[360px] bg-white border-l border-slate-100 flex flex-col z-10 shrink-0 p-6 gap-6">
          <button
            onClick={handleSave}
            className="w-full py-3.5 bg-[#8b5cf6] hover:bg-[#7c3aed] text-white rounded-2xl font-black text-sm shadow-lg shadow-indigo-100 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
          >
            Save
          </button>

          <div className="min-h-[430px] rounded-[32px] border border-slate-200/70 bg-[linear-gradient(180deg,#edf3fb_0%,#d7e0ee_100%)] flex flex-col overflow-hidden relative group/preview shadow-inner">
            <div className="flex items-center justify-between px-5 pt-5 pb-2">
              <div>
                <div className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-500">Live 3D Layout</div>
                <div className="text-[12px] font-bold text-slate-600">Right-side production preview</div>
              </div>
              <div className="z-20 bg-white/85 backdrop-blur-md p-2 rounded-lg text-slate-600 shadow-sm">
                <Rotate3d size={16} />
              </div>
            </div>
            <div className="relative flex-1 overflow-hidden px-2 pb-3">
              <div className="absolute inset-x-0 bottom-0 top-0">
                <div className="absolute left-1/2 top-1/2 h-[112%] w-[112%] -translate-x-1/2 -translate-y-[47%]">
                  <LanyardStage
                    zoom={0.52}
                    currentStep={2}
                    showIdCard={false}
                    tempDesign={previewDesign}
                    showInspectControls={false}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Layers Panel */}
          <div className="flex-1 bg-slate-50 rounded-[24px] border border-slate-200/70 p-4 flex flex-col min-h-0 overflow-y-auto">
            <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-500 mb-3">Layers Panel ({currentZone})</h3>
            <div className="space-y-2 flex-1">
              {[...safeElements[currentZone] || []].reverse().map((element, idx) => (
                <div key={element.id} className={`flex items-center justify-between p-2 rounded-xl border transition-all cursor-pointer ${selectedElement?.id === element.id ? 'bg-white border-[#5d5fef] shadow-sm' : 'bg-transparent border-transparent hover:bg-white hover:border-slate-200'}`} onClick={() => setSelectedElement({ ...element, zone: currentZone })}>
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-6 h-6 rounded flex items-center justify-center bg-slate-100 text-slate-400 shrink-0">
                      {element.type === 'image' ? <ImageIcon size={12} /> : <Type size={12} />}
                    </div>
                    <span className="text-[11px] font-bold text-slate-700 truncate">{element.type === 'image' ? (element.name || 'Image') : element.content}</span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button type="button" onClick={(e) => { e.stopPropagation(); reorderElement(currentZone, element.id, 'forward'); }} className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-[#5d5fef]"><Move size={12} /></button>
                    <button type="button" onClick={(e) => { e.stopPropagation(); deleteElement(currentZone, element.id); }} className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-red-500"><Trash2 size={12} /></button>
                  </div>
                </div>
              ))}
              {(!safeElements[currentZone] || safeElements[currentZone].length === 0) && (
                <div className="h-full flex items-center justify-center text-[10px] font-semibold text-slate-400">No layers added</div>
              )}
            </div>
          </div>

          {currentZoneWarnings.length > 0 && (
            <div className="rounded-[24px] border border-amber-200 bg-amber-50 p-4 space-y-2">
              <div className="flex items-center gap-2 text-amber-800">
                <AlertTriangle size={16} />
                <h3 className="text-[11px] font-black uppercase tracking-widest">Live production checks</h3>
              </div>
              {currentZoneWarnings.map((item) => (
                <div key={item.elementId} className="rounded-2xl bg-white/80 border border-amber-100 px-3 py-2">
                  <div className="text-[11px] font-black text-slate-700">
                    {item.element.type === 'text' ? item.element.content : 'Uploaded image'}
                  </div>
                  <div className="text-[11px] text-amber-800 font-semibold">
                    {item.warnings[0].label}: {item.warnings[0].detail}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="space-y-4">
            <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Package Color</h3>
            <div className="flex flex-wrap gap-2.5">
              <button
                onClick={() => setShowCustomColorInput((current) => !current)}
                className="w-8 h-8 rounded-full border-2 border-slate-100 flex items-center justify-center text-slate-400 hover:border-[#5d5fef] transition-all"
                title="Add custom HEX color"
              >
                <Plus size={14} />
              </button>
              {presetColors.slice(0, 10).map((color) => (
                <button
                  key={color.name}
                  onClick={() => applyLanyardColor(color.value)}
                  className={`w-8 h-8 rounded-full border-2 transition-all ${state.lanyardColor === color.value ? 'border-[#5d5fef] scale-110 shadow-md' : 'border-white shadow-sm'}`}
                  style={{ backgroundColor: color.value }}
                />
              ))}
            </div>
            {showCustomColorInput ? (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 space-y-3">
                <div className="text-[10px] font-black uppercase tracking-widest text-slate-500">Custom HEX / Face Color Sync</div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customHexInput}
                    onChange={(e) => syncCustomHexColor(e.target.value)}
                    placeholder="#1E40AF"
                    className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:border-[#5d5fef]"
                  />
                  <input
                    type="color"
                    value={HEX_COLOR_PATTERN.test(customHexInput) ? customHexInput : '#1e40af'}
                    onChange={(e) => syncCustomHexColor(e.target.value)}
                    className="h-10 w-10 rounded-xl border border-slate-200 bg-white p-1"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={applyCustomHexColor}
                    className="flex-1 rounded-xl bg-[#5d5fef] px-3 py-2 text-[10px] font-black text-white hover:bg-[#4a4cd9] transition-all"
                  >
                    Apply & Sync
                  </button>
                  <button
                    onClick={() => setShowCustomColorInput(false)}
                    className="rounded-xl border border-slate-200 px-3 py-2 text-[10px] font-black text-slate-600 hover:bg-white transition-all"
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
      {showBrandBuilderPanel ? (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/55 p-4">
          <div className="w-full max-w-[420px] rounded-2xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
              <div>
                <h3 className="text-sm font-black text-slate-900">Brand Builder</h3>
                <p className="text-[11px] font-medium text-slate-500">Simple panel for company strip setup.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowBrandBuilderPanel(false)}
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-50 text-slate-500 transition hover:bg-red-50 hover:text-red-500"
              >
                <X size={16} />
              </button>
            </div>

            <div className="max-h-[70vh] space-y-3 overflow-y-auto p-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600">Quick style</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setBrandKit((current) => ({ ...current, layout: 'logo-name', useWhiteBadge: true }))}
                    className={`rounded-lg border px-2 py-2 text-[11px] font-semibold transition ${brandKit.layout === 'logo-name'
                        ? 'border-[#5d5fef] bg-indigo-50 text-[#5d5fef]'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                      }`}
                  >
                    Official
                  </button>
                  <button
                    type="button"
                    onClick={() => setBrandKit((current) => ({ ...current, layout: 'name-only', useWhiteBadge: false }))}
                    className={`rounded-lg border px-2 py-2 text-[11px] font-semibold transition ${brandKit.layout === 'name-only'
                        ? 'border-[#5d5fef] bg-indigo-50 text-[#5d5fef]'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                      }`}
                  >
                    Text only
                  </button>
                  <button
                    type="button"
                    onClick={() => setBrandKit((current) => ({ ...current, layout: 'logo-only', useWhiteBadge: true }))}
                    className={`rounded-lg border px-2 py-2 text-[11px] font-semibold transition ${brandKit.layout === 'logo-only'
                        ? 'border-[#5d5fef] bg-indigo-50 text-[#5d5fef]'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                      }`}
                  >
                    Logo only
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600">Company name</label>
                <input
                  type="text"
                  value={brandKit.companyName}
                  onChange={(e) => setBrandKit((current) => ({ ...current, companyName: e.target.value }))}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      applyBrandLayout();
                      setShowBrandBuilderPanel(false);
                    }
                  }}
                  placeholder="Example: Athena Health"
                  className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-800 outline-none transition focus:border-[#5d5fef]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600">Apply to</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setBrandKit((current) => ({ ...current, applyTarget: 'current' }))}
                    className={`rounded-lg border py-2 text-[11px] font-semibold transition ${brandKit.applyTarget === 'current'
                        ? 'border-[#5d5fef] bg-indigo-50 text-[#5d5fef]'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                      }`}
                  >
                    Current
                  </button>
                  <button
                    type="button"
                    onClick={() => setBrandKit((current) => ({ ...current, applyTarget: 'both' }))}
                    className={`rounded-lg border py-2 text-[11px] font-semibold transition ${brandKit.applyTarget === 'both'
                        ? 'border-[#5d5fef] bg-indigo-50 text-[#5d5fef]'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                      }`}
                  >
                    Both
                  </button>
                </div>
              </div>

              <label className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-[11px] font-semibold text-slate-600">
                <input
                  type="checkbox"
                  checked={brandKit.replaceExisting}
                  onChange={(e) => setBrandKit((current) => ({ ...current, replaceExisting: e.target.checked }))}
                  className="h-4 w-4 accent-[#5d5fef]"
                />
                Replace old items
              </label>

              <details className="rounded-lg border border-slate-200 bg-white px-2.5 py-2">
                <summary className="cursor-pointer text-[11px] font-semibold text-slate-600">
                  Advanced options
                </summary>
                <div className="mt-2 space-y-2">
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-slate-500">Tagline (optional)</label>
                    <input
                      type="text"
                      value={brandKit.tagline}
                      onChange={(e) => setBrandKit((current) => ({ ...current, tagline: e.target.value }))}
                      placeholder="Example: We Build Trust"
                      className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 text-xs font-medium text-slate-700 outline-none focus:border-[#5d5fef]"
                    />
                  </div>
                  <label className="flex items-center gap-2 text-[11px] font-semibold text-slate-600">
                    <input
                      type="checkbox"
                      checked={brandKit.useWhiteBadge}
                      onChange={(e) => setBrandKit((current) => ({ ...current, useWhiteBadge: e.target.checked }))}
                      className="h-4 w-4 accent-[#5d5fef]"
                    />
                    White badge behind logo
                  </label>
                  <button
                    type="button"
                    onClick={() => setBrandKit((current) => ({ ...current, companyName: design.customTextCenter || '', tagline: '', layout: 'logo-name', useWhiteBadge: true }))}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 text-[11px] font-semibold text-slate-600 transition hover:bg-slate-100"
                  >
                    Reset builder
                  </button>
                </div>
              </details>
            </div>

            <div className="flex gap-2 border-t border-slate-100 p-4">
              <button
                type="button"
                onClick={() => setShowBrandBuilderPanel(false)}
                className="flex-1 rounded-xl border border-slate-200 py-2.5 text-[12px] font-semibold text-slate-600 transition hover:bg-slate-50"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  applyBrandLayout();
                  setShowBrandBuilderPanel(false);
                }}
                className="flex-1 rounded-xl bg-[#5d5fef] py-2.5 text-[12px] font-bold text-white transition hover:bg-[#4f54e8]"
              >
                Apply layout
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {cropTarget ? (
        <StrapCropModal
          element={cropTarget}
          onApply={applyCropToSelection}
          onCancel={() => {
            setCropPreview(null);
            setCropTarget(null);
          }}
          onPreviewChange={(updates) => {
            if (!updates || !cropTarget?.zone || !cropTarget?.id) {
              setCropPreview(null);
              return;
            }
            setCropPreview({
              zone: cropTarget.zone,
              elementId: cropTarget.id,
              updates,
            });
          }}
        />
      ) : null}
    </>
  );
}
