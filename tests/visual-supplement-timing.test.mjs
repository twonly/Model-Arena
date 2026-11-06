import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import test from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ts from 'typescript';
import {reviewExcerpt} from '../lib/review-excerpt.ts';

const require = createRequire(import.meta.url);
const source = readFileSync(new URL('../components/VisualSupplement.tsx', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, {
  compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS },
}).outputText;
const exports = {};
new Function('require', 'exports', compiled)(name => {
  if (name === './AnimatedEvaluation') return { AnimatedEvaluation: () => null };
  if (name === '@/lib/review-excerpt') return {reviewExcerpt};
  return require(name);
}, exports);

test('unknown interrupted timings render a lower bound and preserve the local storage reason', () => {
  const localReason = 'Local evidence save failed (ENOSPC); final time and usage are unknown.';
  const sample = {
    id: 'poster', mode: 'default', status: 'done', prompt: 'Draw a poster',
    startedAt: '2026-10-26T16:00:00Z', totalMs: 3000, sourceEvidence: '/evidence.json',
    history: [{ status: 'truncated', totalMs: 2000, startedAt: '2026-10-26T15:58:00Z' },
      { status: 'interrupted', totalMs: null, startedAt: '2026-10-26T15:59:00Z', interruptionReason: localReason }],
  };
  const data = {
    date: '2026-10-27', sourceUrl: 'https://example.com', evidencePath: '/evidence.json',
    requestCount: 3, pendingAnimation: false, failureCounts: { overload: 0, connection: 0, timeout: 0, interrupted: 1, truncated: 1, invalidSvg: 0 },
    modes: { default: { zh: '开启思考', en: 'Thinking on' } },
    groups: [{ id: 'poster', titleZh: '海报', titleEn: 'Poster', samples: [sample] }],
  };
  const text = en => renderToStaticMarkup(createElement(exports.VisualSupplement, { data, en })).replace(/<[^>]+>/g, '');
  assert.match(text(true), /Recorded request time: ≥ 5\.00s/);
  assert.match(text(false), /已记录请求耗时: ≥ 5\.00s/);
  assert.ok(text(true).includes(localReason));
  sample.history[1].totalMs = 1000;
  assert.match(text(true), /Recorded request time: 6\.00s/);
  sample.totalMs = null;
  assert.match(text(true), /Recorded request time: ≥ 3\.00s/);
  assert.doesNotMatch(text(true), /NaN/);
});

test('one-mode results render a full-width column and custom copy without changing historical defaults', () => {
  const data = JSON.parse(readFileSync(new URL('../public/evaluations/dots3-note-preview-supplement.json', import.meta.url), 'utf8'));
  data.columns = 1;
  const render = en => renderToStaticMarkup(createElement(exports.VisualSupplement, { data, en }));
  for (const en of [false, true]) {
    const html = render(en);
    assert.ok(html.includes(en ? data.introEn : data.introZh));
    assert.match(html, /class="grid gap-5 grid-cols-1"/);
    assert.doesNotMatch(html, /sm:grid-cols-2|lg:grid-cols-3/);
    const captions = html.match(/<figcaption\b[^>]*>[\s\S]*?<\/figcaption>/g);
    assert.equal(captions.length, 4);
    for (const caption of captions) assert.doesNotMatch(caption, /request\(s\)|次请求/);
  }
  delete data.columns;
  delete data.introZh;
  delete data.introEn;
  delete data.showAttemptCount;
  const historical = render(true);
  assert.match(historical, /Four static drawing tasks and a four-second cycling animation/);
  assert.match(historical, /sm:grid-cols-2/);
  assert.match(historical.match(/<figcaption\b[^>]*>[\s\S]*?<\/figcaption>/)[0], /1 request\(s\)/);
  data.columns = 3;
  assert.match(render(true), /lg:grid-cols-3/);
});
