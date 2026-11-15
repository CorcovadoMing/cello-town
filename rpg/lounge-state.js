// Ephemeral scene choreography: never reads or writes quests, records or storage.
export function createLounge({navigation,seat={x:560,y:232},approach={x:577,y:250}}){
 let clock=0,mode='idle',origin=null,pose=null,path=[],wait=12,rest=0,chatSent=false;
 const snapshot=()=>({mode,borrowed:mode!=='idle',pose:pose&&{...pose},reading:mode==='seated'&&rest>.8,chat:false});
 function route(to,next){const p=navigation.findPath(pose,to);if(!p)return false;path=p;mode=next;return true;}
 function update(dt,{teacher,player=null,playerSeated=false,practice=false,dialog=false,questApproach=false,rain=false,reduced=false}={}){
  dt=Number.isFinite(dt)?Math.max(0,Math.min(.05,dt)):0;
  if(dialog)return snapshot();
  clock+=dt;wait=Math.max(0,wait-dt);
  if(mode==='idle'){
   if(practice||questApproach||rain||reduced||wait>0)return snapshot();
   origin={x:teacher.x,y:teacher.y};pose={...teacher};chatSent=false;
   if(!route(approach,'approach')){origin=null;pose=null;wait=30;return snapshot();}
  }
  // An explicit approach owns attention: do not walk away from the destination
  // the player just selected. Practice/rain can still end the leisure visit.
  const nearby=player&&!playerSeated&&pose&&Math.hypot(player.x-pose.x,player.y-pose.y)<80;
  if((questApproach||nearby)&&!practice&&!rain&&!reduced)return snapshot();
  const leave=practice||rain||reduced;
  if(leave&&mode!=='return'){
   if(mode==='seated')pose={...pose,...approach};
   if(!route(origin,'return'))return snapshot();
  }
  let chat=false;
  if(mode==='seated'){
   rest+=dt;pose.walking=false;pose.facing='left';
   if(playerSeated&&!chatSent&&rest>1.2){chat=true;chatSent=true;}
   if(rest>(playerSeated?22:14)){pose={...pose,...approach};route(origin,'return');}
  }
  if(mode==='approach'||mode==='return'){
   let remaining=32*dt;pose.walking=false;
   while(path.length&&remaining>0){const p=path[0],dx=p.x-pose.x,dy=p.y-pose.y,d=Math.hypot(dx,dy),step=Math.min(d,remaining);
    if(d>.0001){const next={x:pose.x+dx/d*step,y:pose.y+dy/d*step};if(!navigation.lineClear(pose,next))break;pose={...pose,...next,walking:true,facing:Math.abs(dx)>Math.abs(dy)?dx<0?'left':'right':dy<0?'back':'front'};remaining-=step;}
    if(d<=step+.0001)path.shift();else break;
   }
   if(!path.length){if(mode==='return'){mode='idle';pose=null;origin=null;wait=playerSeated?32:48;}else{mode='seated';pose={...pose,...seat,facing:'left',walking:false};rest=0;}}
  }
  return {...snapshot(),chat,t:clock*1000};
 }
 return {update,get state(){return snapshot();}};
}
