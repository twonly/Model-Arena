import MethodPage from "../../method/page";
import { localizedMetadata } from "@/lib/i18n-metadata";
import { normalizeLocale, DEFAULT_LOCALE } from "@/lib/i18n";

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  return localizedMetadata(normalizeLocale(lang) ?? DEFAULT_LOCALE, "method", "/method", {
    openGraph: { type: "article" },
  });
}

export default MethodPage;
