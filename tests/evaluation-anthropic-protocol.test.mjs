import test from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {spawn} from 'node:child_process';
import {readFileSync,writeFileSync,mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
test('native Messages runner preserves cumulative usage, exact model and stop state without private thinking',async()=>{
 const dir=mkdtempSync(join(tmpdir(),'anthropic-eval-'));let received;
 const server=createServer((req,res)=>{let body='';req.on('data',b=>body+=b);req.on('end',()=>{
  received={path:req.url,body:JSON.parse(body),headers:req.headers};if(received.body.model==='stall')return;
  res.writeHead(200,{'Content-Type':'text/event-stream'});
  const events=[{type:'message_start',message:{model:received.body.model,usage:{input_tokens:10,cache_creation_input_tokens:2,cache_read_input_tokens:3,output_tokens:0}}},{type:'content_block_delta',index:0,delta:{type:'thinking_delta',thinking:'PRIVATE REASONING SHOULD NOT PERSIST'}},{type:'message_delta',usage:{output_tokens:2}},{type:'content_block_delta',index:1,delta:{type:'text_delta',text:'<svg></svg>'}},{type:'message_delta',delta:{stop_reason:received.body.model==='truncated'?'max_tokens':'end_turn'},usage:{input_tokens:null,output_tokens:5,output_tokens_details:{thinking_tokens:2}}}];
  if(received.body.model!=='incomplete')events.push({type:'message_stop'});
  const wire=events.map(event=>'event: '+event.type+'\ndata: '+JSON.stringify(event)+'\n\n').join('');res.write(wire.slice(0,7));setTimeout(()=>res.end(wire.slice(7)),10);
 });});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 try{
  for(const model of ['native-test','truncated','incomplete','stall']){
   const config={model,protocol:'anthropic-messages',endpoint:`http://127.0.0.1:${server.address().port}/coding`,keyEnv:'ANTHROPIC_FIXTURE_KEY',modes:{low:{output_config:{effort:'low'}}},maxTokens:12288,timeoutMs:model==='stall'?50:2000,tasks:[{id:'one',prompt:'SVG'}]};const cf=join(dir,model+'-config.json'),ef=join(dir,model+'-evidence.json');writeFileSync(cf,JSON.stringify(config));
   const code=await new Promise((resolve,reject)=>{const p=spawn(process.execPath,['scripts/evaluation/run.mjs',cf,ef],{env:{...process.env,ANTHROPIC_FIXTURE_KEY:'fixture-private-key'},stdio:['ignore','ignore','pipe']});let stderr='';p.stderr.on('data',b=>stderr+=b);p.on('error',reject);p.on('close',code=>resolve({code,stderr}));});assert.equal(code.code,0,code.stderr);
   const raw=readFileSync(ef,'utf8'),a=JSON.parse(raw).attempts[0];assert.doesNotMatch(raw,/fixture-private-key|PRIVATE REASONING/);assert.equal(received.path,'/coding/v1/messages');assert.equal(received.headers['x-api-key'],'fixture-private-key');assert.equal(received.headers['anthropic-version'],'2023-06-01');assert.equal(received.headers['user-agent'],undefined);assert.equal(received.headers.authorization,undefined);assert.equal(received.body.temperature,undefined);assert.equal(received.body.stream_options,undefined);assert.equal(received.body.max_tokens,12288);assert.deepEqual(received.body.output_config,{effort:'low'});assert.equal(received.body.thinking,undefined);
   if(model==='stall'){assert.equal(a.status,'error');assert.match(a.error,/timeout/i);assert.ok(a.totalMs<1500);continue;}
   assert.equal(a.text,'<svg></svg>');assert.equal(a.returnedModel,model);assert.equal(a.promptTokens,15);assert.equal(a.outputTokens,5);assert.equal(a.reasoningTokens,2);assert.ok(a.firstReasoningMs>0);assert.ok(a.firstContentMs>=a.firstReasoningMs);
   assert.equal(a.status,model==='truncated'?'truncated':model==='incomplete'?'incomplete':'done');
  }
 }finally{server.closeAllConnections();await new Promise(resolve=>server.close(resolve));rmSync(dir,{recursive:true,force:true});}
});
test('quota exhaustion stops the runner before the next task instead of polling the provider',async()=>{
 const dir=mkdtempSync(join(tmpdir(),'anthropic-quota-'));let requests=0;
 const server=createServer((req,res)=>{requests++;req.resume();res.writeHead(429,{'Content-Type':'application/json'});res.end(JSON.stringify({error:{type:'rate_limit_error',message:"You've reached your 5-hour usage limit. Your quota will reset when the current 5-hour window ends."}}));});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 try{
  const cf=join(dir,'config.json'),ef=join(dir,'evidence.json');writeFileSync(cf,JSON.stringify({model:'test',protocol:'anthropic-messages',endpoint:`http://127.0.0.1:${server.address().port}/coding`,keyEnv:'ANTHROPIC_FIXTURE_KEY',modes:{default:{}},maxTokens:12288,timeoutMs:2000,providerBackoffMs:60000,tasks:[{id:'one',prompt:'first'},{id:'two',prompt:'must not dispatch'}]}));
  const started=performance.now();const result=await new Promise((resolve,reject)=>{const p=spawn(process.execPath,['scripts/evaluation/run.mjs',cf,ef],{env:{...process.env,ANTHROPIC_FIXTURE_KEY:'fixture-private-key'},stdio:['ignore','ignore','pipe']});let stderr='';p.stderr.on('data',b=>stderr+=b);p.on('error',reject);p.on('close',code=>resolve({code,stderr}));});assert.notEqual(result.code,0);assert.match(result.stderr,/quota exhausted/);assert.ok(performance.now()-started<2000);assert.equal(requests,1);const evidence=JSON.parse(readFileSync(ef));assert.equal(evidence.attempts.length,1);assert.equal(evidence.attempts[0].httpStatus,429);
 }finally{server.closeAllConnections();await new Promise(resolve=>server.close(resolve));rmSync(dir,{recursive:true,force:true});}
});
