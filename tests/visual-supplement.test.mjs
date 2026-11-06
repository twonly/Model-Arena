import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
const hash=b=>createHash('sha256').update(b).digest('hex');
const slugs=['deepseek-v4-1-flash-1017','minimax-m3-1-flash','longcat-2-5-preview'];
for(const slug of slugs)test(`${slug}: supplemental evidence preserves original SVG, every failure and encoded motion`,async()=>{
 const d=JSON.parse(readFileSync(`public/evaluations/${slug}-supplement.json`));
 assert.equal(d.requestCount,d.trials.length);
 assert.equal(new Set(d.trials.map(a=>a.id+'-'+a.mode+'-'+a.attemptNumber)).size,d.trials.length);
 for(const a of d.trials){
  if(a.renderable){assert.equal(a.status,'done');const raw=readFileSync('public'+a.svgPath);assert.equal(raw.toString(),a.text.match(/<svg\b[\s\S]*?<\/svg\s*>/i)[0]);assert.equal(hash(raw),a.svgSha256);assert.equal(hash(readFileSync('public'+a.pngPath)),a.pngSha256);}
  else assert.ok(a.error||a.renderError);
  if(a.animationRender){const m=await sharp('public'+a.animationRender.path,{animated:true}).metadata();assert.equal(m.pages,40);assert.equal(m.pageHeight,600);assert.equal(m.delay.reduce((x,y)=>x+y,0),4000);assert.equal(hash(readFileSync('public'+a.animationRender.path)),a.animationRender.sha256);assert.ok(a.animationRender.uniqueFrames>=3);}
 }
 for(const g of d.groups)for(const s of g.samples){assert.ok(s.assessmentZh&&s.assessmentEn);if(s.animation&&s.renderable)assert.ok(s.animationRender);if(s.kind==='retry')assert.ok(s.history.length>0);if(s.mode==='low'||s.mode==='max')assert.equal(s.request.reasoning_effort,s.mode);}
 if(!d.pendingAnimation){const g=d.groups.find(g=>g.id==='pelican-animation');assert.ok(g);assert.equal(g.samples.filter(a=>a.animationRender).length,Object.keys(d.modes).length);}else{assert.equal(slug,'longcat-2-5-preview');assert.match(d.publication.summaryEn,/blocked/);}
 if(slug.startsWith('longcat'))assert.deepEqual(Object.keys(d.modes),['disabled','default']);
});
test('SVG extractor permits SMIL only for animation tasks and rejects executable or remote content',()=>{
 const dir=mkdtempSync(join(tmpdir(),'svg-safety-'));const slug='temporary-svg-safety-test';
 try{
  const samples=[
   ['static-animation',false,'<animate attributeName="opacity" values="0;1" dur="1s"/>',false],
   ['allowed-animation',true,'<circle r="10"><animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="4s"/></circle>',true],
   ['script',true,'<script>alert(1)</script>',false],
   ['remote',true,'<use href="https://example.com/x.svg#x"/>',false],
   ['animated-href',true,'<animate attributeName="href" to="javascript:alert(1)"/>',false],
   ['css-import',true,'<style>@import url(https://example.com/font.css);</style>',false]
  ];
  const file=join(dir,'evidence.json');writeFileSync(file,JSON.stringify({attempts:samples.map(([id,animation,body])=>({id,mode:'default',animation,text:`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600">${body}</svg>`}))}));
  const r=spawnSync('python3',['scripts/evaluation/extract.py',file,slug],{encoding:'utf8'});assert.equal(r.status,0,r.stderr);const results=JSON.parse(readFileSync(join(dir,'extracted.json')));assert.deepEqual(results.map(a=>a.renderable),samples.map(a=>a[3]));
 }finally{rmSync(dir,{recursive:true,force:true});rmSync(`public/evaluations/${slug}`,{recursive:true,force:true});}
});

test('evaluation transport streams split SSE and enforces the configured request deadline',async()=>{
 const {createServer}=await import('node:http');const {spawn}=await import('node:child_process');
 const dir=mkdtempSync(join(tmpdir(),'svg-stream-'));let received;
 const server=createServer((req,res)=>{let body='';req.on('data',b=>body+=b);req.on('end',()=>{received=JSON.parse(body);if(received.model==='stall')return;res.writeHead(200,{'Content-Type':'text/event-stream'});res.write('da');setTimeout(()=>{res.write('ta: '+JSON.stringify({model:'test',choices:[{delta:{reasoning_content:'PRIVATE TEST REASONING'},finish_reason:null}]})+'\n\n');res.write('data: '+JSON.stringify({model:'test',choices:[{delta:{content:'<svg></svg>'},finish_reason:'stop'}],usage:{prompt_tokens:3,completion_tokens:5,completion_tokens_details:{reasoning_tokens:2}}})+'\n\n');res.end('data: [DONE]\n\n');},10);});});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 try{
  for(const model of ['test','stall']){
   const cf=join(dir,model+'-config.json'),ef=join(dir,model+'-evidence.json');const config={model,endpoint:`http://127.0.0.1:${server.address().port}`,keyEnv:'VISUAL_TEST_KEY',modes:{low:{reasoning_effort:'low'}},extraBody:{},temperature:0,maxTokens:10,timeoutMs:model==='stall'?50:2000,tasks:[{id:'one',prompt:'Draw SVG'}]};writeFileSync(cf,JSON.stringify(config));
   const exit=await new Promise((resolve,reject)=>{const p=spawn(process.execPath,['scripts/evaluation/run.mjs',cf,ef],{env:{...process.env,VISUAL_TEST_KEY:'fixture-secret-value'},stdio:['ignore','ignore','pipe']});let errors='';p.stderr.on('data',b=>errors+=b);p.on('error',reject);p.on('close',code=>resolve({code,errors}));});assert.equal(exit.code,0,exit.errors);
   const raw=readFileSync(ef,'utf8'),a=JSON.parse(raw).attempts[0];assert.equal(a.transport,'node:http');assert.equal(received.reasoning_effort,'low');assert.doesNotMatch(raw,/fixture-secret-value|PRIVATE TEST REASONING/);
   if(model==='test'){assert.equal(a.status,'done');assert.equal(a.text,'<svg></svg>');assert.equal(a.outputTokens,5);assert.equal(a.reasoningTokens,2);assert.ok(a.firstReasoningMs>0);}else{assert.equal(a.status,'error');assert.match(a.error,/timeout/);assert.ok(a.totalMs<1500);}
  }
 }finally{server.closeAllConnections();await new Promise(r=>server.close(r));rmSync(dir,{recursive:true,force:true});}
});
