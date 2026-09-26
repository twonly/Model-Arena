import { badgeResponse } from "@/lib/badge";
import { publishedReport } from "@/lib/benchmark-server";
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const r = await publishedReport((await params).id).catch(() => null);
  return r
    ? badgeResponse(
        {
          label: "TOKRACE report",
          message: `${r.testedAt.slice(0, 10)} · ${r.attempts.filter((a) => a.pass).length}/${r.attempts.length} checks passed`,
        },
        { headers: { "Cache-Control": "public, max-age=31536000, immutable" } },
      )
    : badgeResponse(
        { label: "TOKRACE", message: "Report unavailable" },
        { status: 404 },
      );
}
