// Purely visual craft in map coordinates. The path, pond blocker and task
// positions still belong to the original 2D gameplay controller.
const TAU=Math.PI*2;
const SHADOWS=Object.freeze([
 [221,224,55,22,.42],[490,238,41,17,.32],[440,230,18,12,.36],[540,230,18,12,.36],
 [250,462,24,15,.42],[249,449,10,6,.35],[246,473,11,6,.39],
 [48,425,14,12,.32],[256,521,17,11,.35],[110,530,19,8,.31],
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
 const hills=farMeadow(T,scene,W,H);
 let seed=40839;
 const rand=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
 const stone=['#8b896b','#929472','#aaa381','#b8ad88','#6f806e','#8d9579'];
 const bank=['#839965','#91986a','#9aa077','#adab7e'];
 const leaf=['#647d54','#7c935a','#8d9f63','#adad69'];
 const rock=(x,z,h=1)=>shape('sphere',x,1.06+h*.35,z,1.7+rand()*5.4,h*(1+rand()*2.6),2.1+rand()*4,stone[Math.floor(rand()*stone.length)],rand()*.28,rand()*TAU,(rand()-.5)*.24);
 // Eroded pockets alternate stones, moss and earth instead of a straight curb.
 for(const [x,z,rx,rz,quantity] of [[64,526,21,5,7],[147,534,23,6,8],[202,532,20,10,9],[255,516,7,17,8],
  [260,481,8,23,8],[256,433,9,18,10],[221,401,19,7,8],[130,399,24,9,8],
  [77,405,19,8,7],[40,430,9,14,6],[39,494,7,13,8]]){
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
 for(const [cx,cz,k] of [[46,437,4],[74,525,4],[200,524,3],[253,443,5],[249,488,5],[252,510,8],[118,402,4]]){
  for(let i=0;i<k;i++){
   const x=cx+(rand()-.5)*11,z=cz+(rand()-.5)*9,h=8+rand()*14;
   const lean=(rand()-.5)*.25;
   shape('trunk',x,h*.49,z,.58,h,.58,leaf[i%leaf.length],lean,0,-.10,.29);
   if(i%3===0)shape('sphere',x+h*.04,h*.94,z-h*.03,.83,2.7,1,'#86734b',lean,0,-.10,.34);
   const sign=i%2?1:-1;
   shape('cone',x+sign*1.63,h*.36,z,.77,h*.64,.70,leaf[(i+1)%leaf.length],.19,rand()*TAU,sign*.42,.34);
  }
 }
 for(const [x,z,count] of [[288,409,8],[315,435,9],[335,470,8],[357,272,7],[397,285,6],[565,405,8],[894,339,7]]){
  for(let i=0;i<count;i++){
   const dx=x+(rand()-.5)*15,dz=z+(rand()-.5)*12,h=3.1+rand()*8.5;
   shape('trunk',dx,1+h*.46,dz,.56,h,.51,leaf[i%4],.07,.01,rand()*.18,.23);
   shape('sphere',dx+.25,1+h,dz,1.3+rand(),.5+rand()*.78,1.15+rand(),['#d9cc91','#e3d9af','#bfa4a0','#d0bb84'][i%4],.21,0,0,.29);
  }
 }
 return (weather,close)=>{
  hills.visible=close;contact.material.opacity=weather==='sun'?.94:weather==='rain'?.69:.84;
 };
}
