"use client";

import { createContext, useContext, useEffect, useMemo } from "react";
import {
  DEFAULT_LOCALE,
  NEXT_LOCALE_COOKIE,
  localizedPath,
  localeToLanguage,
  type Locale,
} from "@/lib/i18n";
import { getMessages, zhMessages, type Messages } from "@/lib/i18n-messages";

type I18nContextValue = {
  locale: Locale;
  messages: Messages;
  href: (path: string) => string;
  setLocalePreference: (nextLocale: Locale) => void;
};

const I18nContext = createContext<I18nContextValue>({
  locale: DEFAULT_LOCALE,
  messages: zhMessages,
  href: (path) => localizedPath(path, DEFAULT_LOCALE),
  setLocalePreference: () => {},
});

export function I18nProvider({
  locale,
  messages,
  children,
}: {
  locale: Locale;
  messages?: Messages;
  children: React.ReactNode;
}) {
  const value = useMemo<I18nContextValue>(() => {
    const resolvedMessages = messages ?? getMessages(locale);
    return {
      locale,
      messages: resolvedMessages,
      href: (path: string) => localizedPath(path, locale),
      setLocalePreference: (nextLocale: Locale) => {
        document.cookie = `${NEXT_LOCALE_COOKIE}=${nextLocale}; Path=/; Max-Age=31536000; SameSite=Lax`;
      },
    };
  }, [locale, messages]);

  useEffect(() => {
    document.documentElement.lang = localeToLanguage(locale);
    document.documentElement.dataset.locale = locale;
  }, [locale]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  return useContext(I18nContext);
}

export function useLocale(): Locale {
  return useI18n().locale;
}

export function useMessages(): Messages {
  return useI18n().messages;
}
