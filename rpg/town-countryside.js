// Meadow beyond the fence, divided into grazed grass, wild margins and a
// wooded ridge. All coordinates are scenery: the map and collision stay put.
const TAU=2*Math.PI;
const pastureHeight=(x,z)=>-9+Math.min(1,Math.max(0,-z/480))*
 (70+36*Math.sin(x*.0049-z*.0062)+14*Math.cos(x*.009+z*.0042))
 + Math.min(1,Math.max(0,-z/325))*31*Math.exp(-((x-1098)**2/224**2+(z+519)**2/201**2))
 + Math.min(1,Math.max(0,(-z-190)/210))*118*Math.exp(-((x-1250)**2/375**2+(z+570)**2/270**2))
 + Math.min(1,Math.max(0,(-z-240)/215))*73*Math.exp(-((x-1460)**2/240**2+(z+495)**2/178**2))
 + Math.min(1,Math.max(0,(-z-82)/150))*184*Math.exp(-((x-1910)**2/352**2+(z+280)**2/186**2));
export const FENCE_MARGIN=Object.freeze([0,68]);
export function marginTrail(x){return 22+7*Math.sin(x*.009+.15)+4*Math.sin(x*.021);}
export function makeCountryside({T,scene,W,H,shape,leafMaps}){
 let seed=72931;
 const rand=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
 const grasses=['#6e8a50','#879c60','#9ba96e','#a7ad6d','#b6b578'];
 const florets=['#e9ddb0','#f1e5be','#c4a5a8','#e0c78a'];
 const stones=['#a9a484','#8e9074','#b2a689','#989a81'];
 const dots=new T.BufferGeometry(),vertices=[],rgb=[];
 const shade=grasses.map(x=>new T.Color(x));
 for(let cluster=0;cluster<85;cluster++){
  const centerX=9+rand()*944,centerZ=8+rand()*58;
  const size=5+rand()*14,count=5+Math.floor(rand()*15);
  for(let i=0;i<count;i++){
   const a=rand()*TAU,r=Math.sqrt(rand()),x=centerX+Math.cos(a)*r*size,z=centerZ+Math.sin(a)*r*size*.45;
   if(x<1||x>958||z<0||z>68||Math.abs(z-marginTrail(x))<6+rand()*3)continue;
   const p=(rand()-.5)*.99,h=1.25+rand()*3.9,w=.23+rand()*.5;
   const dx=(x-W/2),dz=(z-H/2);
   vertices.push(dx-w,1.54,dz,dx+w,1.54,dz+.17,dx+p,1.54+h,dz-.28);
   const c=shade[(i+cluster)%shade.length];
   rgb.push(c.r*.78,c.g*.8,c.b*.78,c.r*.84,c.g*.9,c.b*.84,c.r,c.g,c.b);
   if((i+cluster)%6===0&&h>3.25)shape('sphere',x+p,h+1.55,z-.26,.95,.37,.69,florets[(i+cluster)%florets.length]);
  }
 }
 // A few uneven real patches near the fence: seedheads and low clover
 // share the grass batch. Avoid uniform scatter along the walkable trail.
 const marginSeed=48049;let cloverSeed=marginSeed;
 const patchRand=()=>((cloverSeed=(Math.imul(cloverSeed,1664525)+1013904223)>>>0)/4294967296);
 const cloverColors=['#839057','#9da15e','#657c4d','#bcb77f','#e2d6a5'].map(c=>new T.Color(c));
 function blade(a,b,c,i){
  vertices.push(...a,...b,...c);
  const q=cloverColors[i];for(const strength of [.85,.93,1])rgb.push(q.r*strength,q.g*strength,q.b*strength);
 }
 for(const [cx,cz,rx,rz,n] of [[52,10,17,5,19],[155,53,34,8,29],[302,45,20,11,23],[536,12,37,6,34],[624,54,23,10,24],[892,52,30,9,30]]){
  for(let j=0;j<n;j++){
   const a=patchRand()*TAU,r=Math.sqrt(patchRand());
   const x=cx+Math.cos(a)*r*rx,z=cz+Math.sin(a)*r*rz;
   if(Math.abs(z-marginTrail(x))<7)continue;
   const dx=x-W/2,dz=z-H/2,h=1.0+patchRand()*2.55;
   for(let k=0;k<3;k++){
    const th=k*TAU/3+patchRand()*.7,ax=Math.cos(th),az=Math.sin(th);
    const u=.52+patchRand()*1.36,width=.31+patchRand()*.35;
    const tip=[dx+ax*u,1.62+h*(k%2?.83:1),dz+az*u];
    blade([dx,1.52,dz],[dx+ax*u*.53-az*width,1.65+h*.66,dz+az*u*.53+ax*width],tip,(j+k)%4);
    blade([dx,1.52,dz],tip,[dx+ax*u*.53+az*width,1.57+h*.49,dz+az*u*.53-ax*width],(j+k+1)%4);
   }
   if(j%7===0)blade([dx-.62,h+1.44,dz],[dx+.63,h+1.46,dz+.37],[dx+.04,h+2.15,dz+.2],4);
  }
 }
 dots.setAttribute('position',new T.Float32BufferAttribute(vertices,3));
 dots.setAttribute('color',new T.Float32BufferAttribute(rgb,3));dots.computeVertexNormals();
 const wild=new T.Mesh(dots,new T.MeshLambertMaterial({side:T.DoubleSide,vertexColors:true}));wild.receiveShadow=true;scene.add(wild);
 // One static ribbon strip: softened turf edges and an uneven, warmer
 // tread. This replaces the flat trail mesh, without another draw batch.
 const step=8, bands=[-1,-.71,-.29,.17,.62,1];
 const pos=[],tints=[];
 const grassEdge=new T.Color('#a9b483'),paleGround=new T.Color('#c8b894'),
  compactSoil=new T.Color('#b09d79'),quietMoss=new T.Color('#9eaa78'),trailColor=new T.Color();
 const makeVertex=(x,k)=>{
  const offset=bands[k],shoulder=3+.9*Math.sin(x*.033)+.65*Math.cos(x*.079);
  const wobble=Math.sin(x*.071+k*.9)*(.66-.49*Math.abs(offset));
  const z=marginTrail(x)+offset*shoulder+wobble;
  const grit=.47+.20*Math.sin(x*.124+k*1.32)+.19*Math.cos(x*.041-k*1.84);
  const wear=.31+.24*Math.sin(x*.021+k*.51)+.09*Math.cos(x*.087+k*2.34);
  trailColor.copy(paleGround).lerp(compactSoil,grit).lerp(quietMoss,wear*.64);
  trailColor.lerp(grassEdge,Math.abs(offset)**2.9);
  return [[x-W/2,1.45,z-H/2],[trailColor.r,trailColor.g,trailColor.b]];
 };
 const write=(...vertices)=>{for(const [p,c] of vertices){pos.push(...p);tints.push(...c);}};
 let prior=bands.map((_,i)=>makeVertex(0,i));
 for(let x=step;x<=W;x+=step){
  const next=bands.map((_,i)=>makeVertex(x,i));
  for(let i=0;i<bands.length-1;i++)write(prior[i],prior[i+1],next[i],prior[i+1],next[i+1],next[i]);
  prior=next;
 }
 const trail=new T.BufferGeometry();
 trail.setAttribute('position',new T.Float32BufferAttribute(pos,3));
 trail.setAttribute('color',new T.Float32BufferAttribute(tints,3));trail.computeVertexNormals();
 const gentlyWorn=new T.Mesh(trail,new T.MeshLambertMaterial({vertexColors:true,transparent:true,opacity:.75,depthWrite:false}));
 gentlyWorn.receiveShadow=true;scene.add(gentlyWorn);
 for(const [centerX,centerZ,count] of [[67,44,8],[197,47,9],[331,36,7],[458,53,9],[613,44,10],[756,56,8],[903,41,9]]){
  for(let n=0;n<count;n++){
   const x=centerX+(n-count/2)*(3.2+rand()*1.1),z=centerZ+(rand()-.5)*8;
   if(Math.abs(z-marginTrail(x))<5)continue;
   const h=1.4+rand()*2.55,w=1.1+rand()*2.8;
   shape('sphere',x,1.3+h*.38,z,w,h,1.3+rand()*2.6,stones[n%stones.length],rand()*.5,rand()*TAU,.33);
   if(n%4===0)shape('orchard-leaf',x+2,3.7+h*.8,z+1,5.2+rand()*4,3.5+rand()*3,1,grasses[n%grasses.length],-.27,rand()*TAU,.32,.30);
  }
 }
 // Fine hedge mounds and lateral sprouts. Vary cluster spacing and height,
 // preserving an open break at each long bend in the trail.
 for(const [centerX,centerZ,extent,n] of [[108,61,35,9],[232,10,26,7],[385,54,36,10],[488,8,23,6],
  [578,61,37,10],[716,11,33,10],[804,58,28,9],[924,13,30,9]]){
  for(let i=0;i<n;i++){
   const a=i*2.39996,r=Math.sqrt((i+.4)/n),x=centerX+Math.cos(a)*r*extent,z=centerZ+Math.sin(a)*r*8;
   if(Math.abs(z-marginTrail(x))<6)continue;
   const h=4.2+rand()*6,w=5+rand()*7,tint=grasses[(i+n)%grasses.length];
   for(let layer=0;layer<3;layer++)shape('orchard-leaf',x+(layer-1)*w*.31,2+h*(.45+.20*layer),
    z+(layer%2)*2,w*(.85-layer*.11),h*(.86-layer*.07),1,tint,-.35,layer*2.1,.2,.14);
   shape('orchard-leaf',x+1.3,2+h*.86,z+2,w*.83,h*.88,1,grasses[(i+1)%grasses.length],-.22,rand()*TAU,(rand()-.5)*.40,.25);
  }
 }
 // Actual sloped mesh outside the normal world. Its geometry fills the
 // low view behind the sky ridges, but never touches the walkable 2D plane.
 // Paint the colour of the wild meadow into the actual hillside, under
 // individual flower heads. A far-view flower sea must read as a surface,
 // not only as isolated specks floating over green terrain.
 const meadowPatches=[
  [719,-397,163,100,0],[863,-480,198,112,2],[1037,-507,213,124,0],
  [1199,-517,226,124,1],[1366,-478,177,113,0],[1531,-400,190,121,3],
  [1740,-331,218,102,2],[1941,-281,219,100,1]
 ];
 const meadowInks=['#cd9bbd','#e5baaf','#b69bbe','#ddbe8a'].map(c=>new T.Color(c));
 function blossomCover(x,z,tint){
  const noise=.16*Math.sin(x*.047+z*.055)+.12*Math.sin(x*.091-z*.071)+.07*Math.cos(z*.147+x*.063);
  for(const [cx,cz,rx,rz,paint] of meadowPatches){
   const d=Math.hypot((x-cx)/rx,(z-cz)/rz);
   const q=Math.min(1,Math.max(0,(1.11-d+noise)*1.22));
   if(q)tint.lerp(meadowInks[paint],q*q*(3-2*q)*.78);
  }
 }
 const ridgeGeo=new T.PlaneGeometry(2780,840,111,53);ridgeGeo.rotateX(-Math.PI/2);
 const ridgePoints=ridgeGeo.attributes.position,colors=new Float32Array(ridgePoints.count*3);
 const olive=new T.Color('#819564'),dusk=new T.Color('#929b7e'),hay=new T.Color('#bac28e');
 for(let i=0;i<ridgePoints.count;i++){
  const x=ridgePoints.getX(i)+W/2+350,z=ridgePoints.getZ(i)-400;
  ridgePoints.setX(i,x-W/2);ridgePoints.setY(i,pastureHeight(x,z));ridgePoints.setZ(i,z-H/2);
  const b=.39+Math.sin(x*.016+z*.017)*.14+Math.cos(z*.03)*.10;
  const far=Math.min(.81,Math.max(0,-z*.0010)),t=olive.clone().lerp(hay,b).lerp(dusk,far);
  blossomCover(x,z,t);
  colors[i*3]=t.r;colors[i*3+1]=t.g;colors[i*3+2]=t.b;
 }
 ridgeGeo.setAttribute('color',new T.BufferAttribute(colors,3));ridgeGeo.computeVertexNormals();
 const ridge=new T.Mesh(ridgeGeo,new T.MeshLambertMaterial({vertexColors:true}));
 ridge.visible=false;scene.add(ridge);
 const group=new T.Group();group.visible=false;scene.add(group);
 // Only winding footpaths mark the background pasture; no agricultural rows.
 const fieldRows=new T.BufferGeometry(),fieldPts=[],fieldColors=[];
 // Lead the pond camera through a gap rather than hiding all distant
 // marks behind the near trees. One path enters a high open pasture,
 // with two short branches tracing the slope. Same static terrain batch.
 const pastureRoutes=[
  [[631,-218,2.0],[703,-248,6.3],[777,-278,7.0],[840,-312,7.7],[872,-365,8.1],[929,-413,7.3],[1007,-453,6.2],[1075,-489,6.4],[1150,-513,5.4],[1227,-547,1.8]],
  [[836,-315,6],[893,-329,4.6],[949,-332,4.1],[1016,-347,4.4],[1076,-366,3.1],[1154,-387,1.4]],
  [[886,-384,4],[844,-407,5],[796,-422,3.4],[751,-446,1]]
 ];
 const trackTint=['#c3b88b','#bcad85','#b8a77b'].map(c=>new T.Color(c));
 for(const [routeId,route] of pastureRoutes.entries()){
  const steps=[];
  for(let section=0;section<route.length-1;section++){
   const [x,z,w]=route[section],[nx,nz,nw]=route[section+1];
   for(let k=0;k<10;k++){
    const t=k*.1,px=x+(nx-x)*t,pz=z+(nz-z)*t;
    const thickness=w+(nw-w)*t+Math.sin(px*.08+pz*.038)*.84;
    steps.push([px,pz,thickness]);
   }
  }
  steps.push(route.at(-1));
  const edge=[];
  for(let j=0;j<steps.length;j++){
   const [x,z,w]=steps[j],a=steps[Math.max(0,j-1)],b=steps[Math.min(steps.length-1,j+1)];
   const dx=b[0]-a[0],dz=b[1]-a[1],d=Math.hypot(dx,dz);
   edge.push([-1,0,1].map((sign,i)=>{
    const px=x+(-dz/d)*sign*w,pz=z+(dx/d)*sign*w;
    const t=trackTint[routeId].clone();
    if(i!==1)t.lerp(olive,.71);
    return [[px-W/2,pastureHeight(px,pz)+1.03,pz-H/2],t];
   }));
  }
  for(let i=1;i<edge.length;i++)for(let b=0;b<2;b++){
   const c=edge[i-1],n=edge[i];
   for(const [pt,color] of [c[b],c[b+1],n[b],n[b],c[b+1],n[b+1]]){fieldPts.push(...pt);fieldColors.push(color.r,color.g,color.b);}
  }
 }
 fieldRows.setAttribute('position',new T.Float32BufferAttribute(fieldPts,3));
 fieldRows.setAttribute('color',new T.Float32BufferAttribute(fieldColors,3));fieldRows.computeVertexNormals();
 group.add(new T.Mesh(fieldRows,new T.MeshLambertMaterial({vertexColors:true,side:T.DoubleSide,transparent:true,opacity:.44,depthWrite:false})));

 const geometries=[new T.CylinderGeometry(.07,.19,1,6),new T.PlaneGeometry(1,1),new T.PlaneGeometry(1,1)];
 const obj=new T.Object3D(),color=new T.Color();
 for(let tier=0;tier<3;tier++){
  const size=31+tier*17;
  const c3=Array.from({length:size},()=> {
   let x=-335+rand()*1645;const z=-63-tier*165-rand()*139,h=(18+rand()*54)*(1-tier*.16);
   // Keep the uphill pasture in the light; gather the displaced trees
   // into irregular flanking coppices without adding instances.
   if(tier>0&&z<-268&&x>689+(z+320)*-.08&&x<1050){
    const centre=x<881?598:1160;
    x=centre+(x-centre)*.17+Math.sin(x*.091+z*.04)*49;
   }
   return {x,z,h,w:h*(.31+rand()*.38),base:pastureHeight(x,z),broad:rand()>.46,angle:rand()*TAU};
  });
  for(let kind=0;kind<3;kind++){
   const selected=c3.filter(t=>kind===0||t.broad===(kind===2));
   const layers=kind===0?1:kind===1?8:7;
   const mat=kind===0?new T.MeshLambertMaterial({color:'#f4ead3'}):
    new T.MeshLambertMaterial({map:leafMaps[kind===1?1:0],alphaTest:.39,side:T.DoubleSide,emissive:'#77896b',emissiveIntensity:.24+tier*.05});
   const mesh=new T.InstancedMesh(geometries[kind],mat,selected.length*layers);
   mesh.frustumCulled=false;
   selected.forEach(({x,z,h,w,base,angle},i)=>{
    for(let j=0;j<layers;j++){
     const phase=j*2.399963+angle,y=kind===0?.31:kind===1?.39+j/layers*.56:.49+(j%3)*.14;
     const width=kind===0?h*.18:kind===1?w*(1.22-j/layers*.69):w*(.89+(j%2)*.18);
     const radial=kind===0?0:(kind===1?.21:.29)*width;
     obj.position.set(x-W/2+Math.cos(phase)*radial,base+h*y,z-H/2+Math.sin(phase)*radial);
     obj.rotation.set(kind===0?0:.17,phase,.23*Math.sin(phase));
     obj.scale.set(width,kind===0?h*.63:kind===1?h*.30:h*.46,kind===0?h*.18:1);obj.updateMatrix();
     const ix=i*layers+j;
     mesh.setMatrixAt(ix,obj.matrix);mesh.setColorAt(ix,color.set(kind===0?'#877c61':['#687f56','#829774','#98a58b'][tier]).multiplyScalar(.81+(.22+(j%4)*.06)));
    }
   });
   group.add(mesh);
  }
 }
 // An abandoned drystone boundary gives the near pasture its own
 // depth without occluding the pale distant ridge. Batched once, outside
 // navigation and hidden in the overhead view, like the rest of the ridge.
 const stoneGeo=new T.BufferGeometry(),rock=[],stoneTints=[];
 const stoneColors=['#a9a087','#958d73','#afa38c','#a39b7d','#ada88e'].map(x=>new T.Color(x));
 for(const [x0,x1,crest,phase] of [[-226,127,-90,.1],[230,420,-154,1.7],[681,872,-382,2.38],[1026,1188,-466,3.7]]){
  let at=x0;
  while(at<x1){
   const width=6+patchRand()*9,x=at+width*.5;
   const z=crest+12*Math.sin(x*.011+phase)+4*Math.sin(x*.034+phase);
   at+=width*.92+patchRand()*2.1;
   if(patchRand()<.12)continue;
   const height=3.1+patchRand()*4.6,depth=4.6+patchRand()*2.5,base=pastureHeight(x,z)-.62;
   const q=stoneColors[Math.floor(patchRand()*stoneColors.length)];
   const points=[
    [x-width*.51-W/2,base,z+depth*.5-H/2],[x+width*.48-W/2,base,z+depth*.45-H/2],
    [x+width*.48-W/2,base,z-depth*.42-H/2],[x-width*.5-W/2,base,z-depth*.5-H/2],
    [x-width*.39-W/2,base+height*.84,z+depth*.36-H/2],[x+width*.34-W/2,base+height*.97,z+depth*.32-H/2],
    [x+width*.38-W/2,base+height*.76,z-depth*.41-H/2],[x-width*.38-W/2,base+height,z-depth*.35-H/2]];
   const faces=[[0,1,4,.91],[1,5,4,.85],[4,5,7,1.06],[5,6,7,.98],[1,2,5,.82],[2,6,5,.86],[3,0,7,.72],[0,4,7,.77]];
   for(const [a,b,c,k] of faces)for(const i of [a,b,c]){rock.push(...points[i]);stoneTints.push(q.r*k,q.g*k,q.b*k);}
  }
 }
 stoneGeo.setAttribute('position',new T.Float32BufferAttribute(rock,3));
 stoneGeo.setAttribute('color',new T.Float32BufferAttribute(stoneTints,3));stoneGeo.computeVertexNormals();
 group.add(new T.Mesh(stoneGeo,new T.MeshLambertMaterial({vertexColors:true,side:T.DoubleSide})));
 // The valley has its own silhouette and colour rhythm, not more grass
 // scatter. Only the low camera sees the non-walkable 3D background.
 const relief=[],reliefColors=[];
 // Elongated foothills: broad saddles and unequal shoulders instead of
 // singular high peaks. Layers descend and warm into the same aerial haze.
 const ridges=[
  {z:-1260,depth:295,sky:'#a2b5b4',body:'#749699',mist:'#c1cdc0',peaks:[[-810,160],[0,195],[365,235],[660,271],[852,236],[1149,302],[1349,275],[1569,282],[1730,245],[1961,288],[2260,325],[2469,281],[2850,254],[3400,159]]},
  {z:-1010,depth:244,sky:'#89a6a0',body:'#658b81',mist:'#b2c2aa',peaks:[[-780,120],[-230,159],[112,166],[395,213],[660,216],[790,195],[1115,242],[1380,225],[1610,189],[1847,240],[2100,257],[2260,230],[2500,197],[3000,119]]},
  {z:-793,depth:205,sky:'#7f9b83',body:'#557865',mist:'#a5b897',peaks:[[-770,113],[-240,120],[50,157],[309,159],[523,178],[729,169],[936,202],[1164,186],[1384,160],[1625,198],[1871,215],[2040,193],[2330,174],[2780,119]]}
 ];
 for(const [k,ridge] of ridges.entries()){
  const sky=new T.Color(ridge.sky),body=new T.Color(ridge.body),mist=new T.Color(ridge.mist);
  const columns=[];
  for(let i=1;i<ridge.peaks.length;i++){
   const [x0,h0]=ridge.peaks[i-1],[x1,h1]=ridge.peaks[i];
   const n=Math.ceil((x1-x0)/25);
   for(let j=0;j<n;j++){
    const t=j/n,x=x0+(x1-x0)*t;
    // Slightly slanted hollows and uneven shoulder lengths; no sawtooth tips.
    const u=t*t*(3-2*t),crest=h0+(h1-h0)*u;
    const y=crest+3.9*Math.sin(x*.022+k*2.4)+2.3*Math.sin(x*.046+1.4*k)+1.2*Math.cos(x*.104);
    columns.push([x,y + [148,96,51][k]*(.64+.36*Math.sin(x*.0021+.35*k)**2)]);
   }
  }
  {const [x,y]=ridge.peaks.at(-1);columns.push([x,y+[148,96,51][k]*(.64+.36*Math.sin(x*.0021+.35*k)**2)]);}
  const profile=columns.map(([x,height])=>{
   const crestZ=ridge.z+26*Math.sin(x*.004+k)+13*Math.cos(x*.010);
   return Array.from({length:8},(_,j)=>{
    const t=j/7,depth=t*ridge.depth,run=x+t*(29*Math.sin(x*.008+k)+14*Math.sin(x*.017));
    const y=-17+(height+17)*(1-t)**1.38+9*Math.sin(Math.PI*t)*Math.sin(x*.009+k);
    // Broad diagonal spurs and shadow folds sit under a low haze layer.
    const slope=.47+.12*Math.sin(x*.009+4.8*t+k)+.05*Math.cos(x*.019+10*t);
    const color=sky.clone().lerp(body,slope+.19*t).lerp(mist,t*t*.70);
    return [[run-W/2,y,crestZ+depth-H/2],color];
   });
  });
  for(let i=1;i<profile.length;i++)for(let j=0;j<7;j++){
   const a=profile[i-1],b=profile[i];
   for(const [position,color] of [a[j],a[j+1],b[j],a[j+1],b[j+1],b[j]]){
    relief.push(...position);reliefColors.push(color.r,color.g,color.b);
   }
  }
 }
 function paintedMesh(vertices,colors,material){
  const geo=new T.BufferGeometry();
  geo.setAttribute('position',new T.Float32BufferAttribute(vertices,3));
  geo.setAttribute('color',new T.Float32BufferAttribute(colors,3));geo.computeVertexNormals();
  const mesh=new T.Mesh(geo,material);group.add(mesh);return mesh;
 }
 paintedMesh(relief,reliefColors,new T.MeshBasicMaterial({vertexColors:true,side:T.DoubleSide}));
 // Wildflowers gather in overlapping drifts. There is neither a parcel
 // boundary nor a repeated orientation: the tiny blooms flow into the grass.
 function triangle(output,paint,a,b,c,ink){
  output.push(...a,...b,...c);
  for(const f of [.99,1.025,.975])paint.push(ink.r*f,ink.g*f,ink.b*f);
 }
 const bloomVerts=[],bloomColors=[];
 let seedFlowers=143081;
 const flowersRandom=()=>((seedFlowers=(Math.imul(seedFlowers,1664525)+1013904223)>>>0)/4294967296);
 const blossom=['#eba4b4','#d48ca8','#bea6dc','#f2d696','#f1d9bb','#dcaacf','#eda5a1'].map(c=>new T.Color(c));
 const leaf=new T.Color('#808b5b'),lightGrass=new T.Color('#a6ab77');
 const drifts=[
  [680,-361,160,78,-.18,0],[798,-426,166,86,.26,1],[892,-502,198,98,-.38,2],
  [1008,-487,194,98,-.25,0],[1104,-524,194,109,-.12,0],[1233,-495,201,112,.25,2],
  [1375,-460,203,111,-.20,3],[1546,-395,197,109,.21,4],[1727,-333,205,94,-.16,0],
  [1935,-285,205,89,.44,5]
 ];
 const mat=new T.MeshLambertMaterial({vertexColors:true,side:T.DoubleSide});
 const colorQ=new T.Color();
 for(const [d,[cx,cz,rx,rz,angle,pigment]] of drifts.entries()){
  const co=Math.cos(angle),si=Math.sin(angle);
  for(let k=0;k<660;k++){
   const a=flowersRandom()*TAU,r=Math.sqrt(flowersRandom());
   const edge=1+.13*Math.sin(3*a+.8*d)+.09*Math.sin(5*a+d);
   const u=Math.cos(a)*rx*r*edge,v=Math.sin(a)*rz*r*edge;
   const x=cx+u*co-v*si,z=cz+u*si+v*co;
   const patch=.50+.24*Math.sin(x*.037+z*.039)+.22*Math.sin(z*.083-x*.021+.69*d);
   if(flowersRandom()>.54+patch*.41-r**7*.31)continue;
   const h=2.3+flowersRandom()*5.1,wide=1.3+flowersRandom()*3.7;
   const y=pastureHeight(x,z)+2.2,X=x-W/2,Z=z-H/2,turn=flowersRandom()*TAU;
   const q=flowersRandom(),ink=colorQ.copy(blossom[pigment]).lerp(blossom[(pigment+1+(k%3))%blossom.length],q*.50).multiplyScalar(.86+q*.31);
   if(k%13===0)triangle(bloomVerts,bloomColors,[X-.68,y,Z],[X+1.08,y,Z+.23],[X+Math.cos(turn),y+h,Z+.38],leaf);
   const p0=[X+Math.cos(turn)*wide,y+h,Z+Math.sin(turn)*wide];
   const p1=[X+Math.cos(turn+TAU/3)*wide,y+h+.21,Z+Math.sin(turn+TAU/3)*wide];
   const p2=[X+Math.cos(turn-TAU/3)*wide,y+h+.38,Z+Math.sin(turn-TAU/3)*wide];
   triangle(bloomVerts,bloomColors,p0,p1,p2,ink);
   if(k%5===0){
    const centre=[(p0[0]+p1[0]+p2[0])/3,y+h+.78,(p0[2]+p1[2]+p2[2])/3];
    triangle(bloomVerts,bloomColors,p0,centre,p2,ink.clone().lerp(lightGrass,.37));
   }
  }
 }
 paintedMesh(bloomVerts,bloomColors,mat);
 return close=>{ridge.visible=close;group.visible=close;};
}
