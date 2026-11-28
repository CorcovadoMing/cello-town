// Longitudinal quads follow a bent blade. A wide, softly rounded tip avoids
// the thin bright needles that appeared when straight triangles overlapped.
const SECTIONS=Object.freeze([[0,.61],[.36,1],[.76,.71],[.96,.26]].map(Object.freeze));
export function softBlade(x,z,angle,height,width,bend,base=1.55){
 const ux=Math.cos(angle),uz=Math.sin(angle),nx=-uz,nz=ux;
 const at=(t,w)=>{
  const lean=(.10*t+.90*t*t)*bend;
  return [x+ux*lean+nx*w,base+height*(t-.115*t*t*t),z+uz*lean+nz*w];
 };
 const triangles=[];
 const vertex=(v,t,s)=>({v,t,s});
 for(let i=1;i<SECTIONS.length;i++){
  const [a,wa]=SECTIONS[i-1],[b,wb]=SECTIONS[i];
  const aa=vertex(at(a,-wa*width),a,-1),ab=vertex(at(a,wa*width),a,1);
  const ba=vertex(at(b,-wb*width),b,-1),bb=vertex(at(b,wb*width),b,1);
  triangles.push([aa,ab,ba],[ab,bb,ba]);
 }
 const [t,w]=SECTIONS.at(-1);
 triangles.push([vertex(at(t,-w*width),t,-1),vertex(at(t,w*width),t,1),vertex(at(1,0),1,0)]);
 return triangles;
}
