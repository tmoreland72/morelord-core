import {assert} from './in-game.js';

/** Exercise an actual settings action without changing campaign settings. */
export async function checkSettingsSave(menuKey,fields){
  assert(game.world.id==='dev1' && game.user.isGM,'Run as GM in Dev1');
  const App=game.settings.menus.get(menuKey).type;
  assert(!foundry.applications.instances.get(App.DEFAULT_OPTIONS.id)?.rendered,'Close this settings window before testing');
  const app=new App(),original=game.settings.set;
  try{
    await app.render({force:true});
    for(const [name,value] of Object.entries(fields))app.element.querySelector(`[name="${name}"]`).value=value;
    const button=app.element.querySelector('[data-action="save"]');
    assert(button.textContent.trim()==='Save Changes','Settings action uses Save Changes');
    game.settings.set=async()=>{throw Error('Regression save failure');};
    let failed=false;
    try{await app.options.actions.save.call(app,{preventDefault(){}},button);}catch{failed=true;}
    assert(failed && app.rendered && !button.disabled,'Save failure leaves the window open for retry');
    let finish,writes=0;
    game.settings.set=async()=>{if(++writes===1)await new Promise(resolve=>finish=resolve);};
    const saving=app.options.actions.save.call(app,{preventDefault(){}},button);
    assert(finish && app.rendered && button.disabled,'Window remains open while saving');
    finish();await saving;
    assert(writes>0 && !app.rendered,'Window closes after a successful save');
  }finally{game.settings.set=original;if(app.rendered)await app.close();}
}
