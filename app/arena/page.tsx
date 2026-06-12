"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { HistoryDrawer } from "@/components/HistoryDrawer";
import { ModelCard } from "@/components/ModelCard";
import { SettingsDialog } from "@/components/SettingsDialog";
import { TrendModal } from "@/components/TrendModal";
import { buildMarkdown } from "@/lib/format";
import { fileToResizedDataUrl } from "@/lib/image";
import { PRESET_PROMPTS } from "@/lib/providers";
import { runEndpoint } from "@/lib/runner";
import {
  emptyRun,
  type HistoryEntry,
  type ModelEndpoint,
  type RunParams,
  type RunState,
} from "@/lib/types";

/* ---------- localStorage 持久化 ---------- */
function usePersisted<T>(
  key: string,
  initial: T
): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [val, setVal] = useState<T>(initial);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw != null) setVal(JSON.parse(raw) as T);
    } catch {
      /* ignore */
    }
    setReady(true);
  }, [key]);
  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(key, JSON.stringify(val));
    } catch {
      /* ignore */
    }
  }, [key, val, ready]);
  return [val, setVal];
}

const isRunning = (r: RunState) =>
  r.status === "connecting" || r.status === "thinking" || r.status === "streaming";

export default function Home() {
  /* 持久化状态 */
  const [endpoints, setEndpoints] = usePersisted<ModelEndpoint[]>(
    "ma.endpoints",
    []
  );
  const [title, setTitle] = usePersisted("ma.title", "");
  const [notes, setNotes] = usePersisted("ma.notes", "");
  const [prompt, setPrompt] = usePersisted("ma.prompt", "");
  const [params, setParams] = usePersisted<RunParams>("ma.params", {
    systemPrompt: "",
    temperature: "",
    maxTokens: "",
  });
  const [markdown, setMarkdown] = usePersisted("ma.markdown", true);
  const [thinkStats, setThinkStats] = usePersisted("ma.thinkStats", true);
  const [history, setHistory] = usePersisted<HistoryEntry[]>("ma.history", []);
  const [watermark, setWatermark] = usePersisted("ma.watermark", "");
  const [wmTiled, setWmTiled] = usePersisted("ma.wmTiled", false);
  const [theme, setTheme] = usePersisted<"light" | "dark">("ma.theme", "light");

  /* 运行时状态 */
  const [runs, setRuns] = useState<Record<string, RunState>>({});
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [screenshotMode, setScreenshotMode] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [restored, setRestored] = useState<HistoryEntry | null>(null);
  const [toast, setToast] = useState("");
  const [nowTick, setNowTick] = useState(0);
  const [wmOpen, setWmOpen] = useState(false);
  const [trendOpen, setTrendOpen] = useState(false);
  /** 视觉对比图片（仅本次会话，不持久化避免撑爆 localStorage） */
  const [image, setImage] = useState<{ dataUrl: string; name: string } | null>(
    null
  );

  /* 暗色主题：写到 <html data-theme>，CSS 变量整体切换 */
  useEffect(() => {
    if (theme === "dark") document.documentElement.dataset.theme = "dark";
    else delete document.documentElement.dataset.theme;
  }, [theme]);

  /* 平铺水印贴图（SVG data URL，斜排浅色文字） */
  const wmTile = (() => {
    if (!watermark.trim()) return "";
    const esc = watermark
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/'/g, "&apos;");
    const fill =
      theme === "dark" ? "rgba(235,232,223,0.06)" : "rgba(29,28,24,0.05)";
    const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='320' height='210'><text x='20' y='115' font-size='14' fill='${fill}' font-family='sans-serif' transform='rotate(-18 160 105)'>${esc}</text></svg>`;
    return `url("data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}")`;
  })();

  const controllerRef = useRef<AbortController | null>(null);
  const rankCounter = useRef(0);
  const pendingCount = useRef(0);
  const runsRef = useRef(runs);
  useEffect(() => {
    runsRef.current = runs;
  }, [runs]);

  const anyRunning = Object.values(runs).some(isRunning);

  /* 运行中每 100ms 刷新计时器 */
  useEffect(() => {
    if (!anyRunning) return;
    const id = setInterval(() => setNowTick(Date.now()), 100);
    return () => clearInterval(id);
  }, [anyRunning]);

  const flash = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 1600);
  };

  const updateRun = useCallback(
    (id: string) => (fn: (prev: RunState) => RunState) =>
      setRuns((prev) => ({ ...prev, [id]: fn(prev[id] ?? emptyRun()) })),
    []
  );

  const saveHistory = useCallback(
    (targets: ModelEndpoint[]) => {
      const cur = runsRef.current;
      const results = targets.map((t) => {
        const r = cur[t.id] ?? emptyRun();
        return {
          name: t.name,
          model: t.model,
          status: r.status,
          rank: r.rank,
          metrics: r.metrics,
          text: r.text.slice(0, 6000),
          reasoning: r.reasoning.slice(0, 3000),
          error: r.error,
        };
      });
      if (!results.some((r) => r.metrics || r.error)) return;
      const entry: HistoryEntry = {
        id: Math.random().toString(36).slice(2, 10),
        at: Date.now(),
        title,
        notes,
        prompt,
        results,
      };
      setHistory((prev) => [entry, ...prev].slice(0, 24));
    },
    [title, notes, prompt, setHistory]
  );

  const startAll = () => {
    const targets = endpoints.filter((e) => e.enabled);
    if (!targets.length || !prompt.trim() || anyRunning) return;
    setRestored(null);
    const ctrl = new AbortController();
    controllerRef.current = ctrl;
    rankCounter.current = 0;
    pendingCount.current = targets.length;
    setNowTick(Date.now());
    const fresh: Record<string, RunState> = {};
    for (const t of targets)
      fresh[t.id] = { ...emptyRun(), startedAt: Date.now() };
    setRuns(fresh);

    for (const t of targets) {
      void runEndpoint({
        endpoint: t,
        prompt,
        params,
        imageDataUrl: image?.dataUrl,
        signal: ctrl.signal,
        update: updateRun(t.id),
        onSettled: (ok) => {
          if (ok) {
            rankCounter.current += 1;
            const rank = rankCounter.current;
            setRuns((prev) => ({
              ...prev,
              [t.id]: { ...(prev[t.id] ?? emptyRun()), rank },
            }));
          }
          pendingCount.current -= 1;
          if (pendingCount.current <= 0) {
            setTimeout(() => saveHistory(targets), 80);
          }
        },
      });
    }
  };

  const rerunOne = (ep: ModelEndpoint) => {
    if (!prompt.trim() || restored) return;
    const ctrl = new AbortController();
    controllerRef.current = ctrl;
    setRuns((prev) => ({
      ...prev,
      [ep.id]: { ...emptyRun(), startedAt: Date.now() },
    }));
    setNowTick(Date.now());
    void runEndpoint({
      endpoint: ep,
      prompt,
      params,
      imageDataUrl: image?.dataUrl,
      signal: ctrl.signal,
      update: updateRun(ep.id),
      onSettled: () => {},
    });
  };

  const stopAll = () => controllerRef.current?.abort();

  /* 视图数据：恢复历史时渲染快照里的伪 endpoint */
  const visibleEndpoints: ModelEndpoint[] = restored
    ? restored.results.map((r, i) => ({
        id: `h-${i}`,
        name: r.name,
        model: r.model,
        kind: "openai" as const,
        baseUrl: "",
        apiKey: "",
        enabled: true,
      }))
    : endpoints.filter((e) => e.enabled);

  const copyResults = async () => {
    const rows = visibleEndpoints
      .map((ep) => ({
        name: ep.name,
        model: ep.model,
        run: runs[ep.id] ?? emptyRun(),
      }))
      .filter(({ run }) => run.metrics || run.error);
    if (!rows.length) {
      flash("还没有可复制的结果");
      return;
    }
    await navigator.clipboard.writeText(
      buildMarkdown({
        title,
        notes,
        prompt,
        rows,
        watermark,
        thinkingStats: thinkStats,
      })
    );
    flash("已复制 Markdown 表格 ✓");
  };

  const restoreHistory = (h: HistoryEntry) => {
    setTitle(h.title);
    setNotes(h.notes);
    setPrompt(h.prompt);
    setRestored(h);
    setHistoryOpen(false);
    const next: Record<string, RunState> = {};
    h.results.forEach((r, i) => {
      next[`h-${i}`] = {
        ...emptyRun(),
        status: r.status === "error" ? "error" : "done",
        text: r.text,
        reasoning: r.reasoning,
        metrics: r.metrics,
        rank: r.rank,
        error: r.error,
      };
    });
    setRuns(next);
  };

  const gridCols =
    visibleEndpoints.length <= 1
      ? "grid-cols-1 max-w-3xl"
      : visibleEndpoints.length === 2
        ? "md:grid-cols-2"
        : "md:grid-cols-2 xl:grid-cols-3";

  const hasResults = visibleEndpoints.some(
    (ep) => (runs[ep.id] ?? emptyRun()).metrics || runs[ep.id]?.error
  );

  const btn =
    "rounded-md border border-line bg-card px-2.5 py-1.5 text-[12px] text-faint hover:text-ink cursor-pointer";

  return (
    <main className="mx-auto max-w-7xl px-5 py-8">
      {/* ===== 标题区（可编辑，截图友好） ===== */}
      <header className="mb-5">
        <input
          className="ghost-input text-[30px] font-black leading-tight"
          style={{ fontFamily: "var(--font-title)" }}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="点击输入标题，如：Step 3.7 Flash · 实时速度实测"
        />
        <textarea
          className="ghost-input mt-1 text-[13.5px] leading-relaxed text-faint"
          rows={Math.max(notes.split("\n").length, 1)}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="点击输入备注，如：同一 Prompt 直连各家官方接口，主要看首响应与吞吐……"
        />
        <div className="num mt-1 text-[11px] text-faint/70">
          {new Date().toLocaleDateString("zh-CN")} ·{" "}
          {restored
            ? `历史快照 · ${new Date(restored.at).toLocaleString("zh-CN", { hour12: false })}`
            : `${endpoints.filter((e) => e.enabled).length} 个模型参与对比`}{" "}
          · {watermark.trim() || "Model Arena"}
        </div>
      </header>

      {/* ===== 工具条 ===== */}
      {!screenshotMode && (
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <button className={btn} onClick={() => setSettingsOpen(true)}>
            ⚙ 模型接入
          </button>
          <button className={btn} onClick={() => setHistoryOpen(true)}>
            🕘 历史
          </button>
          <button
            className={btn}
            onClick={() => setMarkdown((v) => !v)}
            title="切换输出区 Markdown 渲染 / 原始文本"
          >
            {markdown ? "MD 渲染：开" : "MD 渲染：关"}
          </button>
          <button
            className={btn}
            onClick={() => setThinkStats((v) => !v)}
            title="关闭后不拆分思考/输出：首Token 按首个正文 token 计（思考计入等待），速度只按正文 token 计算"
          >
            {thinkStats ? "思考统计：开" : "思考统计：关"}
          </button>
          {hasResults && (
            <button className={btn} onClick={copyResults}>
              ⧉ 复制指标表
            </button>
          )}
          <button className={btn} onClick={() => setWmOpen((v) => !v)}>
            💧 水印{watermark.trim() ? "：开" : ""}
          </button>
          <button className={btn} onClick={() => setScreenshotMode(true)}>
            📷 截图模式
          </button>
          <button
            className={btn}
            onClick={() => setTrendOpen(true)}
            title="同一模型在历次对比中的速度走势"
          >
            📊 趋势
          </button>
          <button
            className={btn}
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            title="切换明暗主题"
          >
            {theme === "dark" ? "☀️ 浅色" : "🌙 暗色"}
          </button>
          {restored && (
            <button
              className={`${btn} text-accent border-accent/40`}
              onClick={() => {
                setRestored(null);
                setRuns({});
              }}
            >
              ← 退出历史快照
            </button>
          )}
          <span className="ml-auto text-[11px] text-accent">{toast}</span>
        </div>
      )}

      {/* 水印设置 */}
      {wmOpen && !screenshotMode && (
        <div className="mb-4 flex flex-wrap items-center gap-3 rounded-lg border border-line bg-card px-3.5 py-2.5">
          <input
            className="num w-72 rounded-md border border-line px-2.5 py-1.5 text-[12px] outline-none focus:border-ink/40"
            value={watermark}
            onChange={(e) => setWatermark(e.target.value)}
            placeholder="如 小红书 @你的ID · X @yourID"
          />
          <label className="flex cursor-pointer items-center gap-1.5 text-[11.5px] text-faint">
            <input
              type="checkbox"
              checked={wmTiled}
              onChange={(e) => setWmTiled(e.target.checked)}
              className="accent-[var(--accent)]"
            />
            平铺防盗水印
          </label>
          <span className="text-[11px] text-faint/80">
            显示在页头信息行 + 页面右下角徽标，复制的 Markdown 表格也会带上署名
          </span>
        </div>
      )}

      {/* ===== Prompt 区 ===== */}
      {!screenshotMode ? (
        <div className="mb-5 rounded-lg border border-line bg-card p-3.5">
          <textarea
            className="ghost-input text-[14px] leading-relaxed min-h-[64px]"
            rows={3}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="输入要同时发给所有模型的 Prompt……"
          />
          <div className="mt-2 flex flex-wrap items-center gap-2 border-t border-line pt-2.5">
            <select
              className="rounded-md border border-line bg-card px-2 py-1.5 text-[12px] text-faint outline-none cursor-pointer max-w-[210px]"
              value=""
              onChange={(e) => {
                const p = PRESET_PROMPTS[Number(e.target.value)];
                if (p) setPrompt(p.text);
                e.target.value = "";
              }}
            >
              <option value="" disabled>
                ⚡ 预设测速 Prompt
              </option>
              {PRESET_PROMPTS.map((p, i) => (
                <option key={i} value={i}>
                  {p.label}
                </option>
              ))}
            </select>
            <button className={btn} onClick={() => setShowAdvanced((v) => !v)}>
              {showAdvanced ? "▾" : "▸"} 高级参数
            </button>
            <label
              className={btn}
              title="上传一张图随 Prompt 发给所有模型，对比各家视觉模型的识图速度与质量（自动压缩到 1600px JPEG）"
            >
              🖼 图片
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={async (e) => {
                  const f = e.target.files?.[0];
                  e.target.value = "";
                  if (!f) return;
                  try {
                    const dataUrl = await fileToResizedDataUrl(f);
                    setImage({ dataUrl, name: f.name });
                    flash("图片已就绪，将随 Prompt 一起发送 ✓");
                  } catch {
                    flash("图片读取失败");
                  }
                }}
              />
            </label>
            {image && (
              <span className="flex items-center gap-1.5 rounded-md border border-line bg-paper/60 px-1.5 py-1">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={image.dataUrl}
                  alt="对比用图片"
                  className="h-7 w-7 rounded border border-line object-cover"
                />
                <span className="num max-w-[110px] truncate text-[10.5px] text-faint">
                  {image.name}
                </span>
                <button
                  onClick={() => setImage(null)}
                  className="px-0.5 text-[12px] text-faint hover:text-accent cursor-pointer"
                  title="移除图片"
                >
                  ✕
                </button>
              </span>
            )}
            <div className="ml-auto flex items-center gap-2">
              {anyRunning ? (
                <button
                  onClick={stopAll}
                  className="rounded-md bg-accent px-6 py-2 text-[14px] font-bold text-white cursor-pointer"
                >
                  停 止
                </button>
              ) : (
                <button
                  onClick={startAll}
                  disabled={!prompt.trim() || !endpoints.some((e) => e.enabled)}
                  className="rounded-md bg-ink px-6 py-2 text-[14px] font-bold text-paper disabled:opacity-35 cursor-pointer"
                >
                  开始对比 ▶
                </button>
              )}
            </div>
          </div>
          {showAdvanced && (
            <div className="mt-2.5 grid gap-2.5 border-t border-line pt-2.5 sm:grid-cols-3">
              <label className="sm:col-span-3 block">
                <div className="text-[11px] text-faint mb-1">
                  System Prompt（所有模型共用，留空不传）
                </div>
                <textarea
                  className="w-full rounded-md border border-line px-2.5 py-1.5 text-[12.5px] outline-none focus:border-ink/40"
                  rows={2}
                  value={params.systemPrompt}
                  onChange={(e) =>
                    setParams({ ...params, systemPrompt: e.target.value })
                  }
                />
              </label>
              <label className="block">
                <div className="text-[11px] text-faint mb-1">
                  Temperature（留空 = 厂商默认）
                </div>
                <input
                  className="num w-full rounded-md border border-line px-2.5 py-1.5 text-[12.5px] outline-none focus:border-ink/40"
                  value={params.temperature}
                  onChange={(e) =>
                    setParams({ ...params, temperature: e.target.value })
                  }
                  placeholder="如 0.7"
                />
              </label>
              <label className="block">
                <div className="text-[11px] text-faint mb-1">
                  Max Tokens（留空 = 厂商默认）
                </div>
                <input
                  className="num w-full rounded-md border border-line px-2.5 py-1.5 text-[12.5px] outline-none focus:border-ink/40"
                  value={params.maxTokens}
                  onChange={(e) =>
                    setParams({ ...params, maxTokens: e.target.value })
                  }
                  placeholder="如 8192"
                />
              </label>
            </div>
          )}
        </div>
      ) : (
        prompt.trim() && (
          <div className="mb-5 rounded-lg border border-line bg-card px-4 py-3 text-[13.5px] leading-relaxed whitespace-pre-wrap">
            {prompt}
            {image && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={image.dataUrl}
                alt="对比用图片"
                className="mt-2.5 max-h-44 rounded-md border border-line"
              />
            )}
          </div>
        )
      )}

      {/* ===== 对比卡片 ===== */}
      {visibleEndpoints.length === 0 ? (
        <div className="rounded-lg border border-dashed border-line bg-card/60 px-6 py-14 text-center">
          <div className="text-[15px] font-semibold mb-1.5">还没有接入模型</div>
          <div className="text-[12.5px] text-faint mb-4">
            支持 DeepSeek / Kimi / 智谱 / 通义 / 豆包 / 阶跃 / MiniMax / OpenAI
            / Claude / Gemini …… 以及任何 OpenAI 兼容接口
          </div>
          <button
            onClick={() => setSettingsOpen(true)}
            className="rounded-md bg-ink px-5 py-2 text-[13px] font-bold text-paper cursor-pointer"
          >
            ⚙ 去接入模型
          </button>
        </div>
      ) : (
        <div className={`grid gap-4 ${gridCols}`}>
          {visibleEndpoints.map((ep) => (
            <ModelCard
              key={ep.id}
              endpoint={ep}
              run={runs[ep.id] ?? emptyRun()}
              markdown={markdown}
              screenshotMode={screenshotMode || !!restored}
              thinkingStats={thinkStats}
              nowTick={nowTick}
              onRerun={() => rerunOne(ep)}
            />
          ))}
        </div>
      )}

      {/* 平铺防盗水印（不挡点击） */}
      {watermark.trim() && wmTiled && (
        <div
          aria-hidden
          className="pointer-events-none fixed inset-0 z-20"
          style={{ backgroundImage: wmTile }}
        />
      )}
      {/* 右下角水印徽标 */}
      {watermark.trim() && (
        <div className="pointer-events-none fixed bottom-4 right-4 z-30 rounded-full bg-ink/85 px-3.5 py-1.5 text-[11.5px] text-paper shadow-md">
          {watermark}
        </div>
      )}

      {/* 截图模式浮动退出按钮（放左下，避开水印） */}
      {screenshotMode && (
        <button
          onClick={() => setScreenshotMode(false)}
          className="fixed bottom-5 left-5 rounded-full border border-line bg-card px-4 py-2 text-[12px] text-faint shadow-md hover:text-ink cursor-pointer"
        >
          退出截图模式
        </button>
      )}

      <SettingsDialog
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        endpoints={endpoints}
        onChange={setEndpoints}
      />
      <HistoryDrawer
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        entries={history}
        onRestore={restoreHistory}
        onDelete={(id) => setHistory((prev) => prev.filter((h) => h.id !== id))}
        onClear={() => setHistory([])}
      />
      <TrendModal
        open={trendOpen}
        onClose={() => setTrendOpen(false)}
        entries={history}
      />

      {!screenshotMode && (
        <footer className="mt-10 text-center text-[11px] text-faint/70">
          指标说明：首Token = 请求发出到收到第一个 token（含网络往返与排队）·
          思考TPS / 输出TPS 各按该阶段「首个→末个 token」的活跃窗口独立计时，
          不含阶段间空隙与流收尾时间 · 总 Tokens 优先采用厂商官方
          usage；思考/输出拆分无官方数据时按各阶段字符独立估算后校准（数字前标 ≈）
        </footer>
      )}
    </main>
  );
}
