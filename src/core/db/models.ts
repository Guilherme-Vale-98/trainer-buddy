import type { LoadUnit } from '../settings/SettingsContext';

export type Reps =
  | { mode: 'fixed'; value: number }
  | { mode: 'range'; min: number; max: number };

export interface PlanExercise {
  catalogExerciseId: string;
  order: number;
  sets: number;
  reps: Reps;
  targetLoad: { value: number; unit: LoadUnit } | null;
  restSeconds: number;
}

export interface WorkoutSet {
  id: string;
  name: string;
  order: number;
  exercises: PlanExercise[];
}

export interface WorkoutPlan {
  id: string;
  name: string;
  createdAt: string;
  workoutSets: WorkoutSet[];
}

export type SessionStatus = 'in_progress' | 'completed';

export interface CompletedSet {
  catalogExerciseId: string;
  setNumber: number;
  actualReps: number;
  actualLoad: { value: number; unit: LoadUnit } | null;
  completedAt: string;
}

export interface WorkoutSession {
  id: string;
  status: SessionStatus;
  startedAt: string;
  finishedAt: string | null;
  planId: string;
  planName: string;
  workoutSetId: string;
  workoutSetName: string;
  planSnapshot: WorkoutSet;
  completedSets: CompletedSet[];
}
