import { useColorScheme } from 'react-native';
import { colors, type ThemeColors } from './colors';

export function useThemeColors(): ThemeColors {
  const scheme = useColorScheme();
  return scheme === 'dark' ? colors.dark : colors.light;
}
