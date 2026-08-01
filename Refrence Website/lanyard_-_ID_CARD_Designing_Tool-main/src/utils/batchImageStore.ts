import localforage from 'localforage';

// Initialize a specific localforage instance for batch photos
export const batchPhotoDB = localforage.createInstance({
  name: "GotekIDPro",
  storeName: "batch_photos"
});

// Memory cache for synchronous high-performance lookups
export const batchImageStore: Record<string, string> = {};

export async function hydrateBatchImageStore(images: Record<string, string>, projectId?: string) {
  // First update memory
  for (const [k, v] of Object.entries(images)) {
    batchImageStore[k] = v;
  }
  
  // Then persist to IndexedDB asynchronously
  if (projectId) {
    try {
      const projectKey = `project_${projectId}_photos`;
      // We get the existing photos for this project, merge, and save
      const existing = (await batchPhotoDB.getItem<Record<string, string>>(projectKey)) || {};
      const merged = { ...existing, ...images };
      await batchPhotoDB.setItem(projectKey, merged);
    } catch (e) {
      console.error("Failed to persist batch photos to IndexedDB", e);
    }
  }
}

export async function loadBatchPhotosFromDB(projectId: string) {
  if (!projectId) return;
  try {
    const projectKey = `project_${projectId}_photos`;
    const saved = await batchPhotoDB.getItem<Record<string, string>>(projectKey);
    if (saved) {
      // Hydrate into memory
      Object.keys(batchImageStore).forEach(k => delete batchImageStore[k]);
      Object.assign(batchImageStore, saved);
      console.log(`[IndexedDB] Restored ${Object.keys(saved).length} photos for project ${projectId}`);
    } else {
      Object.keys(batchImageStore).forEach(k => delete batchImageStore[k]);
    }
  } catch (e) {
    console.error("Failed to load batch photos from IndexedDB", e);
  }
}

export function getBatchImage(key: string): string | undefined {
  if (!key) return undefined;
  const trimmed = key.toString().trim();
  if (batchImageStore[trimmed]) return batchImageStore[trimmed];
  
  // Case-insensitive fallback
  const lower = trimmed.toLowerCase();
  for (const k of Object.keys(batchImageStore)) {
    if (k.toLowerCase() === lower) return batchImageStore[k];
  }
  return undefined;
}

export function getBatchImageKeys(): string[] {
  return Object.keys(batchImageStore);
}

export async function clearBatchImageStore(projectId?: string) {
  Object.keys(batchImageStore).forEach(key => delete batchImageStore[key]);
  if (projectId) {
    try {
      await batchPhotoDB.removeItem(`project_${projectId}_photos`);
      console.log(`[IndexedDB] Cleared photos for project ${projectId}`);
    } catch (e) {
      console.error("Failed to clear photos from IndexedDB", e);
    }
  }
}
