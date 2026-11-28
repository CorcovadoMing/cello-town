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
// A pointed irregular polygon with front and back ridges. Texture-free
// raised faces catch light and cast real broken-up leaves into the shadows.
export function makeOrchardLeaf(T){
 const cut=[[0,-.59],[-.23,-.40],[-.49,-.15],[-.41,.21],[-.27,.45],[-.06,.57],[.14,.55],[.30,.39],[.44,.09],[.36,-.17],[.20,-.44]];
 const vertices=[0,0,.16,0,0,-.13,...cut.flatMap(([x,y])=>[x,y,0])],indices=[];
 for(let i=0;i<cut.length;i++){
  const a=2+i,b=2+(i+1)%cut.length;
  indices.push(0,b,a,1,a,b);
 }
 const g=new T.BufferGeometry();
 g.setAttribute('position',new T.Float32BufferAttribute(vertices,3));g.setIndex(indices);g.computeVertexNormals();
 return g;
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
  // Three overlapping broadlets hold the upper canopy together while
  // branches below and the gaps between primary arms remain legible.
  const hub=near(elbow,tip,.68);
  for(let m=0;m<3;m++){
   const u=m-1,wide=13+next()*6;
   shape('orchard-leaf',x+(hub[0]+u*5)*scale,(hub[1]+7+u*2)*scale,z+(hub[2]+u*5)*scale,
    wide*scale,wide*.95*scale,4.2*scale,p.leaf[m===0?1:2],.22,bias+j*.57+u*.46,-u*.53);
  }
  for(let k=0;k<4;k++){
   const anchor=near(elbow,tip,.30+k*.19),phi=(k/4)*Math.PI*2+bias*7+j*.46;
   const end=[anchor[0]+Math.cos(phi)*span*.60,anchor[1]+4.8+(k%3)*1.3,anchor[2]+Math.sin(phi)*span*.58];
   branch(anchor,end,.82,p.bark);
   for(let m=0;m<6;m++){
    const v=near(anchor,end,.16+m*.18),offset=m%2===0?-1:1;
    v[0]+=(Math.sin(phi)*offset*(2.0+next()*5));v[1]+=(next()-.4)*4;v[2]+=Math.cos(phi)*offset*(2.0+next()*5);
    const length=(11+next()*8)*(k===3?.87:1.03),width=length*(.73+next()*.24);
    shape('orchard-leaf',x+v[0]*scale,v[1]*scale,z+v[2]*scale,width*scale,length*scale,(3.7+next()*2.2)*scale,
     p.leaf[Math.min(3,(m<2?0:1)+(Math.floor(next()*3)))],(next()-.5)*1.0,phi+(next()-.5)*1.7,(next()-.5)*1.45+offset*.42);
   }
  }
 }
}
// Same wall clock and 12-minute loop already used by the weather selector;
// a continuous bounded arc supplies the real WebGL directional shadow map.
const TOWN_CYCLE_MS=720000,TAU=Math.PI*2;
export function townSunVector(now){
 const angle=TAU*((now%TOWN_CYCLE_MS+TOWN_CYCLE_MS)%TOWN_CYCLE_MS)/TOWN_CYCLE_MS;
 return {x:45+270*Math.cos(angle),y:705+45*Math.sin(angle),z:-280+55*Math.sin(angle)};
}
