"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Credit } from "@/components/Credit";
import { HistoryDrawer } from "@/components/HistoryDrawer";
import { ModelCard, STATUS_COLOR } from "@/components/ModelCard";
import { VerdictCard } from "@/components/VerdictCard";
import { RaceTrack } from "@/components/RaceTrack";
import { computeVerdict } from "@/lib/verdict";
import { grade } from "@/lib/grade";
import { AccountDialog } from "@/components/AccountDialog";
import { AccountChip } from "@/components/AccountChip";
import { Logo } from "@/components/Logo";
import { ShareConfigDialog } from "@/components/ShareConfigDialog";
import { PromptLibrary } from "@/components/PromptLibrary";
import { ReviewDraftDialog } from "@/components/ReviewDraftDialog";
import { SettingsDialog } from "@/components/SettingsDialog";
import { TrendModal } from "@/components/TrendModal";
import { ReferralWelcomeBanner } from "@/components/ReferralWelcomeBanner";
import { ReferralRewardNotifier } from "@/components/ReferralRewardNotifier";
import { ReferralShareNudge } from "@/components/ReferralShareNudge";
import { SocialSharePanel } from "@/components/SocialSharePanel";
import { useI18n } from "@/components/I18nProvider";
import { htmlBadge, markdownBadge } from "@/lib/badge";
import { buildSharePostText } from "@/lib/social-share";
import { buildMarkdown, extractWordTarget } from "@/lib/format";
import { fileToResizedDataUrl } from "@/lib/image";
import type { PromptItem } from "@/lib/prompts";
import { runEndpoint } from "@/lib/runner";
import { rankBadge } from "@/lib/format";
import { buildSnapshot, thinSamples, type VotingConfigLite } from "@/lib/share";
import { createShare } from "@/lib/me";
import { toPng } from "html-to-image";
import {
  CONSENT_FIELDS,
  CONSENT_VERSION,
  getClientId,
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
import { QuotaBanner } from "@/components/QuotaBanner";
import { graduateShared, sharedAsEndpoints } from "@/lib/shared-models";
import { supabaseEnabled } from "@/lib/supabase-client";
import {
  ARENA_SEED_STORAGE_KEY,
  arenaSeedUsesTemporaryEndpoints,
  quickSample,
  quickSampleEndpoints,
  sharedEndpointsForModels,
  type ArenaSeed,
} from "@/lib/quickstart";

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
  const { locale, messages, href: localHref } = useI18n();
  const sampleCopy = quickSample(locale);
  const en = locale === "en";
  const arenaText = {
    telemetryUploading: en ? "Uploading..." : "上报中…",
    telemetryGranted: en ? "Anonymous metrics sharing enabled" : "已开启匿名指标共享 ❤",
    telemetryDenied: en ? "OK, metrics sharing is off" : "好的，不共享",
    templateMode: en ? "Template mode" : "评测模板模式",
    sampleMode: en ? "Quick sample mode" : "快速样例模式",
    shareFullMode: en ? "Copied test mode" : "复制评测模式",
    sharePromptMode: en ? "Prompt rerun mode" : "Prompt 复跑模式",
    exitTempMode: en ? "Switched back to professional mode with your local model settings" : "已切回专业模式，使用你本地保存的模型配置",
    quotaEmpty: en ? "Today's free trial quota is used up. Sign in or add your own Key to continue." : "今日免费体验额度已用完——登录或填自己的 Key 继续",
    quotaOwnOnly: en ? "Free quota is used up. This run will only use models configured with your own Key." : "免费额度已用完，本轮只跑你自己配置的模型",
    noCopyResults: en ? "No copyable results yet" : "还没有可复制的结果",
    markdownCopied: en ? "Markdown table copied" : "已复制 Markdown 表格 ✓",
    exportingImage: en ? "Generating long image..." : "正在生成长图…",
    imageDownloaded: en ? "Long image downloaded" : "长图已下载 ✓",
    imageFailed: en ? "Generation failed. Try again." : "生成失败，请重试",
    shareNoFinished: en ? "No model has finished yet. Share after metrics appear." : "还没有模型跑完，等出现指标后再分享",
    shareNoResults: en ? "No shareable results yet. Run a comparison first." : "还没有可分享的结果，请先跑一轮对比",
    sharePartialConfirm: (runningCount: number, rows: number) =>
      en
        ? `${runningCount} model(s) are still running. Sharing now includes only the ${rows} completed result(s).\nIt is better to wait until all models finish. Share now?`
        : `还有 ${runningCount} 个模型在跑，现在分享只会包含已完成的 ${rows} 个。\n建议等全部跑完再分享。确定现在就分享吗？`,
    shareCopiedPartial: en ? "Link copied. Some models are still running, so the snapshot only includes completed results." : "链接已复制（部分模型仍在跑，快照只含已完成的）✓",
    shareCopied: en ? "Share link copied" : "分享链接已复制 ✓",
    networkError: en ? "Network error" : "网络错误",
    copied: en ? "Copied" : "已复制 ✓",
    imageReady: en ? "Image is ready and will be sent with the Prompt." : "图片已就绪，将随 Prompt 一起发送 ✓",
    imageReadFailed: en ? "Failed to read image" : "图片读取失败",
    restoredSnapshot: en ? "History snapshot" : "历史快照",
    modelCount: (count: number) => (en ? `${count} models in comparison` : `${count} 个模型参与对比`),
  };
  const consentFields = en
    ? {
        collected: [
          "Model provider and API host (domain only)",
          "Model name and API protocol",
          "TTFT, reasoning/output phase latency and TPS, peak speed",
          "Input/output token counts and character lengths",
          "Run time, success status, and whether an image was included",
          "Anonymous device ID (random ID removable with browser data)",
        ],
        notCollected: ["API Key", "Prompt content", "Model output/reasoning content", "Uploaded image"],
      }
    : CONSENT_FIELDS;
  /* 持久化状态 */
  const [endpoints, setEndpoints] = usePersisted<ModelEndpoint[]>(
    "ma.endpoints",
    []
  );
  const [temporaryEndpoints, setTemporaryEndpoints] = useState<ModelEndpoint[] | null>(
    null
  );
  const [arenaSeedMode, setArenaSeedMode] = useState<ArenaSeed["mode"] | null>(
    null
  );
  const [savedTitle, setSavedTitle] = usePersisted("ma.title", "");
  const [savedNotes, setSavedNotes] = usePersisted("ma.notes", "");
  const [savedPrompt, setSavedPrompt] = usePersisted("ma.prompt", "");
  const [temporaryDraft, setTemporaryDraft] = useState<{
    title: string;
    notes: string;
    prompt: string;
    templateId?: string;
    templateTitle?: string;
  } | null>(null);
  const title = temporaryDraft?.title ?? savedTitle;
  const notes = temporaryDraft?.notes ?? savedNotes;
  const prompt = temporaryDraft?.prompt ?? savedPrompt;
  const setTitle: React.Dispatch<React.SetStateAction<string>> = (next) => {
    if (temporaryDraft) {
      setTemporaryDraft((prev) =>
        prev
          ? {
              ...prev,
              title: typeof next === "function" ? next(prev.title) : next,
            }
          : prev
      );
    } else {
      setSavedTitle(next);
    }
  };
  const setNotes: React.Dispatch<React.SetStateAction<string>> = (next) => {
    if (temporaryDraft) {
      setTemporaryDraft((prev) =>
        prev
          ? {
              ...prev,
              notes: typeof next === "function" ? next(prev.notes) : next,
            }
          : prev
      );
    } else {
      setSavedNotes(next);
    }
  };
  const setPrompt: React.Dispatch<React.SetStateAction<string>> = (next) => {
    if (temporaryDraft) {
      setTemporaryDraft((prev) =>
        prev
          ? {
              ...prev,
              prompt: typeof next === "function" ? next(prev.prompt) : next,
            }
          : prev
      );
    } else {
      setSavedPrompt(next);
    }
  };
  const [params, setParams] = usePersisted<RunParams>("ma.params", {
    systemPrompt: "",
    temperature: "",
    maxTokens: "",
  });
  const [markdown, setMarkdown] = usePersisted("ma.markdown", true);
  const [thinkStats, setThinkStats] = usePersisted("ma.thinkStats", true);
  const [compact, setCompact] = usePersisted("ma.compact", false);
  const [customPrompts, setCustomPrompts] = usePersisted<PromptItem[]>(
    "ma.customPrompts",
    []
  );
  const [history, setHistory] = usePersisted<HistoryEntry[]>("ma.history", []);
  // 共享「体验额度」状态（null = 未知/未启用）
  const [quota, setQuota] = useState<{
    remaining: number;
    limit: number;
    loggedIn: boolean;
    bonusRemaining: number;
  } | null>(null);
  const [referralEntry, setReferralEntry] = useState<{
    code: string;
    claimed: boolean;
  } | null>(null);

  // 首访预置共享模型（仅一次；已有自配模型则不种）
  useEffect(() => {
    try {
      if (localStorage.getItem("ma.seededShared")) return;
      const raw = localStorage.getItem("ma.endpoints");
      const existing = raw ? JSON.parse(raw) : [];
      localStorage.setItem("ma.seededShared", "1");
      if (!Array.isArray(existing) || existing.length === 0) {
        setEndpoints(sharedAsEndpoints());
      }
    } catch {
      /* ignore */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 「毕业」：用户一旦拥有可用的自配模型，体验模型整体退场（默认全部取消勾选）。
  // 依赖 endpoints，确保在 usePersisted 异步水合出真实数据之后才生效（否则会与水合竞争、
  // 在 StrictMode 下被回灌覆盖）。只在「首次出现可用自配模型」那一刻翻一次并落 localStorage
  // 标记，之后用户手动勾回的体验基线在刷新后依然保留。新增/导入自配模型也会经由此处统一处理。
  const graduatedRef = useRef(false);
  useEffect(() => {
    if (graduatedRef.current) return;
    try {
      if (localStorage.getItem("ma.graduatedShared")) {
        graduatedRef.current = true;
        return;
      }
    } catch {
      return;
    }
    const next = graduateShared(endpoints);
    if (next === endpoints) return; // 尚无可用自配模型，或体验模型本就未勾 → 暂不处理
    graduatedRef.current = true;
    try {
      localStorage.setItem("ma.graduatedShared", "1");
    } catch {
      /* ignore */
    }
    setEndpoints(next);
  }, [endpoints, setEndpoints]);

  const fetchQuota = useCallback(async () => {
    if (!supabaseEnabled()) return;
    try {
      const { authHeader } = await import("@/lib/me");
      const res = await fetch(
        `/api/shared/quota?clientId=${encodeURIComponent(getClientId())}`,
        { headers: await authHeader(), cache: "no-store" }
      );
      const j = await res.json();
      if (j.ok)
        setQuota({
          remaining: j.remaining,
          limit: j.limit,
          loggedIn: j.loggedIn,
          bonusRemaining: j.bonusRemaining ?? 0,
        });
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    void fetchQuota();
  }, [fetchQuota]);

  useEffect(() => {
    let alive = true;
    (async () => {
      const {
        captureReferralFromLocation,
        claimStoredReferral,
        storedReferralCode,
      } = await import("@/lib/referral-client");
      const code = captureReferralFromLocation() ?? storedReferralCode();
      if (!code || !alive) return;
      setReferralEntry({ code, claimed: false });
      const claim = await claimStoredReferral().catch(() => null);
      if (!alive) return;
      if (claim?.ok) {
        setReferralEntry({ code, claimed: true });
        void fetchQuota();
      }
    })();
    return () => {
      alive = false;
    };
  }, [fetchQuota]);
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
  const [promptLibOpen, setPromptLibOpen] = useState(false);
  // 工具条收纳：常驻关键项 + 「更多」展开其余
  const [moreOpen, setMoreOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  /** 视觉对比图片（仅本次会话，不持久化避免撑爆 localStorage） */
  const [image, setImage] = useState<{ dataUrl: string; name: string } | null>(
    null
  );
  /** 前台隐藏的模型（后台照常跑，随时可恢复显示） */
  const [hiddenIds, setHiddenIds] = usePersisted<string[]>("ma.hidden", []);
  /** 单模型放大查看（不影响其他模型运行） */
  const [focusId, setFocusId] = useState<string | null>(null);
  /** 正在导出长图（临时隐藏工具条等非内容元素） */
  const [exporting, setExporting] = useState(false);
  const mainRef = useRef<HTMLElement>(null);
  /** 分享：null=未分享，"loading"=生成中，否则为完整短链 */
  const [shareUrl, setShareUrl] = useState<string | "loading" | null>(null);
  /** 分享错误（持久显示，直到下次操作） */
  const [shareError, setShareError] = useState<string | null>(null);
  const [lastShareSummary, setLastShareSummary] = useState<{
    title: string;
    models: string[];
  } | null>(null);
  /** 遥测上报状态（短暂显示，让用户看到上报成功/失败） */
  const [telemetryStatus, setTelemetryStatus] = useState<string | null>(null);
  /** 分享配置弹窗 */
  const [shareCfgOpen, setShareCfgOpen] = useState(false);
  /** 生成评测稿弹窗 */
  const [reviewDraftOpen, setReviewDraftOpen] = useState(false);
  // 非空 = 正在分享某条历史快照（而非当前实时结果）
  const [shareSource, setShareSource] = useState<HistoryEntry | null>(null);
  const [referralNudge, setReferralNudge] = useState<
    "post-run" | "share" | "export" | null
  >(null);

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
  // 暂存最近一轮，供「同意」时立即补报（否则用户必须再跑一轮才有数据）
  const lastRunRef = useRef<{
    runId: string;
    targets: ModelEndpoint[];
    promptChars: number;
    hasImage: boolean;
    reported: boolean;
  } | null>(null);

  const reportMetrics = async (info: {
    runId: string;
    targets: ModelEndpoint[];
    promptChars: number;
    hasImage: boolean;
  }) => {
    const cur = runsRef.current;
    setTelemetryStatus(arenaText.telemetryUploading);
    const r = await reportRunMetrics({
      runId: info.runId,
      promptChars: info.promptChars,
      hasImage: info.hasImage,
      rows: info.targets.map((t) => ({
        endpoint: t,
        run: cur[t.id] ?? emptyRun(),
      })),
    });
    setTelemetryStatus(
      r.ok
        ? en
          ? `✓ Uploaded ${r.count} metric row(s)`
          : `✓ 已上报 ${r.count} 条指标`
        : en
          ? `✗ Upload failed: ${r.error}`
          : `✗ 上报失败：${r.error}`
    );
    setTimeout(() => setTelemetryStatus(null), 5000);
    return r;
  };

  const decideTelemetry = (choice: ConsentChoice) => {
    setTelemetry({ choice, version: CONSENT_VERSION, at: Date.now() });
    void reportConsent(choice);
    // 同意时，把刚跑完的这一轮立刻补报（不必再跑一轮）
    if (choice === "granted" && lastRunRef.current && !lastRunRef.current.reported) {
      lastRunRef.current.reported = true;
      void reportMetrics(lastRunRef.current);
    } else {
      flash(choice === "granted" ? arenaText.telemetryGranted : arenaText.telemetryDenied);
    }
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

  const shareErrorText = (j: { code?: string; error?: string; disabled?: boolean }) => {
    if (j.disabled) {
      return locale === "en"
        ? "Sharing is not enabled: Supabase environment variables are not configured on the server."
        : "分享功能未启用：服务端未配置 Supabase 环境变量";
    }
    const code = j.code as keyof typeof messages.apiErrors | undefined;
    return (code && messages.apiErrors[code]) || j.error || (locale === "en" ? "Sharing failed. Try again." : "分享失败，请重试");
  };

  useEffect(() => {
    try {
      const url = new URL(window.location.href);
      const sample = url.searchParams.get("sample") === "1";
      const seedRaw = sessionStorage.getItem(ARENA_SEED_STORAGE_KEY);
      if (!sample && !seedRaw) return;

      let seed: ArenaSeed | null = null;
      if (sample) {
        seed = {
          mode: "sample",
          title: sampleCopy.title,
          notes: sampleCopy.notes,
          prompt: sampleCopy.prompt,
        };
      } else if (seedRaw) {
        seed = JSON.parse(seedRaw) as ArenaSeed;
      }
      if (!seed?.prompt?.trim()) return;

      setTemporaryDraft({
        title: seed.title || sampleCopy.title,
        notes: seed.notes || "",
        prompt: seed.prompt,
        templateId: seed.templateId,
        templateTitle: seed.templateTitle,
      });
      setRestored(null);
      setRuns({});
      setShareUrl(null);
      setShareError(null);
      setHiddenIds([]);

      const seeded =
        seed.mode === "sample"
          ? quickSampleEndpoints()
          : sharedEndpointsForModels(seed.models);
      if (arenaSeedUsesTemporaryEndpoints(seed.mode) && seeded.length >= 2) {
        setTemporaryEndpoints(seeded);
        setArenaSeedMode(seed.mode);
      } else if (sample) {
        setTemporaryEndpoints(quickSampleEndpoints());
        setArenaSeedMode("sample");
      } else {
        setTemporaryEndpoints(null);
        setArenaSeedMode(seed.mode);
      }

      if (seedRaw) sessionStorage.removeItem(ARENA_SEED_STORAGE_KEY);
      url.searchParams.delete("sample");
      window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
      flash(
        seed.templateId
          ? locale === "en"
            ? "Template loaded. Use your current models to start."
            : "已带入评测模板，使用当前模型即可开跑"
          : seed.mode === "share-full"
          ? locale === "en"
            ? "Shared test settings copied. Check models, then start."
            : "已复制分享里的评测设置，检查模型后即可开跑"
          : seed.mode === "share-prompt"
            ? locale === "en"
              ? "Prompt loaded. Choose models, then start."
              : "已带入同一个 Prompt，选择模型后即可开跑"
            : locale === "en"
              ? "Quick sample is ready. Click start to run."
              : "快速样例已就绪，点击开始对比即可开跑"
      );
    } catch {
      /* ignore */
    }
    // 仅在首次进入页面时消费 URL / sessionStorage 种子。
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const showReferralNudge = (reason: "post-run" | "share" | "export") => {
    try {
      if (reason === "post-run") {
        const key = "ma.referral.postRunNudgeAt";
        const last = Number(localStorage.getItem(key) || 0);
        if (Date.now() - last < 24 * 60 * 60 * 1000) return;
        localStorage.setItem(key, String(Date.now()));
      }
    } catch {
      /* ignore */
    }
    setReferralNudge(reason);
  };

  const updateRun = useCallback(
    (id: string) => (fn: (prev: RunState) => RunState) =>
      setRuns((prev) => ({ ...prev, [id]: fn(prev[id] ?? emptyRun()) })),
    []
  );

  const activeEndpoints = temporaryEndpoints ?? endpoints;
  const usingTemporaryEndpoints = temporaryEndpoints != null;
  const usingTemporaryContext = usingTemporaryEndpoints || temporaryDraft != null;
  const temporaryModeLabel =
    temporaryDraft?.templateId
      ? arenaText.templateMode
      : arenaSeedMode === "sample"
      ? arenaText.sampleMode
      : arenaSeedMode === "share-full"
        ? arenaText.shareFullMode
        : arenaText.sharePromptMode;

  const exitTemporaryMode = () => {
    setTemporaryEndpoints(null);
    setArenaSeedMode(null);
    setTemporaryDraft(null);
    setRuns({});
    setShareUrl(null);
    setShareError(null);
    setHiddenIds([]);
    flash(arenaText.exitTempMode);
  };

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
          // 存速度曲线（抽稀到 150 点）：历史分享时才有曲线，代价是 localStorage 略增
          samples: thinSamples(r.samples, 150),
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
        templateId: temporaryDraft?.templateId,
        templateTitle: temporaryDraft?.templateTitle,
        results,
      };
      setHistory((prev) => [entry, ...prev].slice(0, 24));
      // 暂存本轮，供「同意」时补报
      const info = {
        runId: entry.id,
        targets,
        promptChars: prompt.length,
        hasImage: !!imageRef.current,
        reported: false,
      };
      lastRunRef.current = info;
      // 已同意：直接上报（只有数字，无 Key 无内容）
      if (telemetryRef.current.choice === "granted") {
        info.reported = true;
        void reportMetrics(info);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [title, notes, prompt, setHistory, temporaryDraft?.templateId, temporaryDraft?.templateTitle]
  );

  const startAll = () => {
    let targets = activeEndpoints.filter((e) => e.enabled);
    if (!targets.length || !prompt.trim() || anyRunning) return;
    // 免费额度用完：剔除共享模型，只跑用户自带 key 的
    if (quota && quota.remaining <= 0 && targets.some((t) => t.shared)) {
      targets = targets.filter((t) => !t.shared);
      if (!targets.length) {
        flash(arenaText.quotaEmpty);
        return;
      }
      flash(arenaText.quotaOwnOnly);
    }
    setRestored(null);
    setShareUrl(null); // 新一轮作废旧分享链接
    setShareError(null);
    const ctrl = new AbortController();
    controllerRef.current = ctrl;
    rankCounter.current = 0;
    pendingCount.current = targets.length;
    setNowTick(Date.now());
    const runId = crypto.randomUUID(); // 本轮唯一 ID：共享额度按此去重计 1 次
    const fresh: Record<string, RunState> = {};
    for (const t of targets)
      fresh[t.id] = { ...emptyRun(), startedAt: Date.now() };
    setRuns(fresh);

    let successfulCount = 0;
    for (const t of targets) {
      void runEndpoint({
        endpoint: t,
        prompt,
        params,
        imageDataUrl: image?.dataUrl,
        signal: ctrl.signal,
        update: updateRun(t.id),
        runId,
        onQuota: (remaining) =>
          setQuota((q) => (q ? { ...q, remaining } : q)),
        onSettled: (ok) => {
          if (ok) {
            successfulCount += 1;
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
            void fetchQuota(); // 跑完同步真实剩余额度
            if (targets.length >= 2 && successfulCount > 0) {
              showReferralNudge("post-run");
            }
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
      runId: crypto.randomUUID(),
      onQuota: (remaining) => setQuota((q) => (q ? { ...q, remaining } : q)),
      onSettled: () => {
        if (ep.shared) void fetchQuota();
      },
    });
  };

  const stopAll = () => controllerRef.current?.abort();

  const toggleHidden = (id: string) =>
    setHiddenIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );

  /** 在「已启用」序列里左右移动模型；样例/分享模式只改临时顺序。 */
  const moveEndpoint = (id: string, dir: -1 | 1) => {
    const move = (prev: ModelEndpoint[]) => {
      const enabledIds = prev.filter((e) => e.enabled).map((e) => e.id);
      const pos = enabledIds.indexOf(id);
      const targetId = enabledIds[pos + dir];
      if (!targetId) return prev;
      const a = prev.findIndex((e) => e.id === id);
      const b = prev.findIndex((e) => e.id === targetId);
      const next = [...prev];
      [next[a], next[b]] = [next[b], next[a]];
      return next;
    };
    if (usingTemporaryEndpoints) {
      setTemporaryEndpoints((prev) => (prev ? move(prev) : prev));
    } else {
      setEndpoints(move);
    }
  };

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
    : activeEndpoints.filter((e) => e.enabled);

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
      flash(arenaText.noCopyResults);
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
    flash(arenaText.markdownCopied);
  };

  const exportImage = async () => {
    const el = mainRef.current;
    if (!el || exporting) return;
    setExporting(true);
    flash(arenaText.exportingImage);
    // 等一帧让「隐藏工具条」生效
    await new Promise((r) => setTimeout(r, 60));
    try {
      const bg = getComputedStyle(document.body).backgroundColor;
      // 用 scrollWidth/Height 抓「完整内容」（含网格轻微溢出），否则右列/底部会被裁
      const w = Math.ceil(Math.max(el.scrollWidth, el.clientWidth));
      const h = Math.ceil(Math.max(el.scrollHeight, el.clientHeight));
      const opts = {
        pixelRatio: 2,
        width: w,
        height: h,
        backgroundColor: bg,
        cacheBust: true,
        // 关键：清掉 mx-auto 的自动外边距——否则 html-to-image 克隆时保留居中
        // 偏移，把右侧一列推出画布外被裁（本 bug 的真因）
        style: { margin: "0" },
        // 跳过被标记为不导出的元素（工具条、设置面板等）
        filter: (node: HTMLElement) =>
          !(node instanceof HTMLElement && node.dataset.noExport === "1"),
      };
      // 预热一次：首帧字体/速度曲线可能未就绪，二次渲染更完整
      await toPng(el, opts);
      const dataUrl = await toPng(el, opts);
      const a = document.createElement("a");
      a.download = `${(title || (en ? "model-comparison" : "模型对比")).slice(0, 30)}-${Date.now()}.png`;
      a.href = dataUrl;
      a.click();
      flash(arenaText.imageDownloaded);
      showReferralNudge("export");
    } catch {
      flash(arenaText.imageFailed);
    } finally {
      setExporting(false);
    }
  };

  /** 点「分享」：先校验，再开配置弹窗（选投票模式） */
  const openShareConfig = () => {
    if (shareUrl === "loading") return;
    setShareError(null);
    const rows = visibleEndpoints
      .map((ep) => ({ run: runs[ep.id] ?? emptyRun() }))
      .filter(({ run }) => run.metrics || run.error);
    if (!rows.length) {
      setShareError(
        anyRunning
          ? arenaText.shareNoFinished
          : arenaText.shareNoResults
      );
      return;
    }
    const runningCount = visibleEndpoints.filter((ep) =>
      isRunning(runs[ep.id] ?? emptyRun())
    ).length;
    if (runningCount > 0) {
      const ok = confirm(arenaText.sharePartialConfirm(runningCount, rows.length));
      if (!ok) return;
    }
    setShareCfgOpen(true);
  };

  /** 从历史抽屉分享某条快照：走同一个分享配置弹窗，数据用存档（含曲线） */
  const shareHistory = (h: HistoryEntry) => {
    if (shareUrl === "loading") return;
    setShareError(null);
    setShareSource(h);
    setHistoryOpen(false);
    setShareCfgOpen(true);
  };

  const shareResults = async (voting: VotingConfigLite | undefined) => {
    setShareCfgOpen(false);
    if (shareUrl === "loading") return;
    setShareError(null);
    const src = shareSource;
    // 历史分享：直接用存档的 results（含 samples 曲线）；否则用当前实时结果
    const rows = src
      ? src.results
          .filter((r) => r.metrics || r.error)
          .map((r) => ({
            name: r.name,
            model: r.model,
            run: {
              ...emptyRun(),
              status: r.status,
              rank: r.rank,
              metrics: r.metrics,
              text: r.text,
              reasoning: r.reasoning,
              samples: r.samples ?? [],
              error: r.error,
            } as RunState,
          }))
      : visibleEndpoints
          .map((ep) => ({
            name: ep.name,
            model: ep.model,
            run: runs[ep.id] ?? emptyRun(),
          }))
          .filter(({ run }) => run.metrics || run.error);
    if (!rows.length) {
      setShareSource(null);
      return;
    }
    const stillRunning =
      !src &&
      visibleEndpoints.some((ep) => isRunning(runs[ep.id] ?? emptyRun()));
    setShareUrl("loading");
    try {
      const snapshot = buildSnapshot({
        title: src ? src.title : title,
        notes: src ? src.notes : notes,
        prompt: src ? src.prompt : prompt,
        watermark,
        thinkingStats: thinkStats,
        rows,
        voting,
      });
      const j = await createShare(snapshot);
      if (!j.ok || !j.id) {
        setShareUrl(null);
        setShareError(shareErrorText(j));
        return;
      }
      const url = `${location.origin}${localHref(`/r/${j.id}`)}`;
      setShareUrl(url);
      setLastShareSummary({
        title: snapshot.title,
        models: snapshot.results.map((r) => r.name || r.model),
      });
      await navigator.clipboard.writeText(url).catch(() => {});
      flash(
        stillRunning
          ? arenaText.shareCopiedPartial
          : arenaText.shareCopied
      );
      showReferralNudge("share");
    } catch (e) {
      setShareUrl(null);
      setShareError(
        en
          ? `Sharing failed: ${e instanceof Error ? e.message : arenaText.networkError}. Try again.`
          : `分享失败：${e instanceof Error ? e.message : "网络错误"}，请重试`
      );
    } finally {
      setShareSource(null);
    }
  };

  const restoreHistory = (h: HistoryEntry) => {
    setTemporaryEndpoints(null);
    setArenaSeedMode(null);
    setTemporaryDraft(null);
    setSavedTitle(h.title);
    setSavedNotes(h.notes);
    setSavedPrompt(h.prompt);
    setRestored(h);
    setHistoryOpen(false);
    const next: Record<string, RunState> = {};
    h.results.forEach((r, i) => {
      next[`h-${i}`] = {
        ...emptyRun(),
        status:
          r.status === "error" || r.status === "truncated"
            ? r.status
            : "done",
        text: r.text,
        reasoning: r.reasoning,
        metrics: r.metrics,
        rank: r.rank,
        samples: r.samples ?? [],
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
  const reviewDraftRows = enabledEndpoints.map((ep) => ({
    name: ep.name,
    model: ep.model,
    run: runs[ep.id] ?? emptyRun(),
  }));
  const referralModelNames = enabledEndpoints
    .map((ep) => ep.name || ep.model)
    .filter(Boolean)
    .slice(0, 2);

  // Prompt 含「N 字」要求时，卡片显示字数达成率
  const wordTarget = extractWordTarget(restored ? restored.prompt : prompt);

  // 实时赛道：流式期间按累计 token 赛跑
  const runners = visibleEndpoints.map((ep) => {
    const run = runs[ep.id] ?? EMPTY_RUN;
    const m = run.metrics;
    return {
      id: ep.id,
      name: ep.name,
      tokens: m?.outputTokens ?? run.liveTokens ?? 0,
      tps: m?.contentTps ?? run.liveTps ?? 0,
      done:
        run.status === "done" ||
        run.status === "stopped" ||
        run.status === "truncated",
      running: isRunning(run),
    };
  });

  // 结算卡：跑完后选出最快/最省/答对/综合推荐（客观题自动判定）
  const verdict = computeVerdict(
    enabledEndpoints.map((ep) => {
      const run = runs[ep.id] ?? EMPTY_RUN;
      return {
        id: ep.id,
        name: ep.name,
        model: ep.model,
        status: run.status,
        metrics: run.metrics,
        graded: grade(restored ? restored.prompt : prompt, run.text),
      };
    })
  );
  const generatedShareId =
    shareUrl && shareUrl !== "loading"
      ? (() => {
          try {
            return new URL(shareUrl).pathname.split("/").filter(Boolean).pop() ?? "";
          } catch {
            return "";
          }
        })()
      : "";
  const generatedBadgeUrl =
    shareUrl && shareUrl !== "loading" && generatedShareId
      ? `${new URL(shareUrl).origin}/api/badge/share/${generatedShareId}?locale=${locale}`
      : "";
  const generatedShareTitle =
    lastShareSummary?.title.trim() ||
    title.trim() ||
    (en ? "Model speed comparison" : "模型速度对比");
  const generatedShareModels =
    lastShareSummary?.models.length
      ? lastShareSummary.models
      : visibleEndpoints
          .filter((ep) => (runs[ep.id] ?? emptyRun()).metrics || runs[ep.id]?.error)
          .map((ep) => ep.name || ep.model);
  const generatedShareText = buildSharePostText({
    title: generatedShareTitle,
    models: generatedShareModels,
    locale,
  });
  const generatedBadgeAlt = en
    ? `${generatedShareTitle} speed result on TOKRACE`
    : `${generatedShareTitle} 在 TOKRACE 上的速度结果`;
  const generatedBadgeMarkdown =
    shareUrl && shareUrl !== "loading" && generatedBadgeUrl
      ? markdownBadge({
          alt: generatedBadgeAlt,
          badgeUrl: generatedBadgeUrl,
          targetUrl: shareUrl,
        })
      : "";
  const generatedBadgeHtml =
    shareUrl && shareUrl !== "loading" && generatedBadgeUrl
      ? htmlBadge({
          alt: generatedBadgeAlt,
          badgeUrl: generatedBadgeUrl,
          targetUrl: shareUrl,
        })
      : "";

  const btn =
    "rounded-md border border-line bg-card px-2.5 py-1.5 text-[12px] text-faint hover:text-ink cursor-pointer";

  return (
    <main ref={mainRef} className="mx-auto max-w-7xl px-5 py-8">
      {!screenshotMode && (
        <ReferralRewardNotifier onOpenAccount={() => setAccountOpen(true)} />
      )}
      {/* ===== 顶部：右上角账号入口（截图时隐藏） ===== */}
      {!screenshotMode && (
        <div
          data-no-export="1"
          className="mb-3 flex flex-wrap items-center justify-between gap-2"
        >
          <Logo withText />
          <div className="flex flex-wrap items-center justify-end gap-2">
            <a
              className={btn}
              href={localHref("/stats")}
              target="_blank"
              rel="noopener noreferrer"
              title={en ? "Crowdsourced real-world LLM speed leaderboard" : "全网用户实测的大模型速度排行榜"}
            >
              🏆 {en ? "Leaderboard" : "排行榜"}
            </a>
            <button
              className={btn}
              onClick={() => setTrendOpen(true)}
              title={
                en
                  ? "Speed trend for the same model across local history"
                  : "同一模型在历次对比中的速度走势（本机历史）"
              }
            >
              📈 {en ? "Trends" : "趋势"}
            </button>
            <AccountChip onOpen={() => setAccountOpen(true)} />
          </div>
        </div>
      )}
      {!screenshotMode &&
        referralEntry && (
          <ReferralWelcomeBanner
            code={referralEntry.code}
            claimed={referralEntry.claimed}
            onLogin={() => setAccountOpen(true)}
          />
        )}
      {!screenshotMode &&
        quota != null &&
        activeEndpoints.some((e) => e.enabled && e.shared) && (
          <QuotaBanner
            remaining={quota.remaining}
            limit={quota.limit}
            loggedIn={quota.loggedIn}
            bonusRemaining={quota.bonusRemaining}
            onLogin={() => setAccountOpen(true)}
            onInvite={() => setAccountOpen(true)}
            onConfigure={() => setSettingsOpen(true)}
          />
        )}
      {!screenshotMode && !restored && usingTemporaryContext && (
        <div
          data-no-export="1"
          className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-line bg-card px-3.5 py-3 text-[12.5px]"
        >
          <div className="min-w-0">
            <div className="font-semibold text-ink">
              {en ? "Current mode: " : "当前为"}
              {temporaryModeLabel}
              {en ? ". Using temporary " : "：使用临时带入的"}
              {usingTemporaryEndpoints ? (en ? "model list" : "模型列表") : "Prompt"}
            </div>
            <div className="mt-0.5 text-faint">
              {en
                ? "Temporary content will not overwrite your saved models, Keys, or professional-mode draft. Shared preset models consume free or invite quota. Switch back to professional mode to use your local configuration."
                : "临时内容不会覆盖你本地保存的模型、Key 和专业模式草稿；共享预置模型会消耗免费/邀请额度，切回专业模式后使用你的本地配置。"}
            </div>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <button
              onClick={exitTemporaryMode}
              className="rounded-md bg-ink px-3 py-1.5 text-[12px] font-semibold text-paper cursor-pointer"
            >
              {en ? "Back to Professional Mode (use my Keys)" : "切回专业模式（用我的 Key）"}
            </button>
            <button
              onClick={() => setSettingsOpen(true)}
              className="rounded-md border border-line px-3 py-1.5 text-[12px] font-semibold text-faint hover:text-ink cursor-pointer"
            >
              {en ? "View Local Model Settings" : "查看本地模型配置"}
            </button>
          </div>
        </div>
      )}
      {/* ===== 标题区（可编辑，截图友好） ===== */}
      <header className="mb-5">
        <input
          className="ghost-input text-[30px] font-black leading-tight"
          style={{ fontFamily: "var(--font-title)" }}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={
            en
              ? "Click to enter a title, e.g. Step 3.7 Flash · live speed test"
              : "点击输入标题，如：Step 3.7 Flash · 实时速度实测"
          }
        />
        <textarea
          className="ghost-input mt-1 text-[13.5px] leading-relaxed text-faint"
          rows={Math.max(notes.split("\n").length, 1)}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder={
            en
              ? "Click to add notes, e.g. same Prompt across official APIs; focus on TTFT and throughput..."
              : "点击输入备注，如：同一 Prompt 直连各家官方接口，主要看首响应与吞吐……"
          }
        />
        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="num text-[11px] text-faint/70">
            {new Date().toLocaleDateString(locale === "en" ? "en-US" : "zh-CN")} ·{" "}
            {restored
              ? `${arenaText.restoredSnapshot} · ${new Date(restored.at).toLocaleString(en ? "en-US" : "zh-CN", { hour12: false })}`
              : arenaText.modelCount(activeEndpoints.filter((e) => e.enabled).length)}{" "}
            · {watermark.trim() || "百模竞速 · TOKRACE"}
          </span>
          <Credit compact />
        </div>
      </header>

      {/* ===== 工具条 ===== */}
      {!screenshotMode && (
        <div data-no-export="1" className="mb-4 flex flex-wrap items-center gap-2">
          {/* —— 常驻：高频 / 与当前对比强相关 —— */}
          <button className={btn} onClick={() => setSettingsOpen(true)}>
            ⚙ {en ? "Models" : "模型配置"}
          </button>
          <a className={btn} href={localHref("/templates")}>
            📚 {messages.common.templates}
          </a>
          <button
            className={btn}
            onClick={() => setThinkStats((v) => !v)}
            title={
              en
                ? "When off, reasoning/output are not split: TTFT is based on first content token and speed is calculated only from content tokens."
                : "关闭后不拆分思考/输出：首Token 按首个正文 token 计（思考计入等待），速度只按正文 token 计算"
            }
          >
            {thinkStats
              ? en
                ? "Reasoning stats: on"
                : "思考统计：开"
              : en
                ? "Reasoning stats: off"
                : "思考统计：关"}
          </button>
          <button
            className={btn}
            onClick={() => setCompact((v) => !v)}
            title={
              en
                ? "Compact mode collapses output content and focuses on metrics."
                : "紧凑模式：折叠输出内容只看指标，多模型纯竞速一屏看全"
            }
          >
            {compact ? (en ? "📊 Compact: on" : "📊 紧凑：开") : en ? "📊 Compact: off" : "📊 紧凑：关"}
          </button>
          {hasResults && !restored && (
            <button
              className={btn}
              onClick={openShareConfig}
              disabled={shareUrl === "loading"}
              title={
                en
                  ? "Generate a read-only share link. Readers can view outputs, metrics, and speed curves. Prompt and model outputs are public; API Keys are not included."
                  : "生成只读分享链接：读者可在线查看本次对比的输出、指标与速度曲线（会公开 Prompt 与模型输出，不含 API Key）"
              }
            >
              {shareUrl === "loading" ? (en ? "Generating..." : "生成中…") : `🔗 ${en ? "Share Link" : "分享链接"}`}
            </button>
          )}
          {hasResults && (
            <button
              className={btn}
              onClick={() => setReviewDraftOpen(true)}
              title={
                en
                  ? "Use one of your local-Key models to turn this run's metrics, outputs, and Prompt into a publishable review draft."
                  : "选择你本地已配置 Key 的模型，把本次指标、输出和 Prompt 生成成可发布评测稿"
              }
            >
              ✍️ {en ? "Review Draft" : "生成评测稿"}
            </button>
          )}
          <a className={btn} href={localHref("/me")}>
            🗂 {en ? "Mine" : "我的"}
          </a>
          <button
            className={btn}
            onClick={() => setMoreOpen((v) => !v)}
            title={en ? "Expand more navigation and options" : "展开更多导航与选项"}
          >
            {moreOpen ? (en ? "⋯ Less" : "⋯ 收起") : en ? "⋯ More" : "⋯ 更多"}
          </button>

          {/* —— 更多：导航 + 低频选项 —— */}
          {moreOpen && (
            <>
              <button className={btn} onClick={() => setHistoryOpen(true)}>
                🕘 {en ? "History" : "历史"}
              </button>
              <button className={btn} onClick={() => setAccountOpen(true)}>
                👤 {en ? "Account Sync" : "账号同步"}
              </button>
              {hasResults && (
                <button className={btn} onClick={copyResults}>
                  ⧉ {en ? "Copy Metrics" : "复制指标表"}
                </button>
              )}
              {hasResults && (
                <button
                  className={btn}
                  onClick={exportImage}
                  disabled={exporting}
                  title={
                    en
                      ? "Export this comparison as a long image with title, notes, and watermark."
                      : "把当前对比导出成长图（含标题/备注/水印），直接发文用"
                  }
                >
                  🖼 {en ? "Export Image" : "导出长图"}
                </button>
              )}
              <button
                className={btn}
                onClick={() => setMarkdown((v) => !v)}
                title={en ? "Toggle Markdown rendering / raw text" : "切换输出区 Markdown 渲染 / 原始文本"}
              >
                {markdown ? (en ? "MD render: on" : "MD 渲染：开") : en ? "MD render: off" : "MD 渲染：关"}
              </button>
              <button className={btn} onClick={() => setWmOpen((v) => !v)}>
                💧 {en ? "Watermark" : "水印"}{watermark.trim() ? (en ? ": on" : "：开") : ""}
              </button>
              <button className={btn} onClick={() => setScreenshotMode(true)}>
                📷 {en ? "Screenshot" : "截图模式"}
              </button>
              <button
                className={btn}
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                title={en ? "Toggle light/dark theme" : "切换明暗主题"}
              >
                {theme === "dark" ? (en ? "☀️ Light" : "☀️ 浅色") : en ? "🌙 Dark" : "🌙 暗色"}
              </button>
              {telemetry.choice && (
                <button
                  className={btn}
                  onClick={() =>
                    decideTelemetry(
                      telemetry.choice === "granted" ? "denied" : "granted"
                    )
                  }
                  title={
                    en
                      ? "Anonymously share numeric benchmark metrics only. API Keys and input/output content are never included. You can toggle this anytime."
                      : "匿名共享评测指标数据（仅数字指标，不含 API Key 与输入输出内容），可随时开关"
                  }
                >
                  📡 {en ? "Metrics sharing" : "指标共享"}：{telemetry.choice === "granted" ? (en ? "on" : "开") : en ? "off" : "关"}
                </button>
              )}
            </>
          )}

          {/* —— 上下文：始终可见 —— */}
          {telemetryStatus && (
            <span
              className="text-[11.5px]"
              style={{
                color: telemetryStatus.startsWith("✗")
                  ? "var(--accent)"
                  : "var(--go)",
              }}
            >
              {telemetryStatus}
            </span>
          )}
          {restored && (
            <button
              className={`${btn} text-accent border-accent/40`}
              onClick={() => {
                setRestored(null);
                setRuns({});
              }}
            >
              ← {en ? "Exit History Snapshot" : "退出历史快照"}
            </button>
          )}
          <span className="ml-auto text-[11px] text-accent">{toast}</span>
        </div>
      )}

      {/* 分享错误（持久显示） */}
      {shareError && !screenshotMode && (
        <div
          data-no-export="1"
          className="mb-4 flex items-center gap-2 rounded-lg border border-accent/30 bg-accent/5 px-3.5 py-2.5"
        >
          <span className="text-[12.5px] text-accent break-all">
            ⚠ {shareError}
          </span>
          <button
            onClick={() => setShareError(null)}
            className="ml-auto shrink-0 text-[12px] text-faint hover:text-ink cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* 分享链接显示（生成后） */}
      {shareUrl && shareUrl !== "loading" && !screenshotMode && (
        <div
          data-no-export="1"
          className="mb-4 flex flex-wrap items-center gap-2 rounded-lg border border-line bg-card px-3.5 py-2.5"
        >
          <span className="text-[12px]" style={{ color: "var(--go)" }}>
            🔗 {en ? "Read-only link generated" : "只读链接已生成"}
          </span>
          <input
            readOnly
            value={shareUrl}
            onFocus={(e) => e.currentTarget.select()}
            className="num min-w-0 flex-1 rounded-md border border-line bg-paper/60 px-2.5 py-1.5 text-[12px] outline-none"
          />
          <button
            className={btn}
            onClick={() => {
              void navigator.clipboard.writeText(shareUrl);
              flash(arenaText.copied);
            }}
          >
            {messages.common.copy}
          </button>
          <a
            className={btn}
            href={shareUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            {en ? "Open" : "打开"}
          </a>
          <span className="text-[11px] text-faint/80">
            {en
              ? "The link exposes the Prompt and model outputs, but never API Keys."
              : "链接公开 Prompt 与模型输出，不含 API Key"}
          </span>
        </div>
      )}

      {shareUrl &&
        shareUrl !== "loading" &&
        !screenshotMode &&
        generatedBadgeMarkdown && (
          <SocialSharePanel
            compact
            className="mb-4"
            url={shareUrl}
            title={generatedShareTitle}
            text={generatedShareText}
            badgeMarkdown={generatedBadgeMarkdown}
            badgeHtml={generatedBadgeHtml}
          />
        )}

      {referralNudge && !screenshotMode && (
        <ReferralShareNudge
          reason={referralNudge}
          models={referralModelNames}
          onOpenAccount={() => setAccountOpen(true)}
          onClose={() => setReferralNudge(null)}
        />
      )}

      {/* 水印设置 */}
      {wmOpen && !screenshotMode && (
        <div data-no-export="1" className="mb-4 flex flex-wrap items-center gap-3 rounded-lg border border-line bg-card px-3.5 py-2.5">
          <input
            className="num w-72 rounded-md border border-line px-2.5 py-1.5 text-[12px] outline-none focus:border-ink/40"
            value={watermark}
            onChange={(e) => setWatermark(e.target.value)}
            placeholder={en ? "e.g. X @yourID · Blog @yourname" : "如 小红书 @你的ID · X @yourID"}
          />
          <label className="flex cursor-pointer items-center gap-1.5 text-[11.5px] text-faint">
            <input
              type="checkbox"
              checked={wmTiled}
              onChange={(e) => setWmTiled(e.target.checked)}
              className="accent-[var(--accent)]"
            />
            {en ? "Tiled anti-repost watermark" : "平铺防盗水印"}
          </label>
          <span className="text-[11px] text-faint/80">
            {en
              ? "Shown in the header line and bottom-right badge. Copied Markdown tables also include the credit."
              : "显示在页头信息行 + 页面右下角徽标，复制的 Markdown 表格也会带上署名"}
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
            placeholder={en ? "Enter the Prompt to send to all models..." : "输入要同时发给所有模型的 Prompt……"}
          />
          <div data-no-export="1" className="mt-2 flex flex-wrap items-center gap-2 border-t border-line pt-2.5">
            <button
              className={btn}
              onClick={() => setPromptLibOpen(true)}
              title={
                en
                  ? "Curated benchmark prompts plus your saved custom prompts"
                  : "精选 benchmark 评测题 + 自己保存的常用 Prompt"
              }
            >
              📚 {en ? "Prompt Library" : "Prompt 库"}
            </button>
            <button className={btn} onClick={() => setShowAdvanced((v) => !v)}>
              {showAdvanced ? "▾" : "▸"} {en ? "Advanced Params" : "高级参数"}
            </button>
            <label
              className={btn}
              title={
                en
                  ? "Upload an image to send with the Prompt to every model. Compare vision model speed and quality. Images are auto-compressed to 1600px JPEG."
                  : "上传一张图随 Prompt 发给所有模型，对比各家视觉模型的识图速度与质量（自动压缩到 1600px JPEG）"
              }
            >
              🖼 {en ? "Image" : "图片"}
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
                    flash(arenaText.imageReady);
                  } catch {
                    flash(arenaText.imageReadFailed);
                  }
                }}
              />
            </label>
            {image && (
              <span className="flex items-center gap-1.5 rounded-md border border-line bg-paper/60 px-1.5 py-1">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={image.dataUrl}
                  alt={en ? "Comparison image" : "对比用图片"}
                  className="h-7 w-7 rounded border border-line object-cover"
                />
                <span className="num max-w-[110px] truncate text-[10.5px] text-faint">
                  {image.name}
                </span>
                <button
                  onClick={() => setImage(null)}
                  className="px-0.5 text-[12px] text-faint hover:text-accent cursor-pointer"
                  title={en ? "Remove image" : "移除图片"}
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
                  {en ? "Stop" : "停 止"}
                </button>
              ) : (
                <button
                  onClick={startAll}
                  disabled={!prompt.trim() || !activeEndpoints.some((e) => e.enabled)}
                  className="rounded-md bg-ink px-6 py-2 text-[14px] font-bold text-paper disabled:opacity-35 cursor-pointer"
                >
                  {en ? "Start Comparison" : "开始对比"} ▶
                </button>
              )}
            </div>
          </div>
          {showAdvanced && (
            <div className="mt-2.5 grid gap-2.5 border-t border-line pt-2.5 sm:grid-cols-3">
              <label className="sm:col-span-3 block">
                <div className="text-[11px] text-faint mb-1">
                  System Prompt{en ? " (shared by all models, leave blank to omit)" : "（所有模型共用，留空不传）"}
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
                  Temperature{en ? " (blank = provider default)" : "（留空 = 厂商默认）"}
                </div>
                <input
                  className="num w-full rounded-md border border-line px-2.5 py-1.5 text-[12.5px] outline-none focus:border-ink/40"
                  value={params.temperature}
                  onChange={(e) =>
                    setParams({ ...params, temperature: e.target.value })
                  }
                  placeholder={en ? "e.g. 0.7" : "如 0.7"}
                />
              </label>
              <label className="block">
                <div className="text-[11px] text-faint mb-1">
                  Max Tokens{en ? " (blank = provider default)" : "（留空 = 厂商默认）"}
                </div>
                <input
                  className="num w-full rounded-md border border-line px-2.5 py-1.5 text-[12.5px] outline-none focus:border-ink/40"
                  value={params.maxTokens}
                  onChange={(e) =>
                    setParams({ ...params, maxTokens: e.target.value })
                  }
                  placeholder={en ? "e.g. 8192" : "如 8192"}
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
                alt={en ? "Comparison image" : "对比用图片"}
                className="mt-2.5 max-h-44 rounded-md border border-line"
              />
            )}
          </div>
        )
      )}

      {/* ===== 遥测同意声明（首次出结果后询问一次） ===== */}
      {!telemetry.choice && hasResults && !screenshotMode && !restored && (
        <div data-no-export="1" className="mb-4 rounded-lg border border-line bg-card px-4 py-3">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <span className="text-[13px] font-semibold">
              📡 {en ? "Share these benchmark metrics anonymously?" : "愿意匿名共享这些评测指标吗？"}
            </span>
            <span className="text-[12px] text-faint">
              {en ? "Only numeric metrics like speed and tokens are uploaded to help analyze real-world model performance; " : "只上传速度/token 等数字指标，帮助分析各家模型的真实表现；"}
              <b className="text-ink">
                {en ? "API Keys and any input/output content are never uploaded" : "不上传 API Key 和任何输入输出内容"}
              </b>
              {en ? "." : "。"}
            </span>
            <details className="text-[12px] text-faint">
              <summary className="cursor-pointer select-none hover:text-ink">
                {en ? "Details" : "查看明细"}
              </summary>
              <div className="mt-1.5 grid gap-x-6 gap-y-0.5 sm:grid-cols-2">
                <div>
                  <div className="font-semibold text-ink">
                    {en ? "Stored:" : "会保存："}
                  </div>
                  {consentFields.collected.map((f) => (
                    <div key={f}>· {f}</div>
                  ))}
                </div>
                <div>
                  <div className="font-semibold" style={{ color: "var(--accent)" }}>
                    {en ? "Never stored:" : "永不保存："}
                  </div>
                  {consentFields.notCollected.map((f) => (
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
                {en ? "Share" : "同意共享"}
              </button>
              <button
                onClick={() => decideTelemetry("denied")}
                className="rounded-md border border-line px-3.5 py-1.5 text-[12px] text-faint hover:text-ink cursor-pointer"
              >
                {en ? "Do Not Share" : "不共享"}
              </button>
            </span>
          </div>
        </div>
      )}

      {/* ===== 模型条：隐藏/显示与排序（隐藏的模型后台照常跑） ===== */}
      {!screenshotMode && !restored && enabledEndpoints.length >= 2 && (
        <div data-no-export="1" className="mb-3 flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] text-faint shrink-0">
            {en ? "Visible" : "显示"}
          </span>
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
                      ? en
                        ? "Restore visibility. It has kept running in the background."
                        : "点击恢复显示（后台一直在跑）"
                      : en
                        ? "Hide this model. It keeps running in the background and can be restored anytime."
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
                  title={en ? "Move left" : "左移"}
                  className="px-0.5 text-faint hover:text-ink disabled:opacity-25 cursor-pointer"
                >
                  ◂
                </button>
                <button
                  onClick={() => moveEndpoint(ep.id, 1)}
                  disabled={idx === enabledEndpoints.length - 1}
                  title={en ? "Move right" : "右移"}
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
              {en ? "Show all" : "全部显示"}
            </button>
          )}
        </div>
      )}

      {/* 实时赛道：开跑后/有结果时在卡片上方显示 */}
      {(anyRunning || hasResults) && visibleEndpoints.length >= 2 && (
        <div className="mb-4">
          <RaceTrack runners={runners} locale={locale} />
        </div>
      )}

      {/* ===== 对比卡片 ===== */}
      {visibleEndpoints.length === 0 ? (
        <div className="rounded-lg border border-dashed border-line bg-card/60 px-6 py-14 text-center">
          <div className="text-[15px] font-semibold mb-1.5">
            {en ? "No models connected yet" : "还没有接入模型"}
          </div>
          <div className="text-[12.5px] text-faint mb-4">
            {en
              ? "Supports DeepSeek / Kimi / GLM / Qwen / Doubao / StepFun / MiniMax / OpenAI / Claude / Gemini, plus any OpenAI-compatible API."
              : "支持 DeepSeek / Kimi / 智谱 / 通义 / 豆包 / 阶跃 / MiniMax / OpenAI / Claude / Gemini …… 以及任何 OpenAI 兼容接口"}
          </div>
          <button
            onClick={() => setSettingsOpen(true)}
            className="rounded-md bg-ink px-5 py-2 text-[13px] font-bold text-paper cursor-pointer"
          >
            ⚙ {en ? "Connect Models" : "去接入模型"}
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

      {/* 结算卡：最快 / 最省 / 答对 / 综合推荐 */}
      {verdict && hasResults && (
        <div className="mt-4">
          <VerdictCard verdict={verdict} locale={locale} />
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
          {en ? "Exit Screenshot Mode" : "退出截图模式"}
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
        onShare={shareHistory}
        onDelete={(id) => setHistory((prev) => prev.filter((h) => h.id !== id))}
        onClear={() => setHistory([])}
      />
      <TrendModal
        open={trendOpen}
        onClose={() => setTrendOpen(false)}
        entries={history}
      />
      <PromptLibrary
        open={promptLibOpen}
        onClose={() => setPromptLibOpen(false)}
        onPick={(text) => setPrompt(text)}
        custom={customPrompts}
        onChangeCustom={setCustomPrompts}
      />
      <AccountDialog
        open={accountOpen}
        onClose={() => setAccountOpen(false)}
        shareModels={referralModelNames}
      />
      <ShareConfigDialog
        open={shareCfgOpen}
        onClose={() => {
          setShareCfgOpen(false);
          setShareSource(null);
        }}
        onGenerate={shareResults}
        generating={shareUrl === "loading"}
      />
      <ReviewDraftDialog
        open={reviewDraftOpen}
        onClose={() => setReviewDraftOpen(false)}
        onConfigure={() => {
          setReviewDraftOpen(false);
          setSettingsOpen(true);
        }}
        endpoints={endpoints}
        rows={reviewDraftRows}
        title={title}
        notes={notes}
        prompt={prompt}
        thinkingStats={thinkStats}
        shareUrl={typeof shareUrl === "string" ? shareUrl : undefined}
      />

      {!screenshotMode && (
        <footer data-no-export="1" className="mt-10 space-y-2 text-center text-[11px] text-faint/70">
          <div>
            {en
              ? "Metric notes: TTFT = time from request sent to first token received, including network round trip and queueing. Reasoning TPS / output TPS each use the active window from first to last token in that phase, excluding gaps and stream tail time. Total Tokens prefer provider official usage; reasoning/output splits are estimated from phase characters and calibrated when official split data is unavailable (≈ marks estimates)."
              : "指标说明：首Token = 请求发出到收到第一个 token（含网络往返与排队）· 思考TPS / 输出TPS 各按该阶段「首个→末个 token」的活跃窗口独立计时，不含阶段间空隙与流收尾时间 · 总 Tokens 优先采用厂商官方 usage；思考/输出拆分无官方数据时按各阶段字符独立估算后校准（数字前标 ≈）"}
          </div>
          <div>
            <Credit compact />
          </div>
        </footer>
      )}
    </main>
  );
}
