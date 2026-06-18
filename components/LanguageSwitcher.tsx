"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { LOCALES, localizedPath, stripLocalePrefix, type Locale } from "@/lib/i18n";
import { useI18n } from "./I18nProvider";

const LABELS: Record<Locale, string> = {
  "zh-CN": "中文",
  en: "EN",
};

export function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { locale, messages, setLocalePreference } = useI18n();

  const switchTo = (nextLocale: Locale) => {
    setLocalePreference(nextLocale);
    const stripped = stripLocalePrefix(pathname).pathname;
    const query = searchParams.toString();
    router.push(localizedPath(`${stripped}${query ? `?${query}` : ""}`, nextLocale));
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
