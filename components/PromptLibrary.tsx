"use client";

import { useState } from "react";
import { PROMPT_LIBRARY, type PromptItem } from "@/lib/prompts";

/** Prompt 库：内置分类浏览 + 自定义增删 + 导入导出 */
export function PromptLibrary({
  open,
  onClose,
  onPick,
  custom,
  onChangeCustom,
}: {
  open: boolean;
  onClose: () => void;
  onPick: (text: string) => void;
  custom: PromptItem[];
  onChangeCustom: (next: PromptItem[]) => void;
}) {
  const [tab, setTab] = useState<"builtin" | "mine">("builtin");
  const [filter, setFilter] = useState("");
  const [draft, setDraft] = useState<PromptItem>({ label: "", text: "" });
  const [msg, setMsg] = useState("");

  if (!open) return null;

  const pick = (text: string) => {
    onPick(text);
    onClose();
  };

  const addCustom = () => {
    if (!draft.label.trim() || !draft.text.trim()) return;
    onChangeCustom([{ label: draft.label.trim(), text: draft.text }, ...custom]);
    setDraft({ label: "", text: "" });
    setMsg("已添加 ✓");
    setTimeout(() => setMsg(""), 1500);
  };

  const removeCustom = (i: number) =>
    onChangeCustom(custom.filter((_, idx) => idx !== i));

  const exportCustom = () => {
    const blob = new Blob(
      [JSON.stringify({ __app: "model-arena-prompts", v: 1, items: custom }, null, 2)],
      { type: "application/json" }
    );
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `prompt-库-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  };

  const importCustom = async (file: File) => {
    try {
      const data = JSON.parse(await file.text());
      const items: unknown =
        data?.items ?? (Array.isArray(data) ? data : null);
      if (!Array.isArray(items)) {
        setMsg("文件格式不对");
        return;
      }
      const valid = items.filter(
        (x): x is PromptItem =>
          x && typeof x.label === "string" && typeof x.text === "string"
      );
      if (!valid.length) {
        setMsg("没有可导入的条目");
        return;
      }
      // 按 label 去重合并
      const seen = new Set(custom.map((c) => c.label));
      const merged = [...custom];
      for (const v of valid)
        if (!seen.has(v.label)) {
          merged.push({ label: v.label, text: v.text });
          seen.add(v.label);
        }
      onChangeCustom(merged);
      setMsg(`已导入 ${valid.length} 条 ✓`);
      setTab("mine");
    } catch {
      setMsg("导入失败：不是合法 JSON");
    }
    setTimeout(() => setMsg(""), 2000);
  };

  const f = filter.trim().toLowerCase();
  const matchItem = (it: PromptItem) =>
    !f ||
    it.label.toLowerCase().includes(f) ||
    it.text.toLowerCase().includes(f);

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-ink/30 p-4 pt-[5vh]"
      onClick={onClose}
    >
      <div
        className="flex max-h-[88vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-line bg-paper shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 头 */}
        <div className="flex items-center justify-between border-b border-line px-5 py-3">
          <div>
            <div className="text-[15px] font-bold">Prompt 库</div>
            <div className="text-[11px] text-faint">
              精选 benchmark 评测题，点击即用；也可保存自己的常用 Prompt
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-md border border-line px-2.5 py-1.5 text-[16px] leading-none text-faint hover:text-ink cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* tab + 搜索 */}
        <div className="flex items-center gap-2 border-b border-line px-5 py-2.5">
          <button
            onClick={() => setTab("builtin")}
            className={`rounded-md px-3 py-1.5 text-[12.5px] cursor-pointer ${
              tab === "builtin"
                ? "bg-ink text-paper font-semibold"
                : "border border-line text-faint hover:text-ink"
            }`}
          >
            内置评测集
          </button>
          <button
            onClick={() => setTab("mine")}
            className={`rounded-md px-3 py-1.5 text-[12.5px] cursor-pointer ${
              tab === "mine"
                ? "bg-ink text-paper font-semibold"
                : "border border-line text-faint hover:text-ink"
            }`}
          >
            我的 Prompt（{custom.length}）
          </button>
          {tab === "builtin" && (
            <input
              className="ml-auto w-44 rounded-md border border-line bg-card px-2.5 py-1.5 text-[12px] outline-none focus:border-ink/40"
              placeholder="搜索…"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />
          )}
          {msg && (
            <span className="ml-auto text-[11.5px]" style={{ color: "var(--go)" }}>
              {msg}
            </span>
          )}
        </div>

        {/* 内容 */}
        <div className="thin-scroll flex-1 overflow-y-auto px-5 py-4">
          {tab === "builtin" ? (
            <div className="space-y-4">
              {PROMPT_LIBRARY.map((cat) => {
                const items = cat.items.filter(matchItem);
                if (!items.length) return null;
                return (
                  <div key={cat.category}>
                    <div className="mb-1.5 flex items-baseline gap-2">
                      <span className="text-[13px] font-bold">
                        {cat.icon} {cat.category}
                      </span>
                      {cat.hint && (
                        <span className="text-[10.5px] text-faint">
                          {cat.hint}
                        </span>
                      )}
                    </div>
                    <div className="space-y-1.5">
                      {items.map((it) => (
                        <button
                          key={it.label}
                          onClick={() => pick(it.text)}
                          className="block w-full rounded-md border border-line bg-card px-3 py-2 text-left hover:border-ink/40 cursor-pointer"
                        >
                          <div className="text-[12.5px] font-semibold">
                            {it.label}
                          </div>
                          <div className="mt-0.5 line-clamp-2 text-[11px] text-faint">
                            {it.text}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="space-y-4">
              {/* 新增表单 */}
              <div className="rounded-lg border border-line bg-card p-3">
                <div className="mb-1.5 text-[12px] font-semibold text-faint">
                  新增自定义 Prompt
                </div>
                <input
                  className="mb-1.5 w-full rounded-md border border-line px-2.5 py-1.5 text-[12.5px] outline-none focus:border-ink/40"
                  placeholder="名称，如：我的代码评测题"
                  value={draft.label}
                  onChange={(e) =>
                    setDraft({ ...draft, label: e.target.value })
                  }
                />
                <textarea
                  className="w-full rounded-md border border-line px-2.5 py-1.5 text-[12.5px] outline-none focus:border-ink/40"
                  rows={3}
                  placeholder="Prompt 内容…"
                  value={draft.text}
                  onChange={(e) => setDraft({ ...draft, text: e.target.value })}
                />
                <div className="mt-2 flex items-center gap-2">
                  <button
                    onClick={addCustom}
                    disabled={!draft.label.trim() || !draft.text.trim()}
                    className="rounded-md bg-ink px-4 py-1.5 text-[12.5px] font-semibold text-paper disabled:opacity-40 cursor-pointer"
                  >
                    添加
                  </button>
                  <div className="ml-auto flex gap-2">
                    <button
                      onClick={exportCustom}
                      disabled={!custom.length}
                      className="rounded-md border border-line px-3 py-1.5 text-[12px] text-faint hover:text-ink disabled:opacity-40 cursor-pointer"
                    >
                      ⤓ 导出
                    </button>
                    <label className="rounded-md border border-line px-3 py-1.5 text-[12px] text-faint hover:text-ink cursor-pointer">
                      ⤒ 导入
                      <input
                        type="file"
                        accept="application/json,.json"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          e.target.value = "";
                          if (file) await importCustom(file);
                        }}
                      />
                    </label>
                  </div>
                </div>
              </div>

              {/* 自定义列表 */}
              {custom.length === 0 ? (
                <div className="rounded-lg border border-dashed border-line px-4 py-8 text-center text-[12px] text-faint">
                  还没有自定义 Prompt。在上方添加，或导入之前导出的 JSON。
                </div>
              ) : (
                <div className="space-y-1.5">
                  {custom.map((it, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-2 rounded-md border border-line bg-card px-3 py-2"
                    >
                      <button
                        onClick={() => pick(it.text)}
                        className="min-w-0 flex-1 text-left cursor-pointer"
                      >
                        <div className="text-[12.5px] font-semibold">
                          {it.label}
                        </div>
                        <div className="mt-0.5 line-clamp-2 text-[11px] text-faint">
                          {it.text}
                        </div>
                      </button>
                      <button
                        onClick={() => removeCustom(i)}
                        title="删除"
                        className="shrink-0 text-[12px] text-faint hover:text-accent cursor-pointer"
                      >
                        删除
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
