// node tests/rerun-snapshots.browser.mjs [base]
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { mkdir, writeFile, rm } from 'node:fs/promises';
const base = process.argv[2] || 'http://localhost:3118';
const fixture = new URL('../app/[lang]/rerun-check-fixture/', import.meta.url);
const results = ['done', 'stopped', 'error'].map((status, i) => ({name:`Model ${i}`,model:`model-${i}`,status,text:status==='done'?'Old answer':'',reasoning:'',metrics:null,samples:[]}));
const original = {id:'rerun-original',at:1700000000000,title:'Rerun check',notes:'',prompt:'Original task',params:{systemPrompt:'Original system',maxTokens:'50',temperature:'0.1'},results};
await mkdir(fixture);
await writeFile(new URL('page.tsx',fixture),`import { ShareView } from '@/components/ShareView'; export default function Page(){return <ShareView shareId="reruncheck" snapshot={${JSON.stringify({title:original.title,notes:original.notes,prompt:original.prompt,params:original.params,results,v:1,watermark:'',thinkingStats:true})}} />;}`);
const browser=await chromium.launch();
try {
 for(const fromShare of [false,true]) for(const index of [0,1,2]) {
  const page=await browser.newPage({viewport:{width:index===1?390:1280,height:900}});
  const calls=[];
  await page.addInitScript(original=>{
   if(localStorage.getItem('rerun-test'))return;
   localStorage.setItem('rerun-test','1');localStorage.setItem('ma.history',JSON.stringify([original]));
   localStorage.setItem('ma.graduatedShared','1');
   localStorage.setItem('ma.endpoints',JSON.stringify(original.results.map(r=>({id:r.model,name:r.name,model:r.model,kind:'openai',baseUrl:'https://example.test/v1',apiKey:'test',enabled:true}))));
  },original);
  await page.route('**/api/chat/session',r=>r.fulfill({json:{default:'vercel',match:[]}}));
  await page.route('**/api/chat',r=>{calls.push(r.request().postDataJSON());return r.fulfill({contentType:'text/event-stream',body:'data: {"type":"delta","text":"New answer","ts":100}\n\ndata: {"type":"done"}\n\n'});});
  await page.goto(`${base}/zh-CN/${fromShare?'rerun-check-fixture':'arena'}`);
  if(!fromShare){await page.getByRole('button',{name:/🕘 历史/}).click();await page.getByRole('button',{name:'恢复查看'}).click();}
  const card=page.locator('#model-outputs > *').nth(index);
  await card.getByRole('button',{name:/重跑/}).click();
  const dialog=page.getByRole('dialog',{name:`重跑 Model ${index}`});
  await dialog.waitFor();
  const selected=dialog.getByRole('radio',{checked:true});
  await selected.waitFor();
  assert.equal(await selected.count(),1);
  assert.equal(await dialog.getByRole('radio').count(),1);
  assert.equal(calls.length,0);
  await dialog.getByRole('button',{name:'运行所选 1 个模型'}).click();
  await page.waitForFunction(()=>JSON.parse(localStorage.getItem('ma.history'))[0].results.length===4);
  assert.equal(calls.length,1);assert.equal(calls[0].model,`model-${index}`);assert.equal(calls[0].prompt,original.prompt);
  const history=await page.evaluate(()=>JSON.parse(localStorage.getItem('ma.history')));
  assert.deepEqual(history.at(-1),original);
  for(let i=0;i<3;i++){const {origin,...row}=history[0].results[i];assert.deepEqual(row,results[i]);}
  console.log(`PASS ${fromShare?'share':'history'} ${results[index].status}: single model rerun, original preserved`);
  await page.close();
 }
}finally{await browser.close();await rm(fixture,{recursive:true});}
