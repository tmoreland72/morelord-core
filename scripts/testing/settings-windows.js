import {assert} from './in-game.js';

export const settingsWindowsCheck={id:'core.settings-menu-order-and-save',async run(){
  assert(game.world.id==='dev1' && game.user.isGM,'Run as GM in Dev1');
  const menus=[...game.settings.menus.keys()].filter(key=>key.startsWith('morelord-core.'));
  assert(menus[0]==='morelord-core.account' && menus[1]==='morelord-core.performance','Morelord Account is first, Personal Performance second');
  const Account=game.settings.menus.get('morelord-core.account').type;
  assert(!foundry.applications.instances.get('morelord-core-connection')?.rendered,'Close the account window before testing');
  const app=new Account(),original=game.settings.set;
  try{
    await app.render({force:true});
    const button=app.element.querySelector('[data-action="saveSettings"]');
    assert(button?.textContent.trim()==='Save Changes','Account uses Save Changes');
    game.settings.set=async()=>{throw Error('Regression save failure');};
    let failed=false;
    try{await app.options.actions.saveSettings.call(app,{preventDefault(){}},button);}catch{failed=true;}
    assert(failed && app.rendered && !button.disabled,'Failed save leaves the account window open and retry enabled');
    let writes=0,finish;
    game.settings.set=async()=>{if(++writes===1)await new Promise(resolve=>finish=resolve);};
    const saving=app.options.actions.saveSettings.call(app,{preventDefault(){}},button);
    assert(app.rendered && button.disabled,'Account stays open while persistence is pending');
    finish();await saving;
    assert(writes===9 && !app.rendered,'Account closes only after every settings write succeeds');
  }finally{game.settings.set=original;if(app.rendered)await app.close();}
}};

export const locationSettingsCheck={id:'core.location-save-closes-after-success',async run(){
  assert(game.world.id==='dev1' && game.user.isGM,'Run as GM in Dev1');
  const App=game.settings.menus.get('morelord-core.locations').type,service=App.locationService;
  assert(!foundry.applications.instances.get('morelord-core-locations')?.rendered,'Close Locations before testing');
  const app=new App();
  try{
    app.draft={id:null,name:'Settings regression fixture',settlementType:'road',sceneIds:[],capabilities:[],notes:'',metadata:{}};
    await app.render({force:true});
    const button=app.element.querySelector('[data-action="save"]');
    assert(button.textContent.trim()==='Save Changes','Locations uses Save Changes');
    App.locationService={save:async()=>{throw Error('Regression save failure');}};
    await app.options.actions.save.call(app,{preventDefault(){}},button);
    assert(app.rendered && !button.disabled,'Location save failure keeps the editor open');
    let finish;
    App.locationService={save:async draft=>{await new Promise(resolve=>finish=resolve);return {...draft,id:'unsaved-fixture'};}};
    const saving=app.options.actions.save.call(app,{preventDefault(){}},button);
    assert(app.rendered && button.disabled,'Location editor remains open while saving');
    finish();await saving;
    assert(!app.rendered,'Successful location save closes the editor');
  }finally{App.locationService=service;if(app.rendered)await app.close();}
}};
