import assert from 'node:assert/strict';
import test from 'node:test';
import {mkdtemp,writeFile,readFile,mkdir,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {creationSuite,defaultCases,evaluationDate,lockTopics,loadTopics,topicPath,sha256,POLICY_VERSION,PREVIOUS_CREATOR_VERSION,LEGACY_POLICY_VERSION} from '../scripts/evaluation/creation-suite.mjs';
import originalVisuals from '../scripts/evaluation/cases.mjs';
import visualCases,{version} from '../scripts/evaluation/cases-v2.mjs';

async function fixture(t) {
 const repo=await mkdtemp(join(tmpdir(),'tokrace-v4-'));t.after(()=>rm(repo,{recursive:true,force:true}));
 const skill=join(repo,'skill');await mkdir(join(skill,'references'),{recursive:true});
 const ids=['bookshelf','planetary-reducer','two-bedroom-interior','horizontal-steam-engine','temple-courtyard','jupiter-drydock','derivative'];
 await writeFile(join(skill,'references/suite-v3.json'),JSON.stringify({version:'historical-v3',cases:ids.map(id=>({id,titleZh:id,titleEn:id,category:id==='derivative'?'knowledge-video':'blender',requirements:id,inputs:[]}))}));
 const guide=join(repo,'narration.md');await writeFile(guide,'开头给钩子，正文用具体例子，结尾收束。');
 const draft={date:'2026-11-02',topics:Array.from({length:4},(_,i)=>({id:'fresh-'+i,titleZh:'为什么会这样'+i,titleEn:'Why this happens '+i,question:'一个具体问题'+i,hook:'一个反常识钩子',visualIdea:'动画讲清机制',facts:['来源事实一','来源事实二','来源事实三'],sources:[{url:'https://example.org/source-'+i,title:'Source '+i,publisher:'Fixture publisher',publishedAt:null,accessedAt:'2026-11-02'}]}))};
 return {repo,skill,guide,draft};
}
test('creator selects five distinct tasks while historical profiles retain their tasks',()=>{
 assert.deepEqual(defaultCases(),['creator-handheld','creator-web3d','creator-webapp','svg-dashboard','creator-spot-difference']);
 assert.equal(defaultCases('standard').length,11);assert.equal(defaultCases('quick').length,10);assert.equal(defaultCases('extended').length,14);
 const selected=defaultCases();selected.pop();assert.equal(defaultCases().length,5);
 assert.throws(()=>defaultCases('typo'),/Profile must be/);
 assert.deepEqual(visualCases.map(c=>c.id),['clock','dashboard','poster']);assert.equal(version,'visual-svg-v2');
 assert.ok(!defaultCases().includes('svg-pelican'));
 assert.equal(evaluationDate(new Date('2026-11-01T16:00:00Z')),'2026-11-02');
 assert.equal(evaluationDate(new Date('2026-11-01T15:59:59Z')),'2026-11-01');
});
test('creator needs no daily topic lock and keeps original chart and recovery definitions',async t=>{
 const f=await fixture(t);
 const suite=await creationSuite({repoRoot:f.repo,skillRoot:f.skill,date:'2026-11-05'});
 assert.equal(suite.version,POLICY_VERSION);assert.equal(suite.topicSetSha256,null);
 assert.equal(new Set(suite.defaultCaseIds).size,5);
 const selected=suite.defaultCaseIds.map(id=>suite.cases.find(c=>c.id===id));
 assert.ok(selected.every(Boolean));
 assert.deepEqual(selected.map(c=>c.category),['blender','web-3d','web-app','svg','vision']);
 const handheld=selected[0];assert.equal(handheld.prompt,handheld.requirements);assert.deepEqual(handheld.inputs,[]);
 assert.ok(handheld.deliverables.includes('exploded.blend'));assert.ok(handheld.deliverables.includes('build.py'));
 const chart=selected.find(c=>c.id==='svg-dashboard');
 assert.equal(chart.prompt,originalVisuals.find(c=>c.id==='dashboard').prompt);
 const vision=selected.find(c=>c.id==='creator-spot-difference');
 assert.deepEqual(vision.inputs.map(input=>input.name),['spot-a.png','spot-b.png']);
 for(const input of vision.inputs) assert.match(input.sha256,/^[a-f0-9]{64}$/);
 assert.deepEqual(vision.deliverables,['answer.json']);
 const app=selected.find(c=>c.id==='creator-webapp');
 assert.deepEqual(app.operations.map(o=>o.action),['add','toggle','delete']);
 assert.deepEqual(app.operations.map(o=>o.expectedCount).filter(Number.isInteger),[4,3]);
 const legacy=await creationSuite({repoRoot:f.repo,skillRoot:f.skill,profile:'standard',caseIds:['bookshelf','svg-dashboard'],legacy:true});
 assert.equal(legacy.version,LEGACY_POLICY_VERSION);assert.equal(legacy.cases.find(c=>c.id==='bookshelf').requirements,'bookshelf');
 const onlyBookshelf=await creationSuite({repoRoot:f.repo,skillRoot:f.skill,profile:'creator',caseIds:['bookshelf']});
 assert.equal(onlyBookshelf.version,PREVIOUS_CREATOR_VERSION);
 assert.ok(onlyBookshelf.cases.find(c=>c.id==='bookshelf').deliverables.includes('wide.blend'));
 const historical = await creationSuite({repoRoot:f.repo,skillRoot:f.skill,caseIds:['creator-web3d'],sourceVersion:PREVIOUS_CREATOR_VERSION});
 assert.equal(historical.version,PREVIOUS_CREATOR_VERSION);
 await assert.rejects(creationSuite({repoRoot:f.repo,skillRoot:f.skill,caseIds:['not-a-task']}),/Unknown case/);
 await assert.rejects(creationSuite({repoRoot:f.repo,skillRoot:f.skill,caseIds:['bookshelf','bookshelf']}),/duplicate/);
});
test('same-day topics are atomically reused across concurrent model preparations',async t=>{
 const f=await fixture(t);
 const locks=await Promise.all(Array.from({length:5},()=>lockTopics(f.repo,f.draft,{guidePath:f.guide})));
 assert.equal(new Set(locks.map(r=>r.topicSet.contentSha256)).size,1);
 assert.equal(locks.filter(r=>!r.reused).length,1);
 const first=await creationSuite({repoRoot:f.repo,skillRoot:f.skill,date:f.draft.date,profile:'standard'});
 const second=await creationSuite({repoRoot:f.repo,skillRoot:f.skill,date:f.draft.date,profile:'standard'});
 assert.equal(first.version,LEGACY_POLICY_VERSION);assert.equal(locks[0].topicSet.policyVersion,LEGACY_POLICY_VERSION);
 for(const id of ['knowledge-1','knowledge-2','knowledge-3','knowledge-4']){
  const a=first.cases.find(c=>c.id===id),b=second.cases.find(c=>c.id===id);
  assert.equal(sha256(a.prompt),sha256(b.prompt));assert.equal(a.topicSetSha256,first.topicSetSha256);assert.ok(a.narrationGuide.includes('具体例子'));
 }
 const changed=structuredClone(f.draft);changed.topics[0].question='偷偷换题';
 await assert.rejects(lockTopics(f.repo,changed,{guidePath:f.guide}),/already has a different locked/);
 assert.equal((await loadTopics(f.repo,f.draft.date)).topics[0].question,f.draft.topics[0].question);
});
test('new dates may change topics; absent or tampered locks cannot silently use old fixed topics',async t=>{
 const f=await fixture(t);await lockTopics(f.repo,f.draft,{guidePath:f.guide});
 await assert.rejects(creationSuite({repoRoot:f.repo,skillRoot:f.skill,date:'2026-11-03',profile:'standard'}),/No locked topics/);
 const next=structuredClone(f.draft);next.date='2026-11-03';next.topics[0].question='次日新问题';
 await lockTopics(f.repo,next,{guidePath:f.guide});assert.equal((await loadTopics(f.repo,next.date)).topics[0].question,'次日新问题');
 const p=topicPath(f.repo,next.date),bytes=await readFile(p,'utf8');await writeFile(p,bytes.replace('次日新问题','被改写的问题'));
 await assert.rejects(loadTopics(f.repo,next.date),/modified/);
 const subset=await creationSuite({repoRoot:f.repo,skillRoot:f.skill,date:'2026-11-04',profile:'standard',caseIds:['bookshelf','svg-clock']});assert.equal(subset.topicSetSha256,null);
 await assert.rejects(creationSuite({repoRoot:f.repo,skillRoot:f.skill,caseIds:['svg-pelican']}),/retired/);
 const recovery=await creationSuite({repoRoot:f.repo,skillRoot:f.skill,profile:'standard',caseIds:['derivative','svg-pelican'],legacy:true});assert.deepEqual(recovery.defaultCaseIds,['derivative','svg-pelican']);
});
