import { create } from 'zustand';
import localforage from 'localforage';
import { projectService } from '../services/dataService';
import { hydrateBatchImageStore } from '../utils/batchImageStore';

let saveTimeout: ReturnType<typeof setTimeout> | null = null;

const LOCAL_STORAGE_KEY = 'lanyard-configurator-design';

export type DatasetRecord = Record<string, string | number | boolean | null>;

export interface Element {
  id: string;
  type: 'text' | 'image' | 'rect' | 'circle' | 'triangle' | 'rhombus' | 'qr' | 'barcode' | 'frame' | 'line';
  x: number;
  y: number;
  width?: number;
  height?: number;
  rotation?: number;
  scaleX?: number;
  scaleY?: number;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  opacity?: number;
  cornerRadius?: number | number[];
  content?: string;
  fontSize?: number;
  align?: 'left' | 'center' | 'right';
  fontStyle?: string;
  fontFamily?: string;
  lineHeight?: number;
  letterSpacing?: number;
  src?: string;
  points?: number[];
  tension?: number;
  shapeType?: string;
  lineCap?: string;
  lineJoin?: string;
  closed?: boolean;
  _debugLogged?: string | null;
  qrMode?: 'mapped' | 'dummy' | 'full_row';
  qrDummyText?: string;
  qrFullRowFormat?: 'json' | 'csv' | 'text';
  barcodeMode?: 'mapped' | 'series';
  barcodeSeriesStart?: number;
  barcodeSeriesPrefix?: string;
  barcodeSeriesSuffix?: string;
  barcodeFormat?: string; // CODE128, EAN13, etc.
}

export interface SideData {
  backgroundColor: string;
  backgroundImage?: string;
  elements: Element[];
}

export interface TemplateVariant {
  id: string;
  name: string;
  condition: {
    column: string;
    value: string;
  };
  frontImage: string | null;
  backImage: string | null;
}

export interface LanyardLogoItem {
  id: string;
  url: string;
  name: string;
  xOffset: number;
  scale: number;
  rotation: number;
  borderWidth: number;
  borderColor: string;
  borderRadius: number;
  opacity: number;
}

export interface Design {
  printingMethod: string;
  lanyardStyle: string;
  width: string;
  lanyardColor: string;
  customColorCode: string;
  pantone: string;
  customPatternUrl: string;
  customPatternName: string;
  patternScale: number;
  patternSpacing: number;
  patternRotation: number;
  strapPattern: string | null;
  strapPatternOpacity: number;
  copyMode: 'synchronized' | 'multi-zone';
  customTextLeft: string;
  customTextCenter: string;
  customTextRight: string;
  customTextSecondary: string;
  lanyardDesignStyle: string;
  predefinedWord: string;
  patternOffset: number;
  textOffset: number;
  textOffsetLeft: number;
  textOffsetCenter: number;
  textOffsetRight: number;
  fontFamily: string;
  fontColor: string;
  fontSize: number;
  textAngle: number;
  textSpacing: number;
  textPosition: string;
  logoUrl: string;
  logoName: string;
  logoScale: number;
  logoRotation?: number;
  logoBorderWidth?: number;
  logoBorderColor?: string;
  logoBorderRadius?: number;
  logoOpacity?: number;
  logoCropX?: number;
  logoCropY?: number;
  logoCropWidth?: number;
  logoCropHeight?: number;
  lanyardLogos?: LanyardLogoItem[];
  gridSize: number;
  showGrid: boolean;
  snapToGrid: boolean;
  selectedLanyardElement: 'text' | 'logo' | null;
  logoOffset: number;
  logoOffsetLeft: number;
  logoOffsetCenter: number;
  logoOffsetRight: number;
  logoRepeat: boolean;
  logoSpacing?: number;
  logoMode?: 'repeated' | 'single';
  clipType: string;
  accessories: string[];
  quantity: number;
  idCard: {
    size: string;
    activeSide: 'front' | 'back';
    selected: string | null;
    selectedElement: string | null;
    showBothSides: boolean;
    showGrid?: boolean;
    defaultFontFamily?: string;
    defaultColor?: string;
    photoUrl?: string;
    logoUrl?: string;
    defaultFontSize: number;
    defaultBold: boolean;
    defaultItalic: boolean;
    cornerRadius: number;
    showTrimLine: boolean;
    drawingTool: 'none' | 'straight' | '2point' | 'multipoint' | 'freeform' | 'custom_frame' | 'freeform_frame';
    front: SideData;
    back: SideData;
    bulkWorkflow: {
      mode: 'setup' | 'design' | 'export';
      mapping: Record<string, string>;
      datasetColumns: string[];
      datasetRecords: DatasetRecord[];
      datasetImages?: Record<string, string>;
      dateColumns?: string[];
      dateFormat?: string;
      imageMatchColumn?: string | null;
      matchedImageCount?: number;
      photoSlotCount: number;
      additionalPhotoSlots: { imageMatchColumn: string; matchedImageCount: number }[];
      sampleRecordIndex: number;
      isProcessing: boolean;
      progress: number;
      processedRecords: DatasetRecord[];
      templateVariants: TemplateVariant[];
      exportSettings: {
        dpi: number;
        pageSize: 'A4' | 'A3' | 'Legal' | 'Custom';
        customWidth?: number;
        customHeight?: number;
        bleed: number;
        marginTop: number;
        marginBottom: number;
        marginLeft: number;
        marginRight: number;
        gutterX: number;
        gutterY: number;
        showCutLines: boolean;
        showRegistrationMarks: boolean;
        mirrorBackside: boolean;
      };
    };
  };
}

const defaultDesign: Design = {
  printingMethod: 'Sublimated',
  lanyardStyle: 'Single Ended',
  width: '20mm',
  lanyardColor: '#ffffff',
  customColorCode: '#ffffff',
  pantone: 'White',
  customPatternUrl: '',
  customPatternName: '',
  patternScale: 100,
  patternSpacing: 30,
  patternRotation: 0,
  strapPattern: null,
  strapPatternOpacity: 0.85,
  copyMode: 'synchronized',
  customTextLeft: '',
  customTextCenter: '',
  customTextRight: '',
  customTextSecondary: '',
  lanyardDesignStyle: 'repeated',
  predefinedWord: 'VISITOR',
  patternOffset: 0,
  textOffset: 0,
  textOffsetLeft: 0,
  textOffsetCenter: 0,
  textOffsetRight: 0,
  fontFamily: 'Montserrat',
  fontColor: '#ffffff',
  fontSize: 18,
  textAngle: 0,
  textSpacing: 60,
  textPosition: 'Center',
  logoUrl: '',
  logoName: '',
  logoScale: 1,
  logoRotation: 0,
  logoBorderWidth: 0,
  logoBorderColor: '#ffffff',
  logoBorderRadius: 0,
  logoOpacity: 1,
  logoCropX: 0,
  logoCropY: 0,
  logoCropWidth: 0,
  logoCropHeight: 0,
  lanyardLogos: [],
  gridSize: 20,
  showGrid: true,
  snapToGrid: true,
  selectedLanyardElement: null,
  logoOffset: 0,
  logoOffsetLeft: 0,
  logoOffsetCenter: 0,
  logoOffsetRight: 0,
  logoRepeat: true,
  logoSpacing: 40,
  logoMode: 'repeated',
  clipType: 'Metal Hook',
  accessories: ['Badge Holder'],
  quantity: 100,
    idCard: {
    size: '54x86',
    activeSide: 'front',
    selected: null,
    selectedElement: null,
    showBothSides: false,
    showGrid: false,
    defaultFontFamily: 'Montserrat',
    defaultColor: '#1e293b',
    defaultFontSize: 14,
    defaultBold: false,
    defaultItalic: false,
    cornerRadius: 15,
    showTrimLine: false,
    drawingTool: 'none',
    front: {
      backgroundColor: '#ffffff',
      elements: [],
    },
    back: {
      backgroundColor: '#ffffff',
      elements: [],
    },
    bulkWorkflow: {
      mode: 'setup',
      mapping: {},
      datasetColumns: [],
      datasetRecords: [],
      datasetImages: {},
      dateColumns: [],
      dateFormat: 'dd/MM/yyyy',
      imageMatchColumn: null,
      matchedImageCount: 0,
      photoSlotCount: 1,
      additionalPhotoSlots: [],
      sampleRecordIndex: 0,
      isProcessing: false,
      progress: 0,
      processedRecords: [],
      templateVariants: [],
      exportSettings: {
        dpi: 300,
        pageSize: 'A3',
        bleed: 0,
        marginTop: 10,
        marginBottom: 10,
        marginLeft: 10,
        marginRight: 10,
        gutterX: 0,
        gutterY: 14,
        showCutLines: false,
        showRegistrationMarks: true,
        mirrorBackside: true,
      },
    },
  },
};

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value));

function mergeDesignWithDefaults(partial: Record<string, unknown> = {}): Design {
  const base = clone(defaultDesign);
  return {
    ...base,
    ...partial,
    customColorCode: partial.customColorCode ?? partial.lanyardColor ?? base.customColorCode,
    idCard: {
      ...base.idCard,
      ...(partial.idCard ?? {}),
    },
  };
}

function updateAtPath<T>(target: T, path: string, value: unknown): T {
  const keys = path.split('.');
  const next = clone(target);
  let pointer: Record<string, unknown> = next as unknown as Record<string, unknown>;

  keys.slice(0, -1).forEach((key) => {
    pointer[key] = (pointer[key] as Record<string, unknown>) ?? {};
    pointer = pointer[key] as Record<string, unknown>;
  });

  pointer[keys[keys.length - 1]] = value;
  return next;
}

export type LanyardViewMode = '2d' | '3d' | 'flat' | 'clip' | 'validation';

interface ConfiguratorStore {
  design: Design;
  viewMode: LanyardViewMode;
  setViewMode: (mode: LanyardViewMode) => void;
  past: Design[];
  future: Design[];
  uploads: {
    customPatternFile: File | null;
    strapLogoFile: File | null;
    idPhotoFile: File | null;
    idLogoFile: File | null;
  };
  setField: (path: string, value: unknown) => void;
  toggleAccessory: (label: string) => void;
  setUploadAsset: (key: string, file: File, previewUrl: string, name?: string) => void;
  undo: () => void;
  redo: () => void;
  saveLocal: (id?: string) => Promise<void>;
  loadLocal: (id?: string) => Promise<boolean>;
  loadPreset: (presetData: Partial<Design>) => void;
  resetDesign: () => Promise<void>;
  canUndo: () => boolean;
  canRedo: () => boolean;
  isSyncing: boolean;
  lastSyncedAt: Date | null;
}

export const useConfiguratorStore = create<ConfiguratorStore>((set, get) => ({
  design: clone(defaultDesign),
  viewMode: '2d',
  setViewMode: (viewMode) => set({ viewMode }),
  past: [],
  future: [],
  isSyncing: false,
  lastSyncedAt: null,
  uploads: {
    customPatternFile: null,
    strapLogoFile: null,
    idPhotoFile: null,
    idLogoFile: null,
  },

  setField: (path, value) => {
    set((state) => {
      // Deep clone only the design state, not the whole store
      const currentDesign = clone(state.design);
      const nextDesign = updateAtPath(currentDesign, path, value);
      
      return {
        design: nextDesign,
        past: [...state.past.slice(-20), state.design], // Cap history at 20 for memory safety
        future: [],
      };
    });
    
    // Defer saving to next tick for UI responsiveness
    setTimeout(() => {
      const { design, saveLocal } = get();
      if (design.idCard.selected) {
        saveLocal(design.idCard.selected);
      } else {
        saveLocal();
      }
    }, 0);
  },

  toggleAccessory: (label) => set((state) => {
    const current = clone(state.design);
    const accessories = current.accessories.includes(label)
      ? current.accessories.filter((item: string) => item !== label)
      : [...current.accessories, label];
    const nextDesign = { ...current, accessories };
    return {
      design: nextDesign,
      past: [...state.past, state.design],
      future: [],
    };
  }),

  setUploadAsset: (key, file, previewUrl, name = '') => {
    set((state) => ({
      uploads: {
        ...state.uploads,
        [key]: file,
      },
    }));

    if (key === 'strapLogoFile') {
      set((state) => ({
        design: { ...state.design, logoUrl: previewUrl, logoName: name },
        past: [...state.past, state.design],
        future: [],
      }));
    }

    if (key === 'customPatternFile') {
      set((state) => ({
        design: {
          ...state.design,
          customPatternUrl: previewUrl,
          customPatternName: name,
        },
        past: [...state.past, state.design],
        future: [],
      }));
    }

    if (key === 'idPhotoFile') {
      set((state) => ({
        design: {
          ...state.design,
          idCard: { ...state.design.idCard, photoUrl: previewUrl },
        },
        past: [...state.past, state.design],
        future: [],
      }));
    }

    if (key === 'idLogoFile') {
      set((state) => ({
        design: {
          ...state.design,
          idCard: { ...state.design.idCard, logoUrl: previewUrl },
        },
        past: [...state.past, state.design],
        future: [],
      }));
    }
  },

  undo: () =>
    set((state) => {
      if (!state.past.length) return state;
      const previous = state.past[state.past.length - 1];
      return {
        design: previous,
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
        past: [...state.past, state.design],
        future: state.future.slice(1),
      };
    }),

  saveLocal: async (id) => {
    try {
      const snapshot = get().design;
      const actualId = id || snapshot.idCard?.selected;
      
      // Inject a local timestamp to track which version is newer
      const snapshotWithTime = { ...snapshot, _lastModified: Date.now() };
      const dataToSave = JSON.stringify(snapshotWithTime);
      const key = actualId ? `${LOCAL_STORAGE_KEY}-${actualId}` : LOCAL_STORAGE_KEY;

      await localforage.setItem(key, dataToSave);
      
      // Auto-save to backend (end-to-end) if we have an active project ID
      if (actualId && actualId !== 'no-order') {
        set({ isSyncing: true });
        
        // Debounce backend saves by 2 seconds to avoid spamming the DB
        if (saveTimeout) clearTimeout(saveTimeout);
        saveTimeout = setTimeout(async () => {
          try {
            await projectService.update(actualId, { design_state: dataToSave });
            set({ isSyncing: false, lastSyncedAt: new Date() });
          } catch (err) {
            console.error("Failed to sync draft to backend", err);
            set({ isSyncing: false });
          }
        }, 2000);
      }
    } catch (e) {
      console.error("Failed to save draft to localforage", e);
    }
  },

  loadLocal: async (id) => {
    const key = id ? `${LOCAL_STORAGE_KEY}-${id}` : LOCAL_STORAGE_KEY;
    try {
      let saved = await localforage.getItem<string>(key);
      let parsed = null;
      let loadedFromBackend = false;

      // Extract local timestamp to compare with backend
      let localTime = 0;
      if (saved) {
        try {
          const tempParsed = JSON.parse(saved);
          localTime = tempParsed._lastModified || 0;
        } catch (e) {
          console.warn("Failed to parse local design_state", e);
        }
      }

      // If we have an ID, try fetching from backend to see if it has a newer draft
      if (id && id !== 'no-order') {
        try {
          const projectData = await projectService.getById(id);
          if (projectData && projectData.design_state) {
            let backendTime = 0;
            try {
              const backendParsed = JSON.parse(projectData.design_state);
              backendTime = backendParsed._lastModified || 0;
            } catch (e) {
              console.warn("Failed to parse backend design_state", e);
            }

            // Only overwrite local storage if the backend data is strictly newer!
            // This prevents data loss if a large image failed to sync to the cloud (413 Payload Too Large)
            // but is safely stored in the browser's IndexedDB.
            if (backendTime > localTime || !saved) {
               console.log(`[Sync] Backend is newer (${backendTime} > ${localTime}). Loading from cloud.`);
               saved = projectData.design_state;
               loadedFromBackend = true;
               // Cache backend version to localforage immediately
               await localforage.setItem(key, saved);
            } else {
               console.log(`[Sync] Local is newer or equal (${localTime} >= ${backendTime}). Keeping local data.`);
            }
          }
          
          // Also check if there are batch photos stored on the server!
          try {
            const photosRes = await projectService.getPhotos(id);
            if (photosRes && photosRes.success && photosRes.photos && photosRes.photos.length > 0) {
                const storeImages: Record<string, string> = {};
                photosRes.photos.forEach((p: {name: string, url: string}) => {
                    const basename = p.name;
                    const extIdx = basename.lastIndexOf('.');
                    const key = (extIdx > 0 ? basename.substring(0, extIdx) : basename).trim();
                    if (key) {
                        storeImages[key] = p.url;
                    }
                });
                await hydrateBatchImageStore(storeImages, id);
                console.log(`[Sync] Loaded ${Object.keys(storeImages).length} cloud photos for project ${id}`);
            }
          } catch(err) {
            console.warn("Failed to fetch cloud photos", err);
          }
        } catch (err) {
          console.warn("Failed to fetch design_state from backend, falling back to localforage", err);
        }
      }

      if (!saved) {
        // Reset in-memory state to prevent leakage from previous project
        set({
          design: clone(defaultDesign),
          past: [],
          future: [],
          uploads: {
            customPatternFile: null,
            strapLogoFile: null,
            idPhotoFile: null,
            idLogoFile: null,
          },
        });
        return false;
      }
      
      parsed = JSON.parse(saved);
      set({ 
        design: mergeDesignWithDefaults(parsed), 
        past: [], 
        future: [],
        lastSyncedAt: loadedFromBackend ? new Date() : get().lastSyncedAt
      });
      return true;
    } catch {
      return false;
    }
  },

  loadPreset: (presetData) => {
    set((state) => ({
      design: mergeDesignWithDefaults({ ...clone(defaultDesign), ...presetData }),
      past: [...state.past, state.design],
      future: [],
    }));
  },

  resetDesign: async () => {
    // 1. Identify current project ID before resetting
    const currentDesign = get().design;
    const projectId = currentDesign.idCard.selected;
    
    // 2. Clear localforage permanently
    try {
      if (projectId) {
        await localforage.removeItem(`${LOCAL_STORAGE_KEY}-${projectId}`);
      }
      await localforage.removeItem(LOCAL_STORAGE_KEY);
    } catch (e) {
      console.warn("Error clearing localforage:", e);
    }

    // 3. Reset in-memory state
    set({
      design: clone(defaultDesign),
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
