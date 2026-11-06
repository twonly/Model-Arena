import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { createHash } from 'node:crypto';
import test from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ts from 'typescript';
import {reviewExcerpt} from '../lib/review-excerpt.ts';

const require = createRequire(import.meta.url);
function loadVideo(react = require('react')) {
  const result = {};
  const code = ts.transpileModule(readFileSync(new URL('../components/CreativeVideo.tsx', import.meta.url), 'utf8'), {
    compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS, esModuleInterop: true },
  }).outputText;
  new Function('require', 'exports', code)(id => id === 'react' ? react : require(id), result);
  return result.CreativeVideo;
}
const CreativeVideo = loadVideo();
function loadAnimated(react = require('react')) {
  const result = {};
  const code = ts.transpileModule(readFileSync(new URL('../components/AnimatedEvaluation.tsx', import.meta.url), 'utf8'), {
    compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS, esModuleInterop: true },
  }).outputText;
  new Function('require', 'exports', code)(id => id === 'react' ? react : id === 'next/image'
    ? ({ src, width, height, alt, className }) => createElement('img', { src, width, height, alt, className })
    : require(id), result);
  return result.AnimatedEvaluation;
}
const AnimatedEvaluation = loadAnimated();
const compiled = ts.transpileModule(readFileSync(new URL('../components/CreativeEvaluation.tsx', import.meta.url), 'utf8'), {
  compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS, esModuleInterop: true },
}).outputText;
const exports = {};
new Function('require', 'exports', compiled)(id => id === 'next/image'
  ? ({ src, width, height, alt, className }) => createElement('img', { src, width, height, alt, className })
  : id === '@/components/CreativeVideo' ? { CreativeVideo } : id === '@/components/AnimatedEvaluation' ? { AnimatedEvaluation } : id === '@/lib/review-excerpt' ? {reviewExcerpt} : require(id), exports);

function fixture() {
  return {
    schemaVersion: 1, model: 'k3.1-pro', date: '2026-10-27', publishedAt: '2026-10-27T00:00:00Z', updatedAt: '2026-10-27T00:00:00Z',
    summaryZh: '实跑作品', summaryEn: 'Original outputs', methodZh: '订阅原生接口', methodEn: 'Native subscription endpoint',
    billingZh: '订阅额度，金额未知', billingEn: 'Subscription quota; monetary cost unknown',
    limitationsZh: ['失败请求用量未知'], limitationsEn: ['Failed-request usage is unknown'], evidencePath: '/evaluations/creative.json',
    totals: { requests: 5, completedResponses: 3, errors: 1, interruptedRequests: 1, promptTokens: 12345, outputTokens: 5678 },
    cases: [{
      id: 'one', titleZh: '案例一', titleEn: 'Case one', category: 'knowledge-video', effort: 'high',
      summaryZh: '原始交付', summaryEn: 'Original delivery',
      source: { url: 'https://example.com/original', titleZh: '案例原作者', titleEn: 'Original creator', originalPrompt: '<original prompt>', changesZh: '新增固定时长', changesEn: 'Added fixed duration' },
      prompt: '<actual input>', metrics: { requests: 5, completedResponses: 3, promptTokens: 12345, outputTokens: 5678, wallMs: 59999 },
      media: [
        { type: 'video', path: '/video.mp4', posterPath: '/poster.jpg', width: 1920, height: 1080, captionZh: '知识视频', captionEn: 'Knowledge video', captionsPath: '/captions.vtt', captionsLanguage: 'en' },
        { type: 'image', path: '/rear-view.png', width: 1920, height: 1080, captionZh: '后方机位', captionEn: 'Rear view' },
      ],
      downloads: [{ path: '/source.zip', labelZh: '完整源码', labelEn: 'Complete source' }],
      assessmentZh: ['仍有遮挡'], assessmentEn: ['Some occlusion remains'],
      checks: [{ labelZh: '尺寸', labelEn: 'Dimensions', status: 'partial', detailZh: '部分可验证', detailEn: 'Partially verified' }],
      attempts: [
        { id: 'attempt-01', effort: 'max', status: 'stopped-after-request-timeout', requests: 2, completedResponses: 0, noteZh: 'max 超时，最终用量未知', noteEn: 'max timed out; final usage unknown' },
        { id: 'attempt-02', effort: 'high', status: 'model_finished', requests: 3, completedResponses: 3, noteZh: '独立 high 恢复', noteEn: 'Separate high recovery', evidencePath: '/attempt-02.json' },
      ],
    }],
  };
}

test('creative videos use native opt-in playback and preserve downloads and full-size views', () => {
  const html = renderToStaticMarkup(createElement(exports.CreativeEvaluation, { data: fixture(), locale: 'en' }));
  assert.match(html, /<video[^>]*controls=""[^>]*playsInline=""[^>]*preload="metadata"[^>]*poster="\/poster.jpg"/);
  assert.doesNotMatch(html, /autoplay|autoPlay/);
  assert.match(html, /<source src="\/video.mp4" type="video\/mp4"/);
  assert.match(html, /<track kind="subtitles" src="\/captions.vtt" srcLang="en"/);
  assert.match(html, /href="\/rear-view.png" target="_blank" rel="noopener noreferrer"/);
  assert.match(html, /href="\/source.zip" download=""/);
});

test('both languages retain failed attempts, unknown usage and escaped original prompts', () => {
  for (const locale of ['zh-CN', 'en']) {
    const html = renderToStaticMarkup(createElement(exports.CreativeEvaluation, { data: fixture(), locale }));
    assert.match(html, /attempt-01 · max/);
    assert.match(html, /attempt-02 · high/);
    assert.match(html, /&lt;original prompt&gt;/);
    assert.match(html, /&lt;actual input&gt;/);
    assert.match(html, /href="https:\/\/example.com\/original"/);
    assert.match(html, /href="\/attempt-02.json"/);
    assert.match(html, /12,345/);
    assert.match(html, locale === 'en' ? /monetary cost unknown/ : /金额未知/);
    assert.match(html, locale === 'en' ? /1m 0s/ : /1 分 0 秒/);
    assert.match(html, locale === 'en' ? /Visual commentary by AI/ : /画面点评由 AI 完成/);
  }
});

test('null observability metrics are not exposed in either language without changing legacy numbers', () => {
  const data = fixture();
  Object.assign(data.totals, { requests: null, completedResponses: null, errors: null, interruptedRequests: null, promptTokens: null, outputTokens: null });
  Object.assign(data.cases[0].metrics, { requests: null, completedResponses: null, promptTokens: null, outputTokens: null });
  Object.assign(data.cases[0].attempts[0], { requests: null, completedResponses: null });
  Object.assign(data, { usageNoteZh: '小计不包含未暴露的指标。', usageNoteEn: 'Subtotals omit metrics that were not exposed.' });
  for (const locale of ['zh-CN', 'en']) {
    const html = renderToStaticMarkup(createElement(exports.CreativeEvaluation, { data, locale }));
    assert.match(html, locale === 'en' ? /Requests \/ complete responses: — \/ —/ : /请求 \/ 完整响应：— \/ —/);
    assert.match(html, locale === 'en' ? /Errors \/ interruptions: — \/ —/ : /错误 \/ 中断：— \/ —/);
    assert.doesNotMatch(html, /12,345|5,678|NaN|undefined/);
    assert.match(html, locale === 'en' ? /Subtotals omit metrics that were not exposed/ : /小计不包含未暴露的指标/);
    assert.doesNotMatch(html, /Kimi Coding Plan/);
  }

  const html = renderToStaticMarkup(createElement(exports.CreativeEvaluation, { data: fixture(), locale: 'en' }));
  assert.match(html, /Requests \/ complete responses: 5 \/ 3/);
  assert.match(html, /Errors \/ interruptions: 1 \/ 1/);
  assert.match(html, /12,345 \/ 5,678/);
  assert.match(html, /Requests \/ complete responses: 2 \/ 0/);
});

test('narration is an explicit choice while the initial source and download remain nonverbal', () => {
  const data = fixture();
  Object.assign(data.cases[0].media[0], { narrationPath: '/legacy-narration.mp4', audioMode: 'music-only' });
  for (const locale of ['zh-CN', 'en']) {
    const html = renderToStaticMarkup(createElement(exports.CreativeEvaluation, { data, locale }));
    assert.equal((html.match(/<video /g) ?? []).length, 1);
    assert.match(html, /<source src="\/video.mp4"/);
    assert.match(html, /href="\/video.mp4" download=""/);
    assert.doesNotMatch(html, /<source src="\/legacy-narration.mp4"/);
    assert.match(html, /<option value="music-only" selected=""/);
    assert.match(html, /<option value="narration"/);
    assert.match(html, locale === 'en' ? /no narration/ : /无旁白/ );
  }
});

test('switching audio pauses playback, retains the playhead and updates the selected download', () => {
  const hooks = [];
  let cursor = 0;
  const Player = loadVideo({
    useId: () => 'audio-test',
    useRef: initial => hooks[cursor++] ?? (hooks[cursor - 1] = { current: initial }),
    useState: initial => {
      const index = cursor++;
      hooks[index] ??= initial;
      return [hooks[index], value => { hooks[index] = value; }];
    },
  });
  const props = { path: '/music.mp4', narrationPath: '/voice.mp4', caption: 'Test', width: 1920, height: 1080, en: true };
  const render = () => { cursor = 0; return Player(props); };
  const elements = tree => {
    const all = [];
    function visit(node) {
      if (Array.isArray(node)) return node.forEach(visit);
      if (!node || typeof node !== 'object') return;
      if (node.type) all.push(node);
      visit(node.props?.children);
    }
    visit(tree);
    return all;
  };
  let nodes = elements(render());
  let paused = 0;
  nodes.find(node => node.type === 'video').props.ref.current = { currentTime: 12.5, pause() { paused++; } };
  nodes.find(node => node.type === 'select').props.onChange({ target: { value: 'narration' } });
  nodes = elements(render());
  assert.equal(paused, 1);
  assert.equal(nodes.find(node => node.type === 'source').props.src, '/voice.mp4');
  assert.equal(nodes.find(node => node.type === 'a' && node.props.download).props.href, '/voice.mp4');
  const video = nodes.find(node => node.type === 'video');
  assert.equal(video.props.autoPlay, undefined);
  const target = { currentTime: 0, duration: 100 };
  video.props.onLoadedMetadata({ currentTarget: target });
  assert.equal(target.currentTime, 12.5);
  assert.ok(nodes.some(node => typeof node.props?.children === 'string' && node.props.children.includes('accelerated')));
  nodes.find(node => node.type === 'select').props.onChange({ target: { value: 'music-only' } });
  nodes = elements(render());
  assert.equal(nodes.find(node => node.type === 'source').props.src, '/music.mp4');
  assert.equal(nodes.find(node => node.type === 'a' && node.props.download).props.href, '/music.mp4');
});

test('animation branch renders a static poster and play button without autoplay', () => {
  const data = fixture();
  data.cases[0].media = [
    { type: 'image', path: '/pelican.svg', posterPath: '/poster.png', animationPath: '/animation.webp', width: 800, height: 600, captionZh: '骑车动画', captionEn: 'Cycling animation' },
  ];
  const html = renderToStaticMarkup(createElement(exports.CreativeEvaluation, { data, locale: 'en' }));
  assert.match(html, /src="\/poster.png"/);
  assert.match(html, /aria-pressed="false"/);
  assert.match(html, /Play 4-second animation/);
  assert.doesNotMatch(html, /\/animation\.webp/);
  assert.doesNotMatch(html, /autoplay|autoPlay/);
  // Legacy plain image branch still renders a linked full-size image.
  const plain = fixture();
  plain.cases[0].media = [{ type: 'image', path: '/rear-view.png', width: 1920, height: 1080, captionZh: '后方机位', captionEn: 'Rear view' }];
  const plainHtml = renderToStaticMarkup(createElement(exports.CreativeEvaluation, { data: plain, locale: 'en' }));
  assert.match(plainHtml, /<a href="\/rear-view.png" target="_blank" rel="noopener noreferrer"/);
  assert.doesNotMatch(plainHtml, /aria-pressed/);
});

test('real AnimatedEvaluation toggles aria-pressed and poster/animation src on play and pause', () => {
  const hooks = [];
  let cursor = 0;
  const Animated = loadAnimated({
    useState: initial => {
      const index = cursor++;
      hooks[index] ??= initial;
      return [hooks[index], value => { hooks[index] = value; }];
    },
    createElement,
  });
  const props = { poster: '/poster.png', animation: '/animation.webp', alt: 'Cycling animation', en: true };
  const render = () => { cursor = 0; return Animated(props); };
  const elements = tree => {
    const all = [];
    function visit(node) {
      if (Array.isArray(node)) return node.forEach(visit);
      if (!node || typeof node !== 'object') return;
      if (node.type) all.push(node);
      visit(node.props?.children);
    }
    visit(tree);
    return all;
  };
  let nodes = elements(render());
  assert.equal(nodes.find(node => node.props?.src)?.props.src, '/poster.png');
  let button = nodes.find(node => node.type === 'button');
  assert.equal(button.props['aria-pressed'], false);
  button.props.onClick();
  nodes = elements(render());
  assert.equal(nodes.find(node => node.props?.src)?.props.src, '/animation.webp');
  button = nodes.find(node => node.type === 'button');
  assert.equal(button.props['aria-pressed'], true);
  button.props.onClick();
  nodes = elements(render());
  assert.equal(nodes.find(node => node.props?.src)?.props.src, '/poster.png');
  assert.equal(nodes.find(node => node.type === 'button').props['aria-pressed'], false);
});

test('additional cases render their own stable anchors without requiring optional checks', () => {
  const data = fixture();
  data.cases.push({ ...data.cases[0], id: 'two', checks: undefined, metrics: { ...data.cases[0].metrics, wallMs: null } });
  const html = renderToStaticMarkup(createElement(exports.CreativeEvaluation, { data, locale: 'en' }));
  assert.match(html, /id="creative-case-one"/);
  assert.match(html, /id="creative-case-two"/);
  assert.match(html, /Not recorded/);
  assert.equal((html.match(/Itemized verification/g) ?? []).length, 1);
  assert.equal((html.match(/<video /g) ?? []).length, 2);
});

test('crouton guide navigation includes the model introduction and every fixture case in both languages', async () => {
  const pageCode = ts.transpileModule(readFileSync(new URL('../app/[lang]/guides/crouton-alpha-creative/page.tsx', import.meta.url), 'utf8'), {
    compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS, esModuleInterop: true, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const pageExports = {};
  const fixtureData = fixture();
  // add a second case so per-case anchors are exercised beyond the first
  fixtureData.cases.push({ ...fixtureData.cases[0], id: 'two', titleZh: '案例二', titleEn: 'Case two' });
  const stubs = {
    '@/components/InfoPage': { InfoPage: function InfoPage() { return null; }, infoMetadata: () => ({}) },
    '@/components/ArticleNavigation': { ArticleNavigation: function ArticleNavigation() { return null; } },
    '@/components/CreativeEvaluation': { CreativeEvaluation: function CreativeEvaluation() { return null; } },
    '@/components/JsonLd': { JsonLd: function JsonLd() { return null; } },
    '@/lib/brand': { BRAND: { url: 'https://example.com', publisher: 'Test' } },
    '@/lib/i18n': { DEFAULT_LOCALE: 'zh-CN', localizedPath: (path, locale) => `/${locale}${path}`, normalizeLocale: lang => lang === 'en' ? 'en' : 'zh-CN' },
    '@/public/evaluations/crouton-alpha-creative.json': fixtureData,
  };
  new Function('require', 'exports', pageCode)(id => stubs[id] ?? require(id), pageExports);
  const Page = pageExports.default;
  for (const [lang, en] of [['en', true], ['zh-CN', false]]) {
    const tree = await Page({ params: Promise.resolve({ lang }) });
    const sections = tree.props.sidebar.props.sections;
    const ids = sections.map(section => section.id);
    assert.equal(ids[0], 'crouton-model-introduction');
    const groupOrder = ['crouton-scope-summary', 'creative-blender', 'creative-knowledge-video', 'creative-svg'];
    const groupIndexes = groupOrder.map(id => ids.indexOf(id));
    assert.ok(groupIndexes.every((position, i) => position > 0 && (i === 0 || position > groupIndexes[i - 1])), 'group relative order preserved');
    assert.equal(ids[ids.length - 1], 'creative-evidence');
    const evidenceIndex = ids.indexOf('creative-evidence');
    for (const item of fixtureData.cases) {
      const expected = `creative-case-${item.id}`;
      assert.ok(ids.includes(expected), `missing ${expected} for ${lang}`);
      assert.ok(ids.indexOf(expected) < evidenceIndex, `${expected} must precede evidence for ${lang}`);
      const section = sections.find(s => s.id === expected);
      assert.equal(section.label, en ? item.titleEn : item.titleZh);
    }
    assert.ok(sections.every(s => s.label && s.label.length > 0));
  }
});

test('published creative assets match their provenance hashes and exclude original restricted voice media', (t) => {
  const root = new URL('../public/', import.meta.url);
  const manifest = JSON.parse(readFileSync(new URL('evaluations/kimi-k3-1-pro-creative/assets.json', root), 'utf8'));
  assert.equal(manifest.originalRestrictedVoiceMediaCopied, false);
  assert.ok(manifest.files.length > 0);
  const hasLocalAssets = manifest.files.some(file => existsSync(new URL(file.path.slice(1), root)));
  if (!hasLocalAssets) t.diagnostic('Checking provenance only. Full-size creative assets are in immutable storage.');
  for (const file of manifest.files) {
    assert.match(file.sha256, /^[a-f0-9]{64}$/);
    assert.ok(file.bytes > 0, file.path);
    if (hasLocalAssets) {
      const bytes = readFileSync(new URL(file.path.slice(1), root));
      assert.equal(bytes.length, file.bytes, file.path);
      assert.equal(createHash('sha256').update(bytes).digest('hex'), file.sha256, file.path);
    }
    if (file.kind === 'unchanged-original') assert.equal(file.sha256, file.originalSha256, file.path);
    assert.doesNotMatch(file.path, /\/(?:\.home|\.tmp|\.env|inputs)\//);
  }
});

test('the audio revision defaults all four knowledge videos to nonverbal media without rewriting evaluation history', () => {
  const data = JSON.parse(readFileSync(new URL('../public/evaluations/kimi-k3-1-pro-creative.json', import.meta.url), 'utf8'));
  const knowledgeVideos = data.cases.filter(item => item.category === 'knowledge-video').flatMap(item => item.media.filter(media => media.type === 'video'));
  assert.equal(knowledgeVideos.length, 4);
  for (const media of knowledgeVideos) {
    assert.equal(media.audioMode, 'music-only', media.path);
    assert.match(media.path, /\/audio-policy-v3\/(?:printer|phishing|circulation|derivative)\/video.mp4$/);
    assert.equal(typeof media.narrationPath, 'string');
    assert.notEqual(media.path, media.narrationPath);
    assert.match(media.provenance?.sha256 ?? '', /^[a-f0-9]{64}$/);
    assert.match(media.provenance?.originalSha256 ?? '', /^[a-f0-9]{64}$/);
    assert.notEqual(media.provenance.sha256, media.provenance.originalSha256);
  }
  // Frozen before the playback-only revision: model metrics and all attempt records stay intact.
  const history = { totals: data.totals, cases: data.cases.map(({ id, effort, metrics, attempts }) => ({ id, effort, metrics, attempts })) };
  assert.equal(createHash('sha256').update(JSON.stringify(history)).digest('hex'), '32b8752dc55753d8a2ef777427938081a8506dc96923523064671ec2292dda1e');
});
