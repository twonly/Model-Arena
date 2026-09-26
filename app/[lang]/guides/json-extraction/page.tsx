import Link from "next/link";
import { InfoPage, infoMetadata } from "@/components/InfoPage";
import { RerunButton } from "@/components/RerunButton";
import { BENCHMARK_CASES, BENCHMARK_PARAMS } from "@/lib/benchmark-suite";
import { normalizeLocale, DEFAULT_LOCALE, localizedPath } from "@/lib/i18n";
export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const l = normalizeLocale((await params).lang) ?? DEFAULT_LOCALE;
  return infoMetadata(
    l,
    "/guides/json-extraction",
    l === "en"
      ? "Choosing a model for JSON extraction"
      : "JSON 信息抽取：如何选择模型",
    l === "en"
      ? "Evaluate schema correctness, missing values, evidence and latency on your own documents."
      : "用字段正确性、缺失值、证据与等待时间评估真实材料上的模型效果。",
  );
}
export default async function Guide({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const locale = normalizeLocale((await params).lang) ?? DEFAULT_LOCALE,
    en = locale === "en",
    c = BENCHMARK_CASES[0];
  return (
    <InfoPage
      locale={locale}
      pathname="/guides/json-extraction"
      title={
        en
          ? "Choose a model for JSON extraction"
          : "JSON 信息抽取：先验证字段，再比较速度"
      }
      intro={
        en
          ? "A valid JSON response can still contain incorrect facts. Use examples from the workflow you want to automate."
          : "能解析为 JSON，不代表字段内容正确。选型测试应覆盖你真正要自动化的材料。"
      }
      updatedAt="2026-09-26"
    >
      <section>
        <h2>{en ? "Define a passing answer" : "先定义什么叫答对"}</h2>
        <p>
          {en
            ? "Require exact fields and types. Check current facts against historical distractors. Missing information must remain null, not a guessed value. Test extra fields and Markdown fences explicitly."
            : "明确字段与类型；区分当前事实和历史干扰项；缺失值必须为 null，不能猜。多余字段、Markdown 围栏是否允许，也应提前约定。"}
        </p>
        <pre className="overflow-auto rounded bg-card p-4 text-xs">
          {JSON.stringify(c.expected, null, 2)}
        </pre>
      </section>
      <section>
        <h2>{en ? "Compare the same workload" : "比较同一批材料"}</h2>
        <p>
          {en
            ? "Use identical prompts, endpoint settings and output limits. Keep failed attempts in the denominator. Record the rate of fully correct records, first-content latency, completion time and billed tokens."
            : "使用相同 Prompt、接入点设置与输出上限。失败尝试保留在分母中，记录整条记录完全正确率、首个正文等待、完整耗时和计费 token。"}
        </p>
        <p>
          {en
            ? "A faster wrong answer may cost more after retries or manual repair. Compare expected cost per accepted record only after measuring both failure rate and real billing usage."
            : "更快的错误答案，可能需要重试或人工修正。只有测到通过率和真实用量后，才能估算每条可接受结果的成本。"}
        </p>
      </section>
      <section>
        <h2>{en ? "Try a reproducible case" : "先跑一个可复现案例"}</h2>
        <p>{c.prompt}</p>
        <RerunButton
          locale={locale}
          seed={{
            mode: "share-prompt",
            prompt: c.prompt,
            task: { caseId: c.id, version: c.version },
            params: BENCHMARK_PARAMS,
          }}
        />
        <p>
          {en
            ? "These synthetic contacts test exact fields and missing values. They do not establish performance on noisy PDFs, handwriting, multilingual records or your production distribution."
            : "这组合成联系人只测试明确字段和缺失值，不能代表噪声 PDF、手写、多语种或你的生产数据分布。"}
        </p>
      </section>
      <Link href={localizedPath("/reports", locale)}>
        {en ? "Published tests and evidence" : "已发布测试与证据"}
      </Link>
    </InfoPage>
  );
}
