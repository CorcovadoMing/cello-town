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
function leaflet(g,x,y,angle,len,wide,tone,season=0,needle=false){
 g.save();g.translate(x,y);g.rotate(angle);
 const ink=g.createLinearGradient(0,1,wide,-len);
 ink.addColorStop(0,`rgb(${tone-26+season},${tone-24},${tone-28-season})`);
 ink.addColorStop(.57,`rgb(${tone-3+season},${tone},${tone-9-season})`);
 ink.addColorStop(1,`rgb(${Math.min(255,tone+13+season)},${Math.min(255,tone+14)},${Math.min(255,tone+12-season)})`);
 // Rounded terminal lobes, a restrained midrib and a soft pigment gradient.
 g.fillStyle=ink;g.beginPath();g.moveTo(-.7,0);
 const crown=wide*(needle?.31:.45);
 g.bezierCurveTo(-wide*.70,-len*.16,-wide*1.06,-len*.45,-wide*.63,-len*.74);
 g.bezierCurveTo(-crown,-len*.93,-crown*.68,-len,.05,-len*.995);
 g.bezierCurveTo(crown*.74,-len*.99,wide*.88,-len*.75,wide*.87,-len*.52);
 g.bezierCurveTo(wide*.78,-len*.27,wide*.39,-len*.12,.7,0);g.closePath();g.fill();
 g.strokeStyle='rgba(248,248,236,.12)';g.lineWidth=.53;g.beginPath();g.moveTo(.5,-1);g.quadraticCurveTo(wide*.10,-len*.48,.61,-len*.80);g.stroke();
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
   const len=(needle?18:16)+next()*(needle?15:13),wide=len*(needle?.18+next()*.10:.41+next()*.14);
   leaflet(g,x,y,a+(next()-.5)*1.32,len,wide,tone+Math.round(next()*22),0,needle);
  }
 }
 for(let j=0;j<31;j++){
  const a=next()*tau,r=Math.sqrt(next())*.79;
  const x=97+Math.sin(a)*r*68,y=103-Math.cos(a)*r*62;
  const len=9+next()*13;
  leaflet(g,x,y,a*1.20+.4,len,len*(needle?.19:.38),219+Math.round(next()*30),0,needle);
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
 const material=new T.MeshPhongMaterial({map:texture,bumpMap:texture,bumpScale:.14,shininess:4,specular:'#273221',alphaTest:.30,alphaToCoverage:true,side:T.DoubleSide,
  emissive:'#768950',emissiveIntensity:needle?.29:.20});
 material.shadowSide=T.DoubleSide;
 return {geometry,material};
}
// Scaly furrows are composed in two registered textures. Height is kept
// independent of colour: a pale lichen patch is not automatically a trench.
export function makeOrchardBark(T){
 const make=()=>{const canvas=document.createElement('canvas');canvas.width=256;canvas.height=512;return canvas;};
 const albedo=make(),relief=make(),g=albedo.getContext('2d'),n=relief.getContext('2d');
 const w=128,h=256,wraps=[-w,0,w],tau=Math.PI*2;
 [g,n].forEach(ctx=>ctx.scale(2,2));
 g.fillStyle='#d3bea2';g.fillRect(0,0,w,h);n.fillStyle='#909090';n.fillRect(0,0,w,h);
 let seed=7463;const rnd=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
 function fillPlate(ctx,shape,color){
  ctx.fillStyle=color;ctx.beginPath();ctx.moveTo(...shape[0]);for(const pt of shape.slice(1))ctx.lineTo(...pt);ctx.closePath();ctx.fill();
 }
 function stroke(ctx,shape,color,width){
  ctx.strokeStyle=color;ctx.lineWidth=width;ctx.beginPath();ctx.moveTo(...shape[0]);for(const pt of shape.slice(1))ctx.lineTo(...pt);ctx.stroke();
 }
 function wash(x,y,rx,ry,color){
  for(const dx of wraps){
   g.save();g.translate(x+dx,y);g.scale(rx,ry);
   const ink=g.createRadialGradient(0,0,0,0,0,1);ink.addColorStop(0,color);ink.addColorStop(1,color.slice(0,7)+'00');
   g.fillStyle=ink;g.fillRect(-1,-1,2,2);g.restore();
  }
 }
 for(let i=0;i<35;i++)wash(rnd()*w,rnd()*h,5+rnd()*28,10+rnd()*33,
  ['#7c65515d','#a0806270','#b1a38d48','#726e515a','#f0d7aa5b'][i%5]);

 // Each family winds along the grain. The cracks between plates change
 // neighbours partway up the trunk instead of painting full-height stripes.
 const drift=(x,y,phase)=>x+Math.sin(y*.029+phase)*2.7+Math.sin(y*.071-phase*.6)*.82;
 for(let col=0;col<19;col++){
  const bx=(col+.6)*w/19+(rnd()-.5)*3.2,phase=rnd()*tau;
  for(let y=-9;y<h+9;){
   const len=6+rnd()*25,upper=y+len,yy=y+len*.52,width=2.6+rnd()*3.9;
   const lean=(rnd()-.5)*2.4,fracture=.6+rnd()*1.6;
   const x0=drift(bx,y,phase),xm=drift(bx,yy,phase),x1=drift(bx,upper,phase)+lean;
   const face=col%7===0?'#a0836867':['#caae8c77','#b397796b','#e2c7a383','#9d816368'][Math.floor(rnd()*4)];
   for(const dx of wraps){
    const a=x0+dx,b=xm+dx,c=x1+dx;
    const silhouette=[[a-.55,y+.6],[a+width*.75,y],[b+width,yy],[c+width*.64,upper-.75],[c+fracture,upper],[b-.61,yy+fracture]];
    const cleft=[[a,y+.7],[b-.30,yy-fracture],[b+.2,yy+fracture],[c+fracture,upper]];
    const lip=[[a+.83,y+1.4],[b+.47,yy-fracture],[b+.97,yy+fracture],[c+fracture+.62,upper-.5]];
    fillPlate(g,silhouette,face);fillPlate(n,silhouette,'#a9a9a9');
    stroke(g,cleft,'#5b4c417e',.75+width*.12);stroke(n,cleft,'#3b3b3b',.8+width*.12);
    stroke(g,lip,'#ead7bb78',.49+width*.05);stroke(n,lip,'#c9c9c9',.55+width*.05);
    if((col+Math.floor(y))%3===0){
     const seam=[[b+.76,yy-1.4],[b+width*.68,yy+.3],[b+width*.84,yy+1.0]];
     stroke(g,seam,'#75614b67',.57);stroke(n,seam,'#686868',.48);
    }
   }
   y=upper+.5+rnd()*1.5;
  }
 }
 for(const [x,y,sz,a] of [[22,69,5,.29],[82,168,7,-.38],[53,219,4,.44],[117,115,5.1,.31],[30,145,3.2,-.16]]){
  for(const dx of wraps)for(const [ctx,base,crowns,heart] of [[g,'#d8bd9470','#81664a90','#605345aa'],[n,'#bcbcbc','#707070','#444444']]){
   ctx.save();ctx.translate(x+dx,y);ctx.rotate(a);
   ctx.fillStyle=base;ctx.beginPath();ctx.ellipse(0,0,sz*.87,sz*1.67,0,0,tau);ctx.fill();
   for(let k=0;k<3;k++){
    ctx.strokeStyle=crowns;ctx.lineWidth=.4+k*.12;ctx.beginPath();
    ctx.ellipse(0,k*.68,sz*(.42+k*.21),sz*(.51+k*.36),k*.07,0,tau);ctx.stroke();
   }
   ctx.fillStyle=heart;ctx.beginPath();ctx.ellipse(.2,0,sz*.28,sz*.52,.13,0,tau);ctx.fill();ctx.restore();
  }
 }
 // Irregular mineral-grey and mossy pockets rather than an even film.
 for(const [x,y,rx,ry] of [[14,43,11,13],[109,84,13,10],[41,105,6,11],[78,194,11,11],[120,234,12,18],[22,241,17,13],[72,248,11,10]]){
  wash(x,y,rx,ry,y>200?'#7d8d557d':'#a3a18a75');
  for(let j=0;j<32;j++){
   const a=rnd()*tau,r=Math.sqrt(rnd()),xx=x+Math.cos(a)*rx*r,yy=y+Math.sin(a)*ry*r,s=.29+rnd()*1.02;
   for(const dx of wraps){
    g.fillStyle=['#b2ad917a','#7e846470','#89926564','#e3d7b76e'][j%4];
    g.beginPath();g.ellipse(xx+dx,yy,s*1.26,s,(rnd()-.5)*.85,0,tau);g.fill();
   }
  }
 }
 for(let i=0;i<900;i++){
  const x=rnd()*w,y=rnd()*h,s=.22+rnd()*.66,ry=.5+rnd()*1.5;
  g.fillStyle=i%3?'#7f654657':'#f5e0bd70';g.fillRect(x,y,s,ry);
 }
 const map=new T.CanvasTexture(albedo),bumpMap=new T.CanvasTexture(relief);
 map.colorSpace=T.SRGBColorSpace;map.anisotropy=3;bumpMap.anisotropy=2;
 return {map,bumpMap};
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
  const a=Math.sin(theta)*ring*w*.466,c=Math.cos(theta)*ring*d*.487;
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
