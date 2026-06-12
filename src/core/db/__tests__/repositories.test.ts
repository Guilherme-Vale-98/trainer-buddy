import { openDatabase, type Db } from '../database';
import { PlanRepository, type NewPlanInput } from '../plan.repository';
import { SessionRepository } from '../session.repository';
import type { PlanExercise } from '../models';

jest.mock('expo-sqlite');
jest.mock('expo-crypto');

function exercise(catalogExerciseId: string, order = 0): PlanExercise {
  return {
    catalogExerciseId,
    order,
    sets: 3,
    reps: { mode: 'range', min: 8, max: 12 },
    targetLoad: { value: 40, unit: 'kg' },
    restSeconds: 90,
  };
}

function planInput(name = 'Plano ABC'): NewPlanInput {
  return {
    name,
    workoutSets: [
      { name: 'Workout A', exercises: [exercise('barbell-bench-press'), exercise('lat-pulldown', 1)] },
      { name: 'Workout B', exercises: [exercise('barbell-squat')] },
    ],
  };
}

describe('data layer invariants', () => {
  let db: Promise<Db>;
  let plans: PlanRepository;
  let sessions: SessionRepository;

  beforeEach(() => {
    db = openDatabase(':memory:');
    plans = new PlanRepository(db);
    sessions = new SessionRepository(db);
  });

  test('saving a new active plan replaces the previous active plan', async () => {
    await plans.saveActivePlan(planInput('First'));
    await plans.saveActivePlan(planInput('Second'));

    const active = await plans.getActivePlan();
    expect(active?.name).toBe('Second');
  });

  test('saving a new active plan does not delete sessions', async () => {
    const plan = await plans.saveActivePlan(planInput());
    const session = await sessions.startSession(plan, plan.workoutSets[0].id);
    await sessions.finishSession(session.id);

    await plans.saveActivePlan(planInput('Replacement'));

    expect(await sessions.getCompletedSessions()).toHaveLength(1);
  });

  test('only one in-progress session can exist', async () => {
    const plan = await plans.saveActivePlan(planInput());
    await sessions.startSession(plan, plan.workoutSets[0].id);

    await expect(sessions.startSession(plan, plan.workoutSets[1].id)).rejects.toThrow(
      'session-in-progress',
    );
  });

  test('each completed set persists immediately', async () => {
    const plan = await plans.saveActivePlan(planInput());
    const session = await sessions.startSession(plan, plan.workoutSets[0].id);

    await sessions.addCompletedSet(session.id, {
      catalogExerciseId: 'barbell-bench-press',
      setNumber: 1,
      actualReps: 10,
      actualLoad: { value: 40, unit: 'kg' },
    });

    const freshRead = await new SessionRepository(db).getSession(session.id);
    expect(freshRead?.completedSets).toHaveLength(1);
    expect(freshRead?.completedSets[0].completedAt).toBeTruthy();
  });

  test('finishing a session sets status and finishedAt', async () => {
    const plan = await plans.saveActivePlan(planInput());
    const session = await sessions.startSession(plan, plan.workoutSets[0].id);

    const finished = await sessions.finishSession(session.id);

    expect(finished.status).toBe('completed');
    expect(finished.finishedAt).toBeTruthy();
    expect(await sessions.getInProgressSession()).toBeNull();
  });

  test('completed sessions cannot be modified', async () => {
    const plan = await plans.saveActivePlan(planInput());
    const session = await sessions.startSession(plan, plan.workoutSets[0].id);
    await sessions.finishSession(session.id);

    await expect(
      sessions.addCompletedSet(session.id, {
        catalogExerciseId: 'barbell-squat',
        setNumber: 1,
        actualReps: 8,
        actualLoad: null,
      }),
    ).rejects.toThrow('session-not-editable');
    await expect(sessions.finishSession(session.id)).rejects.toThrow('session-not-editable');
  });

  test('in-progress and completed sessions can be deleted', async () => {
    const plan = await plans.saveActivePlan(planInput());
    const inProgress = await sessions.startSession(plan, plan.workoutSets[0].id);
    await sessions.deleteSession(inProgress.id);
    expect(await sessions.getInProgressSession()).toBeNull();

    const second = await sessions.startSession(plan, plan.workoutSets[0].id);
    await sessions.finishSession(second.id);
    await sessions.deleteSession(second.id);
    expect(await sessions.getCompletedSessions()).toHaveLength(0);
  });

  test('replacing the plan mid-session does not change the session snapshot', async () => {
    const plan = await plans.saveActivePlan(planInput());
    const session = await sessions.startSession(plan, plan.workoutSets[0].id);

    await plans.saveActivePlan({
      name: 'Edited',
      workoutSets: [{ name: 'Workout A', exercises: [exercise('dumbbell-curl')] }],
    });

    const freshRead = await sessions.getSession(session.id);
    expect(freshRead?.planSnapshot.exercises.map((e) => e.catalogExerciseId)).toEqual([
      'barbell-bench-press',
      'lat-pulldown',
    ]);
  });
});
