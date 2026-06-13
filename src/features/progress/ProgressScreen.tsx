import { useCallback, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { LineChart } from 'react-native-chart-kit';
import { useTranslation } from 'react-i18next';
import { getExercise, getExerciseName } from '../../core/catalog/catalog';
import { sessionRepository } from '../../core/db/session.repository';
import type { WorkoutSession } from '../../core/db/models';
import { useSettings } from '../../core/settings/SettingsContext';
import { useTheme } from '../../core/theme/ThemeContext';
import { Screen } from '../../shared/components/Screen';
import { PillSelector } from '../../shared/components/PillSelector';
import { fonts } from '../../shared/theme/tokens';
import { WeeklyBarChart } from './WeeklyBarChart';
import {
  exercisesWithHistory,
  hexToRgba,
  loadProgressionSeries,
  thinLabels,
  weeklyConsistency,
  type SeriesPoint,
} from './progress-logic';

const MAX_POINTS = 8;
const MAX_LABELS = 4;

function shortDate(date: Date, language: 'pt' | 'en'): string {
  return date.toLocaleDateString(language === 'pt' ? 'pt-BR' : 'en-US', {
    day: '2-digit',
    month: '2-digit',
  });
}

function toChartData(points: SeriesPoint[], language: 'pt' | 'en') {
  const visible = points.slice(-MAX_POINTS);
  return {
    labels: thinLabels(
      visible.map((p) => shortDate(p.date, language)),
      MAX_LABELS,
    ),
    datasets: [{ data: visible.map((p) => Math.round(p.value * 10) / 10) }],
  };
}

export function ProgressScreen() {
  const { t } = useTranslation();
  const { settings } = useSettings();
  const theme = useTheme();
  const { width } = useWindowDimensions();

  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [selectedExercise, setSelectedExercise] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      sessionRepository.getCompletedSessions().then((loaded) => {
        if (active) setSessions(loaded);
      });
      return () => {
        active = false;
      };
    }, []),
  );

  const exerciseIds = useMemo(() => exercisesWithHistory(sessions), [sessions]);
  const exerciseId = selectedExercise ?? exerciseIds[0] ?? null;

  const loadPoints = useMemo(
    () => (exerciseId ? loadProgressionSeries(sessions, exerciseId, settings.unit) : []),
    [sessions, exerciseId, settings.unit],
  );
  const consistencyPoints = useMemo(() => weeklyConsistency(sessions, 8, new Date()), [sessions]);

  const chartWidth = width - 40 - 28;
  const chartConfig = {
    backgroundGradientFrom: theme.colorSurfaceTint,
    backgroundGradientTo: theme.colorSurfaceTint,
    decimalPlaces: 0,
    color: (opacity = 1) => hexToRgba(theme.colorPrimary, opacity),
    labelColor: (opacity = 1) => hexToRgba(theme.colorText, Math.min(opacity, 0.7)),
    propsForBackgroundLines: { strokeDasharray: '', stroke: hexToRgba(theme.colorText, 0.08) },
    barPercentage: 0.6,
  };
  const chartStyle = { borderRadius: 12, paddingRight: 38 };

  if (sessions.length === 0) {
    return (
      <Screen title={t('progress.title')}>
        <Text style={[styles.empty, { color: theme.colorTextMuted }]}>{t('progress.empty')}</Text>
      </Screen>
    );
  }

  return (
    <Screen title={t('progress.title')} padded={false}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <Text style={[styles.section, { color: theme.colorText }]}>
          {t('progress.loadChart')} ({settings.unit})
        </Text>
        <PillSelector
          options={exerciseIds.map((id) => {
            const exercise = getExercise(id);
            return {
              value: id,
              label: exercise ? getExerciseName(exercise, settings.language) : id,
            };
          })}
          selected={exerciseId ?? ''}
          onSelect={setSelectedExercise}
        />
        {loadPoints.length >= 2 ? (
          <View style={[styles.chartCard, { backgroundColor: theme.colorSurfaceTint, shadowColor: theme.colorShadow }]}>
            <LineChart
              data={toChartData(loadPoints, settings.language)}
              width={chartWidth}
              height={200}
              chartConfig={chartConfig}
              segments={4}
              withVerticalLines={false}
              bezier
              fromZero
              style={chartStyle}
            />
          </View>
        ) : (
          <Text style={[styles.empty, { color: theme.colorTextMuted }]}>
            {t('progress.needMore')}
          </Text>
        )}

        <Text style={[styles.section, { color: theme.colorText }]}>
          {t('progress.consistencyChart')}
        </Text>
        <View style={[styles.chartCard, { backgroundColor: theme.colorSurfaceTint, shadowColor: theme.colorShadow }]}>
          <WeeklyBarChart
            data={consistencyPoints.map((p) => p.value)}
            labels={toChartData(consistencyPoints, settings.language).labels}
            width={chartWidth}
            barColor={theme.colorAccentStrong}
            gridColor={hexToRgba(theme.colorText, 0.12)}
            labelColor={hexToRgba(theme.colorText, 0.7)}
          />
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: 20, paddingTop: 4, paddingBottom: 32 },
  empty: { fontFamily: fonts.body, fontSize: 14, marginTop: 8 },
  section: { fontFamily: fonts.subtitle, fontSize: 15, marginTop: 16, marginBottom: 10 },
  chartCard: {
    borderRadius: 18,
    padding: 14,
    marginTop: 10,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.16,
    shadowRadius: 14,
    elevation: 3,
  },
});
