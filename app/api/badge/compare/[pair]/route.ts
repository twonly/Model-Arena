import { badgeResponse, compareBadge, unavailableBadge } from "@/lib/badge";
import { DEFAULT_LOCALE, normalizeLocale } from "@/lib/i18n";
import { loadComparePair } from "@/lib/seo-models";

export const runtime = "nodejs";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ pair: string }> }
) {
  const { pair } = await params;
  const locale =
    normalizeLocale(new URL(req.url).searchParams.get("locale")) ?? DEFAULT_LOCALE;
  const data = await loadComparePair(pair);
  if (!data) return badgeResponse(unavailableBadge(locale));
  return badgeResponse(compareBadge(data.a, data.b, locale));
}
