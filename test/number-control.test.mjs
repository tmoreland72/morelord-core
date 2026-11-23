import test from 'node:test';
import assert from 'node:assert/strict';
import {numberControl,activateNumberControls} from '../scripts/ui/number-control.js';

test('number steppers clamp at bounds, report disabled reasons, and notify form changes',()=>{
 globalThis.foundry={utils:{escapeHTML:value=>value.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;')}};
 const markup=numberControl({name:'round',label:'First Spawn Round',value:0,min:0,max:2,help:'Round 0 < immediate'});
 assert.match(markup,/ml-stepper/);assert.match(markup,/Round 0 &lt; immediate/);
 const listeners={},input={value:'0',min:'0',max:'2',disabled:false,addEventListener:(name,fn)=>{listeners[name]=fn;},stepUp(){this.value=String(Math.min(Number(this.max),Number(this.value)+1));},stepDown(){this.value=String(Math.max(Number(this.min),Number(this.value)-1));},dispatchEvent(event){changes++;assert.equal(event.type,'change');listeners.change();}};
 const button=delta=>({dataset:{mlNumberStep:String(delta)},disabled:false,attrs:{},addEventListener(name,fn){this[name]=fn;},getAttribute(name){return this.attrs[name]??null;},setAttribute(name,value){this.attrs[name]=value;},removeAttribute(name){delete this.attrs[name];}});
 const down=button(-1),up=button(1),control={querySelector:()=>input,querySelectorAll:()=>[down,up]};let changes=0;
 activateNumberControls({querySelectorAll:()=>[control]});
 assert.ok(down.disabled);assert.match(down.attrs['data-tooltip'],/Minimum reached/);
 const event={preventDefault(){},stopPropagation(){}};
 up.click(event);assert.equal(input.value,'1');assert.ok(!down.disabled);
 up.click(event);assert.equal(input.value,'2');assert.ok(up.disabled);assert.match(up.attrs['data-tooltip'],/Maximum reached/);
 up.click(event);assert.equal(changes,2);
 down.click(event);assert.equal(input.value,'1');assert.ok(!up.disabled);
 input.disabled=true;listeners.input();assert.ok(down.disabled && up.disabled);
});
