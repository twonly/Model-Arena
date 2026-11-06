import {readFile, writeFile, mkdir, link, unlink} from 'node:fs/promises';
import {join, resolve} from 'node:path';
import {createHash, randomUUID} from 'node:crypto';
import {homedir} from 'node:os';
import visuals from './cases.mjs';
import animation from './animation-case.mjs';
import creatorCases,{creatorBookshelf} from './creator-cases.mjs';

export const POLICY_VERSION = 'creative-suite-v6';
export const PREVIOUS_CREATOR_VERSION = 'creative-suite-v5';
export const LEGACY_POLICY_VERSION = 'creative-suite-v4';
export const CREATOR_IDS = ['creator-handheld','creator-web3d','creator-webapp','svg-dashboard','creator-spot-difference'];
export const isCreatorVersion = version => version === POLICY_VERSION || version === PREVIOUS_CREATOR_VERSION;
export const BLENDER_STANDARD = ['bookshelf', 'planetary-reducer', 'two-bedroom-interior'];
export const BLENDER_EXTENDED = [...BLENDER_STANDARD, 'horizontal-steam-engine', 'temple-courtyard', 'jupiter-drydock'];
export const VIDEO_IDS = ['knowledge-1', 'knowledge-2', 'knowledge-3', 'knowledge-4'];
export const SVG_IDS = ['svg-clock', 'svg-dashboard', 'svg-poster', 'svg-pelican-animation'];
export const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
export function evaluationDate(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {timeZone:'Asia/Shanghai',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(now);
  return ['year','month','day'].map(k=>parts.find(p=>p.type===k).value).join('-');
}
export function defaultCases(profile = 'creator') {
  if (profile === 'creator') return [...CREATOR_IDS];
  if (!['standard','quick','extended'].includes(profile)) throw Error('Profile must be creator, standard, quick or extended');
  const blender = profile === 'extended' ? BLENDER_EXTENDED : profile === 'quick' ? ['bookshelf','two-bedroom-interior'] : BLENDER_STANDARD;
  return [...blender, ...VIDEO_IDS, ...SVG_IDS];
}
export function topicPath(repo, date) { return join(repo,'content/evaluation-topicsets',date,'topic-set.json'); }
export function validateTopics(draft, date = draft.date) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(Date.parse(date+'T00:00:00Z')) || new Date(date+'T00:00:00Z').toISOString().slice(0,10)!==date || draft.date !== date) throw Error('Topic date must match the evaluation date');
  if (!Array.isArray(draft.topics) || draft.topics.length !== 4) throw Error('A daily set needs exactly four knowledge topics');
  const ids = new Set();
  for (const t of draft.topics) {
    for (const k of ['id','titleZh','titleEn','question','hook','visualIdea']) if (typeof t[k] !== 'string' || !t[k].trim()) throw Error('Missing topic field: '+k);
    if (ids.has(t.id)) throw Error('Duplicate topic ID'); ids.add(t.id);
    if (!Array.isArray(t.facts) || t.facts.length < 3 || t.facts.some(f=>typeof f!=='string'||!f.trim())) throw Error('Each topic needs at least three source-checked facts');
    if (!Array.isArray(t.sources) || !t.sources.length) throw Error('Each topic needs source attribution');
    for (const s of t.sources) {
      if (!s.title || !s.publisher || !s.accessedAt || !/^https?:$/.test(new URL(s.url).protocol)) throw Error('Source needs title, publisher, URL and access date');
    }
  }
  return draft;
}
export async function lockTopics(repo, draft, {guidePath = join(homedir(),'.codex/skills/knowledge-video-narration/SKILL.md')} = {}) {
  validateTopics(draft);
  const guide = await readFile(guidePath,'utf8');
  const content = {schemaVersion:1,policyVersion:LEGACY_POLICY_VERSION,date:draft.date,timeZone:'Asia/Shanghai',topics:draft.topics,narrationGuide:{sha256:sha256(guide),text:guide},output:{durationSeconds:[60,90],width:1920,height:1080,audio:'narration',subtitles:'zh-CN',tts:{engine:'Kokoro',voice:'zf_xiaobei',language:'z'}}};
  const digest = sha256(JSON.stringify(content));
  const result = {...content,contentSha256:digest,lockedAt:new Date().toISOString()};
  const path = topicPath(repo,draft.date); await mkdir(resolve(path,'..'),{recursive:true});
  const temporary=path+'.'+randomUUID()+'.tmp';
  await writeFile(temporary,JSON.stringify(result,null,2)+'\n',{flag:'wx'});
  try { await link(temporary,path); }
  catch (e) {
    if(e.code!=='EEXIST') throw e;
    const existing = await loadTopics(repo,draft.date);
    if(existing.contentSha256 !== digest) throw Error('This date already has a different locked topic set; reuse it or choose another evaluation date');
    return {path,topicSet:existing,reused:true};
  } finally { await unlink(temporary); }
  return {path,topicSet:result,reused:false};
}
export async function loadTopics(repo,date) {
  let data;
  try { data=JSON.parse(await readFile(topicPath(repo,date),'utf8')); }
  catch(e) { if(e.code==='ENOENT') throw Error(`No locked topics for ${date}. Research four fresh topics, then run daily-topics.mjs lock DRAFT.json --repo REPO. Same-day models reuse that file.`); throw e; }
  validateTopics(data,date);
  const {contentSha256,lockedAt,...content}=data;
  if(sha256(JSON.stringify(content))!==contentSha256 || sha256(data.narrationGuide.text)!==data.narrationGuide.sha256) throw Error('Locked topic set or narration guide was modified');
  return data;
}
function topicCase(topic,index,set) {
  const requirements=`制作60–90秒中文知识短视频，1920×1080，围绕一个观众好奇的问题展开。\n问题：${topic.question}\n开头角度：${topic.hook}\n视觉创意：${topic.visualIdea}\n经来源核对的事实：\n${topic.facts.map(f=>'- '+f).join('\n')}\n来源：\n${topic.sources.map(s=>`${s.publisher} · ${s.title} · ${s.url} · 发布日期 ${s.publishedAt??'未提供'} · 核对 ${s.accessedAt}`).join('\n')}\n\n先读取随附的 knowledge-video-narration.md，再独立写 narration.txt、读音稿 pronunciation.txt、分镜 storyboard.md、字幕 captions.srt 和可复建视频源码。前5秒给钩子；每段讲一个机制与具体例子，用因果衔接，最后一句收束。技术文章明确机构/作者和真实时效，不捏造“刚发”。历史故事标明史料与传说的区别。风格可有趣、反常识、有视觉巧思，避免堆文字卡片。先生成并测量真实中文口播，再排镜头与字幕；BGM/SFX低于人声，核对多音字、标签碰撞、转场和手机可读性。TTS是固定制作工具，不计模型原生语音能力。\n\n${topic.constraints??''}`;
  const guide=set.narrationGuide.text;
  return {id:VIDEO_IDS[index],topicId:topic.id,titleZh:topic.titleZh,titleEn:topic.titleEn,category:'knowledge-video',sourceUrl:topic.sources[0].url,sourceType:'date-locked-source-brief',durationSeconds:75,requirements,checks:['口播主线与来源事实一致','关键机制通过画面解释','中文口播与字幕同步，手机可读'],inputs:[],prompt:requirements+'\n\n口播技能：\n'+guide,narrationGuide:guide,topicSetSha256:set.contentSha256,evaluationDate:set.date};
}
export async function creationSuite({repoRoot,skillRoot,date=evaluationDate(),profile='creator',caseIds,legacy=false,sourceVersion}) {
  const base=JSON.parse(await readFile(join(skillRoot,'references/suite-v3.json'),'utf8'));
  const selected=caseIds??defaultCases(profile);
  if(!selected.length || new Set(selected).size!==selected.length) throw Error('Empty or duplicate cases');
  const creator = profile === 'creator' || selected.some(id => creatorCases.some(c => c.id === id));
  const historicalCreator = sourceVersion === PREVIOUS_CREATOR_VERSION || selected.includes('bookshelf') || selected.includes('creator-vision');
  const version = creator ? (historicalCreator ? PREVIOUS_CREATOR_VERSION : POLICY_VERSION) : LEGACY_POLICY_VERSION;
  const cases=[...base.cases.map(c=>c.id==='bookshelf'&&profile==='creator'?{...c,...creatorBookshelf}:c),...(creator?creatorCases:[])];
  for(const c of [...visuals,{...animation,id:'pelican-animation'}]) cases.push({id:'svg-'+c.id,titleZh:c.title,titleEn:c.titleEn,category:c.animation?'svg-animation':'svg',sourceUrl:c.source??'https://www.tokrace.com/',durationSeconds:c.animation?4:null,requirements:c.prompt,prompt:c.prompt,checks:c.rubricZh??[],inputs:[]});
  let topics=null;
  if(selected.some(id=>VIDEO_IDS.includes(id))) { topics=await loadTopics(repoRoot,date); cases.push(...topics.topics.map((t,i)=>topicCase(t,i,topics))); }
  if(selected.some(id=>!cases.some(c=>c.id===id))) throw Error('Unknown case in selection');
  if(!legacy && selected.includes('svg-pelican')) throw Error('Static pelican is retired. Only explicit historical recovery may include it.');
  return {...base,version,policyVersion:version,evaluationDate:date,profile,topicSetSha256:topics?.contentSha256??null,defaultCaseIds:selected,cases,productionPolicy:creator?{firstAutonomousDelivery:'freeze-before-feedback',verification:'essential files, facts and named operations',subjectiveScores:false,editorialAuthor:'human',browserRecording:'coordinator',retainAllAttempts:true}:base.productionPolicy,changes:creator?['Five creator tasks: one Blender scene, one Web3D animation, one interactive web app, one SVG chart and one fixed image-reading task.','Capture the first autonomous delivery; check essential facts and functions without AI subjective scores.','Historical profiles and explicit recovery cases retain their prior task definitions.']:['Three standard Blender cases; three static SVGs and one animation; no text/code baseline.','Four source-checked daily knowledge topics with the frozen knowledge-video-narration guide; same date means identical topics and source materials.','Historical successful artifacts remain unchanged; old case IDs are available for explicit recovery.']};
}
