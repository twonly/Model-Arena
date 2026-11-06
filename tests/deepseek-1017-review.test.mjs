import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { runInNewContext } from 'node:vm';
import { BENCHMARK_CASES, checkCase } from '../lib/benchmark-suite.ts';
import { sharedById, reconcileSharedPool, sharedAsEndpoints } from '../lib/shared-models.ts';
import { prelaunchBySlug } from '../lib/seo-models.ts';
const raw=readFileSync(new URL('../public/evaluations/deepseek-v4-1-flash-1017.json',import.meta.url),'utf8');
const d=JSON.parse(raw);
const median=a=>{a.sort((x,y)=>x-y);return (a[(a.length-1)>>1]+a[a.length>>1])/2};
test('DeepSeek 1017 published evidence recomputes paired task scores and measurements',()=>{
 assert.doesNotMatch(raw,/\bsk-[A-Za-z0-9_-]{16,}|Bearer\s+[A-Za-z0-9._-]{16,}/);
 assert.equal(d.attempts.length,30);assert.equal(d.coding.length,6);
 for(const [i,c] of BENCHMARK_CASES.entries()){
  const pair=d.attempts.slice(i*2,i*2+2);assert.deepEqual(pair.map(a=>a.mode),i%2?['disabled','default']:['default','disabled']);
  for(const a of pair){assert.equal(a.id,c.id);assert.equal(a.prompt,c.prompt);assert.deepEqual(a.expected,c.expected);assert.equal(a.pass,a.status==='done'&&checkCase(c,a.text));assert.equal(a.httpStatus,200);assert.equal(a.request.model,'deepseek-flash');assert.equal(a.returnedModel,'deepseek-flash');assert.equal(a.request.max_tokens,2048);assert.ok(a.totalMs>=a.firstContentMs);assert.ok(a.firstContentMs>0);assert.deepEqual(a.request.thinking,a.mode==='default'?undefined:{type:'disabled'});}
 }
 for(const mode of ['default','disabled']){const a=d.attempts.filter(x=>x.mode===mode),s=d.summary[mode];assert.equal(s.textPassed,a.filter(x=>x.pass).length);assert.equal(s.medianFirstContentMs,median(a.map(x=>x.firstContentMs)));assert.equal(s.medianTotalMs,median(a.map(x=>x.totalMs)));assert.equal(s.outputTokens,a.reduce((n,x)=>n+x.outputTokens,0));}
 const cost=[...d.attempts,...d.coding].reduce((n,x)=>n+(x.usage.prompt_cache_hit_tokens*.003+x.usage.prompt_cache_miss_tokens*.15+x.outputTokens*.6)/1e6,0);assert.ok(Math.abs(cost-d.estimatedCostUsd)<1e-12);
});
test('DeepSeek coding evidence retains truncation and reproduces the leading-zero failure',()=>{
 const disabled=d.coding.find(x=>x.id==='code-money'&&x.mode==='disabled');
 assert.equal(disabled.pass,false);assert.equal(disabled.status,'done');
 assert.equal(runInNewContext(disabled.executable+';parseCents("0001.02")',{}, {timeout:1000}),null);
 assert.throws(()=>runInNewContext(disabled.executable+'\n'+disabled.checks,{}, {timeout:1000}),/0001.02/);
 const def=d.coding.find(x=>x.id==='code-money'&&x.mode==='default');
 assert.equal(def.status,'truncated');assert.equal(def.text,'');assert.equal(def.finishReason,'length');assert.equal(def.outputTokens,4096);assert.equal(def.reasoningTokens,4096);assert.equal(def.pass,false);
 for(const a of d.coding.filter(x=>x.pass)) assert.doesNotThrow(()=>runInNewContext(a.executable+'\n'+a.checks,{}, {timeout:1000,contextCodeGeneration:{strings:false,wasm:false}}));
 for(const mode of ['default','disabled'])assert.equal(d.summary[mode].codingPassed,d.coding.filter(x=>x.mode===mode&&x.pass).length);
});
test('DeepSeek 1017 keeps the working API alias and updates existing trial labels',()=>{
 const current=sharedById('deepseek-flash');assert.equal(current.model,'deepseek-flash');assert.equal(current.version,'DeepSeek-V4.1-Flash-1017');
 const old={...sharedAsEndpoints().find(x=>x.id==='deepseek-flash'),name:'DeepSeek V4.1 Flash',enabled:false};
 const [updated]=reconcileSharedPool([old],false);assert.equal(updated.name,'DeepSeek V4.1 Flash 1017');assert.equal(updated.enabled,false);assert.equal(updated.apiKey,'');
 assert.equal(prelaunchBySlug('deepseek-flash').reviewPath,'/guides/deepseek-v4-1-flash-1017');
 assert.equal(sharedById('deepseek-v4-1-flash'),undefined,'expired preview stays expired');
 for(const locale of ['zh-CN','en']){const body=d.editorial[locale].sections.map(s=>s.body).join('\n');assert.ok(body.includes('0001.02'));assert.ok(body.includes('finish_reason=length'));assert.ok(body.includes('/'+locale+'/model/deepseek-flash'));}
});
