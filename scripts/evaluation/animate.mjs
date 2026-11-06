// Render validated SVG SMIL at fixed timestamps; no edits to model-generated source.
import {chromium} from 'playwright';
import sharp from 'sharp';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const file=process.argv[2],a=JSON.parse(await readFile(file));
if(!a.animation||!a.renderable||!a.svgPath)throw Error('Validated animated SVG required');
const svg=await readFile('public'+a.svgPath,'utf8');
if(!/<animate(?:Transform|Motion)?\b/.test(svg))throw Error('No SMIL animation');
const browser=await chromium.launch({headless:true});
try{
 const page=await browser.newPage({viewport:{width:800,height:600},deviceScaleFactor:1,javaScriptEnabled:true});
 await page.route('**/*',r=>r.abort());
 await page.setContent('<!doctype html><meta http-equiv="Content-Security-Policy" content="default-src \'none\'; style-src \'unsafe-inline\'"><style>html,body{margin:0;background:white}svg{display:block;width:800px;height:600px}</style>'+svg);
 const frames=[],hashes=[];
 await page.evaluate(()=>document.querySelector('svg').pauseAnimations());
 for(let i=0;i<40;i++){
  await page.evaluate(t=>document.querySelector('svg').setCurrentTime(t),i/10);
  const png=await page.screenshot({animations:'allow'});const raw=await sharp(png).removeAlpha().raw().toBuffer();frames.push(raw);hashes.push(createHash('sha256').update(raw).digest('hex'));
  if([0,10,20,30].includes(i))await writeFile('public'+a.svgPath.replace('.svg',`-frame-${i}.png`),png);
 }
 if(new Set(hashes).size<3)throw Error('Animation did not visibly change across sampled frames');
 await page.evaluate(()=>document.querySelector('svg').setCurrentTime(4));
 const boundaryPng=await page.screenshot({animations:'allow'});
 await writeFile('public'+a.svgPath.replace('.svg','-frame-40.png'),boundaryPng);
 const boundary=await sharp(boundaryPng).removeAlpha().raw().toBuffer();
 const loopBoundaryMeanAbsoluteError=boundary.reduce((sum,value,i)=>sum+Math.abs(value-frames[0][i]),0)/boundary.length;
 const loopBoundaryMatchesStart=createHash('sha256').update(boundary).digest('hex')===hashes[0];
 const webpPath=a.svgPath.replace('.svg','.webp');
 await sharp(Buffer.concat(frames),{raw:{width:800,height:600*40,channels:3,pageHeight:600}}).webp({quality:82,loop:0,delay:Array(40).fill(100)}).toFile('public'+webpPath);
 const b=await readFile('public'+webpPath);const m=await sharp(b,{animated:true}).metadata();
 if(m.pages!==40||m.pageHeight!==600)throw Error('Invalid animation encoding');
 a.animationRender={path:webpPath,sha256:createHash('sha256').update(b).digest('hex'),durationSeconds:4,fps:10,frames:40,width:800,height:600,uniqueFrames:new Set(hashes).size,loopBoundaryMatchesStart,loopBoundaryMeanAbsoluteError,frameHashes:hashes,renderer:'Chromium SMIL fixed-time capture, 0.0–3.9 seconds; animated WebP, no source edits',browserVersion:browser.version()};
 await writeFile(file,JSON.stringify(a,null,2));console.log(JSON.stringify({path:webpPath,pages:m.pages,uniqueFrames:new Set(hashes).size,bytes:b.length}));
}finally{await browser.close();}
