import { badgeResponse, shareBadge, unavailableBadge } from "@/lib/badge";
import { DEFAULT_LOCALE, normalizeLocale } from "@/lib/i18n";
import { fetchShareSnapshot } from "@/lib/share-server";

export const runtime = "nodejs";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const locale =
    normalizeLocale(new URL(req.url).searchParams.get("locale")) ?? DEFAULT_LOCALE;
  const result = await fetchShareSnapshot(id);
  if (result.state !== "ok") return badgeResponse(unavailableBadge(locale));
  return badgeResponse(shareBadge(result.snapshot, locale));
}
