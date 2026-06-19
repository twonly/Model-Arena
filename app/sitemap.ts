import type { MetadataRoute } from "next";
import { BRAND } from "@/lib/brand";
import { fetchModelStats, modelSlug, comparePairs } from "@/lib/stats";
import { LOCALES, localizedPath, type Locale } from "@/lib/i18n";

// 让 sitemap 随排行榜刷新（模型页是动态的）
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = BRAND.url;
  const now = new Date();

  const localizedEntry = (
    pathname: string,
    locale: Locale,
    rest: Omit<MetadataRoute.Sitemap[number], "url" | "alternates">
  ): MetadataRoute.Sitemap[number] => ({
    url: `${base}${localizedPath(pathname, locale)}`,
    alternates: {
      languages: {
        "zh-CN": `${base}${localizedPath(pathname, "zh-CN")}`,
        en: `${base}${localizedPath(pathname, "en")}`,
      },
    },
    ...rest,
  });

  const allLocales = (
    pathname: string,
    rest: Omit<MetadataRoute.Sitemap[number], "url" | "alternates">
  ) => LOCALES.map((locale) => localizedEntry(pathname, locale, rest));

  const staticRoutes: MetadataRoute.Sitemap = [
    ...allLocales("/", { lastModified: now, changeFrequency: "weekly", priority: 1 }),
    ...allLocales("/arena", { lastModified: now, changeFrequency: "weekly", priority: 0.9 }),
    ...allLocales("/stats", { lastModified: now, changeFrequency: "daily", priority: 0.8 }),
    ...allLocales("/board", { lastModified: now, changeFrequency: "daily", priority: 0.8 }),
    ...allLocales("/templates", { lastModified: now, changeFrequency: "weekly", priority: 0.8 }),
    ...allLocales("/invite", { lastModified: now, changeFrequency: "monthly", priority: 0.7 }),
    ...allLocales("/method", { lastModified: now, changeFrequency: "monthly", priority: 0.6 }),
    ...allLocales("/pricing", { lastModified: now, changeFrequency: "weekly", priority: 0.8 }),
  ];

  // 每个上榜模型一个永久页（长尾「X 速度」），以及前 8 名两两对比页（高意图「X vs Y」）
  let dynamicRoutes: MetadataRoute.Sitemap = [];
  try {
    const stats = await fetchModelStats();
    if (stats?.length) {
      const seen = new Set<string>();
      const modelRoutes = stats
        .map((s) => modelSlug(s.model))
        .filter((slug) => slug && !seen.has(slug) && (seen.add(slug), true))
        .flatMap((slug) =>
          allLocales(`/model/${slug}`, {
            lastModified: now,
            changeFrequency: "daily" as const,
            priority: 0.7,
          })
        );
      const compareRoutes = comparePairs(stats, 8).flatMap(([a, b]) =>
        allLocales(`/compare/${a}-vs-${b}`, {
          lastModified: now,
          changeFrequency: "daily" as const,
          priority: 0.6,
        })
      );
      dynamicRoutes = [...modelRoutes, ...compareRoutes];
    }
  } catch {
    // 遥测未配置或拉取失败：仅返回静态路由
  }

  return [...staticRoutes, ...dynamicRoutes];
}
