import '@mui/material/styles';

// Определяем типы для кастомных цветов
export interface ColorPalette {
  50: string;
  100: string;
  200: string;
  300: string;
  400: string;
  500: string;
  600: string;
  700: string;
  800: string;
  900: string;
}

export interface GradientPalette {
  primary: string;
  secondary: string;
  neutral: string;
  accent: string;
}

export interface CustomColors {
  primary: ColorPalette;
  neutral: ColorPalette;
  brown: ColorPalette;
  gradients: GradientPalette;
}

// Расширяем интерфейс Theme из Material-UI
declare module '@mui/material/styles' {
  interface Theme {
    colors: CustomColors;
  }
  
  interface ThemeOptions {
    colors?: CustomColors;
  }
}