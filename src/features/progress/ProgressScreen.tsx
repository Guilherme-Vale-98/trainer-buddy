import { StyleSheet, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../core/theme/ThemeContext';
import { Screen } from '../../shared/components/Screen';
import { fonts } from '../../shared/theme/tokens';

export function ProgressScreen() {
  const { t } = useTranslation();
  const theme = useTheme();

  return (
    <Screen title={t('progress.title')}>
      <Text style={[styles.empty, { color: theme.colorTextMuted }]}>{t('progress.empty')}</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  empty: { fontFamily: fonts.body, fontSize: 14 },
});
