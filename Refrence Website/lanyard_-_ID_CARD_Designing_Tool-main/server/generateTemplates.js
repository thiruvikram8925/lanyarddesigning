import 'dotenv/config';
import { pool } from './db.js';

// CR-80 Standard: 85.6mm × 53.98mm (credit card / ID card size)
// Vertical  (54x86): 170 × 270 px
// Horizontal(100x70): 270 × 170 px
// ═══════════════════════════════════════════════════════════════════

const CARD_DIMS = {
  vertical:   { w: 170, h: 270, size: '54x86' },
  horizontal: { w: 270, h: 170, size: '100x70' },
};

const categories = ['corporate', 'modern', 'creative', 'tech', 'education', 'medical', 'event', 'government'];

// ── Dummy person photos (public domain placeholder images) ────────
const DUMMY_PHOTOS = [
  '/avatar-boy-3d.png',
  '/avatar-girl-3d.png'
];

// ── Dummy names and roles ─────────────────────────────────────────
const FIRST_NAMES = ['Aiden','Priya','Carlos','Sarah','James','Meera','David','Sofia','Raj','Emma','Liam','Aisha','Noah','Yuki','Omar','Chloe','Ethan','Zara','Lucas','Maya'];
const LAST_NAMES = ['Patel','Smith','Garcia','Kim','Johnson','Singh','Chen','Williams','Brown','Tanaka','Ali','Davis','Rodriguez','Lee','Wilson','Kumar','Martinez','Anderson','Taylor','Thomas'];
const ROLES = {
  corporate:  ['Senior Manager','HR Director','VP Operations','Chief Analyst','Business Lead','Finance Head','Legal Advisor','Project Lead'],
  modern:     ['UX Designer','Product Manager','Growth Lead','Content Creator','Brand Strategist','Data Scientist','Full Stack Dev','AI Engineer'],
  creative:   ['Art Director','Graphic Designer','Photographer','Illustrator','Motion Designer','Creative Lead','Visual Artist','Animator'],
  tech:       ['Software Engineer','DevOps Lead','Cloud Architect','Security Analyst','ML Engineer','CTO','Backend Dev','System Admin'],
  education:  ['Professor','Student','Teaching Asst.','Dean','Librarian','Researcher','Lab Manager','Department Head'],
  medical:    ['Dr. Surgeon','Head Nurse','Pharmacist','Radiologist','Lab Technician','Cardiologist','Pediatrician','Anesthetist'],
  event:      ['VIP Guest','Speaker','Volunteer','Organizer','Exhibitor','Media Pass','Staff','Coordinator'],
  government: ['Officer','Inspector','Director','Secretary','Commissioner','Analyst','Clerk','Supervisor'],
};
const ORGS = {
  corporate:  ['Apex Corp','Zenith Inc','Stellar Group','Vantage Ltd','Pinnacle Co','Summit Corp','Nexus Industries','Atlas Holdings'],
  modern:     ['PixelForge','CloudNova','DataPulse','InnoVenture','TechSphere','ByteShift','NeuralEdge','QuantumLeap'],
  creative:   ['Studio Noir','Prism Agency','Vivid Labs','Canvas Collective','Artisan Co','Palette Studio','Echo Creative','Bloom Design'],
  tech:       ['CyberCore','NeuroTech','QuantumOS','DeepStack','CodeForge','SynthAI','NanoSys','TeraByte'],
  education:  ['MIT Academy','Stanford Univ.','Oxford College','IIT Delhi','Harvard Inst.','Yale Academy','Cambridge Univ.','NUS Singapore'],
  medical:    ['City Hospital','LifeCare Medical','Apollo Clinic','MedPrime','HealthFirst','CurePlus Hospital','Genesis Medical','Zenith Healthcare'],
  event:      ['TechConf 2026','DEF CON','CES Global','Web Summit','Google I/O','SXSW','Devfest','Hackathon 2026'],
  government: ['City Council','Federal Bureau','State Dept.','Public Works','Revenue Dept.','Civil Service','National Agency','District Office'],
};

// ── 50 curated color palettes ──────────────────────────────────────
const COLOR_PALETTES = [
  { primary: '#1e3a8a', secondary: '#3b82f6', accent: '#dbeafe', bg: '#f8fafc', text: '#0f172a' },
  { primary: '#0f766e', secondary: '#14b8a6', accent: '#ccfbf1', bg: '#f0fdfa', text: '#134e4a' },
  { primary: '#7c3aed', secondary: '#a78bfa', accent: '#ede9fe', bg: '#faf5ff', text: '#3b0764' },
  { primary: '#dc2626', secondary: '#f87171', accent: '#fee2e2', bg: '#fef2f2', text: '#450a0a' },
  { primary: '#ea580c', secondary: '#fb923c', accent: '#ffedd5', bg: '#fff7ed', text: '#431407' },
  { primary: '#ca8a04', secondary: '#facc15', accent: '#fef9c3', bg: '#fefce8', text: '#422006' },
  { primary: '#16a34a', secondary: '#4ade80', accent: '#dcfce7', bg: '#f0fdf4', text: '#052e16' },
  { primary: '#2563eb', secondary: '#60a5fa', accent: '#dbeafe', bg: '#eff6ff', text: '#1e3a5f' },
  { primary: '#9333ea', secondary: '#c084fc', accent: '#f3e8ff', bg: '#faf5ff', text: '#581c87' },
  { primary: '#e11d48', secondary: '#fb7185', accent: '#ffe4e6', bg: '#fff1f2', text: '#4c0519' },
  { primary: '#0891b2', secondary: '#22d3ee', accent: '#cffafe', bg: '#ecfeff', text: '#164e63' },
  { primary: '#4f46e5', secondary: '#818cf8', accent: '#e0e7ff', bg: '#eef2ff', text: '#312e81' },
  { primary: '#0d9488', secondary: '#2dd4bf', accent: '#ccfbf1', bg: '#f0fdfa', text: '#115e59' },
  { primary: '#b91c1c', secondary: '#ef4444', accent: '#fecaca', bg: '#fef2f2', text: '#7f1d1d' },
  { primary: '#c2410c', secondary: '#f97316', accent: '#fed7aa', bg: '#fff7ed', text: '#7c2d12' },
  { primary: '#a16207', secondary: '#eab308', accent: '#fef08a', bg: '#fefce8', text: '#713f12' },
  { primary: '#15803d', secondary: '#22c55e', accent: '#bbf7d0', bg: '#f0fdf4', text: '#14532d' },
  { primary: '#1d4ed8', secondary: '#3b82f6', accent: '#bfdbfe', bg: '#eff6ff', text: '#1e3a8a' },
  { primary: '#7e22ce', secondary: '#a855f7', accent: '#e9d5ff', bg: '#faf5ff', text: '#581c87' },
  { primary: '#be123c', secondary: '#f43f5e', accent: '#fda4af', bg: '#fff1f2', text: '#881337' },
  { primary: '#6366f1', secondary: '#818cf8', accent: '#1e1b4b', bg: '#020617', text: '#e2e8f0' },
  { primary: '#ec4899', secondary: '#f472b6', accent: '#4a044e', bg: '#0c0a09', text: '#fce7f3' },
  { primary: '#14b8a6', secondary: '#2dd4bf', accent: '#042f2e', bg: '#0f172a', text: '#ccfbf1' },
  { primary: '#f59e0b', secondary: '#fbbf24', accent: '#451a03', bg: '#18181b', text: '#fef3c7' },
  { primary: '#ef4444', secondary: '#f87171', accent: '#450a0a', bg: '#1c1917', text: '#fee2e2' },
  { primary: '#22d3ee', secondary: '#67e8f9', accent: '#083344', bg: '#09090b', text: '#cffafe' },
  { primary: '#a78bfa', secondary: '#c4b5fd', accent: '#2e1065', bg: '#0a0a0a', text: '#ede9fe' },
  { primary: '#34d399', secondary: '#6ee7b7', accent: '#022c22', bg: '#111827', text: '#d1fae5' },
  { primary: '#fb923c', secondary: '#fdba74', accent: '#431407', bg: '#171717', text: '#ffedd5' },
  { primary: '#38bdf8', secondary: '#7dd3fc', accent: '#0c4a6e', bg: '#0f172a', text: '#e0f2fe' },
  { primary: '#8b5cf6', secondary: '#ec4899', accent: '#fae8ff', bg: '#faf5ff', text: '#1e1b4b' },
  { primary: '#06b6d4', secondary: '#8b5cf6', accent: '#e0e7ff', bg: '#ecfeff', text: '#164e63' },
  { primary: '#f43f5e', secondary: '#f59e0b', accent: '#fef3c7', bg: '#fff1f2', text: '#4c0519' },
  { primary: '#10b981', secondary: '#3b82f6', accent: '#dbeafe', bg: '#ecfdf5', text: '#064e3b' },
  { primary: '#d946ef', secondary: '#f43f5e', accent: '#ffe4e6', bg: '#fdf4ff', text: '#701a75' },
  { primary: '#0ea5e9', secondary: '#22c55e', accent: '#dcfce7', bg: '#f0f9ff', text: '#0c4a6e' },
  { primary: '#f97316', secondary: '#ef4444', accent: '#fee2e2', bg: '#fff7ed', text: '#7c2d12' },
  { primary: '#84cc16', secondary: '#22d3ee', accent: '#cffafe', bg: '#f7fee7', text: '#365314' },
  { primary: '#e879f9', secondary: '#818cf8', accent: '#e0e7ff', bg: '#fdf4ff', text: '#86198f' },
  { primary: '#fb7185', secondary: '#fbbf24', accent: '#fef9c3', bg: '#fff1f2', text: '#9f1239' },
  { primary: '#78350f', secondary: '#a16207', accent: '#fef3c7', bg: '#fffbeb', text: '#451a03' },
  { primary: '#365314', secondary: '#65a30d', accent: '#ecfccb', bg: '#f7fee7', text: '#1a2e05' },
  { primary: '#44403c', secondary: '#78716c', accent: '#e7e5e4', bg: '#fafaf9', text: '#1c1917' },
  { primary: '#1e3a5f', secondary: '#2563eb', accent: '#dbeafe', bg: '#f0f9ff', text: '#0c4a6e' },
  { primary: '#4a044e', secondary: '#a21caf', accent: '#f5d0fe', bg: '#fdf4ff', text: '#701a75' },
  { primary: '#171717', secondary: '#404040', accent: '#e5e5e5', bg: '#fafafa', text: '#0a0a0a' },
  { primary: '#1f2937', secondary: '#6b7280', accent: '#e5e7eb', bg: '#f9fafb', text: '#111827' },
  { primary: '#27272a', secondary: '#71717a', accent: '#e4e4e7', bg: '#fafafa', text: '#18181b' },
  { primary: '#292524', secondary: '#78716c', accent: '#e7e5e4', bg: '#fafaf9', text: '#1c1917' },
  { primary: '#1a2e05', secondary: '#4d7c0f', accent: '#d9f99d', bg: '#f7fee7', text: '#365314' },
];

const LAYOUTS = [
  'topBar', 'sidebarLeft', 'sidebarRight', 'bottomBlock', 'splitHalf',
  'frameAll', 'cornerAccent', 'centerBand', 'topAndBottom', 'floatingCard',
  'gradientFade', 'asymmetric',
];

const PHOTO_STYLES = ['circle', 'roundedSquare', 'square', 'roundedRect', 'pill', 'hexLike'];
const DECORATORS = ['none', 'dots', 'lines', 'circles', 'squares', 'cornerDots', 'borderLine', 'accentBar', 'doubleStripe', 'triangleCorner'];

// ── Seeded PRNG ───────────────────────────────────────────────────
function mulberry32(a) {
  return function () {
    let t = a += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
function pick(arr, rng) { return arr[Math.floor(rng() * arr.length)]; }
function randBetween(min, max, rng) { return Math.floor(rng() * (max - min + 1)) + min; }

// ── Photo element builder ─────────────────────────────────────────
function buildPhoto(style, x, y, size, photoUrl) {
  const base = { id: 'photo', type: 'image', x, y, src: photoUrl };
  switch (style) {
    case 'circle':       return { ...base, width: size, height: size, cornerRadius: size / 2 };
    case 'roundedSquare': return { ...base, width: size, height: size, cornerRadius: Math.round(size * 0.18) };
    case 'square':       return { ...base, width: size, height: size, cornerRadius: 0 };
    case 'roundedRect':  return { ...base, width: size, height: Math.round(size * 1.2), cornerRadius: 8 };
    case 'pill':         return { ...base, width: Math.round(size * 0.75), height: Math.round(size * 1.25), cornerRadius: Math.round(size * 0.37) };
    case 'hexLike':      return { ...base, width: size, height: Math.round(size * 0.9), cornerRadius: Math.round(size * 0.15) };
    default:             return { ...base, width: size, height: size, cornerRadius: 6 };
  }
}

// ── Decorator builder ─────────────────────────────────────────────
function buildDecorators(decType, w, h, pal, rng) {
  const els = [];
  const c = pal.secondary; const a = pal.accent;
  switch (decType) {
    case 'dots':
      for (let i = 0; i < 4; i++) { const s = randBetween(4, 10, rng); els.push({ id: `dot-${i}`, type: 'rect', x: randBetween(5, w - 15, rng), y: randBetween(5, h - 15, rng), width: s, height: s, cornerRadius: s / 2, fill: a }); } break;
    case 'lines':
      els.push({ id: 'ln1', type: 'rect', x: 0, y: Math.round(h * 0.3), width: w, height: 1, fill: c });
      els.push({ id: 'ln2', type: 'rect', x: 0, y: Math.round(h * 0.7), width: w, height: 1, fill: c }); break;
    case 'circles':
      els.push({ id: 'c1', type: 'rect', x: w - 35, y: -12, width: 50, height: 50, cornerRadius: 25, fill: a });
      els.push({ id: 'c2', type: 'rect', x: -10, y: h - 30, width: 40, height: 40, cornerRadius: 20, fill: a }); break;
    case 'squares':
      els.push({ id: 'sq1', type: 'rect', x: w - 22, y: h - 22, width: 30, height: 30, cornerRadius: 3, fill: a });
      els.push({ id: 'sq2', type: 'rect', x: -6, y: -6, width: 22, height: 22, cornerRadius: 2, fill: a }); break;
    case 'cornerDots':
      [[6,6],[w-10,6],[6,h-10],[w-10,h-10]].forEach(([cx,cy],i) => els.push({ id: `cd${i}`, type: 'rect', x: cx, y: cy, width: 5, height: 5, cornerRadius: 3, fill: c })); break;
    case 'borderLine':
      els.push({ id: 'bdr', type: 'rect', x: 4, y: 4, width: w - 8, height: h - 8, fill: 'transparent', stroke: c, strokeWidth: 1.5, cornerRadius: 4 }); break;
    case 'accentBar':
      els.push({ id: 'abar', type: 'rect', x: 0, y: h - 7, width: w, height: 7, fill: c }); break;
    case 'doubleStripe':
      els.push({ id: 'ds1', type: 'rect', x: 0, y: 0, width: w, height: 4, fill: c });
      els.push({ id: 'ds2', type: 'rect', x: 0, y: 5, width: w, height: 2, fill: a }); break;
    case 'triangleCorner':
      els.push({ id: 'tri', type: 'rect', x: w - 50, y: 0, width: 50, height: 50, fill: a }); break;
  }
  return els;
}

// ══════════════════════════════════════════════════════════════════
// FRONT CARD GENERATOR
// ══════════════════════════════════════════════════════════════════

function generateFront(orientation, layout, pal, photoStyle, decType, rng, personName, role, org, photoUrl, phone) {
  const { w, h } = CARD_DIMS[orientation];
  const isV = orientation === 'vertical';
  const els = [];
  const isDark = pal.bg.startsWith('#0') || pal.bg.startsWith('#1');
  const txtCol = isDark ? '#f1f5f9' : pal.text;

  if (isDark) els.push({ id: 'bg', type: 'rect', x: 0, y: 0, width: w, height: h, fill: pal.bg });

  const logoSz = randBetween(22, 34, rng);
  const photoSz = randBetween(isV ? 48 : 55, isV ? 68 : 80, rng);
  const nameSz = randBetween(11, 15, rng);
  const subSz = randBetween(8, 10, rng);
  const idNum = `ID-${randBetween(100000, 999999, rng)}`;

  switch (layout) {
    case 'topBar': {
      const bH = randBetween(isV ? 48 : 34, isV ? 72 : 50, rng);
      els.push({ id: 'hdr', type: 'rect', x: 0, y: 0, width: w, height: bH, fill: pal.primary });
      els.push({ id: 'logo', type: 'image', x: isV ? (w/2 - logoSz/2) : 10, y: isV ? 5 : (bH/2 - logoSz/2), width: logoSz, height: logoSz, cornerRadius: randBetween(3, logoSz/2, rng), src: '' });
      els.push({ id: 'org', type: 'text', content: org, x: isV ? 0 : (logoSz + 18), y: isV ? (bH - 16) : (bH/2 - 5), width: isV ? w : 160, align: isV ? 'center' : 'left', fontSize: 10, fill: '#ffffff', fontStyle: 'bold' });
      els.push(buildPhoto(photoStyle, isV ? (w/2 - photoSz/2) : 12, bH + 10, photoSz, photoUrl));
      els.push({ id: 'nm', type: 'text', content: personName, x: isV ? 0 : (photoSz + 24), y: isV ? (bH + photoSz + 18) : (bH + 14), width: isV ? w : (w - photoSz - 36), align: isV ? 'center' : 'left', fontSize: nameSz, fill: pal.primary, fontStyle: 'bold' });
      els.push({ id: 'rl', type: 'text', content: role, x: isV ? 0 : (photoSz + 24), y: isV ? (bH + photoSz + 36) : (bH + 32), width: isV ? w : (w - photoSz - 36), align: isV ? 'center' : 'left', fontSize: subSz, fill: txtCol });
      els.push({ id: 'id', type: 'text', content: `ID: ${idNum}`, x: isV ? 0 : (photoSz + 24), y: isV ? (bH + photoSz + 50) : (bH + 46), width: isV ? w : 120, align: isV ? 'center' : 'left', fontSize: 7, fill: '#94a3b8' });
      els.push({ id: 'ph', type: 'text', content: `Ph: ${phone}`, x: isV ? 0 : (photoSz + 24), y: isV ? (bH + photoSz + 60) : (bH + 56), width: isV ? w : 120, align: isV ? 'center' : 'left', fontSize: 7, fill: '#94a3b8' });
      break;
    }
    case 'sidebarLeft': {
      const bW = randBetween(isV ? 28 : 42, isV ? 44 : 65, rng);
      els.push({ id: 'sb', type: 'rect', x: 0, y: 0, width: bW, height: h, fill: pal.primary });
      els.push({ id: 'logo', type: 'image', x: (bW/2 - 12), y: 14, width: 24, height: 24, cornerRadius: 12, src: '' });
      els.push({ id: 'org', type: 'text', content: org, x: bW + 8, y: 14, fontSize: 9, fill: pal.primary, fontStyle: 'bold', width: w - bW - 14 });
      els.push(buildPhoto(photoStyle, isV ? (bW + (w-bW)/2 - photoSz/2) : (bW + 8), isV ? 48 : 48, photoSz, photoUrl));
      els.push({ id: 'nm', type: 'text', content: personName, x: isV ? bW : (bW + photoSz + 16), y: isV ? (photoSz + 60) : 56, width: isV ? (w - bW) : (w - bW - photoSz - 24), align: isV ? 'center' : 'left', fontSize: nameSz, fill: txtCol, fontStyle: 'bold' });
      els.push({ id: 'rl', type: 'text', content: role, x: isV ? bW : (bW + photoSz + 16), y: isV ? (photoSz + 78) : 74, width: isV ? (w-bW) : (w-bW-photoSz-24), align: isV ? 'center' : 'left', fontSize: subSz, fill: txtCol });
      els.push({ id: 'id', type: 'text', content: `ID: ${idNum}`, x: isV ? bW : (bW + photoSz + 16), y: isV ? (photoSz + 92) : 88, width: isV ? (w-bW) : 100, align: isV ? 'center' : 'left', fontSize: 7, fill: '#94a3b8' });
      els.push({ id: 'ph', type: 'text', content: `Ph: ${phone}`, x: isV ? bW : (bW + photoSz + 16), y: isV ? (photoSz + 102) : 98, width: isV ? (w-bW) : 100, align: isV ? 'center' : 'left', fontSize: 7, fill: '#94a3b8' });
      break;
    }
    case 'sidebarRight': {
      const bW = randBetween(isV ? 26 : 38, isV ? 40 : 58, rng);
      els.push({ id: 'sb', type: 'rect', x: w - bW, y: 0, width: bW, height: h, fill: pal.primary });
      els.push({ id: 'logo', type: 'image', x: 10, y: 10, width: logoSz, height: logoSz, cornerRadius: 4, src: '' });
      els.push({ id: 'org', type: 'text', content: org, x: 10, y: logoSz + 16, fontSize: 9, fill: pal.primary, fontStyle: 'bold', width: w - bW - 16 });
      els.push(buildPhoto(photoStyle, isV ? ((w-bW)/2 - photoSz/2) : 10, isV ? 60 : 48, photoSz, photoUrl));
      els.push({ id: 'nm', type: 'text', content: personName, x: 10, y: isV ? (photoSz + 72) : (photoSz + 56), width: w - bW - 18, fontSize: nameSz, fill: txtCol, fontStyle: 'bold' });
      els.push({ id: 'rl', type: 'text', content: role, x: 10, y: isV ? (photoSz + 90) : (photoSz + 72), width: w - bW - 18, fontSize: subSz, fill: txtCol });
      els.push({ id: 'id', type: 'text', content: `ID: ${idNum}`, x: 10, y: isV ? (photoSz + 104) : (photoSz + 86), width: w - bW - 18, fontSize: 7, fill: '#94a3b8' });
      els.push({ id: 'ph', type: 'text', content: `Ph: ${phone}`, x: 10, y: isV ? (photoSz + 114) : (photoSz + 96), width: w - bW - 18, fontSize: 7, fill: '#94a3b8' });
      break;
    }
    case 'bottomBlock': {
      const blH = randBetween(isV ? 68 : 55, isV ? 100 : 80, rng);
      els.push({ id: 'btm', type: 'rect', x: 0, y: h - blH, width: w, height: blH, fill: pal.primary });
      els.push({ id: 'logo', type: 'image', x: 12, y: 10, width: logoSz, height: logoSz, cornerRadius: 4, src: '' });
      els.push({ id: 'org', type: 'text', content: org, x: logoSz + 20, y: 16, fontSize: 10, fill: txtCol, fontStyle: 'bold' });
      els.push(buildPhoto(photoStyle, isV ? (w/2 - photoSz/2) : 12, isV ? 50 : 48, photoSz, photoUrl));
      els.push({ id: 'nm', type: 'text', content: personName, x: isV ? 0 : (photoSz + 24), y: h - blH + 16, width: isV ? w : (w - photoSz - 36), align: isV ? 'center' : 'left', fontSize: nameSz, fill: '#ffffff', fontStyle: 'bold' });
      els.push({ id: 'rl', type: 'text', content: role, x: isV ? 0 : (photoSz + 24), y: h - blH + 34, width: isV ? w : (w - photoSz - 36), align: isV ? 'center' : 'left', fontSize: subSz, fill: pal.accent });
      els.push({ id: 'id', type: 'text', content: `ID: ${idNum} | Ph: ${phone}`, x: isV ? 0 : (photoSz + 24), y: h - blH + 48, width: isV ? w : (w - photoSz - 36), align: isV ? 'center' : 'left', fontSize: 7, fill: '#e2e8f0' });
      break;
    }
    case 'splitHalf': {
      const splitY = Math.round(h * 0.42);
      els.push({ id: 'top', type: 'rect', x: 0, y: 0, width: w, height: splitY, fill: pal.primary });
      els.push({ id: 'divider', type: 'rect', x: 0, y: splitY, width: w, height: 4, fill: pal.secondary });
      els.push({ id: 'logo', type: 'image', x: isV ? (w/2 - 14) : 12, y: 8, width: 28, height: 28, cornerRadius: 14, src: '' });
      els.push({ id: 'org', type: 'text', content: org, x: isV ? 0 : 48, y: 14, width: isV ? w : 140, align: isV ? 'center' : 'left', fontSize: 10, fill: '#ffffff', fontStyle: 'bold' });
      els.push(buildPhoto(photoStyle, isV ? (w/2 - photoSz/2) : 12, isV ? 48 : (splitY + 14), photoSz, photoUrl));
      els.push({ id: 'nm', type: 'text', content: personName, x: isV ? 0 : (photoSz + 24), y: isV ? (splitY + 16) : (splitY + 18), width: isV ? w : (w - photoSz - 36), align: isV ? 'center' : 'left', fontSize: nameSz, fill: pal.primary, fontStyle: 'bold' });
      els.push({ id: 'rl', type: 'text', content: role, x: isV ? 0 : (photoSz + 24), y: isV ? (splitY + 34) : (splitY + 36), width: isV ? w : (w - photoSz - 36), align: isV ? 'center' : 'left', fontSize: subSz, fill: txtCol });
      els.push({ id: 'id', type: 'text', content: `ID: ${idNum}`, x: isV ? 0 : (photoSz + 24), y: isV ? (splitY + 48) : (splitY + 50), width: isV ? w : (w - photoSz - 36), align: isV ? 'center' : 'left', fontSize: 7, fill: '#94a3b8' });
      els.push({ id: 'ph', type: 'text', content: `Ph: ${phone}`, x: isV ? 0 : (photoSz + 24), y: isV ? (splitY + 58) : (splitY + 60), width: isV ? w : (w - photoSz - 36), align: isV ? 'center' : 'left', fontSize: 7, fill: '#94a3b8' });
      break;
    }
    case 'frameAll': {
      const bw = randBetween(5, 10, rng);
      els.push({ id: 'frm', type: 'rect', x: 0, y: 0, width: w, height: h, fill: pal.primary });
      els.push({ id: 'inn', type: 'rect', x: bw, y: bw, width: w-bw*2, height: h-bw*2, fill: isDark ? pal.bg : '#ffffff', cornerRadius: 4 });
      els.push({ id: 'logo', type: 'image', x: isV ? (w/2-13) : (bw+10), y: bw+8, width: 26, height: 26, cornerRadius: 13, src: '' });
      els.push({ id: 'org', type: 'text', content: org, x: isV ? bw : (bw+42), y: bw+14, width: isV ? (w-bw*2) : 130, align: isV ? 'center' : 'left', fontSize: 9, fill: pal.primary, fontStyle: 'bold' });
      els.push(buildPhoto(photoStyle, isV ? (w/2-photoSz/2) : (bw+10), isV ? (bw+45) : (bw+42), photoSz, photoUrl));
      els.push({ id: 'nm', type: 'text', content: personName, x: isV ? bw : (bw+photoSz+18), y: isV ? (bw+photoSz+55) : (bw+50), width: isV ? (w-bw*2) : (w-bw*2-photoSz-26), align: isV ? 'center' : 'left', fontSize: nameSz, fill: txtCol, fontStyle: 'bold' });
      els.push({ id: 'rl', type: 'text', content: role, x: isV ? bw : (bw+photoSz+18), y: isV ? (bw+photoSz+72) : (bw+68), width: isV ? (w-bw*2) : (w-bw*2-photoSz-26), align: isV ? 'center' : 'left', fontSize: subSz, fill: txtCol });
      els.push({ id: 'id', type: 'text', content: `ID: ${idNum}`, x: isV ? bw : (bw+photoSz+18), y: isV ? (bw+photoSz+86) : (bw+82), width: isV ? (w-bw*2) : (w-bw*2-photoSz-26), align: isV ? 'center' : 'left', fontSize: 7, fill: '#94a3b8' });
      els.push({ id: 'ph', type: 'text', content: `Ph: ${phone}`, x: isV ? bw : (bw+photoSz+18), y: isV ? (bw+photoSz+96) : (bw+92), width: isV ? (w-bw*2) : (w-bw*2-photoSz-26), align: isV ? 'center' : 'left', fontSize: 7, fill: '#94a3b8' });
      break;
    }
    case 'cornerAccent': {
      const cSz = randBetween(50, 85, rng);
      els.push({ id: 'crn1', type: 'rect', x: -cSz*0.25, y: -cSz*0.25, width: cSz, height: cSz, cornerRadius: cSz/2, fill: pal.primary });
      els.push({ id: 'crn2', type: 'rect', x: w-cSz*0.45, y: h-cSz*0.45, width: cSz*0.6, height: cSz*0.6, cornerRadius: cSz*0.3, fill: pal.accent });
      els.push({ id: 'logo', type: 'image', x: isV ? (w-logoSz-8) : (w-logoSz-10), y: 10, width: logoSz, height: logoSz, cornerRadius: 4, src: '' });
      els.push(buildPhoto(photoStyle, isV ? (w/2-photoSz/2) : 16, isV ? 38 : 24, photoSz, photoUrl));
      els.push({ id: 'org', type: 'text', content: org, x: isV ? 0 : 16, y: isV ? (photoSz+48) : (photoSz+34), width: isV ? w : (w-32), align: isV ? 'center' : 'left', fontSize: 9, fill: pal.primary, fontStyle: 'bold' });
      els.push({ id: 'nm', type: 'text', content: personName, x: isV ? 0 : 16, y: isV ? (photoSz+64) : (photoSz+50), width: isV ? w : (w-32), align: isV ? 'center' : 'left', fontSize: nameSz, fill: txtCol, fontStyle: 'bold' });
      els.push({ id: 'rl', type: 'text', content: role, x: isV ? 0 : 16, y: isV ? (photoSz+82) : (photoSz+66), width: isV ? w : (w-32), align: isV ? 'center' : 'left', fontSize: subSz, fill: txtCol });
      els.push({ id: 'id', type: 'text', content: `ID: ${idNum}`, x: isV ? 0 : 16, y: isV ? (photoSz+96) : (photoSz+80), width: isV ? w : (w-32), align: isV ? 'center' : 'left', fontSize: 7, fill: '#94a3b8' });
      els.push({ id: 'ph', type: 'text', content: `Ph: ${phone}`, x: isV ? 0 : 16, y: isV ? (photoSz+106) : (photoSz+90), width: isV ? w : (w-32), align: isV ? 'center' : 'left', fontSize: 7, fill: '#94a3b8' });
      break;
    }
    case 'centerBand': {
      const bandH = randBetween(36, 55, rng);
      const bandY = Math.round((h-bandH)/2);
      els.push({ id: 'band', type: 'rect', x: 0, y: bandY, width: w, height: bandH, fill: pal.primary });
      els.push({ id: 'logo', type: 'image', x: isV ? (w/2-13) : 10, y: 10, width: 26, height: 26, cornerRadius: 5, src: '' });
      els.push({ id: 'org', type: 'text', content: org, x: isV ? 0 : 42, y: 16, width: isV ? w : 140, align: isV ? 'center' : 'left', fontSize: 9, fill: txtCol, fontStyle: 'bold' });
      els.push({ id: 'nm', type: 'text', content: personName, x: isV ? 0 : 12, y: bandY + (bandH/2-7), width: isV ? w : (w/2), align: isV ? 'center' : 'left', fontSize: nameSz, fill: '#ffffff', fontStyle: 'bold' });
      els.push({ id: 'rl', type: 'text', content: role, x: isV ? 0 : 12, y: bandY + (bandH/2+5), width: isV ? w : (w/2), align: isV ? 'center' : 'left', fontSize: subSz, fill: '#e2e8f0' });
      els.push({ id: 'id', type: 'text', content: `ID: ${idNum} | Ph: ${phone}`, x: isV ? 0 : 12, y: bandY + (bandH/2+17), width: isV ? w : (w/2), align: isV ? 'center' : 'left', fontSize: 6, fill: '#cbd5e1' });
      els.push(buildPhoto(photoStyle, isV ? (w/2-photoSz/2) : (w-photoSz-12), isV ? (bandY+bandH+10) : (bandY-photoSz-8), photoSz, photoUrl));
      break;
    }
    case 'topAndBottom': {
      const tH = randBetween(28, 44, rng); const bH = randBetween(22, 36, rng);
      els.push({ id: 'tbar', type: 'rect', x: 0, y: 0, width: w, height: tH, fill: pal.primary });
      els.push({ id: 'bbar', type: 'rect', x: 0, y: h-bH, width: w, height: bH, fill: pal.secondary });
      els.push({ id: 'logo', type: 'image', x: isV ? (w/2-12) : 8, y: (tH/2-12), width: 24, height: 24, cornerRadius: 12, src: '' });
      els.push({ id: 'org', type: 'text', content: org, x: isV ? 0 : 38, y: (tH/2-5), width: isV ? w : 140, align: isV ? 'center' : 'left', fontSize: 9, fill: '#ffffff', fontStyle: 'bold' });
      els.push(buildPhoto(photoStyle, isV ? (w/2-photoSz/2) : 12, tH + 10, photoSz, photoUrl));
      els.push({ id: 'nm', type: 'text', content: personName, x: isV ? 0 : (photoSz+24), y: isV ? (tH+photoSz+18) : (tH+16), width: isV ? w : (w-photoSz-36), align: isV ? 'center' : 'left', fontSize: nameSz, fill: txtCol, fontStyle: 'bold' });
      els.push({ id: 'rl', type: 'text', content: role, x: isV ? 0 : (photoSz+24), y: isV ? (tH+photoSz+34) : (tH+34), width: isV ? w : (w-photoSz-36), align: isV ? 'center' : 'left', fontSize: subSz, fill: txtCol });
      els.push({ id: 'ph', type: 'text', content: `Ph: ${phone}`, x: isV ? 0 : (photoSz+24), y: isV ? (tH+photoSz+48) : (tH+48), width: isV ? w : (w-photoSz-36), align: isV ? 'center' : 'left', fontSize: 7, fill: '#94a3b8' });
      els.push({ id: 'bid', type: 'text', content: `ID: ${idNum}`, x: 0, y: h-bH+(bH/2-4), width: w, align: 'center', fontSize: 8, fill: '#ffffff' });
      break;
    }
    case 'floatingCard': {
      const pad = randBetween(7, 12, rng);
      els.push({ id: 'obg', type: 'rect', x: 0, y: 0, width: w, height: h, fill: pal.primary });
      els.push({ id: 'ic', type: 'rect', x: pad, y: pad, width: w-pad*2, height: h-pad*2, fill: isDark ? '#1e293b' : '#ffffff', cornerRadius: 10 });
      els.push({ id: 'logo', type: 'image', x: pad+10, y: pad+8, width: 24, height: 24, cornerRadius: 5, src: '' });
      els.push({ id: 'org', type: 'text', content: org, x: pad+40, y: pad+14, fontSize: 9, fill: pal.primary, fontStyle: 'bold' });
      els.push(buildPhoto(photoStyle, isV ? (w/2-photoSz/2) : (pad+10), isV ? (pad+44) : (pad+44), photoSz, photoUrl));
      els.push({ id: 'nm', type: 'text', content: personName, x: isV ? pad : (pad+photoSz+18), y: isV ? (pad+photoSz+54) : (pad+52), width: isV ? (w-pad*2) : (w-pad*2-photoSz-26), align: isV ? 'center' : 'left', fontSize: nameSz, fill: isDark ? '#f1f5f9' : txtCol, fontStyle: 'bold' });
      els.push({ id: 'rl', type: 'text', content: role, x: isV ? pad : (pad+photoSz+18), y: isV ? (pad+photoSz+70) : (pad+68), width: isV ? (w-pad*2) : (w-pad*2-photoSz-26), align: isV ? 'center' : 'left', fontSize: subSz, fill: isDark ? '#94a3b8' : txtCol });
      els.push({ id: 'id', type: 'text', content: `ID: ${idNum} | Ph: ${phone}`, x: isV ? pad : (pad+photoSz+18), y: isV ? (pad+photoSz+84) : (pad+82), width: isV ? (w-pad*2) : (w-pad*2-photoSz-26), align: isV ? 'center' : 'left', fontSize: 7, fill: isDark ? '#64748b' : '#94a3b8' });
      break;
    }
    case 'gradientFade': {
      const gH = isV ? 105 : 80;
      els.push({ id: 'gblk', type: 'rect', x: 0, y: 0, width: w, height: gH, fill: pal.primary });
      els.push({ id: 'gfade', type: 'rect', x: 0, y: gH-8, width: w, height: 16, fill: pal.accent });
      els.push({ id: 'logo', type: 'image', x: isV ? (w/2-16) : 12, y: 10, width: 32, height: 32, cornerRadius: 16, src: '' });
      els.push({ id: 'org', type: 'text', content: org, x: isV ? 0 : 52, y: 18, width: isV ? w : 150, align: isV ? 'center' : 'left', fontSize: 10, fill: '#ffffff', fontStyle: 'bold' });
      els.push(buildPhoto(photoStyle, isV ? (w/2-photoSz/2) : 12, isV ? 55 : 44, photoSz, photoUrl));
      els.push({ id: 'nm', type: 'text', content: personName, x: isV ? 0 : (photoSz+24), y: isV ? (gH + 20) : (gH + 12), width: isV ? w : (w-photoSz-36), align: isV ? 'center' : 'left', fontSize: nameSz, fill: txtCol, fontStyle: 'bold' });
      els.push({ id: 'rl', type: 'text', content: role, x: isV ? 0 : (photoSz+24), y: isV ? (gH + 38) : (gH + 28), width: isV ? w : (w-photoSz-36), align: isV ? 'center' : 'left', fontSize: subSz, fill: txtCol });
      els.push({ id: 'id', type: 'text', content: `ID: ${idNum} | Ph: ${phone}`, x: isV ? 0 : (photoSz+24), y: isV ? (gH + 52) : (gH + 42), width: isV ? w : (w-photoSz-36), align: isV ? 'center' : 'left', fontSize: 7, fill: '#94a3b8' });
      break;
    }
    case 'asymmetric': {
      const blW = randBetween(isV ? 48 : 90, isV ? 75 : 130, rng);
      const blH = randBetween(isV ? 90 : 70, isV ? 145 : 110, rng);
      els.push({ id: 'abl', type: 'rect', x: 0, y: 0, width: blW, height: blH, fill: pal.primary });
      els.push({ id: 'aac', type: 'rect', x: blW, y: blH-16, width: w-blW, height: 4, fill: pal.secondary });
      els.push({ id: 'logo', type: 'image', x: 8, y: 8, width: 22, height: 22, cornerRadius: 4, src: '' });
      els.push({ id: 'org', type: 'text', content: org.substring(0,10), x: 8, y: 36, width: blW-14, fontSize: 8, fill: '#ffffff', fontStyle: 'bold' });
      const pSz2 = Math.min(photoSz, w-blW-18);
      els.push(buildPhoto(photoStyle, blW + 8, 12, pSz2, photoUrl));
      els.push({ id: 'nm', type: 'text', content: personName, x: isV ? 8 : (blW+8), y: isV ? (blH+12) : (pSz2+22), width: isV ? (w-16) : (w-blW-16), fontSize: nameSz, fill: txtCol, fontStyle: 'bold' });
      els.push({ id: 'rl', type: 'text', content: role, x: isV ? 8 : (blW+8), y: isV ? (blH+30) : (pSz2+38), width: isV ? (w-16) : (w-blW-16), fontSize: subSz, fill: txtCol });
      els.push({ id: 'id', type: 'text', content: `ID: ${idNum} | Ph: ${phone}`, x: isV ? 8 : (blW+8), y: isV ? (blH+44) : (pSz2+52), width: isV ? (w-16) : (w-blW-16), fontSize: 7, fill: '#94a3b8' });
      break;
    }
  }

  els.push(...buildDecorators(decType, w, h, pal, rng));
  return els;
}

// ══════════════════════════════════════════════════════════════════
// BACK CARD GENERATOR
// ══════════════════════════════════════════════════════════════════

function generateBack(orientation, pal, decType, rng, org, personPhone) {
  const { w, h } = CARD_DIMS[orientation];
  const isV = orientation === 'vertical';
  const els = [];
  const isDark = pal.bg.startsWith('#0') || pal.bg.startsWith('#1');
  const txtCol = isDark ? '#f1f5f9' : pal.text;
  if (isDark) els.push({ id: 'bg', type: 'rect', x: 0, y: 0, width: w, height: h, fill: pal.bg });

  const qrSz = randBetween(48, 72, rng);
  const bs = Math.floor(rng() * 5);

  switch (bs) {
    case 0: {
      const bH = randBetween(28, 44, rng);
      els.push({ id: 'hdr', type: 'rect', x: 0, y: 0, width: w, height: bH, fill: pal.primary });
      els.push({ id: 'ttl', type: 'text', content: 'IF FOUND, PLEASE RETURN TO:', x: 0, y: bH/2-4, width: w, align: 'center', fontSize: 7, fill: '#ffffff', fontStyle: 'bold' });
      els.push({ id: 'obn', type: 'text', content: org, x: 0, y: bH+10, width: w, align: 'center', fontSize: 9, fill: pal.primary, fontStyle: 'bold' });
      els.push({ id: 'addr', type: 'text', content: '123 Main Street, City - 560001', x: 0, y: bH+24, width: w, align: 'center', fontSize: 7, fill: txtCol });
      els.push({ id: 'ph', type: 'text', content: personPhone, x: 0, y: bH+36, width: w, align: 'center', fontSize: 7, fill: txtCol });
      els.push({ id: 'qr', type: 'rect', x: (w/2-qrSz/2), y: isV ? 90 : 60, width: qrSz, height: qrSz, fill: pal.accent, cornerRadius: 6 });
      els.push({ id: 'trm', type: 'text', content: 'This card is non-transferable property.', x: 8, y: h-20, width: w-16, align: 'center', fontSize: 6, fill: '#94a3b8' });
      break;
    }
    case 1: {
      const bW = randBetween(26, 44, rng);
      els.push({ id: 'sb', type: 'rect', x: 0, y: 0, width: bW, height: h, fill: pal.primary });
      els.push({ id: 'ttl', type: 'text', content: 'EMERGENCY CONTACT', x: bW+8, y: 16, fontSize: 8, fill: pal.primary, fontStyle: 'bold' });
      els.push({ id: 'ph', type: 'text', content: personPhone, x: bW+8, y: 32, fontSize: 7, fill: txtCol });
      els.push({ id: 'em', type: 'text', content: 'info@organization.com', x: bW+8, y: 44, fontSize: 7, fill: txtCol });
      els.push({ id: 'qr', type: 'rect', x: bW+8, y: isV ? 70 : 65, width: qrSz, height: qrSz, fill: pal.accent, cornerRadius: 4 });
      els.push({ id: 'trm', type: 'text', content: 'Unauthorized use prohibited.', x: bW+8, y: h-16, width: w-bW-16, fontSize: 6, fill: '#94a3b8' });
      break;
    }
    case 2: {
      els.push({ id: 'ta', type: 'rect', x: 0, y: 0, width: w, height: 5, fill: pal.primary });
      els.push({ id: 'ba', type: 'rect', x: 0, y: h-5, width: w, height: 5, fill: pal.secondary });
      els.push({ id: 'ttl', type: 'text', content: 'TERMS & CONDITIONS', x: 0, y: 18, width: w, align: 'center', fontSize: 8, fill: pal.primary, fontStyle: 'bold' });
      els.push({ id: 't1', type: 'text', content: '1. Must be worn visibly at all times.', x: 12, y: 36, width: w-24, fontSize: 7, fill: txtCol });
      els.push({ id: 't2', type: 'text', content: '2. Report lost cards immediately.', x: 12, y: 48, width: w-24, fontSize: 7, fill: txtCol });
      els.push({ id: 't3', type: 'text', content: '3. Non-transferable. Property of issuer.', x: 12, y: 60, width: w-24, fontSize: 7, fill: txtCol });
      els.push({ id: 'qr', type: 'rect', x: isV ? (w/2-qrSz/2) : (w-qrSz-12), y: isV ? 85 : 44, width: qrSz, height: qrSz, fill: pal.accent, cornerRadius: 8 });
      els.push({ id: 'bc', type: 'rect', x: isV ? 16 : 12, y: h-30, width: isV ? (w-32) : (w/2), height: 16, fill: pal.text, cornerRadius: 2 });
      break;
    }
    case 3: {
      els.push({ id: 'bdr', type: 'rect', x: 4, y: 4, width: w-8, height: h-8, fill: 'transparent', stroke: pal.primary, strokeWidth: 2, cornerRadius: 8 });
      els.push({ id: 'on', type: 'text', content: org, x: 0, y: 22, width: w, align: 'center', fontSize: 10, fill: pal.primary, fontStyle: 'bold' });
      els.push({ id: 'ws', type: 'text', content: 'www.organization.com', x: 0, y: 38, width: w, align: 'center', fontSize: 8, fill: txtCol });
      els.push({ id: 'qr', type: 'rect', x: (w/2-qrSz/2), y: (h/2-qrSz/2), width: qrSz, height: qrSz, fill: pal.accent, cornerRadius: 10 });
      els.push({ id: 'sc', type: 'text', content: 'Scan for verification', x: 0, y: (h/2+qrSz/2+6), width: w, align: 'center', fontSize: 7, fill: '#94a3b8' });
      break;
    }
    default: {
      els.push({ id: 'btm', type: 'rect', x: 0, y: Math.round(h*0.55), width: w, height: Math.round(h*0.45), fill: pal.primary });
      els.push({ id: 'ttl', type: 'text', content: 'CONTACT INFO', x: 12, y: 16, fontSize: 9, fill: pal.primary, fontStyle: 'bold' });
      els.push({ id: 'ph', type: 'text', content: personPhone, x: 12, y: 32, fontSize: 8, fill: txtCol });
      els.push({ id: 'em', type: 'text', content: 'contact@org.com', x: 12, y: 44, fontSize: 8, fill: txtCol });
      els.push({ id: 'qr', type: 'rect', x: isV ? (w/2-qrSz/2) : (w-qrSz-12), y: Math.round(h*0.55)+12, width: qrSz, height: qrSz, fill: pal.accent, cornerRadius: 6 });
      els.push({ id: 'sig', type: 'text', content: 'Authorized Signature', x: isV ? 0 : 12, y: h-16, width: isV ? w : (w/2), align: isV ? 'center' : 'left', fontSize: 6, fill: '#e2e8f0' });
      break;
    }
  }
  els.push(...buildDecorators(decType, w, h, pal, rng));
  return els;
}

// ── Preview gradient ──────────────────────────────────────────────
function makePreview(pal, rng) {
  const angle = [135, 45, 180, 90, 225, 0][Math.floor(rng() * 6)];
  const styles = [
    `linear-gradient(${angle}deg, ${pal.primary} 0%, ${pal.secondary} 100%)`,
    `linear-gradient(${angle}deg, ${pal.primary} 0%, ${pal.accent} 100%)`,
    `linear-gradient(${angle}deg, ${pal.bg} 0%, ${pal.primary} 50%, ${pal.secondary} 100%)`,
    `linear-gradient(${angle}deg, ${pal.primary} 0%, ${pal.bg} 100%)`,
  ];
  return styles[Math.floor(rng() * styles.length)];
}

// ══════════════════════════════════════════════════════════════════
// MAIN
// ══════════════════════════════════════════════════════════════════

async function run() {
  if (!pool) { console.error('DATABASE_URL not configured.'); process.exit(1); }

  console.log('🎨 Generating 20,000 truly unique ID card templates...');
  console.log(`   Layouts:     ${LAYOUTS.length}`);
  console.log(`   Palettes:    ${COLOR_PALETTES.length}`);
  console.log(`   PhotoStyles: ${PHOTO_STYLES.length}`);
  console.log(`   Decorators:  ${DECORATORS.length}`);
  console.log(`   Categories:  ${categories.length}`);
  console.log(`   Total combos: ${LAYOUTS.length * COLOR_PALETTES.length * PHOTO_STYLES.length * DECORATORS.length * categories.length}\n`);

  await pool.query('TRUNCATE TABLE templates');

  console.log('Generating 10,000 vertical templates...');
  await insertTemplates('vertical', 10000);

  console.log('\nGenerating 10,000 horizontal templates...');
  await insertTemplates('horizontal', 10000);

  console.log('\n✅ Successfully generated 20,000 unique templates!');
  process.exit(0);
}

async function insertTemplates(orientation, count) {
  const batchSize = 500;
  for (let i = 0; i < count; i += batchSize) {
    const params = [];
    const placeholders = [];

    for (let j = 0; j < batchSize && (i + j) < count; j++) {
      const index = i + j + 1;
      const seed = orientation === 'vertical' ? index * 7919 : index * 6271 + 100003;
      const rng = mulberry32(seed);

      const category = pick(categories, rng);
      const layout = pick(LAYOUTS, rng);
      const pal = pick(COLOR_PALETTES, rng);
      const photoStyle = pick(PHOTO_STYLES, rng);
      const decFront = pick(DECORATORS, rng);
      const decBack = pick(DECORATORS, rng);

      // Dummy data
      const firstName = pick(FIRST_NAMES, rng);
      const lastName = pick(LAST_NAMES, rng);
      const personName = `${firstName} ${lastName}`;
      const role = pick(ROLES[category], rng);
      const org = pick(ORGS[category], rng);
      const photoUrl = pick(DUMMY_PHOTOS, rng);
      const phone = `+91 ${randBetween(70000, 99999, rng)} ${randBetween(10000, 99999, rng)}`;

      const id = `${orientation[0]}${index}`;
      const layoutLabel = layout.replace(/([A-Z])/g, ' $1').trim();
      const name = `${category.charAt(0).toUpperCase() + category.slice(1)} ${layoutLabel} #${index}`;

      const front = generateFront(orientation, layout, pal, photoStyle, decFront, rng, personName, role, org, photoUrl, phone);
      const back = generateBack(orientation, pal, decBack, rng, org, phone);
      const preview = makePreview(pal, rng);

      placeholders.push('(?, ?, ?, ?, ?, ?, ?)');
      params.push(id, name, orientation, category, preview, JSON.stringify(front), JSON.stringify(back));
    }

    await pool.query(
      `INSERT INTO templates (id, name, orientation, category, preview_gradient, front_elements, back_elements) VALUES ${placeholders.join(',')}`,
      params
    );
    console.log(`  ${orientation}: ${Math.min(i + batchSize, count)}/${count}`);
  }
}

run();
