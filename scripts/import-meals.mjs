import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import process from 'node:process';

function toNullableNumber(value) {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

async function main() {
  const defaultPath =
    '/Users/aliozreil/Desktop/Work/soso_website/data_handling/unique_meals_enriched.json';
  const filePath = process.env.MEALS_JSON_PATH ?? defaultPath;
  const raw = await readFile(filePath, 'utf8');
  const parsed = JSON.parse(raw);

  if (!Array.isArray(parsed)) {
    throw new Error('Expected unique_meals.json to be an array');
  }

  const rows = parsed
    .filter((entry) => typeof entry.meal === 'string' && entry.meal.trim() !== '')
    .map((entry) => ({
      id: randomUUID(),
      meal: entry.meal.trim(),
      protein: toNullableNumber(entry.protein),
      carbs: toNullableNumber(entry.carbs),
      fat: toNullableNumber(entry.fat),
      calories: toNullableNumber(entry.calories),
    }));

  const values = rows.map((row) =>
    `(${toSqlString(row.id)}, ${toSqlString(row.meal)}, ${toSqlNumber(
      row.protein,
    )}, ${toSqlNumber(row.carbs)}, ${toSqlNumber(row.fat)}, ${toSqlNumber(
      row.calories,
    )}, NOW(), NOW())`,
  );

  const sql = `DELETE FROM "Meal";

INSERT INTO "Meal" ("id", "meal", "protein", "carbs", "fat", "calories", "createdAt", "updatedAt")
VALUES
${values.join(',\n')};`;

  process.stdout.write(sql);
}

function toSqlString(value) {
  return `'${value.replaceAll("'", "''")}'`;
}

function toSqlNumber(value) {
  return value === null ? 'NULL' : String(value);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
