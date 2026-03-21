import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import process from 'node:process';

function toSqlString(value) {
  return `'${value.replaceAll("'", "''")}'`;
}

function toSqlNumber(value) {
  return value === null ? 'NULL' : String(value);
}

async function main() {
  const defaultPath =
    '/Users/aliozreil/Desktop/Work/soso_website/data_handling/all_meal_plans_with_ids.json';
  const filePath = process.env.PLANS_JSON_PATH ?? defaultPath;
  const raw = await readFile(filePath, 'utf8');
  const parsed = JSON.parse(raw);

  const plans = Array.isArray(parsed) ? parsed : parsed.plans;

  if (!Array.isArray(plans)) {
    throw new Error('Expected JSON shape: { plans: [...] } or [...]');
  }

  const rows = plans.map((plan) => ({
    id: randomUUID(),
    calories: Number.isFinite(plan.calories) ? plan.calories : null,
    tags: Array.isArray(plan.tags) ? plan.tags : [],
    sourceFile:
      typeof plan.source_file === 'string'
        ? plan.source_file
        : typeof plan.sourceFile === 'string'
          ? plan.sourceFile
          : null,
    days: Array.isArray(plan.days) ? plan.days : [],
  }));

  const values = rows.map((row) =>
    `(${toSqlString(row.id)}, ${toSqlNumber(row.calories)}, ${toSqlString(
      JSON.stringify(row.tags),
    )}::jsonb, ${
      row.sourceFile ? toSqlString(row.sourceFile) : 'NULL'
    }, ${toSqlString(JSON.stringify(row.days))}::jsonb, NOW(), NOW())`,
  );

  const sql = `DELETE FROM "Plan";

INSERT INTO "Plan" ("id", "calories", "tags", "sourceFile", "days", "createdAt", "updatedAt")
VALUES
${values.join(',\n')};`;

  process.stdout.write(sql);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
