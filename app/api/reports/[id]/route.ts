import { publishedReport } from "@/lib/benchmark-server";
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const report = await publishedReport((await params).id);
    return report
      ? Response.json(report, {
          headers: { "Cache-Control": "public, max-age=3600, immutable" },
        })
      : Response.json({ error: "not_found" }, { status: 404 });
  } catch {
    return Response.json({ error: "unavailable" }, { status: 503 });
  }
}
