export interface ThemeColors {
  background: string;
  surface: string;
  surfaceMuted: string;
  border: string;
  text: string;
  textMuted: string;
  primary: string;
  primaryText: string;
  success: string;
  successBg: string;
  warning: string;
  warningBg: string;
  destructive: string;
  destructiveBg: string;
}

export const colors: { light: ThemeColors; dark: ThemeColors } = {
  light: {
    background: '#FFFFFF',
    surface: '#FFFFFF',
    surfaceMuted: '#F5F6F8',
    border: '#E3E5E8',
    text: '#1A1B1E',
    textMuted: '#6B7078',
    primary: '#1447E6',
    primaryText: '#FFFFFF',
    success: '#1C8A4B',
    successBg: '#E7F6ED',
    warning: '#B5730A',
    warningBg: '#FDF3E1',
    destructive: '#D8352B',
    destructiveBg: '#FBE9E8',
  },
  dark: {
    background: '#121316',
    surface: '#1B1C20',
    surfaceMuted: '#242529',
    border: '#2E3036',
    text: '#F2F2F3',
    textMuted: '#9A9CA3',
    primary: '#5B8DFF',
    primaryText: '#0B1220',
    success: '#3FBE77',
    successBg: '#123422',
    warning: '#E0A83C',
    warningBg: '#3A2C0F',
    destructive: '#F1685E',
    destructiveBg: '#3B1917',
  },
} as const;
