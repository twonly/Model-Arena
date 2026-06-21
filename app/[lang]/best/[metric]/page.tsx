import type { Metadata } from "next";
import BestPage from "../../../best/[metric]/page";
import { bestMeta, isBestMetric } from "@/lib/best";
import { normalizeLocale, DEFAULT_LOCALE, localizedPath } from "@/lib/i18n";
import { OG_IMAGE } from "@/lib/brand";

export const revalidate = 300;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string; metric: string }>;
}): Promise<Metadata> {
  const { lang, metric } = await params;
  if (!isBestMetric(metric)) return {};
  const locale = normalizeLocale(lang) ?? DEFAULT_LOCALE;
  const { title, description } = bestMeta(metric, locale);
  const path = `/best/${metric}`;
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
    openGraph: { type: "article", title, description, url: localizedPath(path, locale), images: [OG_IMAGE] },
    twitter: { card: "summary_large_image", title, description, images: [OG_IMAGE.url] },
  };
}

export default BestPage;
