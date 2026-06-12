import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { getExercise, getExerciseName } from '../../core/catalog/catalog';
import { sessionRepository } from '../../core/db/session.repository';
import type { WorkoutSession } from '../../core/db/models';
import { useSettings } from '../../core/settings/SettingsContext';
import { useTheme } from '../../core/theme/ThemeContext';
import { formatReps } from '../../shared/format';
import { fonts } from '../../shared/theme/tokens';
import type { RootStackParamList } from '../../navigation/AppNavigator';
import { formatSessionDate } from './HistoryScreen';

type Props = NativeStackScreenProps<RootStackParamList, 'SessionDetail'>;

export function SessionDetailScreen({ navigation, route }: Props) {
  const { t } = useTranslation();
  const { settings } = useSettings();
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  const [session, setSession] = useState<WorkoutSession | null>(null);

  useEffect(() => {
    let active = true;
    sessionRepository.getSession(route.params.sessionId).then((loaded) => {
      if (!active) return;
      if (!loaded) {
        navigation.goBack();
        return;
      }
      setSession(loaded);
    });
    return () => {
      active = false;
    };
  }, [route.params.sessionId, navigation]);

  useEffect(() => {
    if (session) navigation.setOptions({ headerTitle: session.workoutSetName });
  }, [session, navigation]);

  if (!session) return null;

  return (
    <ScrollView
      style={{ backgroundColor: theme.colorBg }}
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
      showsVerticalScrollIndicator={false}
    >
      <Text style={[styles.date, { color: theme.colorTextMuted }]}>
        {formatSessionDate(session.startedAt, settings.language)}
      </Text>
      {session.planSnapshot.exercises.map((planExercise) => {
        const catalogExercise = getExercise(planExercise.catalogExerciseId);
        const logged = session.completedSets
          .filter((set) => set.catalogExerciseId === planExercise.catalogExerciseId)
          .sort((a, b) => a.setNumber - b.setNumber);
        return (
          <View
            key={planExercise.catalogExerciseId}
            style={[styles.card, { backgroundColor: theme.colorSurfaceTint }]}
          >
            <Text style={[styles.exerciseName, { color: theme.colorText }]}>
              {catalogExercise
                ? getExerciseName(catalogExercise, settings.language)
                : planExercise.catalogExerciseId}
            </Text>
            <Text style={[styles.target, { color: theme.colorTextMuted }]}>
              {t('history.target')}: {formatReps(planExercise)}
              {planExercise.targetLoad
                ? ` · ${planExercise.targetLoad.value} ${planExercise.targetLoad.unit}`
                : ''}
            </Text>
            {logged.map((set) => (
              <View key={set.setNumber} style={styles.setRow}>
                <Text style={[styles.setNumber, { color: theme.colorPrimaryStrong }]}>
                  {set.setNumber}
                </Text>
                <Text style={[styles.setText, { color: theme.colorText }]}>
                  {set.actualReps} {t('session.reps').toLowerCase()}
                  {set.actualLoad ? ` · ${set.actualLoad.value} ${set.actualLoad.unit}` : ''}
                </Text>
              </View>
            ))}
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 20, paddingTop: 8 },
  date: { fontFamily: fonts.body, fontSize: 13, marginBottom: 12 },
  card: { borderRadius: 18, padding: 14, marginBottom: 12 },
  exerciseName: { fontFamily: fonts.subtitle, fontSize: 15 },
  target: { fontFamily: fonts.body, fontSize: 12, marginTop: 2, marginBottom: 8 },
  setRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4 },
  setNumber: { fontFamily: fonts.subtitle, fontSize: 13, width: 18 },
  setText: { fontFamily: fonts.body, fontSize: 14 },
});
