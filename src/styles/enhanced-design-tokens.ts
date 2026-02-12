/**
 * Enhanced Design Token System
 * World-class visual design tokens for Fleet Management System
 *
 * Features:
 * - Extended color palettes with semantic meanings
 * - Data visualization color schemes (color-blind friendly)
 * - Advanced gradient definitions
 * - Comprehensive animation/motion tokens
 * - Responsive typography scales
 * - Elevation/shadow system
 */

export const enhancedDesignTokens = {
  // ============================================================================
  // COLORS - Extended palette with semantic purpose
  // ============================================================================
  colors: {
    // Primary brand colors
    primary: {
      50: '#e3f2fd',
      100: '#bbdefb',
      200: '#90caf9',
      300: '#64b5f6',
      400: '#42a5f5',
      500: '#2196f3',  // Main brand
      600: '#1e88e5',
      700: '#1976d2',
      800: '#1565c0',
      900: '#0d47a1',
      950: '#0a3880',
    },

    // Secondary/Accent colors
    secondary: {
      50: '#f3e5f5',
      100: '#e1bee7',
      200: '#ce93d8',
      300: '#ba68c8',
      400: '#ab47bc',
      500: '#9c27b0',
      600: '#8e24aa',
      700: '#7b1fa2',
      800: '#6a1b9a',
      900: '#4a148c',
    },

    // Semantic status colors
    success: {
      50: '#e8f5e9',
      100: '#c8e6c9',
      200: '#a5d6a7',
      300: '#81c784',
      400: '#66bb6a',
      500: '#4caf50',  // Main success
      600: '#43a047',
      700: '#388e3c',
      800: '#2e7d32',
      900: '#1b5e20',
    },

    warning: {
      50: '#fff3e0',
      100: '#ffe0b2',
      200: '#ffcc80',
      300: '#ffb74d',
      400: '#ffa726',
      500: '#ff9800',  // Main warning
      600: '#fb8c00',
      700: '#f57c00',
      800: '#ef6c00',
      900: '#e65100',
    },

    error: {
      50: '#ffebee',
      100: '#ffcdd2',
      200: '#ef9a9a',
      300: '#e57373',
      400: '#ef5350',
      500: '#f44336',  // Main error
      600: '#e53935',
      700: '#d32f2f',
      800: '#c62828',
      900: '#b71c1c',
    },

    info: {
      50: '#e1f5fe',
      100: '#b3e5fc',
      200: '#81d4fa',
      300: '#4fc3f7',
      400: '#29b6f6',
      500: '#03a9f4',  // Main info
      600: '#039be5',
      700: '#0288d1',
      800: '#0277bd',
      900: '#01579b',
    },

    // Neutral grays
    neutral: {
      0: '#ffffff',
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
      950: '#0a0a0a',
      1000: '#000000',
    },

    // Data visualization colors (color-blind friendly)
    dataViz: {
      categorical: [
        '#2196F3',  // Blue
        '#4CAF50',  // Green
        '#FF9800',  // Orange
        '#9C27B0',  // Purple
        '#F44336',  // Red
        '#00BCD4',  // Cyan
        '#FFEB3B',  // Yellow
        '#795548',  // Brown
        '#607D8B',  // Blue Gray
        '#E91E63',  // Pink
      ],
      sequential: {
        blue: ['#E3F2FD', '#BBDEFB', '#90CAF9', '#64B5F6', '#42A5F5', '#2196F3', '#1E88E5', '#1976D2', '#1565C0', '#0D47A1'],
        green: ['#E8F5E9', '#C8E6C9', '#A5D6A7', '#81C784', '#66BB6A', '#4CAF50', '#43A047', '#388E3C', '#2E7D32', '#1B5E20'],
        red: ['#FFEBEE', '#FFCDD2', '#EF9A9A', '#E57373', '#EF5350', '#F44336', '#E53935', '#D32F2F', '#C62828', '#B71C1C'],
        purple: ['#F3E5F5', '#E1BEE7', '#CE93D8', '#BA68C8', '#AB47BC', '#9C27B0', '#8E24AA', '#7B1FA2', '#6A1B9A', '#4A148C'],
      },
      diverging: {
        redBlue: ['#B71C1C', '#D32F2F', '#E57373', '#FFCDD2', '#EEEEEE', '#BBDEFB', '#64B5F6', '#1976D2', '#0D47A1'],
        orangeTeal: ['#E65100', '#F57C00', '#FFA726', '#FFE0B2', '#EEEEEE', '#B2EBF2', '#4DD0E1', '#0097A7', '#006064'],
      },
      heatmap: ['#1A237E', '#3F51B5', '#2196F3', '#03A9F4', '#00BCD4', '#009688', '#4CAF50', '#CDDC39', '#FFEB3B', '#FF9800', '#DD3903'],
    },
  },

  // ============================================================================
  // GRADIENTS - Beautiful gradient definitions
  // ============================================================================
  gradients: {
    primary: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    secondary: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    success: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    warning: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    danger: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%)',
    info: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',

    // Glassmorphism backgrounds
    glass: {
      light: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05))',
      dark: 'linear-gradient(135deg, rgba(0, 0, 0, 0.2), rgba(0, 0, 0, 0.1))',
      colored: {
        blue: 'linear-gradient(135deg, rgba(33, 150, 243, 0.1), rgba(33, 150, 243, 0.05))',
        green: 'linear-gradient(135deg, rgba(76, 175, 80, 0.1), rgba(76, 175, 80, 0.05))',
        purple: 'linear-gradient(135deg, rgba(156, 39, 176, 0.1), rgba(156, 39, 176, 0.05))',
      },
    },

    // Dashboard backgrounds
    dashboard: {
      primary: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
      dark: 'linear-gradient(180deg, #0a0e27 0%, #1a1f3a 100%)',
      subtle: 'linear-gradient(135deg, #fdfcfb 0%, #e2d1c3 100%)',
    },
  },

  // ============================================================================
  // TYPOGRAPHY - Comprehensive type scale
  // ============================================================================
  typography: {
    fontFamily: {
      sans: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      mono: '"JetBrains Mono", "Fira Code", Consolas, "Courier New", monospace',
      display: '"Poppins", system-ui, sans-serif',
    },
    fontSize: {
      xs: ['0.75rem', { lineHeight: '1rem' }],
      sm: ['0.875rem', { lineHeight: '1.25rem' }],
      base: ['1rem', { lineHeight: '1.5rem' }],
      lg: ['1.125rem', { lineHeight: '1.75rem' }],
      xl: ['1.25rem', { lineHeight: '1.75rem' }],
      '2xl': ['1.5rem', { lineHeight: '2rem' }],
      '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
      '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
      '5xl': ['3rem', { lineHeight: '1' }],
      '6xl': ['3.75rem', { lineHeight: '1' }],
      '7xl': ['4.5rem', { lineHeight: '1' }],
      '8xl': ['6rem', { lineHeight: '1' }],
      '9xl': ['8rem', { lineHeight: '1' }],
    },
    fontWeight: {
      thin: 100,
      extralight: 200,
      light: 300,
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
      extrabold: 800,
      black: 900,
    },
  },

  // ============================================================================
  // SPACING - 8pt grid system
  // ============================================================================
  spacing: {
    0: '0px',
    px: '1px',
    0.5: '2px',
    1: '4px',
    1.5: '6px',
    2: '8px',
    2.5: '10px',
    3: '12px',
    3.5: '14px',
    4: '16px',
    5: '20px',
    6: '24px',
    7: '28px',
    8: '32px',
    9: '36px',
    10: '40px',
    11: '44px',
    12: '48px',
    14: '56px',
    16: '64px',
    20: '80px',
    24: '96px',
    28: '112px',
    32: '128px',
    36: '144px',
    40: '160px',
    44: '176px',
    48: '192px',
    52: '208px',
    56: '224px',
    60: '240px',
    64: '256px',
    72: '288px',
    80: '320px',
    96: '384px',
  },

  // ============================================================================
  // SHADOWS - Elevation system (Material Design inspired)
  // ============================================================================
  shadows: {
    xs: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    sm: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
    '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    '3xl': '0 35px 60px -15px rgba(0, 0, 0, 0.3)',
    inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.05)',

    // Colored shadows for emphasis
    colored: {
      primary: '0 10px 25px -5px rgba(33, 150, 243, 0.3)',
      success: '0 10px 25px -5px rgba(76, 175, 80, 0.3)',
      warning: '0 10px 25px -5px rgba(255, 152, 0, 0.3)',
      error: '0 10px 25px -5px rgba(244, 67, 54, 0.3)',
    },

    // Glow effects
    glow: {
      sm: '0 0 10px rgba(33, 150, 243, 0.5)',
      md: '0 0 20px rgba(33, 150, 243, 0.5)',
      lg: '0 0 30px rgba(33, 150, 243, 0.5)',
    },
  },

  // ============================================================================
  // ANIMATIONS - Motion design tokens
  // ============================================================================
  animations: {
    duration: {
      instant: '50ms',
      fast: '150ms',
      normal: '300ms',
      slow: '500ms',
      slower: '700ms',
      slowest: '1000ms',
    },
    easing: {
      linear: 'linear',
      easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
      easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
      easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
      spring: 'cubic-bezier(0.5, 1.5, 0.5, 1)',
      bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
      smooth: 'cubic-bezier(0.25, 0.1, 0.25, 1)',
    },
    keyframes: {
      fadeIn: {
        from: { opacity: 0 },
        to: { opacity: 1 },
      },
      fadeOut: {
        from: { opacity: 1 },
        to: { opacity: 0 },
      },
      slideUp: {
        from: { transform: 'translateY(10px)', opacity: 0 },
        to: { transform: 'translateY(0)', opacity: 1 },
      },
      slideDown: {
        from: { transform: 'translateY(-10px)', opacity: 0 },
        to: { transform: 'translateY(0)', opacity: 1 },
      },
      slideLeft: {
        from: { transform: 'translateX(10px)', opacity: 0 },
        to: { transform: 'translateX(0)', opacity: 1 },
      },
      slideRight: {
        from: { transform: 'translateX(-10px)', opacity: 0 },
        to: { transform: 'translateX(0)', opacity: 1 },
      },
      scaleIn: {
        from: { transform: 'scale(0.95)', opacity: 0 },
        to: { transform: 'scale(1)', opacity: 1 },
      },
      scaleOut: {
        from: { transform: 'scale(1)', opacity: 1 },
        to: { transform: 'scale(0.95)', opacity: 0 },
      },
      spin: {
        from: { transform: 'rotate(0deg)' },
        to: { transform: 'rotate(360deg)' },
      },
      ping: {
        '0%, 100%': { transform: 'scale(1)', opacity: 1 },
        '50%': { transform: 'scale(1.1)', opacity: 0.8 },
      },
      pulse: {
        '0%, 100%': { opacity: 1 },
        '50%': { opacity: 0.5 },
      },
      shimmer: {
        '0%': { backgroundPosition: '-200% center' },
        '100%': { backgroundPosition: '200% center' },
      },
    },
  },

  // ============================================================================
  // BORDERS - Border radius and widths
  // ============================================================================
  borders: {
    radius: {
      none: '0px',
      sm: '4px',
      md: '8px',
      lg: '12px',
      xl: '16px',
      '2xl': '20px',
      '3xl': '24px',
      full: '9999px',
    },
    width: {
      0: '0px',
      DEFAULT: '1px',
      2: '2px',
      4: '4px',
      8: '8px',
    },
  },

  // ============================================================================
  // BREAKPOINTS - Responsive design
  // ============================================================================
  breakpoints: {
    xs: '480px',
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
    '3xl': '1920px',
  },
} as const

export type EnhancedDesignTokens = typeof enhancedDesignTokens
