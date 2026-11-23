import {startBrowser} from '../../morelord-game-master/tests/browser-driver.mjs';
import {writeFile} from 'node:fs/promises';

const url = process.env.FOUNDRY_TEST_URL ?? 'http://127.0.0.1:31400';
const status = await (await fetch(`${url}/api/status`)).json();
if (status.world !== 'dev1') throw Error(`Dev1 required; loaded world is ${status.world}`);
const browser = await startBrowser();
const output = new URL('../test/in-game-reports/', import.meta.url);
try {
  await browser.command('Emulation.setDeviceMetricsOverride', {width:1280,height:1000,deviceScaleFactor:1,mobile:false});
  await browser.command('Page.navigate', {url: `${url}/join`});
  await browser.wait('document.readyState === "complete"');
  try {await browser.wait('document.querySelector("[name=userId], [name=username]") || globalThis.game?.ready', 15000);}
  catch(error) {
    console.log(JSON.stringify(await browser.evaluate(`({scripts:[...document.scripts].map(s=>({src:s.src,text:s.text.slice(0,150)})),game:globalThis.game?{world:game.world?.id,ready:game.ready,view:game.view}:null,resources:performance.getEntriesByType('resource').map(r=>({name:r.name,status:r.responseStatus,duration:r.duration})).filter(r=>r.status>=400 || r.name.includes('socket'))})`)));
    throw error;
  }
  await browser.wait(`globalThis.game?.ready || [...document.querySelectorAll(':is([name="userId"], [name="username"]) option')].some(o=>o.textContent.trim() === ${JSON.stringify(process.env.FOUNDRY_TEST_USER ?? 'Chuck')})`, 15000);
  await browser.evaluate(`if (!globalThis.game?.ready) {
    const select = document.querySelector('[name="userId"], [name="username"]');
    const username = ${JSON.stringify(process.env.FOUNDRY_TEST_USER ?? 'Chuck')};
    if (select.options) {
      const option = [...select.options].find(o=>!o.disabled && o.textContent.trim() === username);
      if (!option) throw Error('Test account unavailable');
      select.value = option.value;
    } else select.value = username;
    document.querySelector('button[name="join"]').click();
  }`);
  await browser.wait('globalThis.game?.ready && globalThis.MorelordCore?.socket?.ready', 45000);
  await browser.wait(`!globalThis.canvas?.loading && (!(game.settings.get('morelord-core','promptPerformance') && !game.settings.get('morelord-core','performancePromptSeen')) || document.querySelector('#morelord-core-performance [name="preset"]'))`, 30000);
  console.log(JSON.stringify(await browser.evaluate(`({world:game.world.id,foundry:game.version,system:game.system.version,user:game.user.name,gm:game.user.isGM})`)));
  if (await browser.evaluate('game.world.id') !== 'dev1') throw Error('Dev1 identity changed');
  const report = await browser.evaluate(`await (async()=>{
    for (const app of foundry.applications.instances.values()) if (app.id === 'morelord-core-performance') await app.close();
    const {runInGameTests} = await import('/modules/morelord-core/scripts/testing/in-game.js');
    const {performanceCheck, performanceMenuCheck} = await import('/modules/morelord-core/scripts/testing/performance.js');
    return runInGameTests({checks:[performanceCheck, performanceMenuCheck]});
  })()`);
  const role = report.environment.role;
  await writeFile(new URL(`2026-11-23-performance-live-${role}.json`, output), JSON.stringify(report,null,2));
  console.log(JSON.stringify(report));
  if (!report.ok) throw Error('Live performance checks failed');
  await browser.evaluate(`globalThis.__performanceVisualSeen = game.settings.get('morelord-core','performancePromptSeen');
    const {PerformanceApp} = await import('/modules/morelord-core/scripts/ui/performance-app.js');
    globalThis.__performanceVisualApp = new PerformanceApp();
    await globalThis.__performanceVisualApp.render({force:true});`);
  try {
    for (const theme of ['dark','light']) for (const width of [580,360]) {
      await browser.evaluate(`await (async()=>{
        const app = globalThis.__performanceVisualApp;
        app.element.classList.remove('theme-dark','theme-light');
        app.element.classList.add('themed','theme-${theme}');
        app.element.style.colorScheme = '${theme}';
        app.setPosition({width:${width},height:740,left:16,top:32});
        app.element.querySelector('[value="balanced"]').click();
        ui.notifications.clear();
        await document.fonts.ready;
        await new Promise(resolve=>setTimeout(resolve,300));
        const content = app.element.querySelector('.window-content');
        if (content.scrollWidth > content.clientWidth + 1) throw Error('Live layout overflow');
      })()`);
      const shot = await browser.command('Page.captureScreenshot', {format:'png'});
      await writeFile(new URL(`2026-11-23-performance-${role}-${theme}-${width}.png`, output), Buffer.from(shot.data,'base64'));
    }
    await browser.evaluate(`globalThis.__performanceVisualApp.element.querySelector('[value="balanced"]').focus();`);
    await browser.command('Input.dispatchKeyEvent', {type:'keyDown',key:'ArrowRight',code:'ArrowRight',windowsVirtualKeyCode:39});
    await browser.command('Input.dispatchKeyEvent', {type:'keyUp',key:'ArrowRight',code:'ArrowRight',windowsVirtualKeyCode:39});
    if (await browser.evaluate(`globalThis.__performanceVisualApp.element.querySelector('[name="preset"]:checked').value`) !== 'high') throw Error('Native radio keyboard navigation failed');
    console.log(JSON.stringify({role,visual:'dark/light 580px and 360px passed',keyboard:'passed'}));
  } finally {
    await browser.evaluate(`await globalThis.__performanceVisualApp.close(); await game.settings.set('morelord-core','performancePromptSeen',globalThis.__performanceVisualSeen); delete globalThis.__performanceVisualApp; delete globalThis.__performanceVisualSeen;`);
  }
} finally {await browser.close();}
