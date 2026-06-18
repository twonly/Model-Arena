import Link from "next/link";
import { Credit } from "@/components/Credit";
import { Logo } from "@/components/Logo";
import { JsonLd } from "@/components/JsonLd";
import { BRAND } from "@/lib/brand";
import { fetchBoard, type BoardEntry } from "@/lib/board";
import { voteConfidence } from "@/lib/quickstart";
import { getMessages } from "@/lib/i18n-messages";
import { getRequestLocale } from "@/lib/i18n-server";
import { localeToLanguage, localizedPath } from "@/lib/i18n";

export const metadata = {
  title: "最受欢迎模型榜",
  description: "全网用户在分享页投票打榜，谁是大家心中的最佳模型？实时汇总。",
  alternates: { canonical: "/board" },
};
export const dynamic = "force-dynamic"; // 榜单实时

const MEDALS = ["🥇", "🥈", "🥉"];

function confidenceClass(tone: "low" | "medium" | "high"): string {
  if (tone === "high") return "border-go/25 bg-go/10 text-go";
  if (tone === "medium") return "border-line bg-paper text-faint";
  return "border-accent/25 bg-accent/10 text-accent";
}

export default async function BoardPage() {
  const locale = await getRequestLocale();
  const messages = getMessages(locale);
  const h = (path: string) => localizedPath(path, locale);
  let board: BoardEntry[] | null = null;
  let error = false;
  try {
    board = await fetchBoard();
  } catch {
    error = true;
  }
  const maxW = board?.length ? Math.max(board[0].wilson, 0.0001) : 1;
  const totalVotes = board?.reduce((a, b) => a + b.up + b.down, 0) ?? 0;

  const listJsonLd = board?.length
    ? {
        "@context": "https://schema.org",
        "@type": "ItemList",
        name: messages.metadata.board.title,
        description: messages.metadata.board.description,
        url: `${BRAND.url}${h("/board")}`,
        inLanguage: localeToLanguage(locale),
        numberOfItems: board.length,
        itemListElement: board.map((e, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: e.model,
          description:
            locale === "en"
              ? `Approval ${Math.round(e.ratio * 100)}% · 👍${e.up} 👎${e.down}`
              : `好评率 ${Math.round(e.ratio * 100)}% · 👍${e.up} 👎${e.down}`,
        })),
      }
    : null;

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: BRAND.en, item: BRAND.url },
      { "@type": "ListItem", position: 2, name: messages.common.board, item: `${BRAND.url}${h("/board")}` },
    ],
  };

  return (
    <main className="mx-auto max-w-3xl px-5 py-8">
      {listJsonLd && <JsonLd data={listJsonLd} />}
      <JsonLd data={breadcrumbJsonLd} />
      <nav className="mb-6 flex items-center justify-between">
        <Logo withText />
        <div className="flex items-center gap-2">
          <Link
            href={h("/stats")}
            className="rounded-md border border-line px-3 py-1.5 text-[13px] text-faint hover:text-ink"
          >
            ⚡ {messages.common.stats}
          </Link>
          <Link
            href={h("/arena")}
            className="rounded-md bg-ink px-3.5 py-1.5 text-[13px] font-bold text-paper"
          >
            {messages.common.testNow} ▶
          </Link>
        </div>
      </nav>

      <header className="mb-6">
        <h1
          className="text-[30px] font-black"
          style={{ fontFamily: "var(--font-title)" }}
        >
          {messages.metadata.board.title}
        </h1>
        <p className="mt-2 text-[13px] text-faint">
          {locale === "en"
            ? "Users vote on each model from share pages. Which model is most liked?"
            : "全网用户在分享页给每个模型 👍 点赞 / 👎 点踩，谁最受好评？"}
          {board?.length ? (
            <>
              {" "}
              {locale === "en" ? "Current " : "当前 "}
              <span className="num text-ink">{board.length}</span>
              {locale === "en" ? " models · " : " 个模型 · "}
              <span className="num text-ink">{totalVotes}</span>
              {locale === "en" ? " votes" : " 次投票"}
            </>
          ) : null}
        </p>
        <p className="mt-1 text-[11.5px] text-faint/70">
          {locale === "en" ? (
            <>
              Ranking uses the Wilson lower bound: more votes mean more confidence, and
              low-vote entries are discounted. It complements the{" "}
            </>
          ) : (
            "排名按 Wilson 好评置信下界：票越多越可信，票少自动打折，不是单纯比好评率。与 "
          )}
          <Link href={h("/stats")} className="underline hover:text-ink">
            {messages.common.stats}
          </Link>{" "}
          {locale === "en"
            ? "by showing audience preference rather than speed. Each row shows vote confidence."
            : "互补：一个看快慢，一个看人心。每行会显示票数可信度。"}
        </p>
      </header>

      {board === null ? (
        <div className="rounded-lg border border-dashed border-line bg-card/60 px-6 py-12 text-center text-[13px] text-faint">
          {error
            ? locale === "en"
              ? "Board is temporarily unavailable. Try again later."
              : "榜单暂时不可用，请稍后再试。"
            : locale === "en"
              ? "Board is not enabled yet (data backend is not configured)."
              : "榜单尚未启用（数据后端未配置）。"}
        </div>
      ) : board.length === 0 ? (
        <div className="rounded-lg border border-dashed border-line bg-card/60 px-6 py-12 text-center">
          <div className="text-[15px] font-semibold mb-1.5">
            {locale === "en" ? "No votes yet" : "还没有投票数据"}
          </div>
          <div className="text-[12.5px] text-faint mb-4">
            {locale === "en"
              ? "Run a comparison, enable voting when sharing, then invite readers to vote."
              : "跑一轮对比 → 分享时开启投票 → 邀朋友来投，模型就会登上这个榜"}
          </div>
          <Link
            href={h("/arena")}
            className="rounded-md bg-ink px-5 py-2 text-[13px] font-bold text-paper"
          >
            {locale === "en" ? "Run one test" : "去跑一轮"} ▶
          </Link>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-line bg-card">
          {board.map((e, i) => {
            const votes = e.up + e.down;
            const confidence = voteConfidence(votes, locale);
            return (
              <div
                key={e.model}
                className="flex items-center gap-3 border-b border-line px-4 py-3 last:border-0"
              >
                <span className="num w-7 shrink-0 text-[14px] text-faint">
                  {MEDALS[i] ?? `${i + 1}`}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="num truncate text-[13.5px] font-semibold">
                    {e.model}
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-[10px] text-faint">
                    <span>{votes} {locale === "en" ? "votes" : "票"}</span>
                    <span
                      className={`rounded-full border px-1.5 py-0.5 font-semibold ${confidenceClass(
                        confidence.tone
                      )}`}
                      title={confidence.description}
                    >
                      {confidence.label}
                    </span>
                  </div>
                  <div className="mt-1.5 h-2 w-full max-w-[260px] overflow-hidden rounded-full bg-paper">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${(e.wilson / maxW) * 100}%`,
                        background: i === 0 ? "var(--accent)" : "var(--ink)",
                      }}
                    />
                  </div>
                </div>
                <div className="num shrink-0 text-right">
                  <span className="text-[16px] font-bold">
                    {Math.round(e.ratio * 100)}%
                  </span>
                  <span className="text-[11px] text-faint">
                    {" "}
                    {locale === "en" ? "approval" : "好评"}
                  </span>
                  <div className="text-[10px] text-faint">
                    👍{e.up} 👎{e.down}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-5 text-[11px] text-faint/80">
        {locale === "en"
          ? "· Data comes from real votes on share pages and updates every 5 minutes · Models are grouped by the configured model ID"
          : "· 数据来自用户在分享页的真实投票，每 5 分钟更新 · 同一模型按接入时填的模型 ID 归并"}
      </div>

      <footer className="mt-8 flex justify-center">
        <Credit compact />
      </footer>
    </main>
  );
}
