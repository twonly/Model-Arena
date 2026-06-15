import type { MetadataRoute } from "next";
import { BRAND } from "@/lib/brand";
import { fetchModelStats, modelSlug } from "@/lib/stats";

// 让 sitemap 随排行榜刷新（模型页是动态的）
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = BRAND.url;
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${base}/`, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/arena`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/stats`, lastModified: now, changeFrequency: "daily", priority: 0.8 },
    { url: `${base}/board`, lastModified: now, changeFrequency: "daily", priority: 0.8 },
    { url: `${base}/method`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
  ];

  // 每个上榜模型一个永久页（长尾「X 速度」查询）；去重 slug
  let modelRoutes: MetadataRoute.Sitemap = [];
  try {
    const stats = await fetchModelStats();
    if (stats?.length) {
      const seen = new Set<string>();
      modelRoutes = stats
        .map((s) => modelSlug(s.model))
        .filter((slug) => slug && !seen.has(slug) && (seen.add(slug), true))
        .map((slug) => ({
          url: `${base}/model/${slug}`,
          lastModified: now,
          changeFrequency: "daily" as const,
          priority: 0.7,
        }));
    }
  } catch {
    // 遥测未配置或拉取失败：仅返回静态路由
  }

  return [...staticRoutes, ...modelRoutes];
}
