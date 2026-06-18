import StatsPage from "../../stats/page";
import { localizedMetadata } from "@/lib/i18n-metadata";
import { normalizeLocale, DEFAULT_LOCALE } from "@/lib/i18n";

export const revalidate = 300;

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  return localizedMetadata(normalizeLocale(lang) ?? DEFAULT_LOCALE, "stats", "/stats");
}

export default StatsPage;
