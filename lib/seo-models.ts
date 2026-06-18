import {
  bestStatForSlug,
  fetchModelStats,
  modelSlug,
  type ModelStat,
} from "./stats";
import { DEFAULT_LOCALE, type Locale } from "./i18n";

export interface ComparePair {
  a: ModelStat;
  b: ModelStat;
  canonical: string;
}

export function fmtMetric(n: number, digits = 0): string {
  if (!Number.isFinite(n) || n <= 0) return "—";
  return n.toLocaleString("en-US", { maximumFractionDigits: digits });
}

export function fmtSeconds(ms: number): string {
  return ms > 0 ? `${(ms / 1000).toFixed(2)}s` : "—";
}

export async function loadModelStatsForSlug(
  slug: string
): Promise<ModelStat[] | null> {
  let stats: ModelStat[] | null = null;
  try {
    stats = await fetchModelStats();
  } catch {
    return null;
  }
  if (!stats) return null;
  const hit = stats.filter((s) => modelSlug(s.model) === slug);
  return hit.length ? hit : null;
}

export async function topModelAlternatives(
  slug: string,
  limit = 4
): Promise<{ slug: string; name: string }[]> {
  let stats: ModelStat[] | null = null;
  try {
    stats = await fetchModelStats();
  } catch {
    return [];
  }
  if (!stats) return [];
  const seen = new Set<string>();
  const out: { slug: string; name: string }[] = [];
  for (const s of stats) {
    const sl = modelSlug(s.model);
    if (sl === slug || seen.has(sl)) continue;
    seen.add(sl);
    out.push({ slug: sl, name: s.model });
    if (out.length >= limit) break;
  }
  return out;
}

export async function loadComparePair(pairParam: string): Promise<ComparePair | null> {
  const parts = pairParam.split("-vs-");
  if (parts.length !== 2 || !parts[0] || !parts[1]) return null;
  let stats: ModelStat[] | null = null;
  try {
    stats = await fetchModelStats();
  } catch {
    return null;
  }
  if (!stats) return null;
  const a = bestStatForSlug(stats, parts[0]);
  const b = bestStatForSlug(stats, parts[1]);
  if (!a || !b || modelSlug(a.model) === modelSlug(b.model)) return null;
  const canonical = [modelSlug(a.model), modelSlug(b.model)].sort().join("-vs-");
  return { a, b, canonical };
}

export function compareVerdict(
  a: ModelStat,
  b: ModelStat,
  locale: Locale = DEFAULT_LOCALE
): string {
  if (locale === "en") {
    const out =
      a.medianContentTps === b.medianContentTps
        ? `Both models have similar output speed (about ${fmtMetric(a.medianContentTps)} tok/s)`
        : a.medianContentTps > b.medianContentTps
          ? `${a.model} has faster output (median ${fmtMetric(a.medianContentTps)} vs ${fmtMetric(b.medianContentTps)} tok/s)`
          : `${b.model} has faster output (median ${fmtMetric(b.medianContentTps)} vs ${fmtMetric(a.medianContentTps)} tok/s)`;
    let ttft = "";
    if (a.avgTtftMs > 0 && b.avgTtftMs > 0) {
      ttft =
        a.avgTtftMs < b.avgTtftMs
          ? `; ${a.model} has faster TTFT (${fmtSeconds(a.avgTtftMs)} vs ${fmtSeconds(b.avgTtftMs)})`
          : a.avgTtftMs > b.avgTtftMs
            ? `; ${b.model} has faster TTFT (${fmtSeconds(b.avgTtftMs)} vs ${fmtSeconds(a.avgTtftMs)})`
            : "";
    }
    return out + ttft + ".";
  }
  const out =
    a.medianContentTps === b.medianContentTps
      ? `两者输出速度接近（约 ${fmtMetric(a.medianContentTps)} tok/s）`
      : a.medianContentTps > b.medianContentTps
        ? `${a.model} 输出更快（中位 ${fmtMetric(a.medianContentTps)} vs ${fmtMetric(b.medianContentTps)} tok/s）`
        : `${b.model} 输出更快（中位 ${fmtMetric(b.medianContentTps)} vs ${fmtMetric(a.medianContentTps)} tok/s）`;
  let ttft = "";
  if (a.avgTtftMs > 0 && b.avgTtftMs > 0) {
    ttft =
      a.avgTtftMs < b.avgTtftMs
        ? `；${a.model} 首响更快（${fmtSeconds(a.avgTtftMs)} vs ${fmtSeconds(b.avgTtftMs)}）`
        : a.avgTtftMs > b.avgTtftMs
          ? `；${b.model} 首响更快（${fmtSeconds(b.avgTtftMs)} vs ${fmtSeconds(a.avgTtftMs)}）`
          : "";
  }
  return out + ttft + "。";
}
