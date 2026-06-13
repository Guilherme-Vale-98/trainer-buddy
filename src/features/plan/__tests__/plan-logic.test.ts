import type { PlanExercise } from '../../../core/db/models';
import { workoutSetMuscleGroups } from '../plan-logic';

function exercise(catalogExerciseId: string): PlanExercise {
  return {
    catalogExerciseId,
    order: 0,
    sets: 3,
    reps: { mode: 'fixed', value: 10 },
    targetLoad: null,
    restSeconds: 90,
  };
}

const groups: Record<string, string> = {
  curl: 'biceps',
  pushdown: 'triceps',
  plank: 'core',
  'hammer-curl': 'biceps',
};

const resolve = (id: string): string | undefined => groups[id];

describe('workoutSetMuscleGroups', () => {
  test('returns the distinct groups in first-appearance order', () => {
    const result = workoutSetMuscleGroups(
      [exercise('curl'), exercise('pushdown'), exercise('plank')],
      resolve,
    );
    expect(result).toEqual(['biceps', 'triceps', 'core']);
  });

  test('deduplicates a group that appears more than once', () => {
    const result = workoutSetMuscleGroups(
      [exercise('curl'), exercise('hammer-curl'), exercise('pushdown')],
      resolve,
    );
    expect(result).toEqual(['biceps', 'triceps']);
  });

  test('skips exercises whose group cannot be resolved', () => {
    const result = workoutSetMuscleGroups(
      [exercise('curl'), exercise('unknown'), exercise('plank')],
      resolve,
    );
    expect(result).toEqual(['biceps', 'core']);
  });

  test('returns an empty array for a set with no exercises', () => {
    expect(workoutSetMuscleGroups([], resolve)).toEqual([]);
  });
});
