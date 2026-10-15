/* Buildless and offline. Only the explicitly chosen WhatsApp link leaves the game. */
'use strict';
const A=window.ASSETS;
const game=document.querySelector('#game'),scene=document.querySelector('#scene');
const announcement=document.querySelector('#announcement');
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
let sceneIndex=0,elapsed=0,lastTime=0,paused=false,animations=[],events=[],kept=false;
let board=[],moves=0,puzzleWon=false,moveLockUntil=0,drag=null,flowerSelected=false;
let currentMessage=null,messageObserver=null;
let savedPuzzle=null;
const labels=['A little beginning','A thousand questions','Piece by piece','A little honesty','A small gesture','More than words','From my heart','A little door left open'];
const cache=new Map();
function preload(name){(A[name]||[]).forEach(src=>{if(!cache.has(src)){const im=new Image();im.src=src;cache.set(src,im);}});}
function el(tag,cls,text){const e=document.createElement(tag);if(cls)e.className=cls;if(text!==undefined)e.textContent=text;return e;}
function add(tag,cls,text){const e=el(tag,cls,text);scene.append(e);return e;}
function schedule(at,fn){events.push({at,fn});}
function announce(text){announcement.textContent=text;}
function sprite(name,cls,options={}){
  preload(name);const im=add('img',cls);im.alt=options.alt||'';im.draggable=false;
  animate(im,name,options);return im;
}
function animate(im,name,options={}){
  preload(name);animations=animations.filter(a=>a.im!==im);
  const frames=options.frames||A[name].map((_,i)=>i);
  const durations=options.durations||frames.map(()=>options.ms||320);
  im.src=A[name][frames[0]];animations.push({im,name,frames,durations,start:elapsed,loop:options.loop!==false,last:-1,hold:options.hold??1000});
}
function actors(left='hedgehog-idle',right='hamster-idle'){
  return [sprite(left,'actor left',{alt:'A little hedgehog'}),sprite(right,'actor right',{alt:'A green-eyed hamster with a flower by her ear'})];
}
function message(html,cls=''){
  const e=add('div','message '+cls),copy=el('div','message-copy'),p=el('p'),counter=el('span','message-pagination');
  copy.append(p);e.append(copy,counter);counter.setAttribute('aria-hidden','true');
  const source=el('div');source.innerHTML=html;
  const words=[];let breaks=0;const preserveBreaks=cls.split(' ').includes('letter');
  function collect(node,strong=false){
    if(node.nodeType===Node.TEXT_NODE){for(const text of node.textContent.match(/\S+/g)||[]){words.push({text,strong,breaks});breaks=0;}}
    else if(node.nodeName==='BR'&&preserveBreaks)breaks=Math.min(2,breaks+1);
    else for(const child of node.childNodes)collect(child,strong||node.nodeName==='STRONG');
  }
  collect(source);
  const state={page:0,pages:[],words,button:null};currentMessage=state;
  function write(start,end){
    const fragment=document.createDocumentFragment();
    words.slice(start,end).forEach((word,i)=>{if(i){fragment.append(document.createTextNode(' '));for(let n=0;n<word.breaks;n++)fragment.append(el('br'));}const part=word.strong?el('strong','',word.text):document.createTextNode(word.text);fragment.append(part);});
    p.replaceChildren(fragment);
  }
  function display(){
    const bounds=state.pages[state.page];if(!bounds)return;
    write(...bounds);counter.textContent=state.pages.length>1?`${state.page+1} / ${state.pages.length}`:'';
    state.button?.refresh();
  }
  state.advance=()=>{if(state.page>=state.pages.length-1)return false;state.page++;display();announce(p.textContent);return true;};
  state.previous=()=>{if(state.page<=0)return false;state.page--;display();announce(p.textContent);return true;};
  state.lastPage=()=>{state.page=state.pages.length-1;display();};
  state.hasMore=()=>state.page<state.pages.length-1;
  function paginate(){
    const anchor=state.pages[state.page]?.[0]||0;state.pages=[];
    for(let start=0;start<words.length;){
      let low=start+1,high=words.length,best=low;
      while(low<=high){const mid=Math.floor((low+high)/2);write(start,mid);if(p.scrollHeight<=copy.clientHeight+1&&p.scrollWidth<=copy.clientWidth+1){best=mid;low=mid+1;}else high=mid-1;}
      // Prefer a sentence boundary when it fills at least half the page.
      for(let end=best;end>start+Math.floor((best-start)/2);end--){if(/[,.!?;:…❤️🌸]$/.test(words[end-1].text)){best=end;break;}}
      state.pages.push([start,best]);start=best;
    }
    state.page=Math.max(0,state.pages.findIndex(([start,end])=>anchor>=start&&anchor<end));display();
  }
  paginate();messageObserver=new ResizeObserver(paginate);messageObserver.observe(copy);
  return e;
}
function heading(text,cls=''){const e=add('h1','heading '+cls,text);e.tabIndex=-1;return e;}
function primary(kind,action=()=>showScene(sceneIndex+1)){
  const b=add('button','art-button primary '+(kind==='keep'?'keep':kind==='start'?'start':''));
  b.type='button';const im=el('img');im.alt='';b.append(im);
  const actualKind=()=>kind==='keep'&&currentMessage?.hasMore()?'next':kind;
  b.refresh=()=>{const shown=actualKind();b.setAttribute('aria-label',({start:'Start',next:'Next',keep:'Keep this little flower 🌸'})[shown]);b.classList.toggle('keep',shown==='keep');im.src=shown==='keep'?'assets/button-keep-clean.png':shown==='start'?'assets/button-start-clean-01.png':A['button-'+shown][0];};
  if(currentMessage)currentMessage.button=b;b.refresh();
  b.addEventListener('pointerenter',()=>{const shown=actualKind();if(shown!=='keep')im.src=shown==='start'?'assets/button-start-clean-03.png':A['button-'+shown][2];});
  b.addEventListener('pointerleave',b.refresh);b.addEventListener('click',()=>{if(currentMessage?.advance())return;action();});return b;
}
function effect(name,cls,options={}){return sprite(name,'effect '+cls,{ms:180,hold:500,...options});}
function progress(){document.querySelector('#progress').replaceChildren(...labels.map((label,i)=>{const d=el('span','dot '+(i===sceneIndex?'active':i<sceneIndex?'done':''));d.setAttribute('aria-label',`${i+1}: ${label}${i===sceneIndex?', current moment':''}`);return d;}));}
function goPrevious(){
  if(currentMessage?.previous())return;
  if(sceneIndex>0)showScene(sceneIndex-1,true,true);
}
function previousButton(){
  const b=add('button','text-button story-previous','‹ Previous');b.type='button';b.setAttribute('aria-label','Previous');b.onclick=goPrevious;
  scene.classList.add('has-previous');return b;
}
function showScene(index,focus=true,lastPage=false){
  if(sceneIndex===2&&board.length)savedPuzzle={board:board.slice(),moves,won:puzzleWon};
  if(index===0)savedPuzzle=null;
  sceneIndex=Math.max(0,Math.min(7,index));elapsed=0;animations=[];events=[];drag=null;flowerSelected=false;kept=false;
  document.querySelector('#progress').hidden=false;
  messageObserver?.disconnect();messageObserver=null;currentMessage=null;
  scene.replaceChildren();scene.className='';scene.style.animation='none';void scene.offsetWidth;scene.style.animation='';
  document.querySelector('#background').src=`assets/background-${sceneIndex+1}.jpg`;
  scene.style.setProperty('--ground-bottom',([38,35,38,38,38,38,33,35][sceneIndex])+'%');
  add('p','eyebrow',labels[sceneIndex]);progress();
  [titleScene,thinkingScene,puzzleScene,completionScene,flowerScene,receivingScene,apologyScene,endingScene][sceneIndex]();
  if(sceneIndex>0&&sceneIndex<7)previousButton();
  if(lastPage)currentMessage?.lastPage();
  if(focus)scene.querySelector('h1')?.focus({preventScroll:true});
}
function titleScene(){
  scene.className='title-scene';
  heading('','title-heading').innerHTML='<span>If Only</span><span>You Knew...</span>';
  const [h,m]=actors('hedgehog-walk','hamster-walk');h.classList.add('walk-in-left');m.classList.add('walk-in-right');
  schedule(1550,()=>{animate(h,'hedgehog-idle',{frames:[0,1,2,3,4,5,6,7,8,9,10,11],ms:260,hold:1800});animate(m,'hamster-idle',{frames:[0,0,0,2,3,3,3,8,9],ms:280,hold:1000});});
  add('p','subtitle','Some feelings are hard to say.\nSo I made you this little moment.').style.whiteSpace='pre-line';
  primary('start',()=>{window.backgroundMusic.start();showScene(1);});add('p','tiny-note','a small story, at your own pace');
}
function thinkingScene(){
  scene.className='thinking';
  const lines=add('div','story-lines');
  ['I had a thousand questions...','But only one reason...','I was worried about you.'].forEach((text,i)=>{const p=el(i===0?'h1':'p',i?'unrevealed':'',text);if(i===0){p.style.cssText='font:inherit;margin:0';p.tabIndex=-1;}lines.append(p);if(i)schedule(reduced?i*400:i*2200,()=>p.classList.remove('unrevealed'));});
  const [h,m]=actors('hedgehog-think','hamster-listen');
  // These sheets contain different story poses, not interchangeable idle frames.
  // Keep her empty-handed, with just a brief blink between long listening holds.
  animate(m,'hamster-listen',{frames:[0,2,0],durations:[3600,180,1800],hold:0});
  animate(h,'hedgehog-think',{frames:[0,3,0],durations:[2400,180,1820],loop:false});
  // Only he reveals his heart. Stop at the quiet hold, before excited/love poses.
  schedule(reduced?800:4400,()=>animate(h,'hedgehog-care',{frames:[0,1,2,3],durations:[650,800,650,900],loop:false}));
  message('I cared so much that I let my worries turn into too many questions.<br>I didn’t realize that instead of making you feel cared for, I was making you feel pressured.<br><strong>And I’m sorry for that. ❤️</strong>');primary('next');
}
function neighbors(z){const a=[];for(let i=0;i<9;i++)if(Math.abs(i%3-z%3)+Math.abs(Math.floor(i/3)-Math.floor(z/3))===1)a.push(i);return a;}
function solved(a){return a.every((v,i)=>v===(i+1)%9);}
function shuffledBoard(){let a=[1,2,3,4,5,6,7,8,0],previous=-1;const seen=new Set([a.join('')]);for(let step=0;step<10;step++){const z=a.indexOf(0);let choices=neighbors(z).filter(i=>i!==previous);choices=choices.filter(i=>{const b=a.slice();[b[i],b[z]]=[b[z],b[i]];return !seen.has(b.join(''));});if(!choices.length)break;const i=choices[Math.floor(Math.random()*choices.length)];[a[i],a[z]]=[a[z],a[i]];previous=z;seen.add(a.join(''));}return a;}
function puzzleScene(){
  scene.className='puzzle';heading('A little tangled.','puzzle-heading');add('p','puzzle-instruction','Tap a piece beside the empty space.');
  board=savedPuzzle?savedPuzzle.board.slice():shuffledBoard();moves=savedPuzzle?.moves||0;puzzleWon=savedPuzzle?.won||false;moveLockUntil=0;
  const container=add('div','board');container.setAttribute('role','group');container.setAttribute('aria-label','Sliding picture puzzle, three by three');
  container.append(el('div','empty-tile'));
  for(let n=1;n<=8;n++){const b=el('button','tile');b.dataset.tile=n;const im=el('img');im.src=`assets/puzzle-tile-${n}.png`;im.alt='';const number=el('span','tile-number',n);number.setAttribute('aria-hidden','true');b.append(im,number);b.addEventListener('click',()=>moveTile(n));container.append(b);}
  const actions=add('div','puzzle-actions');const hint=el('button','text-button','A little hint');hint.id='hint';hint.onclick=hintPuzzle;
  const peek=el('button','text-button','See the picture');peek.id='peek';peek.setAttribute('aria-pressed','false');peek.onclick=()=>{let image=scene.querySelector('.picture-preview');if(image){image.remove();peek.textContent='See the picture';peek.setAttribute('aria-pressed','false');}else{image=add('img','picture-preview');image.src='assets/puzzle.jpg';image.alt='The finished picture: hedgehog and hamster holding a flower under cherry blossoms';peek.textContent='Back to the pieces';peek.setAttribute('aria-pressed','true');}};
  actions.append(hint,peek);add('p','puzzle-status','No rush. We can work it out.');renderBoard();
  if(puzzleWon){
    const final=el('img');final.src='assets/puzzle-tile-9.png';final.alt='';
    const tile=el('div','tile');tile.style.transform='translate(200%,200%)';tile.append(final);container.append(tile);
    scene.querySelector('.puzzle-status').textContent='Together again. ♡';primary('next');
  }
}
function renderBoard(){
  const z=board.indexOf(0);const gap=scene.querySelector('.empty-tile');gap.style.transform=`translate(${z%3*100}%,${Math.floor(z/3)*100}%)`;
  scene.querySelectorAll('.tile').forEach(b=>{const n=Number(b.dataset.tile),i=board.indexOf(n),legal=neighbors(z).includes(i);b.style.transform=`translate(${i%3*100}%,${Math.floor(i/3)*100}%)`;b.classList.toggle('movable',legal);b.classList.remove('hinted');b.setAttribute('aria-label',`Piece ${n}, row ${Math.floor(i/3)+1}, column ${i%3+1}${legal?', can move':', not next to the empty space'}`);b.setAttribute('aria-disabled',String(!legal||puzzleWon));});
}
function moveTile(n){
  if(sceneIndex!==2||puzzleWon||paused||elapsed<moveLockUntil||scene.querySelector('.picture-preview'))return;
  const i=board.indexOf(n),z=board.indexOf(0);if(!neighbors(z).includes(i)){announce('Choose a piece beside the empty space.');return;}
  [board[i],board[z]]=[board[z],board[i]];moves++;moveLockUntil=elapsed+210;renderBoard();
  scene.querySelector('.puzzle-status').textContent=moves===1?'One little step closer.':`${moves} little steps. Take your time.`;
  if(solved(board)){puzzleWon=true;renderBoard();const final=el('img');final.src='assets/puzzle-tile-9.png';final.alt='';const b=el('div','tile');b.style.transform='translate(200%,200%)';b.append(final);scene.querySelector('.board').append(b);announce('You brought the picture together.');scene.querySelector('.puzzle-status').textContent='Together again. ♡';effect('sparkle','sparkle-left');effect('sparkle','sparkle-right');schedule(elapsed+1500,()=>showScene(3));}
}
// Breadth-first search gives a shortest legal hint for every reachable 8-puzzle state.
function solution(a){
  const start=a.join(''),goal='123456780';if(start===goal)return [];
  const queue=[start],parents=new Map([[start,null]]);let head=0;
  while(head<queue.length){const s=queue[head++],z=s.indexOf('0');for(const i of neighbors(z)){const b=s.split('');[b[i],b[z]]=[b[z],b[i]];const next=b.join('');if(parents.has(next))continue;parents.set(next,[s,Number(s[i])]);if(next===goal){const path=[];let key=goal;while(parents.get(key)){const [prev,tile]=parents.get(key);path.push(tile);key=prev;}return path.reverse();}queue.push(next);}}
  return [];
}
function hintPuzzle(){if(puzzleWon||scene.querySelector('.picture-preview'))return;const path=solution(board);if(path.length){const b=scene.querySelector(`[data-tile="${path[0]}"]`);b.classList.add('hinted');b.focus({preventScroll:true});announce(`Try moving piece ${path[0]}.`);scene.querySelector('.puzzle-status').textContent='Try the piece with the pink edge.';}}
function completionScene(){scene.className='completion';heading('There we are.');const im=add('img','completed-picture');im.src='assets/puzzle.jpg';im.alt='The completed picture of the hedgehog and hamster sharing a flower';effect('sparkle','sparkle-left',{loop:false});effect('floating-hearts','sparkle-right');message('Sometimes I let my worries make things harder than they need to be.<br>I kept asking when I should have listened, understood, and given you space.<br>You didn’t deserve that pressure.<br><strong>I’m sorry. ❤️</strong>');primary('next');}
function flowerScene(){
  heading('A flower, just for you.');add('p','flower-instruction','Drag the flower to give it to her.');actors('hedgehog-idle','hamster-idle');
  const target=add('button','flower-target');target.setAttribute('aria-label','Give the flower to the hamster');target.onclick=()=>{if(flowerSelected)receiveFlower();else{announce('Pick up the flower first.');scene.querySelector('.flower-button').focus();}};
  const b=add('button','flower-button');b.setAttribute('aria-label','Pick up the flower');b.setAttribute('aria-pressed','false');const im=el('img');im.alt='Pink flower';b.append(im);animate(im,'flower',{ms:250,hold:500});
  sprite('finger','drag-hint',{ms:220});add('p','flower-caption','Or tap the flower, then tap her.');
  b.addEventListener('pointerdown',e=>{if(paused)return;e.preventDefault();b.setPointerCapture(e.pointerId);const rect=b.getBoundingClientRect(),g=game.getBoundingClientRect();drag={id:e.pointerId,x:e.clientX,y:e.clientY,dx:e.clientX-rect.left,dy:e.clientY-rect.top,g,moved:false};b.classList.add('dragging');target.classList.add('ready');scene.querySelector('.drag-hint').hidden=true;});
  b.addEventListener('pointermove',e=>{if(!drag||drag.id!==e.pointerId)return;drag.moved ||= Math.hypot(e.clientX-drag.x,e.clientY-drag.y)>7;if(!drag.moved)return;b.style.left=`${Math.max(0,Math.min(81,(e.clientX-drag.g.left-drag.dx)/drag.g.width*100))}%`;b.style.top=`${Math.max(0,Math.min(86,(e.clientY-drag.g.top-drag.dy)/drag.g.height*100))}%`;});
  b.addEventListener('pointerup',e=>{if(!drag)return;const moved=drag.moved,r=target.getBoundingClientRect();drag=null;b.classList.remove('dragging');if(moved&&e.clientX>=r.left-20&&e.clientX<=r.right+20&&e.clientY>=r.top-20&&e.clientY<=r.bottom+20){receiveFlower();return;}b.style.left='';b.style.top='';if(!moved)selectFlower();else{target.classList.toggle('ready',flowerSelected);announce('A little closer to her. Try again, or tap the flower and then her.');}});
  b.addEventListener('pointercancel',()=>{drag=null;b.style.left='';b.style.top='';b.classList.remove('dragging');target.classList.toggle('ready',flowerSelected);});
  b.addEventListener('click',e=>{if(e.detail===0)selectFlower();});
}
function selectFlower(){flowerSelected=true;const b=scene.querySelector('.flower-button');b.classList.add('selected');b.setAttribute('aria-pressed','true');scene.querySelector('.flower-target').classList.add('ready');scene.querySelector('.flower-caption').textContent='Now tap her to give her the flower.';announce('Flower picked up. Tap the hamster to give it to her.');}
function receiveFlower(){if(sceneIndex!==4)return;announce('She received your little flower.');showScene(5);}
function receivingScene(){
  scene.className='handoff';heading('More than a promise.');const duo=sprite('duo-handoff','actor duo',{ms:330,loop:false,alt:'The hedgehog gently gives the hamster a flower'});
  schedule(3500,()=>{duo.remove();const [h,m]=actors('hedgehog-happy','hamster-receive');animate(m,'hamster-receive',{frames:[4,5,6,7,8,9,10,11],ms:400,loop:false});effect('floating-hearts','float-above');});
  message('I know I’ve made the same mistake before.<br>And I understand why hearing another promise might not mean much anymore.<br>I don’t want to keep saying I’ll change, only to make you feel the same way again.<br><strong>I want to learn from this and show you through my actions, not just my words. ❤️</strong>','plain');primary('next');
}
function apologyScene(){
  scene.className='apology';heading('If only you knew...');const [h,m]=actors('hedgehog-sad','hamster-sad');
  schedule(1800,()=>{animate(h,'hedgehog-bow',{ms:440,loop:false});animate(m,'hamster-listen',{frames:[0,1,2,3,4,5],ms:500,hold:1800});});
  message('I’m terrible at speaking,<br>but I’m very good at loving you.<br>Sometimes my worries speak louder than my heart.<br>I never wanted to hurt you, but I know that doesn’t change how I made you feel.<br>I miss our little conversations. I miss making you smile.<br>And more than anything, I wish I had handled things differently.<br><strong>I’m truly sorry. ❤️</strong>','plain');primary('next');
}
function endingScene(){
  scene.className='ending invitation';
  heading("If one day you feel ready,\nI'd love to hear from you again.");
  const [h,m]=actors('hedgehog-happy','hamster-listen');
  animate(h,'hedgehog-happy',{frames:[0],loop:false});
  animate(m,'hamster-listen',{frames:[0,2,0],durations:[4200,250,2400],hold:0});
  message('I know things are not the same right now.<br><br>And I know an apology does not undo the hurt.<br><br>But if there is one thing I hope you can feel through this little story,<br>it is that my heart was never against you.<br><br>I cared.<br>I worried.<br>And in the wrong way, I made things heavier for you.<br><br>I understand that now.<br><br>I do not want to pressure you,<br>and I do not expect everything to become okay in one moment.<br><br>I only want to leave this small door open.<br><br>Because if one day you feel ready,<br>even a little hello from you<br>would mean more to me than you know. ❤️','plain letter');
  const choices=add('div','ending-choices');
  const hello=el('a','ending-choice hello-choice','Send a little hello 💌');
  hello.href='https://wa.me/9647824961601';hello.target='_blank';hello.rel='noopener noreferrer';
  const keep=el('button','ending-choice flower-choice','Keep the flower for now 🌸');keep.type='button';
  keep.onclick=()=>keepFlower();choices.append(hello,keep);
  endingReader(choices);addReplay('ending-replay');
}
function addReplay(cls=''){
  const replay=add('button','text-button replay '+cls,'Read our little story again');
  replay.type='button';replay.onclick=()=>showScene(0);return replay;
}
function endingReader(actions){
  const reader=add('div','ending-reader');
  const previous=el('button','text-button','‹ Previous'),next=el('button','art-button reader-next');
  previous.setAttribute('aria-label','Previous');next.setAttribute('aria-label','Next');
  const art=el('img');art.src=A['button-next'][0];art.alt='';next.append(art);
  next.onpointerenter=()=>art.src=A['button-next'][2];next.onpointerleave=()=>art.src=A['button-next'][0];
  previous.type=next.type='button';reader.append(previous,next);
  const state=currentMessage;
  previous.onclick=()=>{if(scene.classList.contains('invitation'))goPrevious();else state.previous();if(previous.isConnected&&previous.hidden)next.focus();};
  next.onclick=()=>{state.advance();if(next.hidden)(actions.querySelector('a,button')||scene.querySelector('.ending-replay'))?.focus({preventScroll:true});};
  // Keep the full letter available to reread, including after the choices appear.
  state.button={refresh(){
    previous.hidden=state.page===0&&!scene.classList.contains('invitation');next.hidden=!state.hasMore();
    reader.classList.toggle('finished',!state.hasMore());actions.hidden=state.hasMore();
  }};state.button.refresh();
}
function clearEndingStage(className){
  animations=[];events=[];messageObserver?.disconnect();messageObserver=null;currentMessage=null;
  scene.replaceChildren();scene.className=className;document.querySelector('#progress').hidden=true;
}
function keepFlower(){
  if(kept)return;kept=true;
  clearEndingStage('ending flower-moment');
  add('p','eyebrow','A little flower, just for you');heading('Take your time.');
  sprite('hedgehog-alone-sad','actor left',{
    ...(reduced?{frames:[11]}:{durations:[500,650,650,750,750,1000,700,1000,800,700,600,900]}),
    loop:false,alt:'The little hedgehog sitting quietly alone'
  });
  announce('The little hedgehog sits quietly alone. Take your time.');
  schedule(elapsed+(reduced?900:9300),()=>scene.classList.add('soft-fade'));
  schedule(elapsed+(reduced?1200:10500),finishFlowerEnding);
}
function finishFlowerEnding(){
  clearEndingStage('ending kept peaceful-finale');
  add('p','eyebrow','A little something to keep');heading('A Little Flower, Just for You');
  sprite('flower','kept-flower',{frames:[2],loop:false,alt:'Your little pink flower'});
  message("You don't have to say anything.<br><br>I hope this little flower brings you a smile.<br><br>And if our paths find their way back to a conversation someday, I'll be happy to hear from you.<br><br>Until then, take care of your beautiful little heart. ❤️",'plain letter');
  const actions=add('div','keepsake-actions');actions.append(el('p','the-end','The End 🌸'));
  endingReader(actions);addReplay('ending-replay');
  announce("A Little Flower, Just for You. You don't have to say anything.");
  scene.querySelector('h1').focus({preventScroll:true});
}
const dialog=document.querySelector('#pause-dialog');
function setPaused(value){paused=value;window.backgroundMusic.setPaused(value);game.classList.toggle('paused',value);if(value&&!dialog.open)dialog.showModal();if(!value&&dialog.open)dialog.close();}
document.querySelector('#pause').onclick=()=>setPaused(true);document.querySelector('#resume').onclick=()=>setPaused(false);
document.querySelector('#restart').onclick=()=>{setPaused(false);kept=false;showScene(0);};dialog.addEventListener('cancel',e=>{e.preventDefault();setPaused(false);});
document.addEventListener('visibilitychange',()=>{lastTime=0;});
function tick(now){
  const dt=lastTime?Math.min(now-lastTime,80):0;lastTime=now;
  if(!paused&&!document.hidden){elapsed+=dt;
    const due=events.filter(e=>e.at<=elapsed);events=events.filter(e=>e.at>elapsed);for(const e of due)e.fn();
    for(const a of animations){if(!a.im.isConnected)continue;const duration=a.durations.reduce((sum,ms)=>sum+ms,0);let t=a.loop?(elapsed-a.start)%(duration+a.hold):Math.min(duration-1,elapsed-a.start);let f=0;while(f<a.frames.length-1&&t>=a.durations[f]){t-=a.durations[f];f++;}if(f!==a.last){a.im.src=A[a.name][a.frames[f]];a.last=f;}}
  }requestAnimationFrame(tick);
}
showScene(0,false);requestAnimationFrame(tick);
