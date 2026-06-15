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

interface RegistryRow {
  id: number;
  raw_id: string;
  display_name: string | null;
  hidden: boolean;
  canonical_id: number | null;
}

interface CanonicalName {
  display: string;
  hidden: boolean;
}

/** 把模型 raw id 转成 URL 安全的 slug，用于 /model/[slug] 永久页（GEO 长尾） */
export function modelSlug(model: string): string {
  return model
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
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

  const base = url.replace(/\/+$/, "");
  const headers = { apikey: key, Authorization: `Bearer ${key}` };

  // 并行拉 metrics 和 models registry
  const [metricsRes, registryRes] = await Promise.all([
    fetch(
      `${base}/rest/v1/run_metrics` +
        `?select=model,provider,content_tps,avg_tps,ttft_ms,peak_tps,output_tokens,has_error,created_at` +
        `&has_error=eq.false&order=created_at.desc&limit=10000`,
      { headers, next: { revalidate: 300 } }
    ),
    fetch(`${base}/rest/v1/models?select=id,raw_id,display_name,hidden,canonical_id`, {
      headers,
      next: { revalidate: 60 },
    }),
  ]);
  if (!metricsRes.ok) throw new Error(`supabase ${metricsRes.status}`);
  if (!registryRes.ok) throw new Error(`models ${registryRes.status}`);

  const rows = (await metricsRes.json()) as RawRow[];
  const registry = (await registryRes.json()) as RegistryRow[];

  // 构建 raw_id -> canonical display name / hidden 的映射
  const regMap = new Map<string, RegistryRow>();
  for (const r of registry) regMap.set(r.raw_id, r);
  const idMap = new Map<number, RegistryRow>();
  for (const r of registry) idMap.set(r.id, r);

  function resolve(rawModel: string): CanonicalName {
    const r = regMap.get(rawModel);
    if (!r) return { display: rawModel, hidden: false };
    if (r.hidden) return { display: r.display_name || rawModel, hidden: true };
    if (r.canonical_id) {
      const canonical = idMap.get(r.canonical_id);
      if (canonical) {
        return {
          display: canonical.display_name || canonical.raw_id,
          hidden: canonical.hidden,
        };
      }
    }
    return { display: r.display_name || rawModel, hidden: r.hidden };
  }

  const groups = new Map<string, RawRow[]>();
  for (const r of rows) {
    if (!r.model || !r.provider) continue;
    const resolved = resolve(r.model);
    if (resolved.hidden) continue;
    const k = `${resolved.display}__${r.provider}`;
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
