import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
test('Troubleshooting downloads directly and reports failures without opening an application',()=>{
 const source=readFileSync(new URL('../scripts/main.js',import.meta.url),'utf8');
 const body=source.slice(source.indexOf('class MorelordConnectionApp extends'),source.indexOf('Hooks.once("init",'));
 const notices=[];let downloads=0,fail=false;
 class ApplicationV2 {render(){assert.fail('Should not open a window')}}
 const game={user:{isGM:true}};
 const getApp=new Function('ApplicationV2','HandlebarsApplicationMixin','game','exportDiagnostics','notify',body+';return MorelordDiagnosticsDownloadApp;');
 const App=getApp(ApplicationV2,Base=>Base,game,()=>{if(fail)throw Error('download failed');downloads++},(...args)=>notices.push(args));
 const app=new App();assert.equal(app.render(true),app);assert.equal(downloads,1);
 fail=true;app.render(true);assert.match(notices.at(-1)[1],/download failed/);
 game.user.isGM=false;app.render(true);assert.equal(downloads,1);
});
