import type {
  BenchmarkReport,
  BenchmarkReportSummary,
} from "./benchmark-report.ts";

export type Editorial = Record<
  "zh-CN" | "en",
  {
    title: string;
    summary: string;
    body: string;
  }
>;
export interface BenchmarkDraft {
  id: string;
  campaign: string;
  revision: number;
  editorial: Editorial | null;
  writer: "codex" | "operator" | null;
  summary: BenchmarkReportSummary;
  snapshot?: BenchmarkReport;
  updated_at: string;
  published_revision: number;
  published_report_id: string | null;
}

export function validateEditorial(value: unknown): Editorial {
  if (!value || typeof value !== "object") throw new Error("invalid_editorial");
  const result = {} as Editorial;
  for (const locale of ["zh-CN", "en"] as const) {
    const entry = (value as Record<string, unknown>)[locale];
    if (!entry || typeof entry !== "object")
      throw new Error("invalid_editorial");
    const fields = {} as Editorial["en"];
    for (const [key, max] of [
      ["title", 160],
      ["summary", 500],
      ["body", 30000],
    ] as const) {
      const text = (entry as Record<string, unknown>)[key];
      if (typeof text !== "string" || !text.trim() || text.length > max)
        throw new Error(`invalid_editorial_${key}`);
      if (
        /\bsk-[A-Za-z0-9_-]{16,}|Bearer\s+[A-Za-z0-9._-]{16,}|-----BEGIN .*PRIVATE KEY-----/.test(
          text,
        )
      )
        throw new Error("sensitive_editorial");
      fields[key] = text.trim();
    }
    result[locale] = fields;
  }
  return result;
}

export function draftId(value: unknown): string {
  if (
    typeof value !== "string" ||
    !/^(weekly-\d{4}-\d{2}-\d{2}|launch-[a-f0-9]{16})-[a-f0-9]{16}$/.test(value)
  )
    throw new Error("invalid_draft");
  return value;
}
