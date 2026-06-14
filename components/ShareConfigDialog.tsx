"use client";

import { useState } from "react";
import { METHODS, SCENES, type VoteMethod, type VoteMode } from "@/lib/voting";
import type { VotingConfigLite } from "@/lib/share";

/** 生成分享前选投票配置（打榜/盲评 + 场景维度） */
export function ShareConfigDialog({
  open,
  onClose,
  defaultScene,
  onGenerate,
  generating,
}: {
  open: boolean;
  onClose: () => void;
  defaultScene: string;
  onGenerate: (voting: VotingConfigLite | undefined) => void;
  generating: boolean;
}) {
  const [enabled, setEnabled] = useState(true);
  const [mode, setMode] = useState<VoteMode>("open");
  const [method, setMethod] = useState<VoteMethod>("single");
  const [scene, setScene] = useState(defaultScene);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-ink/30 p-4 pt-[10vh]"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-xl border border-line bg-paper shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-line px-5 py-3">
          <div className="text-[15px] font-bold">生成分享链接</div>
          <button
            onClick={onClose}
            className="rounded-md border border-line px-2.5 py-1.5 text-[16px] leading-none text-faint hover:text-ink cursor-pointer"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4 p-5">
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
              className="accent-[var(--accent)]"
            />
            <span className="text-[13.5px] font-semibold">开启投票/打榜</span>
            <span className="text-[11px] text-faint">让读者给各模型投票</span>
          </label>

          {enabled && (
            <>
              <div>
                <div className="mb-1.5 text-[12px] font-semibold text-faint">
                  投票模式
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setMode("open")}
                    className={`rounded-md border p-2.5 text-left cursor-pointer ${mode === "open" ? "border-ink bg-card" : "border-line"}`}
                  >
                    <div className="text-[13px] font-semibold">🏆 打榜</div>
                    <div className="mt-0.5 text-[10.5px] text-faint">
                      显示模型名，粉丝给自家投票，氛围强
                    </div>
                  </button>
                  <button
                    onClick={() => setMode("blind")}
                    className={`rounded-md border p-2.5 text-left cursor-pointer ${mode === "blind" ? "border-ink bg-card" : "border-line"}`}
                  >
                    <div className="text-[13px] font-semibold">🙈 盲评</div>
                    <div className="mt-0.5 text-[10.5px] text-faint">
                      隐藏名字，投完揭晓，去品牌滤镜更公正
                    </div>
                  </button>
                </div>
              </div>

              <div>
                <div className="mb-1.5 text-[12px] font-semibold text-faint">
                  评价方式
                </div>
                <div className="space-y-1.5">
                  {METHODS.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => setMethod(m.id)}
                      className={`block w-full rounded-md border p-2.5 text-left cursor-pointer ${method === m.id ? "border-ink bg-card" : "border-line"}`}
                    >
                      <div className="text-[13px] font-semibold">{m.label}</div>
                      <div className="mt-0.5 text-[10.5px] text-faint">
                        {m.desc}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="mb-1.5 text-[12px] font-semibold text-faint">
                  {method === "score" ? "评分维度" : "维度（评论参考）"}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {SCENES.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setScene(s.id)}
                      className={`rounded-md border px-2.5 py-1.5 text-[12px] cursor-pointer ${scene === s.id ? "border-ink bg-ink text-paper" : "border-line text-faint hover:text-ink"}`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
                {scene !== "none" && (
                  <div className="mt-1.5 text-[10.5px] text-faint/80">
                    维度：
                    {SCENES.find((s) => s.id === scene)?.dims.join(" · ")}
                  </div>
                )}
              </div>
            </>
          )}

          <div className="flex gap-2 pt-1">
            <button
              onClick={() =>
                onGenerate(
                  enabled ? { enabled: true, mode, method, scene } : undefined
                )
              }
              disabled={generating}
              className="rounded-md bg-ink px-5 py-2 text-[13px] font-bold text-paper disabled:opacity-50 cursor-pointer"
            >
              {generating ? "生成中…" : "生成链接"}
            </button>
            <button
              onClick={onClose}
              className="rounded-md border border-line px-4 py-2 text-[13px] text-faint hover:text-ink cursor-pointer"
            >
              取消
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
