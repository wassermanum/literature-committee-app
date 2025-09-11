import { createTheme, alpha } from '@mui/material/styles';
import './types'; // Импортируем типы для расширения интерфейса Theme
import type { CustomColors } from './types';

// Цветовая палитра на основе тёмно-серых/коричневых тонов с синими акцентами
const colors: CustomColors = {
  // Основные цвета
  primary: {
    50: '#e3f2fd',
    100: '#bbdefb',
    200: '#90caf9',
    300: '#64b5f6',
    400: '#42a5f5',
    500: '#2196f3', // Основной синий
    600: '#1e88e5',
    700: '#1976d2',
    800: '#1565c0',
    900: '#0d47a1',
  },
  // Тёмно-серые/коричневые тона
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
  // Коричневые оттенки
  brown: {
    50: '#efebe9',
    100: '#d7ccc8',
    200: '#bcaaa4',
    300: '#a1887f',
    400: '#8d6e63',
    500: '#795548',
    600: '#6d4c41',
    700: '#5d4037',
    800: '#4e342e',
    900: '#3e2723',
  },
  // Градиентные цвета
  gradients: {
    primary: 'linear-gradient(135deg, #2196f3 0%, #1976d2 100%)',
    secondary: 'linear-gradient(135deg, #795548 0%, #5d4037 100%)',
    neutral: 'linear-gradient(135deg, #616161 0%, #424242 100%)',
    accent: 'linear-gradient(135deg, #42a5f5 0%, #795548 100%)',
  },
};

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: colors.primary[500],
      light: colors.primary[300],
      dark: colors.primary[700],
      contrastText: '#ffffff',
    },
    secondary: {
      main: colors.brown[600],
      light: colors.brown[400],
      dark: colors.brown[800],
      contrastText: '#ffffff',
    },
    background: {
      default: '#fafafa',
      paper: '#ffffff',
    },
    text: {
      primary: colors.neutral[800],
      secondary: colors.neutral[600],
    },
    grey: colors.neutral,
    divider: alpha(colors.neutral[300], 0.12),
  },
  typography: {
    fontFamily: [
      'Inter',
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
    ].join(','),
    h1: {
      fontSize: '2.5rem',
      fontWeight: 600,
      lineHeight: 1.2,
      letterSpacing: '-0.02em',
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 600,
      lineHeight: 1.3,
      letterSpacing: '-0.01em',
    },
    h3: {
      fontSize: '1.75rem',
      fontWeight: 600,
      lineHeight: 1.3,
    },
    h4: {
      fontSize: '1.5rem',
      fontWeight: 600,
      lineHeight: 1.4,
    },
    h5: {
      fontSize: '1.25rem',
      fontWeight: 600,
      lineHeight: 1.4,
    },
    h6: {
      fontSize: '1.125rem',
      fontWeight: 600,
      lineHeight: 1.4,
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.6,
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.5,
    },
    button: {
      textTransform: 'none',
      fontWeight: 500,
    },
  },
  shape: {
    borderRadius: 12,
  },
  shadows: [
    'none',
    '0px 2px 4px rgba(0, 0, 0, 0.05)',
    '0px 4px 8px rgba(0, 0, 0, 0.08)',
    '0px 8px 16px rgba(0, 0, 0, 0.1)',
    '0px 12px 24px rgba(0, 0, 0, 0.12)',
    '0px 16px 32px rgba(0, 0, 0, 0.15)',
    '0px 20px 40px rgba(0, 0, 0, 0.18)',
    '0px 24px 48px rgba(0, 0, 0, 0.2)',
    '0px 28px 56px rgba(0, 0, 0, 0.22)',
    '0px 32px 64px rgba(0, 0, 0, 0.24)',
    '0px 36px 72px rgba(0, 0, 0, 0.26)',
    '0px 40px 80px rgba(0, 0, 0, 0.28)',
    '0px 44px 88px rgba(0, 0, 0, 0.3)',
    '0px 48px 96px rgba(0, 0, 0, 0.32)',
    '0px 52px 104px rgba(0, 0, 0, 0.34)',
    '0px 56px 112px rgba(0, 0, 0, 0.36)',
    '0px 60px 120px rgba(0, 0, 0, 0.38)',
    '0px 64px 128px rgba(0, 0, 0, 0.4)',
    '0px 68px 136px rgba(0, 0, 0, 0.42)',
    '0px 72px 144px rgba(0, 0, 0, 0.44)',
    '0px 76px 152px rgba(0, 0, 0, 0.46)',
    '0px 80px 160px rgba(0, 0, 0, 0.48)',
    '0px 84px 168px rgba(0, 0, 0, 0.5)',
    '0px 88px 176px rgba(0, 0, 0, 0.52)',
    '0px 92px 184px rgba(0, 0, 0, 0.54)',
  ],
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          padding: '10px 24px',
          fontSize: '0.875rem',
          fontWeight: 500,
          textTransform: 'none',
          boxShadow: 'none',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.15)',
            transform: 'translateY(-1px)',
          },
        },
        contained: {
          background: colors.gradients.primary,
          '&:hover': {
            background: colors.gradients.primary,
            filter: 'brightness(1.1)',
          },
        },
        outlined: {
          borderWidth: 2,
          '&:hover': {
            borderWidth: 2,
            background: alpha(colors.primary[500], 0.04),
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.08)',
          border: `1px solid ${alpha(colors.neutral[300], 0.12)}`,
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            boxShadow: '0px 8px 32px rgba(0, 0, 0, 0.12)',
            transform: 'translateY(-2px)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 12,
        },
        elevation1: {
          boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.06)',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 12,
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: colors.primary[400],
            },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderWidth: 2,
              borderColor: colors.primary[500],
            },
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          background: colors.gradients.neutral,
          boxShadow: '0px 2px 12px rgba(0, 0, 0, 0.08)',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          borderRadius: '0 16px 16px 0',
          border: 'none',
          boxShadow: '4px 0 20px rgba(0, 0, 0, 0.1)',
        },
      },
    },
  },
});

// Создаем расширенную тему с кастомными цветами
const extendedTheme = createTheme({
  ...theme,
  colors,
});

export default extendedTheme;
export { colors };