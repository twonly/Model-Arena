import ArenaPage from "../../arena/page";
import { localizedMetadata } from "@/lib/i18n-metadata";
import { normalizeLocale, DEFAULT_LOCALE } from "@/lib/i18n";

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  return localizedMetadata(normalizeLocale(lang) ?? DEFAULT_LOCALE, "arena", "/arena");
}

export default ArenaPage;
