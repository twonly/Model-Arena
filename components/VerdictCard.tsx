import type { Verdict } from "@/lib/verdict";
import type { Locale } from "@/lib/i18n";

function Cell({
  icon,
  label,
  name,
  value,
  highlight,
}: {
  icon: string;
  label: string;
  name: string;
  value?: string;
  highlight?: boolean;
}) {
  return (
    <div
      className="flex flex-1 flex-col gap-0.5 px-3.5 py-2.5"
      style={
        highlight
          ? { background: "var(--accent)", color: "var(--paper)" }
          : undefined
      }
    >
      <div className={`text-[11px] ${highlight ? "opacity-90" : "text-faint"}`}>
        {icon} {label}
      </div>
      <div className="truncate text-[15px] font-bold leading-tight">{name}</div>
      {value && (
        <div
          className={`num text-[11.5px] ${highlight ? "opacity-90" : "text-faint"}`}
        >
          {value}
        </div>
      )}
    </div>
  );
}

/** 一轮对比的结算卡：最快 / 最省 / 答对 / 综合推荐。截图友好。 */
export function VerdictCard({
  verdict,
  locale,
}: {
  verdict: Verdict;
  locale: Locale;
}) {
  const isZh = locale === "zh-CN";
  const t = (zh: string, en: string) => (isZh ? zh : en);
  const { fastest, cheapest, correct, graded } = verdict;
  if (!fastest && !cheapest && !graded) return null;

  return (
    <div className="overflow-hidden rounded-xl border border-line bg-card shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
      <div className="flex items-center justify-between border-b border-line bg-paper/60 px-3.5 py-1.5">
        <span className="text-[12px] font-semibold">
          🏁 {t("本轮结算", "Verdict")}
        </span>
        {graded && (
          <span className="text-[11px] text-faint">
            {correct.length > 0
              ? t(
                  `✅ 答对 ${correct.length} 个：`,
                  `✅ ${correct.length} correct: `,
                ) + correct.join("、")
              : t("⚠ 已校验结果均未通过", "⚠ no evaluated result passed")}
          </span>
        )}
      </div>
      <div className="flex flex-wrap divide-x divide-line">
        {fastest && (
          <Cell
            icon="🏆"
            label={t("最快", "Fastest")}
            name={fastest.name}
            value={fastest.value}
          />
        )}
        {cheapest && (
          <Cell
            icon="💰"
            label={t("最省", "Cheapest")}
            name={cheapest.name}
            value={cheapest.value}
          />
        )}
        <Cell
          icon="✓"
          label={t("任务效果", "Task quality")}
          name={
            graded
              ? correct.join("、") || t("暂无通过", "No passes")
              : t("尚未评估", "Not evaluated")
          }
        />
      </div>
    </div>
  );
}
