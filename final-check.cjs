const {chromium}=require('C:/Users/NAMI/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('fs');
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
 const p=await browser.newPage({viewport:{width:390,height:844},acceptDownloads:true});
 await p.goto('file:///'+process.cwd().replaceAll('\\','/')+'/index.html');
 const puzzles=await p.evaluate(()=>{for(let n=0;n<100;n++){const a=shuffledBoard();const path=solution(a);if(path.length<1||path.length>10)return false;for(const tile of path){const z=a.indexOf(0),i=a.indexOf(tile);if(!neighbors(z).includes(i))return false;[a[z],a[i]]=[a[i],a[z]];}if(!solved(a))return false;}return true;});
 if(!puzzles)throw Error('Random puzzle validation failed');
 await p.evaluate(()=>showScene(1));await p.waitForTimeout(4900);await p.screenshot({path:'inspection/scene-2.png'});
 await p.evaluate(()=>{showScene(7);while(currentMessage?.hasMore())currentMessage.advance();});await p.waitForTimeout(300);
 let downloaded=false;p.on('download',()=>downloaded=true);await p.getByRole('button',{name:'Keep the flower for now 🌸'}).click();await p.waitForSelector('.flower-moment');if(downloaded)throw Error('Unexpected download on flower choice');
 await p.setViewportSize({width:320,height:568});await p.evaluate(()=>showScene(6));await p.waitForTimeout(800);await p.screenshot({path:'inspection/layout-320.png'});
 await p.emulateMedia({reducedMotion:'reduce'});await p.reload();await p.getByRole('button',{name:'Start',exact:true}).click();await p.waitForTimeout(1000);if(await p.locator('.unrevealed').count())throw Error('Reduced motion reveal failed');
 await p.evaluate(()=>showScene(4));await p.locator('.flower-button').focus();await p.keyboard.press('Enter');await p.locator('.flower-target').focus();await p.keyboard.press('Enter');if(await p.evaluate(()=>sceneIndex)!==5)throw Error('Keyboard flower failed');
 const result=JSON.parse(fs.readFileSync('inspection/qa-result.json','utf8'));result.checks.push('100 independently shuffled puzzles solved in at most ten legal moves','keyboard flower interaction','reduced motion text reveal','peaceful flower moment transition without download');fs.writeFileSync('inspection/qa-result.json',JSON.stringify(result,null,2));
 await browser.close();console.log('Final checks passed.');
})().catch(e=>{console.error(e);process.exit(1)});
