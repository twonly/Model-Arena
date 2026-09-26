import { ImageResponse } from "next/og";
import { publishedReport } from "@/lib/benchmark-server";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "TOKRACE standard task report";
export default async function ReportImage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const r = await publishedReport((await params).id).catch(() => null);
  if (!r) return new Response("Report unavailable", { status: 404 });
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          width: "100%",
          height: "100%",
          padding: "65px",
          background: "#f6f5f1",
          color: "#1d1c18",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: 25,
          }}
        >
          <span style={{ fontWeight: 800 }}>TOKRACE</span>
          <span>STANDARD TASK REPORT</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <span style={{ fontSize: 52, fontWeight: 800 }}>
            Quality. Latency. Cost.
          </span>
          <span style={{ fontSize: 27 }}>
            {r.models
              .map((m) => m.model)
              .join(" / ")
              .slice(0, 135)}
          </span>
        </div>
        <div
          style={{ display: "flex", gap: 30, fontSize: 30, color: "#b4251e" }}
        >
          <span>
            {r.attempts.filter((a) => a.pass).length}/{r.attempts.length} checks
            passed
          </span>
          <span>{r.testedAt.slice(0, 10)} · HKG</span>
        </div>
        <div style={{ display: "flex", fontSize: 20 }}>
          Raw evidence + exact reruns · {r.version}
        </div>
      </div>
    ),
    size,
  );
}
