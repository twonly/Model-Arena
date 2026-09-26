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
const campaigns =
  mode === "health"
    ? [`health-${day}`]
    : mode === "standard"
      ? [campaign]
      : [`health-${day}`, campaign];
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
  }
  if (health || waitingForWindow) continue;
  const publication = await call({
    action: "publish",
    campaign: activeCampaign,
  });
  console.log(JSON.stringify(publication));
  if (publication.state !== "published") issues = true;
  // IndexNow only receives newly published pages; Google discovers them through the sitemap.
  if (publication.urls?.length && process.env.INDEXNOW_KEY) {
    const response = await fetch("https://api.indexnow.org/indexnow", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        host: new URL(base).host,
        key: process.env.INDEXNOW_KEY,
        urlList: publication.urls.map((path) => base + path),
      }),
    });
    if (!response.ok) throw new Error(`IndexNow HTTP ${response.status}`);
  }
}
if (issues)
  throw new Error(
    "Some models or publication paused; inspect /operations and this run log",
  );
