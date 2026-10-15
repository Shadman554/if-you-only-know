'use strict';
const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const root=path.join(__dirname,'dist');
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.mp3':'audio/mpeg','.m4a':'audio/mp4'};
function createServer(){
  const files=new Map(JSON.parse(fs.readFileSync(path.join(root,'_files.json'),'utf8')).map(name=>{
    const file=path.join(root,name),stat=fs.statSync(file);
    return [name,{file,size:stat.size,etag:`W/"${stat.size}-${Math.trunc(stat.mtimeMs)}"`}];
  }));
  return http.createServer((req,res)=>{
    res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','no-referrer');
    const reply=(code,text)=>{res.writeHead(code,{'Content-Type':'text/plain; charset=utf-8','Cache-Control':'no-store'});res.end(req.method==='HEAD'?undefined:text);};
    if(!['GET','HEAD'].includes(req.method)){res.setHeader('Allow','GET, HEAD');return reply(405,'Method not allowed');}
    let name;try{name=decodeURIComponent(new URL(req.url,'http://localhost').pathname).slice(1);}catch{return reply(400,'Bad request');}
    if(name==='healthz')return reply(200,'ok');
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
  const port=Number(process.env.PORT||3000);
  if(!Number.isInteger(port)||port<1||port>65535)throw Error('PORT must be between 1 and 65535');
  const server=createServer();server.listen(port,'0.0.0.0',()=>console.log(`Game server ready on port ${port}`));
  for(const signal of ['SIGTERM','SIGINT'])process.once(signal,()=>{
    server.close(()=>process.exit(0));setTimeout(()=>process.exit(0),8000).unref();
  });
}
module.exports={createServer};
