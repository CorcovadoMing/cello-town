// Upright boughs hold an irregular solid silhouette; actual leaf clusters
// follow the surface, so an orchard crown is neither a ball nor a curtain.
const profiles=[
 ['#78624d','#6f964f','#9db969',44,67,43,61],
 ['#7d6950','#759853','#a4bf72',45,57,49,57],
 ['#78634c','#669055','#91b270',42,71,49,64],
 ['#80654a','#789d4e','#b2c67b',44,74,50,61],
 ['#79654d','#628949','#92b367',46,59,47,59],
 ['#816d56','#729751','#a3ba71',42,70,41,63]
];
const recipe=[0,3,1,2,4,5,1,3,2,5,0,2,4,1];
const firAt=new Set([2,4,9,12]);
export const orchardFamily=i=>firAt.has(i)?'fir':'broadleaf';
export const orchardProfile=i=>profiles[recipe[i]??i%profiles.length];
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
 g.strokeStyle='rgba(248,248,236,.17)';g.lineWidth=.6;g.beginPath();g.moveTo(.5,-1);g.quadraticCurveTo(wide*.10,-len*.48,.61,-len*.86);g.stroke();
 if(len>16){
  g.strokeStyle='rgba(248,245,218,.105)';g.lineWidth=.44;g.beginPath();
  for(const u of [.31,.48,.64]){g.moveTo(.4,-len*u);g.lineTo(-wide*.54,-len*(u+.15));g.moveTo(.4,-len*u);g.lineTo(wide*.50,-len*(u+.15));}
  g.stroke();
 }
 g.restore();
}
export function makeOrchardLeaf(T){
 const c=document.createElement('canvas');c.width=c.height=256;
 const g=c.getContext('2d');g.scale(4/3,4/3);
 // A leaf cluster grows from irregular adjacent fingers, not a single fan.
 // Deep leaves read as one full mass; brighter broad leaves break the rim.
 let seed=4723;
 const next=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 const tau=Math.PI*2;
 for(const [r,n,tone] of [[.88,34,205],[.63,31,217],[.39,23,226],[.14,11,236]]){
  for(let j=0;j<n;j++){
   const a=(j+next()*.65)/n*tau+r;
   const ripple=1+.12*Math.cos(a*3-.63)+.075*Math.sin(a*7);
   const d=r*(.86+next()*.26)*ripple;
   const x=96+Math.sin(a)*d*64,y=98-Math.cos(a)*d*59;
   const len=17+next()*15,wide=len*(.35+next()*.13);
   leaflet(g,x,y,a+(next()-.5)*1.32,len,wide,tone+Math.round(next()*27));
  }
 }
 for(let j=0;j<31;j++){
  const a=next()*tau,r=Math.sqrt(next())*.79;
  const x=97+Math.sin(a)*r*68,y=103-Math.cos(a)*r*62;
  const len=9+next()*13;
  leaflet(g,x,y,a*1.20+.4,len,len*.38,219+Math.round(next()*35));
 }
 const texture=new T.CanvasTexture(c);
 texture.colorSpace=T.SRGBColorSpace;texture.anisotropy=2;
 const geometry=new T.PlaneGeometry(1,1);
 // MeshLambert's texture and alpha threshold are forwarded by Three's
 // directional depth material, giving fine perforated leaf shadows.
 const material=new T.MeshLambertMaterial({map:texture,alphaTest:.38,side:T.DoubleSide,
  emissive:'#768950',emissiveIntensity:.36});
 material.shadowSide=T.DoubleSide;
 return {geometry,material};
}
export function makeOrchardSkin(T,needle=false){
 const c=document.createElement('canvas');c.width=c.height=256;
 const g=c.getContext('2d');g.fillStyle=needle?'#ccd3be':'#d0d4bd';g.fillRect(0,0,256,256);
 let seed=needle?7211:4913;
 const next=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 const patches=needle?76:84;
 for(let j=0;j<patches;j++){
  const x=next()*256,y=next()*256,d=9+next()*37,angle=needle?2.7+next()*.94:next()*6.283;
  const tone=135+Math.round(next()*105);
  // Wrap paint across the single UV seam rather than repeating a grid.
  for(const offset of [-256,0,256]){
   if(x+offset+d*1.8<0||x+offset-d*1.8>256)continue;
   g.save();g.translate(x+offset,y);g.rotate(angle);g.scale(1.35,1);
   const ink=g.createRadialGradient(0,0,1,0,0,d);
   ink.addColorStop(0,`rgba(${tone},${tone+5},${tone-2},.88)`);ink.addColorStop(1,`rgba(${tone},${tone+5},${tone-2},0)`);
   g.fillStyle=ink;g.fillRect(-d,-d,d*2,d*2);g.restore();
  }
  for(let k=0;k<12;k++){
   const a=next()*6.283,r=next()*d*.80,xx=x+Math.cos(a)*r,yy=y+Math.sin(a)*r;
   const len=(needle?6:8)+next()*(needle?9:12),wide=len*(needle?.16:.41);
   const shade=Math.max(106,Math.min(253,tone+Math.round(next()*64)-15));
   for(const offset of [-256,0,256])if(xx+offset>-15&&xx+offset<271)
    leaflet(g,xx+offset,yy,angle+(next()-.5)*(needle?1.30:3.4),len,wide,shade);
  }
 }
 const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;t.anisotropy=2;return t;
}
export function makeOrchardBark(T){
 const c=document.createElement('canvas');c.width=128;c.height=256;
 const g=c.getContext('2d');g.fillStyle='#ece1cb';g.fillRect(0,0,128,256);
 let seed=7463;const rnd=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
 for(let j=0;j<85;j++){
  const x=rnd()*128,y=rnd()*284-14,len=7+rnd()*61,w=(rnd()*.93+.25);
  for(const wrap of [-128,0,128]){
   const k=x+wrap;
   g.strokeStyle=j%4===0?'#7967528a':j%3===0?'#fff6e18e':'#ac9a7b70';g.lineWidth=w;
   g.beginPath();g.moveTo(k,y);g.bezierCurveTo(k-2.7,y+len*.28,k+3.4,y+len*.72,k-.7,y+len);g.stroke();
  }
 }
 for(const [x,y,rz] of [[24,81,14],[82,165,18],[53,216,9],[112,53,11]]){
  g.strokeStyle='#b09a77aa';
  for(let i=0;i<3;i++){g.lineWidth=.75;g.beginPath();g.ellipse(x,y,2.0+i*1.4,rz+i*1.85,.23,0,2*Math.PI);g.stroke();}
  g.fillStyle='#7d6957aa';g.fillRect(x-1,y-2,2,7);
 }
 const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;t.anisotropy=3;return t;
}
// A crown is one continuous surface with several shallow rises, much like
// painted overlapping foliage. Surface colours follow crown height and
// sculpting; leaves add a separate fine silhouette and real cutout shadow.
export function makeOrchardVolumes(T){
 const circle=Math.PI*2;
 function painted(geometry){
  const vs=geometry.attributes.position,colors=new Float32Array(vs.count*3);
  for(let i=0;i<vs.count;i++){
   const x=vs.getX(i),y=vs.getY(i),z=vs.getZ(i);
   const blend=.86+.12*(y+.5)+.045*Math.sin(x*15+y*17+z*19);
   colors.set([blend*.98,blend,blend*.96],i*3);
  }
  geometry.setAttribute('color',new T.BufferAttribute(colors,3));
  geometry.computeVertexNormals();return geometry;
 }
 function broad(seed){
  const g=new T.SphereGeometry(.5,31,20),v=g.attributes.position;
  for(let i=0;i<v.count;i++){
   const x=v.getX(i),y=v.getY(i),z=v.getZ(i),a=Math.atan2(z,x)+seed;
   const mask=1-Math.min(1,Math.abs(y)*2)**5;
   const shoulder=1+.30*y-.10*Math.max(0,-y*2);
   const ripple=shoulder+(.165*Math.sin(a*5+.5)+.076*Math.sin(a*9+2*y)+.036*Math.cos(a*13-y*9))*mask;
   const lobe=.037*Math.cos(4*a+8*y)*mask+.021*Math.sin(7*a+15*y)*mask;
   // There is no axis slant. Asymmetry comes from small bough bumps.
   v.setXYZ(i,x*ripple,y+lobe,z*ripple);
  }
  return painted(g);
 }
 const tier=new T.CylinderGeometry(.055,.5,1,26,6,false),v=tier.attributes.position;
 for(let i=0;i<v.count;i++){
  const x=v.getX(i),y=v.getY(i),z=v.getZ(i),a=Math.atan2(z,x);
  const skirt=(.5-y),fringe=Math.cos(a*7)*.09+Math.sin(a*11)*.047;
  v.setXYZ(i,x*(1+fringe*skirt),y+(.052*Math.cos(a*7)+.022*Math.cos(a*13))*skirt,z*(1+fringe*skirt));
 }
 return {wide:broad(.4),round:broad(1.02),fir:painted(tier)};
}
export function addOrchardTree({shape},x,z,scale,index){
 const [bark,dark,light,trunk,w0,h0,d0]=orchardProfile(index);
 const w=w0*(1.05+index%5*.018),h=h0*(.80+index%4*.018),d=d0*(.81+index%3*.035);
 const fir=orchardFamily(index)==='fir';
 let seed=179+(index+1)*1097;
 const next=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 const emit=(k,a,b,c,w,h,d,t,rx=0,ry=0,rz=0)=>shape(k,x+a*scale,b*scale,z+c*scale,w*scale,h*scale,d*scale,t,rx,ry,rz);
 const branch=(a,b,thick)=>{
  const [ax,ay,az]=a,[bx,by,bz]=b,dx=bx-ax,dy=by-ay,dz=bz-az;
  emit('trunk',(ax+bx)/2,(ay+by)/2,(az+bz)/2,thick,Math.hypot(dx,dy,dz),thick,bark,Math.atan2(dz,dy),0,-Math.atan2(dx,Math.hypot(dy,dz)));
 };
 branch([0,-1,0],[0,trunk-13,0],8.3+index%3*.44);
 branch([0,trunk-13,0],[0,fir?trunk+20:trunk+12,0],6.6);
 for(const side of [-1,1])branch([side*6,0,2],[0,8,0],2.8);
 if(fir){
  const firPalette=['#557b58','#628963','#6d956b','#7a9e70'];
  const height=trunk+50+(index%3)*3;
  for(let k=0;k<4;k++){
   const width=(56+index%3*4)*(1-k*.202);
   const tierH=k===3?31:32;
   const y=height-54+k*13+(k===3?4:0);
   const turn=index*.61+k*.73;
   emit('orchard-fir',0,y,0,width,tierH,width*.90,firPalette[k],0,turn);
   for(let j=0;j<14;j++){
    const theta=j*Math.PI*2/14+turn,rad=width*(.355+next()*.067);
    emit('orchard-leaf',Math.sin(theta)*rad,y-8+next()*5,Math.cos(theta)*rad,11+next()*7,10+next()*6,1,
     firPalette[Math.min(3,k+(j%3===0?1:0))],.56+next()*.32,Math.sin(theta)*.49,.11*Math.sin(theta));
   }
   // Shorter layered tips break the smooth skirt near a low viewpoint.
   for(let j=0;j<6;j++){
    const theta=(j+.38)*Math.PI*2/6+turn,rad=width*(.38+next()*.045);
    emit('orchard-leaf',Math.sin(theta)*rad,y-9+next()*5,Math.cos(theta)*rad,7+next()*4,5+next()*4,1,
     j%3?firPalette[k]:firPalette[Math.min(3,k+1)],.29+next()*.38,theta,.24*Math.sin(theta));
   }
  }
  return;
 }
 for(let j=0;j<5;j++){
  const theta=j*2.39996+index*.61,t=.58+next()*.12;
  const ox=Math.sin(theta)*w*.32,oz=Math.cos(theta)*d*.32;
  branch([0,trunk-15+j*.9,0],[ox*t,trunk+3+j*.5,oz*t],3.8-j*.27);
  branch([ox*t,trunk+3+j*.5,oz*t],[ox,trunk+23+j*.75,oz],2.2-j*.14);
 }
 const cy=trunk+25,turn=index*.63;
 // Twigs reach sideways just beneath the solid canopy, not through its silhouette.
 for(let j=0;j<3;j++){
  const th=j*2.39+1.15+turn,dx=Math.sin(th)*w,dz=Math.cos(th)*d;
  branch([dx*.18,trunk+3,dz*.18],[dx*.39,trunk+13+j,dz*.39],1.15+j*.12);
 }

 const kind=w>=67?'orchard-wide':'orchard-round';
 emit(kind,0,cy,0,w*.92,h*.94,d*.94,dark,0,turn);
 for(let j=0;j<42;j++){
  const theta=j*2.399963+turn,ny=1-2*(j+.5)/42,ring=Math.sqrt(1-ny*ny);
  const a=Math.sin(theta)*ring*w*.487,c=Math.cos(theta)*ring*d*.51;
  const shoulder=1+.15*ny;
  const b=cy+ny*h*.54+Math.cos(5*theta)*1.4;
  const width=12.5+next()*6;
  emit('orchard-leaf',a*shoulder,b,c*shoulder,width,width*(.72+next()*.22),1,j%5===0||ny>.32?light:dark,
   .30+(next()-.5)*.40,Math.sin(theta)*.52,(next()-.5)*.58);
 }
 // Front-facing leaves are planted along the bough surface, not formed
 // from vertical strips around the trunk. Vary light exposure by sector.
 for(let j=0;j<26;j++){
  const a=j*2.399963+turn,r=Math.sqrt((j+.4)/26)*.88;
  const nx=Math.cos(a)*r,ny=Math.sin(a)*r;
  const surface=Math.sqrt(Math.max(.09,1-nx*nx-ny*ny));
  const fy=cy+ny*h*.44,fx=nx*w*.49,fz=surface*d*.47+4.2;
  const width=9+next()*10;
  const tint=j%7===0||ny>.14&&nx<.25?light:dark;
  emit('orchard-leaf',fx,fy,fz,width,width*(.68+next()*.23),1,tint,
   .34-ny*.29+(next()-.5)*.18,-nx*.58+(next()-.5)*.29,(next()-.5)*.85);
 }
 // Dappled underside: oriented small clusters follow volume instead of painting
 // an opaque stripe seen from the pond. Different positions expose different hues.
 for(let j=0;j<23;j++){
  const a=j*2.399963+turn,r=.77+next()*.18,ny=-.62+next()*.53;
  const xx=Math.sin(a)*w*.51*r,zz=Math.cos(a)*d*.52*r;
  const lightSide=(xx<0&&j%3!==1)||j%7===0,width=6+next()*7;
  const yy=cy+ny*h*.47+Math.sin(3*a)*2.5;
  emit('orchard-leaf',xx,yy,zz,width,width*(.75+next()*.2),1,lightSide?light:dark,
   .12+(next()-.5)*.8,a,(next()-.5)*.9);
 }
 // Foliage along the exposed face and lower shoulder, catching separate
 // accents at the pond viewpoint without altering the crown or trunk anchors.
 for(let j=0;j<25;j++){
  const phase=j*2.399963+turn,r=Math.sqrt((j+.65)/25)*.91;
  const nx=Math.cos(phase)*r,ny=Math.sin(phase)*r;
  const depth=Math.sqrt(Math.max(.1,1-nx*nx-ny*ny));
  const fy=cy+ny*h*.47,fx=nx*w*.49,fz=depth*d*.51+6.0;
  const width=6.7+next()*7.4;
  const ink=(ny>.02&&j%4!==1)||j%9===0?light:dark;
  emit('orchard-leaf',fx,fy,fz,width,width*(.70+next()*.41),1,ink,
   .16+(next()-.5)*.30,nx*.30+(next()-.5)*.42,phase*.14);
 }
}
// Same wall clock and 12-minute loop already used by the weather selector;
// a continuous bounded arc supplies the real WebGL directional shadow map.
const TOWN_CYCLE_MS=720000,TAU=Math.PI*2;
export function townSunVector(now){
 const angle=TAU*((now%TOWN_CYCLE_MS+TOWN_CYCLE_MS)%TOWN_CYCLE_MS)/TOWN_CYCLE_MS;
 return {x:45+270*Math.cos(angle),y:705+45*Math.sin(angle),z:-280+55*Math.sin(angle)};
}
