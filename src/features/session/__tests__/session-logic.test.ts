import type { CompletedSet, PlanExercise, WorkoutSession } from '../../../core/db/models';
import {
  completedCount,
  exerciseProgress,
  firstIncompleteIndex,
  formatPreviousSets,
  isSessionComplete,
  nextIncompleteIndex,
  parseLoadInput,
  parseRepsInput,
  previousPerformance,
  suggestedLoad,
  suggestedReps,
} from '../session-logic';

function exercise(id: string, sets = 2, order = 0): PlanExercise {
  return {
    catalogExerciseId: id,
    order,
    sets,
    reps: { mode: 'range', min: 8, max: 12 },
    targetLoad: { value: 40, unit: 'kg' },
    restSeconds: 90,
  };
}

function completedSet(id: string, setNumber: number, reps = 10, load: number | null = 40): CompletedSet {
  return {
    catalogExerciseId: id,
    setNumber,
    actualReps: reps,
    actualLoad: load === null ? null : { value: load, unit: 'kg' },
    completedAt: `2026-06-12T10:0${setNumber}:00.000Z`,
  };
}

function session(exercises: PlanExercise[], completedSets: CompletedSet[]): WorkoutSession {
  return {
    id: 'session-1',
    status: 'in_progress',
    startedAt: '2026-06-12T10:00:00.000Z',
    finishedAt: null,
    planId: 'p1',
    planName: 'Plano',
    workoutSetId: 'ws1',
    workoutSetName: 'Treino A',
    planSnapshot: { id: 'ws1', name: 'Treino A', order: 0, exercises },
    completedSets,
  };
}

describe('progression', () => {
  const exercises = [exercise('bench', 2, 0), exercise('row', 2, 1), exercise('squat', 1, 2)];

  test('fresh session starts at the first exercise', () => {
    const s = session(exercises, []);
    expect(firstIncompleteIndex(s)).toBe(0);
    expect(isSessionComplete(s)).toBe(false);
    expect(exerciseProgress(s)).toEqual({ done: 0, total: 3 });
  });

  test('an exercise completes when its prescribed sets are logged', () => {
    const s = session(exercises, [completedSet('bench', 1), completedSet('bench', 2)]);
    expect(completedCount(s, 'bench')).toBe(2);
    expect(firstIncompleteIndex(s)).toBe(1);
    expect(exerciseProgress(s)).toEqual({ done: 1, total: 3 });
  });

  test('session completes when every exercise is done', () => {
    const s = session(exercises, [
      completedSet('bench', 1),
      completedSet('bench', 2),
      completedSet('row', 1),
      completedSet('row', 2),
      completedSet('squat', 1),
    ]);
    expect(isSessionComplete(s)).toBe(true);
    expect(firstIncompleteIndex(s)).toBe(-1);
  });

  test('nextIncompleteIndex skips completed exercises and wraps around', () => {
    const s = session(exercises, [completedSet('row', 1), completedSet('row', 2)]);
    expect(nextIncompleteIndex(s, 0)).toBe(2);
    expect(nextIncompleteIndex(s, 2)).toBe(0);
  });
});

describe('previous performance', () => {
  test('returns sets from the most recent session containing the exercise', () => {
    const newer = { ...session([exercise('bench')], [completedSet('bench', 2, 9), completedSet('bench', 1, 11)]), id: 'new' };
    const older = { ...session([exercise('bench')], [completedSet('bench', 1, 8)]), id: 'old' };
    const result = previousPerformance([newer, older], 'bench');
    expect(result?.map((s) => [s.setNumber, s.actualReps])).toEqual([
      [1, 11],
      [2, 9],
    ]);
  });

  test('skips sessions that do not contain the exercise', () => {
    const noBench = session([exercise('row')], [completedSet('row', 1)]);
    const withBench = session([exercise('bench')], [completedSet('bench', 1, 12)]);
    expect(previousPerformance([noBench, withBench], 'bench')?.[0].actualReps).toBe(12);
  });

  test('returns null when no history exists', () => {
    expect(previousPerformance([], 'bench')).toBeNull();
  });
});

describe('suggestions', () => {
  const ex = exercise('bench');

  test('reps come from the matching previous set when available', () => {
    expect(suggestedReps(ex, [completedSet('bench', 1, 11)], 1)).toBe(11);
  });

  test('reps fall back to range min or fixed value', () => {
    expect(suggestedReps(ex, null, 1)).toBe(8);
    const fixed: PlanExercise = { ...ex, reps: { mode: 'fixed', value: 10 } };
    expect(suggestedReps(fixed, null, 2)).toBe(10);
  });

  test('load prefers the last previous load, then target', () => {
    const prev = [completedSet('bench', 1, 10, 42.5), completedSet('bench', 2, 10, null)];
    expect(suggestedLoad(ex, prev)).toEqual({ value: 42.5, unit: 'kg' });
    expect(suggestedLoad(ex, null)).toEqual({ value: 40, unit: 'kg' });
    const noTarget: PlanExercise = { ...ex, targetLoad: null };
    expect(suggestedLoad(noTarget, null)).toBeNull();
  });
});

describe('input parsing', () => {
  test('reps require a positive integer', () => {
    expect(parseRepsInput('10')).toBe(10);
    expect(parseRepsInput('0')).toBeNull();
    expect(parseRepsInput('')).toBeNull();
    expect(parseRepsInput('abc')).toBeNull();
  });

  test('load is optional, accepts comma decimals, rejects garbage', () => {
    expect(parseLoadInput('')).toEqual({ valid: true, load: null });
    expect(parseLoadInput('42,5')).toEqual({ valid: true, load: 42.5 });
    expect(parseLoadInput('40')).toEqual({ valid: true, load: 40 });
    expect(parseLoadInput('0')).toEqual({ valid: false, load: null });
    expect(parseLoadInput('40kg')).toEqual({ valid: false, load: null });
  });
});

describe('formatting', () => {
  test('formats previous sets with the last known load', () => {
    const prev = [completedSet('bench', 1, 10, 40), completedSet('bench', 2, 9, 42.5), completedSet('bench', 3, 8, null)];
    expect(formatPreviousSets(prev)).toBe('10 · 9 · 8 @ 42.5 kg');
  });

  test('formats reps only when no load was logged', () => {
    expect(formatPreviousSets([completedSet('bench', 1, 10, null)])).toBe('10');
  });
});
