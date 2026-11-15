import {UMBRELLA_BANDS} from './rain-geometry.js?v=28';
// Original, ephemeral 8-bit scenery. No state, route, timing or storage ownership.
import {drawPlayer} from './avatar.js?v=28';
import {drawTeacher} from './teacher.js?v=28';
const freeze=o=>Object.freeze(o);
export const LOUNGE_LAYOUT=freeze({table:freeze({x:510,y:218,depth:245,solid:freeze({x:478,y:214,w:64,h:31})}),seats:freeze([
 freeze({id:'left',x:460,y:232,facing:'right',approach:freeze({x:443,y:250}),solid:freeze({x:450,y:225,w:20,h:12})}),
 freeze({id:'right',x:560,y:232,facing:'left',approach:freeze({x:577,y:250}),solid:freeze({x:550,y:225,w:20,h:12})})])});
const rect=(g,x,y,w,h,c)=>{g.fillStyle=c;g.fillRect(x,y,w,h);};
export function drawLoungeTable(g,{rain=false}={}){
 g.save();g.translate(510,218);
 // The low screen-space top and slender legs leave the meadow visible around it.
 rect(g,-32,23,67,5,'#415d3c22');rect(g,-28,11,6,16,'#78624b');rect(g,23,11,6,16,'#78624b');
 rect(g,-27,11,2,15,'#bc9d70');rect(g,24,11,2,15,'#bc9d70');
 rect(g,-29,17,57,3,'#92734e');rect(g,-31,-16,62,3,'#dcc292');
 rect(g,-34,-13,68,17,'#c2a473');rect(g,-34,4,68,5,'#92734e');rect(g,-32,9,64,3,'#755f48');
 rect(g,-32,-12,64,2,'#e3ca9b');rect(g,-32,-3,64,1,'#a68b61');rect(g,-32,4,64,1,'#d1b180');
 for(const[x,y,w]of[[-26,-8,13],[-4,-7,12],[16,-9,10],[-21,0,18],[7,1,14]])rect(g,x,y,w,1,'#b19366');
 // Table stays clear. The teacher owns the single book while actually reading.
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
  // A quiet open book held above the lap; no new animation or task signal.
  rect(g,0,-17,15,9,'#48695a');rect(g,1,-18,6,8,'#f1e3bb');rect(g,8,-17,6,7,'#e4d5ae');
  rect(g,7,-17,1,8,'#af9875');rect(g,2,-16,4,1,'#c3b18e');rect(g,9,-15,4,1,'#c3b18e');
  rect(g,-1,-12,3,3,'#f5cfa7');rect(g,13,-11,3,3,'#f5cfa7');
 }
 g.restore();
}
export function drawRainUmbrella(g,{x,y,facing='front'},opening=1,stage='open'){
 g.save();g.translate(x,y);if(facing==='left')g.scale(-1,1);
 const back=facing==='back',shaft=back?-7:10;
 if(stage==='prepare'){rect(g,shaft,-39,3,20,'#647d73');rect(g,shaft+1,-40,1,4,'#93aa96');g.restore();return;}
 if(opening<=0){g.restore();return;}
 // Eight stepped contour bands make a small cloth canopy, never a smooth dome.
 rect(g,shaft,-73,1,40,'#766b54');rect(g,shaft,-33,4,2,'#766b54');rect(g,shaft+3,-36,1,3,'#766b54');
 const palette=['#647d73','#78958a','#93aa96'];
 for(const[full,yy,h]of UMBRELLA_BANDS){const w=full*opening;
  rect(g,shaft-w/2,yy,w,h,palette[0]);if(w>=6)rect(g,shaft-w/2+2,yy,w/2-2,h,palette[1]);const stripe=Math.min(4,w);rect(g,shaft-stripe/2,yy,stripe,h,palette[2]);
 }
 rect(g,shaft-35*opening,-56,14*opening,2,'#536b62');rect(g,shaft-12*opening,-56,24*opening,2,'#607b6d');rect(g,shaft+21*opening,-56,14*opening,2,'#536b62');
 rect(g,shaft,-80,1,3,'#766b54');g.restore();
}
