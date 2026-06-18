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

function enc(value: string): string {
  return encodeURIComponent(value);
}

export function socialShareTargets(input: SocialShareInput): SocialShareTarget[] {
  const title = input.title.trim();
  const text = (input.text?.trim() || title).slice(0, 220);
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
