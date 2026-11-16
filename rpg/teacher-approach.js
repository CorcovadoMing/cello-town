// A player-owned approach, not proximity alone, earns one unhurried greeting.
export function createTeacherApproach(){
 let armed=false,waiting=false,elapsed=0;
 const reset=()=>{armed=false;waiting=false;elapsed=0;};
 return {cancel:reset,update(dt,{before,player,teacher,input=false,navigating=false,blocked=false}){
  const distance=Math.hypot(player.x-teacher.x,player.y-teacher.y);
  if(blocked||distance>=65){reset();return false;}
  const moved=Math.hypot(player.x-before.x,player.y-before.y)>.00001;
  const crossed=moved&&Math.hypot(before.x-teacher.x,before.y-teacher.y)>=65;
  if(crossed){armed=true;waiting=false;elapsed=0;}
  if(!armed)return false;
  if(moved||input||navigating){if(waiting)reset();return false;}
  waiting=true;elapsed+=Math.max(0,Math.min(.05,dt));
  if(elapsed+1e-9<3)return false;
  reset();return true;
 }};
}
