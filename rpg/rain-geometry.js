// Shared visible outlines, not collision footprints. Compiled once, then O(1) columns.
export function treeLeaves(seed){const round=seed%3===2;return [
 [-25,-11,50,39,'#496b4d'],[-29,-10,24,28,'#567953'],[7,-17,22,36,'#3f624a'],
 [round?-23:-21,-27,round?46:42,39,'#6f8b59'],[-23,-21,30,29,'#819b65'],
 [-11,-37,28,26,'#91a76c'],[-16,-33,19,17,'#a6b77a'],[-23,-9,20,15,'#8fa66b'],[0,-15,22,21,'#78925c'],[-9,10,24,16,'#597d51'],...(seed%3===0?[[14,-2,17,17,'#658851']]:[])];}
export function leafOutline(x,y,w,h){return [[x+4,y],[x+w-6,y],[x+w-6,y+3],[x+w,y+3],[x+w,y+h-5],[x+w-4,y+h-5],[x+w-4,y+h],[x+3,y+h],[x+3,y+h-3],[x,y+h-3],[x,y+5],[x+4,y+5]];}
export function treeRainCanopies(trees){return trees.map(([x,y,s],i)=>{
 const left=Math.round(x-32*s),top=Math.round(y-40*s),columns=new Float32Array(Math.ceil(64*s));columns.fill(Infinity);
 for(const a of treeLeaves(i+1)){const points=leafOutline(...a).map(([px,py])=>[(px+32)*s,(py+40)*s]);
  for(let j=0;j<points.length;j++){const [ax,ay]=points[j],[bx,by]=points[(j+1)%points.length];if(ax===bx)continue;
   for(let k=Math.max(0,Math.ceil(Math.min(ax,bx)));k<Math.min(columns.length,Math.max(ax,bx));k++){const yy=ay+(by-ay)*(k-ax)/(bx-ax);columns[k]=Math.min(columns[k],top+yy);}
  }
 }
 return {kind:'tree',left,columns};
});}
export const UMBRELLA_BANDS=Object.freeze([[10,-78,3],[24,-75,3],[38,-72,4],[50,-68,4],[62,-64,4],[70,-60,4]].map(Object.freeze));
export function umbrellaPose(actor,opening=1){const facing=actor.facing||'front',shaft=(facing==='back'?-7:10)*(facing==='left'?-1:1);return {kind:'umbrella',x:actor.x+shaft,y:actor.y,opening,facing};}
export function umbrellaTop(u,x){if(u.opening<=0)return Infinity;const dx=Math.abs(x-u.x);for(const[w,y]of UMBRELLA_BANDS)if(dx<=w*u.opening/2)return u.y+y;return Infinity;}
