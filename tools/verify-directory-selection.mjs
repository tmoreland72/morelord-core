// Offline interaction check; does not connect to or modify a Foundry world.
import http from 'node:http';
import path from 'node:path';
import { readFile, writeFile } from 'node:fs/promises';
import { startBrowser } from '../../morelord-game-master/tests/browser-driver.mjs';
const moduleRoot = path.resolve(import.meta.dirname, '..');
const foundryRoot = path.resolve('E:/Foundry14/App/resources/app/public');
const server = http.createServer(async (req, res) => {
  try {
    if (req.url === '/') {
      res.setHeader('Content-Type', 'text/html');
      res.end('<!doctype html><link rel="stylesheet" href="/foundry/css/foundry2.css"><link rel="stylesheet" href="/styles/morelord-core.css"><body class="game vtt theme-dark"><section style="width:280px" class="directory"><header class="directory-header"></header><ol class="directory-list"></ol></section></body>');
      return;
    }
    const isFoundry = req.url.startsWith('/foundry/') || req.url.startsWith('/fonts/') || req.url.startsWith('/icons/');
    const base = isFoundry ? foundryRoot : moduleRoot;
    const file = path.resolve(base, '.' + (req.url.startsWith('/foundry/') ? req.url.slice(8) : req.url));
    if (!file.startsWith(base + path.sep)) throw Error('Invalid path');
    res.setHeader('Content-Type', file.endsWith('.css') ? 'text/css' : file.endsWith('.js') ? 'text/javascript' : 'application/octet-stream');
    res.end(await readFile(file));
  } catch { res.writeHead(404); res.end(); }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
let browser;
try {
  browser = await startBrowser();
  await browser.command('Page.navigate', { url: `http://127.0.0.1:${server.address().port}/` });
  await browser.wait('document.querySelector(".directory-list")');
  const result = await browser.evaluate(`await (async () => {
    const {activateDirectorySelection} = await import('/scripts/ui/directory-selection.js');
    const assert = (value, message) => {if (!value) throw Error(message)};
    globalThis.game = {user: {isGM: true}};
    let confirmed = false, calls = [], confirmCalls = 0;
    globalThis.foundry = {applications: {api: {DialogV2: {confirm: async config => {
      confirmCalls++; assert(config.no.default, 'Cancel is default');
      assert(config.content.includes('&lt;unsafe&gt;'), 'Document names are escaped');
      return confirmed;
    }}}}};
    globalThis.ui = {notifications: {error: message => {throw Error(message)}}};
    const root = document.querySelector('.directory');
    const collection = new Map([['a',{name:'<unsafe>'}], ['b',{name:'Second'}], ['c',{name:'Hidden'}]]);
    collection.documentClass = {deleteDocuments: async ids => {calls.push(ids); ids.forEach(id=>collection.delete(id))}};
    const app = {collection, element: root};
    const setup = () => {root.querySelector('.directory-list').innerHTML = '<li class="directory-item" data-entry-id="a">First</li><li class="directory-item" data-entry-id="b">Second</li><li hidden class="directory-item" data-entry-id="c">Hidden</li>'};
    const click = text => [...root.querySelectorAll('button')].find(b=>b.textContent.startsWith(text)).click();
    for (const type of ['Scene','Actor','Item','JournalEntry','RollTable','Cards','Macro','Playlist']) {
      collection.documentName=type; setup(); activateDirectorySelection(app,root);
      assert(root.querySelector('button').textContent==='Select multiple', type+' supported');
    }
    click('Select multiple'); click('Select visible');
    assert(root.querySelectorAll('input:checked').length===2, 'Hidden entries excluded');
    activateDirectorySelection(app,root);
    assert(root.querySelectorAll('input:checked').length===2, 'Selection survives rendering');
    click('Delete selected');
    await new Promise(r=>setTimeout(r,0));
    assert(calls.length===0 && collection.size===3, 'Cancel preserves all documents');
    confirmed=true; click('Delete selected'); click('Delete selected');
    await new Promise(r=>setTimeout(r,0));
    assert(calls.length===1 && calls[0].join(',')==='a,b', 'Only selected IDs deleted once');
    assert(confirmCalls===2 && collection.has('c'), 'Hidden unselected entry survives');
    click('Done selecting');
    game.user.isGM=false; root.querySelector('.ml-core-directory-selection').remove();
    activateDirectorySelection(app,root);
    assert(!root.querySelector('.ml-core-directory-selection'), 'Players have no deletion controls');
    game.user.isGM=true; setup(); collection.set('a',{name:'First'}); collection.set('b',{name:'Second'});
    activateDirectorySelection(app,root); click('Select multiple'); click('Select visible');
    return {ok:true, scope:'offline', checks:['eight directories','hidden entry filtering','rerender persistence','cancel','escaped names','default cancel','single deletion','unselected preservation','GM restriction']};
  })()`);
  console.log(JSON.stringify(result));
  if (!result?.ok) throw Error('Offline check did not return a passing report');
  await writeFile(path.join(moduleRoot, 'test/in-game-reports/2026-10-07-directory-selection-offline.json'), JSON.stringify(result, null, 2));
  for (const theme of ['dark', 'light']) {
    await browser.evaluate(`document.body.classList.remove('theme-dark','theme-light');document.body.classList.add('theme-${theme}')`);
    await browser.evaluate('await new Promise(resolve => setTimeout(resolve, 1000))');
    const capture = await browser.command('Page.captureScreenshot', {format:'png'});
    await writeFile(path.join(moduleRoot, `test/in-game-reports/2026-10-07-directory-selection-${theme}.png`), Buffer.from(capture.data,'base64'));
  }
} finally { await browser?.close(); await new Promise(resolve=>server.close(resolve)); }
