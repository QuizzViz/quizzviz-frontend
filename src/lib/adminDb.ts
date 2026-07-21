import { Pool, types } from 'pg';

// node-postgres's default DATE (OID 1082) parser returns a JS Date anchored to
// LOCAL midnight. Serializing that via NextResponse.json() calls toISOString(),
// which is always UTC — on a server whose local time is behind UTC this silently
// shifts every plan_start_date/plan_expiry_date back by a day. Returning the raw
// "YYYY-MM-DD" string instead avoids the round-trip entirely.
types.setTypeParser(1082, (val: string) => val);

// Direct connection to the shared Postgres database that every QuizzViz backend
// service (Create_Company, Quiz_Generation, Publish_Quiz, Quiz_Result, ...)
// already reads/writes via DATABASE_URL — the admin panel talks to the same
// tables directly instead of going through each service's per-company-scoped API.
let pool: Pool | null = null;

export function getAdminDb(): Pool {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error('DATABASE_URL is not configured — required for the admin panel to reach the database.');
    }
    pool = new Pool({
      connectionString,
      ssl: { rejectUnauthorized: false },
      max: 5,
    });
  }
  return pool;
}
