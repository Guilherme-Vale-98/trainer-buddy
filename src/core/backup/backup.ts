import type { WorkoutPlan, WorkoutSession } from '../db/models';
import type { PlanRepository } from '../db/plan.repository';
import type { SessionRepository } from '../db/session.repository';

export interface ExportFile {
  schema: 'trainer-buddy-export';
  schemaVersion: 1;
  exportedAt: string;
  activePlan: WorkoutPlan | null;
  sessions: WorkoutSession[];
}

export async function exportData(
  plans: PlanRepository,
  sessions: SessionRepository,
): Promise<string> {
  const file: ExportFile = {
    schema: 'trainer-buddy-export',
    schemaVersion: 1,
    exportedAt: new Date().toISOString(),
    activePlan: await plans.getActivePlan(),
    sessions: await sessions.getAllSessions(),
  };
  return JSON.stringify(file, null, 2);
}

export function parseImport(raw: string): ExportFile {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error('invalid-json');
  }
  const file = parsed as Partial<ExportFile>;
  if (file?.schema !== 'trainer-buddy-export') throw new Error('invalid-schema');
  if (file.schemaVersion !== 1) throw new Error('unsupported-version');
  if (!Array.isArray(file.sessions)) throw new Error('invalid-schema');
  if (file.activePlan !== null && !Array.isArray(file.activePlan?.workoutSets)) {
    throw new Error('invalid-schema');
  }
  return file as ExportFile;
}

export async function importData(
  raw: string,
  plans: PlanRepository,
  sessions: SessionRepository,
): Promise<void> {
  const file = parseImport(raw);
  const inProgress = await sessions.getInProgressSession();
  if (inProgress) throw new Error('import-blocked');
  await plans.replaceActivePlan(file.activePlan);
  await sessions.replaceAllSessions(file.sessions);
}
