const {chromium}=require('C:/Users/NAMI/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('fs'),assert=require('assert');
const letter=`I know things are not the same right now.
And I know an apology does not undo the hurt.
But if there is one thing I hope you can feel through this little story,
it is that my heart was never against you.
I cared.
I worried.
And in the wrong way, I made things heavier for you.
I understand that now.
I do not want to pressure you,
and I do not expect everything to become okay in one moment.
I only want to leave this small door open.
Because if one day you feel ready,
even a little hello from you
would mean more to me than you know. ❤️`.replace(/\s+/g,' ');
const farewell=`You don't have to say anything.
I hope this little flower brings you a smile.
And if our paths find their way back to a conversation someday, I'll be happy to hear from you.
Until then, take care of your beautiful little heart. ❤️`.replace(/\s+/g,' ');
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
 try{
  const page=await browser.newPage({viewport:{width:390,height:844},acceptDownloads:true});
  await page.goto('http://127.0.0.1:8765/index.html');await page.evaluate(()=>showScene(7));await page.waitForTimeout(800);
  assert.equal(await page.evaluate(()=>currentMessage.words.map(w=>w.text).join(' ')),letter);
  assert.equal(await page.locator('h1').innerText(),"If one day you feel ready,\nI'd love to hear from you again.");
  assert.equal(await page.locator('.eyebrow').innerText(),'A LITTLE DOOR LEFT OPEN');
  await page.screenshot({path:'inspection/new-ending-letter.png'});
  while(await page.evaluate(()=>currentMessage.hasMore()))await page.getByRole('button',{name:'Next',exact:true}).click();
  await page.screenshot({path:'inspection/new-ending-choices.png'});
  const downloadEvent=page.waitForEvent('download');
  await page.getByRole('button',{name:'Keep the flower for now 🌸'}).focus();await page.keyboard.press('Enter');
  const download=await downloadEvent;assert.equal(await download.failure(),null);
  assert(fs.readFileSync(await download.path()).equals(fs.readFileSync('assets/keepsake.png')));
  await page.waitForTimeout(3600);await page.screenshot({path:'inspection/new-ending-flower.png'});
  await page.waitForTimeout(2500);await page.screenshot({path:'inspection/new-ending-heart.png'});
  await page.locator('.peaceful-finale').waitFor({state:'visible'});await page.waitForTimeout(1500);
  assert.equal(await page.evaluate(()=>currentMessage.words.map(w=>w.text).join(' ')),farewell);
  await page.screenshot({path:'inspection/new-ending-farewell.png'});
  await page.getByRole('button',{name:'Read our little story again'}).click();assert.equal(await page.evaluate(()=>sceneIndex),0);
  const calm=await browser.newPage({viewport:{width:320,height:568},reducedMotion:'reduce',acceptDownloads:true});
  const errors=[];calm.on('pageerror',e=>errors.push(e.message));
  await calm.goto('http://127.0.0.1:8765/index.html');await calm.evaluate(()=>showScene(7));
  while(await calm.evaluate(()=>currentMessage.hasMore()))await calm.getByRole('button',{name:'Next',exact:true}).click();
  const boxes=await calm.locator('.ending-choice,.ending-replay').evaluateAll(nodes=>nodes.map(n=>{const r=n.getBoundingClientRect();return{top:r.top,bottom:r.bottom};}));
  for(let i=1;i<boxes.length;i++)assert(boxes[i].top>=boxes[i-1].bottom,'Ending controls overlap');
  await calm.getByRole('button',{name:'Keep the flower for now 🌸'}).click();await calm.waitForTimeout(1800);
  assert(await calm.locator('.peaceful-finale').isVisible(),'Reduced-motion ending did not finish');
  while(await calm.evaluate(()=>currentMessage.hasMore()))await calm.getByRole('button',{name:'Next',exact:true}).click();
  assert(await calm.getByText('The End 🌸',{exact:true}).isVisible());
  assert.deepEqual(errors,[]);
  fs.writeFileSync('inspection/new-ending-audit.json',JSON.stringify({passed:true,checks:['exact user heading and both messages','keyboard flower choice','download bytes match PNG','sequential flower animation screenshots','reduced-motion ending','320px choice spacing','replay']},null,2));
  console.log('New ending text, keyboard choice, downloaded gift, animation, reduced motion and replay passed.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
