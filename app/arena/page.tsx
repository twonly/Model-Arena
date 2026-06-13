"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Credit } from "@/components/Credit";
import { HistoryDrawer } from "@/components/HistoryDrawer";
import { ModelCard, STATUS_COLOR } from "@/components/ModelCard";
import { SettingsDialog } from "@/components/SettingsDialog";
import { TrendModal } from "@/components/TrendModal";
import { buildMarkdown, extractWordTarget } from "@/lib/format";
import { fileToResizedDataUrl } from "@/lib/image";
import { PRESET_PROMPTS } from "@/lib/providers";
import { runEndpoint } from "@/lib/runner";
import { rankBadge } from "@/lib/format";
import {
  CONSENT_FIELDS,
  CONSENT_VERSION,
  reportConsent,
  reportRunMetrics,
  type ConsentChoice,
} from "@/lib/telemetry";
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

/** 稳定引用的空 run：避免每次渲染 new 对象打穿 ModelCard 的 memo */
const EMPTY_RUN = emptyRun();

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
  const [compact, setCompact] = usePersisted("ma.compact", false);
  const [history, setHistory] = usePersisted<HistoryEntry[]>("ma.history", []);
  const [watermark, setWatermark] = usePersisted("ma.watermark", "");
  const [wmTiled, setWmTiled] = usePersisted("ma.wmTiled", false);
  const [theme, setTheme] = usePersisted<"light" | "dark">("ma.theme", "light");
  /** 遥测同意状态：undefined = 还没问过 */
  const [telemetry, setTelemetry] = usePersisted<{
    choice?: ConsentChoice;
    version?: number;
    at?: number;
  }>("ma.telemetry", {});

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
  /** 前台隐藏的模型（后台照常跑，随时可恢复显示） */
  const [hiddenIds, setHiddenIds] = usePersisted<string[]>("ma.hidden", []);
  /** 单模型放大查看（不影响其他模型运行） */
  const [focusId, setFocusId] = useState<string | null>(null);

  /* Esc 退出放大视图 */
  useEffect(() => {
    if (!focusId) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setFocusId(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [focusId]);

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
  // 通过 ref 取最新值：saveHistory / rerunOne 可能被旧闭包调用
  // （ModelCard memo 忽略函数 props 的前提就是这里读 ref）
  const telemetryRef = useRef(telemetry);
  useEffect(() => {
    telemetryRef.current = telemetry;
  }, [telemetry]);
  const imageRef = useRef(image);
  useEffect(() => {
    imageRef.current = image;
  }, [image]);
  const promptRef = useRef(prompt);
  useEffect(() => {
    promptRef.current = prompt;
  }, [prompt]);
  const paramsRef = useRef(params);
  useEffect(() => {
    paramsRef.current = params;
  }, [params]);
  const restoredRef = useRef(restored);
  useEffect(() => {
    restoredRef.current = restored;
  }, [restored]);

  const decideTelemetry = (choice: ConsentChoice) => {
    setTelemetry({ choice, version: CONSENT_VERSION, at: Date.now() });
    void reportConsent(choice);
    flash(choice === "granted" ? "已开启匿名指标共享，感谢支持 ❤" : "好的，不共享");
  };

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
      // 用户已同意时，把本轮指标匿名上报（只有数字，无 Key 无内容）
      if (telemetryRef.current.choice === "granted") {
        void reportRunMetrics({
          runId: entry.id,
          promptChars: prompt.length,
          hasImage: !!imageRef.current,
          rows: targets.map((t) => ({
            endpoint: t,
            run: cur[t.id] ?? emptyRun(),
          })),
        });
      }
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
    // 全部走 ref：此函数可能被 memo 卡片里的旧闭包调用
    if (!promptRef.current.trim() || restoredRef.current) return;
    const ctrl = new AbortController();
    controllerRef.current = ctrl;
    setRuns((prev) => ({
      ...prev,
      [ep.id]: { ...emptyRun(), startedAt: Date.now() },
    }));
    setNowTick(Date.now());
    void runEndpoint({
      endpoint: ep,
      prompt: promptRef.current,
      params: paramsRef.current,
      imageDataUrl: imageRef.current?.dataUrl,
      signal: ctrl.signal,
      update: updateRun(ep.id),
      onSettled: () => {},
    });
  };

  const stopAll = () => controllerRef.current?.abort();

  const toggleHidden = (id: string) =>
    setHiddenIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );

  /** 在「已启用」序列里左右移动模型（持久化到 endpoints 顺序） */
  const moveEndpoint = (id: string, dir: -1 | 1) =>
    setEndpoints((prev) => {
      const enabledIds = prev.filter((e) => e.enabled).map((e) => e.id);
      const pos = enabledIds.indexOf(id);
      const targetId = enabledIds[pos + dir];
      if (!targetId) return prev;
      const a = prev.findIndex((e) => e.id === id);
      const b = prev.findIndex((e) => e.id === targetId);
      const next = [...prev];
      [next[a], next[b]] = [next[b], next[a]];
      return next;
    });

  /* 视图数据：恢复历史时渲染快照里的伪 endpoint */
  const enabledEndpoints: ModelEndpoint[] = restored
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

  /* 前台展示 = 启用 − 手动隐藏（隐藏的后台照常跑） */
  const visibleEndpoints = restored
    ? enabledEndpoints
    : enabledEndpoints.filter((e) => !hiddenIds.includes(e.id));

  const focusEndpoint = focusId
    ? enabledEndpoints.find((e) => e.id === focusId)
    : null;

  const copyResults = async () => {
    // 导出包含被隐藏的模型（它们也在跑）
    const rows = enabledEndpoints
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

  const gridCols = compact
    ? // 紧凑模式卡片矮，一行多放
      visibleEndpoints.length <= 2
      ? "sm:grid-cols-2"
      : "sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
    : visibleEndpoints.length <= 1
      ? "grid-cols-1 max-w-3xl"
      : visibleEndpoints.length === 2
        ? "md:grid-cols-2"
        : "md:grid-cols-2 xl:grid-cols-3";

  const hasResults = visibleEndpoints.some(
    (ep) => (runs[ep.id] ?? emptyRun()).metrics || runs[ep.id]?.error
  );

  // Prompt 含「N 字」要求时，卡片显示字数达成率
  const wordTarget = extractWordTarget(restored ? restored.prompt : prompt);

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
        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="num text-[11px] text-faint/70">
            {new Date().toLocaleDateString("zh-CN")} ·{" "}
            {restored
              ? `历史快照 · ${new Date(restored.at).toLocaleString("zh-CN", { hour12: false })}`
              : `${endpoints.filter((e) => e.enabled).length} 个模型参与对比`}{" "}
            · {watermark.trim() || "百模竞速 Model Arena"}
          </span>
          <Credit compact />
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
          <button
            className={btn}
            onClick={() => setCompact((v) => !v)}
            title="紧凑模式：折叠输出内容只看指标，多模型纯竞速一屏看全"
          >
            {compact ? "📊 紧凑：开" : "📊 紧凑：关"}
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
            title="同一模型在历次对比中的速度走势（本机历史）"
          >
            📈 趋势
          </button>
          <a
            className={btn}
            href="/stats"
            target="_blank"
            rel="noopener noreferrer"
            title="全网用户实测的大模型速度排行榜"
          >
            🏆 排行榜
          </a>
          <button
            className={btn}
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            title="切换明暗主题"
          >
            {theme === "dark" ? "☀️ 浅色" : "🌙 暗色"}
          </button>
          {telemetry.choice && (
            <button
              className={btn}
              onClick={() =>
                decideTelemetry(
                  telemetry.choice === "granted" ? "denied" : "granted"
                )
              }
              title="匿名共享评测指标数据（仅数字指标，不含 API Key 与输入输出内容），可随时开关"
            >
              📡 指标共享：{telemetry.choice === "granted" ? "开" : "关"}
            </button>
          )}
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

      {/* ===== 遥测同意声明（首次出结果后询问一次） ===== */}
      {!telemetry.choice && hasResults && !screenshotMode && !restored && (
        <div className="mb-4 rounded-lg border border-line bg-card px-4 py-3">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <span className="text-[13px] font-semibold">
              📡 愿意匿名共享这些评测指标吗？
            </span>
            <span className="text-[12px] text-faint">
              只上传速度/token 等数字指标，帮助分析各家模型的真实表现；
              <b className="text-ink">不上传 API Key 和任何输入输出内容</b>。
            </span>
            <details className="text-[12px] text-faint">
              <summary className="cursor-pointer select-none hover:text-ink">
                查看明细
              </summary>
              <div className="mt-1.5 grid gap-x-6 gap-y-0.5 sm:grid-cols-2">
                <div>
                  <div className="font-semibold text-ink">会保存：</div>
                  {CONSENT_FIELDS.collected.map((f) => (
                    <div key={f}>· {f}</div>
                  ))}
                </div>
                <div>
                  <div className="font-semibold" style={{ color: "var(--accent)" }}>
                    永不保存：
                  </div>
                  {CONSENT_FIELDS.notCollected.map((f) => (
                    <div key={f}>· {f}</div>
                  ))}
                </div>
              </div>
            </details>
            <span className="ml-auto flex gap-2">
              <button
                onClick={() => decideTelemetry("granted")}
                className="rounded-md bg-ink px-3.5 py-1.5 text-[12px] font-semibold text-paper cursor-pointer"
              >
                同意共享
              </button>
              <button
                onClick={() => decideTelemetry("denied")}
                className="rounded-md border border-line px-3.5 py-1.5 text-[12px] text-faint hover:text-ink cursor-pointer"
              >
                不共享
              </button>
            </span>
          </div>
        </div>
      )}

      {/* ===== 模型条：隐藏/显示与排序（隐藏的模型后台照常跑） ===== */}
      {!screenshotMode && !restored && enabledEndpoints.length >= 2 && (
        <div className="mb-3 flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] text-faint shrink-0">显示</span>
          {enabledEndpoints.map((ep, idx) => {
            const run = runs[ep.id] ?? emptyRun();
            const hidden = hiddenIds.includes(ep.id);
            return (
              <span
                key={ep.id}
                className={`flex items-center gap-0.5 rounded-md border border-line px-1.5 py-1 text-[11.5px] ${
                  hidden ? "bg-paper/40 opacity-50" : "bg-card"
                }`}
              >
                <button
                  onClick={() => toggleHidden(ep.id)}
                  title={
                    hidden
                      ? "点击恢复显示（后台一直在跑）"
                      : "点击隐藏此模型（后台继续跑，随时可恢复）"
                  }
                  className="flex items-center gap-1.5 cursor-pointer"
                >
                  <span
                    className={`inline-block h-1.5 w-1.5 rounded-full ${isRunning(run) ? "pulsing" : ""}`}
                    style={{ background: STATUS_COLOR[run.status] }}
                  />
                  <span className={hidden ? "line-through" : ""}>
                    {ep.name}
                  </span>
                  {run.rank != null && <span>{rankBadge(run.rank)}</span>}
                </button>
                <button
                  onClick={() => moveEndpoint(ep.id, -1)}
                  disabled={idx === 0}
                  title="左移"
                  className="px-0.5 text-faint hover:text-ink disabled:opacity-25 cursor-pointer"
                >
                  ◂
                </button>
                <button
                  onClick={() => moveEndpoint(ep.id, 1)}
                  disabled={idx === enabledEndpoints.length - 1}
                  title="右移"
                  className="px-0.5 text-faint hover:text-ink disabled:opacity-25 cursor-pointer"
                >
                  ▸
                </button>
              </span>
            );
          })}
          {hiddenIds.length > 0 && (
            <button
              onClick={() => setHiddenIds([])}
              className="text-[11px] text-faint underline hover:text-ink cursor-pointer"
            >
              全部显示
            </button>
          )}
        </div>
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
          {visibleEndpoints.map((ep) => {
            const run = runs[ep.id] ?? EMPTY_RUN;
            return (
              <ModelCard
                key={ep.id}
                endpoint={ep}
                run={run}
                markdown={markdown}
                screenshotMode={screenshotMode || !!restored}
                thinkingStats={thinkStats}
                nowTick={isRunning(run) ? nowTick : 0}
                onRerun={() => rerunOne(ep)}
                onToggleFocus={() => setFocusId(ep.id)}
                wordTarget={wordTarget}
                compact={compact}
              />
            );
          })}
        </div>
      )}

      {/* ===== 单模型放大视图（其余模型后台继续跑） ===== */}
      {focusEndpoint && (
        <div
          className="fixed inset-0 z-40 overflow-y-auto bg-ink/45 p-4 pt-[4vh]"
          onClick={() => setFocusId(null)}
        >
          <div
            className="mx-auto w-full max-w-3xl"
            onClick={(e) => e.stopPropagation()}
          >
            <ModelCard
              endpoint={focusEndpoint}
              run={runs[focusEndpoint.id] ?? EMPTY_RUN}
              markdown={markdown}
              screenshotMode={false}
              thinkingStats={thinkStats}
              nowTick={
                isRunning(runs[focusEndpoint.id] ?? EMPTY_RUN) ? nowTick : 0
              }
              onRerun={() => rerunOne(focusEndpoint)}
              expanded
              onToggleFocus={() => setFocusId(null)}
              wordTarget={wordTarget}
            />
          </div>
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
        <footer className="mt-10 space-y-2 text-center text-[11px] text-faint/70">
          <div>
            指标说明：首Token = 请求发出到收到第一个 token（含网络往返与排队）·
            思考TPS / 输出TPS 各按该阶段「首个→末个 token」的活跃窗口独立计时，
            不含阶段间空隙与流收尾时间 · 总 Tokens 优先采用厂商官方
            usage；思考/输出拆分无官方数据时按各阶段字符独立估算后校准（数字前标 ≈）
          </div>
          <div>
            <Credit compact />
          </div>
        </footer>
      )}
    </main>
  );
}
