import type { Metadata } from "next";
import GalleryPage from "../../gallery/page";
import { normalizeLocale, DEFAULT_LOCALE, localizedPath } from "@/lib/i18n";
import { OG_IMAGE } from "@/lib/brand";

export const revalidate = 300;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  const locale = normalizeLocale(lang) ?? DEFAULT_LOCALE;
  const isZh = locale === "zh-CN";
  const title = isZh
    ? "AI 视觉基准画廊 - 各大模型生成的 SVG / Canvas / 3D 作品"
    : "AI visual benchmark gallery - SVG / Canvas / 3D from top LLMs";
  const description = isZh
    ? "看各大模型在同一道视觉题上的真实产出：鹈鹕骑车 SVG、旋转六边形弹球、Three.js 3D 场景等，来自用户公开分享。"
    : "Real visual outputs from different LLMs on the same prompt: pelican-on-a-bike SVGs, bouncing-ball-in-hexagon, Three.js 3D scenes, from public shares.";
  const path = "/gallery";
  return {
    title,
    description,
    alternates: {
      canonical: localizedPath(path, locale),
      languages: {
        "zh-CN": localizedPath(path, "zh-CN"),
        en: localizedPath(path, "en"),
        "x-default": localizedPath(path, "zh-CN"),
      },
    },
    openGraph: { type: "website", title, description, url: localizedPath(path, locale), images: [OG_IMAGE] },
    twitter: { card: "summary_large_image", title, description, images: [OG_IMAGE.url] },
  };
}

export default GalleryPage;
