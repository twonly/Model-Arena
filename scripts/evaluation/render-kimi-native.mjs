import {readFile,writeFile,mkdir,readdir} from 'node:fs/promises';
import {spawn} from 'node:child_process';
const root='output/kimi-k3-1-pro-anthro-20261024';
const command=(bin,args)=>new Promise((resolve,reject)=>{const p=spawn(bin,args,{stdio:['ignore','pipe','pipe']});let out='';p.stdout.on('data',b=>out+=b);p.stderr.on('data',b=>out+=b);p.on('close',code=>code?reject(Error(out.slice(-3000))):resolve(out));});
const write=(path,data)=>writeFile(path,JSON.stringify(data,null,2)+'\n');
const sources=[];
if(process.argv[2])sources.push(process.argv[2]);else for(const mode of ['default','low','max'])sources.push(`${root}/first-${mode}/evidence.json`);
const index=[];
for(const source of sources){
 let evidence;try{evidence=JSON.parse(await readFile(source));}catch(error){if(error.code==='ENOENT')continue;throw error;}
 for(const a of evidence.attempts.filter(a=>['pelican','clock','dashboard','poster','pelican-animation'].includes(a.id)&&a.status!=='interrupted')){
  const attemptNumber=evidence.attemptNumber??1;
  const dir=`${root}/render/${a.id}-${a.mode}-${attemptNumber}`;
  await mkdir(dir,{recursive:true});
  let result;try{result=JSON.parse(await readFile(`${dir}/result.json`));}catch{}
  if(!result){
   await write(`${dir}/evidence.json`,{...evidence,attempts:[a]});
   await command('python3',['scripts/evaluation/extract.py',`${dir}/evidence.json`,`kimi-k3-1-pro-anthropic-${a.id}-${a.mode}-${attemptNumber}`]);
   await command(process.execPath,['scripts/evaluation/render.mjs',`${dir}/extracted.json`,`${dir}/rendered.json`]);
   result={...a,...JSON.parse(await readFile(`${dir}/rendered.json`))[0],id:a.id,attemptNumber,kind:attemptNumber>1?'retry':a.animation?'animation':'static',sourceEvidence:'/evaluations/kimi-k3-1-pro-anthropic-first.json',localEvidence:source,timeoutMs:evidence.timeoutMs};
   await write(`${dir}/result.json`,result);
   if(result.animation&&result.renderable){
    try{await command(process.execPath,['scripts/evaluation/animate.mjs',`${dir}/result.json`]);result=JSON.parse(await readFile(`${dir}/result.json`));}
    catch(error){result.renderable=false;result.renderError='Animation capture failed: '+error.message;await write(`${dir}/result.json`,result);}
   }
   console.log(JSON.stringify({id:result.id,mode:result.mode,status:result.status,renderable:result.renderable,animation:!!result.animationRender,attemptNumber,error:result.error||result.renderError}));
  }
  index.push({...result,resultPath:`${dir}/result.json`});
 }
}
const allResults=[];
for(const name of await readdir(`${root}/render`))try{allResults.push({...JSON.parse(await readFile(`${root}/render/${name}/result.json`)),resultPath:`${root}/render/${name}/result.json`});}catch(error){if(error.code!=='ENOENT')throw error;}
await write(`${root}/render-index.json`,allResults);
