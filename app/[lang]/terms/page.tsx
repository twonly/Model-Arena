import Link from "next/link";
import { InfoPage, infoMetadata } from "@/components/InfoPage";
import { BRAND } from "@/lib/brand";
import { DEFAULT_LOCALE, localizedPath, normalizeLocale } from "@/lib/i18n";

type Props = { params: Promise<{ lang: string }> };
const copy = (en: boolean) => en
  ? { title: "Terms of use", intro: "These terms describe the use of the TOKRACE hosted model comparison service." }
  : { title: "使用条款", intro: "本条款说明 TOKRACE 在线模型对比服务的使用范围、用户责任与服务边界。" };

export async function generateMetadata({ params }: Props) {
  const locale = normalizeLocale((await params).lang) ?? DEFAULT_LOCALE;
  const { title, intro } = copy(locale === "en");
  return infoMetadata(locale, "/terms", title, intro);
}

export default async function TermsPage({ params }: Props) {
  const locale = normalizeLocale((await params).lang) ?? DEFAULT_LOCALE;
  const en = locale === "en";
  return (
    <InfoPage locale={locale} pathname="/terms" {...copy(en)}>
      <section><h2>{en ? "Use of the service" : "服务使用"}</h2>
        <p>{en ? "TOKRACE provides model speed comparisons, measurement summaries, and optional account and sharing features. Use the service in accordance with applicable law and the policies of the model providers you connect. Protect your account, API keys, and sync passphrase, and use only endpoints and data you are authorized to access." : "TOKRACE 提供模型测速、指标汇总及可选的账号和分享功能。请遵守适用法律及所连接模型服务商的政策，妥善保管账号、API Key 和同步密码，仅使用你有权访问的接入点和数据。"}</p>
      </section>
      <section><h2>{en ? "Free quotas and provider charges" : "免费额度与厂商费用"}</h2>
        <p>{en ? "Shared sample models are subject to the quota and availability shown on the site. Quotas may change as operating capacity changes. Requests using your own API key may incur charges from your model provider; consult that provider's billing rules. The pricing comparison page is reference information, not a purchase offer or a billing guarantee." : "预置样例模型受页面所示额度和可用性限制，额度可能随运营情况调整。使用自带 API Key 发出的请求可能产生模型厂商费用，请查看对应厂商的计费规则。价格对比页仅供参考，不构成购买报价或计费保证。"}</p>
      </section>
      <section><h2>{en ? "Measurements and generated content" : "测试结果与生成内容"}</h2>
        <p>{en ? "Measurements reflect the observed network, endpoint, model, prompt, and time. Results can vary and do not guarantee future performance. Model output may be inaccurate or unsuitable; review it before relying on or publishing it. TOKRACE does not endorse a provider merely by listing it." : "测速结果反映当时的网络、接入点、模型、Prompt 和测试时段，可能存在波动，不保证未来表现。模型输出可能不准确或不适用，请在使用或发布前自行核查。收录某个模型不代表 TOKRACE 为厂商背书。"}</p>
      </section>
      <section><h2>{en ? "Public contributions" : "公开内容"}</h2>
        <p>{en ? "You retain any rights you hold in submitted content. When you publish a share or comment, you authorize TOKRACE to store and display it to provide that feature. Only publish material you have the right to share, and remove secrets and personal information first. Report suspected infringement or harmful content through our contact page." : "你保留对所提交内容依法享有的权利。创建公开分享或发表评论时，你允许 TOKRACE 为提供该功能而存储、展示这些内容。请仅发布有权分享的材料，并事先移除密钥和个人信息。发现侵权或有害内容可通过联系页面反馈。"}</p>
      </section>
      <section><h2>{en ? "Acceptable use" : "合理使用"}</h2>
        <p>{en ? "Do not attack the service, bypass usage limits, misuse others' credentials, manipulate measurements or votes, or publish unlawful, infringing, or harmful material. We may restrict abusive requests or remove content that violates these rules. Do not generate artificial ad views or clicks or ask others to do so." : "请勿攻击服务、绕过额度限制、冒用他人凭据、操纵测速或投票，或发布违法、侵权及有害内容。对滥用请求或违反规则的内容，我们可能限制访问或移除。请勿制造虚假广告展示、点击，或要求他人这样做。"}</p>
      </section>
      <section><h2>{en ? "Availability and updates" : "可用性与更新"}</h2>
        <p>{en ? "The hosted service is provided as available, without a promise of uninterrupted operation or suitability for a particular purpose. Keep independent copies of important data. These terms do not exclude rights or responsibilities that cannot be excluded under applicable law. The source code is governed separately by the license in the repository." : "在线服务按当前可用状态提供，不承诺持续无中断运行或适合某一特定用途。请独立备份重要数据。本条款不排除适用法律规定不可排除的权利与责任。开源代码的使用另依项目仓库中的许可证约定。"}</p>
        <p><Link href={localizedPath("/privacy", locale)}>{en ? "Privacy policy" : "隐私政策"}</Link> · <Link href={localizedPath("/contact", locale)}>{en ? "Contact" : "联系我们"}</Link> · <a href={BRAND.githubUrl}>{en ? "Source code" : "项目源码"}</a></p>
      </section>
    </InfoPage>
  );
}
