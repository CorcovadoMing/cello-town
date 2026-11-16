import {MUSIC_ROOM_APPROACH} from './music-room-art.js?v=46';
import {treeLeaves,leafOutline} from './rain-geometry.js?v=35';
// Private art-direction study. Original vector pixels, no image assets or filters.
// These caches affect drawing only: world anchors and gameplay stay in app.js.
export function createTownArt(makeCanvas,trees){
 const make=(w,h)=>{const c=makeCanvas();c.width=w;c.height=h;return c;};
 const poly=(g,p,c)=>{g.fillStyle=c;g.beginPath();p.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));g.closePath();g.fill();};
 const rect=(g,x,y,w,h,c)=>{g.fillStyle=c;g.fillRect(x,y,w,h);};
 const ground=make(960,560),g=ground.getContext('2d');
 rect(g,0,0,960,560,'#a3b783');
 // Low-contrast grouped colour with broken, stepped contours. No rectangular
 // light planes and no full-map speckle. All irregularity is baked just once.
 const patch=(cx,cy,rx,ry,color,phase=0)=>{
  for(let dy=-ry;dy<=ry;dy+=4){
   const width=rx*Math.sqrt(Math.max(0,1-(dy/ry)**2));
   const drift=Math.sin(dy*.09+phase)*5+Math.sin(dy*.21+phase)*2;
   const left=Math.round((cx-width+drift)/4)*4,right=Math.round((cx+width+drift)/4)*4;
   if(right>left)rect(g,left,cy+dy,right-left,4,color);
  }
 };
 [[112,168,80,25,1],[410,157,115,26,3],[856,208,65,32,5]].forEach(([x,y,rx,ry,p])=>patch(x,y,rx,ry,'#9cae7b',p));
 [[224,260,75,40,1],[388,248,104,56,4],[548,402,82,38,6],[756,379,76,31,2]].forEach(([x,y,rx,ry,p])=>{
  patch(x,y,rx,ry,'#a8ba86',p);patch(x-9,y-2,rx*.64,ry*.62,'#adbd89',p+1);
 });
 // Small pools along tree edges dissolve through nearby satellite shapes.
 [[158,248,24,10,1],[345,175,25,10,2],[438,180,27,12,4],[814,347,24,12,3],[368,464,25,11,5],[624,477,29,12,6]].forEach(([x,y,rx,ry,p])=>{
  patch(x,y,rx,ry,'#b4c38f',p);patch(x+rx+9,y+4,8,4,'#aebf89',p);patch(x-12,y-ry-5,7,3,'#afbf8b',p);
 });
 // The old practice clearing stays at its exact station, now a soft irregular
 // material edge instead of three overlapping selection-like rectangles.
 patch(652,268,76,39,'#afbc89',3);patch(636,260,58,28,'#b6c190',5);patch(690,282,31,17,'#aebc88',1);
 // Low, broken grass clusters leave clear resting space between groups. These
 // are surface pixels only, baked once; no objects, collision or random shimmer.
 const grassGroups=[[80,184],[133,217],[178,159],[253,153],[360,204],[429,214],[511,176],[549,220],[773,184],[817,236],[882,252],[78,333],[112,360],[217,271],[268,257],[390,269],[471,267],[551,284],[760,273],[817,376],[873,374],[301,395],[357,432],[391,490],[526,412],[561,451],[634,412],[671,448],[726,378],[698,534]];
 grassGroups.forEach(([cx,cy],seed)=>{
  const count=3+seed%3;
  for(let i=0;i<count;i++){
   const x=cx+(i*17+seed*7)%43-21,y=cy+(i*11+seed*3)%25-12;
   const dark=seed%3===0?'#8ca572':'#91aa75',light=seed%2?'#b1c18d':'#adc08a';
   rect(g,x,y,2,3,dark);rect(g,x-2,y-2-i%2,2,2+i%2,dark);
   if((seed+i)%3!==0)rect(g,x+3,y-3,1,3,dark);
   rect(g,x+(i%2?1:-2),y-3-i%2,1,2,light);
  }
 });
 // Original pixel meadow margins inspired by the owner's pastoral moodboard,
 // not copied assets. Irregular pockets frame water and clearings; the centre
 // remains restful. All flowers here are scenery, outside the earned garden.
 const meadow=[ [291,409,23,11],[303,451,20,14],[290,497,15,12],
  [99,551,31,7],[190,553,34,6],[370,239,28,13],[499,190,24,11],
  [532,250,25,12],[800,219,23,12],[825,385,25,9],
  [540,466,27,12],[632,442,26,11],[389,519,18,9] ];
 meadow.forEach(([cx,cy,rx,ry],seed)=>{
  patch(cx,cy,rx,ry,seed%2?'#95ad72':'#8fa96c',seed+2);
  const count=9+seed%5;
  for(let i=0;i<count;i++){
   const angle=i*2.399+seed*.7,r=.35+.65*((i*7+seed)%13)/13;
   const x=Math.round(cx+Math.cos(angle)*rx*r),y=Math.round(cy+Math.sin(angle)*ry*r);
   const h=3+(i+seed)%7,dark=['#658a56','#719451','#6c8c63'][seed%3];
   rect(g,x,y-h,1+(i%2),h,dark);
   if((i+seed)%3===0){rect(g,x-3,y-h+3,3,2,dark);rect(g,x+1,y-3,4,2,'#87a569');}
   else rect(g,x-2,y-h+1,2,Math.max(2,h-2),dark);
   if(i%3!==0)rect(g,x+3,y-h-1,2,h-1,'#93b468');
   rect(g,x,y-h,1,2,i%2?'#b2ca7b':'#bdce87');
  }
 });
 // Small bouquets keep coherent local palettes, with buds, daisies and bells
 // at different stem heights. Same meadow pockets, never the earned garden.
 [[302,443],[374,232],[638,438]].forEach(([cx,cy],seed)=>{
  const petals=['#f2edd3','#dfbbc2','#d9dcb9'][seed],centres=['#d8bc76','#b38d93','#bcb579'][seed];
  for(let i=0;i<6;i++){
   const x=cx+(i*13+seed*5)%29-14,y=cy+(i*7)%13-6,h=5+(i+seed)%5;
   rect(g,x,y-h,1,h,'#658a56');rect(g,x+(i%2?-2:1),y-3,2,1,'#87a36c');
   const top=y-h;
   if(i%3===0){rect(g,x-1,top-2,3,3,petals);rect(g,x,top-3,1,1,centres);}
   else if(i%3===1){rect(g,x-2,top-1,5,2,petals);rect(g,x-1,top-3,3,5,petals);rect(g,x,top-1,1,1,centres);}
   else {rect(g,x-2,top-2,4,2,petals);rect(g,x-1,top,2,1,centres);}
  }
 });
 // Small planted edges are clustered by objects, never sprinkled as map noise.
 const tuft=(x,y,s=1)=>{poly(g,[[x-7*s,y],[x-6*s,y-6*s],[x-2*s,y-3*s],[x,y-10*s],[x+3*s,y-5*s],[x+6*s,y-7*s],[x+7*s,y]],'#7d9665');rect(g,x-2*s,y-6*s,2*s,5*s,'#bac38a');};
 [[172,245,1],[332,242,.9],[343,258,.7],[182,284,.6],[353,285,.7],[539,385,.9],[559,391,.6],[726,392,1],[721,421,.7],[912,461,.7],[711,487,.8],[347,413,.8],[404,432,.6]].forEach(a=>tuft(...a));
 for(const [x,y]of[[181,264],[330,260],[550,392],[716,396]]){rect(g,x,y,2,7,'#7e9461');rect(g,x-2,y-2,6,3,'#eee0b5');rect(g,x,y-3,2,5,'#edcf8a');}
 // Layered, flat-edged ground shadows. No blur, opacity filter or reflective floor.
 for(const[x,y,s]of trees){
  const bx=x+.5*s,by=y+46*s;
  poly(g,[[bx-13*s,by-4],[bx+13*s,by-4],[bx+35*s,by+9*s],[bx+30*s,by+15*s],[bx+2*s,by+14*s],[bx-13*s,by+6*s]],'#82976c55');
  poly(g,[[bx-8*s,by-1],[bx+9*s,by-1],[bx+21*s,by+6*s],[bx+12*s,by+9*s],[bx-8*s,by+5*s]],'#637c5b40');
 }
 poly(g,[[180,220],[324,220],[340,233],[330,245],[191,245],[176,234]],'#6f805449');
 poly(g,[[735,507],[907,507],[919,520],[911,527],[742,525]],'#6b765244');
 // Preserve the approved old road raster above all new ground decoration.
 rect(g,170,298,620,72,'#d0c298');rect(g,428,300,72,260,'#d0c298');rect(g,MUSIC_ROOM_APPROACH.soil.x,MUSIC_ROOM_APPROACH.soil.y,MUSIC_ROOM_APPROACH.soil.w,MUSIC_ROOM_APPROACH.soil.h,'#d0c298');for(let i=0;i<20;i++){const x=190+i*29;rect(g,x,326+(i%3)*9,12,3,'#beae83');}for(let i=0;i<7;i++)rect(g,449+(i%2)*18,390+i*22,14,3,'#beae83');
// Feather the original soil footprint into the meadow with little stepped
// banks. The soil core and walking bounds stay put; outlying flecks are
// stationary edge art, never sampled as newly wet terrain.
const branch=MUSIC_ROOM_APPROACH.soil;
const banks=[
 [170,298,branch.x,298,0,-1],[branch.x+branch.w,298,790,298,0,-1],
 [170,370,428,370,0,1],[500,370,790,370,0,1],
 [170,298,170,370,-1,0],[790,298,790,370,1,0],
 [branch.x,branch.y,branch.x,298,-1,0],[branch.x+branch.w,branch.y,branch.x+branch.w,298,1,0],
 [branch.x,branch.y,branch.x+branch.w,branch.y,0,-1],[428,370,428,560,-1,0],[500,370,500,560,1,0],
];
banks.forEach(([x0,y0,x1,y1,nx,ny],seed)=>{
 const horiz=ny!==0,span=horiz?x1-x0:y1-y0;
 for(let i=0,k=0;i<span;k++){
  const hash=(seed*19+k*47+k*k*5)%97,w=Math.min(4+hash%8,span-i);
  const x=x0+(horiz?i:0),y=y0+(horiz?0:i);
  const depth=1+Math.floor((1+Math.sin(i*.105+seed*1.7))*2)+(hash%7===0?3:0);
  const strip=(from,to,col)=>{
   if(horiz)rect(g,x,y+(ny>0?from:-to),w,to-from,col);
   else rect(g,x+(nx>0?from:-to),y,to-from,w,col);
  };
  strip(0,depth,hash%3===0?'#cbbe93':'#cec095');
  if(hash%4!==0)strip(depth,depth+1+hash%3,hash%3===1?'#b6b58a':'#bdba8e');
  if(hash%5===0){
   const xx=horiz?x+Math.floor(w*.5):x+nx*(depth+3);
   const yy=horiz?y+ny*(depth+3):y+Math.floor(w*.5);
   rect(g,xx,yy,3,1,'#c5b98c');
   if(hash%2===0){rect(g,xx+3,yy-3,1,3,'#819b67');rect(g,xx+4,yy-2,2,2,'#97ad74');}
  }
  i+=w;
 }
});
// Surface detail follows existing path shapes, never modifies walkability.
for(const [px,py,pw,ph] of [[170,298,620,72],[428,370,72,190],[branch.x,branch.y,branch.w,branch.h]]){for(let i=0;i<Math.floor(pw*ph/750);i++){const gx=px+8+(i*47)%(pw-16),gy=py+8+(i*31)%(ph-16);rect(g,gx,gy,2+i%2,1,i%2?'#e3d5ae':'#b4a57c');}}


 // Three separated cedar sleepers. The meadow shows between the planks;
 // neither the house collision nor the wet earthen approach needs to move.
 const {centerX,landing}=MUSIC_ROOM_APPROACH;
 for(const [w,dy,top] of [[50,0,'#b88958'],[44,7,'#bc9060'],[40,15,'#b88958']]){
  const x=centerX-w/2,y=landing.y+dy;
  rect(g,x-1,y+2,w+2,4,'#58553d48');
  rect(g,x,y,w,5,'#79583d');rect(g,x+1,y,w-2,4,top);
  rect(g,x+2,y,w-4,1,'#d2a679');
  rect(g,x+6,y+2,Math.floor(w*.45),1,'#a47751');
  rect(g,x+w-12,y+3,6,1,'#966b47');
 }

 const sprites=trees.map((_,index)=>{
  const scale=trees[index][2],c=make(Math.ceil(64*scale),Math.ceil(88*scale)),p=c.getContext('2d'),seed=index+1;p.scale(scale,scale);p.translate(32,40);
  // Warm lit left edge of the trunk, cool brown right plane, two roots.
  poly(p,[[-5,18],[5,18],[5,42],[10,46],[-9,46],[-5,41]],'#79634d');
  rect(p,-4,19,3,23,'#b29867');rect(p,-1,29,2,12,'#937d57');rect(p,3,26,2,16,'#685944');
  // Each crown has a coherent orchard/sage/olive palette and its own broad
  // foliage masses, not a shared crown with shuffled sparkling dots.
  const palettes=[
   ['#476b50','#557b55','#3f634b','#718e60','#829d6c','#96ac78','#acbd88','#90a973','#77945f','#5c8056','#668b58'],
   ['#4c6d48','#5f7f50','#446442','#7c9258','#8c9f65','#a5b477','#bbca8c','#9dad70','#83975c','#657f4d','#728c54'],
   ['#476b55','#557e5e','#3d624f','#6b8c65','#7f9b75','#8fa87e','#a6ba91','#8aa67b','#739267','#587d5c','#648968'],
   ['#506b4c','#617c53','#456244','#7a915e','#8fa16b','#a0b078','#b9c58b','#96a671','#80955f','#647e50','#6d8959'],
   ['#436b4d','#537b51','#3b6046','#6d8c58','#809c62','#93aa70','#abba82','#8ba76a','#74935a','#587e50','#638b55']
  ];
  const profile=index%palettes.length,colors=palettes[profile],leaves=treeLeaves(seed);
  leaves.forEach(([x,y,w,h],i)=>poly(p,leafOutline(x,y,w,h),colors[i]));
  // Clip internal masses to the exact existing union: the visible rain-catching
  // perimeter and every canopy/collision coordinate stay unchanged.
  p.save();p.beginPath();
  for(const [x,y,w,h]of leaves){leafOutline(x,y,w,h).forEach(([px,py],i)=>i?p.lineTo(px,py):p.moveTo(px,py));p.closePath();}p.clip();
  const masses=[
   [[-21,-25,24,12,5],[-24,-6,23,12,4],[-4,-19,18,15,3],[3,6,17,13,1]],
   [[-17,-30,20,16,5],[-25,-13,16,16,4],[-7,-3,23,12,3],[8,-17,17,15,1]],
   [[-22,-22,29,10,5],[-20,-10,19,16,4],[0,-25,15,15,3],[-7,10,21,12,1]],
   [[-19,-29,17,13,5],[-23,-15,27,11,4],[-9,-3,20,17,3],[10,-12,15,16,1]],
   [[-19,-28,24,10,5],[-24,-12,15,18,4],[-8,-12,24,13,3],[2,7,21,12,1]]
  ];
  for(const[x,y,w,h,tone]of masses[profile]){
   poly(p,leafOutline(x,y,w,h),colors[tone]);
   // A short upper-left lit lip, then a darker lower-right fold: light direction
   // stays consistent while tier widths and offsets differ between trees.
   rect(p,x+4,y+1,Math.max(4,w-12),2,colors[Math.min(6,tone+1)]);
   rect(p,x+w-8,y+h-3,5,2,colors[Math.max(0,tone-1)]);
  }
  p.restore();
  return c;
 });
 return {
  drawGround(ctx){ctx.drawImage(ground,0,0);},
  drawTree(ctx,x,y,s,t,seed){const c=sprites[seed-1];ctx.drawImage(c,Math.round(x-32*s),Math.round(y-40*s));},
  drawBench(ctx){
   // Existing wood geometry receives top planes and restrained grain.
   for(const[y,w]of[[176,145],[192,145],[208,153]]){const x=y===208?176:180;rect(ctx,x,y,w,2,'#d0b58b');rect(ctx,x,y+7,w,2,'#80694e');rect(ctx,x+11,y+4,38,1,'#b5976e');rect(ctx,x+77,y+4,43,1,'#947858');}
   rect(ctx,187,174,2,44,'#d2b485');rect(ctx,309,174,2,44,'#c8a777');
  },
  drawBed(ctx){
   rect(ctx,735,404,172,111,'#aa9571');rect(ctx,738,407,166,105,'#6e6450');rect(ctx,744,412,154,93,'#887054');
   rect(ctx,735,404,172,3,'#d0ba91');rect(ctx,735,407,3,105,'#c1a77f');rect(ctx,738,512,166,3,'#78654e');
   for(const[x,y,w,h]of[[744,414,45,1],[801,415,50,1],[856,414,33,1],[750,455,40,1],[821,460,55,1],[752,498,38,1]])rect(ctx,x,y,w,h,'#997d5b');
  },
  // Cache allocation is explicit and bounded, independent of frame count.
  stats:Object.freeze({canvases:1+sprites.length,rgbaBytes:(960*560+sprites.reduce((n,c)=>n+c.width*c.height,0))*4,animatedArtLayers:0})
 };
}

// Identical end-post silhouettes with equal15px margins. The rail terminates
// behind the two posts instead of protruding beyond the right canvas edge.
export const BACK_FENCE_LAYOUT=Object.freeze({startX:15,postCount:34,spacing:28,postWidth:6,top:32,postHeight:29});
export function drawBackFence(ctx){
 const rect=(x,y,w,h,c)=>{ctx.fillStyle=c;ctx.fillRect(x,y,w,h);},f=BACK_FENCE_LAYOUT;
 for(let i=0;i<f.postCount-1;i++){const x=f.startX+i*f.spacing+f.postWidth,w=f.spacing-f.postWidth;
  rect(x,38,w,5,i%3===1?'#ad956b':'#b29a70');rect(x,38,w,1,'#d0ba8c');rect(x,42,w,1,'#917a58');rect(x+3,40,7+i%3,1,i%2?'#c3aa7e':'#a28b65');
 }
 for(let i=0;i<f.postCount;i++){const x=f.startX+i*f.spacing;
  rect(x,32,6,29,i%3===2?'#b09a70':'#b6a078');rect(x,32,1,28,'#d1bc90');rect(x+5,33,1,28,'#8f7958');rect(x,32,6,2,'#d5bf91');rect(x+1,59,4,2,'#9d865f');rect(x+2+i%2,46+i%3,1,7,'#a18a63');rect(x+2,39,1,1,'#806d52');
 }
}
