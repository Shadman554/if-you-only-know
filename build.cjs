'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=__dirname,out=path.join(root,'dist'),files=[];
fs.mkdirSync(path.join(out,'assets'),{recursive:true});
function write(name,data){fs.writeFileSync(path.join(out,name),data);files.push(name);}
let html=fs.readFileSync(path.join(root,'index.html'),'utf8');
for(const [stem,ext] of [['style','css'],['script','js'],['music','js']]){
  const bytes=fs.readFileSync(path.join(root,`${stem}.${ext}`));
  const name=`${stem}-${crypto.createHash('sha256').update(bytes).digest('hex').slice(0,12)}.${ext}`;
  write(name,bytes);html=html.replace(new RegExp(`${stem}(?:-[a-f0-9]+)?\\.${ext}(?:\\?v=\\d+)?`,'g'),name);
}
write('index.html',html);write('Play Updated Game.html',html);
for(const entry of fs.readdirSync(path.join(root,'assets'),{withFileTypes:true})){
  if(entry.isFile()&&/^[a-z0-9-]+\.(png|jpg|jpeg|mp3|m4a|js|ttf|woff|woff2)$/i.test(entry.name)){
    write(`assets/${entry.name}`,fs.readFileSync(path.join(root,'assets',entry.name)));
  }
}
// The server serves only this explicit list, never project files or environment files.
fs.writeFileSync(path.join(out,'_files.json'),JSON.stringify(files));
console.log(`Built ${files.length} public game files.`);
