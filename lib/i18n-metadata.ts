import type { Metadata } from "next";
import { BRAND, SEO_KEYWORDS } from "./brand";
import { getMessages } from "./i18n-messages";
import { localeToOg, localizedPath, type Locale } from "./i18n";

type MetadataKey = "home" | "arena" | "stats" | "board" | "templates" | "invite" | "method" | "pricing" | "me";

export function localizedMetadata(
  locale: Locale,
  key: MetadataKey,
  pathname: string,
  opts: Partial<Metadata> = {}
): Metadata {
  const messages = getMessages(locale);
  const meta = messages.metadata[key];
  return {
    metadataBase: new URL(BRAND.url),
    title: meta.title,
    description: meta.description,
    keywords: SEO_KEYWORDS,
    alternates: {
      canonical: localizedPath(pathname, locale),
      languages: {
        "zh-CN": localizedPath(pathname, "zh-CN"),
        en: localizedPath(pathname, "en"),
      },
      ...opts.alternates,
    },
    openGraph: {
      type: "website",
      siteName: BRAND.full,
      title: meta.title,
      description: meta.description,
      url: localizedPath(pathname, locale),
      locale: localeToOg(locale),
      ...opts.openGraph,
    },
    twitter: {
      card: "summary_large_image",
      title: meta.title,
      description: meta.description,
      ...opts.twitter,
    },
    ...opts,
  };
}
