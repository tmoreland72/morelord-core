import {startBrowser} from '../../morelord-game-master/tests/browser-driver.mjs';
import {mkdir,readFile,writeFile} from 'node:fs/promises';

const releaseChecks=process.argv.includes('--release-checks');
const gmOnly=process.argv.includes('--gm-only');
const url=process.env.FOUNDRY_TEST_URL ?? 'http://127.0.0.1:31400';
const status=await (await fetch(`${url}/api/status`)).json();
if(status.world!=='dev1')throw Error(`Dev1 required; loaded world is ${status.world}`);
const browser=await startBrowser();
const output=new URL('../test/in-game-reports/',import.meta.url);
await mkdir(output,{recursive:true});
try{
  await browser.command('Emulation.setDeviceMetricsOverride',{width:1280,height:1000,deviceScaleFactor:1,mobile:false});
  await browser.command('Page.navigate',{url:`${url}/join`});
  await browser.wait('document.querySelector("[name=userId], [name=username]") || globalThis.game?.ready',15000);
  await browser.evaluate(`if(!globalThis.game?.ready){const select=document.querySelector('[name=userId], [name=username]');const option=[...select.options].find(o=>o.textContent.trim()==='Chuck' && !o.disabled);if(!option)throw Error('Test GM Chuck unavailable');select.value=option.value;document.querySelector('button[name=join]').click();}`);
  await browser.wait('globalThis.game?.ready && globalThis.MorelordCore?.socket?.ready',45000);
  if(await browser.evaluate('game.world.id')!=='dev1')throw Error('Dev1 identity changed');
  console.log('Verified Dev1; waiting for Craftworks startup indexing.');
  if(!gmOnly)await browser.wait(`game.settings.menus.get('morelord-craftworks.configure')?.type.craftworks?.syncContent`,180000);
  await browser.wait(`!(game.settings.get('morelord-core','promptPerformance') && !game.settings.get('morelord-core','performancePromptSeen')) || document.querySelector('#morelord-core-performance [name="preset"]')`,30000);
  const report=gmOnly?JSON.parse(await readFile(new URL('2026-11-25-settings-windows.json',output),'utf8')):await browser.evaluate(`await (async()=>{
    for(const app of foundry.applications.instances.values())if(app.id==='morelord-core-performance')await app.close();
    const {runInGameTests}=await import('/modules/morelord-core/scripts/testing/in-game.js');
    const {settingsWindowsCheck,locationSettingsCheck}=await import('/modules/morelord-core/scripts/testing/settings-windows.js');
    const {craftworksSettingsCheck}=await import('/modules/morelord-craftworks/scripts/testing/settings-windows.mjs');
    const {gameMasterSettingsCheck}=await import('/modules/morelord-game-master/scripts/testing/settings-windows.mjs');
    const {journeySettingsSaveCheck}=await import('/modules/morelord-journeys/scripts/testing/settings-windows.mjs');
    const {marketplaceSettingsSaveCheck}=await import('/modules/morelord-marketplace/scripts/testing/settings-windows.mjs');
    const checks=[settingsWindowsCheck,locationSettingsCheck,craftworksSettingsCheck,gameMasterSettingsCheck,journeySettingsSaveCheck,marketplaceSettingsSaveCheck];
    if(${releaseChecks}){
      const {combatWrappingCheck}=await import('/modules/morelord-encounters/scripts/testing/combat-wrapping.mjs');
      const {roundStartWaveCheck}=await import('/modules/morelord-encounters/scripts/testing/round-start-waves.mjs');
      checks.push(combatWrappingCheck,roundStartWaveCheck);
    }
    return runInGameTests({checks});
  })()`);
  const visuals=gmOnly?report.visuals.filter(v=>v.menu!=='morelord-game-master.configure'):[];
  report.ok=report.results.every(r=>r.status!=='fail');
  console.log(JSON.stringify({summary:report.summary,results:report.results}));
  for(const [menu,widths] of [
    ['morelord-core.account',[620,360]],['morelord-core.performance',[580,360]],
    ['morelord-core.ignoredUsers',[460,360]],['morelord-core.locations',[980,560]],
    ['morelord-craftworks.configure',[980,560]],['morelord-journeys.configure',[800,560]],
    ['morelord-marketplace.marketplaceConfiguration',[800,560]],['morelord-game-master.configure',[480,360]]
  ].filter(([menu])=>!gmOnly || menu==='morelord-game-master.configure')){
    if(menu==='morelord-game-master.configure'){
      await browser.evaluate(`new (game.settings.menus.get('morelord-game-master.configure').type)().render();`);
      await browser.wait(`foundry.applications.instances.get('morelord-game-master-game-master-settings')?.rendered`,15000);
      await browser.evaluate(`globalThis.__settingsVisual=foundry.applications.instances.get('morelord-game-master-game-master-settings');`);
    }else await browser.evaluate(`globalThis.__settingsVisual=new (game.settings.menus.get(${JSON.stringify(menu)}).type)();await __settingsVisual.render({force:true});`);
    try{
      for(const theme of ['dark','light'])for(const width of widths){
        await browser.evaluate(`await (async()=>{const app=__settingsVisual;app.element.classList.remove('theme-dark','theme-light');app.element.classList.add('themed','theme-${theme}');app.element.style.colorScheme='${theme}';app.setPosition({width:${width},height:850,left:16,top:24});ui.notifications.clear();await document.fonts.ready;await new Promise(resolve=>requestAnimationFrame(resolve));})()`);
        const state=await browser.evaluate(`(()=>{const app=__settingsVisual,content=app.element.querySelector('.window-content'),footer=content.querySelector(':scope > .ml-form-footer, .form-footer');const saves=[...app.element.querySelectorAll('button')].filter(b=>b.textContent.trim().startsWith('Save') || b.textContent.trim()==='Apply Performance Settings');return {menu:${JSON.stringify(menu)},theme:'${theme}',width:${width},overflow:content.scrollWidth>content.clientWidth+1,footerVisible:!!footer && footer.getBoundingClientRect().bottom<=innerHeight,labels:saves.map(b=>b.textContent.trim())};})()`);
        // The Locations welcome screen has a shared footer but no save button until editing.
        if(state.overflow || !state.footerVisible || state.labels.some(label=>label!=='Save Changes'))report.ok=false;
        visuals.push(state);
        const image=await browser.command('Page.captureScreenshot',{format:'png'});
        await writeFile(new URL(`2026-11-25-settings-${menu.replaceAll('.','-')}-${theme}-${width}.png`,output),Buffer.from(image.data,'base64'));
      }
    }finally{await browser.evaluate('await __settingsVisual.close();delete globalThis.__settingsVisual;');}
  }
  report.visuals=visuals;
  await writeFile(new URL(releaseChecks?'2026-11-25-release-settings.json':'2026-11-25-settings-windows.json',output),JSON.stringify(report,null,2));
  console.log(JSON.stringify({ok:report.ok,environment:report.environment,results:report.results,visuals}));
  if(!report.ok)process.exitCode=1;
}finally{await browser.close();}
