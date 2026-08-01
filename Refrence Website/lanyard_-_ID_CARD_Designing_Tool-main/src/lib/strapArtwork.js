export const STRAP_EDITOR_WIDTH_PX = 800;
export const STRAP_EDITOR_HEIGHT_PX = 70;
const STRAP_EDITOR_CENTER_X = STRAP_EDITOR_WIDTH_PX / 2;
const STRAP_EDITOR_CENTER_Y = STRAP_EDITOR_HEIGHT_PX / 2;
const PRODUCTION_LENGTH_MM = 300;
const TOLERANCE_MM = 1;
const DEFAULT_STITCH_INSET_MM = 1.2;
const DEFAULT_FOLD_CLEARANCE_MM = 18;

const CLIP_CLEARANCE_BY_TYPE = {
  'Metal Hook': 24,
  'Plastic Hook': 26,
  'Crocodile Clip': 20,
  'Ski Reel': 30,
};

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const getClipClearanceMm = (clipType) => CLIP_CLEARANCE_BY_TYPE[clipType] ?? CLIP_CLEARANCE_BY_TYPE['Metal Hook'];

export const getStrapWidthMm = (width) => {
  if (typeof width === 'number' && Number.isFinite(width)) return width;
  const parsed = parseInt(String(width || '20mm').replace('mm', ''), 10);
  return Number.isFinite(parsed) ? parsed : 20;
};

export const getStrapLengthInches = (length) => {
  if (typeof length === 'number' && Number.isFinite(length)) return length;
  const parsed = parseInt(String(length || '38').replace('"', '').replace('inch', ''), 10);
  return Number.isFinite(parsed) ? parsed : 38;
};

export const getStageStrapWidthPx = (width) => Math.max(14, (getStrapWidthMm(width) / 20) * 36);

export const getLanyardStageGeometry = (width, length) => {
  const strapW = getStageStrapWidthPx(width);
  const lengthInches = getStrapLengthInches(length);
  const LOOP_H = Math.round((lengthInches / 38) * 450);
  const CX = 410;
  const TOP_Y = 50;
  const SPREAD = 140;
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
};

const getDisplayScale = (strapWidthMm) => ({
  alongPxPerMm: STRAP_EDITOR_WIDTH_PX / PRODUCTION_LENGTH_MM,
  crossPxPerMm: STRAP_EDITOR_HEIGHT_PX / strapWidthMm,
});

const rotateBox = (width, height, rotation = 0) => {
  const radians = (rotation * Math.PI) / 180;
  const cos = Math.abs(Math.cos(radians));
  const sin = Math.abs(Math.sin(radians));
  return {
    width: (width * cos) + (height * sin),
    height: (width * sin) + (height * cos),
  };
};

const getTextBox = (element) => {
  const fontSize = element.fontSize || 16;
  const lineHeight = element.lineHeight || 1.2;
  const letterSpacing = element.letterSpacing || 0;
  const lines = String(element.content || '').split('\n');
  const widestLine = lines.reduce((max, line) => Math.max(max, line.length), 0);
  const textWidth = Math.max(
    fontSize * 0.75,
    (widestLine * fontSize * 0.58) + (Math.max(widestLine - 1, 0) * letterSpacing),
  );
  const textHeight = Math.max(fontSize, lines.length * fontSize * lineHeight);
  return {
    width: textWidth,
    height: textHeight,
  };
};

export const getElementBoundsPx = (element) => {
  const base =
    element.type === 'image'
      ? {
          width: element.width || 40,
          height: element.height || 40,
        }
      : element.type === 'text' && element.width
      ? {
          width: element.width,
          height: element.fontSize || 16,
        }
      : getTextBox(element);

  return rotateBox(base.width, base.height, element.rotation || 0);
};

export const getArtworkModel = ({ width, clipType } = {}) => {
  const strapWidthMm = getStrapWidthMm(width);
  const scale = getDisplayScale(strapWidthMm);
  const clipClearanceMm = getClipClearanceMm(clipType);
  const foldClearanceMm = DEFAULT_FOLD_CLEARANCE_MM;
  const stitchInsetMm = DEFAULT_STITCH_INSET_MM;
  const printableHalfWidthMm = Math.max(0, (strapWidthMm / 2) - stitchInsetMm - TOLERANCE_MM);

  return {
    strapWidthMm,
    clipClearanceMm,
    foldClearanceMm,
    stitchInsetMm,
    printableHalfWidthMm,
    toleranceMm: TOLERANCE_MM,
    editor: {
      widthPx: STRAP_EDITOR_WIDTH_PX,
      heightPx: STRAP_EDITOR_HEIGHT_PX,
      centerX: STRAP_EDITOR_CENTER_X,
      centerY: STRAP_EDITOR_CENTER_Y,
      productionLengthMm: PRODUCTION_LENGTH_MM,
      alongPxPerMm: scale.alongPxPerMm,
      crossPxPerMm: scale.crossPxPerMm,
    },
  };
};

export const getEditorPlacement = (element, options = {}) => {
  const model = getArtworkModel(options);
  const { alongPxPerMm, crossPxPerMm } = model.editor;
  const boundsPx = getElementBoundsPx(element);
  const centerX = STRAP_EDITOR_CENTER_X + (element.x || 0);
  const centerY = STRAP_EDITOR_CENTER_Y + (element.y || 0);
  const alongMm = centerX / alongPxPerMm;
  const crossMm = (centerY - STRAP_EDITOR_CENTER_Y) / crossPxPerMm;

  return {
    model,
    centerX,
    centerY,
    boundsPx,
    alongMm,
    crossMm,
    u: clamp(centerX / STRAP_EDITOR_WIDTH_PX, 0, 1),
    v: clamp(centerY / STRAP_EDITOR_HEIGHT_PX, 0, 1),
    alongHalfMm: (boundsPx.width / alongPxPerMm) / 2,
    crossHalfMm: (boundsPx.height / crossPxPerMm) / 2,
  };
};

export const validateArtworkElement = (element, options = {}) => {
  const placement = getEditorPlacement(element, options);
  const {
    foldClearanceMm,
    clipClearanceMm,
    printableHalfWidthMm,
    toleranceMm,
  } = placement.model;
  const { alongMm, crossMm, alongHalfMm, crossHalfMm, boundsPx } = placement;

  const leftEdgeMm = alongMm - alongHalfMm;
  const rightEdgeMm = alongMm + alongHalfMm;
  const topEdgeMm = crossMm - crossHalfMm;
  const bottomEdgeMm = crossMm + crossHalfMm;

  const visibleLeftMm = Math.max(leftEdgeMm, foldClearanceMm);
  const visibleRightMm = Math.min(rightEdgeMm, PRODUCTION_LENGTH_MM - clipClearanceMm);
  const visibleTopMm = Math.max(topEdgeMm, -printableHalfWidthMm);
  const visibleBottomMm = Math.min(bottomEdgeMm, printableHalfWidthMm);

  const warnings = [];

  if (leftEdgeMm < foldClearanceMm + toleranceMm) {
    warnings.push({
      type: 'fold',
      label: 'Fold overlap',
      detail: `Moves inside the folded return zone by ${Math.max(0, foldClearanceMm - leftEdgeMm).toFixed(1)} mm`,
    });
  }

  if (rightEdgeMm > (PRODUCTION_LENGTH_MM - clipClearanceMm - toleranceMm)) {
    warnings.push({
      type: 'clip',
      label: 'Clip overlap',
      detail: `Moves into the clip hardware zone by ${Math.max(0, rightEdgeMm - (PRODUCTION_LENGTH_MM - clipClearanceMm)).toFixed(1)} mm`,
    });
  }

  if (topEdgeMm < (-printableHalfWidthMm + toleranceMm) || bottomEdgeMm > (printableHalfWidthMm - toleranceMm)) {
    warnings.push({
      type: 'stitch',
      label: 'Stitch line',
      detail: 'Extends beyond the printable lane between the stitch lines',
    });
  }

  const visibleWidthPx = clamp((visibleRightMm - visibleLeftMm) * placement.model.editor.alongPxPerMm, 0, boundsPx.width);
  const visibleHeightPx = clamp((visibleBottomMm - visibleTopMm) * placement.model.editor.crossPxPerMm, 0, boundsPx.height);
  const totalArea = Math.max(boundsPx.width * boundsPx.height, 1);
  const visibleArea = visibleWidthPx * visibleHeightPx;
  const hiddenAreaRatio = clamp(1 - (visibleArea / totalArea), 0, 1);

  return {
    ...placement,
    warnings,
    hiddenAreaRatio,
    isObscured: warnings.some((warning) => warning.type === 'clip' || warning.type === 'fold'),
    isOutOfPrintBounds: visibleWidthPx <= 1 || visibleHeightPx <= 1,
    clipRectPx: {
      x: clamp((visibleLeftMm - alongMm) * placement.model.editor.alongPxPerMm, -boundsPx.width / 2, boundsPx.width / 2),
      y: clamp((visibleTopMm - crossMm) * placement.model.editor.crossPxPerMm, -boundsPx.height / 2, boundsPx.height / 2),
      width: visibleWidthPx,
      height: visibleHeightPx,
    },
  };
};

export const getZoneValidation = (elements = [], options = {}) =>
  (elements || []).map((element) => ({
    elementId: element.id,
    element,
    ...validateArtworkElement(element, options),
  }));

export const getEditorSafeZones = (options = {}) => {
  const model = getArtworkModel(options);
  const { alongPxPerMm, crossPxPerMm, widthPx, heightPx } = model.editor;
  const leftWidth = model.foldClearanceMm * alongPxPerMm;
  const rightWidth = model.clipClearanceMm * alongPxPerMm;
  const insetHeight = model.stitchInsetMm * crossPxPerMm;

  return {
    leftFold: {
      x: 0,
      y: 0,
      width: leftWidth,
      height: heightPx,
    },
    rightClip: {
      x: widthPx - rightWidth,
      y: 0,
      width: rightWidth,
      height: heightPx,
    },
    topStitch: {
      x: 0,
      y: 0,
      width: widthPx,
      height: insetHeight,
    },
    bottomStitch: {
      x: 0,
      y: heightPx - insetHeight,
      width: widthPx,
      height: insetHeight,
    },
  };
};

export const mapEditorElementToStrap = (element, geometry, options = {}) => {
  const validation = validateArtworkElement(element, options);
  const { x1, y1, x2, y2, strapW } = geometry;
  const dx = x2 - x1;
  const dy = y2 - y1;
  const distance = Math.hypot(dx, dy) || 1;
  const tangentX = dx / distance;
  const tangentY = dy / distance;
  const normalX = -tangentY;
  const normalY = tangentX;
  const rawAngle = Math.atan2(dy, dx) * (180 / Math.PI);
  const isBackwards = rawAngle > 90 || rawAngle < -90;
  const isOpposite = options.textDirection !== 'same';
  const shouldRotate180 = isBackwards && isOpposite;
  const angle = shouldRotate180 ? rawAngle + 180 : rawAngle;
  const crossRatio = clamp(
    validation.crossMm / Math.max(validation.model.printableHalfWidthMm, 0.001),
    -1,
    1,
  );
  const printableHalfW = Math.max(4, (strapW / 2) - ((validation.model.stitchInsetMm / validation.model.strapWidthMm) * strapW));
  const wrappedOffset = Math.sin((crossRatio * Math.PI) / 2) * printableHalfW;
  const curvatureLift = Math.sin(validation.u * Math.PI) * strapW * 0.12;
  const anchorX = x1 + (dx * validation.u) + (normalX * (wrappedOffset + curvatureLift));
  const anchorY = y1 + (dy * validation.u) + (normalY * (wrappedOffset + curvatureLift));
  const scaleXMultiplier = options.dualCanvasMode && options.isRightStrap && options.textDirection === 'same' ? -1 : 1;
  const surfaceScale = 0.92 + (Math.cos(Math.abs(crossRatio) * Math.PI * 0.5) * 0.08);

  return {
    ...validation,
    x: anchorX,
    y: anchorY,
    angle,
    surfaceScale,
    scaleXMultiplier,
    clipRectPx: {
      x: validation.clipRectPx.x,
      y: validation.clipRectPx.y,
      width: validation.clipRectPx.width,
      height: validation.clipRectPx.height,
    },
  };
};
