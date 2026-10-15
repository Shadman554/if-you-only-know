const {chromium}=require('C:/Users/NAMI/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
 const p=await browser.newPage({viewport:{width:505,height:850}});
 await p.goto('file:///'+process.cwd().replaceAll('\\','/')+'/index.html');
 await p.getByRole('button',{name:'Start',exact:true}).click();
 let changes=0,previous='',held='';
 for(let i=0;i<60;i++){
  await p.waitForTimeout(200);
  const state=await p.evaluate(()=>({time:elapsed,hamster:scene.querySelector('.right').getAttribute('src'),hedgehog:scene.querySelector('.left').getAttribute('src'),motion:getComputedStyle(scene.querySelector('.right')).animationName,effects:scene.querySelectorAll('.effect').length}));
  if(!['assets/hamster-listen-01.png','assets/hamster-listen-03.png'].includes(state.hamster))throw Error('Premature gift/excited hamster pose: '+state.hamster);
  if(state.motion!=='none'||state.effects)throw Error('Extra motion still active');
  if(previous&&previous!==state.hamster)changes++;previous=state.hamster;
  if(state.time>8000){if(state.hedgehog!=='assets/hedgehog-care-04.png')throw Error('Heart reveal failed to settle');held=state.hedgehog;}
 }
 if(changes>6||!held)throw Error('Unexpected scene pacing');
 await p.screenshot({path:'inspection/thinking-calm.png'});
 while(await p.evaluate(()=>sceneIndex===1))await p.getByRole('button',{name:'Next',exact:true}).click();if(await p.evaluate(()=>sceneIndex)!==2)throw Error('Next failed');
 await browser.close();console.log('Verified 12 seconds: empty-handed listening/blinks only, no extra effects, one heart reveal followed by a stable hold; Next works.');
})().catch(e=>{console.error(e);process.exit(1)});
