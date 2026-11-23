import {setDisabled} from './disabled-reason.js';
const e=value=>foundry.utils.escapeHTML(String(value));
export function numberControl({name,label,value=1,min=1,max=100,help=''}) {
 return `<label class="ml-setting-row"><span>${e(label)}${help?`<small>${e(help)}</small>`:''}</span><span class="ml-stepper"><button type="button" class="ml-icon-button" data-ml-number-step="-1" aria-label="Decrease ${e(label)}"><i class="fa-solid fa-minus" aria-hidden="true"></i></button><input name="${e(name)}" aria-label="${e(label)}" type="number" min="${min}" max="${max}" step="1" value="${value}" required><button type="button" class="ml-icon-button" data-ml-number-step="1" aria-label="Increase ${e(label)}"><i class="fa-solid fa-plus" aria-hidden="true"></i></button></span></label>`;
}
export function activateNumberControls(root) {
 for(const control of root.querySelectorAll('.ml-stepper')) {
  const input=control.querySelector('input');
  const update=()=>{for(const button of control.querySelectorAll('[data-ml-number-step]'))setDisabled(button,input.disabled?'Wait for the current action to finish.':Number(button.dataset.mlNumberStep)<0 && Number(input.value)<=Number(input.min)?'Minimum reached.':Number(button.dataset.mlNumberStep)>0 && Number(input.value)>=Number(input.max)?'Maximum reached.':'');};
  for(const button of control.querySelectorAll('[data-ml-number-step]'))button.addEventListener('click',event=>{event.preventDefault();event.stopPropagation();if(button.disabled)return;Number(button.dataset.mlNumberStep)>0?input.stepUp():input.stepDown();input.dispatchEvent(new Event('change',{bubbles:true}));update();});
  input.addEventListener('input',update);input.addEventListener('change',update);update();
 }
}
