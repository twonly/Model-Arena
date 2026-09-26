import { timingSafeEqual } from "node:crypto";
import { NextRequest } from "next/server";
import {
  benchmarkPlan,
  executeBenchmark,
  discoverModels,
  publishReport,
  benchmarkStatus,
} from "@/lib/benchmark-server";
import { resolveUserId, isAdmin } from "@/lib/server-auth";
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
export async function GET(req: NextRequest) {
  const authorized =
    scheduler(req) ||
    isAdmin(
      await resolveUserId(
        req,
        process.env.SUPABASE_URL ?? "",
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      ),
    );
  if (!authorized)
    return Response.json({ error: "unauthorized" }, { status: 401 });
  try {
    return Response.json(await benchmarkStatus());
  } catch {
    return Response.json(
      { error: "benchmark_storage_unavailable" },
      { status: 503 },
    );
  }
}
export async function POST(req: NextRequest) {
  if (!scheduler(req))
    return Response.json({ error: "unauthorized" }, { status: 401 });
  let body;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "invalid_json" }, { status: 400 });
  }
  try {
    switch (body.action) {
      case "discover":
        return Response.json(await discoverModels());
      case "plan":
        return Response.json(
          await benchmarkPlan(body.campaign, body.window, body.health === true),
        );
      case "run":
        return Response.json(await executeBenchmark(body));
      case "publish":
        return Response.json(await publishReport(body.campaign));
      default:
        return Response.json({ error: "invalid_action" }, { status: 400 });
    }
  } catch (e) {
    return Response.json(
      { error: e instanceof Error ? e.message : "benchmark_failed" },
      { status: 503 },
    );
  }
}
