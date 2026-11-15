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
 poly(g,[[633,309],[666,309],[687,319],[671,324],[640,319]],'#7a775847');
 poly(g,[[735,507],[907,507],[919,520],[911,527],[742,525]],'#6b765244');
 // Preserve the approved old road raster above all new ground decoration.
 rect(g,170,298,620,72,'#d0c298');rect(g,428,300,72,260,'#d0c298');rect(g,620,220,75,110,'#d0c298');for(let i=0;i<20;i++){const x=190+i*29;rect(g,x,326+(i%3)*9,12,3,'#beae83');}for(let i=0;i<7;i++)rect(g,449+(i%2)*18,390+i*22,14,3,'#beae83');
// Surface detail follows existing path shapes, never modifies walkability.
for(const [px,py,pw,ph] of [[170,298,620,72],[428,370,72,190],[620,220,75,78]]){rect(g,px,py,pw,3,'#dfd3ae');rect(g,px,py+ph-3,pw,3,'#b5a77f');for(let i=0;i<Math.floor(pw*ph/750);i++){const gx=px+8+(i*47)%(pw-16),gy=py+8+(i*31)%(ph-16);rect(g,gx,gy,2+i%2,1,i%2?'#e3d5ae':'#b4a57c');}}

 const sprites=trees.map((_,index)=>{
  const scale=trees[index][2],c=make(Math.ceil(64*scale),Math.ceil(88*scale)),p=c.getContext('2d'),seed=index+1;p.scale(scale,scale);p.translate(32,40);
  // Warm lit left edge of the trunk, cool brown right plane, two roots.
  poly(p,[[-5,18],[5,18],[5,42],[10,46],[-9,46],[-5,41]],'#79634d');
  rect(p,-4,19,3,23,'#b29867');rect(p,-1,29,2,12,'#937d57');rect(p,3,26,2,16,'#685944');
  const leaf=(x,y,w,h,color)=>poly(p,[[x+4,y],[x+w-6,y],[x+w-6,y+3],[x+w,y+3],[x+w,y+h-5],[x+w-4,y+h-5],[x+w-4,y+h],[x+3,y+h],[x+3,y+h-3],[x,y+h-3],[x,y+5],[x+4,y+5]],color);
  const round=seed%3===2;
  // Large overlapping foliage planes carry volume; a few warm pixels finish it.
  leaf(-25,-11,50,39,'#496b4d');leaf(-29,-10,24,28,'#567953');leaf(7,-17,22,36,'#3f624a');
  leaf(round?-23:-21,-27,round?46:42,39,'#6f8b59');leaf(-23,-21,30,29,'#819b65');
  leaf(-11,-37,28,26,'#91a76c');leaf(-16,-33,19,17,'#a6b77a');
  leaf(-23,-9,20,15,'#8fa66b');leaf(0,-15,22,21,'#78925c');leaf(-9,10,24,16,'#597d51');
  if(seed%3===0)leaf(14,-2,17,17,'#658851');
  // Per-placement deterministic accents, baked once. Light remains upper-left;
  // no new canvases, per-frame randomness or silhouette changes.
  const variants=[
   [[-14,-31,6,2],[-20,-17,4,3],[-14,-6,6,2],[5,-24,4,2]],
   [[-11,-30,4,3],[-18,-20,7,2],[-19,-8,4,3],[3,-23,3,2]],
   [[-15,-29,5,2],[-21,-16,3,2],[-12,-5,5,3],[7,-26,3,2]],
   [[-12,-32,5,2],[-17,-19,4,3],[-21,-7,6,2],[4,-22,4,2]]
  ];
  const accents=variants[(seed-1)%variants.length];
  const placement=Math.floor(trees[index][0]/30)+Math.floor(trees[index][1]/30);
  accents.forEach(([x,y,w,h],i)=>rect(p,x+(placement+i)%3-1,y+(Math.floor(placement/3)+i)%2,w,h,["#c0c98b","#b0bd7f","#b7c485","#a5b776"][i]));
  rect(p,7+seed%3,3+seed%2,4,2,"#94a86b");rect(p,-3+seed%4,16,4,2,"#8ca264");
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
