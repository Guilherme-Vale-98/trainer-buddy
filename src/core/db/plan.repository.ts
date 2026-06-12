import { randomUUID } from 'expo-crypto';
import { getDatabase, type Db } from './database';
import type { PlanExercise, WorkoutPlan } from './models';

export interface NewPlanInput {
  name: string;
  workoutSets: Array<{ name: string; exercises: PlanExercise[] }>;
}

export class PlanRepository {
  constructor(private readonly db: Promise<Db>) {}

  async saveActivePlan(input: NewPlanInput): Promise<WorkoutPlan> {
    const plan: WorkoutPlan = {
      id: randomUUID(),
      name: input.name,
      createdAt: new Date().toISOString(),
      workoutSets: input.workoutSets.map((set, index) => ({
        id: randomUUID(),
        name: set.name,
        order: index,
        exercises: set.exercises,
      })),
    };
    const db = await this.db;
    await db.runAsync('delete from plans', []);
    await db.runAsync('insert into plans (id, created_at, data) values (?, ?, ?)', [
      plan.id,
      plan.createdAt,
      JSON.stringify(plan),
    ]);
    return plan;
  }

  async getActivePlan(): Promise<WorkoutPlan | null> {
    const db = await this.db;
    const row = await db.getFirstAsync<{ data: string }>('select data from plans limit 1', []);
    return row ? (JSON.parse(row.data) as WorkoutPlan) : null;
  }
}

export const planRepository = new PlanRepository(getDatabase());
