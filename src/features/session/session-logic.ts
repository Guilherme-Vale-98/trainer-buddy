import type { CompletedSet, PlanExercise, WorkoutSession } from '../../core/db/models';
import type { LoadUnit } from '../../core/settings/SettingsContext';

export function completedCount(session: WorkoutSession, catalogExerciseId: string): number {
  return session.completedSets.filter((s) => s.catalogExerciseId === catalogExerciseId).length;
}

export function isExerciseComplete(session: WorkoutSession, exercise: PlanExercise): boolean {
  return completedCount(session, exercise.catalogExerciseId) >= exercise.sets;
}

export function firstIncompleteIndex(session: WorkoutSession): number {
  return session.planSnapshot.exercises.findIndex((e) => !isExerciseComplete(session, e));
}

export function isSessionComplete(session: WorkoutSession): boolean {
  return firstIncompleteIndex(session) === -1;
}

export function exerciseProgress(session: WorkoutSession): { done: number; total: number } {
  const exercises = session.planSnapshot.exercises;
  return {
    done: exercises.filter((e) => isExerciseComplete(session, e)).length,
    total: exercises.length,
  };
}

export function nextIncompleteIndex(session: WorkoutSession, fromIndex: number): number {
  const exercises = session.planSnapshot.exercises;
  for (let i = fromIndex + 1; i < exercises.length; i += 1) {
    if (!isExerciseComplete(session, exercises[i])) return i;
  }
  return firstIncompleteIndex(session);
}

export function previousPerformance(
  completedSessions: WorkoutSession[],
  catalogExerciseId: string,
): CompletedSet[] | null {
  for (const session of completedSessions) {
    const sets = session.completedSets.filter((s) => s.catalogExerciseId === catalogExerciseId);
    if (sets.length > 0) {
      return [...sets].sort((a, b) => a.setNumber - b.setNumber);
    }
  }
  return null;
}

export function suggestedReps(
  exercise: PlanExercise,
  previous: CompletedSet[] | null,
  setNumber: number,
): number {
  const previousSet = previous?.find((s) => s.setNumber === setNumber);
  if (previousSet) return previousSet.actualReps;
  return exercise.reps.mode === 'fixed' ? exercise.reps.value : exercise.reps.min;
}

export function suggestedLoad(
  exercise: PlanExercise,
  previous: CompletedSet[] | null,
): { value: number; unit: LoadUnit } | null {
  if (previous) {
    for (let i = previous.length - 1; i >= 0; i -= 1) {
      const load = previous[i].actualLoad;
      if (load) return load;
    }
  }
  return exercise.targetLoad;
}

export function suggestedEntryForSet(
  exercise: PlanExercise,
  currentExerciseSets: CompletedSet[],
  previousHistory: CompletedSet[] | null,
  nextSetNumber: number,
): { reps: number; load: { value: number; unit: LoadUnit } | null } {
  if (currentExerciseSets.length > 0) {
    const last = currentExerciseSets.reduce((latest, set) =>
      set.setNumber > latest.setNumber ? set : latest,
    );
    return { reps: last.actualReps, load: last.actualLoad };
  }
  return {
    reps: suggestedReps(exercise, previousHistory, nextSetNumber),
    load: suggestedLoad(exercise, previousHistory),
  };
}

export function parseRepsInput(value: string): number | null {
  const trimmed = value.trim();
  if (!/^\d+$/.test(trimmed)) return null;
  const parsed = parseInt(trimmed, 10);
  return parsed >= 1 ? parsed : null;
}

export function parseLoadInput(value: string): { valid: boolean; load: number | null } {
  const trimmed = value.trim();
  if (trimmed === '') return { valid: true, load: null };
  const normalized = trimmed.replace(',', '.');
  if (!/^\d+(\.\d+)?$/.test(normalized)) return { valid: false, load: null };
  const parsed = parseFloat(normalized);
  return parsed > 0 ? { valid: true, load: parsed } : { valid: false, load: null };
}

export function formatPreviousSets(previous: CompletedSet[]): string {
  const reps = previous.map((s) => s.actualReps).join(' · ');
  const lastLoad = [...previous].reverse().find((s) => s.actualLoad)?.actualLoad;
  return lastLoad ? `${reps} @ ${lastLoad.value} ${lastLoad.unit}` : reps;
}
