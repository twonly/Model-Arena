/**
 * 把流式 Markdown 拆成「顶层块」（段落 / 标题 / 列表 / 代码围栏…），以空行为界，
 * 但保持 ``` / ~~~ 代码围栏完整不被切开。
 *
 * 为什么要拆块：react-markdown 每次都把整段文本重解析一遍，是 O(n)。流式期间
 * 每个 token tick 都重解析整篇长文 → O(n²)，多卡并发尤其卡。拆块后「已完成的块」
 * 内容不再变化，可被 memo 缓存、跳过重解析；每个 tick 只需重解析正在增长的末块。
 */
export function splitMarkdownBlocks(text: string): string[] {
  const lines = text.split("\n");
  const blocks: string[] = [];
  let cur: string[] = [];
  // 当前是否在代码围栏内：记录开栏标记（"```" 或 "~~~"），未闭合时为 null
  let fence: string | null = null;

  const flush = () => {
    if (cur.some((l) => l.trim() !== "")) blocks.push(cur.join("\n"));
    cur = [];
  };

  for (const line of lines) {
    const marker = /^\s*(```+|~~~+)/.exec(line)?.[1];
    if (fence) {
      cur.push(line);
      // 同类标记即闭合（只看首字符，避免 ``` 与 ~~~ 互相误闭合）
      if (marker && marker[0] === fence[0]) fence = null;
      continue;
    }
    if (marker) {
      flush(); // 代码围栏自成一块：先收掉前面攒着的正文
      cur.push(line);
      fence = marker;
      continue;
    }
    if (line.trim() === "") {
      flush();
      continue;
    }
    cur.push(line);
  }
  flush();
  return blocks;
}

/**
 * 末块是否是「未闭合的代码围栏」。流式期间最常见：单文件 HTML 还没吐完那行 ```，
 * 整段几十 KB 全堆在末块里。这种块应退化为纯文本渲染，否则每个 tick 重解析整段
 * 巨型代码块 → 复刻当初被移除的卡顿。闭合后再交给 Markdown 一次性解析。
 */
export function isOpenCodeFence(block: string): boolean {
  let fence: string | null = null;
  for (const line of block.split("\n")) {
    const marker = /^\s*(```+|~~~+)/.exec(line)?.[1];
    if (!marker) continue;
    if (fence) {
      if (marker[0] === fence[0]) fence = null;
    } else {
      fence = marker;
    }
  }
  return fence !== null;
}

/**
 * 剥掉代码围栏的首行 ```lang，返回 { lang, code }，用于在围栏闭合前用 <pre><code>
 * 直接呈现（与 react-markdown 最终渲染的代码块视觉一致，闭合时不跳变）。
 */
export function openFenceContent(block: string): { lang: string; code: string } {
  const lines = block.split("\n");
  const first = lines[0] ?? "";
  const lang = /^\s*(?:```+|~~~+)\s*([\w-]+)/.exec(first)?.[1] ?? "";
  return { lang, code: lines.slice(1).join("\n") };
}
