// Run with PGLITE_MODULE pointing to a temporary @electric-sql/pglite install.
// No production credentials or network requests are used.
import { readFile } from "node:fs/promises";
import assert from "node:assert/strict";
const { PGlite } = await import(
  process.env.PGLITE_MODULE || "@electric-sql/pglite"
);
const db = new PGlite();
try {
  await db.exec(`create role anon; create role authenticated; create role service_role;
 create table public.models(id bigint primary key,raw_id text,display_name text);
 insert into models values(1,'example-v1','Example V1');
 create table public.shares(id text primary key); insert into shares values('historical-share');`);
  await db.exec(
    await readFile(
      new URL("../supabase/migrations/005_benchmarks.sql", import.meta.url),
      "utf8",
    ),
  );
  const reserve = async (id, amount, daily = 20, monthly = 500) =>
    (
      await db.query(
        "select reserve_benchmark($1,'weekly-2026-09-21','model',0,'case',$2,$3,$4) as result",
        [id, amount, daily, monthly],
      )
    ).rows[0].result;
  const [first, duplicate] = await Promise.all([
    reserve("same", 12),
    reserve("same", 12),
  ]);
  assert.equal(first.existing, false);
  assert.equal(duplicate.existing, true);
  assert.equal((await reserve("blocked", 9)).reason, "budget_exhausted");
  assert.equal((await reserve("boundary", 8)).state, "running");
  assert.equal((await reserve("zero", 0)).state, "running");
  assert.equal((await reserve("over", 0.000001)).state, "paused");
  assert.equal((await reserve("month", 1, 100, 20)).state, "paused");
  const finish = (lease) =>
    db.query(
      "select finish_benchmark('same',$1,'{\"status\":\"done\"}',3) as ok",
      [lease],
    );
  assert.equal(
    (await finish("00000000-0000-0000-0000-000000000000")).rows[0].ok,
    false,
  );
  assert.equal((await finish(first.lease)).rows[0].ok, true);
  assert.equal((await finish(first.lease)).rows[0].ok, false);
  assert.equal((await reserve("after-settlement", 9)).state, "running");
  assert.equal((await reserve("same", 12)).state, "complete");
  assert.equal(
    (
      await db.query(
        "select count(*)::int as n from shares where id='historical-share'",
      )
    ).rows[0].n,
    1,
  );
  assert.equal(
    (await db.query("select stable_slug from models")).rows[0].stable_slug,
    "example-v1",
  );
  assert.equal(
    (
      await db.query(
        "select has_function_privilege('anon','reserve_benchmark(text,text,text,integer,text,numeric,numeric,numeric)','execute') as allowed",
      )
    ).rows[0].allowed,
    false,
  );
  await db.exec(
    "update models set display_name='Renamed model'; insert into models(id,raw_id,display_name) values(2,'new-v2','New V2');",
  );
  assert.equal(
    (await db.query("select stable_slug from models where id=1")).rows[0]
      .stable_slug,
    "example-v1",
  );
  assert.equal(
    (await db.query("select stable_slug from models where id=2")).rows[0]
      .stable_slug,
    "new-v2",
  );
  // Additive migration is safe to rerun; existing evidence remains immutable through the finish RPC.
  await db.exec(
    await readFile(
      new URL("../supabase/migrations/005_benchmarks.sql", import.meta.url),
      "utf8",
    ),
  );
  assert.equal((await reserve("same", 12)).state, "complete");
  console.log(
    "PASS: SQL migration, deduplication, exact budget boundaries, settlement, access control and preserved legacy rows",
  );
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
} finally {
  await db.close();
}
