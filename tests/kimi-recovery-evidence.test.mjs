import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,mkdtempSync,writeFileSync,rmSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {runInNewContext} from 'node:vm';
import {createServer} from 'node:http';
import {spawn} from 'node:child_process';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import sharp from 'sharp';
import {BENCHMARK_CASES,checkCase} from '../lib/benchmark-suite.ts';
const read=p=>JSON.parse(readFileSync(p,'utf8'));
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const base='public/evaluations/kimi-k3-1-pro-resume-20261024.json';
test('recovery evidence fills only missing slots and preserves exact prompts, checks, original assets and accounting',async()=>{
 const data=read(base),config=read('scripts/evaluation/kimi-k3-1-pro-anthropic.json'),historical=read('public/evaluations/kimi-k3-1-pro-anthropic-first.json');
 assert.equal(data.protocol,'anthropic-messages');assert.equal(data.model,'k3.1-pro');assert.equal(data.requestUrl,'https://api.kimi.com/coding/v1/messages');assert.equal(data.plannedRecoverySlots,21);assert.equal(data.params.concurrency,1);assert.equal(data.originalPublishedAt,'2026-10-24T01:14:44.983Z');
 const rows=[...data.attempts,...data.coding,...data.trials];assert.equal(data.requestCount,rows.length);assert.equal(new Set(rows.map(a=>`${a.id}|${a.mode}|${a.attemptNumber}`)).size,rows.length);assert.equal(data.counting.combinedNativeMessagesRequests,58+rows.length);
 const allowed=new Set([...config.tasks.filter(t=>t.category).map(t=>`${t.id}|default`),'code-dedupe|max','code-intervals|max','pelican-animation|default']);assert.equal(allowed.size,21);
 for(const a of rows){
  assert.ok(allowed.has(`${a.id}|${a.mode}`));const task=config.tasks.find(t=>t.id===a.id),originalTask=historical.configs[0].tasks.find(t=>t.id===a.id);assert.equal(a.prompt,task.prompt);assert.equal(a.prompt,originalTask.prompt);if(task.checks){assert.equal(a.checks,task.checks);assert.equal(a.checks,originalTask.checks);assert.equal(a.checkCount,originalTask.checkCount);}if(task.expected)assert.deepEqual(a.expected,task.expected);assert.equal(a.sourceEvidence,'/evaluations/kimi-k3-1-pro-resume-20261024.json');assert.equal(a.sourceDate,a.startedAt.slice(0,10));
  if(!a.request)continue;
  assert.equal(a.request.model,'k3.1-pro');assert.ok([12288,32768].includes(a.request.max_tokens));assert.ok(!Object.hasOwn(a.request,'temperature'));assert.ok(!Object.hasOwn(a.request,'thinking'));assert.deepEqual(a.request.output_config,a.mode==='default'?undefined:{effort:'max'});assert.ok(a.timeoutMs===600000||(a.animation&&a.attemptNumber>=4&&a.timeoutMs===900000));
  if(a.httpStatus===200)assert.equal(a.returnedModel,'k3.1-pro');if(a.usage){assert.equal(a.promptTokens,a.usage.input_tokens+(a.usage.cache_read_input_tokens??0)+(a.usage.cache_creation_input_tokens??0));assert.equal(a.reportedOutputTokens,a.usage.output_tokens);if(a.usageComplete)assert.equal(a.outputTokens,a.usage.output_tokens);else {assert.equal(a.outputTokens,null);assert.match(a.usageNote,/unknown/);}}
 }
 for(const a of data.attempts)assert.equal(a.pass,a.status==='done'&&checkCase(BENCHMARK_CASES.find(c=>c.id===a.id),a.text));
 for(const a of data.coding.filter(a=>a.pass))assert.doesNotThrow(()=>runInNewContext(a.executable+'\n'+a.checks,{}, {timeout:1000,contextCodeGeneration:{strings:false,wasm:false}}));
 for(const mode of ['default','max']){const t=data.attempts.filter(a=>a.mode===mode),c=data.coding.filter(a=>a.mode===mode),s=data.summary[mode];assert.equal(s.textAttempted,t.filter(a=>a.status==='done').length);assert.equal(s.codingAttempted,c.filter(a=>a.status==='done').length);assert.equal(s.textPassed,t.filter(a=>a.pass).length);assert.equal(s.codingPassed,c.filter(a=>a.pass).length);}
 for(const record of data.originalEvidence)assert.equal(hash(readFileSync('public'+record.path)),record.sha256);
 assert.equal(data.combinedCoverage.static.completed,12);assert.equal(data.supportMatrix.default.semanticsConfirmed,false);assert.equal(data.supportMatrix.max.semanticsConfirmed,false);assert.equal(data.supportMatrix.off.tested,false);
 assert.doesNotMatch(readFileSync(base,'utf8'),/"(?:reasoning_content|reasoning_details|apiKey|api_key|authorization)"\s*:|\bsk-[A-Za-z0-9_-]{16,}|Bearer\s+[A-Za-z0-9._-]{16,}/);
 for(const a of data.trials.filter(a=>a.status==='done'&&a.animationRender)){
  const svg=readFileSync('public'+a.svgPath);assert.equal(svg.toString(),a.text.match(/<svg\b[\s\S]*?<\/svg\s*>/i)[0]);assert.equal(hash(svg),a.svgSha256);assert.equal(hash(readFileSync('public'+a.pngPath)),a.pngSha256);const pngMeta=await sharp('public'+a.pngPath).metadata();assert.equal(pngMeta.width,1200);assert.equal(pngMeta.height,900);assert.ok(a.svgPath.startsWith('/evaluations/kimi-k3-1-pro-resume-20261024-'));
  const animation=readFileSync('public'+a.animationRender.path),meta=await sharp(animation,{animated:true}).metadata();assert.equal(hash(animation),a.animationRender.sha256);assert.equal(meta.width,800);assert.equal(meta.pageHeight,600);assert.equal(meta.pages,40);assert.equal(meta.delay.reduce((n,x)=>n+x,0),4000);assert.equal(a.animationRender.frameHashes.length,40);assert.ok(a.animationRender.uniqueFrames>=3);
  for(const frame of [0,10,20,30]){const raw=await sharp('public'+a.svgPath.replace('.svg',`-frame-${frame}.png`)).removeAlpha().raw().toBuffer();assert.equal(hash(raw),a.animationRender.frameHashes[frame]);}
 }
 if(data.status==='complete'){assert.equal(data.coverage.text.completed,15);assert.equal(data.coverage.coding.completed,5);assert.equal(data.coverage.animation.completed,1);assert.equal(data.combinedCoverage.text.completed,45);assert.equal(data.combinedCoverage.coding.completed,9);assert.equal(data.combinedCoverage.animation.completed,3);assert.ok(data.groups[0].samples[0].assessmentZh&&data.groups[0].samples[0].assessmentEn);}
});
test('recovery runner immediately stops on every429 and on a missing required returned model',async()=>{
 const dir=mkdtempSync(join(tmpdir(),'kimi-recovery-'));let requests=0;
 const server=createServer((req,res)=>{requests++;let body='';req.on('data',b=>body+=b);req.on('end',()=>{const model=JSON.parse(body).model;if(model==='rate'){res.writeHead(429,{'content-type':'application/json'});res.end('{"error":{"message":"Too many requests"}}');return;}res.writeHead(200,{'content-type':'text/event-stream'});res.end([{type:'message_start',message:{usage:{input_tokens:1,output_tokens:0}}},{type:'content_block_delta',delta:{type:'text_delta',text:'ok'}},{type:'message_delta',delta:{stop_reason:'end_turn'},usage:{output_tokens:1}},{type:'message_stop'}].map(o=>'data: '+JSON.stringify(o)+'\n\n').join(''));});});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 try{for(const model of ['rate','missing-model']){requests=0;const cf=join(dir,model+'-config.json'),ef=join(dir,model+'-evidence.json');writeFileSync(cf,JSON.stringify({model,protocol:'anthropic-messages',endpoint:`http://127.0.0.1:${server.address().port}/coding`,keyEnv:'RECOVERY_FIXTURE_KEY',modes:{default:{}},maxTokens:12288,timeoutMs:2000,providerBackoffMs:60000,stopOnRateLimit:true,expectedReturnedModel:model,tasks:[{id:'one',prompt:'first'},{id:'two',prompt:'must not dispatch'}]}));const start=performance.now();const result=await new Promise((resolve,reject)=>{const child=spawn(process.execPath,['scripts/evaluation/run.mjs',cf,ef],{env:{...process.env,RECOVERY_FIXTURE_KEY:'fixture-not-a-real-key'},stdio:['ignore','ignore','pipe']});let error='';child.stderr.on('data',b=>error+=b);child.on('error',reject);child.on('close',code=>resolve({code,error}));});assert.notEqual(result.code,0);assert.match(result.error,model==='rate'?/rate limit reached/:/model.*missing/);assert.ok(performance.now()-start<2000);assert.equal(requests,1);assert.equal(read(ef).attempts.length,1);}}
 finally{server.closeAllConnections();await new Promise(resolve=>server.close(resolve));rmSync(dir,{recursive:true,force:true});}
});
