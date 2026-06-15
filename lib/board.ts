/** 全站「最受好评模型」榜：跨所有分享聚合每模型的 👍/👎，按 Wilson 排名 */
import { wilson } from "./voting-core";

export interface BoardEntry {
  model: string; // model_id
  up: number;
  down: number;
  ratio: number;
  wilson: number;
}

interface Row {
  model_id: string | null;
  sentiment: string | null;
}

/** 返回 null = 数据库未配置 */
export async function fetchBoard(): Promise<BoardEntry[] | null> {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;

  const q =
    `${url.replace(/\/+$/, "")}/rest/v1/share_votes` +
    `?model_id=not.is.null&sentiment=not.is.null&select=model_id,sentiment&limit=50000`;
  const res = await fetch(q, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`supabase ${res.status}`);
  const rows = (await res.json()) as Row[];

  const m = new Map<string, { up: number; down: number }>();
  for (const r of rows) {
    if (!r.model_id) continue;
    const e = m.get(r.model_id) ?? { up: 0, down: 0 };
    if (r.sentiment === "up") e.up++;
    else if (r.sentiment === "down") e.down++;
    m.set(r.model_id, e);
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
