import { useCallback, useState } from 'react';
import { Image, ImageBackground, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useNavigation, type CompositeNavigationProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { planRepository } from '../../core/db/plan.repository';
import { sessionRepository } from '../../core/db/session.repository';
import type { WorkoutPlan, WorkoutSession } from '../../core/db/models';
import { useSettings } from '../../core/settings/SettingsContext';
import { useTheme } from '../../core/theme/ThemeContext';
import { Screen } from '../../shared/components/Screen';
import { fonts } from '../../shared/theme/tokens';
import { useStartWorkout } from '../session/useStartWorkout';
import { formatSessionDate } from '../history/HistoryScreen';
import type { RootStackParamList, TabParamList } from '../../navigation/AppNavigator';

type DashboardNavigation = CompositeNavigationProp<
  BottomTabNavigationProp<TabParamList, 'Dashboard'>,
  NativeStackNavigationProp<RootStackParamList>
>;
import { GradientCard } from '../../shared/components/GradientCard';
import { hexToRgba } from '../progress/progress-logic';
import { dashboardStats, greetingKey, workoutSetCover } from './dashboard-logic';
import { articles } from './articles';

export function DashboardScreen() {
  const { t } = useTranslation();
  const { settings } = useSettings();
  const theme = useTheme();
  const navigation = useNavigation<DashboardNavigation>();
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

  const now = new Date();
  const lastWorkout = completed[0] ?? null;
  const stats = dashboardStats(completed, now);
  const greetingLabels = {
    morning: t('dashboard.greetingMorning'),
    afternoon: t('dashboard.greetingAfternoon'),
    evening: t('dashboard.greetingEvening'),
  };
  const greeting = greetingLabels[greetingKey(now)];
  const firstRun = !plan && !inProgress && completed.length === 0;
  const statTiles = [
    { key: 'week', value: stats.thisWeek, label: t('dashboard.statWeek'), icon: 'calendar-outline', accent: false },
    { key: 'streak', value: stats.streakWeeks, label: t('dashboard.statStreak'), icon: 'flame', accent: true },
    { key: 'total', value: stats.total, label: t('dashboard.statTotal'), icon: 'barbell-outline', accent: false },
    { key: 'sets', value: stats.totalSets, label: t('dashboard.statSets'), icon: 'repeat-outline', accent: false },
  ] as const;
  const shortcuts = [
    { key: 'start', label: t('dashboard.shortcutStart'), icon: 'play', accent: true, onPress: () => navigation.navigate('Plan') },
    { key: 'progress', label: t('tabs.progress'), icon: 'stats-chart', accent: false, onPress: () => navigation.navigate('Progress') },
    { key: 'history', label: t('tabs.history'), icon: 'time', accent: false, onPress: () => navigation.navigate('History') },
    { key: 'plan', label: t('tabs.plan'), icon: 'list', accent: false, onPress: () => navigation.navigate('PlanBuilder', plan ? { plan } : {}) },
  ] as const;

  return (
    <Screen title={t('dashboard.title')} padded={false}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <GradientCard
          colors={[theme.colorPrimaryDeep, theme.colorPrimary]}
          elevation="strong"
          radius={24}
          style={styles.hero}
        >
          <Text style={[styles.heroEyebrow, { color: theme.colorOnPrimary }]}>
            {t('app.name')}
          </Text>
          <Text style={[styles.heroStat, { color: theme.colorOnPrimary }]}>
            {greeting}
          </Text>
        </GradientCard>
        <View style={styles.shortcutRow}>
          {shortcuts.map((shortcut) => (
            <Pressable key={shortcut.key} onPress={shortcut.onPress} style={styles.shortcut}>
              <View
                style={[
                  styles.shortcutIcon,
                  {
                    backgroundColor: shortcut.accent ? theme.colorAccent : theme.colorPrimarySoft,
                    shadowColor: theme.colorShadow,
                  },
                ]}
              >
                <Ionicons
                  name={shortcut.icon}
                  size={24}
                  color={shortcut.accent ? theme.colorOnAccent : theme.colorPrimaryDeep}
                />
              </View>
              <Text style={[styles.shortcutLabel, { color: theme.colorTextMuted }]} numberOfLines={1}>
                {shortcut.label}
              </Text>
            </Pressable>
          ))}
        </View>
        {!firstRun ? (
          <View style={styles.statRow}>
            {statTiles.map((tile) => (
              <View
                key={tile.key}
                style={[styles.statTile, { backgroundColor: theme.colorSurfaceTint, shadowColor: theme.colorShadow }]}
              >
                <View
                  style={[
                    styles.statIcon,
                    { backgroundColor: hexToRgba(tile.accent ? theme.colorAccent : theme.colorPrimary, 0.16) },
                  ]}
                >
                  <Ionicons
                    name={tile.icon}
                    size={18}
                    color={tile.accent ? theme.colorAccentStrong : theme.colorPrimaryStrong}
                  />
                </View>
                <Text style={[styles.statValue, { color: theme.colorText }]}>{tile.value}</Text>
                <Text style={[styles.statLabel, { color: theme.colorTextMuted }]}>{tile.label}</Text>
              </View>
            ))}
          </View>
        ) : null}
        {firstRun ? (
          <View style={[styles.welcome, { backgroundColor: theme.colorPrimarySoft, shadowColor: theme.colorShadow }]}>
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
            style={[styles.card, { backgroundColor: theme.colorAccent, shadowColor: theme.colorShadow }]}
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
          <View style={[styles.card, { backgroundColor: theme.colorSurfaceTint, shadowColor: theme.colorShadow }]}>
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
            {plan.workoutSets.map((set) => {
              const cover = workoutSetCover(set);
              const body = (
                <View style={styles.quickStartBody}>
                  <View style={styles.quickStartText}>
                    <Text style={[styles.quickStartName, { color: theme.colorOnPrimary }]}>
                      {set.name}
                    </Text>
                    <Text style={[styles.quickStartMeta, { color: theme.colorOnPrimary }]}>
                      {t('planBuilder.exercisesCount', { count: set.exercises.length })}
                    </Text>
                  </View>
                  <Ionicons name="play-circle" size={40} color={theme.colorOnPrimary} />
                </View>
              );
              return cover ? (
                <Pressable
                  key={set.id}
                  onPress={() => void startWorkout(plan, set.id)}
                  style={[styles.quickStartCard, { shadowColor: theme.colorShadow }]}
                >
                  <ImageBackground source={cover} style={styles.quickStartImage} imageStyle={styles.quickStartImageRadius}>
                    <View style={styles.quickStartScrim}>{body}</View>
                  </ImageBackground>
                </Pressable>
              ) : (
                <GradientCard
                  key={set.id}
                  colors={[theme.colorPrimary, theme.colorPrimaryDeep]}
                  radius={18}
                  style={styles.quickStartCard}
                  onPress={() => void startWorkout(plan, set.id)}
                >
                  <View style={styles.quickStartPad}>{body}</View>
                </GradientCard>
              );
            })}
          </View>
        ) : null}

        {lastWorkout ? (
          <View>
            <Text style={[styles.section, { color: theme.colorText }]}>
              {t('dashboard.lastWorkout')}
            </Text>
            <Pressable
              onPress={() => navigation.navigate('SessionDetail', { sessionId: lastWorkout.id })}
              style={[styles.card, { backgroundColor: theme.colorSurfaceTint, shadowColor: theme.colorShadow }]}
            >
              <Text style={[styles.cardTitle, { color: theme.colorText }]}>
                {lastWorkout.workoutSetName}
              </Text>
              <Text style={[styles.meta, { color: theme.colorTextMuted }]}>
                {formatSessionDate(lastWorkout.startedAt, settings.language)} ·{' '}
                {t('history.sets', { count: lastWorkout.completedSets.length })}
              </Text>
            </Pressable>
          </View>
        ) : null}

        <Text style={[styles.section, { color: theme.colorText }]}>
          {t('dashboard.articlesTitle')}
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.articleScroll}
          contentContainerStyle={styles.articleRow}
        >
          {articles.map((article) => (
            <Pressable
              key={article.id}
              onPress={() => void Linking.openURL(article.url)}
              style={[styles.articleCard, { backgroundColor: theme.colorSurfaceTint, shadowColor: theme.colorShadow }]}
            >
              <Image source={article.image} style={styles.articleImage} resizeMode="cover" />
              <Text style={[styles.articleTitle, { color: theme.colorText }]} numberOfLines={2}>
                {t(article.titleKey)}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  welcome: {
    borderRadius: 24,
    padding: 20,
    marginBottom: 14,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 18,
    elevation: 6,
  },
  welcomeTitle: { fontFamily: fonts.title, fontSize: 19, marginBottom: 8 },
  welcomeMessage: { fontFamily: fonts.body, fontSize: 14, lineHeight: 20 },
  card: {
    borderRadius: 20,
    padding: 18,
    marginBottom: 14,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.16,
    shadowRadius: 14,
    elevation: 3,
  },
  cardTitle: { fontFamily: fonts.subtitle, fontSize: 15, marginBottom: 6 },
  meta: { fontFamily: fonts.body, fontSize: 12 },
  cta: { alignSelf: 'flex-start', borderRadius: 999, paddingHorizontal: 20, paddingVertical: 10, marginTop: 8 },
  ctaLabel: { fontFamily: fonts.label, fontSize: 14 },
  section: { fontFamily: fonts.subtitle, fontSize: 15, marginBottom: 10 },
  quickStartCard: {
    borderRadius: 18,
    overflow: 'hidden',
    marginBottom: 10,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 14,
    elevation: 4,
  },
  quickStartImage: { width: '100%', minHeight: 96, justifyContent: 'flex-end' },
  quickStartImageRadius: { borderRadius: 18 },
  quickStartScrim: { backgroundColor: 'rgba(35,35,35,0.55)', padding: 16 },
  quickStartPad: { padding: 16 },
  quickStartBody: { flexDirection: 'row', alignItems: 'center' },
  quickStartText: { flex: 1 },
  quickStartName: { fontFamily: fonts.subtitle, fontSize: 16 },
  quickStartMeta: { fontFamily: fonts.body, fontSize: 12, marginTop: 2 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 4, paddingBottom: 28 },
  shortcutRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  shortcut: { alignItems: 'center', flex: 1 },
  shortcutIcon: {
    width: 56,
    height: 56,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 4,
  },
  shortcutLabel: { fontFamily: fonts.label, fontSize: 12 },
  statRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 14 },
  statTile: {
    flexGrow: 1,
    flexBasis: '47%',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 14,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.16,
    shadowRadius: 14,
    elevation: 3,
  },
  statIcon: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  statValue: { fontFamily: fonts.title, fontSize: 26 },
  statLabel: { fontFamily: fonts.body, fontSize: 12, marginTop: 2 },
  hero: { padding: 22 },
  heroEyebrow: { fontFamily: fonts.label, fontSize: 13, opacity: 0.85, marginBottom: 6 },
  heroStat: { fontFamily: fonts.title, fontSize: 20 },
  articleScroll: { marginHorizontal: -20 },
  articleRow: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 24, gap: 14 },
  articleCard: {
    width: 220,
    borderRadius: 18,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.16,
    shadowRadius: 14,
    elevation: 3,
  },
  articleImage: { width: '100%', height: 120, borderTopLeftRadius: 18, borderTopRightRadius: 18 },
  articleTitle: { fontFamily: fonts.bodyStrong, fontSize: 14, lineHeight: 19, padding: 12 },
});
