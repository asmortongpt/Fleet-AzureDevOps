// src/styles/design-tokens.ts

export const designTokens = {
  colors: {
    primary: {
      50: '#e3f2fd',
      100: '#bbdefb',
      200: '#90caf9',
      300: '#64b5f6',
      400: '#42a5f5',
      500: '#2196f3',
      600: '#1e88e5',
      700: '#1976d2',
      800: '#1565c0',
      900: '#0d47a1',
    },
    secondary: {
      50: '#fce4ec',
      100: '#f8bbd0',
      200: '#f48fb1',
      300: '#f06292',
      400: '#ec407a',
      500: '#e91e63',
      600: '#d81b60',
      700: '#c2185b',
      800: '#ad1457',
      900: '#880e4f',
    },
    neutral: {
      50: '#fafafa',
      100: '#f5f5f5',
      200: '#eeeeee',
      300: '#e0e0e0',
      400: '#bdbdbd',
      500: '#9e9e9e',
      600: '#757575',
      700: '#616161',
      800: '#424242',
      900: '#212121',
    },
    semantic: {
      success: '#4caf50',
      warning: '#ff9800',
      error: '#f44336',
      info: '#2196f3',
    },
    alpha: {
      overlay: 'rgba(0, 0, 0, 0.5)',
    },
  },
  typography: {
    fontFamily: {
      primary: '"Roboto", sans-serif',
      secondary: '"Arial", sans-serif',
      monospace: '"Courier New", monospace',
    },
    fontSize: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '1.875rem',
      '4xl': '2.25rem',
      '5xl': '3rem',
    },
    fontWeight: {
      light: 300,
      regular: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
    lineHeight: {
      tight: 1.25,
      normal: 1.5,
      relaxed: 1.75,
      loose: 2,
    },
    letterSpacing: {
      normal: '0em',
      wide: '0.05em',
      wider: '0.1em',
    },
  },
  spacing: {
    scale: {
      0: '0px',
      1: '4px',
      2: '8px',
      3: '12px',
      4: '16px',
      5: '20px',
      6: '24px',
      7: '28px',
      8: '32px',
      9: '36px',
      10: '40px',
      11: '44px',
      12: '48px',
      13: '52px',
      14: '56px',
      15: '60px',
      16: '64px',
    },
    layout: {
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
      '2xl': '1536px',
    },
    component: {
      padding: '16px',
      margin: '16px',
    },
  },
  borders: {
    radius: {
      none: '0px',
      sm: '4px',
      md: '8px',
      lg: '16px',
      xl: '24px',
      full: '9999px',
    },
    width: {
      thin: '1px',
      medium: '2px',
      thick: '4px',
      extraThick: '8px',
    },
  },
  shadows: {
    sm: '0 1px 2px rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px rgba(0, 0, 0, 0.1)',
    lg: '0 10px 15px rgba(0, 0, 0, 0.1)',
    xl: '0 20px 25px rgba(0, 0, 0, 0.1)',
    '2xl': '0 25px 50px rgba(0, 0, 0, 0.25)',
    inner: 'inset 0 2px 4px rgba(0, 0, 0, 0.06)',
  },
  animations: {
    duration: {
      fast: '150ms',
      normal: '300ms',
      slow: '500ms',
    },
    easing: {
      easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
      easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
      easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
      spring: 'cubic-bezier(0.5, 1.5, 0.5, 1)',
    },
    transition: {
      default: 'all 300ms cubic-bezier(0.4, 0, 0.2, 1)',
    },
  },
} as const;

// CSS Custom Properties Export
export const cssVariables = Object.entries(designTokens).reduce((acc, [category, tokens]) => {
  Object.entries(tokens).forEach(([key, value]) => {
    if (typeof value === 'object') {
      Object.entries(value).forEach(([subKey, subValue]) => {
        acc[`--${category}-${key}-${subKey}`] = String(subValue);
      });
    } else {
      acc[`--${category}-${key}`] = value;
    }
  });
  return acc;
}, {} as Record<string, string>);

// Tailwind Config Integration
export const tailwindConfig = {
  theme: {
    extend: {
      colors: designTokens.colors,
      fontFamily: designTokens.typography.fontFamily,
      fontSize: designTokens.typography.fontSize,
      fontWeight: designTokens.typography.fontWeight,
      lineHeight: designTokens.typography.lineHeight,
      letterSpacing: designTokens.typography.letterSpacing,
      spacing: designTokens.spacing.scale,
      borderRadius: designTokens.borders.radius,
      borderWidth: designTokens.borders.width,
      boxShadow: designTokens.shadows,
      transitionDuration: designTokens.animations.duration,
      transitionTimingFunction: designTokens.animations.easing,
    },
  },
};

// Type-safe token access
type DesignTokens = typeof designTokens;
export type ColorToken = keyof DesignTokens['colors'];
export type TypographyToken = keyof DesignTokens['typography'];
export type SpacingToken = keyof DesignTokens['spacing'];
export type BorderToken = keyof DesignTokens['borders'];
export type ShadowToken = keyof DesignTokens['shadows'];
export type AnimationToken = keyof DesignTokens['animations'];