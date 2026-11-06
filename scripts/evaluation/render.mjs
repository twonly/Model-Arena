import sharp from 'sharp';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const records=JSON.parse(await readFile(process.argv[2]));
for(const x of records.filter(x=>x.renderable)) {
 try {
  const path='public'+x.svgPath;
  await sharp(path,{limitInputPixels:20000000}).resize({width:1200}).png().toFile(path.replace('.svg','.png'));
  const b=await readFile(path.replace('.svg','.png')),m=await sharp(b).metadata();
  Object.assign(x,{pngPath:x.svgPath.replace('.svg','.png'),width:m.width,height:m.height,pngSha256:createHash('sha256').update(b).digest('hex'),renderer:'sharp/libvips SVG rasterization at 1200px width; no visual edits'});
 } catch(error) { x.renderable=false;x.renderError=String(error.message); }
}
await writeFile(process.argv[3],JSON.stringify(records,null,2));
console.log(records.map(({id,renderable,width,height,renderError})=>({id,renderable,width,height,renderError})));
