import EmbeddedPostgres from "embedded-postgres";
import { existsSync } from "node:fs";
import path from "node:path";

/**
 * Zero-install local PostgreSQL for development, using a real Postgres
 * binary (no Docker or system install required). Data persists under
 * .pgdata/ (gitignored) between runs.
 *
 * Usage: npm run db:local
 * Then, in another terminal: npm run db:seed / npx prisma migrate dev
 */
const DATA_DIR = path.join(process.cwd(), ".pgdata");
const PORT = 5432;
const USER = "user";
const PASSWORD = "password";
const DATABASE = "ghana_curriculum_planner";

async function main() {
  const pg = new EmbeddedPostgres({
    databaseDir: DATA_DIR,
    user: USER,
    password: PASSWORD,
    port: PORT,
    persistent: true,
    // Without this, initdb picks up the OS locale's codepage (WIN1252 on a
    // default Windows install) as the cluster's default encoding, which then
    // rejects legitimate UTF-8 content (accented French/Spanish text, Arabic
    // script, and even a stray U+FFFD replacement character) with a Postgres
    // "character ... has no equivalent in encoding" error. Only takes effect
    // the first time this data directory is initialised.
    initdbFlags: ["--encoding=UTF8", "--locale=C"],
  });

  const alreadyInitialised = existsSync(path.join(DATA_DIR, "PG_VERSION"));
  if (!alreadyInitialised) {
    await pg.initialise();
  }
  await pg.start();

  try {
    await pg.createDatabase(DATABASE);
  } catch {
    // Database already exists from a previous run — fine.
  }

  console.log("Local PostgreSQL is running.");
  console.log(
    `DATABASE_URL="postgresql://${USER}:${PASSWORD}@localhost:${PORT}/${DATABASE}?schema=public"`,
  );
  console.log("Press Ctrl+C to stop.");

  const shutdown = async () => {
    console.log("\nStopping local PostgreSQL...");
    await pg.stop();
    process.exit(0);
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
