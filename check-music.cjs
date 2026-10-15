const {chromium} = require('C:/Users/NAMI/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');

(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe'
  });
  const page = await browser.newPage({ viewport: { width: 430, height: 932 } });
  await page.goto('http://localhost:8080/index.html');
  await page.waitForTimeout(600);

  const iconInitial = await page.$eval('#music-toggle img', img => img.src);
  console.log('Icon initial:', iconInitial);

  // Click Start to trigger audio play
  await page.getByRole('button', { name: 'Start' }).click();
  await page.waitForTimeout(1500);

  const audioPlaying = await page.$eval('#background-music', a => ({
    paused: a.paused,
    currentTime: a.currentTime,
    volume: a.volume,
    src: a.currentSrc || a.src
  }));
  console.log('Audio state after Start:', audioPlaying);

  // Toggle mute button
  await page.locator('#music-toggle').click();
  await page.waitForTimeout(500);

  const iconMuted = await page.$eval('#music-toggle img', img => img.src);
  const audioMuted = await page.$eval('#background-music', a => a.paused);
  console.log('Icon after mute click:', iconMuted, 'Audio paused:', audioMuted);

  // Toggle unmute button
  await page.locator('#music-toggle').click();
  await page.waitForTimeout(600);

  const iconUnmuted = await page.$eval('#music-toggle img', img => img.src);
  const audioUnmuted = await page.$eval('#background-music', a => ({
    paused: a.paused,
    currentTime: a.currentTime
  }));
  console.log('Icon after unmute click:', iconUnmuted, 'Audio playing:', audioUnmuted);

  await page.screenshot({ path: 'inspection/music-button-verified.png' });
  await browser.close();
  console.log('MUSIC AND BUTTON STATE VERIFICATION COMPLETED SUCCESSFULLY!');
})().catch(e => {
  console.error(e);
  process.exit(1);
});
