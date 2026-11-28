import {softBlade} from './town-plant-form.js?v=1';
// Low, readable botanical silhouettes for the playable foreground. Static
// vertex colours keep the whole planting in one lit batch.
const TAU=Math.PI*2;
export function makeVerge(T,scene,W,H){
 const position=[],color=[],inks=new Map();
 const V=(x,y,z)=>[x-W*.5,y,z-H*.5];
 const tri=(a,b,c,hex,shades=[1,1,1])=>{
  if(!inks.has(hex))inks.set(hex,new T.Color(hex));
  const ink=inks.get(hex);
  position.push(...a,...b,...c);
  for(const q of shades)color.push(ink.r*q,ink.g*q,ink.b*q);
 };
 function blade(x,z,a,h,w,ink){
  const shape=softBlade(x,z,a,h*.82,w*1.16,h*.74,1.45);
  for(const t of shape){
   const v=t.map(({v})=>V(...v)),sh=t.map(({t,s})=>.86+.26*t-.032*s);
   tri(...v,ink,sh);
  }

 }
 function flower(x,y,z,tone,seed,scale=1){
  const petalCount=[5,6,5][seed%3],radius=(2.65+(seed%4)*.24)*scale;
  const face=seed*2.399963,tilt=.17+.08*(seed%3);
  const v=(a,r,h=0)=>V(x+Math.cos(a)*r,y+Math.sin(a-face)*r*tilt+h,z+Math.sin(a)*r);
  const center=v(0,0),floret=['#efbe64','#e5a450','#eec46e'][seed%3];
  for(let i=0;i<petalCount;i++){
   const a=face+i*TAU/petalCount,d=TAU/petalCount*.36;
   const r=radius*(1+.07*Math.sin(seed+i*2)),start=v(a,r*.21),tip=v(a,r,.35);
   const trimL=v(a-d*.40,r*.88,.19),trimR=v(a+d*.40,r*.88,.06);
   const left=v(a-d,r*.70,.16),right=v(a+d,r*.70,.02);
   const mid=v(a,r*.63,.33);
   tri(start,left,mid,tone,[.73,.92,1.03]);tri(start,mid,right,tone,[.73,1.03,.85]);
   tri(left,trimL,mid,tone,[.92,1.07,1.03]);tri(mid,trimL,tip,tone,[1.03,1.07,1.13]);
   tri(mid,tip,trimR,tone,[1.03,1.13,.97]);tri(mid,trimR,right,tone,[1.03,.97,.85]);
   tri(center,v(a+.02,r*.275,.39),v(a+TAU/petalCount+.02,r*.275,.39),floret,[1.12,1,.85]);
  }
  if(seed%3!==1){
   blade(x-.44,z+.5,face+.6,3.5*scale,.82*scale,'#779557');
   blade(x+.44,z-.5,face-2,4.7*scale,.96*scale,'#8ea665');
  }
 }
 function tuft(x,z,h,ink,seed){
  for(let i=0;i<3+seed%2;i++){
   const a=seed*2.399963+i*1.83;
   blade(x+Math.sin(a)*.86,z+Math.cos(a)*.8,a,h*(.67+(i+seed)%5*.14),.50+(i+seed)%4*.15,ink);
  }
 }
 function finish(){
  if(!position.length)return null;
  const geo=new T.BufferGeometry();
  geo.setAttribute('position',new T.Float32BufferAttribute(position,3));
  geo.setAttribute('color',new T.Float32BufferAttribute(color,3));
  geo.computeVertexNormals();
  const mesh=new T.Mesh(geo,new T.MeshStandardMaterial({side:T.DoubleSide,vertexColors:true,roughness:.91,emissive:'#4a5732',emissiveIntensity:.12}));
  mesh.name='Playable meadow: cupped petals and folded leaf blades';mesh.receiveShadow=true;
  scene.add(mesh);
  return mesh;
 }
 return {flower,tuft,finish};
}
