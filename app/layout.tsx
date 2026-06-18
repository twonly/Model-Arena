import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { BRAND, SEO_KEYWORDS } from "@/lib/brand";
import { JsonLd } from "@/components/JsonLd";
import { I18nProvider } from "@/components/I18nProvider";
import { getRequestLocale } from "@/lib/i18n-server";
import { getMessages } from "@/lib/i18n-messages";
import { localeToLanguage, localeToOg, localizedPath, type Locale } from "@/lib/i18n";
import "./globals.css";

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
    alternates: {
      canonical: localizedPath("/", locale),
      languages: {
        "zh-CN": localizedPath("/", "zh-CN"),
        en: localizedPath("/", "en"),
      },
    },
    openGraph: {
      type: "website",
      siteName: BRAND.full,
      title: `${BRAND.full} — ${messages.brand.tagline}`,
      description: messages.brand.description,
      url: localizedPath("/", locale),
      locale: localeToOg(locale),
    },
    twitter: {
      card: "summary_large_image",
      title: BRAND.full,
      description: messages.brand.description,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true, "max-image-preview": "large" },
    },
  };
}

export async function generateMetadata(): Promise<Metadata> {
  return siteMetadata(await getRequestLocale());
}

function siteJsonLd(locale: Locale) {
  const messages = getMessages(locale);
  const language = localeToLanguage(locale);
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${BRAND.url}/#website`,
        url: BRAND.url,
        name: BRAND.full,
        description: messages.brand.description,
        inLanguage: language,
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
        offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
      },
    ],
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getRequestLocale();
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
        </I18nProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
