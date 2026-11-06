import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
const raw=readFileSync(new URL('../public/evaluations/minimax-m3-1-flash-visual.json',import.meta.url),'utf8'),d=JSON.parse(raw);
const file=p=>readFileSync(new URL('../public'+p,import.meta.url));
const hash=b=>createHash('sha256').update(b).digest('hex');
test('visual gallery preserves all eight first outputs and exact SVG bytes without active content',async()=>{
 assert.equal(d.attempts.length,8);assert.equal(d.tasks.length,4);assert.doesNotMatch(raw,/\bsk-[A-Za-z0-9_-]{16,}|Bearer\s+[A-Za-z0-9._-]{16,}/);
 for(const task of d.tasks){const pair=d.attempts.filter(a=>a.id===task.id);assert.deepEqual(new Set(pair.map(a=>a.mode)),new Set(['low','default']));assert.equal(pair[0].prompt,pair[1].prompt);}
 for(const a of d.attempts){assert.equal(a.httpStatus,200);assert.equal(a.status,'done');assert.equal(a.returnedModel,'MiniMax-M3.1-Flash');assert.equal(a.request.reasoning_effort,a.mode==='low'?'low':undefined);assert.equal(a.request.max_tokens,12288);assert.equal(a.request.temperature,0);assert.ok(a.totalMs>=a.firstContentMs&&a.firstContentMs>0);const svg=file(a.svgPath);assert.equal(svg.toString(),a.text.match(/<svg\b[\s\S]*?<\/svg\s*>/i)[0]);assert.equal(hash(svg),a.svgSha256);assert.doesNotMatch(svg.toString(),/<(?:script|foreignObject|iframe|image|animate)\b|\son\w+\s*=|<!ENTITY|<!DOCTYPE/i);assert.equal(hash(file(a.pngPath)),a.pngSha256);const m=await sharp(file(a.pngPath)).metadata();assert.equal(m.width,a.width);assert.equal(m.height,a.height);}
});
test('clock geometry reproduces the low-effort wrong-hour-hand failure',()=>{
 for(const mode of ['low','default']){const a=d.attempts.find(a=>a.id==='clock'&&a.mode===mode),svg=file(a.svgPath).toString();const attrs=[...svg.matchAll(/<line\b([^>]+)\/?\s*>/g)].map(m=>Object.fromEntries([...m[1].matchAll(/([\w-]+)="([^"]*)"/g)].map(x=>[x[1],x[2]])));
 for(const [name,h] of Object.entries(a.geometryCheck)){const line=attrs.find(x=>x.x1===h.attributes.x1&&x.y1===h.attributes.y1&&x.stroke===h.attributes.stroke);assert.ok(line);const dx=+line.x2-+line.x1,dy=+line.y2-+line.y1;const rotate=+(line.transform?.match(/rotate\(([-\d.]+)/)?.[1]??0);const angle=(Math.atan2(dx,-dy)*180/Math.PI+rotate+360)%360;assert.ok(Math.abs(angle-h.angleDeg)<1e-8);if(name==='minute'||mode==='default')assert.ok(Math.abs(angle-h.targetAngleDeg)<.1);else assert.ok(Math.abs(angle-h.targetAngleDeg)>40);}
 }
});
test('poster strings and official image provenance remain inspectable',async()=>{
 for(const a of d.attempts.filter(a=>a.id==='poster')){const texts=[...file(a.svgPath).toString().matchAll(/<text\b[^>]*>([\s\S]*?)<\/text>/g)].map(m=>m[1].replace(/<[^>]*>/g,''));for(const [s,count] of Object.entries(a.exactTextCheck)){assert.equal(count,1);assert.equal(texts.filter(t=>t===s).length,1);}assert.equal(texts.length,6);}
 assert.equal(d.official.length,4);for(const f of d.official){assert.equal(hash(file(f.path)),f.sha256);assert.equal(f.copyrightHolder,'MiniMax');assert.equal(f.unmodifiedOriginal,true);assert.equal(new URL(f.url).hostname,'filecdn.minimax.chat');const m=await sharp(file(f.path)).metadata();assert.equal(m.width,f.width);assert.equal(m.height,f.height);}
});
