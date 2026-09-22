import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {ContextualSocketService} from '../scripts/services/contextual-socket-service.js';
import {afterDiceAnimation} from '../scripts/services/dice-animation.js';

test('published socket facade supports serialized saved-roll outcomes',async t=>{
  const main=readFileSync(new URL('../scripts/main.js',import.meta.url),'utf8');
  const start=main.indexOf('socket: Object.freeze(')+'socket: '.length;
  const end=main.indexOf('    locations:',start);
  assert.ok(start>0&&end>start,'Find the actual public socket facade');
  const expression=main.slice(start,end).trim().replace(/,$/,'');
  const socket=new Function('contextualSocket','return '+expression)(new ContextualSocketService());
  assert.equal(typeof socket.runSerialized,'function','Public API must expose runSerialized');
  const previous=globalThis.MorelordCore;t.after(()=>globalThis.MorelordCore=previous);
  globalThis.MorelordCore={socket};
  const completed=[];
  await Promise.all([1,2].map(id=>afterDiceAnimation({id},async()=>{
    const before=completed.length;await Promise.resolve();assert.equal(completed.length,before);completed.push(id);
  },'public-roll-result')));
  assert.deepEqual(completed,[1,2]);
});
