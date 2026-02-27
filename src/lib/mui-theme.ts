/**
 * MUI Theme Override
 * Overrides MUI's default blue primary color with emerald/teal
 * to match the CTA Fleet brand palette.
 */
import { createTheme } from '@mui/material';

export const muiTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#10b981',      // Emerald 500
      light: '#34d399',     // Emerald 400
      dark: '#059669',      // Emerald 600
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#a0a0a0',      // Silver
      light: '#e0e0e0',
      dark: '#707070',
      contrastText: '#ffffff',
    },
    background: {
      default: '#0a0a0a',
      paper: '#111111',
    },
    text: {
      primary: '#ffffff',
      secondary: 'rgba(255, 255, 255, 0.6)',
    },
  },
  typography: {
    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: '#111111',
          borderColor: 'rgba(255, 255, 255, 0.08)',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
  },
});
