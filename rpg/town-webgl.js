import {GARDEN_SOIL,GARDEN_ROWS,ROW_SECTION,rowPoint} from './town-bed.js?v=1';
import {makeGroundRain} from './town-ground-rain.js?v=1';
import {makeVerge} from './town-verge.js?v=1';
import {makeCountryside} from './town-countryside.js?v=woodland-037';
import {addShoreCraft,OPEN_POND_BANK,OPEN_POND_UV} from './town-shore.js?v=woodland-037';
import {breezeAt,makeLivingGrass,makePondHorizon,POND_SHOT,LAWN_DRIFTS,lawnAnchor} from './town-breeze.js?v=woodland-037';
import {addOrchardTree,makeOrchardLeaf,makeOrchardBark,townSunVector} from './town-orchard.js?v=woodland-037';
/* Optional live 3D view of the existing gameplay map. All world (x, y) positions
   still belong to the town controller. This renderer owns only world-to-screen
   projection, GPU resources and the scenery meshes. */
import {drawWetSoil} from './wet-soil.js?v=gait-033';

// Keep phase on high-refresh displays without repeatedly rounding from the
// last paint. Allow jitter on a 60 Hz display; never queue a catch-up paint.
export function createTownFramePacer(hz=60){
 const ms=1000/hz,slack=2;
 let deadline=NaN,seen=NaN;
 return {reset(){deadline=seen=NaN;},paint(t){
  if(!Number.isFinite(t))return false;
  if(!Number.isFinite(seen)||t<seen||t-seen>100)deadline=t;
  if(t===seen)return false;
  seen=t;
  if(t+slack<deadline)return false;
  deadline+=ms*(1+Math.floor((Math.max(0,t-deadline)+1e-7)/ms));
  return true;
 }};
}

import {addBenchGardenCraft,addCabinAndPondCraft} from './town-craft.js?v=walk-garden-2';
export const ROOM_WIDTH=960,ROOM_HEIGHT=560;
const W=ROOM_WIDTH,H=ROOM_HEIGHT;
const local=(x,z)=>[x-W/2,z-H/2];

// The art remains 3D, but every ground vertex follows the former Canvas
// identity projection. Elevation projects only upward; no yaw across the
// map, perspective scaling, camera tracking or touch offsets are introduced.
// A slightly lower gaze makes upright sides taller on screen without
// shifting the ground or changing the scale of pixel actors.
const OUTDOOR_EYE_HEIGHT=950,OUTDOOR_EYE_DISTANCE=880;
const VIEW_Z=OUTDOOR_EYE_DISTANCE/OUTDOOR_EYE_HEIGHT;
const LOUNGE_SEAT_CENTER=16,LOUNGE_SEAT_DEPTH=3;
export const LOUNGE_BODY_SHIFT=(LOUNGE_SEAT_CENTER+LOUNGE_SEAT_DEPTH/2)*VIEW_Z-8;
// Lift the hips to the chair but keep the bottoms of both shoes planted.
export function drawGroundedSeated(g,x,y,paint){
 const hip=y-8,sole=y+4,top=hip-LOUNGE_BODY_SHIFT;
 const stretch=(sole-top)/(sole-hip);
 g.save();g.beginPath();g.rect(x-30,top-76,60,76);g.clip();
 g.translate(0,top-hip);paint();g.restore();
 g.save();g.beginPath();g.rect(x-30,top,60,sole-top);g.clip();
 g.translate(0,sole);g.scale(1,stretch);g.translate(0,-sole);paint();g.restore();
}

const BENCH_SLAT_CENTER_Y=30, BENCH_SLAT_THICKNESS=3;
const BENCH_SEAT_TOP=BENCH_SLAT_CENTER_Y+BENCH_SLAT_THICKNESS/2;
const BENCH_HOME_Z=211, BENCH_LANDING_Z=247;
const PET_GROUND_TOP=1.4, PET_CONTACT_OFFSET=.8;
// A billboard references the supporting surface before the painted pose.
// Interpolate support across the old 2D path; put its hop in world height
// exactly once so the bench can occlude correctly without hiding the cat.
export function benchCatLift({mode,y,jump=0}){
 if(mode==='home'||mode==='stretch')return BENCH_SEAT_TOP+PET_CONTACT_OFFSET;
 if(mode!=='jumpUp'&&mode!=='jumpDown')return PET_GROUND_TOP;
 const u=Math.max(0,Math.min(1,(y-BENCH_HOME_Z)/(BENCH_LANDING_Z-BENCH_HOME_Z)));
 return (BENCH_SEAT_TOP+PET_CONTACT_OFFSET)*(1-u)+PET_GROUND_TOP*u+Math.max(0,jump)/VIEW_Z;
}
export function makeTownCamera(T){
 const camera=new T.OrthographicCamera(-W/2,W/2,H/2,-H/2,2,4200);
 camera.position.set(0,OUTDOOR_EYE_HEIGHT,OUTDOOR_EYE_DISTANCE);camera.lookAt(0,0,0);camera.updateMatrixWorld();
 // Keep the orthographic clipping-depth row from Three.js; use exact screen
 // coefficients for the first two rows of the combined world-to-clip matrix.
 const worldToClip=new T.Matrix4().multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse);
 const m=worldToClip.elements;
 m[0]=2/W;m[4]=0;m[8]=0;m[12]=0;
 m[1]=0;m[5]=2*VIEW_Z/H;m[9]=-2/H;m[13]=0;
 camera.projectionMatrix.multiplyMatrices(worldToClip,camera.matrixWorld);
 camera.projectionMatrixInverse.copy(camera.projectionMatrix).invert();
 return camera;
}
// A one-off painted pigment map in world coordinates. It is attached to the
// surfaces, not a screen overlay, so moving shadows and wet paths stay real.
export const TOWN_PAINT_PALETTE=Object.freeze({
 meadow:Object.freeze(['#a3b783','#9cae7b','#adbd89','#b4c38f','#90a971']),
 soil:Object.freeze(['#d0c298','#beae83','#ded1ae','#c9bc92','#eee0bb']),
 pond:Object.freeze(['#6d9a8d','#3e796d','#34737f','#b4b482','#c9e0d5'])
});
const VILLAGE_PATH_OUTLINE=Object.freeze([[168,312],[179,302],[236,300],[319,302],[385,298],[453,302],[514,298],[566,302],[630,299],[637,283],[636,254],[648,244],[704,244],[716,253],[715,281],[719,300],[751,301],[779,303],[793,314],[790,356],[777,369],[709,371],[636,368],[562,372],[501,369],[498,414],[500,463],[497,510],[499,556],[489,564],[442,564],[428,553],[428,500],[430,459],[427,414],[426,369],[374,367],[310,370],[255,368],[182,368],[170,359]].map(Object.freeze));
function landscapePigment(T,kind){
 const c=document.createElement('canvas');c.width=1152;c.height=672;
 const ctx=c.getContext('2d');
 ctx.scale(c.width/W,c.height/H);
 const [base,shade,light,warm,cool]=TOWN_PAINT_PALETTE[kind];
 let seed={meadow:1891,soil:9833}[kind];
 const next=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 ctx.fillStyle=kind==='meadow'?'#a0bc74':base;ctx.fillRect(0,0,W,H);
 function glaze(x,y,w,h,angle,hue,alpha){
  ctx.save();ctx.translate(x,y);ctx.rotate(angle);ctx.scale(w,h);
  const ink=ctx.createRadialGradient(-.09,-.08,.05,0,0,1);
  ink.addColorStop(0,hue);ink.addColorStop(.70,hue+'9a');ink.addColorStop(1,hue+'00');
  ctx.globalAlpha=alpha;ctx.fillStyle=ink;ctx.fillRect(-1,-1,2,2);ctx.restore();
 }
 const values=kind==='meadow'?[[133,180,153,65,shade],[381,150,193,64,shade],[533,238,215,76,warm],[725,355,196,80,light],[341,434,140,66,light],[700,492,170,94,shade],[92,340,120,53,cool]]:
  [[275,315,159,24,light],[494,354,179,24,shade],[683,326,110,29,light],[472,471,34,103,shade],[678,278,34,68,warm]];
 for(const [x,y,w,h,hue] of values)glaze(x,y,w,h,(next()-.5)*.3,hue,.68);
 const accents=[shade,light,warm,base,cool];
 for(let group=0;group<32;group++){
  const x=next()*W,y=next()*H,rank=next();
  for(let i=0;i<8;i++){
   const xx=x+(next()-.5)*94,yy=y+(next()-.5)*55;
   const w=7+next()*23,h=1.7+next()*5;
   const angle=(next()-.5)*.54+(kind==='meadow'?-.21:0);
   glaze(xx,yy,w,h,angle,accents[(i+group)%accents.length],.13+rank*.25);
  }
 }
 if(kind==='meadow'){
  for(const [x,z,w,d,rot,n] of LAWN_DRIFTS){
   glaze(x,z,w*1.22,d*2.9,rot,'#83aa54',.68);
   glaze(x-1,z-2,w*.88,d*1.2,rot,'#a8c76b',.76);
   for(let i=0;i<n*5;i++){
    const [xx,zz]=lawnAnchor(x,z,w,d*1.15,rot,i,n*5);
    const theta=i*1.37,dx=Math.cos(theta)*(1.0+i%4*.38),dy=Math.sin(theta)*(1.2+i%3*.31);
    ctx.globalAlpha=.27+(i%4)*.035;ctx.strokeStyle=['#b7cf82','#7f9f54','#a2be6c','#adc676'][i%4];
    ctx.lineWidth=.68+(i%3)*.16;ctx.beginPath();ctx.moveTo(xx,zz);ctx.quadraticCurveTo(xx+dx*.66,zz+dy*.81,xx+dx,zz+dy);ctx.stroke();
   }
   ctx.globalAlpha=1;
  }
 }
 if(kind==='meadow'){
  // Fine overlapping brush marks across the low turf, not geometry tufts.
  // A large soft density field modulates noise, preserving paths/plant beds.
  let turfSeed=952771;
  const turfRandom=()=>((turfSeed=(Math.imul(turfSeed,1664525)+1013904223)>>>0)/4294967296);
  const pigments=['#8aa85e','#add080','#b4c881','#82a45d','#a7c275'];
  for(let i=0;i<3150;i++){
   const xx=turfRandom()*W,zz=turfRandom()*H;
   const q=.58+.17*Math.sin(xx*.031+zz*.018)+.12*Math.cos(xx*.072-zz*.034);
   if(turfRandom()>q)continue;
   const v=.37+turfRandom()*1.42,dx=(turfRandom()-.46)*v;
   ctx.globalAlpha=.19+turfRandom()*.11;ctx.strokeStyle=pigments[i%5];ctx.lineWidth=.50+turfRandom()*.36;
   ctx.beginPath();ctx.moveTo(xx,zz);ctx.quadraticCurveTo(xx+dx*.34,zz-v*.57,xx+dx,zz-v);ctx.stroke();
  }
  ctx.globalAlpha=1;
 }
 // Ground and path pigments feather around the same outline. Each edge
 // wears a little differently; avoid the effect of a continuous border.
 for(let e=0;e<VILLAGE_PATH_OUTLINE.length;e++){
  const [x,z]=VILLAGE_PATH_OUTLINE[e], [u,v]=VILLAGE_PATH_OUTLINE[(e+1)%VILLAGE_PATH_OUTLINE.length];
  const dx=u-x,dz=v-z,len=Math.hypot(dx,dz),angle=Math.atan2(dz,dx),n=Math.max(1,Math.ceil(len/12));
  for(let j=0;j<n;j++){
   const t=(j+.52)/n,xx=x+t*dx,zz=z+t*dz,k=.5+.5*Math.sin(e*2.15+j*.97);
   if(kind==='meadow'){
    glaze(xx,zz,9+k*10,3.3+k*4.0,angle,'#bdb47e',.12+k*.22);
    if((e+j)%4===0)glaze(xx-1.2,zz+1.7,5.1+k*4.6,2.6+k*2.0,angle+.31,'#d0bc87',.16);
   }else{
    glaze(xx,zz,7+k*8,2.5+k*3.4,angle,'#a8b174',.18+k*.20);
    if((e+j)%5===2)glaze(xx+.85,zz-.5,4.2+k*2.5,2.2+k*1.2,angle+.44,'#b8bf80',.19);
   }
  }
 }
 // Fine, softly irregular pigment: tiny mineral flecks on the walking
 // surface, and overlapping grass grains where the meadow catches the light.
 {
  const meadow=kind==='meadow',dark=meadow?'#6e844e':'#9d8961',mid=meadow?'#8f9d65':'#b39d74',pale=meadow?'#c0c58f':'#efe2bf';
  // Mottled colour islands create medium-scale relief before fine grain
  // becomes visible, including in the lower perspective shot.
  for(let cell=0;cell<290;cell++){
   const x=next()*W,y=next()*H,r=2.7+next()*8,angle=(next()-.5)*1.15;
   ctx.globalAlpha=(.15+next()*.24)*(meadow?.45:1);ctx.fillStyle=[dark,mid,pale][cell%3];
   ctx.beginPath();ctx.ellipse(x,y,r*(1.21+next()*.53),r*(.24+next()*.44),angle,0,Math.PI*2);ctx.fill();
   if(cell%3===0){
    ctx.globalAlpha=(.11+next()*.18)*(meadow?.47:1);ctx.strokeStyle=pale;ctx.lineWidth=.57+next();
    ctx.beginPath();ctx.moveTo(x-r*.7,y+r*.29);ctx.quadraticCurveTo(x,y+r*.48,x+r*.71,y+r*.18);ctx.stroke();
   }
  }
  for(let cell=0;cell<102;cell++){
   const x=next()*W,y=next()*H,grain=next();
   for(let i=0;i<53;i++){
    const angle=next()*Math.PI*2,r=Math.sqrt(next()),xx=x+Math.cos(angle)*r*(18+grain*57),yy=y+Math.sin(angle)*r*(13+grain*29);
    const scale=.30+next()*1.23;
    ctx.globalAlpha=(.095+next()*.23)*(meadow?.65:1);ctx.strokeStyle=[dark,mid,pale][i%3];ctx.lineWidth=scale*.62;
    ctx.beginPath();ctx.moveTo(xx,yy);
    ctx.quadraticCurveTo(xx+scale*.72,yy-scale*.18,xx+scale*(meadow?1.18:2.02),yy+scale*(meadow?-1.1:.44));ctx.stroke();
    if(i%4===0){ctx.globalAlpha=(.13+next()*.12)*(meadow?.57:1);ctx.fillStyle=i%8?dark:pale;ctx.fillRect(xx-scale*.24,yy+scale*.43,scale*.56,scale*.36);}
   }
  }
  ctx.globalAlpha=1;
 }
 // Site-specific wear goes into the same baked material as the broader
 // pigment. Keep compacted footpaths quiet and concentrate detail on edges.
 const pigmentRng=(start)=>()=>{start=(Math.imul(start,1664525)+1013904223)>>>0;return start/4294967296;};
 if(kind==='soil'){
  const roll=pigmentRng(83309),tau=2*Math.PI;
  const stones=['#9b8361','#b09b75','#c2ad86','#cdb894','#957f62','#b1a18c'];
  const verges=[
   [[181,303],[241,300],[316,302],[384,298],[450,302],[513,298],[566,302],[629,299]],
   [[181,367],[252,369],[310,370],[375,367],[427,369]],
   [[500,370],[558,371],[632,368],[706,371],[774,370]],
   [[427,375],[427,413],[431,457],[428,501],[429,550]],
   [[500,375],[497,418],[500,459],[497,510],[498,550]],
   [[638,294],[638,269],[638,255],[651,246],[703,246],[714,254],[714,285],[720,301],[772,305],[791,318],[790,353]]
  ];
  function chip(x,z,rx,rz,tint,alpha,random=roll){
   const spin=random()*tau;
   ctx.save();ctx.translate(x,z);ctx.rotate(spin);
   ctx.globalAlpha=alpha;ctx.fillStyle=tint;ctx.beginPath();
   for(let i=0;i<6;i++){
    const a=tau*i/6,rr=.64+random()*.36,u=Math.cos(a)*rx*rr,v=Math.sin(a)*rz*rr;
    i?ctx.lineTo(u,v):ctx.moveTo(u,v);
   }
   ctx.closePath();ctx.fill();
   if(rx>1.17){
    ctx.globalAlpha*=.64;ctx.strokeStyle='#f4e4bf';ctx.lineWidth=.43;ctx.beginPath();
    ctx.moveTo(-rx*.55,-rz*.24);ctx.quadraticCurveTo(-rx*.18,-rz*.65,rx*.46,-rz*.41);ctx.stroke();
   }
   ctx.restore();
  }
  // A footpath wears into soft pools around junctions and thresholds,
  // not parallel grooves. Fine ground flecks stay deliberately irregular.
  const trackRng=pigmentRng(662401);
  for(const [x,z,rx,rz,angle,k] of [[216,336,20,9,-.25,0],[304,333,31,12,.07,1],
    [402,342,33,10,-.10,2],[468,343,29,19,.45,1],[531,336,31,11,-.09,4],
    [634,334,28,9,-.11,3],[718,344,20,11,.17,2],[690,267,9,15,.15,1],
    [672,309,13,17,.47,3],[467,409,11,20,-.2,0],[472,475,12,18,.2,3],[464,532,11,13,-.1,4]]){
   glaze(x,z,rx,rz,angle,'#e9d6a9',.26);
   glaze(x-4,z+3,rx*.58,rz*.64,angle+.31,'#9d8361',.13);
   for(let j=0;j<22;j++){
    const a=trackRng()*tau,d=Math.sqrt(trackRng()),x0=x+Math.cos(a)*rx*d,z0=z+Math.sin(a)*rz*d;
    chip(x0,z0,.35+trackRng()*.85,.17+trackRng()*.52,stones[(k+j)%stones.length],
     .14+trackRng()*.29,trackRng);
   }
  }
  // Short washouts cut diagonally towards the verge. Finer deposited
  // material collects on one side, leaving the other as a narrow dark edge.
  for(const [x,z,dx,dz] of [[277,310,18,13],[390,359,22,-10],[517,311,16,14],[740,363,-23,-15],
    [434,436,12,20],[493,481,-12,-18],[647,275,14,22],[705,254,-7,20]]){
   const len=Math.hypot(dx,dz),nx=-dz/len,nz=dx/len,angle=Math.atan2(dz,dx);
   for(let j=0;j<9;j++){
    const t=j/8,wind=Math.sin(t*8+2)*1.07,fade=Math.sin(Math.PI*(.05+.9*t));
    const u=x+dx*t+nx*wind,v=z+dz*t+nz*wind;
    glaze(u,v,4.1,1.2+fade*1.22,angle,'#907858',.42*fade);
    glaze(u+nx*1.9,v+nz*1.9,3.8,1.1,angle,'#ead4a6',.41*fade);
    if(j>3)chip(u+nx*(1.2+trackRng()*3),v+nz*(1.2+trackRng()*3),.41+trackRng()*1.2,.26+trackRng()*.62,stones[j%6],.37+trackRng()*.22,trackRng);
   }
  }
  for(const verge of verges)for(let j=1;j<verge.length;j++){
   const [x,z]=verge[j-1],[xx,zz]=verge[j],dx=xx-x,dz=zz-z,d=Math.hypot(dx,dz),nx=-dz/d,nz=dx/d;
   for(let i=0;i<Math.ceil(d/7);i++){
    const t=(i+roll())/Math.ceil(d/7),a=x+dx*t,b=z+dz*t;
    const exposed=roll()>.24;
    if(exposed)glaze(a,b,3+roll()*9,2+roll()*4,(roll()-.5)*2.1,roll()<.42?'#8b955f':'#a29670',.14+roll()*.27);
    for(let n=0;n<3+Math.floor(roll()*5);n++){
     const along=(roll()-.5)*13,across=(roll()-.5)*17;
     chip(a+dx/d*along+nx*across,b+dz/d*along+nz*across,.37+roll()*2,.21+roll()*1.1,stones[Math.floor(roll()*stones.length)],.25+roll()*.39);
    }
   }
  }
  for(const [x,z,rx,rz] of [[252,338,37,10],[403,336,44,11],[521,332,51,10],[663,334,36,12],[683,279,10,16],[463,410,10,24],[463,509,8,26]]){
   glaze(x,z,rx,rz,0,'#efe2bf',.28);
   for(let i=0;i<22;i++)chip(x+(roll()-.5)*rx*1.8,z+(roll()-.5)*rz*1.8,.48+roll()*1.22,.29+roll()*.63,stones[i%stones.length],.14+roll()*.28);
  }
 }
 if(kind==='meadow'){
  // Interrupted moss and short dry blades gather where runoff lingers or
  // feet leave the gravel; the centre of the meadow stays legible.
  const roll=pigmentRng(183223),inks=['#70874c','#83965d','#adba7a','#d3c496','#7c8f52','#98a663'];
  const pockets=[[185,286,36,13],[299,379,55,13],[345,287,61,11],[475,286,37,12],[586,379,57,13],[738,381,46,12],
   [421,437,14,35],[505,463,14,45],[402,512,20,29],[537,525,31,25],[757,262,39,22],[555,197,34,21],[326,454,49,22],
   [305,70,64,25],[421,87,49,30],[561,71,49,29],[859,106,42,35],[902,194,38,31]];
  for(const [x,z,rx,rz] of pockets){
   glaze(x,z,rx,rz,(roll()-.5)*.2,inks[roll()<.45?0:3],.29);
   for(let p=0;p<64;p++){
    const a=roll()*2*Math.PI,rr=Math.sqrt(roll()),u=x+Math.cos(a)*rx*rr,v=z+Math.sin(a)*rz*rr;
    const angle=(roll()-.5)*2.8,w=.42+roll()*1.82,h=.16+roll()*.39;
    ctx.save();ctx.translate(u,v);ctx.rotate(angle);
    ctx.globalAlpha=.21+roll()*.30;ctx.strokeStyle=inks[p%inks.length];ctx.lineWidth=h;ctx.lineCap='round';
    ctx.beginPath();ctx.moveTo(-w*.48,w*.22);ctx.quadraticCurveTo(-w*.03,w*.15,w*.55,-w*.39);ctx.stroke();
    ctx.restore();
   }
  }
 }
 const t=new T.CanvasTexture(c);
 t.colorSpace=T.SRGBColorSpace;t.anisotropy=4;return t;
}
// Fired clay is not wood: fine dry pits, cloudy kiln colour, paler worn
// edges and faint mineral runs. The relief is independent of pigment.
function roofClay(T){
 const size=128,make=()=>Object.assign(document.createElement('canvas'),{width:size,height:size});
 const a=make(),b=make(),ac=a.getContext('2d'),bc=b.getContext('2d'),ad=ac.createImageData(size,size),bd=bc.createImageData(size,size);
 const hash=(x,y)=>{let h=Math.imul(x+347,374761393)+Math.imul(y+521,668265263);h=Math.imul(h^(h>>>13),1274126177);return ((h^(h>>>16))>>>0)/4294967296;};
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){
  const u=x/(size-1),v=y/(size-1),edge=Math.min(x,y,size-1-x,size-1-y);
  const m=Math.sin(12*u+3*Math.sin(v*8))*Math.cos(v*6-u*5),patch=Math.sin(u*23+v*15)*Math.sin(v*17-u*9);
  const grain=hash(x,y)-.5,pit=grain>.43?-(grain-.43)*2.7:0;
  const limestone=Math.pow(Math.max(0,Math.sin(u*51+.7*Math.sin(v*17))),16)*Math.pow(Math.max(0,Math.sin(v*9+u*15)),3)*14;
  const rim=13*Math.exp(-edge*.22),shade=12*m+7*patch+9*grain+40*pit+rim+limestone;
  const ridge=142+5*m+8*grain+163*pit-29*Math.exp(-edge*.38);
  const i=4*(y*size+x);
  ad.data[i]=214+shade;ad.data[i+1]=182+shade*.92;ad.data[i+2]=158+shade*.76;ad.data[i+3]=255;
  bd.data[i]=bd.data[i+1]=bd.data[i+2]=ridge;bd.data[i+3]=255;
 }
 ac.putImageData(ad,0,0);bc.putImageData(bd,0,0);
 const map=new T.CanvasTexture(a),bumpMap=new T.CanvasTexture(b);
 map.colorSpace=T.SRGBColorSpace;map.anisotropy=bumpMap.anisotropy=4;
 return {map,bumpMap};
}
function woodWearMap(T){
 const c=document.createElement('canvas');c.width=128;c.height=64;
 const g=c.getContext('2d');g.fillStyle='#ece6d5';g.fillRect(0,0,128,64);
 let z=401;const rnd=()=>{z=(Math.imul(z,1664525)+1013904223)>>>0;return z/4294967296;};
 for(let i=0;i<27;i++){
  const y=rnd()*64,x=rnd()*129,len=11+rnd()*51;
  g.strokeStyle=i%3===0?'#aba08a52':'#f8f5e788';g.lineWidth=.27+rnd()*.83;
  g.beginPath();g.moveTo(x,y);g.bezierCurveTo(x+len*.25,y+2,x+len*.75,y-1.8,x+len,y+.3);g.stroke();
 }
 for(const [x,y] of [[27,31],[102,18]]){
  const ink=g.createRadialGradient(x,y,0,x,y,13);
  ink.addColorStop(0,'#a38f78aa');ink.addColorStop(1,'#a38f7800');
  g.fillStyle=ink;g.fillRect(x-13,y-13,26,26);
 }
 const texture=new T.CanvasTexture(c);texture.colorSpace=T.SRGBColorSpace;return texture;
}
// The pool bed is painted separately from the moving surface. Faded
// sediment runs, patches of waterweed and buried grit are composited once.
function pondBed(T){
 const c=document.createElement('canvas');c.width=768;c.height=460;
 const g=c.getContext('2d'),w=c.width,h=c.height;let seed=72819;
 const rnd=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
 const [bed,moss,deep,silt]=TOWN_PAINT_PALETTE.pond;
 g.fillStyle=bed;g.fillRect(0,0,w,h);
 function stain(x,y,rx,ry,turn,ink){
  g.save();g.translate(x,y);g.rotate(turn);g.scale(rx,ry);
  const hue=g.createRadialGradient(0,0,0,0,0,1);
  hue.addColorStop(0,ink);hue.addColorStop(1,ink.slice(0,7)+'00');
  g.fillStyle=hue;g.fillRect(-1,-1,2,2);g.restore();
 }
 for(const [x,y,rx,ry,angle,ink] of [
  [.15,.23,154,96,-.24,moss+'be'],[.50,.55,236,154,.29,deep+'ad'],
  [.77,.72,177,82,-.17,'#397d83af'],[.70,.28,148,68,.13,'#a9ae7360'],
  [.30,.91,207,91,-.11,silt+'a0'],[.91,.36,128,127,.35,'#b9b58392']
 ])stain(x*w,y*h,rx,ry,angle,ink);
 for(let j=0;j<89;j++){
  const x=rnd()*w,y=rnd()*h,scale=5+rnd()*27;
  stain(x,y,scale*2.1,scale*.58,(rnd()-.5)*.9,
   ['#366f681a','#c3c38c19','#40757525','#b2ae7f2a'][j%4]);
  for(let i=0;i<20;i++){
   const xx=x+(rnd()-.5)*scale*3.3,yy=y+(rnd()-.5)*scale*1.3;
   const edge=Math.min(xx,w-xx,yy,h-yy),r=.4+rnd()*1.6;
   g.fillStyle=i%3===0?(edge<90?'#ccd09e62':'#ccd09e28'):'#436e6149';
   g.beginPath();g.ellipse(xx,yy,r*1.8,r,(rnd()-.5)*1.2,0,Math.PI*2);g.fill();
  }
 }
 for(const [x,y,angle] of [[.08,.38,-.6],[.19,.84,.46],[.65,.86,-.44],[.88,.23,.62],[.90,.65,-.59]]){
  g.save();g.translate(x*w,y*h);g.rotate(angle);
  for(let i=0;i<25;i++){
   const ax=(rnd()-.5)*71,ay=(rnd()-.5)*27,l=3+rnd()*29;
   g.beginPath();g.moveTo(ax,ay);g.quadraticCurveTo(ax+l*.8,ay-4,ax+l,ay-3-rnd()*10);
   g.lineWidth=.55+rnd()*1.6;g.strokeStyle=i%3===0?'#84996950':'#476e555e';g.stroke();
  }
  g.restore();
 }
 const texture=new T.CanvasTexture(c);texture.colorSpace=T.SRGBColorSpace;texture.anisotropy=4;
 return texture;
}
function pondSurface(T,map){
 const material=new T.MeshLambertMaterial({map,color:'#eff8f4'});
 const phase={value:0},brightness={value:.9},lightX={value:.48};
 const clearSky=TOWN_PAINT_PALETTE.pond[4],sky={value:new T.Color(clearSky)};
 material.onBeforeCompile=shader=>{
  Object.assign(shader.uniforms,{townWaterPhase:phase,townWaterBrightness:brightness,townWaterLightX:lightX,townWaterSky:sky});
  shader.vertexShader=shader.vertexShader.replace('#include <common>',`
   #include <common>
   varying float townWaterGrazing;
  `).replace('#include <project_vertex>',`
   #include <project_vertex>
   vec3 surfaceToCamera = isOrthographic ? vec3(0.,0.,1.) : normalize(-mvPosition.xyz);
   townWaterGrazing = abs(dot(normalize(normalMatrix * vec3(0.,0.,1.)), surfaceToCamera));
  `);
  shader.fragmentShader=shader.fragmentShader.replace('#include <common>',`
   #include <common>
   uniform float townWaterPhase;
   uniform float townWaterBrightness;
   uniform float townWaterLightX;
   uniform vec3 townWaterSky;
   varying float townWaterGrazing;
  `).replace('#include <map_fragment>',`
   #include <map_fragment>
   vec2 uvPond = vMapUv;
   float t = townWaterPhase;
   float longWave = sin(uvPond.y*48. + uvPond.x*6.1 + sin(uvPond.x*12.-t*3.)*.67 -t*8.);
   float shortWave = sin(uvPond.y*95. - uvPond.x*16. +t*9. +sin(uvPond.x*19.+t*5.)*.60);
   float crossWave = sin(uvPond.y*35. + uvPond.x*28. -t*5.);
   // No shallow stripe across the open outlet at low v.
   float edgeDistance = min(1.-uvPond.x,1.-uvPond.y);
   float shallow = 1.-smoothstep(.008,.19,edgeDistance+shortWave*.009);
   float grazing = 1.-clamp(townWaterGrazing,0.,1.);
   float reflectedSky = .07 + .50*grazing*grazing;
   // The canopy breaks up the reflected sky at the northern bank. These are
   // painted shore colour bands, not a second render or a traced reflection.
   float shade = smoothstep(.18,.86,uvPond.y) *
      smoothstep(-.25,.82,sin(uvPond.x*15.+longWave*.10+crossWave*.14)+.34*sin(uvPond.x*36.));
   vec3 sky = mix(townWaterSky,vec3(.12,.26,.20),shade*.78);
   vec3 bed = mix(diffuseColor.rgb*.91,diffuseColor.rgb*vec3(1.12,1.08,.91),shallow);
   vec3 pool = mix(bed,sky,reflectedSky*(.84+longWave*.10+shortWave*.06));
   float sunLane = 1.-smoothstep(.04,.36,abs(uvPond.x-townWaterLightX+.16*(uvPond.y-.48)));
   float blade = smoothstep(.72,1.,longWave)*smoothstep(.35,1.,shortWave)*smoothstep(-.10,.93,crossWave);
   float sparkle = (.045+.24*grazing)*blade*sunLane*smoothstep(.005,.08,edgeDistance)*townWaterBrightness;
   diffuseColor.rgb = mix(pool,vec3(.88,.91,.67),sparkle)*(1.+longWave*.018+shortWave*.011);
  `);
 };
 material.customProgramCacheKey=()=> 'town-pond-silt-sky-sw-v2';
 let lastWeather;
 return {material,update(now,weather,lamp,motion){
  phase.value=motion?now%96000/96000*Math.PI*2:0;
  if(lastWeather!==weather){
   lastWeather=weather;
   brightness.value=weather==='rain'?.09:weather==='breeze'?.60:.94;
   sky.value.set(weather==='rain'?'#a5b8b4':weather==='breeze'?'#c2d4cd':clearSky);
  }
  lightX.value=.46+Math.max(-1,Math.min(1,(lamp.x-45)/270))*.21;
 }};
}
// A short-lived ground trace from actual walking, with distance-based spacing.
export function createFootfallTracker(isSoil){
 const previous=new Map(),prints=[];
 return Object.freeze({
  walk(actors,clock,weather,allowed=true){
   if(!allowed){previous.clear();prints.length=0;return [];}
   for(const a of actors){
    let q=previous.get(a.id);
    if(!q){previous.set(a.id,{x:a.x,z:a.z,carry:0,side:1});continue;}
    const dx=a.x-q.x,dz=a.z-q.z,ds=Math.hypot(dx,dz);
    if(ds>35||!a.active){q.carry=0;}
    else if(ds>.01){
     const stride=11.5;
     for(let d=stride-q.carry;d<=ds;d+=stride){
      const x=q.x+dx*d/ds+q.side*2.2*dz/ds,z=q.z+dz*d/ds-q.side*2.2*dx/ds;
      if(isSoil(x,z))prints.push({x,z,yaw:Math.atan2(dx,dz),at:clock,wet:weather==='rain',side:q.side});
      q.side*=-1;
     }
     q.carry=(q.carry+ds)%stride;
    }
    q.x=a.x;q.z=a.z;
   }
   while(prints.length&&(prints.length>12||clock-prints[0].at>(prints[0].wet?1680:960)))prints.shift();
   return prints.map(d=>({...d,opacity:(d.wet?.30:.19)*Math.max(0,1-(clock-d.at)/(d.wet?1680:960))**1.3}));
  }
 });
}
function insidePolygon(x,z,path){
 let inside=false;
 for(let i=0,j=path.length-1;i<path.length;j=i++){
  const [xi,zi]=path[i],[xj,zj]=path[j];
  if((zi>z)!==(zj>z)&&x<(xj-xi)*(z-zi)/(zj-zi)+xi)inside=!inside;
 }
 return inside;
}
function paintTerrainUV(T,geometry,spanX=W,spanZ=H){
 const pos=geometry.attributes.position,uv=new Float32Array(pos.count*2);
 for(let i=0;i<pos.count;i++){uv[2*i]=.5+pos.getX(i)/spanX;uv[2*i+1]=.5+pos.getY(i)/spanZ;}
 geometry.setAttribute('uv',new T.BufferAttribute(uv,2));
 return geometry;
}
export async function makeTownWebGL({trees,chairs,stand,room,onLoss}){
 // Use the same reviewed, packaged Three.js as the experimental studio.
 const lib=new URL('./3D/vendor/three.module.js',location.href);
 const T=await import(lib.href);
 const output=document.createElement('canvas');
 const renderer=new T.WebGLRenderer({canvas:output,alpha:false,antialias:true,powerPreference:'low-power',preserveDrawingBuffer:false});
 renderer.setPixelRatio(1);renderer.setSize(W,H,false);renderer.outputColorSpace=T.SRGBColorSpace;
 renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;
 renderer.shadowMap.autoUpdate=false;
 const scene=new T.Scene();
 const mapBackground=new T.Color('#eee3d5');
 scene.background=mapBackground;
 const horizons={sun:null,rain:null,breeze:null};
 const mapCamera=makeTownCamera(T);
 const pondCamera=new T.PerspectiveCamera(POND_SHOT.fov,W/H,2,2350);
 const [ex,ey,ez]=POND_SHOT.eye,[lx,ly,lz]=POND_SHOT.target;
 pondCamera.position.set(ex-W/2,ey,ez-H/2);pondCamera.lookAt(lx-W/2,ly,lz-H/2);pondCamera.updateMatrixWorld();
 const facingYaw=Math.atan2(ex-lx,ez-lz);
 let camera=mapCamera;

 const verge=makeVerge(T,scene,W,H);

 const sun=new T.DirectionalLight('#ffe7b0',2.05);
 sun.position.set(350,700,-310);sun.castShadow=true;
 sun.shadow.mapSize.set(1024,1024);
 Object.assign(sun.shadow.camera,{left:-660,right:660,top:550,bottom:-550,near:40,far:1540});
 sun.shadow.camera.updateProjectionMatrix();sun.shadow.bias=-.0007;sun.shadow.normalBias=2.2;
 const fill=new T.HemisphereLight('#e8f3f0','#b8a183',1.34);
 const porchFill=new T.DirectionalLight('#fff0db',.43);
 porchFill.position.set(70,260,610);
 scene.add(sun,fill,porchFill);
 const leafy=makeOrchardLeaf(T),needles=makeOrchardLeaf(T,true);
 const meadowPigment=landscapePigment(T,'meadow'),soilPigment=landscapePigment(T,'soil'),pondPigment=pondBed(T);
 const geometry={
  box:new T.BoxGeometry(1,1,1),'weathered-board':new T.BoxGeometry(1,1,1),'fired-clay':new T.BoxGeometry(1,1,1), sphere:new T.IcosahedronGeometry(1,1),
  trunk:new T.CylinderGeometry(.36,.51,1,11,2), cone:new T.ConeGeometry(1,1,5),
  circle:new T.CircleGeometry(1,18), 'orchard-leaf':leafy.geometry,'orchard-needle':needles.geometry, 'window-glass':new T.BoxGeometry(1,1,1)
 };
 const material=new T.MeshLambertMaterial({flatShading:true});
 const boardSkin=new T.MeshLambertMaterial({map:woodWearMap(T),flatShading:true});
 const claySkin=new T.MeshPhongMaterial({...roofClay(T),bumpScale:.18,shininess:8,specular:'#392a25',flatShading:true});
 const leafyMaterial=leafy.material;
 const bark=makeOrchardBark(T);
 const barkMaterial=new T.MeshPhongMaterial({...bark,bumpScale:.22,shininess:6,specular:'#272219'});
 const windowGlass=new T.MeshLambertMaterial({emissive:'#b88651',emissiveIntensity:.32});
 const batches=new Map(),houseInstances=new Map(),houseMesh=new Set();
 let markingHouse=false;
 const model=new T.Object3D(),sample=new T.Vector3();
 const color=new T.Color();
 function shape(kind,x,y,z,sx,sy,sz,tint,rx=0,ry=0,rz=0,flex=0){
  const [dx,dz]=local(x,z);model.position.set(dx,y,dz);model.rotation.set(rx,ry,rz);model.scale.set(sx,sy,sz);model.updateMatrix();
  if(!batches.has(kind))batches.set(kind,[]);
  batches.get(kind).push([model.matrix.clone(),tint,flex,x,z,markingHouse]);
 }
 const box=(...args)=>shape('box',...args);
 const woodDetail=(...args)=>shape('weathered-board',...args);
 const clayDetail=(...args)=>shape('fired-clay',...args);
 const sphere=(...args)=>shape('sphere',...args);
 function plane(x,z,y,sx,sz,tint,alpha){
  const [dx,dz]=local(x,z);
  const mesh=new T.Mesh(geometry.circle,new T.MeshBasicMaterial({color:tint,transparent:true,opacity:alpha,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1}));
  mesh.position.set(dx,y,dz);mesh.rotation.x=-Math.PI/2;mesh.scale.set(sx,sz,1);scene.add(mesh);return mesh;
 }
 let seed=21841;const rng=()=>{seed=(Math.imul(1664525,seed)+1013904223)>>>0;return seed/4294967296;};
 // The stage is an actual stand-alone little landscape model. No CSS
 // clipping: all three rounded pieces have exposed sides and catch shadows.
 function slab(w,d,rad,top,height,tint,cap=null){
  const x=-w/2,z=-d/2,q=new T.Shape();
  q.moveTo(x+rad,z);q.lineTo(x+w-rad,z);q.quadraticCurveTo(x+w,z,x+w,z+rad);
  q.lineTo(x+w,z+d-rad);q.quadraticCurveTo(x+w,z+d,x+w-rad,z+d);
  q.lineTo(x+rad,z+d);q.quadraticCurveTo(x,z+d,x,z+d-rad);
  q.lineTo(x,z+rad);q.quadraticCurveTo(x,z,x+rad,z);q.closePath();
  const geo=new T.ExtrudeGeometry(q,{depth:height,bevelEnabled:true,bevelThickness:2,bevelSize:2,bevelSegments:2,curveSegments:8});
  const edgeMaterial=new T.MeshLambertMaterial({color:tint,flatShading:true});
  const material=cap?[new T.MeshPhongMaterial({map:cap,bumpMap:cap,bumpScale:.83,shininess:4,specular:'#242a19',color:'#fbf7ef'}),edgeMaterial]:edgeMaterial;
  if(cap)paintTerrainUV(T,geo,w,d);
  const mesh=new T.Mesh(geo,material);
  mesh.position.y=top-height;mesh.rotation.x=-Math.PI/2;mesh.castShadow=true;mesh.receiveShadow=true;scene.add(mesh);
 }
 slab(994,598,43,-28,10,'#786856');
 slab(983,586,40,-13,15,'#b59971');
 slab(966,569,36,-1,12,'#a3b783',meadowPigment);
 // Paint tiny exposed layers into the sides of the earth, always below the
 // walkable 0 plane. Deliberate dashes hint at gravel instead of raster noise.
 for(let i=0;i<37;i++){
  const x=44+i*23+rng()*8;
  box(x,-16-rng()*7,571,4+rng()*10,1.15,.85,i%3?'#cfbb91':'#8f795b');
  if(i<20)box(969,-18-rng()*5,27+i*25,1.05,.9,4+rng()*10,'#ceb88c');
 }
 // Quiet matte backdrop below the terrain; a repeated weave at this
 // zoom reads as a grid rather than a natural miniature base.
 const clothMat=new T.MeshLambertMaterial({color:'#ede2d4'});
 const plinth=new T.Mesh(new T.PlaneGeometry(5600,3600),clothMat);
 plinth.rotation.x=-Math.PI/2;plinth.position.y=-45;plinth.receiveShadow=true;scene.add(plinth);
 // The path is one junction, shaped and bevelled from its established
 // horizontal lane, centre walk, and short northern doorway approach.
 const pathLoop=VILLAGE_PATH_OUTLINE;
 const trail=new T.Shape();
 pathLoop.forEach(([x,z],i)=>i?trail.lineTo(x-W/2,H/2-z):trail.moveTo(x-W/2,H/2-z));trail.closePath();
 // Shallow compacted gravel, not a raised platform. All path paint and
 // transient traces use the same new elevation; walk/pick coordinates do not.
 const roadTop=2.05,roadSink=4.25-roadTop;
 const pathMesh=new T.Mesh(paintTerrainUV(T,new T.ExtrudeGeometry(trail,{depth:1.85,bevelEnabled:true,bevelThickness:1.2,bevelSize:1.8,bevelSegments:2})),new T.MeshPhongMaterial({map:soilPigment,bumpMap:soilPigment,bumpScale:.69,shininess:3,specular:'#30271c',color:'#f7f4eb'}));
 pathMesh.rotation.x=-Math.PI/2;pathMesh.position.y=1.2-roadSink;pathMesh.receiveShadow=true;scene.add(pathMesh);
 const dryTrail=pathMesh.material.color.clone(),wetTrail=new T.Color('#dad1c3');
 const footfall=createFootfallTracker((x,z)=>insidePolygon(x,z,pathLoop));
 const stampTexture=(()=>{
  const c=document.createElement('canvas');c.width=16;c.height=24;
  const g=c.getContext('2d');
  for(const [x,y,r,h,opacity] of [[8,6,4.8,6,.75],[8.4,15,4.2,6,.92]]){
   g.save();g.translate(x,y);g.scale(r,h);
   const ink=g.createRadialGradient(0,0,.12,0,0,1);
   ink.addColorStop(0,`rgba(255,255,255,${opacity})`);ink.addColorStop(.72,'rgba(255,255,255,.55)');ink.addColorStop(1,'rgba(255,255,255,0)');
   g.fillStyle=ink;g.fillRect(-1,-1,2,2);g.restore();
  }
  const tex=new T.CanvasTexture(c);tex.colorSpace=T.SRGBColorSpace;return tex;
 })();
 const footShape=new T.PlaneGeometry(4.5,7.4),steps=Array.from({length:12},()=>{
  const mesh=new T.Mesh(footShape,new T.MeshBasicMaterial({map:stampTexture,color:'#685441',transparent:true,depthWrite:false}));
  mesh.visible=false;mesh.renderOrder=5;scene.add(mesh);return mesh;
 });
 function footmarks(actors,t,weather,allowed){
  const recent=footfall.walk(actors,t,weather,allowed);
  for(let i=0;i<steps.length;i++){
   const mesh=steps[i],mark=recent[i];mesh.visible=Boolean(mark);if(!mark)continue;
   const [x,z]=local(mark.x,mark.z);
   mesh.position.set(x,4.67-roadSink,z);mesh.rotation.set(-Math.PI/2,0,-mark.yaw+(mark.side<0?.13:-.13));
   mesh.material.opacity=mark.opacity;mesh.material.color.set(mark.wet?'#59494d':'#7f6244');
  }
 }
 const pathAt=(x,z)=>(x>161&&x<800&&z>292&&z<380)||(x>417&&x<510&&z>369)||(x>617&&x<727&&z>242&&z<314);
 const clearTurf=(x,z)=>!pathAt(x,z)&&!insidePolygon(x,z,GARDEN_SOIL)
  &&!(x>=room.x-3&&x<=room.x+room.w+3&&z>=room.y-2&&z<=room.depth+3)
  &&!(x>184&&x<320&&z>194&&z<226)
  &&!(x>377&&x<497&&z>189&&z<242);
 const updateGrass=makeLivingGrass(T,scene,W,H,clearTurf);
 // Advance the established art seed without its former scattered lawn
 // chips; paths, props and their seeded material details remain identical.
 for(let i=0;i<240;i++){
  const x=21+rng()*913,z=85+rng()*456;
  if(pathAt(x,z)||(x<282&&z>375)||(x>729&&z>393)||(x>565&&x<791&&z>111&&z<245))continue;
  rng();rng();rng();
 }

 for(const [x,z,w,d] of [[480,333,620,72],[464,463,72,192],[676,268,76,53]])for(let i=0;i<Math.ceil(w*d/760);i++){
  const dx=x-w*.43+rng()*w*.86,dz=z-d*.41+rng()*d*.82;
  sphere(dx,3.9-roadSink,dz,1.15+rng()*3.6,.3,.65+rng()*1.55,['#d9c096','#e6cfa5','#d3bb90'][i%3],0,(rng()-.5)*1.4);
 }
 // Broad pigment islands break the upper meadow into ground, sun and
 // orchard shade, without filling the readable centre with extra objects.
 plane(360,162,1.53,89,42,'#829956',.10);
 plane(470,177,1.57,89,39,'#c0bb7a',.11);
 plane(525,129,1.51,65,38,'#8aa570',.08);
 plane(391,251,1.53,67,31,'#bac783',.10);
 const wornBand=(points,y,tint,a)=>{
  const q=new T.Shape();
  const complete=points.map(([x,z,w])=>[x,z-w]).concat(points.slice().reverse().map(([x,z,w])=>[x,z+w]));
  complete.forEach(([x,z],i)=>i?q.lineTo(x-W/2,H/2-z):q.moveTo(x-W/2,H/2-z));q.closePath();
  const mesh=new T.Mesh(new T.ShapeGeometry(q),new T.MeshLambertMaterial({color:tint,transparent:true,opacity:a,depthWrite:false}));
  mesh.rotation.x=-Math.PI/2;mesh.position.y=y-roadSink;mesh.receiveShadow=true;scene.add(mesh);
 };
 wornBand([[181,320,1],[210,321,5],[256,324,8],[302,319,7],[362,319,8],[421,322,7],[471,320,5],[522,316,5],[577,316,7],[641,319,7],[698,316,7],[746,324,6],[781,325,1]],4.36,'#b8a47e',.17);
 wornBand([[193,344,1],[227,342,5],[267,345,7],[311,348,8],[371,349,7],[444,347,9],[507,346,6],[576,342,7],[626,343,5],[685,345,7],[733,344,6],[763,347,1]],4.37,'#baa880',.14);
 // Repeated straight-edged tread rectangles look like pavers. Use
 // gently curved traces with irregular width and tapered ends instead.
 const tracks=[
  {walk:[[184,324],[217,325],[256,329],[290,331],[332,331],[373,332],[415,333],[465,333],[501,332],[548,330],[590,329],[629,331],[673,332],[716,333],[753,334],[779,334]],span:7},
  {walk:[[457,368],[453,392],[453,420],[457,449],[457,473],[454,500],[452,528],[454,551]],span:5},
  {walk:[[684,246],[684,258],[682,278],[682,300],[679,318]],span:5}
 ];
 for(const {walk,span} of tracks)for(const side of [-1,1]){
  const edges=[[],[]];
  for(let i=0;i<walk.length;i++){
   const [x,z]=walk[i],p=walk[Math.max(0,i-1)],n=walk[Math.min(walk.length-1,i+1)];
   const dx=n[0]-p[0],dz=n[1]-p[1],len=Math.hypot(dx,dz),nx=-dz/len,nz=dx/len;
   const off=side*span+(rng()-.5)*2.1;
   const span1=1.7+rng()*1.55,span2=1.4+rng()*2.3;
   const tip=Math.min(1,(i+.08)/1.5,(walk.length-i-.92)/1.5);
   edges[0].push([x+nx*(off-span1*tip),z+nz*(off-span1*tip)]);
   edges[1].push([x+nx*(off+span2*tip),z+nz*(off+span2*tip)]);
  }
  const contour=edges[0].concat(edges[1].reverse()),path=new T.Shape();
  contour.forEach(([x,z],i)=>i?path.lineTo(x-W/2,H/2-z):path.moveTo(x-W/2,H/2-z));
  path.closePath();
  const mesh=new T.Mesh(new T.ShapeGeometry(path),new T.MeshLambertMaterial({color:side>0?'#bf9f6a':'#c7a876',transparent:true,opacity:.095,depthWrite:false}));
  mesh.rotation.x=-Math.PI/2;mesh.position.y=4.39-roadSink;mesh.receiveShadow=true;scene.add(mesh);
 }
 for(const [x,z,rx,rz,n] of [[202,301,19,6,8],[277,367,25,7,10],[339,298,22,5,9],[401,370,18,7,8],[529,367,24,6,8],[577,300,25,7,11],[735,367,28,7,12],[782,332,9,18,9],[430,441,6,26,8],[498,498,7,26,7],[711,281,7,14,7]]){
  for(let i=0;i<n;i++){
   const dx=x+(rng()-.5)*rx*2,dz=z+(rng()-.5)*rz*2;
   if(i%4===0)sphere(dx,3.8,dz,2.5+rng()*3,1.5+rng(),1.8+rng()*3,i%2?'#a8996e':'#baa786',0,rng());
   else box(dx,4.2,dz,2.2+rng()*6,.4,1.1+rng()*4,['#aebb81','#9eaf73','#b3be84'][i%3],0,rng()*.8);
  }
 }
 // Ground-located weather, beneath actors and roof, rather than
 // screen-space dots or painted puddles toggled solely by rain status.
 function wetLayer(kind,x,z,w,d,y){
  const paper=document.createElement('canvas');paper.width=w;paper.height=d;
  const raw=document.createElement('canvas');raw.width=w;raw.height=d;
  const ctx=raw.getContext('2d'),soft=paper.getContext('2d'),map=new T.CanvasTexture(paper);
  // Canvas filters are optional. Bilinear resampling of the completed
  // mask smooths the cell edges on both modern and older Canvas engines.
  const thumb=document.createElement('canvas');
  thumb.width=Math.ceil(w/3);thumb.height=Math.ceil(d/3);
  const down=thumb.getContext('2d');
  down.imageSmoothingEnabled=soft.imageSmoothingEnabled=true;
  map.colorSpace=T.SRGBColorSpace;map.generateMipmaps=false;
  map.minFilter=T.LinearFilter;map.magFilter=T.LinearFilter;
  const material=new T.MeshBasicMaterial({map,transparent:true,depthWrite:false,alphaTest:.002});
  const mesh=new T.Mesh(new T.PlaneGeometry(w,d),material);
  const [dx,dz]=local(x+w/2,z+d/2);
  mesh.rotation.x=-Math.PI/2;mesh.position.set(dx,y,dz);mesh.visible=false;
  scene.add(mesh);
  return {kind,x,z,w,d,ctx,soft,raw,down,thumb,map,mesh};
 }
 const wetLayers=[wetLayer('road',139,215,681,358,4.63-roadSink),wetLayer('bed',733,403,177,111,1.66)];
 const groundRain=makeGroundRain(T,scene,W,H,pathLoop,GARDEN_SOIL,4.34-roadSink,local);
 let previousMoisture=null;
 function updateWetLayers(moisture){
  if(moisture===previousMoisture)return;
  previousMoisture=moisture;
  for(const {kind,x,z,w,d,ctx,soft,raw,down,thumb,map,mesh} of wetLayers){
   mesh.visible=moisture.some(c=>(c.kind===kind||(kind==='road'&&c.kind==='verge'))&&c.level>0);
   if(!mesh.visible)continue;
   ctx.clearRect(0,0,w,d);
   ctx.save();ctx.translate(-x,-z);
   {
    ctx.beginPath();
    (kind==='bed'?GARDEN_SOIL:pathLoop).forEach(([u,v],i)=>i?ctx.lineTo(u,v):ctx.moveTo(u,v));
    ctx.closePath();ctx.clip();
   }
   drawWetSoil(ctx,moisture,kind);ctx.restore();
   down.clearRect(0,0,thumb.width,thumb.height);
   down.drawImage(raw,0,0,thumb.width,thumb.height);
   soft.clearRect(0,0,w,d);soft.drawImage(thumb,0,0,w,d);map.needsUpdate=true;
  }
 }
 // Bare grass and genuine cast shadows under the wooden bench.
 const wood='#ad8150',edge='#735b41',warm='#d2aa69',cream='#ede0ae';
 for(const x of [190,309]){box(x,15,221,5,30,5,edge);box(x,29,197,5,58,5,edge);}
 for(const z of [205,BENCH_HOME_Z,217,223])woodDetail(250,BENCH_SLAT_CENTER_Y,z,135,BENCH_SLAT_THICKNESS,4,z%2?wood:warm);
 for(const y of [38,47,55])woodDetail(250,y,196,135,5,4,wood);
 function table(x,z,width=64,depth=32){
  for(const dx of [-width*.39,width*.39])for(const dz of [-depth*.36,depth*.36])box(x+dx,14,z+dz,4,28,4,edge);
  box(x,27,z,width,5,depth,wood);
  for(let dz=-depth/2+3;dz<depth/2;dz+=6)box(x,30,z+dz,width-1,.6,4.8,warm);
 }
 table(490,230);
 for(const c of chairs){
  box(c.x,LOUNGE_SEAT_CENTER,c.y,16,LOUNGE_SEAT_DEPTH,13,wood);for(const x of [-5,5])for(const z of [-4,4])box(c.x+x,7,c.y+z,2.6,14,2.5,edge);
  const side=c.id==='left'?-1:1;box(c.x+side*7,24,c.y,3,20,13,wood);
 }
 // Real mossy volumes and two wooden portals lining the distant edge.
 const fenceTint=['#aa8656','#b18c5a','#a98553','#ab895a'];
 const posts=[];
 for(let x=12,j=0;x<950;x+=30,j++){
  const n=(j*29+j*j*9)%29,q=x+(n-14)*.24,z=72+(n%5-2)*.26,h=29+(n%8-4)*.46;
  const lean=(n%7-3)*.01;
  posts.push({x:q,z});
  woodDetail(q,h*.5-1,z,4.5,h,5,fenceTint[j%4],0,0,lean);
  box(q-Math.sin(lean)*h*.48,h-2,z,5.4,2.5+(n%3)*.2,6,j%7===5?'#bb9d71':'#d0ac73',0,n*.021,lean);
 }
 for(const centerY of [10,22]){
  let i=0;
  while(i<posts.length-1){
   const a=posts[i],j=Math.min(i+2+((i*7+centerY)%4),posts.length-1),b=posts[j];
   const rise=((i*17+centerY)%9-4)*.15,offset=(i%3-1)*.32;
   woodDetail((a.x+b.x)*.5,centerY+rise,(a.z+b.z)*.5+offset,b.x-a.x+(i===0?.45:0),2.74,2.6,
    ['#c6a16b','#bd9e68','#c3a671'][i%3],0,.002*(i%3-1),.004*(i%4-1));
   i=j;
  }
 }
 // Painted pasture and 3D brush beyond the original north fence.
 const updateCountryside=makeCountryside({T,scene,W,H,shape,leafMaps:[leafy.material.map,needles.material.map]});
 for(const [i,[x,y,s]] of trees.entries()){
  addOrchardTree({shape:(kind,x,y,z,sx,sy,sz,tint,rx=0,ry=0,rz=0)=>{
   const flex=kind==='trunk'?0:Math.min(1,Math.max(.2,y/(99*s)));
   shape(kind,x,y,z,sx,sy,sz,tint,rx,ry,rz,flex);
  }},x,y+46*s,s*.88,i);
 }
 // One connected surface runs to the south map edge. Its bank is
 // carved by the same outline as the shore atlas; the southern mouth is open.
 const {x:pondX,z:pondZ,w:pondW,h:pondD}=OPEN_POND_UV;
 function pondShape(scale){
  const q=new T.Shape();
  for(const [i,[x,z]] of OPEN_POND_BANK.entries()){
   const u=(x-pondX)*scale,v=(pondZ-z)*scale;
   if(i)q.lineTo(u,v);else q.moveTo(u,v);
  }
  q.closePath();return paintTerrainUV(T,new T.ShapeGeometry(q),pondW,pondD);
 }
 const shelf=new T.Mesh(pondShape(1.035),new T.MeshLambertMaterial({color:'#727d66'}));
 shelf.rotation.x=-Math.PI/2;shelf.position.set(pondX-W/2,.78,pondZ-H/2);
 shelf.receiveShadow=true;scene.add(shelf);
 const paintedWater=pondSurface(T,pondPigment);
 const water=new T.Mesh(pondShape(1),paintedWater.material);
 water.rotation.x=-Math.PI/2;water.position.set(pondX-W/2,2.15,pondZ-H/2);
 water.receiveShadow=true;scene.add(water);
 const rippleGeometry=new T.RingGeometry(.93,1,44);
 const ripples=Array.from({length:12},(_,i)=>{
  const mesh=new T.Mesh(rippleGeometry,new T.MeshBasicMaterial({color:'#e4f0d6',side:T.DoubleSide,transparent:true,opacity:0,depthWrite:false}));
  mesh.rotation.x=-Math.PI/2;mesh.renderOrder=5;mesh.visible=false;scene.add(mesh);return mesh;
 });
 const fishGeometry=new T.PlaneGeometry(1,1);
 const fishImage=(()=>{
  const c=document.createElement('canvas');c.width=64;c.height=32;const g=c.getContext('2d');
  g.fillStyle='#f4e5be';g.beginPath();g.ellipse(34,15,15,7,0,0,Math.PI*2);g.fill();
  g.fillStyle='#bae3d1';g.beginPath();g.moveTo(24,15);g.lineTo(10,8);g.lineTo(13,16);g.lineTo(8,24);g.closePath();g.fill();
  g.fillStyle='#fff4ce';g.beginPath();g.ellipse(37,12,6,2,0,0,Math.PI*2);g.fill();
  const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;return t;
 })();
 const pondFish=['#548e91','#d97d62','#819d63'].map(color=>{
  const mesh=new T.Mesh(fishGeometry,new T.MeshBasicMaterial({map:fishImage,color,side:T.DoubleSide,transparent:true,opacity:.64,depthWrite:false}));
  mesh.visible=false;mesh.rotation.x=-Math.PI/2;mesh.renderOrder=4;scene.add(mesh);return mesh;
 });
 const rainGeometry=new T.PlaneGeometry(.46,8.3);
 const lowRain=new T.InstancedMesh(rainGeometry,new T.MeshBasicMaterial({color:'#e3eee3',transparent:true,opacity:.29,side:T.DoubleSide,depthWrite:false}),112);
 lowRain.visible=false;lowRain.frustumCulled=false;scene.add(lowRain);
 function updatePondLife(close,weather,t,motion){
  const rain=weather==='rain';
  for(const [i,fish] of pondFish.entries()){
   fish.visible=close;
   if(!close)continue;
   const a=(motion?t*.00017:0)+i*2.09;
   fish.position.set(140+Math.sin(a)*67-W/2,2.21,464+Math.cos(a*.83+i)*42-H/2);
   fish.rotation.z=Math.atan2(-.83*Math.sin(a*.83+i)*42,Math.cos(a)*67);
   fish.scale.set(17+i*1.8,7+i*.6,1);
   fish.material.opacity=.53+(rain?0:.12)*(1+Math.sin(a*2))*.5;
  }
  lowRain.visible=close&&rain&&motion;
  for(let i=0;i<ripples.length;i++){
   const ripple=ripples[i];
   ripple.visible=close&&motion&&(rain||i<3);
   if(!ripple.visible)continue;
   const duration=rain?1600:3400,shifted=t+(i*719),cycle=Math.floor(shifted/duration),u=shifted%duration/duration;
   const x=55+((i*49+cycle*83)%183),z=411+((i*31+cycle*23)%107),radius=1+u*(rain?9:18);
   if(![[-radius,0],[radius,0],[0,-radius],[0,radius]].every(([dx,dz])=>insidePolygon(x+dx,z+dz,OPEN_POND_BANK))){ripple.visible=false;continue;}
   ripple.position.set(x-W/2,2.23+i*.001,z-H/2);
   ripple.scale.set(radius,radius,1);
   ripple.material.opacity=(rain?.39:.28)*Math.sin(u*Math.PI)*(.9-u*.45);
  }
  if(lowRain.visible){
   for(let i=0;i<lowRain.count;i++){
    const phase=(t*(.12+i%3*.014)+i*47.13)%130;
    const x=18+(i*73%680)+(130-phase)*.14,z=174+(i*107%405);
    model.position.set(x-W/2,131-phase,z-H/2);
    model.rotation.set(0,facingYaw,-.13);model.scale.set(1,.58+i%3*.24,1);model.updateMatrix();
    lowRain.setMatrixAt(i,model.matrix);
   }
   lowRain.instanceMatrix.needsUpdate=true;
  }
 }

 const outletStones=[[8,446],[23,432],[34,421],[51,414],[71,408],
  [196,570],[199,552],[207,537],[220,525]];
 for(let i=0;i<17;i++){
  const [x,z]=i%2?[42+i*12.2,399+Math.sin(i*1.32)*4]:outletStones[i>>1];
  sphere(x,1,z,6+rng()*6,3+rng()*3,5+rng()*3,i%3?'#a29e7d':'#bbb18d',0,rng());
 }
 for(let i=0;i<14;i++){
  const z=403+i*8.8,east=255-Math.max(0,Math.abs(z-467)-12)*.56;
  for(const [x,y] of [[8+i*9.4,447-47*Math.sin(Math.min(1,(8+i*9.4)/129)*Math.PI/2)],[east,z]] )sphere(x+Math.sin(i*2.17)*2.9,2,y,4.4,3+rng()*3,6,'#a6a788',0,rng());
 }
 // Roll legacy grass and flower positions to keep the independent prop
 // seed stable. The actual beds below use their own small seeded variations.
 for(const n of [9,7,8,4,5,7,7,8,8])for(let i=0;i<n;i++)for(let j=0;j<5;j++)rng();
 for(let i=0;i<5*14*4;i++)rng();
 // Three related border types. Each patch stays near a bank, tree, fence or
 // tended edge. Quiet open turf gives the little flower heads room to read.
 const beds=[
  {x:181,z:287,w:24,d:7,n:29,hue:['#fff2db','#f0ca6d','#e99cb2'],angle:-.08},
  {x:548,z:278,w:30,d:8,n:31,hue:['#f6e8bd','#edafbf','#f7d57c'],angle:.16},
  {x:351,z:263,w:24,d:10,n:33,hue:['#e7a5b5','#efd471','#fff2d4'],angle:-.16},
  {x:268,z:416,w:11,d:15,n:19,hue:['#fff5db','#f2d977','#ecb3c0'],angle:.31},
  {x:250,z:497,w:10,d:20,n:24,hue:['#f0e7c0','#e9d7a8','#f8dec7'],angle:-.38},
  {x:40,z:412,w:14,d:9,n:14,hue:['#eee0ba','#f2d0be','#e5cdc0'],angle:.18},
  {x:867,z:296,w:19,d:9,n:19,hue:['#e7a1b6','#c9bfdc','#fff0c9'],angle:.42},
  {x:724,z:456,w:10,d:20,n:24,hue:['#eba4b5','#f1d185','#d8c7e4'],angle:-.28},
  {x:919,z:494,w:9,d:15,n:18,hue:['#efc9b7','#f2e2bf','#e5c5d2'],angle:.25}
 ];
 for(const {x,z,w,d,n,hue,angle} of beds){
  const c=Math.cos(angle),s=Math.sin(angle);
  for(let i=0;i<n;i++){
   const phase=i*2.399963,rad=Math.sqrt((i+.25)/n)*(.85+.115*Math.sin(i*1.31));
   const u=Math.cos(phase)*w*rad,v=Math.sin(phase)*d*rad;
   const a=x+u*c-v*s,b=z+u*s+v*c;
   if(pathAt(a,b)||insidePolygon(a,b,GARDEN_SOIL))continue;
   const h=2.8+(i*7%13)*.20,seed=x+z+i;
   if(i%3!==0){
    shape('trunk',a,h*.50+.46,b,.59,h*.93,.59,'#8caa68',0,0,.11*Math.cos(phase));
    verge.flower(a,h+.63,b,hue[(i*5)%3],seed,.99+(i%4)*.13);
   }else verge.tuft(a,b,h+.56,i%2?'#8fa86c':'#9aaf74',seed);
  }
 }
 for(const [x,z] of [[72,527],[303,548],[551,549],[901,533],[930,518],[355,348]]){
  sphere(x,2,z,4+rng()*6,2+rng()*3,3+rng()*5,'#aaab8a',0,rng());
  if(x!==355)sphere(x+7,3,z+4,6,4,3,'#929b81',0,rng());
 }
 // One tended bed, with two shallow rows and a narrow darker furrow.
 const gardenOutline=new T.Shape();
 GARDEN_SOIL.forEach(([x,z],i)=>i?gardenOutline.lineTo(x-821,460-z):gardenOutline.moveTo(x-821,460-z));
 gardenOutline.closePath();
 const gardenPatch=new T.Mesh(paintTerrainUV(T,new T.ShapeGeometry(gardenOutline),179,108),
  new T.MeshPhongMaterial({map:soilPigment,bumpMap:soilPigment,bumpScale:.43,shininess:2,specular:'#46382a',color:'#bda083'}));
 gardenPatch.rotation.x=-Math.PI/2;gardenPatch.position.set(821-W/2,1.19,460-H/2);
 gardenPatch.receiveShadow=true;scene.add(gardenPatch);
 const soilVert=[],soilColor=[],soilUV=[],soilIndices=[],sections=ROW_SECTION.length,count=20;
 const clayTint=new T.Color('#dcc099');
 for(const row of GARDEN_ROWS){
  const start=soilVert.length/3;
  for(let i=0;i<=count;i++)for(const [offset,lift,shade] of ROW_SECTION){
   const [x,y,z]=rowPoint(row,i/count,offset,lift);
   const grain=shade+.038*Math.sin(x*.31+z*.67);
   soilVert.push(x-W/2,y,z-H/2);soilColor.push(clayTint.r*grain,clayTint.g*grain,clayTint.b*grain);
   soilUV.push((x-731)/179,(z-404)/108);
  }
  for(let i=0;i<count;i++)for(let j=0;j<sections-1;j++){
   const a=start+i*sections+j,b=a+sections;
   soilIndices.push(a,a+1,b,b,a+1,b+1);
  }
 }
 const rows=new T.BufferGeometry();
 rows.setAttribute('position',new T.Float32BufferAttribute(soilVert,3));rows.setAttribute('color',new T.Float32BufferAttribute(soilColor,3));
 rows.setAttribute('uv',new T.Float32BufferAttribute(soilUV,2));rows.setIndex(soilIndices);rows.computeVertexNormals();
 const rowMesh=new T.Mesh(rows,new T.MeshPhongMaterial({map:soilPigment,bumpMap:soilPigment,bumpScale:.33,
  shininess:2,specular:'#443420',vertexColors:true}));rowMesh.receiveShadow=true;scene.add(rowMesh);
 // Narrow rake traces and little places where the warm surface dries first.
 // The six actual flower positions remain independent of the border art.
 for(const {center:y,start:x,end,seed} of GARDEN_ROWS){
  for(let i=0;i<27;i++){
   const xx=x+6+i*(end-x-12)/26,zz=y+Math.sin(i*.89+seed)*2;
   sphere(xx,1.62,zz,1.22+(i*7%5)*.24,.027+(i%3)*.024,1.65,
    ['#b39367','#a1855f','#c9a77a','#ad916b'][i%4],0,i*.21);
  }
 }
 // Weathered stones are worked into the hem in a few places, not stacked
 // as a rigid frame around each planting slot.
 for(const [i,[x,z]] of [[745,426],[741,440],[739,451],[739,472],[747,491],
  [757,498],[773,502],[788,503],[805,504],[854,503],[870,502],[884,499],[898,490],[903,474]].entries()){
  const w=1.7+(i*7%6)*.43;
  sphere(x,1.15,z,w,.52+(i%4)*.23,w*.61,['#a49b80','#aaa087','#9f9577','#b2a48a'][i%4],0,i*.81);
 }
 // House is a real small chalet: façade and all roof meshes share the same
 // local origin, actor contact coordinates and approach as the pixel original.
 const cx=room.x+96,fr=room.depth-2,cy=fr-38;
 markingHouse=true;
 box(cx,5,cy,148,10,82,'#9c8d6b');
 box(cx,42,cy,140,72,76,'#e4c58e');
 for(let y=15;y<79;y+=9){
  box(cx,y,fr+1,140,.8,1.1,'#be9b61');box(cx+70,y,cy,.9,.8,75,'#aa8654');
 }
 for(const x of [cx-68,cx+68])box(x,44,fr+2,5,73,4,edge);
 // Front door keeps the original hit region and a distinct knob instead of a CSS hotspot.
 box(cx,31,fr+1,44,61,4,'#947449');box(cx,30,fr+4,35,57,3,'#4d7968');
 for(const y of [20,40]){box(cx,y,fr+6,26,15,1,'#3f6253');box(cx,y+1,fr+7,22,12,1,'#658d72');}
 sphere(cx+11,30,fr+8,2.1,2.2,1.1,'#eac078');
 for(const x of [cx-45,cx+45]){
  box(x,46,fr+3,26,28,3,edge);shape('window-glass',x,46,fr+5,21,23,1.6,'#b8a581');box(x,46,fr+7,2.1,22,1.2,cream);box(x,46,fr+7,21,2,1.2,cream);box(x,33,fr+7,30,3,7,warm);
 }
 for(const z of [cy-15,cy+12]){box(cx+71,47,z,2,23,21,edge);box(cx+73,47,z,1,19,17,'#84aaa2');box(cx+74,47,z,1,19,2,cream);box(cx+74,47,z,1,2,17,cream);}
 // The west wall faces the pond camera; give it real depth instead of a blank
 // wash. Elements attach flush to the existing wall and are drawn in the
 // normal house batches (not navigation geometry).
 const west=cx-70;
 for(const z of [cy-34,cy+33]){
  woodDetail(west-1.5,42,z,3.5,70,4.4,'#906b4e');
  box(west-3.28,42,z-.61,.33,65,1,'#b38a61');
 }
 for(const y of [12,67])woodDetail(west-1.45,y,cy,3.35,3.8,68,'#997451');
 for(const z of [cy-14,cy+16]){
  box(west-1.35,42,z,2.8,23,20,'#846549');
  shape('window-glass',west-3.1,42,z,.9,18,15,'#a3a995');
  box(west-3.65,42,z,1.15,19,1.45,'#d2b386');
  box(west-3.65,42,z,1.15,1.55,15,'#d9b78a');
  woodDetail(west-3.05,31,z,6.6,2.4,23,'#aa875e');
  for(const k of [-1,1]){
   woodDetail(west-2.25,42,z+k*12,2.15,21,4.7,'#657862');
   box(west-3.55,42,z+k*12,.62,1.1,4.7,'#4a5b4b');
  }
 }
 for(let course=0;course<2;course++){
  let z=-35;
  for(let j=0;z<35;j++){
   const n=Math.min(35-z,5+(j*13+course*9)%10);
   box(west-.92,3+course*4.3,cy+z+n/2,1.10,3.7,n-.35,
    ['#958674','#afa18a','#998d78','#b3a28a'][(j+course*3)%4]);
   z+=n;
  }
 }
 // True gables are triangular meshes, roof slopes are thick tiled slabs.
 const gable=new T.Shape();gable.moveTo(-70,0);gable.lineTo(70,0);gable.lineTo(0,43);gable.closePath();
 const gg=new T.ExtrudeGeometry(gable,{depth:76,bevelEnabled:false});
 const gm=new T.Mesh(gg,new T.MeshLambertMaterial({color:'#dbb77c',flatShading:true}));gm.position.set(cx-W/2,78,cy-38-H/2);gm.castShadow=true;gm.receiveShadow=true;scene.add(gm);houseMesh.add(gm);
 const slope=.52;
 for(const s of [-1,1]){
  box(cx+s*39,100,cy,91,7,96,'#8d604d',0,0,-s*slope);
  for(let row=0;row<7;row++)for(let tile=0;tile<7;tile++){
   const offset=6+row*11;
   const wear=((row*19+tile*11+s*23)%8+8)%8;
   clayDetail(cx+s*offset,128-offset*.56+(wear-3.5)*.13,cy-42+tile*13+(row%2)*2+(wear-3.5)*.24,11.8,2.1+wear*.09,12.6,
    ['#ac795e','#bb8268','#a46e5a','#bd8a6b'][(row*3+tile+(s>0?1:0))%4],0,(wear-3.5)*.006,-s*slope);
  }
  box(cx+s*39,100,fr+10,91,4,4,'#c59d69',0,0,-s*slope);
 }
 // Individual ridge caps press down onto the two slopes. The
 // old straight support is still beneath them so no roof gap can peek through.
 box(cx,129.5,cy,4,2.5,98,'#8a604f');
 for(let j=0;j<9;j++){
  const z=cy-43.2+j*10.8,odd=(j*5)%7;
  clayDetail(cx+(odd-3)*.15,131+(odd-3)*.074,z,5.7,3.2,10.68,
   j%3===1?'#bf8f70':'#ad795f',0,(odd-3)*.013,0);
 }
 box(cx-25,120,cy-19,12,33,13,'#aa7856');box(cx-25,138,cy-19,16,4,17,'#d3a77a');
 const eye=new T.Mesh(new T.CylinderGeometry(8,8,2,10),new T.MeshLambertMaterial({color:'#8daaaa'}));eye.rotation.x=Math.PI/2;eye.position.set(cx-W/2,96,fr+1-H/2);scene.add(eye);houseMesh.add(eye);
 // Timber tie beam and carved rafter cheeks at the original gable line.
 // Thin layers are still real house instances, never a new interaction zone.
 woodDetail(cx,76.3,fr+1.9,131,5.2,3.3,'#8f694d');
 box(cx,78.5,fr+3.7,128,1.15,.65,'#ba9469');
 for(const s of [-1,1]){
  woodDetail(cx+s*41,87.8,fr+1.9,24,3.3,2.9,'#9b7551',0,0,-s*.55);
  box(cx+s*58,74,fr+3.9,3,5.5,1.0,'#704c3b');
 }
 // Pair of carefully fitted, outward-opening shutters and the shadows cast
 // by the sill supports. Existing glass, sash divisions and lights remain.
 for(const x of [cx-45,cx+45])for(const s of [-1,1]){
  const q=x+s*16.95;
  woodDetail(q,46.1,fr+2.9,6.8,26,2.5,'#5e715d');
  box(q-s*2.4,46.1,fr+4.3,.75,24,.7,'#89937b');
  for(const y of [41,51])box(q,y,fr+4.6,6.1,1.2,.8,'#3e5048');
  box(x+s*8,30.45,fr+7,2.5,3.1,2.6,'#8f6d4b',0,0,.19*s);
 }
 // Two staggered courses of hand-cut plinth stones. The original solid
 // block remains as mortar and the step/walk footprint is untouched.
 const stones=['#9b9280','#b1a48b','#a59984','#b6ab95'];
 for(let row=0;row<2;row++){
  let x=-69;
  for(let i=0;x<69;i++){
   const width=Math.min(69-x,8+(i*7+row*5)%12);
   box(cx+x+width/2,2.6+row*4.25,fr+3.16,width-.45,3.7,.85,stones[(i*3+row)%stones.length]);
   x+=width;
  }
 }
 box(cx,96,fr+3,2,12,1.5,cream);box(cx,96,fr+3,12,2,1.5,cream);
 for(const [dy,w] of [[8,52],[16,46],[24,39]])box(cx,3,fr+dy,w,6,7,wood);
 markingHouse=false;
 plane(cx-25,fr+20,2.9,73,24,'#3e503e',.26);
 // Rural story clusters: firewood and a rain barrel by the cabin;
 // a patched bank fence and stepping-stone alcove at the pond; little
 // clover, shrubs and gravel at the garden. All lie off interaction routes.
 box(754,3,213,30,5,14,'#8c7554');
 for(const [x,z,k] of [[744,210,0],[752,210,1],[760,210,2],[749,216,3],[756,216,4]]){
  shape('trunk',x,7+(k>2?3:0),z,6,17,6,k%2?'#946e4c':'#aa8058',Math.PI/2);
  box(x,7+(k>2?3:0),z+8.3,3,2.3,.4,'#cfaa76');
 }
 shape('trunk',770,7,221,10,16,10,'#9a774e');
 box(770,14.5,221,9.6,1.2,8.1,'#ad9064');
 for(const yy of [4.5,11.5])box(770,yy,225,7,1.1,1.1,'#706957');
 // Tended cottage planting: overlapping lower broad-leaf plants and a
 // cushion of small foliage, with a clean gap at every part of the doorstep.
 for(let i=0;i<10;i++)rng(); // preserve unrelated deterministic scenery
 const cottageBeds=[
  {x:cx-90,z:fr-15,w:18,d:10,a:-.35,seed:21},
  {x:cx-79,z:fr+6,w:13,d:8,a:.25,seed:32},
  {x:cx+97,z:fr-8,w:17,d:9,a:.33,seed:43},
  {x:cx+90,z:fr+11,w:10,d:7,a:-.19,seed:56}
 ];
 for(const {x,z,w,d,a,seed} of cottageBeds){
  const west=x<cx,deep=west?['#749059','#839f60','#9eb676','#68874d','#8ca66a']:['#74955d','#88a768','#a8bd7e','#648651','#94ac72'];
  verge.shrub(x,z,w*.57,d*.62,west?13:10,seed,deep);
  verge.shrub(x+w*.52,z+d*.13,w*.40,d*.54,west?9:8,seed+8,deep);
  const c=Math.cos(a),s=Math.sin(a);
  for(let i=0;i<29;i++){
   const angle=i*2.399963+seed*.2,k=Math.sqrt((i+.5)/29);
   const u=w*k*Math.cos(angle),v=d*k*Math.sin(angle);
   const xx=x+u*c-v*s,zz=z+u*s+v*c;
   if(pathAt(xx,zz)||Math.abs(xx-cx)<56)continue;
   verge.cover(xx,zz,seed+i,1.08+(i*7%11)*.085);
   if(i%5===0)verge.tuft(xx,zz,3.2+(i%4)*.28,deep[i%deep.length],seed+i);
   if(i%8===3)verge.flower(xx,3.0,zz,west?'#f0d8bf':'#e8c3c4',seed+i,.66);
  }
 }
 for(const [x,z,len]of[[14,382,27],[17,360,24],[22,413,24]]){
  for(const dx of [-9,9])box(x+dx,8,z,2.6,17,3,'#9d8159');
  box(x,11,z,len,2.2,2,'#b4976a',0,(z%3-1)*.17,.055);
 }
 for(const [x,z,sz] of [[21,395,7],[28,401,5],[34,395,5],[271,402,7],[281,393,6],[275,396,4],[722,437,5],[723,445,5],[907,406,5],[916,412,6],[916,421,4],[739,512,6]]){
  sphere(x,2,z,sz,2.1,sz*.62,'#a49d78',.1,rng());
 }
 for(const [x,z,green]of[[350,252,'#94a879'],[355,253,'#7e9c68'],[364,249,'#a2ae75'],[329,455,'#88a472'],[337,460,'#a1b179'],[698,479,'#8ea779'],[706,483,'#a6b47c'],[710,476,'#859d6a'],[912,511,'#91a573'],[920,516,'#859c6d']]){
  sphere(x,3.8,z,7+rng()*5,5+rng()*2,7,green,.16,rng());
  for(let j=0;j<3;j++){const xx=x+j*4-3,zz=z+8+j%2;verge.tuft(xx,zz,4.0,'#809f6b',x+z+j);if(j%2===0)verge.flower(xx,3.2,zz,'#ecdb9f',x+z+j,.54);}
 }
 // Fresh growth at the edges only; flowers, route and plot stay readable.
 for(const [x,z,hue,s] of [[35,381,0,1],[257,378,1,.83],[274,389,0,.74],[718,451,1,.90],
  [711,466,2,.79],[908,443,0,.72],[922,467,1,1]]){
  const colours=['#638344','#77974e','#87a958'];
  for(let j=0;j<4;j++){
   const theta=j*1.73+z*.05,width=(10+j%2*3)*s;
   shape('orchard-leaf',x+Math.cos(theta)*6*s,(6+j%3*2)*s,z+Math.sin(theta)*5*s,
    width,width*1.20,1,colours[(hue+j)%3],-.34-j*.17,theta,.33*Math.sin(theta));
  }
 }
 // Leafy ground cover, rather than upright weed blades, blends the
 // planted beds into the lawn. It groups around shade and beds, not traffic.
 for(const [x,z,w,d,n] of [[145,240,29,12,38],[355,264,34,15,52],[245,423,17,15,26],
  [864,297,21,12,38],[720,452,16,20,34],[905,481,13,22,39],[770,266,13,10,21]]){
  for(let i=0;i<n;i++){
   const a=i*2.399963,r=Math.sqrt((i+.28)/n)*(.88+.12*Math.sin(i*2.18));
   const xx=x+Math.cos(a)*w*r,zz=z+Math.sin(a)*d*r;
   if(pathAt(xx,zz)||insidePolygon(xx,zz,GARDEN_SOIL))continue;
   verge.cover(xx,zz,x+z+i,.58+(i*7%10)*.093);
  }
 }
 verge.finish();
 // Wooden stand is another readable full-volume landmark.
 box(stand.x,22,stand.y,4,42,4,edge);
 for(const xx of [-12,12])box(stand.x+xx*.53,7,stand.y+3,3,21,3,wood,0,0,xx>0?.54:-.54);
 box(stand.x,42,stand.y,42,21,4,wood,-.19);
 for(const x of [-9,9])box(stand.x+x,43,stand.y+2.5,16,17,1.5,'#f1deb1',-.19);
 for(let i=0;i<4;i++)for(const dx of [-9,9])box(stand.x+dx,40+i*3,stand.y+3.5,12,.5,1,'#af9a6e',-.19);
 addCabinAndPondCraft({box,sphere,shape},room);
 addBenchGardenCraft({box,sphere,shape},stand);
 const updateShore=addShoreCraft({T,scene,W,H,trees,room,shape});
 const swaying=[];
 for(const [kind,items] of batches){
  const batch=new T.InstancedMesh(geometry[kind],kind==='orchard-leaf'?leafyMaterial:kind==='orchard-needle'?needles.material:kind==='trunk'?barkMaterial:kind==='window-glass'?windowGlass:kind==='weathered-board'?boardSkin:kind==='fired-clay'?claySkin:material,items.length);
  const houseIds=new Set();
  items.forEach(([matrix,tint,flex,x,z,house],i)=>{
   if(house)houseIds.add(i);
   batch.setMatrixAt(i,matrix);batch.setColorAt(i,color.set(tint));
   if(flex>0)swaying.push({batch,i,base:matrix,flex,x,z,seed:x*.006+z*.012});
  });
  if(houseIds.size)houseInstances.set(batch,houseIds);
  batch.instanceMatrix.needsUpdate=true;batch.instanceColor.needsUpdate=true;batch.castShadow=true;batch.receiveShadow=true;scene.add(batch);
 }
 // Rain spilling from the little porch gutter is 3D detail, not extra
 // ground cells or an overlay. The main rain system still owns wetness.
 const eaveDrops=new T.InstancedMesh(geometry.sphere,new T.MeshBasicMaterial({color:'#cbdaca',
  transparent:true,opacity:.66,depthWrite:false}),6);
 eaveDrops.frustumCulled=false;eaveDrops.visible=false;scene.add(eaveDrops);
 const eaveAnchors=[cx-84.4,cx+84.4].map(v=>local(v,cy+49));
 function updateEaveDrops(weather,now){
  eaveDrops.visible=weather==='rain';if(!eaveDrops.visible)return;
  for(let i=0;i<6;i++){
   const [x,z]=eaveAnchors[i%2],u=((now+i*271)%1650+1650)%1650/1650;
   model.position.set(x,81-u*u*76,z+u*u*1.5);
   model.rotation.set(0,0,0);model.scale.set(.32,.9+u*1.12,.33);model.updateMatrix();
   eaveDrops.setMatrixAt(i,model.matrix);
  }
  eaveDrops.instanceMatrix.needsUpdate=true;
 }
 let leafStep=-1,shadowStep=-1,leafWeather='';
 const bent=new T.Matrix4();
 function swayCrowns(now,weather,allowed){
  const steptime=allowed?Math.floor(now/54):-2;
  if(steptime===leafStep&&leafWeather===weather)return;
  leafStep=steptime;leafWeather=weather;
  const t=allowed?steptime*54:0;
  const updated=new Set();
  for(const {batch,i,base,flex,x,z,seed} of swaying){
   bent.copy(base);
   const bend=flex*flex*(breezeAt(t,x,z,weather,allowed)*1.34+(allowed?.21*Math.sin(t*.0016+seed):0));
   bent.elements[12]+=bend;bent.elements[14]+=.48*bend;
   batch.setMatrixAt(i,bent);updated.add(batch);
  }
  for(const batch of updated)batch.instanceMatrix.needsUpdate=true;
  const stamp=allowed?Math.floor(now/118):-2;
  if(stamp!==shadowStep){shadowStep=stamp;renderer.shadowMap.needsUpdate=true;}
 }
 const sprites=new Map();
 const spriteSheet=(id,w,h)=>{
  if(sprites.has(id))return sprites.get(id);
  const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;
  const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;texture.magFilter=T.NearestFilter;texture.minFilter=T.NearestFilter;texture.generateMipmaps=false;
  // True depth-tested billboards, with geometry chosen so the pixel
  // silhouettes stay vertical even under the oblique view.
  const mat=new T.MeshBasicMaterial({map:texture,alphaTest:.22,depthWrite:true,transparent:false,fog:false,side:T.DoubleSide});
  const quad=new T.BufferGeometry(),h3=h/VIEW_Z;
  quad.setAttribute('position',new T.Float32BufferAttribute([-w/2,0,0,w/2,0,0,w/2,h3,0,-w/2,h3,0],3));
  quad.setAttribute('uv',new T.Float32BufferAttribute([0,0,1,0,1,1,0,1],2));
  quad.setIndex([0,1,2,0,2,3]);
  const sprite=new T.Mesh(quad,mat);
  const res={canvas,ctx:canvas.getContext('2d'),texture,sprite};scene.add(sprite);sprites.set(id,res);return res;
 };
 function drawSprite(id,x,y,w,h,paint,lift=0){
  const sheet=spriteSheet(id,w,h);
  sheet.sprite.visible=true;sheet.sprite.position.set(x-W/2,lift,y-H/2);
  const c=sheet.ctx;c.setTransform(1,0,0,1,0,0);c.clearRect(0,0,w,h);
  c.translate(w/2-x,h-1-y);paint(c);sheet.texture.needsUpdate=true;
 }
 const v=new T.Vector3(),ray=new T.Raycaster(),ground=new T.Plane(new T.Vector3(0,1,0),0),ndc=new T.Vector2();
 const project=(x,z,h=0)=>{
  v.set(x-W/2,h,z-H/2).project(camera);
  return {x:(v.x+1)*W/2,y:(1-v.y)*H/2,depth:v.z};
 };
 function inverse(x,y){
  ndc.set(x/W*2-1,1-y/H*2);ray.setFromCamera(ndc,camera);
  return ray.ray.intersectPlane(ground,sample)?{x:sample.x+W/2,y:sample.z+H/2}:null;
 }
 const nearPoint=new T.Vector3(),farPoint=new T.Vector3(),roomRay=new T.Raycaster(),spritePixels=new Map();
 function houseHit(x,y){
  if(!alive||camera!==mapCamera||x<room.x-24||x>room.x+room.w+24||y<0||y>room.depth+27)return false;
  const sx=x/W*2-1,sy=1-y/H*2;
  // This town camera has a sheared projection. Use two unprojected points,
  // not the default orthographic camera direction, to match the actual pixel.
  nearPoint.set(sx,sy,-1).unproject(camera);farPoint.set(sx,sy,1).unproject(camera);
  roomRay.ray.set(nearPoint,farPoint.sub(nearPoint).normalize());
  scene.updateMatrixWorld(true);
  spritePixels.clear();for(const {sprite,canvas,ctx} of sprites.values())spritePixels.set(sprite,{canvas,ctx});
  const eligible=scene.children.filter(o=>o.visible&&(o.isMesh||o.isGroup));
  for(const hit of roomRay.intersectObjects(eligible,true)){
   const o=hit.object,mat=Array.isArray(o.material)?o.material[hit.face?.materialIndex??0]:o.material;
   let visible=true;for(let p=o;p;p=p.parent)if(!p.visible){visible=false;break;}
   if(!visible||!mat||mat.visible===false||mat.colorWrite===false||mat.transparent||mat.depthWrite===false)continue;
   const sprite=spritePixels.get(o);
   if(sprite&&hit.uv){
    const {canvas,ctx}=sprite,c=t=>Math.min(1-1e-8,Math.max(0,t));
    if(ctx.getImageData(Math.floor(c(hit.uv.x)*canvas.width),Math.floor(c(1-hit.uv.y)*canvas.height),1,1).data[3]/255<mat.alphaTest)continue;
   }
   return houseMesh.has(o)||houseInstances.get(o)?.has(hit.instanceId)===true;
  }
  return false;
 }
 const dryMoisture=Object.freeze([]);
 let alive=true,lastWeather='',lastLight=null;
 function discard(){
  if(!alive)return;
  alive=false;
  const resources=new Set(Object.values(horizons).filter(Boolean));
  scene.traverse(o=>{if(o.geometry)resources.add(o.geometry);if(o.material){for(const m of Array.isArray(o.material)?o.material:[o.material]){resources.add(m);if(m.map)resources.add(m.map);}}});
  for(const res of resources)res.dispose();
  renderer.dispose();onLoss?.();
 }
 output.addEventListener('webglcontextlost',e=>{e.preventDefault();discard();},{once:true});
 return Object.freeze({output,project,inverse,houseHit,drawSprite,footmarks,
  hideSprites(){for(const s of sprites.values())s.sprite.visible=false;},
  render(weather,moisture=dryMoisture,now=Date.now(),motion=true,view='play',clock=0){
   if(!alive)return false;
   const close=view==='pond';
   camera=close?pondCamera:mapCamera;
   for(const {sprite} of sprites.values()){
    sprite.rotation.y=close?Math.atan2(pondCamera.position.x-sprite.position.x,pondCamera.position.z-sprite.position.z):0;
   }
   updateGrass(clock,weather,motion);
   updateShore(weather,close);
   updateCountryside(close,clock,motion);
   const sky=weather==='rain'||weather==='breeze'?weather:'sun';
   if(close&&!horizons[sky])horizons[sky]=makePondHorizon(T,sky);
   scene.background=close?horizons[sky]:mapBackground;
   if(weather!==lastWeather){
    lastWeather=weather;
    mapBackground.set(weather==='rain'?'#dcd8cd':'#eee5d6');
    sun.intensity=weather==='sun'?1.98:weather==='breeze'?1.47:.65;
    sun.color.set(weather==='rain'?'#ffeac9':weather==='breeze'?'#ffe5bf':'#ffecc9');
    fill.intensity=weather==='rain'?1.99:1.48;
    porchFill.intensity=weather==='rain'?.40:.48;
    fill.color.set(weather==='rain'?'#f2f5e8':'#fbf2de');
    windowGlass.emissiveIntensity=weather==='rain'?.76:.32;
    renderer.shadowMap.needsUpdate=true;
   }
   const lamp=townSunVector(now);
   if(!lastLight||Math.hypot(lamp.x-lastLight.x,lamp.y-lastLight.y,lamp.z-lastLight.z)>=1.8){
    sun.position.set(lamp.x,lamp.y,lamp.z);lastLight=lamp;
    renderer.shadowMap.needsUpdate=true;
   }
   paintedWater.update(now,weather,lamp,motion);
   updatePondLife(close,weather,clock,motion);
   swayCrowns(clock,weather,motion);
   // Wet the bevel itself, not just a flat sheet above it.
   pathMesh.material.color.lerpColors(dryTrail,wetTrail,groundRain(clock,weather,motion));
   updateEaveDrops(weather,motion?now:0);
   updateWetLayers(moisture);
   renderer.render(scene,camera);return true;
  },
  stats:()=>({calls:renderer.info.render.calls,triangles:renderer.info.render.triangles}),
  discard
 });
}
