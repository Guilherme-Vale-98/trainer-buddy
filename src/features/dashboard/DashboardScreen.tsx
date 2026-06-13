import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { planRepository } from '../../core/db/plan.repository';
import { sessionRepository } from '../../core/db/session.repository';
import type { WorkoutPlan, WorkoutSession } from '../../core/db/models';
import { useSettings } from '../../core/settings/SettingsContext';
import { useTheme } from '../../core/theme/ThemeContext';
import { Screen } from '../../shared/components/Screen';
import { fonts } from '../../shared/theme/tokens';
import { weeklyConsistency } from '../progress/progress-logic';
import { useStartWorkout } from '../session/useStartWorkout';
import { formatSessionDate } from '../history/HistoryScreen';
import type { RootStackParamList } from '../../navigation/AppNavigator';

export function DashboardScreen() {
  const { t } = useTranslation();
  const { settings } = useSettings();
  const theme = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const startWorkout = useStartWorkout();

  const [plan, setPlan] = useState<WorkoutPlan | null>(null);
  const [inProgress, setInProgress] = useState<WorkoutSession | null>(null);
  const [completed, setCompleted] = useState<WorkoutSession[]>([]);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      Promise.all([
        planRepository.getActivePlan(),
        sessionRepository.getInProgressSession(),
        sessionRepository.getCompletedSessions(),
      ]).then(([loadedPlan, loadedSession, loadedCompleted]) => {
        if (!active) return;
        setPlan(loadedPlan);
        setInProgress(loadedSession);
        setCompleted(loadedCompleted);
      });
      return () => {
        active = false;
      };
    }, []),
  );

  const lastWorkout = completed[0] ?? null;
  const thisWeek = weeklyConsistency(completed, 1, new Date())[0]?.value ?? 0;
  const firstRun = !plan && !inProgress && completed.length === 0;

  return (
    <Screen title={t('dashboard.title')}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {firstRun ? (
          <View style={[styles.welcome, { backgroundColor: theme.colorPrimarySoft }]}>
            <Text style={[styles.welcomeTitle, { color: theme.colorOnAccent }]}>
              {t('dashboard.welcomeTitle')}
            </Text>
            <Text style={[styles.welcomeMessage, { color: theme.colorOnAccent }]}>
              {t('dashboard.welcomeMessage')}
            </Text>
            <Pressable
              onPress={() => navigation.navigate('PlanBuilder', {})}
              style={[styles.cta, { backgroundColor: theme.colorPrimary }]}
            >
              <Text style={[styles.ctaLabel, { color: theme.colorOnPrimary }]}>
                {t('dashboard.createPlan')}
              </Text>
            </Pressable>
          </View>
        ) : null}
        {inProgress ? (
          <Pressable
            onPress={() => navigation.navigate('Session', { sessionId: inProgress.id })}
            style={[styles.card, { backgroundColor: theme.colorAccent }]}
          >
            <Text style={[styles.cardTitle, { color: theme.colorOnAccent }]}>
              {t('session.inProgressTitle')} — {inProgress.workoutSetName}
            </Text>
            <View style={[styles.cta, { backgroundColor: theme.colorPrimary }]}>
              <Text style={[styles.ctaLabel, { color: theme.colorOnPrimary }]}>
                {t('session.resume')}
              </Text>
            </View>
          </Pressable>
        ) : null}

        {!firstRun ? (
          <View style={[styles.card, { backgroundColor: theme.colorSurfaceTint }]}>
            <Text style={[styles.cardTitle, { color: theme.colorText }]}>
              {plan ? plan.name : t('dashboard.noPlan')}
            </Text>
            <Pressable
              onPress={() => navigation.navigate('PlanBuilder', plan ? { plan } : {})}
              style={[styles.cta, { backgroundColor: theme.colorPrimary }]}
            >
              <Text style={[styles.ctaLabel, { color: theme.colorOnPrimary }]}>
                {plan ? t('plan.edit') : t('dashboard.createPlan')}
              </Text>
            </Pressable>
          </View>
        ) : null}

        {plan && !inProgress ? (
          <View>
            <Text style={[styles.section, { color: theme.colorText }]}>
              {t('dashboard.quickStart')}
            </Text>
            {plan.workoutSets.map((set) => (
              <Pressable
                key={set.id}
                onPress={() => void startWorkout(plan, set.id)}
                style={[styles.quickStart, { backgroundColor: theme.colorPrimarySoft }]}
              >
                <View style={styles.quickStartBody}>
                  <Text style={[styles.quickStartName, { color: theme.colorOnAccent }]}>
                    {set.name}
                  </Text>
                  <Text style={[styles.quickStartMeta, { color: theme.colorOnAccent }]}>
                    {t('planBuilder.exercisesCount', { count: set.exercises.length })}
                  </Text>
                </View>
                <Ionicons name="play-circle" size={34} color={theme.colorPrimaryDeep} />
              </Pressable>
            ))}
          </View>
        ) : null}

        {lastWorkout ? (
          <View>
            <Text style={[styles.section, { color: theme.colorText }]}>
              {t('dashboard.lastWorkout')}
            </Text>
            <Pressable
              onPress={() => navigation.navigate('SessionDetail', { sessionId: lastWorkout.id })}
              style={[styles.card, { backgroundColor: theme.colorSurfaceTint }]}
            >
              <Text style={[styles.cardTitle, { color: theme.colorText }]}>
                {lastWorkout.workoutSetName}
              </Text>
              <Text style={[styles.meta, { color: theme.colorTextMuted }]}>
                {formatSessionDate(lastWorkout.startedAt, settings.language)} ·{' '}
                {t('history.sets', { count: lastWorkout.completedSets.length })}
              </Text>
            </Pressable>
            <Text style={[styles.weekSummary, { color: theme.colorTextMuted }]}>
              {t('dashboard.weekSummary', { week: thisWeek, total: completed.length })}
            </Text>
          </View>
        ) : null}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  welcome: { borderRadius: 24, padding: 20, marginBottom: 14 },
  welcomeTitle: { fontFamily: fonts.title, fontSize: 19, marginBottom: 8 },
  welcomeMessage: { fontFamily: fonts.body, fontSize: 14, lineHeight: 20 },
  card: { borderRadius: 20, padding: 18, marginBottom: 14 },
  cardTitle: { fontFamily: fonts.subtitle, fontSize: 15, marginBottom: 6 },
  meta: { fontFamily: fonts.body, fontSize: 12 },
  cta: { alignSelf: 'flex-start', borderRadius: 999, paddingHorizontal: 20, paddingVertical: 10, marginTop: 8 },
  ctaLabel: { fontFamily: fonts.label, fontSize: 14 },
  section: { fontFamily: fonts.subtitle, fontSize: 15, marginBottom: 10 },
  quickStart: { flexDirection: 'row', alignItems: 'center', borderRadius: 18, padding: 14, marginBottom: 10 },
  quickStartBody: { flex: 1 },
  quickStartName: { fontFamily: fonts.subtitle, fontSize: 15 },
  quickStartMeta: { fontFamily: fonts.body, fontSize: 12, marginTop: 2 },
  weekSummary: { fontFamily: fonts.body, fontSize: 13, marginTop: 4, marginBottom: 24 },
});
