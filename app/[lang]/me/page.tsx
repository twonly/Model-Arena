import MePage from "../../me/page";
import { localizedMetadata } from "@/lib/i18n-metadata";
import { normalizeLocale, DEFAULT_LOCALE } from "@/lib/i18n";

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  // 「我的中心」是个人私有页，按页级 noindex 处理（robots 不屏蔽，便于爬虫看到 noindex）
  return localizedMetadata(normalizeLocale(lang) ?? DEFAULT_LOCALE, "me", "/me", {
    robots: { index: false, follow: false },
  });
}

export default MePage;
