import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import sharp from 'sharp';

const read = path => readFileSync(new URL('../' + path, import.meta.url));
const manifest = JSON.parse(read('public/evaluations/kimi-k3-1-pro/sources.json'));
const page = read('app/[lang]/guides/kimi-k3-1-pro/page.tsx').toString();
const preview = read('app/[lang]/guides/kimi-k3-1/page.tsx').toString();
const quota = JSON.parse(read('public/evaluations/kimi-k3-1-pro/official-examples/quota-observation.json'));

test('Kimi launch figures preserve all eleven original files and attribution', async () => {
  assert.equal(manifest.images.length, 11);
  assert.equal(manifest.images.filter(image => image.kind === 'aa').length, 6);
  assert.equal(manifest.images.filter(image => image.kind === 'official').length, 5);
  assert.equal(new Set(manifest.images.map(image => image.path)).size, 11);
  for (const image of manifest.images) {
    const bytes = read('public' + image.path);
    assert.equal(createHash('sha256').update(bytes).digest('hex'), image.sha256);
    assert.equal(bytes.byteLength, image.bytes);
    assert.equal(image.originalBytes, true);
    assert.equal(image.visuallyInspected, true);
    assert.equal(image.independentlyReproducedByTokrace, false);
    const metadata = await sharp(bytes).metadata();
    assert.equal(metadata.width, image.width);
    assert.equal(metadata.height, image.height);
    assert.equal(image.sourceUrl, image.kind === 'aa'
      ? 'https://artificialanalysis.ai/articles/kimi-k3-1-pro-launch-benchmarks'
      : 'https://www.kimi.ai/blog/kimi-k3-1-pro');
    assert.equal(image.credit, image.kind === 'aa' ? 'Artificial Analysis' : 'Moonshot AI / Kimi');
    for (const key of ['titleZh', 'titleEn', 'altZh', 'altEn', 'captionZh', 'captionEn']) assert.ok(image[key]);
    assert.equal(new URL(image.originalUrl).protocol, 'https:');
  }
});

test('the launch page publishes evidence boundaries and bilingual search metadata', () => {
  for (const section of ['aa-benchmarks', 'tokrace-tests', 'official-benchmarks', 'official-examples', 'pro-quota-experience', 'stopped-batch', 'evidence', 'faq']) assert.ok(page.includes(`id="${section}"`));
  for (const type of ['TechArticle', 'BreadcrumbList', 'FAQPage', 'Dataset']) assert.ok(page.includes(`"@type": "${type}"`));
  assert.match(page, /datePublished: review\.publishedAt, dateModified: articleModifiedAt/);
  assert.match(page, /url: url \+ "#evidence", dateModified: supplement\.updatedAt/);
  assert.match(page, /infoMetadata\(locale, pathname, title, description\)/);
  assert.match(page, /twitter:.*images:/);
  assert.match(page, /VisualEvaluation data=\{visualData\}/);
  assert.match(page, /review\.endpoint/);
  assert.match(page, /review\.model/);
  assert.match(page, /official public API documents default=max/);
  assert.match(page, /Unsupported; no off result is fabricated/);
  assert.match(page, /Complete TOKRACE evaluation evidence is pending/);
  assert.match(page, /stopped\.attempts\.map/);
  assert.match(page, /checkCase\(task, attempt\.text\)/);
  assert.match(page, /hasVisualMatrix \? <VisualEvaluation/);
  assert.match(page, /native Anthropic Messages/);
  assert.match(page, /Coding subscription quota/);
  assert.match(page, /Exact API request and budget/);
  assert.match(page, /server-side effort semantics unverified/);
  assert.match(page, /do not prove they were ignored/);
  assert.match(page, /attempt\.httpStatus === 429/);
  assert.match(page, /Subscription quota|subscription quota/);
  assert.match(page, /unfinished tasks and HTTP 429 responses are not counted as incorrect model answers/);
  const visualSupplement = read('components/VisualSupplement.tsx').toString();
  assert.match(visualSupplement, /data\.pendingReasonEn \?\?/);
  assert.match(visualSupplement, /data\.pendingReasonZh \?\?/);
  assert.doesNotMatch(page, /Pending usable metered API credentials|实测仍待按量 API 凭据/);
  assert.doesNotMatch(page, /dangerouslySetInnerHTML|<svg\b|Kimi Coding subscription endpoint and request/);
});

test('the Pro screenshot remains a historical five-hour limit observation', async () => {
  const bytes = read('public' + quota.image.path);
  assert.equal(createHash('sha256').update(bytes).digest('hex'), quota.image.sha256);
  const metadata = await sharp(bytes).metadata();
  assert.equal(metadata.width, quota.image.width);
  assert.equal(metadata.height, quota.image.height);
  assert.equal(quota.historicalSnapshot, true);
  assert.equal(quota.observation.plan, 'Pro');
  assert.equal(quota.observation.monthlyUsagePercent, 7.15);
  assert.equal(quota.observation.rateLimitPercent, 100);
  assert.equal(quota.observation.resetCountdownText, '3h1min');
  assert.match(page, /historical view of the evaluation account/);
  assert.match(page, /not monthly-quota exhaustion/);
});

test('official demos use on-demand native media and honest publication dates', () => {
  const x = JSON.parse(read('public/evaluations/kimi-k3-1-pro/official-examples/x-post.json'));
  const official = JSON.parse(read('public/evaluations/kimi-k3-1-pro/official-examples.json'));
  assert.equal(x.sourcePage, 'https://x.com/Kimi_Moonshot/status/2113681863109939271');
  assert.equal(official.sourcePage, 'https://www.kimi.ai/blog/kimi-k3-1-pro');
  assert.equal(official.items.filter(item => item.type === 'video').length, 10);
  assert.equal(x.items.filter(item => item.type === 'video').length, 1);
  assert.equal(official.items.filter(item => !item.isExistingBenchmark).length, 20);
  assert.equal(official.items.filter(item => item.externalAssetAttribution).length, 8);
  assert.equal(official.items.filter(item => item.type === 'video' && item.originalBytes === false).length, 5);
  for (const item of [...official.items, ...x.items]) {
    if (item.path && item.type !== 'video') assert.ok(read('public' + item.path).length);
    if (item.type === 'video') {
      assert.ok(item.posterPath);
      assert.ok(read('public' + item.posterPath).length);
      assert.ok(item.width > 0 && item.height > 0 && item.durationSeconds > 0);
    }
  }
  assert.match(page, /controls playsInline preload="none"/);
  assert.match(page, /item\.publishedAt/);
  assert.match(page, /uploadDate: item\.publishedAt/);
  assert.doesNotMatch(page, /uploadDate:.*capturedAt|<iframe\b|autoPlay\b/);
  assert.match(page, /Official demonstrations · not reproduced by TOKRACE/);
  assert.match(page, /Download media file/);
  assert.match(page, /Original asset credits: /);
  assert.match(page, /item\.externalAssetAttribution/);
  assert.match(page, /item\.type === "video" && item\.originalBytes === false/);
  assert.match(page, /Web-optimized version; the original video is linked under Original media URL/);
});

test('the earlier teaser keeps its publication date and points to the launch analysis', () => {
  assert.match(preview, /const publishedAt = "2026-10-23T15:06:00\+08:00"/);
  assert.match(preview, /datePublished: publishedAt/);
  assert.match(preview, /dateModified: modifiedAt/);
  assert.match(preview, /2026-10-24/);
  assert.match(preview, /historical|prelaunch coverage/);
  assert.match(preview, /localizedPath\("\/guides\/kimi-k3-1-pro", locale\)/);
});
