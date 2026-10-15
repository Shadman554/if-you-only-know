const {chromium}=require('C:/Users/NAMI/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('fs'),assert=require('assert');
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
 const page=await browser.newPage({viewport:{width:480,height:854},acceptDownloads:true});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`);});
 await page.goto('http://127.0.0.1:8765/index.html');await page.waitForTimeout(800);
 assert(await page.$eval('#background-music',a=>a.paused));
 await page.getByRole('button',{name:'Start',exact:true}).click();await page.waitForTimeout(1200);
 assert(await page.$eval('#background-music',a=>!a.paused&&a.currentTime>0&&a.loop),'Music did not start');
 await page.locator('#music-toggle').click();assert(await page.$eval('#background-music',a=>a.paused),'Mute failed');
 await page.evaluate(()=>showScene(0));await page.getByRole('button',{name:'Start',exact:true}).click();assert(await page.$eval('#background-music',a=>a.paused),'Start lost mute preference');
 await page.locator('#music-toggle').click();await page.waitForTimeout(300);
 await page.getByRole('button',{name:'Pause game',exact:true}).click();const clock=await page.evaluate(()=>elapsed);await page.waitForTimeout(300);assert.equal(await page.evaluate(()=>elapsed),clock);assert(await page.$eval('#background-music',a=>a.paused));
 await page.getByRole('button',{name:'Keep going',exact:true}).click();await page.waitForTimeout(300);assert(await page.$eval('#background-music',a=>!a.paused));
 const pages=[];
 for(const width of [320,390,480,1024]){
  await page.setViewportSize({width,height:width===1024?768:Math.ceil(width*16/9)});
  for(let s=0;s<9;s++){
   await page.evaluate(s=>{showScene(Math.min(s,7));if(s===8){kept=true;finishFlowerEnding();}},s);
   await page.waitForTimeout(650);
   const count=await page.evaluate(()=>currentMessage?.pages.length||1);
   const seen=[];
   for(let n=0;n<count;n++){
    const geometry=await page.evaluate(()=>{
     const p=scene.querySelector('.message p'),slot=scene.querySelector('.message-copy'),button=scene.querySelector('.primary')||scene.querySelector('.ending-choices:not([hidden]),.keepsake-actions:not([hidden])')||scene.querySelector('.ending-reader');
     if(!p)return null;
     const r=p.getBoundingClientRect(),c=slot.getBoundingClientRect(),b=button.getBoundingClientRect(),g=game.getBoundingClientRect();
     return {text:p.textContent,page:currentMessage.page,words:currentMessage.words.map(w=>w.text).join(' '),font:parseFloat(getComputedStyle(p).fontSize),overflow:p.scrollHeight>slot.clientHeight+1||p.scrollWidth>slot.clientWidth+1,outside:r.top<c.top-1||r.bottom>c.bottom+1,buttonOverlap:r.bottom>b.top,buttonOffscreen:b.bottom>g.bottom};
    });
    if(geometry){assert(!geometry.overflow&&!geometry.outside&&!geometry.buttonOverlap&&!geometry.buttonOffscreen,`Layout failure width ${width} scene ${s} page ${n}: ${JSON.stringify(geometry)}`);assert(geometry.font>=13);seen.push(geometry.text);}
    if(width===480&&(n===0||n===count-1))await page.screenshot({path:`inspection/repaired-${s+1}-${n+1}.png`});
    if(n<count-1)await page.getByRole('button',{name:'Next',exact:true}).click();
   }
   if(seen.length){const expected=await page.evaluate(()=>currentMessage.words.map(w=>w.text).join(' '));assert.equal(seen.join(' '),expected,'Missing/repeated message words');}
   pages.push({width,scene:s+1,pages:count});
   if(s===7){
    assert.equal(await page.locator('.actor').count(),2,'Ending should give both friends space');
    assert.equal(await page.locator('.hello-choice').getAttribute('href'),'https://wa.me/9647824961601');
    assert.equal(await page.locator('.hello-choice').getAttribute('target'),'_blank');
    await page.getByRole('button',{name:'Previous',exact:true}).click();assert(await page.locator('.ending-choices').isHidden());
    await page.getByRole('button',{name:'Next',exact:true}).click();assert(await page.locator('.ending-choices').isVisible());
   }
  }
 }
 await page.setViewportSize({width:390,height:844});await page.evaluate(()=>showScene(1));await page.waitForTimeout(9000);
 assert((await page.locator('.actor.right').getAttribute('src')).includes('hamster-listen'));
 assert((await page.locator('.actor.left').getAttribute('src')).includes('hedgehog-care-04'));
 await page.screenshot({path:'inspection/repaired-thinking-final.png'});
 await page.evaluate(()=>showScene(2));const before=await page.evaluate(()=>board.join(''));
 await page.evaluate(()=>moveTile(board.find((v,i)=>v&&!neighbors(board.indexOf(0)).includes(i))));assert.equal(await page.evaluate(()=>board.join('')),before,'Illegal puzzle move');
 await page.getByRole('button',{name:'See the picture',exact:true}).click();assert.equal(await page.locator('.picture-preview').count(),1);await page.getByRole('button',{name:'Back to the pieces',exact:true}).click();
 await page.getByRole('button',{name:'A little hint',exact:true}).click();assert.equal(await page.locator('.hinted').count(),1);
 const path=await page.evaluate(()=>solution(board));for(const tile of path){await page.locator(`[data-tile="${tile}"]`).click();await page.waitForTimeout(250);}
 await page.waitForTimeout(1700);assert.equal(await page.evaluate(()=>sceneIndex),3);
 while(await page.evaluate(()=>sceneIndex===3))await page.getByRole('button',{name:'Next',exact:true}).click();
 const f=await page.locator('.flower-button').boundingBox(),t=await page.locator('.flower-target').boundingBox();
 await page.mouse.move(f.x+f.width/2,f.y+f.height/2);await page.mouse.down();await page.mouse.move(5,20,{steps:5});await page.mouse.up();assert.equal(await page.evaluate(()=>sceneIndex),4);
 await page.mouse.move(f.x+f.width/2,f.y+f.height/2);await page.mouse.down();await page.mouse.move(t.x+t.width/2,t.y+t.height/2,{steps:10});await page.mouse.up();assert.equal(await page.evaluate(()=>sceneIndex),5);
 await page.evaluate(()=>showScene(4));await page.locator('.flower-button').focus();await page.keyboard.press('Enter');await page.locator('.flower-target').focus();await page.keyboard.press('Enter');assert.equal(await page.evaluate(()=>sceneIndex),5);
 for(let i=0;i<30&&await page.evaluate(()=>sceneIndex<7);i++)await page.locator('.primary').click();
 while(await page.evaluate(()=>currentMessage.hasMore()))await page.getByRole('button',{name:'Next',exact:true}).click();
 const external=[];page.on('request',r=>{if(!r.url().startsWith('http://127.0.0.1:8765/')&&!r.url().startsWith('blob:'))external.push(r.url());});
 const automatic=page.waitForEvent('download');await page.getByRole('button',{name:'Keep the flower for now 🌸',exact:true}).click();
 const gift=await automatic;assert.equal(await gift.failure(),null);assert.equal(gift.suggestedFilename(),'A little flower for you.png');
 assert(await page.evaluate(()=>kept),'Ending unreachable');
 const position=await page.locator('.actor.left').boundingBox();
 await page.waitForTimeout(3500);assert.equal(await page.locator('.actor').count(),1);assert.equal(await page.locator('.actor.right').count(),0);
 await page.getByRole('button',{name:'Pause game',exact:true}).click();const pausedTime=await page.evaluate(()=>elapsed);await page.waitForTimeout(500);assert.equal(await page.evaluate(()=>elapsed),pausedTime);
 await page.getByRole('button',{name:'Keep going',exact:true}).click();await page.waitForTimeout(3000);
 assert.deepEqual(await page.locator('.actor.left').boundingBox(),position,'Hedgehog approached her');
 assert((await page.locator('.actor.left').getAttribute('src')).includes('hedgehog-alone-sad-'));
 assert.equal(await page.locator('.peaceful-heart').count(),0);
 await page.locator('.peaceful-finale').waitFor({state:'visible'});assert.equal(await page.locator('a[href*="wa.me"]').count(),0);assert.deepEqual(external,[],'Flower choice contacted an external service');
 while(await page.evaluate(()=>currentMessage.hasMore()))await page.getByRole('button',{name:'Next',exact:true}).click();
 assert.equal(await page.getByRole('link',{name:'Save your little flower'}).count(),0,'Save button should be removed');
 await page.getByRole('button',{name:'Read our little story again'}).click();assert.equal(await page.evaluate(()=>sceneIndex),0);
 assert.deepEqual(errors,[]);
 fs.writeFileSync('inspection/repair-audit.json',JSON.stringify({passed:true,pages,errors,checks:['all scenes and message pages','all wording preserved','320/390/480/1024px layouts','readable text without clipping or button overlap','music/start/mute/pause/resume and mute persistence','calm listening and one-shot heart reveal','ending choices and rereading','correct Iraq WhatsApp link','flower download on choice','solo hedgehog animation and soft ending','hedgehog stays grounded alone','no outgoing request on flower choice','puzzle legality/hint/preview/solution','invalid and valid drag','keyboard flower','keepsake download','replay']},null,2));
 await browser.close();console.log('All repair checks passed.');
})().catch(e=>{console.error(e);process.exit(1)});
