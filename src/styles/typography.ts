// src/styles/typography.ts — ArchonY Typography System

type FontStack = {
  primary: string;
  secondary: string;
  display: string;
};

type TypeScale = {
  display: number[];
  heading: number[];
  body: number[];
  caption: number[];
};

type TextStyle = {
  fontSize: string;
  fontWeight: number;
  lineHeight: string;
  fontFamily: string;
};

type TypographySystem = {
  fontStack: FontStack;
  typeScale: TypeScale;
  textStyles: {
    heading: TextStyle[];
    body: TextStyle[];
    caption: TextStyle[];
    code: TextStyle[];
  };
  utilities: {
    textTruncate: (lines?: number) => string;
    textTransform: (transform: 'uppercase' | 'capitalize') => string;
    textAlign: (align: 'left' | 'center' | 'right' | 'justify') => string;
    textDecoration: (decoration: 'underline' | 'line-through' | 'none') => string;
  };
};

const typography: TypographySystem = {
  fontStack: {
    primary: "'Montserrat', 'Inter', system-ui, sans-serif",
    secondary: "'JetBrains Mono', 'Fira Code', monospace",
    display: "'Cinzel', 'Times New Roman', serif",
  },
  typeScale: {
    display: [32, 28, 24],
    heading: [20, 18, 16, 14],
    body: [14, 13],
    caption: [12, 11],
  },
  textStyles: {
    heading: [
      { fontSize: '32px', fontWeight: 600, lineHeight: '1.2', fontFamily: "'Cinzel', serif" },
      { fontSize: '28px', fontWeight: 600, lineHeight: '1.2', fontFamily: "'Cinzel', serif" },
      { fontSize: '24px', fontWeight: 600, lineHeight: '1.3', fontFamily: "'Cinzel', serif" },
      { fontSize: '20px', fontWeight: 600, lineHeight: '1.3', fontFamily: "'Montserrat', sans-serif" },
      { fontSize: '18px', fontWeight: 600, lineHeight: '1.4', fontFamily: "'Montserrat', sans-serif" },
      { fontSize: '16px', fontWeight: 600, lineHeight: '1.4', fontFamily: "'Montserrat', sans-serif" },
    ],
    body: [
      { fontSize: '14px', fontWeight: 400, lineHeight: '1.5', fontFamily: "'Montserrat', sans-serif" },
      { fontSize: '13px', fontWeight: 400, lineHeight: '1.5', fontFamily: "'Montserrat', sans-serif" },
      { fontSize: '14px', fontWeight: 600, lineHeight: '1.5', fontFamily: "'Montserrat', sans-serif" },
      { fontSize: '14px', fontWeight: 300, lineHeight: '1.5', fontFamily: "'Montserrat', sans-serif" },
    ],
    caption: [
      { fontSize: '12px', fontWeight: 500, lineHeight: '1.4', fontFamily: "'Montserrat', sans-serif" },
      { fontSize: '11px', fontWeight: 400, lineHeight: '1.4', fontFamily: "'Montserrat', sans-serif" },
    ],
    code: [
      { fontSize: '13px', fontWeight: 400, lineHeight: '1.5', fontFamily: "'JetBrains Mono', monospace" },
      { fontSize: '12px', fontWeight: 400, lineHeight: '1.5', fontFamily: "'JetBrains Mono', monospace" },
    ],
  },
  utilities: {
    textTruncate: (lines = 1) => `
      overflow: hidden;
      display: -webkit-box;
      -webkit-line-clamp: ${lines};
      -webkit-box-orient: vertical;
    `,
    textTransform: (transform) => `text-transform: ${transform};`,
    textAlign: (align) => `text-align: ${align};`,
    textDecoration: (decoration) => `text-decoration: ${decoration};`,
  },
};

// ArchonY convenience export
export const archonyTypography = {
  fontFamily: {
    display: "'Cinzel', 'Times New Roman', serif",
    body: "'Montserrat', 'Inter', system-ui, sans-serif",
    mono: "'JetBrains Mono', 'Fira Code', monospace",
  },
  fontSize: {
    xs: '0.75rem',
    sm: '0.8125rem',
    base: '0.875rem',
    lg: '1.125rem',
    xl: '1.25rem',
    '2xl': '1.5rem',
    '3xl': '1.75rem',
    '4xl': '2rem',
  },
  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
} as const;

export default typography;
