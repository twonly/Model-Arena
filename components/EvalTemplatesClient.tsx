"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Logo } from "@/components/Logo";
import { useI18n } from "@/components/I18nProvider";
import {
  buildTemplateArenaSeed,
  customPromptToEvalTemplate,
  evalTemplateCategories,
  officialEvalTemplates,
  templateConfidenceLabel,
  templateHistoryCounts,
  type EvalTemplate,
  type EvalTemplateCategory,
} from "@/lib/eval-templates";
import type { PromptItem } from "@/lib/prompts";
import { ARENA_SEED_STORAGE_KEY } from "@/lib/quickstart";
import type { HistoryEntry } from "@/lib/types";
import type { Locale } from "@/lib/i18n";

const CUSTOM_PROMPTS_KEY = "ma.customPrompts";
const HISTORY_KEY = "ma.history";

type FilterId = EvalTemplateCategory | "all" | "mine";

export function EvalTemplatesClient() {
  const { locale, href } = useI18n();
  const officialTemplates = useMemo(() => officialEvalTemplates(locale), [locale]);
  const categories = useMemo(() => evalTemplateCategories(locale), [locale]);
  const categoryLabels = useMemo(
    () => new Map(categories.map((item) => [item.id, item.label])),
    [categories]
  );
  const [filter, setFilter] = useState<FilterId>("all");
  const [query, setQuery] = useState("");
  const [customPrompts, setCustomPrompts] = useState<PromptItem[]>([]);
  const [customReady, setCustomReady] = useState(false);
  const [historyCounts, setHistoryCounts] = useState<Record<string, number>>({});
  const [selectedId, setSelectedId] = useState(officialTemplates[0]?.id ?? "");
  const [draft, setDraft] = useState<PromptItem>({ label: "", text: "" });
  const [toast, setToast] = useState("");

  useEffect(() => {
    try {
      const rawCustom = localStorage.getItem(CUSTOM_PROMPTS_KEY);
      if (rawCustom) setCustomPrompts(JSON.parse(rawCustom));
    } catch {
      /* ignore */
    }
    try {
      const rawHistory = localStorage.getItem(HISTORY_KEY);
      const entries = rawHistory ? (JSON.parse(rawHistory) as HistoryEntry[]) : [];
      setHistoryCounts(templateHistoryCounts(Array.isArray(entries) ? entries : []));
    } catch {
      /* ignore */
    }
    setCustomReady(true);
  }, []);

  useEffect(() => {
    if (!customReady) return;
    try {
      localStorage.setItem(CUSTOM_PROMPTS_KEY, JSON.stringify(customPrompts));
    } catch {
      /* ignore */
    }
  }, [customPrompts, customReady]);

  const customTemplates = useMemo(
    () =>
      customPrompts.map((item, index) =>
        customPromptToEvalTemplate(item, index, locale)
      ),
    [customPrompts, locale]
  );
  const allTemplates = useMemo(
    () => [...officialTemplates, ...customTemplates],
    [customTemplates, officialTemplates]
  );
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return allTemplates.filter((template) => {
      const matchesFilter =
        filter === "all" ||
        (filter === "mine" ? template.source === "custom" : template.category === filter);
      if (!matchesFilter) return false;
      if (!q) return true;
      return [template.title, template.description, template.prompt, ...template.tags]
        .join("\n")
        .toLowerCase()
        .includes(q);
    });
  }, [allTemplates, filter, query]);
  const selected =
    filtered.find((template) => template.id === selectedId) ?? filtered[0] ?? null;

  const selectTemplate = (template: EvalTemplate) => {
    setSelectedId(template.id);
  };

  const runTemplate = (template: EvalTemplate) => {
    try {
      sessionStorage.setItem(
        ARENA_SEED_STORAGE_KEY,
        JSON.stringify(buildTemplateArenaSeed(template, locale))
      );
      window.location.assign(href("/arena"));
    } catch {
      setToast(
        locale === "en"
          ? "Browser could not save the temporary template. Copy the prompt manually."
          : "浏览器无法写入临时模板，请手动复制 Prompt"
      );
      setTimeout(() => setToast(""), 1800);
    }
  };

  const addCustom = () => {
    if (!draft.label.trim() || !draft.text.trim()) return;
    const nextItem = { label: draft.label.trim(), text: draft.text.trim() };
    const nextTemplate = customPromptToEvalTemplate(nextItem, 0);
    setCustomPrompts((prev) => [nextItem, ...prev]);
    setDraft({ label: "", text: "" });
    setFilter("mine");
    setSelectedId(nextTemplate.id);
    setToast(locale === "en" ? "Saved to my templates" : "已保存到我的模板");
    setTimeout(() => setToast(""), 1600);
  };

  const removeCustom = (template: EvalTemplate) => {
    const idx = customTemplates.findIndex((item) => item.id === template.id);
    if (idx < 0) return;
    setCustomPrompts((prev) => prev.filter((_, index) => index !== idx));
    setSelectedId(officialTemplates[0]?.id ?? "");
  };

  const btn =
    "rounded-md border border-line bg-card px-2.5 py-1.5 text-[12px] text-faint hover:text-ink cursor-pointer";

  return (
    <main className="mx-auto max-w-7xl px-5 py-8">
      <nav className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Logo />
          <Link href={href("/")} className="text-[13px] text-faint hover:text-ink">
            {locale === "en" ? "Home" : "首页"}
          </Link>
          <Link href={href("/arena")} className="text-[13px] text-faint hover:text-ink">
            {locale === "en" ? "Arena" : "竞速场"}
          </Link>
        </div>
        <div className="flex items-center gap-2">
          <Link href={href("/stats")} className={btn}>
            🏆 {locale === "en" ? "Leaderboard" : "排行榜"}
          </Link>
          <Link href={href("/board")} className={btn}>
            {locale === "en" ? "Audience board" : "人气榜"}
          </Link>
        </div>
      </nav>

      <header className="mb-6">
        <p className="text-[12px] font-semibold text-accent">Evaluation Templates</p>
        <h1
          className="mt-1 text-[30px] font-black leading-tight"
          style={{ fontFamily: "var(--font-title)" }}
        >
          {locale === "en" ? "AI Model Evaluation Templates" : "AI 模型评测模板"}
        </h1>
        <p className="mt-2 max-w-2xl text-[13px] leading-relaxed text-faint">
          {locale === "en"
            ? "Pick a fixed task and run it with your current model setup. Results are saved locally and attached to the template."
            : "选择一个固定任务，用你当前配置的模型直接跑一轮；结果会保存到本机历史，并归档到对应模板。"}
        </p>
      </header>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <section className="min-w-0">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setFilter(category.id)}
                className={`rounded-md border px-3 py-1.5 text-[12px] font-semibold cursor-pointer ${
                  filter === category.id
                    ? "border-ink bg-ink text-paper"
                    : "border-line bg-card text-faint hover:text-ink"
                }`}
              >
                {category.label}
              </button>
            ))}
            <input
              className="ml-auto min-w-[190px] rounded-md border border-line bg-card px-3 py-1.5 text-[12px] outline-none focus:border-ink/40"
              placeholder={
                locale === "en"
                  ? "Search templates, skills, prompt"
                  : "搜索模板、能力、Prompt"
              }
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          {filter === "mine" && (
            <div className="mb-3 rounded-lg border border-line bg-card p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div className="text-[14px] font-bold">
                    {locale === "en" ? "Add my template" : "新增我的模板"}
                  </div>
                  <div className="mt-0.5 text-[11.5px] text-faint">
                    {locale === "en"
                      ? "Save a reusable prompt, then run and archive samples from here."
                      : "保存常用 Prompt 后，可直接在这里试跑并归档样本。"}
                  </div>
                </div>
                {toast && <span className="text-[12px] text-faint">{toast}</span>}
              </div>
              <div className="mt-3 grid gap-2 md:grid-cols-[220px_1fr]">
                <input
                  className="w-full rounded-md border border-line bg-paper px-3 py-2 text-[12.5px] outline-none focus:border-ink/40"
                  placeholder={locale === "en" ? "Template name" : "模板名称"}
                  value={draft.label}
                  onChange={(e) =>
                    setDraft((prev) => ({ ...prev, label: e.target.value }))
                  }
                />
                <textarea
                  className="w-full rounded-md border border-line bg-paper px-3 py-2 text-[12.5px] leading-relaxed outline-none focus:border-ink/40"
                  rows={3}
                  placeholder={locale === "en" ? "Fixed prompt" : "固定 Prompt"}
                  value={draft.text}
                  onChange={(e) =>
                    setDraft((prev) => ({ ...prev, text: e.target.value }))
                  }
                />
              </div>
              <button
                onClick={addCustom}
                disabled={!draft.label.trim() || !draft.text.trim()}
                className="mt-2 rounded-md bg-ink px-4 py-2 text-[12.5px] font-bold text-paper disabled:opacity-40 cursor-pointer"
              >
                {locale === "en" ? "Save template" : "保存模板"}
              </button>
            </div>
          )}

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                selected={selected?.id === template.id}
                localSamples={historyCounts[template.id] ?? 0}
                locale={locale}
                categoryLabel={categoryLabels.get(template.category) ?? template.category}
                onSelect={() => selectTemplate(template)}
                onRun={() => runTemplate(template)}
              />
            ))}
          </div>

          {!filtered.length && (
            <div className="rounded-lg border border-dashed border-line bg-card/60 px-4 py-10 text-center text-[13px] text-faint">
              {filter === "mine"
                ? locale === "en"
                  ? "No personal templates yet. Add a fixed prompt above."
                  : "还没有我的模板。先在上方添加一个固定 Prompt。"
                : locale === "en"
                  ? "No matching templates."
                  : "没有匹配的模板。"}
            </div>
          )}
        </section>

        <aside className="lg:sticky lg:top-5 lg:self-start">
          {selected && (
            <div className="rounded-lg border border-line bg-card p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-[15px] font-bold">{selected.title}</div>
                  <div className="mt-1 text-[12px] leading-relaxed text-faint">
                    {selected.description}
                  </div>
                </div>
                <span className="shrink-0 rounded bg-paper px-2 py-1 text-[10.5px] font-semibold text-faint">
                  {categoryLabels.get(selected.category) ?? selected.category}
                </span>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2 text-[11.5px]">
                <MetricPill
                  label={locale === "en" ? "Estimated" : "预计耗时"}
                  value={
                    locale === "en"
                      ? `${selected.estimatedMinutes} min`
                      : `${selected.estimatedMinutes} 分钟`
                  }
                />
                <MetricPill
                  label={locale === "en" ? "My samples" : "我的样本"}
                  value={
                    locale === "en"
                      ? `${historyCounts[selected.id] ?? 0} runs`
                      : `${historyCounts[selected.id] ?? 0} 次`
                  }
                />
              </div>

              <div className="mt-4">
                <div className="mb-1 text-[11px] font-semibold text-faint">
                  {locale === "en" ? "Scoring dimensions" : "评测维度"}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {selected.scoring.map((item) => (
                    <span
                      key={item}
                      className="rounded bg-paper px-2 py-1 text-[11px] text-faint"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-4">
                <div className="mb-1 text-[11px] font-semibold text-faint">
                  {locale === "en" ? "Prompt preview" : "Prompt 预览"}
                </div>
                <pre className="thin-scroll max-h-56 overflow-y-auto whitespace-pre-wrap rounded-md border border-line bg-paper px-3 py-2 text-[12px] leading-relaxed">
                  {selected.prompt}
                </pre>
              </div>

              <div className="mt-4 rounded-lg border border-line bg-paper px-3 py-2.5 text-[11.5px] leading-relaxed text-faint">
                {locale === "en"
                  ? "After the run, the result is saved to local history and counted under this template's local samples. Public aggregation will come later; prompts and outputs are not uploaded now."
                  : "跑完后会写入本机历史，并计入这个模板的“我的样本”。公开众测聚合后续开放，当前不会上传 Prompt 或输出内容。"}
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  onClick={() => runTemplate(selected)}
                  className="rounded-md bg-ink px-4 py-2 text-[12.5px] font-bold text-paper cursor-pointer"
                >
                  {locale === "en" ? "Run this template" : "用这个模板跑一轮"}
                </button>
                {selected.source === "custom" && (
                  <button
                    onClick={() => removeCustom(selected)}
                    className="rounded-md border border-accent/30 px-3 py-2 text-[12.5px] text-accent hover:bg-accent/5 cursor-pointer"
                  >
                    {locale === "en" ? "Delete" : "删除"}
                  </button>
                )}
              </div>
            </div>
          )}
        </aside>
      </div>
    </main>
  );
}

function TemplateCard({
  template,
  selected,
  localSamples,
  locale,
  categoryLabel,
  onSelect,
  onRun,
}: {
  template: EvalTemplate;
  selected: boolean;
  localSamples: number;
  locale: Locale;
  categoryLabel: string;
  onSelect: () => void;
  onRun: () => void;
}) {
  const confidence = templateConfidenceLabel(template.publicSamples, localSamples, locale);
  return (
    <article
      className={`flex min-h-[220px] flex-col rounded-lg border bg-card p-4 ${
        selected ? "border-ink shadow-sm" : "border-line"
      }`}
    >
      <button onClick={onSelect} className="min-w-0 flex-1 text-left cursor-pointer">
        <div className="mb-2 flex items-start justify-between gap-2">
          <h2 className="line-clamp-2 text-[15px] font-bold">{template.title}</h2>
          <span
            className={`shrink-0 rounded px-2 py-1 text-[10.5px] font-semibold ${
              confidence.tone === "high"
                ? "bg-go/10 text-go"
                : confidence.tone === "medium"
                  ? "bg-accent/10 text-accent"
                  : "bg-paper text-faint"
            }`}
            title={confidence.description}
          >
            {confidence.label}
          </span>
        </div>
        <p className="line-clamp-3 text-[12px] leading-relaxed text-faint">
          {template.description}
        </p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {template.tags.map((tag) => (
            <span key={tag} className="rounded bg-paper px-2 py-1 text-[10.5px] text-faint">
              {tag}
            </span>
          ))}
        </div>
        <div className="num mt-3 text-[11px] text-faint">
          {locale === "en" ? "My samples" : "我的样本"} {localSamples} · {categoryLabel}
        </div>
      </button>
      <div className="mt-3 flex items-center gap-2">
        <button
          onClick={onRun}
          className="rounded-md bg-ink px-3 py-1.5 text-[12px] font-bold text-paper cursor-pointer"
        >
          {locale === "en" ? "Run now" : "立即试跑"}
        </button>
        <button
          onClick={onSelect}
          className="rounded-md border border-line px-3 py-1.5 text-[12px] text-faint hover:text-ink cursor-pointer"
        >
          {locale === "en" ? "Preview" : "预览"}
        </button>
      </div>
    </article>
  );
}

function MetricPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-line bg-paper px-3 py-2">
      <div className="text-[10.5px] text-faint">{label}</div>
      <div className="num mt-0.5 text-[13px] font-bold">{value}</div>
    </div>
  );
}
