const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {createServer}=require('./server.cjs');
test('production server serves the complete game and audio, but no private project files',async t=>{
  const server=createServer();await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  t.after(()=>{server.closeAllConnections();server.close();});
  const base=`http://127.0.0.1:${server.address().port}`;
  let r=await fetch(base+'/healthz');assert.equal(r.status,200);assert.equal(await r.text(),'ok');
  r=await fetch(base+'/');const html=await r.text();assert.equal(r.status,200);assert.match(r.headers.get('content-type'),/text\/html/);
  assert.equal(r.headers.get('set-cookie'),null);assert.match(html,/If Only You Knew/);
  const publicFiles=JSON.parse(fs.readFileSync(path.join(__dirname,'dist/_files.json'),'utf8'));
  for(const name of publicFiles){
    const response=await fetch(base+'/'+encodeURI(name),{method:'HEAD'});
    assert.equal(response.status,200,name);assert.equal(Number(response.headers.get('content-length')),fs.statSync(path.join(__dirname,'dist',name)).size,name);
  }
  for(const match of html.matchAll(/(?:src|href)="([^"]+)"/g))assert(publicFiles.includes(match[1]),`Missing HTML dependency ${match[1]}`);
  const manifest=fs.readFileSync('dist/assets/manifest.js','utf8');
  for(const name of Object.values(JSON.parse(manifest.split('=',2)[1].trim().replace(/;$/,''))).flat())assert(publicFiles.includes(name),`Missing animation frame ${name}`);
  for(const name of ['.env','server.cjs','package.json','_files.json','inspection/repair-audit.json','assets/../server.cjs','assets/%2e%2e%2fserver.cjs','assets%5c..%5cserver.cjs'])assert.equal((await fetch(base+'/'+name)).status,404,name);
  assert.equal((await fetch(base+'/',{method:'POST',body:'test'})).status,405);
  const audio=fs.readFileSync('dist/assets/background-music.mp3');
  r=await fetch(base+'/assets/background-music.mp3',{headers:{Range:'bytes=10-99'}});
  assert.equal(r.status,206);assert.equal(r.headers.get('content-range'),`bytes 10-99/${audio.length}`);
  assert.deepEqual(Buffer.from(await r.arrayBuffer()),audio.subarray(10,100));
  r=await fetch(base+'/assets/background-music.mp3',{headers:{Range:'bytes=-64'}});
  assert.equal(r.status,206);assert.deepEqual(Buffer.from(await r.arrayBuffer()),audio.subarray(-64));
  assert.equal((await fetch(base+'/assets/background-music.mp3',{headers:{Range:'bytes=999999999999-'}})).status,416);
  r=await fetch(base+'/assets/manifest.js',{method:'HEAD'});const etag=r.headers.get('etag');
  assert.equal((await fetch(base+'/assets/manifest.js',{headers:{'If-None-Match':etag}})).status,304);
});
