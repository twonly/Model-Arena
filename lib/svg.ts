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
