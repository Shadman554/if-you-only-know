"""Create a minimal Railway source bundle, excluding private/local-only files."""
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
root=Path(__file__).parent
names=['Dockerfile','.dockerignore','.gitignore','.railwayignore','railway.json','package.json','build.cjs','server.cjs','server.test.cjs','RAILWAY.md','DEPLOYMENT.md','vercel.json','netlify.toml','render.yaml','index.html','style.css','script.js','music.js']
with ZipFile(root/'If Only You Knew - Railway.zip','w',ZIP_DEFLATED,compresslevel=6) as z:
    for name in names:
        if (root/name).exists(): z.write(root/name,name)
    workflow=root/'.github'/'workflows'/'deploy.yml'
    if workflow.exists(): z.write(workflow,'.github/workflows/deploy.yml')
    for asset in sorted((root/'assets').iterdir()):
        if asset.is_file() and asset.suffix in ('.png','.jpg','.jpeg','.js','.mp3','.m4a','.ttf','.woff','.woff2'):
            z.write(asset,asset.relative_to(root))
print('Railway deployment ZIP created.')
