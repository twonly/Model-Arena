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
  await db.exec(
    await readFile(
      new URL(
        "../supabase/migrations/006_benchmark_editorial.sql",
        import.meta.url,
      ),
      "utf8",
    ),
  );
  const original = {
    version: "evidence-1",
    models: [],
    attempts: [{ text: "immutable evidence" }],
  };
  const content = {
    "zh-CN": { title: "评测", summary: "摘要", body: "正文" },
    en: { title: "Review", summary: "Summary", body: "Evidence" },
  };
  await db.query(
    "insert into benchmark_drafts(id,campaign,snapshot,summary,editorial,revision) values('draft-1','campaign',$1,$1,$2,2)",
    [original, content],
  );
  assert.equal(
    (await db.query("select count(*)::int n from benchmark_reports")).rows[0].n,
    0,
  );
  await assert.rejects(
    db.query(
      "select publish_benchmark_draft('draft-1',1,'00000000-0000-0000-0000-000000000001')",
    ),
    /draft_conflict/,
  );
  await assert.rejects(
    db.query("select publish_benchmark_draft('draft-1',2,null)"),
    /review_required/,
  );
  const publish = () =>
    db.query(
      "select publish_benchmark_draft('draft-1',2,'00000000-0000-0000-0000-000000000001') result",
    );
  const published = (await publish()).rows[0].result;
  assert.equal(published.id, "draft-1-r2");
  assert.equal((await publish()).rows[0].result.unchanged, true);
  await db.exec("update benchmark_drafts set revision=3 where id='draft-1'");
  await db.query(
    "select publish_benchmark_draft('draft-1',3,'00000000-0000-0000-0000-000000000001')",
  );
  const snapshots = (
    await db.query(
      "select snapshot,is_current from benchmark_reports order by id",
    )
  ).rows;
  assert.equal(snapshots.length, 2);
  assert.equal(snapshots[0].is_current, false);
  assert.equal(snapshots[1].is_current, true);
  assert.deepEqual(snapshots[0].snapshot.attempts, original.attempts);
  assert.equal(
    (
      await db.query(
        "select has_table_privilege('anon','benchmark_drafts','select') allowed",
      )
    ).rows[0].allowed,
    false,
  );
  assert.equal(
    (
      await db.query(
        "select has_function_privilege('authenticated','publish_benchmark_draft(text,integer,uuid)','execute') allowed",
      )
    ).rows[0].allowed,
    false,
  );
  await db.exec(
    await readFile(
      new URL(
        "../supabase/migrations/006_benchmark_editorial.sql",
        import.meta.url,
      ),
      "utf8",
    ),
  );
  assert.equal(
    (await db.query("select count(*)::int n from benchmark_reports")).rows[0].n,
    2,
  );
  console.log(
    "PASS: SQL migrations, budgets, private drafts, revision-bound approval, immutable published revisions, access control and preserved legacy rows",
  );
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
} finally {
  await db.close();
}
