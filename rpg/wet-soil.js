import {MUSIC_ROOM_APPROACH} from './music-room-art.js?v=exp2';
// Visual moisture only. No garden/reward/store dependency; dry means no overlay.
import {rainLandings} from './ambience.js?v=51';
// Exact existing dry-road rectangles, followed by the exposed bed interior.
export const WET_SURFACES=Object.freeze([
 {kind:'road',x:170,y:298,w:620,h:72},{kind:'road',x:428,y:370,w:72,h:190},
 {kind:'road',...MUSIC_ROOM_APPROACH.soil},{kind:'bed',x:744,y:412,w:154,h:93}
].map(Object.freeze));
export const WET_CELL_LIMIT=5000;
export function soilCell(x,y){
 const r=WET_SURFACES.find(r=>x>=r.x&&x<r.x+r.w&&y>=r.y&&y<r.y+r.h);if(!r)return null;
 const cx=Math.floor((x-r.x)/8)*8+r.x,cy=Math.floor((y-r.y)/8)*8+r.y;
 return {x:cx,y:cy,w:Math.min(8,r.x+r.w-cx),h:Math.min(8,r.y+r.h-cy),kind:r.kind};
}
// Narrow meadow verge follows the same road union, with a faded outer tail.
// Separate 4 px cells preserve the original soil grid and avoid an edge seam.
export function moistureCell(x,y){
 const soil=soilCell(x,y);if(soil)return soil;
 const cx=Math.floor(x/4)*4,cy=Math.floor(y/4)*4,mx=cx+2,my=cy+2;
 if(soilCell(mx,my))return null;
 let distance=Infinity;
 for(const r of WET_SURFACES.filter(r=>r.kind==='road'))distance=Math.min(distance,Math.hypot(Math.max(r.x-mx,0,mx-r.x-r.w),Math.max(r.y-my,0,my-r.y-r.h)));
 if(distance>=16)return null;
 const t=Math.max(0,1-distance/16);
 return {x:cx,y:cy,w:4,h:4,kind:'verge',opacity:t*t*(3-2*t)};
}
// A landing moistens a small elliptical patch, rather than one tiny square.
// Amounts stay continuous: 0 is dry, 3 is the previous deepest shade.
export const WET_RATES=Object.freeze({soak:.24,dry:.10,radiusX:20,radiusY:16});
export function createWetSoil({excludeRects=[]}={}){
 const cells=new Map();let previous=null,wasRain=false,snapshot=[],snapshotAt=-Infinity,dirty=false;
 const excluded=(x,y)=>excludeRects.some(r=>x>=r.x&&x<=r.x+r.w&&y>=r.y&&y<=r.y+r.h);
 return {update(time,key,reduced=false,rainFrame=null){
  const now=Math.max(0,time),rain=key==='rain',elapsed=previous===null?0:Math.max(0,(now-previous)/1000);
  const contiguous=previous!==null&&now>=previous&&now-previous<1000;
  let changed=false;const exposure=new Map();
  // Paused tabs cannot invent missed contacts. Drying can still catch up.
  if(contiguous&&rain&&wasRain&&!reduced){
   const hits=rainFrame?rainFrame.contacts:rainLandings(now,false,excludeRects).filter(d=>{const hit=now-d.age+d.fallDuration-(d.age<d.fallDuration?d.cycle:0);return hit>previous&&hit<=now}).map(d=>({id:d.id,x:d.landingX,y:d.landingY}));
   for(const d of hits){
    if(!moistureCell(d.x,d.y))continue;
    const visited=new Set();
    for(let y=d.y-WET_RATES.radiusY;y<=d.y+WET_RATES.radiusY;y+=4)for(let x=d.x-WET_RATES.radiusX;x<=d.x+WET_RATES.radiusX;x+=4){
     const c=moistureCell(x,y);if(!c)continue;const id=c.x+','+c.y;if(visited.has(id))continue;visited.add(id);
     const cx=c.x+c.w/2,cy=c.y+c.h/2,q=((cx-d.x)/WET_RATES.radiusX)**2+((cy-d.y)/WET_RATES.radiusY)**2;
     if(q>1||excluded(cx,cy))continue;
     // Cache one shelter/exposure query per cell per update, not per drop.
     if(!exposure.has(id))exposure.set(id,rainFrame?.moistureExposureAt?rainFrame.moistureExposureAt(cx,cy):rainFrame?.groundHitAt?(rainFrame.groundHitAt(cx,cy)?.kind==='ground'?1:0):1);
     const amount=exposure.get(id);if(amount<=0)continue;
     const old=cells.get(id)||{...c,level:0,target:0};
     if(cells.has(id)||cells.size<WET_CELL_LIMIT){
      old.target=Math.max(old.level,Math.min(3*amount,old.target+(.32+.32*(1-q))*amount));cells.set(id,old);
     }
    }
   }
  }
  for(const[id,c]of cells){
   const old=c.level;
   if(rain){
    // If rain resumes before the soil is fully dry, retain the moisture
    // already in the ground without replaying any earlier contacts.
    if(!wasRain)c.target=c.level;
    if(contiguous&&!reduced)c.level=Math.min(c.target,c.level+elapsed*WET_RATES.soak);
   }
   else {c.target=0;c.level=Math.max(0,c.level-elapsed*WET_RATES.dry);if(c.level===0)cells.delete(id);}
   if(old!==c.level)changed=true;
  }
  previous=now;wasRain=rain;
  // Continuous state, sampled visually at 25 Hz. The pixel-art overlays merge
  // equal-alpha row runs and reuse snapshots between display ticks.
  dirty ||= changed;
  if((dirty&&now-snapshotAt>=40)||(!cells.size&&snapshot.length)){
   snapshot=[...cells.values()].filter(c=>c.level>0).map(({target,...c})=>({...c}));snapshotAt=now;dirty=false;
  }
  return snapshot;
 }};
}
const wetRunCache=new WeakMap();
export function drawWetSoil(g,cells,kind=null){
 let cache=wetRunCache.get(cells);if(!cache){cache=new Map();wetRunCache.set(cells,cache);}const key=kind||'all';let levels=cache.get(key);
 if(!levels){
  levels=new Map();const ordered=cells.filter(c=>!kind||c.kind===kind||(kind==='road'&&c.kind==='verge')).sort((a,b)=>a.y-b.y||a.x-b.x);
  for(const c of ordered){const alpha=Math.round(Math.min(3,Math.max(0,c.level))/3*.35*(c.opacity??1)*255);if(!alpha)continue;let runs=levels.get(alpha);if(!runs){runs=[];levels.set(alpha,runs);}const run=runs.at(-1),w=c.w??8,h=c.h??8;
   if(run&&run.y===c.y&&run.h===h&&run.x+run.w===c.x)run.w+=w;else runs.push({x:c.x,y:c.y,w,h});
  }cache.set(key,levels);
 }
 g.save();g.fillStyle='#493d30';for(const[alpha,runs]of levels){g.globalAlpha=alpha/255;for(const r of runs)g.fillRect(r.x,r.y,r.w,r.h);}g.restore();
}
