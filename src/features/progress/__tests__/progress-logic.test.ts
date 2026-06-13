import type { CompletedSet, WorkoutSession } from '../../../core/db/models';
import {
  convertLoad,
  exercisesWithHistory,
  hexToRgba,
  loadProgressionSeries,
  mean,
  startOfWeek,
  thinLabels,
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

describe('mean', () => {
  test('averages the values', () => {
    expect(mean([40, 45, 50])).toBe(45);
    expect(mean([40, 50])).toBe(45);
  });

  test('single value is its own mean', () => {
    expect(mean([40])).toBe(40);
  });
});

describe('load progression series (mean per session)', () => {
  const newer = session('s2', '2026-06-10T10:00:00.000Z', [
    completedSet('bench', 10, 40),
    completedSet('bench', 8, 45),
    completedSet('bench', 6, 50),
  ]);
  const older = session('s1', '2026-06-01T10:00:00.000Z', [completedSet('bench', 10, 40)]);
  const noLoad = session('s3', '2026-06-11T10:00:00.000Z', [completedSet('bench', 12, null)]);

  test('takes the mean load per session in chronological order', () => {
    const series = loadProgressionSeries([newer, older], 'bench', 'kg');
    expect(series.map((p) => p.value)).toEqual([40, 45]);
    expect(series[0].date.toISOString()).toBe('2026-06-01T10:00:00.000Z');
  });

  test('averages across the session sets', () => {
    const mixed = session('s5', '2026-06-13T10:00:00.000Z', [
      completedSet('bench', 10, 40),
      completedSet('bench', 10, 40),
      completedSet('bench', 1, 100),
    ]);
    const series = loadProgressionSeries([mixed], 'bench', 'kg');
    expect(series[0].value).toBe(60);
  });

  test('skips sessions without a logged load for the exercise', () => {
    const series = loadProgressionSeries([noLoad, newer, older], 'bench', 'kg');
    expect(series.map((p) => p.value)).toEqual([40, 45]);
  });

  test('converts to the requested unit', () => {
    const lbSession = session('s4', '2026-06-12T10:00:00.000Z', [completedSet('bench', 10, 100, 'lb')]);
    const series = loadProgressionSeries([lbSession], 'bench', 'kg');
    expect(series[0].value).toBeCloseTo(45.36, 2);
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

describe('thinLabels', () => {
  test('keeps all labels when within the limit', () => {
    expect(thinLabels(['a', 'b', 'c'], 4)).toEqual(['a', 'b', 'c']);
  });

  test('thins evenly and always keeps the most recent (last) label', () => {
    const result = thinLabels(['1', '2', '3', '4', '5', '6', '7', '8'], 4);
    expect(result).toEqual(['', '2', '', '4', '', '6', '', '8']);
    expect(result[result.length - 1]).toBe('8');
  });

  test('non-empty count does not exceed the limit', () => {
    const result = thinLabels(Array.from({ length: 8 }, (_, i) => String(i)), 4);
    expect(result.filter((l) => l !== '')).toHaveLength(4);
  });
});

describe('hexToRgba', () => {
  test('converts hex tokens to rgba strings', () => {
    expect(hexToRgba('#896CFE', 0.5)).toBe('rgba(137, 108, 254, 0.5)');
  });
});
