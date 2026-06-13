import type { PlanExercise } from '../../core/db/models';

export function workoutSetMuscleGroups(
  exercises: PlanExercise[],
  resolveGroup: (catalogExerciseId: string) => string | undefined,
): string[] {
  const seen = new Set<string>();
  const groups: string[] = [];
  for (const exercise of exercises) {
    const group = resolveGroup(exercise.catalogExerciseId);
    if (group && !seen.has(group)) {
      seen.add(group);
      groups.push(group);
    }
  }
  return groups;
}
