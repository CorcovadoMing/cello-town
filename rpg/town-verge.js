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
 // One low, spreading fan, subdued where gravel meets turf. The
 // outer shoot lies almost flat; taller leaves face back into the bed.
 function trailFan(x,z,angle,scale,seed,allows){
  const inks=['#8e9c60','#9eaa6c','#88985b','#a6ac6c'];
  const base=[x,1.53,z];
  for(let j=0;j<3;j++){
   const a=angle+(j-1)*.89+Math.sin(seed*1.8)*.24,u=Math.cos(a),v=Math.sin(a);
   const len=(3.4+j*.72)*scale,w=(.83+j*.15)*scale;
   const at=(r,g,h)=>[x+u*r-v*g,1.53+h,z+v*r+u*g];
   const fold=at(len*.57,0,(.82+j*.30)*scale),tip=at(len,0,(.48+j*.39)*scale);
   const under=at(len*.48,-w,.29*scale),over=at(len*.47,w*.89,.41*scale);
   const trailing=at(len*.79,-w*.64,.48*scale),wax=at(len*.83,w*.56,.61*scale);
   const ink=inks[(seed+j)%4];
   for(const [a,b,c,sh] of [[base,under,fold,[.83,.87,1.03]],[base,fold,over,[.83,1.03,.98]],
    [under,trailing,fold,[.87,.94,1.03]],[fold,wax,over,[1.03,1.10,.98]],
    [trailing,tip,fold,[.94,1.07,1.03]],[fold,tip,wax,[1.03,1.07,1.10]]]){
    if([a,b,c].every(([xx,,zz])=>allows(xx,zz)))tri(V(...a),V(...b),V(...c),ink,sh);
   }
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
 // Flat leaves form connected islands in the lawn; no upright whiskers
 // in the interior of the village.
 function cover(x,z,seed,scale=1){
  const turn=seed*2.399963,colors=['#8da866','#9bb579','#779655'];
  for(let j=0;j<3;j++){
   const theta=turn+j*TAU/3,u=Math.cos(theta),v=Math.sin(theta),w=.98*scale;
   const at=(f,g,y)=>V(x+u*f-v*g,y,z+v*f+u*g);
   const base=at(0,0,1.62),mid=at(w*1.16,0,2.28),end=at(w*2.20,0,1.96);
   const a=at(w*.87,-w*.62,1.77),b=at(w*.87,w*.62,1.72);
   const c=at(w*1.71,-w*.57,1.96),d=at(w*1.71,w*.57,1.92);
   const color=colors[(seed+j)%3];
   tri(base,a,mid,color,[.87,.95,1.08]);tri(base,mid,b,color,[.87,1.08,.93]);
   tri(a,c,mid,color,[.95,1.02,1.08]);tri(mid,d,b,color,[1.08,.98,.93]);
   tri(c,end,mid,color,[1.02,1.07,1.08]);tri(mid,end,d,color,[1.08,1.07,.98]);
  }
 }
 // Local 3D leaves for the cottage borders. One continuous vertex batch,
 // with open negative space near the ground rather than solid green lumps.
 function shrub(x,z,rx,rz,height,seed,palette){
  for(let i=0;i<54;i++){
   const a=i*2.399963+seed*.19,t=(i+.5)/54,q=Math.sqrt(t),r=.28+.72*q;
   const cx=x+Math.cos(a)*rx*r,cz=z+Math.sin(a)*rz*r;
   const jitter=.8+.20*Math.sin(seed+i*2.43);
   const tier=[.78,1,.91,.62][(i+seed)%4];
   const y=1.66+(height-1.66)*(.22+.78*Math.sqrt(1-t))*jitter*tier;
   const dir=a+(i%5-2)*.13,ux=Math.cos(dir),uz=Math.sin(dir),w=1.5+(i*7+seed)%8*.145;
   const len=2.0+w*(.86+(i%4)*.10);
   const tip=.34+(.26*Math.sin(i*1.337)),edge=i%3===0?.60:.81;
   const f=(r,offset,h)=>V(cx+ux*r-uz*offset,y+h,cz+uz*r+ux*offset);
   const root=f(-len*.35,0,-.45),mid=f(len*.40,0,.89),end=f(len,0,tip);
   const l=f(len*.04,-w*.72,.13),rgt=f(len*.10,w*.63,-.04);
   const ll=f(len*edge,-w*.52,.45),rr=f(len*.75,w*.53,.40);
   const ink=palette[(i+seed)%palette.length];
   tri(root,l,mid,ink,[.76,.88,1.07]);tri(root,mid,rgt,ink,[.76,1.07,.94]);
   tri(l,ll,mid,ink,[.86,1.03,1.13]);tri(mid,rr,rgt,ink,[1.13,.99,.87]);
   tri(ll,end,mid,ink,[1.03,1.16,1.13]);tri(mid,end,rr,ink,[1.13,1.16,.99]);
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
 return {flower,tuft,cover,shrub,trailFan,finish};
}
