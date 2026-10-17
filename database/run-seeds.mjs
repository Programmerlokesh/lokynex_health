// Loads the full test catalog (departments, tests, report formats) into the
// database. Safe to run again any time: nothing you edited is overwritten.
//
//   cd database
//   npm i pg                                   (one time)
//   export DATABASE_URL="postgresql://..."     (Git Bash)   Neon > Connect, pooling OFF
//   node run-seeds.mjs
//
// Optional: node run-seeds.mjs 027_seed_all_other_pathology_tests.sql   (only that file)
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error(
    'Set DATABASE_URL first, e.g.  export DATABASE_URL="postgresql://..."',
  );
  process.exit(1);
}

const dir = dirname(fileURLToPath(import.meta.url));
// ORDER MATTERS (020 expects the formats of 017 to exist already)
const files =
  process.argv.length > 2
    ? process.argv.slice(2)
    : [
        "019_seed_blood_tests.sql",
        "017_seed_all_blood_test_formats.sql",
        "020_seed_sop_pack_catalog.sql",
        "021_build_panel_and_test_formats.sql",
        "026_seed_missing_formats_and_other_tests.sql",
        "027_seed_all_other_pathology_tests.sql",
      ];

// ONE connection = ONE session, so the temp tables the scripts create survive.
const client = new pg.Client({
  connectionString: url,
  ssl: /localhost|\/tmp/.test(url) ? false : { rejectUnauthorized: false },
});
client.on("notice", (n) => console.log("   notice:", n.message));
await client.connect();

try {
  for (const f of files) {
    console.log(`\n=== running ${f}`);
    // normalise Windows line endings so the scripts behave the same everywhere
    const sql = readFileSync(join(dir, f), "utf8").replace(/\r\n/g, "\n");
    const t0 = Date.now();
    await client.query(sql); // simple protocol: the whole file in one call
    console.log(`=== done ${f} in ${((Date.now() - t0) / 1000).toFixed(1)}s`);
  }

  const { rows: schemas } = await client.query(`
    SELECT DISTINCT table_schema AS s FROM information_schema.tables
    WHERE table_name = 'tests' AND table_schema NOT IN ('public','platform','information_schema','pg_catalog')
    ORDER BY 1`);
  for (const { s } of schemas) {
    const { rows } = await client.query(`
      SELECT d.name AS department, count(t.id)::int AS tests
      FROM "${s}".departments d LEFT JOIN "${s}".tests t ON t.department_id = d.id
      GROUP BY d.name ORDER BY d.name`);
    console.log(
      `\nSchema ${s}: ${rows.length} departments, ${rows.reduce((a, r) => a + r.tests, 0)} tests`,
    );
    console.table(rows);
  }
} catch (e) {
  console.error("\nFAILED:", e.message);
  if (e.where) console.error("where:", e.where);
  process.exitCode = 1;
} finally {
  await client.end();
}
