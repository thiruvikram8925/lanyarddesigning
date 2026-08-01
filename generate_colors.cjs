const fs = require('fs');

function hslToHex(h, s, l) {
  l /= 100;
  const a = s * Math.min(l, 1 - l) / 100;
  const f = n => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`.toUpperCase();
}

const colorCategories = [
  { name: 'Red', hRange: [345, 15] },
  { name: 'Orange', hRange: [15, 45] },
  { name: 'Yellow', hRange: [45, 75] },
  { name: 'Chartreuse', hRange: [75, 105] },
  { name: 'Green', hRange: [105, 165] },
  { name: 'Cyan', hRange: [165, 195] },
  { name: 'Azure', hRange: [195, 225] },
  { name: 'Blue', hRange: [225, 255] },
  { name: 'Violet', hRange: [255, 285] },
  { name: 'Magenta', hRange: [285, 315] },
  { name: 'Rose', hRange: [315, 345] }
];

function getCategory(h, s, l) {
  if (l < 15) return 'Blacks/Darks';
  if (l > 95) return 'Whites/Lights';
  if (s < 10) return 'Grays/Neutrals';
  
  for (const cat of colorCategories) {
    if (cat.hRange[0] > cat.hRange[1]) {
      if (h >= cat.hRange[0] || h < cat.hRange[1]) return cat.name;
    } else {
      if (h >= cat.hRange[0] && h < cat.hRange[1]) return cat.name;
    }
  }
  return 'Other';
}

const colors = [];
// H: 0 to 359 (step 4) = 90
// S: 20 to 100 (step 20) = 5
// L: 20 to 80 (step 10) = 7
// 90 * 5 * 7 = 3150 colors
for (let h = 0; h < 360; h += 4) {
  for (let s = 20; s <= 100; s += 20) {
    for (let l = 20; l <= 80; l += 10) {
      const hex = hslToHex(h, s, l);
      const category = getCategory(h, s, l);
      colors.push({ category, name: `${category} H${h} S${s} L${l}`, hex, h, s, l });
    }
  }
}

// Add grays
for(let l = 0; l <= 100; l += 2) {
   colors.push({ category: 'Grays/Neutrals', name: `Gray L${l}`, hex: hslToHex(0, 0, l), h: 0, s: 0, l });
}

// Group by category
const grouped = {};
colors.forEach(c => {
  if (!grouped[c.category]) grouped[c.category] = [];
  grouped[c.category].push({ name: c.name, hex: c.hex });
});

// Build the TS file
let out = `// Auto-generated 3000+ color presets\n\n`;
out += `export interface ColorPreset {\n  name: string;\n  hex: string;\n}\n\n`;
out += `export interface ColorCategory {\n  category: string;\n  colors: ColorPreset[];\n}\n\n`;
out += `export const MASSIVE_COLOR_PRESETS: ColorCategory[] = [\n`;

const passportStandards = [
  { name: 'White', hex: '#FFFFFF' },
  { name: 'Light Gray', hex: '#F0F0F0' },
  { name: 'Passport Blue', hex: '#D6EAF8' },
  { name: 'Light Blue', hex: '#AED6F1' },
  { name: 'Sky Blue', hex: '#87CEEB' },
  { name: 'Visa Gray', hex: '#E8E8E8' },
];

out += `  {\n    category: '📋 Passport / ID Standards',\n    colors: ${JSON.stringify(passportStandards, null, 6).replace(/\n/g, '\n  ').replace(/\]/g, '    ]')}\n  },\n`;

for (const [cat, arr] of Object.entries(grouped)) {
  out += `  {\n    category: ${JSON.stringify(cat)},\n    colors: ${JSON.stringify(arr, null, 6).replace(/\n/g, '\n  ').replace(/\]/g, '    ]')}\n  },\n`;
}
out += `];\n`;

fs.writeFileSync('src/lib/colorPresets.ts', out);
console.log('Generated colorPresets.ts with ' + colors.length + ' colors.');
