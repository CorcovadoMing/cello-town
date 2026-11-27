// Baked world-space lighting. Layers are underneath solid pixel silhouettes,
// readable labels and particles; this module has no dependency on game state.
const W=960,H=560;
const DAY={
 sun:{cast:.91,contact:.54,light:1,distance:1},
 breeze:{cast:.56,contact:.55,light:.47,distance:1},
 rain:{cast:.13,contact:.53,light:0,distance:.70}
};
function glow(g,x,y,rx,ry,color,alpha,angle=0){
 g.save();g.translate(x,y);g.rotate(angle);g.scale(rx,ry);
 const fade=g.createRadialGradient(0,0,0,0,0,1);
 fade.addColorStop(0,`rgba(${color},${alpha})`);
 fade.addColorStop(.48,`rgba(${color},${alpha*.76})`);
 fade.addColorStop(1,`rgba(${color},0)`);
 g.fillStyle=fade;g.fillRect(-1,-1,2,2);g.restore();
}
function cast(g,x,y,w,h,amount){
 // Upper-right light, so each rooted shadow recedes left and forward.
 const tone='32,37,43';
 glow(g,x-h*.42,y+h*.15,w*.64+h*.26,w*.18+h*.07,tone,.53*amount,-.34);
 glow(g,x-h*.74,y+h*.30,w*.52+h*.17,w*.18,tone,.35*amount,-.38);
}
export function createTownDepth(makeCanvas,trees,room){
 const atlas=makeCanvas();
 atlas.width=W;atlas.height=H;
 const g=atlas.getContext('2d');const facade=makeCanvas();facade.width=245;facade.height=209;const fx=facade.getContext('2d');let last=null,lastFacade=null;
 function bake(key){
  const p=DAY[key]||DAY.sun;
  g.clearRect(0,0,W,H);
  // Pigment follows ground perspective: low contrast in the distance, warmer
  // near the entrance to the clearing, and cooler beneath foreground branches.
  const distance=g.createLinearGradient(0,82,0,335);
  distance.addColorStop(0,`rgba(199,219,204,${.35*p.distance})`);
  distance.addColorStop(.50,`rgba(168,197,182,${.16*p.distance})`);
  distance.addColorStop(1,'rgba(168,197,182,0)');
  g.fillStyle=distance;g.fillRect(0,0,W,335);
  // The map ends in a low cutaway turf edge in front of the south meadow;
  // the north-south path has a continuous ramp through the open centre.
  for(const side of [
   [[0,545],[76,547],[129,551],[216,548],[279,550],[339,546],[417,546],[417,560],[0,560]],
   [[502,546],[580,548],[639,546],[720,550],[816,544],[885,546],[960,541],[960,560],[502,560]]
  ]){
   face(g,side,'#70755a');
   const brow=side.slice(0,-2);face(g,[...brow,...brow.slice().reverse().map(([x,y])=>[x,y+3])],'#a5ae77');
  }
  for(const [x,y,s] of [[8,552,1.45],[23,554,.81],[933,550,1.09],[956,543,1.42],[900,557,.95]]){
   face(g,[[x-10*s,y],[x-7*s,y-7*s],[x+2*s,y-11*s],[x+10*s,y-5*s],[x+8*s,y+1]],'#718275');
   face(g,[[x-7*s,y-7*s],[x+2*s,y-11*s],[x+10*s,y-5*s],[x+3*s,y-4*s]],'#a8b692');
   face(g,[[x+3*s,y-4*s],[x+10*s,y-5*s],[x+8*s,y+1],[x-10*s,y]],'#596f66');
  }
  // Low-contrast woodland bands peek over the fence, separated from the
  // in-focus orchard by one short strip of open ground.
  face(g,[[0,0],[960,0],[960,26],[906,23],[879,16],[829,22],[771,13],[711,22],[644,15],[590,21],[528,11],[469,19],[417,15],[369,21],[288,13],[216,21],[167,11],[97,20],[42,13],[0,20]],'rgba(95,139,125,.24)');
  face(g,[[0,0],[960,0],[960,10],[877,13],[817,6],[737,12],[662,5],[555,15],[484,8],[405,13],[297,5],[202,16],[91,7],[0,11]],'rgba(166,193,169,.46)');
  glow(g,666,280,309,143,'255,228,144',.46*p.light,-.27);
  glow(g,586,382,190,104,'255,239,185',.25*p.light,-.25);
  glow(g,885,518,319,130,'37,64,77',.35*p.distance,-.1);
  glow(g,254,570,181,111,'39,59,74',.25*p.distance,.1);
  // Far trees throw shorter, softer shadows; preserve all canopy silhouettes.
  for(const [x,y,s] of trees){
   const root=y+46*s;
   const depth=Math.min(1,Math.max(.27,(root-78)/406));
   cast(g,x,root,32*s,(52+25*depth)*s,p.cast*(.58+.42*depth));
   glow(g,x,root+3,21*s,7*s,'31,42,39',.54*p.contact);
  }
  cast(g,room.x+room.w*.50,room.depth,room.w*.94,88,p.cast*.78);
  glow(g,room.x+room.w*.5,room.depth+2,room.w*.59,18,'34,39,42',.76*p.contact);
  // The non-walkable bench footprint reads as a little stone terrace.
  // Exposed low riser and sides leave the path clear at y>240.
  face(g,[[174,208],[184,194],[307,194],[329,206],[329,230],[319,239],[177,239],[170,230]],'#777c63');
  face(g,[[174,208],[184,194],[307,194],[329,206],[326,226],[177,226]],'#bdba98');
  face(g,[[170,224],[177,226],[326,226],[329,230],[319,239],[177,239],[170,230]],'#9c997d');
  face(g,[[177,230],[322,230],[319,239],[177,239]],'#86836b');
  for(const x of [181,203,225,247,269,291,313])face(g,[[x,231],[x+1,231],[x-1,238],[x-2,238]],'#6e735c');
  cast(g,252,229,124,25,p.cast*.63);
  cast(g,485,245,89,27,p.cast*.69);
  cast(g,615,407,18,35,p.cast*.68);
  // The pond is a raised turf lip over dark soil; the original water and
  // stones draw on top, but the shallow south-facing section remains visible.
  face(g,[[19,531],[275,531],[264,546],[34,546],[19,539]],'#716d4e');
  face(g,[[25,533],[271,533],[258,541],[34,541]],'#4f6959');
  face(g,[[35,541],[258,541],[250,545],[43,545]],'#95845c');
 }
 return Object.freeze({drawGround(g,key){
  if(key!==last){bake(key);last=key;}
  g.drawImage(atlas,0,0);
 },drawRoom(g,key,drawFacade){
  const variant=key==='sun'?'sun':'overcast';
  if(variant!==lastFacade){
   fx.clearRect(0,0,245,209);fx.save();fx.translate(-555,-35);
   drawFacade(fx,key);fx.restore();lastFacade=variant;
  }
  g.drawImage(facade,555,35);
 },drawActorContact(g,x,y,key){
  // Tiny flat contact, independent of character facing, poses and touch target.
  const p=DAY[key]||DAY.sun;
  g.save();g.fillStyle=`rgba(38,44,49,${.30*p.contact})`;
  g.beginPath();g.ellipse(x-3,y+3,13,4,-.13,0,Math.PI*2);g.fill();g.restore();
 }});
}
function face(g,points,color){
 g.fillStyle=color;g.beginPath();points.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));g.closePath();g.fill();
}
