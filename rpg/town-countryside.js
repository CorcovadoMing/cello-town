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
 const ridgeGeo=new T.PlaneGeometry(2780,840,111,53);ridgeGeo.rotateX(-Math.PI/2);
 const ridgePoints=ridgeGeo.attributes.position,colors=new Float32Array(ridgePoints.count*3);
 const olive=new T.Color('#819564'),dusk=new T.Color('#929b7e'),hay=new T.Color('#bac28e');
 for(let i=0;i<ridgePoints.count;i++){
  const x=ridgePoints.getX(i)+W/2+350,z=ridgePoints.getZ(i)-400;
  ridgePoints.setX(i,x-W/2);ridgePoints.setY(i,pastureHeight(x,z));ridgePoints.setZ(i,z-H/2);
  const b=.39+Math.sin(x*.016+z*.017)*.14+Math.cos(z*.03)*.10;
  const far=Math.min(.81,Math.max(0,-z*.0010)),t=olive.clone().lerp(hay,b).lerp(dusk,far);
  colors[i*3]=t.r;colors[i*3+1]=t.g;colors[i*3+2]=t.b;
 }
 ridgeGeo.setAttribute('color',new T.BufferAttribute(colors,3));ridgeGeo.computeVertexNormals();
 const ridge=new T.Mesh(ridgeGeo,new T.MeshLambertMaterial({vertexColors:true}));
 ridge.visible=false;scene.add(ridge);
 const group=new T.Group();group.visible=false;scene.add(group);
 // Fading terraced field marks make the background read as distinct
 // farm slopes rather than an uninterrupted flat horizon.
 const fieldRows=new T.BufferGeometry(),fieldPts=[],fieldColors=[];
 const ink=['#a8ac80','#9ba174','#bec299'].map(x=>new T.Color(x));
 for(let lane=0;lane<14;lane++){
  const z0=-120-lane*23-(lane%3)*12,first=-243+(lane%4)*212,width=134+rand()*245;
  const edges=[[],[]];
  for(let j=0;j<17;j++){
   const x=first+width*j/16,z=z0+Math.sin(j*.13+lane*.8)*8+Math.cos(x*.014)*4;
   for(let k=0;k<2;k++){
    const zz=z+(k?1:-1)*(1.5+Math.sin(j/16*Math.PI)*2.6);
    edges[k].push([x-W/2,pastureHeight(x,zz)+.55,zz-H/2]);
   }
  }
  for(let j=0;j<16;j++){
   fieldPts.push(...edges[0][j],...edges[1][j],...edges[0][j+1],
    ...edges[1][j],...edges[1][j+1],...edges[0][j+1]);
   const c=ink[lane%3];for(let i=0;i<6;i++)fieldColors.push(c.r,c.g,c.b);
  }
 }
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
 const palette={
  near:['#718b7b','#638075','#849784'],
  mid:['#81959f','#718899','#98a3ad'],
  far:['#b5c3ce','#9eafc4','#c2cbd6']
 };
 function triangle(output,paint,a,b,c,ink){
  output.push(...a,...b,...c);
  for(const f of [.99,1.025,.975])paint.push(ink.r*f,ink.g*f,ink.b*f);
 }
 const ridges=[
  {z:-1230,depth:400,colors:palette.far,peaks:[[-310,132],[120,181],[349,232],[545,211],[750,380],[867,329],[1082,575],[1231,511],[1332,582],[1544,401],[1680,468],[1867,355],[1926,226],[2200,439],[2380,344],[2642,191]]},
  {z:-1010,depth:370,colors:palette.mid,peaks:[[-230,93],[58,127],[232,204],[467,155],[641,277],[773,241],[955,361],[1055,280],[1185,389],[1290,279],[1413,326],[1570,246],[1710,269],[1860,180],[2100,89]]},
  {z:-820,depth:280,colors:palette.near,peaks:[[-370,58],[-100,105],[75,167],[216,120],[417,175],[595,152],[744,222],[900,168],[1018,242],[1136,182],[1298,229],[1499,159],[1800,70]]}
 ];
 for(const [k,ridge] of ridges.entries()){
  const inks=ridge.colors.map(c=>new T.Color(c));
  const columns=[];
  for(let i=1;i<ridge.peaks.length;i++){
   const [x0,h0]=ridge.peaks[i-1],[x1,h1]=ridge.peaks[i];
   for(let q=0;q<10;q++){
    const u=q*.1,v=(1-Math.cos(Math.PI*u))*.5,x=x0+(x1-x0)*u;
    const trim=Math.sin(Math.PI*u)*(7*Math.sin(x*.065+k)+8*Math.cos(x*.026+1.3*k)+4*Math.sin(x*.105));
    columns.push([x,h0+(h1-h0)*v+trim]);
   }
  }
  columns.push(ridge.peaks.at(-1));
  const profile=columns.map(([x,height],i)=>{
   const z=ridge.z+17*Math.sin(x*.012+k)+9*Math.cos(x*.023);
   const steep=(columns[Math.min(i+1,columns.length-1)][1]-columns[Math.max(0,i-1)][1])*.042;
   return Array.from({length:10},(_,j)=>{
    const u=j/9,foothill=Math.sin(Math.PI*u)*Math.sin(x*.010+k)*17;
    const y=5+(height-5)*(1-u)**1.52+foothill;
    const dx=u*(20*Math.sin(x*.009+k)+30*Math.sin(x*.019)),dz=u*ridge.depth;
    const cold=.49+.22*Math.sin(x*.023-u*4.5)+.12*Math.sin(x*.058+u*9);
    const tint=inks[0].clone().lerp(inks[1],Math.max(.03,Math.min(.86,.33+steep*.24+(cold-.5)*.61)));
    tint.lerp(inks[2],.15+.22*cold+(1-u)**4*.13);
    tint.multiplyScalar(.93+.06*Math.sin(x*.103+u*22)+.028*Math.sin(x*.27-u*47));
    return [[x+dx-W/2,y,z+dz-H/2],tint];
   });
  });
  for(let i=1;i<profile.length;i++)for(let j=0;j<9;j++){
   const a=profile[i-1],b=profile[i];
   for(const [p,c] of [a[j],a[j+1],b[j],a[j+1],b[j+1],b[j]]){relief.push(...p);reliefColors.push(c.r,c.g,c.b);}
  }
 }
 function paintedMesh(vertices,colors,material){
  const geo=new T.BufferGeometry();
  geo.setAttribute('position',new T.Float32BufferAttribute(vertices,3));
  geo.setAttribute('color',new T.Float32BufferAttribute(colors,3));geo.computeVertexNormals();
  const mesh=new T.Mesh(geo,material);group.add(mesh);return mesh;
 }
 paintedMesh(relief,reliefColors,new T.MeshBasicMaterial({vertexColors:true,side:T.DoubleSide}));
 // Crooked patchwork flower fields follow the slope. A continuous carpet
 // reads from afar; individual clumps break the edges at the near side.
 const bloomVerts=[],bloomColors=[],flowerRandom=(()=>{let r=11407;return()=>((r=(Math.imul(r,1664525)+1013904223)>>>0)/4294967296);})();
 const sunnyFlowers=['#de95b2','#e5cab7','#bfa4d9','#edcf8c','#c88baa','#e2bb9a'].map(c=>new T.Color(c));
 const bedSoil=new T.Color('#a2a174');
 function bedPoint(x,z,lift=2.9){return [x-W/2,pastureHeight(x,z)+lift,z-H/2];}
 // The near tree line frames the middle rows rather than enclosing them.
 for(const [plot,cx,cz,rx,rows] of [[0,721,-202,150,8],[1,1330,-415,251,10],[2,1080,-340,164,8],[3,1815,-198,255,9]]){
  for(let row=0;row<rows;row++){
   const lastWidth=rx*(.75+row*.043);
   const samples=[];
   for(let j=0;j<=27;j++){
    const u=j/27,x=cx+(u-.5)*lastWidth*2+row*8;
    const z=cz-row*18+Math.sin(u*3.1+plot*.64+row*.12)*(24+plot*4)+Math.cos(x*.027)*6+(u-.45)*32;
    const width=2.7+5.5*Math.sin(Math.PI*u)**.44+flowerRandom()*1.8;
    const ink=sunnyFlowers[(row+plot*2)%sunnyFlowers.length].clone()
     .lerp(sunnyFlowers[(row+plot*2+1)%sunnyFlowers.length],.12+flowerRandom()*.32);
    samples.push([bedPoint(x,z-width),bedPoint(x,z),bedPoint(x,z+width),ink]);
    if(j>0&&j<27){
     const n=4+Math.round(flowerRandom()*6);
     for(let q=0;q<n;q++){
      const xa=x+(flowerRandom()-.5)*9,za=z+(flowerRandom()-.5)*width*1.91;
      const a=bedPoint(xa,za,2.9+flowerRandom()*3.7),r=.47+flowerRandom()*1.51;
      const ink2=ink.clone().lerp(sunnyFlowers[(row+q)%sunnyFlowers.length],flowerRandom()*.43).multiplyScalar(.84+flowerRandom()*.29);
      triangle(bloomVerts,bloomColors,[a[0]-r,a[1],a[2]+r*.22],[a[0]+r,a[1],a[2]-r*.44],[a[0]-.2,a[1]+r*.68,a[2]+r*.54],ink2);
     }
    }
   }
   for(let i=1;i<samples.length;i++){
    const a=samples[i-1],b=samples[i];
    for(let k=0;k<2;k++){
     const ink=b[3].clone().lerp(bedSoil,.14+.12*(i%4));
     triangle(bloomVerts,bloomColors,a[k],a[k+1],b[k],ink);
     triangle(bloomVerts,bloomColors,a[k+1],b[k+1],b[k],ink);
    }
   }
  }
 }
 paintedMesh(bloomVerts,bloomColors,new T.MeshLambertMaterial({vertexColors:true,side:T.DoubleSide}));
 // A real volume and a moving overshot wheel, placed on a stream crossing
 // outside the player field. Wheel + house use four small render batches.
 const millX=1122,millZ=-374, millY=pastureHeight(millX,millZ);
 const mill=new T.Group();mill.position.set(millX-W/2,millY,millZ-H/2);mill.rotation.y=-.45;mill.scale.setScalar(1.36);group.add(mill);
 const blocks=[
  [8,3.8,0,55,8,44,'#8b8173'],[8,22,-1,49,35,38,'#d2b298'],
  [-15,20.5,18,4,31,3.7,'#6f5544'],[30,20.5,18,4,31,3.7,'#6f5544'],
  [7,34,18,49,4,4,'#916b50'],[7,9,18,49,3,4,'#9d8c75'],
  [-3,18.5,19,10,19,2.6,'#5c7668'],[21,25,19,10,11,3,'#74918d'],
  [21,25,20.7,1,11,1,'#e8d1a9'],[21,25,20.7,10,1,1,'#e8d1a9'],
  [8,53,-2,56,4.45,27,'#986b56',.46],[8,53,20,56,4.45,27,'#a2755b',-.46],
  [8,58.7,9,56,3.1,5.2,'#86614b'],[-6,56,-10,9,19,9,'#ad8770'],[-6,65,-10,13,3.7,13,'#91735e'],
  [31,6,10,47,5,7,'#a38766'],[39,19,13,16,2.6,8,'#78573e'],[47,12,13,2.8,17,3.1,'#81614c']
 ];
 const singleBox=new T.BoxGeometry(1,1,1), millMat=new T.MeshLambertMaterial({flatShading:true});
 function boxes(parent,items){
  const mesh=new T.InstancedMesh(singleBox,millMat,items.length);
  items.forEach(([x,y,z,w,h,d,tint,rx=0,ry=0,rz=0],i)=>{
   obj.position.set(x,y,z);obj.rotation.set(rx,ry,rz);obj.scale.set(w,h,d);obj.updateMatrix();
   mesh.setMatrixAt(i,obj.matrix);mesh.setColorAt(i,color.set(tint));
  });
  parent.add(mesh);
 }
 boxes(mill,blocks);
 const wheel=new T.Group();wheel.position.set(43,17,18);mill.add(wheel);
 const ring=new T.TorusGeometry(14.25,1.38,6,30);
 const hoops=new T.InstancedMesh(ring,millMat,2);
 for(let i=0;i<2;i++){
  obj.position.set(0,0,(i-.5)*4.6);obj.rotation.set(0,0,0);obj.scale.set(1,1,1);obj.updateMatrix();
  hoops.setMatrixAt(i,obj.matrix);hoops.setColorAt(i,color.set(i?'#ad805d':'#7e583f'));
 }
 wheel.add(hoops);
 const spokes=[[0,0,0,4.7,4.7,7.5,'#926042']];
 for(let i=0;i<12;i++){
  const a=i*TAU/12,x=Math.cos(a),y=Math.sin(a);
  if(i%2===0)spokes.push([x*7.0,y*7.0,0,13,1.5,1.9,'#b18b65',0,0,a]);
  spokes.push([x*14.7,y*14.7,0,2.2,4.13,6.7,i%3===0?'#b48a61':'#986b4c',0,0,a]);
 }
 boxes(wheel,spokes);
 const creek=[], creekTint=[];
 const course=[[1087,-463,10],[1120,-425,14],[1152,-396,12],[1165,-364,12],[1176,-329,8],[1187,-298,2]];
 const streamInk=['#769d98','#9fb9a6','#72918d'].map(c=>new T.Color(c));
 for(let i=1;i<course.length;i++){
  const [x,z,w]=course[i-1],[nx,nz,nw]=course[i];
  let old=[bedPoint(x-w,z,1.0),bedPoint(x,z,1.06),bedPoint(x+w,z,1.0)];
  for(let k=1;k<=8;k++){
   const t=k/8,x2=x+(nx-x)*t,z2=z+(nz-z)*t,wide=w+(nw-w)*t;
   const next=[bedPoint(x2-wide,z2,1.0),bedPoint(x2,z2,1.06),bedPoint(x2+wide,z2,1.0)];
   for(let lane=0;lane<2;lane++){
    const c=streamInk[(lane+i+k)%3];
    triangle(creek,creekTint,old[lane],old[lane+1],next[lane],c);
    triangle(creek,creekTint,old[lane+1],next[lane+1],next[lane],streamInk[(lane+i+1)%3]);
   }
   old=next;
  }
 }
 paintedMesh(creek,creekTint,new T.MeshLambertMaterial({vertexColors:true,side:T.DoubleSide}));
 return (close,clock=0,motion=true)=>{ridge.visible=close;group.visible=close;if(close)wheel.rotation.z=motion?clock*-.00041:0;};
}
