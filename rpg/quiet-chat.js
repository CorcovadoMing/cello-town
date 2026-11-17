// Ephemeral arrival-driven conversation. No routes, timers in storage, tasks or UI ownership.
import {teacherFacing} from './teacher.js?v=46';
export function createQuietChat(){
 let previous=null,approachWindow=0,elapsed=-1,cooldown=0,consumed=false,variant=0;
 const frames=reduced=>{
  if(elapsed<0)return [];
  const sequence=[{from:.15,to:2.25,speaker:'teacher',symbol:variant%2?'curious':'note'},{from:2.65,to:4.65,speaker:'player',symbol:'smile'},{from:5,to:6.5,speaker:'teacher',symbol:'spark'}];
  return sequence.filter(f=>elapsed>=f.from&&elapsed<=f.to).map(f=>({...f,alpha:reduced?1:Math.min(1,(elapsed-f.from)/.25,(f.to-elapsed)/.3)}));
 };
 function update(dt,{teacher,player,input=false,navigating=false,modal=false,practice=false,idleChat=false,seatedChat=false,seated=false,reduced=false}={}){
  dt=Number.isFinite(dt)?Math.max(0,Math.min(.05,dt)):0;
  cooldown=Math.max(0,cooldown-dt);approachWindow=Math.max(0,approachWindow-dt);
  const distance=Math.hypot(teacher.x-player.x,teacher.y-player.y);
  const teacherClosed=previous&&Math.hypot(previous.x-player.x,previous.y-player.y)>distance+.01;
  if(teacherClosed&&teacher.walking&&distance<100)approachWindow=8;
  previous={x:teacher.x,y:teacher.y};
  if(distance>135){consumed=false;approachWindow=0;}
  const busy=input||navigating||player.walking||modal||practice;
  if(busy||distance>(seated?125:100)){elapsed=-1;if(modal||practice)approachWindow=0;return {facing:null,bubbles:[]};}
  const arrived=approachWindow>0&&!teacher.walking&&distance<=92;
  // Looking at the teacher is independent of the bubble cadence.
  let facing=arrived?teacherFacing(player.facing,teacher.x-player.x,teacher.y-player.y):null;
  if(arrived)approachWindow=0;
  if((idleChat&&elapsed<0)||(cooldown===0&&((arrived&&!consumed)||seatedChat))){
   elapsed=0;cooldown=24;consumed=true;approachWindow=0;variant++;
   facing=teacherFacing(player.facing,teacher.x-player.x,teacher.y-player.y);
  }else if(elapsed>=0){elapsed+=dt;if(elapsed>6.6)elapsed=-1;}
  return {facing,bubbles:frames(reduced)};
 }
 return {update,get active(){return elapsed>=0;}};
}
export function drawQuietChat(g,bubbles,{teacher,player}){
 for(const b of bubbles){const who=b.speaker==='teacher'?teacher:player,other=b.speaker==='teacher'?player:teacher;
  const offset=who.x<=other.x?-35:35;
  g.save();g.globalAlpha=b.alpha;g.translate(Math.round(who.x+offset),Math.round(who.y-73));
  const p=(x,y,w,h,c)=>{g.fillStyle=c;g.fillRect(x,y,w,h);},edge='#52624b',paper='#fff3d1',ink='#637650';
  p(-13,-10,26,20,edge);p(-15,-7,30,14,edge);p(-12,-9,24,18,paper);p(-14,-6,28,12,paper);
  const tail=offset<0?7:-10;p(tail,9,4,4,edge);p(tail+1,9,2,2,paper);p(tail+(offset<0?3:-2),12,3,2,edge);
  if(b.symbol==='note'){p(-5,0,5,4,ink);p(-1,-6,2,8,ink);p(1,-6,5,2,ink);p(4,-4,2,2,ink);p(6,2,2,2,'#c6a260');}
  if(b.symbol==='curious'){p(-5,-6,8,2,ink);p(2,-4,2,4,ink);p(-1,-1,4,2,ink);p(-1,1,2,2,ink);p(-1,5,2,2,ink);p(6,-4,2,2,'#c6a260');}
  if(b.symbol==='smile'){p(-6,-3,2,2,ink);p(4,-3,2,2,ink);p(-4,2,2,2,ink);p(-2,4,5,2,ink);p(3,2,2,2,ink);p(-8,1,2,2,'#c88f75');p(6,1,2,2,'#c88f75');}
  if(b.symbol==='spark'){p(-1,-6,3,13,'#b48d48');p(-6,-1,13,3,'#b48d48');p(-3,-3,7,7,'#dab96d');p(-1,-3,3,7,'#ffe3a0');p(-3,-1,7,3,'#ffe3a0');}
  g.restore();
 }
}
