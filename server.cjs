'use strict';
const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const root=path.join(__dirname,'dist');
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.mp3':'audio/mpeg','.m4a':'audio/mp4','.ttf':'font/ttf','.woff':'font/woff','.woff2':'font/woff2'};
function createServer(){
  const files=new Map(JSON.parse(fs.readFileSync(path.join(root,'_files.json'),'utf8')).map(name=>{
    const file=path.join(root,name),stat=fs.statSync(file);
    return [name,{file,size:stat.size,etag:`W/"${stat.size}-${Math.trunc(stat.mtimeMs)}"`}];
  }));
  return http.createServer((req,res)=>{
    res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','no-referrer');
    const reply=(code,text)=>{res.writeHead(code,{'Content-Type':'text/plain; charset=utf-8','Cache-Control':'no-store'});res.end(req.method==='HEAD'?undefined:text);};
    if(!['GET','HEAD'].includes(req.method)){res.setHeader('Allow','GET, HEAD');return reply(405,'Method not allowed');}
    let pathname;
    try {
      pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    } catch {
      return reply(400, 'Bad request');
    }
    const cleanPath = pathname.replace(/\/+$/, '') || '/';
    if (cleanPath === '/healthz' || cleanPath === '/health') return reply(200, 'ok');
    let name = pathname.replace(/^\/+/, '');
    if(!name)name='index.html';
    const item=files.get(name);if(!item)return reply(404,'Not found');
    res.setHeader('Content-Type',types[path.extname(name)]||'application/octet-stream');
    res.setHeader('Cache-Control',/^[a-z]+-[a-f0-9]{12}\./.test(name)?'public, max-age=31536000, immutable':'no-cache');
    res.setHeader('ETag',item.etag);res.setHeader('Accept-Ranges','bytes');
    if(req.headers['if-none-match']===item.etag){res.writeHead(304);return res.end();}
    let start=0,end=item.size-1,status=200;
    if(req.headers.range&&req.method==='GET'){
      const match=/^bytes=(\d*)-(\d*)$/.exec(req.headers.range);
      if(match&&(match[1]||match[2])){
        start=match[1]?Number(match[1]):Math.max(0,item.size-Number(match[2]));
        end=match[1]&&match[2]?Math.min(Number(match[2]),item.size-1):item.size-1;
      }else start=-1;
      if(!Number.isSafeInteger(start)||!Number.isSafeInteger(end)||start<0||start>end||start>=item.size){res.setHeader('Content-Range',`bytes */${item.size}`);return reply(416,'Invalid range');}
      status=206;res.setHeader('Content-Range',`bytes ${start}-${end}/${item.size}`);
    }
    res.setHeader('Content-Length',end-start+1);res.writeHead(status);
    if(req.method==='HEAD')return res.end();
    const stream=fs.createReadStream(item.file,{start,end});
    stream.on('error',()=>res.destroy());res.on('close',()=>stream.destroy());stream.pipe(res);
  });
}
if(require.main===module){
  const primaryPort=Number(process.env.PORT||3000);
  if(!Number.isInteger(primaryPort)||primaryPort<1||primaryPort>65535)throw Error('PORT must be between 1 and 65535');
  const servers=[];
  function startListener(port,isPrimary=false){
    try{
      const s=createServer();
      s.on('error',err=>{
        if(isPrimary){
          console.error(`Primary port ${port} failed to bind:`,err);
          process.exit(1);
        }
      });
      s.listen(port,'0.0.0.0',()=>{
        console.log(`Game server ready on 0.0.0.0:${port}${isPrimary?' (primary)':' (fallback)'}`);
      });
      servers.push(s);
    }catch(e){
      if(isPrimary)throw e;
    }
  }
  startListener(primaryPort,true);
  for(const fallback of [3000,8080]){
    if(fallback!==primaryPort)startListener(fallback,false);
  }
  for(const signal of ['SIGTERM','SIGINT'])process.once(signal,()=>{
    console.log(`Received ${signal}, closing server...`);
    for(const s of servers)s.close();
    setTimeout(()=>process.exit(0),8000).unref();
  });
}
module.exports={createServer};
