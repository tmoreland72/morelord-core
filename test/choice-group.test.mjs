import test from 'node:test';
import assert from 'node:assert/strict';
import {createChoiceGroup} from '../scripts/ui/choice-group.js';

test('workflow choices keep native grouped radio semantics and Core compact markup',()=>{
  const prior=globalThis.document;
  globalThis.document={createElement:tag=>({tagName:tag,dataset:{},children:[],append(...nodes){this.children.push(...nodes);},setAttribute(name,value){this[name]=value;}})};
  try{
    const group=createChoiceGroup({name:'mode',label:'Encounter Type',value:'mass',choices:[{value:'combat',label:'Combat',icon:'fa-hydra'},{value:'mass',label:'Mass Combat',icon:'fa-people-group'},{value:'locked',label:'Locked',disabled:true}]});
    assert.equal(group.tagName,'fieldset');assert.equal(group.children[0].textContent,'Encounter Type');
    const cards=group.children[1].children;
    assert.ok(cards.every(c=>c.className==='ml-choice-card' && c.dataset.size==='compact'));
    assert.deepEqual(cards.map(c=>[c.children[0].type,c.children[0].name,c.children[0].defaultChecked,c.children[0].disabled]),[['radio','mode',false,false],['radio','mode',true,false],['radio','mode',false,true]]);
  }finally{globalThis.document=prior;}
});
