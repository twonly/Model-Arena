import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import sharp from 'sharp';

const root = 'public/evaluations/kimi-k3-1-pro/';
const read = path => JSON.parse(readFileSync(path, 'utf8'));
const official = read(root + 'official-examples.json');
const x = read(root + 'official-examples/x-post.json');
const quota = read(root + 'official-examples/quota-observation.json');
const sha = bytes => createHash('sha256').update(bytes).digest('hex');

test('official examples retain source bytes or explicitly identify web derivatives', async (t) => {
  assert.equal(official.items.filter(item => item.type === 'video').length, 10);
  assert.equal(x.items.filter(item => item.type === 'video').length, 1);
  const items = [...official.items, ...x.items];
  const hasLocalVideos = items.some(item => item.type === 'video' && item.path && existsSync('public' + item.path));
  if (!hasLocalVideos) t.diagnostic('Checking video provenance only. Official videos are in immutable storage.');
  assert.equal(new Set(items.map(item => item.id)).size, items.length);
  assert.equal(official.items.filter(item => item.type === 'video' && item.originalBytes === false).length, 5);
  for (const item of items) {
    for (const key of ['titleZh', 'titleEn', 'altZh', 'altEn', 'captionZh', 'captionEn', 'credit', 'sourcePage']) assert.ok(item[key], `${item.id}: ${key}`);
    if (item.path) {
      assert.ok(item.path.startsWith('/evaluations/kimi-k3-1-pro/'));
      assert.ok(!item.path.includes('..'));
      assert.match(item.sha256, /^[a-f0-9]{64}$/);
      assert.ok(item.bytes > 0, item.path);
      if (item.type !== 'video' || hasLocalVideos) {
        const bytes = readFileSync('public' + item.path);
        assert.equal(bytes.length, item.bytes, item.path);
        assert.equal(sha(bytes), item.sha256, item.path);
        if (item.type === 'video') assert.equal(bytes.subarray(4, 8).toString(), 'ftyp');
      }
      if (item.type === 'video') {
        assert.ok(item.durationSeconds > 0 && item.width > 0 && item.height > 0);
        if (item.originalBytes === false) {
          assert.ok(item.optimization);
          assert.match(item.originalSha256, /^[a-f0-9]{64}$/);
        } else if (item.originalSha256) assert.equal(item.sha256, item.originalSha256);
      }
    }
    if (item.posterPath) {
      const bytes = readFileSync('public' + item.posterPath);
      const metadata = await sharp(bytes).metadata();
      assert.ok(metadata.width > 0 && metadata.height > 0, item.posterPath);
      if (item.poster?.sha256) assert.equal(sha(bytes), item.poster.sha256);
    }
  }
});

test('media provenance does not invent website upload dates or expose private data', () => {
  assert.equal(official.sourcePublishedAt, null);
  assert.equal(x.post.sourceVerified, true);
  assert.equal(x.post.author.handle, 'Kimi_Moonshot');
  assert.equal(x.items[0].publishedAt, x.post.publishedAt);
  assert.equal(x.post.publishedAt, '2026-10-23T17:20:01Z');
  const raw = JSON.stringify([official, x, quota]);
  assert.doesNotMatch(raw, /\/Users\/|\/var\/folders\/|\bsk-[A-Za-z0-9_-]{16,}|"(?:apiKey|api_key|authorization|reasoning_content|reasoning_details)"\s*:/i);
  const cologne = official.items.find(item => item.id === 'official-cologne-interior');
  assert.match(cologne.externalAssetAttribution, /Mylius.*CC BY-SA 3\.0/);
});

test('the Pro console snapshot preserves its original bytes and historical window context', () => {
  const bytes = readFileSync('public' + quota.image.path);
  assert.equal(bytes.length, quota.image.bytes);
  assert.equal(sha(bytes), quota.image.sha256);
  assert.equal(quota.historicalSnapshot, true);
  assert.equal(quota.observation.plan, 'Pro');
  assert.equal(quota.observation.monthlyUsagePercent, 7.15);
  assert.equal(quota.observation.rateLimitPercent, 100);
  assert.equal(quota.observation.resetCountdownText, '3h1min');
});
