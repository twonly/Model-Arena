import Link from "next/link";
import { Credit } from "@/components/Credit";
import { fetchBoard, type BoardEntry } from "@/lib/board";

export const metadata = {
  title: "最受欢迎模型榜 · 百模竞速",
  description: "全网用户在分享页投票打榜，谁是大家心中的最佳模型？实时汇总。",
};
export const dynamic = "force-dynamic"; // 榜单实时

const MEDALS = ["🥇", "🥈", "🥉"];

export default async function BoardPage() {
  let board: BoardEntry[] | null = null;
  let error = false;
  try {
    board = await fetchBoard();
  } catch {
    error = true;
  }
  const maxWins = board?.length ? Math.max(board[0].wins, 1) : 1;
  const totalWins = board?.reduce((a, b) => a + b.wins, 0) ?? 0;

  return (
    <main className="mx-auto max-w-3xl px-5 py-8">
      <nav className="mb-6 flex items-center justify-between">
        <Link href="/" className="text-[13px] text-faint hover:text-ink">
          ← 百模竞速
        </Link>
        <div className="flex items-center gap-2">
          <Link
            href="/stats"
            className="rounded-md border border-line px-3 py-1.5 text-[13px] text-faint hover:text-ink"
          >
            ⚡ 速度榜
          </Link>
          <Link
            href="/arena"
            className="rounded-md bg-ink px-3.5 py-1.5 text-[13px] font-bold text-paper"
          >
            我也来测 ▶
          </Link>
        </div>
      </nav>

      <header className="mb-6">
        <h1
          className="text-[30px] font-black"
          style={{ fontFamily: "var(--font-title)" }}
        >
          最受欢迎模型榜
        </h1>
        <p className="mt-2 text-[13px] text-faint">
          全网用户在分享页投票打榜，谁夺冠最多？
          {board?.length ? (
            <>
              {" "}
              当前 <span className="num text-ink">{board.length}</span> 个模型 ·{" "}
              <span className="num text-ink">{totalWins}</span> 次夺冠
            </>
          ) : null}
        </p>
        <p className="mt-1 text-[11.5px] text-faint/70">
          「夺冠」= 在某次对比里被选为最佳 / 排第 1 / 评分最高。与{" "}
          <Link href="/stats" className="underline hover:text-ink">
            速度榜
          </Link>{" "}
          互补：一个看快慢，一个看人心。
        </p>
      </header>

      {board === null ? (
        <div className="rounded-lg border border-dashed border-line bg-card/60 px-6 py-12 text-center text-[13px] text-faint">
          {error
            ? "榜单暂时不可用，请稍后再试。"
            : "榜单尚未启用（数据后端未配置）。"}
        </div>
      ) : board.length === 0 ? (
        <div className="rounded-lg border border-dashed border-line bg-card/60 px-6 py-12 text-center">
          <div className="text-[15px] font-semibold mb-1.5">还没有投票数据</div>
          <div className="text-[12.5px] text-faint mb-4">
            跑一轮对比 → 分享时开启投票 → 邀朋友来投，模型就会登上这个榜
          </div>
          <Link
            href="/arena"
            className="rounded-md bg-ink px-5 py-2 text-[13px] font-bold text-paper"
          >
            去跑一轮 ▶
          </Link>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-line bg-card">
          {board.map((e, i) => (
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
                <div className="mt-1.5 h-2 w-full max-w-[260px] overflow-hidden rounded-full bg-paper">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${(e.wins / maxWins) * 100}%`,
                      background: i === 0 ? "var(--accent)" : "var(--ink)",
                    }}
                  />
                </div>
              </div>
              <div className="num shrink-0 text-right">
                <span className="text-[16px] font-bold">{e.wins}</span>
                <span className="text-[11px] text-faint"> 次夺冠</span>
                {e.loginWins > 0 && (
                  <div className="text-[10px] text-faint">
                    {e.loginWins} 登录票
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-5 text-[11px] text-faint/80">
        · 数据来自用户在分享页的真实投票，每 5 分钟更新 · 同一模型按接入时填的模型
        ID 归并
      </div>

      <footer className="mt-8 flex justify-center">
        <Credit compact />
      </footer>
    </main>
  );
}
