from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
import hashlib
import re
root=Path(__file__).parent
names=['index.html','style.css','script.js','music.js','README.md','ASSET-NOTES.md','asset-map.json','asset-gallery.html','prepare_assets.py','prepare_ending_assets.py','make_keepsake.py','inspect_assets.py','qa.cjs','audit-game.cjs','final-check.cjs','package_game.py','check-ending.cjs','check-ending-flow.cjs','check-controls.cjs']
# Distinct filenames prevent an existing preview from reusing stale CSS or JS.
html=(root/'index.html').read_text(encoding='utf-8')
for source,stem,suffix in [('style.css','style','css'),('script.js','script','js'),('music.js','music','js')]:
    data=(root/source).read_bytes()
    versioned=f'{stem}-{hashlib.sha256(data).hexdigest()[:12]}.{suffix}'
    (root/versioned).write_bytes(data)
    html=re.sub(rf'{stem}(?:-[a-f0-9]+)?\.{suffix}(?:\?v=\d+)?',versioned,html)
    names.append(versioned)
(root/'index.html').write_text(html,encoding='utf-8')
(root/'Play Updated Game.html').write_text(html,encoding='utf-8')
names.append('Play Updated Game.html')
with ZipFile(root/'If Only You Knew - Complete Game.zip','w',ZIP_DEFLATED,compresslevel=6) as z:
    for name in names:
        z.write(root/name,name)
    for file in sorted((root/'assets').glob('*')):
        if file.is_file():z.write(file,file.relative_to(root))
print('Packaged playable game:',round((root/'If Only You Knew - Complete Game.zip').stat().st_size/1024**2,1),'MB')
