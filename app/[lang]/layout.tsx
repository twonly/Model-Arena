import { notFound } from "next/navigation";
import { I18nProvider } from "@/components/I18nProvider";
import { getMessages } from "@/lib/i18n-messages";
import { isLocale, LOCALES, type Locale } from "@/lib/i18n";

export function generateStaticParams() {
  return LOCALES.map((lang) => ({ lang }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const locale: Locale = lang;
  return (
    <I18nProvider locale={locale} messages={getMessages(locale)}>
      {children}
    </I18nProvider>
  );
}
