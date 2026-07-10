"use client";

import { useI18n } from "@/components/I18nProvider";
import { BRAND } from "@/lib/brand";

/**
 * 产品署名：仅保留 GitHub 开源链接。
 * 个人运营署名与社媒二维码暂不对外，恢复时参考本文件的 git 历史。
 */
export const GITHUB_URL = BRAND.githubUrl;

export function Credit({ compact = false }: { compact?: boolean }) {
  const { locale } = useI18n();
  const en = locale === "en";
  return (
    <span
      className={`inline-flex items-center gap-2 ${compact ? "text-[11px]" : "text-[12px]"} text-faint`}
    >
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
