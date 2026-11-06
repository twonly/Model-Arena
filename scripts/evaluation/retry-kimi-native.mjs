// Independent same-prompt retries use the first free mode slot; no feedback or source repair.
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {spawn} from 'node:child_process';
const root='output/kimi-k3-1-pro-anthro-20261024';
const read=async file=>JSON.parse(await readFile(file,'utf8'));
const write=(file,data)=>writeFile(file,JSON.stringify(data,null,2)+'\n');
const command=(bin,args)=>new Promise((resolve,reject)=>{const p=spawn(bin,args,{stdio:['ignore','pipe','pipe']});let out='';p.stdout.on('data',b=>{out+=b;process.stdout.write(b);});p.stderr.on('data',b=>{out+=b;process.stderr.write(b);});p.on('close',code=>code?reject(Error(out.slice(-2000))):resolve());});
const base=await read('scripts/evaluation/kimi-k3-1-pro-anthropic.json');
for(;;){
 const batches=await Promise.all(['default','low','max'].map(mode=>read(`${root}/first-${mode}/evidence.json`)));
 if(batches.some(b=>b.attempts.some(a=>[400,401,402,403].includes(a.httpStatus))))throw Error('Access blocker in original batch; do not retry');
 if(batches.some(b=>b.attempts.length===23&&b.attempts.at(-1).status!=='interrupted'))break;
 await new Promise(resolve=>setTimeout(resolve,20000));
}
const disabledConfig=`${root}/probe-effort/disabled-config.json`,disabledEvidence=`${root}/probe-effort/disabled-evidence.json`;
await command(process.execPath,['scripts/evaluation/run.mjs',disabledConfig,disabledEvidence]);
const invalidConfig=`${root}/probe-effort/invalid-config.json`,invalidEvidence=`${root}/probe-effort/invalid-evidence.json`;
await write(invalidConfig,{...base,stopOnAccessErrors:false,providerBackoffMs:0,maxTokens:1024,modes:{invalid:{output_config:{effort:'invalid-evaluation-probe'}}},tasks:[{id:'invalid-effort-probe',prompt:'Reply exactly: NATIVE_INVALID_EFFORT_PROBE'}]});
await command(process.execPath,['scripts/evaluation/run.mjs',invalidConfig,invalidEvidence]);
for(;;){
 await command(process.execPath,['scripts/evaluation/render-kimi-native.mjs']);
 const batches=await Promise.all(['default','low','max'].map(mode=>read(`${root}/first-${mode}/evidence.json`)));
 const firstComplete=batches.every(b=>b.attempts.length===23&&b.attempts.at(-1).status!=='interrupted');
 const index=await read(`${root}/render-index.json`);
 const failed=index.filter(a=>a.attemptNumber===1&&(!a.renderable||a.status!=='done'));
 for(const original of failed){
  if(index.some(a=>a.id===original.id&&a.mode===original.mode&&a.renderable&&a.status==='done'&&(!a.animation||a.animationRender)))continue;
  for(let n=2;;n++){
   const dir=`${root}/retry/${original.id}-${original.mode}-${n}`;await mkdir(dir,{recursive:true});
   const config={...base,maxTokens:32768,modes:{[original.mode]:base.modes[original.mode]},tasks:[base.tasks.find(t=>t.id===original.id)],attemptNumber:n};
   let existing;try{existing=await read(`${dir}/config.json`);}catch{}
   if(existing&&JSON.stringify(existing)!==JSON.stringify(config))throw Error('Retry configuration changed; use a new evidence path');
   if(!existing)await write(`${dir}/config.json`,config);
   await command(process.execPath,['scripts/evaluation/run.mjs',`${dir}/config.json`,`${dir}/evidence.json`]);
   await command(process.execPath,['scripts/evaluation/render-kimi-native.mjs',`${dir}/evidence.json`]);
   const result=await read(`${root}/render/${original.id}-${original.mode}-${n}/result.json`);
   if(result.renderable&&result.status==='done'&&(!result.animation||result.animationRender))break;
  }
 }
 const latest=await read(`${root}/render-index.json`);
 if(firstComplete&&latest.filter(a=>a.attemptNumber===1).length===15&&failed.every(a=>latest.some(r=>r.id===a.id&&r.mode===a.mode&&r.renderable&&r.status==='done'&&(!r.animation||r.animationRender))))break;
 await new Promise(resolve=>setTimeout(resolve,20000));
}
console.log('All native original visual requests and first successful retries are rendered');
