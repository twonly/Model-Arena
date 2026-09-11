import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { BRAND, OG_IMAGE } from "@/lib/brand";
import { localizedPath, type Locale } from "@/lib/i18n";

export function infoMetadata(locale: Locale, pathname: string, title: string, description: string): Metadata {
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

export function InfoPage({ locale, pathname, title, intro, updatedAt, children }: {
  locale: Locale;
  pathname: string;
  title: string;
  intro: string;
  updatedAt?: string;
  children: ReactNode;
}) {
  const en = locale === "en";
  return (
    <main className="mx-auto min-h-[70vh] max-w-3xl px-5 py-8 sm:px-6 sm:py-12">
      <nav className="mb-12 flex flex-wrap items-center justify-between gap-4 text-[13px]">
        <Link href={localizedPath("/", locale)} className="font-bold">← {BRAND.full}</Link>
        <Link href={localizedPath(pathname, en ? "zh-CN" : "en")} lang={en ? "zh-CN" : "en"} className="text-faint hover:text-ink">
          {en ? "中文" : "English"}
        </Link>
      </nav>
      <h1 className="text-[32px] font-black sm:text-[40px]" style={{ fontFamily: "var(--font-title)" }}>{title}</h1>
      <p className="mt-4 text-[15px] leading-7 text-faint">{intro}</p>
      <p className="mt-4 text-[12px] text-faint">
        {en
          ? `Updated: ${updatedAt ?? "September 9, 2026"}`
          : `更新日期：${updatedAt ?? "2026 年 9 月 9 日"}`}
      </p>
      <div className="mt-10 space-y-9 text-[14px] leading-7 text-faint [&_h2]:mb-3 [&_h2]:text-[19px] [&_h2]:font-bold [&_h2]:text-ink [&_p+p]:mt-3 [&_a]:text-ink [&_a]:underline [&_a]:underline-offset-4 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5">
        {children}
      </div>
    </main>
  );
}
