import { randomBytes } from "node:crypto";

const encoder = new TextEncoder();
const encode = (event: Record<string, unknown>) => encoder.encode(`data: ${JSON.stringify(event)}\n\n`);
const RETENTION_MS = 30 * 60_000;
const CONNECTION_MS = 45_000;
const MAX_BUFFER = 8 * 1024 * 1024;

type Job = {
  startedAt: number;
  abort: AbortController;
  events: { seq: number; bytes: Uint8Array }[];
  seq: number;
  bytes: number;
  done: boolean;
  timer?: ReturnType<typeof setTimeout>;
  listener?: (bytes?: Uint8Array) => void;
};
// ponytail: one Railway process/replica; use a shared job store before scaling out.
// Tokens are bearer capabilities, never URLs/log fields; buffers expire after disconnect.
const jobs = new Map<string, Job>();

export function stopChat(token: string, reason: "client_stop" | "retention_expired" = "client_stop"): boolean {
  const job = jobs.get(token);
  if (!job) return false;
  console.info("chat_job_closed", JSON.stringify({ reason, ageMs: Date.now() - job.startedAt, finished: job.done, lastSeq: job.seq, bufferedBytes: job.bytes }));
  jobs.delete(token);
  clearTimeout(job.timer);
  job.abort.abort();
  job.listener?.();
  job.events = [];
  return true;
}

function retain(token: string, job: Job) {
  clearTimeout(job.timer);
  job.timer = setTimeout(() => stopChat(token, "retention_expired"), RETENTION_MS);
  job.timer.unref?.();
}

export function startChat(work: (send: (event: Record<string, unknown>) => void, signal: AbortSignal) => Promise<void>): string | null {
  if (jobs.size >= 16) return null;
  const token = randomBytes(32).toString("hex");
  const job: Job = { startedAt: Date.now(), abort: new AbortController(), events: [], seq: 0, bytes: 0, done: false };
  jobs.set(token, job);
  retain(token, job);
  const send = (event: Record<string, unknown>) => {
    if (job.done || job.abort.signal.aborted) return;
    let bytes = encode({ ...event, seq: job.seq + 1 });
    const overflow = job.bytes + bytes.length > MAX_BUFFER;
    if (overflow) {
      event = { type: "error", message: "未接收的输出超过缓冲上限，已停止模型请求。请恢复网络后重跑。" };
      bytes = encode({ ...event, seq: job.seq + 1 });
    }
    job.events.push({ seq: ++job.seq, bytes });
    job.bytes += bytes.length;
    job.done = event.type === "done" || event.type === "error";
    job.listener?.(bytes);
    if (job.done) {
      job.listener?.();
      retain(token, job);
    }
    if (overflow) job.abort.abort();
  };
  void (async () => {
    try {
      await work(send, job.abort.signal);
      if (!job.done) send({ type: "done", truncated: true });
    } catch (error) {
      send({ type: "error", message: error instanceof Error ? error.message : String(error) });
    }
  })();
  return token;
}

export function resumeChat(token: string, after: number, signal: AbortSignal, headers: Record<string, string> = {}): Response {
  const job = jobs.get(token);
  if (!job) return new Response("原测试已不可用（服务重启，或离线超过 30 分钟）。已收内容已保留；模型原连接无法恢复，请重跑。", { status: 410 });
  if (!Number.isSafeInteger(after) || after < 0 || after > job.seq || after < (job.events[0]?.seq ?? job.seq + 1) - 1) {
    return new Response("无效的续传位置", { status: 409 });
  }
  job.listener?.(); // Only one consumer; reconnect supersedes a stale connection.
  clearTimeout(job.timer);
  while (job.events.length && job.events[0].seq <= after) {
    job.bytes -= job.events.shift()!.bytes.length;
  }
  let detach = () => {};
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      let closed = false;
      let rotation: ReturnType<typeof setTimeout>;
      const listener = (bytes?: Uint8Array) => {
        if (closed) return;
        if (!bytes) { detach(); return; }
        try { controller.enqueue(bytes); } catch { detach(); }
      };
      detach = () => {
        if (closed) return;
        closed = true;
        clearTimeout(rotation);
        signal.removeEventListener("abort", detach);
        if (job.listener === listener) job.listener = undefined;
        if (jobs.has(token)) retain(token, job);
        try { controller.close(); } catch { /* Already cancelled. */ }
      };
      job.listener = listener;
      for (const event of job.events) listener(event.bytes);
      if (job.done || signal.aborted) { detach(); return; }
      // Flush headers even if all buffered events were acknowledged; next heartbeat is up to 15s away.
      if (!job.events.length) listener(encoder.encode(": connected\n\n"));
      signal.addEventListener("abort", detach, { once: true });
      rotation = setTimeout(() => {
        listener(encode({ type: "rotate" }));
        detach();
      }, CONNECTION_MS);
    },
    cancel() { detach(); },
  });
  return new Response(stream, { headers: {
    ...headers,
    "Content-Type": "text/event-stream; charset=utf-8",
    "Cache-Control": "no-store, no-transform",
    "X-Accel-Buffering": "no",
    "X-Chat-Stream": token,
  } });
}
