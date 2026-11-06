// Render one independent recovery request without changing earlier evidence or assets.
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {dirname} from 'node:path';
import {spawn} from 'node:child_process';
const source=process.argv[2];
if(!source)throw Error('Usage: node scripts/evaluation/render-kimi-resume.mjs EVIDENCE');
const evidence=JSON.parse(await readFile(source,'utf8'));
if(evidence.attempts.length!==1||!evidence.attempts[0].animation)throw Error('One animation response required');
const a=evidence.attempts[0],attemptNumber=evidence.attemptNumber;
if(!Number.isInteger(attemptNumber))throw Error('Explicit attempt number required');
const dir=dirname(source)+'/render';await mkdir(dir,{recursive:true});
const file=dir+'/result.json';
try{JSON.parse(await readFile(file,'utf8'));console.log(file);process.exit(0);}catch(error){if(error.code!=='ENOENT')throw error;}
const command=(bin,args)=>new Promise((resolve,reject)=>{const child=spawn(bin,args,{stdio:['ignore','pipe','pipe']});let out='';child.stdout.on('data',b=>out+=b);child.stderr.on('data',b=>out+=b);child.on('error',reject);child.on('close',code=>code?reject(Error(out.slice(-3000))):resolve(out));});
await writeFile(dir+'/evidence.json',JSON.stringify(evidence,null,2)+'\n');
const slug=`kimi-k3-1-pro-resume-20261024-${a.id}-${a.mode}-${attemptNumber}`;
await command('python3',['scripts/evaluation/extract.py',dir+'/evidence.json',slug]);
await command(process.execPath,['scripts/evaluation/render.mjs',dir+'/extracted.json',dir+'/rendered.json']);
let result={...a,...JSON.parse(await readFile(dir+'/rendered.json','utf8'))[0],id:a.id,attemptNumber,kind:'recovery',sourceEvidence:'/evaluations/kimi-k3-1-pro-resume-20261024.json',localEvidence:source,timeoutMs:evidence.timeoutMs};
await writeFile(file,JSON.stringify(result,null,2)+'\n');
if(result.status==='done'&&result.renderable){
 try{await command(process.execPath,['scripts/evaluation/animate.mjs',file]);result=JSON.parse(await readFile(file,'utf8'));}
 catch(error){result.renderable=false;result.renderError='Animation capture failed: '+error.message;await writeFile(file,JSON.stringify(result,null,2)+'\n');}
}
console.log(JSON.stringify({file,status:result.status,renderable:result.renderable,animation:!!result.animationRender,attemptNumber}));
