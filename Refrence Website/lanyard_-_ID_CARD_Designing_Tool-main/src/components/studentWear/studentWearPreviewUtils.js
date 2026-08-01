import { cardSizes, SAFETY_MARGIN } from '../../data/cardConfig';
import { toHexColor } from '../../lib/colorUtils';

export const PORTRAIT_FRAME_CLASSNAME = 'preview-container';

export function getAccentColor(color) {
  if (typeof color === 'string' && color.includes('gradient')) {
    const gradientMatch = color.match(/#(?:[0-9a-fA-F]{3}){1,2}/);
    if (gradientMatch) return gradientMatch[0];
  }

  return toHexColor(color, '#5d5fef');
}

export function getPreviewFrame(idCardSize) {
  const { width, height } = cardSizes[idCardSize] || cardSizes['86x54'];
  const safeWidth = width - (SAFETY_MARGIN * 2);
  const safeHeight = height - (SAFETY_MARGIN * 2);
  const isHorizontal = width > height;
  const frameWidth = isHorizontal ? 126 : 92;
  const frameHeight = isHorizontal ? 94 : 132;
  const cardScale = Math.min(frameWidth / safeWidth, frameHeight / safeHeight);
  const previewWidth = safeWidth * cardScale;
  const previewHeight = safeHeight * cardScale;

  return {
    frameWidth,
    frameHeight,
    cardScale,
    previewOffsetX: (frameWidth - previewWidth) / 2,
    previewOffsetY: (frameHeight - previewHeight) / 2,
  };
}
