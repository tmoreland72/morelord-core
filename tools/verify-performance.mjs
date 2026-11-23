// Isolated UI fixture with installed Foundry styles; never connects to a world.
import http from 'node:http';
import path from 'node:path';
import {readFile, writeFile} from 'node:fs/promises';
import {startBrowser} from '../../morelord-game-master/tests/browser-driver.mjs';

const root = path.resolve(import.meta.dirname, '..');
const foundryRoot = path.resolve('E:/Foundry14/App/resources/app/public');
const server = http.createServer(async (req, res) => {
  try {
    if (req.url === '/') {
      res.setHeader('Content-Type', 'text/html');
      const template = (await readFile(path.join(root, 'templates/performance.hbs'), 'utf8')).replaceAll('{{#if diceSoNice}}', '').replaceAll('{{/if}}', '');
      res.end(`<!doctype html><link rel="stylesheet" href="/foundry/css/foundry2.css"><link rel="stylesheet" href="/fonts/fontawesome/css/all.min.css"><link rel="stylesheet" href="/styles/morelord-core.css"><body class="game vtt theme-dark"><form id="performance-fixture" class="application ml-window themed theme-dark" style="width:580px;height:800px;position:relative"><div class="window-content">${template}</div></form></body>`);
      return;
    }
    const native = /^\/(foundry|fonts|icons)\//.test(req.url);
    const base = native ? foundryRoot : root;
    const file = path.resolve(base, '.' + req.url.replace(/^\/foundry/, ''));
    if (!file.startsWith(base + path.sep)) throw Error('Invalid path');
    res.setHeader('Content-Type', file.endsWith('.css') ? 'text/css' : file.endsWith('.js') ? 'text/javascript' : 'application/octet-stream');
    res.end(await readFile(file));
  } catch {res.writeHead(404); res.end();}
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
let browser;
try {
  browser = await startBrowser();
  await browser.command('Page.navigate', {url: `http://127.0.0.1:${server.address().port}/`});
  await browser.wait('document.readyState === "complete" && document.querySelector("[data-performance-choices]")');
  const report = await browser.evaluate(`await (async () => {
    const assert = (condition, text) => {if (!condition) throw Error(text)};
    const values = new Map([['morelord-core.performancePreset', ''], ['core.performanceMode', 2], ['core.maxFPS', 60], ['core.pixelRatioResolutionScaling', true]]);
    globalThis.CONST = {CANVAS_PERFORMANCE_MODES: {LOW:0, MED:1, HIGH:2, MAX:3}};
    globalThis.game = {settings: {
      settings: new Map(['performanceMode', 'maxFPS', 'pixelRatioResolutionScaling', 'photosensitiveMode', 'mipmap', 'visionAnimation', 'lightAnimation'].map(key=>['core.'+key, {scope:'client'}])),
      get: (namespace,key)=>values.get(namespace+'.'+key),
      set: async (namespace,key,value)=>values.set(namespace+'.'+key,value)
    }};
    globalThis.foundry = {applications:{api:{ApplicationV2:class {}, HandlebarsApplicationMixin:Base=>Base}}};
    globalThis.ui = {notifications:{info:()=>{},error:message=>{throw Error(message)}}};
    const {PerformanceApp} = await import('/scripts/ui/performance-app.js');
    const {applyPageLayout} = await import('/scripts/ui/page-layout.js');
    const element = document.querySelector('form');
    assert([...document.styleSheets].some(sheet => sheet.href?.endsWith('/foundry/css/foundry2.css') && sheet.cssRules.length > 0), 'Foundry stylesheet is loaded');
    let closed = 0;
    const app = {element, id: element.id, close:async()=>{closed++}};
    PerformanceApp.prototype._onRender.call(app);
    applyPageLayout(app, element);
    const button = element.querySelector('[type="submit"]');
    assert(button.disabled && button.dataset.tooltip, 'Missing selection explains disabled Apply');
    const radios = [...element.querySelectorAll('[name="preset"]')];
    assert(radios.length === 3, 'Three native radio choices');
    radios[0].click();
    assert(!button.disabled, 'Selection enables Apply');
    await PerformanceApp.save.call(app, null, element);
    assert(closed === 1 && values.get('core.maxFPS') === 10 && values.get('morelord-core.performancePreset') === 'low', 'Apply saves selected personal preset');
    radios[2].click();
    await PerformanceApp.skip.call(app);
    assert(closed === 2 && values.get('core.maxFPS') === 10, 'Keep My Settings preserves graphics');
    assert(element.querySelector('.window-content > .ml-form-footer'), 'Footer detached from scrolling body');
    return {ok:true, scope:'offline', checks:['required selection','three native choices','apply','keep settings','shared footer']};
  })()`);
  for (const theme of ['dark', 'light']) for (const width of [580, 360]) {
    await browser.command('Emulation.setDeviceMetricsOverride', {width:width+40,height:900,deviceScaleFactor:1,mobile:false});
    const fits = await browser.evaluate(`await (async () => {
      document.body.className = 'game vtt theme-${theme}';
      const form = document.querySelector('form');
      form.className = 'application ml-window themed theme-${theme}'; form.style.width = '${width}px';
      await document.fonts.ready;
      await new Promise(resolve => setTimeout(resolve, 300));
      const content = form.querySelector('.window-content');
      return content.scrollWidth <= content.clientWidth + 1;
    })()`);
    if (!fits) throw Error(`Overflow at ${theme} ${width}`);
    const shot = await browser.command('Page.captureScreenshot', {format:'png'});
    await writeFile(path.join(root, 'test/in-game-reports', `performance-offline-${theme}-${width}.png`), Buffer.from(shot.data, 'base64'));
  }
  await writeFile(path.join(root, 'test/in-game-reports/performance-offline.json'), JSON.stringify(report,null,2));
  console.log(JSON.stringify(report));
} finally {await browser?.close(); await new Promise(resolve => server.close(resolve));}
