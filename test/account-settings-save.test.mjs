import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const source=readFileSync(new URL('../scripts/main.js',import.meta.url),'utf8');
test('account settings close only after all writes succeed and remain open on failure',async()=>{
  for(const fail of [false,true]){
    const events=[];
    const context=vm.createContext({ApplicationV2:class{},HandlebarsApplicationMixin:base=>base,
      FormData:class{get(){return 'https://morelordgaming.com';}has(){return true;}},
      game:{user:{isGM:true},settings:{async set(_module,key){events.push(key);if(fail)throw Error('save failed');}}},
      MODULE_ID:'morelord-core',SETTINGS:{},normalizeServerUrl:value=>value,
      capSubscriptionTier:value=>value,getActualEntitlements:()=>({tier:'standard'}),notify(){}});
    const App=vm.runInContext(source.slice(source.indexOf('class MorelordConnectionApp '),source.indexOf('// Foundry settings menus instantiate'))+'\nMorelordConnectionApp;',context);
    const app=new App();app.element={};app.close=async()=>events.push('close');
    const target={disabled:false,closest:()=>({})};
    const result=App.saveSettings.call(app,{preventDefault(){}},target);
    if(fail){await assert.rejects(result,/save failed/);assert.ok(!events.includes('close'));}
    else{await result;assert.equal(events.length,10);assert.equal(events.at(-1),'close');}
    assert.equal(target.disabled,false);
  }
});
