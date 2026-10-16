import {massCombatActivities,massCombatProfileFields} from './mass-combat-profiles.mjs';
export function createMassCombat(ID, { selectedTokens = null, presentForm = null } = {}) {
const e=value=>foundry.utils.escapeHTML(String(value ?? ""));
const KEY='massCombat';
function core() {
  const api=game.modules.get('morelord-core')?.active && globalThis.MorelordCore;
  if (!game.user.isGM || !api?.socket?.runSerialized || !api.users.list().some(u=>u.id===game.user.id)) throw Error('An enabled, non-ignored GM and Morelord Core are required.');
  return api;
}
const hpOf=actor=>({hp:Number(actor.system.attributes.hp.value),temp:Number(actor.system.attributes.hp.temp ?? 0)});
const sameHP=(a,b)=>a.hp===b.hp && a.temp===b.temp;
const living=token=>token.actor && hpOf(token.actor).hp>0;
const selected=role=>(selectedTokens ? selectedTokens(role) : canvas.tokens.controlled.map(t=>t.document)).filter(living);
const combatId=()=>{
  const belongs=combat=>combat && (combat.scene?.id===canvas.scene.id || (!combat.scene && combat.combatants?.some(c=>c.sceneId===canvas.scene.id)));
  const viewed=game.combats?.viewed ?? game.combat;
  const matches=game.combats?.filter?.(belongs) ?? [];
  return (belongs(viewed) ? viewed : matches.length===1 ? matches[0] : null)?.id ?? null;
};

async function reconcileState(state) {
  if(!state.pendingId)return state;
  const message=game.messages.get(state.pendingId),batch=message?.getFlag(ID,KEY);
  if(batch && batch.userId!==game.user.id)throw Error('This pending attack belongs to another GM.');
  const active=batch && ['preview','applying'].includes(batch.stage);
  const stale=active && batch.sceneId===canvas.scene.id && (batch.combatId ?? null)!==combatId();
  if(active && !stale)return state;
  if(stale){
    const stopped={...batch,stage:'discarded'};
    await message.update({content:card(stopped,'Discarded — previous combat; any applied damage kept'),[`flags.${ID}.${KEY}`]:stopped});
    ui.notifications.info('Cleared an attack preview from a previous combat. No additional damage was applied.');
  }
  const cleared={...state,pendingId:null};
  await game.user.setFlag(ID,KEY,cleared);
  return cleared;
}

/** Ordered, focused attacks: unused damage is lost and only later attacks move on. */
function resolveMassCombat(faces, bonus, targets) {
  const rows=targets.map(t=>({...t,before:{hp:t.hp,temp:t.temp},attempts:0,hits:0,criticals:0,damage:0}));
  let index=0,used=0;
  for (const face of faces) {
    while(index<rows.length && rows[index].hp<=0) index++;
    if(index===rows.length) break;
    const target=rows[index];used++;target.attempts++;
    if(face===1 || (face!==20 && face+bonus<target.ac)) continue;
    target.hits++;if(face===20)target.criticals++;
    const damage=face===20?target.critical:target.normal;
    const absorbed=Math.min(target.temp,damage);
    target.temp-=absorbed;
    const loss=Math.min(target.hp,damage-absorbed);
    target.hp-=loss;target.damage+=absorbed+loss;
  }
  return {rows,used,unused:faces.length-used,hits:rows.reduce((n,r)=>n+r.hits,0),dropped:rows.filter(r=>r.hp===0).length};
}

async function form(suffix,title,content,buttons,{onChange}={}) {
  if (presentForm) return presentForm({suffix,title,content,buttons,onChange});
  const id=`${ID}-mass-${suffix}`;
  const hook=onChange?Hooks.on('renderDialogV2',dialog=>{
    if(dialog.id===id){dialog.element.addEventListener('change',event=>onChange(event,dialog.element));onChange({target:{}},dialog.element);}
  }):null;
  try {
    return await foundry.applications.api.DialogV2.wait({id,classes:['ml-window'],window:{title,resizable:true},position:{width:540},rejectClose:false,
      content:`<div><div class="ml-app ml-app-shell ml-dialog-shell ml-stack">${content}</div></div>`,
      buttons:buttons.map(([action,label])=>({action,label,callback:(_event,button)=>({action,data:new FormData(button.form)})}))});
  } finally {if(hook!=null)Hooks.off('renderDialogV2',hook);}
}

async function captureAttackers(state) {
  if(state.pendingId)throw Error('Apply or discard the pending result before choosing new attackers.');
  const tokens=selected('attackers');
  if(!tokens.length)throw Error('Select the living attacker tokens first.');
  const groupKey=[...new Set(tokens.map(t=>t.actorId))].sort().join(',');
  let profile=state.groupKey===groupKey ? (state.profile ?? {}) : {};
  if(state.groupKey!==groupKey)profile={};
  await game.user.setFlag(ID,KEY,{sceneId:canvas.scene.id,attackerIds:tokens.map(t=>t.id),groupKey,profile,pendingId:null});
  ui.notifications.info(selectedTokens ? `${tokens.length} attackers ready.` : `${tokens.length} attackers remembered. Select the targets, then run Mass Combat — Attack Targets.`);
}

function damageFor(actor,profile,critical=false,multiplier=1) {
  const parts=profile.damageParts?.length?profile.damageParts:[profile];
  const properties=new Set(profile.magical?['mgc']:[]);
  const result=actor.calculateDamage(parts.map(part=>({value:critical?part.critical:part.damage,type:part.type,properties})),{multiplier});
  if(!result || !Number.isFinite(result.amount) || result.amount<0)throw Error(`Damage calculation was blocked for ${actor.name}.`);
  return result.amount;
}

async function savingThrowResult(targets,profile,uses,activity) {
  const rows=targets.map(t=>({...t,before:{hp:t.hp,temp:t.temp},attempts:0,hits:0,criticals:0,damage:0,passed:0,failed:0})),rolls=[];
  for(let use=0;use<uses;use++){
    const living=rows.filter(row=>row.hp>0);
    const affected=profile.coverage==='all'?living:living.slice(0,profile.targetsPerUse);
    for(const row of affected){
      const actor=canvas.scene.tokens.get(row.id).actor;
      const config={ability:profile.ability,target:profile.dc,saveType:profile.saveType ?? 'ability'};
      if(profile.mode==='advantage')config.advantage=true;
      if(profile.mode==='disadvantage')config.disadvantage=true;
      if(activity?.save?.bonus){const bonus=CONFIG.Dice.BasicRoll.constructParts({activityBonus:activity.save.bonus},activity.getRollData());if(bonus.parts.length)config.rolls=[bonus];}
      const results=await actor.rollSavingThrow(config,{configure:false},{create:false,rollMode:'gmroll'});
      const roll=results?.[0];
      if(!roll || !Number.isFinite(roll.total))throw Error('A saving throw was cancelled. No damage has been applied.');
      rolls.push(...results);row.attempts++;
      const passed=roll.total>=profile.dc;
      if(passed)row.passed++;else {row.failed++;row.hits++;}
      const damage=passed?row.successDamage:row.normal;
      const absorbed=Math.min(row.temp,damage);row.temp-=absorbed;
      const loss=Math.min(row.hp,damage-absorbed);row.hp-=loss;row.damage+=absorbed+loss;
    }
  }
  return {rolls,result:{rows,used:rolls.length,unused:0,hits:rows.reduce((n,r)=>n+r.failed,0),passed:rows.reduce((n,r)=>n+r.passed,0),failed:rows.reduce((n,r)=>n+r.failed,0),dropped:rows.filter(r=>r.hp===0).length}};
}

async function attackWithSaves(faces,profile,targets,activities){
  const result=resolveMassCombat([],profile.bonus,targets),rolls=[];
  for(const face of faces){
    const row=result.rows.find(r=>r.hp>0);
    if(!row){result.unused++;continue;}
    const hit=resolveMassCombat([face],profile.bonus,[row]).rows[0];
    for(const key of ['attempts','hits','criticals','damage'])row[key]+=hit[key];
    row.hp=hit.hp;row.temp=hit.temp;result.used++;
    if(!hit.hits)continue;
    row.saves ??=[];
    for(const save of profile.saves ?? []){
      if(save.oncePerTarget && row.saves.some(r=>r.activityId===save.activityId))continue;
      const native=activities.find(c=>c.activity.uuid===save.activityUuid)?.activity ?? await fromUuid(save.activityUuid);
      const actor=canvas.scene.tokens.get(row.id).actor;
      const resolved=await savingThrowResult([{...row,normal:damageFor(actor,save),successDamage:damageFor(actor,save,false,save.onSave==='none'?0:save.onSave==='half'?0.5:1)}],{...save,coverage:'limited',targetsPerUse:1},1,native);
      const saved=resolved.result.rows[0];
      row.saves.push({activityId:save.activityId,passed:saved.passed,failed:saved.failed});
      row.damage+=saved.damage;row.hp=saved.hp;row.temp=saved.temp;rolls.push(...resolved.rolls);
    }
  }
  result.hits=result.rows.reduce((n,r)=>n+r.hits,0);result.dropped=result.rows.filter(r=>r.hp===0).length;
  return {result,rolls};
}

function card(batch,status='Preview — HP unchanged') {
  const targetsHit=batch.result.rows.filter(row=>row.hits>0).length;
  const damage=batch.result.rows.reduce((total,row)=>total+row.damage,0);
  const save=batch.profile.kind==='save';
  const summary=save?`${batch.result.rows.filter(row=>row.damage>0).length} of ${batch.result.rows.length} targets damaged · ${batch.result.passed} saves passed · ${batch.result.failed} saves failed`:`${targetsHit} of ${batch.result.rows.length} targets hit · ${batch.result.hits} hits`;
  const description=save?`${batch.attackers} attackers × ${batch.profile.attacks} uses. ${e(batch.profile.label)}: DC ${batch.profile.dc} ${e(batch.profile.ability)} save; ${batch.profile.damage} average ${e(batch.profile.type)} damage; ${e(batch.profile.onSave)} damage on success.`:`${batch.attackers} attackers × ${batch.profile.attacks} attacks. ${e(batch.profile.label || 'Group attack')}: +${batch.profile.bonus} to hit; ${batch.profile.damage} average ${e(batch.profile.type)} damage (${batch.profile.critical} on a critical).`;
  return `<section class="ml-chat-card"><h3>Mass Combat</h3><p>${e(status)}</p>
    <p><strong>${summary} · ${batch.result.dropped} killed · ${damage} total damage</strong></p>
    <p>${description}</p>
    ${batch.profile.saves?.length?`<p>On-hit saves: ${batch.result.rows.flatMap(r=>r.saves ?? []).reduce((n,s)=>n+s.passed,0)} passed · ${batch.result.rows.flatMap(r=>r.saves ?? []).reduce((n,s)=>n+s.failed,0)} failed. Non-damage effects remain GM-controlled.</p>`:''}
    ${batch.result.unused?`<p>${batch.result.unused} attacks unused after all targets fell.</p>`:''}
    <p>${status.startsWith('Preview')?'Apply Damage to commit this result.':status==='Applied'?'Damage applied to HP and temporary HP. Death and defeat markers remain GM-controlled.':'Summary shows the original projection.'}</p></section>`;
}

async function resolveTargets(state) {
  if(state.pendingId) {
    const pending=game.messages.get(state.pendingId)?.getFlag(ID,KEY);
    const partial=pending?.stage==='applying';
    if(pending.sceneId!==canvas.scene.id)throw Error('The pending attack belongs to another scene. Return to that scene to apply or discard it.');
    const choice=await form('pending','Mass Combat — Pending Result',`<p>${partial?'This attack was interrupted. Resume it, or discard the remaining work. Already applied damage is kept.':'This combat has an unapplied attack. Apply or discard it before rolling another attack. Close Review keeps it pending.'}</p>${card(pending,partial?'Interrupted — totals show the original projection':'Preview — damage not yet applied')}`,[['apply',partial?'Resume applying':'Apply damage'],['discard',partial?'Discard remaining work':'Discard result'],['cancel','Close Review']]);
    if(choice?.action==='apply')return applyResult(state);
    if(choice?.action==='discard') {
      const message=game.messages.get(state.pendingId),batch=message?.getFlag(ID,KEY);
      if(batch)await message.update({content:card(batch,partial?'Stopped — any applied damage kept; figures below are the original projection':'Discarded — HP unchanged'),[`flags.${ID}.${KEY}.stage`]:'discarded'});
      await game.user.setFlag(ID,KEY,{...state,pendingId:null});
    }
    return;
  }
  if(state.sceneId!==canvas.scene.id || !state.attackerIds?.length)throw Error('Select attackers on this scene with Mass Combat — Select Attackers first.');
  const attackers=state.attackerIds.map(id=>canvas.scene.tokens.get(id)).filter(t=>t && living(t));
  if(!attackers.length)throw Error('No remembered attackers are still alive on this scene.');
  const targets=selected('targets');
  if(!targets.length)throw Error('Select the living target tokens first.');
  if(targets.some(t=>state.attackerIds.includes(t.id)))throw Error('The targets include remembered attackers. Select only the opposing group.');
  if(new Set(targets.map(t=>t.actor.uuid)).size!==targets.length)throw Error('Some targets share the same linked actor and HP. Unlink duplicate troop tokens first.');
  const activities=await massCombatActivities(attackers[0].actor);
  const previous=state.profile ?? {};
  const first=activities.find(c=>c.profile.activityId===previous.activityId) ?? activities[0];
  const manual={kind:'attack',attacks:1,mode:'normal'};
  const remembered=previous.activityId && first?.profile.activityId===previous.activityId;
  const initial=remembered?(first.profile.saves?.length && !previous.saves?{...previous,saves:first.profile.saves,attacks:first.profile.attacks}:previous):first?.profile ?? {...manual,...previous};
  const options=activities.map(c=>`<option value="${e(c.profile.activityId)}" ${c.profile.activityId===initial.activityId?'selected':''}>${e(c.profile.label)}${c.profile.kind==='save'?' — Saving throw':''}</option>`).join('');
  const onChange=(event,root)=>{
    if(event.target.name==='activityId'){
      const profile=activities.find(c=>c.profile.activityId===event.target.value)?.profile ?? manual;
      root.querySelector('[data-mass-attack-options]').innerHTML=massCombatProfileFields(profile);
    }
    const coverage=root.querySelector('[name="coverage"]'),limit=root.querySelector('[name="targetsPerUse"]');
    if(limit)limit.closest('label').hidden=coverage.value==='all';
  };
  const choice=await form('attack','Mass Combat — Group Attack',
    `<p>${attackers.length} living attackers → ${targets.length} targets.</p>
    <label class="ml-setting-row"><span>Attack</span><select name="activityId"><option value="">Manual attack</option>${options}</select></label>
    <div class="ml-stack" data-mass-attack-options>${massCombatProfileFields(initial)}</div>`,[['roll','Resolve attacks'],['cancel','Cancel']],{onChange});
  if(choice?.action!=='roll')return;
  const chosenId=choice.data.get('activityId') ?? '';
  const chosen=activities.find(c=>c.profile.activityId===chosenId);
  if(chosenId && !chosen)throw Error('The selected attack is unavailable.');
  const kind=choice.data.get('kind') ?? 'attack';
  if(!['attack','save'].includes(kind) || (chosen && chosen.profile.kind!==kind))throw Error('Invalid attack type.');
  const getNumber=(key,min=0,max=10000)=>{const raw=choice.data.get(key),value=Number(raw);if(raw==null || String(raw).trim()==='' || !Number.isInteger(value)||value<min||value>max)throw Error(`Invalid ${key}.`);return value;};
  const profile={kind,activityId:chosenId,activityUuid:chosen?.profile.activityUuid,label:choice.data.get('label'),attacks:getNumber('attacks',1,20),mode:choice.data.get('mode'),magical:choice.data.has('magical')};
  if(chosen?.profile.saves?.length)profile.saves=chosen.profile.saves;
  const partCount=Math.max(1,chosen?.profile.damageParts.length ?? 1);
  profile.damageParts=Array.from({length:partCount},(_,i)=>{
    const prefix=partCount>1?`part.${i}.`:'';
    const part={type:choice.data.get(prefix+'type'),damage:getNumber(prefix+'damage')};
    part.critical=kind==='save'?part.damage:getNumber(prefix+'critical');
    if(!CONFIG.DND5E.damageTypes[part.type])throw Error('Invalid damage type.');
    return part;
  });
  Object.assign(profile,{damage:profile.damageParts.reduce((n,p)=>n+p.damage,0),critical:profile.damageParts.reduce((n,p)=>n+p.critical,0),type:profile.damageParts.map(p=>p.type).join(' + ')});
  if(kind==='save'){
    Object.assign(profile,{ability:choice.data.get('ability'),abilities:chosen?.profile.abilities,dc:getNumber('dc',1),onSave:choice.data.get('onSave'),coverage:choice.data.get('coverage'),targetsPerUse:getNumber('targetsPerUse',1,200),saveType:chosen?.profile.saveType ?? 'ability'});
    if(!CONFIG.DND5E.abilities[profile.ability] || (profile.abilities?.length && !profile.abilities.includes(profile.ability)) || !['none','half','full'].includes(profile.onSave) || !['all','limited'].includes(profile.coverage))throw Error('Invalid saving throw options.');
  }else profile.bonus=getNumber('bonus',-100);
  if(!['normal','advantage','disadvantage'].includes(profile.mode))throw Error('Invalid roll mode.');
  const count=attackers.length*profile.attacks;
  const maximumRolls=kind==='save'?count*(profile.coverage==='all'?targets.length:Math.min(targets.length,profile.targetsPerUse)):count*(1+(profile.saves?.length ?? 0));
  if(maximumRolls>500)throw Error('Resolve at most 500 attack or saving throw rolls per batch.');
  if(!attackers.every(living)||!targets.every(living))throw Error('An attacker or target dropped while the form was open. Reopen the attack.');
  const snapshots=targets.map(t=>({id:t.id,actorUuid:t.actor.uuid,name:t.name,img:t.texture.src,type:t.actor.type,ac:Number(t.actor.system.attributes.ac.value),...hpOf(t.actor),normal:damageFor(t.actor,profile),critical:damageFor(t.actor,profile,true),...(kind==='save'?{successDamage:damageFor(t.actor,profile,false,profile.onSave==='none'?0:profile.onSave==='half'?0.5:1)}:{})}));
  for(const row of snapshots)if(profile.saves?.length)row.saveDefenses=profile.saves.map(save=>[damageFor(canvas.scene.tokens.get(row.id).actor,save),damageFor(canvas.scene.tokens.get(row.id).actor,save,false,save.onSave==='none'?0:save.onSave==='half'?0.5:1)]);
  if(snapshots.some(t=>![t.ac,t.hp,t.temp].every(Number.isFinite)))throw Error('Every target must have numeric AC and HP.');
  let result,rolls;
  if(kind==='save')({result,rolls}=await savingThrowResult(snapshots,profile,count,chosen?.activity));
  else{
    const multiplier=profile.mode==='normal'?1:2;
    const roll=await new Roll(`${count*multiplier}d20`).evaluate({allowInteractive:false});
    const dice=roll.dice[0].results.map(r=>r.result),faces=[];
    for(let i=0;i<dice.length;i+=multiplier)faces.push(multiplier===1?dice[i]:(profile.mode==='advantage'?Math.max:Math.min)(dice[i],dice[i+1]));
    if(profile.saves?.length){const combined=await attackWithSaves(faces,profile,snapshots,activities);result=combined.result;rolls=[roll,...combined.rolls];}
    else {result=resolveMassCombat(faces,profile.bonus,snapshots);rolls=[roll];}
  }
  const batch={stage:'preview',userId:game.user.id,sceneId:canvas.scene.id,combatId:combatId(),attackers:attackers.length,profile,result};
  const message=await ChatMessage.create({speaker:ChatMessage.getSpeaker(),content:card(batch),rolls,whisper:core().users.list().filter(u=>u.isGM).map(u=>u.id),flags:{[ID]:{[KEY]:batch}}},{messageMode:'gm'});
  await game.user.setFlag(ID,KEY,{...state,profile,pendingId:message.id});
  ui.notifications.info(`${profile.kind==='save'?`${batch.result.passed} saves passed; ${batch.result.failed} failed`:`${batch.result.hits} hits`}. Preview ready; Apply Damage to commit it.`);
}

async function applyResult(state) {
  const message=game.messages.get(state.pendingId),batch=foundry.utils.deepClone(message?.getFlag(ID,KEY));
  if(!batch)throw Error('There is no pending result. Resolve a group attack first.');
  if(batch.userId!==game.user.id || batch.sceneId!==canvas.scene.id)throw Error('Apply from the GM and scene that rolled this batch.');
  if(batch.stage==='applied') {await game.user.setFlag(ID,KEY,{...state,pendingId:null});return;}
  if(!['preview','applying'].includes(batch.stage))throw Error('This batch cannot be applied.');
  const scene=canvas.scene;
  for(const row of batch.result.rows) {
    const token=scene.tokens.get(row.id);
    if(!token?.actor || token.actor.uuid!==row.actorUuid)throw Error('A target was removed or changed. Discard this preview and resolve again.');
    const hp=hpOf(token.actor);
    if(batch.stage==='preview' && row.saveDefenses && JSON.stringify(row.saveDefenses)!==JSON.stringify(batch.profile.saves.map(save=>[damageFor(token.actor,save),damageFor(token.actor,save,false,save.onSave==='none'?0:save.onSave==='half'?0.5:1)])))throw Error(`${row.name}'s saving-throw damage defenses changed. Discard this preview and resolve again.`);
    if(!sameHP(hp,row.before) && !(batch.stage==='applying' && sameHP(hp,row)))throw Error(`${row.name}'s HP changed. Discard this preview and resolve again.`);
    if(batch.stage==='preview' && (Number(token.actor.system.attributes.ac.value)!==row.ac || damageFor(token.actor,batch.profile)!==row.normal || damageFor(token.actor,batch.profile,true)!==row.critical || (batch.profile.kind==='save' && damageFor(token.actor,batch.profile,false,batch.profile.onSave==='none'?0:batch.profile.onSave==='half'?0.5:1)!==row.successDamage)))throw Error(`${row.name}'s defenses changed. Discard this preview and resolve again.`);
  }
  batch.stage='applying';await message.setFlag(ID,KEY,batch);
  for(const row of batch.result.rows) {
    const token=scene.tokens.get(row.id),actor=token.actor;
    if(!sameHP(hpOf(actor),row)) {
      if(!sameHP(hpOf(actor),row.before))throw Error(`${row.name}'s HP changed while applying damage. Stop and inspect the target.`);
      await actor.applyDamage(row.damage,{ignore:true});
      if(!sameHP(hpOf(actor),row))throw Error(`${row.name}: another rule changed the damage outcome. Inspect the target before continuing.`);
    }

  }
  batch.stage='applied';await message.update({content:card(batch,'Applied'),[`flags.${ID}.${KEY}`]:batch});
  await game.user.setFlag(ID,KEY,{...state,pendingId:null});
  ui.notifications.info(`Damage applied. ${batch.result.dropped} targets reduced to 0 HP.`);
}

async function massCombat(action) {
  try {
    const api=core();if(!foundry.utils.isNewerVersion(game.system.version,'6.0.2'))throw Error('Group attacks require D&D5e 6.0.3 or later.');if(!canvas.ready || !canvas.scene)throw Error('Open the combat scene first.');
    return await api.socket.runSerialized(`${ID}:${KEY}:${game.user.id}`,async()=>{
      const original=foundry.utils.deepClone(game.user.getFlag(ID,KEY) ?? {});
      const state=action==='reset' ? original : await reconcileState(original);
      if(action==='reconcile')return state;
      if(action==='attackers')return captureAttackers(state);
      if(action==='resolve')return resolveTargets(state);
      if(action==='apply')return applyResult(state);
      if(action==='reset') {
        const message=game.messages.get(state.pendingId),batch=message?.getFlag(ID,KEY);
        if(batch && ['preview','applying'].includes(batch.stage)) {
          batch.stage='discarded';
          await message.update({content:card(batch,'Cancelled — combat ended; any applied damage kept'),[`flags.${ID}.${KEY}`]:batch});
        }
        await game.user.unsetFlag(ID,KEY);
        return;
      }
      throw Error('Unknown mass combat action.');
    });
  } catch(error) {console.error('Mass Combat',error);ui.notifications.error(error.message);}
}


return {massCombat,resolveMassCombat};
}
