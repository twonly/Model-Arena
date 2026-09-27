import { timingSafeEqual } from "node:crypto";
import { setTimeout as delay } from "node:timers/promises";

export const runtime = "nodejs";

// Private, synthetic OpenAI upstream for the 330-second deployment check.
export async function POST(req: Request) {
  const token = process.env.BETA_PROBE_TOKEN;
  if ((process.env.TOKRACE_BETA !== "1" && process.env.TOKRACE_STREAM_PROBE !== "1") || !token) return new Response(null, { status: 404 });
  const received = Buffer.from(req.headers.get("authorization") ?? "");
  const expected = Buffer.from(`Bearer ${token}`);
  if (received.length !== expected.length || !timingSafeEqual(received, expected)) {
    return new Response(null, { status: 401 });
  }
  const body = await req.json().catch(() => ({}));
  const active = body.model === "synthetic-stream-330s";
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        // No model tokens for 330 seconds. Comments keep only the upstream alive.
        for (let i = 0; i < (active ? 330 : 22); i++) {
          controller.enqueue(encoder.encode(active
            ? `data: ${JSON.stringify({ choices: [{ delta: { reasoning_content: `[${i}]${"x".repeat(1000)}\n` } }] })}\n\n`
            : ": waiting\n\n"));
          await delay(active ? 1000 : 15_000, undefined, { signal: req.signal });
        }
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({
          choices: [{ delta: { content: "Railway 330-second probe completed." }, finish_reason: "stop" }],
        })}\n\ndata: [DONE]\n\n`));
        controller.close();
      } catch (error) {
        controller.error(error);
      }
    },
  });
  return new Response(stream, { headers: {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    "X-Accel-Buffering": "no",
  } });
}
