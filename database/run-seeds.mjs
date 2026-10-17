// Usage (from the database/ folder):
//   npm i pg            (one time)
//   set DATABASE_URL=postgresql://user:pass@host/lokynex_dev?sslmode=require     (Windows cmd)
//   $env:DATABASE_URL="postgresql://..."                                         (PowerShell)
//   node run-seeds.mjs                      -> runs 020, 021, 026, 027
//   node run-seeds.mjs 020_seed_sop_pack_catalog.sql   -> runs only the files you name
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("Set DATABASE_URL first (Neon > Connect > connection string).");
  process.exit(1);
}

const dir = dirname(fileURLToPath(import.meta.url));
const files =
  process.argv.length > 2
    ? process.argv.slice(2)
    : [
        "020_seed_sop_pack_catalog.sql",
        "021_build_panel_and_test_formats.sql",
        "026_seed_missing_formats_and_other_tests.sql",
        "027_seed_all_other_pathology_tests.sql",
      ];

// ONE connection = ONE session, so the temp tables the scripts create survive.
const client = new pg.Client({
  connectionString: url,
  ssl:
    url.includes("localhost") || url.includes("/tmp")
      ? false
      : { rejectUnauthorized: false },
});
client.on("notice", (n) => console.log("   notice:", n.message));
await client.connect();

try {
  for (const f of files) {
    console.log(`\n=== running ${f}`);
    const sql = readFileSync(join(dir, f), "utf8");
    const t0 = Date.now();
    await client.query(sql); // simple protocol: the whole file in one call
    console.log(`=== done ${f} in ${((Date.now() - t0) / 1000).toFixed(1)}s`);
  }
  const { rows } = await client.query(`
    SELECT d.name, count(t.id)::int AS tests
    FROM lab_demo.departments d LEFT JOIN lab_demo.tests t ON t.department_id = d.id
    GROUP BY d.name ORDER BY d.name`);
  console.table(rows);
} catch (e) {
  console.error("\nFAILED:", e.message);
  if (e.where) console.error("where:", e.where);
  process.exitCode = 1;
} finally {
  await client.end();
}
