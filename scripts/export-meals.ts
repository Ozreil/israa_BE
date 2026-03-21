import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import fs from 'fs';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL is not defined');
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const meals = await prisma.meal.findMany({
    select: {
      id: true,
      meal: true,
      protein: true,
      fat: true,
      carbs: true,
      calories: true,
    },
    orderBy: {
      meal: 'asc',
    },
  });

  fs.writeFileSync(
    './meals-export.json',
    JSON.stringify(meals, null, 2),
    'utf-8',
  );

  console.log(`✅ Exported ${meals.length} meals`);
}

main()
  .catch((e) => {
    console.error(e);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
