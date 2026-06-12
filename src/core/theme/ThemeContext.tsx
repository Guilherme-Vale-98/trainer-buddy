import { createContext, useContext, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import { darkTheme, lightTheme, type Theme } from '../../shared/theme/tokens';
import { useSettings } from '../settings/SettingsContext';

const ThemeContext = createContext<Theme>(darkTheme);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { settings } = useSettings();
  const systemScheme = useColorScheme();

  const resolved =
    settings.theme === 'system' ? (systemScheme ?? 'dark') : settings.theme;
  const theme = resolved === 'light' ? lightTheme : darkTheme;

  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}

export function useTheme(): Theme {
  return useContext(ThemeContext);
}
