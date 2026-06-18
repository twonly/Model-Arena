import type { Metadata } from "next";
import { EvalTemplatesClient } from "@/components/EvalTemplatesClient";
import { JsonLd } from "@/components/JsonLd";
import { BRAND } from "@/lib/brand";
import { officialEvalTemplates } from "@/lib/eval-templates";
import { getMessages } from "@/lib/i18n-messages";
import { getRequestLocale } from "@/lib/i18n-server";
import { localeToLanguage, localizedPath } from "@/lib/i18n";

export const metadata: Metadata = {
  title: "AI 模型评测模板 - LLM Benchmark Prompt 与模型对比任务",
  description:
    "TOKRACE AI 模型评测模板提供速度、推理、代码、指令遵循、知识问答、写作和长文本等固定 Prompt，帮助开发者与测评作者用同一任务快速对比多个大模型。",
  alternates: { canonical: "/templates" },
  keywords: [
    "AI模型评测模板",
    "大模型评测模板",
    "LLM benchmark prompt",
    "模型评测集",
    "大模型测试题",
    "Prompt评测",
    "LLM模型对比",
  ],
};

function templatesJsonLd(locale: Awaited<ReturnType<typeof getRequestLocale>>) {
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

export default async function TemplatesPage() {
  const locale = await getRequestLocale();
  return (
    <>
      <JsonLd data={templatesJsonLd(locale)} />
      <EvalTemplatesClient />
    </>
  );
}
