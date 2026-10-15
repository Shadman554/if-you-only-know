from PIL import Image, ImageDraw
from pathlib import Path
files = sorted(Path('.').glob('*.png'))
out = Path('inspection')
out.mkdir(exist_ok=True)
for i, file in enumerate(files):
    print(f'{i:02} {file.name} {Image.open(file).size}')
for k in range(0, len(files), 12):
    batch = files[k:k+12]
    canvas = Image.new('RGB', (1000, ((len(batch)+3)//4)*320), '#eeeeee')
    for j, file in enumerate(batch):
        im = Image.open(file).convert('RGB')
        im.thumbnail((240,290))
        x,y = j%4*250,j//4*320
        canvas.paste(im,(x,y))
        ImageDraw.Draw(canvas).text((x,y+294),f'{k+j:02} {file.stem[24:]}',fill='black')
    canvas.save(out/f'contact-{k}.jpg')
