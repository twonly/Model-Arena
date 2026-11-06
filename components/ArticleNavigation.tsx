"use client";

import { useEffect, useId, useState } from "react";

export type ArticleSection = { id: string; label: string; nested?: boolean };

/** Keep the article and its evidence server-rendered; hydrate only navigation. */
export function ArticleNavigation({ sections, en }: { sections: ArticleSection[]; en: boolean }) {
  const [activeId, setActiveId] = useState(sections[0]?.id ?? "");
  const selectId = useId();

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      let current = sections[0]?.id ?? "";
      for (const section of sections) {
        const target = document.getElementById(section.id);
        if (target?.getClientRects().length && target.getBoundingClientRect().top <= 100) current = section.id;
      }
      setActiveId(current);
    };
    const schedule = () => { if (!frame) frame = window.requestAnimationFrame(update); };
    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    window.addEventListener("hashchange", schedule);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      window.removeEventListener("hashchange", schedule);
    };
  }, [sections]);

  function jumpTo(id: string) {
    const target = document.getElementById(id);
    if (!target) return;
    if (target instanceof HTMLDetailsElement) target.open = true;
    for (let parent = target.parentElement; parent; parent = parent.parentElement) {
      if (parent instanceof HTMLDetailsElement) parent.open = true;
    }
    window.history.pushState(null, "", `#${id}`);
    target.scrollIntoView({ block: "start" });
    target.setAttribute("tabindex", "-1");
    target.focus({ preventScroll: true });
    setActiveId(id);
  }

  return <nav aria-label={en ? "Article contents" : "文章目录"} className="rounded-xl border border-line bg-card p-4 xl:sticky xl:top-6 xl:max-h-[calc(100dvh-3rem)] xl:overflow-y-auto">
    <label htmlFor={selectId} className="mb-2 block text-xs font-bold text-ink xl:hidden">{en ? "Jump to a section" : "快速定位章节"}</label>
    <select id={selectId} value={activeId} onChange={event => jumpTo(event.target.value)} className="min-h-11 w-full min-w-0 rounded-lg border border-line bg-paper px-3 text-sm text-ink xl:hidden">
      {sections.map(section => <option key={section.id} value={section.id}>{section.nested ? "↳ " : ""}{section.label}</option>)}
    </select>
    <p className="mb-3 hidden text-xs font-bold uppercase tracking-wider text-faint xl:block">{en ? "On this page" : "本页导航"}</p>
    <ol className="hidden space-y-1 xl:block">
      {sections.map(section => <li key={section.id}>
        <a href={`#${section.id}`} aria-current={activeId === section.id ? "location" : undefined} onClick={event => {
          if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
          event.preventDefault();
          jumpTo(section.id);
        }} className={`block rounded-md border-l-2 py-1.5 pr-2 text-[12px] leading-5 no-underline ${section.nested ? "pl-5" : "pl-3"} ${activeId === section.id ? "border-accent bg-paper font-bold text-ink" : "border-transparent text-faint hover:bg-paper hover:text-ink"}`}>{section.label}</a>
      </li>)}
    </ol>
  </nav>;
}
