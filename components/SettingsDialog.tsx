"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/components/I18nProvider";
import { PROVIDER_PRESETS, type ProviderPreset } from "@/lib/providers";
import type { ModelEndpoint } from "@/lib/types";

const KIND_LABEL = { openai: "OpenAI 兼容", anthropic: "Anthropic 原生" } as const;
const KIND_LABEL_EN = { openai: "OpenAI compatible", anthropic: "Native Anthropic" } as const;

/** 常见思考开关的快捷填充（各厂商参数名不同） */
const EXTRA_PRESETS: { label: string; json: string }[] = [
  { label: "开思考 · Qwen/通义", json: '{"enable_thinking": true}' },
  { label: "关思考 · Qwen/通义", json: '{"enable_thinking": false}' },
  { label: "开思考 · GLM/豆包", json: '{"thinking": {"type": "enabled"}}' },
  { label: "关思考 · GLM/豆包", json: '{"thinking": {"type": "disabled"}}' },
  {
    label: "关思考 · vLLM/硅基",
    json: '{"chat_template_kwargs": {"enable_thinking": false}}',
  },
  {
    label: "开思考 · Anthropic协议(Kimi等)",
    json: '{"thinking": {"type": "enabled", "budget_tokens": 8192}}',
  },
  { label: "自适应思考 · Claude 4.6+", json: '{"thinking": {"type": "adaptive"}}' },
  { label: "清空", json: "" },
];

const EXTRA_PRESETS_EN: { label: string; json: string }[] = [
  { label: "Thinking on · Qwen", json: '{"enable_thinking": true}' },
  { label: "Thinking off · Qwen", json: '{"enable_thinking": false}' },
  { label: "Thinking on · GLM/Doubao", json: '{"thinking": {"type": "enabled"}}' },
  { label: "Thinking off · GLM/Doubao", json: '{"thinking": {"type": "disabled"}}' },
  {
    label: "Thinking off · vLLM/SiliconFlow",
    json: '{"chat_template_kwargs": {"enable_thinking": false}}',
  },
  {
    label: "Thinking on · Anthropic protocol",
    json: '{"thinking": {"type": "enabled", "budget_tokens": 8192}}',
  },
  { label: "Adaptive thinking · Claude 4.6+", json: '{"thinking": {"type": "adaptive"}}' },
  { label: "Clear", json: "" },
];

function isValidExtra(s?: string): boolean {
  if (!s?.trim()) return true;
  try {
    const j = JSON.parse(s);
    return !!j && typeof j === "object" && !Array.isArray(j);
  } catch {
    return false;
  }
}

function newId() {
  return Math.random().toString(36).slice(2, 10);
}

/** 备份覆盖的全部持久化键（localStorage 按源隔离，换源/换机用导出导入迁移） */
const BACKUP_KEYS = [
  "ma.endpoints",
  "ma.history",
  "ma.title",
  "ma.notes",
  "ma.prompt",
  "ma.params",
  "ma.markdown",
  "ma.thinkStats",
  "ma.watermark",
  "ma.wmTiled",
  "ma.compact",
  "ma.theme",
  "ma.customPrompts",
];

function exportBackup() {
  const data: Record<string, unknown> = {
    __app: "model-arena",
    __version: 1,
    __at: new Date().toISOString(),
  };
  for (const k of BACKUP_KEYS) {
    const v = localStorage.getItem(k);
    if (v != null) {
      try {
        data[k] = JSON.parse(v);
      } catch {
        /* skip */
      }
    }
  }
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `model-arena-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
}

async function importBackup(file: File, locale: "zh-CN" | "en" = "zh-CN"): Promise<string> {
  const en = locale === "en";
  const text = await file.text();
  let data: Record<string, unknown>;
  try {
    data = JSON.parse(text);
  } catch {
    return en ? "File is not valid JSON" : "文件不是合法 JSON";
  }
  if (data.__app !== "model-arena") {
    return en ? "This is not a TOKRACE backup file" : "不是 百模竞速 的备份文件";
  }
  let count = 0;
  for (const k of BACKUP_KEYS) {
    if (k in data) {
      localStorage.setItem(k, JSON.stringify(data[k]));
      count++;
    }
  }
  if (!count) return en ? "No importable data found in this backup" : "备份文件里没有可导入的数据";
  location.reload(); // 重新加载让所有状态生效
  return "";
}

export function SettingsDialog({
  open,
  onClose,
  endpoints,
  onChange,
}: {
  open: boolean;
  onClose: () => void;
  endpoints: ModelEndpoint[];
  onChange: (next: ModelEndpoint[]) => void;
}) {
  const { locale, messages } = useI18n();
  const en = locale === "en";
  const kindLabel = en ? KIND_LABEL_EN : KIND_LABEL;
  const extraPresets = en ? EXTRA_PRESETS_EN : EXTRA_PRESETS;
  const [draft, setDraft] = useState<ModelEndpoint | null>(null);
  const [showKey, setShowKey] = useState(false);
  const [presetNote, setPresetNote] = useState<string | undefined>();
  const [exampleModels, setExampleModels] = useState<string[]>([]);
  // 拉取模型列表
  const [models, setModels] = useState<string[] | null>(null);
  const [modelsLoading, setModelsLoading] = useState(false);
  const [modelsError, setModelsError] = useState("");
  const [modelFilter, setModelFilter] = useState("");
  // 连接测试
  const [test, setTest] = useState<{
    status: "idle" | "running" | "ok" | "fail";
    msg?: string;
  }>({ status: "idle" });
  const [importMsg, setImportMsg] = useState("");

  /* ESC 关闭 */
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) return null;

  const resetAux = () => {
    setModels(null);
    setModelsLoading(false);
    setModelsError("");
    setModelFilter("");
    setTest({ status: "idle" });
    setShowKey(false);
  };

  /** 关闭时丢弃未保存草稿，避免下次打开残留编辑态（看起来像“关闭不生效”） */
  function handleClose() {
    setDraft(null);
    setModels(null);
    setModelsError("");
    setModelFilter("");
    setTest({ status: "idle" });
    setShowKey(false);
    onClose();
  }

  const startFromPreset = (p: ProviderPreset) => {
    setDraft({
      id: newId(),
      name: p.label,
      kind: p.kind,
      baseUrl: p.baseUrl,
      apiKey: "",
      model: p.exampleModels[0] ?? "",
      enabled: true,
    });
    setPresetNote(p.note);
    setExampleModels(p.exampleModels);
    resetAux();
  };

  const startEdit = (ep: ModelEndpoint) => {
    setDraft({ ...ep });
    setPresetNote(undefined);
    setExampleModels([]);
    resetAux();
  };

  const saveDraft = () => {
    if (!draft) return;
    const exists = endpoints.some((e) => e.id === draft.id);
    onChange(
      exists
        ? endpoints.map((e) => (e.id === draft.id ? draft : e))
        : [...endpoints, draft]
    );
    setDraft(null);
    resetAux();
  };

  const fetchModels = async () => {
    if (!draft) return;
    setModelsLoading(true);
    setModelsError("");
    setModels(null);
    try {
      const res = await fetch("/api/models", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: draft.kind,
          baseUrl: draft.baseUrl,
          apiKey: draft.apiKey,
        }),
      });
      const j = (await res.json()) as { models?: string[]; error?: string };
      if (j.error || !j.models) setModelsError(j.error ?? (en ? "Fetch failed" : "拉取失败"));
      else setModels(j.models);
    } catch (err) {
      setModelsError(err instanceof Error ? err.message : String(err));
    } finally {
      setModelsLoading(false);
    }
  };

  const testConnection = async () => {
    if (!draft) return;
    setTest({ status: "running" });
    try {
      const res = await fetch("/api/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: draft.kind,
          baseUrl: draft.baseUrl,
          apiKey: draft.apiKey,
          model: draft.model,
        }),
      });
      const j = (await res.json()) as {
        ok: boolean;
        latencyMs?: number;
        error?: string;
      };
      setTest(
        j.ok
          ? { status: "ok", msg: en ? `Connected · ${j.latencyMs}ms · model is valid` : `连接成功 · ${j.latencyMs}ms · 模型有效` }
          : { status: "fail", msg: j.error ?? (en ? "Unknown error" : "未知错误") }
      );
    } catch (err) {
      setTest({
        status: "fail",
        msg: err instanceof Error ? err.message : String(err),
      });
    }
  };

  const remove = (id: string) => {
    onChange(endpoints.filter((e) => e.id !== id));
    if (draft?.id === id) setDraft(null);
  };

  const duplicate = (ep: ModelEndpoint) => {
    const copy = { ...ep, id: newId(), name: `${ep.name} ${en ? "copy" : "副本"}` };
    onChange([...endpoints, copy]);
  };

  const extraValid = !draft || isValidExtra(draft.extraBody);

  const input =
    "w-full rounded-md border border-line bg-card px-2.5 py-1.5 text-[13px] outline-none focus:border-ink/40";

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-ink/30 p-4 pt-[6vh]"
      onClick={handleClose}
    >
      <div
        className="w-full max-w-2xl max-h-[85vh] overflow-y-auto thin-scroll rounded-xl border border-line bg-paper shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-line bg-paper px-5 py-3">
          <div>
            <div className="font-bold text-[15px]">
              {en ? "Model Connection Manager" : "模型接入管理"}
            </div>
            <div className="text-[11px] text-faint">
              {en
                ? "API Keys are stored only in this browser (localStorage). Requests are proxied through this site, not any third party."
                : "API Key 只保存在你本机浏览器（localStorage），请求经本地服务转发，不经过任何第三方"}
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            title={en ? "Close (Esc)" : "关闭（Esc）"}
            className="text-faint hover:text-ink text-[16px] leading-none cursor-pointer rounded-md border border-line px-2.5 py-1.5 shrink-0 ml-3"
          >
            ✕
          </button>
        </div>

        {!draft ? (
          <div className="p-5 space-y-5">
            {/* 已接入列表 */}
            {endpoints.length > 0 && (
              <div className="space-y-1.5">
                <div className="text-[12px] font-semibold text-faint">
                  {en ? "Connected (checked = included in comparisons)" : "已接入（勾选 = 参与对比）"}
                </div>
                {endpoints.map((ep) => (
                  <div
                    key={ep.id}
                    className="flex items-center gap-2.5 rounded-md border border-line bg-card px-3 py-2"
                  >
                    <input
                      type="checkbox"
                      checked={ep.enabled}
                      onChange={(e) =>
                        onChange(
                          endpoints.map((x) =>
                            x.id === ep.id
                              ? { ...x, enabled: e.target.checked }
                              : x
                          )
                        )
                      }
                      className="accent-[var(--accent)] cursor-pointer"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="text-[13px] font-semibold truncate">
                        {ep.name}
                        {ep.shared && (
                          <span
                            className="ml-2 text-[10px] font-semibold rounded px-1 py-px"
                            style={{
                              color: "var(--go)",
                              border: "1px solid color-mix(in srgb, var(--go) 40%, transparent)",
                            }}
                          >
                            🎁 {en ? "Trial" : "体验"}
                          </span>
                        )}
                        <span className="ml-2 text-[10px] font-normal text-faint border border-line rounded px-1 py-px">
                          {kindLabel[ep.kind]}
                        </span>
                      </div>
                      <div className="num text-[11px] text-faint truncate">
                        {ep.model} · {ep.baseUrl}
                        {ep.extraBody?.trim() && (
                          <span style={{ color: "var(--think)" }}>
                            {" "}
                            · {en ? "custom params" : "自定义参数"}
                          </span>
                        )}
                        {ep.shared ? (
                          <span style={{ color: "var(--go)" }}>
                            {" "}
                            · {en ? "free trial, no Key needed" : "免费体验，无需 Key"}
                          </span>
                        ) : (
                          !ep.apiKey && (
                            <span className="text-accent"> · {en ? "missing Key" : "未填 Key"}</span>
                          )
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => startEdit(ep)}
                      className="text-[11.5px] text-faint hover:text-ink cursor-pointer"
                    >
                      {messages.common.edit}
                    </button>
                    <button
                      onClick={() => duplicate(ep)}
                      className="text-[11.5px] text-faint hover:text-ink cursor-pointer"
                    >
                      {messages.common.copy}
                    </button>
                    <button
                      onClick={() => remove(ep.id)}
                      className="text-[11.5px] text-faint hover:text-accent cursor-pointer"
                    >
                      {messages.common.delete}
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* 厂商预设 */}
            <div>
              <div className="text-[12px] font-semibold text-faint mb-1.5">
                {en ? "Add connection - choose a provider preset" : "新增接入 — 选择厂商预设"}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                {PROVIDER_PRESETS.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => startFromPreset(p)}
                    className="rounded-md border border-line bg-card px-2.5 py-2 text-left text-[12.5px] hover:border-ink/40 cursor-pointer"
                  >
                    <div className="font-semibold">{p.label}</div>
                    <div className="num text-[10px] text-faint truncate">
                      {p.exampleModels[0] ?? (en ? "Custom" : "自定义")}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* 备份迁移 */}
            <div className="flex flex-wrap items-center gap-2 border-t border-line pt-3">
              <button
                onClick={exportBackup}
                className="rounded-md border border-line bg-card px-3 py-1.5 text-[12px] text-faint hover:text-ink cursor-pointer"
              >
                ⤓ {en ? "Export Backup" : "导出备份"}
              </button>
              <label className="rounded-md border border-line bg-card px-3 py-1.5 text-[12px] text-faint hover:text-ink cursor-pointer">
                ⤒ {en ? "Import Backup" : "导入备份"}
                <input
                  type="file"
                  accept="application/json,.json"
                  className="hidden"
                  onChange={async (e) => {
                    const f = e.target.files?.[0];
                    e.target.value = "";
                    if (!f) return;
                    const err = await importBackup(f, locale);
                    if (err) setImportMsg(`✗ ${err}`);
                  }}
                />
              </label>
              {importMsg && (
                <span className="text-[11.5px] text-accent">{importMsg}</span>
              )}
              <span className="text-[10.5px] text-faint/80">
                {en
                  ? "Includes all model settings (API Keys), history, and page settings. Browser storage is isolated by domain/IP; use this to migrate across addresses or devices. Keep backup files secure."
                  : "含全部模型配置（API Key）、历史与页面设置——浏览器存储按「域名/IP」隔离，换地址或换机器用这里迁移；备份文件请妥善保管"}
              </span>
            </div>
          </div>
        ) : (
          <div className="p-5 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <div className="text-[11.5px] text-faint mb-1">
                  {en ? "Display Name" : "显示名称"}
                </div>
                <input
                  className={input}
                  value={draft.name}
                  onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                  placeholder={en ? "e.g. DeepSeek V3" : "如 DeepSeek V3"}
                />
              </label>
              <label className="block">
                <div className="text-[11.5px] text-faint mb-1">
                  {en ? "API Protocol" : "接口协议"}
                </div>
                <select
                  className={input}
                  value={draft.kind}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      kind: e.target.value as ModelEndpoint["kind"],
                    })
                  }
                >
                  <option value="openai">
                    {en ? "OpenAI compatible (most providers)" : "OpenAI 兼容（绝大多数厂商）"}
                  </option>
                  <option value="anthropic">
                    {en ? "Native Anthropic" : "Anthropic 原生"}
                  </option>
                </select>
              </label>
            </div>
            <label className="block">
              <div className="text-[11.5px] text-faint mb-1">Base URL</div>
              <input
                className={`${input} num`}
                value={draft.baseUrl}
                onChange={(e) =>
                  setDraft({ ...draft, baseUrl: e.target.value })
                }
                placeholder="https://api.example.com/v1"
              />
            </label>
            <label className="block">
              <div className="text-[11.5px] text-faint mb-1">API Key</div>
              <div className="flex gap-1.5">
                <input
                  className={`${input} num`}
                  type={showKey ? "text" : "password"}
                  value={draft.apiKey}
                  onChange={(e) =>
                    setDraft({ ...draft, apiKey: e.target.value })
                  }
                  placeholder="sk-…"
                />
                <button
                  onClick={() => setShowKey((v) => !v)}
                  className="shrink-0 rounded-md border border-line px-2 text-[11.5px] text-faint hover:text-ink cursor-pointer"
                >
                  {showKey ? (en ? "Hide" : "隐藏") : en ? "Show" : "显示"}
                </button>
              </div>
            </label>
            <div className="block">
              <div className="mb-1 flex items-center justify-between">
                <div className="text-[11.5px] text-faint">{en ? "Model ID" : "模型 ID"}</div>
                <button
                  onClick={fetchModels}
                  disabled={modelsLoading || !draft.baseUrl}
                  className="rounded border border-line px-2 py-0.5 text-[10.5px] text-faint hover:text-ink disabled:opacity-40 cursor-pointer"
                  title={
                    en
                      ? "Call the provider's /models endpoint to fetch available models. Fill Base URL and Key first."
                      : "调用厂商的 /models 接口拉取可用模型（需先填 Base URL 和 Key）"
                  }
                >
                  {modelsLoading ? (en ? "Fetching..." : "拉取中…") : `⇩ ${en ? "Fetch Models" : "拉取模型列表"}`}
                </button>
              </div>
              <input
                className={`${input} num`}
                value={draft.model}
                onChange={(e) => setDraft({ ...draft, model: e.target.value })}
                placeholder={en ? "e.g. deepseek-chat" : "如 deepseek-chat"}
              />
              {exampleModels.length > 0 && !models && (
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {exampleModels.map((m) => (
                    <button
                      key={m}
                      onClick={() => setDraft({ ...draft, model: m })}
                      className="num rounded border border-line bg-card px-1.5 py-0.5 text-[10.5px] text-faint hover:text-ink cursor-pointer"
                    >
                      {m}
                    </button>
                  ))}
                </div>
              )}
              {modelsError && (
                <div className="mt-1.5 text-[11px] text-accent">
                  ✗ {modelsError}
                </div>
              )}
              {models && (
                <div className="mt-1.5 rounded-md border border-line bg-card">
                  {models.length > 12 && (
                    <input
                      className="num w-full border-b border-line bg-transparent px-2.5 py-1.5 text-[11.5px] outline-none"
                      placeholder={en ? `Filter ${models.length} models...` : `筛选 ${models.length} 个模型…`}
                      value={modelFilter}
                      onChange={(e) => setModelFilter(e.target.value)}
                    />
                  )}
                  <div className="thin-scroll flex max-h-44 flex-wrap content-start gap-1 overflow-y-auto p-1.5">
                    {models
                      .filter((m) =>
                        m.toLowerCase().includes(modelFilter.toLowerCase())
                      )
                      .map((m) => (
                        <button
                          key={m}
                          onClick={() => setDraft({ ...draft, model: m })}
                          className={`num rounded border px-1.5 py-0.5 text-[10.5px] cursor-pointer ${
                            draft.model === m
                              ? "border-ink bg-ink text-paper"
                              : "border-line text-faint hover:text-ink"
                          }`}
                        >
                          {m}
                        </button>
                      ))}
                  </div>
                </div>
              )}
            </div>
            {/* 额外请求参数：think / nothink 等厂商私有开关 */}
            <div className="block">
              <div className="mb-1 flex items-center justify-between">
                <div className="text-[11.5px] text-faint">
                  {en
                    ? "Extra request params (JSON, merged into the request body as-is; useful for provider-specific thinking switches)"
                    : "额外请求参数（JSON，原样合并进请求体；用于思考开关等厂商私有参数）"}
                </div>
                {draft.extraBody?.trim() && !extraValid && (
                  <span className="text-[10.5px] text-accent">
                    {en ? "Not a valid JSON object" : "不是合法 JSON 对象"}
                  </span>
                )}
              </div>
              <textarea
                className={`${input} num`}
                rows={2}
                value={draft.extraBody ?? ""}
                onChange={(e) =>
                  setDraft({ ...draft, extraBody: e.target.value })
                }
                placeholder={en ? 'e.g. {"enable_thinking": false}' : '如 {"enable_thinking": false}'}
              />
              <div className="mt-1.5 flex flex-wrap gap-1">
                {extraPresets.map((p) => (
                  <button
                    key={p.label}
                    onClick={() => setDraft({ ...draft, extraBody: p.json })}
                    title={p.json || (en ? "Clear extra params" : "清空额外参数")}
                    className="rounded border border-line bg-card px-1.5 py-0.5 text-[10.5px] text-faint hover:text-ink cursor-pointer"
                  >
                    {p.label}
                  </button>
                ))}
              </div>
              <div className="mt-1 text-[10.5px] text-faint/80">
                {en
                  ? "ⓘ Want to compare think vs no-think for the same model? Save it, duplicate it, then configure different params for the two entries."
                  : "ⓘ 同一模型想对比 think vs no-think？保存后用「复制」建两份，分别配置不同参数即可同场竞速"}
              </div>
            </div>
            {presetNote && (
              <div className="text-[11.5px]" style={{ color: "var(--think)" }}>
                ⓘ {presetNote}
              </div>
            )}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button
                onClick={saveDraft}
                disabled={
                  !draft.name || !draft.baseUrl || !draft.model || !extraValid
                }
                className="rounded-md bg-ink text-paper px-4 py-1.5 text-[13px] font-semibold disabled:opacity-40 cursor-pointer"
              >
                {messages.common.save}
              </button>
              <button
                onClick={testConnection}
                disabled={
                  test.status === "running" || !draft.baseUrl || !draft.model
                }
                className="rounded-md border border-line px-4 py-1.5 text-[13px] text-faint hover:text-ink disabled:opacity-40 cursor-pointer"
                title={
                  en
                    ? "Send a minimal completion request to verify Base URL / Key / Model ID"
                    : "发一次最小补全请求，验证 Base URL / Key / 模型 ID"
                }
              >
                {test.status === "running" ? (en ? "Testing..." : "测试中…") : `⚡ ${en ? "Test Connection" : "测试连接"}`}
              </button>
              <button
                onClick={() => {
                  setDraft(null);
                  resetAux();
                }}
                className="rounded-md border border-line px-4 py-1.5 text-[13px] text-faint hover:text-ink cursor-pointer"
              >
                {messages.common.cancel}
              </button>
              {test.status === "ok" && (
                <span className="text-[12px]" style={{ color: "var(--go)" }}>
                  ✓ {test.msg}
                </span>
              )}
              {test.status === "fail" && (
                <span className="text-[12px] text-accent break-all">
                  ✗ {test.msg}
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
