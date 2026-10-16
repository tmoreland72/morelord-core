/** Native D&D5e activity choices and editable shared group-attack fields. */
export async function massCombatActivities(actor) {
  const choices=[];
  for(const item of actor.items.contents)for(const activity of item.system.activities?.contents ?? []) {
    if(!['attack','save'].includes(activity.type))continue;
    const defaultName=game.i18n.localize(activity.constructor.metadata?.title ?? '');
    const profile={activityId:activity.uuid ?? `${item.id}.${activity.id}`,activityUuid:activity.uuid,kind:activity.type,label:item.name+(activity.name && activity.name!==item.name && activity.name!==defaultName?' — '+activity.name:''),bonus:Number(activity.labels?.modifier),attacks:1,mode:'normal',magical:item.type==='spell' || Boolean(item.system.properties?.has('mgc')),saveType:item.type==='spell'?'spell':'ability'};
    if(activity.type==='save')Object.assign(profile,{ability:[...activity.save.ability][0],abilities:[...activity.save.ability],dc:activity.save.dc.value,onSave:activity.damage.onSave,coverage:activity.target?.template?.type?'all':'limited',targetsPerUse:Math.max(1,Number(activity.target?.affects?.count)||1)});
    const parts=[];
    try {
      for(const config of activity.getDamageConfig().rolls){
        const {parts:formula,data,options,base}=config,part={type:options.type ?? [...(options.types ?? [])][0]};
        for(const [key,isCritical] of [['damage',false],['critical',activity.type==='attack']]){
          const make=()=>new CONFIG.Dice.DamageRoll(formula.join(' + '),data,{base,...options,isCritical});
          const min=await make().evaluate({minimize:true}),max=await make().evaluate({maximize:true});
          part[key]=Math.floor((min.total+max.total)/2);
        }
        parts.push(part);
      }
    } catch { /* Missing or unusual formulas remain editable in the review. */ }
    profile.damageParts=parts;
    if(!parts.length && activity.type==='save')Object.assign(profile,{damage:0,critical:0,type:'necrotic'});
    if(parts.length===1)Object.assign(profile,{type:parts[0].type,damage:parts[0].damage,critical:parts[0].critical});
    choices.push({activity,profile});
  }
  for(const choice of choices.filter(c=>c.profile.kind==='attack')){
    const siblings=choices.filter(c=>c.activity.item===choice.activity.item && c.profile.kind==='save');
    // Imported stat blocks commonly store the on-hit save beside its attack without a native link.
    if(choices.filter(c=>c.activity.item===choice.activity.item && c.profile.kind==='attack').length===1 && /(?:on a hit|\bhit:|target is hit|target must[\s\S]*saving throw)/i.test(choice.activity.item.system.description?.value ?? '')){
      choice.profile.saves=siblings.map(c=>({...c.profile,oncePerTarget:/first time[\s\S]*each turn/i.test(choice.activity.item.system.description?.value ?? '')}));
    }
    const multi=actor.items.contents.find(i=>i.name?.toLowerCase()==='multiattack');
    const text=multi?.system.description?.value ?? '';
    const counts={one:1,two:2,three:3,four:4,five:5,six:6};
    const count=text.match(/makes?\s+(one|two|three|four|five|six|\d+)\s+([\s\S]*?)\s+attacks?\b/i);
    const item=choice.activity.item;
    if(count && (count[2].includes('.'+item.id) || count[2].toLowerCase().includes(item.name.toLowerCase())))choice.profile.attacks=counts[count[1].toLowerCase()] ?? Number(count[1]);
  }
  return choices.filter(c=>!choices.some(parent=>parent.profile.saves?.some(save=>save.activityId===c.profile.activityId)));
}

export function massCombatProfileFields(profile) {
  const e=value=>foundry.utils.escapeHTML(String(value ?? ''));
  const number=(key,label,value,min=0,max=10000)=>`<label class="ml-setting-row"><span>${label}</span><input name="${key}" type="number" min="${min}" max="${max}" step="1" required value="${Number.isFinite(value)?value:''}"></label>`;
  const select=(key,label,value,options)=>`<label class="ml-setting-row"><span>${label}</span><select name="${key}">${options.map(([id,title])=>`<option value="${e(id)}" ${id===value?'selected':''}>${e(title)}</option>`).join('')}</select></label>`;
  const types=Object.entries(CONFIG.DND5E.damageTypes).map(([key,value])=>[key,game.i18n.localize(value.label)]);
  const save=profile.kind==='save';
  let html=`<input type="hidden" name="kind" value="${save?'save':'attack'}"><label class="ml-setting-row"><span>Attack name</span><input name="label" value="${e(profile.label)}"></label>`;
  html+=number('attacks',save?'Uses per troop':'Attacks per troop',profile.attacks ?? 1,1,20);
  if(save){
    const abilities=profile.abilities?.length?profile.abilities:Object.keys(CONFIG.DND5E.abilities);
    html+=select('ability','Save ability',profile.ability,abilities.map(id=>[id,game.i18n.localize(CONFIG.DND5E.abilities[id].label)]));
    html+=number('dc','Save DC',profile.dc,1);
    html+=select('onSave','Damage on successful save',profile.onSave ?? 'half',[['none','No damage'],['half','Half damage'],['full','Full damage']]);
    html+=select('coverage','Target coverage',profile.coverage ?? 'all',[['all','Every selected target per use'],['limited','Limited targets per use']]);
    html+=number('targetsPerUse','Targets per use',profile.targetsPerUse ?? 1,1,200);
  }else html+=number('bonus','Attack bonus',profile.bonus,-100);
  if(profile.saves?.length)html+=`<p>${profile.saves.map(save=>`On hit: DC ${e(save.dc)} ${e(save.ability)} saving throw${save.oncePerTarget?' (first hit per target this batch)':''}.`).join(' ')} Non-damage effects remain GM-controlled.</p>`;
  const parts=profile.damageParts?.length>1?profile.damageParts:[profile];
  for(const [index,part] of parts.entries()){
    const prefix=parts.length>1?`part.${index}.`:'';
    html+=number(prefix+'damage',save?'Average damage on failed save':'Average damage per hit',part.damage);
    if(!save)html+=number(prefix+'critical','Average critical damage',part.critical);
    html+=select(prefix+'type','Damage type',part.type ?? 'slashing',types);
  }
  html+=select('mode',save?'Saving throws':'Attack rolls',profile.mode ?? 'normal',[['normal','Normal (native modifiers)'],['advantage','Advantage'],['disadvantage','Disadvantage']]);
  html+=`<label class="ml-setting-row"><span>Magical weapon damage</span><input type="checkbox" name="magical" ${profile.magical?'checked':''}></label>`;
  return html;
}
