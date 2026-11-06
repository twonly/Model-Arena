import assert from 'node:assert/strict';
import test from 'node:test';
import {mkdtemp,mkdir,readFile,writeFile,symlink,lstat,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import {copyCaseInputs,creatorPrompt} from '../scripts/evaluation/creator-preparation.mjs';

const sha256=bytes=>createHash('sha256').update(bytes).digest('hex');
async function fixture(t) {
  const root=await mkdtemp(join(tmpdir(),'tokrace-creator-inputs-'));
  t.after(()=>rm(root,{recursive:true,force:true}));
  const repoRoot=join(root,'repo'),skillRoot=join(root,'skill'),target=join(root,'inputs');
  await Promise.all([repoRoot,skillRoot,target].map(p=>mkdir(p)));
  await writeFile(join(root,'private.png'),'outside the allowed archive');
  return {root,repoRoot,skillRoot,target};
}

test('a task with an inline prompt still receives the exact frozen image and its hash',async t=>{
  const f=await fixture(t),bytes=Buffer.from('fixed test-image bytes');
  await writeFile(join(f.repoRoot,'image.png'),bytes);
  const task={titleZh:'读库存图',prompt:'直接读图回答，保存answer.md',inputs:[{name:'inspection.png',repoAsset:'image.png',sha256:sha256(bytes)}]};
  const inputs=await copyCaseInputs(task,f);
  assert.deepEqual(await readFile(join(f.target,'inspection.png')),bytes);
  assert.deepEqual(inputs,[{name:'inspection.png',sha256:sha256(bytes)}]);
  const prompt=creatorPrompt({task,workspace:f.target,tools:{},author:'fixture-author'});
  assert.ok(prompt.includes(task.prompt));assert.ok(prompt.includes('fixture-author'));
  assert.ok(prompt.includes('inputs'));assert.ok(!prompt.includes('audio-plan.json'));
});

test('legacy skill inputs retain their bytes and frozen-hash validation',async t=>{
  const f=await fixture(t);await writeFile(join(f.skillRoot,'facts.txt'),'source facts');
  const task={inputs:[{name:'facts.txt',asset:'facts.txt',sha256:sha256('source facts')}]};
  await copyCaseInputs(task,f);assert.equal(await readFile(join(f.target,'facts.txt'),'utf8'),'source facts');
  await writeFile(join(f.skillRoot,'facts.txt'),'tampered facts');
  await assert.rejects(copyCaseInputs(task,f),/hash mismatch/);
  assert.equal(await readFile(join(f.target,'facts.txt'),'utf8'),'source facts');
});

test('input traversal, symlink escapes and output traversal are rejected',async t=>{
  const f=await fixture(t);
  await symlink(join(f.root,'private.png'),join(f.repoRoot,'linked.png'));
  for(const repoAsset of ['../private.png','linked.png']){
    await assert.rejects(copyCaseInputs({inputs:[{name:'inspection.png',repoAsset}]},f),/escaped/);
  }
  await writeFile(join(f.repoRoot,'image.png'),'image');
  await assert.rejects(copyCaseInputs({inputs:[{name:'../leak.png',repoAsset:'image.png'}]},f),/filename/);
  await assert.rejects(readFile(join(f.root,'leak.png')),error=>error.code==='ENOENT');
});

test('an existing destination symlink is replaced without changing its external target',async t=>{
  const f=await fixture(t),external=join(f.root,'private.png'),destination=join(f.target,'inspection.png');
  await writeFile(join(f.repoRoot,'image.png'),'frozen image');
  await symlink(external,destination);
  await copyCaseInputs({inputs:[{name:'inspection.png',repoAsset:'image.png'}]},f);
  assert.equal(await readFile(external,'utf8'),'outside the allowed archive');
  assert.equal((await lstat(destination)).isSymbolicLink(),false);
  assert.equal(await readFile(destination,'utf8'),'frozen image');
});
