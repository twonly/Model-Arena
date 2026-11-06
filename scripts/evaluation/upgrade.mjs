// Incremental batches keep all original evidence immutable. Every retry has its own request file.
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {spawn} from 'node:child_process';
import cases from './cases.mjs';
const vendor=process.argv[2];
const slugs={deepseek:'deepseek-v4-1-flash-1017',minimax:'minimax-m3-1-flash',longcat:'longcat-2-5-preview'};
const slug=slugs[vendor];if(!slug)throw Error('Unknown vendor');
const root=`output/visual-upgrade/${vendor}`;await mkdir(root,{recursive:true});
const original=JSON.parse(await readFile(`public/evaluations/${slug}-visual.json`));
const base=vendor==='minimax'?{model:'MiniMax-M3.1-Flash',endpoint:'https://api.minimax.io/v1',keyEnv:'SHARED_KEY_MINIMAX',extraBody:{reasoning_split:true},temperature:0,maxTokens:12288,timeoutMs:600000}:JSON.parse(await readFile(`scripts/evaluation/${vendor==='deepseek'?'deepseek-1017':'longcat-2-5-preview'}.json`));
base.timeoutMs=600000;
const modes=vendor==='deepseek'?{disabled:{thinking:{type:'disabled'}},default:{thinking:{type:'enabled'}},low:{thinking:{type:'enabled'},reasoning_effort:'low'},max:{thinking:{type:'enabled'},reasoning_effort:'max'}}:vendor==='minimax'?{low:{reasoning_effort:'low'},max:{reasoning_effort:'max'}}:{default:{thinking:{type:'enabled'}},disabled:{thinking:{type:'disabled'}}};
import animation from './animation-case.mjs';
const jobs=[];
for(const a of original.attempts.filter(a=>!a.pngPath))jobs.push({task:cases.find(c=>c.id===a.id),mode:a.mode,kind:'retry',previousAttempts:1});
for(const mode of vendor==='deepseek'?['low','max']:vendor==='minimax'?['max']:[])for(const task of cases)jobs.push({task,mode,kind:'effort',previousAttempts:0});
for(const mode of Object.keys(modes))jobs.push({task:animation,mode,kind:'animation',previousAttempts:0});
function command(bin,args){return new Promise((resolve,reject)=>{const p=spawn(bin,args,{stdio:['ignore','pipe','pipe']});let out='';p.stdout.on('data',b=>out+=b);p.stderr.on('data',b=>out+=b);p.on('close',code=>code?reject(Error(out.slice(-3000))):resolve(out));});}
for(const job of jobs){
 for(let n=1;;n++){
  const dir=`${root}/${job.task.id}-${job.mode}-${n}`;await mkdir(dir,{recursive:true});
  let cached;try{cached=JSON.parse(await readFile(`${dir}/result.json`));}catch{}
  if(cached){if(cached.renderable&&cached.status==='done'&&(!cached.animation||cached.animationRender))break;continue;}
  let cfg={...base,maxTokens:n>2&&vendor==='deepseek'?65536:n>1?32768:12288,modes:{[job.mode]:modes[job.mode]},tasks:[job.task],method:'Supplemental batch: repeat failed rendering until first valid render, preserving every attempt. Timeout configured to 600s; exact token budget recorded per request. No manual source repair.'};
  try{cfg=JSON.parse(await readFile(`${dir}/config.json`));}catch{}
  await writeFile(`${dir}/config.json`,JSON.stringify(cfg,null,2));
  await command(process.execPath,['scripts/evaluation/run.mjs',`${dir}/config.json`,`${dir}/evidence.json`]);
  await command('python3',['scripts/evaluation/extract.py',`${dir}/evidence.json`,`${slug}-supplement-${job.task.id}-${job.mode}-${n}`]);
  await command(process.execPath,['scripts/evaluation/render.mjs',`${dir}/extracted.json`,`${dir}/rendered.json`]);
  const e=JSON.parse(await readFile(`${dir}/evidence.json`));const r=JSON.parse(await readFile(`${dir}/rendered.json`))[0];
  const result={...e.attempts[0],...r,id:job.task.id,mode:job.mode,kind:job.kind,attemptNumber:n+job.previousAttempts,timeoutMs:600000};
  await writeFile(`${dir}/result.json`,JSON.stringify(result,null,2));
  if(result.animation&&r.renderable){try{await command(process.execPath,['scripts/evaluation/animate.mjs',`${dir}/result.json`]);}catch(error){r.renderable=false;result.renderable=false;result.renderError='Animation render failed: '+error.message;await writeFile(`${dir}/result.json`,JSON.stringify(result,null,2));}}
  console.log(JSON.stringify({vendor,id:job.task.id,mode:job.mode,attempt:n,status:result.status,renderable:r.renderable,error:result.error||r.renderError}));
  if(result.httpStatus===400||result.httpStatus===401||result.httpStatus===402||result.httpStatus===403||result.httpStatus===429)throw Error('Provider access or quota blocker; evidence retained');
  if(r.renderable&&result.status==='done')break;
  if(result.httpStatus>=500||result.status==='error'){console.log('Provider unavailable; backing off 60 seconds');await new Promise(r=>setTimeout(r,60000));}
  else await new Promise(r=>setTimeout(r,2000));
 }
}
console.log(vendor+' complete');
