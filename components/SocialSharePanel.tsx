"use client";

import { useMemo, useState } from "react";
import { useI18n } from "./I18nProvider";
import { githubLinkMarkdown, socialShareTargets } from "@/lib/social-share";

export function SocialSharePanel({
  url,
  title,
  text,
  badgeMarkdown,
  badgeHtml,
  compact = false,
  className = "",
}: {
  url: string;
  title: string;
  text?: string;
  badgeMarkdown?: string;
  badgeHtml?: string;
  compact?: boolean;
  className?: string;
}) {
  const { locale } = useI18n();
  const isZh = locale === "zh-CN";
  const [copied, setCopied] = useState("");
  const targets = useMemo(
    () =>
      socialShareTargets({
        url,
        title,
        text,
        hashtags: ["TOKRACE", "LLM"],
      }),
    [url, title, text]
  );

  const copy = async (value: string, label: string) => {
    await navigator.clipboard.writeText(value);
    setCopied(label);
    window.setTimeout(() => setCopied(""), 1800);
  };

  const btn =
    "inline-flex items-center justify-center rounded-md border border-line bg-card px-3 py-1.5 text-[12px] font-semibold text-faint hover:border-ink/25 hover:text-ink";
  const primaryBtn =
    "inline-flex items-center justify-center rounded-md bg-ink px-3 py-1.5 text-[12px] font-bold text-paper";
  const markdown = githubLinkMarkdown({ title, url });

  return (
    <section
      className={`rounded-lg border border-line bg-paper/50 px-3.5 py-3 ${className}`}
      data-no-export="1"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="text-[12px] font-bold">
            {isZh ? "分享与嵌入" : "Share and embed"}
          </div>
          {!compact && (
            <p className="mt-0.5 text-[11px] leading-relaxed text-faint">
              {isZh
                ? "社交平台直接发布；GitHub/README 使用 Markdown 或 Badge。"
                : "Post to social channels, or use Markdown and badges for GitHub/README."}
            </p>
          )}
        </div>
        {copied && (
          <span className="rounded-md bg-card px-2 py-1 text-[11px] text-go">
            {copied}
          </span>
        )}
      </div>

      <div className="mt-2 flex flex-wrap gap-2">
        {targets.map((target) => (
          <a
            key={target.id}
            className={target.id === "x" ? primaryBtn : btn}
            href={target.href}
            target="_blank"
            rel="noopener noreferrer"
          >
            {target.label}
          </a>
        ))}
        <button
          className={btn}
          onClick={() => copy(url, isZh ? "链接已复制" : "Link copied")}
        >
          {isZh ? "复制链接" : "Copy link"}
        </button>
        <button
          className={btn}
          onClick={() =>
            copy(markdown, isZh ? "Markdown 已复制" : "Markdown copied")
          }
        >
          GitHub Markdown
        </button>
        {badgeMarkdown && (
          <button
            className={btn}
            onClick={() =>
              copy(badgeMarkdown, isZh ? "Badge 已复制" : "Badge copied")
            }
          >
            {isZh ? "复制 Badge" : "Copy badge"}
          </button>
        )}
        {badgeHtml && (
          <button
            className={btn}
            onClick={() => copy(badgeHtml, isZh ? "HTML 已复制" : "HTML copied")}
          >
            HTML
          </button>
        )}
      </div>

      {!compact && badgeMarkdown && (
        <pre className="mt-2 overflow-x-auto rounded-md border border-line bg-card px-2.5 py-2 text-[11px] text-faint">
          {badgeMarkdown}
        </pre>
      )}
    </section>
  );
}
