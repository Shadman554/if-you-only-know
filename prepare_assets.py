"""Reproducible, local extraction of the user's original production sheets."""
from pathlib import Path
from PIL import Image, ImageDraw
import cv2
import numpy as np
import json

ROOT=Path(__file__).parent
files=sorted(ROOT.glob('ChatGPT Image*.png'))+[ROOT/name for name in ['Kawaii Hedgehog Hamster Blossom Love.png','Pastel Cherry Blossom Puzzle Asset Sheet.png','Pastel Sakura Hedgehog Puzzle Tiles.png']]
OUT=ROOT/'assets'; OUT.mkdir(exist_ok=True)
names=['walk-strip','idle-strip','think-strip','care-strip','handoff-strip','shy-strip',
       'hedgehog-walk','hamster-idle','hedgehog-think','hedgehog-care','duo-handoff','hamster-shy',
       'hedgehog-idle','hedgehog-sad','hedgehog-bow','hedgehog-happy','hamster-walk','hamster-sad',
       'hedgehog-sit','hamster-listen','hamster-receive','hamster-happy','hamster-sit','duo-sit','duo-look',
       'button-start','button-next','button-keep','button-pause','icons-heart','icons-question','tile-style',
       'icons-flower','grass','dialogue','flower','heart','floating-hearts','finger','sparkle','landscape','puzzle-celebrate']
manifest={}; inventory=[]

def transparent(im):
    a=np.array(im.convert('RGB'))
    # Only remove white connected to the outside: pale faces and card interiors stay opaque.
    white=((a.min(2)>231)&(a.max(2).astype(int)-a.min(2)<25)).astype('uint8')
    n, labels=cv2.connectedComponents(white)
    edge=np.unique(np.concatenate([labels[0],labels[-1],labels[:,0],labels[:,-1]]))
    edge=edge[edge!=0]
    bg=np.isin(labels,edge)
    alpha=np.where(bg,0,255).astype('uint8')
    # Anti-alias the outside edge without erasing the hand-drawn outline.
    ring=cv2.dilate(bg.astype('uint8'),np.ones((3,3),np.uint8)).astype(bool)&~bg
    alpha[ring]=np.minimum(255,(255-a[ring].min(1))*3).astype('uint8')
    return Image.fromarray(np.dstack([a,alpha]))

def save_sequence(name, crops, source, boxes=None, opaque=False, anchored=False):
    prepared=[c.convert('RGBA') if opaque else transparent(c) for c in crops]
    if anchored:
        # A common scale and ground anchor; never resize individual poses independently.
        aligned=[]; offsets=[]; body_heights=[]
        for c in prepared:
            a=np.array(c)
            n,lab,stats,cent=cv2.connectedComponentsWithStats((a[:,:,3]>100).astype('uint8'))
            main=1+np.argmax(stats[1:,cv2.CC_STAT_AREA])
            x,y,w,h,_=stats[main]; center=x+w/2; floor=c.getbbox()[3]
            body_heights.append(h)
            if name.startswith('duo-'):
                l,t,r,b=c.getbbox(); center=(l+r)/2; floor=b
            offsets.append((-round(center),-int(floor)))
        # One fixed stage across ALL character sheets eliminates size changes on state switches.
        scale=210/float(np.median(body_heights)); W=720 if name.startswith('duo-') else 440; H=400
        for c,(x,y) in zip(prepared,offsets):
            canvas=Image.new('RGBA',(W,H))
            c=c.resize((round(c.width*scale),round(c.height*scale)),Image.Resampling.LANCZOS)
            canvas.alpha_composite(c,(round(W/2+x*scale),round(388+y*scale)))
            aligned.append(canvas)
        prepared=aligned
    # Shared crop across a sequence preserves frame size and proportions.
    b=[c.getbbox() for c in prepared if c.getbbox()]
    common=(0,0,prepared[0].width,prepared[0].height) if anchored else (max(0,min(v[0] for v in b)-5),max(0,min(v[1] for v in b)-5),max(v[2] for v in b)+5,max(v[3] for v in b)+5)
    paths=[]
    for j,c in enumerate(prepared):
        c=c.crop(common)
        path=f'{name}-{j+1:02}.png'; c.save(OUT/path,optimize=True); paths.append('assets/'+path)
    manifest[name]=paths
    inventory.append(dict(name=name,source=source,frames=len(paths),crop_boxes=boxes,transparent=not opaque))

for i in range(6,42):
    im=Image.open(files[i]).convert('RGB'); a=np.array(im)
    contours,_=cv2.findContours((cv2.cvtColor(a,cv2.COLOR_RGB2GRAY)<210).astype('uint8'),cv2.RETR_EXTERNAL,cv2.CHAIN_APPROX_SIMPLE)
    boxes=[cv2.boundingRect(c) for c in contours]
    boxes=sorted([b for b in boxes if b[2]>im.width*.14 and im.height*.18<b[3]<im.height*.5],key=lambda b:(b[1]//50,b[0]))
    expected={6:12,7:10,8:10,9:8,10:10,11:8,40:8}.get(i,12)
    assert len(boxes)==expected,(i,len(boxes))
    crops=[]
    for x,y,w,h in boxes:
        # Walk sheet uniquely places its numbers INSIDE the frames.
        bottom=y+h-(36 if i==6 else 11)
        crops.append(im.crop((x+11,y+11,x+w-11,bottom)))
    save_sequence(names[i],crops,files[i].name,boxes,opaque=i==40,anchored=6<=i<=24)

# The unframed strips have different spacing; preserve their actual panel boundaries.
strip_bounds=[([0,192,378,560,740,914,1090,1260,1448],440,663),
              ([0,241,482,724,965,1206,1448],445,714),
              ([0,241,482,724,965,1206,1448],425,762),
              ([0,241,482,724,965,1206,1448],420,733),
              ([0,165,319,583,745,862,1077,1270,1448],482,698),
              ([0,241,482,724,965,1206,1448],430,733)]
for i,(edges,top,bottom) in enumerate(strip_bounds):
    im=Image.open(files[i])
    save_sequence(names[i],[im.crop((edges[j],top,edges[j+1],bottom)) for j in range(len(edges)-1)],files[i].name)

for i in range(42,50):
    im=Image.open(files[i]).convert('RGB'); im.save(OUT/f'background-{i-41}.jpg',quality=94)
    inventory.append(dict(name=f'background-{i-41}',source=files[i].name,frames=1,transparent=False))

# Clean only the printed straight grid, preserving the original drawing on both sides.
original=cv2.imread(str(files[50])); mask=np.zeros(original.shape[:2],np.uint8)
for p in [418,834]:
    mask[:,p-4:p+5]=255; mask[p-4:p+5,:]=255
clean=cv2.inpaint(original,mask,4,cv2.INPAINT_TELEA)[7:-7,7:-7]
clean=cv2.resize(clean,(1200,1200),interpolation=cv2.INTER_AREA)
cv2.imwrite(str(OUT/'puzzle.jpg'),clean,[cv2.IMWRITE_JPEG_QUALITY,97])
for r in range(3):
    for c in range(3):
        cv2.imwrite(str(OUT/f'puzzle-tile-{r*3+c+1}.png'),clean[r*400:(r+1)*400,c*400:(c+1)*400])
inventory.append(dict(name='puzzle',source=files[50].name,frames=9,notes='Printed grid removed; 9 exact 400px tiles from a continuous 1200px image.'))

# Mixed puzzle reference: separate every region, never show the sheet as a game sprite.
im=Image.open(files[51])
save_sequence('reference-puzzle',[im.crop((536,69,983,466))],files[51].name,opaque=True)
save_sequence('reference-shuffled-tiles',[im.crop((x+3,y+3,x+147,y+125)) for y in [65,202,340] for x in [26,187,347]],files[51].name,opaque=True)
save_sequence('reference-flower',[im.crop((x+4,y+4,x+115,y+109)) for y in [62,198,334] for x in [1022,1149,1277,1403]],files[51].name)
for name,xs in [('reference-heart',[18,108,199,289]),('reference-floating',[398,488,578,669]),('reference-finger',[780,870,961,1051]),('reference-sparkle',[1161,1252,1342,1433])]:
    save_sequence(name,[im.crop((x+3,y+3,x+82,y+81)) for y in [547,646,746] for x in xs],files[51].name)
save_sequence('reference-scenery',[im.crop(b) for b in [(40,908,171,1008),(187,908,322,1008),(339,908,476,1008),(492,908,640,1008),(658,908,795,1008),(812,908,962,1008),(980,902,1108,1008),(1127,902,1238,1008),(1255,902,1367,1008),(1380,902,1495,1008)]],files[51].name,opaque=True)
im=Image.open(files[52]); a=np.array(im.convert('RGB')); contours,_=cv2.findContours((cv2.cvtColor(a,cv2.COLOR_RGB2GRAY)<160).astype('uint8'),cv2.RETR_EXTERNAL,cv2.CHAIN_APPROX_SIMPLE)
boxes=sorted([cv2.boundingRect(c) for c in contours if cv2.boundingRect(c)[2]>250 and cv2.boundingRect(c)[3]>250],key=lambda b:(b[1]//50,b[0]))
assert len(boxes)==9
save_sequence('sakura-tiles',[im.crop((x+8,y+8,x+w-8,y+h-8)) for x,y,w,h in boxes],files[52].name,boxes,opaque=True)

(OUT/'manifest.js').write_text('window.ASSETS = '+json.dumps(manifest)+';',encoding='utf-8')
(ROOT/'asset-map.json').write_text(json.dumps(inventory,indent=2),encoding='utf-8')
card=Image.open(OUT/'dialogue-08.png');card.crop(card.getbbox()).save(OUT/'message-card.png')
button=Image.open(OUT/'button-keep-01.png');button.crop(button.getbbox()).save(OUT/'button-keep-clean.png')
# Review every extracted sequence on a contrasting ground, including its first/last frames.
items=list(manifest.items())
for k in range(0,len(items),12):
    canvas=Image.new('RGB',(1200,4*220),'#e6e9df'); draw=ImageDraw.Draw(canvas)
    for j,(name,paths) in enumerate(items[k:k+12]):
        x=(j%3)*400;y=(j//3)*220
        draw.text((x+8,y+5),f'{name} ({len(paths)} frames)',fill='#222222')
        for s,idx in enumerate([0,len(paths)//2,len(paths)-1]):
            p=Image.open(ROOT/paths[idx]);p.thumbnail((125,180));canvas.paste(p,(x+s*130,y+30),p)
    canvas.save(ROOT/'inspection'/f'extracted-{k}.jpg')
print(f'Prepared {sum(len(v) for v in manifest.values())} assets from all {len(files)} source images.')
