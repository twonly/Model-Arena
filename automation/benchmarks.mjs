// Native fetch only. Runs one durable attempt per API request; never retries an ambiguous paid request.
const base = process.env.TOKRACE_URL || "https://www.tokrace.com";
const secret = process.env.BENCHMARK_SECRET;
if (!secret || secret.length < 32)
  throw new Error("BENCHMARK_SECRET (32+ characters) is required");
async function call(body) {
  const res = await fetch(`${base}/api/benchmarks`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secret}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(295000),
  });
  if (!res.ok) throw new Error(`Benchmark API HTTP ${res.status}`);
  return res.json();
}
const now = new Date(),
  day = now.toISOString().slice(0, 10);
const monday = new Date(now);
monday.setUTCDate(now.getUTCDate() - ((now.getUTCDay() + 6) % 7));
const campaign = `weekly-${monday.toISOString().slice(0, 10)}`;
const discovery = await call({ action: "discover" });
console.log(JSON.stringify({ discovery }));
let issues = discovery.some((row) => row.state !== "ok");
// Resume both weekly windows on every scheduled run, including after a missed Monday.
// The server enforces the six-hour gap. Daily health checks have their own deduplicated campaign.
const mode = process.env.BENCHMARK_MODE || "scheduled";
const launches = mode === "health" ? [] : await call({ action: "launches" });
const campaigns =
  mode === "health"
    ? [`health-${day}`]
    : mode === "standard"
      ? [...launches, campaign]
      : [...launches, `health-${day}`, campaign];
for (const activeCampaign of campaigns) {
  const health = activeCampaign.startsWith("health-");
  let waitingForWindow = false;
  for (const window of health ? [0] : [0, 1]) {
    const plan = await call({
      action: "plan",
      campaign: activeCampaign,
      window,
      health,
    });
    for (const job of plan.jobs) {
      if (job.state === "complete") continue;
      if (job.state !== "pending") {
        console.log(JSON.stringify({ id: job.id, state: job.state }));
        issues = true;
        continue;
      }
      const result = await call({ action: "run", ...job });
      console.log(JSON.stringify(result));
      if (result.state === "paused_time_window") {
        waitingForWindow = true;
        continue;
      }
      if (
        result.state !== "complete" ||
        result.status === "infrastructure_error" ||
        (health && result.status !== "done")
      )
        issues = true;
    }
    if (!health && window === 0) {
      const draft = await call({
        action: "prepare",
        campaign: activeCampaign,
        firstLook: true,
      });
      console.log(JSON.stringify(draft));
      if (draft.state !== "draft") issues = true;
    }
  }
  if (health || waitingForWindow) continue;
  const draft = await call({ action: "prepare", campaign: activeCampaign });
  console.log(JSON.stringify(draft));
  if (draft.state !== "draft") issues = true;
}
if (issues)
  throw new Error(
    "Some models or draft preparation paused; inspect /operations and this run log",
  );
