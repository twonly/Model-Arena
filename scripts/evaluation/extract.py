import json,re,xml.etree.ElementTree as ET,hashlib,sys
from pathlib import Path
p=Path(sys.argv[1]);slug=sys.argv[2];assert re.fullmatch(r'[a-z0-9-]+',slug)
if not p.exists():raise SystemExit('Waiting for first completed response')
d=json.loads(p.read_text());out=Path('public/evaluations')/slug/'assets';out.mkdir(parents=True,exist_ok=True);meta=[]
for a in d['attempts']:
 id=a['id']+'-'+a['mode'];m=re.search(r'<svg\b[\s\S]*?</svg\s*>',a['text'],re.I);r={'id':id,'renderable':False}
 if m:
  svg=m.group(0)
  try:
   assert '<!DOCTYPE' not in svg.upper() and '<!ENTITY' not in svg.upper()
   root=ET.fromstring(svg);assert root.tag.split('}')[-1]=='svg'
   for e in root.iter():
    assert e.tag.split('}')[-1].lower() in {'svg','g','defs','title','desc','metadata','style','path','rect','circle','ellipse','line','polyline','polygon','text','tspan','textpath','use','symbol','clippath','mask','pattern','lineargradient','radialgradient','stop','filter','fegaussianblur','feoffset','femerge','femergenode','fecolormatrix','feblend','fecomposite','feflood','fedropshadow'} | ({'animate','animatetransform','animatemotion','mpath'} if a.get('animation') else set())
    for k,v in e.attrib.items():
     assert not k.lower().startswith('on')
     if k.split('}')[-1] in ['href','src']:assert v.startswith('#')
     if k.lower()=='attributename':assert v.lower() not in {'href','xlink:href','src','style'} and not v.lower().startswith('on')
     for url in re.findall(r'url\((.*?)\)',v,re.I):assert url.strip(' \"\'').startswith('#')
    if e.tag.split('}')[-1]=='style':assert not re.search(r'@import|https?:|url\((?![\"\']?#)',e.text or '',re.I), 'External CSS resources are not allowed in a self-contained SVG'
   (out/(id+'.svg')).write_text(svg)
   r.update(renderable=True,svgPath='/evaluations/'+slug+'/assets/'+id+'.svg',svgSha256=hashlib.sha256(svg.encode()).hexdigest(),extraction='Exact first SVG element from response; surrounding prose or code fence omitted, SVG bytes unchanged.',viewBox=root.attrib.get('viewBox'),texts=[e.text for e in root.iter() if e.tag.split('}')[-1] in ['text','tspan'] and e.text])
  except Exception as e:r['renderError']=type(e).__name__+': '+str(e)
 else:r['renderError']='No complete SVG in the original response'
 meta.append(r)
p.with_name('extracted.json').write_text(json.dumps(meta,ensure_ascii=False,indent=2))
print([(m['id'],m['renderable']) for m in meta])
