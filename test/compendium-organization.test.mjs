import test from 'node:test';
import assert from 'node:assert/strict';
import {organizeCompendiums} from '../scripts/services/compendium-organization.js';

test('organization shares roots, preserves IDs and settings, runs once, and never renames a mixed personal folder', async () => {
  const gm={id:'gm',isGM:true}, folders=[], packs=[]; let saved={};
  const collection=items=>Object.assign(items,{get:id=>items.find(item=>(item.collection??item.id)===id)});
  globalThis.game={user:gm,users:{activeGM:gm},folders:collection(folders),packs:collection(packs),settings:{get:()=>saved,set:async(_ns,_key,data)=>{saved=data;}}};
  globalThis.foundry={utils:{deepClone:structuredClone}};
  globalThis.ui={compendium:{render(){}}};
  globalThis.Folder={async create(data){const f={...data,id:String(folders.length+1),folder:folders.find(f=>f.id===data.folder),async update(data){Object.assign(this,data);return this;}};folders.push(f);return f;}};
  const pack=(collection,folder)=>({collection,folder,metadata:{label:'Old'},config:{locked:true},async configure(data){Object.assign(this.config,data);this.folder=folders.find(f=>f.id===data.folder);}});
  packs.push(pack('world.materials'),pack('module.macros'));
  await organizeCompendiums([{collection:'world.materials',label:'Craftworks Materials'}],['Morelord Gaming','Craftworks']);
  await organizeCompendiums([{collection:'module.macros',label:'Game Master Macros'}],['Morelord Gaming','Game Master']);
  assert.equal(folders.filter(f=>f.name==='Morelord Gaming').length,1);
  assert.equal(packs[0].folder.name,'Craftworks');assert.equal(packs[0].config.locked,true);
  assert.equal(packs[0].collection,'world.materials');assert.equal(packs[0].metadata.label,'Craftworks Materials');
  const original=packs[0].folder;packs[0].folder=null;
  await organizeCompendiums([{collection:'world.materials'}],['Morelord Gaming','Craftworks']);
  assert.equal(packs[0].folder,null,'Manual later placement should not be overwritten');
  packs.push(pack('personal.items',folders[0]),pack('other.items',folders[0]));
  await organizeCompendiums([{collection:'personal.items'}],['Graypes Compendium'],{legacyRoot:'Morelord Gaming'});
  assert.equal(folders[0].name,'Morelord Gaming');assert.equal(packs[2].folder.name,'Graypes Compendium');assert.equal(packs[3].folder,folders[0]);
  assert.equal(original.name,'Craftworks');
});
