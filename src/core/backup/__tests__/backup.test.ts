import { openDatabase, type Db } from '../../db/database';
import { PlanRepository, type NewPlanInput } from '../../db/plan.repository';
import { SessionRepository } from '../../db/session.repository';
import { exportData, importData, parseImport } from '../backup';

jest.mock('expo-sqlite');
jest.mock('expo-crypto');

function planInput(name = 'Plano ABC'): NewPlanInput {
  return {
    name,
    workoutSets: [
      {
        name: 'Treino A',
        exercises: [
          {
            catalogExerciseId: 'barbell-bench-press',
            order: 0,
            sets: 3,
            reps: { mode: 'fixed', value: 10 },
            targetLoad: { value: 40, unit: 'kg' },
            restSeconds: 90,
          },
        ],
      },
    ],
  };
}

describe('backup', () => {
  let db: Promise<Db>;
  let plans: PlanRepository;
  let sessions: SessionRepository;

  beforeEach(() => {
    db = openDatabase(':memory:');
    plans = new PlanRepository(db);
    sessions = new SessionRepository(db);
  });

  async function seed() {
    const plan = await plans.saveActivePlan(planInput());
    const session = await sessions.startSession(plan, plan.workoutSets[0].id);
    await sessions.addCompletedSet(session.id, {
      catalogExerciseId: 'barbell-bench-press',
      setNumber: 1,
      actualReps: 10,
      actualLoad: { value: 40, unit: 'kg' },
    });
    await sessions.finishSession(session.id);
    return plan;
  }

  test('export contains exactly the contract keys and never settings', async () => {
    await seed();
    const file = JSON.parse(await exportData(plans, sessions));
    expect(Object.keys(file).sort()).toEqual([
      'activePlan',
      'exportedAt',
      'schema',
      'schemaVersion',
      'sessions',
    ]);
    expect(file.schema).toBe('trainer-buddy-export');
    expect(file.schemaVersion).toBe(1);
    expect(file.sessions).toHaveLength(1);
  });

  test('export -> import -> export round-trips byte-identically except exportedAt', async () => {
    await seed();
    const first = JSON.parse(await exportData(plans, sessions));

    const otherDb = openDatabase(':memory:');
    const otherPlans = new PlanRepository(otherDb);
    const otherSessions = new SessionRepository(otherDb);
    await importData(JSON.stringify(first), otherPlans, otherSessions);

    const second = JSON.parse(await exportData(otherPlans, otherSessions));
    expect(second.activePlan).toEqual(first.activePlan);
    expect(second.sessions).toEqual(first.sessions);
  });

  test('import replaces existing data entirely', async () => {
    await seed();
    const exported = await exportData(plans, sessions);

    const otherDb = openDatabase(':memory:');
    const otherPlans = new PlanRepository(otherDb);
    const otherSessions = new SessionRepository(otherDb);
    const oldPlan = await otherPlans.saveActivePlan(planInput('Old plan'));
    const oldSession = await otherSessions.startSession(oldPlan, oldPlan.workoutSets[0].id);
    await otherSessions.finishSession(oldSession.id);

    await importData(exported, otherPlans, otherSessions);

    expect((await otherPlans.getActivePlan())?.name).toBe('Plano ABC');
    const all = await otherSessions.getAllSessions();
    expect(all).toHaveLength(1);
    expect(all[0].id).not.toBe(oldSession.id);
  });

  test('import is blocked while a session is in progress', async () => {
    const exported = await exportData(plans, sessions);
    const plan = await plans.saveActivePlan(planInput());
    await sessions.startSession(plan, plan.workoutSets[0].id);

    await expect(importData(exported, plans, sessions)).rejects.toThrow('import-blocked');
  });

  test('parseImport rejects garbage, wrong schema, and unknown versions', () => {
    expect(() => parseImport('not json')).toThrow('invalid-json');
    expect(() => parseImport(JSON.stringify({ schema: 'other' }))).toThrow('invalid-schema');
    expect(() =>
      parseImport(JSON.stringify({ schema: 'trainer-buddy-export', schemaVersion: 2 })),
    ).toThrow('unsupported-version');
    expect(() =>
      parseImport(JSON.stringify({ schema: 'trainer-buddy-export', schemaVersion: 1, sessions: 'x' })),
    ).toThrow('invalid-schema');
    expect(() =>
      parseImport(
        JSON.stringify({
          schema: 'trainer-buddy-export',
          schemaVersion: 1,
          sessions: [],
          activePlan: { name: 'broken' },
        }),
      ),
    ).toThrow('invalid-schema');
  });

  test('export includes an in-progress session; importing it elsewhere works', async () => {
    const plan = await plans.saveActivePlan(planInput());
    await sessions.startSession(plan, plan.workoutSets[0].id);
    const file = JSON.parse(await exportData(plans, sessions));
    expect(file.sessions[0].status).toBe('in_progress');

    const otherDb = openDatabase(':memory:');
    const otherPlans = new PlanRepository(otherDb);
    const otherSessions = new SessionRepository(otherDb);
    await importData(JSON.stringify(file), otherPlans, otherSessions);
    expect(await otherSessions.getInProgressSession()).not.toBeNull();
  });
});
