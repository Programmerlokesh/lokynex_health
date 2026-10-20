// Loads the department / test catalog (database/003_departments_and_tests.sql)
// into every lab schema of the database. Safe to run again any time.
//
//   cd database
//   npm i pg                                   (one time)
//   export DATABASE_URL="postgresql://..."     (Git Bash)   Neon > Connect, pooling OFF
//   node run-seeds.mjs                         (all labs)
//   node run-seeds.mjs lab_demo                (only that lab)
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('Set DATABASE_URL first, e.g.  export DATABASE_URL="postgresql://..."');
  process.exit(1);
}
const onlySchema = process.argv[2] ?? "";

const file = join(dirname(fileURLToPath(import.meta.url)), "003_departments_and_tests.sql");
// normalise Windows line endings so the script behaves the same everywhere
const sql = readFileSync(file, "utf8").replace(/\r\n/g, "\n");

// ONE connection = ONE session, so the temp tables the script creates survive.
const client = new pg.Client({
  connectionString: url,
  ssl: /localhost|\/tmp/.test(url) ? false : { rejectUnauthorized: false },
});
client.on("notice", (n) => console.log("  ", n.message));
await client.connect();

try {
  await client.query("SELECT set_config('lokynex.only_schema', $1, false)", [onlySchema]);
  const t0 = Date.now();
  await client.query(sql); // simple protocol: the whole file in one call
  console.log(`done in ${((Date.now() - t0) / 1000).toFixed(1)}s`);

  const { rows: schemas } = await client.query(`
    SELECT DISTINCT table_schema AS s FROM information_schema.tables
    WHERE table_name = 'tests' AND table_schema NOT IN ('public','platform','information_schema','pg_catalog')
    ORDER BY 1`);
  for (const { s } of schemas) {
    const { rows } = await client.query(`
      SELECT d.name AS department, count(t.id)::int AS tests
      FROM "${s}".departments d LEFT JOIN "${s}".tests t ON t.department_id = d.id
      GROUP BY d.name ORDER BY d.name`);
    console.log(`\nSchema ${s}: ${rows.length} departments, ${rows.reduce((a, r) => a + r.tests, 0)} tests`);
  }
} catch (e) {
  console.error("\nFAILED:", e.message);
  if (e.where) console.error("where:", e.where);
  process.exitCode = 1;
} finally {
  await client.end();
}
