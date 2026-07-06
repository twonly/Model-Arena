"use client";

import { usePathname, useRouter } from "next/navigation";
import { LOCALES, localizedPath, stripLocalePrefix, type Locale } from "@/lib/i18n";
import { useI18n } from "./I18nProvider";

const LABELS: Record<Locale, string> = {
  "zh-CN": "中文",
  en: "EN",
};

export function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const pathname = usePathname();
  const router = useRouter();
  const { locale, messages, setLocalePreference } = useI18n();

  const switchTo = (nextLocale: Locale) => {
    setLocalePreference(nextLocale);
    const stripped = stripLocalePrefix(pathname).pathname;
    // 查询串只在点击时才需要，从 location 现取——useSearchParams 会触发
    // CSR bailout，把使用本组件的页面全部拖出静态预渲染
    const search = window.location.search;
    router.push(localizedPath(`${stripped}${search}`, nextLocale));
  };

  return (
    <div
      className="inline-flex items-center overflow-hidden rounded-md border border-line bg-card text-[12px]"
      aria-label={messages.common.language}
    >
      {LOCALES.map((item) => (
        <button
          key={item}
          type="button"
          onClick={() => switchTo(item)}
          className={`px-2.5 py-1 font-semibold cursor-pointer ${
            locale === item ? "bg-ink text-paper" : "text-faint hover:text-ink"
          }`}
          title={compact ? LABELS[item] : `${messages.common.language}: ${LABELS[item]}`}
        >
          {LABELS[item]}
        </button>
      ))}
    </div>
  );
}
