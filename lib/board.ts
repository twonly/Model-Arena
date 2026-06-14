/** 全站「最受欢迎模型」周榜：聚合所有分享投票的冠军模型 */

export interface BoardEntry {
  model: string; // winner_model（模型 id）
  wins: number; // 夺冠次数（被选为最佳/排第1/打分最高）
  loginWins: number; // 其中登录用户贡献
}

interface Row {
  winner_model: string | null;
  user_id: string | null;
  created_at: string;
}

/** 返回 null = 遥测/数据库未配置 */
export async function fetchBoard(days = 0): Promise<BoardEntry[] | null> {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;

  let q =
    `${url.replace(/\/+$/, "")}/rest/v1/share_votes` +
    `?winner_model=not.is.null&select=winner_model,user_id,created_at&limit=20000`;
  if (days > 0) {
    const since = new Date(Date.now() - days * 86400_000).toISOString();
    q += `&created_at=gte.${since}`;
  }
  const res = await fetch(q, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
    cache: "no-store", // 榜单要实时，不缓存（投票量不大）
  });
  if (!res.ok) throw new Error(`supabase ${res.status}`);
  const rows = (await res.json()) as Row[];

  const m = new Map<string, { wins: number; loginWins: number }>();
  for (const r of rows) {
    if (!r.winner_model) continue;
    const e = m.get(r.winner_model) ?? { wins: 0, loginWins: 0 };
    e.wins++;
    if (r.user_id) e.loginWins++;
    m.set(r.winner_model, e);
  }
  return [...m.entries()]
    .map(([model, e]) => ({ model, ...e }))
    .sort((a, b) => b.wins - a.wins);
}
