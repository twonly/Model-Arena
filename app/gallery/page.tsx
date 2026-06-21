import Link from "next/link";
import { Credit } from "@/components/Credit";
import { Logo } from "@/components/Logo";
import { JsonLd } from "@/components/JsonLd";
import { GalleryGrid } from "@/components/GalleryGrid";
import { BRAND } from "@/lib/brand";
import { getMessages } from "@/lib/i18n-messages";
import { getRequestLocale } from "@/lib/i18n-server";
import { localeToLanguage, localizedPath } from "@/lib/i18n";
import { fetchRecentVisualShares } from "@/lib/share-server";

export const revalidate = 300;

export const metadata = {
  title: "AI 视觉基准画廊 - 各大模型生成的 SVG / Canvas / 3D 作品",
  description:
    "看各大模型在同一道视觉题上的真实产出：鹈鹕骑车 SVG、旋转六边形弹球、Three.js 3D 场景等，来自用户公开分享，点开可复查 Prompt 与对比。",
  alternates: { canonical: "/gallery" },
};

export default async function GalleryPage() {
  const locale = await getRequestLocale();
  const isZh = locale === "zh-CN";
  const messages = getMessages(locale);
  const h = (p: string) => localizedPath(p, locale);
  const items = await fetchRecentVisualShares(18);
  const url = `${BRAND.url}${h("/gallery")}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: isZh ? "AI 视觉基准画廊" : "AI visual benchmark gallery",
    description: metadata.description,
    url,
    inLanguage: localeToLanguage(locale),
    isAccessibleForFree: true,
    publisher: { "@id": `${BRAND.url}/#org` },
  };

  return (
    <main className="mx-auto max-w-5xl px-5 py-8">
      <JsonLd data={jsonLd} />

      <nav className="mb-6 flex items-center justify-between">
        <Logo withText />
        <Link href={h("/arena")} className="rounded-md bg-ink px-3.5 py-1.5 text-[13px] font-bold text-paper">
          {messages.common.testNow} ▶
        </Link>
      </nav>

      <header>
        <h1 className="text-[28px] font-black" style={{ fontFamily: "var(--font-title)" }}>
          {isZh ? "AI 视觉基准画廊" : "AI Visual Benchmark Gallery"}
        </h1>
        <p className="mt-2 text-[13.5px] text-faint">
          {isZh
            ? "各大模型在视觉题上的真实产出——鹈鹕骑车 SVG、旋转六边形弹球、Three.js 3D 场景等，来自用户公开分享，点开可复查完整对比。"
            : "Real visual outputs from different models — pelican-on-a-bike SVGs, bouncing-ball-in-hexagon, Three.js 3D scenes — from public shares. Click any to see the full comparison."}
        </p>
      </header>

      {items.length === 0 ? (
        <div className="mt-6 rounded-lg border border-dashed border-line bg-card/60 px-6 py-14 text-center">
          <div className="text-[15px] font-semibold">{isZh ? "画廊还在攒作品" : "Gallery is filling up"}</div>
          <div className="mt-1.5 text-[12.5px] text-faint">
            {isZh
              ? "去竞速场跑一道视觉题（如六边形弹球 / 3D 水晶），分享后就会出现在这里。"
              : "Run a visual prompt in the arena (hexagon ball / 3D crystal) and share it to appear here."}
          </div>
          <Link href={h("/arena")} className="mt-4 inline-block rounded-md bg-ink px-5 py-2 text-[13px] font-bold text-paper">
            {isZh ? "去画一个" : "Make one"} ▶
          </Link>
        </div>
      ) : (
        <GalleryGrid items={items} locale={locale} />
      )}

      <div className="mt-7 flex flex-wrap gap-2 text-[13px]">
        <Link href={h("/templates")} className="rounded-md border border-line px-4 py-2 text-faint hover:text-ink">
          {isZh ? "视觉评测模板" : "Visual templates"} →
        </Link>
        <Link href={h("/arena")} className="rounded-md bg-ink px-4 py-2 font-bold text-paper">
          {isZh ? "自己生成一个" : "Generate your own"} ▶
        </Link>
      </div>

      <footer className="mt-8 flex justify-center">
        <Credit compact />
      </footer>
    </main>
  );
}
