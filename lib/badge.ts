import type { Locale } from "./i18n";
import type { ShareSnapshot } from "./share";
import type { ModelStat } from "./stats";

const HEIGHT = 20;
const LABEL_BG = "#1d1c18";
const GREEN = "#0e7a4e";
const RED = "#d9261c";
const AMBER = "#9a6700";
const MUTED = "#6b675f";

function fmtMetric(n: number, digits = 0): string {
  if (!Number.isFinite(n) || n <= 0) return "—";
  return n.toLocaleString("en-US", { maximumFractionDigits: digits });
}

function fmtSeconds(ms: number): string {
  return ms > 0 ? `${(ms / 1000).toFixed(2)}s` : "—";
}

export interface BadgeContent {
  label: string;
  message: string;
  color?: string;
}

function estimateWidth(text: string): number {
  return [...text].reduce((sum, ch) => {
    if (/\s/.test(ch)) return sum + 4;
    if (/[A-Z0-9]/.test(ch)) return sum + 7;
    if (/[\u4e00-\u9fff]/.test(ch)) return sum + 11;
    return sum + 6;
  }, 0);
}

export function escapeSvgText(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function truncateBadgeText(value: string, max = 42): string {
  const chars = [...value.trim().replace(/\s+/g, " ")];
  if (chars.length <= max) return chars.join("");
  return `${chars.slice(0, Math.max(1, max - 1)).join("")}…`;
}

export function renderBadgeSvg({ label, message, color = RED }: BadgeContent): string {
  const safeLabel = truncateBadgeText(label, 22);
  const safeMessage = truncateBadgeText(message, 56);
  const labelWidth = Math.max(58, estimateWidth(safeLabel) + 18);
  const messageWidth = Math.max(86, estimateWidth(safeMessage) + 18);
  const width = labelWidth + messageWidth;
  const labelX = labelWidth / 2;
  const messageX = labelWidth + messageWidth / 2;
  const aria = escapeSvgText(`${safeLabel}: ${safeMessage}`);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${HEIGHT}" role="img" aria-label="${aria}">
  <title>${aria}</title>
  <linearGradient id="s" x2="0" y2="100%">
    <stop offset="0" stop-color="#fff" stop-opacity=".16"/>
    <stop offset="1" stop-color="#000" stop-opacity=".08"/>
  </linearGradient>
  <clipPath id="r"><rect width="${width}" height="${HEIGHT}" rx="3" fill="#fff"/></clipPath>
  <g clip-path="url(#r)">
    <rect width="${labelWidth}" height="${HEIGHT}" fill="${LABEL_BG}"/>
    <rect x="${labelWidth}" width="${messageWidth}" height="${HEIGHT}" fill="${color}"/>
    <rect width="${width}" height="${HEIGHT}" fill="url(#s)"/>
  </g>
  <g fill="#fff" text-anchor="middle" font-family="-apple-system,BlinkMacSystemFont,Segoe UI,Arial,sans-serif" font-size="11" font-weight="600">
    <text x="${labelX}" y="15">${escapeSvgText(safeLabel)}</text>
    <text x="${messageX}" y="15">${escapeSvgText(safeMessage)}</text>
  </g>
</svg>`;
}

export function badgeResponse(content: BadgeContent, init?: ResponseInit): Response {
  return new Response(renderBadgeSvg(content), {
    status: init?.status ?? 200,
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=86400",
      "X-Robots-Tag": "noindex",
      ...init?.headers,
    },
  });
}

export function unavailableBadge(locale: Locale, label = "TOKRACE"): BadgeContent {
  return {
    label,
    message: locale === "en" ? "data unavailable" : "暂无数据",
    color: MUTED,
  };
}

export function modelBadge(stat: ModelStat, locale: Locale): BadgeContent {
  const speed = fmtMetric(stat.medianContentTps);
  const ttft = fmtSeconds(stat.avgTtftMs);
  return {
    label: "TOKRACE",
    message:
      locale === "en"
        ? `${stat.model}: ${speed} tok/s`
        : `${stat.model}: ${speed} tok/s`,
    color: ttft === "—" ? RED : GREEN,
  };
}

export function compareBadge(a: ModelStat, b: ModelStat, locale: Locale): BadgeContent {
  const winner =
    a.medianContentTps === b.medianContentTps
      ? null
      : a.medianContentTps > b.medianContentTps
        ? a
        : b;
  return {
    label: "TOKRACE",
    message: winner
      ? `${winner.model}: ${fmtMetric(winner.medianContentTps)} tok/s`
      : locale === "en"
        ? "similar speed"
        : "速度接近",
    color: winner ? GREEN : AMBER,
  };
}

export function shareBadge(snapshot: ShareSnapshot, locale: Locale): BadgeContent {
  const fastest = snapshot.results
    .filter((r) => typeof r.metrics?.contentTps === "number" && r.metrics.contentTps > 0)
    .sort((a, b) => (b.metrics?.contentTps ?? 0) - (a.metrics?.contentTps ?? 0))[0];
  if (!fastest) {
    return {
      label: "TOKRACE",
      message:
        locale === "en"
          ? `${snapshot.results.length} model comparison`
          : `${snapshot.results.length} 模型对比`,
      color: AMBER,
    };
  }
  return {
    label: "TOKRACE",
    message: `${fastest.name || fastest.model}: ${fmtMetric(fastest.metrics?.contentTps ?? 0)} tok/s`,
    color: GREEN,
  };
}

export function markdownBadge(opts: {
  alt: string;
  badgeUrl: string;
  targetUrl: string;
}): string {
  return `[![${opts.alt.replace(/\]/g, "\\]")}](${opts.badgeUrl})](${opts.targetUrl})`;
}

export function htmlBadge(opts: {
  alt: string;
  badgeUrl: string;
  targetUrl: string;
}): string {
  const alt = opts.alt.replace(/"/g, "&quot;");
  return `<a href="${opts.targetUrl}"><img src="${opts.badgeUrl}" alt="${alt}"></a>`;
}

export function compareBadgeAlt(a: ModelStat, b: ModelStat, locale: Locale): string {
  if (a.medianContentTps === b.medianContentTps) {
    return locale === "en"
      ? `${a.model} and ${b.model} have similar speed on TOKRACE`
      : `${a.model} 和 ${b.model} 在 TOKRACE 上速度接近`;
  }
  const winner = a.medianContentTps > b.medianContentTps ? a : b;
  const loser = winner === a ? b : a;
  return locale === "en"
    ? `${winner.model} is faster than ${loser.model}: ${fmtMetric(winner.medianContentTps)} tok/s on TOKRACE`
    : `${winner.model} 快于 ${loser.model}：${fmtMetric(winner.medianContentTps)} tok/s on TOKRACE`;
}
