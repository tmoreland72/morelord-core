/** Compact native radio choices for workflow selection. Styling and markup are Core-owned. */
export function createChoiceGroup({name, label, value, choices}) {
  const group=document.createElement('fieldset');
  group.className='ml-field-group';
  const legend=document.createElement('legend');legend.textContent=label;
  const grid=document.createElement('div');grid.className='ml-choice-grid';
  for(const choice of choices){
    const card=document.createElement('label');card.className='ml-choice-card';card.dataset.size='compact';
    if(choice.description)card.title=choice.description;
    const radio=document.createElement('input');radio.type='radio';radio.name=name;radio.value=choice.value;
    radio.defaultChecked=choice.value===value;radio.disabled=Boolean(choice.disabled);
    const icon=document.createElement('i');icon.className=`fa-solid ${choice.icon}`;icon.setAttribute('aria-hidden','true');
    const title=document.createElement('span');title.textContent=choice.label;
    card.append(radio,icon,title);grid.append(card);
  }
  group.append(legend,grid);return group;
}
