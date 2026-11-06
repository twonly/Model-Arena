"use client";
import { useState } from "react";
import Image from "next/image";

export function AnimatedEvaluation({ poster, animation, alt, en }: { poster: string; animation: string; alt: string; en: boolean }) {
  const [playing, setPlaying] = useState(false);
  return <div className="bg-white">
    <Image src={playing ? animation : poster} width={800} height={600} alt={alt} unoptimized className="aspect-[4/3] h-auto w-full object-contain" />
    <button type="button" aria-pressed={playing} onClick={() => setPlaying(!playing)} className="m-3 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-900">{playing ? (en ? "Pause animation" : "暂停动画") : (en ? "Play 4-second animation" : "播放 4 秒骑车动画")}</button>
  </div>;
}
