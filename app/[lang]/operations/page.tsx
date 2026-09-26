import { infoMetadata } from "@/components/InfoPage";
import { normalizeLocale, DEFAULT_LOCALE } from "@/lib/i18n";
import { Operations } from "@/components/Operations";
export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const l = normalizeLocale((await params).lang) ?? DEFAULT_LOCALE;
  return {
    ...infoMetadata(
      l,
      "/operations",
      "TOKRACE operations",
      "Benchmark scheduler, evidence, budget and publication status.",
    ),
    robots: { index: false, follow: false },
  };
}
export default async function Page({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  return <Operations en={(await params).lang === "en"} />;
}
