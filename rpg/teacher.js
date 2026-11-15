// Ephemeral town actor. Call once per animation frame; no product state or storage access.
export const TEACHER_HOME=Object.freeze({x:303,y:290});
const POINTS=[TEACHER_HOME,{x:303,y:334},{x:400,y:334},{x:520,y:334}];
export function createTeacher(){
 let x=303,y=290,node=0,goal=1,direction=1,rest=4.7,clock=0,distance=0,facing='front',walking=false,observing=false,practiceSeconds=0,motionReduced=false;
 const snapshot=()=>({x,y,facing,walking,observing,reduced:motionReduced,t:clock*1000,stride:distance/7});
 function reset(){x=303;y=290;node=0;goal=1;direction=1;rest=4.7;clock=0;distance=0;facing='front';walking=false;observing=false;practiceSeconds=0;motionReduced=false;return snapshot();}
 function update(dt,{practiceActive=false,dialogOpen=false,holdForInteraction=false,reducedMotion=false,player=null}={}){
  dt=Number.isFinite(dt)?Math.max(0,Math.min(.05,dt)):0;
  walking=false;motionReduced=!!reducedMotion;
  // Freeze in place, not teleport, when motion is reduced or a conversation owns attention.
  if(reducedMotion||holdForInteraction||(dialogOpen&&!practiceActive))return snapshot();
  clock+=dt;practiceSeconds=practiceActive?practiceSeconds+dt:0;
  const visit=practiceActive&&practiceSeconds>7&&(practiceSeconds%43)<24;
  const nearby=!practiceActive&&player&&Math.hypot(player.x-x,player.y-y)<=90;
  if(nearby){facing=Math.abs(player.x-x)>Math.abs(player.y-y)?(player.x<x?'left':'right'):(player.y<y?'back':'front');return snapshot();}
  observing=visit&&node===3&&Math.hypot(x-520,y-334)<.01;
  if(observing){facing='right';rest=1.3;return snapshot();}
  if(rest>0){rest=Math.max(0,rest-dt);return snapshot();}
  // Only adjacent graph edges; practice transitions never cut diagonally through scenery.
  if(Math.hypot(x-POINTS[node].x,y-POINTS[node].y)<.01){
   if(visit)goal=node<3?node+1:node>3?node-1:3;
   else {if(node===3)direction=-1;if(node===0)direction=1;goal=node+direction;}
  }
  const p=POINTS[goal],dx=p.x-x,dy=p.y-y,len=Math.hypot(dx,dy),step=Math.min(len,21*dt);
  if(len>0){x+=dx/len*step;y+=dy/len*step;distance+=step;walking=step>0;facing=Math.abs(dx)>Math.abs(dy)?(dx<0?'left':'right'):(dy<0?'back':'front');}
  if(step===len){node=goal;rest=node===0?5.7:node===3?4.1:node===2?2.3:1.1;}
  return snapshot();
 }
 return {update,reset,get position(){return {x,y};},get pose(){return snapshot();},draw(g){drawTeacher(g,snapshot());}};
}
export function drawTeacher(g,{x,y,t=0,walking=false,facing='front',stride=0,observing=false,reduced=false}){
 const hair='#694b43',edge='#493e43',dress='#b7809e',shade='#936681',skin='#f5cfa7';
 const swing=walking&&!reduced?Math.sin(stride)*2.2:0,blink=!reduced&&!walking&&(t+1317)%5270>5110;
 g.save();g.translate(x,y);g.scale(1.25,1.10);g.fillStyle='#294a3530';g.fillRect(-11,0,22,5);
 const p=(a,b,w,h,c)=>{g.fillStyle=c;g.fillRect(a,b,w,h);};
 const side=facing==='left'||facing==='right',back=facing==='back';if(facing==='left')g.scale(-1,1);
 p(-6,-8-swing,4,8,skin);p(3,-8+swing,4,8,skin);p(-7,-1-swing,6,3,edge);p(2,-1+swing,6,3,edge);
 p(-10,-25,20,8,dress);p(-12,-23+swing*.45,4,7,'#d39bb5');p(8,-23-swing*.45,4,7,'#d39bb5');
 p(-12,-17+swing*.45,3,6,skin);p(9,-17-swing*.45,3,6,skin);p(-7,-17,14,4,shade);
 p(-8,-13,16,5,dress);p(-10,-8,20,4,dress);p(-9,-5,5,2,'#f6dfcd');p(-2,-5,5,2,'#f6dfcd');p(5,-5,4,2,'#f6dfcd');
 if(!back){p(-5,-25,4,3,'#fff1d9');p(1,-25,4,3,'#fff1d9');p(-1,-21,2,3,'#ead292');}p(-7,-15,14,2,'#e3bf97');
 p(-7,-48,14,3,edge);p(-10,-45,20,17,hair);p(-11,-40,4,18,hair);p(7,-40,4,18,hair);
 if(!back){p(side?-3:-8,-40,side?12:16,12,skin);p(-6,-28,12,3,skin);p(-8,-44,16,6,hair);p(-8,-39,5,3,hair);p(-4,-41,5,3,hair);if(side){p(9,-33,2,3,skin);p(5,-35,2,blink?1:3,edge);p(5,-30,3,2,'#e9a29a');}else{p(-6,-35,2,blink?1:3,edge);p(4,-35,2,blink?1:3,edge);p(-7,-30,3,2,'#e9a29a');p(5,-30,3,2,'#e9a29a');}p(side?5:-1,-29,3,1,'#ac7770');}else{p(-8,-27,16,5,hair);p(-4,-42,2,15,'#79564b');}
 p(5,-43,3,2,'#f5d486');
 // Quiet attentiveness is conveyed by facing, not ratings, speech or UI badges.
 g.restore();
}
