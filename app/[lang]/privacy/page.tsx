import Link from "next/link";
import { InfoPage, infoMetadata } from "@/components/InfoPage";
import { DEFAULT_LOCALE, localizedPath, normalizeLocale } from "@/lib/i18n";

type Props = { params: Promise<{ lang: string }> };
const copy = (en: boolean) => en
  ? { title: "Privacy policy", intro: "This policy explains how TOKRACE processes information when you browse, run model comparisons, sign in, sync data, or publish a share." }
  : { title: "隐私政策", intro: "本政策说明 TOKRACE 在浏览、模型测速、登录、云同步和公开分享过程中如何处理信息，适用于 www.tokrace.com 提供的服务。" };

export async function generateMetadata({ params }: Props) {
  const locale = normalizeLocale((await params).lang) ?? DEFAULT_LOCALE;
  const { title, intro } = copy(locale === "en");
  return infoMetadata(locale, "/privacy", title, intro);
}

export default async function PrivacyPage({ params }: Props) {
  const locale = normalizeLocale((await params).lang) ?? DEFAULT_LOCALE;
  const en = locale === "en";
  return (
    <InfoPage locale={locale} pathname="/privacy" {...copy(en)}>
      <section><h2>{en ? "1. Local data and model requests" : "1. 本地数据与模型请求"}</h2>
        <p>{en ? "Model configurations, API keys, prompts, run history, and preferences are saved in your browser's localStorage by default. Local storage is not the same as an encrypted vault: someone with access to your browser may access this data. Clearing site data removes local copies." : "模型配置、API Key、Prompt、历史记录和界面偏好默认保存在浏览器 localStorage 中。本地存储不等于加密保险箱，能够访问你浏览器的人可能读取这些数据。清除本站浏览器数据会删除本地副本。"}</p>
        <p>{en ? "When you run a comparison, your prompt, supplied images, parameters, and required credentials are processed by TOKRACE's request proxy and sent to the model endpoint you select. The proxy does not intentionally persist request bodies or API keys. The selected provider processes requests under its own policies. Optional public sharing and encrypted cloud backups are described below." : "运行测速时，你的 Prompt、所附图片、参数和必要凭据会经 TOKRACE 请求代理处理，并发送给你选择的模型接入点。代理不主动持久化请求正文或 API Key。模型服务商会按照其自身政策处理请求；主动公开分享和加密云备份另见下文。"}</p>
      </section>
      <section><h2>{en ? "2. Accounts and optional cloud sync" : "2. 账号与可选云同步"}</h2>
        <p>{en ? "Account features use Supabase. Signing in processes your account identifier, email and profile information supplied by the login provider, and stores a login session in your browser. Free quotas and referral rewards use account or device identifiers, usage records, and network information to operate the service and prevent abuse." : "账号功能使用 Supabase。登录时会处理账号标识、邮箱及登录服务提供的资料，并在浏览器保存登录会话。免费额度和邀请奖励会使用账号或设备标识、使用记录及网络信息，以提供服务并防止滥用。"}</p>
        <p>{en ? "Cloud sync happens when you choose to upload. The backup can include API keys, prompts, history, and settings. It is encrypted in your browser with your sync passphrase before being stored in Supabase. The sync passphrase is not uploaded. Keep it safe: we cannot recover an encrypted backup without it." : "云同步由你主动上传触发。备份可能包含 API Key、Prompt、历史记录和设置，上传前会使用你的同步密码在浏览器中加密，Supabase 保存加密后的数据。同步密码不会上传，请自行保管；没有该密码，我们无法恢复加密备份。"}</p>
      </section>
      <section><h2>{en ? "3. Public shares and contributions" : "3. 公开分享与数据贡献"}</h2>
        <p>{en ? "Publishing a share stores the selected prompt, model outputs, title, notes, and measurement data as a public snapshot. API credentials and custom endpoint URLs are excluded from the snapshot fields. Anyone with the link may view or copy the published content. Check it before publishing, especially text that may itself contain private information. You can disable or delete your shares in My Center; copies already made by others may remain." : "创建分享时，选定的 Prompt、模型输出、标题、备注和指标会保存为公开快照。快照字段排除 API 凭据和自定义接入地址。持有链接的人可以查看或复制发布内容；发布前请检查文本本身是否含有隐私信息。你可以在「我的中心」关闭或删除分享，但他人已经保存的副本可能仍会存在。"}</p>
        <p>{en ? "If you opt in to anonymous measurement sharing, we store model and provider identifiers, timing and token metrics, input/output character counts, a random device identifier, and consent records. This contribution excludes prompt text, outputs, images, and API keys. Votes and comments you submit may be shown publicly." : "同意匿名测速上报后，我们会保存模型与供应商标识、时延和 token 指标、输入输出字符数、随机设备标识以及同意记录。这类上报不包含 Prompt 正文、模型输出、图片或 API Key。你提交的投票和评论可能公开展示。"}</p>
      </section>
      <section><h2>{en ? "4. Site analytics and security" : "4. 网站统计与安全"}</h2>
        <p>{en ? "We use Vercel Web Analytics and Speed Insights to understand page traffic and performance. They process page URLs, referrers, browser/device information, approximate location, and performance measurements. These site statistics are separate from voluntary model measurement contributions. Hosting and abuse prevention may also process IP addresses, request metadata, and operational logs." : "我们使用 Vercel Web Analytics 和 Speed Insights 了解页面访问与性能，会处理页面地址、访问来源、浏览器或设备信息、大致地区及性能指标。网站访问统计与自愿贡献模型测速数据是不同功能。托管和反滥用服务还可能处理 IP 地址、请求元数据和运行日志。"}</p>
        <p><a href="https://vercel.com/docs/analytics/privacy-policy">Vercel Web Analytics</a> · <a href="https://vercel.com/docs/speed-insights/privacy-policy">Vercel Speed Insights</a></p>
      </section>
      <section><h2>{en ? "5. Cookies and Google advertising" : "5. Cookies 与 Google 广告"}</h2>
        <p>{en ? "Cookies or local storage support language preferences, login sessions, device identification, and your saved settings. When Google AdSense ads are enabled on a page, third-party vendors including Google may use cookies, web beacons, IP addresses, or other identifiers to deliver, measure, and personalize advertising." : "Cookies 或本地存储用于语言偏好、登录会话、设备识别和已保存设置。当页面启用 Google AdSense 广告时，包括 Google 在内的第三方供应商可能使用 Cookies、网络信标、IP 地址或其他标识符来展示、衡量及个性化广告。"}</p>
        <p>{en ? "Google and its partners may use advertising cookies to serve ads based on previous visits to this site or other websites. Where required, a consent message will let you manage advertising choices before applicable storage or personalization is enabled. Rejecting personalized advertising does not necessarily remove all ads." : "Google 及其合作伙伴可能根据你此前访问本站或其他网站的情况，通过广告 Cookies 展示广告。在适用地区，需要同意的存储或个性化广告会通过同意管理提示征求选择。拒绝个性化广告不一定意味着完全不显示广告。"}</p>
        <p><a href="https://myadcenter.google.com/">{en ? "Manage Google ad personalization" : "管理 Google 广告个性化"}</a> · <a href="https://policies.google.com/technologies/partner-sites">{en ? "How Google uses information" : "Google 如何使用合作网站的信息"}</a> · <a href="https://optout.aboutads.info/">{en ? "Other vendors' advertising choices" : "其他供应商的广告偏好"}</a></p>
      </section>
      <section><h2>{en ? "6. Service providers and retention" : "6. 服务提供方与保留期限"}</h2>
        <p>{en ? "Vercel provides hosting and analytics, Supabase provides account and database services, and model providers process the requests you send to them. Some requests may pass through Cloudflare when the configured transport uses it. These providers may process information outside your country. Advertising partners, when enabled, process information as described above." : "Vercel 提供托管与统计，Supabase 提供账号及数据库服务，模型服务商处理你发送给它们的请求。部分请求在所配置的传输方式下可能经过 Cloudflare。这些服务提供方可能在你所在国家或地区之外处理信息；广告合作方启用后的信息处理见上文。"}</p>
        <p>{en ? "Local data remains until you remove it. Account records, shares, encrypted backups, and service records are retained as needed to provide the corresponding feature, handle requests, prevent abuse, and meet applicable obligations. Removing browser data does not remove cloud records or public shares. Provider backups may expire on a different schedule." : "本地数据保留至你删除。账号记录、分享、加密备份和服务记录会在提供对应功能、处理请求、防范滥用及履行适用义务所需的期间内保留。清除浏览器数据不会同时删除云端记录或公开分享；服务商备份可能按照不同周期到期。"}</p>
      </section>
      <section><h2>{en ? "7. Your choices and contact" : "7. 你的选择与联系渠道"}</h2>
        <p>{en ? "You can clear local site data, sign out, stop cloud uploads, change measurement-sharing consent, and manage your public shares. For access, correction, deletion, or other privacy requests, contact the maintainers through the contact page. We may need to verify ownership before changing account or shared data. Do not send API keys or passwords." : "你可以清除本地数据、退出登录、停止云端上传、调整测速上报同意以及管理公开分享。如需访问、更正、删除或提出其他隐私请求，请通过联系页面与维护者沟通。处理账号或分享数据前，可能需要核实归属。请勿发送 API Key 或密码。"}</p>
        <p>{en ? "The site is intended for developers and AI reviewers and is not directed at children. We update this policy when the service changes and display the revised date above." : "本站面向开发者和 AI 测评用户，不以儿童为目标用户。服务发生变化时，我们会更新本政策，并在页面顶部标注更新日期。"}</p>
        <p><Link href={localizedPath("/contact", locale)}>{en ? "Contact TOKRACE" : "联系 TOKRACE"} →</Link></p>
      </section>
    </InfoPage>
  );
}
