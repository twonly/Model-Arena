import { timingSafeEqual } from "node:crypto";
import { NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import {
  benchmarkPlan,
  executeBenchmark,
  discoverModels,
  prepareReport,
  benchmarkStatus,
  launchCampaigns,
  editorialQueue,
  editorialDraft,
  saveEditorial,
  publishDraft,
} from "@/lib/benchmark-server";
import { resolveUserId, isAdmin } from "@/lib/server-auth";
import { BRAND } from "@/lib/brand";
export const runtime = "nodejs";
export const preferredRegion = "hkg1";
export const maxDuration = 300;
function scheduler(req: NextRequest) {
  const secret = process.env.BENCHMARK_SECRET;
  const received =
    req.headers.get("authorization")?.replace(/^Bearer /, "") ?? "";
  return (
    !!secret &&
    secret.length >= 32 &&
    Buffer.byteLength(received) === Buffer.byteLength(secret) &&
    timingSafeEqual(Buffer.from(received), Buffer.from(secret))
  );
}
async function administrator(req: NextRequest) {
  const id = await resolveUserId(
    req,
    process.env.SUPABASE_URL ?? "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
  return isAdmin(id) ? id : null;
}
const json = (value: unknown, status = 200) =>
  Response.json(value, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
function failure(error: unknown) {
  const code = error instanceof Error ? error.message : "benchmark_failed";
  return json(
    { error: code },
    code === "draft_conflict"
      ? 409
      : /^(invalid_|sensitive_)/.test(code)
        ? 400
        : code === "draft_not_found"
          ? 404
          : 503,
  );
}
export async function GET(req: NextRequest) {
  if (!scheduler(req) && !(await administrator(req)))
    return json({ error: "unauthorized" }, 401);
  try {
    if (req.nextUrl.searchParams.has("draft")) {
      const draft = await editorialDraft(
        req.nextUrl.searchParams.get("draft")!,
      );
      return draft ? json(draft) : json({ error: "draft_not_found" }, 404);
    }
    if (req.nextUrl.searchParams.has("editorial"))
      return json(await editorialQueue());
    return json(await benchmarkStatus());
  } catch (error) {
    return failure(error);
  }
}
export async function POST(req: NextRequest) {
  const automated = scheduler(req);
  const admin = automated ? null : await administrator(req);
  if (!automated && !admin) return json({ error: "unauthorized" }, 401);
  let body;
  try {
    const raw = await req.text();
    if (raw.length > 150000) return json({ error: "request_too_large" }, 413);
    body = JSON.parse(raw);
    if (!body || typeof body !== "object") throw new Error();
  } catch {
    return json({ error: "invalid_json" }, 400);
  }
  // A scheduler credential can produce drafts, but never approve its own content.
  if (body.action === "publish" && !admin)
    return json({ error: "administrator_confirmation_required" }, 403);
  if (
    !automated &&
    !["publish", "save_editorial", "discover"].includes(body.action)
  )
    return json({ error: "scheduler_action_required" }, 403);
  try {
    switch (body.action) {
      case "discover":
        return json(await discoverModels());
      case "launches":
        return json(await launchCampaigns());
      case "plan":
        return json(
          await benchmarkPlan(body.campaign, body.window, body.health === true),
        );
      case "run":
        return json(await executeBenchmark(body));
      case "prepare":
        return json(
          await prepareReport(body.campaign, body.firstLook === true),
        );
      case "save_editorial":
        return json(
          await saveEditorial(
            body.id,
            body.revision,
            body.editorial,
            automated ? "codex" : "operator",
          ),
        );
      case "publish": {
        const result = await publishDraft(body.id, body.revision, admin!);
        if (result.state !== "published") return json(result, 409);
        revalidatePath("/sitemap.xml");
        for (const path of result.urls ?? []) revalidatePath(path);
        let indexing = "sitemap";
        if (process.env.INDEXNOW_KEY && result.urls?.length) {
          try {
            const response = await fetch("https://api.indexnow.org/indexnow", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                host: new URL(BRAND.url).host,
                key: process.env.INDEXNOW_KEY,
                urlList: result.urls.map((path: string) => BRAND.url + path),
              }),
              signal: AbortSignal.timeout(10000),
            });
            indexing = response.ok ? "submitted" : "pending";
          } catch {
            indexing = "pending";
          }
        }
        return json({ ...result, indexing });
      }
      default:
        return json({ error: "invalid_action" }, 400);
    }
  } catch (error) {
    return failure(error);
  }
}
