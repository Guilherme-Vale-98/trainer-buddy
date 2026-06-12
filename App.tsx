import 'react-native-screens';
import './src/core/i18n/i18n';
import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import {
  useFonts,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
} from '@expo-google-fonts/poppins';
import {
  LeagueSpartan_400Regular,
  LeagueSpartan_600SemiBold,
} from '@expo-google-fonts/league-spartan';
import { SettingsProvider, useSettings } from './src/core/settings/SettingsContext';
import { ThemeProvider, useTheme } from './src/core/theme/ThemeContext';
import { AppNavigator } from './src/navigation/AppNavigator';

function Root() {
  const { settings, ready } = useSettings();
  const { i18n } = useTranslation();
  const theme = useTheme();

  useEffect(() => {
    if (i18n.language !== settings.language) i18n.changeLanguage(settings.language);
  }, [settings.language, i18n]);

  if (!ready) return null;

  return (
    <>
      <AppNavigator />
      <StatusBar style={theme.name === 'dark' ? 'light' : 'dark'} />
    </>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
    LeagueSpartan_400Regular,
    LeagueSpartan_600SemiBold,
  });

  if (!fontsLoaded) return null;

  return (
    <SafeAreaProvider>
      <SettingsProvider>
        <ThemeProvider>
          <Root/>
        </ThemeProvider>
      </SettingsProvider>
    </SafeAreaProvider>
  );
}
