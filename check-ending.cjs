const fs=require('fs'),assert=require('assert');
// Runtime ending and privacy checks live in audit-game.cjs.
const html=fs.readFileSync('Play Updated Game.html','utf8');
assert.equal(html,fs.readFileSync('index.html','utf8'));
for(const [stem,ext] of [['style','css'],['script','js'],['music','js']]){
 const file=html.match(new RegExp(stem+'-[a-f0-9]+\\.'+ext))[0];
 assert(fs.readFileSync(file).equals(fs.readFileSync(stem+'.'+ext)),'Fresh launcher has stale '+stem);
}
const gift=fs.readFileSync('assets/keepsake.png');
const embedded=fs.readFileSync('assets/keepsake-data.js','utf8').match(/base64,([^"]+)/)[1];
assert(Buffer.from(embedded,'base64').equals(gift),'Offline keepsake differs from PNG');
assert.equal(gift.readUInt32BE(16),900);assert.equal(gift.readUInt32BE(20),1600);
console.log('Packaged launchers, music, and offline keepsake match the current sources.');
