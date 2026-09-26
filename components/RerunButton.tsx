"use client";
import { useEffect } from "react";
import { track } from "@vercel/analytics";
import { ARENA_SEED_STORAGE_KEY, type ArenaSeed } from "@/lib/quickstart";
import { localizedPath, type Locale } from "@/lib/i18n";
export function RerunButton({
  seed,
  locale,
  label,
}: {
  seed: ArenaSeed;
  locale: Locale;
  label?: string;
}) {
  return (
    <button
      className="inline-flex min-h-11 items-center rounded-md bg-ink px-4 py-2 font-bold text-paper"
      onClick={() => {
        sessionStorage.setItem(ARENA_SEED_STORAGE_KEY, JSON.stringify(seed));
        if (seed.reportId)
          track("report_rerun", {
            reportId: seed.reportId,
            version: seed.reportVersion ?? "unknown",
          });
        window.location.assign(localizedPath("/arena", locale));
      }}
    >
      {label ?? (locale === "en" ? "Rerun this test" : "复测这个任务")} →
    </button>
  );
}
export function ReportViewEvent({ id }: { id: string }) {
  useEffect(() => {
    track("report_view", { reportId: id });
  }, [id]);
  return null;
}
