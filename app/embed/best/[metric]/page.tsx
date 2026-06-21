import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { BRAND } from "@/lib/brand";
import { localizedPath, normalizeLocale, DEFAULT_LOCALE } from "@/lib/i18n";
import { getBestPage, bestMeta, isBestMetric } from "@/lib/best";

export const revalidate = 300;

// 挂件页不收录（内容已在 /best 收录），避免重复内容
export const metadata: Metadata = { robots: { index: false, follow: false } };

const MEDALS = ["🥇", "🥈", "🥉"];

/**
 * 可嵌入挂件：第三方 <iframe> 引用的极简榜单。无导航/页脚，带回链。
 * /embed/best/[metric]?lang=en&n=8
 */
export default async function EmbedBestPage({
  params,
  searchParams,
}: {
  params: Promise<{ metric: string }>;
  searchParams: Promise<{ lang?: string; n?: string }>;
}) {
  const { metric } = await params;
  if (!isBestMetric(metric)) notFound();
  const { lang, n } = await searchParams;
  const locale = normalizeLocale(lang ?? "") ?? DEFAULT_LOCALE;
  const isZh = locale === "zh-CN";
  const limit = Math.min(Math.max(Number(n) || 8, 3), 15);
  const page = await getBestPage(metric, locale);
  const meta = bestMeta(metric, locale);
  const rows = page.rows.slice(0, limit);
  const fullUrl = `${BRAND.url}${localizedPath(`/best/${metric}`, locale)}`;

  return (
    <main className="mx-auto max-w-md p-3" style={{ fontFamily: "var(--font-sans)" }}>
      <div className="overflow-hidden rounded-xl border border-line bg-card">
        <div className="flex items-center justify-between border-b border-line bg-paper/60 px-3 py-2">
          <span className="text-[12.5px] font-bold">{meta.title.split("（")[0].split("(")[0]}</span>
          <a
            href={`${fullUrl}?utm_source=embed`}
            target="_blank"
            rel="noopener"
            className="text-[10.5px] text-faint hover:text-ink"
          >
            {isZh ? "百模竞速 TOKRACE ↗" : "TOKRACE ↗"}
          </a>
        </div>
        {rows.length === 0 ? (
          <div className="px-3 py-6 text-center text-[12px] text-faint">
            {isZh ? "暂无数据" : "No data yet"}
          </div>
        ) : (
          <ol>
            {rows.map((r, i) => (
              <li
                key={r.slug + i}
                className="flex items-center gap-2 border-b border-line px-3 py-2 last:border-0"
              >
                <span className="num w-5 shrink-0 text-[12px] text-faint">{MEDALS[i] ?? i + 1}</span>
                <span className="min-w-0 flex-1 truncate text-[12.5px] font-medium">{r.model}</span>
                <span
                  className="num shrink-0 text-[12px] font-bold"
                  style={{ color: i === 0 ? "var(--accent)" : "var(--ink)" }}
                >
                  {r.primary}
                </span>
              </li>
            ))}
          </ol>
        )}
      </div>
    </main>
  );
}
