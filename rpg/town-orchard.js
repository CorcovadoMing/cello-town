// Handmade branch systems: blossom sprays grow on individual twigs rather
// than a stack of solid crown volumes. Each primary is [x,height,z,span].
const profiles=[
 {bark:'#78624d',leaf:['#57754b','#6a8b55','#87a268','#a5ad72'],height:49,limbs:[[-27,64,1,15],[-14,79,-9,16],[4,91,-2,15],[24,71,11,17],[32,60,3,13]]},
 {bark:'#827055',leaf:['#62794f','#769064','#91a673','#a7af7c'],height:64,limbs:[[-15,67,-2,12],[-11,83,7,12],[-4,98,-8,14],[6,112,-1,11],[16,88,5,12]]},
 {bark:'#70614b',leaf:['#526e55','#648462','#7e9873','#9faa7f'],height:49,limbs:[[-31,67,1,19],[-22,84,-5,15],[-9,94,0,12],[15,85,-7,16],[29,68,8,19]]},
 {bark:'#80654a',leaf:['#587947','#6c8c53','#87a060','#a1ac70'],height:44,limbs:[[-34,56,8,18],[-22,72,-5,17],[-2,81,-8,17],[20,68,3,20],[36,55,10,14]]},
 {bark:'#716650',leaf:['#566c43','#688053','#84955b','#9ea768'],height:58,limbs:[[-18,58,11,19],[21,64,0,18],[-13,81,-5,15],[12,94,-9,15],[-3,109,0,11]]},
 {bark:'#816d56',leaf:['#647e55','#799464','#91a875','#abb483'],height:46,limbs:[[-33,60,4,17],[-20,81,-8,13],[-8,96,-3,12],[21,84,-2,15],[30,64,8,18]]}
];
const recipe=[[0,-.12],[3,.08],[1,-.06],[2,.10],[4,.03],[5,-.20],[1,.13],[3,-.10],[2,.06],[5,.12],[0,.15],[2,-.13],[4,-.09],[1,.05]];
export function orchardProfile(index){return profiles[(recipe[index]?.[0]??index%profiles.length)];}
// Painted compound leaves, not external art or opaque crown sprites.
function leaflet(g,x,y,angle,len,wide,tone){
 g.save();g.translate(x,y);g.rotate(angle);
 const ink=g.createLinearGradient(0,1,wide,-len);
 ink.addColorStop(0,`rgb(${tone-35},${tone-31},${tone-39})`);
 ink.addColorStop(.57,`rgb(${tone-3},${tone},${tone-8})`);
 ink.addColorStop(1,`rgb(${Math.min(255,tone+20)},${Math.min(255,tone+21)},${Math.min(255,tone+10)})`);
 g.fillStyle=ink;g.beginPath();g.moveTo(-.7,0);
 g.bezierCurveTo(-wide,-len*.23,-wide*.72,-len*.75,.43,-len);
 g.bezierCurveTo(wide*.65,-len*.87,wide,-len*.38,.6,0);g.closePath();g.fill();
 g.strokeStyle='rgba(248,248,236,.17)';g.lineWidth=.6;g.beginPath();g.moveTo(.5,-1);g.quadraticCurveTo(wide*.10,-len*.48,.61,-len*.86);g.stroke();g.restore();
}
export function makeOrchardLeaf(T){
 const c=document.createElement('canvas');c.width=c.height=128;
 const g=c.getContext('2d');
 // An asymmetric cluster of five fronds: enough overlapping silhouettes
 // to read at phone scale, but the alpha still keeps spaces between tips.
 const stems=[[62,116,-.73,58],[61,105,.78,53],[63,101,-.31,78],[67,89,.46,65],[65,82,.04,70]];
 for(let i=0;i<stems.length;i++){
  const [x,y,a,len]=stems[i];
  g.save();g.translate(x,y);g.rotate(a);
  g.strokeStyle='#b3b09b';g.lineWidth=1.45;
  g.beginPath();g.moveTo(0,0);g.quadraticCurveTo(3,-len*.48,0,-len);g.stroke();
  for(let j=0;j<5;j++){
   const d=.19+j*.153,h=(18+((i*5+j*7)%8))*(1-j*.06),tone=224+((i*17+j*23)%27);
   leaflet(g,1.7,-len*d,-.75-j*.04,h,5.0-j*.28,tone+6);
   if((i+j)%5!==3)leaflet(g,1.7,-len*(d+.075),.71+j*.09,h*.91,4.7-j*.28,tone);
  }
  leaflet(g,0,-len*.87,.13,15,4,224);g.restore();
 }
 const texture=new T.CanvasTexture(c);
 texture.colorSpace=T.SRGBColorSpace;texture.anisotropy=2;
 const geometry=new T.PlaneGeometry(1,1);
 // MeshLambert's texture and alpha threshold are forwarded by Three's
 // directional depth material, giving fine perforated leaf shadows.
 const material=new T.MeshLambertMaterial({map:texture,alphaTest:.38,side:T.DoubleSide,
  emissive:'#778967',emissiveIntensity:.29});
 material.shadowSide=T.DoubleSide;
 return {geometry,material};
}
export function addOrchardTree({shape},x,z,scale,index){
 const p=orchardProfile(index),bias=recipe[index]?.[1]??0,shift=bias*21;
 let seed=137+(index+1)*719;
 const next=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 const branch=(a,b,thickness,tint)=>{
  const [ax,ay,az]=a,[bx,by,bz]=b,dx=bx-ax,dy=by-ay,dz=bz-az;
  shape('trunk',x+(ax+bx)*scale/2,(ay+by)*scale/2,z+(az+bz)*scale/2,thickness*scale,Math.hypot(dx,dy,dz)*scale,thickness*scale,tint,
   Math.atan2(dz,dy),0,-Math.atan2(dx,Math.hypot(dy,dz)));
 };
 const near=(a,b,t)=>a.map((v,i)=>v+(b[i]-v)*t);
 const foot=[0,-1,0],bend=[shift*.6,27,0],top=[shift,p.height,-1];
 branch(foot,bend,8.6+(index%3),p.bark);
 branch(bend,top,6.6+(index%3)*.55,p.bark);
 // Side bark edges and roots give structure without masking the small trunk.
 for(const [j,root] of [[0,[-8,0,2]],[1,[7,0,3]],[2,[1,0,-6]]])branch(root,[0,10,0],3.5-j*.24,p.bark);
 for(const [j,[tx,th,tz,span]] of p.limbs.entries()){
  const side=Math.sign(tx||1),tip=[tx+shift,th+(next()-.5)*6,tz],fork=near(bend,top,.30+j*.13),elbow=near(fork,tip,.55);
  elbow[0]+=side*5;elbow[1]-=2;
  branch(fork,elbow,3.8-j*.30,p.bark);branch(elbow,tip,2.55-j*.23,p.bark);
  for(let k=0;k<4;k++){
   const anchor=near(elbow,tip,.27+k*.19),phi=(k/4)*Math.PI*2+bias*7+j*.46;
   const end=[anchor[0]+Math.cos(phi)*span*.64,anchor[1]+4.8+(k%3)*1.3,anchor[2]+Math.sin(phi)*span*.58];
   branch(anchor,end,.82,p.bark);
   for(let m=0;m<2;m++){
    const v=near(anchor,end,.54+m*.40),side=m?1:-1,wide=21+next()*9;
    v[0]+=side*Math.sin(phi)*3;v[1]+=4+m*2;v[2]+=side*Math.cos(phi)*4;
    shape('orchard-leaf',x+v[0]*scale,v[1]*scale,z+v[2]*scale,wide*scale,(wide*.77+next()*5)*scale,1,
     p.leaf[2+((j+k+m)%2)],-.29+(next()-.5)*.78,phi*.59+side*.69,-.63+next()*1.28);
   }
  }
  const light=near(elbow,tip,.77),w=22+next()*6;
  shape('orchard-leaf',x+light[0]*scale,(light[1]+9)*scale,z+(light[2]-2)*scale,w*scale,w*.81*scale,1,
   p.leaf[3],-.26,bias+j*.49,side*.37);

 }
}
// Same wall clock and 12-minute loop already used by the weather selector;
// a continuous bounded arc supplies the real WebGL directional shadow map.
const TOWN_CYCLE_MS=720000,TAU=Math.PI*2;
export function townSunVector(now){
 const angle=TAU*((now%TOWN_CYCLE_MS+TOWN_CYCLE_MS)%TOWN_CYCLE_MS)/TOWN_CYCLE_MS;
 return {x:45+270*Math.cos(angle),y:705+45*Math.sin(angle),z:-280+55*Math.sin(angle)};
}
