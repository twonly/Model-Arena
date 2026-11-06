import {readFile,writeFile} from 'node:fs/promises';
import {request as httpsRequest} from 'node:https';
import {request as httpRequest} from 'node:http';
import {Readable} from 'node:stream';

// Native request uses the configured deadline, avoiding fetch's independent 300s header timeout.
function postStream(url,headers,body,signal){
 return new Promise((resolve,reject)=>{
  const send=url.startsWith('https:')?httpsRequest:httpRequest;
  const payload=JSON.stringify(body);
  const req=send(url,{method:'POST',headers:{...headers,'Content-Length':Buffer.byteLength(payload)},signal},res=>{
   resolve(new Response(Readable.toWeb(res),{status:res.statusCode,headers:res.headers}));
  });
  req.once('error',reject);req.end(payload);
 });
}
import env from '@next/env';
import baselineCases, {version as visualVersion} from './cases-v2.mjs';
import historicalCases from './cases.mjs';
env.loadEnvConfig(process.cwd());
import {mkdir} from 'node:fs/promises';
import {dirname} from 'node:path';
import {createHash} from 'node:crypto';
const config=JSON.parse(await readFile(process.argv[2], 'utf8'));
const anthropic=config.protocol==='anthropic-messages';
let cases=config.tasks??baselineCases;
if(!config.model || !config.endpoint || !config.modes || !Object.keys(config.modes).length)throw Error('Model, endpoint and at least one mode are required');
for(const body of [config.extraBody??{},...Object.values(config.modes)]){
 for(const field of ['model','messages','temperature','max_tokens','stream','stream_options']){
  if(field in body)throw Error(`Extra parameters cannot override ${field}`);
 }
}
const key=process.env[config.keyEnv];if(!key)throw Error('Missing configured server key');
const file=process.argv[3];if(!file)throw Error('Usage: node scripts/evaluation/run.mjs CONFIG OUTPUT');
await mkdir(dirname(file),{recursive:true});
let evidence;
try { evidence=JSON.parse(await readFile(file,'utf8')); }
catch(e) { if(e.code!=='ENOENT')throw e; }
const identityFor=tasks=>createHash('sha256').update(JSON.stringify({config,cases:tasks})).digest('hex');
if(!config.tasks&&evidence){
 if(evidence.tasks)cases=evidence.tasks;
 else if(evidence.identity===identityFor(historicalCases))cases=historicalCases;
}
const identity=identityFor(cases);
if(evidence && evidence.identity!==identity)throw Error('Refusing to mix different configurations or prompts in one evidence file');
evidence??={...config,identity,tasks:cases,attempts:[],suiteVersion:config.suiteVersion??(config.tasks?'custom-visual':visualVersion)};
const modes=Object.keys(config.modes);
async function save(){const raw=JSON.stringify(evidence,null,2);if(raw.includes(key))throw Error('Secret in evidence');await writeFile(file,raw+'\n');}
async function call(prompt,maxTokens,mode){
 const request={model:evidence.model,messages:[{role:'user',content:prompt}],temperature:config.temperature,max_tokens:maxTokens,stream:true,...(anthropic?{}:{stream_options:{include_usage:true}}),...config.extraBody,...evidence.modes[mode]};
 const a={request,startedAt:new Date().toISOString(),text:'',firstContentMs:null,firstReasoningMs:null,firstEventMs:null,usage:null,finishReason:null,error:null,returnedModel:null,status:'error',httpStatus:null};
 const start=performance.now();let done=false;const deadline=AbortSignal.timeout(config.timeoutMs);
 a.transport=evidence.endpoint.startsWith('https:')?'node:https':'node:http';
 try{
  const url=anthropic?evidence.endpoint.replace(/\/$/,'')+'/v1/messages':evidence.endpoint+'/chat/completions';
  const headers=anthropic?{'x-api-key':key,'anthropic-version':'2023-06-01','Content-Type':'application/json'}:{Authorization:`Bearer ${key}`,'Content-Type':'application/json'};
  const res=await postStream(url,headers,request,deadline);
  a.httpStatus=res.status;if(!res.ok)throw Error(`HTTP ${res.status}: ${(await res.text()).slice(0,1500)}`);
  const reader=res.body.getReader(),decoder=new TextDecoder();let buffer='';
  while(true){const chunk=await reader.read();if(chunk.done)break;buffer+=decoder.decode(chunk.value,{stream:true});let n;
   while((n=buffer.indexOf('\n'))>=0){const line=buffer.slice(0,n).trim();buffer=buffer.slice(n+1);if(!line.startsWith('data:'))continue;const data=line.slice(5).trim();if(data==='[DONE]'){done=true;continue;}if(!data)continue;const o=JSON.parse(data);if(o.error)throw Error(JSON.stringify(o.error));if(o.base_resp?.status_code)throw Error(JSON.stringify(o.base_resp));
    if(anthropic){
     if(o.type==='message_start'){a.returnedModel=o.message?.model??a.returnedModel;a.usage={...a.usage,...o.message?.usage};}
     if(o.usage)a.usage={...a.usage,...Object.fromEntries(Object.entries(o.usage).filter(([,v])=>v!=null))};
     if(o.type==='content_block_start'&&o.content_block?.type==='text'&&o.content_block.text){a.firstEventMs??=performance.now()-start;a.firstContentMs??=performance.now()-start;a.text+=o.content_block.text;}
     if(o.type==='content_block_delta'){
      const d=o.delta??{};
      if(d.type==='text_delta'&&d.text){a.firstEventMs??=performance.now()-start;a.firstContentMs??=performance.now()-start;a.text+=d.text;}
      if(d.type==='thinking_delta'&&d.thinking){a.firstEventMs??=performance.now()-start;a.firstReasoningMs??=performance.now()-start;}
     }
     if(o.type==='message_delta'&&o.delta?.stop_reason)a.finishReason=o.delta.stop_reason;
     if(o.type==='message_stop')done=true;
     continue;
    }
    a.returnedModel=o.model??a.returnedModel;if(o.usage)a.usage=o.usage;
    for(const c of o.choices??[]){if(c.finish_reason)a.finishReason=c.finish_reason;const d=c.delta??{};if(d.content){a.firstEventMs??=performance.now()-start;a.firstContentMs??=performance.now()-start;a.text+=d.content;}if(d.reasoning_content){a.firstEventMs??=performance.now()-start;a.firstReasoningMs??=performance.now()-start;}}
   }
  }
  a.status=['length','max_tokens'].includes(a.finishReason)?'truncated':done&&['stop','end_turn'].includes(a.finishReason)?'done':'incomplete';
 }catch(e){a.error=String(deadline.aborted?deadline.reason.message:e.message).replaceAll(key,'[redacted]');a.errorCode=e.cause?.code??e.code??null;}
 a.finishedAt=new Date().toISOString();a.totalMs=performance.now()-start;
 a.promptTokens=anthropic&&a.usage?.input_tokens!=null?a.usage.input_tokens+(a.usage.cache_read_input_tokens??0)+(a.usage.cache_creation_input_tokens??0):a.usage?.prompt_tokens??null;
 a.outputTokens=anthropic?a.usage?.output_tokens??null:a.usage?.completion_tokens??null;
 a.reasoningTokens=anthropic?a.usage?.output_tokens_details?.thinking_tokens??null:a.usage?.completion_tokens_details?.reasoning_tokens??null;
 return a;
}
for(const [i,c] of cases.entries())for(const mode of i%2?[...modes].reverse():modes){
 if(evidence.attempts.some(a=>a.id===c.id&&a.mode===mode))continue;
 // Persist before dispatch: an interrupted request must never be silently rerun.
 const slot={...c,mode,status:'interrupted',text:'',startedAt:new Date().toISOString()};
 evidence.attempts.push(slot);await save();
 Object.assign(slot,await call(c.prompt,config.maxTokens,mode));await save();
 console.log(JSON.stringify({id:c.id,mode,status:slot.status,totalMs:Math.round(slot.totalMs),outputTokens:slot.outputTokens,error:slot.error}));
 if(config.expectedReturnedModel&&slot.httpStatus===200&&slot.returnedModel!==config.expectedReturnedModel)throw Error('Returned model differs from required identity or is missing; evidence preserved');
 if(config.stopOnAccessErrors&&[400,401,402,403].includes(slot.httpStatus))throw Error('Provider rejected access or parameters; evidence preserved');
 if(config.stopOnRateLimit&&slot.httpStatus===429)throw Error('Provider rate limit reached; no further requests dispatched');
 if(slot.httpStatus===429&&/5-hour usage limit|quota.{0,40}(?:exhausted|depleted)/i.test(slot.error??''))throw Error('Provider quota exhausted; no further requests dispatched');
 if(config.providerBackoffMs&&(slot.status==='error'||slot.httpStatus===429||slot.httpStatus>=500))await new Promise(r=>setTimeout(r,Math.max(60000,config.providerBackoffMs)));
}
