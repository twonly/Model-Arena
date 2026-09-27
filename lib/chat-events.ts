import type { StreamEvent } from "./types.ts";

/** Resume the same generation, never retry its POST (or charge/start a second model call). */
export async function* chatEvents(initial: Response, signal: AbortSignal): AsyncGenerator<StreamEvent> {
  const token = initial.headers.get("x-chat-stream");
  let response = initial, after = 0, resumes = 0, failures = 0;
  let lastReceived = Date.now();
  try {
    while (true) {
      let rotated = false;
      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      try {
        while (true) {
          // Heartbeats arrive every 15s; recover a silent/stalled browser connection too.
          const idle = token ? setTimeout(() => { void reader.cancel().catch(() => {}); }, 45_000) : undefined;
          let chunk: ReadableStreamReadResult<Uint8Array>;
          try { chunk = await reader.read(); } finally { clearTimeout(idle); }
          if (chunk.done) break;
          lastReceived = Date.now(); failures = 0;
          buffer += decoder.decode(chunk.value, { stream: true });
          const frames = buffer.split("\n\n");
          buffer = frames.pop() ?? "";
          for (const frame of frames) {
            if (!frame.trim().startsWith("data:")) continue;
            let event: StreamEvent & { seq?: number } | { type: "rotate" };
            try { event = JSON.parse(frame.trim().slice(5)); } catch { continue; }
            if (event.type === "rotate") { rotated = true; continue; }
            if (token) {
              if (!Number.isSafeInteger(event.seq) || event.seq! <= after) continue;
              if (event.seq !== after + 1) throw new Error("续传数据不连续，请重跑。");
              after = event.seq;
            }
            yield event;
            if (event.type === "done" || event.type === "error") return;
          }
        }
      } catch (error) {
        if (!token || signal.aborted) throw error;
      } finally {
        await reader.cancel().catch(() => {});
        reader.releaseLock();
      }
      signal.throwIfAborted();
      if (!token) return;
      if (!rotated) failures++;
      while (true) {
        signal.throwIfAborted();
        if (Date.now() - lastReceived > 75_000) throw new Error("连接中断：自动续传未能恢复，已保留收到的内容。请恢复网络后重跑。");
        if (failures) await new Promise<void>((resolve, reject) => {
          const abort = () => { clearTimeout(timer); reject(signal.reason); };
          const timer = setTimeout(() => { signal.removeEventListener("abort", abort); resolve(); }, Math.min(failures * 1000, 5000));
          signal.addEventListener("abort", abort, { once: true });
        });
        const connection = new AbortController();
        const headersTimeout = setTimeout(() => connection.abort(), 10_000);
        try {
          response = await fetch(`/api/chat?after=${after}`, {
            headers: { "X-Chat-Stream": token }, cache: "no-store",
            signal: AbortSignal.any([signal, connection.signal]),
          });
        } catch (error) {
          if (signal.aborted) throw error;
          failures++; continue;
        } finally {
          clearTimeout(headersTimeout);
        }
        if (response.ok && response.body) break;
        if (response.status < 500 && response.status !== 429) throw new Error(await response.text() || `HTTP ${response.status}`);
        await response.body?.cancel();
        failures++;
      }
      yield { type: "diagnostics", diagnostics: { streamResumes: ++resumes } };
    }
  } finally {
    if (token) {
      // Explicit stop also stops the paid upstream; a lost tab expires server-side in 90s.
      void fetch("/api/chat", { method: "DELETE", headers: { "X-Chat-Stream": token }, keepalive: true, signal: AbortSignal.timeout(5000) }).catch(() => {});
    }
  }
}
