// Visual moisture only. No garden/reward/store dependency; dry means no overlay.
import {rainLandings} from './ambience.js?v=30';
// Exact existing dry-road rectangles, followed by the exposed bed interior.
export const WET_SURFACES=Object.freeze([
 {kind:'road',x:170,y:298,w:620,h:72},{kind:'road',x:428,y:370,w:72,h:190},
 {kind:'road',x:620,y:220,w:75,h:78},{kind:'bed',x:744,y:412,w:154,h:93}
].map(Object.freeze));
export const WET_CELL_LIMIT=WET_SURFACES.reduce((n,r)=>n+Math.ceil(r.w/8)*Math.ceil(r.h/8),0);
export function soilCell(x,y){
 const r=WET_SURFACES.find(r=>x>=r.x&&x<r.x+r.w&&y>=r.y&&y<r.y+r.h);if(!r)return null;
 const cx=Math.floor((x-r.x)/8)*8+r.x,cy=Math.floor((y-r.y)/8)*8+r.y;
 return {x:cx,y:cy,w:Math.min(8,r.x+r.w-cx),h:Math.min(8,r.y+r.h-cy),kind:r.kind};
}
export function createWetSoil({excludeRects=[]}={}){
 const cells=new Map();let previous=null,wasRain=false,snapshot=[];
 return {update(time,key,reduced=false,rainFrame=null){
  const now=Math.max(0,time),rain=key==='rain';let changed=false;
  // A paused tab or weather transition does not replay invisible past contacts.
  if(previous!==null&&rain&&wasRain&&!reduced&&now>=previous&&now-previous<1000){
   const hits=rainFrame?rainFrame.contacts:rainLandings(now,false,excludeRects).filter(d=>{const hit=now-d.age+d.fallDuration-(d.age<d.fallDuration?d.cycle:0);return hit>previous&&hit<=now}).map(d=>({id:d.id,x:d.landingX,y:d.landingY}));
   for(const d of hits){const c=soilCell(d.x,d.y);if(!c)continue;const id=c.x+','+c.y,old=cells.get(id);
    if(old||cells.size<WET_CELL_LIMIT){const level=Math.min(3,(old?.level||0)+1);if(!old||old.level!==level)changed=true;cells.set(id,{...c,level,dryAt:now+6000+(d.id%18)*173});}
   }
  }
  if(!rain&&wasRain)for(const c of cells.values())c.dryAt=now+6000+((c.x*17+c.y*13)%18)*173;
  if(!rain)for(const[id,c]of cells){
   if(now>=c.dryAt){changed=true;c.level=Math.max(0,c.level-1-Math.floor((now-c.dryAt)/5000));c.dryAt=now+5000;if(!c.level)cells.delete(id);}
  }
  previous=now;wasRain=rain;
  if(changed)snapshot=[...cells.values()].map(({dryAt,...c})=>({...c}));return snapshot;
 }};
}
const wetRunCache=new WeakMap();
export function drawWetSoil(g,cells,kind=null){
 // A visual snapshot changes only when a level/cell changes. Cache row runs
 // once per snapshot/kind, not two filtered arrays and sorts on every frame.
 let cache=wetRunCache.get(cells);if(!cache){cache=new Map();wetRunCache.set(cells,cache);}const key=kind||'all';let levels=cache.get(key);
 if(!levels){levels=[[],[],[]];const ordered=cells.filter(c=>!kind||c.kind===kind).sort((a,b)=>a.y-b.y||a.x-b.x);
  for(let level=1;level<=3;level++){let run=null;for(const c of ordered){if(c.level!==level)continue;const w=c.w??8,h=c.h??8;if(run&&run.y===c.y&&run.h===h&&run.x+run.w===c.x)run.w+=w;else{run={x:c.x,y:c.y,w,h};levels[level-1].push(run);}}}cache.set(key,levels);
 }
 g.save();g.fillStyle='#493d30';for(let level=1;level<=3;level++){g.globalAlpha=[0,.14,.25,.35][level];for(const r of levels[level-1])g.fillRect(r.x,r.y,r.w,r.h);}g.restore();
}
