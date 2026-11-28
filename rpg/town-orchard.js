// Each tuple describes a crown lobe [x,height,z,width,height,depth,palette].
// Botanical character comes from unique silhouettes, not recoloured clones.
const profiles=[
 {bark:'#786e54',palette:['#6c885e','#819667','#99a672'],height:47,crown:[[-19,51,2,20,17,17,0],[12,55,3,24,21,19,1],[-9,66,-7,21,18,18,1],[5,76,-6,15,13,13,2]]},
 {bark:'#887259',palette:['#759168','#8da178','#adb884'],height:57,crown:[[-7,62,0,19,26,16,0],[9,60,6,15,23,13,1],[0,80,-3,15,23,14,1],[-1,95,-3,10,13,9,2]]},
 {bark:'#706750',palette:['#637c62','#829777','#9aaa82'],height:48,crown:[[-17,61,-2,24,26,19,0],[17,62,4,21,23,17,1],[-12,79,-4,18,17,15,1],[11,80,1,14,17,14,2]]},
 {bark:'#816d50',palette:['#758a57','#879d64','#a1ad72'],height:42,crown:[[-20,50,4,21,15,19,0],[16,51,7,24,17,20,1],[-3,58,-6,24,19,18,1],[-3,69,-9,16,13,12,2],[24,47,-1,13,13,13,0]]},
 {bark:'#766950',palette:['#657b54','#829263','#9da976'],height:55,crown:[[-10,49,0,24,16,20,0],[9,62,3,23,18,19,0],[-8,74,-2,20,15,16,1],[5,87,-4,17,16,13,2],[-1,103,-4,10,10,9,1]]},
 {bark:'#81765e',palette:['#78906a','#91a77a','#afbb88'],height:44,crown:[[-22,51,8,18,16,16,0],[-12,66,0,21,18,17,1],[13,57,7,22,15,17,0],[17,69,-2,18,17,15,2],[1,78,-6,15,13,13,1]]}
];
// Explicit planting order from the inherited town anchors. Tiny per-tree
// differences resolve the few species that occur more than once.
const recipe=[[0,-.12],[3,.08],[1,-.06],[2,.10],[4,.03],[5,-.20],[1,.13],[3,-.10],[2,.06],[5,.12],[0,.15],[2,-.13],[4,-.09],[1,.05]];
export function orchardProfile(index){return profiles[(recipe[index]?.[0]??index%profiles.length)];}
export function addOrchardTree({shape,sphere},x,z,scale,index){
 const p=orchardProfile(index),bias=recipe[index]?.[1]??0,shift=bias*22;
 const branch=(ax,ay,az,bx,by,bz,thickness,tint)=>{
  const dx=bx-ax,dy=by-ay,dz=bz-az;
  shape('trunk',x+(ax+bx)*scale/2,(ay+by)*scale/2,z+(az+bz)*scale/2,thickness*scale,Math.hypot(dx,dy,dz)*scale,thickness*scale,tint,
   Math.atan2(dz,dy),0,-Math.atan2(dx,Math.hypot(dy,dz)));
 };
 branch(0,-1,0,shift,p.height,0,8+(index%3),p.bark);
 branch(shift*.4,p.height*.55,0,-13+shift,p.height+14,4,4.7,p.bark);
 branch(shift*.65,p.height*.68,0,14+shift,p.height+11,-5,4.4,p.bark);
 for(const [j,[dx,h,dz,rx,ry,rz,i]] of p.crown.entries()){
  const v=1+(((index+2)*(j+3))%7-3)*.018;
  sphere(x+(dx+shift)*scale,h*scale,z+dz*scale,rx*scale*v,ry*scale,rz*scale/v,p.palette[i],bias,(index*.61+j*.52)%6.28,bias*(j%2?-1:1));
 }
}
// Same wall clock and 12-minute loop already used by the weather selector;
// a continuous bounded arc supplies the real WebGL directional shadow map.
const TOWN_CYCLE_MS=720000,TAU=Math.PI*2;
export function townSunVector(now){
 const angle=TAU*((now%TOWN_CYCLE_MS+TOWN_CYCLE_MS)%TOWN_CYCLE_MS)/TOWN_CYCLE_MS;
 return {x:45+270*Math.cos(angle),y:705+45*Math.sin(angle),z:-280+55*Math.sin(angle)};
}
