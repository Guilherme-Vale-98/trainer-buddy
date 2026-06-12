import { ScrollView, StyleSheet, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSettings } from '../../core/settings/SettingsContext';
import { useTheme } from '../../core/theme/ThemeContext';
import { Screen } from '../../shared/components/Screen';
import { PillSelector } from '../../shared/components/PillSelector';
import { fonts } from '../../shared/theme/tokens';

export function SettingsScreen() {
  const { t } = useTranslation();
  const { settings, setSetting } = useSettings();
  const theme = useTheme();

  const sectionStyle = [styles.section, { color: theme.colorText }];

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={sectionStyle}>{t('settings.language')}</Text>
        <PillSelector
          options={[
            { value: 'pt', label: 'Português' },
            { value: 'en', label: 'English' },
          ]}
          selected={settings.language}
          onSelect={(v) => setSetting('language', v)}
        />

        <Text style={sectionStyle}>{t('settings.theme')}</Text>
        <PillSelector
          options={[
            { value: 'light', label: t('settings.theme.light') },
            { value: 'dark', label: t('settings.theme.dark') },
            { value: 'system', label: t('settings.theme.system') },
          ]}
          selected={settings.theme}
          onSelect={(v) => setSetting('theme', v)}
        />

        <Text style={sectionStyle}>{t('settings.unit')}</Text>
        <PillSelector
          options={[
            { value: 'kg', label: 'kg' },
            { value: 'lb', label: 'lb' },
          ]}
          selected={settings.unit}
          onSelect={(v) => setSetting('unit', v)}
        />

        <Text style={sectionStyle}>{t('settings.about')}</Text>
        <Text style={[styles.about, { color: theme.colorTextMuted }]}>
          {t('settings.attribution')}
        </Text>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  section: { fontFamily: fonts.subtitle, fontSize: 15, marginTop: 20, marginBottom: 10 },
  about: { fontFamily: fonts.body, fontSize: 13, lineHeight: 19, marginBottom: 24 },
});
