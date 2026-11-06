import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
import cases from '../scripts/evaluation/cases.mjs';
import animation from '../scripts/evaluation/animation-case.mjs';
const base=new URL('../public/evaluations/',import.meta.url);
const read=name=>JSON.parse(readFileSync(new URL(name,base),'utf8'));
const bytes=path=>readFileSync(new URL('../public'+path,import.meta.url));
const hash=b=>createHash('sha256').update(b).digest('hex');
const prefix='longcat-2-5-20261026';
test('2026-10-26 LongCat retest preserves exact Preview identity and predefined diagnostic subset',()=>{
 const d=read(prefix+'.json');assert.equal(d.model,'LongCat-2.5-Preview');assert.equal(d.status,'complete');assert.equal(d.attempts.length,8);assert.equal(d.coding.length,4);
 assert.deepEqual(new Set(d.attempts.map(a=>a.id)),new Set(['extract-1','format-1','format-3','grounded-1']));assert.deepEqual(new Set(d.coding.map(a=>a.id)),new Set(['code-money','code-dedupe']));
 for(const a of [...d.attempts,...d.coding]){assert.equal(a.status,'done');assert.equal(a.returnedModel,'LongCat-2.5-Preview');assert.equal(a.request.model,'LongCat-2.5-Preview');assert.equal(a.request.max_tokens,12288);assert.equal(a.request.temperature,0);assert.deepEqual(a.request.thinking,{type:a.mode==='default'?'enabled':'disabled'});assert.equal(typeof a.pass,'boolean');assert.ok(a.totalMs>0);assert.ok(a.firstContentMs>=0);assert.ok(a.usage);assert.equal(a.finishReason,'stop');assert.equal(a.request.messages[0].content,a.prompt);}
 for(const unsupported of ['low','max'])assert.equal(d.supportMatrix[unsupported].supported,false);
 assert.match(d.selectionEn,/not the full 15-task/);assert.equal(d.params.maxConcurrency,2);assert.match(d.methodEn,/overriding/);assert.match(d.methodEn,/not establish release/);
 for(const a of d.coding){assert.equal(a.checkCount,a.id==='code-money'?18:3);assert.ok(a.checks&&a.executable);}
});
test('LongCat 2026-10-26 static images retain first responses, source bytes and all visual observations',async()=>{
 const d=read(prefix+'-visual.json');assert.equal(d.attempts.length,8);assert.equal(d.tasks.length,4);assert.equal(d.documentedEffectiveTemperature.default,1);assert.equal(d.documentedEffectiveTemperature.disabled,.7);
 for(const c of cases){const rows=d.attempts.filter(a=>a.id===c.id);assert.deepEqual(new Set(rows.map(a=>a.mode)),new Set(['default','disabled']));for(const a of rows){assert.equal(a.prompt,c.prompt);assert.ok(a.assessmentZh&&a.assessmentEn);assert.ok(a.altZh&&a.altEn);assert.notEqual(a.status,'interrupted');assert.notEqual(a.status,'not-dispatched');assert.equal(a.request.model,'LongCat-2.5-Preview');if(a.renderable){assert.equal(bytes(a.svgPath).toString(),a.text.match(/<svg\b[\s\S]*?<\/svg\s*>/i)[0]);assert.equal(hash(bytes(a.svgPath)),a.svgSha256);assert.equal(hash(bytes(a.pngPath)),a.pngSha256);let m=await sharp(bytes(a.pngPath)).metadata();assert.equal(m.width,a.width);assert.equal(m.height,a.height);}else assert.ok(a.renderError);}}
});
test('LongCat generated animation evidence has real changing 40-frame output and a four-second loop check',async()=>{
 const d=read(prefix+'-supplement.json');assert.equal(d.pendingAnimation,false);
 const g=d.groups.find(g=>g.id==='pelican-animation');assert.ok(g);assert.deepEqual(new Set(g.samples.map(a=>a.mode)),new Set(['default','disabled']));
 for(const a of g.samples){assert.equal(a.prompt,animation.prompt);assert.equal(a.status,'done');assert.equal(a.returnedModel,'LongCat-2.5-Preview');assert.ok(a.assessmentZh&&a.assessmentEn);assert.equal(bytes(a.svgPath).toString(),a.text.match(/<svg\b[\s\S]*?<\/svg\s*>/i)[0]);assert.equal(hash(bytes(a.svgPath)),a.svgSha256);assert.equal(hash(bytes(a.animationRender.path)),a.animationRender.sha256);assert.equal(a.animationRender.frames,40);assert.equal(a.animationRender.durationSeconds,4);assert.equal(a.animationRender.fps,10);assert.ok(a.animationRender.uniqueFrames>=3);assert.equal(typeof a.animationRender.loopBoundaryMatchesStart,'boolean');assert.equal(a.animationRender.frameHashes.length,40);const m=await sharp(bytes(a.animationRender.path),{animated:true}).metadata();assert.equal(m.pages,40);assert.equal(m.pageHeight,600);assert.equal(a.history.length+1,a.attemptNumber);}
});
test('Separate Responses low and native chart reading preserve protocol, input and exact checks',()=>{
 const d=read(prefix+'-responses.json');assert.equal(d.status,'complete');assert.equal(d.protocol,'openai-responses');assert.equal(d.attempts.length,2);assert.equal(d.semanticsConfirmed,false);
 for(const a of d.attempts){assert.equal(a.httpStatus,200);assert.equal(a.status,'done');assert.equal(a.returnedModel,'LongCat-2.5-Preview');assert.equal(a.request.model,'LongCat-2.5-Preview');assert.equal(a.request.reasoning.effort,'low');assert.equal(a.request.max_output_tokens,12288);assert.equal(a.request.stream,false);assert.equal(a.firstContentMs,null);assert.equal(a.reasoningContentPublished,false);assert.ok(a.usage);assert.ok(!Object.hasOwn(a,'reasoning_content'));}
 const v=d.attempts.find(a=>a.category==='native-vision');assert.equal(v.image.version,'LongCat-2.0 benchmark image used only as a chart-reading input, not as a LongCat-2.5 benchmark');assert.equal(hash(bytes(v.image.path)),v.image.sha256);assert.equal(v.request.input[0].content[1].type,'input_image');assert.equal(v.request.input[0].content[1].image_url,v.image.url);assert.equal(v.checks.length,7);assert.ok(v.checks.every(c=>typeof c.pass==='boolean'));assert.doesNotMatch(v.prompt,/70\.8|59\.5|77\.3|73\.2|78\.8|79\.9/);
});
test('Local storage gap remains counted once with unknown usage and reported lower bounds',()=>{
 const d=read(prefix+'-supplement.json'),account=read(prefix+'-accounting.json');assert.equal(d.requestCount,14);assert.equal(d.trials.length,14);assert.equal(new Set(d.trials.map(a=>a.id+'|'+a.mode+'|'+a.attemptNumber)).size,14);
 const gaps=d.trials.filter(a=>a.storageFailure?.code==='ENOSPC');assert.equal(gaps.length,1);const gap=gaps[0];assert.equal(gap.id,'poster');assert.equal(gap.mode,'default');assert.equal(gap.attemptNumber,2);assert.equal(gap.status,'interrupted');assert.equal(gap.text,'');for(const field of ['httpStatus','returnedModel','usage','totalMs','finishedAt','outputTokens'])assert.equal(gap[field],null);assert.equal(gap.requestReconstructedFromConfig,true);assert.match(gap.interruptionReason,/Local ENOSPC/);assert.equal(gap.renderStatus,'unknown-source-unavailable');assert.match(gap.renderError,/validity not assessable/);
 const poster=d.groups.find(g=>g.id==='poster').samples.find(a=>a.mode==='default');assert.equal(poster.attemptNumber,3);assert.equal(poster.history.filter(a=>a.storageFailure?.code==='ENOSPC').length,1);assert.equal(d.failureCounts.interrupted,1);assert.equal(d.failureCounts.connection,0);assert.equal(d.failureCounts.overload,0);assert.equal(d.failureCounts.truncated,3);assert.equal(account.total.requests,30);assert.equal(account.total.interrupted,1);assert.equal(account.total.requestsWithoutFinalUsage,1);assert.equal(account.tokenTotalsAreLowerBounds,true);assert.equal(account.cumulativeRequestTimeIsLowerBound,true);assert.equal(account.fullBilledTokenTotal,null);assert.equal(account.fullCost,null);assert.equal(account.unknownUsageRequestKeys.length,1);
});
