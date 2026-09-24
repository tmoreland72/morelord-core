// Read copies of installed packs; never log in or mutate a Foundry world.
import { createRequire } from 'node:module';
import { cp, mkdtemp, readFile, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { startBrowser } from '../../morelord-game-master/tests/browser-driver.mjs';
const { ClassicLevel } = createRequire('E:/Foundry14/App/resources/app/package.json')('classic-level');
const modules = path.resolve(import.meta.dirname, '../..');
const staging = await mkdtemp(path.join(os.tmpdir(), 'morelord-source-audit-'));
const packs = [];
for (const id of ['drakkenheim-core', 'drakkenheim-monsters', 'drakkenheim-scgd', 'dnd-monster-manual', 'dnd-players-handbook', 'dnd-dungeon-masters-guide', 'dnd5e']) {
  const root = id === 'dnd5e' ? path.resolve(modules, '../systems/dnd5e') : path.join(modules, id);
  const manifest = JSON.parse(await readFile(path.join(root, id === 'dnd5e' ? 'system.json' : 'module.json'), 'utf8'));
  for (const pack of manifest.packs.filter(p => ['Actor','Adventure','JournalEntry','RollTable'].includes(p.type))) {
    if (id !== 'drakkenheim-core' && pack.type !== 'Actor') continue;
    const copy = path.join(staging, `${id}.${pack.name}`);
    await cp(path.join(root, pack.path), copy, {recursive: true, filter: p => path.basename(p) !== 'LOCK'});
    const db = new ClassicLevel(copy, {valueEncoding:'json'});
    const values = new Map();
    for await (const [key, value] of db.iterator()) values.set(key, value);
    await db.close();
    function hydrate(key, value) {
      const [, collection, identity] = key.split('!');
      const result = {...value};
      for (const [field, entries] of Object.entries(result)) {
        if (!Array.isArray(entries) || !entries.length || typeof entries[0] !== 'string') continue;
        const childKey = entry => `!${collection}.${field}!${identity}.${entry}`;
        if (values.has(childKey(entries[0]))) result[field] = entries.map(entry => hydrate(childKey(entry), values.get(childKey(entry))));
      }
      return result;
    }
    const collection = {Actor:'actors',Adventure:'adventures',JournalEntry:'journal',RollTable:'tables'}[pack.type];
    const docs = [...values].filter(([key]) => key.startsWith(`!${collection}!`)).map(([key,value]) => hydrate(key,value));
    packs.push({collection:`${id}.${pack.name}`, documentName:pack.type, metadata:{type:pack.type,label:pack.label,packageName:id}, docs});
  }
}
const browser = await startBrowser();
try {
  await browser.evaluate(`globalThis.sourcePacks = ${JSON.stringify(packs)}`);
  const serviceCode = await readFile(path.join(modules,'morelord-encounters/scripts/services/drakkenheim-encounter-service.mjs'),'utf8');
  await browser.evaluate(`
    class Collection extends Map { [Symbol.iterator]() { return this.values(); } }
    globalThis.documents = new Map();
    function documentOf(data,type,uuid) {
      const doc = {...data,id:data._id,documentName:type,uuid,toObject:()=>data};
      documents.set(uuid,doc); documents.set(type+'.'+data._id,doc);
      if(type==='RollTable') doc.results = data.results.map(r=>documentOf(r,'TableResult',uuid+'.TableResult.'+r._id));
      return doc;
    }
    globalThis.game = {user:{isGM:true}, journal:[], i18n:{localize:x=>x}, packs:new Collection(), modules:new Map([
      ['drakkenheim-core',{active:true}],['drakkenheim-monsters',{active:true}],['morelord-core',{api:{sources:{resolveBookLabel:({book,pack})=>book||pack.collection}}}]
    ])};
    for(const pack of sourcePacks) {
      const docs = pack.docs.map(d=>documentOf(d,pack.documentName,'Compendium.'+pack.collection+'.'+pack.documentName+'.'+d._id));
      for(const d of docs) documents.set('Compendium.'+pack.collection+'.'+d.id,d);
      game.packs.set(pack.collection,{...pack,getIndex:async()=>docs,getDocument:async id=>docs.find(d=>d.id===id),getDocuments:async()=>docs});
      if(pack.documentName==='Adventure') for(const adventure of pack.docs) for(const actor of adventure.actors??[]) documentOf(actor,'Actor','Actor.'+actor._id);
    }
    globalThis.fromUuid=async uuid=>documents.get(uuid)??null;
    globalThis.Roll=class {constructor(formula){this.formula=formula;} async evaluate(){this.total=1;return this;}};
    globalThis.DrakkenheimEncounterService = (await import('data:text/javascript;base64,${Buffer.from(serviceCode).toString('base64')}')).DrakkenheimEncounterService;
  `);
  const report = await browser.evaluate(`await new DrakkenheimEncounterService({coreAccess:{tier:'champion'}}).audit()`);
  const output = path.join(modules, 'morelord-encounters/test/source-audit');
  await mkdir(output,{recursive:true});
  await writeFile(path.join(output,'drakkenheim.json'),JSON.stringify({kind:'offline-installed-source-audit',assumptions:'Official adventure actors are represented as already imported with their original IDs. This checks installed source coverage, not active-world readiness. Quantity rolls use a fixed fixture total.',at:new Date().toISOString(),results:report},null,2));
  const missingDescriptions = report.filter(row => row.missingDescriptions.length);
  const unresolved = report.filter(row => row.unresolved.length);
  console.log(JSON.stringify({results:report.length, tables:[...new Set(report.map(r=>r.table))], unresolved, missingDescriptions,
    empty:report.filter(r=>!r.actors.length).map(r=>({table:r.table,resultId:r.resultId,title:r.title}))}));
  if (missingDescriptions.length || unresolved.length) process.exitCode = 1;
} finally { await browser.close(); }
