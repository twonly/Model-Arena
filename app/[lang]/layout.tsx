import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { BRAND, OG_IMAGE, SEO_KEYWORDS } from "@/lib/brand";
import { JsonLd } from "@/components/JsonLd";
import { I18nProvider } from "@/components/I18nProvider";
import { SiteFooter } from "@/components/SiteFooter";
import { getMessages } from "@/lib/i18n-messages";
import {
  DEFAULT_LOCALE,
  LOCALES,
  isLocale,
  localeToLanguage,
  localeToOg,
  localizedPath,
  normalizeLocale,
  type Locale,
} from "@/lib/i18n";
import "../globals.css";

/**
 * [lang] 即根布局（Next 官方 i18n 形态）：locale 只来自路由参数，
 * 不读 headers/cookies——这是全站页面能静态化 / ISR 的前提。
 * 无语言前缀的旧地址由 proxy.ts 统一 308 到带前缀的正式页。
 */

export function generateStaticParams() {
  return LOCALES.map((lang) => ({ lang }));
}

function siteMetadata(locale: Locale): Metadata {
  const messages = getMessages(locale);
  return {
    metadataBase: new URL(BRAND.url),
    title: {
      default: `${BRAND.full} — ${messages.brand.tagline}`,
      template: `%s · ${BRAND.zh} ${BRAND.en}`,
    },
    description: messages.brand.description,
    applicationName: BRAND.en,
    keywords: SEO_KEYWORDS,
    authors: [{ name: BRAND.publisher }],
    creator: BRAND.publisher,
    // Site ownership verification only; this does not load ads or advertising cookies.
    other: {
      "google-adsense-account": "ca-pub-3004733289316212",
    },
    alternates: {
      canonical: localizedPath("/", locale),
      languages: {
        "zh-CN": localizedPath("/", "zh-CN"),
        en: localizedPath("/", "en"),
        // x-default：语言/地区未匹配时的兜底，指向默认中文版
        "x-default": localizedPath("/", "zh-CN"),
      },
    },
    openGraph: {
      type: "website",
      siteName: BRAND.full,
      title: `${BRAND.full} — ${messages.brand.tagline}`,
      description: messages.brand.description,
      url: localizedPath("/", locale),
      locale: localeToOg(locale),
      images: [OG_IMAGE],
    },
    twitter: {
      card: "summary_large_image",
      title: BRAND.full,
      description: messages.brand.description,
      // twitter.images 未设时会回退到 openGraph.images，这里显式声明更稳妥
      images: [OG_IMAGE.url],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true, "max-image-preview": "large" },
    },
  };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  return siteMetadata(normalizeLocale(lang) ?? DEFAULT_LOCALE);
}

function siteJsonLd(locale: Locale) {
  const messages = getMessages(locale);
  const language = localeToLanguage(locale);
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${BRAND.url}/#org`,
        name: `${BRAND.en} ${BRAND.zh}`,
        url: BRAND.url,
        logo: `${BRAND.url}/logo.png`,
        description: messages.brand.description,
        sameAs: [BRAND.githubUrl],
      },
      {
        "@type": "WebSite",
        "@id": `${BRAND.url}/#website`,
        url: BRAND.url,
        name: BRAND.full,
        description: messages.brand.description,
        inLanguage: language,
        publisher: { "@id": `${BRAND.url}/#org` },
        sameAs: [BRAND.githubUrl],
      },
      {
        "@type": "SoftwareApplication",
        "@id": `${BRAND.url}/#app`,
        name: `${BRAND.en} ${BRAND.zh}`,
        applicationCategory: "DeveloperApplication",
        operatingSystem: "Web",
        url: BRAND.url,
        description: messages.brand.description,
        inLanguage: language,
        isAccessibleForFree: true,
        publisher: { "@id": `${BRAND.url}/#org` },
        sameAs: [BRAND.githubUrl],
        offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
      },
    ],
  };
}

export default async function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}>) {
  const { lang } = await params;
  // 只有 proxy 跳过的带点路径（如 /foo.txt）会带非法 lang 走到这里 → 404
  if (!isLocale(lang)) notFound();
  const locale: Locale = lang;
  const messages = getMessages(locale);

  return (
    <html
      lang={localeToLanguage(locale)}
      data-locale={locale}
      className="h-full antialiased"
      suppressHydrationWarning
    >
      <body className="min-h-full">
        {/* 首帧前应用已保存的主题，避免暗色用户看到白屏闪烁 */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{if(JSON.parse(localStorage.getItem("ma.theme"))==="dark")document.documentElement.dataset.theme="dark"}catch(e){}`,
          }}
        />
        <JsonLd data={siteJsonLd(locale)} />
        <I18nProvider locale={locale} messages={messages}>
          {children}
          <SiteFooter />
        </I18nProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
