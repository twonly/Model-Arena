import TemplatesPage from "../../templates/page";
import { localizedMetadata } from "@/lib/i18n-metadata";
import { normalizeLocale, DEFAULT_LOCALE } from "@/lib/i18n";

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  return localizedMetadata(
    normalizeLocale(lang) ?? DEFAULT_LOCALE,
    "templates",
    "/templates",
    {
      keywords: [
        "AI model evaluation templates",
        "LLM benchmark prompt",
        "LLM comparison",
        "AI模型评测模板",
        "Prompt评测",
      ],
    }
  );
}

export default TemplatesPage;
