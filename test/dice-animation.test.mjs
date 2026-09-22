import test from 'node:test';
import assert from 'node:assert/strict';
import {waitForDiceAnimation, afterDiceAnimation} from '../scripts/services/dice-animation.js';
import {ContextualSocketService} from '../scripts/services/contextual-socket-service.js';
test('outcomes wait for their animation and release hooks on completion or deletion',async t=>{
 const previous=globalThis.Hooks; t.after(()=>globalThis.Hooks=previous);
 const hooks=new Map();let n=0;globalThis.Hooks={on(name,fn){const id=++n;hooks.set(id,{name,fn});return id;},off(name,id){hooks.delete(id);}};
 const emit=(name,...args)=>{for(const entry of [...hooks.values()])if(entry.name===name)entry.fn(...args);};
 let finished=false;
 const pending=waitForDiceAnimation({id:'roll',_dice3danimating:true}).then(()=>finished=true);
 await Promise.resolve();assert.equal(finished,false);
 emit('diceSoNiceRollComplete','other');await Promise.resolve();assert.equal(finished,false);
 emit('diceSoNiceRollComplete','roll');await pending;assert.equal(finished,true);assert.equal(hooks.size,0);
 const deleted=waitForDiceAnimation({id:'deleted',_dice3danimating:true});emit('deleteChatMessage',{id:'deleted'});await deleted;assert.equal(hooks.size,0);
 await waitForDiceAnimation({id:'unanimated'});await waitForDiceAnimation(null);assert.equal(hooks.size,0);
});

test('animation waits release the roll queue while final state commits remain serialized', async t => {
 const previous={Hooks:globalThis.Hooks,MorelordCore:globalThis.MorelordCore};
 t.after(()=>Object.assign(globalThis,previous));
 const handlers=new Map();let n=0;
 globalThis.Hooks={on(name,fn){const id=++n;handlers.set(id,{name,fn});return id;},off(_name,id){handlers.delete(id);}};
 const socket=new ContextualSocketService();globalThis.MorelordCore={socket};
 const prepared=[],committed=[],animations=[];
 for(const id of ['first','second']) await socket.runSerialized('rolls', async()=>{
   prepared.push(id);
   animations.push(afterDiceAnimation({id,_dice3danimating:true},async()=>{
     const count=committed.length;await Promise.resolve();assert.equal(committed.length,count);committed.push(id);
   },'rolls'));
 });
 assert.deepEqual(prepared,['first','second']);assert.deepEqual(committed,[]);
 for(const id of ['second','first']) for(const hook of [...handlers.values()])if(hook.name==='diceSoNiceRollComplete')hook.fn(id);
 await Promise.all(animations);
 assert.deepEqual(committed,['second','first']);assert.equal(handlers.size,0);
});
