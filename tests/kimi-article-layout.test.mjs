import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import test from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ts from 'typescript';

const require = createRequire(import.meta.url);
const read = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');
const compiled = ts.transpileModule(read('components/ArticleNavigation.tsx'), {
  compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS },
}).outputText;
const exports = {};
new Function('require', 'exports', compiled)(require, exports);

test('article navigation provides matching native anchors and a labelled mobile menu', () => {
  const groups = JSON.parse(read('public/evaluations/kimi-k3-1-pro-supplement.json')).groups;
  for (const en of [false, true]) {
    const sections = groups.map(group => ({ id: `supplement-${group.id}`, label: en ? group.titleEn : group.titleZh }));
    const html = renderToStaticMarkup(createElement(exports.ArticleNavigation, { sections, en }));
    assert.equal((html.match(/<option /g) ?? []).length, 5);
    assert.equal((html.match(/<a /g) ?? []).length, 5);
    for (const section of sections) {
      assert.ok(html.includes(`href="#${section.id}"`));
      assert.ok(html.includes(`value="${section.id}"`));
      assert.ok(html.includes(section.label));
    }
    assert.match(html, /<label for="([^"]+)"/);
    assert.match(html, /aria-current="location"/);
    assert.match(html, /xl:sticky xl:top-6/);
    assert.match(html, /xl:max-h-\[calc\(100dvh-3rem\)\]/);
  }
});

test('wide sidebar and three-column comparisons are explicitly enabled only by Kimi', () => {
  const page = read('app/[lang]/guides/kimi-k3-1-pro/page.tsx');
  const info = read('components/InfoPage.tsx');
  assert.match(page, /sidebar=\{<ArticleNavigation sections=\{navigation\}/);
  assert.match(page, /supplement\.groups\.map\(group => \(\{ id: `supplement-\$\{group\.id\}`/);
  assert.match(page, /columns: 3/);
  assert.match(info, /sidebar \? "max-w-\[1560px\]" : "max-w-3xl"/);
  assert.match(info, /xl:grid-cols-\[14rem_minmax\(0,1fr\)\]/);
  assert.doesNotMatch(info, /overflow-(?:hidden|auto|scroll)/);
  for (const name of ['VisualEvaluation', 'VisualSupplement']) {
    const source = read(`components/${name}.tsx`);
    assert.match(source, /columns\?: (?:1 \| )?2 \| 3/);
    assert.match(source, /columns === 3 \? "lg:grid-cols-3" : ""/);
    assert.match(source, /grid-cols-1/);
    assert.match(source, /sm:grid-cols-2/);
  }
});

test('recovery fills unique slots while preserving successful historical answers', () => {
  const source = read('app/[lang]/guides/kimi-k3-1-pro/page.tsx');
  const ast = ts.createSourceFile('page.tsx', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const declaration = ast.statements.find(node => ts.isFunctionDeclaration(node) && node.name?.text === 'finalSlots');
  assert.ok(declaration);
  const js = ts.transpileModule(declaration.getText(ast), { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText;
  const finalSlots = new Function(js + ';return finalSlots;')();
  const oldSuccess = { id: 'one', mode: 'low', status: 'done', batch: 'old' };
  const oldQuota = { id: 'two', mode: 'default', status: 'error', httpStatus: 429 };
  const recovered = { id: 'two', mode: 'default', status: 'done', batch: 'recovery' };
  const laterError = { id: 'one', mode: 'low', status: 'error' };
  assert.deepEqual(finalSlots([oldSuccess, oldQuota, recovered, laterError]), [oldSuccess, recovered]);
  assert.match(source, /dateModified: recovery\.updatedAt/);
  assert.match(source, /Date\.parse\(recovery\.updatedAt\)/);
  assert.match(source, /id="recovery-tests"/);
  assert.match(source, /recovery\.attempts, \.\.\.recovery\.coding, \.\.\.recovery\.trials/);
  assert.match(source, /mergeVisualFailures\(supplement\.failureCounts, recovery\.trials/);
});

test('visual failure totals include new animation failures without importing global text/code quota errors', () => {
  const ast = ts.createSourceFile('page.tsx', read('app/[lang]/guides/kimi-k3-1-pro/page.tsx'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const declaration = ast.statements.find(node => ts.isFunctionDeclaration(node) && node.name?.text === 'mergeVisualFailures');
  const js = ts.transpileModule(declaration.getText(ast), { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText;
  const merge = new Function(js + ';return mergeVisualFailures;')();
  const original = { quota: 2, overload: 0, connection: 0, timeout: 0, interrupted: 0, truncated: 3, invalidSvg: 0 };
  const trials = [
    { status: 'error', httpStatus: 429 }, { status: 'error', httpStatus: 503 },
    { status: 'error', error: 'ETIMEDOUT' }, { status: 'error', error: 'ECONNRESET' },
    { status: 'truncated', renderError: 'No complete SVG' }, { status: 'done', renderError: 'Invalid XML' },
    { status: 'interrupted' },
  ];
  assert.deepEqual(merge(original, [], true), { ...original, quota: 0 });
  assert.deepEqual(merge(original, trials, true), { quota: 1, overload: 1, connection: 1, timeout: 1, interrupted: 0, truncated: 4, invalidSvg: 1 });
  assert.equal(merge(original, trials, false).interrupted, 1);
  assert.equal(original.quota, 2);
});

test('Kimi overrides the generic budget while retaining shared animation controls and fallback', () => {
  const page = read('app/[lang]/guides/kimi-k3-1-pro/page.tsx');
  const supplement = read('components/VisualSupplement.tsx');
  for (const key of ['budgetNoteZh', 'budgetNoteEn']) {
    const note = page.match(new RegExp(`${key}: "([^"\\n]+)"`))?.[1];
    assert.ok(note);
    assert.match(note, /12,288/);
    assert.match(note, /32,768/);
    assert.match(note, /600/);
    assert.doesNotMatch(note, /DeepSeek|65,536/);
    assert.ok(supplement.includes(`data.${key} ??`));
  }
  assert.match(supplement, /up to 65,536 for repeated DeepSeek truncation/);
  assert.match(supplement, /captured without source edits at 10 fps for four seconds/);
  assert.match(supplement, /Click to play; click again to pause/);
});
