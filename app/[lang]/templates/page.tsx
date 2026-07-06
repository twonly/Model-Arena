import type { Metadata } from "next";
import { EvalTemplatesClient } from "@/components/EvalTemplatesClient";
import { JsonLd } from "@/components/JsonLd";
import { BRAND } from "@/lib/brand";
import { officialEvalTemplates } from "@/lib/eval-templates";
import { getMessages } from "@/lib/i18n-messages";
import { localizedMetadata } from "@/lib/i18n-metadata";
import {
  DEFAULT_LOCALE,
  localeToLanguage,
  localizedPath,
  normalizeLocale,
  type Locale,
} from "@/lib/i18n";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
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

function templatesJsonLd(locale: Locale) {
  const messages = getMessages(locale);
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: messages.metadata.templates.title,
    url: `${BRAND.url}${localizedPath("/templates", locale)}`,
    description: messages.metadata.templates.description,
    inLanguage: localeToLanguage(locale),
    mainEntity: {
      "@type": "ItemList",
      itemListElement: officialEvalTemplates(locale).map((template, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: template.title,
        description: template.description,
      })),
    },
  };
}

export default async function TemplatesPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const locale = normalizeLocale((await params).lang) ?? DEFAULT_LOCALE;
  return (
    <>
      <JsonLd data={templatesJsonLd(locale)} />
      <EvalTemplatesClient />
    </>
  );
}
