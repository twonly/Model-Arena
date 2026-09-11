import { InfoPage, infoMetadata } from "@/components/InfoPage";
import { BRAND } from "@/lib/brand";
import { DEFAULT_LOCALE, normalizeLocale } from "@/lib/i18n";

type Props = { params: Promise<{ lang: string }> };
const copy = (en: boolean) => en
  ? { title: "Contact TOKRACE", intro: "Report a problem, suggest a correction, or contact the project maintainers about the site." }
  : { title: "联系我们", intro: "欢迎反馈使用问题、提出数据更正，或联系项目维护者讨论网站相关事项。" };

export async function generateMetadata({ params }: Props) {
  const locale = normalizeLocale((await params).lang) ?? DEFAULT_LOCALE;
  const { title, intro } = copy(locale === "en");
  return infoMetadata(locale, "/contact", title, intro);
}

export default async function ContactPage({ params }: Props) {
  const locale = normalizeLocale((await params).lang) ?? DEFAULT_LOCALE;
  const en = locale === "en";
  return (
    <InfoPage locale={locale} pathname="/contact" {...copy(en)}>
      <section><h2>{en ? "Product support and corrections" : "产品反馈与数据更正"}</h2>
        <p>{en ? "Use the project's GitHub Issues to report bugs, request features, or flag outdated model information. Include the page URL, model name, approximate time, and steps to reproduce where relevant." : "可通过项目 GitHub Issues 提交故障、功能建议或过时的模型信息。请尽量附上页面地址、模型名称、大致发生时间及复现步骤。"}</p>
        <p><a href={`${BRAND.githubUrl}/issues`}>{en ? "Open GitHub Issues" : "前往 GitHub Issues"} →</a></p>
      </section>
      <section><h2>{en ? "Privacy and content requests" : "隐私与内容处理请求"}</h2>
        <p>{en ? "You can disable or delete your own public shares in My Center. To contact us about other privacy or content concerns, start with a general request through the project feedback channel. Do not post API keys, passwords, identity documents, private prompts, or other personal information in a public issue." : "你可以在「我的中心」关闭或删除自己的公开分享。如需反馈其他隐私或内容问题，可先通过项目反馈入口描述请求类型。请勿在公开 Issue 中提交 API Key、密码、身份证件、私密 Prompt 或其他个人信息。"}</p>
      </section>
      <section><h2>{en ? "Partnerships" : "合作联系"}</h2>
        <p>{en ? "For sponsorships or integrations, describe your product and proposed collaboration through the same project channel. Commercial relationships must be disclosed and cannot determine leaderboard positions or measured results." : "如需赞助或产品集成合作，可通过同一项目入口说明产品与合作方向。商业合作需要公开披露，且不得影响排行榜位置或实测结果。"}</p>
      </section>
    </InfoPage>
  );
}
