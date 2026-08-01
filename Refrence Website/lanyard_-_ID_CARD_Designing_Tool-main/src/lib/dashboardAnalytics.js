const DESIGN_KEY = 'lanyard-configurator-design';
const UPLOAD_HISTORY_KEY = 'lanyard-strap-upload-history';
const INSPIRATION_COUNT_KEY = 'lanyard-kpi-inspiration-count';

export function getStoredDesign() {
  try {
    const raw = localStorage.getItem(DESIGN_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function getStrapUploadHistory() {
  try {
    const raw = sessionStorage.getItem(UPLOAD_HISTORY_KEY) || localStorage.getItem(UPLOAD_HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function recordStrapImageUpload() {
  try {
    const prev = getStrapUploadHistory();
    prev.push(Date.now());
    const next = prev.slice(-90);
    sessionStorage.setItem(UPLOAD_HISTORY_KEY, JSON.stringify(next));
    localStorage.setItem(UPLOAD_HISTORY_KEY, JSON.stringify(next));
  } catch {
    /* ignore quota */
  }
}

export function incrementInspirationApplyCount() {
  try {
    const n = parseInt(localStorage.getItem(INSPIRATION_COUNT_KEY) || '0', 10) + 1;
    localStorage.setItem(INSPIRATION_COUNT_KEY, String(n));
  } catch {
    /* ignore */
  }
}

export function getInspirationApplyCount() {
  try {
    return parseInt(localStorage.getItem(INSPIRATION_COUNT_KEY) || '0', 10);
  } catch {
    return 0;
  }
}

/**
 * Buckets upload timestamps into the last `days` calendar buckets (oldest → newest).
 */
export function bucketUploadHistoryByDay(timestamps, days = 7) {
  const buckets = Array.from({ length: days }, () => 0);
  if (!timestamps.length) return buckets;

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

  timestamps.forEach((ts) => {
    const dayIndex = Math.floor((startOfToday - ts) / 86400000);
    if (dayIndex >= 0 && dayIndex < days) {
      buckets[days - 1 - dayIndex] += 1;
    }
  });

  return buckets;
}

export function countElementTypes(design) {
  if (!design) return { text: 0, image: 0, other: 0 };
  const left = design.strapElements?.left || [];
  const right = design.strapElements?.right || [];
  const all = [...left, ...right];
  let text = 0;
  let image = 0;
  let other = 0;
  all.forEach((el) => {
    if (el.type === 'text') text += 1;
    else if (el.type === 'image') image += 1;
    else other += 1;
  });
  return { text, image, other };
}

export function computeDashboardKpis(design) {
  const inspirationCount = getInspirationApplyCount();

  if (!design) {
    return {
      totalUploads: 0,
      activeElements: 0,
      savedInspirations: inspirationCount,
    };
  }

  const left = design.strapElements?.left || [];
  const right = design.strapElements?.right || [];
  const strapImages = [...left, ...right].filter((e) => e.type === 'image').length;
  const logoUpload = design.logoUrl && design.logoUrl.length > 0 ? 1 : 0;
  const patternUpload = design.customPatternUrl && design.customPatternUrl.length > 0 ? 1 : 0;
  const idPhoto = design.idCard?.photoUrl && design.idCard.photoUrl.length > 0 ? 1 : 0;
  const idLogo = design.idCard?.logoUrl && design.idCard.logoUrl.length > 0 ? 1 : 0;

  const totalUploads = strapImages + logoUpload + patternUpload + idPhoto + idLogo;

  const idFront = design.idCard?.front?.elements?.length || 0;
  const idBack = design.idCard?.back?.elements?.length || 0;
  const activeElements = left.length + right.length + idFront + idBack;

  return {
    totalUploads,
    activeElements,
    savedInspirations: inspirationCount,
  };
}
