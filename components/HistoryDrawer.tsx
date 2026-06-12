"use client";

import { fmtInt, fmtSeconds, fmtTps, rankBadge } from "@/lib/format";
import type { HistoryEntry } from "@/lib/types";

export function HistoryDrawer({
  open,
  onClose,
  entries,
  onRestore,
  onDelete,
  onClear,
}: {
  open: boolean;
  onClose: () => void;
  entries: HistoryEntry[];
  onRestore: (entry: HistoryEntry) => void;
  onDelete: (id: string) => void;
  onClear: () => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-ink/30" onClick={onClose}>
      <div
        className="absolute right-0 top-0 h-full w-full max-w-md overflow-y-auto thin-scroll border-l border-line bg-paper shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 flex items-center justify-between border-b border-line bg-paper px-5 py-3">
          <div className="font-bold text-[15px]">对比历史</div>
          <div className="flex items-center gap-3">
            {entries.length > 0 && (
              <button
                onClick={onClear}
                className="text-[11.5px] text-faint hover:text-accent cursor-pointer"
              >
                清空
              </button>
            )}
            <button
              onClick={onClose}
              className="text-faint hover:text-ink text-[18px] leading-none cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>

        {entries.length === 0 ? (
          <div className="p-6 text-[12.5px] text-faint">
            还没有历史记录。每次对比完成后会自动存档在这里（仅保存在本机）。
          </div>
        ) : (
          <div className="p-4 space-y-3">
            {entries.map((h) => (
              <div
                key={h.id}
                className="rounded-lg border border-line bg-card p-3.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="font-semibold text-[13.5px] truncate">
                      {h.title || "未命名对比"}
                    </div>
                    <div className="num text-[10.5px] text-faint">
                      {new Date(h.at).toLocaleString("zh-CN", {
                        hour12: false,
                      })}
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => onRestore(h)}
                      className="text-[11.5px] text-faint hover:text-ink border border-line rounded px-1.5 py-0.5 cursor-pointer"
                    >
                      恢复查看
                    </button>
                    <button
                      onClick={() => onDelete(h.id)}
                      className="text-[11.5px] text-faint hover:text-accent cursor-pointer"
                    >
                      删除
                    </button>
                  </div>
                </div>
                <div className="mt-1.5 text-[11.5px] text-faint line-clamp-2">
                  {h.prompt}
                </div>
                <div className="mt-2 space-y-1">
                  {h.results.map((r, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between text-[11px]"
                    >
                      <span className="truncate font-medium">
                        {rankBadge(r.rank)} {r.name}
                      </span>
                      <span className="num text-faint shrink-0">
                        {r.status === "error"
                          ? "失败"
                          : r.metrics
                            ? `首响 ${fmtSeconds(r.metrics.ttftMs)}s · ${fmtTps(
                                r.metrics.avgTps
                              )} tok/s · ${fmtInt(r.metrics.outputTokens)} tok`
                            : "—"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
