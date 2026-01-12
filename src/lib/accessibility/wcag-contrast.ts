/**
 * WCAG 2.1 Color Contrast Utilities
 *
 * Provides utilities for checking and ensuring WCAG 2.1 AA color contrast compliance
 * AA Level requires:
 * - Normal text: 4.5:1 contrast ratio
 * - Large text (18pt+ or 14pt+ bold): 3:1 contrast ratio
 * - UI components and graphics: 3:1 contrast ratio
 *
 * AAA Level requires:
 * - Normal text: 7:1 contrast ratio
 * - Large text: 4.5:1 contrast ratio
 */

/**
 * Convert hex color to RGB values
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

/**
 * Convert RGB to relative luminance (WCAG formula)
 */
export function getLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    const sRGB = c / 255;
    return sRGB <= 0.03928 ? sRGB / 12.92 : Math.pow((sRGB + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Calculate contrast ratio between two colors (WCAG formula)
 */
export function getContrastRatio(color1: string, color2: string): number {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);

  if (!rgb1 || !rgb2) {
    throw new Error('Invalid color format. Use hex colors like #FFFFFF');
  }

  const l1 = getLuminance(rgb1.r, rgb1.g, rgb1.b);
  const l2 = getLuminance(rgb2.r, rgb2.g, rgb2.b);

  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);

  return (lighter + 0.05) / (darker + 0.05);
}

export type WCAGLevel = 'AA' | 'AAA';
export type TextSize = 'normal' | 'large';

interface ContrastRequirement {
  ratio: number;
  level: WCAGLevel;
  textSize: TextSize;
}

/**
 * WCAG contrast requirements
 */
export const WCAG_REQUIREMENTS: Record<string, ContrastRequirement> = {
  'AA-normal': { ratio: 4.5, level: 'AA', textSize: 'normal' },
  'AA-large': { ratio: 3, level: 'AA', textSize: 'large' },
  'AAA-normal': { ratio: 7, level: 'AAA', textSize: 'normal' },
  'AAA-large': { ratio: 4.5, level: 'AAA', textSize: 'large' },
};

/**
 * Check if contrast ratio meets WCAG requirements
 */
export function meetsWCAG(
  foreground: string,
  background: string,
  level: WCAGLevel = 'AA',
  textSize: TextSize = 'normal'
): boolean {
  const ratio = getContrastRatio(foreground, background);
  const requirement = WCAG_REQUIREMENTS[`${level}-${textSize}`];
  return ratio >= requirement.ratio;
}

/**
 * Get WCAG compliance details for a color combination
 */
export function getWCAGCompliance(foreground: string, background: string) {
  const ratio = getContrastRatio(foreground, background);

  return {
    ratio: Math.round(ratio * 100) / 100,
    AA: {
      normal: ratio >= WCAG_REQUIREMENTS['AA-normal'].ratio,
      large: ratio >= WCAG_REQUIREMENTS['AA-large'].ratio,
    },
    AAA: {
      normal: ratio >= WCAG_REQUIREMENTS['AAA-normal'].ratio,
      large: ratio >= WCAG_REQUIREMENTS['AAA-large'].ratio,
    },
  };
}

/**
 * Find the closest WCAG-compliant color by adjusting lightness
 */
export function findCompliantColor(
  foreground: string,
  background: string,
  level: WCAGLevel = 'AA',
  textSize: TextSize = 'normal'
): string {
  if (meetsWCAG(foreground, background, level, textSize)) {
    return foreground;
  }

  const rgb = hexToRgb(foreground);
  if (!rgb) return foreground;

  const targetRatio = WCAG_REQUIREMENTS[`${level}-${textSize}`].ratio;
  const bgLuminance = getLuminance(
    ...Object.values(hexToRgb(background) || { r: 0, g: 0, b: 0 })
  );

  // Try darkening or lightening the color
  for (let factor = 0.9; factor > 0; factor -= 0.1) {
    const adjusted = {
      r: Math.round(rgb.r * factor),
      g: Math.round(rgb.g * factor),
      b: Math.round(rgb.b * factor),
    };

    const adjustedHex = `#${adjusted.r.toString(16).padStart(2, '0')}${adjusted.g.toString(16).padStart(2, '0')}${adjusted.b.toString(16).padStart(2, '0')}`;

    if (meetsWCAG(adjustedHex, background, level, textSize)) {
      return adjustedHex;
    }
  }

  // If darkening doesn't work, try lightening
  for (let factor = 1.1; factor <= 2; factor += 0.1) {
    const adjusted = {
      r: Math.min(255, Math.round(rgb.r * factor)),
      g: Math.min(255, Math.round(rgb.g * factor)),
      b: Math.min(255, Math.round(rgb.b * factor)),
    };

    const adjustedHex = `#${adjusted.r.toString(16).padStart(2, '0')}${adjusted.g.toString(16).padStart(2, '0')}${adjusted.b.toString(16).padStart(2, '0')}`;

    if (meetsWCAG(adjustedHex, background, level, textSize)) {
      return adjustedHex;
    }
  }

  // If all else fails, return black or white depending on background
  return bgLuminance > 0.5 ? '#000000' : '#FFFFFF';
}

/**
 * Validate all colors in a theme for WCAG compliance
 */
export function validateThemeColors(theme: Record<string, string>): {
  compliant: boolean;
  issues: Array<{ combination: string; ratio: number; required: number }>;
} {
  const issues: Array<{ combination: string; ratio: number; required: number }> = [];

  // Common combinations to check
  const combinations = [
    { fg: 'text', bg: 'background', name: 'Text on Background' },
    { fg: 'primary', bg: 'background', name: 'Primary on Background' },
    { fg: 'primary-foreground', bg: 'primary', name: 'Primary Text' },
    { fg: 'secondary-foreground', bg: 'secondary', name: 'Secondary Text' },
    { fg: 'muted-foreground', bg: 'muted', name: 'Muted Text' },
    { fg: 'accent-foreground', bg: 'accent', name: 'Accent Text' },
  ];

  for (const combo of combinations) {
    const fg = theme[combo.fg];
    const bg = theme[combo.bg];

    if (fg && bg) {
      const ratio = getContrastRatio(fg, bg);
      const required = WCAG_REQUIREMENTS['AA-normal'].ratio;

      if (ratio < required) {
        issues.push({
          combination: combo.name,
          ratio: Math.round(ratio * 100) / 100,
          required,
        });
      }
    }
  }

  return {
    compliant: issues.length === 0,
    issues,
  };
}
