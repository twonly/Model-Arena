/**
 * 从模型输出中提取 SVG 代码并转成可安全展示的 data URL。
 * 用 <img> 渲染：脚本不会执行，外部资源不会加载，天然安全。
 */
const SVG_RE = /<svg[\s>][\s\S]*?<\/svg>/gi;

export function extractSvgs(text: string): string[] {
  if (!text || !/<\/svg>/i.test(text)) return [];
  const matches = text.match(SVG_RE) ?? [];
  return matches.slice(0, 4);
}

/** <img> 里的 SVG 必须带 xmlns 才能渲染，模型偶尔会漏 */
function ensureXmlns(svg: string): string {
  return /xmlns\s*=/.test(svg.slice(0, 300))
    ? svg
    : svg.replace(/<svg/i, '<svg xmlns="http://www.w3.org/2000/svg"');
}

export function svgDataUrl(svg: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(ensureXmlns(svg))}`;
}

const HTML_FENCE_RE = /```(?:html|htm)\s*\n([\s\S]*?)```/i;
const ANY_FENCE_RE = /```\s*\n([\s\S]*?)```/i;
const COMPLETE_HTML_RE =
  /<!doctype html[\s\S]*<\/html>|<html[\s>][\s\S]*<\/html>/i;
const HTML_FRAGMENT_RE =
  /<(canvas|script|style|div|main|section|article|button|input|video|svg)\b/i;

function normalizeHtmlCandidate(text: string): string {
  const trimmed = text.trim();
  const htmlFence = trimmed.match(HTML_FENCE_RE);
  if (htmlFence) return htmlFence[1].trim();
  const genericFence = trimmed.match(ANY_FENCE_RE);
  if (genericFence && HTML_FRAGMENT_RE.test(genericFence[1])) {
    return genericFence[1].trim();
  }
  return trimmed;
}

function isCompleteHtml(text: string): boolean {
  return COMPLETE_HTML_RE.test(text) || /<\/body>/i.test(text);
}

function hasRunnableHtmlFragment(text: string): boolean {
  return HTML_FRAGMENT_RE.test(text) && /<script\b|<canvas\b|@keyframes|requestAnimationFrame|three\.module|THREE\./i.test(text);
}

function wrapHtmlFragment(fragment: string): string {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>
    html, body {
      margin: 0;
      min-height: 100%;
      background: #0b0b0d;
      color: #f6f5f1;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      overflow: hidden;
    }
    canvas, svg, video { max-width: 100%; }
  </style>
</head>
<body>
${fragment}
</body>
</html>`;
}

/**
 * 提取可运行 HTML 预览：
 * - 完整 HTML 文档原样返回；
 * - ```html 代码块或只含 canvas/script/style 的片段会自动包成完整文档；
 * - 用 sandbox iframe 渲染：脚本可运行但与页面完全隔离。
 */
export function extractHtmlDoc(text: string): string | null {
  if (!text) return null;
  const candidate = normalizeHtmlCandidate(text);
  const raw = candidate.match(COMPLETE_HTML_RE)?.[0] ?? null;
  if (raw) return raw;
  if (isCompleteHtml(candidate)) return candidate;
  if (hasRunnableHtmlFragment(candidate)) return wrapHtmlFragment(candidate);
  return null;
}
