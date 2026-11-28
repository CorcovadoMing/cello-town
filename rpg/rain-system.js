import {umbrellaPose,umbrellaTop,canopyCoversGround,umbrellaGroundCovers,umbrellaGroundRadius} from './rain-geometry.js?v=35';
export const RAIN_COUNT=126;
const rainHash=n=>{n=Math.imul(n^(n>>>16),0x7feb352d);n=Math.imul(n^(n>>>15),0x846ca68b);return(n^(n>>>16))>>>0;};
// Pure segment sampler shared by visible hits and soil events. Earliest hit wins.
export function firstRainHit(x,fromY,toY,groundY,canopies=[],umbrellas=[]){
 let y=groundY,kind='ground';
 for(const c of canopies){if(!canopyCoversGround(c,groundY))continue;const ix=Math.floor(x-c.left),cy=ix>=0&&ix<c.columns.length?c.columns[ix]:Infinity;if(cy>=fromY&&cy<=y){y=cy;kind=c.kind;}}
 for(const u of umbrellas){if(!umbrellaGroundCovers(u,x,groundY))continue;const uy=umbrellaTop(u,x);if(uy>=fromY&&uy<=y){y=uy;kind='umbrella';}}
 return toY>=y?{x,y,kind}:null;
}
export function createRainSystem({canopies=[],excludeRects=[],seed=0}={}){
 const drops=Array.from({length:RAIN_COUNT},(_,id)=>({id,phase:'rest',cycle:0,born:0,x:0,y:-24,landingX:0,landingY:0,progress:0}));
 const contacts=[],umbrellas=[],frame={drops,contacts,umbrellas,groundHitAt(x,y){
  if(excludeRects.some(r=>x>=r.x&&x<=r.x+r.w&&y>=r.y&&y<=r.y+r.h))return {x,y,kind:'excluded'};
  return firstRainHit(x,-24,y,y,canopies,umbrellas);
 },moistureExposureAt(x,y){
  // Solid/tree shelters still use their original depth and silhouette checks.
  if(excludeRects.some(r=>x>=r.x&&x<=r.x+r.w&&y>=r.y&&y<=r.y+r.h))return 0;
  if(firstRainHit(x,-24,y,y,canopies,[]).kind!=='ground')return 0;
  let exposure=1;
  for(const u of umbrellas){
   const r=umbrellaGroundRadius(u,x,y);
   // A dry core, soft rounded transition and stable irregular splash fingers.
   const ripple=.055*Math.sin(x*.49+y*.31)+.035*Math.sin(y*.83-x*.21);
   const t=Math.max(0,Math.min(1,(r-.55+ripple)/.60));
   exposure=Math.min(exposure,t*t*(3-2*t));
  }
  return exposure;
 },actorOpen:[0,0],actorGrip:[0,0],actorStage:['closed','closed']};
 let onset=null,last=null;
 function reset(d,born){d.born=born;d.phase='rest';const n=Math.imul(d.id+1,73856093)^Math.imul(d.cycle+1,19349663)^(seed>>>0);d.landingX=22+rainHash(n)%916;d.landingY=150+rainHash(n^0x9e3779b9)%410;d.depth=d.landingY<300?0:d.landingY<400?1:2;d.fallDuration=[650,580,510][d.depth];d.length=[12,15,18][d.depth];d.width=[1,1.3,1.6][d.depth];d.opacity=[.43,.54,.66][d.depth];d.x=d.landingX;d.y=-24;d.excluded=excludeRects.some(r=>d.x>=r.x&&d.x<=r.x+r.w&&d.landingY>=r.y&&d.landingY<=r.y+r.h);}
 return {sample(time,key,actors=[],reduced=false){
  contacts.length=0;umbrellas.length=0;
  if(key!=='rain'){onset=null;last=time;frame.actorOpen.fill(0);frame.actorGrip.fill(0);frame.actorStage.fill('closed');for(const d of drops)d.phase='rest';return frame;}
  if(onset===null){onset=time;for(const d of drops){d.cycle=0;reset(d,time+d.id*7);}}
  const age=time-onset;
  for(let i=0;i<2;i++){const delay=i===0?450:1450;const q=reduced?1:Math.max(0,Math.min(1,(age-delay)/420));frame.actorOpen[i]=q;frame.actorGrip[i]=reduced?1:Math.max(0,Math.min(1,(age-delay+300)/300));frame.actorStage[i]=q>=1?'open':age>=delay?'opening':age>=delay-300?'prepare':'closed';if(actors[i]&&q>0)umbrellas.push(umbrellaPose(actors[i],q));}
  if(reduced){for(const d of drops)d.phase='rest';last=time;return frame;}
  const dt=last===null?0:time-last;
  for(const d of drops){
   if(dt<0||dt>1000){reset(d,time+d.id*7);continue;}
   if(d.phase==='impact'){
    d.progress=(time-d.hitAt)/250;if(d.progress>=1){d.cycle++;reset(d,time+80+(d.id%5)*25);}continue;
   }
   if(time<d.born){if(time>d.born+900){d.cycle++;reset(d,time+80);}continue;}
   // A moving/opening canopy can cover a drop already below its rim. Retire it
   // rather than teleport a splash or invent a ground contact under new shelter.
   if(umbrellas.some(u=>{const y=umbrellaTop(u,d.x);return umbrellaGroundCovers(u,d.x,d.landingY)&&y<d.y&&y<d.landingY;})){d.cycle++;reset(d,time+80);continue;}
   const nextY=-24+Math.min(1,(time-d.born)/d.fallDuration)*(d.landingY+24);
   const hit=firstRainHit(d.x,d.y,nextY,d.landingY,canopies,umbrellas);
   if(hit){if(hit.kind==='ground'&&d.excluded){d.cycle++;reset(d,time+80);continue;}d.phase='impact';d.y=hit.y;d.hitAt=time;d.progress=0;d.surface=hit.kind==='ground'?(d.x>=48&&d.x<=235&&d.y>=388&&d.y<=523?'water':'ground'):hit.kind;d.impactX=d.x;d.impactY=d.y;if(d.surface==='ground')contacts.push({id:d.id,x:d.x,y:d.y});}
   else {d.phase='fall';d.y=nextY;}
  }
  last=time;return frame;
 }};
}
