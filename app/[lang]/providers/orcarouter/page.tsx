import Link from "next/link";
import { InfoPage, infoMetadata } from "@/components/InfoPage";
import { JsonLd } from "@/components/JsonLd";
import { OrcaRouterConnectButton } from "@/components/OrcaRouterConnectButton";
import { BRAND } from "@/lib/brand";
import {
  DEFAULT_LOCALE,
  localeToLanguage,
  localizedPath,
  normalizeLocale,
  type Locale,
} from "@/lib/i18n";
import {
  ORCAROUTER_BASE_URL,
  ORCAROUTER_DEFAULT_MODEL,
  ORCAROUTER_DOCS_URL,
  ORCAROUTER_REFERRAL_URL,
} from "@/lib/orcarouter";

type Props = { params: Promise<{ lang: string }> };

function copy(en: boolean) {
  return en
    ? {
        title: "Connect OrcaRouter to TOKRACE",
        intro:
          "Use one OrcaRouter key to benchmark its OpenAI-compatible models in TOKRACE. Connect with PKCE or paste a key manually, then compare a fixed model or the OrcaRouter Auto route.",
      }
    : {
        title: "在 TOKRACE 接入 OrcaRouter",
        intro:
          "用一个 OrcaRouter Key 在 TOKRACE 测试其 OpenAI 兼容模型。你可以通过 PKCE 一键授权，也可以手动粘贴 Key，再选择固定模型或 OrcaRouter Auto 路由参与竞速。",
      };
}

export async function generateMetadata({ params }: Props) {
  const locale = normalizeLocale((await params).lang) ?? DEFAULT_LOCALE;
  const { title, intro } = copy(locale === "en");
  return infoMetadata(locale, "/providers/orcarouter", title, intro);
}

function structuredData(locale: Locale) {
  const en = locale === "en";
  const url = `${BRAND.url}${localizedPath("/providers/orcarouter", locale)}`;
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        name: copy(en).title,
        description: copy(en).intro,
        url,
        inLanguage: localeToLanguage(locale),
        isAccessibleForFree: true,
        publisher: { "@id": `${BRAND.url}/#org` },
      },
      {
        "@type": "HowTo",
        name: en
          ? "How to connect OrcaRouter to TOKRACE"
          : "如何在 TOKRACE 接入 OrcaRouter",
        description: copy(en).intro,
        totalTime: "PT2M",
        step: [
          {
            "@type": "HowToStep",
            position: 1,
            name: en ? "Authorize or paste a key" : "授权或粘贴 Key",
            text: en
              ? "Connect with PKCE, or choose the OrcaRouter preset and paste an sk-orca key."
              : "使用 PKCE 一键连接，或选择 OrcaRouter 预设并粘贴 sk-orca Key。",
          },
          {
            "@type": "HowToStep",
            position: 2,
            name: en ? "Choose a model ID" : "选择模型 ID",
            text: en
              ? "Use orcarouter/auto for adaptive routing or a namespaced fixed model ID for reproducible tests."
              : "使用 orcarouter/auto 做动态路由，或使用带厂商前缀的固定模型 ID 做可复现测试。",
          },
          {
            "@type": "HowToStep",
            position: 3,
            name: en ? "Run the comparison" : "开始竞速",
            text: en
              ? "Enable the connection in TOKRACE and run the same prompt against the models you want to compare."
              : "在 TOKRACE 勾选这条接入，与其他模型用同一 Prompt 并发竞速。",
          },
        ],
      },
    ],
  };
}

export default async function OrcaRouterProviderPage({ params }: Props) {
  const locale = normalizeLocale((await params).lang) ?? DEFAULT_LOCALE;
  const en = locale === "en";
  const h = (path: string) => localizedPath(path, locale);

  return (
    <>
      <JsonLd data={structuredData(locale)} />
      <InfoPage
        locale={locale}
        pathname="/providers/orcarouter"
        updatedAt={en ? "September 11, 2026" : "2026 年 9 月 11 日"}
        {...copy(en)}
      >
        <section className="rounded-xl border border-line bg-card p-5 sm:p-6">
          <div className="text-[12px] font-bold uppercase tracking-[0.16em] text-accent">
            OrcaRouter × TOKRACE
          </div>
          <h2 className="mt-2 !mb-1">
            {en ? "Connect in one click" : "一键授权接入"}
          </h2>
          <p>
            {en
              ? "TOKRACE generates a PKCE challenge, verifies the returned state, exchanges the single-use code, and saves the resulting key in this browser."
              : "TOKRACE 会生成 PKCE challenge，严格校验回调 state，再交换一次性授权码，并把得到的 Key 保存到当前浏览器。"}
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <OrcaRouterConnectButton
              returnTo={h("/arena")}
              className="rounded-md bg-ink px-4 py-2 text-[13px] font-bold text-paper disabled:opacity-50"
            >
              {en ? "Connect OrcaRouter" : "连接 OrcaRouter"}
            </OrcaRouterConnectButton>
            <Link
              href={h("/arena")}
              className="rounded-md border border-line px-4 py-2 text-[13px] font-semibold no-underline"
            >
              {en ? "Open the arena" : "进入竞速场"}
            </Link>
          </div>
        </section>

        <section>
          <h2>{en ? "Manual setup" : "手动配置"}</h2>
          <ol className="list-decimal space-y-2 pl-5">
            <li>
              {en ? "Open " : "打开"}
              <Link href={h("/arena")}>{en ? "TOKRACE Arena" : "TOKRACE 竞速场"}</Link>
              {en ? ", then choose Models → OrcaRouter." : "，点击「模型配置」→「OrcaRouter」。"}
            </li>
            <li>
              {en ? "Paste your " : "粘贴你的 "}
              <code className="num rounded bg-paper px-1.5 py-0.5">sk-orca-…</code>
              {en ? " key, or use the PKCE button." : " Key，或使用页面内的一键授权按钮。"}
            </li>
            <li>
              {en ? "Keep the preset values below, test the connection, and save." : "保留下方预设值，测试连接后保存。"}
            </li>
          </ol>
          <div className="mt-4 overflow-hidden rounded-lg border border-line text-[12.5px]">
            {[
              ["Protocol", "OpenAI compatible"],
              ["Base URL", ORCAROUTER_BASE_URL],
              ["Default model", ORCAROUTER_DEFAULT_MODEL],
            ].map(([label, value]) => (
              <div key={label} className="grid gap-1 border-b border-line px-3 py-2 last:border-b-0 sm:grid-cols-[140px_1fr]">
                <strong className="text-ink">{label}</strong>
                <code className="num break-all">{value}</code>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2>{en ? "Auto route or fixed model?" : "选 Auto 还是固定模型？"}</h2>
          <p>
            {en
              ? "orcarouter/auto may resolve to a different upstream model for each request. It is useful for measuring the router as a product, but it is not a deterministic single-model benchmark. For reproducible model-to-model comparisons, choose an explicit namespaced ID such as openai/gpt-4o-mini or deepseek/deepseek-chat."
              : "orcarouter/auto 可能为每个请求选择不同的上游模型。它适合测试“路由器整体体验”，但不等同于固定单模型测速。需要可复现的模型横评时，请选择 openai/gpt-4o-mini、deepseek/deepseek-chat 这类带厂商前缀的固定模型 ID。"}
          </p>
          <p>
            <a href={ORCAROUTER_DOCS_URL} target="_blank" rel="noopener noreferrer">
              {en ? "Read the current OrcaRouter API documentation" : "查看 OrcaRouter 当前 API 文档"}
            </a>
          </p>
        </section>

        <section>
          <h2>{en ? "Keys, data, and attribution" : "Key、数据与合作说明"}</h2>
          <ul>
            <li>
              {en
                ? "The key is saved in browser localStorage by default. TOKRACE forwards benchmark requests and your key to OrcaRouter, but does not intentionally persist request bodies or keys in its proxy."
                : "Key 默认保存在浏览器 localStorage。测速时，TOKRACE 会把请求与 Key 转发给 OrcaRouter，但代理不会主动持久化请求正文或 Key。"}
            </li>
            <li>
              {en
                ? "Your prompts and outputs are processed under OrcaRouter and its upstream providers' current data policies. Review those policies before sending sensitive data."
                : "Prompt 与输出会按 OrcaRouter 及其上游服务商的现行数据政策处理，发送敏感数据前请先阅读相关政策。"}
            </li>
            <li>
              {en
                ? "The link below is an affiliate link. TOKRACE may receive 5% of qualifying referred workspace spend. This relationship does not change benchmark measurements or rankings."
                : "下方为推广链接。符合条件的推荐工作区产生消费后，TOKRACE 可能获得其消费额的 5%。该合作不会改变测速结果或榜单排序。"}
            </li>
          </ul>
          <p>
            <a
              href={ORCAROUTER_REFERRAL_URL}
              target="_blank"
              rel="sponsored noopener noreferrer"
            >
              {en ? "Create an OrcaRouter account with the TOKRACE referral link" : "通过 TOKRACE 推广链接注册 OrcaRouter"}
            </a>
          </p>
          <p>
            {en
              ? "OrcaRouter is listed here as a supported integration. This attribution is not an endorsement by OrcaRouter."
              : "这里展示的是受支持的接入方式与归属标注，不代表 OrcaRouter 对 TOKRACE 的产品背书。"}
          </p>
        </section>
      </InfoPage>
    </>
  );
}
