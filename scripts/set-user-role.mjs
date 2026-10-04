// Usage: npm run user:set-role -- <email> <SUPER_ADMIN|ADMIN|PATIENT>
// The user must have signed in with Google at least once so the row exists.
import 'dotenv/config';
import process from 'node:process';
import pg from 'pg';

const ROLES = ['SUPER_ADMIN', 'ADMIN', 'PATIENT'];

async function main() {
  const [email, role] = process.argv.slice(2);

  if (!email || !ROLES.includes(role)) {
    console.error(`Usage: npm run user:set-role -- <email> <${ROLES.join('|')}>`);
    process.exit(1);
  }

  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not defined');
  }

  const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  try {
    const result = await client.query(
      `UPDATE "User" SET "role" = $1::"UserRole", "updatedAt" = NOW()
       WHERE lower("email") = lower($2)
       RETURNING "id", "fullName", "email", "role"`,
      [role, email],
    );

    if (result.rowCount === 0) {
      console.error(`No user with email ${email}. Sign in with Google once first.`);
      process.exit(1);
    }

    console.log('Updated:', result.rows[0]);
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
