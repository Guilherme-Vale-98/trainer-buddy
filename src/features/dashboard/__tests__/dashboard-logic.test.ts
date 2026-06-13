import type { ImageSourcePropType } from 'react-native';
import type { WorkoutSession, WorkoutSet } from '../../../core/db/models';

jest.mock('../../../content/media-map', () => ({
  getExerciseImages: (id: string): ImageSourcePropType[] =>
    id === 'has-photo' ? [{ uri: 'first' }, { uri: 'second' }] : [],
}));

import { dashboardStats, greetingKey, workoutSetCover } from '../dashboard-logic';

function exercise(catalogExerciseId: string, order: number) {
  return {
    catalogExerciseId,
    order,
    sets: 3,
    reps: { mode: 'fixed', value: 10 } as const,
    targetLoad: null,
    restSeconds: 90,
  };
}

function set(exercises: WorkoutSet['exercises']): WorkoutSet {
  return { id: 'ws1', name: 'Treino A', order: 0, exercises };
}

describe('workoutSetCover', () => {
  test('returns the first image of the first photo-bearing exercise by order', () => {
    const ws = set([exercise('no-photo', 1), exercise('has-photo', 0)]);
    expect(workoutSetCover(ws)).toEqual({ uri: 'first' });
  });

  test('skips exercises without media', () => {
    const ws = set([exercise('no-photo', 0), exercise('has-photo', 1)]);
    expect(workoutSetCover(ws)).toEqual({ uri: 'first' });
  });

  test('returns null when no exercise has media', () => {
    expect(workoutSetCover(set([exercise('no-photo', 0)]))).toBeNull();
  });

  test('returns null for an empty set', () => {
    expect(workoutSetCover(set([]))).toBeNull();
  });
});

function sess(startedAt: string, setCount: number): WorkoutSession {
  return {
    id: startedAt,
    status: 'completed',
    startedAt,
    finishedAt: startedAt,
    planId: 'p1',
    planName: 'P',
    workoutSetId: 'ws1',
    workoutSetName: 'A',
    planSnapshot: { id: 'ws1', name: 'A', order: 0, exercises: [] },
    completedSets: Array.from({ length: setCount }, (_, i) => ({
      catalogExerciseId: 'x',
      setNumber: i + 1,
      actualReps: 10,
      actualLoad: null,
      completedAt: startedAt,
    })),
  };
}

describe('dashboardStats', () => {
  const now = new Date('2026-06-13T12:00:00');

  test('counts this week, totals, and the current streak', () => {
    const stats = dashboardStats(
      [sess('2026-06-10T12:00:00', 3), sess('2026-06-11T12:00:00', 2), sess('2026-06-03T12:00:00', 4)],
      now,
    );
    expect(stats).toEqual({ thisWeek: 2, total: 3, totalSets: 9, streakWeeks: 2 });
  });

  test('streak has a grace week when the current week has no workout yet', () => {
    const stats = dashboardStats([sess('2026-06-03T12:00:00', 1), sess('2026-05-27T12:00:00', 1)], now);
    expect(stats.thisWeek).toBe(0);
    expect(stats.streakWeeks).toBe(2);
  });

  test('streak breaks on a skipped week', () => {
    const stats = dashboardStats([sess('2026-06-10T12:00:00', 1), sess('2026-05-27T12:00:00', 1)], now);
    expect(stats.streakWeeks).toBe(1);
  });

  test('returns all zeros with no sessions', () => {
    expect(dashboardStats([], now)).toEqual({ thisWeek: 0, total: 0, totalSets: 0, streakWeeks: 0 });
  });
});

describe('greetingKey', () => {
  test('splits the day into morning, afternoon, and evening', () => {
    expect(greetingKey(new Date('2026-06-13T08:00:00'))).toBe('morning');
    expect(greetingKey(new Date('2026-06-13T12:00:00'))).toBe('afternoon');
    expect(greetingKey(new Date('2026-06-13T17:59:00'))).toBe('afternoon');
    expect(greetingKey(new Date('2026-06-13T18:00:00'))).toBe('evening');
    expect(greetingKey(new Date('2026-06-13T23:30:00'))).toBe('evening');
  });
});
