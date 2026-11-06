// Complete only unfulfilled task/mode slots. Sequential requests; all attempts immutable.
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {spawn} from 'node:child_process';
const root='output/kimi-k3-1-pro-resume-20261024-1';
const read=async p=>JSON.parse(await readFile(p,'utf8'));
const base=await read('scripts/evaluation/kimi-k3-1-pro-anthropic.json');
const original=await read('public/evaluations/kimi-k3-1-pro-anthropic-first.json');
const visual=await read('public/evaluations/kimi-k3-1-pro-supplement.json');
const order=[{id:'pelican-animation',mode:'default'},...['code-dedupe','code-intervals'].map(id=>({id,mode:'max'})),...base.tasks.filter(t=>t.category&&!t.animation).map(t=>({id:t.id,mode:'default'}))];
const method='Independent recovery batch, local macOS client; serialized native Anthropic Messages requests to https://api.kimi.com/coding/v1/messages. Exact returned model must be k3.1-pro. Original prompt unchanged, no feedback or source edits. Existing successful slots are not rerun. Effort omitted for default: current model configuration documentation says high while the overview says max; actual server effort is not independently verified. Explicit max uses output_config.effort; parameter semantics remain unverified. Baselines start at max_tokens=12288; a previously truncated animation retries at 32768; budget includes thinking and final. Temperature/top_p omitted; no independent thinking budget. Coding Plan subscription quota, no metered invoice. Every HTTP429 stops dispatch; network/5xx errors back off at least 60 seconds.';
const plan=order.map((slot,i)=>{
 const existing=original.attempts.filter(a=>a.id===slot.id&&a.mode===slot.mode);
 const successful=slot.id==='pelican-animation'?visual.groups.find(g=>g.id===slot.id)?.samples.some(a=>a.mode===slot.mode&&a.status==='done'&&a.animationRender):existing.some(a=>a.status==='done');
 if(successful)throw Error('Refusing to rerun successful slot '+slot.id+' '+slot.mode);
 return {...slot,sequence:i+1,initialAttemptNumber:existing.length+1,previousSource:'/evaluations/kimi-k3-1-pro-anthropic-first.json',reason:existing.length?'Prior request did not complete':'Not dispatched before quota exhaustion'};
});
if(plan.length!==21)throw Error('Unexpected recovery plan');
await mkdir(root,{recursive:true});
try{const saved=await read(root+'/plan.json');if(JSON.stringify(saved.slots)!==JSON.stringify(plan))throw Error('Recovery plan changed');}catch(error){if(error.code!=='ENOENT')throw error;await writeFile(root+'/plan.json',JSON.stringify({createdAt:new Date().toISOString(),plannedRecoverySlots:plan.length,method,slots:plan},null,2)+'\n',{flag:'wx'});}
const command=(args)=>new Promise(resolve=>{const child=spawn(process.execPath,args,{stdio:['ignore','pipe','pipe']});child.stdout.on('data',b=>process.stdout.write(b));child.stderr.on('data',b=>process.stderr.write(b));child.on('error',e=>resolve({code:-1,error:e.message}));child.on('close',code=>resolve({code}));});
const dispatchQueue=[...plan];
for(const slot of dispatchQueue){
 for(let n=slot.initialAttemptNumber;;n++){
  const dir=`${root}/requests/${String(slot.sequence).padStart(2,'0')}-${slot.id}-${slot.mode}-attempt-${n}`;await mkdir(dir,{recursive:true});
  let config;try{config=await read(dir+'/config.json');}catch(error){if(error.code!=='ENOENT')throw error;let previousAttempt=null;if(slot.id==='pelican-animation'&&n>=4){try{previousAttempt=(await read(`${root}/requests/${String(slot.sequence).padStart(2,'0')}-${slot.id}-${slot.mode}-attempt-${n-1}/evidence.json`)).attempts[0];}catch(error){if(error.code!=='ENOENT')throw error;}}const timeoutMs=previousAttempt&&/timeout/i.test(previousAttempt.error??'')?900000:base.timeoutMs;config={...base,modes:{[slot.mode]:base.modes[slot.mode]},tasks:[base.tasks.find(t=>t.id===slot.id)],attemptNumber:n,maxTokens:slot.id==='pelican-animation'||n>slot.initialAttemptNumber?32768:12288,timeoutMs,providerBackoffMs:60000,stopOnRateLimit:true,method:method+(timeoutMs===900000?' Independent retry after a previous 600-second timeout; deadline raised to 900 seconds with token budget unchanged at 32,768. This is not a same-condition first attempt.':'')};await writeFile(dir+'/config.json',JSON.stringify(config,null,2)+'\n',{flag:'wx'});}
  let evidence;try{evidence=await read(dir+'/evidence.json');}catch(error){if(error.code!=='ENOENT')throw error;}
  if(evidence?.attempts[0]?.status==='interrupted')throw Error('An unresolved request exists; wait for it before restarting controller');
  if(!evidence?.attempts.length){await command(['scripts/evaluation/run.mjs',dir+'/config.json',dir+'/evidence.json']);evidence=await read(dir+'/evidence.json');}
  const a=evidence.attempts[0];if(!a)throw Error('Request slot was not recorded');
  if(a.httpStatus===429||[400,401,402,403].includes(a.httpStatus)){await command(['--experimental-strip-types','scripts/evaluation/assemble-kimi-resume.mjs']);throw Error('Provider access/rate blocker; all new dispatches stopped');}
  if(a.httpStatus===200&&a.returnedModel!=='k3.1-pro')throw Error('Missing or unexpected model identity; stop');
  if(a.status==='interrupted')throw Error('Unresolved interrupted request; stop');
  if(slot.id==='pelican-animation'){
   await command(['scripts/evaluation/render-kimi-resume.mjs',dir+'/evidence.json']);
   await command(['--experimental-strip-types','scripts/evaluation/assemble-kimi-resume.mjs']);
   const result=await read(dir+'/render/result.json');if(result.status==='done'&&result.renderable&&result.animationRender)break;
   if(a.status==='truncated')await new Promise(resolve=>setTimeout(resolve,60000));
   if(!slot.deferred){dispatchQueue.push({...slot,initialAttemptNumber:n+1,deferred:true});break;}
  }else {await command(['--experimental-strip-types','scripts/evaluation/assemble-kimi-resume.mjs']);if(a.status==='done')break;}
  // run.mjs already waits >=60 seconds after network/server errors.
 }
}
await writeFile(root+'/dispatch-complete.json',JSON.stringify({finishedAt:new Date().toISOString(),plannedRecoverySlots:plan.length,status:'responses-complete'},null,2)+'\n',{flag:'wx'});
await command(['--experimental-strip-types','scripts/evaluation/assemble-kimi-resume.mjs']);
console.log('Recovery responses complete; visual inspection and public assembly still required.');
