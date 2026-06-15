/** 全站「最受好评模型」榜：跨所有分享聚合每模型的 👍/👎，按 Wilson 排名 */
import { wilson } from "./voting-core";

export interface BoardEntry {
  model: string; // canonical display name
  up: number;
  down: number;
  ratio: number;
  wilson: number;
}

interface Row {
  model_id: string | null;
  sentiment: string | null;
}

interface RegistryRow {
  id: number;
  raw_id: string;
  display_name: string | null;
  hidden: boolean;
  canonical_id: number | null;
}

/** 返回 null = 数据库未配置 */
export async function fetchBoard(): Promise<BoardEntry[] | null> {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;

  const base = url.replace(/\/+$/, "");
  const headers = { apikey: key, Authorization: `Bearer ${key}` };

  const [votesRes, registryRes] = await Promise.all([
    fetch(
      `${base}/rest/v1/share_votes` +
        `?model_id=not.is.null&sentiment=not.is.null&select=model_id,sentiment&limit=50000`,
      { headers, cache: "no-store" }
    ),
    fetch(`${base}/rest/v1/models?select=id,raw_id,display_name,hidden,canonical_id`, {
      headers,
      cache: "no-store",
    }),
  ]);
  if (!votesRes.ok) throw new Error(`supabase ${votesRes.status}`);
  if (!registryRes.ok) throw new Error(`models ${registryRes.status}`);

  const rows = (await votesRes.json()) as Row[];
  const registry = (await registryRes.json()) as RegistryRow[];

  const regMap = new Map<string, RegistryRow>();
  for (const r of registry) regMap.set(r.raw_id, r);
  const idMap = new Map<number, RegistryRow>();
  for (const r of registry) idMap.set(r.id, r);

  function resolve(rawModel: string): { display: string; hidden: boolean } {
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

  const m = new Map<string, { up: number; down: number }>();
  for (const r of rows) {
    if (!r.model_id) continue;
    const resolved = resolve(r.model_id);
    if (resolved.hidden) continue;
    const e = m.get(resolved.display) ?? { up: 0, down: 0 };
    if (r.sentiment === "up") e.up++;
    else if (r.sentiment === "down") e.down++;
    m.set(resolved.display, e);
  }
  return [...m.entries()]
    .map(([model, e]) => {
      const total = e.up + e.down;
      return {
        model,
        up: e.up,
        down: e.down,
        ratio: total > 0 ? e.up / total : 0,
        wilson: wilson(e.up, total),
      };
    })
    .sort((a, b) => b.wilson - a.wilson);
}
