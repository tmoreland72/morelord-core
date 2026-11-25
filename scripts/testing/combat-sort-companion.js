/** A real Core-owned wrapper used only by opt-in interoperability regressions. */
export async function withCombatSortCompanion(run){
  const target='CONFIG.Combat.documentClass.prototype._sortCombatants';
  let calls=0;
  libWrapper.register('morelord-core',target,function(wrapped,...args){calls++;return wrapped(...args);},'WRAPPER');
  try{return await run(()=>calls);}
  finally{libWrapper.unregister('morelord-core',target);}
}
