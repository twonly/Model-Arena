import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import {runInNewContext} from 'node:vm';
import {BENCHMARK_CASES,checkCase} from '../lib/benchmark-suite.ts';
import {sharedById,sharedAsEndpoints,reconcileSharedPool} from '../lib/shared-models.ts';
import {findEndpointPrice} from '../lib/pricing.ts';
import {prelaunchBySlug} from '../lib/seo-models.ts';
const raw=readFileSync(new URL('../public/evaluations/minimax-m3-1-flash.json',import.meta.url),'utf8');
const d=JSON.parse(raw),median=a=>{a.sort((x,y)=>x-y);return (a[(a.length-1)>>1]+a[a.length>>1])/2};
test('MiniMax release evidence recomputes text scores, latency and list-price equivalent',()=>{
 assert.doesNotMatch(raw,/\bsk-[A-Za-z0-9_-]{16,}|Bearer\s+[A-Za-z0-9._-]{16,}/);
 assert.equal(d.attempts.length,40);assert.equal(d.coding.length,6);
 for(const [i,c] of BENCHMARK_CASES.entries())for(const a of d.attempts.slice(i*2,i*2+2)){assert.equal(a.id,c.id);assert.equal(a.prompt,c.prompt);assert.deepEqual(a.expected,c.expected);}
 for(const a of d.attempts){assert.equal(a.pass,a.status==='done'&&checkCase(a,a.text));assert.equal(a.request.max_tokens,2048);}
 for(const a of [...d.attempts,...d.coding]){assert.equal(a.request.model,'MiniMax-M3.1-Flash');assert.equal(a.returnedModel,a.request.model);assert.equal(a.httpStatus,200);assert.equal(a.request.reasoning_split,true);assert.equal(a.request.reasoning_effort,a.mode==='low'?'low':undefined);assert.ok(a.totalMs>=a.firstContentMs&&a.firstContentMs>0);}
 for(const mode of ['default','low']){const a=d.attempts.filter(a=>a.mode===mode),s=d.summary[mode];assert.equal(s.textPassed,a.filter(a=>a.pass).length);assert.equal(s.edgePassed,a.filter(a=>a.id.startsWith('edge-')&&a.pass).length);assert.equal(s.medianFirstContentMs,median(a.map(a=>a.firstContentMs)));assert.equal(s.medianTotalMs,median(a.map(a=>a.totalMs)));assert.equal(s.outputTokens,a.reduce((n,a)=>n+a.outputTokens,0));}
 const cost=[...d.attempts,...d.coding].reduce((n,a)=>{const hit=a.usage.prompt_tokens_details.cached_tokens;return n+((a.promptTokens-hit)*.15+hit*.015+a.outputTokens*.6)/1e6},0);assert.ok(Math.abs(cost-d.estimatedListEquivalentUsd)<1e-12);
});
test('MiniMax release keeps the low-effort shipping failure and passes all executable code checks',()=>{
 const fail=d.attempts.filter(a=>!a.pass);assert.equal(fail.length,1);assert.equal(fail[0].id,'edge-money-total');assert.equal(fail[0].mode,'low');assert.deepEqual(JSON.parse(fail[0].text),{totalCents:5470});assert.equal(1990*3+450-500,fail[0].expected.totalCents);
 for(const a of d.coding){assert.equal(a.request.max_tokens,8192);assert.equal(a.pass,true);assert.doesNotThrow(()=>runInNewContext(a.executable+'\n'+a.checks,{}, {timeout:1000,contextCodeGeneration:{strings:false,wasm:false}}));}
 for(const mode of ['default','low'])assert.equal(d.coding.filter(a=>a.mode===mode).reduce((n,a)=>n+a.checkCount,0),26);
});
test('retire old Space Bunny trial without relabeling history or changing own endpoints',()=>{
 const now=new Date('2026-10-20T04:00:00Z'),before=new Date('2026-10-19T00:00:00Z');
 const old=sharedAsEndpoints(before).find(a=>a.id==='space-bunny-alpha'),own={...old,id:'own-space',shared:false,apiKey:'own-key'};
 assert.equal(sharedById('space-bunny-alpha',now),undefined);assert.equal(sharedById('space-bunny-alpha',before).model,'stealth/space-bunny-alpha');
 const next=reconcileSharedPool([old,own],true,now);assert.ok(!next.some(a=>a.id===old.id));assert.deepEqual(next.find(a=>a.id===own.id),own);
 const formal=next.find(a=>a.id==='minimax-m3-1-flash');assert.equal(formal.model,'MiniMax-M3.1-Flash');assert.equal(formal.apiKey,'');assert.deepEqual(JSON.parse(formal.extraBody),{reasoning_split:true});
 assert.equal(sharedById('minimax-m3-1-flash-preview',now).model,'MiniMax-M3.1-Flash-Preview');
 assert.equal(findEndpointPrice(formal.model,formal.baseUrl).inputMiss,.15);assert.equal(findEndpointPrice(formal.model,formal.baseUrl).inputHit,.015);assert.equal(findEndpointPrice(formal.model,'https://openrouter.ai/api/v1'),undefined);assert.equal(findEndpointPrice('MiniMax-M3.1-Flash-Preview',formal.baseUrl),undefined);
 for(const slug of ['minimax-m3-1-flash','space-bunny-alpha'])assert.equal(prelaunchBySlug(slug).reviewPath,'/guides/minimax-m3-1-flash');
});
