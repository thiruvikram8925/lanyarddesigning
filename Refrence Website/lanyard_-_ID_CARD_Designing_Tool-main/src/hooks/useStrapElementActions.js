import { useCallback } from 'react';
import { showToast } from '../components/Toast';
import { validateArtworkElement } from '../lib/strapArtwork';

const createElementId = (prefix) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const normalizeEditorZone = (zone) => (zone === 'right' ? 'right' : (zone === 'center' ? 'center' : 'left'));

const DEFAULT_TEXT_POSITIONS = [
  { x: 0, y: 0 },
  { x: -90, y: -10 },
  { x: 90, y: 10 },
  { x: -45, y: 12 },
  { x: 45, y: -12 },
];

function getNextTextPlacement(existingElements = [], options = {}) {
  const textCount = (existingElements || []).filter((element) => element.type === 'text').length;
  const basePlacement = DEFAULT_TEXT_POSITIONS[textCount % DEFAULT_TEXT_POSITIONS.length];
  
  // Quick validation check for new element placement
  const dummyElement = {
    type: 'text',
    x: basePlacement.x,
    y: basePlacement.y,
    fontSize: 18,
    width: 200,
  };
  
  const validation = validateArtworkElement(dummyElement, options);
  
  // If we have fold or clip overlap, try to nudge it towards center
  if (validation.warnings.some(w => w.type === 'fold' || w.type === 'clip')) {
    // Fold is on the left (negative x in editor), Clip is on the right (positive x in editor)
    // We try to nudge by 10px increments up to 10 times
    let nudgedX = basePlacement.x;
    for (let i = 0; i < 10; i++) {
      const isFold = validation.warnings.some(w => w.type === 'fold');
      const isClip = validation.warnings.some(w => w.type === 'clip');
      
      if (isFold) nudgedX += 10;
      if (isClip) nudgedX -= 10;
      
      const nextValidation = validateArtworkElement({ ...dummyElement, x: nudgedX }, options);
      if (!nextValidation.warnings.some(w => w.type === 'fold' || w.type === 'clip')) {
        return { x: nudgedX, y: basePlacement.y };
      }
    }
  }
  
  return basePlacement;
}

function getBaseColor(color) {
  if (!color) return '#0f172a';
  if (color.includes('gradient')) {
    return color.match(/#[a-fA-F0-9]{6}/g)?.[0] || '#0f172a';
  }
  return color;
}

function getReadableTextFill(preferredColor, backgroundColor) {
  const color = getBaseColor(preferredColor);
  const background = getBaseColor(backgroundColor);

  const toRgb = (hex) => {
    const normalized = hex.replace('#', '');
    if (!/^[0-9a-fA-F]{6}$/.test(normalized)) return null;
    return {
      r: parseInt(normalized.slice(0, 2), 16),
      g: parseInt(normalized.slice(2, 4), 16),
      b: parseInt(normalized.slice(4, 6), 16),
    };
  };

  const rgb = toRgb(color);
  const bgRgb = toRgb(background);
  if (!rgb || !bgRgb) return preferredColor || '#0f172a';

  const luminance = ({ r, g, b }) => ((0.2126 * r) + (0.7152 * g) + (0.0722 * b)) / 255;
  const colorLum = luminance(rgb);
  const bgLum = luminance(bgRgb);
  const contrastGap = Math.abs(colorLum - bgLum);

  if (contrastGap >= 0.42) return color;
  return bgLum > 0.58 ? '#0f172a' : '#ffffff';
}

export function useStrapElementActions({
  state,
  design,
  setElements,
  setSelectedElement,
  cropTarget,
  setCropTarget,
  setCropPreview,
}) {
  const addTextElement = useCallback((text, zone, onAdded) => {
    if (!text?.trim()) {
      showToast('Please enter text before adding', 'error', 'Empty text');
      return;
    }
    const safeZone = normalizeEditorZone(zone);
    const options = { width: design?.width, clipType: design?.clipType };

    const createTextElement = (id, placement) => ({
      id,
      type: 'text',
      content: text.trim(),
      x: placement.x,
      y: placement.y,
      fontSize: state.fontSize || 18,
      fontFamily: state.fontFamily || 'Montserrat',
      fill: getReadableTextFill(state.fontColor || '#ffffff', state.lanyardColor),
      fontStyle: state.fontWeight || 'bold',
      lineHeight: state.lineHeight || 1.2,
      letterSpacing: 0,
      align: state.textAlign || 'center',
      width: 200,
      height: 30,
      opacity: 1,
    });

    let nextSelectedElement = null;

    setElements((prev) => {
      if (state.copyMode === 'synchronized' && safeZone !== 'center') {
        const leftPlacement = getNextTextPlacement(prev?.left || [], options);
        const rightPlacement = getNextTextPlacement(prev?.right || [], options);
        const leftElement = createTextElement(createElementId('text-left'), leftPlacement);
        const rightElement = createTextElement(createElementId('text-right'), rightPlacement);
        nextSelectedElement = {
          ...(safeZone === 'right' ? rightElement : leftElement),
          zone: safeZone,
        };

        return {
          ...prev,
          left: [...(prev?.left || []), leftElement],
          right: [...(prev?.right || []), rightElement],
        };
      }

      const newElement = createTextElement(
        createElementId('text'),
        getNextTextPlacement(prev?.[safeZone] || [], options),
      );

      nextSelectedElement = { ...newElement, zone: safeZone };

      return {
        ...prev,
        [safeZone]: [...(prev?.[safeZone] || []), newElement],
      };
    });

    if (nextSelectedElement) {
      setSelectedElement(nextSelectedElement);
      onAdded?.(nextSelectedElement);
    }
  }, [setElements, setSelectedElement, state.copyMode, state.fontColor, state.fontFamily, state.fontSize, state.fontWeight, state.lanyardColor, state.lineHeight, state.textAlign, design?.width, design?.clipType]);

  const addImageElement = useCallback((asset, zone, meta) => {
    if (!asset || !asset.previewUrl) {
      showToast('Failed to process image asset', 'error', 'Invalid image');
      return;
    }

    if (!meta || !meta.width || !meta.height || !meta.imageSize) {
      showToast('Could not determine image dimensions', 'error', 'Image error');
      return;
    }
    const safeZone = normalizeEditorZone(zone);
    const options = { width: design?.width, clipType: design?.clipType };
    
    // Quick validation check for new image placement
    const dummyImage = {
      type: 'image',
      x: 0,
      y: 0,
      width: meta.imageSize.width,
      height: meta.imageSize.height,
    };
    
    let placementX = 0;
    const validation = validateArtworkElement(dummyImage, options);
    if (validation.warnings.some(w => w.type === 'fold' || w.type === 'clip')) {
      // Nudge if needed
      for (let i = 0; i < 15; i++) {
        const isFold = validation.warnings.some(w => w.type === 'fold');
        const isClip = validation.warnings.some(w => w.type === 'clip');
        if (isFold) placementX += 10;
        if (isClip) placementX -= 10;
        const nextV = validateArtworkElement({ ...dummyImage, x: placementX }, options);
        if (!nextV.warnings.some(w => w.type === 'fold' || w.type === 'clip')) break;
      }
    }

    const newElement = {
      id: createElementId('image'),
      type: 'image',
      name: asset.name || 'Uploaded image',
      src: asset.previewUrl,
      x: placementX,
      y: 0,
      width: meta.imageSize.width,
      height: meta.imageSize.height,
      cropX: 0,
      cropY: 0,
      cropWidth: meta.width,
      cropHeight: meta.height,
      sourceWidth: meta.width,
      sourceHeight: meta.height,
      opacity: 1,
    };

    setElements((prev) => {
      if (state.copyMode === 'synchronized' && safeZone !== 'center') {
        const leftElement = { ...newElement, id: createElementId('image-left') };
        const rightElement = { ...newElement, id: createElementId('image-right') };
        setSelectedElement({
          ...(safeZone === 'right' ? rightElement : leftElement),
          zone: safeZone,
        });
        return {
          ...prev,
          left: [...(prev?.left || []), leftElement],
          right: [...(prev?.right || []), rightElement],
        };
      }

      return {
        ...prev,
        [safeZone]: [...(prev?.[safeZone] || []), newElement],
      };
    });
    if (state.copyMode !== 'synchronized') {
      setSelectedElement({ ...newElement, zone: safeZone });
    }
  }, [setElements, setSelectedElement, state.copyMode, design?.width, design?.clipType]);

  const updateElement = useCallback((zone, elementId, updates) => {
    const safeZone = normalizeEditorZone(zone);
    if (!safeZone || !elementId) {
      console.error('Cannot update element: missing zone or elementId', { zone, elementId });
      return;
    }

    setElements((prev) => {
      if (!Array.isArray(prev?.[safeZone])) {
        console.warn(`Zone ${safeZone} does not exist in elements`, prev);
        return prev;
      }

      return {
        ...prev,
        [safeZone]: prev[safeZone].map((el) => (el.id === elementId ? { ...el, ...updates } : el)),
      };
    });
  }, [setElements]);

  const deleteElement = useCallback((zone, elementId) => {
    if (!zone || !elementId) {
      showToast('Cannot delete: invalid element', 'error', 'Delete failed');
      return;
    }

    setElements((prev) => ({
      ...prev,
      [zone]: (prev?.[zone] || []).filter((el) => el.id !== elementId),
    }));

    if (cropTarget?.elementId === elementId && cropTarget?.zone === zone) {
      setCropTarget(null);
      setCropPreview(null);
    }

    setSelectedElement((current) => (
      current?.id === elementId && current?.zone === zone ? null : current
    ));
  }, [cropTarget?.elementId, cropTarget?.zone, setCropPreview, setCropTarget, setElements, setSelectedElement]);

  const duplicateElementToZone = useCallback((element, fromZone, toZone) => {
    if (!element || !element.id || !fromZone || !toZone) {
      showToast('Cannot duplicate invalid element', 'error', 'Copy failed');
      return;
    }

    const newElement = {
      ...element,
      id: createElementId(element.type),
      x: element.x || 0,
      y: element.y || 0,
    };

    setElements((prev) => ({
      left: prev?.left || [],
      right: prev?.right || [],
      [toZone]: [...(prev?.[toZone] || []), newElement],
    }));
  }, [setElements]);

  const reorderElement = useCallback((zone, elementId, direction) => {
    if (!zone || !elementId) return;

    setElements((prev) => {
      if (!Array.isArray(prev?.[zone])) return prev;
      const nextZone = [...prev[zone]];
      const currentIndex = nextZone.findIndex((element) => element.id === elementId);
      if (currentIndex === -1) return prev;

      let targetIndex = currentIndex;
      if (direction === 'forward') targetIndex = Math.min(nextZone.length - 1, currentIndex + 1);
      if (direction === 'backward') targetIndex = Math.max(0, currentIndex - 1);
      if (direction === 'front') targetIndex = nextZone.length - 1;
      if (direction === 'back') targetIndex = 0;
      if (targetIndex === currentIndex) return prev;

      const [element] = nextZone.splice(currentIndex, 1);
      nextZone.splice(targetIndex, 0, element);

      return {
        ...prev,
        [zone]: nextZone,
      };
    });
  }, [setElements]);

  const openCropEditor = useCallback((element, targetZone) => {
    if (!element?.src) {
      showToast('Invalid image selected', 'error', 'Crop error');
      return;
    }
    if (!element?.id) {
      showToast('Could not identify image', 'error', 'Crop error');
      return;
    }
    setCropTarget({
      ...element,
      zone: targetZone,
      elementId: element.id,
    });
  }, [setCropTarget]);

  const handleImageSelection = useCallback((element, targetZone, selectedElement) => {
    if (!element?.id) {
      showToast('Invalid element', 'error', 'Selection error');
      return;
    }

    const nextSelection = { ...element, zone: targetZone };
    if (selectedElement?.id === element.id && selectedElement?.zone === targetZone) {
      openCropEditor(element, targetZone);
      return;
    }
    setSelectedElement(nextSelection);
  }, [openCropEditor, setSelectedElement]);

  const applyCropToSelection = useCallback((cropUpdates) => {
    if (!cropTarget?.zone) {
      showToast('Crop zone not set', 'error', 'Crop error');
      return;
    }
    if (!cropTarget?.id && !cropTarget?.elementId) {
      showToast('Element not identified', 'error', 'Crop error');
      return;
    }

    const elementId = cropTarget.elementId || cropTarget.id;
    updateElement(cropTarget.zone, elementId, cropUpdates);
    setCropPreview(null);
    setCropTarget(null);
  }, [cropTarget, setCropPreview, setCropTarget, updateElement]);

  return {
    addTextElement,
    addImageElement,
    updateElement,
    deleteElement,
    duplicateElementToZone,
    reorderElement,
    openCropEditor,
    handleImageSelection,
    applyCropToSelection,
  };
}
