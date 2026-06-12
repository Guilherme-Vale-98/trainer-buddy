import { useCallback, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { sessionRepository } from '../../core/db/session.repository';
import type { WorkoutSession } from '../../core/db/models';
import { useSettings } from '../../core/settings/SettingsContext';
import { useTheme } from '../../core/theme/ThemeContext';
import { Screen } from '../../shared/components/Screen';
import { fonts } from '../../shared/theme/tokens';
import type { RootStackParamList } from '../../navigation/AppNavigator';

export function formatSessionDate(iso: string, language: 'pt' | 'en'): string {
  return new Date(iso).toLocaleDateString(language === 'pt' ? 'pt-BR' : 'en-US', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function HistoryScreen() {
  const { t } = useTranslation();
  const { settings } = useSettings();
  const theme = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [sessions, setSessions] = useState<WorkoutSession[]>([]);

  const reload = useCallback(() => {
    let active = true;
    sessionRepository.getCompletedSessions().then((loaded) => {
      if (active) setSessions(loaded);
    });
    return () => {
      active = false;
    };
  }, []);

  useFocusEffect(reload);

  const confirmDelete = (session: WorkoutSession) => {
    Alert.alert(t('history.deleteTitle'), t('history.deleteMessage'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('history.delete'),
        style: 'destructive',
        onPress: () => {
          void sessionRepository.deleteSession(session.id).then(() => {
            setSessions((prev) => prev.filter((s) => s.id !== session.id));
          });
        },
      },
    ]);
  };

  return (
    <Screen title={t('history.title')}>
      {sessions.length === 0 ? (
        <Text style={[styles.empty, { color: theme.colorTextMuted }]}>{t('history.empty')}</Text>
      ) : (
        <FlatList
          data={sessions}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => navigation.navigate('SessionDetail', { sessionId: item.id })}
              style={[styles.card, { backgroundColor: theme.colorSurfaceTint }]}
            >
              <View style={styles.cardBody}>
                <Text style={[styles.setName, { color: theme.colorText }]}>{item.workoutSetName}</Text>
                <Text style={[styles.meta, { color: theme.colorTextMuted }]}>
                  {formatSessionDate(item.startedAt, settings.language)} ·{' '}
                  {t('history.sets', { count: item.completedSets.length })}
                </Text>
              </View>
              <Pressable onPress={() => confirmDelete(item)} style={styles.delete}>
                <Ionicons name="trash-outline" size={20} color={theme.colorTextMuted} />
              </Pressable>
            </Pressable>
          )}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  empty: { fontFamily: fonts.body, fontSize: 14 },
  list: { paddingBottom: 24 },
  card: { flexDirection: 'row', alignItems: 'center', borderRadius: 18, padding: 14, marginBottom: 10 },
  cardBody: { flex: 1 },
  setName: { fontFamily: fonts.subtitle, fontSize: 15 },
  meta: { fontFamily: fonts.body, fontSize: 12, marginTop: 4 },
  delete: { padding: 8 },
});
