// Visual moisture only. No garden/reward/store dependency; dry means no overlay.
import {rainLandings} from './ambience.js?v=28';
// Exact existing dry-road rectangles, followed by the exposed bed interior.
export const WET_SURFACES=Object.freeze([
 {kind:'road',x:170,y:298,w:620,h:72},{kind:'road',x:428,y:370,w:72,h:190},
 {kind:'road',x:620,y:220,w:75,h:78},{kind:'bed',x:744,y:412,w:154,h:93}
].map(Object.freeze));
export function soilCell(x,y){
 const r=WET_SURFACES.find(r=>x>=r.x&&x<r.x+r.w&&y>=r.y&&y<r.y+r.h);if(!r)return null;
 const cx=Math.floor((x-r.x)/8)*8+r.x,cy=Math.floor((y-r.y)/8)*8+r.y;
 return {x:cx,y:cy,w:Math.min(8,r.x+r.w-cx),h:Math.min(8,r.y+r.h-cy),kind:r.kind};
}
export function createWetSoil({excludeRects=[]}={}){
 const cells=new Map();let previous=null,wasRain=false;
 return {update(time,key,reduced=false,rainFrame=null){
  const now=Math.max(0,time),rain=key==='rain';
  // A paused tab or weather transition does not replay invisible past contacts.
  if(previous!==null&&rain&&wasRain&&!reduced&&now>=previous&&now-previous<1000){
   const hits=rainFrame?rainFrame.contacts:rainLandings(now,false,excludeRects).filter(d=>{const hit=now-d.age+d.fallDuration-(d.age<d.fallDuration?d.cycle:0);return hit>previous&&hit<=now}).map(d=>({id:d.id,x:d.landingX,y:d.landingY}));
   for(const d of hits){const c=soilCell(d.x,d.y);if(!c)continue;const id=c.x+','+c.y,old=cells.get(id);
    if(old||cells.size<384)cells.set(id,{...c,level:Math.min(3,(old?.level||0)+1),dryAt:now+6000+(d.id%18)*173});
   }
  }
  if(!rain)for(const[id,c]of cells){
   if(now>=c.dryAt){c.level=Math.max(0,c.level-1-Math.floor((now-c.dryAt)/5000));c.dryAt=now+5000;if(!c.level)cells.delete(id);}
  }
  previous=now;wasRain=rain;
  return [...cells.values()].map(c=>({...c}));
 }};
}
export function drawWetSoil(g,cells,kind=null){
 g.save();g.fillStyle='#493d30';
 for(const c of cells){if(kind&&c.kind!==kind)continue;g.globalAlpha=[0,.14,.25,.35][c.level];g.fillRect(c.x,c.y,c.w??8,c.h??8);}
 g.restore();
}
