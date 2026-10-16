import test from 'node:test';
import assert from 'node:assert/strict';
import {createMassCombat} from '../scripts/services/mass-combat.mjs';

test('shared group attacks preserve each consumer namespace and reject unsupported systems', async()=>{
  const writes=[],errors=[];
  globalThis.foundry={utils:{deepClone:structuredClone,isNewerVersion:version=>version==='6.0.3'}};
  globalThis.game={system:{version:'6.0.3'},modules:new Map([['morelord-core',{active:true}]]),user:{id:'gm',isGM:true,getFlag:()=>null,setFlag:async(...args)=>writes.push(args)}};
  globalThis.MorelordCore={users:{list:()=>[{id:'gm'}]},socket:{runSerialized:async(_key,fn)=>fn()}};
  globalThis.canvas={ready:true,scene:{id:'scene'},tokens:{controlled:[{document:{id:'troop',actorId:'actor',actor:{system:{attributes:{hp:{value:10}}},items:{contents:[]}}}}]}};
  globalThis.ui={notifications:{info(){},error:message=>errors.push(message)}};
  for(const id of ['morelord-game-master','morelord-encounters'])await createMassCombat(id).massCombat('attackers');
  assert.deepEqual(writes.map(w=>w[0]),['morelord-game-master','morelord-encounters']);
  assert.ok(writes.every(w=>w[1]==='massCombat' && w[2].attackerIds[0]==='troop'));
  const roles=[];
  const dropdownTroop={...canvas.tokens.controlled[0].document,id:'dropdown-troop'};
  await createMassCombat('morelord-encounters',{selectedTokens:role=>{roles.push(role);return [dropdownTroop];}}).massCombat('attackers');
  assert.deepEqual(roles,['attackers']);assert.deepEqual(writes[2][2].attackerIds,['dropdown-troop']);
  game.system.version='5.3.3';
  await createMassCombat('morelord-encounters').massCombat('attackers');
  assert.equal(writes.length,3);assert.match(errors[0],/6.0.3/);
});

test('shared chat summarizes target results and reset cancels pending preview',async()=>{
 let state,message;
 globalThis.foundry={utils:{escapeHTML:String,deepClone:structuredClone,isNewerVersion:()=>true}};
 const actor=(id,hp)=>({uuid:id,type:'npc',system:{attributes:{hp:{value:hp,temp:0},ac:{value:10}}},items:{contents:[]},calculateDamage:rows=>({amount:rows[0].value})});
 const attacker={id:'a',actorId:'a',actor:actor('Actor.a',10)},targets=[1,2].map(id=>({id:'t'+id,name:'Target '+id,texture:{src:''},actor:actor('Actor.t'+id,5)}));
 const tokens=new Map([['a',attacker],...targets.map(t=>[t.id,t])]);
 globalThis.canvas={ready:true,scene:{id:'scene',tokens}};
 globalThis.game={i18n:{localize:x=>x},system:{version:'6.0.3'},modules:new Map([['morelord-core',{active:true}]]),messages:{get:()=>message},user:{id:'gm',isGM:true,getFlag:()=>state,setFlag:async(_id,_key,value)=>{state=value;},unsetFlag:async()=>{state=null;}}};
 globalThis.MorelordCore={ui:{actorIdentity:()=>''},users:{list:()=>[{id:'gm',isGM:true}]},socket:{runSerialized:async(_key,fn)=>fn()}};
 globalThis.ui={notifications:{info(){},error(error){throw Error(error);}}};
 globalThis.CONFIG={DND5E:{damageTypes:{slashing:{label:'slashing'}}}};
 globalThis.Roll=class{async evaluate(){return {dice:[{results:[{result:15}]}]};}};
 globalThis.ChatMessage={getSpeaker:()=>({}),async create(data){message={id:'message',...data,getFlag:()=>message.flags['morelord-encounters'].massCombat,update:async update=>{message.content=update.content;}};return message;}};
 const reviews=[];
 const api=createMassCombat('morelord-encounters',{selectedTokens:role=>role==='attackers'?[attacker]:targets,presentForm:async config=>{reviews.push(config);return {action:config.suffix==='pending'?'cancel':'roll',data:new Map(Object.entries({bonus:'3',attacks:'1',damage:'8',critical:'16',label:'Sword',type:'slashing',mode:'normal'}))};}});
 await api.massCombat('attackers');await api.massCombat('resolve');
 assert.match(message.content,/1 of 2 targets hit · 1 hits · 1 killed · 5 total damage/);
 assert.ok(!message.content.includes('Target 1') && !message.content.includes('ml-item-row'));
 assert.equal(message.getFlag().result.rows.length,2);
 await api.massCombat('resolve');
 assert.ok(reviews.at(-1).content.includes('1 of 2 targets hit'));
 assert.ok(!reviews.at(-1).content.includes('waiting in GM chat'));
 assert.ok(state.pendingId,'Closing a current preview retains the result');
 game.combat={id:'new-combat',scene:{id:'scene'}};
 await api.massCombat('reconcile');
 assert.equal(state.pendingId,null);assert.match(message.content,/previous combat/);
 assert.equal(targets[0].actor.system.attributes.hp.value,5);
 await api.massCombat('attackers');await api.massCombat('resolve');
 assert.equal(message.getFlag().combatId,'new-combat');
 await api.massCombat('reset');assert.equal(state,null);assert.match(message.content,/Cancelled — combat ended/);
});
import {massCombatActivities,massCombatProfileFields} from '../scripts/services/mass-combat-profiles.mjs';

test('activity choices include base-damage weapons and saving throws with distinct UUIDs',async()=>{
 globalThis.CONFIG={DND5E:{damageTypes:{piercing:{label:'Piercing'},fire:{label:'Fire'}},abilities:{dex:{label:'Dexterity'}}},Dice:{DamageRoll:class{constructor(_f,_d,options){this.critical=options.isCritical;}async evaluate({maximize}){return {total:maximize?(this.critical?19:11):(this.critical?5:4)};}}}};
 globalThis.game={i18n:{localize:x=>x}};globalThis.foundry={utils:{escapeHTML:String}};
 const item=(id,name,type='attack')=>{const item={id,name,type:'weapon',system:{properties:new Set()}};const activity={id:'same-activity-id',uuid:'Actor.test.Item.'+id+'.Activity.same-activity-id',type,item,labels:{modifier:'+5'},damage:{parts:[],onSave:'half'},save:{ability:new Set(['dex']),dc:{value:13}},target:{template:{type:type==='save'?'cone':null}},getDamageConfig:()=>({rolls:[{parts:['1d8 + 3'],options:{type:type==='save'?'fire':'piercing'}}]})};item.system.activities={contents:[activity]};return item;};
 const choices=await massCombatActivities({items:{contents:[item('bow','Longbow'),item('sword','Shortsword'),item('breath','Fire Breath','save')]}});
 assert.equal(choices.length,3);assert.equal(new Set(choices.map(c=>c.profile.activityId)).size,3);
 assert.equal(choices[0].profile.damage,7);assert.equal(choices[0].profile.critical,12);assert.equal(choices[0].profile.bonus,5);
 assert.equal(choices[2].profile.kind,'save');assert.equal(choices[2].profile.onSave,'half');assert.equal(choices[2].profile.dc,13);assert.equal(choices[2].profile.coverage,'all');
 const fields=massCombatProfileFields(choices[2].profile);assert.match(fields,/Save ability/);assert.match(fields,/Half damage/);assert.ok(!fields.includes('Attack bonus') && !fields.includes('Average critical damage'));
});

test('native group saving throws preview half damage with resistance and temporary HP before applying once',async()=>{
 let state,message,saveRolls=0;const choices=[];
 globalThis.foundry={utils:{escapeHTML:String,deepClone:structuredClone,isNewerVersion:()=>true}};
 const makeActor=(id,resistant=false,temp=0)=>({uuid:id,type:'npc',name:id,items:{contents:[]},system:{attributes:{hp:{value:20,temp},ac:{value:10}}},calculateDamage:(parts,{multiplier=1}={})=>({amount:Math.trunc(parts.reduce((n,p)=>n+p.value,0)*multiplier*(resistant?0.5:1))}),async rollSavingThrow(config,dialog,message){saveRolls++;assert.equal(config.ability,'dex');assert.equal(config.target,13);assert.equal(dialog.configure,false);assert.equal(message.create,false);return [{total:resistant?8:17}];},async applyDamage(damage){const hp=this.system.attributes.hp,absorbed=Math.min(hp.temp,damage);hp.temp-=absorbed;hp.value=Math.max(0,hp.value-damage+absorbed);}});
 const attacker={id:'a',actorId:'a',actor:makeActor('Actor.a')};
 const targets=[{id:'t1',name:'First',texture:{src:''},actor:makeActor('Actor.t1',false,3)},{id:'t2',name:'Second',texture:{src:''},actor:makeActor('Actor.t2',true)}];
 globalThis.canvas={ready:true,scene:{id:'scene',tokens:new Map([['a',attacker],...targets.map(t=>[t.id,t])])}};
 globalThis.game={system:{version:'6.0.3'},i18n:{localize:x=>x},modules:new Map([['morelord-core',{active:true}]]),messages:{get:()=>message},user:{id:'gm',isGM:true,getFlag:()=>state,setFlag:async(_m,_k,value)=>{state=structuredClone(value);}}};
 globalThis.MorelordCore={ui:{actorIdentity:()=>''},users:{list:()=>[{id:'gm',isGM:true}]},socket:{runSerialized:async(_k,fn)=>fn()}};
 globalThis.ui={notifications:{info(){},error(error){throw Error(error);}}};
 globalThis.CONFIG={DND5E:{abilities:{dex:{label:'Dexterity'}},damageTypes:{fire:{label:'Fire'}}}};
 globalThis.ChatMessage={getSpeaker:()=>({}),async create(data){message={id:'preview',...data,getFlag:()=>message.flags['morelord-encounters'].massCombat,setFlag:async(_m,_k,value)=>{message.flags['morelord-encounters'].massCombat=value;},update:async value=>{message.content=value.content;}};return message;}};
 let onSave='half';
 const api=createMassCombat('morelord-encounters',{selectedTokens:role=>role==='attackers'?[attacker]:targets,presentForm:async config=>{choices.push(config);return {action:'roll',data:new Map(Object.entries({kind:'save',label:'Breath',attacks:'1',ability:'dex',dc:'13',onSave,coverage:'all',targetsPerUse:'1',damage:'8',type:'fire',mode:'normal'}))};}});
 await api.massCombat('attackers');await api.massCombat('resolve');
 const rows=message.getFlag().result.rows;
 assert.equal(saveRolls,2);assert.deepEqual(rows.map(r=>r.damage),[4,4]);assert.equal(rows[0].hp,19);assert.equal(rows[0].temp,0);assert.equal(rows[1].hp,16);
 assert.ok(message.content.includes('1 saves passed') && message.content.includes('1 saves failed'));
 assert.equal(targets[0].actor.system.attributes.hp.value,20);
 await api.massCombat('apply');assert.equal(targets[0].actor.system.attributes.hp.value,19);assert.equal(targets[1].actor.system.attributes.hp.value,16);assert.equal(saveRolls,2);
 onSave='none';await api.massCombat('attackers');await api.massCombat('resolve');
 assert.equal(message.getFlag().result.rows[0].damage,0);assert.equal(message.getFlag().result.rows[1].damage,4);
});

test('an on-hit zero-damage save stays with its attack and linked Multiattack supplies its count',async()=>{
 globalThis.CONFIG={DND5E:{damageTypes:{necrotic:{label:'Necrotic'}},abilities:{con:{label:'Constitution'}}},Dice:{DamageRoll:class{async evaluate(){return {total:10};}}}};
 globalThis.game={i18n:{localize:x=>x}};
 const item={id:'blast',name:'Blast',type:'weapon',system:{properties:new Set(),description:{value:'The first time the target is hit each turn, it makes a saving throw.'}}};
 const attack={id:'attack',uuid:'attack',type:'attack',item,labels:{modifier:'+4'},getDamageConfig:()=>({rolls:[{parts:['3d6'],options:{type:'necrotic'}}]})};
 const save={id:'save',uuid:'save',type:'save',item,damage:{onSave:'none'},save:{ability:new Set(['con']),dc:{value:13}},getDamageConfig:()=>({rolls:[]})};
 item.system.activities={contents:[save,attack]};
 const multi={name:'Multiattack',system:{description:{value:'Makes two [[/item .blast]] attacks.'}}};
 const choices=await massCombatActivities({items:{contents:[item,multi]}});
 assert.equal(choices.length,1);assert.equal(choices[0].profile.attacks,2);
 assert.equal(choices[0].profile.saves[0].damage,0);assert.equal(choices[0].profile.saves[0].oncePerTarget,true);
 assert.match(massCombatProfileFields(choices[0].profile),/On hit: DC 13 con/);
 item.system.description.value='Choose an attack or a saving throw ability.';
 assert.equal((await massCombatActivities({items:{contents:[item]}})).length,2,'Independent activity alternatives stay separate');
});
