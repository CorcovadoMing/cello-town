// Idle proximity earns one ambient greeting, never ownership of the task dialogue.
export const TEACHER_TALK_RADIUS=65;
export function createTeacherApproach(){
 let elapsed=0,consumed=false;
 const reset=()=>{elapsed=0;consumed=false;};
 return {cancel:reset,update(dt,{before,player,teacher,input=false,navigating=false,blocked=false}){
  const distance=Math.hypot(player.x-teacher.x,player.y-teacher.y);
  if(distance>=TEACHER_TALK_RADIUS){reset();return false;}
  const moved=Math.hypot(player.x-before.x,player.y-before.y)>.00001;
  if(blocked||moved||input||navigating||player.walking||teacher.walking){elapsed=0;return false;}
  if(consumed)return false;
  elapsed+=Number.isFinite(dt)?Math.max(0,dt):0;
  if(elapsed+1e-9<3)return false;
  consumed=true;elapsed=0;return true;
 }};
}
