import type { RunDiagnostics } from "@/lib/types";
import { fmtSeconds } from "@/lib/format";

export function TimingDetails({ timing, en }: { timing?: RunDiagnostics; en: boolean }) {
  if (!timing) return null;
  const rows: [string, number | undefined][] = [
    [en ? "Actual wait (client)" : "实际等待（客户端）", timing.clientTtftMs],
    [en ? "Client preparation" : "客户端请求准备", timing.clientPrepareMs],
    [en ? "Proxy preparation" : "本站代理准备", timing.proxyPrepareMs],
    [en ? "Upstream response headers" : "上游响应头到达", timing.upstreamHeadersMs],
    [en ? "Upstream first byte" : "上游首字节到达", timing.upstreamFirstByteMs],
    [en ? "Upstream first token" : "上游首 Token 到达", timing.upstreamTtftMs],
  ];
  return (
    <details className="border-t border-line px-4 py-2 text-[11px] text-faint" data-timing-details>
      <summary className="cursor-pointer select-none">{en ? "Timing details" : "计时详情"}</summary>
      <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1">
        {rows.filter(([, ms]) => ms != null).map(([label, ms]) => (
          <div key={label} className="contents">
            <dt>{label}</dt><dd className="num text-right text-ink">{fmtSeconds(ms)}s</dd>
          </div>
        ))}
        {timing.attempts != null && <>
          <dt>{en ? "Upstream retries" : "上游重试次数"}</dt>
          <dd className="num text-right text-ink">{Math.max(0, timing.attempts - 1)}</dd>
        </>}
      </dl>
      <p className="mt-2 leading-relaxed">{en
        ? "Actual wait uses the client clock. Upstream timings start after proxy preparation and are cumulative; do not add these values. Upstream delay includes network, scheduling, processing and buffering; it does not prove provider queueing."
        : "实际等待使用客户端时钟；上游计时从本站准备完成后开始，各项为累计耗时，不能直接相加。上游等待包含网络、调度、计算及缓冲，不能仅凭这些数值断定厂商排队。"}</p>
      <details className="mt-2">
        <summary className="cursor-pointer">{en ? "Diagnostic receipt" : "诊断记录"}</summary>
        {timing.providerTiming && <p className="mt-1">{en
          ? "Provider timing fields are reported as-is; their definitions are not verified."
          : "厂商内部耗时字段按原值保留，具体口径尚未验证。"}</p>}
        <pre tabIndex={0} className="mt-1 max-h-64 overflow-auto whitespace-pre-wrap break-all text-[10px] select-text">{JSON.stringify(timing, null, 2)}</pre>
      </details>
    </details>
  );
}
