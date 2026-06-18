export const LOCALES = ["zh-CN", "en"] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "zh-CN";
export const NEXT_LOCALE_COOKIE = "NEXT_LOCALE";
export const LOCALE_HEADER = "x-tokrace-locale";

const LOCALE_SET = new Set<string>(LOCALES);

const ZH_SOURCES = [
  "wechat",
  "weixin",
  "xhs",
  "xiaohongshu",
  "zhihu",
  "baidu",
  "bilibili",
  "juejin",
] as const;

const EN_SOURCES = [
  "producthunt",
  "github",
  "hackernews",
  "reddit",
  "twitter",
  "linkedin",
] as const;

const SHORT_SOURCE_LOCALES: Record<string, Locale> = {
  ph: "en",
  hn: "en",
  x: "en",
};

export function normalizeLocale(input: string | null | undefined): Locale | null {
  if (!input) return null;
  const value = input.trim().toLowerCase().replace(/_/g, "-");
  if (!value) return null;
  if (value === "zh" || value === "zh-cn" || value === "zh-hans" || value === "cn") {
    return "zh-CN";
  }
  if (value === "en" || value.startsWith("en-")) return "en";
  return null;
}

export function isLocale(input: string | null | undefined): input is Locale {
  return !!input && LOCALE_SET.has(input);
}

export function localeToOg(locale: Locale): string {
  return locale === "zh-CN" ? "zh_CN" : "en_US";
}

export function localeToLanguage(locale: Locale): string {
  return locale === "zh-CN" ? "zh-CN" : "en-US";
}

export function stripLocalePrefix(pathname: string): {
  locale: Locale | null;
  pathname: string;
} {
  const normalized = pathname.startsWith("/") ? pathname : `/${pathname}`;
  const [, maybeLocale, ...rest] = normalized.split("/");
  const locale = normalizeLocale(maybeLocale);
  if (!locale || maybeLocale !== locale) return { locale: null, pathname: normalized };
  const nextPath = `/${rest.join("/")}`.replace(/\/+$/, "") || "/";
  return { locale, pathname: nextPath };
}

export function pathLocale(pathname: string): Locale | null {
  return stripLocalePrefix(pathname).locale;
}

export function localizedPath(path: string, locale: Locale): string {
  if (/^[a-z][a-z0-9+.-]*:/i.test(path) || path.startsWith("//")) return path;

  const hashIndex = path.indexOf("#");
  const beforeHash = hashIndex >= 0 ? path.slice(0, hashIndex) : path;
  const hash = hashIndex >= 0 ? path.slice(hashIndex) : "";
  const queryIndex = beforeHash.indexOf("?");
  const rawPath = queryIndex >= 0 ? beforeHash.slice(0, queryIndex) : beforeHash;
  const query = queryIndex >= 0 ? beforeHash.slice(queryIndex) : "";
  const pathname = rawPath ? (rawPath.startsWith("/") ? rawPath : `/${rawPath}`) : "/";
  const stripped = stripLocalePrefix(pathname).pathname;
  const suffix = stripped === "/" ? "" : stripped;
  return `/${locale}${suffix}${query}${hash}`;
}

export function alternatesForPath(pathname: string): Record<Locale, string> {
  const stripped = stripLocalePrefix(pathname).pathname;
  return {
    "zh-CN": localizedPath(stripped, "zh-CN"),
    en: localizedPath(stripped, "en"),
  };
}

export function parseAcceptLanguage(header: string | null | undefined): Locale | null {
  if (!header) return null;
  return header
    .split(",")
    .map((part, index) => {
      const [language, ...params] = part.trim().split(";");
      const qParam = params.find((param) => param.trim().startsWith("q="));
      const q = qParam ? Number(qParam.trim().slice(2)) : 1;
      return { locale: normalizeLocale(language), q: Number.isFinite(q) ? q : 0, index };
    })
    .filter((item): item is { locale: Locale; q: number; index: number } => !!item.locale)
    .sort((a, b) => b.q - a.q || a.index - b.index)[0]?.locale ?? null;
}

function sourceTokens(value: string): string[] {
  return value
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .map((token) => token.trim())
    .filter(Boolean);
}

function sourceLocaleFromValue(value: string | null | undefined): Locale | null {
  if (!value) return null;
  const lower = value.toLowerCase();
  const tokens = sourceTokens(lower);
  for (const token of tokens) {
    const shortLocale = SHORT_SOURCE_LOCALES[token];
    if (shortLocale) return shortLocale;
  }
  if (ZH_SOURCES.some((source) => lower.includes(source))) return "zh-CN";
  if (EN_SOURCES.some((source) => lower.includes(source))) return "en";
  return null;
}

export function localeFromSource(opts: {
  source?: string | null;
  utmSource?: string | null;
  referrer?: string | null;
}): Locale | null {
  return (
    sourceLocaleFromValue(opts.source) ??
    sourceLocaleFromValue(opts.utmSource) ??
    sourceLocaleFromValue(opts.referrer)
  );
}

export function resolveLocale(opts: {
  pathname?: string | null;
  lang?: string | null;
  locale?: string | null;
  cookieLocale?: string | null;
  source?: string | null;
  utmSource?: string | null;
  referrer?: string | null;
  acceptLanguage?: string | null;
}): Locale {
  const fromPath = opts.pathname ? pathLocale(opts.pathname) : null;
  return (
    fromPath ??
    normalizeLocale(opts.lang) ??
    normalizeLocale(opts.locale) ??
    normalizeLocale(opts.cookieLocale) ??
    localeFromSource({
      source: opts.source,
      utmSource: opts.utmSource,
      referrer: opts.referrer,
    }) ??
    parseAcceptLanguage(opts.acceptLanguage) ??
    DEFAULT_LOCALE
  );
}
