import BoardPage from "../../board/page";
import { localizedMetadata } from "@/lib/i18n-metadata";
import { normalizeLocale, DEFAULT_LOCALE } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  return localizedMetadata(normalizeLocale(lang) ?? DEFAULT_LOCALE, "board", "/board");
}

export default BoardPage;
