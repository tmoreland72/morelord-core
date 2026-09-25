import {startBrowser} from '../../morelord-game-master/tests/browser-driver.mjs';
import {writeFile,readFile,readdir} from 'node:fs/promises';
const browser=await startBrowser();
try {
 await browser.command('Page.navigate',{url:'http://127.0.0.1:31400/join'});
 await browser.wait('document.readyState === "complete"');
 if((await browser.evaluate('document.title')).trim().toLowerCase()!=='dev1')throw Error('Not Dev1; skipped.');
 await browser.evaluate(`document.querySelector('[name=username]').value='Chuck';document.querySelector('button[name=join]').click()`);
 await browser.wait('globalThis.game?.ready && game.modules.get("morelord-craftworks")?.api?.magicItemGenerator',180000);
 const report=await browser.evaluate(`if(game.world.id.toLowerCase()!=='dev1')throw Error('Not Dev1');
 const checks=[];
 for(const [module,path,key] of [
 ['core','helper-text.js','helperTextCheck'],['core','single-action-controls.js','singleActionControlsCheck'],
 ['craftworks','helper-text.mjs','helperTextCheck'],['journeys','helper-text.mjs','helperTextCheck'],
 ['journeys','planner-footer.mjs','plannerFooterCheck'],['marketplace','manual-shop-items.mjs','manualShopItemsCheck'],
 ['marketplace','rarity-pricing.mjs','rarityPricingCheck'],['marketplace','rarity-pricing.mjs','fragmentationGrenadeCheck']]) {
 checks.push((await import('/modules/morelord-'+module+'/scripts/testing/'+path))[key]);
 }
 const {generatorAndHarvestChecks}=await import('/modules/morelord-craftworks/scripts/testing/generators-and-harvest.mjs');
 checks.push(...generatorAndHarvestChecks());
 const {runInGameTests}=await import('/modules/morelord-core/scripts/testing/in-game.js');
 await runInGameTests({checks})`);
 await writeFile(new URL('../test/in-game-reports/2026-09-25-pending-release-validation.json',import.meta.url),JSON.stringify(report,null,2));
 console.log(JSON.stringify({summary:report.summary,results:report.results,foundry:report.environment.foundry}));
 const packData=await browser.evaluate(`const data={};for(const name of ['macros','roll-tables'])data[name]=(await game.packs.get('morelord-game-master.'+name).getDocuments()).map(doc=>doc.toObject());JSON.stringify(data)`);
 const packs=JSON.parse(packData);const differences=[];
 for(const name of ['macros','roll-tables']){for(const file of await readdir(new URL('../../morelord-game-master/pack-source/'+name+'/',import.meta.url))){if(!file.endsWith('.json'))continue;const source=JSON.parse(await readFile(new URL('../../morelord-game-master/pack-source/'+name+'/'+file,import.meta.url),'utf8'));const actual=packs[name].find(doc=>doc._id===source._id);if(!actual||actual.name!==source.name||(name==='macros'&&actual.command!==source.command)||(name==='roll-tables'&&JSON.stringify(actual.results)!==JSON.stringify(source.results)))differences.push(name+'/'+file);}}
 console.log(JSON.stringify({gameMasterPackDifferences:differences,counts:Object.fromEntries(Object.entries(packs).map(([k,v])=>[k,v.length]))}));
 if(!report.ok)process.exitCode=1;
}finally{await browser.close();}
