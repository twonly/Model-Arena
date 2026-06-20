"use client";

import { useState } from "react";
import type { ModelPrice } from "@/lib/pricing";
import type { Locale } from "@/lib/i18n";

export interface PricedModel {
  model: string;
  provider: string;
  global: ModelPrice | null;
  cn: ModelPrice | null;
}

type Filter = "all" | "global" | "cn";

const sym = (c: ModelPrice["currency"]) => (c === "CNY" ? "¥" : "$");

function fmt(n: number | null | undefined, c: ModelPrice["currency"]): string {
  if (n == null) return "—";
  const digits = n !== 0 && Math.abs(n) < 0.1 ? 4 : n < 1 ? 3 : 2;
  return `${sym(c)}${n.toLocaleString("en-US", { maximumFractionDigits: digits })}`;
}

/** 一个区域（海外/中国）的三格价格 */
function PriceCells({ p }: { p: ModelPrice | null }) {
  if (!p) {
    return (
      <>
        <td className="px-2.5 py-2 text-right text-faint/50">—</td>
        <td className="px-2.5 py-2 text-right text-faint/50">—</td>
        <td className="px-2.5 py-2 text-right text-faint/50">—</td>
      </>
    );
  }
  return (
    <>
      <td className="num px-2.5 py-2 text-right text-ink">{fmt(p.inputMiss, p.currency)}</td>
      <td className="num px-2.5 py-2 text-right text-faint">{fmt(p.inputHit, p.currency)}</td>
      <td className="num px-2.5 py-2 text-right font-semibold text-ink">{fmt(p.output, p.currency)}</td>
    </>
  );
}

export function PricingTable({
  rows,
  locale,
}: {
  rows: PricedModel[];
  locale: Locale;
}) {
  const isZh = locale === "zh-CN";
  const [filter, setFilter] = useState<Filter>("all");

  const showGlobal = filter !== "cn";
  const showCn = filter !== "global";
  const visible = rows.filter((r) =>
    filter === "global" ? r.global : filter === "cn" ? r.cn : r.global || r.cn
  );

  const t = (zh: string, en: string) => (isZh ? zh : en);
  const subHead = (
    <>
      <th className="border-l border-line px-2.5 py-1.5 text-right font-medium">{t("输入", "Input")}</th>
      <th className="px-2.5 py-1.5 text-right font-medium">{t("命中", "Hit")}</th>
      <th className="px-2.5 py-1.5 text-right font-medium">{t("输出", "Output")}</th>
    </>
  );

  return (
    <div className="mt-3">
      <div className="mb-2.5 inline-flex items-center gap-1 rounded-md border border-line p-0.5">
        {(["all", "global", "cn"] as Filter[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded px-3 py-1 text-[12px] ${
              filter === f ? "bg-ink text-paper" : "text-faint hover:text-ink"
            }`}
          >
            {f === "all" ? t("中国 + 海外", "CN + Global") : f === "global" ? t("🌍 海外", "🌍 Global") : t("🇨🇳 中国", "🇨🇳 China")}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto rounded-lg border border-line">
        <table className="w-full border-collapse text-[13px]">
          <thead>
            <tr className="bg-paper/70 text-faint">
              <th rowSpan={2} className="px-3 py-2 text-left align-bottom font-semibold">
                {t("模型", "Model")}
              </th>
              {showGlobal && (
                <th colSpan={3} className="border-l border-line px-2.5 py-1.5 text-center font-semibold">
                  🌍 {t("海外", "Global")} <span className="text-faint/70">USD</span>
                </th>
              )}
              {showCn && (
                <th colSpan={3} className="border-l border-line px-2.5 py-1.5 text-center font-semibold">
                  🇨🇳 {t("中国大陆", "Mainland China")} <span className="text-faint/70">CNY</span>
                </th>
              )}
              <th rowSpan={2} className="border-l border-line px-3 py-2 text-left align-bottom font-semibold">
                {t("来源", "Source")}
              </th>
            </tr>
            <tr className="bg-paper/70 text-[11px] text-faint">
              {showGlobal && subHead}
              {showCn && subHead}
            </tr>
          </thead>
          <tbody>
            {visible.map((r) => {
              const notes = [r.global?.note, r.cn?.note].filter(Boolean);
              const uniqNotes = [...new Set(notes)];
              const unconfirmed =
                (showGlobal && r.global?.needsConfirm) || (showCn && r.cn?.needsConfirm);
              return (
                <tr key={`${r.provider}-${r.model}`} className="border-t border-line">
                  <td className="px-3 py-2">
                    <div className="font-semibold text-ink">
                      {r.model}
                      {unconfirmed && (
                        <span
                          className="ml-1.5 rounded bg-think/15 px-1 py-0.5 align-middle text-[10px] font-medium"
                          style={{ color: "var(--think)" }}
                          title={t("部分价格未经权威来源确认", "Some prices not yet confirmed")}
                        >
                          {t("待核实", "unverified")}
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-faint">{r.provider}</div>
                    {uniqNotes.length > 0 && (
                      <div className="mt-0.5 max-w-[260px] text-[10.5px] leading-snug text-faint/80">
                        {uniqNotes.join("；")}
                      </div>
                    )}
                  </td>
                  {showGlobal && <PriceCells p={r.global} />}
                  {showCn && <PriceCells p={r.cn} />}
                  <td className="border-l border-line px-3 py-2">
                    <div className="flex flex-col gap-0.5">
                      {showGlobal && r.global && (
                        <a
                          href={r.global.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer nofollow"
                          className="text-[11px] text-faint underline decoration-dotted hover:text-ink"
                          title={`${r.global.sourceName} · ${t("核实", "verified")} ${r.global.verified}`}
                        >
                          {t("海外", "Global")} ↗
                        </a>
                      )}
                      {showCn && r.cn && (
                        <a
                          href={r.cn.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer nofollow"
                          className="text-[11px] text-faint underline decoration-dotted hover:text-ink"
                          title={`${r.cn.sourceName} · ${t("核实", "verified")} ${r.cn.verified}`}
                        >
                          {t("中国", "China")} ↗
                        </a>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
