import type { ImageSourcePropType } from 'react-native';
import type { WorkoutSession, WorkoutSet } from '../../core/db/models';
import { getExerciseImages } from '../../content/media-map';
import { startOfWeek } from '../progress/progress-logic';

export function workoutSetCover(set: WorkoutSet): ImageSourcePropType | null {
  const ordered = [...set.exercises].sort((a, b) => a.order - b.order);
  for (const exercise of ordered) {
    const images = getExerciseImages(exercise.catalogExerciseId);
    if (images.length > 0) return images[0];
  }
  return null;
}

export interface DashboardStats {
  thisWeek: number;
  total: number;
  totalSets: number;
  streakWeeks: number;
}

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export function dashboardStats(sessions: WorkoutSession[], now: Date): DashboardStats {
  const currentWeekStart = startOfWeek(now).getTime();
  const activeOffsets = new Set<number>();
  let thisWeek = 0;
  let totalSets = 0;
  for (const session of sessions) {
    totalSets += session.completedSets.length;
    const sessionWeekStart = startOfWeek(new Date(session.startedAt)).getTime();
    const offset = Math.round((currentWeekStart - sessionWeekStart) / WEEK_MS);
    if (offset >= 0) {
      activeOffsets.add(offset);
      if (offset === 0) thisWeek += 1;
    }
  }
  let streakWeeks = 0;
  let cursor = activeOffsets.has(0) ? 0 : activeOffsets.has(1) ? 1 : -1;
  while (cursor >= 0 && activeOffsets.has(cursor)) {
    streakWeeks += 1;
    cursor += 1;
  }
  return { thisWeek, total: sessions.length, totalSets, streakWeeks };
}

export function greetingKey(now: Date): 'morning' | 'afternoon' | 'evening' {
  const hour = now.getHours();
  if (hour < 12) return 'morning';
  if (hour < 18) return 'afternoon';
  return 'evening';
}
