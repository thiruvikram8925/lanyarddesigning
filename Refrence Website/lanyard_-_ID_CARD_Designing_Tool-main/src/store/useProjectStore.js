import { create } from 'zustand';

const STORAGE_KEY = 'mylanyard_projects';

function generateId() {
  return `PRJ-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2,5).toUpperCase()}`;
}

function loadFromStorage() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveToStorage(projects) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
  } catch (e) {
    console.warn('Project storage quota exceeded', e);
  }
}

const SAMPLE_PROJECTS = [
  {
    id: 'PRJ-DEMO-001',
    name: 'GOTEK School Kit',
    type: 'id-card',
    category: 'Education',
    status: 'DRAFT',
    color: '#4f46e5',
    cardsCount: 250,
    thumbnail: null,
    lastEdited: '2026-07-18T10:00:00Z',
    createdAt: '2026-07-18T10:00:00Z',
    template: null,
    design: null,
  },
  {
    id: 'PRJ-DEMO-002',
    name: 'Corporate Blue ID',
    type: 'id-card',
    category: 'Corporate',
    status: 'ORDERED',
    color: '#0284c7',
    cardsCount: 150,
    thumbnail: null,
    lastEdited: '2026-07-15T09:00:00Z',
    createdAt: '2026-07-15T09:00:00Z',
    template: null,
    design: null,
  },
  {
    id: 'PRJ-DEMO-003',
    name: 'Tech Summit Lanyard',
    type: 'lanyard',
    category: 'Event',
    status: 'DRAFT',
    color: '#059669',
    cardsCount: 80,
    thumbnail: null,
    lastEdited: '2026-07-10T14:30:00Z',
    createdAt: '2026-07-10T14:30:00Z',
    template: null,
    design: null,
  },
];

export const useProjectStore = create((set, get) => ({
  projects: (() => {
    const stored = loadFromStorage();
    return stored.length > 0 ? stored : SAMPLE_PROJECTS;
  })(),
  activeProject: null,
  isSaving: false,
  lastSaved: null,

  createProject: (type, name, template = null, design = null) => {
    const project = {
      id: generateId(),
      name: name || `New ${type === 'id-card' ? 'ID Card' : type === 'lanyard' ? 'Lanyard' : 'Badge'} Project`,
      type,
      category: 'General',
      status: 'DRAFT',
      color: '#4f46e5',
      cardsCount: 1,
      thumbnail: null,
      lastEdited: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      template,
      design,
    };
    set(state => {
      const projects = [project, ...state.projects];
      saveToStorage(projects);
      return { projects, activeProject: project };
    });
    return project;
  },

  setActiveProject: (project) => set({ activeProject: project }),

  updateActiveProject: (updates) => set(state => {
    if (!state.activeProject) return state;
    const updated = { ...state.activeProject, ...updates, lastEdited: new Date().toISOString() };
    const projects = state.projects.map(p => p.id === updated.id ? updated : p);
    saveToStorage(projects);
    return { activeProject: updated, projects, lastSaved: new Date().toISOString() };
  }),

  saveProject: (design = null, thumbnail = null) => {
    set({ isSaving: true });
    setTimeout(() => {
      set(state => {
        if (!state.activeProject) return { isSaving: false };
        const updated = {
          ...state.activeProject,
          design: design ?? state.activeProject.design,
          thumbnail: thumbnail ?? state.activeProject.thumbnail,
          lastEdited: new Date().toISOString(),
          status: 'DRAFT',
        };
        const projects = state.projects.map(p => p.id === updated.id ? updated : p);
        saveToStorage(projects);
        return { activeProject: updated, projects, isSaving: false, lastSaved: new Date().toISOString() };
      });
    }, 400);
  },

  loadProject: (id) => {
    const { projects } = get();
    const project = projects.find(p => p.id === id);
    if (project) set({ activeProject: project });
    return project || null;
  },

  deleteProject: (id) => {
    set(state => {
      const projects = state.projects.filter(p => p.id !== id);
      saveToStorage(projects);
      const activeProject = state.activeProject?.id === id ? null : state.activeProject;
      return { projects, activeProject };
    });
  },

  duplicateProject: (id) => {
    const { projects } = get();
    const source = projects.find(p => p.id === id);
    if (!source) return null;
    const copy = {
      ...source,
      id: generateId(),
      name: `${source.name} (Copy)`,
      status: 'DRAFT',
      lastEdited: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };
    set(state => {
      const idx = state.projects.findIndex(p => p.id === id);
      const projects = [...state.projects];
      projects.splice(idx + 1, 0, copy);
      saveToStorage(projects);
      return { projects };
    });
    return copy;
  },

  clearActiveProject: () => set({ activeProject: null }),
}));
