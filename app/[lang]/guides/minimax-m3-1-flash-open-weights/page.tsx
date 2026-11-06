import { REVIEW_PRESENTATION_UPDATED_AT } from "@/lib/model-review-presentation";
import Link from "next/link";
import { InfoPage, infoMetadata } from "@/components/InfoPage";
import { JsonLd } from "@/components/JsonLd";
import { BRAND } from "@/lib/brand";
import { DEFAULT_LOCALE, localizedPath, normalizeLocale } from "@/lib/i18n";
import release from "@/public/releases/minimax-m3-1-flash-open-weights/release.json";

const pathname = "/guides/minimax-m3-1-flash-open-weights";
const evidencePath = "/releases/minimax-m3-1-flash-open-weights/release.json";
const apiReviewPath = "/guides/minimax-m3-1-flash";
const previewPath = "/guides/minimax-m3-1-flash-preview";
const spaceBunnyPath = "/guides/minimax-m3-1-flash#space-bunny";
const titles = {
  "zh-CN": "MiniMax M3.1 Flash 权重公开：428B 参数、下载入口与版本区别",
  en: "MiniMax M3.1 Flash open weights: 428B parameters, downloads and version differences",
};
const descriptions = {
  "zh-CN": "MiniMax M3.1 Flash 公开权重资料：428B 总参数、23B 激活参数、MSA 与 DSpark、官方基准成绩和社区许可证。区分公开权重、正式 API、Preview 与 Space Bunny，链接独立的历史 API 评测。",
  en: "MiniMax M3.1 Flash open-weight release: 428B total and 23B active parameters, MSA, DSpark, official benchmarks and community license. Distinguish weights, the release API, Preview and Space Bunny from historical API tests.",
};
type Props = { params: Promise<{ lang: string }> };

export async function generateMetadata({ params }: Props) {
  const locale = normalizeLocale((await params).lang) ?? DEFAULT_LOCALE;
  const metadata = infoMetadata(locale, pathname, titles[locale], descriptions[locale]);
  return {
    ...metadata,
    keywords: ["MiniMax M3.1 Flash", "MiniMax-M3.1-Flash", "open weights", "428B", "23B", "DSpark", "MiniMax Sparse Attention", "Hugging Face", "MiniMax 权重下载"],
    openGraph: { ...metadata.openGraph, type: "article", publishedTime: release.publicationAt, modifiedTime: REVIEW_PRESENTATION_UPDATED_AT},
  };
}

export default async function OpenWeights({ params }: Props) {
  const locale = normalizeLocale((await params).lang) ?? DEFAULT_LOCALE;
  const en = locale === "en";
  const url = BRAND.url + localizedPath(pathname, locale);
  const sourceLabels: Record<string, string> = { readme: "官方英文模型卡", "readme-zh": "官方中文模型卡", license: "社区许可证", commits: "仓库初始提交" };
  const primarySources = release.sources.filter(s => s.id in sourceLabels);
  const weightFileGb = (release.download.totalWeightFileBytes / 1e9).toFixed(1);
  const variants = en ? [
    { name: "Public weights", date: "Checked October 24; initial repository commit October 23", id: release.repoId, scope: "Downloadable model files and DSpark draft head. This page verifies sources and file availability; no local inference was run.", path: "#downloads", label: "Download and serving links" },
    { name: "Released API", date: "Released October 19; tested October 20–21", id: "MiniMax-M3.1-Flash", scope: "46 text/code requests, plus SVG and animation tests on the official API. These are historical hosted-API results.", path: apiReviewPath, label: "Read the API review" },
    { name: "Preview API", date: "Tested October 3, 2026", id: "MiniMax-M3.1-Flash-Preview", scope: "Separate Preview ID and original test batch. Its results do not establish public-weight performance.", path: previewPath, label: "Read the Preview review" },
    { name: "Space Bunny Alpha", date: "Tested September 27, 2026", id: "stealth/space-bunny-alpha", scope: "Anonymous early version, as identified by MiniMax on October 19. The old route returned 404 on October 20.", path: spaceBunnyPath, label: "Read the identity timeline and historical report links" },
  ] : [
    { name: "公开权重", date: "10 月 24 日核验；仓库初始提交为 10 月 23 日", id: release.repoId, scope: "可下载的模型文件与 DSpark draft head。本页核验来源和文件可访问性，未运行本地推理。", path: "#downloads", label: "下载与部署入口" },
    { name: "正式版 API", date: "10 月 19 日发布；10 月 20–21 日实测", id: "MiniMax-M3.1-Flash", scope: "官方 API 的 46 次文本/代码请求，以及 SVG 与动画测试。结果属于当时的托管 API。", path: apiReviewPath, label: "查看 API 实测" },
    { name: "Preview API", date: "2026-10-03 实测", id: "MiniMax-M3.1-Flash-Preview", scope: "独立的 Preview ID 与原始测试批次，成绩不能直接代表公开权重。", path: previewPath, label: "查看 Preview 评测" },
    { name: "Space Bunny Alpha", date: "2026-09-27 实测", id: "stealth/space-bunny-alpha", scope: "匿名早期版本；MiniMax 于 10 月 19 日确认其身份。旧路由在 10 月 20 日返回 404。", path: spaceBunnyPath, label: "查看身份沿革与历史报告入口" },
  ];
  const specs = en ? [
    ["Architecture", "Native multimodal mixture-of-experts (MoE)"],
    ["Inputs → output", "Text, images and video → text"],
    ["Context", "Up to 1,000,000 tokens; usable length depends on hardware and serving configuration"],
    ["Attention", "MiniMax Sparse Attention (MSA) throughout, including the first three layers"],
    ["Training / serving", "Quantization-aware training; DSpark draft head for compatible serving implementations"],
    ["Reasoning settings", "Chat-template reasoning_effort: low, medium, high, xhigh, max"],
  ] : [
    ["架构", "原生多模态混合专家模型（MoE）"],
    ["输入 → 输出", "文本、图片、视频 → 文本"],
    ["上下文", "最高 1,000,000 token；实际可用长度取决于硬件与部署配置"],
    ["注意力", "全模型采用 MiniMax Sparse Attention（MSA），包括前 3 层"],
    ["训练与推理", "量化感知训练；提供 DSpark draft head，需推理框架支持"],
    ["推理档位", "聊天模板 reasoning_effort 支持 low、medium、high、xhigh、max"],
  ];
  return (
    <InfoPage locale={locale} pathname={pathname} title={titles[locale]} intro={descriptions[locale]} updatedAt={release.verifiedOn}>
<JsonLd data={{
        "@context": "https://schema.org", "@type": "TechArticle", "@id": url + "#article",
        headline: titles[locale], description: descriptions[locale], inLanguage: locale,
        datePublished: release.publicationAt, dateModified: release.publicationAt,
        author: { "@type": "Organization", name: BRAND.publisher, url: BRAND.url },
        publisher: { "@type": "Organization", name: BRAND.publisher, url: BRAND.url },
        mainEntityOfPage: url, url, genre: en ? "Open-weight release information" : "公开权重发布资料",
        citation: [...primarySources.map(s => s.url), "https://www.minimax.io/blog/minimax-m31f"],
        isRelatedTo: { "@type": "TechArticle", url: BRAND.url + localizedPath(apiReviewPath, locale), name: en ? "Historical API review" : "历史 API 评测" },
      }} />
<section id="downloads" className="scroll-mt-6">
        <h2>{en ? "Download weights or use a hosted service" : "下载权重，或使用托管服务"}</h2>
        <p><a href={release.links.huggingFace}>Hugging Face</a>{" · "}<a href={release.links.modelScope}>ModelScope</a></p>
        <p>{en
          ? `The Hugging Face repository was public and ungated when checked. Its file listing contains ${release.repository.weightShards} main weight shards and a separate DSpark draft head. We checked repository metadata and a weight-file response; we did not download the full model or validate local serving.`
          : `核验时，Hugging Face 仓库为公开、无需审批访问状态；文件目录包含 ${release.repository.weightShards} 个主权重分片，以及独立的 DSpark draft head。本次核对了仓库元数据与权重文件响应，未下载完整模型或验证本地部署。`}</p>
        <p>{en ? `The listed weight files total approximately ${weightFileGb} GB (decimal file sizes, not a runtime-memory estimate).` : `目录所列权重文件合计约 ${weightFileGb} GB（十进制文件大小，不是运行显存估算）。`}</p>
        <p>{en ? "With the Hugging Face CLI installed, pin the checked revision for a reproducible download:" : "安装 Hugging Face CLI 后，可固定本次核验的 revision 下载："}</p>
        <pre className="overflow-x-auto rounded-lg border border-line bg-card p-4 text-xs leading-6"><code>{`hf download ${release.repoId} \\\n  --revision ${release.revision} \\\n  --local-dir MiniMax-M3.1-Flash`}</code></pre>
        <p>{en ? "The model card links serving recipes for " : "模型卡提供以下推理框架的部署配方："}<a href="https://docs.sglang.io/cookbook/autoregressive/MiniMax/MiniMax-M3.1">SGLang</a>{" · "}<a href="https://recipes.vllm.ai/MiniMaxAI/MiniMax-M3.1-Flash">vLLM</a>{" · "}<a href="https://lightseek.org/tokenspeed/recipes/models#minimax-m3-1">TokenSpeed</a>{en ? ". Check each recipe's hardware, quantization and DSpark support." : "。请按配方核对硬件、量化格式与 DSpark 支持情况。"}</p>
        <p>{en ? "Hosted access remains separate: " : "托管服务入口："}<a href={release.links.api}>MiniMax API</a>{" · "}<a href={release.links.mPlan}>M Plan</a>{" · "}<a href={release.links.mCode}>{en ? "MiniMax Code desktop" : "MiniMax Code 桌面版"}</a>{en ? ". Their availability and billing do not describe local-weight inference costs." : "。这些服务的可用性和计费不代表本地运行权重的成本。"}</p>
      </section>
<details id="review-details" className="scroll-mt-6 rounded-xl border border-line bg-card p-5">
<summary className="cursor-pointer font-bold text-ink">{en ? "Test details, original answers and sources" : "测试详情、原始回答与来源"}</summary>
<div className="mt-5 space-y-7">
<aside className="rounded-xl border border-line bg-card p-5">
        <p className="font-bold text-ink">{en ? "Release information · Checked October 24, 2026" : "权重发布资料 · 2026-10-24 核验"}</p>
        <p>{en
          ? "The API launched on October 19; public weights are now downloadable, as checked on October 24. This page covers that distribution release. TOKRACE has not run these weights locally or established that they are the exact checkpoint behind its October 20 API tests."
          : "API 于 10 月 19 日推出，公开权重现已可下载，本页于 10 月 24 日核验。TOKRACE 尚未运行这份权重，也未确认它与 10 月 20 日 API 实测所用 checkpoint 完全相同。"}</p>
        <p><Link href={localizedPath(apiReviewPath, locale)}>{en ? "For measured answers, SVG outputs and animations, read the separate API review →" : "原始回答、SVG 成图与鹈鹕动画，请看独立的 API 评测 →"}</Link></p>
      </aside>
<div className="grid grid-cols-3 gap-2 sm:gap-4" aria-label={en ? "Official model specifications" : "官方模型规格"}>
        {[
          ["428B", en ? "Total parameters ≈" : "总参数（约）"],
          ["23B", en ? "Active per token ≈" : "每 token 激活（约）"],
          ["1M", en ? "Maximum context" : "最高上下文"],
        ].map(([value, label]) => <div key={value} className="rounded-lg border border-line p-3 sm:p-5"><p className="text-2xl font-black text-ink sm:text-3xl">{value}</p><p className="text-xs sm:text-sm">{label}</p></div>)}
      </div>
<section id="versions" className="scroll-mt-6">
        <h2>{en ? "Four entries, different evidence" : "四种入口，各自对应什么证据"}</h2>
        <div className="space-y-3">
          {variants.map(v => <article key={v.name} className="rounded-lg border border-line p-4">
            <h3 className="font-bold text-ink">{v.name} <span className="font-normal text-faint">· {v.date}</span></h3>
            <p className="break-all font-mono text-xs">{v.id}</p>
            <p>{v.scope}</p>
            <p><Link href={v.path.startsWith("#") ? v.path : localizedPath(v.path, locale)}>{v.label} →</Link></p>
          </article>)}
        </div>
        <p>{en
          ? "MiniMax's identification of Space Bunny establishes product lineage. Dates, routes, reasoning settings and serving implementations differ, so these records do not form a controlled before/after comparison. Weight availability alone adds no new TOKRACE score."
          : "MiniMax 对 Space Bunny 的身份说明建立了产品沿革。各批次的日期、路由、思考设置与推理实现不同，不能据此得出受控的版本升级对比。权重公开本身也不会新增 TOKRACE 实测成绩。"}</p>
      </section>
<section id="specs" className="scroll-mt-6">
        <h2>{en ? "What is in the public model" : "公开模型包含什么"}</h2>
        <dl className="divide-y divide-line">
          {specs.map(([name, value]) => <div key={name} className="grid gap-1 py-3 sm:grid-cols-[9rem_1fr]"><dt className="font-semibold text-ink">{name}</dt><dd className="min-w-0 break-words">{value}</dd></div>)}
        </dl>
        <p>{en
          ? "The model card describes three changes from M3: sparse attention replaces the first three full-attention layers, quantization-aware training reduces the serving footprint, and DSpark replaces the earlier EAGLE-like MTP approach. A 23B active-parameter count describes computation per token; all experts still need to be stored or loaded. It is not a 23B model download or a memory requirement."
          : "模型卡列出相对 M3 的三项变化：前 3 层全注意力改为稀疏注意力；量化感知训练降低部署占用；DSpark 替代此前类似 EAGLE 的 MTP 方案。23B 激活参数描述的是每 token 的计算规模，完整专家权重仍需存储或加载，不能把它理解为 23B 模型的下载量或显存需求。"}{" "}<a href={release.links.huggingFace}>{en ? "Official model card" : "官方模型卡"}</a></p>
      </section>
<section id="benchmarks" className="scroll-mt-6">
        <h2>{en ? "Official benchmarks: reported for the official weights" : "官方基准：模型卡称成绩对应官方权重"}</h2>
        <p>{en ? "The following five results are published by MiniMax. TOKRACE has not independently reproduced them. They remain separate from the historical API task tests." : "下列五项成绩来自 MiniMax 模型卡，TOKRACE 未独立复现，与历史 API 任务实测分别展示。"}</p>
        <div className="overflow-x-auto rounded-lg border border-line" tabIndex={0} aria-label={en ? "Official benchmark scores and evaluation settings" : "官方成绩与评测设置"}>
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead className="bg-card text-ink"><tr><th scope="col" className="p-3">Benchmark</th><th scope="col" className="p-3">{en ? "Official score" : "官方成绩"}</th><th scope="col" className="p-3">{en ? "Model-card evaluation notes" : "模型卡评测口径"}</th></tr></thead>
            <tbody>{release.benchmarks.map(b => <tr key={b.name} className="border-t border-line"><th scope="row" className="p-3 font-medium text-ink">{b.name}</th><td className="p-3 font-bold text-ink">{b.score}{b.unit === "%" ? "%" : ""}</td><td className="p-3">{en ? b.noteEn : b.noteZh}</td></tr>)}</tbody>
          </table>
        </div>
        <p>{en ? "Agent benchmarks depend on the harness, context and tool environment as well as the model. The model card also cautions that third-party quantizations may differ from the official weights." : "Agent 成绩同时受模型、运行框架、上下文和工具环境影响。模型卡还说明，第三方量化版本的结果可能与官方权重不同。"}{" "}<a href={release.links.huggingFace + "#benchmarks"}>{en ? "Read the complete official table and notes" : "查看完整官方表格与脚注"}</a></p>
      </section>
<section id="license" className="scroll-mt-6">
        <h2>{en ? "MiniMax Community License" : "MiniMax Community License 社区许可证"}</h2>
        <p>{en
          ? "The repository uses the MiniMax Community License. Its commercial-use terms require visible “Built with MiniMax M3.1-Flash” attribution. The license text requires prior written authorization for products and services generating more than US$20 million in yearly revenue; otherwise it calls for a one-time notice. It also lists prohibited uses."
          : "仓库采用 MiniMax Community License。许可证的商业使用条款要求显著展示“Built with MiniMax M3.1-Flash”；相关产品和服务年收入超过 2,000 万美元时要求事先书面授权，其他情形要求发送一次通知。原文另列有禁止用途。"}</p>
        <p><a href={release.license.url}>{en ? "Read the license at the checked revision" : "阅读本次核验 revision 的许可证全文"}</a>{" · "}<a href={release.links.huggingFace + "/blob/main/LICENSE"}>{en ? "Current repository license" : "仓库当前许可证"}</a></p>
      </section>
<section id="sources" className="scroll-mt-6">
        <h2>{en ? "Sources and verification record" : "来源与核验记录"}</h2>
        <p>{en ? "Official specifications and scores come from MiniMax. TOKRACE's additions are the source checks and the explanation of how the release differs from earlier API evidence." : "规格和跑分来自 MiniMax；TOKRACE 在此提供来源核验，以及这次权重发布与既有 API 证据之间的区别说明。"}</p>
        <ul>
          {primarySources.map(s => <li key={s.id}><a href={s.url}>{en ? s.label : sourceLabels[s.id]}</a>{" · "}<a href={s.snapshotPath}>{en ? "Checked snapshot" : "核验快照"}</a></li>)}
          <li><a href="https://www.minimax.io/blog/minimax-m31f">{en ? "October 19 API launch and Space Bunny identity announcement" : "10 月 19 日 API 发布与 Space Bunny 身份公告"}</a></li>
        </ul>
        <p><Link href={evidencePath}>{en ? "Download verification manifest, source hashes and revision (JSON)" : "下载核验清单、来源哈希与 revision（JSON）"}</Link></p>
        <p className="break-all text-xs">{en ? "Checked revision: " : "核验 revision："}<a href={`${release.links.huggingFace}/tree/${release.revision}`}>{release.revision}</a></p>
      </section>
</div>
</details>
</InfoPage>
  );
}
