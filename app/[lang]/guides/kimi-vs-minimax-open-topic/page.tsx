import Link from "next/link";
import { InfoPage, infoMetadata } from "@/components/InfoPage";
import { ArticleNavigation, type ArticleSection } from "@/components/ArticleNavigation";
import { OpenTopicCompare, type OpenTopicCompareData } from "@/components/OpenTopicCompare";
import { JsonLd } from "@/components/JsonLd";
import { BRAND } from "@/lib/brand";
import { DEFAULT_LOCALE, localizedPath, normalizeLocale } from "@/lib/i18n";
import rawData from "@/public/evaluations/kimi-vs-minimax-open-topic.json";

const pathname = "/guides/kimi-vs-minimax-open-topic";
const data = rawData as OpenTopicCompareData;
type Props = { params: Promise<{ lang: string }> };

export async function generateMetadata({ params }: Props) {
  const locale = normalizeLocale((await params).lang) ?? DEFAULT_LOCALE;
  const en = locale === "en";
  return {
    ...infoMetadata(
      locale,
      pathname,
      en ? data.titleEn : data.titleZh,
      en ? data.summaryEn : data.summaryZh,
    ),
    keywords: en
      ? ["Kimi K3.1 Pro", "MiniMax M3.1 Flash", "open topic knowledge video", "Claude Code compare"]
      : ["Kimi K3.1 Pro", "MiniMax M3.1 Flash", "开放主题知识视频", "Claude Code 横向对比"],
  };
}

export default async function OpenTopicComparePage({ params }: Props) {
  const locale = normalizeLocale((await params).lang) ?? DEFAULT_LOCALE;
  const en = locale === "en";
  const title = en ? data.titleEn : data.titleZh;
  const description = en ? data.summaryEn : data.summaryZh;
  const url = BRAND.url + localizedPath(pathname, locale);
  const navigation: ArticleSection[] = [
    { id: "open-topic-summary", label: en ? "What this is" : "这是什么" },
    { id: "open-topic-method", label: en ? "Conditions" : "条件" },
    ...data.cases.map((item) => ({
      id: `open-topic-${item.id}`,
      label: en ? item.titleEn : item.titleZh,
    })),
  ];
  const images = data.cases.flatMap((c) => c.media.map((m) => BRAND.url + m.posterPath));
  return (
    <InfoPage
      locale={locale}
      pathname={pathname}
      title={title}
      intro={description}
      updatedAt={data.date}
      sidebar={<ArticleNavigation sections={navigation} en={en} />}
    >
      {data.cases.flatMap((item) =>
        item.media.map((media) => (
          <JsonLd
            key={media.path}
            data={{
              "@context": "https://schema.org",
              "@type": "VideoObject",
              name: `${en ? item.titleEn : item.titleZh} · ${media.modelLabel}`,
              description: en ? media.captionEn : media.captionZh,
              thumbnailUrl: BRAND.url + media.posterPath,
              uploadDate: data.date,
              contentUrl: BRAND.url + media.path,
              isPartOf: { "@id": url + "#article" },
            }}
          />
        )),
      )}
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "TechArticle",
          "@id": url + "#article",
          headline: title,
          description,
          datePublished: data.date,
          dateModified: data.date,
          inLanguage: locale,
          mainEntityOfPage: url,
          url,
          author: { "@type": "Organization", name: BRAND.publisher, url: BRAND.url },
          publisher: { "@type": "Organization", name: BRAND.publisher, url: BRAND.url },
          image: images,
        }}
      />
      <p className="mb-6 text-sm">
        <Link href={localizedPath("/guides/kimi-k3-1-pro", locale)}>
          {en ? "Kimi K3.1 Pro review" : "Kimi K3.1 Pro 评测"}
        </Link>
        {" · "}
        <Link href={localizedPath("/guides/minimax-m3-1-flash", locale)}>
          {en ? "MiniMax M3.1 Flash review" : "MiniMax M3.1 Flash 评测"}
        </Link>
        {" · "}
        <Link href={localizedPath("/guides/kimi-k3-1-pro-creative", locale)}>
          {en ? "Earlier Kimi creative suite" : "此前 Kimi 创作套题"}
        </Link>
      </p>
      <OpenTopicCompare data={data} locale={locale} />
    </InfoPage>
  );
}
