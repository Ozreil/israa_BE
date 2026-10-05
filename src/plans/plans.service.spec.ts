import { NotFoundException } from '@nestjs/common';
import { PlanStatus, UserRole } from '@prisma/client';
import type { DatabaseService } from '../database/database.service';
import { PlansService } from './plans.service';

const PATIENT_ID = '11111111-1111-4111-8111-111111111111';

type FindManyArgs = {
  where: { patientId?: string | null };
  orderBy: unknown;
};

function createService() {
  const db = {
    plan: {
      create: jest.fn((args: { data: unknown }) => Promise.resolve(args.data)),
      findMany: jest
        .fn<Promise<unknown[]>, [FindManyArgs]>()
        .mockResolvedValue([]),
      count: jest.fn().mockResolvedValue(0),
      findUnique: jest.fn().mockResolvedValue({ id: 'plan-1' }),
      update: jest.fn((args: { data: unknown }) => Promise.resolve(args.data)),
    },
    user: {
      findUnique: jest.fn(),
    },
  };

  return {
    db,
    service: new PlansService(db as unknown as DatabaseService),
  };
}

function findManyArgs(db: ReturnType<typeof createService>['db']) {
  return db.plan.findMany.mock.calls[0][0];
}

describe('PlansService', () => {
  describe('findAll', () => {
    it('returns only templates when no patient is given', async () => {
      const { db, service } = createService();

      await service.findAll({});

      expect(findManyArgs(db).where.patientId).toBeNull();
      expect(findManyArgs(db).orderBy).toEqual({ createdAt: 'desc' });
    });

    it('keeps templates separate in closest-calorie searches', async () => {
      const { db, service } = createService();

      await service.findAll({ calories: 1500, closestCalories: true });

      expect(findManyArgs(db).where.patientId).toBeNull();
    });

    it("lists a patient's plans, most recently edited first", async () => {
      const { db, service } = createService();

      await service.findAll({ patientId: PATIENT_ID });

      expect(findManyArgs(db).where.patientId).toBe(PATIENT_ID);
      expect(findManyArgs(db).orderBy).toEqual({ updatedAt: 'desc' });
    });
  });

  describe('create', () => {
    it('saves a patient plan as a draft by default', async () => {
      const { db, service } = createService();
      db.user.findUnique.mockResolvedValue({ role: UserRole.PATIENT });

      const plan = await service.create({
        patientId: PATIENT_ID,
        name: '  Week 1  ',
        days: [],
      });

      expect(plan).toMatchObject({
        patientId: PATIENT_ID,
        name: 'Week 1',
        status: PlanStatus.DRAFT,
      });
    });

    it('creates templates without a patient or status', async () => {
      const { service } = createService();

      const plan = await service.create({
        days: [],
        status: PlanStatus.SENT,
      });

      expect(plan).toMatchObject({ patientId: null, status: null });
    });

    it('rejects a patientId that is not a patient', async () => {
      const { db, service } = createService();
      db.user.findUnique.mockResolvedValue({ role: UserRole.ADMIN });

      await expect(
        service.create({ patientId: PATIENT_ID, days: [] }),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(db.plan.create).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('updates name and status without touching other fields', async () => {
      const { db, service } = createService();

      await service.update('plan-1', {
        name: 'Ramadan week',
        status: PlanStatus.SENT,
      });

      const [args] = db.plan.update.mock.calls[0] as [
        { where: unknown; data: Record<string, unknown> },
      ];
      expect(args.where).toEqual({ id: 'plan-1' });
      expect(args.data).toMatchObject({
        name: 'Ramadan week',
        status: PlanStatus.SENT,
      });
      expect(args.data.days).toBeUndefined();
      expect(args.data.patientId).toBeUndefined();
    });
  });
});
