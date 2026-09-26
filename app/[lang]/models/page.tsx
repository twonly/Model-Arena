import Link from "next/link";
import { publishedReports } from "@/lib/benchmark-server";
import { InfoPage, infoMetadata } from "@/components/InfoPage";
import { SHARED_MODELS, sharedModelIsAvailable } from "@/lib/shared-models";
import { normalizeLocale, DEFAULT_LOCALE, localizedPath } from "@/lib/i18n";
export const dynamic = "force-dynamic";
export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const l = normalizeLocale((await params).lang) ?? DEFAULT_LOCALE;
  return infoMetadata(
    l,
    "/models",
    l === "en" ? "Models · TOKRACE" : "模型与接入 · TOKRACE",
    l === "en"
      ? "Model identity, availability, evidence and reruns."
      : "模型身份、可用状态、实测证据与复测入口。",
  );
}
export default async function Models({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const locale = normalizeLocale((await params).lang) ?? DEFAULT_LOCALE,
    en = locale === "en";
  const reports = await publishedReports(1000).catch(() => []);
  const discovered = [
    ...new Map(
      reports
        .flatMap((r) => r.models)
        .filter((m) => !SHARED_MODELS.some((s) => s.id === m.slug))
        .map((m) => [m.slug, m]),
    ).values(),
  ];
  return (
    <InfoPage
      locale={locale}
      pathname="/models"
      title={en ? "Models & endpoints" : "模型与接入点"}
      intro={
        en
          ? "Different routes remain separate products. Listed availability is configuration status, not a guarantee of a successful API call."
          : "不同供应商路由分别展示。可用状态表示本站接入配置，不等同于实时调用成功保证。"
      }
      updatedAt="2026-09-26"
    >
      {SHARED_MODELS.map((m) => (
        <article key={m.id} className="rounded border border-line p-4">
          <h2>
            <Link href={localizedPath(`/model/${m.id}`, locale)}>{m.name}</Link>
          </h2>
          <p>
            {new URL(m.baseUrl).host} ·{" "}
            {sharedModelIsAvailable(m)
              ? en
                ? "Connected"
                : "已接入"
              : en
                ? "Expired"
                : "已过期"}
          </p>
        </article>
      ))}
      {discovered.map((m) => (
        <article key={m.slug} className="rounded border border-line p-4">
          <h2>
            <Link href={localizedPath(`/model/${m.slug}`, locale)}>
              {m.name}
            </Link>
          </h2>
          <p>
            {m.provider} ·{" "}
            {en
              ? "Published evidence · own endpoint required"
              : "已有实测 · 需自行接入"}
          </p>
        </article>
      ))}
    </InfoPage>
  );
}
