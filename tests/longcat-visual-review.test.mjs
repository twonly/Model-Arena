import test from'node:test';import assert from'node:assert/strict';import{readFileSync}from'node:fs';import{createHash}from'node:crypto';import sharp from'sharp';import cases from'../scripts/evaluation/cases.mjs';
const raw=readFileSync(new URL('../public/evaluations/longcat-2-5-preview-visual.json',import.meta.url),'utf8'),d=JSON.parse(raw);const file=p=>readFileSync(new URL('../public'+p,import.meta.url));const hash=b=>createHash('sha256').update(b).digest('hex');
test('LongCat visual evidence retains all eight first requests and effective-temperature disclosure',()=>{
 assert.equal(d.attempts.length,8);assert.doesNotMatch(raw,/\bak_[A-Za-z0-9_-]{16,}|Bearer\s+[A-Za-z0-9._-]{16,}/);
 for(const c of cases){const pair=d.attempts.filter(a=>a.id===c.id);assert.deepEqual(new Set(pair.map(a=>a.mode)),new Set(['default','disabled']));for(const a of pair){assert.equal(a.prompt,c.prompt);assert.equal(a.request.model,'LongCat-2.5-Preview');assert.equal(a.request.temperature,0);assert.equal(a.request.max_tokens,12288);assert.deepEqual(a.request.thinking,a.mode==='disabled'?{type:'disabled'}:undefined);assert.ok(['done','error','truncated','incomplete'].includes(a.status));assert.ok(a.totalMs>0);if(a.status==='error')assert.ok(a.error);}}
 assert.equal(d.documentedEffectiveTemperature.default,1);assert.equal(d.documentedEffectiveTemperature.disabled,.7);assert.equal(d.documentedEffectiveTemperature.source,'https://longcat.ai/platform/docs/zh/api/chat');
});
test('LongCat render files preserve exact response SVG bytes, and unrenderable responses retain reasons',async()=>{
 assert.equal(d.renderedCount,d.attempts.filter(a=>a.pngPath).length);
 for(const a of d.attempts){if(a.renderable){assert.ok(a.pngPath);assert.equal(file(a.svgPath).toString(),a.text.match(/<svg\b[\s\S]*?<\/svg\s*>/i)[0]);assert.equal(hash(file(a.svgPath)),a.svgSha256);assert.equal(hash(file(a.pngPath)),a.pngSha256);const m=await sharp(file(a.pngPath)).metadata();assert.equal(m.width,a.width);assert.equal(m.height,a.height);}else{assert.ok(a.renderError);assert.ok(!a.pngPath);}assert.ok(a.assessmentZh&&a.assessmentEn);}
 const first=d.attempts.find(a=>a.id==='pelican'&&a.mode==='default');assert.equal(first.status,'error');assert.match(first.error,/timeout/);assert.equal(first.text,'');assert.equal(first.usage,null);assert.equal(first.outputTokens,null);
 const invalid=d.attempts.find(a=>a.id==='pelican'&&a.mode==='disabled');assert.equal(invalid.status,'done');assert.match(invalid.renderError,/duplicate attribute/);assert.match(invalid.text,/<line x1="200" y1="230" x2="140" y1="290"/);
});
test('LongCat does not substitute another model family benchmark for a missing official figure',()=>{
 assert.deepEqual(d.official,[]);assert.equal(d.officialSourceAudit.status,'no_matching_figures_found');assert.ok(d.officialSources.some(s=>s.url==='https://longcat.chat/platform/docs/zh/ChangeLog.html'));assert.match(d.display.officialIntroZh,/未找到对应版本/);assert.match(d.display.officialIntroEn,/No matching official benchmark/);assert.equal(d.display.previousAttempts,33);
});
test('LongCat clock and chart defects reproduce from the original geometry',()=>{
 const c=d.attempts.find(a=>a.id==='clock'&&a.mode==='disabled'),svg=file(c.svgPath).toString();assert.match(svg,/x1="400" y1="280" x2="305\.92" y2="246\.10"/);const angle=(Math.atan2(305.92-400,280-246.10)*180/Math.PI+360)%360;assert.ok(Math.abs(angle-c.geometryCheck.hourAngleDeg)<1e-8);assert.ok(Math.abs(angle-290.5)>.6);
 const a=d.attempts.find(a=>a.id==='dashboard'&&a.mode==='default'),s=file(a.svgPath).toString();const bars=[...s.matchAll(/<rect x="(?:160|310|460|610)" y="(\d+)" width="70" height="(\d+)"/g)];assert.deepEqual(bars.map(m=>+m[2]),a.geometryCheck.heights);assert.ok(bars.every(m=>+m[1]+ +m[2]===460));assert.notEqual(a.geometryCheck.heights[2],a.geometryCheck.expectedHeights[2]);assert.match(s,/Source: Finance Department/);
});
