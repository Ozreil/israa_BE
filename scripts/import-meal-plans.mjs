import { readFile } from 'node:fs/promises';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const defaultPath =
    '/Users/aliozreil/Desktop/Work/soso_website/data_handling/all_meal_plans.json';
  const filePath = process.env.MEAL_PLANS_JSON_PATH ?? defaultPath;
  const raw = await readFile(filePath, 'utf8');
  const parsed = JSON.parse(raw);
  const plans = Array.isArray(parsed) ? parsed : parsed.plans;

  if (!Array.isArray(plans)) {
    throw new Error('Expected JSON shape: { plans: [...] } or [...]');
  }

  const rows = plans.map((plan) => ({
    calories: Number.isFinite(plan.calories) ? plan.calories : null,
    tags: Array.isArray(plan.tags) ? plan.tags : [],
    sourceFile:
      typeof plan.source_file === 'string'
        ? plan.source_file
        : typeof plan.sourceFile === 'string'
          ? plan.sourceFile
          : null,
    planTable: plan.table ?? {},
    notes: null,
  }));

  await prisma.$transaction(async (tx) => {
    await tx.mealPlanTemplate.deleteMany();
    await tx.mealPlanTemplate.createMany({ data: rows });
  });

  console.log(`Imported ${rows.length} meal plans from ${filePath}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
