import { randomUUID } from 'expo-crypto';
import { getDatabase, type Db } from './database';
import type { CompletedSet, WorkoutPlan, WorkoutSession, WorkoutSet } from './models';

export class SessionRepository {
  constructor(private readonly db: Promise<Db>) {}

  async startSession(plan: WorkoutPlan, workoutSetId: string): Promise<WorkoutSession> {
    const existing = await this.getInProgressSession();
    if (existing) throw new Error('session-in-progress');

    const workoutSet = plan.workoutSets.find((set) => set.id === workoutSetId);
    if (!workoutSet) throw new Error('workout-set-not-found');

    const session: WorkoutSession = {
      id: randomUUID(),
      status: 'in_progress',
      startedAt: new Date().toISOString(),
      finishedAt: null,
      planId: plan.id,
      planName: plan.name,
      workoutSetId: workoutSet.id,
      workoutSetName: workoutSet.name,
      planSnapshot: JSON.parse(JSON.stringify(workoutSet)) as WorkoutSet,
      completedSets: [],
    };

    const db = await this.db;
    await db.runAsync(
      'insert into sessions (id, status, started_at, finished_at, data) values (?, ?, ?, ?, ?)',
      [session.id, session.status, session.startedAt, null, JSON.stringify(session)],
    );
    return session;
  }

  async getSession(id: string): Promise<WorkoutSession | null> {
    const db = await this.db;
    const row = await db.getFirstAsync<{ data: string }>('select data from sessions where id = ?', [id]);
    return row ? (JSON.parse(row.data) as WorkoutSession) : null;
  }

  async getInProgressSession(): Promise<WorkoutSession | null> {
    const db = await this.db;
    const row = await db.getFirstAsync<{ data: string }>(
      "select data from sessions where status = 'in_progress' limit 1",
      [],
    );
    return row ? (JSON.parse(row.data) as WorkoutSession) : null;
  }

  async getCompletedSessions(): Promise<WorkoutSession[]> {
    const db = await this.db;
    const rows = await db.getAllAsync<{ data: string }>(
      "select data from sessions where status = 'completed' order by started_at desc",
      [],
    );
    return rows.map((row) => JSON.parse(row.data) as WorkoutSession);
  }

  async addCompletedSet(sessionId: string, set: Omit<CompletedSet, 'completedAt'>): Promise<WorkoutSession> {
    const session = await this.requireEditableSession(sessionId);
    session.completedSets.push({ ...set, completedAt: new Date().toISOString() });
    await this.persist(session);
    return session;
  }

  async finishSession(sessionId: string): Promise<WorkoutSession> {
    const session = await this.requireEditableSession(sessionId);
    session.status = 'completed';
    session.finishedAt = new Date().toISOString();
    await this.persist(session);
    return session;
  }

  async deleteSession(sessionId: string): Promise<void> {
    const db = await this.db;
    await db.runAsync('delete from sessions where id = ?', [sessionId]);
  }

  private async requireEditableSession(sessionId: string): Promise<WorkoutSession> {
    const session = await this.getSession(sessionId);
    if (!session) throw new Error('session-not-found');
    if (session.status !== 'in_progress') throw new Error('session-not-editable');
    return session;
  }

  private async persist(session: WorkoutSession): Promise<void> {
    const db = await this.db;
    await db.runAsync('update sessions set status = ?, finished_at = ?, data = ? where id = ?', [
      session.status,
      session.finishedAt,
      JSON.stringify(session),
      session.id,
    ]);
  }
}

export const sessionRepository = new SessionRepository(getDatabase());
