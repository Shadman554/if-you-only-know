"""Extract the added hedgehog sheet using the game's existing transparent stage."""
from pathlib import Path
from PIL import Image, ImageDraw
import ast, json, cv2
import numpy as np

ROOT=Path(__file__).parent
OUT=ROOT/'assets'
manifest=json.loads((OUT/'manifest.js').read_text(encoding='utf-8').split('=',1)[1].strip().rstrip(';'))
inventory=json.loads((ROOT/'asset-map.json').read_text(encoding='utf-8'))
# Reuse extraction helpers without rebuilding or touching the original 53 sheets.
tree=ast.parse((ROOT/'prepare_assets.py').read_text(encoding='utf-8'))
helpers=ast.Module(body=[n for n in tree.body if isinstance(n,ast.FunctionDef) and n.name in ('transparent','save_sequence')],type_ignores=[])
exec(compile(helpers,'prepare_assets.py','exec'))
name='hedgehog-alone-sad'
inventory[:]=[item for item in inventory if item['name']!=name]
source=ROOT/'Hedgehog Alone_ Sad Sprite Sheet.png'
im=Image.open(source).convert('RGB')
contours,_=cv2.findContours((cv2.cvtColor(np.array(im),cv2.COLOR_RGB2GRAY)<160).astype('uint8'),cv2.RETR_EXTERNAL,cv2.CHAIN_APPROX_SIMPLE)
boxes=sorted([cv2.boundingRect(c) for c in contours if cv2.boundingRect(c)[2]>im.width*.18 and im.height*.2<cv2.boundingRect(c)[3]<im.height*.35],key=lambda b:(b[1]//50,b[0]))
assert len(boxes)==12,boxes
crops=[im.crop((x+10,y+10,x+w-10,y+h-10)) for x,y,w,h in boxes]
save_sequence(name,crops,source.name,boxes,anchored=True)
(OUT/'manifest.js').write_text('window.ASSETS = '+json.dumps(manifest)+';',encoding='utf-8')
(ROOT/'asset-map.json').write_text(json.dumps(inventory,indent=2),encoding='utf-8')
# Remove only the transparent margins around the existing Start artwork.
frames=[Image.open(OUT/f'button-start-{i:02}.png') for i in (1,2,3)]
bounds=[f.getbbox() for f in frames]
common=(min(b[0] for b in bounds),min(b[1] for b in bounds),max(b[2] for b in bounds),max(b[3] for b in bounds))
for i,f in enumerate(frames,1):f.crop(common).save(OUT/f'button-start-clean-{i:02}.png')
contact=Image.new('RGB',(1200,660),'#eee7dc');draw=ImageDraw.Draw(contact)
for i,path in enumerate(manifest[name]):
 frame=Image.open(ROOT/path);frame.thumbnail((290,195));x=(i%4)*300;y=(i//4)*220
 contact.paste(frame,(x,y),frame);draw.text((x+140,y+200),str(i+1),fill='black')
contact.save(ROOT/'inspection/new-sad-frames.jpg')
print('Prepared 12 separate, grounded frames and trimmed Start artwork.')
