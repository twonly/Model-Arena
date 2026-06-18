"use client";

import { useState } from "react";
import { useI18n } from "@/components/I18nProvider";
import type { VotingConfigLite } from "@/lib/share";

/** 生成分享前的简单配置：是否开启投票（卡片内 👍/👎 + 评论） */
export function ShareConfigDialog({
  open,
  onClose,
  onGenerate,
  generating,
}: {
  open: boolean;
  onClose: () => void;
  onGenerate: (voting: VotingConfigLite | undefined) => void;
  generating: boolean;
}) {
  const { locale, messages } = useI18n();
  const [enabled, setEnabled] = useState(true);
  const en = locale === "en";

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-ink/30 p-4 pt-[12vh]"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-xl border border-line bg-paper shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-line px-5 py-3">
          <div className="text-[15px] font-bold">
            {en ? "Generate Share Link" : "生成分享链接"}
          </div>
          <button
            onClick={onClose}
            className="rounded-md border border-line px-2.5 py-1.5 text-[16px] leading-none text-faint hover:text-ink cursor-pointer"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4 p-5">
          <label className="flex cursor-pointer items-start gap-2">
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
              className="mt-0.5 accent-[var(--accent)]"
            />
            <span>
              <span className="text-[13.5px] font-semibold">
                {en ? "Enable voting" : "开启投票"}
              </span>
              <span className="mt-0.5 block text-[11.5px] text-faint">
                {en
                  ? "Readers can upvote, downvote, and comment on each model card. The live board ranks by confidence-adjusted approval. Anonymous votes are allowed; signed-in votes carry more trust."
                  : "读者可在每个模型卡片上 👍 点赞 / 👎 点踩、写评论；右侧实时榜单按好评置信度排名。匿名即可参与，登录票更可信。"}
              </span>
            </span>
          </label>

          <div className="flex gap-2 pt-1">
            <button
              onClick={() => onGenerate(enabled ? { enabled: true } : undefined)}
              disabled={generating}
              className="rounded-md bg-ink px-5 py-2 text-[13px] font-bold text-paper disabled:opacity-50 cursor-pointer"
            >
              {generating ? (en ? "Generating..." : "生成中…") : en ? "Generate Link" : "生成链接"}
            </button>
            <button
              onClick={onClose}
              className="rounded-md border border-line px-4 py-2 text-[13px] text-faint hover:text-ink cursor-pointer"
            >
              {messages.common.cancel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
