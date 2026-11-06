import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { BRAND, OG_IMAGE } from "@/lib/brand";
import { localizedPath, type Locale } from "@/lib/i18n";
import { reviewPresentation, reviewText, reviewNavigation, REVIEW_PRESENTATION_UPDATED_AT } from "@/lib/model-review-presentation";
import { ArticleNavigation } from "./ArticleNavigation";
import { ModelReviewIntroduction, ModelReviewOverview } from "./ModelReviewIntroduction";

export function infoMetadata(locale: Locale, pathname: string, title: string, description: string): Metadata {
  const presentation = reviewPresentation(pathname);
  if (presentation) {
    title = reviewText(presentation.title, locale);
    description = reviewText(presentation.description, locale);
  }
  return {
    metadataBase: new URL(BRAND.url),
    title,
    description,
    alternates: {
      canonical: localizedPath(pathname, locale),
      languages: {
        "zh-CN": localizedPath(pathname, "zh-CN"),
        en: localizedPath(pathname, "en"),
        "x-default": localizedPath(pathname, "zh-CN"),
      },
    },
    openGraph: { title, description, url: localizedPath(pathname, locale), images: [OG_IMAGE] },
    twitter: { card: "summary_large_image", title, description, images: [OG_IMAGE.url] },
  };
}

export function InfoPage({ locale, pathname, title, intro, updatedAt, sidebar, children }: {
  locale: Locale;
  pathname: string;
  title: ReactNode;
  intro: string;
  updatedAt?: string;
  sidebar?: ReactNode;
  children: ReactNode;
}) {
  const en = locale === "en";
  const presentation = reviewPresentation(pathname);
  const slug = pathname.replace(/^\/guides\//, "");
  if (presentation) {
    title = reviewText(presentation.title, locale);
    intro = reviewText(presentation.introduction, locale);
    updatedAt = REVIEW_PRESENTATION_UPDATED_AT.slice(0, 10);
    sidebar = <ArticleNavigation sections={reviewNavigation(slug, locale)} en={en} />;
  }
  return (
    <main className={`mx-auto min-h-[70vh] px-5 py-8 sm:px-6 sm:py-12 ${sidebar ? "max-w-[1560px]" : "max-w-3xl"}`}>
      <nav className="mb-12 flex flex-wrap items-center justify-between gap-4 text-[13px]">
        <Link href={localizedPath("/", locale)} className="font-bold">← {BRAND.full}</Link>
        <Link href={localizedPath(pathname, en ? "zh-CN" : "en")} lang={en ? "zh-CN" : "en"} className="text-faint hover:text-ink">
          {en ? "中文" : "English"}
        </Link>
      </nav>
      <header className={sidebar ? "xl:ml-64" : undefined}>
      <h1 className="text-[32px] font-black sm:text-[40px]" style={{ fontFamily: "var(--font-title)" }}>{title}</h1>
      <p className="mt-4 text-[15px] leading-7 text-faint">{intro}</p>
      <p className="mt-4 text-[12px] text-faint">
        {en
          ? `Updated: ${updatedAt ?? "September 9, 2026"}`
          : `更新日期：${updatedAt ?? "2026 年 9 月 9 日"}`}
      </p>
      </header>
      <div className={sidebar ? "mt-8 grid min-w-0 gap-8 xl:grid-cols-[14rem_minmax(0,1fr)]" : "mt-10"}>
      {sidebar && <aside className="min-w-0">{sidebar}</aside>}
      <div className="min-w-0 space-y-9 text-[14px] leading-7 text-faint [&_h2]:mb-3 [&_h2]:text-[19px] [&_h2]:font-bold [&_h2]:text-ink [&_p+p]:mt-3 [&_a]:text-ink [&_a]:underline [&_a]:underline-offset-4 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5">
        {presentation && <><ModelReviewIntroduction slug={slug} locale={locale} /><ModelReviewOverview slug={slug} locale={locale} /></>}
        {children}
      </div>
      </div>
    </main>
  );
}
