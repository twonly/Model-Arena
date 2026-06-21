"use client";

import { useEffect, useRef, useState } from "react";
import type { GalleryItem } from "@/lib/share-server";
import type { Locale } from "@/lib/i18n";

function LazyHtml({ html, title }: { html: string; title: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    if (seen) return;
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setSeen(true);
      return;
    }
    const io = new IntersectionObserver(
      (es) => es.some((e) => e.isIntersecting) && (setSeen(true), io.disconnect()),
      { rootMargin: "400px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [seen]);
  return (
    <div ref={ref} className="h-44 w-full bg-[#0b0b0d]">
      {seen && (
        <iframe
          sandbox="allow-scripts"
          srcDoc={html}
          title={title}
          loading="lazy"
          className="pointer-events-none h-full w-full border-0"
        />
      )}
    </div>
  );
}

/** 视觉基准画廊：各模型生成的 SVG / Canvas / 3D 缩览，点开看原分享 */
export function GalleryGrid({ items, locale }: { items: GalleryItem[]; locale: Locale }) {
  const isZh = locale === "zh-CN";
  return (
    <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((it, i) => (
        <a
          key={`${it.shareId}-${i}`}
          href={`/r/${it.shareId}`}
          target="_blank"
          rel="noopener"
          className="group overflow-hidden rounded-lg border border-line bg-card transition hover:border-ink/30"
        >
          {it.kind === "svg" ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={it.svg}
              alt={`${it.model} · ${it.title}`}
              className="h-44 w-full bg-white object-contain"
            />
          ) : (
            <LazyHtml html={it.html ?? ""} title={`${it.model} ${it.title}`} />
          )}
          <div className="border-t border-line px-3 py-2">
            <div className="truncate text-[13px] font-semibold group-hover:text-accent">{it.model}</div>
            <div className="truncate text-[11px] text-faint" title={it.prompt}>
              {it.prompt || it.title || (isZh ? "视觉作品" : "Visual output")}
            </div>
          </div>
        </a>
      ))}
    </div>
  );
}
