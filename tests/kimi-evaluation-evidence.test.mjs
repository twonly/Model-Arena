import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {existsSync} from 'node:fs';
import sharp from 'sharp';
import {runInNewContext} from 'node:vm';
import {BENCHMARK_CASES,checkCase} from '../lib/benchmark-suite.ts';
import visualCases from '../scripts/evaluation/cases.mjs';
import animationCase from '../scripts/evaluation/animation-case.mjs';
const read=path=>JSON.parse(readFileSync(path,'utf8'));
const base='public/evaluations/kimi-k3-1-pro';
const review=read(base+'.json');
test('Kimi K3.1 Pro blocked snapshot makes no fabricated result claim',()=>{
 if(['complete','partial-quota'].includes(review.status))return;
 assert.equal(review.status,'blocked');assert.deepEqual(review.attempts,[]);assert.deepEqual(review.coding,[]);assert.deepEqual(review.summary,{});
 const visual=read(base+'-visual.json'),supplement=read(base+'-supplement.json');
 assert.deepEqual(visual.attempts,[]);assert.deepEqual(visual.tasks,[]);assert.deepEqual(visual.display.modeLabels,{});
 assert.deepEqual(supplement.groups,[]);assert.deepEqual(supplement.trials,[]);assert.equal(supplement.requestCount,0);assert.equal(supplement.pendingAnimation,true);
 assert.equal(review.estimatedCostUsd,null);assert.equal(review.supportMatrix.off.supported,false);
 for(const key of ['default','low','max'])assert.equal(review.supportMatrix[key].tested,false);
});
test('Kimi stopped archive preserves all original bytes, completed responses and interrupted slot',()=>{
 const archivePath='public'+review.stoppedBatches[0].path,raw=readFileSync(archivePath),archive=JSON.parse(raw);
 assert.equal(createHash('sha256').update(raw).digest('hex'),review.stoppedBatches[0].sha256);
 assert.equal(archive.endpoint,'https://api.kimi.com/coding/v1');assert.equal(archive.model,'k3.1-pro');
 assert.equal(archive.attempts.length,23);assert.equal(archive.attempts.filter(a=>a.status==='done').length,22);assert.equal(archive.attempts.filter(a=>a.status==='interrupted').length,1);
 assert.equal(review.stoppedBatches[0].requestCount,23);assert.equal(review.stoppedBatches[0].completedCount,22);assert.equal(review.stoppedBatches[0].interruptedCount,1);
 assert.match(review.stoppedBatches[0].source,/community-guidelines/);
 for(const a of archive.attempts){
  const task=BENCHMARK_CASES.find(c=>c.id===a.id);assert.ok(task);assert.equal(a.prompt,task.prompt);assert.deepEqual(a.expected,task.expected);
  if(a.status!=='done')continue;
  assert.equal(a.returnedModel,'k3.1-pro');assert.equal(a.httpStatus,200);assert.equal(a.finishReason,'stop');assert.equal(checkCase(task,a.text),true);
  assert.ok(a.firstContentMs>0);assert.ok(a.totalMs>=a.firstContentMs);assert.ok(a.usage.completion_tokens>0);assert.equal(a.request.max_tokens,12288);assert.ok(!Object.hasOwn(a.request,'temperature'));
 }
});
test('Kimi future batch is unexecuted metered API configuration with original fixed tasks and safe sampling',()=>{
 const config=read('scripts/evaluation/kimi-k3-1-pro.json');assert.equal(config.endpoint,'https://api.moonshot.ai/v1');assert.equal(config.model,'kimi-k3.1-pro');assert.equal(config.keyEnv,'KIMI_EVAL_API_KEY');assert.equal(config.executionStatus,'not-run');assert.match(config.method,/NOT RUN/);
 assert.deepEqual(config.modes,{default:{},low:{reasoning_effort:'low'},max:{reasoning_effort:'max'}});assert.equal(config.maxTokens,12288);assert.equal(config.timeoutMs,600000);assert.ok(!Object.hasOwn(config,'temperature'));assert.ok(!Object.hasOwn(config.extraBody,'temperature'));
 for(const task of [...BENCHMARK_CASES,...visualCases,animationCase])assert.equal(config.tasks.find(x=>x.id===task.id).prompt,task.prompt);
 assert.equal(config.tasks.filter(t=>t.category==='coding').length,3);assert.equal(config.tasks.length,23);
});
test('Kimi public evidence omits credentials and private reasoning, and preserves all blocked access probes',()=>{
 for(const suffix of ['.json','-visual.json','-supplement.json','-access.json','-coding-stopped.json',...(existsSync(base+'-anthropic-first.json')?['-anthropic-first.json','-anthropic-access.json']:[])]){
  const raw=readFileSync(base+suffix,'utf8');assert.doesNotMatch(raw,/\bsk-[A-Za-z0-9_-]{16,}|Bearer\s+[A-Za-z0-9._-]{16,}|"(?:reasoning_content|reasoning_details|apiKey|api_key|authorization)"\s*:/);
 }
 const access=read(base+'-access.json'),checks=access.checks;
 assert.ok(checks.some(c=>c.endpoint==='https://api.moonshot.ai/v1'&&c.httpStatus===401));
 assert.ok(checks.some(c=>c.endpoint==='https://openrouter.ai/api/v1'&&c.httpStatus===401));
 assert.ok(checks.some(c=>c.endpoint==='https://api.orcarouter.ai/v1'&&c.httpStatus===404));
 const connection=checks.find(c=>c.endpoint==='https://api.kimi.com/coding/v1'&&c.request);
 assert.equal(connection.httpStatus,200);assert.equal(connection.request.model,'k3.1-pro');assert.equal(connection.body.model,'k3.1-pro');
});

test('Kimi native configuration uses documented Messages effort and keeps thinking budget separate',()=>{
 const config=read('scripts/evaluation/kimi-k3-1-pro-anthropic.json');assert.equal(config.endpoint,'https://api.kimi.com/coding');assert.equal(config.protocol,'anthropic-messages');assert.equal(config.keyEnv,'KIMI_CODING_REVIEW_KEY');assert.equal(config.model,'k3.1-pro');assert.deepEqual(config.modes,{default:{},low:{output_config:{effort:'low'}},max:{output_config:{effort:'max'}}});assert.equal(config.maxTokens,12288);assert.equal(config.timeoutMs,600000);assert.equal(config.providerBackoffMs,60000);assert.equal(config.expectedReturnedModel,'k3.1-pro');assert.ok(!Object.hasOwn(config,'temperature'));assert.ok(!Object.hasOwn(config.extraBody,'thinking'));assert.equal(config.tasks.length,23);
});
test('Kimi measured native batch recomputes all measurements, checks and original asset hashes',async()=>{
 if(!['complete','partial-quota'].includes(review.status))return;
 assert.equal(review.protocol,'anthropic-messages');assert.equal(review.endpoint,'https://api.kimi.com/coding');assert.equal(review.model,'k3.1-pro');assert.equal(review.billing.type,'subscription-quota');assert.equal(review.estimatedCostUsd,null);assert.equal(review.attempts.length,review.coverage.text.submitted);assert.equal(review.coding.length,review.coverage.coding.submitted);if(review.status==='partial-quota'){assert.equal(review.plannedFirstRequests,69);assert.equal(review.actualFirstRequests,51);assert.equal(review.notDispatchedCount,18);assert.equal(review.coverage.text.completed,30);assert.equal(review.coverage.text.quota,1);assert.equal(review.coverage.coding.completed,4);assert.equal(review.coverage.coding.quota,1);assert.equal(review.quotaResetAt,'2026-10-24T04:46:39Z');}
 assert.equal(review.publishedAt,'2026-10-24T01:14:44.983Z');assert.equal(review.diagnosticRequestCount,5);assert.equal(review.totalNativeRequestCount,review.totalRequests+5);assert.equal(review.parameterDiagnostics.disabledProbe.httpStatus,400);assert.deepEqual(review.parameterDiagnostics.disabledProbe.request.thinking,{type:'disabled'});if(!review.parameterDiagnostics.effortFieldValidated){assert.equal(review.supportMatrix.low.effectiveEffort,null);assert.equal(review.supportMatrix.max.semanticsConfirmed,false);assert.match(review.modes.low.en,/Requested/);assert.match(review.notes.en,/not independently confirmed/);}
 const first=read(base+'-anthropic-first.json');assert.equal(first.attempts.length,review.actualFirstRequests);assert.equal(createHash('sha256').update(JSON.stringify(first.attempts)).digest('hex'),first.sha256);
 for(const mode of ['default','low','max']){
  const text=review.attempts.filter(a=>a.mode===mode),code=review.coding.filter(a=>a.mode===mode),all=first.attempts.filter(a=>a.mode===mode);assert.equal(text.length,review.coverageByMode[mode].categories.text.submitted);assert.equal(code.length,review.coverageByMode[mode].categories.coding.submitted);assert.equal(all.length,review.coverageByMode[mode].submitted);assert.equal(review.summary[mode].textAttempted,text.filter(a=>a.status==='done').length);assert.equal(review.summary[mode].codingAttempted,code.filter(a=>a.status==='done').length);assert.equal(review.summary[mode].textPassed,text.filter(a=>a.pass).length);assert.equal(review.summary[mode].codingPassed,code.filter(a=>a.pass).length);assert.equal(review.summary[mode].outputTokens,all.reduce((n,a)=>n+(a.outputTokens??0),0));
  for(const a of all){assert.equal(a.request.model,'k3.1-pro');assert.equal(a.request.max_tokens,12288);assert.ok(!Object.hasOwn(a.request,'temperature'));assert.ok(!Object.hasOwn(a.request,'stream_options'));assert.deepEqual(a.request.output_config,mode==='default'?undefined:{effort:mode});if(a.httpStatus===200)assert.equal(a.returnedModel,'k3.1-pro');if(a.outputTokens!=null)assert.equal(a.outputTokens,a.usage.output_tokens);if(a.promptTokens!=null)assert.equal(a.promptTokens,a.usage.input_tokens+(a.usage.cache_creation_input_tokens??0)+(a.usage.cache_read_input_tokens??0));}
  for(const a of text){const c=BENCHMARK_CASES.find(c=>c.id===a.id);assert.equal(a.prompt,c.prompt);assert.equal(a.pass,a.status==='done'&&checkCase(c,a.text));}
  for(const a of code.filter(a=>a.pass))assert.doesNotThrow(()=>runInNewContext(a.executable+'\n'+a.checks,{}, {timeout:1000,contextCodeGeneration:{strings:false,wasm:false}}));
 }
 const visual=read(base+'-visual.json'),supplement=read(base+'-supplement.json');assert.equal(visual.display.previousAttempts,review.attempts.length+review.coding.length);assert.equal(visual.display.previousAttempts,36);assert.equal(visual.attempts.length,12);assert.equal(supplement.groups.length,5);assert.equal(supplement.requestCount,supplement.trials.length);assert.equal(supplement.pendingAnimation,supplement.groups.find(g=>g.id==='pelican-animation').samples.filter(a=>a.animationRender).length<3);assert.equal(review.totalRequests,review.actualFirstRequests+supplement.trials.filter(a=>a.attemptNumber>1).length);if(review.status==='partial-quota'){assert.equal(supplement.retrying,false);assert.equal(supplement.pendingReason,'quota');assert.match(supplement.pendingReasonEn,/quota/);assert.equal(supplement.failureCounts.quota,2);}
 for(const group of supplement.groups){assert.equal(group.samples.length,3);for(const a of group.samples){if(!a.renderable||a.status!=='done'){assert.equal(group.id,'pelican-animation');assert.ok(a.error||a.renderError);assert.ok(a.startedAt);assert.ok(Array.isArray(a.history));continue;}assert.equal(a.status,'done');assert.equal(a.renderable,true);assert.ok(a.assessmentZh&&a.assessmentEn);const svg=readFileSync('public'+a.svgPath);assert.equal(svg.toString(),a.text.match(/<svg\b[\s\S]*?<\/svg\s*>/i)[0]);assert.equal(createHash('sha256').update(svg).digest('hex'),a.svgSha256);assert.equal(createHash('sha256').update(readFileSync('public'+a.pngPath)).digest('hex'),a.pngSha256);assert.equal(a.sourceEvidence,a.attemptNumber===1?'/evaluations/kimi-k3-1-pro-anthropic-first.json':'/evaluations/kimi-k3-1-pro-supplement.json');
  if(a.animation){assert.ok(a.animationRender);const meta=await sharp('public'+a.animationRender.path,{animated:true}).metadata();assert.equal(meta.pages,40);assert.equal(meta.delay.reduce((n,x)=>n+x,0),4000);assert.equal(a.animationRender.frameHashes.length,40);assert.ok(a.animationRender.uniqueFrames>=3);assert.equal(createHash('sha256').update(readFileSync('public'+a.animationRender.path)).digest('hex'),a.animationRender.sha256);}
 }}
 assert.ok(Date.parse(supplement.updatedAt)>=Date.parse(review.publishedAt));
});
