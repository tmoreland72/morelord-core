// Offline verification against installed Foundry/Core and active-module styles.
import http from 'node:http';
import path from 'node:path';
import {createRequire} from 'node:module';
import {readFile,writeFile} from 'node:fs/promises';
import {startBrowser} from '../../morelord-game-master/tests/browser-driver.mjs';
const modules=path.resolve(import.meta.dirname,'../..');
const publicRoot='E:/Foundry14/App/resources/app/public';
const ids=['morelord-core','morelord-marketplace','morelord-craftworks','morelord-downtime','morelord-journeys','morelord-encounters','morelord-character-export','morelord-game-master'];
const handlebars=createRequire('E:/Foundry14/App/resources/app/package.json')('handlebars');
handlebars.registerHelper('localize', key=>key);
handlebars.registerHelper('checked', value=>value?'checked':'');
handlebars.registerHelper('eq', (a,b)=>a===b);
const links=[];
for(const id of ids){const manifest=JSON.parse(await readFile(path.join(modules,id,'module.json'),'utf8'));for(const file of manifest.styles??[])links.push(`<link rel="stylesheet" href="/modules/${id}/${file}">`);}
const html=`<!doctype html><html><head><link rel="stylesheet" href="/css/foundry2.css">${links.join('')}</head><body class="game vtt theme-dark"></body></html>`;
const server=http.createServer(async(req,res)=>{try{const u=new URL(req.url,'http://localhost');if(u.pathname==='/'){res.setHeader('Content-Type','text/html');return res.end(html);}if(u.pathname==='/render'){const template=u.searchParams.get('template');if(!/^modules\/morelord-(craftworks|journeys)\/templates\/[a-z-]+\.hbs$/.test(template))throw Error('invalid template');const source=await readFile(path.join(modules,template.slice(8)),'utf8');res.setHeader('Content-Type','text/html; charset=utf-8');return res.end(handlebars.compile(source)(JSON.parse(u.searchParams.get('data'))));}const isModule=u.pathname.startsWith('/modules/');const base=isModule?modules:publicRoot;const file=path.resolve(base,'.'+(isModule?u.pathname.slice(8):u.pathname));if(!file.startsWith(path.resolve(base)+path.sep))throw Error('outside root');res.setHeader('Content-Type',file.endsWith('.css')?'text/css':(/\.m?js$/.test(file))?'text/javascript':'application/octet-stream');res.end(await readFile(file));}catch{res.writeHead(404);res.end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const browser=await startBrowser();
try{
 await browser.command('Page.navigate',{url:`http://127.0.0.1:${server.address().port}/`});
 await browser.wait('document.readyState === "complete"');
 await browser.evaluate(`globalThis.helperCheck = (await import('/modules/morelord-core/scripts/testing/helper-text.js')).helperTextCheck;`);
 await browser.evaluate(`globalThis.foundry={applications:{handlebars:{renderTemplate:async (template,data)=>(await fetch('/render?template='+encodeURIComponent(template)+'&data='+encodeURIComponent(JSON.stringify(data)))).text()}}};globalThis.consumerChecks=await Promise.all(['craftworks','journeys'].map(async id=>(await import('/modules/morelord-'+id+'/scripts/testing/helper-text.mjs')).helperTextCheck));`);
 const results=[];
 for(const theme of ['dark','light']){
  await browser.evaluate(`document.body.className='game vtt theme-${theme}';helperCheck.run();for(const check of consumerChecks) await check.run();`);
  results.push({theme,status:'pass',consumers:['craftworks-settings','custom-recipe-editor','hoard-gm','harvest-prototype','journey-settings','journey-app']});
  await browser.evaluate(`document.querySelector('#preview')?.remove();const preview=document.createElement('div');preview.id='preview';preview.className='application ml-window';preview.style='position:relative;width:900px;height:850px';preview.innerHTML='<div class=window-content>'+await foundry.applications.handlebars.renderTemplate('modules/morelord-craftworks/templates/harvest-prototype.hbs',{deadCreatures:[{id:'fixture',name:'Fixture creature'}]})+'</div>';document.body.append(preview);`);
  await writeFile(path.resolve(import.meta.dirname,`../test/in-game-reports/helper-text-${theme}.png`),Buffer.from((await browser.command('Page.captureScreenshot',{format:'png'})).data,'base64'));
 }
 console.log(JSON.stringify(results));
 await writeFile(path.resolve(import.meta.dirname,'../test/in-game-reports/helper-text-offline.json'),JSON.stringify({kind:'offline-css',modules:ids,results},null,2));
}finally{await browser.close();server.close();}
