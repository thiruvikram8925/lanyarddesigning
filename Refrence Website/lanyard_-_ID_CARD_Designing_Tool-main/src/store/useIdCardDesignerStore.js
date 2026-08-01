import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const defaultCardSettings = {
  width: 54, // mm (CR80 standard size is 54x86 mm)
  height: 86, // mm
  orientation: 'portrait', // 'portrait' | 'landscape'
  background: '#ffffff',
  material: 'PVC', // 'PVC' | 'Matte' | 'Glossy' | 'Transparent' | 'Metal'
  borderThickness: 3,
  borderColor: '#4f46e5',
  roundedCorners: 12,
  frameStyle: 'corporate', // 'corporate' | 'executive' | 'tech' | 'creative' | 'classic'
  slotType: 'oval', // 'oval' | 'round' | 'double' | 'none'
  slotColor: '#cbd5e1',
};

const initialState = {
  frontElements: [],
  backElements: [],
  selectedId: null,
  activeSide: 'front', // 'front' | 'back'
  cardSettings: { ...defaultCardSettings },
  zoom: 1,
  history: [],
  historyIndex: -1,
};

export const useIdCardDesignerStore = create(
  persist(
    (set, get) => ({
      ...initialState,

      // Actions
      setActiveSide: (side) => set({ activeSide: side, selectedId: null }),
      
      flipCard: () => set((state) => ({
        activeSide: state.activeSide === 'front' ? 'back' : 'front',
        selectedId: null
      })),

      copyFrontToBack: () => set((state) => {
        const copied = state.frontElements.map(el => ({
          ...el,
          id: `${el.id}_back_${Math.random().toString(36).substring(2, 7)}`
        }));
        const newState = { backElements: copied, activeSide: 'back', selectedId: null };
        get().saveHistory(newState);
        return newState;
      }),
      
      setZoom: (zoom) => set({ zoom }),
      
      selectElement: (id) => set({ selectedId: id }),
      
      updateCardSettings: (settings) => set((state) => {
        const newState = { cardSettings: { ...state.cardSettings, ...settings } };
        get().saveHistory(newState);
        return newState;
      }),

      addElement: (element) => set((state) => {
        const targetSide = state.activeSide === 'front' ? 'frontElements' : 'backElements';
        const newElements = [...state[targetSide], element];
        const newState = { [targetSide]: newElements, selectedId: element.id };
        get().saveHistory(newState);
        return newState;
      }),

      updateElement: (id, newProps) => set((state) => {
        const targetSide = state.activeSide === 'front' ? 'frontElements' : 'backElements';
        const newElements = state[targetSide].map((el) => (el.id === id ? { ...el, ...newProps } : el));
        const newState = { [targetSide]: newElements };
        get().saveHistory(newState);
        return newState;
      }),

      removeElement: (id) => set((state) => {
        const targetSide = state.activeSide === 'front' ? 'frontElements' : 'backElements';
        const newElements = state[targetSide].filter((el) => el.id !== id);
        const newState = { [targetSide]: newElements, selectedId: state.selectedId === id ? null : state.selectedId };
        get().saveHistory(newState);
        return newState;
      }),

      bringForward: (id) => set((state) => {
        const targetSide = state.activeSide === 'front' ? 'frontElements' : 'backElements';
        const elements = [...state[targetSide]];
        const index = elements.findIndex((el) => el.id === id);
        if (index < elements.length - 1) {
          const temp = elements[index];
          elements[index] = elements[index + 1];
          elements[index + 1] = temp;
          const newState = { [targetSide]: elements };
          get().saveHistory(newState);
          return newState;
        }
        return state;
      }),

      bringToFront: (id) => set((state) => {
        const targetSide = state.activeSide === 'front' ? 'frontElements' : 'backElements';
        const elements = [...state[targetSide]];
        const index = elements.findIndex((el) => el.id === id);
        if (index > -1 && index < elements.length - 1) {
          const el = elements.splice(index, 1)[0];
          elements.push(el);
          const newState = { [targetSide]: elements };
          get().saveHistory(newState);
          return newState;
        }
        return state;
      }),

      sendBackward: (id) => set((state) => {
        const targetSide = state.activeSide === 'front' ? 'frontElements' : 'backElements';
        const elements = [...state[targetSide]];
        const index = elements.findIndex((el) => el.id === id);
        if (index > 0) {
          const temp = elements[index];
          elements[index] = elements[index - 1];
          elements[index - 1] = temp;
          const newState = { [targetSide]: elements };
          get().saveHistory(newState);
          return newState;
        }
        return state;
      }),

      sendToBack: (id) => set((state) => {
        const targetSide = state.activeSide === 'front' ? 'frontElements' : 'backElements';
        const elements = [...state[targetSide]];
        const index = elements.findIndex((el) => el.id === id);
        if (index > 0) {
          const el = elements.splice(index, 1)[0];
          elements.unshift(el);
          const newState = { [targetSide]: elements };
          get().saveHistory(newState);
          return newState;
        }
        return state;
      }),

      // History Management
      saveHistory: (newStatePartial) => set((state) => {
        const nextState = { ...state, ...newStatePartial };
        const snapshot = {
          frontElements: nextState.frontElements,
          backElements: nextState.backElements,
          cardSettings: nextState.cardSettings,
        };
        
        const newHistory = state.history.slice(0, state.historyIndex + 1);
        newHistory.push(snapshot);
        
        // Keep max 50 states
        if (newHistory.length > 50) {
          newHistory.shift();
        }
        
        return {
          ...newStatePartial,
          history: newHistory,
          historyIndex: newHistory.length - 1,
        };
      }),

      undo: () => set((state) => {
        if (state.historyIndex > 0) {
          const newIndex = state.historyIndex - 1;
          const previousState = state.history[newIndex];
          return {
            ...previousState,
            historyIndex: newIndex,
            selectedId: null,
          };
        }
        return state;
      }),

      redo: () => set((state) => {
        if (state.historyIndex < state.history.length - 1) {
          const newIndex = state.historyIndex + 1;
          const nextState = state.history[newIndex];
          return {
            ...nextState,
            historyIndex: newIndex,
            selectedId: null,
          };
        }
        return state;
      }),

      clearCanvas: () => set((state) => {
        const newState = {
          frontElements: [],
          backElements: [],
          selectedId: null,
        };
        get().saveHistory(newState);
        return newState;
      }),
      
    }),
    {
      name: 'id-card-designer-storage',
      partialize: (state) => ({
        frontElements: state.frontElements,
        backElements: state.backElements,
        cardSettings: state.cardSettings,
      }),
    }
  )
);
