// Offline rendering with the installed Foundry and Core CSS, not a live-world test.
import http from 'node:http';
import path from 'node:path';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
import {startBrowser} from '../../morelord-game-master/tests/browser-driver.mjs';
import {CONTENT_PACKS} from '../../morelord-craftworks/data/content-packs.mjs';
import {contentPackPresentation} from '../../morelord-craftworks/scripts/ui/content-pack-presentation.mjs';
const modules=path.resolve(import.meta.dirname,'../..');
const publicRoot='E:/Foundry14/App/resources/app/public';
const handlebars=createRequire('E:/Foundry14/App/resources/app/package.json')('handlebars');
const template=handlebars.compile(await readFile(path.join(modules,'morelord-craftworks/templates/lucky-finds.hbs'),'utf8'));
const html=template({total:20,results:[{html:'<p>A rare spell scroll is discovered among loose pages.</p>',scrollRarity:'rare'}]});
const page=`<!doctype html><html><head><link rel="stylesheet" href="/css/foundry2.css"><link rel="stylesheet" href="/modules/morelord-core/styles/morelord-core.css"><link rel="stylesheet" href="/modules/morelord-encounters/styles/morelord-encounters.css"><link rel="stylesheet" href="/modules/morelord-craftworks/styles/craftworks.css"></head><body class="game vtt theme-dark"><main style="display:grid;gap:24px;padding:16px;width:100%;overflow:auto;height:100vh"><div class="application ml-window ml-encounters-module" style="position:relative;width:100%;max-width:760px;height:auto"><div class="window-content"><div class="ml-app" id="notes"></div></div></div><div class="application ml-window ml-craftworks-module" style="position:relative;width:100%;max-width:620px;height:auto"><div class="window-content">${html}</div></div></main></body></html>`;
const server=http.createServer(async(req,res)=>{
  try {
    const url=new URL(req.url,'http://localhost');
    if(url.pathname==='/'){res.setHeader('Content-Type','text/html; charset=utf-8');res.end(page);return;}
    const isModule=url.pathname.startsWith('/modules/');
    const base=isModule?modules:publicRoot;
    const file=path.resolve(base,'.'+(isModule?url.pathname.slice(8):url.pathname));
    if(!file.startsWith(path.resolve(base)+path.sep))throw Error('outside root');
    res.setHeader('Content-Type',file.endsWith('.css')?'text/css':file.endsWith('.woff2')?'font/woff2':'application/octet-stream');
    res.end(await readFile(file));
  } catch {res.writeHead(404);res.end();}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const browser=await startBrowser();
const output=path.join(modules,'morelord-core/test/in-game-reports');
await mkdir(output,{recursive:true});
try {
  await browser.command('Page.navigate',{url:`http://127.0.0.1:${server.address().port}/`});
  await browser.wait('!!document.querySelector("#notes")');
  const source=await readFile(path.join(modules,'morelord-encounters/scripts/apps/encounter-builder-dialog.mjs'),'utf8');
  const notes=source.slice(source.indexOf('export function encounterNotes'),source.indexOf('\nfunction rosterContent')).replace('export ','');
  await browser.evaluate(`globalThis.foundry={utils:{escapeHTML:s=>s.replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]))}};const localize=()=>"GM Encounter Details";${notes};document.querySelector('#notes').append(encounterNotes({notes:[{title:'Menacing Manticore (test)',text:'<p>Menacing Manticore (test). A manticore circles overhead.</p><p>Another paragraph with [[/r 2d4]] creatures.</p>'}]}));await document.fonts.ready;`);
  const report=[];
  for(const theme of ['theme-dark','theme-light']) for(const width of [900,360]) {
    await browser.command('Emulation.setDeviceMetricsOverride',{width,height:1000,deviceScaleFactor:1,mobile:false});
    await browser.evaluate(`document.body.classList.remove('theme-dark','theme-light');document.body.classList.add('${theme}');`);
    const check=await browser.evaluate(`({weights:[...document.querySelectorAll('p')].map(p=>getComputedStyle(p).fontWeight),sourceLeak:document.body.textContent.includes('function rosterContent'),roll:!!document.querySelector('[data-formula="2d4"]'),scroll:!!document.querySelector('[data-action="generate-scroll"]'),background:getComputedStyle(document.querySelector('.window-content')).backgroundColor,text:getComputedStyle(document.querySelector('.window-content')).color,overflow:[...document.querySelectorAll('.ml-app')].some(el=>el.scrollWidth>el.clientWidth+1)})`);
    const luminance=color=>{const values=color.match(/[\d.]+/g).slice(0,3).map(Number);const rgb=values.map(v=>{if(!color.startsWith("color(srgb"))v/=255;return v<=0.04045?v/12.92:((v+0.055)/1.055)**2.4;});return rgb[0]*0.2126+rgb[1]*0.7152+rgb[2]*0.0722;};
    const a=luminance(check.background),b=luminance(check.text);check.contrast=(Math.max(a,b)+0.05)/(Math.min(a,b)+0.05);assert(check.contrast>=4.5,`${theme} contrast ${check.contrast}`);
    assert(check.weights.every(weight=>weight==='400'));assert(!check.sourceLeak);assert(check.roll&&check.scroll);assert(!check.overflow);
    const shot=await browser.command('Page.captureScreenshot',{format:'png'});
    await writeFile(path.join(output,`drakkenheim-offline-${theme}-${width}.png`),Buffer.from(shot.data,'base64'));
    report.push({theme,width,...check});
  }
  await writeFile(path.join(output,'drakkenheim-offline-ui.json'),JSON.stringify({kind:'offline-css-and-template-check',report},null,2));
  const settingsSource=await readFile(path.join(modules,'morelord-craftworks/templates/craftworks-settings.hbs'),'utf8');
  const cardSource=settingsSource.slice(settingsSource.indexOf('<article class="ml-card ml-item-row">'),settingsSource.indexOf('</article>')+'</article>'.length);
  const settingsHtml=handlebars.compile('{{#each packs}}'+cardSource+'{{/each}}')({packs:CONTENT_PACKS.map(pack=>({...pack,...contentPackPresentation(pack,new Map(['dnd-players-handbook','dnd-dungeon-masters-guide','drakkenheim-core','drakkenheim-monsters'].map(id=>[id,{active:true}]))),enabled:true,canEnable:true,counts:{materials:0,recipes:399,harvest:0,gathering:0,loot:0,encounter:0}}))});
  await browser.evaluate(`document.body.className='game vtt theme-dark';document.querySelector('main').innerHTML='<div class="application ml-window ml-craftworks-module" style="position:relative;width:100%;height:auto"><div class="window-content"><div class="ml-app ml-stack" id="settings-cards"></div></div></div>';document.querySelector('#settings-cards').innerHTML=${JSON.stringify(settingsHtml)};`);
  for(const width of [900,460]) {
    await browser.command('Emulation.setDeviceMetricsOverride',{width,height:1200,deviceScaleFactor:1,mobile:false});
    const check=await browser.evaluate(`({labels:[...document.querySelectorAll('.ml-badge')].map(el=>el.textContent.trim()),names:[...document.querySelectorAll('h4,h5')].map(el=>el.textContent),callout:!!document.querySelector('.ml-callout'),toggles:document.querySelectorAll('input[type=checkbox]').length,overflow:document.querySelector('#settings-cards').scrollWidth>document.querySelector('#settings-cards').clientWidth+1})`);
    assert.deepEqual(check.labels,['Standard','Available','Standard','Available','Standard','Available','Premium','Available','Premium','Available','Champion','Available','Available']);assert.equal(check.toggles,6);assert(!check.callout);assert(!check.overflow);
    await writeFile(path.join(output,`drakkenheim-settings-offline-${width}.png`),Buffer.from((await browser.command('Page.captureScreenshot',{format:'png'})).data,'base64'));
  }
  console.log(JSON.stringify(report));
} finally {await browser.close();await new Promise(resolve=>server.close(resolve));}
