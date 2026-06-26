"use client";

import { memo, useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  isOpenCodeFence,
  openFenceContent,
  splitMarkdownBlocks,
} from "@/lib/markdown-blocks";

export const Markdown = memo(function Markdown({ text }: { text: string }) {
  return (
    <div className="md">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{text}</ReactMarkdown>
    </div>
  );
});

// 单块渲染：memo 后只要块文本不变就跳过重解析。流式期间已完成的块文本恒定，
// 因此只有正在增长的末块会重渲染——把整篇的 O(n²) 降到「只解析末块」。
const MarkdownBlock = memo(function MarkdownBlock({ text }: { text: string }) {
  return <ReactMarkdown remarkPlugins={[remarkGfm]}>{text}</ReactMarkdown>;
});

/**
 * 流式期间限频取值（默认 100ms）：即便有 memo 拆块兜底，碰上「整段没有空行的超长
 * 段落」这类末块仍可能偏大，限频给重解析频率封个上界。结束后由 ModelCard 切回
 * 完整 <Markdown> 做一次性最终解析，故此处只服务运行中。
 */
function useThrottled(value: string, ms = 100): string {
  const [v, setV] = useState(value);
  const last = useRef(0);
  useEffect(() => {
    const wait = Math.max(0, ms - (Date.now() - last.current));
    const t = setTimeout(() => {
      last.current = Date.now();
      setV(value);
    }, wait);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

/**
 * 流式 Markdown：实时把已生成的正文渲染成 Markdown，而不是等全部输出完才渲染。
 * - 已完成的块走 memo，内容不变即跳过重解析；
 * - 末块若是未闭合代码围栏（如还没吐完的单文件 HTML），退化为纯文本 <pre>，
 *   避免每个 tick 重解析几十 KB 代码；闭合后自然交回 Markdown。
 * 末块带光标。
 */
export function StreamingMarkdown({ text }: { text: string }) {
  const throttled = useThrottled(text);
  const blocks = useMemo(() => splitMarkdownBlocks(throttled), [throttled]);

  if (blocks.length === 0) {
    return <div className="md caret" />;
  }

  const lastIdx = blocks.length - 1;
  return (
    <div className="md">
      {blocks.map((block, i) => {
        const last = i === lastIdx;
        if (last && isOpenCodeFence(block)) {
          const { lang, code } = openFenceContent(block);
          return (
            <pre key={i} className="caret">
              <code className={lang ? `language-${lang}` : undefined}>
                {code}
              </code>
            </pre>
          );
        }
        return (
          <div key={i} className={last ? "caret" : undefined}>
            <MarkdownBlock text={block} />
          </div>
        );
      })}
    </div>
  );
}
