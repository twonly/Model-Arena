import Image from "next/image";
import Link from "next/link";
import { modelReviewPresentations, reviewText } from "@/lib/model-review-presentation";
import { localizedPath, type Locale } from "@/lib/i18n";

export function ModelReviewIntroduction({ slug, locale }: { slug: string; locale: Locale }) {
  const p = modelReviewPresentations[slug], en = locale === "en", longcat = p.brand === "longcat";
  return <section id="model-introduction" className="scroll-mt-6">
    <h2>{en ? `What is ${p.name}?` : `${p.name} 是什么？`}</h2>
    <p>{reviewText(p.background, locale)} <a href={p.source}>{en ? "Official source" : "官方来源"}</a></p>
    <figure className="mt-5 flex max-w-sm items-center gap-4 rounded-xl border border-line bg-white p-5">
      <Image src={longcat ? "/articles/longcat-2-5-release/longcat-logo.svg" : `/articles/model-review-brands/${p.brand}.png`} width={longcat ? 378 : 64} height={longcat ? 100 : 64} alt={en ? `${p.brand} official brand mark` : `${p.brand} 官方标识`} unoptimized loading="eager" className={longcat ? "h-auto w-56 max-w-full" : "h-12 w-12 shrink-0 object-contain"} />
      {!longcat && <figcaption className="font-bold text-slate-950">{p.brand === "kimi" ? "Kimi · 月之暗面" : p.brand === "deepseek" ? "DeepSeek" : "MiniMax"}</figcaption>}
    </figure>
    {p.related && <p className="text-xs"><Link href={localizedPath(`/guides/${p.related.slug}`, locale)}>{reviewText(p.related.label, locale)} →</Link></p>}
  </section>;
}

export function ModelReviewOverview({ slug, locale }: { slug: string; locale: Locale }) {
  const p = modelReviewPresentations[slug], en = locale === "en";
  return <section id="review-overview" className="scroll-mt-6">
    <h2>{p.kind === "teaser" ? (en ? "What does the teaser show?" : "预告展示了什么？") : p.kind === "weights" ? (en ? "What is available?" : "这次公开了什么？") : (en ? "What did we test, and how did it perform?" : "我们测了什么，整体表现如何？")}</h2>
    <p>{reviewText(p.scope, locale)}</p><p>{reviewText(p.verdict, locale)}</p>
  </section>;
}
