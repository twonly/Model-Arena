import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import test from 'node:test';

const read = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');
const root = 'public/evaluations/longcat-2-5/';
const sources = JSON.parse(read(root + 'sources.json'));
const page = read('app/[lang]/guides/longcat-2-5/page.tsx');
const officialHosts = new Set(['longcat.ai', 'longcat.chat', 'tech.meituan.com', 'github.com', 'raw.githubusercontent.com', 'huggingface.co']);

test('LongCat source URLs retain official document and image provenance', () => {
  for (const item of sources.sources) {
    const url = new URL(item.url);
    assert.equal(url.protocol, 'https:');
    assert.ok(officialHosts.has(url.hostname), item.url);
    assert.equal(item.httpStatus, 200, item.id);
    assert.match(item.sha256, /^[a-f0-9]{64}$/);
    assert.ok(item.bytes > 0);
    assert.ok(item.localPath.startsWith('output/longcat-2-5-20261026/sources/'));
    assert.equal(item.path, undefined, 'private HTML is not a public asset');
  }
  for (const image of sources.images) {
    assert.equal(image.sourcePage, image.sourceUrl);
    assert.ok(officialHosts.has(new URL(image.sourceUrl).hostname));
    if (image.kind === 'official-page-capture') {
      assert.equal(image.originalUrl, image.sourceUrl, 'captures point to a page, not a fabricated image URL');
      assert.equal(image.imageUrl, null);
      assert.ok(image.captureMethod.includes('screenshot'));
      assert.match(image.captionEn, /not a benchmark/i);
    } else {
      assert.equal(image.sourceUrl, 'https://tech.meituan.com/2026/06/30/LongCat2.0.html');
      assert.match(new URL(image.originalUrl).hostname, /^p[01]\.meituan\.net$/);
      assert.equal(image.sourcePublishedAt, '2026-06-30');
    }
  }
});

test('third-party source HTML and private brief materials stay outside public publication', () => {
  const files = readdirSync(root + 'sources');
  assert.ok(files.every(file => /\.(?:png|json)$/.test(file)), 'source directory serves only raster captures and metadata');
  const publicEvidence = readdirSync('public/evaluations').filter(file => /^longcat-2-5-20261026.*\.json$/.test(file));
  const text = [page, read(root + 'sources.json'), read(root + 'sources/pages.json'), ...publicEvidence.map(file => read('public/evaluations/' + file))].join('\n');
  assert.doesNotMatch(text, /\/Users\/|\/var\/folders\/|\bsk-[A-Za-z0-9_-]{16,}|\bak_[A-Za-z0-9_-]{16,}|Bearer\s+[A-Za-z0-9._-]{16,}/);
  assert.doesNotMatch(text, /\b[A-Z0-9]{4}(?:-[A-Z0-9]{4}){3}\b/, 'redemption codes from the private brief are not public');
  assert.doesNotMatch(text, /xsec_token=|xhsshare=|brief-20261023-longcat\.docx/);
  assert.doesNotMatch(text, /"(?:apiKey|api_key|authorization|reasoning_content|reasoning_details)"\s*:/i);
});

test('the article labels documentation captures separately from historical benchmark originals', () => {
  assert.match(page, /image\.kind === "official-page-capture"/);
  assert.match(page, /image\.kind\.startsWith\("historical-"\)/);
  assert.match(page, /These are documentation screenshots, not benchmark charts/);
  assert.match(page, /not new 2\.5 scores/);
  assert.match(sources.benchmarkStatus, /No model-specific 2\.5 benchmark original was located/);
  assert.match(sources.versionStatus, /LongCat-2\.5-Preview/);
});

test('documented effort controls keep Chat Completions and Responses scopes separate', () => {
  const { chatCompletions, responses } = sources.apiDocumentation;
  assert.equal(chatCompletions.namedEffortEnumDocumented, false);
  assert.deepEqual(chatCompletions.thinkingSwitch, ['enabled', 'disabled']);
  assert.ok(responses.reasoningEffortEnum.includes('low'));
  assert.ok(responses.reasoningEffortEnum.includes('xhigh'));
  assert.ok(!responses.reasoningEffortEnum.includes('max'));
  assert.equal(responses.effortSemanticsIndependentlyVerified, false);
  assert.deepEqual(responses.imageContentPartExample, { type: 'input_image', image_url: 'https://example.com/cat.jpg' });
  assert.equal(responses.publicImageUrlRequired, true);
  assert.match(page, /Responses API reference/);
  assert.match(page, /none \/ minimal \/ low \/ medium \/ high \/ xhigh/);
});
