// Ephemeral town actor. Call once per animation frame; no product state or storage access.
export const TEACHER_HOME=Object.freeze({x:303,y:290});
export function teacherFacing(previous,dx,dy){
 if(!Number.isFinite(dx)||!Number.isFinite(dy)||Math.hypot(dx,dy)<4)return previous;
 const horizontal=['left','right'].includes(previous),x=Math.abs(dx),y=Math.abs(dy);
 // A 25% diagonal band keeps attention stable while the player shifts slightly.
 if(horizontal?x>=y/1.25:x>y*1.25)return dx<0?'left':'right';
 return dy<0?'back':'front';
}
const POINTS=[TEACHER_HOME,{x:303,y:334},{x:400,y:334},{x:520,y:334}];
export function createTeacher(){
 let x=303,y=290,node=0,goal=1,direction=1,rest=4.7,clock=0,distance=0,facing='front',walking=false,observing=false,practiceSeconds=0,motionReduced=false;
 const snapshot=()=>({x,y,facing,walking,observing,reduced:motionReduced,t:clock*1000,stride:distance*Math.PI/8});
 function reset(){x=303;y=290;node=0;goal=1;direction=1;rest=4.7;clock=0;distance=0;facing='front';walking=false;observing=false;practiceSeconds=0;motionReduced=false;return snapshot();}
 function update(dt,{practiceActive=false,dialogOpen=false,holdForInteraction=false,reducedMotion=false,player=null}={}){
  dt=Number.isFinite(dt)?Math.max(0,Math.min(.05,dt)):0;
  walking=false;motionReduced=!!reducedMotion;
  // Turning to the person is presentation only, even while interaction owns movement.
  if(player&&(holdForInteraction||(dialogOpen&&!practiceActive)||(!practiceActive&&Math.hypot(player.x-x,player.y-y)<=90)))facing=teacherFacing(facing,player.x-x,player.y-y);
  // Freeze in place, not teleport, when motion is reduced or a conversation owns attention.
  if(reducedMotion||holdForInteraction||(dialogOpen&&!practiceActive))return snapshot();
  clock+=dt;practiceSeconds=practiceActive?practiceSeconds+dt:0;
  const visit=practiceActive&&practiceSeconds>7&&(practiceSeconds%43)<24;
  const nearby=!practiceActive&&player&&Math.hypot(player.x-x,player.y-y)<=90;
  if(nearby)return snapshot();
  observing=visit&&node===3&&Math.hypot(x-520,y-334)<.01;
  if(observing){facing=teacherFacing(facing,655-x,310-y);rest=1.3;return snapshot();}
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
// A 16-world-pixel cycle: each planted shoe counter-translates eight pixels
// during its stance half, while the opposite foot swings clear of the ground.
export function teacherFoot(phase,side=true){const t=((phase/(Math.PI*2))%1+1)%1;return {travel:(t<.5?1-4*t:-1+4*(t-.5))*(side?3.2:3.63636),lift:t<.5?0:Math.sin((t-.5)*Math.PI*2)*2.4};}
export function drawTeacher(g,{x,y,t=0,walking=false,facing='front',stride=0,observing=false,reduced=false}){
 const hair='#694b43',edge='#493e43',dress='#b7809e',shade='#936681',skin='#f5cfa7';
 const active=walking&&!reduced,swing=active?Math.sin(stride)*2.2:0,blink=!reduced&&!walking&&(t+1317)%5270>5110;
 g.save();g.translate(x,y);g.scale(1.25,1.10);g.fillStyle='#294a3530';g.fillRect(-11,0,22,5);
 const p=(a,b,w,h,c)=>{g.fillStyle=c;g.fillRect(a,b,w,h);};
 const side=facing==='left'||facing==='right',back=facing==='back';if(facing==='left')g.scale(-1,1);
 const feet=[0,Math.PI].map(offset=>active?teacherFoot(stride+offset,side):{travel:0,lift:0});
 const foot=(i,x,color)=>{const f=feet[i],dx=side?f.travel:0,dy=(side?0:f.travel*(back?-1:1))-f.lift;for(let k=0;k<6;k++){const u=k/5;p(x+dx*u,-6+k+dy*u,4,2,color);}p(x-1+dx,-1+dy,6,3,edge);};
 if(side){
  // A genuine profile: rear foot/arm behind the narrower dress, near sleeve in front.
  foot(0,-4,shade);
  p(-8,-25,15,9,dress);p(-7,-17,14,9,shade);p(-8,-8,17,4,dress);
  foot(1,1,skin);
  p(-3,-23-swing*.45,5,7,'#d39bb5');p(-2,-16-swing*.45,3,5,skin);
  p(4,-25,3,3,'#fff1d9');p(6,-21,1,3,'#ead292');p(-7,-15,14,2,'#e3bf97');
  p(-7,-5,4,2,'#f6dfcd');p(0,-5,4,2,'#f6dfcd');p(5,-5,3,2,'#f6dfcd');
 }else{
  foot(0,-6,skin);foot(1,3,skin);
  p(-10,-25,20,8,dress);p(-12,-23+swing*.45,4,7,'#d39bb5');p(8,-23-swing*.45,4,7,'#d39bb5');
  p(-12,-17+swing*.45,3,6,skin);p(9,-17-swing*.45,3,6,skin);p(-7,-17,14,4,shade);
  p(-8,-13,16,5,dress);p(-10,-8,20,4,dress);p(-9,-5,5,2,'#f6dfcd');p(-2,-5,5,2,'#f6dfcd');p(5,-5,4,2,'#f6dfcd');
  if(!back){p(-5,-25,4,3,'#fff1d9');p(1,-25,4,3,'#fff1d9');p(-1,-21,2,3,'#ead292');}
  p(-7,-15,14,2,'#e3bf97');if(back){p(-1,-14,2,6,shade);p(-3,-15,6,2,'#f0cda0');}
 }
 // Stepped silhouette stays within the original seated/head crop anchors.
 if(side){
  p(-7,-48,11,2,edge);p(-10,-46,17,3,edge);p(-12,-43,21,12,edge);
  p(-12,-33,7,12,edge);p(-10,-44,16,5,hair);p(-11,-40,9,17,hair);
  p(-4,-40,12,11,skin);p(8,-34,2,3,edge);p(8,-33,1,2,skin);p(-2,-29,10,3,skin);
  p(-5,-41,12,4,hair);p(-5,-38,4,3,hair);p(-3,-35,3,4,'#dda77f');p(-2,-34,2,2,skin);
  p(5,-35,2,blink?1:3,edge);p(6,-30,2,2,'#e9a29a');p(6,-27,2,1,'#ac7770');
  p(-9,-42,3,3,'#896354');p(-8,-39,2,9,'#79564b');p(-10,-27,4,4,'#543e3d');
  p(-6,-45,7,2,'#a3775e');p(-3,-43,3,1,'#b48b6d');p(-1,-34,1,1,'#fff0d2');
  p(2,-43,3,2,'#f5d486');p(3,-42,2,1,'#c09b57');
  p(-6,-24,2,5,'#d9a9bd');p(-6,-18,2,3,'#c993ac');p(4,-12,2,5,'#c993ac');
  p(-5,-8,2,2,'#81556f');p(4,-7,2,2,'#81556f');
 }else{
  p(-7,-48,14,2,edge);p(-10,-46,20,3,edge);p(-12,-43,24,14,edge);
  p(-12,-30,5,9,edge);p(7,-30,5,9,edge);
  p(-9,-45,18,4,hair);p(-11,-41,22,13,hair);p(-10,-29,5,7,hair);p(5,-29,5,7,hair);
  if(back){
   // No skin or facial cues on the rear: a part, layered ends and tied ribbon.
   p(-8,-41,4,3,'#896354');p(-4,-43,5,3,'#a3775e');p(1,-42,6,2,'#896354');
   p(-9,-36,2,9,'#79564b');p(-5,-38,2,12,'#79564b');p(3,-38,2,11,'#79564b');p(8,-35,2,8,'#79564b');
   p(-7,-28,14,5,hair);p(-5,-24,3,2,'#543e3d');p(2,-24,4,2,'#543e3d');
   p(-4,-26,3,2,'#f5d486');p(1,-26,3,2,'#f5d486');p(-1,-26,2,3,'#d4ae68');
   p(-6,-21,12,2,'#d9a9bd');p(-1,-19,2,6,'#81556f');p(-6,-11,2,4,'#c993ac');p(5,-11,2,4,'#c993ac');
  }else{
   p(-8,-40,16,12,skin);p(-6,-28,12,3,skin);p(-9,-42,18,4,hair);p(-8,-39,5,3,hair);p(-4,-41,5,3,hair);
   p(-6,-35,2,blink?1:3,edge);p(4,-35,2,blink?1:3,edge);p(-7,-30,3,2,'#e9a29a');p(5,-30,3,2,'#e9a29a');p(-1,-29,3,1,'#ac7770');
   p(-7,-44,5,2,'#a3775e');p(-2,-43,4,1,'#b48b6d');p(3,-44,4,2,'#896354');p(-10,-35,2,8,'#79564b');p(8,-34,2,6,'#79564b');
   p(5,-43,3,2,'#f5d486');p(6,-42,2,1,'#c09b57');
   p(-4,-22,2,4,'#d9a9bd');p(3,-22,2,4,'#d9a9bd');p(-1,-17,2,2,'#f7dfab');
   p(-6,-11,2,4,'#c993ac');p(5,-11,2,4,'#c993ac');p(-9,-6,2,1,'#81556f');p(7,-6,2,1,'#81556f');
  }
  p(-11,-23+swing*.45,2,4,'#e1b4c5');p(9,-23-swing*.45,2,4,'#e1b4c5');
 }
 // Quiet attentiveness is conveyed by facing, not ratings, speech or UI badges.
 g.restore();
}
