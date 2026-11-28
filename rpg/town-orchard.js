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
function leaflet(g,x,y,angle,len,wide,tone,season=0){
 g.save();g.translate(x,y);g.rotate(angle);
 const ink=g.createLinearGradient(0,1,wide,-len);
 ink.addColorStop(0,`rgb(${tone-39+season},${tone-33},${tone-39-season})`);
 ink.addColorStop(.57,`rgb(${tone-3+season},${tone},${tone-9-season})`);
 ink.addColorStop(1,`rgb(${Math.min(255,tone+20+season)},${Math.min(255,tone+23)},${Math.min(255,tone+12-season)})`);
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
export function makeOrchardLeaf(T,needle=false){
 const c=document.createElement('canvas');c.width=c.height=256;
 const g=c.getContext('2d');g.scale(4/3,4/3);
 // A leaf cluster grows from irregular adjacent fingers, not a single fan.
 // Deep leaves read as one full mass; brighter broad leaves break the rim.
 let seed=needle?7631:4723;
 const next=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 const tau=Math.PI*2;
 for(const [r,n,tone] of [[.88,34,205],[.63,31,217],[.39,23,226],[.14,11,236]]){
  for(let j=0;j<n;j++){
   const a=(j+next()*.65)/n*tau+r;
   const ripple=1+.12*Math.cos(a*3-.63)+.075*Math.sin(a*7);
   const d=r*(.86+next()*.26)*ripple;
   const x=96+Math.sin(a)*d*64,y=98-Math.cos(a)*d*59;
   const len=(needle?20:17)+next()*(needle?16:15),wide=len*(needle?.16+next()*.10:.35+next()*.13);
   leaflet(g,x,y,a+(next()-.5)*1.32,len,wide,tone+Math.round(next()*27));
  }
 }
 for(let j=0;j<31;j++){
  const a=next()*tau,r=Math.sqrt(next())*.79;
  const x=97+Math.sin(a)*r*68,y=103-Math.cos(a)*r*62;
  const len=9+next()*13;
  leaflet(g,x,y,a*1.20+.4,len,len*(needle?.19:.38),219+Math.round(next()*35));
 }
 if(!needle){
  // Individual branch tips break the smooth patch: small pale paired
  // leaflets, attached to fine crooked stems rather than floating dots.
  for(let tip=0;tip<22;tip++){
   const a=tip*2.399963,r=Math.sqrt((tip+.45)/22);
   const x=96+Math.cos(a)*r*70,y=98+Math.sin(a)*r*67;
   const direction=a+(next()-.5)*1.25,len=11+next()*13;
   const u=Math.cos(direction),v=Math.sin(direction);
   const age=Math.round((next()-.36)*17);
   g.strokeStyle='rgba(151,147,113,.33)';g.lineWidth=.74;
   g.beginPath();g.moveTo(x,y);g.quadraticCurveTo(x+u*len*.6-v*1.8,y+v*len*.6+u*1.8,x+u*len,y+v*len);g.stroke();
   for(let pair=0;pair<3;pair++)for(const side of [-1,1]){
    const k=(pair+.8)/3.45+(next()-.5)*.10;
    const size=5.8+next()*5.6;
    leaflet(g,x+u*len*k,y+v*len*k,direction+Math.PI/2+side*(.67+next()*.55),size,size*(.31+next()*.12),205+Math.round(next()*37),age);
   }
  }
 }
 const texture=new T.CanvasTexture(c);
 texture.colorSpace=T.SRGBColorSpace;texture.anisotropy=2;
 const geometry=new T.PlaneGeometry(1,1);
 // MeshLambert's texture and alpha threshold are forwarded by Three's
 // directional depth material, giving fine perforated leaf shadows.
 const material=new T.MeshPhongMaterial({map:texture,bumpMap:texture,bumpScale:.26,shininess:8,specular:'#283a24',alphaTest:.38,side:T.DoubleSide,
  emissive:'#768950',emissiveIntensity:needle?.29:.20});
 material.shadowSide=T.DoubleSide;
 return {geometry,material};
}
export function makeOrchardBark(T){
 const c=document.createElement('canvas');c.width=256;c.height=512;
 const g=c.getContext('2d');g.scale(2,2);g.fillStyle='#d8c6a7';g.fillRect(0,0,128,256);
 let seed=7463;const rnd=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
 // Broad sheltered furrows carry much of the contrast; thin split
 // fibres and flecks sit on their ridges, rather than a repeated stripe.
 for(let j=0;j<23;j++){
  const x=j*128/23+(rnd()-.5)*4;
  for(const wrap of [-128,0,128]){
   const w=x+wrap;
   g.fillStyle=j%5?'#856c4f64':'#7f806653';g.beginPath();g.moveTo(w,-4);
   g.bezierCurveTo(w-5,85,w+6,176,w+.5,260);g.lineTo(w+4.1,260);
   g.bezierCurveTo(w+9,158,w-1,98,w+3.6,-4);g.closePath();g.fill();
   g.strokeStyle='#f1dbb37a';g.lineWidth=1.2;
   g.beginPath();g.moveTo(w+4.5,-4);g.bezierCurveTo(w-.6,80,w+10,181,w+5.8,260);g.stroke();
  }
 }
 for(let j=0;j<176;j++){
  const x=rnd()*128,y=rnd()*284-14,len=7+rnd()*61,w=(rnd()*.93+.25);
  for(const wrap of [-128,0,128]){
   const k=x+wrap;
   g.strokeStyle=j%4===0?'#7967528a':j%3===0?'#fff6e18e':'#ac9a7b70';g.lineWidth=w;
   g.beginPath();g.moveTo(k,y);g.bezierCurveTo(k-2.7,y+len*.28,k+3.4,y+len*.72,k-.7,y+len);g.stroke();
  }
 }
 for(let i=0;i<710;i++){const x=rnd()*128,y=rnd()*256;g.fillStyle=i%3?'#8b704d58':'#f8e5b285';g.fillRect(x,y,.44+rnd()*.93,.32+rnd()*.95);}
 for(const [x,y,rz] of [[24,81,14],[82,165,18],[53,216,9],[112,53,11]]){
  g.strokeStyle='#b09a77aa';
  for(let i=0;i<3;i++){g.lineWidth=.75;g.beginPath();g.ellipse(x,y,2.0+i*1.4,rz+i*1.85,.23,0,2*Math.PI);g.stroke();}
  g.fillStyle='#7d6957aa';g.fillRect(x-1,y-2,2,7);
 }
 const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;t.anisotropy=3;return t;
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
   // Nested depth and downward tips make the tier. There is no opaque cone.
   for(let j=0;j<57;j++){
    const theta=j*2.399963+turn,r=Math.sqrt((j+.5)/57),rad=width*(.49*r);
    const sh=14+next()*7-(k*.75);
    const along=(1-r)*tierH*.42;
    const tint=r<.47?firPalette[Math.max(0,k-1)]:firPalette[Math.min(3,k+((j%4===0)?1:0))];
    const shelf=j%3!==2;
    emit('orchard-needle',Math.sin(theta)*rad,y-6+along+(next()-.5)*8,Math.cos(theta)*rad,sh,sh*(.76+next()*.25),1,
     tint,shelf?-1.39+next()*.31:.30+next()*.60,shelf?.28*Math.sin(theta):theta,shelf?theta:.20*Math.sin(theta));
   }
   for(let j=0;j<14;j++){
    const theta=j*Math.PI*2/14+turn,rad=width*(.355+next()*.067);
    emit('orchard-needle',Math.sin(theta)*rad,y-8+next()*5,Math.cos(theta)*rad,11+next()*7,10+next()*6,1,
     firPalette[Math.min(3,k+(j%3===0?1:0))],.56+next()*.32,Math.sin(theta)*.49,.11*Math.sin(theta));
   }
   // Shorter layered tips break the smooth skirt near a low viewpoint.
   for(let j=0;j<6;j++){
    const theta=(j+.38)*Math.PI*2/6+turn,rad=width*(.38+next()*.045);
    emit('orchard-needle',Math.sin(theta)*rad,y-9+next()*5,Math.cos(theta)*rad,7+next()*4,5+next()*4,1,
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

 // The interior is also leaves. Darker occluded fans at a range of depths
 // block holes; outer light leaves keep the silhouette luminous, never solid.
 const inner=[dark,'#668651','#5e7948','#728d51',light];
 for(let lobe=0;lobe<9;lobe++){
  const phase=lobe*2.399963+turn,spread=lobe===0?0:(.20+next()*.13);
  const centerX=Math.sin(phase)*w*spread,centerZ=Math.cos(phase)*d*spread;
  const centerY=cy+(lobe===0?.27:(next()-.49)*.55)*h;
  for(let j=0;j<14;j++){
   const theta=j*2.399963+phase,q=(j+.55)/14,ny=1-q*2,ring=Math.sqrt(Math.max(0,1-ny*ny));
   const r=(.57+next()*.40)*ring;
   const x=centerX+Math.sin(theta)*w*.24*r,z=centerZ+Math.cos(theta)*d*.24*r,y=centerY+ny*h*.23;
   const wLeaf=10.5+next()*8.7;
   const ink=y>cy&&j%5===0?light:inner[(j+lobe)%4];
   emit('orchard-leaf',x,y,z,wLeaf,wLeaf*(.79+next()*.23),1,ink,
        (next()-.48)*.86,theta,(next()-.5)*1.01);
  }
 }

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
  const exposed=.53*ny-.36*nx+.24*Math.sin(a*3.1);
  const tint=exposed>.29?light:exposed<-.17?'#668348':ny>.06?'#91ac59':dark;
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
  const glow=.61*ny-.24*nx+.30*Math.cos(phase*2.8);
  const ink=glow>.33?light:glow>.07?'#a2b66c':glow<-.20?'#627d49':dark;
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
