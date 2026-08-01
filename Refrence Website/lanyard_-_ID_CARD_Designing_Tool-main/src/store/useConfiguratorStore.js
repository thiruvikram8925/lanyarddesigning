import { create } from 'zustand';

const LOCAL_STORAGE_KEY = 'lanyard-configurator-design';

const defaultDesign = {
  printingMethod: 'Sublimated',
  lanyardStyle: 'Single Ended',
  width: '20mm',
  length: '38',
  lanyardColor: '#ffffff',
  customColorCode: '#ffffff',
  pantone: 'White',
  isDualSided: false,
  lanyardColorBack: '#ffffff',
  customColorCodeBack: '#ffffff',
  pantoneBack: 'White',
  customPatternUrl: '',
  customPatternName: '',
  patternScale: 100,
  patternSpacing: 30,
  patternRotation: 0,
  strapPattern: null,
  strapPatternOpacity: 0.85,
  strapElements: {
    left: [],
    right: [],
    center: [],
  },
  strapValidation: {
    left: [],
    right: [],
    center: [],
  },
  copyMode: 'synchronized', // synchronized or multi-zone
  customTextLeft: '',
  customTextCenter: '',
  customTextRight: '',
  customTextSecondary: '',
  text: '',
  textLine2: '',
  textLine3: '',
  textLines: [],
  textLineSpacing: 4,
  textReverseMode: 'production',
  textColor: '#000000',
  textStrokeWidth: 0,
  textStrokeColor: '#000000',
  textShadowBlur: 0,
  letterSpacing: 0,
  lanyardDesignStyle: 'repeated', // 'repeated', 'central-logo', 'stacked-text'
  patternOffset: 0,
  textOffset: 0,
  textOffsetLeft: 0,
  textOffsetCenter: 0,
  textOffsetRight: 0,
  textYOffset: 0,
  textYOffsetLeft: 0,
  textYOffsetCenter: 0,
  textYOffsetRight: 0,
  fontFamily: 'Montserrat',
  fontColor: '#000000',
  fontSize: 18,
  fontWeight: 'bold',
  lineHeight: 1.2,
  textAlign: 'center',
  textAngle: 0,
  textSpacing: 60,
  textPosition: 'Center',
  logoUrl: '',
  logoName: '',
  logoScale: 1,
  gridSize: 20,
  showGrid: true,
  snapToGrid: true,
  logoOffset: 0,
  logoOffsetLeft: 0,
  logoOffsetCenter: 0,
  logoOffsetRight: 0,
  logoYOffset: 0,
  logoYOffsetLeft: 0,
  logoYOffsetCenter: 0,
  logoYOffsetRight: 0,
  logoRepeat: true,
  viewResetTrigger: 0,
  dualCanvasMode: true,
  premiumSubscribed: false,
  premiumUniformColor: '#f1f5f9',
  premiumUniformTextureUrl: '',
  premiumUniformFileName: '',
  premiumUniformAiStatus: 'idle',
  premiumUniformAiPreviewBoy: '',
  premiumUniformAiPreviewGirl: '',

  clipType: 'Metal Hook',
  accessories: ['Badge Holder'],
  quantity: 100,
  idCard: {
    size: '86x54',
    activeSide: 'front',
    selected: null,
    showSafeZone: true,
    bulkWorkflow: {
      mode: 'setup',
      datasetColumns: [],
      datasetRecords: [],
      imageMatchColumn: null,
      matchedImageCount: 0,
      datasetImages: {}
    },
    front: {
      backgroundColor: '#ffffff',
      elements: [],
    },
    back: {
      backgroundColor: '#ffffff',
      elements: [
        { id: 'disclaimer', type: 'text', content: 'If found, please return to sender.', x: 10, y: 10, width: 224, fontSize: 8, fill: '#000000', align: 'center' },
      ],
    },
  },
  uniformConfig: {
    male: {
      shirtTextureUrl: '',
      pantTextureUrl: '',
      maskFit: {
        shirt: { x: 14, y: 38, width: 72, height: 29 },
        bottom: { x: 25, y: 67, width: 50, height: 33 }
      }
    },
    female: {
      shirtTextureUrl: '',
      skirtTextureUrl: '',
      maskFit: {
        shirt: { x: 14, y: 38, width: 72, height: 29 },
        bottom: { x: 10, y: 67, width: 80, height: 33 }
      }
    }
  },
  equippedState: {
    lanyardEquipped: true,
    idCardEquipped: true,
    lanyardScale: 1.0
  },
};

const clone = (value) => JSON.parse(JSON.stringify(value));

function mergeDesignWithDefaults(partial = {}) {
  const base = clone(defaultDesign);
  return {
    ...base,
    ...partial,
    customColorCode: partial.customColorCode ?? partial.lanyardColor ?? base.customColorCode,
    idCard: {
      ...base.idCard,
      ...(partial.idCard ?? {}),
      bulkWorkflow: {
        ...base.idCard.bulkWorkflow,
        ...(partial.idCard?.bulkWorkflow ?? {})
      }
    },
  };
}

function updateAtPath(target, path, value) {
  const keys = path.split('.');
  const next = clone(target);
  let pointer = next;

  keys.slice(0, -1).forEach((key) => {
    pointer[key] = pointer[key] ?? {};
    pointer = pointer[key];
  });

  pointer[keys.at(-1)] = value;
  return next;
}

function commitChange(set, mutator) {
  set((state) => {
    const current = clone(state.design);
    const nextDesign = mutator(current);
    return {
      design: nextDesign,
      past: [...state.past, state.design],
      future: [],
    };
  });
}

export const useConfiguratorStore = create((set, get) => ({
  design: clone(defaultDesign),
  livePreviewPatch: null,
  past: [],
  future: [],
  uploads: {
    customPatternFile: null,
    strapLogoFile: null,
    idPhotoFile: null,
    idLogoFile: null,
  },
  setField: (path, value) => commitChange(set, (current) => updateAtPath(current, path, value)),
  applyDesignSnapshot: (nextDesign) =>
    set((state) => ({
      design: mergeDesignWithDefaults(nextDesign),
      livePreviewPatch: null,
      past: [...state.past, state.design],
      future: [],
    })),
  setLivePreviewPatch: (patch) => set({ livePreviewPatch: patch }),
  clearLivePreviewPatch: () => set({ livePreviewPatch: null }),
  triggerViewReset: () => set((state) => ({ 
    design: { ...state.design, viewResetTrigger: state.design.viewResetTrigger + 1 } 
  })),
  mirrorDesign: (fromZone, toZone) =>
    commitChange(set, (current) => {
      const updates = {};
      const suffixes = { left: 'Left', center: 'Center', right: 'Right' };
      const fromSuffix = suffixes[fromZone];
      const toSuffix = suffixes[toZone];

      ['customText', 'textOffset', 'textYOffset', 'logoOffset', 'logoYOffset'].forEach((field) => {
        const fromKey = `${field}${fromSuffix}`;
        const toKey = `${field}${toSuffix}`;
        if (fromKey in current) {
          updates[toKey] = current[fromKey];
        }
      });

      return { ...current, ...updates };
    }),
  toggleAccessory: (label) =>
    commitChange(set, (current) => {
      const accessories = current.accessories.includes(label)
        ? current.accessories.filter((item) => item !== label)
        : [...current.accessories, label];
      return { ...current, accessories };
    }),
  setUploadAsset: (key, file, previewUrl, name = '') => {
    set((state) => ({
      uploads: {
        ...state.uploads,
        [key]: file,
      },
    }));

    if (key === 'strapLogoFile') {
      commitChange(set, (current) => ({ ...current, logoUrl: previewUrl, logoName: name }));
    }

    if (key === 'customPatternFile') {
      commitChange(set, (current) => ({
        ...current,
        customPatternUrl: previewUrl,
        customPatternName: name,
      }));
    }

    if (key === 'idPhotoFile') {
      commitChange(set, (current) => ({
        ...current,
        idCard: { ...current.idCard, photoUrl: previewUrl },
      }));
    }

    if (key === 'idLogoFile') {
      commitChange(set, (current) => ({
        ...current,
        idCard: { ...current.idCard, logoUrl: previewUrl },
      }));
    }
  },
  undo: () =>
    set((state) => {
      if (!state.past.length) return state;
      const previous = state.past.at(-1);
      return {
        design: previous,
        livePreviewPatch: null,
        past: state.past.slice(0, -1),
        future: [state.design, ...state.future],
      };
    }),
  redo: () =>
    set((state) => {
      if (!state.future.length) return state;
      const next = state.future[0];
      return {
        design: next,
        livePreviewPatch: null,
        past: [...state.past, state.design],
        future: state.future.slice(1),
      };
    }),
  saveLocal: () => {
      try {
        const snapshot = get().design;
        let dataToSave = JSON.stringify(snapshot);
        
        // If design is too large (likely due to base64 images), strip them
        if (dataToSave.length > 1500000) { // If > 1.5MB
          const stripped = { ...snapshot };
          if (stripped.logoUrl?.startsWith('data:')) stripped.logoUrl = '';
          if (stripped.customPatternUrl?.startsWith('data:')) stripped.customPatternUrl = '';
          if (stripped.idCard?.photoUrl?.startsWith('data:')) {
            stripped.idCard = { ...stripped.idCard, photoUrl: '' };
          }
          if (stripped.idCard?.logoUrl?.startsWith('data:')) {
            stripped.idCard = { ...stripped.idCard, logoUrl: '' };
          }
          dataToSave = JSON.stringify(stripped);
        }
        
        window.localStorage.setItem(LOCAL_STORAGE_KEY, dataToSave);
      } catch (e) {
        console.warn("localStorage quota exceeded, clearing old draft and trying again", e);
        try {
          window.localStorage.removeItem(LOCAL_STORAGE_KEY);
          // Try saving a minimal version if even the stripped one fails
          const minimal = { ...get().design, logoUrl: '', customPatternUrl: '', idCard: { ...get().design.idCard, photoUrl: '', logoUrl: '' } };
          window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(minimal));
        } catch (innerE) {
          console.error("Critical storage failure", innerE);
        }
      }
    },
  loadLocal: () => {
    const saved = window.localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!saved) return false;
    try {
      const parsed = JSON.parse(saved);
      set({ design: mergeDesignWithDefaults(parsed), past: [], future: [] });
      return true;
    } catch {
      return false;
    }
  },
  loadPreset: (presetData) => {
    set((state) => ({
      design: mergeDesignWithDefaults({ ...clone(defaultDesign), ...presetData }),
      livePreviewPatch: null,
      past: [...state.past, state.design],
      future: [],
    }));
  },
  resetDesign: () => {
    set({
      design: clone(defaultDesign),
      livePreviewPatch: null,
      past: [],
      future: [],
      uploads: {
        customPatternFile: null,
        strapLogoFile: null,
        idPhotoFile: null,
        idLogoFile: null,
      },
    });
  },
  canUndo: () => get().past.length > 0,
  canRedo: () => get().future.length > 0,
}));
