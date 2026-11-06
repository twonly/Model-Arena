# Creative evaluation delivery

The creative review is a separate bilingual page at `/guides/kimi-k3-1-pro-creative`.
Its model evidence lives in `public/evaluations/kimi-k3-1-pro-creative.json`.

The 2026-10-27 snapshot contains 101 assets (236,025,192 bytes) plus its index.
Putting all media in the Railway source upload produced a confirmed HTTP 413 for
the 355,547,484-byte compressed archive. The media is therefore hosted in a
dedicated public object-storage bucket, under an immutable snapshot prefix.

- Bucket: `tokrace-creative-evaluations-20261027`.
- Snapshot: `a5b5eb398e25b0ed/`.
- Index: `public/evaluations/kimi-k3-1-pro-creative/assets.json`.
- No credentials are included in the public origin or rewrite configuration.
- The bucket contains only the explicitly published model artifacts and summaries.

One existing public 24-second Kimi teaser is also copied unchanged to
`legacy/kimi-k3-1-official-teaser.mp4`, with a single exact-path rewrite and
upload exclusion. Its source SHA-256 is
`0e7b184354715efb5304a56b38e49bee0c6f9f860fcf3d8330926ab1d17101e2`.
This keeps the estimated compressed source archive below 100 MB; the old page,
canonical video URL, source manifest and video bytes remain unchanged.

`.railwayignore` excludes the binary asset directory from the deploy archive.
It does not remove local evidence. The main review JSON is outside that directory
and remains in the application deployment. The array rewrite in `next.config.ts`
runs after the filesystem: local public files work during development; deployed
canonical URLs proxy to the storage snapshot. Browser URLs, captions, image links
and video URLs stay on TOKRACE.

Before changing this snapshot, upload every new file and the index first, verify
their bytes and hashes, then update the snapshot destination and deploy. Do not
overwrite unrelated buckets or source evidence. Public objects use `max-age=0` so
the canonical URLs revalidate when a future deployment selects another snapshot.

The local run bundle at `output/kimi-creative-20261027-expanded/` preserves all
original attempts, inputs, source snapshots, independent audits, storage upload
receipts and deployment verification. It is intentionally outside the deploy.
The original system-voice videos remain local. Public knowledge videos use a
separately attributed Kokoro audio track with unchanged picture packets/timing.
The reducer's public project removes one embedded third-party input text block;
the original project remains local, and structural fingerprints are preserved.

Release checks: repository tests, production build, both canonical languages and
navigation entries, image/video sitemap, all indexed asset hashes, all MP4 Range
responses, and real browser playback at desktop and 390px. Storage upload and
successful deployment are distinct states; a deployment is complete only after
canonical verification.
# 2026-10-27 音频默认策略修订

四支知识视频默认播放无口播的原程序配乐／音效版，历史 Kokoro 旁白在播放器显式选择。原始系统音轨仍仅本地留存。原画面 H264 包字节、PTS/DTS 和帧时序逐项一致，原知识错误与评测计量未改；不是模型重跑或重评分。

新增 11 个文件位于 `audio-policy-v3/`，使用不可变存储前缀 `8596eb229007a1a1/`。修订 manifest 同此前缀，原 101 个资产继续使用 `a5b5eb398e25b0ed/`，均保持原字节。旧版数据／manifest 已归档到 `output/kimi-creative-20261027-expanded/publication/audio-policy-20261027/previous-publication/`，旧发布收据不改写。

只运行新目录内的 `upload-revision.py`，经原凭据读取器私有管道传入认证；只上传新 11 个文件和 manifest，不覆盖旧对象。`next.config.ts` 先精确映射新音频目录及 manifest，再回落原资产映射；旧官方 teaser 映射保持原前缀。完整链路复核见 `docs/research/2026-10-27-video-workflow-audit.md`。

# LongCat Preview via native Claude Code, 2026-10-27

The separate bilingual `/guides/longcat-2-5-claude-code` review preserves 15 actual
native Claude Code 2.1.311 tasks using `LongCat-2.5-Preview`. Original artwork,
failed/capped attempts, received API usage and independent checks remain separate.
The main public dataset is `public/evaluations/longcat-2-5-claude-code.json`.

Its 91 unique assets total 144,867,937 bytes; the index is a 92nd object. They use
the existing public bucket and a fresh immutable prefix
`longcat-cc-c71b6a28ffbe0219/`, with no overwrites of Kimi snapshots. Every object
was fetched and hash-verified before adding the exact LongCat rewrite and source
upload exclusion. All five MP4s passed byte-range checks. Private inputs, raw
agent logs and credentials are excluded from public packages.

Evidence lives under `output/longcat-claude-code-20261027/`, including native auth
probes, separate attempts, CPU-render host changes, source ZIP receipts,
independent geometry/media/animation checks and publication receipts. The public
review distinguishes model exits from content acceptance, discloses historical
prompt guidance, and retains incomplete 3D/email deliverables and actual defects.
The printer VTT is a separately identified display derivative of malformed raw
SRT; source artwork, original SRT and movie bytes are not repaired. Final release
acceptance requires the deployment success and canonical HTTP/browser receipts.
