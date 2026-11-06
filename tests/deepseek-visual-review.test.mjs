import test from 'node:test';
import assert from 'node:assert/strict';
import{readFileSync,mkdtempSync,writeFileSync,rmSync}from'node:fs';
import{tmpdir}from'node:os';import{join}from'node:path';import{spawnSync}from'node:child_process';import{createHash}from'node:crypto';import sharp from'sharp';
import cases from'../scripts/evaluation/cases.mjs';
const d=JSON.parse(readFileSync(new URL('../public/evaluations/deepseek-v4-1-flash-1017-visual.json',import.meta.url)));
const file=p=>readFileSync(new URL('../public'+p,import.meta.url));const hash=b=>createHash('sha256').update(b).digest('hex');
test('DeepSeek preserves eight first responses, seven unmodified renders and the invalid clock',async()=>{
 assert.equal(d.attempts.length,8);assert.equal(d.attempts.filter(a=>a.pngPath).length,7);
 for(const c of cases){const pair=d.attempts.filter(a=>a.id===c.id);assert.deepEqual(new Set(pair.map(a=>a.mode)),new Set(['default','disabled']));for(const a of pair)assert.equal(a.prompt,c.prompt);}
 for(const a of d.attempts){assert.equal(a.httpStatus,200);assert.equal(a.status,'done');assert.equal(a.returnedModel,'deepseek-flash');assert.deepEqual(a.request.thinking,a.mode==='disabled'?{type:'disabled'}:undefined);assert.equal(a.request.max_tokens,12288);assert.equal(a.request.temperature,0);assert.ok(a.totalMs>=a.firstContentMs&&a.firstContentMs>0);
 if(a.renderable){const svg=file(a.svgPath);assert.equal(svg.toString(),a.text.match(/<svg\b[\s\S]*?<\/svg\s*>/i)[0]);assert.equal(hash(svg),a.svgSha256);assert.equal(hash(file(a.pngPath)),a.pngSha256);const m=await sharp(file(a.pngPath)).metadata();assert.equal(m.width,a.width);assert.equal(m.height,a.height);}else{assert.equal(a.id+'-'+a.mode,'clock-disabled');assert.match(a.renderError,/duplicate attribute/);assert.ok(!a.pngPath);const svg=a.text.match(/<svg\b[\s\S]*?<\/svg\s*>/i)[0];assert.ok(/<line[^>]*x2="400"[^>]*x2="400"/s.test(svg));}}
});
test('DeepSeek geometry and Chinese text checks correspond to original SVG evidence',()=>{
 const clock=d.attempts.find(a=>a.id==='clock'&&a.mode==='default');const svg=file(clock.svgPath).toString();assert.match(svg,/rotate\(290\.5 400 300\)/);assert.match(svg,/rotate\(246 400 300\)/);assert.match(svg,/points="400,190/);assert.match(svg,/points="400,130/);
 for(const a of d.attempts.filter(a=>a.id==='dashboard')){const s=file(a.svgPath).toString();let heights,baselines;
 if(a.mode==='disabled'){const bars=[...s.matchAll(/<rect x="(?:200|320|440|560)" y="(\d+)" width="80" height="(\d+)"/g)];heights=bars.map(m=>+m[2]);baselines=bars.map(m=>+m[1]+ +m[2]);}
 else{const bars=[...s.matchAll(/<path d="M (\d+) 470 L \d+ (\d+) Q \d+ (\d+)/g)];heights=bars.map(m=>470- +m[3]);baselines=bars.map(()=>470);}
 assert.deepEqual(heights,a.geometryCheck.heights);assert.ok(baselines.every(n=>n===a.geometryCheck.baseline));assert.deepEqual(heights.map(n=>n/heights[0]),[1,2,1.5,2.5]);}
 for(const a of d.attempts.filter(a=>a.id==='poster')){const texts=[...file(a.svgPath).toString().matchAll(/<text\b[^>]*>([\s\S]*?)<\/text>/g)].map(m=>m[1].replace(/<[^>]*>/g,''));assert.equal(texts.length,6);for(const[s,n]of Object.entries(a.exactTextCheck)){assert.equal(n,1);assert.equal(texts.filter(t=>t===s).length,1);}}
});
test('DeepSeek official images retain original provenance and bytes',async()=>{
 assert.equal(d.official.length,2);for(const f of d.official){assert.equal(hash(file(f.path)),f.sha256);assert.equal(f.copyrightHolder,'DeepSeek');assert.equal(f.unmodifiedOriginal,true);assert.equal(new URL(f.url).hostname,'api-docs.deepseek.com');assert.equal(f.sourcePage,'https://api-docs.deepseek.com/news/news261017/');const m=await sharp(file(f.path)).metadata();assert.equal(m.width,f.width);assert.equal(m.height,f.height);}
});
test('runner refuses changed config and never retries previously recorded interrupted requests',()=>{
 const dir=mkdtempSync(join(tmpdir(),'visual-runner-'));
 try{const config={model:'test',endpoint:'http://127.0.0.1:1',keyEnv:'VISUAL_TEST_KEY',modes:{default:{}},extraBody:{},temperature:0,maxTokens:12288,timeoutMs:100};const cf=join(dir,'config.json'),ef=join(dir,'evidence.json');writeFileSync(cf,JSON.stringify(config));const evidence={identity:hash(JSON.stringify({config,cases})),attempts:cases.map(c=>({...c,mode:'default',status:'interrupted'}))};writeFileSync(ef,JSON.stringify(evidence));const run=()=>spawnSync(process.execPath,['scripts/evaluation/run.mjs',cf,ef],{cwd:process.cwd(),env:{...process.env,VISUAL_TEST_KEY:'test-only'},encoding:'utf8'});assert.equal(run().status,0);assert.deepEqual(JSON.parse(readFileSync(ef)),evidence);config.maxTokens=999;writeFileSync(cf,JSON.stringify(config));const changed=run();assert.notEqual(changed.status,0);assert.match(changed.stderr,/Refusing to mix/);assert.deepEqual(JSON.parse(readFileSync(ef)),evidence);}finally{rmSync(dir,{recursive:true,force:true});}
});
