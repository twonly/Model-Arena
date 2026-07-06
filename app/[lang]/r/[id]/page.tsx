import Link from "next/link";
import { ShareView } from "@/components/ShareView";
import { JsonLd } from "@/components/JsonLd";
import { BRAND, OG_IMAGE } from "@/lib/brand";
import type { ShareSnapshot } from "@/lib/share";
import { fetchShareSnapshot, type ShareFetchResult } from "@/lib/share-server";
import {
  DEFAULT_LOCALE,
  localeToLanguage,
  localeToOg,
  localizedPath,
  normalizeLocale,
  type Locale,
} from "@/lib/i18n";
import { getMessages } from "@/lib/i18n-messages";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string; lang?: string }>;
}) {
  const { id, lang } = await params;
  const locale = normalizeLocale(lang) ?? DEFAULT_LOCALE;
  const messages = getMessages(locale);
  const r = await fetchShareSnapshot(id).catch(
    () => ({ state: "missing" }) as ShareFetchResult
  );
  const snap = r.state === "ok" ? r.snapshot : null;
  const title = snap?.title?.trim() || messages.metadata.share.fallbackTitle;
  const description = snap
    ? locale === "en"
      ? `${snap.results.length} model comparison · ${snap.prompt.slice(0, 50)}`
      : `${snap.results.length} 个大模型实测对比 · ${snap.prompt.slice(0, 50)}`
    : messages.metadata.share.description;
  const canonical = localizedPath(`/r/${id}`, locale);
  return {
    title,
    description,
    alternates: {
      canonical,
      languages: {
        "zh-CN": localizedPath(`/r/${id}`, "zh-CN"),
        en: localizedPath(`/r/${id}`, "en"),
        "x-default": localizedPath(`/r/${id}`, "zh-CN"),
      },
    },
    openGraph: {
      type: "article",
      title,
      description,
      url: canonical,
      locale: localeToOg(locale),
      images: [OG_IMAGE],
    },
    twitter: { card: "summary_large_image", title, description, images: [OG_IMAGE.url] },
  };
}

function NoticePage({
  icon,
  title,
  desc,
  locale,
}: {
  icon: string;
  title: string;
  desc: string;
  locale: Locale;
}) {
  const messages = getMessages(locale);
  return (
    <main className="mx-auto flex min-h-[70vh] max-w-md flex-col items-center justify-center px-5 text-center">
      <div className="text-[40px]">{icon}</div>
      <h1 className="mt-3 text-[18px] font-bold">{title}</h1>
      <p className="mt-2 text-[13px] text-faint">{desc}</p>
      <Link
        href={localizedPath("/arena", locale)}
        className="mt-5 rounded-md bg-ink px-5 py-2 text-[13px] font-bold text-paper"
      >
        {messages.common.testNow} ▶
      </Link>
    </main>
  );
}

export default async function SharePage({
  params,
}: {
  params: Promise<{ id: string; lang?: string }>;
}) {
  const { id, lang } = await params;
  const locale = normalizeLocale(lang) ?? DEFAULT_LOCALE;
  const messages = getMessages(locale);
  const r = await fetchShareSnapshot(id).catch(
    () => ({ state: "missing" }) as ShareFetchResult
  );

  if (r.state === "closed") {
    return (
      <NoticePage
        icon="🔒"
        locale={locale}
        title={locale === "en" ? messages.metadata.share.disabledTitle : "该分享已被作者关闭"}
        desc={
          locale === "en"
            ? "The author has stopped publishing this comparison. You can contact the author or run a new comparison yourself."
            : "作者已停止公开这次对比结果。如有需要可联系作者，或自己跑一轮新的对比。"
        }
      />
    );
  }
  if (r.state !== "ok") {
    return (
      <NoticePage
        icon="🔍"
        locale={locale}
        title={messages.metadata.share.missingTitle}
        desc={
          locale === "en"
            ? "This share link cannot be opened. The ID may be wrong, deleted, or sharing may not be enabled."
            : "这个分享链接无法打开，可能是 ID 有误、已被删除，或分享功能尚未启用。"
        }
      />
    );
  }

  const url = `${BRAND.url}${localizedPath(`/r/${id}`, locale)}`;
  const shareJsonLd = buildShareJsonLd(r.snapshot, id, url, locale);
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: BRAND.en, item: BRAND.url },
      { "@type": "ListItem", position: 2, name: messages.common.arena, item: `${BRAND.url}${localizedPath("/arena", locale)}` },
      {
        "@type": "ListItem",
        position: 3,
        name: r.snapshot.title || (locale === "en" ? "Share snapshot" : "分享快照"),
        item: url,
      },
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

function buildShareJsonLd(snapshot: ShareSnapshot, id: string, url: string, locale: Locale) {
  const title =
    snapshot.title?.trim() ||
    (locale === "en" ? "Model speed comparison" : "模型速度对比");
  const description = snapshot.notes?.trim()
    ? `${snapshot.notes.slice(0, 120)}…`
    : locale === "en"
      ? `${snapshot.results.length} model speed comparison · ${snapshot.prompt.slice(0, 60)}`
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
        if (m?.ttftMs != null)
          parts.push(
            locale === "en"
              ? `TTFT ${(m.ttftMs / 1000).toFixed(2)}s`
              : `首Token ${(m.ttftMs / 1000).toFixed(2)}s`
          );
        if (m?.contentTps != null)
          parts.push(
            locale === "en"
              ? `Output ${Math.round(m.contentTps)} tok/s`
              : `输出 ${Math.round(m.contentTps)} tok/s`
          );
        if (m?.peakTps != null)
          parts.push(
            locale === "en"
              ? `Peak ${Math.round(m.peakTps)} tok/s`
              : `峰值 ${Math.round(m.peakTps)} tok/s`
          );
        return {
          "@type": "ListItem",
          position: i + 1,
          name: r.name,
          description: parts.join(" · ") || (locale === "en" ? `Model ${r.model}` : `模型 ${r.model}`),
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
        inLanguage: localeToLanguage(locale),
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
