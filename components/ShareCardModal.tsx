"use client";

import { useRef, useState } from "react";
import { toPng } from "html-to-image";
import type { VoteAggregate } from "@/lib/voting";

/** 晒选择卡：投票后一键生成「我 pick 了 XX」图卡，回贴社媒拉新裂变 */
export function ShareCardModal({
  open,
  onClose,
  title,
  myPick,
  agg,
  label,
  shareUrl,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  myPick: string; // 我选的模型名（已揭晓）
  agg: VoteAggregate | null;
  label: (i: number) => string;
  shareUrl: string;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);

  if (!open) return null;

  const sorted = [...(agg?.tallies ?? [])].sort((a, b) => b.metric - a.metric);
  const maxM = sorted.length ? Math.max(sorted[0].metric, 0.0001) : 1;
  const unit =
    agg?.method === "single" ? "票" : agg?.method === "rank" ? "分" : "均分";

  const download = async () => {
    if (!cardRef.current) return;
    setBusy(true);
    try {
      const dataUrl = await toPng(cardRef.current, {
        pixelRatio: 2,
        backgroundColor: "#ffffff",
      });
      const a = document.createElement("a");
      a.download = `我pick了${myPick}-${Date.now()}.png`;
      a.href = dataUrl;
      a.click();
    } catch {
      /* ignore */
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink/45 p-4 pt-[6vh]"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 卡片本体（被截图） */}
        <div
          ref={cardRef}
          className="overflow-hidden rounded-2xl"
          style={{ background: "#fff", color: "#1d1c18" }}
        >
          <div
            style={{
              background: "linear-gradient(135deg,#d9261c 0%,#1d1c18 100%)",
              color: "#fff",
              padding: "22px 22px 18px",
            }}
          >
            <div style={{ fontSize: 12, opacity: 0.85 }}>百模竞速 · 我的选择</div>
            <div style={{ fontSize: 13, marginTop: 8, opacity: 0.9 }}>
              {title || "大模型对比"}
            </div>
            <div
              style={{
                fontSize: 26,
                fontWeight: 900,
                marginTop: 10,
                lineHeight: 1.2,
              }}
            >
              🏆 我 pick 了
              <br />
              {myPick}
            </div>
          </div>

          <div style={{ padding: "16px 22px 12px" }}>
            <div style={{ fontSize: 11, color: "#8d8a82", marginBottom: 8 }}>
              实时榜单 · 共 {agg?.total ?? 0} 人参与
            </div>
            {sorted.slice(0, 3).map((t, i) => (
              <div key={t.index} style={{ marginBottom: 8 }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: 12.5,
                    marginBottom: 3,
                  }}
                >
                  <span style={{ fontWeight: 600 }}>
                    {["🥇", "🥈", "🥉"][i]} {label(t.index)}
                  </span>
                  <span style={{ color: "#8d8a82" }}>
                    {agg?.method === "score" ? t.metric.toFixed(2) : t.metric}{" "}
                    {unit}
                  </span>
                </div>
                <div
                  style={{
                    height: 7,
                    borderRadius: 4,
                    background: "#f1efe9",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      width: `${(t.metric / maxM) * 100}%`,
                      borderRadius: 4,
                      background: i === 0 ? "#d9261c" : "#1d1c18",
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div
            style={{
              borderTop: "1px solid #e6e4dd",
              padding: "10px 22px",
              fontSize: 10.5,
              color: "#8d8a82",
              display: "flex",
              justifyContent: "space-between",
            }}
          >
            <span>arena.amaletter.com</span>
            <span>扫码/点链接，你也来 pick 一票 →</span>
          </div>
        </div>

        {/* 操作 */}
        <div className="mt-3 flex items-center justify-center gap-2">
          <button
            onClick={download}
            disabled={busy}
            className="rounded-md bg-paper px-5 py-2 text-[13px] font-bold text-ink disabled:opacity-50 cursor-pointer"
          >
            {busy ? "生成中…" : "⤓ 保存图片"}
          </button>
          <button
            onClick={() => {
              void navigator.clipboard.writeText(shareUrl);
            }}
            className="rounded-md border border-paper/40 px-4 py-2 text-[13px] text-paper cursor-pointer"
          >
            复制链接
          </button>
          <button
            onClick={onClose}
            className="rounded-md border border-paper/40 px-4 py-2 text-[13px] text-paper cursor-pointer"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  );
}
