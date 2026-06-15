"use client";

import { useRef, useState } from "react";
import { COMMENT_MAX, type Sentiment, type VoteAggregate } from "@/lib/voting";

/** 单模型卡片底部的投票条：👍/👎（乐观更新）+ 评论（默认露出预览） */
export function CardVoteBar({
  modelIndex,
  modelId,
  agg,
  onReact,
}: {
  modelIndex: number;
  modelId: string;
  agg: VoteAggregate | null;
  onReact: (
    modelIndex: number,
    modelId: string,
    sentiment: Sentiment,
    comment?: string
  ) => Promise<void>;
}) {
  const stat = agg?.models.find((m) => m.index === modelIndex);
  const mine = agg?.mine[modelIndex];
  const serverSent = mine?.sentiment ?? null;
  const myComment = mine?.comment ?? "";

  // 乐观状态：点击立刻反映，后端回来再对齐（失败回滚）
  const [optimistic, setOptimistic] = useState<{
    sentiment: Sentiment;
    up: number;
    down: number;
  } | null>(null);
  const seqRef = useRef(0);

  const baseSent = optimistic ? optimistic.sentiment : serverSent;
  const up = optimistic ? optimistic.up : stat?.up ?? 0;
  const down = optimistic ? optimistic.down : stat?.down ?? 0;
  const total = up + down;
  const ratio = total > 0 ? up / total : 0;

  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [err, setErr] = useState("");

  // 点赞/点踩：本地立即变，后台异步提交
  const react = (s: Sentiment) => {
    const newSent = baseSent === s ? null : s; // 再点一次同款 = 取消
    let u = up;
    let d = down;
    if (baseSent === "up") u--;
    else if (baseSent === "down") d--;
    if (newSent === "up") u++;
    else if (newSent === "down") d++;
    setOptimistic({ sentiment: newSent, up: u, down: d });
    setErr("");
    const seq = ++seqRef.current;
    onReact(modelIndex, modelId, newSent)
      .then(() => {
        if (seq === seqRef.current) setOptimistic(null); // 用服务端真值替换
      })
      .catch(() => {
        if (seq === seqRef.current) {
          setOptimistic(null); // 回滚到服务端真值
          setErr("提交失败，请重试");
        }
      });
  };

  const sendComment = async () => {
    const text = draft.trim();
    if (!text) return;
    setSending(true);
    setErr("");
    try {
      await onReact(modelIndex, modelId, baseSent, text);
      setDraft("");
      setOpen(true); // 保持展开，让用户看到评论已上墙
    } catch {
      setErr("评论提交失败，请重试");
    } finally {
      setSending(false);
    }
  };

  const cardComments = (agg?.comments ?? []).filter(
    (c) => c.modelIndex === modelIndex
  );
  const preview = cardComments.slice(0, 2);

  const Comment = ({
    c,
  }: {
    c: (typeof cardComments)[number];
  }) => (
    <div className="rounded-md border border-line bg-paper/50 px-2 py-1 text-[11.5px] leading-snug">
      {c.sentiment === "up" && "👍 "}
      {c.sentiment === "down" && "👎 "}
      {c.byLogin && <span style={{ color: "var(--go)" }}>[登录] </span>}
      <span className="break-words">{c.text}</span>
    </div>
  );

  return (
    <div className="mt-2 rounded-lg border border-line bg-card px-3 py-2">
      <div className="flex items-center gap-2">
        <button
          onClick={() => react("up")}
          className={`flex items-center gap-1 rounded-md border px-2.5 py-1 text-[12.5px] transition-transform active:scale-95 cursor-pointer ${
            baseSent === "up"
              ? "border-go/40 bg-go/10"
              : "border-line hover:border-ink/30"
          }`}
          style={baseSent === "up" ? { color: "var(--go)" } : undefined}
          title="点赞"
        >
          👍 <span className="num">{up}</span>
        </button>
        <button
          onClick={() => react("down")}
          className={`flex items-center gap-1 rounded-md border px-2.5 py-1 text-[12.5px] transition-transform active:scale-95 cursor-pointer ${
            baseSent === "down"
              ? "border-accent/40 bg-accent/10 text-accent"
              : "border-line hover:border-ink/30"
          }`}
          title="点踩"
        >
          👎 <span className="num">{down}</span>
        </button>
        {total > 0 && (
          <span className="num text-[11px] text-faint">
            好评 {Math.round(ratio * 100)}%
          </span>
        )}
        <button
          onClick={() => setOpen((v) => !v)}
          className="ml-auto rounded-md border border-line px-2.5 py-1 text-[12px] text-faint hover:text-ink cursor-pointer"
        >
          💬 {cardComments.length > 0 ? `${cardComments.length} 条评论` : "写评论"}
        </button>
      </div>

      {err && <div className="mt-1 text-[11px] text-accent">{err}</div>}

      {/* 默认露出的评论预览（折叠时也能被别人看到） */}
      {!open && preview.length > 0 && (
        <div className="mt-2 space-y-1">
          {preview.map((c, i) => (
            <Comment key={i} c={c} />
          ))}
          {cardComments.length > preview.length && (
            <button
              onClick={() => setOpen(true)}
              className="text-[11px] text-faint underline hover:text-ink cursor-pointer"
            >
              查看全部 {cardComments.length} 条 →
            </button>
          )}
        </div>
      )}

      {/* 展开：写评论 + 全部评论 */}
      {open && (
        <div className="mt-2">
          {myComment && !draft && (
            <div className="mb-1 text-[11px] text-faint">
              你已评论：「{myComment}」（重写会覆盖）
            </div>
          )}
          <textarea
            className="w-full rounded-md border border-line bg-card px-2.5 py-1.5 text-[12px] outline-none focus:border-ink/40"
            rows={2}
            maxLength={COMMENT_MAX}
            placeholder="理性说说你的看法（≤500 字），会展示给其他读者"
            value={draft}
            onChange={(e) => setDraft(e.target.value.slice(0, COMMENT_MAX))}
          />
          <div className="mt-1 flex items-center justify-between">
            <span className="num text-[10.5px] text-faint/70">
              {draft.length}/{COMMENT_MAX}
            </span>
            <button
              onClick={sendComment}
              disabled={sending || !draft.trim()}
              className="rounded-md bg-ink px-3 py-1 text-[12px] font-semibold text-paper disabled:opacity-40 cursor-pointer"
            >
              {sending ? "发表中…" : "发表"}
            </button>
          </div>
          {cardComments.length > 0 && (
            <div className="thin-scroll mt-2 max-h-48 space-y-1 overflow-y-auto">
              {cardComments.map((c, i) => (
                <Comment key={i} c={c} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
