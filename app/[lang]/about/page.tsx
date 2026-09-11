import Link from "next/link";
import { InfoPage, infoMetadata } from "@/components/InfoPage";
import { BRAND } from "@/lib/brand";
import { DEFAULT_LOCALE, localizedPath, normalizeLocale } from "@/lib/i18n";

type Props = { params: Promise<{ lang: string }> };
const copy = (en: boolean) => en
  ? { title: "About TOKRACE", intro: "An independent, open-source model speed testing tool for developers, AI reviewers, and teams choosing models." }
  : { title: "关于 TOKRACE", intro: "面向开发者、AI 测评作者和模型选型团队的独立开源大模型测速工具。" };

export async function generateMetadata({ params }: Props) {
  const locale = normalizeLocale((await params).lang) ?? DEFAULT_LOCALE;
  const { title, intro } = copy(locale === "en");
  return infoMetadata(locale, "/about", title, intro);
}

export default async function AboutPage({ params }: Props) {
  const locale = normalizeLocale((await params).lang) ?? DEFAULT_LOCALE;
  const en = locale === "en";
  const h = (path: string) => localizedPath(path, locale);
  return (
    <InfoPage locale={locale} pathname="/about" {...copy(en)}>
      <section><h2>{en ? "What we measure" : "我们做什么"}</h2>
        <p>{en ? "TOKRACE sends the same prompt to multiple models in parallel and records time to first token, reasoning and output throughput, peak speed, and token usage. It helps turn impressions about speed into results that can be checked and repeated." : "TOKRACE（百模竞速）将同一个 Prompt 并发发送给多个模型，记录首 Token 时延、思考与输出速度、峰值速度和 token 用量，让速度体验变成可以复查、分享和重复测试的结果。"}</p>
        <p>{en ? "Speed is one part of model selection. These measurements do not establish that a model is more accurate or better at every task. Use your own tasks and review the outputs alongside latency and cost." : "速度只是模型选型的一部分。测速结果不等于回答更准确，也不代表模型在所有任务上都更好。建议结合真实任务、输出质量、延迟和成本做判断。"}</p>
      </section>
      <section><h2>{en ? "Data and methodology" : "数据与方法"}</h2>
        <p>{en ? "Leaderboards aggregate measurements voluntarily contributed by users. Network conditions, endpoints, load, and sample sizes affect results. Pricing pages link to provider sources; the provider's current price prevails." : "速度榜汇总用户自愿贡献的测速指标，网络、接入点、厂商负载和样本量都会影响结果。价格页标注厂商来源，实际价格以厂商当前说明为准。"}</p>
        <p><Link href={h("/method")}>{en ? "Read the measurement methodology" : "阅读测速方法与局限"}</Link> · <Link href={h("/stats")}>{en ? "Speed leaderboard" : "查看速度榜"}</Link> · <Link href={h("/pricing")}>{en ? "API pricing" : "API 价格"}</Link></p>
      </section>
      <section><h2>{en ? "Independent and open source" : "独立与开源"}</h2>
        <p>{en ? "The site is maintained under the TOKRACE name by the Model-Arena open-source project maintainers. TOKRACE is not an official ranking or an endorsement from any model provider. Provider names and logos identify the services being compared." : "本站由 Model-Arena 开源项目维护者以 TOKRACE 品牌运营。TOKRACE 不是任何模型厂商的官方排行榜，也不代表厂商背书。页面中的厂商名称与标识用于识别被比较的服务。"}</p>
        <p>{en ? "Advertising, sponsorships, or affiliate relationships, when present, are labeled. We do not sell ranking positions or change measurements in exchange for payment." : "广告、赞助或返佣合作如有展示，将明确标识。我们不出售排名位置，也不以合作费用为条件修改实测结果。"}</p>
        <p><a href={BRAND.githubUrl}>{en ? "Inspect the source code" : "查看项目源码"}</a> · <Link href={h("/contact")}>{en ? "Contact the maintainers" : "联系项目维护者"}</Link></p>
      </section>
    </InfoPage>
  );
}
