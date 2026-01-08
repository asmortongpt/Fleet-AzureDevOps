// src/styles/colors.ts

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

const primaryBrandColors: { [key: string]: ColorShades } = {
  corporateBlue: {
    100: createColorFormat('#E6F2FF'),
    200: createColorFormat('#99CCFF'),
    300: createColorFormat('#3399FF'),
    400: createColorFormat('#0073E6'),
    500: createColorFormat('#0066CC'),
  },
  professionalDark: {
    100: createColorFormat('#F2F2F2'),
    200: createColorFormat('#B3B3B3'),
    300: createColorFormat('#666666'),
    400: createColorFormat('#333333'),
    500: createColorFormat('#1A1A1A'),
  },
  accentGold: {
    100: createColorFormat('#FFF4CC'),
    200: createColorFormat('#FFE699'),
    300: createColorFormat('#FFD966'),
    400: createColorFormat('#FFCC33'),
    500: createColorFormat('#FFB800'),
  },
};

const functionalColors: ColorPalette = {
  success: createColorFormat('#00A651'),
  warning: createColorFormat('#FFA000'),
  error: createColorFormat('#D32F2F'),
  info: createColorFormat('#1976D2'),
};

const neutralGrays: ColorShades = {
  0: createColorFormat('#FFFFFF'),
  10: createColorFormat('#E6E6E6'),
  20: createColorFormat('#CCCCCC'),
  30: createColorFormat('#B3B3B3'),
  40: createColorFormat('#999999'),
  50: createColorFormat('#808080'),
  60: createColorFormat('#666666'),
  70: createColorFormat('#4D4D4D'),
  80: createColorFormat('#333333'),
  90: createColorFormat('#1A1A1A'),
  100: createColorFormat('#000000'),
};

const colorUtilities: ColorUtilities = {
  lighten: (color: string, _percentage: number): string => {
    // Implement lighten logic
    return color;
  },
  darken: (color: string, _percentage: number): string => {
    // Implement darken logic
    return color;
  },
  alpha: (color: string, alpha: number): string => {
    const rgb = hexToRgb(color).match(/\d+/g)?.map(Number) || [0, 0, 0];
    return `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${alpha})`;
  },
};

export {
  primaryBrandColors,
  functionalColors,
  neutralGrays,
  colorUtilities,
};