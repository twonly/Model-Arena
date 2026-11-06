// Observe the encoded WebP playing in a real browser; QA output stays private.
import {chromium} from 'playwright';
import sharp from 'sharp';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const file=process.argv[2];if(!file)throw Error('Render result JSON required');
const a=JSON.parse(await readFile(file,'utf8'));if(!a.animationRender)throw Error('Encoded animation required');
const root='output/kimi-k3-1-pro-resume-20261024-1/playback';await mkdir(root,{recursive:true});
const webp=await readFile('public'+a.animationRender.path),browser=await chromium.launch({headless:true});
const samples=[];
try{
 const page=await browser.newPage({viewport:{width:800,height:600},deviceScaleFactor:1});await page.route('**/*',r=>r.abort());
 await page.setContent('<!doctype html><style>html,body{margin:0}img{display:block;width:800px;height:600px}</style><img src="data:image/webp;base64,'+webp.toString('base64')+'">');await page.locator('img').evaluate(img=>img.decode());const start=performance.now();
 for(let i=0;i<9;i++){
  if(i)await page.waitForTimeout(550);
  const png=await page.screenshot();const path=`${root}/sample-${i}.png`;await writeFile(path,png);samples.push({path,elapsedMs:performance.now()-start,sha256:createHash('sha256').update(png).digest('hex')});
 }
 const sheets=[];
 for(let i=0;i<samples.length;i++){const img=await sharp(samples[i].path).resize(400,300).png().toBuffer();sheets.push({input:img,left:i%3*400,top:Math.floor(i/3)*330});const label=Buffer.from(`<svg width="400" height="30"><rect width="400" height="30" fill="white"/><text x="8" y="22" font-size="18">${(samples[i].elapsedMs/1000).toFixed(2)}s</text></svg>`);sheets.push({input:label,left:i%3*400,top:Math.floor(i/3)*330+300});}
 await sharp({create:{width:1200,height:990,channels:3,background:'white'}}).composite(sheets).png().toFile(root+'/contact-sheet.png');
 const record={checkedAt:new Date().toISOString(),sourceEvidence:'/evaluations/kimi-k3-1-pro-resume-20261024.json',encodedWebp:a.animationRender.path,encodedSha256:createHash('sha256').update(webp).digest('hex'),browserVersion:browser.version(),samples,uniqueSamples:new Set(samples.map(s=>s.sha256)).size,elapsedMs:samples.at(-1).elapsedMs,network:'All requests blocked; local data URL only',method:'Real-time browser playback of the encoded WebP, nine screenshot samples spaced about 550ms apart, spanning longer than its four-second loop.'};if(record.uniqueSamples<3)throw Error('Encoded animation did not visibly change');await writeFile(root+'/playback.json',JSON.stringify(record,null,2)+'\n');console.log(JSON.stringify({uniqueSamples:record.uniqueSamples,elapsedMs:record.elapsedMs,contactSheet:root+'/contact-sheet.png'}));
}finally{await browser.close();}
