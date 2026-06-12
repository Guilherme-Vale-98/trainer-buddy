import type { CatalogExercise } from '../../core/catalog/catalog';
import type { LoadUnit } from '../../core/settings/SettingsContext';
import type { WorkoutPlan } from '../../core/db/models';
import type { NewPlanInput } from '../../core/db/plan.repository';

export interface DraftExercise {
  catalogExerciseId: string;
  sets: string;
  repsMode: 'fixed' | 'range';
  repsValue: string;
  repsMin: string;
  repsMax: string;
  loadValue: string;
  loadUnit: LoadUnit;
  restSeconds: string;
}

export interface DraftWorkoutSet {
  key: string;
  name: string;
  exercises: DraftExercise[];
}

export interface PlanDraft {
  name: string;
  sets: DraftWorkoutSet[];
}

export interface DraftExerciseErrors {
  sets?: boolean;
  reps?: boolean;
  load?: boolean;
  rest?: boolean;
}

export interface DraftValidation {
  ok: boolean;
  nameError: boolean;
  emptySetKeys: string[];
  exerciseErrors: Record<string, DraftExerciseErrors>;
}

let keyCounter = 0;

export function nextSetKey(): string {
  keyCounter += 1;
  return `set-${keyCounter}`;
}

export function setLetter(index: number): string {
  return String.fromCharCode(65 + (index % 26));
}

export function nextDefaultSetName(defaultSetName: string, existingNames: string[]): string {
  const taken = new Set(existingNames.map((name) => name.trim()));
  for (let i = 0; i < 26; i += 1) {
    const candidate = `${defaultSetName} ${setLetter(i)}`;
    if (!taken.has(candidate)) return candidate;
  }
  return `${defaultSetName} ${existingNames.length + 1}`;
}

export function createEmptyDraft(defaultSetName: string): PlanDraft {
  return {
    name: '',
    sets: [{ key: nextSetKey(), name: `${defaultSetName} A`, exercises: [] }],
  };
}

export function defaultDraftExercise(exercise: CatalogExercise, unit: LoadUnit): DraftExercise {
  return {
    catalogExerciseId: exercise.id,
    sets: '3',
    repsMode: 'fixed',
    repsValue: '10',
    repsMin: '8',
    repsMax: '12',
    loadValue: '',
    loadUnit: unit,
    restSeconds: String(exercise.defaultRestSeconds),
  };
}

export function draftFromPlan(plan: WorkoutPlan): PlanDraft {
  return {
    name: plan.name,
    sets: plan.workoutSets.map((set) => ({
      key: nextSetKey(),
      name: set.name,
      exercises: set.exercises.map((exercise) => ({
        catalogExerciseId: exercise.catalogExerciseId,
        sets: String(exercise.sets),
        repsMode: exercise.reps.mode,
        repsValue: exercise.reps.mode === 'fixed' ? String(exercise.reps.value) : '10',
        repsMin: exercise.reps.mode === 'range' ? String(exercise.reps.min) : '8',
        repsMax: exercise.reps.mode === 'range' ? String(exercise.reps.max) : '12',
        loadValue: exercise.targetLoad ? String(exercise.targetLoad.value) : '',
        loadUnit: exercise.targetLoad?.unit ?? 'kg',
        restSeconds: String(exercise.restSeconds),
      })),
    })),
  };
}

export function exerciseErrorKey(setKey: string, catalogExerciseId: string): string {
  return `${setKey}/${catalogExerciseId}`;
}

function parsePositiveInt(value: string): number | null {
  const trimmed = value.trim();
  if (!/^\d+$/.test(trimmed)) return null;
  const parsed = parseInt(trimmed, 10);
  return parsed >= 1 ? parsed : null;
}

function parseNonNegativeInt(value: string): number | null {
  const trimmed = value.trim();
  if (!/^\d+$/.test(trimmed)) return null;
  return parseInt(trimmed, 10);
}

function parseLoad(value: string): number | null | 'invalid' {
  const trimmed = value.trim();
  if (trimmed === '') return null;
  const normalized = trimmed.replace(',', '.');
  if (!/^\d+(\.\d+)?$/.test(normalized)) return 'invalid';
  const parsed = parseFloat(normalized);
  return parsed > 0 ? parsed : 'invalid';
}

export function validateDraft(draft: PlanDraft): DraftValidation {
  const result: DraftValidation = {
    ok: true,
    nameError: false,
    emptySetKeys: [],
    exerciseErrors: {},
  };

  if (draft.name.trim().length === 0) {
    result.nameError = true;
    result.ok = false;
  }

  for (const set of draft.sets) {
    if (set.exercises.length === 0) {
      result.emptySetKeys.push(set.key);
      result.ok = false;
    }
    for (const exercise of set.exercises) {
      const errors: DraftExerciseErrors = {};
      if (parsePositiveInt(exercise.sets) === null) errors.sets = true;
      if (exercise.repsMode === 'fixed') {
        if (parsePositiveInt(exercise.repsValue) === null) errors.reps = true;
      } else {
        const min = parsePositiveInt(exercise.repsMin);
        const max = parsePositiveInt(exercise.repsMax);
        if (min === null || max === null || min >= max) errors.reps = true;
      }
      if (parseLoad(exercise.loadValue) === 'invalid') errors.load = true;
      if (parseNonNegativeInt(exercise.restSeconds) === null) errors.rest = true;

      if (Object.keys(errors).length > 0) {
        result.exerciseErrors[exerciseErrorKey(set.key, exercise.catalogExerciseId)] = errors;
        result.ok = false;
      }
    }
  }

  return result;
}

export function draftToPlanInput(draft: PlanDraft): NewPlanInput {
  const validation = validateDraft(draft);
  if (!validation.ok) throw new Error('invalid-draft');

  return {
    name: draft.name.trim(),
    workoutSets: draft.sets.map((set) => ({
      name: set.name.trim(),
      exercises: set.exercises.map((exercise, index) => {
        const load = parseLoad(exercise.loadValue);
        return {
          catalogExerciseId: exercise.catalogExerciseId,
          order: index,
          sets: parsePositiveInt(exercise.sets)!,
          reps:
            exercise.repsMode === 'fixed'
              ? { mode: 'fixed' as const, value: parsePositiveInt(exercise.repsValue)! }
              : {
                  mode: 'range' as const,
                  min: parsePositiveInt(exercise.repsMin)!,
                  max: parsePositiveInt(exercise.repsMax)!,
                },
          targetLoad: load === null ? null : { value: load as number, unit: exercise.loadUnit },
          restSeconds: parseNonNegativeInt(exercise.restSeconds)!,
        };
      }),
    })),
  };
}
