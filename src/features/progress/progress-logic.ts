import type { WorkoutSession } from '../../core/db/models';
import type { LoadUnit } from '../../core/settings/SettingsContext';

const KG_PER_LB = 0.45359237;

export function convertLoad(value: number, from: LoadUnit, to: LoadUnit): number {
  if (from === to) return value;
  return from === 'kg' ? value / KG_PER_LB : value * KG_PER_LB;
}

export interface SeriesPoint {
  date: Date;
  value: number;
}

function chronological(sessions: WorkoutSession[]): WorkoutSession[] {
  return [...sessions].sort((a, b) => a.startedAt.localeCompare(b.startedAt));
}

export function exercisesWithHistory(sessions: WorkoutSession[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const session of chronological(sessions)) {
    for (const set of session.completedSets) {
      if (!seen.has(set.catalogExerciseId)) {
        seen.add(set.catalogExerciseId);
        result.push(set.catalogExerciseId);
      }
    }
  }
  return result;
}

export function mean(values: number[]): number {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function loadProgressionSeries(
  sessions: WorkoutSession[],
  catalogExerciseId: string,
  unit: LoadUnit,
): SeriesPoint[] {
  const points: SeriesPoint[] = [];
  for (const session of chronological(sessions)) {
    const loads = session.completedSets
      .filter((set) => set.catalogExerciseId === catalogExerciseId && set.actualLoad)
      .map((set) => convertLoad(set.actualLoad!.value, set.actualLoad!.unit, unit));
    if (loads.length > 0) {
      points.push({ date: new Date(session.startedAt), value: mean(loads) });
    }
  }
  return points;
}

export function startOfWeek(date: Date): Date {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  const daysSinceMonday = (result.getDay() + 6) % 7;
  result.setDate(result.getDate() - daysSinceMonday);
  return result;
}

export function weeklyConsistency(
  sessions: WorkoutSession[],
  weeks: number,
  now: Date,
): SeriesPoint[] {
  const currentWeekStart = startOfWeek(now);
  const points: SeriesPoint[] = [];
  for (let i = weeks - 1; i >= 0; i -= 1) {
    const weekStart = new Date(currentWeekStart);
    weekStart.setDate(weekStart.getDate() - i * 7);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);
    const count = sessions.filter((session) => {
      const started = new Date(session.startedAt);
      return started >= weekStart && started < weekEnd;
    }).length;
    points.push({ date: weekStart, value: count });
  }
  return points;
}

export function thinLabels(labels: string[], maxLabels: number): string[] {
  if (labels.length <= maxLabels) return labels;
  const step = Math.ceil(labels.length / maxLabels);
  const lastIndex = labels.length - 1;
  return labels.map((label, index) => ((lastIndex - index) % step === 0 ? label : ''));
}

export function hexToRgba(hex: string, opacity: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}
