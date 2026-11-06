import { publishedReports } from "@/lib/benchmark-server";
import { reportPairs } from "@/lib/benchmark-report";
import type { MetadataRoute } from "next";
import type { CreativeEvaluationData } from "@/components/CreativeEvaluation";
import { BRAND } from "@/lib/brand";
import hy4Release from "@/public/articles/tencent-hy4-release/article.json";
import hy4Creative from "@/public/evaluations/tencent-hy4-creative.json";
import hy4Vision from "@/public/evaluations/tencent-hy4-vision.json";
import {
  fetchModelStats,
  modelSlug,
  comparePairs,
  type ModelStat,
} from "@/lib/stats";
import { BEST_METRICS } from "@/lib/best";
import { PRELAUNCH_MODELS } from "@/lib/seo-models";
import { LOCALES, localizedPath, type Locale } from "@/lib/i18n";
import { FIGURE_FILES as deepseekSuperAgentFigures } from "./[lang]/guides/deepseek-super-agent-diagram/content";
import { FIGURE_FILES as manusRebuildFigures } from "./[lang]/guides/manus-rebuild-manus-report/content";
import { FIGURE_FILES as aaV5Figures } from "./[lang]/guides/aa-intelligence-index-v5-chinese-models/content";
import kimiReview from "@/public/evaluations/kimi-k3-1-pro.json";
import kimiSupplement from "@/public/evaluations/kimi-k3-1-pro-supplement.json";
import kimiRecovery from "@/public/evaluations/kimi-k3-1-pro-resume-20261024.json";
import kimiOfficialExamples from "@/public/evaluations/kimi-k3-1-pro/official-examples.json";
import kimiOfficialX from "@/public/evaluations/kimi-k3-1-pro/official-examples/x-post.json";
import kimiQuotaObservation from "@/public/evaluations/kimi-k3-1-pro/official-examples/quota-observation.json";
import kimiCreative from "@/public/evaluations/kimi-k3-1-pro-creative.json";
import longcatClaudeCode from "@/public/evaluations/longcat-2-5-claude-code.json";
import openTopicCompare from "@/public/evaluations/kimi-vs-minimax-open-topic.json";
import croutonAlphaCreative from "@/public/evaluations/crouton-alpha-creative.json";
import geminiFlashCreative from "@/public/evaluations/gemini-3-8-flash-creative.json";
import geminiArgonCreative from "@/public/evaluations/gemini-4-argon-creative.json";
import longcatReview from "@/public/evaluations/longcat-2-5-20261026.json";
import longcatSupplement from "@/public/evaluations/longcat-2-5-20261026-supplement.json";
import longcatSources from "@/public/evaluations/longcat-2-5/sources.json";
import longcatFrontend from "@/public/evaluations/longcat-2-5-20261026-frontend.json";
import longcatResponses from "@/public/evaluations/longcat-2-5-20261026-responses.json";
import longcatAccounting from "@/public/evaluations/longcat-2-5-20261026-accounting.json";
import longcatRelease from "@/public/evaluations/longcat-2-5-release.json";
import longcatReleaseVisual from "@/public/evaluations/longcat-2-5-release-visual.json";
import dots3Visual from "@/public/evaluations/dots3-note-preview-visual.json";
import dots3Supplement from "@/public/evaluations/dots3-note-preview-supplement.json";
import nemotronCreative from "@/public/evaluations/nemotron-3-5-super-vl-creative.json";
import { reviewPresentation, REVIEW_PRESENTATION_UPDATED_AT } from "@/lib/model-review-presentation";

const creativeData = kimiCreative as CreativeEvaluationData;
const longcatClaudeData = longcatClaudeCode as CreativeEvaluationData;
const croutonAlphaCreativeData = croutonAlphaCreative as CreativeEvaluationData;
const longcatReleaseData = longcatRelease as CreativeEvaluationData;
const nemotronData = nemotronCreative as CreativeEvaluationData;
const hy4CreativeData = hy4Creative as CreativeEvaluationData;

// Railway supplies database credentials at runtime; never freeze a build-time empty report list.
export const dynamic = "force-dynamic";
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
    rest: Omit<MetadataRoute.Sitemap[number], "url" | "alternates">,
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
    ...(reviewPresentation(pathname) ? {
      lastModified: new Date(REVIEW_PRESENTATION_UPDATED_AT),
      images: [...new Set([...(rest.images ?? []), `${base}${reviewPresentation(pathname).brand === "longcat" ? "/articles/longcat-2-5-release/longcat-logo.svg" : `/articles/model-review-brands/${reviewPresentation(pathname).brand}.png`}`])],
    } : {}),
  });

  const allLocales = (
    pathname: string,
    rest: Omit<MetadataRoute.Sitemap[number], "url" | "alternates">,
  ) => LOCALES.map((locale) => localizedEntry(pathname, locale, rest));

  const staticRoutes: MetadataRoute.Sitemap = [
    ...allLocales("/", { changeFrequency: "weekly", priority: 1 }),
    ...allLocales("/arena", { changeFrequency: "weekly", priority: 0.9 }),
    ...allLocales("/stats", {
      ...dataMod,
      changeFrequency: "daily",
      priority: 0.8,
    }),
    ...allLocales("/board", {
      ...dataMod,
      changeFrequency: "daily",
      priority: 0.8,
    }),
    ...allLocales("/gallery", { changeFrequency: "daily", priority: 0.6 }),
    ...allLocales("/templates", { changeFrequency: "weekly", priority: 0.8 }),
    ...allLocales("/invite", { changeFrequency: "monthly", priority: 0.7 }),
    ...allLocales("/method", { changeFrequency: "monthly", priority: 0.6 }),
    ...allLocales("/pricing", { changeFrequency: "weekly", priority: 0.8 }),
    ...allLocales("/providers/orcarouter", {
      lastModified: new Date("2026-09-11T00:00:00Z"),
      changeFrequency: "monthly",
      priority: 0.7,
    }),
    ...["/about", "/contact", "/privacy", "/terms"].flatMap((path) =>
      allLocales(path, {
        lastModified: new Date("2026-09-09T00:00:00Z"),
        changeFrequency: "monthly",
        priority: 0.3,
      }),
    ),
    ...BEST_METRICS.flatMap((m) =>
      allLocales(`/best/${m}`, {
        ...dataMod,
        changeFrequency: "daily",
        priority: 0.8,
      }),
    ),
  ];

  // Only pages backed by published, matched evidence are indexed. Legacy URLs remain accessible.
  const reports = await publishedReports(1000).catch(() => []);
  const published = new Map<string, string>();
  for (const report of reports) {
    const modified = report.models.some((m) => m.model === "stealth/space-bunny-alpha")
      ? "2026-10-20T03:53:35.368Z" : report.publishedAt;
    published.set(`/reports/${report.id}`, modified);
    for (const model of report.models) {
      const key = `/model/${model.slug}`;
      if (!published.has(key)) published.set(key, modified);
    }
    for (const pair of reportPairs(report)) {
      const key = `/compare/${pair.join("-vs-")}`;
      if (!published.has(key)) published.set(key, modified);
    }
  }
  const dynamicRoutes = [...published].flatMap(([path, modified]) =>
    allLocales(path, {
      lastModified: new Date(modified),
      changeFrequency: "weekly",
      priority: 0.7,
    }),
  );
  const sourceProfiles = PRELAUNCH_MODELS.filter(
    (p) => p.sourceUrl && !published.has(`/model/${p.slug}`),
  ).flatMap((p) =>
    allLocales(`/model/${p.slug}`, {
      ...(p.verifiedOn ? { lastModified: new Date(p.verifiedOn) } : {}),
      changeFrequency: "monthly",
      priority: 0.4,
    }),
  );
  return [
    ...staticRoutes,
    ...allLocales("/models", { changeFrequency: "weekly", priority: 0.8 }),
    ...allLocales("/reports", { changeFrequency: "daily", priority: 0.9 }),
    ...allLocales("/guides/nemotron-3-5-super-vl-creative", {
      lastModified: new Date(nemotronData.updatedAt),
      changeFrequency: "monthly",
      priority: 0.8,
      images: [...new Set([
        `${base}${nemotronCreative.modelInformation.officialLogo.path}`,
        ...nemotronCreative.modelInformation.officialFigures.map(figure => `${base}${figure.path}`),
        ...nemotronData.cases.flatMap(item => item.media.flatMap(media => media.type === "image" ? [`${base}${media.path}`] : media.posterPath ? [`${base}${media.posterPath}`] : [])),
      ])],
      videos: nemotronData.cases.flatMap(item => item.media.filter(media => media.type === "video" && media.posterPath).map(media => ({
        title: item.titleEn,
        description: media.captionEn,
        thumbnail_loc: `${base}${media.posterPath}`,
        content_loc: `${base}${media.path}`,
      }))),
    }),
    ...allLocales("/guides/aa-intelligence-index-v5-chinese-models", {
      lastModified: new Date("2026-11-01T13:00:00Z"),
      changeFrequency: "monthly",
      priority: 0.85,
      images: aaV5Figures.map(f => `${base}/guides/aa-intelligence-index-v5-chinese-models/${f}`),
    }),
    ...allLocales("/guides/manus-rebuild-manus-report", {
      lastModified: new Date("2026-11-01T02:00:00Z"),
      changeFrequency: "monthly",
      priority: 0.8,
      images: manusRebuildFigures.map(f => `${base}/guides/manus-rebuild-manus-report/${f}`),
    }),
    ...allLocales("/guides/deepseek-super-agent-diagram", {
      lastModified: new Date("2026-10-31T17:00:00Z"),
      changeFrequency: "monthly",
      priority: 0.8,
      images: deepseekSuperAgentFigures.map(f => `${base}/guides/deepseek-super-agent-diagram/${f}`),
    }),
    ...allLocales("/guides/kimi-vs-minimax-open-topic", {
      lastModified: new Date(openTopicCompare.date),
      changeFrequency: "weekly",
      priority: 0.85,
      images: openTopicCompare.cases.flatMap(c => c.media.map(m => `${base}${m.posterPath}`)),
      videos: openTopicCompare.cases.flatMap(c => c.media.map(m => ({
        title: `${c.titleEn} · ${m.modelLabel}`,
        description: m.captionEn,
        thumbnail_loc: `${base}${m.posterPath}`,
        content_loc: `${base}${m.path}`,
      }))),
    }),
    ...allLocales("/guides/dots3-note-preview", {
      lastModified: new Date(dots3Supplement.updatedAt),
      changeFrequency: "monthly",
      priority: 0.8,
      images: [`${base}/evaluations/dots3-note-preview/assets/dots-logo.png`, ...dots3Visual.official.map(figure => `${base}${figure.path}`), ...dots3Supplement.groups.flatMap(group => group.samples.flatMap(sample => [...(sample.pngPath ? [`${base}${sample.pngPath}`] : []), ...("animationRender" in sample && sample.animationRender?.path ? [`${base}${sample.animationRender.path}`] : [])]))],
    }),
    ...allLocales("/guides/tencent-hy4-creative", {
      lastModified: new Date(hy4CreativeData.updatedAt),
      changeFrequency: "weekly",
      priority: 0.9,
      images: [...new Set([
        ...hy4CreativeData.cases.flatMap(item => item.media.flatMap(media => [
          ...(media.type === "image" ? [`${base}${media.path}`] : []),
          ...(media.posterPath ? [`${base}${media.posterPath}`] : []),
          ...(media.animationPath ? [`${base}${media.animationPath}`] : []),
        ])),
        ...hy4Vision.cases.flatMap(item => item.images.map(image => `${base}/evaluations/tencent-hy4-vision/${image.path}`)),
      ])],
      videos: hy4CreativeData.cases.flatMap(item => item.media.filter(media => media.type === "video" && media.posterPath).map(media => ({
        title: item.titleEn,
        description: media.captionEn,
        thumbnail_loc: `${base}${media.posterPath}`,
        content_loc: `${base}${media.path}`,
      }))),
    }),
    ...allLocales("/guides/tencent-hy4", {
      lastModified: new Date(hy4Release.updatedAt),
      changeFrequency: "weekly",
      priority: 0.8,
      images: hy4Release.images.map(path => `${base}${path}`),
      videos: [{
        title: hy4Release.video.titleEn,
        description: hy4Release.video.descriptionEn,
        thumbnail_loc: `${base}${hy4Release.video.posterPath}`,
        content_loc: `${base}${hy4Release.video.path}`,
      }],
    }),
    ...allLocales("/guides/json-extraction", {
      lastModified: new Date("2026-09-26"),
      changeFrequency: "monthly",
      priority: 0.7,
    }),
    ...allLocales("/guides/kimi-k3-1", {
      lastModified: new Date("2026-10-24T00:00:00Z"),
      changeFrequency: "weekly",
      priority: 0.8,
    }),
    ...allLocales("/guides/kimi-k3-1-pro", {
      lastModified: new Date(Math.max(...[
        kimiRecovery.updatedAt,
        kimiSupplement.updatedAt ?? kimiReview.publishedAt,
        kimiQuotaObservation.addedAt,
        kimiOfficialExamples.capturedAt,
        kimiOfficialX.capturedAt,
        kimiCreative.updatedAt,
      ].map(Date.parse))),
      changeFrequency: "weekly",
      priority: 0.9,
      images: [
        `${base}/evaluations/kimi-k3-1-pro/assets/aa-intelligence-index.png`,
        `${base}/evaluations/kimi-k3-1-pro/assets/official-benchmark-overview.webp`,
        `${base}/evaluations/kimi-k3-1-pro-anthropic-pelican-low-1/assets/pelican-low.png`,
        `${base}${kimiQuotaObservation.image.path}`,
      ],
      videos: [...kimiOfficialExamples.items, ...kimiOfficialX.items]
        .filter((item) => item.type === "video" && item.path && item.posterPath)
        .map((item) => ({
          title: item.titleEn,
          description: item.captionEn,
          thumbnail_loc: `${base}${item.posterPath}`,
          content_loc: `${base}${item.path}`,
        })),
    }),
    ...allLocales("/guides/kimi-k3-1-pro-creative", {
      lastModified: new Date(creativeData.updatedAt),
      changeFrequency: "weekly",
      priority: 0.8,
      images: creativeData.cases.flatMap(item => item.media.flatMap(media => media.type === "image" ? [`${base}${media.path}`] : media.posterPath ? [`${base}${media.posterPath}`] : [])),
      videos: creativeData.cases.flatMap(item => item.media.filter(media => media.type === "video" && media.posterPath).map(media => ({
        title: item.titleEn,
        description: media.captionEn,
        thumbnail_loc: `${base}${media.posterPath}`,
        content_loc: `${base}${media.path}`,
      }))),
    }),
    ...allLocales("/guides/minimax-m3-1-flash-preview", {
      lastModified: new Date("2026-10-20T03:53:35.368Z"),
      changeFrequency: "monthly",
      priority: 0.7,
    }),
    ...allLocales("/guides/minimax-m3-1-flash", {
      lastModified: new Date("2026-10-24"),
      changeFrequency: "monthly",
      priority: 0.8,
    }),
    ...allLocales("/guides/minimax-m3-1-flash-open-weights", {
      lastModified: new Date("2026-10-24"),
      changeFrequency: "monthly",
      priority: 0.8,
    }),
    ...allLocales("/guides/deepseek-v4-1-flash-1017", {
      lastModified: new Date("2026-10-22T00:36:54.731Z"),
      changeFrequency: "monthly",
      priority: 0.8,
    }),
    ...allLocales("/guides/longcat-2-5", {
      lastModified: new Date(Math.max(...["2026-11-02T03:00:00Z", longcatReview.updatedAt, longcatSupplement.updatedAt, longcatFrontend.updatedAt, longcatResponses.updatedAt, longcatAccounting.updatedAt, longcatSources.updatedAt, longcatClaudeData.updatedAt].map(Date.parse))),
      changeFrequency: "weekly",
      priority: 0.9,
      images: longcatSources.images.map(image => `${base}${image.path}`),
    }),
    ...allLocales("/guides/longcat-2-5-claude-code", {
      lastModified: new Date(Math.max(Date.parse(longcatClaudeData.updatedAt), Date.parse("2026-11-02T03:00:00Z"))), changeFrequency: "weekly", priority: 0.8,
      images: longcatClaudeData.cases.flatMap(item => item.media.flatMap(media => media.type === "image" ? [`${base}${media.path}`] : media.posterPath ? [`${base}${media.posterPath}`] : [])),
      videos: longcatClaudeData.cases.flatMap(item => item.media.filter(media => media.type === "video" && media.posterPath).map(media => ({ title: item.titleEn, description: media.captionEn, thumbnail_loc: `${base}${media.posterPath}`, content_loc: `${base}${media.path}` }))),
    }),
    ...([
      ["/guides/gemini-3-8-flash-creative", geminiFlashCreative],
      ["/guides/gemini-4-argon-creative", geminiArgonCreative],
    ] as const).flatMap(([path, raw]) => {
      const review = raw as CreativeEvaluationData;
      return allLocales(path, {
        lastModified: new Date(review.updatedAt), changeFrequency: "weekly", priority: 0.8,
        images: review.cases.flatMap(item => item.media.flatMap(media => media.type === "image" ? [`${base}${media.path}`] : media.posterPath ? [`${base}${media.posterPath}`] : [])),
        videos: review.cases.flatMap(item => item.media.filter(media => media.type === "video" && media.posterPath).map(media => ({ title: item.titleEn, description: media.captionEn, thumbnail_loc: `${base}${media.posterPath}`, content_loc: `${base}${media.path}` }))),
      });
    }),
    ...allLocales("/guides/crouton-alpha-creative", {
      lastModified: new Date(croutonAlphaCreativeData.updatedAt), changeFrequency: "weekly", priority: 0.8,
      images: croutonAlphaCreativeData.cases.flatMap(item => item.media.flatMap(media => media.type === "image" ? [`${base}${media.path}`] : media.posterPath ? [`${base}${media.posterPath}`] : [])),
      videos: croutonAlphaCreativeData.cases.flatMap(item => item.media.filter(media => media.type === "video" && media.posterPath).map(media => ({ title: item.titleEn, description: media.captionEn, thumbnail_loc: `${base}${media.posterPath}`, content_loc: `${base}${media.path}` }))),
    }),
    ...allLocales("/guides/longcat-2-5-preview", {
      lastModified: new Date("2026-10-26T16:00:41Z"),
      changeFrequency: "monthly",
      priority: 0.7,
    }),
    ...allLocales("/guides/longcat-2-5-release", {
      lastModified: new Date(longcatReleaseData.updatedAt), changeFrequency: "weekly", priority: 0.9,
      images: [`${base}/articles/longcat-2-5-release/longcat-logo.svg`, ...longcatReleaseVisual.official.map(image => `${base}${image.path}`), ...longcatReleaseData.cases.flatMap(item => item.media.flatMap(media => media.type === "image" ? [`${base}${media.path}`] : media.posterPath ? [`${base}${media.posterPath}`] : []))],
      videos: longcatReleaseData.cases.flatMap(item => item.media.filter(media => media.type === "video" && media.posterPath).map(media => ({ title: item.titleEn, description: media.captionEn, thumbnail_loc: `${base}${media.posterPath}`, content_loc: `${base}${media.path}` }))),
    }),
    ...dynamicRoutes,
    ...sourceProfiles,
  ];
}
