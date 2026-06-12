import catalogJson from '../../content/exercise-catalog.json';
import { getExerciseImages } from '../../content/media-map';
import type { Language } from '../settings/SettingsContext';

export interface CatalogExercise {
  id: string;
  name: { pt: string; en: string };
  instructions: { pt: string[]; en: string[] };
  muscleGroup: string;
  primaryMuscles: string[];
  secondaryMuscles: string[];
  equipment: string;
  defaultRestSeconds: number;
  images: string[];
  video: string | null;
  videoUrl: string | null;
}

const exercises = catalogJson.exercises as CatalogExercise[];
const byId = new Map(exercises.map((e) => [e.id, e]));

export const muscleGroups: string[] = catalogJson.muscleGroups as string[];
export const catalogAttribution: string = catalogJson.attribution as string;

export function getAllExercises(): CatalogExercise[] {
  return exercises;
}

export function getExercise(id: string): CatalogExercise | undefined {
  return byId.get(id);
}

export function getExercisesByMuscleGroup(group: string): CatalogExercise[] {
  return exercises.filter((e) => e.muscleGroup === group);
}

export function getExerciseName(exercise: CatalogExercise, language: Language): string {
  return exercise.name[language];
}

export function getExerciseInstructions(exercise: CatalogExercise, language: Language): string[] {
  return exercise.instructions[language];
}

export function searchExercises(query: string, language: Language): CatalogExercise[] {
  const q = query.trim().toLowerCase();
  if (!q) return exercises;
  return exercises.filter((e) => e.name[language].toLowerCase().includes(q));
}

export { getExerciseImages };
