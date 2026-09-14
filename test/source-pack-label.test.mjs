import test from 'node:test';
import assert from 'node:assert/strict';
import {resolvePackLabel} from '../scripts/services/source-book-service.js';

test('pack choices include the specific adventure folder without changing pack identity',()=>{
  const owner={title:'Monster Hunts',packFolders:[{name:'Publisher',folders:[{name:'Hunts',folders:[{name:'Dread and Breakfast',packs:['adventure-dread','actors-dread']},{name:'Dream Weaver',packs:['adventure-dream']}]}]}]};
  const options={packageCollection:new Map([['hunts',owner]]),system:{id:'dnd5e'},i18n:{localize:x=>x}};
  const label=(name,title)=>resolvePackLabel({...options,pack:{collection:'hunts.'+name,title,metadata:{packageName:'hunts',name}}});
  assert.equal(label('adventure-dread','Adventure'),'Monster Hunts — Dread and Breakfast (Adventure)');
  assert.equal(label('adventure-dream','Adventure'),'Monster Hunts — Dream Weaver (Adventure)');
  assert.equal(label('actors-dread','Bestiary'),'Monster Hunts — Dread and Breakfast (Bestiary)');
  assert.equal(label('other','Journals'),'Monster Hunts (Journals)');
});

test('pack labels omit repeated book fragments and preserve edition names',()=>{
  const title="Phandelver and Below: The Shattered Obelisk";
  const options={packageCollection:new Map([['book',{title,packFolders:[{name:'Phandelver and Below',packs:['adventure']}]}]]),system:{},i18n:{localize:x=>x}};
  assert.equal(resolvePackLabel({...options,pack:{collection:'book.adventure',title:'The Shattered Obelisk',documentName:'Adventure'}}),title+' (Adventure)');
  assert.equal(resolvePackLabel({...options,packageCollection:new Map([['book',{title:"Player's Handbook (2024)"}]]),pack:{collection:'book.actors',title:"Player's Handbook",documentName:'Actor'}}),"Player's Handbook (2024) (Actors)");
});
