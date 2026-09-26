// Bridge for the native Codex scheduled task. Credentials stay in the process environment.
// Node 22+: node --env-file=<private-env> automation/editorial.mjs queue|evidence|save ...
import { readFile } from "node:fs/promises";
const [command, id, file] = process.argv.slice(2);
const base = process.env.TOKRACE_URL || "https://www.tokrace.com";
const secret = process.env.BENCHMARK_SECRET;
if (!secret || secret.length < 32)
  throw new Error("BENCHMARK_SECRET is required");
if (!["queue", "evidence", "save"].includes(command))
  throw new Error("Use queue, evidence <id>, or save <id> <JSON file>");
if (command !== "queue" && (!id || !/^[a-z0-9-]{1,120}$/.test(id)))
  throw new Error("Invalid draft id");
let path = "?editorial=1",
  payload;
if (command === "evidence") path = `?draft=${encodeURIComponent(id)}`;
if (command === "save") {
  const content = JSON.parse(await readFile(file, "utf8"));
  payload = {
    action: "save_editorial",
    id,
    revision: content.revision,
    editorial: content.editorial,
  };
  path = "";
}
const response = await fetch(`${base}/api/benchmarks${path}`, {
  method: payload ? "POST" : "GET",
  signal: AbortSignal.timeout(30000),
  headers: {
    Authorization: `Bearer ${secret}`,
    ...(payload ? { "Content-Type": "application/json" } : {}),
  },
  ...(payload ? { body: JSON.stringify(payload) } : {}),
});
if (!response.ok) throw new Error(`Editorial API HTTP ${response.status}`);
const result = await response.json();
console.log(
  JSON.stringify(
    command === "queue"
      ? result.filter((d) => !d.editorial)
      : command === "save"
        ? {
            id: result.id,
            revision: result.revision,
            state: "awaiting_confirmation",
          }
        : result,
    null,
    2,
  ),
);
