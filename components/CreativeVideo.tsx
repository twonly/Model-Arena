"use client";

import { useId, useRef, useState } from "react";

type Props = {
  path: string;
  narrationPath?: string;
  posterPath?: string;
  width: number;
  height: number;
  caption: string;
  captionsPath?: string;
  captionsLanguage?: string;
  audioNote?: string;
  en: boolean;
};

export function CreativeVideo({ path, narrationPath, posterPath, width, height, caption, captionsPath, captionsLanguage, audioNote, en }: Props) {
  const [audio, setAudio] = useState("music-only");
  const video = useRef<HTMLVideoElement>(null);
  const seekTime = useRef(0);
  const audioId = useId();
  const source = audio === "narration" && narrationPath ? narrationPath : path;
  return <div>
    <video key={source} ref={video} controls playsInline preload="metadata" poster={posterPath} width={width} height={height} aria-label={caption} className="block h-auto w-full bg-black" onLoadedMetadata={event => {
      if (seekTime.current > 0 && Number.isFinite(event.currentTarget.duration)) {
        event.currentTarget.currentTime = Math.min(seekTime.current, Math.max(0, event.currentTarget.duration - 0.01));
      }
    }}>
      <source src={source} type="video/mp4" />
      {captionsPath && <track kind="subtitles" src={captionsPath} srcLang={captionsLanguage ?? "en"} label={captionsLanguage === "zh" || captionsLanguage === "zh-CN" ? "中文" : "English"} />}
      <a href={source}>{en ? "Download the video" : "下载视频"}</a>
    </video>
    <div className="space-y-2 border-t border-line px-3 pt-3 text-xs leading-6">
      {narrationPath && <>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <label htmlFor={audioId}>{en ? "Audio version" : "音频版本"}</label>
          <select id={audioId} value={audio} className="max-w-full rounded border border-line bg-card px-2 py-1 text-ink" onChange={event => {
            seekTime.current = video.current?.currentTime ?? 0;
            video.current?.pause();
            setAudio(event.target.value);
          }}>
            <option value="music-only">{en ? "Music / sound effects (default)" : "配乐／音效（默认）"}</option>
            <option value="narration">{en ? "Legacy narration (optional)" : "历史旁白（可选）"}</option>
          </select>
        </div>
        <p>{audio === "narration"
          ? (en ? "Historical Kokoro track: some speech was accelerated to fit the original timeline. Playback stays paused after switching." : "历史 Kokoro 音轨：部分语句曾加速以适配原时间轴。切换后保持暂停。")
          : (audioNote ?? (en ? "No spoken narration. Code-generated music and sound effects accompany the original picture." : "无口播旁白，使用代码生成的配乐与音效，画面沿用原评测交付。"))}</p>
      </>}
      {!narrationPath && audioNote && <p>{audioNote}</p>}
      <p><a href={source} download>{narrationPath ? (en ? "Download selected MP4" : "下载当前版本 MP4") : (en ? "Download MP4" : "下载 MP4")}</a></p>
    </div>
  </div>;
}
