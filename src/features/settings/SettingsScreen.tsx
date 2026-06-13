import { Alert, Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { useTranslation } from 'react-i18next';
import { exportData, importData } from '../../core/backup/backup';
import { planRepository } from '../../core/db/plan.repository';
import { sessionRepository } from '../../core/db/session.repository';
import { useSettings } from '../../core/settings/SettingsContext';
import { useTheme } from '../../core/theme/ThemeContext';
import { Screen } from '../../shared/components/Screen';
import { PillSelector } from '../../shared/components/PillSelector';
import { fonts } from '../../shared/theme/tokens';

export function SettingsScreen() {
  const { t } = useTranslation();
  const { settings, setSetting } = useSettings();
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  const sectionStyle = [styles.section, { color: theme.colorText }];

  const handleExport = async () => {
    const json = await exportData(planRepository, sessionRepository);
    const name = `trainer-buddy-export-${new Date().toISOString().slice(0, 10)}.json`;
    const file = new File(Paths.cache, name);
    if (file.exists) file.delete();
    file.write(json);
    await Sharing.shareAsync(file.uri, { mimeType: 'application/json' });
  };

  const handleImport = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: 'application/json',
      copyToCacheDirectory: true,
    });
    if (result.canceled || result.assets.length === 0) return;
    const raw = await new File(result.assets[0].uri).text();
    Alert.alert(t('settings.importConfirmTitle'), t('settings.importConfirmMessage'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('settings.importConfirm'),
        style: 'destructive',
        onPress: () => {
          void importData(raw, planRepository, sessionRepository)
            .then(() => Alert.alert(t('settings.importDone')))
            .catch((error: Error) => {
              Alert.alert(
                error.message === 'import-blocked'
                  ? t('settings.importBlocked')
                  : t('settings.importInvalid'),
              );
            });
        },
      },
    ]);
  };

  return (
    <Screen>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 16 }}
      >
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

        <Text style={sectionStyle}>{t('settings.data')}</Text>
        <Pressable
          onPress={() => void handleExport()}
          style={[styles.dataButton, { backgroundColor: theme.colorPrimary }]}
        >
          <Text style={[styles.dataLabel, { color: theme.colorOnPrimary }]}>
            {t('settings.export')}
          </Text>
        </Pressable>
        <Pressable
          onPress={() => void handleImport()}
          style={[styles.dataButton, { borderColor: theme.colorPrimaryStrong, borderWidth: 1 }]}
        >
          <Text style={[styles.dataLabel, { color: theme.colorPrimaryStrong }]}>
            {t('settings.import')}
          </Text>
        </Pressable>

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
  dataButton: { borderRadius: 999, paddingVertical: 12, alignItems: 'center', marginBottom: 10 },
  dataLabel: { fontFamily: fonts.label, fontSize: 14 },
  about: { fontFamily: fonts.body, fontSize: 13, lineHeight: 19, marginBottom: 24 },
});
