import { cookies, headers } from "next/headers";
import {
  DEFAULT_LOCALE,
  LOCALE_HEADER,
  NEXT_LOCALE_COOKIE,
  normalizeLocale,
  type Locale,
} from "./i18n";

export async function getRequestLocale(): Promise<Locale> {
  const headerStore = await headers();
  const fromHeader = normalizeLocale(headerStore.get(LOCALE_HEADER));
  if (fromHeader) return fromHeader;

  const cookieStore = await cookies();
  return normalizeLocale(cookieStore.get(NEXT_LOCALE_COOKIE)?.value) ?? DEFAULT_LOCALE;
}
