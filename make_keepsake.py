from PIL import Image, ImageDraw, ImageFont
from pathlib import Path
import base64
root=Path(__file__).parent
canvas=Image.open(root/'assets/background-8.jpg').convert('RGBA').resize((900,1600))
draw=ImageDraw.Draw(canvas)
font_path='C:/Windows/Fonts/segoepr.ttf'
title=ImageFont.truetype(font_path,44)
body=ImageFont.truetype(font_path,43)
small=ImageFont.truetype(font_path,25)
draw.text((450,285),'A Little Flower, Just for You',font=title,fill='#a76578',anchor='mm')
flower=Image.open(root/'assets/flower-03.png');flower.thumbnail((390,500));canvas.alpha_composite(flower,((900-flower.width)//2,470))
draw.multiline_text((450,1200),'A little reminder\nthat you matter.',font=body,fill='#59463e',anchor='mm',align='center',spacing=22)
draw.text((450,1430),'If Only You Knew...',font=small,fill='#95796f',anchor='mm')
canvas.convert('RGB').save(root/'assets/keepsake.png')
(root/'assets/keepsake-data.js').write_text('window.KEEPSAKE_DATA="data:image/png;base64,'+base64.b64encode((root/'assets/keepsake.png').read_bytes()).decode()+'";',encoding='utf-8')
