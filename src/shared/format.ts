import type { PlanExercise } from '../core/db/models';

export function formatReps(exercise: PlanExercise): string {
  return exercise.reps.mode === 'fixed'
    ? `${exercise.sets} x ${exercise.reps.value}`
    : `${exercise.sets} x ${exercise.reps.min}-${exercise.reps.max}`;
}

export function formatExerciseSummary(exercise: PlanExercise): string {
  const parts = [formatReps(exercise)];
  if (exercise.targetLoad) parts.push(`${exercise.targetLoad.value} ${exercise.targetLoad.unit}`);
  parts.push(`${exercise.restSeconds}s`);
  return parts.join(' · ');
}
