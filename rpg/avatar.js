// Ephemeral presentation only. No saved facing, timers, collision or quest changes.
export function facingForMotion(previous='front',dx=0,dy=0){
 const old=['front','back','left','right'].includes(previous)?previous:'front';
 const x=Number.isFinite(dx)?Math.abs(dx):0,y=Number.isFinite(dy)?Math.abs(dy):0;
 if(Math.max(x,y)<.00001)return old;
 // Keep the last axis near a diagonal instead of flickering with tiny deltas.
 const horizontal=x>y*1.15||(x>=y/1.15&&['left','right'].includes(old));
 return horizontal?(dx<0?'left':'right'):(dy<0?'back':'front');
}
export const PLAYER_PALETTE=Object.freeze({coat:'#526f58',shade:'#3c5646',sleeve:'#80906b'});
export function drawPlayer(g,{x,y,t=0,walking=false,facing='front',reduced=false,holdingUmbrella=false}){
 const outline='#443c37',skin='#f4c998',skinShade='#dba67d',hair='#503c32';
 const {coat,shade,sleeve}=PLAYER_PALETTE,shirt='#a6ab82',weave='#96a179',warm='#e1c487';
 const side=facing==='left'||facing==='right',back=facing==='back';
 const motion=!reduced,stride=walking&&motion?Math.round(Math.sin(t/105)*4):0;
 const bob=motion&&walking?Math.round(Math.abs(Math.sin(t/105))*2):0;
 const blink=motion&&!walking&&t%3600>3450;
 const arm=Math.round(stride*.37);
 const p=(px,py,w,h,c)=>{g.fillStyle=c;g.fillRect(px,py,w,h);};
 g.save();p(x-15,y-2,30,7,'#294a3540');p(x-10,y+4,20,2,'#294a3520');g.translate(x,y-bob);
 g.translate(0,2);g.scale(1.04,1.04);g.translate(0,-2);
 if(facing==='left')g.scale(-1,1);
 const leg=(xx,step,c)=>{
  p(xx,-10,6,9+step,outline);p(xx+1,-10,4,8+step,c);
  p(xx+1,-7,1,4+step,'#78916c');p(xx-1,-2+step,8,4,outline);p(xx,-2+step,6,1,'#8b7363');
 };
 const neck=(cx)=>{
  p(cx-3,-31,7,7,outline);p(cx-2,-31,5,7,skinShade);
  p(cx-1,-28,3,5,skin);
 };
 if(side){
  leg(-6,-stride,shade);leg(1,stride,coat);
  // Shoulder tapers under the ear. The near sleeve and back bib are separate cloth.
  p(-6,-25,13,2,outline);p(-9,-23,17,13,outline);
  p(-7,-23,13,8,shirt);p(-8,-22,3,8,sleeve);
  p(-7,-16,13,6,coat);p(2,-23,3,8,coat);
  p(4,-21,1,5,weave);p(3,-19,2,1,warm);p(2,-13,3,1,shade);
  if(!holdingUmbrella){p(-4,-22-arm,6,8,sleeve);p(-2,-21-arm,3,5,shirt);p(-4,-15-arm,6,2,weave);p(-3,-13-arm,4,3,skin);}
  neck(0);p(2,-24,4,2,shirt);
  // Head, jaw and neck share the skull/shoulder centre rather than the nose.
  p(-7,-49,11,3,outline);p(-11,-47,20,4,outline);p(-13,-44,25,12,outline);
  p(-12,-34,25,5,outline);p(-8,-30,18,2,outline);p(-5,-29,13,1,outline);
  p(-10,-46,17,4,hair);p(-11,-42,20,6,hair);
  p(-11,-37,5,6,hair);p(-7,-35,18,5,skin);p(-5,-31,14,2,skin);
  p(10,-33,3,3,outline);p(10,-32,2,1,skin);
  p(-4,-35,3,4,skinShade);p(-3,-34,2,2,skin);
  p(7,-35,2,blink?1:3,outline);p(7,-31,2,1,'#e88d87');p(6,-30,2,1,'#945b59');
  p(-8,-44,5,2,'#a78356');p(-4,-43,7,2,'#926d46');p(-10,-40,3,4,'#75563b');
 }else{
  leg(-8,back?-stride:stride,shade);leg(2,back?stride:-stride,coat);
  p(-8,-25,16,2,outline);p(-11,-23,22,13,outline);p(-9,-23,18,11,shirt);
  // Connected shoulder seams, two folded cuffs, separate hands in motion.
  p(-14,-22+arm,5,10,outline);p(9,-22-arm,5,10,outline);
  p(-13,-21+arm,4,8,sleeve);p(9,-21-arm,4,8,sleeve);
  p(-12,-21+arm,3,5,shirt);p(9,-21-arm,3,5,shirt);
  p(-13,-15+arm,4,2,weave);p(9,-15-arm,4,2,weave);
  if(!holdingUmbrella||!back)p(-12,-13+arm,3,3,skin);
  if(!holdingUmbrella||back)p(9,-13-arm,3,3,skin);
  p(-7,-23,3,8,coat);p(4,-23,3,8,coat);p(-6,-22,1,5,weave);p(5,-22,1,5,weave);
  p(-8,-17,16,7,coat);p(-8,-12,16,2,shade);
  if(back){p(-5,-17,10,1,weave);p(-1,-16,2,6,shade);p(-5,-14,3,2,'#6d8665');p(2,-14,3,2,'#6d8665');}
  else{p(-6,-18,2,2,warm);p(4,-18,2,2,warm);p(-3,-15,6,3,'#78916c');p(-3,-15,6,1,weave);}
  neck(0);p(-5,-24,3,2,shirt);p(3,-24,3,2,shirt);
  p(-7,-49,14,3,outline);p(-11,-47,22,4,outline);p(-14,-44,28,10,outline);
  p(-12,-38,24,7,outline);p(-9,-31,18,3,outline);p(-6,-28,12,1,outline);
  p(-9,-46,18,4,hair);p(-12,-43,24,7,hair);
  p(-10,-44,6,2,'#a78356');p(-4,-43,7,2,'#926d46');p(4,-44,5,2,'#75563b');
  if(back){
   p(-11,-37,22,5,hair);p(-8,-33,16,3,hair);
   p(-9,-39,3,5,'#75563b');p(-4,-39,2,6,'#634a37');p(6,-39,2,6,'#634a37');p(-4,-31,8,1,'#403129');
  }else{
   p(-10,-38,20,7,skin);p(-8,-31,16,2,skin);p(-5,-29,10,1,skinShade);
   p(-11,-39,4,5,hair);p(-7,-41,4,4,hair);p(9,-39,2,3,hair);
   p(-6,-36,2,blink?1:3,outline);p(4,-36,2,blink?1:3,outline);
   p(-8,-32,3,1,'#e88d87');p(5,-32,3,1,'#e88d87');p(-1,-31,3,1,'#945b59');
  }
 }
 g.restore();
}
