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
 return {kind:'tree',left,columns,groundMin:y+46*s-30*s,groundMax:y+46*s+40};
});}
// Per-kind pixel domes: broad arch for the player, petal-edged flower dome
// for the teacher. Paint and collision consume these exact same rectangles.
export const UMBRELLA_BANDS=Object.freeze([[24,-82,2],[42,-80,3],[54,-77,4],[64,-73,5],[70,-68,4],[72,-64,4]].map(Object.freeze));
export const TEACHER_UMBRELLA_BANDS=Object.freeze([[20,-86,2],[36,-84,3],[50,-81,4],[60,-77,5],[66,-72,5],[68,-67,4]].map(Object.freeze));
const freezeRects=rs=>Object.freeze(rs.map(Object.freeze));
const playerHem=freezeRects([[-36,-60,12,2],[-24,-60,48,1],[24,-60,12,2]]);
const teacherHem=freezeRects([-27,-13.5,0,13.5,27].flatMap(x=>[[x-6,-63,12,3],[x-4,-60,8,2]]));
export const UMBRELLA_SHAPES=Object.freeze(Object.fromEntries([
 ['player',UMBRELLA_BANDS,playerHem,[-1,-85,2,3]],['teacher',TEACHER_UMBRELLA_BANDS,teacherHem,[-1,-89,2,3]]
].map(([kind,bands,hem,cap])=>[kind,Object.freeze({bands,hem,cap:Object.freeze(cap),rects:freezeRects([...bands.map(([w,y,h])=>[-w/2,y,w,h]),...hem,cap])})])));
export function umbrellaShape(kind='player'){return UMBRELLA_SHAPES[kind==='teacher'?'teacher':'player'];}
export function umbrellaPose(actor,opening=1){const facing=actor.facing||'front',shaft=(facing==='back'?-7:10)*(facing==='left'?-1:1);return {kind:'umbrella',canopyKind:actor.kind==='teacher'?'teacher':'player',x:actor.x+shaft,y:actor.y,opening,facing};}
export function umbrellaTop(u,x){if(u.opening<=0)return Infinity;const dx=x-u.x;let top=Infinity;for(const[rx,y,w]of umbrellaShape(u.canopyKind).rects)if(dx>=rx*u.opening&&dx<(rx+w)*u.opening)top=Math.min(top,u.y+y);return top;}

// Screen silhouettes intercept only rain in their own ground-depth band.
// Otherwise a foreground road would falsely remain dry below a distant tree.
export function canopyCoversGround(c,y){return y>=(c.groundMin??-Infinity)&&y<=(c.groundMax??Infinity);}
export function umbrellaCoversGround(u,y){return y>=u.y-24&&y<=u.y+24;}

// Ground projection is rounded, not the rectangular screen silhouette.
export function umbrellaGroundRadius(u,x,y){return Math.hypot((x-u.x)/(36*Math.max(.01,u.opening)),(y-u.y)/24);}
export function umbrellaGroundCovers(u,x,y){return u.opening>0&&umbrellaGroundRadius(u,x,y)<=1;}
