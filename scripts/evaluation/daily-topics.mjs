#!/usr/bin/env node
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {evaluationDate,loadTopics,lockTopics,creationSuite,VIDEO_IDS} from './creation-suite.mjs';

const args=process.argv.slice(2),command=args.shift(),positional=args[0]&&!args[0].startsWith('--')?args.shift():null,opts={};
while(args.length){const k=args.shift(),v=args.shift();if(!['--repo','--date','--out','--model','--harness','--skill'].includes(k)||!v)throw Error('Unknown or missing option: '+k);opts[k]=v;}
const repo=resolve(opts['--repo']??process.cwd()),date=opts['--date']??evaluationDate();
if(command==='template') {
 console.log(JSON.stringify({date,topics:Array.from({length:4},(_,i)=>({id:`topic-${i+1}`,titleZh:'',titleEn:'',question:'',hook:'',visualIdea:'',facts:[],sources:[{url:'',title:'',publisher:'',publishedAt:null,accessedAt:date}]}))},null,2));
} else if(command==='lock') {
 const draft=JSON.parse(await readFile(resolve(positional),'utf8'));
 if(opts['--date']&&draft.date!==date)throw Error('Draft and requested dates differ');
 const r=await lockTopics(repo,draft);console.log(JSON.stringify({path:r.path,date:draft.date,topicSetSha256:r.topicSet.contentSha256,reused:r.reused,modelCalls:0}));
} else if(command==='show') {
 const t=await loadTopics(repo,date);console.log(JSON.stringify({date,sha256:t.contentSha256,topics:t.topics.map((t,i)=>({caseId:VIDEO_IDS[i],title:t.titleZh,question:t.question}))},null,2));
} else if(command==='prepare-open-topic') {
 if(!opts['--out']||!opts['--model'])throw Error('prepare-open-topic needs --out and --model');
 const skillRoot=resolve(opts['--skill']??'/Users/hongxin/.agents/skills/tokrace-harness-eval');
 const suite=await creationSuite({repoRoot:repo,skillRoot,date,caseIds:VIDEO_IDS});
 const out=resolve(opts['--out']);await mkdir(out,{recursive:false});
 for(const id of VIDEO_IDS){const c=suite.cases.find(c=>c.id===id),dir=join(out,id);await mkdir(join(dir,'work'),{recursive:true});await writeFile(join(dir,'prompt.txt'),c.prompt+'\n直接在当前 harness 会话制作，不调用其它生成模型。保存 video.mp4、源码、narration.txt、captions.srt、sources.md、notes.md。\n',{flag:'wx'});await writeFile(join(dir,'case.json'),JSON.stringify({...c,caseSpecSha256:(await import('./creation-suite.mjs')).sha256(c.prompt)},null,2)+'\n',{flag:'wx'});}
 await writeFile(join(out,'batch.json'),JSON.stringify({policyVersion:suite.policyVersion,evaluationDate:date,topicSetSha256:suite.topicSetSha256,model:opts['--model'],harness:opts['--harness']??'current-codex-session',caseIds:VIDEO_IDS,audioMode:'narration'},null,2)+'\n',{flag:'wx'});
 console.log(JSON.stringify({batchDir:out,caseIds:VIDEO_IDS,topicSetSha256:suite.topicSetSha256,modelCalls:0}));
} else throw Error('Use template | lock DRAFT.json | show | prepare-open-topic; --date uses Asia/Shanghai.');
