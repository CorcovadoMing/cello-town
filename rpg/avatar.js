// Ephemeral presentation only. No saved facing, timers, collision or quest changes.
export function facingForMotion(previous='front',dx=0,dy=0){
 const old=['front','back','left','right'].includes(previous)?previous:'front';
 const x=Number.isFinite(dx)?Math.abs(dx):0,y=Number.isFinite(dy)?Math.abs(dy):0;
 if(Math.max(x,y)<.00001)return old;
 // Keep the last axis near a diagonal instead of flickering with tiny deltas.
 const horizontal=x>y*1.15||(x>=y/1.15&&['left','right'].includes(old));
 return horizontal?(dx<0?'left':'right'):(dy<0?'back':'front');
}
export function drawPlayer(g,{x,y,t=0,walking=false,facing='front',reduced=false}){
 const outline='#3d3938',skin='#f4c998',hair='#543b42',coat='#3d7164',shade='#2d574e',shirt='#f3e4c6',seam='#6a9980',accent='#dfbd72',hat='#4a8f83';
 const motion=!reduced,stride=walking&&motion?Math.round(Math.sin(t/105)*4):0;
 const bob=motion?(walking?Math.round(Math.abs(Math.sin(t/105))*2):Math.round((1+Math.sin(t/540))*1.4)):0;
 const blink=motion&&!walking&&t%3600>3450;
 g.save();g.fillStyle='#294a3540';g.fillRect(x-15,y-2,30,7);g.fillStyle='#294a3520';g.fillRect(x-10,y+4,20,2);g.translate(x,y-bob);
 // Four percent larger around the soles, independent of movement/collision size.
 g.translate(0,2);g.scale(1.04,1.04);g.translate(0,-2);
 const p=(px,py,w,h,c)=>{g.fillStyle=c;g.fillRect(px,py,w,h);};
 if(facing==='left'||facing==='right'){
  if(facing==='left')g.scale(-1,1);
  // True side profile: narrow coat, one eye, forward nose and a visible ear.
  p(-6,-11,6,10-stride,shade);p(0,-11,6,10+stride,coat);
  p(-8,-2-stride,9,4,outline);p(0,-2+stride,10,4,outline);
  p(-10,-28,19,17,outline);p(-8,-27,15,13,shirt);
  // Side strap and bib edge sit over the cream blouse, not across the face.
  p(3,-27,3,15,coat);p(-6,-17,13,6,coat);p(-5,-24,6,10,shade);
  p(-5,-24,5,8,shirt);p(-4,-16+Math.round(stride/2),4,5,skin);
  p(3,-22,2,2,accent);p(1,-16,3,3,seam);p(-6,-12,12,2,shade);
  p(-8,-50,13,3,outline);p(-12,-47,22,3,outline);p(-14,-44,27,18,outline);
  p(10,-32,3,3,outline);p(-10,-26,20,3,outline);p(-7,-23,14,2,outline);
  p(-10,-46,18,4,hair);p(-12,-42,21,7,hair);p(-7,-35,18,9,skin);p(10,-31,2,2,skin);p(-7,-27,16,4,skin);
  p(-12,-37,7,10,hair);p(-4,-35,4,5,'#e5b889');p(7,-35,2,blink?1:4,outline);p(7,-30,3,2,'#e88d87');p(8,-27,2,1,'#945b59');
  p(-6,-52,10,3,outline);p(-5,-51,8,2,hat);p(-10,-45,6,2,'#9b6970');
 }else if(facing==='back'){
  p(-8,-11,6,10+stride,shade);p(2,-11,6,10-stride,shade);p(-9,-2+stride,7,4,outline);p(2,-2-stride,7,4,outline);
  p(-12,-28,24,17,outline);p(-15,-25,5,12,outline);p(10,-25,5,12,outline);p(-10,-27,20,14,shirt);
  p(-14,-24,4,8,shirt);p(10,-24,4,8,shirt);p(-13,-16,4,4,skin);p(9,-16,4,4,skin);
  // Paired straps join a plain back yoke; small pocket seams distinguish the rear.
  p(-7,-27,3,9,coat);p(4,-27,3,9,coat);p(-8,-21,16,10,coat);
  p(-7,-21,14,2,shade);p(-1,-19,2,8,shade);p(-6,-17,4,3,seam);p(2,-17,4,3,seam);p(-8,-12,16,2,shade);
  p(-7,-50,14,3,outline);p(-12,-47,24,3,outline);p(-15,-44,30,18,outline);p(-12,-26,24,3,outline);p(-8,-23,16,2,outline);
  p(-10,-46,20,4,hair);p(-13,-42,26,16,hair);p(-10,-26,20,3,hair);
  p(-9,-41,3,10,'#67464d');p(5,-43,3,12,'#67464d');p(-3,-30,6,4,'#49333b');
  p(-5,-52,11,3,outline);p(-4,-51,9,2,hat);p(-7,-46,7,2,'#9b6970');
 }else{
  // Original front face/hair retained; cream blouse and tailored green overalls.
  p(-8,-11,6,10+stride,shade);p(2,-11,6,10-stride,shade);p(-9,-2+stride,7,4,outline);p(2,-2-stride,7,4,outline);
  p(-12,-28,24,17,outline);p(-15,-25,5,12,outline);p(10,-25,5,12,outline);p(-10,-27,20,14,shirt);
  p(-14,-24,4,8,shirt);p(10,-24,4,8,shirt);p(-13,-16,4,4,skin);p(9,-16,4,4,skin);
  p(-7,-27,3,8,coat);p(4,-27,3,8,coat);p(-7,-22,14,10,coat);p(-8,-13,16,3,coat);
  p(-6,-22,2,2,accent);p(4,-22,2,2,accent);p(-3,-19,6,4,seam);p(-2,-18,4,2,coat);p(-1,-13,2,3,shade);
  p(-7,-50,14,3,outline);p(-12,-47,24,3,outline);p(-15,-44,30,18,outline);p(-12,-26,24,3,outline);p(-8,-23,16,2,outline);
  p(-10,-46,20,4,hair);p(-13,-42,26,6,hair);p(-13,-36,26,9,skin);p(-10,-27,20,4,skin);p(-12,-38,5,5,hair);p(-7,-40,4,4,hair);
  p(-5,-52,11,3,outline);p(-4,-51,9,2,hat);p(-7,-46,7,2,'#9b6970');p(-5,-35,2,blink?1:4,outline);p(4,-35,2,blink?1:4,outline);p(-8,-30,4,2,'#e88d87');p(6,-30,4,2,'#e88d87');p(0,-28,3,1,'#945b59');
 }
 // Restrained pixel clusters: dimensional cloth and directional hair sheen.
 // Face, silhouette and movement remain the original cute character.
 if(facing==='left'||facing==='right'){
  p(-10,-43,4,2,'#77515a');p(-8,-41,5,2,'#94646b');p(-2,-45,6,2,'#67464d');
  p(-11,-35,2,6,'#67464d');p(-9,-29,3,2,'#49333b');
  p(-4,-51,3,1,'#87b4a0');p(1,-51,2,2,'#367266');
  p(-7,-26,6,2,'#fff1d7');p(-5,-23,2,6,'#fff1d7');p(-4,-18,4,2,'#d5c5a9');
  p(4,-25,1,3,'#6a9980');p(3,-21,2,1,'#ffe2a0');
  p(3,-14,3,1,'#87a78b');p(-5,-13,2,1,'#456f5d');
  p(1,-10,2,5,'#548572');p(-5,-9,1,4,'#3e695c');
  p(-6,-1-stride,5,1,'#786257');p(2,-1+stride,5,1,'#786257');
 }else{
  // Back uses long ribbon-like hair clusters; front fringe remains recognizable.
  if(facing==='back'){
   p(-9,-43,4,2,'#77515a');p(-5,-42,6,2,'#94646b');p(1,-43,5,2,'#77515a');
   p(-11,-38,2,6,'#77515a');p(-8,-36,2,7,'#67464d');p(8,-40,2,6,'#67464d');
   p(-6,-28,4,2,'#49333b');p(2,-27,4,2,'#49333b');
   p(-6,-18,3,1,'#87a78b');p(3,-18,3,1,'#87a78b');
  }else{
   p(-9,-44,5,2,'#77515a');p(-4,-43,5,2,'#94646b');p(3,-44,5,2,'#77515a');
   p(-11,-39,2,3,'#67464d');p(8,-40,3,2,'#67464d');
   p(-3,-20,6,1,'#87a78b');p(-1,-17,2,1,'#548572');
   p(-5,-22,1,1,'#ffe2a0');p(5,-22,1,1,'#ffe2a0');
  }
  p(-3,-51,3,1,'#87b4a0');p(3,-51,2,2,'#367266');
  p(-13,-23,2,5,'#fff1d7');p(11,-23,2,5,'#fff1d7');
  p(-14,-17,4,1,'#d5c5a9');p(10,-17,4,1,'#d5c5a9');
  p(-8,-25,1,3,'#fff1d7');p(7,-25,1,3,'#fff1d7');
  p(-7,-11,2,5,'#548572');p(3,-11,2,5,'#548572');
  p(-7,-1+stride,4,1,'#786257');p(4,-1-stride,4,1,'#786257');
 }
 // Larger intentional pixel clusters: clear tailored silhouette, not noise.
 if(facing==='left'||facing==='right'){
  p(-10,-44,4,2,'#94646b');p(-6,-43,5,2,'#aa7b7d');p(-9,-40,3,3,'#77515a');
  p(-11,-32,3,5,'#49333b');p(-6,-27,2,3,'#67464d');
  p(2,-26,2,5,'#87a78b');p(-5,-17,9,2,'#548572');p(-4,-15,8,2,coat);
  p(-4,-21,2,3,'#d5c5a9');p(-4,-18,3,1,'#fff1d7');p(-6,-12,12,1,'#274e46');
 }else{
  p(-10,-45,5,2,'#94646b');p(-5,-44,6,2,'#aa7b7d');p(2,-45,5,2,'#77515a');
  if(facing==='back'){
   p(-10,-38,3,6,'#77515a');p(-7,-35,2,6,'#67464d');p(6,-39,3,7,'#67464d');
   p(-6,-25,1,5,'#87a78b');p(5,-25,1,5,'#87a78b');p(-6,-18,4,1,'#a2b99a');p(2,-18,4,1,'#a2b99a');
  }else{
   p(-11,-37,2,3,'#67464d');p(9,-39,2,3,'#67464d');
   p(-6,-26,1,4,'#87a78b');p(5,-26,1,4,'#87a78b');
   p(-4,-20,8,1,'#a2b99a');p(-4,-19,1,4,shade);p(3,-19,1,4,shade);p(-3,-15,6,1,'#274e46');
  }
  p(-8,-13,16,1,'#548572');p(-8,-11,16,1,'#274e46');
  p(-13,-22,2,3,'#fff7e3');p(11,-22,2,3,'#fff7e3');
 }
 g.restore();
}
