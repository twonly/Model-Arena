"use client";

type Media = {
  modelId: string;
  modelLabel: string;
  path: string;
  posterPath: string;
  width: number;
  height: number;
  durationSeconds: number;
  captionZh: string;
  captionEn: string;
};

type Case = {
  id: string;
  titleZh: string;
  titleEn: string;
  noteZh: string;
  noteEn: string;
  media: Media[];
};

export type OpenTopicCompareData = {
  titleZh: string;
  titleEn: string;
  summaryZh: string;
  summaryEn: string;
  methodZh: string;
  methodEn: string;
  audioNoteZh: string;
  audioNoteEn: string;
  date: string;
  models: { id: string; label: string; apiId: string }[];
  cases: Case[];
};

function Player({ media, en }: { media: Media; en: boolean }) {
  return (
    <figure className="min-w-0 overflow-hidden rounded-xl border border-line bg-card">
      <div className="border-b border-line px-3 py-2 text-sm font-bold">{media.modelLabel}</div>
      <video
        controls
        playsInline
        preload="metadata"
        poster={media.posterPath}
        width={media.width}
        height={media.height}
        className="block h-auto w-full bg-black"
        aria-label={en ? media.captionEn : media.captionZh}
      >
        <source src={media.path} type="video/mp4" />
      </video>
      <figcaption className="space-y-1 p-3 text-xs leading-6">
        <p>{en ? media.captionEn : media.captionZh}</p>
        <p className="text-faint">
          {Math.round(media.durationSeconds)}s · <a href={media.path} download>{en ? "Download MP4" : "下载 MP4"}</a>
        </p>
      </figcaption>
    </figure>
  );
}

export function OpenTopicCompare({ data, locale }: { data: OpenTopicCompareData; locale: string }) {
  const en = locale === "en";
  return (
    <div className="space-y-10">
      <section id="open-topic-summary" className="scroll-mt-6 space-y-3">
        <h2>{en ? "What this is" : "这是什么"}</h2>
        <p>{en ? data.summaryEn : data.summaryZh}</p>
        <p className="text-sm text-faint">{en ? data.audioNoteEn : data.audioNoteZh}</p>
      </section>
      <section id="open-topic-method" className="scroll-mt-6 space-y-3">
        <h2>{en ? "Conditions" : "条件"}</h2>
        <p>{en ? data.methodEn : data.methodZh}</p>
        <ul className="text-sm">
          {data.models.map((m) => (
            <li key={m.id}>{m.label} · API ID <code>{m.apiId}</code></li>
          ))}
        </ul>
      </section>
      {data.cases.map((item) => (
        <section key={item.id} id={`open-topic-${item.id}`} className="scroll-mt-6 space-y-3 border-t border-line pt-8">
          <h2>{en ? item.titleEn : item.titleZh}</h2>
          <p className="text-sm text-faint">{en ? item.noteEn : item.noteZh}</p>
          <div className="grid gap-4 lg:grid-cols-2">
            {item.media.map((media) => (
              <Player key={media.modelId} media={media} en={en} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
