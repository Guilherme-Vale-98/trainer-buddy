import {
  createEmptyDraft,
  defaultDraftExercise,
  draftFromPlan,
  draftToPlanInput,
  exerciseErrorKey,
  nextDefaultSetName,
  setLetter,
  validateDraft,
  type DraftExercise,
  type PlanDraft,
} from '../draft';
import type { CatalogExercise } from '../../../core/catalog/catalog';
import type { WorkoutPlan } from '../../../core/db/models';

const benchPress: CatalogExercise = {
  id: 'barbell-bench-press',
  name: { pt: 'Supino reto com barra', en: 'Barbell Bench Press' },
  instructions: { pt: ['a'], en: ['a'] },
  muscleGroup: 'chest',
  primaryMuscles: ['chest'],
  secondaryMuscles: [],
  equipment: 'barbell',
  defaultRestSeconds: 120,
  images: [],
  video: null,
  videoUrl: null,
};

function validExercise(overrides: Partial<DraftExercise> = {}): DraftExercise {
  return {
    catalogExerciseId: 'barbell-bench-press',
    sets: '3',
    repsMode: 'fixed',
    repsValue: '10',
    repsMin: '8',
    repsMax: '12',
    loadValue: '40',
    loadUnit: 'kg',
    restSeconds: '90',
    ...overrides,
  };
}

function draftWith(exercise: DraftExercise): PlanDraft {
  return { name: 'Plano ABC', sets: [{ key: 's1', name: 'Treino A', exercises: [exercise] }] };
}

describe('defaults', () => {
  test('empty draft starts with one set named with letter A', () => {
    const draft = createEmptyDraft('Treino');
    expect(draft.sets).toHaveLength(1);
    expect(draft.sets[0].name).toBe('Treino A');
    expect(draft.sets[0].exercises).toHaveLength(0);
  });

  test('set letters follow creation index', () => {
    expect(setLetter(0)).toBe('A');
    expect(setLetter(1)).toBe('B');
    expect(setLetter(2)).toBe('C');
  });

  test('next default set name picks the first unused letter', () => {
    expect(nextDefaultSetName('Treino', [])).toBe('Treino A');
    expect(nextDefaultSetName('Treino', ['Treino A', 'Treino B'])).toBe('Treino C');
    expect(nextDefaultSetName('Treino', ['Treino A', 'Treino B', 'Treino D'])).toBe('Treino C');
    expect(nextDefaultSetName('Treino', ['Peito e ombro', 'Treino A'])).toBe('Treino B');
  });

  test('default exercise copies the catalog rest time and unit preference', () => {
    const draft = defaultDraftExercise(benchPress, 'lb');
    expect(draft.restSeconds).toBe('120');
    expect(draft.loadUnit).toBe('lb');
    expect(draft.loadValue).toBe('');
  });
});

describe('validation', () => {
  test('valid fixed-reps draft passes', () => {
    expect(validateDraft(draftWith(validExercise())).ok).toBe(true);
  });

  test('valid range-reps draft passes', () => {
    const draft = draftWith(validExercise({ repsMode: 'range', repsMin: '8', repsMax: '12' }));
    expect(validateDraft(draft).ok).toBe(true);
  });

  test('empty plan name fails', () => {
    const draft = draftWith(validExercise());
    draft.name = '   ';
    const result = validateDraft(draft);
    expect(result.ok).toBe(false);
    expect(result.nameError).toBe(true);
  });

  test('a set without exercises fails', () => {
    const draft: PlanDraft = {
      name: 'Plano',
      sets: [{ key: 's1', name: 'Treino A', exercises: [] }],
    };
    const result = validateDraft(draft);
    expect(result.ok).toBe(false);
    expect(result.emptySetKeys).toEqual(['s1']);
  });

  test('range with min >= max fails on reps', () => {
    const draft = draftWith(validExercise({ repsMode: 'range', repsMin: '12', repsMax: '12' }));
    const result = validateDraft(draft);
    expect(result.ok).toBe(false);
    expect(result.exerciseErrors[exerciseErrorKey('s1', 'barbell-bench-press')].reps).toBe(true);
  });

  test('zero or non-numeric sets fail', () => {
    expect(validateDraft(draftWith(validExercise({ sets: '0' }))).ok).toBe(false);
    expect(validateDraft(draftWith(validExercise({ sets: 'abc' }))).ok).toBe(false);
  });

  test('empty load is allowed, garbage load is not', () => {
    expect(validateDraft(draftWith(validExercise({ loadValue: '' }))).ok).toBe(true);
    expect(validateDraft(draftWith(validExercise({ loadValue: '40,5' }))).ok).toBe(true);
    expect(validateDraft(draftWith(validExercise({ loadValue: '40kg' }))).ok).toBe(false);
    expect(validateDraft(draftWith(validExercise({ loadValue: '0' }))).ok).toBe(false);
  });

  test('rest accepts zero but not empty or negative-ish input', () => {
    expect(validateDraft(draftWith(validExercise({ restSeconds: '0' }))).ok).toBe(true);
    expect(validateDraft(draftWith(validExercise({ restSeconds: '' }))).ok).toBe(false);
    expect(validateDraft(draftWith(validExercise({ restSeconds: '-5' }))).ok).toBe(false);
  });
});

describe('conversion', () => {
  test('converts a valid draft with comma decimal load', () => {
    const input = draftToPlanInput(draftWith(validExercise({ loadValue: '42,5' })));
    expect(input.workoutSets[0].exercises[0].targetLoad).toEqual({ value: 42.5, unit: 'kg' });
  });

  test('empty load converts to null', () => {
    const input = draftToPlanInput(draftWith(validExercise({ loadValue: '' })));
    expect(input.workoutSets[0].exercises[0].targetLoad).toBeNull();
  });

  test('range reps convert to the range shape', () => {
    const input = draftToPlanInput(
      draftWith(validExercise({ repsMode: 'range', repsMin: '6', repsMax: '10' })),
    );
    expect(input.workoutSets[0].exercises[0].reps).toEqual({ mode: 'range', min: 6, max: 10 });
  });

  test('exercise order follows list position', () => {
    const draft: PlanDraft = {
      name: 'Plano',
      sets: [
        {
          key: 's1',
          name: 'Treino A',
          exercises: [
            validExercise(),
            validExercise({ catalogExerciseId: 'lat-pulldown' }),
          ],
        },
      ],
    };
    const input = draftToPlanInput(draft);
    expect(input.workoutSets[0].exercises.map((e) => [e.catalogExerciseId, e.order])).toEqual([
      ['barbell-bench-press', 0],
      ['lat-pulldown', 1],
    ]);
  });

  test('throws on invalid draft', () => {
    expect(() => draftToPlanInput(draftWith(validExercise({ sets: '' })))).toThrow('invalid-draft');
  });

  test('round-trips a plan through draftFromPlan', () => {
    const plan: WorkoutPlan = {
      id: 'p1',
      name: 'Plano ABC',
      createdAt: '2026-06-12T00:00:00.000Z',
      workoutSets: [
        {
          id: 'ws1',
          name: 'Treino A',
          order: 0,
          exercises: [
            {
              catalogExerciseId: 'barbell-squat',
              order: 0,
              sets: 4,
              reps: { mode: 'range', min: 6, max: 10 },
              targetLoad: { value: 80, unit: 'kg' },
              restSeconds: 180,
            },
          ],
        },
      ],
    };

    const input = draftToPlanInput(draftFromPlan(plan));
    expect(input.name).toBe('Plano ABC');
    expect(input.workoutSets[0].exercises[0]).toEqual({
      catalogExerciseId: 'barbell-squat',
      order: 0,
      sets: 4,
      reps: { mode: 'range', min: 6, max: 10 },
      targetLoad: { value: 80, unit: 'kg' },
      restSeconds: 180,
    });
  });
});
