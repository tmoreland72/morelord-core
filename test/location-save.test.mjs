import test from 'node:test';
import assert from 'node:assert/strict';

test('location editor closes after successful persistence and stays open on failure',async()=>{
  const saved={foundry:globalThis.foundry,FormData:globalThis.FormData,ui:globalThis.ui};
  try{
    globalThis.foundry={applications:{api:{ApplicationV2:class{},HandlebarsApplicationMixin:Base=>Base}}};
    globalThis.FormData=class{get(key){return {name:'Fixture',settlementType:'road'}[key] ?? null;}getAll(){return [];}};
    globalThis.ui={notifications:{info(){},error(){}}};
    const {LocationManagerApp}=await import('../scripts/location/location-manager-app.js');
    for(const fail of [false,true]){
      const app=new LocationManagerApp();app.draft={};app.element={};
      let finish,closed=false;
      app.close=async()=>{closed=true;};
      LocationManagerApp.locationService={async save(draft){await new Promise(resolve=>finish=resolve);if(fail)throw Error('write failed');return {...draft,id:'fixture'};}};
      const button={disabled:false};
      const pending=LocationManagerApp.save.call(app,{preventDefault(){}},button);
      assert.equal(closed,false);assert.equal(button.disabled,true);
      finish();await pending;
      assert.equal(closed,!fail);assert.equal(button.disabled,false);
    }
  }finally{Object.assign(globalThis,saved);}
});
