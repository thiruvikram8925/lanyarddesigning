const HEX_COLOR_REGEX = /^#(?:[0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i;
const RGB_COLOR_REGEX = /^rgb\(\s*([0-9]{1,3})\s*,\s*([0-9]{1,3})\s*,\s*([0-9]{1,3})\s*\)$/i;
const RGBA_COLOR_REGEX = /^rgba\(\s*([0-9]{1,3})\s*,\s*([0-9]{1,3})\s*,\s*([0-9]{1,3})\s*,\s*([0-9.]+)\s*\)$/i;
const HSL_COLOR_REGEX = /^hsl\(\s*([0-9]+(?:\.[0-9]+)?)\s*,\s*([0-9]+(?:\.[0-9]+)?)%\s*,\s*([0-9]+(?:\.[0-9]+)?)%\s*\)$/i;
const HSLA_COLOR_REGEX = /^hsla\(\s*([0-9]+(?:\.[0-9]+)?)\s*,\s*([0-9]+(?:\.[0-9]+)?)%\s*,\s*([0-9]+(?:\.[0-9]+)?)%\s*,\s*([0-9.]+)\s*\)$/i;

// CSS named colors → hex mapping (comprehensive list)
const NAMED_COLORS: Record<string, string> = {
  aliceblue: '#F0F8FF', antiquewhite: '#FAEBD7', aqua: '#00FFFF', aquamarine: '#7FFFD4',
  azure: '#F0FFFF', beige: '#F5F5DC', bisque: '#FFE4C4', black: '#000000',
  blanchedalmond: '#FFEBCD', blue: '#0000FF', blueviolet: '#8A2BE2', brown: '#A52A2A',
  burlywood: '#DEB887', cadetblue: '#5F9EA0', chartreuse: '#7FFF00', chocolate: '#D2691E',
  coral: '#FF7F50', cornflowerblue: '#6495ED', cornsilk: '#FFF8DC', crimson: '#DC143C',
  cyan: '#00FFFF', darkblue: '#00008B', darkcyan: '#008B8B', darkgoldenrod: '#B8860B',
  darkgray: '#A9A9A9', darkgrey: '#A9A9A9', darkgreen: '#006400', darkkhaki: '#BDB76B',
  darkmagenta: '#8B008B', darkolivegreen: '#556B2F', darkorange: '#FF8C00', darkorchid: '#9932CC',
  darkred: '#8B0000', darksalmon: '#E9967A', darkseagreen: '#8FBC8F', darkslateblue: '#483D8B',
  darkslategray: '#2F4F4F', darkslategrey: '#2F4F4F', darkturquoise: '#00CED1', darkviolet: '#9400D3',
  deeppink: '#FF1493', deepskyblue: '#00BFFF', dimgray: '#696969', dimgrey: '#696969',
  dodgerblue: '#1E90FF', firebrick: '#B22222', floralwhite: '#FFFAF0', forestgreen: '#228B22',
  fuchsia: '#FF00FF', gainsboro: '#DCDCDC', ghostwhite: '#F8F8FF', gold: '#FFD700',
  goldenrod: '#DAA520', gray: '#808080', grey: '#808080', green: '#008000',
  greenyellow: '#ADFF2F', honeydew: '#F0FFF0', hotpink: '#FF69B4', indianred: '#CD5C5C',
  indigo: '#4B0082', ivory: '#FFFFF0', khaki: '#F0E68C', lavender: '#E6E6FA',
  lavenderblush: '#FFF0F5', lawngreen: '#7CFC00', lemonchiffon: '#FFFACD', lightblue: '#ADD8E6',
  lightcoral: '#F08080', lightcyan: '#E0FFFF', lightgoldenrodyellow: '#FAFAD2', lightgray: '#D3D3D3',
  lightgrey: '#D3D3D3', lightgreen: '#90EE90', lightpink: '#FFB6C1', lightsalmon: '#FFA07A',
  lightseagreen: '#20B2AA', lightskyblue: '#87CEFA', lightslategray: '#778899', lightslategrey: '#778899',
  lightsteelblue: '#B0C4DE', lightyellow: '#FFFFE0', lime: '#00FF00', limegreen: '#32CD32',
  linen: '#FAF0E6', magenta: '#FF00FF', maroon: '#800000', mediumaquamarine: '#66CDAA',
  mediumblue: '#0000CD', mediumorchid: '#BA55D3', mediumpurple: '#9370DB', mediumseagreen: '#3CB371',
  mediumslateblue: '#7B68EE', mediumspringgreen: '#00FA9A', mediumturquoise: '#48D1CC',
  mediumvioletred: '#C71585', midnightblue: '#191970', mintcream: '#F5FFFA', mistyrose: '#FFE4E1',
  moccasin: '#FFE4B5', navajowhite: '#FFDEAD', navy: '#000080', oldlace: '#FDF5E6',
  olive: '#808000', olivedrab: '#6B8E23', orange: '#FFA500', orangered: '#FF4500',
  orchid: '#DA70D6', palegoldenrod: '#EEE8AA', palegreen: '#98FB98', paleturquoise: '#AFEEEE',
  palevioletred: '#DB7093', papayawhip: '#FFEFD5', peachpuff: '#FFDAB9', peru: '#CD853F',
  pink: '#FFC0CB', plum: '#DDA0DD', powderblue: '#B0E0E6', purple: '#800080',
  rebeccapurple: '#663399', red: '#FF0000', rosybrown: '#BC8F8F', royalblue: '#4169E1',
  saddlebrown: '#8B4513', salmon: '#FA8072', sandybrown: '#F4A460', seagreen: '#2E8B57',
  seashell: '#FFF5EE', sienna: '#A0522D', silver: '#C0C0C0', skyblue: '#87CEEB',
  slateblue: '#6A5ACD', slategray: '#708090', slategrey: '#708090', snow: '#FFFAFA',
  springgreen: '#00FF7F', steelblue: '#4682B4', tan: '#D2B48C', teal: '#008080',
  thistle: '#D8BFD8', tomato: '#FF6347', turquoise: '#40E0D0', violet: '#EE82EE',
  wheat: '#F5DEB3', white: '#FFFFFF', whitesmoke: '#F5F5F5', yellow: '#FFFF00',
  yellowgreen: '#9ACD32',
};

function clampChannel(value: number | string) {
  return Math.max(0, Math.min(255, Number(value)));
}

function expandShortHex(value: string) {
  if (value.length === 4) {
    // #RGB → #RRGGBB
    return `#${value.slice(1).split('').map((part) => `${part}${part}`).join('')}`;
  }
  if (value.length === 5) {
    // #RGBA → #RRGGBBAA
    return `#${value.slice(1).split('').map((part) => `${part}${part}`).join('')}`;
  }
  return value;
}

/** Convert HSL values to RGB */
function hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
  h = ((h % 360) + 360) % 360;
  s = Math.max(0, Math.min(100, s)) / 100;
  l = Math.max(0, Math.min(100, l)) / 100;

  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs((h / 60) % 2 - 1));
  const m = l - c / 2;

  let r1 = 0, g1 = 0, b1 = 0;
  if (h < 60) { r1 = c; g1 = x; }
  else if (h < 120) { r1 = x; g1 = c; }
  else if (h < 180) { g1 = c; b1 = x; }
  else if (h < 240) { g1 = x; b1 = c; }
  else if (h < 300) { r1 = x; b1 = c; }
  else { r1 = c; b1 = x; }

  return {
    r: Math.round((r1 + m) * 255),
    g: Math.round((g1 + m) * 255),
    b: Math.round((b1 + m) * 255),
  };
}

export interface ParsedColor {
  valid: boolean;
  normalized: string;
  rgb: { r: number; g: number; b: number } | null;
  alpha: number;
  format: string | null;
}

/**
 * Parse any CSS color string into a normalized form.
 * Supports: hex (#RGB, #RRGGBB, #RGBA, #RRGGBBAA), rgb(), rgba(),
 * hsl(), hsla(), and all 148 CSS named colors.
 */
export function parseColorCode(input = ''): ParsedColor {
  const value = input.trim();
  if (!value) return { valid: false, normalized: '', rgb: null, alpha: 1, format: null };

  // 1. Named colors (case-insensitive)
  const lower = value.toLowerCase();
  if (NAMED_COLORS[lower]) {
    const hex = NAMED_COLORS[lower];
    const numeric = hex.slice(1);
    return {
      valid: true,
      normalized: hex,
      format: 'NAMED',
      alpha: 1,
      rgb: {
        r: parseInt(numeric.slice(0, 2), 16),
        g: parseInt(numeric.slice(2, 4), 16),
        b: parseInt(numeric.slice(4, 6), 16),
      },
    };
  }

  // 2. Hex (#RGB, #RGBA, #RRGGBB, #RRGGBBAA)
  if (HEX_COLOR_REGEX.test(value)) {
    const expanded = expandShortHex(value).toUpperCase();
    const numeric = expanded.slice(1);
    let alpha = 1;
    if (numeric.length === 8) {
      alpha = parseInt(numeric.slice(6, 8), 16) / 255;
    }
    return {
      valid: true,
      normalized: expanded.slice(0, 7), // Always return 6-digit hex for the color
      format: 'HEX',
      alpha,
      rgb: {
        r: parseInt(numeric.slice(0, 2), 16),
        g: parseInt(numeric.slice(2, 4), 16),
        b: parseInt(numeric.slice(4, 6), 16),
      },
    };
  }

  // 3. rgb(r, g, b)
  const rgbMatch = value.match(RGB_COLOR_REGEX);
  if (rgbMatch) {
    const channels = rgbMatch.slice(1).map(Number);
    if (channels.every((channel) => channel >= 0 && channel <= 255)) {
      const [r, g, b] = channels.map(clampChannel);
      return {
        valid: true,
        normalized: `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`.toUpperCase(),
        format: 'RGB',
        alpha: 1,
        rgb: { r, g, b },
      };
    }
  }

  // 4. rgba(r, g, b, a)
  const rgbaMatch = value.match(RGBA_COLOR_REGEX);
  if (rgbaMatch) {
    const channels = rgbaMatch.slice(1, 4).map(Number);
    const alpha = parseFloat(rgbaMatch[4]);
    if (channels.every((channel) => channel >= 0 && channel <= 255) && alpha >= 0 && alpha <= 1) {
      const [r, g, b] = channels.map(clampChannel);
      return {
        valid: true,
        normalized: `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`.toUpperCase(),
        format: 'RGBA',
        alpha,
        rgb: { r, g, b },
      };
    }
  }

  // 5. hsl(h, s%, l%)
  const hslMatch = value.match(HSL_COLOR_REGEX);
  if (hslMatch) {
    const h = parseFloat(hslMatch[1]);
    const s = parseFloat(hslMatch[2]);
    const l = parseFloat(hslMatch[3]);
    const rgb = hslToRgb(h, s, l);
    return {
      valid: true,
      normalized: `#${rgb.r.toString(16).padStart(2, '0')}${rgb.g.toString(16).padStart(2, '0')}${rgb.b.toString(16).padStart(2, '0')}`.toUpperCase(),
      format: 'HSL',
      alpha: 1,
      rgb,
    };
  }

  // 6. hsla(h, s%, l%, a)
  const hslaMatch = value.match(HSLA_COLOR_REGEX);
  if (hslaMatch) {
    const h = parseFloat(hslaMatch[1]);
    const s = parseFloat(hslaMatch[2]);
    const l = parseFloat(hslaMatch[3]);
    const alpha = parseFloat(hslaMatch[4]);
    const rgb = hslToRgb(h, s, l);
    return {
      valid: true,
      normalized: `#${rgb.r.toString(16).padStart(2, '0')}${rgb.g.toString(16).padStart(2, '0')}${rgb.b.toString(16).padStart(2, '0')}`.toUpperCase(),
      format: 'HSLA',
      alpha: Math.max(0, Math.min(1, alpha)),
      rgb,
    };
  }

  // 7. Try bare 6-digit hex without # (e.g. "FF0000")
  if (/^[0-9a-f]{6}$/i.test(value)) {
    const withHash = `#${value.toUpperCase()}`;
    return {
      valid: true,
      normalized: withHash,
      format: 'HEX',
      alpha: 1,
      rgb: {
        r: parseInt(value.slice(0, 2), 16),
        g: parseInt(value.slice(2, 4), 16),
        b: parseInt(value.slice(4, 6), 16),
      },
    };
  }

  // 8. Try bare 3-digit hex without # (e.g. "F00")
  if (/^[0-9a-f]{3}$/i.test(value)) {
    const expanded = value.split('').map(c => c + c).join('');
    const withHash = `#${expanded.toUpperCase()}`;
    return {
      valid: true,
      normalized: withHash,
      format: 'HEX',
      alpha: 1,
      rgb: {
        r: parseInt(expanded.slice(0, 2), 16),
        g: parseInt(expanded.slice(2, 4), 16),
        b: parseInt(expanded.slice(4, 6), 16),
      },
    };
  }

  return { valid: false, normalized: '', rgb: null, alpha: 1, format: null };
}

/**
 * Convert any valid color input to a hex string for canvas/CSS use.
 * Works with hex, rgb, rgba, hsl, hsla, and named colors.
 */
export function toHexColor(color: string, fallback = '#2563EB') {
  const parsed = parseColorCode(color);
  if (!parsed.valid || !parsed.rgb) return fallback;

  return `#${[parsed.rgb.r, parsed.rgb.g, parsed.rgb.b]
    .map((channel) => channel.toString(16).padStart(2, '0'))
    .join('')}`.toUpperCase();
}

/**
 * Resolve any color format to a valid CSS color string that can be used in
 * canvas fillStyle or CSS backgroundColor. Always resolves to hex.
 */
export function resolveColorForCanvas(color: string, fallback = '#FFFFFF'): string {
  const parsed = parseColorCode(color);
  if (!parsed.valid || !parsed.rgb) return fallback;
  return parsed.normalized;
}

/**
 * Check if a string is a valid CSS color in any supported format.
 */
export function isValidColor(input: string): boolean {
  return parseColorCode(input).valid;
}

/**
 * Get a human-readable label for the detected color format.
 */
export function getColorFormatLabel(input: string): string {
  const parsed = parseColorCode(input);
  if (!parsed.valid) return 'Invalid';
  switch (parsed.format) {
    case 'HEX': return 'HEX';
    case 'RGB': return 'RGB';
    case 'RGBA': return 'RGBA';
    case 'HSL': return 'HSL';
    case 'HSLA': return 'HSLA';
    case 'NAMED': return 'Named';
    default: return 'Color';
  }
}

export function darkenColor(color: string, amount = 25) {
  const parsed = parseColorCode(color);
  if (!parsed.valid || !parsed.rgb) return color;

  const next = Object.values(parsed.rgb).map((channel) => Math.max(0, channel - amount));
  return `rgb(${next[0]}, ${next[1]}, ${next[2]})`;
}
