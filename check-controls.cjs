const {chromium}=require('C:/Users/NAMI/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('assert');
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
 try{
  const page=await browser.newPage({viewport:{width:480,height:854},acceptDownloads:true});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:8765/index.html');
  for(const width of [320,390,480]){
   await page.setViewportSize({width,height:Math.ceil(width*16/9)});await page.evaluate(()=>showScene(0));await page.waitForTimeout(700);
   const start=await page.locator('.start').boundingBox(),note=await page.locator('.tiny-note').boundingBox();
   assert(start.y+start.height<note.y,'Start overlaps caption');
   assert((await page.locator('.start img').getAttribute('src')).includes('button-start-clean'));
   if(width===480)await page.screenshot({path:'inspection/fixed-start.png'});
   for(const s of [1,3,5,6,7]){
    await page.evaluate(s=>showScene(s),s);await page.waitForTimeout(700);
    const next=page.getByRole('button',{name:'Next',exact:true}),prev=page.getByRole('button',{name:'Previous',exact:true});
    assert(await prev.isVisible(),`Missing Previous in scene ${s}`);
    assert((await next.locator('img').getAttribute('src')).includes('button-next-'),'Next should use supplied artwork');
    const n=await next.boundingBox(),p=await prev.boundingBox();assert(p.x+p.width<=n.x,'Previous and Next overlap');
    await next.click();assert.equal(await page.evaluate(()=>currentMessage.page),1);
    await prev.click();assert.equal(await page.evaluate(()=>currentMessage.page),0);
    if(width===480)await page.screenshot({path:`inspection/fixed-controls-${s}.png`});
    await prev.click();assert.equal(await page.evaluate(()=>sceneIndex),s-1,'Previous did not return to previous scene');
    if(s>3)assert(await page.evaluate(()=>!currentMessage||!currentMessage.hasMore()),'Previous scene should show its last page');
   }
  }
  await page.evaluate(()=>{showScene(0);showScene(2);moveTile(board[neighbors(board.indexOf(0))[0]]);});
  const puzzle=await page.evaluate(()=>({board:board.slice(),moves}));
  await page.getByRole('button',{name:'Previous',exact:true}).click();
  await page.getByRole('button',{name:'Next',exact:true}).click();
  assert.deepEqual(await page.evaluate(()=>({board:board.slice(),moves})),puzzle,'Back navigation lost puzzle progress');
  await page.evaluate(()=>{board=[1,2,3,4,5,6,7,8,0];puzzleWon=true;showScene(3);});
  await page.getByRole('button',{name:'Previous',exact:true}).click();
  assert.equal(await page.locator('.board .tile').count(),9);
  await page.getByRole('button',{name:'Next',exact:true}).click();assert.equal(await page.evaluate(()=>sceneIndex),3);
  await page.evaluate(()=>{showScene(7);keepFlower();});
  const frames=new Set();
  for(let i=0;i<37;i++){
   const actor=page.locator('.actor.left');if(await actor.count())frames.add((await actor.getAttribute('src')).split('/').pop());
   if(i===23)await page.screenshot({path:'inspection/fixed-sad-ending.png'});
   await page.waitForTimeout(250);
  }
  assert.equal(frames.size,12,'All 12 sad animation frames should be shown');
  await page.locator('.peaceful-finale').waitFor({state:'visible'});await page.waitForTimeout(1500);
  assert.equal(await page.locator('a[download]').count(),0,'Save control still present');
  await page.screenshot({path:'inspection/fixed-final-no-save.png'});
  assert.deepEqual(errors,[]);
  console.log('Start placement, illustrated Next, Previous pages/scenes, saved puzzle state, 12 sad frames, and removed Save button passed.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
