/* eslint-disable @next/next/no-img-element */
"use client";

import { useI18n } from "@/components/I18nProvider";
import { BRAND } from "@/lib/brand";

/**
 * 产品冠名：出品人「AI拯救打工人」+ GitHub 仓库。
 * 悬浮小红书链接时展示二维码（public/qrcode.jpg）。
 */
export const GITHUB_URL = BRAND.githubUrl;
export const XHS_URL =
  "https://www.xiaohongshu.com/user/profile/6467b1210000000010027a51";

export function Credit({ compact = false }: { compact?: boolean }) {
  const { locale } = useI18n();
  const en = locale === "en";
  return (
    <span
      className={`inline-flex items-center gap-2 ${compact ? "text-[11px]" : "text-[12px]"} text-faint`}
    >
      <span>{en ? "By" : "出品"}</span>
      <span className="group relative inline-block">
        <a
          href={XHS_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold hover:underline"
          style={{ color: "var(--accent)" }}
        >
          AI拯救打工人
        </a>
        {/* 悬浮展示小红书二维码 */}
        <span className="pointer-events-none absolute bottom-full left-1/2 z-50 hidden -translate-x-1/2 pb-2 group-hover:block">
          <span className="block w-44 rounded-lg border border-line bg-card p-2 shadow-xl">
            <img
              src="/qrcode.jpg"
              alt={en ? "Xiaohongshu QR code for @AI拯救打工人" : "小红书 @AI拯救打工人 二维码"}
              className="w-full rounded"
            />
            <span className="mt-1 block text-center text-[10.5px] text-faint">
              {en ? "Scan on Xiaohongshu · ai_love_worker" : "小红书扫码关注 · ai_love_worker"}
            </span>
          </span>
        </span>
      </span>
      <span className="text-line">|</span>
      <a
        href={GITHUB_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="hover:text-ink hover:underline"
      >
        {en ? "Open Source" : "GitHub 开源"}
      </a>
    </span>
  );
}
