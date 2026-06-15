import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { BRAND, SEO_KEYWORDS } from "@/lib/brand";
import { JsonLd } from "@/components/JsonLd";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(BRAND.url),
  title: {
    default: `${BRAND.full} — ${BRAND.taglineZh}`,
    template: `%s · ${BRAND.zh} ${BRAND.en}`,
  },
  description: BRAND.descZh,
  applicationName: BRAND.en,
  keywords: SEO_KEYWORDS,
  authors: [{ name: BRAND.publisher }],
  creator: BRAND.publisher,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: BRAND.full,
    title: `${BRAND.full} — ${BRAND.taglineZh}`,
    description: BRAND.descZh,
    url: BRAND.url,
    locale: "zh_CN",
  },
  twitter: {
    card: "summary_large_image",
    title: BRAND.full,
    description: BRAND.descZh,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
};

// 站点级结构化数据：网站 + 软件应用（GEO / 富搜索结果）
const siteJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": `${BRAND.url}/#website`,
      url: BRAND.url,
      name: BRAND.full,
      description: BRAND.descZh,
      inLanguage: "zh-CN",
    },
    {
      "@type": "SoftwareApplication",
      "@id": `${BRAND.url}/#app`,
      name: `${BRAND.en} ${BRAND.zh}`,
      applicationCategory: "DeveloperApplication",
      operatingSystem: "Web",
      url: BRAND.url,
      description: BRAND.descZh,
      inLanguage: "zh-CN",
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="h-full antialiased" suppressHydrationWarning>
      <body className="min-h-full">
        {/* 首帧前应用已保存的主题，避免暗色用户看到白屏闪烁 */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{if(JSON.parse(localStorage.getItem("ma.theme"))==="dark")document.documentElement.dataset.theme="dark"}catch(e){}`,
          }}
        />
        <JsonLd data={siteJsonLd} />
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
