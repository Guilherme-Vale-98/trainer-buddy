import type { CompletedSet, WorkoutSession } from '../../../core/db/models';
import {
  convertLoad,
  exercisesWithHistory,
  hexToRgba,
  maxLoadSeries,
  startOfWeek,
  volumeSeries,
  weeklyConsistency,
} from '../progress-logic';

function completedSet(id: string, reps: number, load: number | null, unit: 'kg' | 'lb' = 'kg'): CompletedSet {
  return {
    catalogExerciseId: id,
    setNumber: 1,
    actualReps: reps,
    actualLoad: load === null ? null : { value: load, unit },
    completedAt: '2026-06-12T10:00:00.000Z',
  };
}

function session(id: string, startedAt: string, sets: CompletedSet[]): WorkoutSession {
  return {
    id,
    status: 'completed',
    startedAt,
    finishedAt: startedAt,
    planId: 'p1',
    planName: 'Plano',
    workoutSetId: 'ws1',
    workoutSetName: 'Treino A',
    planSnapshot: { id: 'ws1', name: 'Treino A', order: 0, exercises: [] },
    completedSets: sets,
  };
}

describe('unit conversion', () => {
  test('same unit is identity', () => {
    expect(convertLoad(40, 'kg', 'kg')).toBe(40);
  });

  test('kg to lb and back', () => {
    expect(convertLoad(45.359237, 'kg', 'lb')).toBeCloseTo(100, 5);
    expect(convertLoad(100, 'lb', 'kg')).toBeCloseTo(45.359237, 5);
  });
});

describe('max load series', () => {
  const newer = session('s2', '2026-06-10T10:00:00.000Z', [
    completedSet('bench', 10, 45),
    completedSet('bench', 8, 50),
  ]);
  const older = session('s1', '2026-06-01T10:00:00.000Z', [completedSet('bench', 10, 40)]);
  const noLoad = session('s3', '2026-06-11T10:00:00.000Z', [completedSet('bench', 12, null)]);

  test('takes the max load per session in chronological order', () => {
    const series = maxLoadSeries([newer, older], 'bench', 'kg');
    expect(series.map((p) => p.value)).toEqual([40, 50]);
    expect(series[0].date.toISOString()).toBe('2026-06-01T10:00:00.000Z');
  });

  test('skips sessions without a logged load for the exercise', () => {
    const series = maxLoadSeries([noLoad, newer, older], 'bench', 'kg');
    expect(series.map((p) => p.value)).toEqual([40, 50]);
  });

  test('converts to the requested unit', () => {
    const lbSession = session('s4', '2026-06-12T10:00:00.000Z', [completedSet('bench', 10, 100, 'lb')]);
    const series = maxLoadSeries([lbSession], 'bench', 'kg');
    expect(series[0].value).toBeCloseTo(45.36, 2);
  });
});

describe('volume series', () => {
  test('sums reps x load per session, ignoring loadless sets', () => {
    const s = session('s1', '2026-06-10T10:00:00.000Z', [
      completedSet('bench', 10, 40),
      completedSet('bench', 8, 40),
      completedSet('plank', 1, null),
    ]);
    const series = volumeSeries([s], 'kg');
    expect(series[0].value).toBe(10 * 40 + 8 * 40);
  });
});

describe('weekly consistency', () => {
  const now = new Date('2026-06-12T15:00:00.000Z');

  test('startOfWeek returns the Monday at midnight', () => {
    const monday = startOfWeek(new Date('2026-06-12T15:00:00.000Z'));
    expect(monday.getDay()).toBe(1);
    expect(monday.getHours()).toBe(0);
  });

  test('counts sessions per week over the window', () => {
    const sessions = [
      session('s1', '2026-06-09T10:00:00.000Z', []),
      session('s2', '2026-06-11T10:00:00.000Z', []),
      session('s3', '2026-06-02T10:00:00.000Z', []),
      session('s4', '2026-05-01T10:00:00.000Z', []),
    ];
    const points = weeklyConsistency(sessions, 3, now);
    expect(points).toHaveLength(3);
    expect(points.map((p) => p.value)).toEqual([0, 1, 2]);
  });
});

describe('history helpers', () => {
  test('exercisesWithHistory lists ids in first-seen chronological order', () => {
    const sessions = [
      session('s2', '2026-06-10T10:00:00.000Z', [completedSet('row', 10, 30), completedSet('bench', 10, 40)]),
      session('s1', '2026-06-01T10:00:00.000Z', [completedSet('bench', 10, 40)]),
    ];
    expect(exercisesWithHistory(sessions)).toEqual(['bench', 'row']);
  });
});

describe('hexToRgba', () => {
  test('converts hex tokens to rgba strings', () => {
    expect(hexToRgba('#896CFE', 0.5)).toBe('rgba(137, 108, 254, 0.5)');
  });
});
