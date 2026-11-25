import test from 'node:test';
import assert from 'node:assert/strict';
import {activateCheckStates} from '../scripts/ui/check-state.js';

test('Core checkbox state follows unsaved changes without duplicate listeners',()=>{
  const input=new EventTarget();input.checked=false;
  const label={textContent:'stale'};
  const control={dataset:{},querySelector:selector=>selector.startsWith('input')?input:label};
  const root={querySelectorAll:()=>[control]};
  activateCheckStates(root);
  assert.equal(label.textContent,'Disabled');
  input.checked=true;input.dispatchEvent(new Event('change'));
  assert.equal(label.textContent,'Enabled');
  activateCheckStates(root);
  input.checked=false;input.dispatchEvent(new Event('change'));
  assert.equal(label.textContent,'Disabled');
});
