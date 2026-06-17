import type { Metadata } from "next";
import { EvalTemplatesClient } from "@/components/EvalTemplatesClient";
import { JsonLd } from "@/components/JsonLd";
import { BRAND } from "@/lib/brand";
import { OFFICIAL_EVAL_TEMPLATES } from "@/lib/eval-templates";

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

const templatesJsonLd = {
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  name: "AI 模型评测模板",
  url: `${BRAND.url}/templates`,
  description: metadata.description,
  inLanguage: "zh-CN",
  mainEntity: {
    "@type": "ItemList",
    itemListElement: OFFICIAL_EVAL_TEMPLATES.map((template, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: template.title,
      description: template.description,
    })),
  },
};

export default function TemplatesPage() {
  return (
    <>
      <JsonLd data={templatesJsonLd} />
      <EvalTemplatesClient />
    </>
  );
}
