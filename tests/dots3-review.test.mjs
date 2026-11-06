import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {prelaunchBySlug} from '../lib/seo-models.ts';

const read=path=>readFileSync(new URL('../'+path,import.meta.url));
const json=path=>JSON.parse(read(path).toString());
const evidence=json('public/evaluations/dots3-note-preview-evidence.json');
const supplement=json('public/evaluations/dots3-note-preview-supplement.json');
const visual=json('public/evaluations/dots3-note-preview-visual.json');
const manifest=json('public/evaluations/dots3-note-preview/assets.json');

test('Dots3 publication preserves the actual four-task scope, free route and complete usage',()=>{
  assert.deepEqual(supplement.groups.map(group=>group.id),['clock','dashboard','poster','pelican-animation']);
  assert.equal(supplement.showAttemptCount,false);
  assert.match(supplement.introEn,/Three static SVG/);
  assert.match(evidence.scope,/not completion of the eleven-task/);
  assert.equal(evidence.attempts.length,5);
  assert.equal(evidence.attempts.filter(attempt=>attempt.status==='truncated').length,1);
  for(const attempt of evidence.attempts){
    assert.equal(attempt.request.model,'dots-studio/dots-3-note-preview:free');
    assert.equal(attempt.returnedModel,attempt.request.model);
    assert.deepEqual(attempt.request.provider.max_price,{prompt:0,completion:0});
    assert.equal(attempt.usage.cost,0);
  }
  const sum=key=>evidence.attempts.reduce((total,attempt)=>total+attempt.usage[key],0);
  assert.equal(sum('prompt_tokens'),evidence.metrics.promptTokens);
  assert.equal(sum('completion_tokens'),evidence.metrics.completionTokens);
  assert.equal(evidence.metrics.completionTokens,48946);
  assert.equal(evidence.metrics.reportedCost,0);
  assert.doesNotMatch(JSON.stringify({evidence,supplement,visual}),/reasoning_content|redacted_thinking|SHARED_KEY_OPENROUTER|\bsk-[a-zA-Z0-9_-]{12,}|Bearer\s+[a-zA-Z0-9._-]{12,}/);
});

test('Dots3 published artwork remains byte-identical to the original responses and manifest',()=>{
  for(const file of manifest.files){
    const bytes=read('public'+file.path);
    assert.equal(bytes.length,file.bytes,file.path);
    assert.equal(createHash('sha256').update(bytes).digest('hex'),file.sha256,file.path);
  }
  for(const group of supplement.groups){
    const sample=group.samples[0];
    const response=evidence.attempts.findLast(attempt=>attempt.id===group.id&&attempt.status==='done');
    assert.ok(response);
    const svg=response.text.match(/<svg\b[\s\S]*?<\/svg\s*>/i)?.[0];
    assert.equal(read('public'+sample.svgPath).toString(),svg);
    if(group.id==='pelican-animation')assert.ok(sample.animationRender.path.endsWith('.webp'));
  }
  assert.equal(visual.official.length,2);
  for(const figure of visual.official){
    assert.match(figure.sourcePage,/huggingface\.co\/dots-studio\/dots3-note-prev/);
    assert.match(figure.url,/\/assets\/bench_en[12]\.png$/);
  }
});

test('Dots3 is discoverable through the bilingual guide, model profile, homepage, reports and sitemap',()=>{
  const model=prelaunchBySlug('dots3-note-preview');
  assert.equal(model.reviewPath,'/guides/dots3-note-preview');
  assert.equal(model.apiModelId,evidence.model);
  const page=read('app/[lang]/guides/dots3-note-preview/page.tsx').toString();
  assert.ok(page.indexOf('id="model-introduction"')<page.indexOf('<VisualEvaluation'));
  assert.match(page,/infoMetadata\(locale, pathname, title, description\)/);
  assert.match(page,/TechArticle/);
  assert.match(page,/ArticleNavigation/);
  for(const path of ['app/[lang]/page.tsx','app/[lang]/reports/page.tsx','app/sitemap.ts'])assert.match(read(path).toString(),/\/guides\/dots3-note-preview/);
});
