"use client";

import Link from "next/link";
import { useI18n } from "@/components/I18nProvider";

/**
 * 站点 logo（竞速速度条），默认链回首页。
 * withText 时附「百模竞速」品牌名；用于各页面顶部导航的品牌位。
 */
export function Logo({
  size = 22,
  withText = false,
  href = "/",
}: {
  size?: number;
  withText?: boolean;
  href?: string;
}) {
  const { locale, href: localHref } = useI18n();
  const en = locale === "en";
  const resolvedHref = href === "/" ? localHref("/") : href;
  return (
    <Link
      href={resolvedHref}
      aria-label={en ? "TOKRACE home" : "百模竞速 TOKRACE 首页"}
      className="flex shrink-0 items-center gap-1.5"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/logo.png" alt="" width={size} height={size} className="shrink-0" />
      {withText && (
        <span
          className="text-[15px] font-black"
          style={{ fontFamily: "var(--font-title)" }}
        >
          {en ? "TOKRACE" : "百模竞速"}
        </span>
      )}
    </Link>
  );
}
