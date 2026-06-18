import { badgeResponse, modelBadge, unavailableBadge } from "@/lib/badge";
import { DEFAULT_LOCALE, normalizeLocale } from "@/lib/i18n";
import { loadModelStatsForSlug } from "@/lib/seo-models";

export const runtime = "nodejs";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const locale =
    normalizeLocale(new URL(req.url).searchParams.get("locale")) ?? DEFAULT_LOCALE;
  const hit = await loadModelStatsForSlug(slug);
  if (!hit) return badgeResponse(unavailableBadge(locale));
  return badgeResponse(modelBadge(hit[0], locale));
}
