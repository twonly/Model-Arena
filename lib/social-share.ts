export type SocialShareId = "x" | "facebook" | "weibo" | "linkedin";

export interface SocialShareInput {
  url: string;
  title: string;
  text?: string;
  hashtags?: string[];
  via?: string;
}

export interface SocialShareTarget {
  id: SocialShareId;
  label: string;
  href: string;
}

export type ShareLocale = "zh-CN" | "en";

function enc(value: string): string {
  return encodeURIComponent(value);
}

export function socialShareTargets(input: SocialShareInput): SocialShareTarget[] {
  const title = input.title.trim();
  const text = (input.text?.trim() || title).slice(0, 360);
  const url = input.url;
  const hashtags = (input.hashtags ?? ["TOKRACE", "LLM"]).filter(Boolean);
  const xParams = new URLSearchParams({
    text,
    url,
  });
  if (hashtags.length) xParams.set("hashtags", hashtags.join(","));
  if (input.via) xParams.set("via", input.via);

  return [
    {
      id: "x",
      label: "X",
      href: `https://twitter.com/intent/tweet?${xParams.toString()}`,
    },
    {
      id: "facebook",
      label: "Facebook",
      href: `https://www.facebook.com/sharer/sharer.php?u=${enc(url)}`,
    },
    {
      id: "weibo",
      label: "微博",
      href: `https://service.weibo.com/share/share.php?url=${enc(url)}&title=${enc(text)}`,
    },
    {
      id: "linkedin",
      label: "LinkedIn",
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${enc(url)}`,
    },
  ];
}

export function githubLinkMarkdown(input: { title: string; url: string }): string {
  return `[${input.title.replace(/\]/g, "\\]")}](${input.url})`;
}

function uniqueModelNames(models: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const model of models) {
    const name = model.trim().replace(/\s+/g, " ");
    const key = name.toLowerCase();
    if (!name || seen.has(key)) continue;
    seen.add(key);
    out.push(name);
  }
  return out;
}

function compactModelName(name: string): string {
  const chars = [...name];
  return chars.length > 30 ? `${chars.slice(0, 29).join("")}…` : name;
}

export function shareModelListText(
  models: string[],
  locale: ShareLocale,
  limit = 5
): string {
  const names = uniqueModelNames(models).slice(0, limit).map(compactModelName);
  if (!names.length) return locale === "en" ? "model comparison" : "模型评测";
  const count = uniqueModelNames(models).length;
  if (locale === "en") return `${names.join(", ")} (${count} models)`;
  return `${names.join("、")}（${count} 个模型）`;
}

export function buildSharePostText(input: {
  title?: string;
  models: string[];
  locale: ShareLocale;
}): string {
  const title = input.title?.trim();
  const modelList = shareModelListText(input.models, input.locale);
  if (input.locale === "en") {
    return [
      `TTFT feel · model review · ${modelList} · TOKRACE`,
      "Same Prompt, side-by-side speed test. Open it to review TTFT, output tok/s, peak speed, model outputs, and rerun the test.",
      title ? `Snapshot: ${title}` : "",
    ]
      .filter(Boolean)
      .join("\n");
  }
  return [
    `首 Token 体感 · 模型评测 · ${modelList} · TOKRACE`,
    "同一个 Prompt 同场对比，打开可复查 TTFT、输出 tok/s、峰值速度、模型原文，也可以一键复跑。",
    title ? `本次快照：${title}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}
