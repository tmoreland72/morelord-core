import fs from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
const {chromium}=await import(pathToFileURL(process.env.MORELORD_PLAYWRIGHT).href);
const browser=await chromium.launch({headless:true});
try {
  const page=await browser.newPage({viewport:{width:1440,height:1000}});
  const errors=[];page.on('pageerror',error=>errors.push(error.stack));
  await page.route('**/api/foundry/telemetry**',route=>route.abort());
  await page.goto('http://127.0.0.1:31400/join');
  if((await page.title()).trim().toLowerCase()!=='dev1')throw Error('Not verified Dev1.');
  await page.locator('input[name=username]').fill(process.env.FOUNDRY_TEST_GM||'Chuck');
  await page.locator('input[name=password]').fill(process.env.FOUNDRY_TEST_PASSWORD||'');
  await page.locator('button[name=join]').click();
  await page.waitForFunction(()=>globalThis.game?.ready&&game.modules.get('morelord-game-master')?.api,{}, {timeout:60000});
  const report=await page.evaluate(async ({organize,visualOnly})=>{
    if(game.world.id.toLowerCase()!=='dev1')throw Error('Not Dev1.');
    // Explicitly requested organization, performed once by this GM even if an older GM client is still connected.
    const entries=[
      {collection:'world.morelord-craftworks-standard-materials',label:'Craftworks Materials'},
      {collection:'world.morelord-craftworks-materials-monsters-of-drakkenheim',label:'Craftworks Drakkenheim Materials'},
      {collection:'world.morelord-craftworks-spell-scrolls',label:'Craftworks Spell Scrolls'},
      {collection:'world.morelord-craftworks-custom-recipes',label:'Craftworks Custom Recipes'}
    ];
    if(organize) {
      await MorelordCore.compendiums.organize([...game.packs].filter(p=>p.metadata.packageName==='morelord-compendium').map(p=>({collection:p.collection})),['Graypes Compendium'],{legacyRoot:'Morelord Gaming',force:true});
      await game.settings.set('morelord-compendium','graypesFolderMigration',true);
      await MorelordCore.compendiums.organize(entries,['Morelord Gaming','Craftworks'],{force:true});
    }
    for (const app of Object.values(ui.windows)) await app.close();
    const {runChecks}=await import('./modules/morelord-core/scripts/testing/in-game.js');
    const {macroTriggerCheck,fateCheck}=await import('./modules/morelord-game-master/scripts/testing/macro-triggers.mjs');
    const {triggerFooterCheck}=await import('./modules/morelord-game-master/scripts/testing/trigger-footer.mjs');
    const results=await runChecks(visualOnly ? [triggerFooterCheck] : [macroTriggerCheck,fateCheck,triggerFooterCheck]);
    return {ok:results.every(r=>r.status==='pass'),results,summary:{pass:results.filter(r=>r.status==='pass').length,fail:results.filter(r=>r.status==='fail').length},environment:{world:game.world.id,foundry:game.version,system:game.system.version}};
  },{organize:process.argv.includes('--organize'),visualOnly:process.argv.includes('--visual-only')});
  const state=await page.evaluate(()=>({world:game.world.id,activeGM:game.users.activeGM?.name,user:game.user.name,
    packs:[...game.packs].filter(p=>p.collection.includes('craftworks')||p.collection.startsWith('morelord-game-master.')).map(p=>({id:p.collection,label:p.metadata.label,folder:p.folder?.name,parent:p.folder?.folder?.name})),
    newPacksLoaded:game.packs.has('morelord-game-master.macros')&&game.packs.has('morelord-game-master.roll-tables'),
    personal:game.folders.filter(f=>f.type==='Compendium'&&f.name==='Graypes Compendium').map(f=>({id:f.id,parent:f.folder?.name??null}))}));
  const prefix='test/in-game-reports/2026-09-22-game-master-macros';
  await fs.writeFile(`${prefix}${process.argv.includes('--visual-only')?'-visual':''}.json`,JSON.stringify({report,state,errors},null,2));
  console.log(JSON.stringify({summary:report.summary,results:report.results,state,errors}));
  await page.evaluate(()=>{game.modules.get('morelord-game-master').api.toggle(true);document.querySelector('#mlgm-tab-triggers').click();});
  await page.locator('#mlgm').screenshot({path:`${prefix}-triggers.png`});
  await page.evaluate(()=>document.querySelector('#mlgm-tab-rolls').click());
  await page.locator('#mlgm').screenshot({path:`${prefix}-rolls.png`});
  if(!report.ok)process.exitCode=1;
} finally {await browser.close();}
