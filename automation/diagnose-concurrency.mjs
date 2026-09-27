// node --env-file=.env.local automation/diagnose-concurrency.mjs <share-snapshot.json>
// Three rounds, ten paid calls each: direct UltraSpeed, direct three MiMos, production six models.
import assert from "node:assert/strict";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { runEndpoint } from "../lib/runner.ts";
import { measure, closeConnections } from "./diagnose-ttft.mjs";

const snapshot = JSON.parse(await readFile(process.argv[2], "utf8"));
assert.equal(typeof snapshot.prompt, "string");
assert.ok(!snapshot.params?.systemPrompt && !snapshot.params?.temperature && !snapshot.params?.maxTokens,
  "This controlled comparison requires default parameters");
const specs = [
  ["deepseek-flash", "https://api.deepseek.com/v1", "DEEPSEEK"],
  ["mimo-v2.6-pro", "https://api.xiaomimimo.com/v1", "XIAOMI"],
  ["mimo-v2.6-flash", "https://api.xiaomimimo.com/v1", "XIAOMI"],
  ["mimo-v2.6-pro-ultraspeed", "https://api.xiaomimimo.com/v1", "XIAOMI"],
  ["glm-5.3", "https://open.bigmodel.cn/api/coding/paas/v4", "ZHIPU"],
  ["glm-5.3-flash", "https://open.bigmodel.cn/api/coding/paas/v4", "ZHIPU"],
];
assert.deepEqual(snapshot.results.map(r => r.model).sort(), specs.map(s => s[0]).sort());
for (const [, , provider] of specs) assert.ok(process.env[`SHARED_KEY_${provider}`], `Missing ${provider} key`);
const rounds = Number(process.env.DIAG_ROUNDS || 3);
assert.ok(Number.isInteger(rounds) && rounds >= 1 && rounds <= 5);
const originalFetch = globalThis.fetch;
const transportFailures = [];
globalThis.fetch = async (url, init) => {
  const target = typeof url === "string" && url.startsWith("/") ? `https://www.tokrace.com${url}` : url;
  try { return await originalFetch(target, init); }
  catch (error) {
    transportFailures.push({ at: new Date().toISOString(), path: new URL(target).pathname,
      code: error.cause?.code || error.name });
    throw error;
  }
};
const output = `output/ttft-concurrency-${new Date().toISOString().replaceAll(":", "-")}.json`;
await mkdir("output", { recursive: true });
const report = { at: new Date().toISOString(), prompt: snapshot.prompt, rounds, maxConcurrency: 6,
  notes: "Same local configured keys across groups. Historical account/extra parameters unknown. Direct client and production proxy use different egress. Repeated prompts may be cached. No provider queue duration is inferred.", transportFailures, results: [] };
console.log(JSON.stringify({ output, requests: rounds * 10 }));

async function proxy(spec, round) {
  const [model, baseUrl, provider] = spec;
  const at = new Date().toISOString();
  let state = { status: "idle", reasoning: "", text: "", metrics: null, samples: [], liveTokens: 0, liveTps: 0 };
  await runEndpoint({
    endpoint: { id: model, name: model, model, baseUrl, apiKey: process.env[`SHARED_KEY_${provider}`], kind: "openai", enabled: true },
    prompt: snapshot.prompt, params: snapshot.params, signal: AbortSignal.timeout(75000),
    authHeaders: async () => ({}), update: fn => { state = fn(state); }, onSettled: () => {},
  });
  const row = { round, group: "production-six", model, at, status: state.status, metrics: state.metrics,
    // Do not persist potentially sensitive upstream error text.
    failed: state.status !== "done" };
  console.log(JSON.stringify({ settled: model, round, status: row.status, ttftMs: row.metrics?.ttftMs }));
  return row;
}

try {
  for (let round = 1; round <= rounds; round++) {
    const groups = round % 2 ? ["solo", "mimo-three", "production-six"] : ["production-six", "mimo-three", "solo"];
    for (const group of groups) {
      console.log(JSON.stringify({ starting: group, round, at: new Date().toISOString() }));
      const rows = group === "production-six" ? await Promise.all(specs.map(s => proxy(s, round))) :
        await Promise.all((group === "solo" ? [specs[3]] : specs.slice(1, 4)).map(async ([model]) => ({
          ...await measure("direct", model, round, process.env.SHARED_KEY_XIAOMI, snapshot.prompt), group,
        })));
      report.results.push(...rows);
      await writeFile(output, JSON.stringify(report, null, 2) + "\n");
      for (const row of rows) console.log(JSON.stringify(row));
      if (rows.some(r => r.failed || r.error || r.streamError || (r.route === "direct" && (r.status !== 200 || !r.complete)))) {
        process.exitCode = 1;
        throw new Error("A group failed; stopped without replaying paid requests. See the saved timings.");
      }
    }
  }
} finally { closeConnections(); globalThis.fetch = originalFetch; }
