import type { ShareSnapshot } from "./share";
import { extractSvgs, extractHtmlDoc, svgDataUrl } from "./svg.ts";

export type ShareFetchResult =
  | { state: "ok"; snapshot: ShareSnapshot }
  | { state: "closed" }
  | { state: "missing" };

function base(url: string): string {
  return url.replace(/\/+$/, "");
}

export async function fetchShareSnapshot(id: string): Promise<ShareFetchResult> {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return { state: "missing" };
  if (!/^[0-9A-Za-z]{6,16}$/.test(id)) return { state: "missing" };
  const res = await fetch(
    `${base(url)}/rest/v1/shares?id=eq.${id}&select=payload,disabled`,
    {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
      cache: "no-store",
    }
  );
  if (!res.ok) return { state: "missing" };
  const rows = (await res.json()) as {
    payload: ShareSnapshot;
    disabled?: boolean | null;
  }[];
  const row = rows[0];
  if (!row?.payload || row.payload.v !== 1) return { state: "missing" };
  if (row.disabled) return { state: "closed" };
  return { state: "ok", snapshot: row.payload };
}

export interface GalleryItem {
  shareId: string;
  title: string;
  prompt: string;
  model: string;
  name: string;
  kind: "svg" | "html";
  /** SVG：可直接 <img> 的 data url */
  svg?: string;
  /** HTML/Canvas/3D：放进 sandbox iframe 的完整文档 */
  html?: string;
}

/** 从纯文本里抽出第一个可展示的视觉产物（SVG 优先，其次可运行 HTML） */
export function visualFromText(text: string): { kind: "svg"; svg: string } | { kind: "html"; html: string } | null {
  const svgs = extractSvgs(text);
  if (svgs.length) return { kind: "svg", svg: svgDataUrl(svgs[0]) };
  const html = extractHtmlDoc(text);
  if (html) return { kind: "html", html };
  return null;
}

/** 画廊：取最近公开分享里的模型视觉产出（鹈鹕/六边形/3D 等） */
export async function fetchRecentVisualShares(limit = 12): Promise<GalleryItem[]> {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return [];
  const res = await fetch(
    `${base(url)}/rest/v1/shares?disabled=is.false&order=created_at.desc&limit=60&select=id,payload`,
    { headers: { apikey: key, Authorization: `Bearer ${key}` }, next: { revalidate: 300 } }
  );
  if (!res.ok) return [];
  const rows = (await res.json()) as { id: string; payload: ShareSnapshot }[];
  const items: GalleryItem[] = [];
  for (const row of rows) {
    const snap = row.payload;
    if (!snap || snap.v !== 1 || !Array.isArray(snap.results)) continue;
    for (const r of snap.results) {
      if (items.length >= limit) break;
      const v = visualFromText(r.text || "");
      if (!v) continue;
      items.push({
        shareId: row.id,
        title: snap.title || "",
        prompt: snap.prompt || "",
        model: r.model || "",
        name: r.name || r.model || "",
        ...v,
      });
    }
    if (items.length >= limit) break;
  }
  return items;
}
