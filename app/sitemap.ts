import type { MetadataRoute } from "next";
import { BRAND } from "@/lib/brand";
import { fetchModelStats, modelSlug, comparePairs, type ModelStat } from "@/lib/stats";
import { BEST_METRICS } from "@/lib/best";
import { PRELAUNCH_MODELS } from "@/lib/seo-models";
import { LOCALES, localizedPath, type Locale } from "@/lib/i18n";

// 让 sitemap 随排行榜刷新（模型页是动态的）
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = BRAND.url;

  let stats: ModelStat[] = [];
  try {
    stats = (await fetchModelStats()) ?? [];
  } catch {
    // 遥测未配置或拉取失败：仅返回静态路由
  }

  // 每个模型 slug 的真实最后更新时间（最近一次测速样本）。
  // lastmod 必须可信：以前所有 URL 每小时统一盖当前时间戳，
  // Google 会判定 lastmod 不可靠而降低抓取优先级（「已发现 - 尚未编入索引」的诱因之一）。
  const slugLastMod = new Map<string, Date>();
  for (const s of stats) {
    const slug = modelSlug(s.model);
    const at = new Date(s.lastAt);
    if (!slug || Number.isNaN(+at)) continue;
    const prev = slugLastMod.get(slug);
    if (!prev || at > prev) slugLastMod.set(slug, at);
  }
  const dataLastMod = slugLastMod.size
    ? new Date(Math.max(...[...slugLastMod.values()].map(Number)))
    : undefined;
  // 榜单类页面随最新样本变化；营销页没有可靠更新时间，宁可省略也不造假
  const dataMod = dataLastMod ? { lastModified: dataLastMod } : {};

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
        "x-default": `${base}${localizedPath(pathname, "zh-CN")}`,
      },
    },
    ...rest,
  });

  const allLocales = (
    pathname: string,
    rest: Omit<MetadataRoute.Sitemap[number], "url" | "alternates">
  ) => LOCALES.map((locale) => localizedEntry(pathname, locale, rest));

  const staticRoutes: MetadataRoute.Sitemap = [
    ...allLocales("/", { changeFrequency: "weekly", priority: 1 }),
    ...allLocales("/arena", { changeFrequency: "weekly", priority: 0.9 }),
    ...allLocales("/stats", { ...dataMod, changeFrequency: "daily", priority: 0.8 }),
    ...allLocales("/board", { ...dataMod, changeFrequency: "daily", priority: 0.8 }),
    ...allLocales("/gallery", { changeFrequency: "daily", priority: 0.6 }),
    ...allLocales("/templates", { changeFrequency: "weekly", priority: 0.8 }),
    ...allLocales("/invite", { changeFrequency: "monthly", priority: 0.7 }),
    ...allLocales("/method", { changeFrequency: "monthly", priority: 0.6 }),
    ...allLocales("/pricing", { changeFrequency: "weekly", priority: 0.8 }),
    ...BEST_METRICS.flatMap((m) =>
      allLocales(`/best/${m}`, { ...dataMod, changeFrequency: "daily", priority: 0.8 })
    ),
  ];

  // 每个上榜模型一个永久页（长尾「X 速度」），以及前 8 名两两对比页（高意图「X vs Y」）
  let dynamicRoutes: MetadataRoute.Sitemap = [];
  if (stats.length) {
    const modelRoutes = [...slugLastMod.entries()].flatMap(([slug, lastModified]) =>
      allLocales(`/model/${slug}`, {
        lastModified,
        changeFrequency: "daily" as const,
        priority: 0.7,
      })
    );
    const compareRoutes = comparePairs(stats, 8).flatMap(([a, b]) => {
      const atA = slugLastMod.get(a);
      const atB = slugLastMod.get(b);
      const at = atA && atB ? (atA > atB ? atA : atB) : (atA ?? atB);
      return allLocales(`/compare/${a}-vs-${b}`, {
        ...(at ? { lastModified: at } : {}),
        changeFrequency: "daily" as const,
        priority: 0.6,
      });
    });
    dynamicRoutes = [...modelRoutes, ...compareRoutes];
  }

  // 精选待实测模型的占位页（发布日即入 sitemap）；已有实测数据的 slug 交给上面的动态路由，避免重复
  const prelaunchRoutes = PRELAUNCH_MODELS.filter((p) => !slugLastMod.has(p.slug)).flatMap((p) =>
    allLocales(`/model/${p.slug}`, { changeFrequency: "daily", priority: 0.7 })
  );

  return [...staticRoutes, ...dynamicRoutes, ...prelaunchRoutes];
}
