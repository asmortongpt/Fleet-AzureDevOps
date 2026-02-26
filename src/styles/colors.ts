// src/styles/colors.ts — ArchonY Brand Palette

type ColorFormat = {
  hex: string;
  rgb: string;
  hsl: string;
};

type ColorPalette = {
  [key: string]: ColorFormat;
};

type ColorShades = {
  [shade: number]: ColorFormat;
};

type ColorUtilities = {
  lighten: (color: string, percentage: number) => string;
  darken: (color: string, percentage: number) => string;
  alpha: (color: string, alpha: number) => string;
};

const hexToRgb = (hex: string): string => {
  const bigint = parseInt(hex.slice(1), 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgb(${r}, ${g}, ${b})`;
};

const hexToHsl = (hex: string): string => {
  const rgb = hexToRgb(hex).match(/\d+/g)?.map(Number) || [0, 0, 0];
  const [r, g, b] = rgb.map((v: number) => v / 255);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }

  return `hsl(${(h * 360).toFixed(1)}, ${(s * 100).toFixed(1)}%, ${(l * 100).toFixed(1)}%)`;
};

const createColorFormat = (hex: string): ColorFormat => ({
  hex,
  rgb: hexToRgb(hex),
  hsl: hexToHsl(hex),
});

// ArchonY Brand Colors
const primaryBrandColors: { [key: string]: ColorShades } = {
  midnight: {
    100: createColorFormat('#E8E0F5'),
    200: createColorFormat('#B8A3DB'),
    300: createColorFormat('#7B5CB5'),
    400: createColorFormat('#3D2080'),
    500: createColorFormat('#1A0648'),
  },
  daytime: {
    100: createColorFormat('#E4E8F5'),
    200: createColorFormat('#A3B0DB'),
    300: createColorFormat('#5C73B5'),
    400: createColorFormat('#263A8A'),
    500: createColorFormat('#1F3076'),
  },
  blueSkies: {
    100: createColorFormat('#CCF5FF'),
    200: createColorFormat('#66E3FF'),
    300: createColorFormat('#33D9FF'),
    400: createColorFormat('#00CCFE'),
    500: createColorFormat('#00A3CB'),
  },
  noon: {
    100: createColorFormat('#FFE0D4'),
    200: createColorFormat('#FFB299'),
    300: createColorFormat('#FF7A4D'),
    400: createColorFormat('#FF4300'),
    500: createColorFormat('#CC3600'),
  },
  goldenHour: {
    100: createColorFormat('#FFF4CC'),
    200: createColorFormat('#FEE580'),
    300: createColorFormat('#FDD640'),
    400: createColorFormat('#FDC016'),
    500: createColorFormat('#CA9A12'),
  },
};

const functionalColors: ColorPalette = {
  success: createColorFormat('#10B981'),
  warning: createColorFormat('#FDC016'),
  error: createColorFormat('#FF4300'),
  info: createColorFormat('#00CCFE'),
};

// Surface scale for dark mode
const neutralGrays: ColorShades = {
  0: createColorFormat('#0D0320'),
  10: createColorFormat('#1A0648'),
  20: createColorFormat('#221060'),
  30: createColorFormat('#2A1878'),
  40: createColorFormat('#332090'),
  50: createColorFormat('#3D2AA0'),
  60: createColorFormat('#4A38B0'),
  70: createColorFormat('#5A4AC0'),
  80: createColorFormat('#7060D0'),
  90: createColorFormat('#9080E0'),
  100: createColorFormat('#FFFFFF'),
};

const colorUtilities: ColorUtilities = {
  lighten: (color: string, _percentage: number): string => {
    return color;
  },
  darken: (color: string, _percentage: number): string => {
    return color;
  },
  alpha: (color: string, alpha: number): string => {
    const rgb = hexToRgb(color).match(/\d+/g)?.map(Number) || [0, 0, 0];
    return `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${alpha})`;
  },
};

// ArchonY convenience exports
export const archonyColors = {
  midnight: '#1A0648',
  daytime: '#1F3076',
  blueSkies: '#00CCFE',
  noon: '#FF4300',
  goldenHour: '#FDC016',

  surface: {
    0: '#0D0320',
    1: '#1A0648',
    2: '#221060',
    3: '#2A1878',
    4: '#332090',
  },

  surfaceLight: {
    0: '#F5F5F7',
    1: '#FFFFFF',
    2: '#FAFAFA',
    3: '#F0F0F2',
    4: '#E8E8EC',
  },

  success: '#10B981',
  error: '#FF4300',
  warning: '#FDC016',
  info: '#00CCFE',

  text: {
    primary: '#FFFFFF',
    secondary: 'rgba(255, 255, 255, 0.65)',
    muted: 'rgba(255, 255, 255, 0.40)',
  },

  gradients: {
    brand: 'linear-gradient(135deg, #1A0648 0%, #1F3076 25%, #00CCFE 50%, #FF4300 75%, #FDC016 100%)',
    bar: 'linear-gradient(90deg, #1F3076, #00CCFE, #FF4300, #FDC016)',
  },
} as const;

export type ArchonyColor = keyof typeof archonyColors;

export {
  primaryBrandColors,
  functionalColors,
  neutralGrays,
  colorUtilities,
};
