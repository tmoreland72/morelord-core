import {assert} from './in-game.js';
import {afterDiceAnimation} from '../services/dice-animation.js';
export const publicSocketCheck={id:'core.public-socket-saved-roll-outcomes',async run(){
  assert(game.world.id==='dev1'&&game.user.isGM,'Dev1 GM required');
  assert(typeof MorelordCore.socket.runSerialized==='function','Public socket exports runSerialized');
  let message;
  try{
    const roll=await new Roll('1d20').evaluate({allowInteractive:false});
    message=await ChatMessage.create({content:'Core public socket regression',rolls:[roll],whisper:[game.user.id],blind:true});
    const completed=[];
    await Promise.all([1,2].map(id=>afterDiceAnimation(message,async()=>{
      const before=completed.length;await Promise.resolve();assert(completed.length===before,'Result commits serialize');completed.push(id);
    },'core-public-api-regression')));
    assert(completed.length===2,'Saved roll outcomes finish without a retry error');
  }finally{if(message)await message.delete();}
}};
