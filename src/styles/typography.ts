// src/styles/typography.ts

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
    primary: "'Inter', system-ui, sans-serif",
    secondary: "'IBM Plex Mono', monospace",
    display: "'Manrope', sans-serif",
  },
  typeScale: {
    display: [48, 40, 32],
    heading: [28, 24, 20, 18],
    body: [16, 14],
    caption: [12, 11],
  },
  textStyles: {
    heading: [
      { fontSize: '48px', fontWeight: 700, lineHeight: '1.2', fontFamily: "'Manrope', sans-serif" },
      { fontSize: '40px', fontWeight: 700, lineHeight: '1.2', fontFamily: "'Manrope', sans-serif" },
      { fontSize: '32px', fontWeight: 700, lineHeight: '1.2', fontFamily: "'Manrope', sans-serif" },
      { fontSize: '28px', fontWeight: 700, lineHeight: '1.3', fontFamily: "'Inter', sans-serif" },
      { fontSize: '24px', fontWeight: 700, lineHeight: '1.3', fontFamily: "'Inter', sans-serif" },
      { fontSize: '20px', fontWeight: 700, lineHeight: '1.4', fontFamily: "'Inter', sans-serif" },
    ],
    body: [
      { fontSize: '16px', fontWeight: 400, lineHeight: '1.5', fontFamily: "'Inter', sans-serif" },
      { fontSize: '14px', fontWeight: 400, lineHeight: '1.5', fontFamily: "'Inter', sans-serif" },
      { fontSize: '16px', fontWeight: 600, lineHeight: '1.5', fontFamily: "'Inter', sans-serif" },
      { fontSize: '14px', fontWeight: 300, lineHeight: '1.5', fontFamily: "'Inter', sans-serif" },
    ],
    caption: [
      { fontSize: '12px', fontWeight: 400, lineHeight: '1.4', fontFamily: "'Inter', sans-serif" },
      { fontSize: '11px', fontWeight: 400, lineHeight: '1.4', fontFamily: "'Inter', sans-serif" },
    ],
    code: [
      { fontSize: '14px', fontWeight: 400, lineHeight: '1.5', fontFamily: "'IBM Plex Mono', monospace" },
      { fontSize: '14px', fontWeight: 400, lineHeight: '1.5', fontFamily: "'IBM Plex Mono', monospace" },
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

export default typography;