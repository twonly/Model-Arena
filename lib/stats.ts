/** 排行榜聚合：从 Supabase 拉取近期 run_metrics 并按「模型 + 供应商」汇总 */

export interface ModelStat {
  model: string;
  provider: string;
  samples: number;
  avgContentTps: number;
  medianContentTps: number;
  avgTtftMs: number;
  maxPeakTps: number;
  avgOutputTokens: number;
  lastAt: string;
}

interface RawRow {
  model: string;
  provider: string;
  content_tps: number | null;
  avg_tps: number | null;
  ttft_ms: number | null;
  peak_tps: number | null;
  output_tokens: number | null;
  has_error: boolean | null;
  created_at: string;
}

function median(xs: number[]): number {
  if (!xs.length) return 0;
  const s = [...xs].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

const avg = (xs: number[]) =>
  xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0;

/** 返回 null 表示遥测未配置（无 Supabase 环境变量） */
export async function fetchModelStats(
  minSamples = 1
): Promise<ModelStat[] | null> {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;

  // 拉最近 10000 条成功记录（按时间倒序），在内存里聚合
  const q =
    `${url.replace(/\/+$/, "")}/rest/v1/run_metrics` +
    `?select=model,provider,content_tps,avg_tps,ttft_ms,peak_tps,output_tokens,has_error,created_at` +
    `&has_error=eq.false&order=created_at.desc&limit=10000`;
  const res = await fetch(q, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
    next: { revalidate: 300 }, // 5 分钟缓存，避免每次访问都打库
  });
  if (!res.ok) throw new Error(`supabase ${res.status}`);
  const rows = (await res.json()) as RawRow[];

  const groups = new Map<string, RawRow[]>();
  for (const r of rows) {
    if (!r.model || !r.provider) continue;
    const k = `${r.model}__${r.provider}`;
    (groups.get(k) ?? groups.set(k, []).get(k)!).push(r);
  }

  const stats: ModelStat[] = [];
  for (const [, rs] of groups) {
    const tps = rs
      .map((r) => r.content_tps ?? r.avg_tps)
      .filter((v): v is number => v != null && v > 0);
    if (tps.length < minSamples) continue;
    const ttft = rs.map((r) => r.ttft_ms).filter((v): v is number => v != null && v > 0);
    const peaks = rs.map((r) => r.peak_tps).filter((v): v is number => v != null && v > 0);
    const outs = rs
      .map((r) => r.output_tokens)
      .filter((v): v is number => v != null && v > 0);
    stats.push({
      model: rs[0].model,
      provider: rs[0].provider,
      samples: rs.length,
      avgContentTps: avg(tps),
      medianContentTps: median(tps),
      avgTtftMs: avg(ttft),
      maxPeakTps: peaks.length ? Math.max(...peaks) : 0,
      avgOutputTokens: avg(outs),
      lastAt: rs[0].created_at,
    });
  }
  // 默认按中位输出速度排序
  stats.sort((a, b) => b.medianContentTps - a.medianContentTps);
  return stats;
}
