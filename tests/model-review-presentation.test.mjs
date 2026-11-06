import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import test from 'node:test';
import ts from 'typescript';
import * as presentation from '../lib/model-review-presentation.ts';
import { reviewExcerpt } from '../lib/review-excerpt.ts';

const require = createRequire(import.meta.url);
const exports = {};
const compiled = ts.transpileModule(readFileSync(new URL('../components/JsonLd.tsx', import.meta.url), 'utf8'), {
  compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS },
}).outputText;
new Function('require', 'exports', compiled)(id => id === '@/lib/model-review-presentation' ? presentation : require(id), exports);

test('editorial metadata follows each language without changing publication or experiment dates', () => {
  for (const [slug, p] of Object.entries(presentation.modelReviewPresentations)) {
    for (const locale of ['en', 'zh-CN']) {
      const original = { '@type': 'TechArticle', url: `https://www.tokrace.com/${locale}/guides/${slug}`, inLanguage: locale, headline: 'Old title', datePublished: '2026-10-24', dateModified: '2026-10-25', image: ['/original.png'] };
      const result = exports.reviewStructuredData(original);
      assert.equal(result.headline, presentation.reviewText(p.title, locale));
      assert.equal(result.dateModified, presentation.REVIEW_PRESENTATION_UPDATED_AT);
      assert.equal(result.datePublished, original.datePublished);
      assert.equal(result.image, original.image);
      assert.equal(original.headline, 'Old title');
      const dataset = { ...original, '@type': 'Dataset' };
      assert.equal(exports.reviewStructuredData(dataset), dataset);
      assert.equal(presentation.reviewNavigation(slug, locale)[0].id, 'model-introduction');
    }
  }
  const reference = { '@type': 'TechArticle', url: 'https://www.tokrace.com/zh-CN/guides/longcat-2-5-release', dateModified: '2026-11-02' };
  assert.equal(exports.reviewStructuredData(reference), reference);
  assert.equal(exports.reviewStructuredData({ '@type': 'TechArticle' }).dateModified, undefined);
});

test('short card notes retain measurements and concrete failures', () => {
  assert.equal(reviewExcerpt('The roof has a 70.56 mm gap. The piston leaves the cylinder. This is a qualitative observation.', true), 'The roof has a 70.56 mm gap. The piston leaves the cylinder.');
  assert.equal(reviewExcerpt('这不是物理仿真。活塞越出了缸体。调速器连杆断开。完整重试历史见记录。', false), '活塞越出了缸体。调速器连杆断开。');
});
