import Link from "next/link";
import { ShareView } from "@/components/ShareView";
import { JsonLd } from "@/components/JsonLd";
import { BRAND } from "@/lib/brand";
import type { ShareSnapshot } from "@/lib/share";

export const dynamic = "force-dynamic";

type FetchResult =
  | { state: "ok"; snapshot: ShareSnapshot }
  | { state: "closed" } // 作者已关闭
  | { state: "missing" }; // 不存在/无效

async function fetchShare(id: string): Promise<FetchResult> {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return { state: "missing" };
  // 只接受短 ID 字符集，避免注入
  if (!/^[0-9A-Za-z]{6,16}$/.test(id)) return { state: "missing" };
  const res = await fetch(
    `${url.replace(/\/+$/, "")}/rest/v1/shares?id=eq.${id}&select=payload,disabled`,
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

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const r = await fetchShare(id).catch(() => ({ state: "missing" }) as FetchResult);
  const snap = r.state === "ok" ? r.snapshot : null;
  const title = snap?.title?.trim() || "模型速度对比";
  const description = snap
    ? `${snap.results.length} 个大模型实测对比 · ${snap.prompt.slice(0, 50)}`
    : "大模型速度对比分享";
  return {
    title,
    description,
    alternates: { canonical: `/r/${id}` },
    openGraph: { type: "article", title, description, url: `/r/${id}` },
  };
}

function NoticePage({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  return (
    <main className="mx-auto flex min-h-[70vh] max-w-md flex-col items-center justify-center px-5 text-center">
      <div className="text-[40px]">{icon}</div>
      <h1 className="mt-3 text-[18px] font-bold">{title}</h1>
      <p className="mt-2 text-[13px] text-faint">{desc}</p>
      <Link
        href="/arena"
        className="mt-5 rounded-md bg-ink px-5 py-2 text-[13px] font-bold text-paper"
      >
        去竞速场 ▶
      </Link>
    </main>
  );
}

export default async function SharePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const r = await fetchShare(id).catch(() => ({ state: "missing" }) as FetchResult);

  if (r.state === "closed") {
    return (
      <NoticePage
        icon="🔒"
        title="该分享已被作者关闭"
        desc="作者已停止公开这次对比结果。如有需要可联系作者，或自己跑一轮新的对比。"
      />
    );
  }
  if (r.state !== "ok") {
    return (
      <NoticePage
        icon="🔍"
        title="分享不存在或已失效"
        desc="这个分享链接无法打开，可能是 ID 有误、已被删除，或分享功能尚未启用。"
      />
    );
  }

  const url = `${BRAND.url}/r/${id}`;
  const shareJsonLd = buildShareJsonLd(r.snapshot, id, url);
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: BRAND.zh, item: BRAND.url },
      { "@type": "ListItem", position: 2, name: "竞速场", item: `${BRAND.url}/arena` },
      { "@type": "ListItem", position: 3, name: r.snapshot.title || "分享快照", item: url },
    ],
  };

  return (
    <>
      <JsonLd data={shareJsonLd} />
      <JsonLd data={breadcrumbJsonLd} />
      <ShareView snapshot={r.snapshot} shareId={id} />
    </>
  );
}

function buildShareJsonLd(snapshot: ShareSnapshot, id: string, url: string) {
  const title = snapshot.title?.trim() || "模型速度对比";
  const description = snapshot.notes?.trim()
    ? `${snapshot.notes.slice(0, 120)}…`
    : `${snapshot.results.length} 个大模型实测速度对比 · ${snapshot.prompt.slice(0, 60)}`;
  const mainEntity = {
    "@type": "ItemList",
    name: title,
    description,
    url,
    numberOfItems: snapshot.results.length,
    itemListElement: snapshot.results
      .slice()
      .sort((a, b) => (a.rank ?? 999) - (b.rank ?? 999))
      .map((r, i) => {
        const m = r.metrics;
        const parts: string[] = [];
        if (m?.ttftMs != null) parts.push(`首Token ${(m.ttftMs / 1000).toFixed(2)}s`);
        if (m?.contentTps != null) parts.push(`输出 ${Math.round(m.contentTps)} tok/s`);
        if (m?.peakTps != null) parts.push(`峰值 ${Math.round(m.peakTps)} tok/s`);
        return {
          "@type": "ListItem",
          position: i + 1,
          name: r.name,
          description: parts.join(" · ") || `模型 ${r.model}`,
        };
      }),
  };
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "TechArticle",
        "@id": `${url}#article`,
        headline: title,
        description,
        url,
        inLanguage: "zh-CN",
        author: { "@type": "Organization", name: BRAND.publisher },
        publisher: { "@type": "Organization", name: BRAND.publisher, url: BRAND.url },
        datePublished: new Date().toISOString(),
        mainEntityOfPage: { "@type": "WebPage", "@id": url },
        isAccessibleForFree: true,
      },
      mainEntity,
    ],
  };
}
