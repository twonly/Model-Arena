"use client";

import { useEffect, useRef, useState } from "react";
import { useI18n } from "./I18nProvider";
import { fileToResizedDataUrl } from "@/lib/image";
import type { HistoryResult, HistoryEntry, ModelEndpoint, RunParams } from "@/lib/types";

export function AppendModelsDialog({ source, rerunTarget, endpoints, defaults, quotaRemaining, onClose, onConfigure, onRun }: {
  source: HistoryEntry;
  rerunTarget?: Pick<HistoryResult, "model" | "provider" | "name">;
  endpoints: ModelEndpoint[];
  defaults: RunParams;
  quotaRemaining?: number;
  onClose: () => void;
  onConfigure: () => void;
  onRun: (targets: ModelEndpoint[], params: RunParams, imageDataUrl?: string) => void;
}) {
  const { locale } = useI18n();
  const en = locale === "en";
  const dialog = useRef<HTMLDialogElement>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [confirmed, setConfirmed] = useState(false);
  const [image, setImage] = useState(source.imageDataUrl);
  const [reading, setReading] = useState(false);
  const [error, setError] = useState("");
  const candidates = rerunTarget ? endpoints.filter(ep => ep.model === rerunTarget.model) : endpoints;
  const initialized = useRef(false);
  useEffect(() => {
    if (!rerunTarget || initialized.current) return;
    const matching = candidates.filter(ep => (ep.shared || ep.apiKey.trim()) &&
      (!rerunTarget.provider || ep.baseUrl.replace(/\/+$/, "") === rerunTarget.provider.replace(/\/+$/, "")));
    if (matching.length === 1) { setSelected([matching[0].id]); initialized.current = true; }
  }, [endpoints, rerunTarget]);
  const params = source.params ?? defaults;
  const available = (ep: ModelEndpoint) => ep.shared ? quotaRemaining !== 0 : !!ep.apiKey.trim();
  const targets = candidates.filter(ep => selected.includes(ep.id) && available(ep));
  useEffect(() => { dialog.current?.showModal(); }, []);
  return <dialog ref={dialog} onCancel={onClose} onClose={onClose}
    aria-labelledby="append-title"
    className="fixed inset-0 m-auto max-h-[90dvh] w-[calc(100%-2rem)] max-w-lg overflow-y-auto rounded-xl border border-line bg-paper p-5 text-ink shadow-xl backdrop:bg-black/30">
    <h2 id="append-title" className="text-lg font-bold">{rerunTarget ? (en ? `Rerun ${rerunTarget.name || rerunTarget.model}` : `重跑 ${rerunTarget.name || rerunTarget.model}`) : (en ? "Add models to comparison" : "追加模型对比")}</h2>
    <p className="my-2 text-sm text-faint">{en ? "Existing answers are kept. Only selected models will run." : "保留已有答案，仅调用本次选中的模型。"}</p>
    <details className="my-3 rounded border border-line p-3 text-sm">
      <summary className="cursor-pointer">{en ? "Original Prompt and parameters (fixed)" : "原 Prompt 与公共参数（固定）"}</summary>
      <pre className="my-2 max-h-40 overflow-auto whitespace-pre-wrap break-words">{source.prompt}</pre>
      <p>Temperature: {params.temperature || "—"} · Max Tokens: {params.maxTokens || "—"}</p>
      <pre className="whitespace-pre-wrap break-words">System Prompt: {params.systemPrompt || "—"}</pre>
    </details>
    <p className="text-xs text-faint">{en ? "Each new model uses its own configured model-specific parameters. Older records may not contain the original image or all settings." : "新增模型使用各自已配置的专属参数；旧记录可能未保存原图或完整设置。"}</p>
    {!source.params && <label className="my-3 flex gap-2 text-sm"><input type="checkbox" checked={confirmed} onChange={e => setConfirmed(e.target.checked)} />{en ? "Original parameters are missing; use the current parameters shown above." : "原公共参数缺失，确认使用上方展示的当前参数。"}</label>}
    <p className="mt-4 font-semibold">{en ? "Existing results · no rerun" : "已有结果 · 保留，不重跑"}</p>
    <ul className="my-2 text-sm text-faint">{source.results.map((r, i) => <li key={i}>{r.name || r.model}</li>)}</ul>
    {quotaRemaining === 0 && <p role="status" className="mt-3 text-sm text-accent">{en ? "Trial quota exhausted. Choose models with your own API Key." : "试用额度已用完，请选择使用自己 API Key 的模型。"}</p>}
    {rerunTarget && <p className="mt-3 text-sm">{en ? "Choose one connection for this model. Shared results do not include the author's connection or credentials." : "请选择该模型的一个接入配置；分享结果不包含原作者的接入地址和密钥。"}</p>}
    {rerunTarget && !candidates.length && <p role="status" className="mt-3 text-sm text-accent">{en ? "This model is not configured. Add it below to rerun." : "尚未配置这个模型，请先在下方接入后重跑。"}</p>}
    <fieldset className="my-4 space-y-2"><legend className="mb-2 font-semibold">{en ? "Models to run" : "选择本次运行的模型"}</legend>
      {candidates.map(ep => <label key={ep.id} className="flex items-start gap-2 text-sm">
        <input type={rerunTarget ? "radio" : "checkbox"} name={rerunTarget ? "rerun-endpoint" : undefined} checked={selected.includes(ep.id)} disabled={!available(ep)}
          onChange={e => setSelected(prev => e.target.checked ? (rerunTarget ? [ep.id] : [...prev, ep.id]) : prev.filter(id => id !== ep.id))} />
        <span className="min-w-0 break-words">{ep.name || ep.model}{rerunTarget && <span className="block text-xs text-faint">{ep.baseUrl}</span>}{source.results.some(r => r.model === ep.model) && <span className="text-faint">{en ? " · new sample (keeps old answer)" : " · 新增一次测试（保留旧答案）"}</span>}{!ep.shared && !ep.apiKey.trim() && (en ? " · configure API Key" : " · 需配置 API Key")}</span>
      </label>)}
    </fieldset>
    <button type="button" className="text-sm underline" onClick={onConfigure}>{en ? "+ Configure other models" : "＋ 配置其他模型"}</button>
    <label className="my-3 block text-sm">{source.hasImage ? (en ? "Original image (required)" : "原图（必需）") : (en ? "Restore original image, if any" : "如原测试含图片，请补充原图")}
      <input type="file" accept="image/*" className="mt-2 block w-full text-xs" onChange={async e => {
        const file = e.target.files?.[0];
        if (!file) return;
        setReading(true); setError("");
        try { setImage(await fileToResizedDataUrl(file)); }
        catch { setError(en ? "Could not read image." : "图片读取失败。"); }
        finally { setReading(false); }
      }} />
      {image && <span className="text-faint">{en ? "Image ready" : "图片已就绪"}</span>}
    </label>
    {error && <p role="alert" className="text-accent">{error}</p>}
    <p className="my-3 text-sm">{en ? `Keep ${source.results.length} results; run only ${targets.length} models.` : `保留 ${source.results.length} 个已有结果，本次仅运行 ${targets.length} 个模型。`}</p>
    <div className="flex justify-end gap-3">
      <button className="rounded border border-line px-3 py-2" onClick={onClose}>{en ? "Cancel" : "取消"}</button>
      <button className="rounded bg-ink px-3 py-2 text-paper disabled:opacity-40"
        disabled={!targets.length || reading || (!source.params && !confirmed) || (!!source.hasImage && !image)}
        onClick={() => onRun(targets, params, image)}>{en ? `Run selected ${targets.length} models` : `运行所选 ${targets.length} 个模型`}</button>
    </div>
  </dialog>;
}
