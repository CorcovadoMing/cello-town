// Purely visual craft in map coordinates. The path, pond blocker and task
// positions still belong to the original 2D gameplay controller.
const TAU=Math.PI*2;
const SHADOWS=Object.freeze([
 [221,224,55,22,.42],[490,238,41,17,.32],[440,230,18,12,.36],[540,230,18,12,.36],
 [250,462,24,15,.42],[249,449,10,6,.35],[246,473,11,6,.39],
 [38,416,14,8,.32],[256,521,17,11,.35],[26,423,10,6,.31],
 [57,402,13,7,.34],[242,405,13,7,.34],[283,464,17,9,.25],[287,510,19,10,.28],
 [330,348,10,5,.15],[424,365,11,6,.15],[533,368,10,5,.16]
]);
export function groundContactSeeds(trees,room){
 return [...SHADOWS,
  ...trees.map(([x,z,s])=>[x,z+46*s,11*s,8*s,.34]),
  [room.x+104,room.depth+1,91,31,.41],
  [room.x+78,room.depth+6,23,11,.31],
  [room.x+132,room.depth+6,23,11,.31]];
}
function contactMap(T,W,H,seeds){
 const c=document.createElement('canvas');c.width=960;c.height=560;
 const g=c.getContext('2d');
 // Dark contact core + wider pale feather, packed into one stable texture.
 for(const [x,z,rx,rz,alpha] of seeds){
  for(const [shift,scale,a] of [[2.4,1.72,alpha*.42],[0,.78,alpha]]){
   g.save();g.translate(x+shift,z+shift*.5);g.rotate(-.11);g.scale(rx*scale,rz*scale);
   const ink=g.createRadialGradient(0,0,.045,0,0,1);
   ink.addColorStop(0,`rgba(37,44,27,${a})`);ink.addColorStop(.41,`rgba(42,47,31,${a*.70})`);
   ink.addColorStop(.74,`rgba(53,55,39,${a*.28})`);ink.addColorStop(1,'rgba(53,55,39,0)');
   g.fillStyle=ink;g.fillRect(-1,-1,2,2);g.restore();
  }
 }
 const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;t.anisotropy=2;return t;
}
// There is one open southwest corner beyond the visible map.
export const OPEN_POND_BANK=Object.freeze([
 [-14,465],[5,451],[21,433],[39,420],[56,411],[78,405],[98,400],
 [122,402],[146,397],[169,398],[192,404],[211,407],[230,419],
 [243,433],[251,450],[254,467],[253,481],[246,496],[235,510],
 [218,522],[205,532],[197,548],[193,566],[191,576],[-14,576]
].map(Object.freeze));
export const OPEN_POND_UV=Object.freeze({x:120,z:484,w:282,h:193});
function shorelineContact(T,scene,W,H){
 const {x:cx,z:cz,w,h}=OPEN_POND_UV;
 const c=document.createElement('canvas');c.width=768;c.height=584;
 const g=c.getContext('2d');g.scale(c.width/w,c.height/h);g.translate(w/2,h/2);
 let seed=81931;
 const rnd=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
 const edges=OPEN_POND_BANK.slice(1,-1).map(([ax,az],i)=>{
  const [x,z]=OPEN_POND_BANK[i],len=Math.hypot(ax-x,az-z),tx=(ax-x)/len,tz=(az-z)/len;
  return [x-cx,z-cz,tx,tz,-tz,tx,len];
 });
 function line(x,y,a,b,color,width){
  g.beginPath();g.moveTo(x,y);g.lineTo(a,b);g.strokeStyle=color;g.lineWidth=width;g.stroke();
 }
 for(const [x,z,tx,tz,nx,nz,len] of edges){
  // At the rim, patchy silt gives way to scattered grits and submerged leaves.
  for(let q=0;q<len;q+=1.15){
   const wav=Math.sin(q*.17)*1.8+Math.sin(q*.046)*3.1+Math.sin(q*.64)*.65;
   const pocket=.30+.70*Math.pow((1+Math.sin(q*.097+len))/2,1.2);
   const u=x+tx*q,v=z+tz*q;
   const reach=(9+wav+4*rnd())*pocket;
   const grad=g.createLinearGradient(u-nx*3,v-nz*3,u+nx*reach,v+nz*reach);
   grad.addColorStop(0,'rgba(77,82,51,0)');
   grad.addColorStop(.24,'rgba(63,71,46,.59)');
   grad.addColorStop(.44,'rgba(105,103,65,.44)');
   grad.addColorStop(.72,'rgba(162,150,93,.22)');
   grad.addColorStop(1,'rgba(157,148,95,0)');
   line(u-nx*3,v-nz*3,u+nx*reach,v+nz*reach,grad,1.65+rnd()*.8);
  }
  for(let i=0;i<len*2.1;i++){
   const q=1+rnd()*(len-2),offset=-3+Math.pow(rnd(),1.75)*15;
   const u=x+tx*q+nx*offset,v=z+tz*q+nz*offset;
   const r=.14+rnd()*.73,s=.22+rnd()*1.06;
   const color=['#263c2c75','#b9b18490','#d3c4a168','#859c6a85','#594a3668'][i%5];
   g.beginPath();g.ellipse(u,v,s,r,rnd()*Math.PI,0,TAU);g.fillStyle=color;g.fill();
   if(i%7===0&&offset>1)line(u-s*.5,v-r*.38,u+s*.62,v-r*.29,'#e0d6ad77',.22);
  }
 }
 // Actual reed clusters get irregular roots, plant shade and small litter.
 for(const [x,z,ang] of [[47,417,.16],[18,432,-1.12],[208,530,-1.7],[253,443,2.4],
  [249,488,2.91],[252,510,3.42],[118,402,1.6]]){
  g.save();g.translate(x-cx,z-cz);g.rotate(ang);
  const shade=g.createRadialGradient(0,0,.1,0,0,1);shade.addColorStop(0,'#364b308b');shade.addColorStop(1,'#364b3000');
  g.save();g.scale(8,3.7);g.fillStyle=shade;g.fillRect(-1,-1,2,2);g.restore();
  for(let j=0;j<12;j++){
   const ax=(rnd()-.5)*6,az=(rnd()-.5)*3,bx=ax+1+rnd()*6,bz=az+(rnd()-.5)*2.8;
   g.beginPath();g.moveTo(ax,az);g.quadraticCurveTo((ax+bx)*.5,(az+bz)*.5+.9,bx,bz);
   g.lineWidth=.2+rnd()*.44;g.strokeStyle=j%3===0?'#d8c79890':'#4d593b86';g.stroke();
  }
  g.restore();
 }
 const atlas=new T.CanvasTexture(c);atlas.colorSpace=T.SRGBColorSpace;atlas.anisotropy=2;
 const material=new T.MeshBasicMaterial({map:atlas,transparent:true,depthWrite:false,
  polygonOffset:true,polygonOffsetFactor:-1,opacity:.86});
 const shelf=new T.Mesh(new T.PlaneGeometry(w,h),material);
 shelf.rotation.x=-Math.PI/2;shelf.position.set(cx-W/2,2.19,cz-H/2);shelf.renderOrder=3;scene.add(shelf);
 return weather=>{material.opacity=weather==='rain'?.98:weather==='breeze'?.9:.83;};
}
function farMeadow(T,scene,W,H){
 const geo=new T.PlaneGeometry(1450,640,55,31);geo.rotateX(-Math.PI/2);
 const p=geo.attributes.position,rgb=new Float32Array(p.count*3);
 const cloth=new T.Color('#818c69'),tint=new T.Color('#a6a48a');
 for(let i=0;i<p.count;i++){
  const x=p.getX(i),z=p.getZ(i);
  const fade=Math.min(1,Math.max(0,(249-z)/410));
  const hill=(Math.sin(x*.0054+z*.009)*15+Math.cos(x*.011-z*.01)*10)*fade;
  const h=-37+fade*36+hill;
  p.setY(i,h);
  const s=.31+(.5+.5*Math.sin(x*.012+z*.019))*.23+fade*.18;
  rgb[i*3]=cloth.r+(tint.r-cloth.r)*s;rgb[i*3+1]=cloth.g+(tint.g-cloth.g)*s;rgb[i*3+2]=cloth.b+(tint.b-cloth.b)*s;
 }
 geo.setAttribute('color',new T.BufferAttribute(rgb,3));geo.computeVertexNormals();
 const mesh=new T.Mesh(geo,new T.MeshLambertMaterial({vertexColors:true}));
 mesh.position.set(55,0,-H/2-225);mesh.visible=false;scene.add(mesh);return mesh;
}
export function addShoreCraft({T,scene,W,H,trees,room,shape}){
 const shadowTex=contactMap(T,W,H,groundContactSeeds(trees,room));
 const contact=new T.Mesh(new T.PlaneGeometry(W,H),new T.MeshBasicMaterial({map:shadowTex,transparent:true,depthWrite:false,
  opacity:.90,polygonOffset:true,polygonOffsetFactor:-2}));
 contact.rotation.x=-Math.PI/2;contact.position.y=1.37;contact.renderOrder=2;scene.add(contact);
 const hills=farMeadow(T,scene,W,H),updateShelf=shorelineContact(T,scene,W,H);
 let seed=40839;
 const rand=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
 const stone=['#8b896b','#929472','#aaa381','#b8ad88','#6f806e','#8d9579'];
 const bank=['#839965','#91986a','#9aa077','#adab7e'];
 const leaf=['#647d54','#7c935a','#8d9f63','#adad69'];
 const rock=(x,z,h=1)=>shape('sphere',x,1.06+h*.35,z,1.7+rand()*5.4,h*(1+rand()*2.6),2.1+rand()*4,stone[Math.floor(rand()*stone.length)],rand()*.28,rand()*TAU,(rand()-.5)*.24);
 // Eroded pockets alternate stones, moss and earth instead of a straight curb.
 for(const [x,z,rx,rz,quantity] of [[201,550,5,10,7],[198,568,5,9,8],[202,532,20,10,9],[255,516,7,17,8],
  [260,481,8,23,8],[256,433,9,18,10],[221,401,19,7,8],[130,399,24,9,8],
  [77,405,19,8,7],[40,418,10,5,6],[17,434,8,7,8]]){
  for(let i=0;i<quantity;i++){
   const a=rand()*TAU,r=Math.sqrt(rand()),dx=x+Math.cos(a)*rx*r,dz=z+Math.sin(a)*rz*r;
   if(i%3===1)shape('sphere',dx,1.28,dz,3+rand()*5,.30+rand()*.36,1.6+rand()*4,bank[i%bank.length],0,rand()*TAU);
   else rock(dx,dz,.72+rand()*.74);
  }
 }
 // An old, tiny angler's step projects from the reeds, with a real gap
 // underneath it and metal fasteners. It is entirely inside the pond blocker.
 for(const [x,z] of [[231,457],[231,471],[256,457],[256,471]]){
  shape('weathered-board',x,2.6,z,2.6,7.8,2.4,'#79664c',.03,.06,.045);
 }
 shape('weathered-board',243.5,5.1,456.5,28,2,2.2,'#9d8561',0,.015,0);
 shape('weathered-board',243.5,5.1,472,28,2,2.3,'#8d7958',0,-.012,0);
 for(let i=0;i<6;i++){
  const x=230+i*4.82,z=464+(rand()-.5)*1.75;
  shape('weathered-board',x,6.8+rand()*.16,z,4.55,1.25,17.8+(rand()-.5)*2.1,
   ['#bea372','#a38b63','#b69969','#bfa67e'][i%4],(rand()-.5)*.045,(rand()-.5)*.05,(rand()-.5)*.048);
  for(const dz of [-5.9,6.2])shape('sphere',x,7.54,z+dz,.42,.16,.44,'#6d6c5e');
 }
 for(const [cx,cz,k] of [[47,417,4],[18,432,4],[208,530,3],[253,443,5],[249,488,5],[252,510,8],[118,402,4]]){
  for(let i=0;i<k;i++){
   const x=cx+(rand()-.5)*11,z=cz+(rand()-.5)*9,h=8+rand()*14;
   const lean=(rand()-.5)*.25;
   shape('trunk',x,h*.49,z,.58,h,.58,leaf[i%leaf.length],lean,0,-.10,.29);
   if(i%3===0)shape('sphere',x+h*.04,h*.94,z-h*.03,.83,2.7,1,'#86734b',lean,0,-.10,.34);
   const sign=i%2?1:-1;
   shape('cone',x+sign*1.63,h*.36,z,.77,h*.64,.70,leaf[(i+1)%leaf.length],.19,rand()*TAU,sign*.42,.34);
  }
 }
 // Reed stems stay at the waterline. Land flowers are composed by the
 // same curated village beds as the rest of the overland planting.
 return (weather,close)=>{
  updateShelf(weather);hills.visible=close;contact.material.opacity=weather==='sun'?.94:weather==='rain'?.69:.84;
 };
}
