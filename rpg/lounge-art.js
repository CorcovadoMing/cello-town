import {umbrellaShape} from './rain-geometry.js?v=35';
// Original, ephemeral 8-bit scenery. No state, route, timing or storage ownership.
import {drawPlayer} from './avatar.js?v=32';
import {drawTeacher} from './teacher.js?v=32';
const freeze=o=>Object.freeze(o);
export const LOUNGE_LAYOUT=freeze({table:freeze({x:490,y:218,depth:245,solid:freeze({x:458,y:214,w:64,h:31})}),seats:freeze([
 freeze({id:'left',x:440,y:232,facing:'right',approach:freeze({x:423,y:250}),solid:freeze({x:430,y:225,w:20,h:12})}),
 freeze({id:'right',x:540,y:232,facing:'left',approach:freeze({x:557,y:250}),solid:freeze({x:530,y:225,w:20,h:12})})])});
const rect=(g,x,y,w,h,c)=>{g.fillStyle=c;g.fillRect(x,y,w,h);};
export function drawLoungeTable(g,{rain=false,readingSide=null}={}){
 g.save();g.translate(490,218);
 // The low screen-space top and slender legs leave the meadow visible around it.
 rect(g,-32,23,67,5,'#415d3c22');rect(g,-28,11,6,16,'#78624b');rect(g,23,11,6,16,'#78624b');
 rect(g,-27,11,2,15,'#bc9d70');rect(g,24,11,2,15,'#bc9d70');
 rect(g,-29,17,57,3,'#92734e');rect(g,-31,-16,62,3,'#dcc292');
 rect(g,-34,-13,68,17,'#c2a473');rect(g,-34,4,68,5,'#92734e');rect(g,-32,9,64,3,'#755f48');
 rect(g,-32,-12,64,2,'#e3ca9b');rect(g,-32,-3,64,1,'#a68b61');rect(g,-32,4,64,1,'#d1b180');
 for(const[x,y,w]of[[-26,-8,13],[-4,-7,12],[16,-9,10],[-21,0,18],[7,1,14]])rect(g,x,y,w,1,'#b19366');
 // Read from the teacher's chair: the bottom margin faces their hands.
 if(!rain&&(readingSide==='left'||readingSide==='right')){
  const left=readingSide==='left';g.save();g.translate(left?-17:17,-5);
  g.scale(1,.52);g.rotate(left?Math.PI/2:-Math.PI/2);
  rect(g,-16,-13,32,26,'#48695a');rect(g,-15,-12,14,23,'#f1e3bb');rect(g,1,-11,14,22,'#e4d5ae');
  rect(g,-1,-11,2,23,'#af9875');rect(g,-14,-12,12,2,'#fff4d4');rect(g,2,-11,12,2,'#fff0cc');
  for(const yy of[-6,-2,2,6]){rect(g,-12,yy,8,1,'#bca98a');rect(g,3,yy+1,8-(yy===6?3:0),1,'#c0aa87');}
  rect(g,10,9,2,5,'#b97b77');g.restore();
 }
 g.restore();
}
export function drawLoungeChair(g,seat){
 g.save();g.translate(seat.x,seat.y);if(seat.facing==='left')g.scale(-1,1);
 rect(g,-12,2,26,4,'#415d3c22');
 rect(g,-10,-29,3,33,'#8b704e');rect(g,-9,-28,1,31,'#d1b381');
 rect(g,-7,-26,5,3,'#c0a273');rect(g,-7,-19,5,3,'#b39769');
 rect(g,-9,-11,20,4,'#d0b181');rect(g,-9,-7,20,3,'#937550');
 rect(g,7,-6,3,10,'#92734e');rect(g,8,-5,1,8,'#c0a273');
 rect(g,-6,-10,15,1,'#e2c89a');g.restore();
}
export function drawSeatedResident(g,{x,y,kind='player',facing='right',t=0,reduced=false,reading=false}){
 const teacher=kind==='teacher',side=facing==='left'?'left':'right';
 g.save();g.translate(x,y);
 // Keep the existing face/upper body identity, clipped only at the seat line.
 // Sitting is not a scaled standing sprite: bent knees and grounded shoes follow.
 g.save();g.beginPath();g.rect(-30,-65,60,57);g.clip();
 (teacher?drawTeacher:drawPlayer)(g,{x:0,y:teacher?1:3,t,walking:false,facing:side,reduced});g.restore();
 if(side==='left')g.scale(-1,1);
 const cloth=teacher?'#b7809e':'#3d7164',dark=teacher?'#936681':'#2d574e';
 rect(g,-5,-8,13,5,dark);rect(g,-5,-8,12,3,cloth);rect(g,6,-5,4,6,teacher?'#f5cfa7':cloth);
 rect(g,5,1,8,3,'#493e43');rect(g,7,1,4,1,'#8c7460');
 rect(g,-6,-3,8,3,dark);rect(g,0,-1,3,3,teacher?'#f5cfa7':dark);rect(g,-1,2,7,2,'#493e43');
 if(teacher){rect(g,-5,-6,10,2,'#f6dfcd');rect(g,-3,-8,3,2,'#e3bf97');}
 if(teacher&&reading){
  // Hands reach toward the table; the book is drawn once on the tabletop.
  rect(g,6,-18,9,3,'#b7809e');rect(g,13,-18,4,3,'#f5cfa7');
  rect(g,4,-14,11,3,'#936681');rect(g,14,-14,4,3,'#f5cfa7');
 }
 g.restore();
}
export function drawRainUmbrella(g,{x,y,facing='front',kind='player'},opening=1,stage='open'){
 g.save();g.translate(x,y);if(facing==='left')g.scale(-1,1);
 const back=facing==='back',shaft=back?-7:10,teacher=kind==='teacher';
 if(stage==='prepare'){rect(g,shaft,-39,3,20,teacher?'#a5aaa6':'#647d73');rect(g,shaft+1,-40,1,4,teacher?'#f4f2e8':'#93aa96');g.restore();return;}
 if(opening<=0){g.restore();return;}
 const shape=umbrellaShape(kind),palette=teacher?['#b9bfba','#e6e7e0','#fffdf4']:['#5c786b','#78998a','#a6baa5'];
 rect(g,shaft,-73,1,40,teacher?'#858c86':'#766b54');rect(g,shaft,-33,4,2,teacher?'#858c86':'#766b54');rect(g,shaft+3,-36,1,3,teacher?'#858c86':'#766b54');
 for(const[full,yy,h]of shape.bands){const w=full*opening;
  rect(g,shaft-w/2,yy,w,h,palette[0]);if(w>=6)rect(g,shaft-w/2+2*opening,yy,w/2-2*opening,h,palette[1]);
  const stripe=Math.min(4*opening,w);rect(g,shaft-stripe/2,yy,stripe,h,palette[2]);
  if(teacher&&w>28*opening){for(const side of[-1,1])rect(g,shaft+side*w*.28-opening,yy,2*opening,h,'#e8eae3');}
 }
 for(const[dx,yy,w,h]of shape.hem){rect(g,shaft+dx*opening,yy,w*opening,h,teacher?'#d7dbd5':'#526f62');if(teacher&&h===3)rect(g,shaft+(dx+2)*opening,yy,(w-4)*opening,2,'#f5f3eb');}
 const[cx,cy,cw,ch]=shape.cap;rect(g,shaft+cx*opening,cy,cw*opening,ch,teacher?'#8e9690':'#637663');g.restore();
}
