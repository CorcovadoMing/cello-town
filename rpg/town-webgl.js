import {addShoreCraft} from './town-shore.js?v=1';
import {breezeAt,makeLivingGrass,makePondHorizon,POND_SHOT} from './town-breeze.js?v=2';
import {addOrchardTree,makeOrchardLeaf,makeOrchardBark,makeOrchardSkin,makeOrchardVolumes,townSunVector} from './town-orchard.js?v=8';
/* Optional live 3D view of the existing gameplay map. All world (x, y) positions
   still belong to the town controller. This renderer owns only world-to-screen
   projection, GPU resources and the scenery meshes. */
import {drawWetSoil} from './wet-soil.js?v=exp3';
import {addBenchGardenCraft,addCabinAndPondCraft} from './town-craft.js?v=1';
export const ROOM_WIDTH=960,ROOM_HEIGHT=560;
const W=ROOM_WIDTH,H=ROOM_HEIGHT;
const local=(x,z)=>[x-W/2,z-H/2];

// The art remains 3D, but every ground vertex follows the former Canvas
// identity projection. Elevation projects only upward; no yaw across the
// map, perspective scaling, camera tracking or touch offsets are introduced.
// A slightly lower gaze makes upright sides taller on screen without
// shifting the ground or changing the scale of pixel actors.
const OUTDOOR_EYE_HEIGHT=950,OUTDOOR_EYE_DISTANCE=880;
const VIEW_Z=OUTDOOR_EYE_DISTANCE/OUTDOOR_EYE_HEIGHT;
const LOUNGE_SEAT_CENTER=16,LOUNGE_SEAT_DEPTH=3;
export const LOUNGE_BODY_SHIFT=(LOUNGE_SEAT_CENTER+LOUNGE_SEAT_DEPTH/2)*VIEW_Z-8;
// Lift the hips to the chair but keep the bottoms of both shoes planted.
export function drawGroundedSeated(g,x,y,paint){
 const hip=y-8,sole=y+4,top=hip-LOUNGE_BODY_SHIFT;
 const stretch=(sole-top)/(sole-hip);
 g.save();g.beginPath();g.rect(x-30,top-76,60,76);g.clip();
 g.translate(0,top-hip);paint();g.restore();
 g.save();g.beginPath();g.rect(x-30,top,60,sole-top);g.clip();
 g.translate(0,sole);g.scale(1,stretch);g.translate(0,-sole);paint();g.restore();
}

const BENCH_SLAT_CENTER_Y=30, BENCH_SLAT_THICKNESS=3;
const BENCH_SEAT_TOP=BENCH_SLAT_CENTER_Y+BENCH_SLAT_THICKNESS/2;
const BENCH_HOME_Z=211, BENCH_LANDING_Z=247;
const PET_GROUND_TOP=1.4, PET_CONTACT_OFFSET=.8;
// A billboard references the supporting surface before the painted pose.
// Interpolate support across the old 2D path; put its hop in world height
// exactly once so the bench can occlude correctly without hiding the cat.
export function benchCatLift({mode,y,jump=0}){
 if(mode==='home'||mode==='stretch')return BENCH_SEAT_TOP+PET_CONTACT_OFFSET;
 if(mode!=='jumpUp'&&mode!=='jumpDown')return PET_GROUND_TOP;
 const u=Math.max(0,Math.min(1,(y-BENCH_HOME_Z)/(BENCH_LANDING_Z-BENCH_HOME_Z)));
 return (BENCH_SEAT_TOP+PET_CONTACT_OFFSET)*(1-u)+PET_GROUND_TOP*u+Math.max(0,jump)/VIEW_Z;
}
export function makeTownCamera(T){
 const camera=new T.OrthographicCamera(-W/2,W/2,H/2,-H/2,2,4200);
 camera.position.set(0,OUTDOOR_EYE_HEIGHT,OUTDOOR_EYE_DISTANCE);camera.lookAt(0,0,0);camera.updateMatrixWorld();
 // Keep the orthographic clipping-depth row from Three.js; use exact screen
 // coefficients for the first two rows of the combined world-to-clip matrix.
 const worldToClip=new T.Matrix4().multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse);
 const m=worldToClip.elements;
 m[0]=2/W;m[4]=0;m[8]=0;m[12]=0;
 m[1]=0;m[5]=2*VIEW_Z/H;m[9]=-2/H;m[13]=0;
 camera.projectionMatrix.multiplyMatrices(worldToClip,camera.matrixWorld);
 camera.projectionMatrixInverse.copy(camera.projectionMatrix).invert();
 return camera;
}
// A one-off painted pigment map in world coordinates. It is attached to the
// surfaces, not a screen overlay, so moving shadows and wet paths stay real.
export const TOWN_PAINT_PALETTE=Object.freeze({
 meadow:Object.freeze(['#a3b783','#9cae7b','#adbd89','#b4c38f','#90a971']),
 soil:Object.freeze(['#d0c298','#beae83','#ded1ae','#c9bc92','#eee0bb']),
 pond:Object.freeze(['#81b1a5','#79a99f','#8cbbac','#719f99','#adcaba'])
});
function landscapePigment(T,kind){
 const c=document.createElement('canvas');c.width=768;c.height=448;
 const ctx=c.getContext('2d');
 ctx.scale(c.width/W,c.height/H);
 const [base,shade,light,warm,cool]=TOWN_PAINT_PALETTE[kind];
 let seed={meadow:1891,soil:9833,pond:4889}[kind];
 const next=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 ctx.fillStyle=base;ctx.fillRect(0,0,W,H);
 function glaze(x,y,w,h,angle,hue,alpha){
  ctx.save();ctx.translate(x,y);ctx.rotate(angle);ctx.scale(w,h);
  const ink=ctx.createRadialGradient(-.09,-.08,.05,0,0,1);
  ink.addColorStop(0,hue);ink.addColorStop(.70,hue+'9a');ink.addColorStop(1,hue+'00');
  ctx.globalAlpha=alpha;ctx.fillStyle=ink;ctx.fillRect(-1,-1,2,2);ctx.restore();
 }
 const values=kind==='meadow'?[[133,180,153,65,shade],[381,150,193,64,shade],[533,238,215,76,warm],[725,355,196,80,light],[341,434,140,66,light],[700,492,170,94,shade],[92,340,120,53,cool]]:
  kind==='soil'?[[275,315,159,24,light],[494,354,179,24,shade],[683,326,110,29,light],[472,471,34,103,shade],[678,278,34,68,warm]]:
  [[358,249,246,93,light],[456,310,246,75,warm],[674,355,198,77,shade],[272,395,181,57,cool]];
 for(const [x,y,w,h,hue] of values)glaze(x,y,w,h,(next()-.5)*.3,hue,.68);
 const accents=[shade,light,warm,base,cool];
 for(let group=0;group<32;group++){
  const x=next()*W,y=next()*H,rank=next();
  for(let i=0;i<8;i++){
   const xx=x+(next()-.5)*94,yy=y+(next()-.5)*55;
   const w=(kind==='pond'?12:7)+next()*23,h=1.7+next()*5;
   const angle=(next()-.5)*.54+(kind==='meadow'?-.21:0);
   glaze(xx,yy,w,h,angle,accents[(i+group)%accents.length],.13+rank*.25);
  }
 }
 const t=new T.CanvasTexture(c);
 t.colorSpace=T.SRGBColorSpace;t.anisotropy=2;return t;
}
// Water pigment varies with depth. Two drifting ripple bands bend the
// lighter reflection across the actual pond mesh; nothing is painted over fish.
function woodWearMap(T){
 const c=document.createElement('canvas');c.width=128;c.height=64;
 const g=c.getContext('2d');g.fillStyle='#ece6d5';g.fillRect(0,0,128,64);
 let z=401;const rnd=()=>{z=(Math.imul(z,1664525)+1013904223)>>>0;return z/4294967296;};
 for(let i=0;i<27;i++){
  const y=rnd()*64,x=rnd()*129,len=11+rnd()*51;
  g.strokeStyle=i%3===0?'#aba08a52':'#f8f5e788';g.lineWidth=.27+rnd()*.83;
  g.beginPath();g.moveTo(x,y);g.bezierCurveTo(x+len*.25,y+2,x+len*.75,y-1.8,x+len,y+.3);g.stroke();
 }
 for(const [x,y] of [[27,31],[102,18]]){
  const ink=g.createRadialGradient(x,y,0,x,y,13);
  ink.addColorStop(0,'#a38f78aa');ink.addColorStop(1,'#a38f7800');
  g.fillStyle=ink;g.fillRect(x-13,y-13,26,26);
 }
 const texture=new T.CanvasTexture(c);texture.colorSpace=T.SRGBColorSpace;return texture;
}
function pondSurface(T,map){
 const material=new T.MeshLambertMaterial({map,color:'#eff8f4'});
 const phase={value:0},brightness={value:.9},lightX={value:.48};
 material.onBeforeCompile=shader=>{
  Object.assign(shader.uniforms,{townWaterPhase:phase,townWaterBrightness:brightness,townWaterLightX:lightX});
  shader.fragmentShader=shader.fragmentShader.replace('#include <common>',`
   #include <common>
   uniform float townWaterPhase;
   uniform float townWaterBrightness;
   uniform float townWaterLightX;
  `).replace('#include <map_fragment>',`
   #include <map_fragment>
   vec2 uvPond = vMapUv;
   float t = townWaterPhase;
   float swell = sin(uvPond.y*62. + uvPond.x*5.3 + sin(uvPond.x*16.-t*3.)*.55 -t*11.);
   float overlap = sin(uvPond.y*102. - uvPond.x*13. +t*7. +sin(uvPond.x*12.+t*5.)*.41);
   float blade = smoothstep(.63,1.,swell) * smoothstep(.0,.91,overlap);
   float knots = smoothstep(.17,.79,sin(uvPond.x*37.+sin(uvPond.y*19.-t*3.)*1.7+t*4.));
   float band = (1.-smoothstep(.035,.44,abs(uvPond.x-townWaterLightX+.16*(uvPond.y-.48))));
   float border = smoothstep(.01,.13,uvPond.y)*(1.-smoothstep(.74,.995,uvPond.y));
   float wash = (.027+.088*band*border)*townWaterBrightness;
   float glint = .17*blade*knots*band*border*townWaterBrightness;
   diffuseColor.rgb = mix(diffuseColor.rgb,vec3(.54,.64,.39),wash+glint)
      * (1.+swell*.043+overlap*.023);
  `);
 };
 material.customProgramCacheKey=()=> 'town-pond-ripple-1';
 return {material,update(now,weather,lamp,motion){
  phase.value=motion?now%96000/96000*Math.PI*2:0;
  brightness.value=weather==='rain'?.24:weather==='breeze'?.72:.97;
  lightX.value=.46+Math.max(-1,Math.min(1,(lamp.x-45)/270))*.21;
 }};
}
// A short-lived ground trace from actual walking, with distance-based spacing.
export function createFootfallTracker(isSoil){
 const previous=new Map(),prints=[];
 return Object.freeze({
  walk(actors,clock,weather,allowed=true){
   if(!allowed){previous.clear();prints.length=0;return [];}
   for(const a of actors){
    let q=previous.get(a.id);
    if(!q){previous.set(a.id,{x:a.x,z:a.z,carry:0,side:1});continue;}
    const dx=a.x-q.x,dz=a.z-q.z,ds=Math.hypot(dx,dz);
    if(ds>35||!a.active){q.carry=0;}
    else if(ds>.01){
     const stride=11.5;
     for(let d=stride-q.carry;d<=ds;d+=stride){
      const x=q.x+dx*d/ds+q.side*2.2*dz/ds,z=q.z+dz*d/ds-q.side*2.2*dx/ds;
      if(isSoil(x,z))prints.push({x,z,yaw:Math.atan2(dx,dz),at:clock,wet:weather==='rain',side:q.side});
      q.side*=-1;
     }
     q.carry=(q.carry+ds)%stride;
    }
    q.x=a.x;q.z=a.z;
   }
   while(prints.length&&(prints.length>12||clock-prints[0].at>(prints[0].wet?1680:960)))prints.shift();
   return prints.map(d=>({...d,opacity:(d.wet?.30:.19)*Math.max(0,1-(clock-d.at)/(d.wet?1680:960))**1.3}));
  }
 });
}
function insidePolygon(x,z,path){
 let inside=false;
 for(let i=0,j=path.length-1;i<path.length;j=i++){
  const [xi,zi]=path[i],[xj,zj]=path[j];
  if((zi>z)!==(zj>z)&&x<(xj-xi)*(z-zi)/(zj-zi)+xi)inside=!inside;
 }
 return inside;
}
function paintTerrainUV(T,geometry,spanX=W,spanZ=H){
 const pos=geometry.attributes.position,uv=new Float32Array(pos.count*2);
 for(let i=0;i<pos.count;i++){uv[2*i]=.5+pos.getX(i)/spanX;uv[2*i+1]=.5+pos.getY(i)/spanZ;}
 geometry.setAttribute('uv',new T.BufferAttribute(uv,2));
 return geometry;
}
export async function makeTownWebGL({trees,chairs,stand,room,onLoss}){
 // Use the same reviewed, packaged Three.js as the experimental studio.
 const lib=new URL('./3D/vendor/three.module.js',location.href);
 const T=await import(lib.href);
 const output=document.createElement('canvas');
 const renderer=new T.WebGLRenderer({canvas:output,alpha:false,antialias:true,powerPreference:'low-power',preserveDrawingBuffer:false});
 renderer.setPixelRatio(1);renderer.setSize(W,H,false);renderer.outputColorSpace=T.SRGBColorSpace;
 renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;
 renderer.shadowMap.autoUpdate=false;
 const scene=new T.Scene();
 const mapBackground=new T.Color('#eee3d5');
 scene.background=mapBackground;
 const horizons=[makePondHorizon(T,false),makePondHorizon(T,true)];
 const mapCamera=makeTownCamera(T);
 const pondCamera=new T.PerspectiveCamera(POND_SHOT.fov,W/H,2,2350);
 const [ex,ey,ez]=POND_SHOT.eye,[lx,ly,lz]=POND_SHOT.target;
 pondCamera.position.set(ex-W/2,ey,ez-H/2);pondCamera.lookAt(lx-W/2,ly,lz-H/2);pondCamera.updateMatrixWorld();
 const facingYaw=Math.atan2(ex-lx,ez-lz);
 let camera=mapCamera;
 const updateGrass=makeLivingGrass(T,scene,W,H);

 const sun=new T.DirectionalLight('#ffe7b0',2.05);
 sun.position.set(350,700,-310);sun.castShadow=true;
 sun.shadow.mapSize.set(1024,1024);
 Object.assign(sun.shadow.camera,{left:-660,right:660,top:550,bottom:-550,near:40,far:1540});
 sun.shadow.camera.updateProjectionMatrix();sun.shadow.bias=-.0007;sun.shadow.normalBias=2.2;
 const fill=new T.HemisphereLight('#e8f3f0','#b8a183',1.34);
 const porchFill=new T.DirectionalLight('#fff0db',.43);
 porchFill.position.set(70,260,610);
 scene.add(sun,fill,porchFill);
 const leafy=makeOrchardLeaf(T),crowns=makeOrchardVolumes(T);
 const meadowPigment=landscapePigment(T,'meadow'),soilPigment=landscapePigment(T,'soil'),pondPigment=landscapePigment(T,'pond');
 const geometry={
  box:new T.BoxGeometry(1,1,1),'weathered-board':new T.BoxGeometry(1,1,1), sphere:new T.IcosahedronGeometry(1,1),
  trunk:new T.CylinderGeometry(.36,.51,1,7), cone:new T.ConeGeometry(1,1,5),
  circle:new T.CircleGeometry(1,18), 'orchard-leaf':leafy.geometry,'orchard-wide':crowns.wide,'orchard-round':crowns.round,'orchard-fir':crowns.fir, 'window-glass':new T.BoxGeometry(1,1,1)
 };
 const material=new T.MeshLambertMaterial({flatShading:true});
 const boardSkin=new T.MeshLambertMaterial({map:woodWearMap(T),flatShading:true});
 const leafyMaterial=leafy.material;
 const barkMaterial=new T.MeshLambertMaterial({map:makeOrchardBark(T),flatShading:true});
 const crownMaterial=new T.MeshLambertMaterial({map:makeOrchardSkin(T),vertexColors:true,emissive:'#8eaa72',emissiveIntensity:.24});
 const firMaterial=new T.MeshLambertMaterial({map:makeOrchardSkin(T,true),vertexColors:true,emissive:'#76917a',emissiveIntensity:.20});
 const windowGlass=new T.MeshLambertMaterial({emissive:'#b88651',emissiveIntensity:.32});
 const batches=new Map();
 const model=new T.Object3D(),sample=new T.Vector3();
 const color=new T.Color();
 function shape(kind,x,y,z,sx,sy,sz,tint,rx=0,ry=0,rz=0,flex=0){
  const [dx,dz]=local(x,z);model.position.set(dx,y,dz);model.rotation.set(rx,ry,rz);model.scale.set(sx,sy,sz);model.updateMatrix();
  if(!batches.has(kind))batches.set(kind,[]);
  batches.get(kind).push([model.matrix.clone(),tint,flex,x,z]);
 }
 const box=(...args)=>shape('box',...args);
 const woodDetail=(...args)=>shape('weathered-board',...args);
 const sphere=(...args)=>shape('sphere',...args);
 function plane(x,z,y,sx,sz,tint,alpha){
  const [dx,dz]=local(x,z);
  const mesh=new T.Mesh(geometry.circle,new T.MeshBasicMaterial({color:tint,transparent:true,opacity:alpha,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1}));
  mesh.position.set(dx,y,dz);mesh.rotation.x=-Math.PI/2;mesh.scale.set(sx,sz,1);scene.add(mesh);return mesh;
 }
 let seed=21841;const rng=()=>{seed=(Math.imul(1664525,seed)+1013904223)>>>0;return seed/4294967296;};
 // The stage is an actual stand-alone little landscape model. No CSS
 // clipping: all three rounded pieces have exposed sides and catch shadows.
 function slab(w,d,rad,top,height,tint,cap=null){
  const x=-w/2,z=-d/2,q=new T.Shape();
  q.moveTo(x+rad,z);q.lineTo(x+w-rad,z);q.quadraticCurveTo(x+w,z,x+w,z+rad);
  q.lineTo(x+w,z+d-rad);q.quadraticCurveTo(x+w,z+d,x+w-rad,z+d);
  q.lineTo(x+rad,z+d);q.quadraticCurveTo(x,z+d,x,z+d-rad);
  q.lineTo(x,z+rad);q.quadraticCurveTo(x,z,x+rad,z);q.closePath();
  const geo=new T.ExtrudeGeometry(q,{depth:height,bevelEnabled:true,bevelThickness:2,bevelSize:2,bevelSegments:2,curveSegments:8});
  const edgeMaterial=new T.MeshLambertMaterial({color:tint,flatShading:true});
  const material=cap?[new T.MeshLambertMaterial({map:cap,color:'#fbf7ef',flatShading:true}),edgeMaterial]:edgeMaterial;
  if(cap)paintTerrainUV(T,geo,w,d);
  const mesh=new T.Mesh(geo,material);
  mesh.position.y=top-height;mesh.rotation.x=-Math.PI/2;mesh.castShadow=true;mesh.receiveShadow=true;scene.add(mesh);
 }
 slab(994,598,43,-28,10,'#786856');
 slab(983,586,40,-13,15,'#b59971');
 slab(966,569,36,-1,12,'#a3b783',meadowPigment);
 // Paint tiny exposed layers into the sides of the earth, always below the
 // walkable 0 plane. Deliberate dashes hint at gravel instead of raster noise.
 for(let i=0;i<37;i++){
  const x=44+i*23+rng()*8;
  box(x,-16-rng()*7,571,4+rng()*10,1.15,.85,i%3?'#cfbb91':'#8f795b');
  if(i<20)box(969,-18-rng()*5,27+i*25,1.05,.9,4+rng()*10,'#ceb88c');
 }
 // Quiet matte backdrop below the terrain; a repeated weave at this
 // zoom reads as a grid rather than a natural miniature base.
 const clothMat=new T.MeshLambertMaterial({color:'#ede2d4'});
 const plinth=new T.Mesh(new T.PlaneGeometry(5600,3600),clothMat);
 plinth.rotation.x=-Math.PI/2;plinth.position.y=-45;plinth.receiveShadow=true;scene.add(plinth);
 // The path is one junction, shaped and bevelled from its established
 // horizontal lane, centre walk, and short northern doorway approach.
 const pathLoop=[[168,312],[179,302],[236,300],[319,302],[385,298],[453,302],[514,298],[566,302],[630,299],[637,283],[636,254],[648,244],[704,244],[716,253],[715,281],[719,300],[751,301],[779,303],[793,314],[790,356],[777,369],[709,371],[636,368],[562,372],[501,369],[498,414],[500,463],[497,510],[499,556],[489,564],[442,564],[428,553],[428,500],[430,459],[427,414],[426,369],[374,367],[310,370],[255,368],[182,368],[170,359]];
 const trail=new T.Shape();
 pathLoop.forEach(([x,z],i)=>i?trail.lineTo(x-W/2,H/2-z):trail.moveTo(x-W/2,H/2-z));trail.closePath();
 const pathMesh=new T.Mesh(paintTerrainUV(T,new T.ExtrudeGeometry(trail,{depth:1.85,bevelEnabled:true,bevelThickness:1.2,bevelSize:1.8,bevelSegments:2})),new T.MeshLambertMaterial({map:soilPigment,color:'#f7f4eb',flatShading:true}));
 pathMesh.rotation.x=-Math.PI/2;pathMesh.position.y=1.2;pathMesh.receiveShadow=true;scene.add(pathMesh);
 const footfall=createFootfallTracker((x,z)=>insidePolygon(x,z,pathLoop));
 const stampTexture=(()=>{
  const c=document.createElement('canvas');c.width=16;c.height=24;
  const g=c.getContext('2d');
  for(const [x,y,r,h,opacity] of [[8,6,4.8,6,.75],[8.4,15,4.2,6,.92]]){
   g.save();g.translate(x,y);g.scale(r,h);
   const ink=g.createRadialGradient(0,0,.12,0,0,1);
   ink.addColorStop(0,`rgba(255,255,255,${opacity})`);ink.addColorStop(.72,'rgba(255,255,255,.55)');ink.addColorStop(1,'rgba(255,255,255,0)');
   g.fillStyle=ink;g.fillRect(-1,-1,2,2);g.restore();
  }
  const tex=new T.CanvasTexture(c);tex.colorSpace=T.SRGBColorSpace;return tex;
 })();
 const footShape=new T.PlaneGeometry(4.5,7.4),steps=Array.from({length:12},()=>{
  const mesh=new T.Mesh(footShape,new T.MeshBasicMaterial({map:stampTexture,color:'#685441',transparent:true,depthWrite:false}));
  mesh.visible=false;mesh.renderOrder=5;scene.add(mesh);return mesh;
 });
 function footmarks(actors,t,weather,allowed){
  const recent=footfall.walk(actors,t,weather,allowed);
  for(let i=0;i<steps.length;i++){
   const mesh=steps[i],mark=recent[i];mesh.visible=Boolean(mark);if(!mark)continue;
   const [x,z]=local(mark.x,mark.z);
   mesh.position.set(x,4.67,z);mesh.rotation.set(-Math.PI/2,0,-mark.yaw+(mark.side<0?.13:-.13));
   mesh.material.opacity=mark.opacity;mesh.material.color.set(mark.wet?'#59494d':'#7f6244');
  }
 }
 const pathAt=(x,z)=>(x>161&&x<800&&z>292&&z<380)||(x>417&&x<510&&z>369)||(x>617&&x<727&&z>242&&z<314);
 for(let i=0;i<240;i++){
  const x=21+rng()*913,z=85+rng()*456;
  if(pathAt(x,z)||(x<282&&z>375)||(x>729&&z>393)||(x>565&&x<791&&z>111&&z<245))continue;
  const w=4+rng()*13;
  box(x,1.1,z,w,.65,2+rng()*8,['#a8bb84','#97b17a','#a6ba84','#a3b982'][i%4],0,(rng()-.5)*.65);
 }
 for(const [x,z,w,d] of [[480,333,620,72],[464,463,72,192],[676,268,76,53]])for(let i=0;i<Math.ceil(w*d/760);i++){
  const dx=x-w*.43+rng()*w*.86,dz=z-d*.41+rng()*d*.82;
  sphere(dx,3.9,dz,1.15+rng()*3.6,.3,.65+rng()*1.55,['#d9c096','#e6cfa5','#d3bb90'][i%3],0,(rng()-.5)*1.4);
 }
 // Broad pigment islands break the upper meadow into ground, sun and
 // orchard shade, without filling the readable centre with extra objects.
 plane(360,162,1.53,89,42,'#829956',.10);
 plane(470,177,1.57,89,39,'#c0bb7a',.11);
 plane(525,129,1.51,65,38,'#8aa570',.08);
 plane(391,251,1.53,67,31,'#bac783',.10);
 const wornBand=(points,y,tint,a)=>{
  const q=new T.Shape();
  const complete=points.map(([x,z,w])=>[x,z-w]).concat(points.slice().reverse().map(([x,z,w])=>[x,z+w]));
  complete.forEach(([x,z],i)=>i?q.lineTo(x-W/2,H/2-z):q.moveTo(x-W/2,H/2-z));q.closePath();
  const mesh=new T.Mesh(new T.ShapeGeometry(q),new T.MeshLambertMaterial({color:tint,transparent:true,opacity:a,depthWrite:false}));
  mesh.rotation.x=-Math.PI/2;mesh.position.y=y;mesh.receiveShadow=true;scene.add(mesh);
 };
 wornBand([[181,320,1],[210,321,5],[256,324,8],[302,319,7],[362,319,8],[421,322,7],[471,320,5],[522,316,5],[577,316,7],[641,319,7],[698,316,7],[746,324,6],[781,325,1]],4.36,'#b8a47e',.17);
 wornBand([[193,344,1],[227,342,5],[267,345,7],[311,348,8],[371,349,7],[444,347,9],[507,346,6],[576,342,7],[626,343,5],[685,345,7],[733,344,6],[763,347,1]],4.37,'#baa880',.14);
 // Repeated straight-edged tread rectangles look like pavers. Use
 // gently curved traces with irregular width and tapered ends instead.
 const tracks=[
  {walk:[[184,324],[217,325],[256,329],[290,331],[332,331],[373,332],[415,333],[465,333],[501,332],[548,330],[590,329],[629,331],[673,332],[716,333],[753,334],[779,334]],span:7},
  {walk:[[457,368],[453,392],[453,420],[457,449],[457,473],[454,500],[452,528],[454,551]],span:5},
  {walk:[[684,246],[684,258],[682,278],[682,300],[679,318]],span:5}
 ];
 for(const {walk,span} of tracks)for(const side of [-1,1]){
  const edges=[[],[]];
  for(let i=0;i<walk.length;i++){
   const [x,z]=walk[i],p=walk[Math.max(0,i-1)],n=walk[Math.min(walk.length-1,i+1)];
   const dx=n[0]-p[0],dz=n[1]-p[1],len=Math.hypot(dx,dz),nx=-dz/len,nz=dx/len;
   const off=side*span+(rng()-.5)*2.1;
   const span1=1.7+rng()*1.55,span2=1.4+rng()*2.3;
   const tip=Math.min(1,(i+.08)/1.5,(walk.length-i-.92)/1.5);
   edges[0].push([x+nx*(off-span1*tip),z+nz*(off-span1*tip)]);
   edges[1].push([x+nx*(off+span2*tip),z+nz*(off+span2*tip)]);
  }
  const contour=edges[0].concat(edges[1].reverse()),path=new T.Shape();
  contour.forEach(([x,z],i)=>i?path.lineTo(x-W/2,H/2-z):path.moveTo(x-W/2,H/2-z));
  path.closePath();
  const mesh=new T.Mesh(new T.ShapeGeometry(path),new T.MeshLambertMaterial({color:side>0?'#bf9f6a':'#c7a876',transparent:true,opacity:.095,depthWrite:false}));
  mesh.rotation.x=-Math.PI/2;mesh.position.y=4.39;mesh.receiveShadow=true;scene.add(mesh);
 }
 for(const [x,z,rx,rz,n] of [[202,301,19,6,8],[277,367,25,7,10],[339,298,22,5,9],[401,370,18,7,8],[529,367,24,6,8],[577,300,25,7,11],[735,367,28,7,12],[782,332,9,18,9],[430,441,6,26,8],[498,498,7,26,7],[711,281,7,14,7]]){
  for(let i=0;i<n;i++){
   const dx=x+(rng()-.5)*rx*2,dz=z+(rng()-.5)*rz*2;
   if(i%4===0)sphere(dx,3.8,dz,2.5+rng()*3,1.5+rng(),1.8+rng()*3,i%2?'#a8996e':'#baa786',0,rng());
   else box(dx,4.2,dz,2.2+rng()*6,.4,1.1+rng()*4,['#aebb81','#9eaf73','#b3be84'][i%3],0,rng()*.8);
  }
 }
 // Ground-located weather, beneath actors and roof, rather than
 // screen-space dots or painted puddles toggled solely by rain status.
 function wetLayer(kind,x,z,w,d,y){
  const paper=document.createElement('canvas');paper.width=w;paper.height=d;
  const raw=document.createElement('canvas');raw.width=w;raw.height=d;
  const ctx=raw.getContext('2d'),soft=paper.getContext('2d'),map=new T.CanvasTexture(paper);
  // Canvas filters are optional. Bilinear resampling of the completed
  // mask smooths the cell edges on both modern and older Canvas engines.
  const thumb=document.createElement('canvas');
  thumb.width=Math.ceil(w/3);thumb.height=Math.ceil(d/3);
  const down=thumb.getContext('2d');
  down.imageSmoothingEnabled=soft.imageSmoothingEnabled=true;
  map.colorSpace=T.SRGBColorSpace;map.generateMipmaps=false;
  map.minFilter=T.LinearFilter;map.magFilter=T.LinearFilter;
  const material=new T.MeshBasicMaterial({map,transparent:true,depthWrite:false,alphaTest:.002});
  const mesh=new T.Mesh(new T.PlaneGeometry(w,d),material);
  const [dx,dz]=local(x+w/2,z+d/2);
  mesh.rotation.x=-Math.PI/2;mesh.position.set(dx,y,dz);mesh.visible=false;
  scene.add(mesh);
  return {kind,x,z,w,d,ctx,soft,raw,down,thumb,map,mesh};
 }
 const wetLayers=[wetLayer('road',148,216,664,344,4.63),wetLayer('bed',742,410,158,97,9.75)];
 let previousMoisture=null;
 function updateWetLayers(moisture){
  if(moisture===previousMoisture)return;
  previousMoisture=moisture;
  for(const {kind,x,z,w,d,ctx,soft,raw,down,thumb,map,mesh} of wetLayers){
   mesh.visible=moisture.some(c=>(c.kind===kind||(kind==='road'&&c.kind==='verge'))&&c.level>0);
   if(!mesh.visible)continue;
   ctx.clearRect(0,0,w,d);
   ctx.save();ctx.translate(-x,-z);drawWetSoil(ctx,moisture,kind);ctx.restore();
   down.clearRect(0,0,thumb.width,thumb.height);
   down.drawImage(raw,0,0,thumb.width,thumb.height);
   soft.clearRect(0,0,w,d);soft.drawImage(thumb,0,0,w,d);map.needsUpdate=true;
  }
 }
 // Bare grass and genuine cast shadows under the wooden bench.
 const wood='#ad8150',edge='#735b41',warm='#d2aa69',cream='#ede0ae';
 for(const x of [190,309]){box(x,15,221,5,30,5,edge);box(x,29,197,5,58,5,edge);}
 for(const z of [205,BENCH_HOME_Z,217,223])woodDetail(250,BENCH_SLAT_CENTER_Y,z,135,BENCH_SLAT_THICKNESS,4,z%2?wood:warm);
 for(const y of [38,47,55])woodDetail(250,y,196,135,5,4,wood);
 function table(x,z,width=64,depth=32){
  for(const dx of [-width*.39,width*.39])for(const dz of [-depth*.36,depth*.36])box(x+dx,14,z+dz,4,28,4,edge);
  box(x,27,z,width,5,depth,wood);
  for(let dz=-depth/2+3;dz<depth/2;dz+=6)box(x,30,z+dz,width-1,.6,4.8,warm);
 }
 table(490,230);
 for(const c of chairs){
  box(c.x,LOUNGE_SEAT_CENTER,c.y,16,LOUNGE_SEAT_DEPTH,13,wood);for(const x of [-5,5])for(const z of [-4,4])box(c.x+x,7,c.y+z,2.6,14,2.5,edge);
  const side=c.id==='left'?-1:1;box(c.x+side*7,24,c.y,3,20,13,wood);
 }
 // Real mossy volumes and two wooden portals lining the distant edge.
 const fenceTint=['#aa8656','#b18c5a','#a98553','#ab895a'];
 const posts=[];
 for(let x=12,j=0;x<950;x+=30,j++){
  const n=(j*29+j*j*9)%29,q=x+(n-14)*.24,z=72+(n%5-2)*.26,h=29+(n%8-4)*.46;
  const lean=(n%7-3)*.01;
  posts.push({x:q,z});
  woodDetail(q,h*.5-1,z,4.5,h,5,fenceTint[j%4],0,0,lean);
  box(q-Math.sin(lean)*h*.48,h-2,z,5.4,2.5+(n%3)*.2,6,j%7===5?'#bb9d71':'#d0ac73',0,n*.021,lean);
 }
 for(const centerY of [10,22]){
  let i=0;
  while(i<posts.length-1){
   const a=posts[i],j=Math.min(i+2+((i*7+centerY)%4),posts.length-1),b=posts[j];
   const rise=((i*17+centerY)%9-4)*.15,offset=(i%3-1)*.32;
   woodDetail((a.x+b.x)*.5,centerY+rise,(a.z+b.z)*.5+offset,b.x-a.x+(i===0?.45:0),2.74,2.6,
    ['#c6a16b','#bd9e68','#c3a671'][i%3],0,.002*(i%3-1),.004*(i%4-1));
   i=j;
  }
 }
 // Continuous foliage clusters on the north rim, all anchored to the
 // model; muted sage separates them from the sharper hand-shaped orchard.
 for(const [a,z,count] of [[87,49,5],[238,39,4],[391,50,5],[563,40,5],[717,46,6],[860,48,5]]){
  for(let i=0;i<count;i++){
   const x=a+(i-(count-1)/2)*20+5*rng(),d=z+(rng()-.5)*20,h=11+rng()*9;
   const width=13+rng()*11,depth=12+rng()*7,turn=rng();
   const greens=['#809754','#7c925b','#8ba760','#94a365'];
   for(let layer=0;layer<3;layer++){
    const a=turn*6.283+layer*2.1;
    shape('orchard-leaf',x+Math.sin(a)*6,8+h*.58+layer*2,d+Math.cos(a)*depth*.30,
     width*(1.19-layer*.09),h*(1.32-layer*.10),1,greens[(i+layer)%4],-.32-layer*.34,a,.32*Math.cos(a));
   }
  }
 }
 for(const [i,[x,y,s]] of trees.entries()){
  addOrchardTree({shape:(kind,x,y,z,sx,sy,sz,tint,rx=0,ry=0,rz=0)=>{
   const flex=kind==='trunk'?0:Math.min(1,Math.max(.2,y/(99*s)));
   shape(kind,x,y,z,sx,sy,sz,tint,rx,ry,rz,flex);
  }},x,y+46*s,s*.88,i);
 }
 // Physical pond wall and a recessed, gently shaded water plane.
 box(146,-1,465,249,6,150,'#738773');
 box(146,-1.6,465,232,5.5,138,'#629d95');
 const paintedWater=pondSurface(T,pondPigment);
 const water=new T.Mesh(new T.PlaneGeometry(225,135),paintedWater.material);
 water.rotation.x=-Math.PI/2;water.position.set(...[146-W/2,2.15,465-H/2]);water.receiveShadow=true;scene.add(water);
 const rippleGeometry=new T.RingGeometry(.93,1,44);
 const ripples=Array.from({length:12},(_,i)=>{
  const mesh=new T.Mesh(rippleGeometry,new T.MeshBasicMaterial({color:'#e4f0d6',side:T.DoubleSide,transparent:true,opacity:0,depthWrite:false}));
  mesh.rotation.x=-Math.PI/2;mesh.renderOrder=5;mesh.visible=false;scene.add(mesh);return mesh;
 });
 const fishGeometry=new T.PlaneGeometry(1,1);
 const fishImage=(()=>{
  const c=document.createElement('canvas');c.width=64;c.height=32;const g=c.getContext('2d');
  g.fillStyle='#f4e5be';g.beginPath();g.ellipse(34,15,15,7,0,0,Math.PI*2);g.fill();
  g.fillStyle='#bae3d1';g.beginPath();g.moveTo(24,15);g.lineTo(10,8);g.lineTo(13,16);g.lineTo(8,24);g.closePath();g.fill();
  g.fillStyle='#fff4ce';g.beginPath();g.ellipse(37,12,6,2,0,0,Math.PI*2);g.fill();
  const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;return t;
 })();
 const pondFish=['#548e91','#d97d62','#819d63'].map(color=>{
  const mesh=new T.Mesh(fishGeometry,new T.MeshBasicMaterial({map:fishImage,color,side:T.DoubleSide,transparent:true,opacity:.64,depthWrite:false}));
  mesh.visible=false;mesh.rotation.x=-Math.PI/2;mesh.renderOrder=4;scene.add(mesh);return mesh;
 });
 const rainGeometry=new T.PlaneGeometry(.46,8.3);
 const lowRain=new T.InstancedMesh(rainGeometry,new T.MeshBasicMaterial({color:'#e3eee3',transparent:true,opacity:.29,side:T.DoubleSide,depthWrite:false}),112);
 lowRain.visible=false;lowRain.frustumCulled=false;scene.add(lowRain);
 function updatePondLife(close,weather,t,motion){
  const rain=weather==='rain';
  for(const [i,fish] of pondFish.entries()){
   fish.visible=close;
   if(!close)continue;
   const a=(motion?t*.00017:0)+i*2.09;
   fish.position.set(140+Math.sin(a)*67-W/2,2.21,464+Math.cos(a*.83+i)*42-H/2);
   fish.rotation.z=Math.atan2(-.83*Math.sin(a*.83+i)*42,Math.cos(a)*67);
   fish.scale.set(17+i*1.8,7+i*.6,1);
   fish.material.opacity=.53+(rain?0:.12)*(1+Math.sin(a*2))*.5;
  }
  lowRain.visible=close&&rain&&motion;
  for(let i=0;i<ripples.length;i++){
   const ripple=ripples[i];
   ripple.visible=close&&motion&&(rain||i<3);
   if(!ripple.visible)continue;
   const duration=rain?1600:3400,shifted=t+(i*719),cycle=Math.floor(shifted/duration),u=shifted%duration/duration;
   const x=55+((i*49+cycle*83)%183),z=411+((i*31+cycle*23)%107),radius=1+u*(rain?9:18);
   ripple.position.set(x-W/2,2.23+i*.001,z-H/2);
   ripple.scale.set(radius,radius,1);
   ripple.material.opacity=(rain?.39:.28)*Math.sin(u*Math.PI)*(.9-u*.45);
  }
  if(lowRain.visible){
   for(let i=0;i<lowRain.count;i++){
    const phase=(t*(.12+i%3*.014)+i*47.13)%130;
    const x=18+(i*73%680)+(130-phase)*.14,z=174+(i*107%405);
    model.position.set(x-W/2,131-phase,z-H/2);
    model.rotation.set(0,facingYaw,-.13);model.scale.set(1,.58+i%3*.24,1);model.updateMatrix();
    lowRain.setMatrixAt(i,model.matrix);
   }
   lowRain.instanceMatrix.needsUpdate=true;
  }
 }

 for(let i=0;i<17;i++){
  const x=42+i*12.2,z=i%2?398:531;
  sphere(x,1,z,6+rng()*6,3+rng()*3,5+rng()*3,i%3?'#a29e7d':'#bbb18d',0,rng());
 }
 for(let i=0;i<14;i++){const z=403+i*8.8;for(const x of [27,264])sphere(x,2,z,5,3+rng()*3,7,'#a6a788',0,rng());}
 for(const [x,z,n] of [[56,426,9],[248,474,7],[81,530,8],[287,438,4],[562,427,5],[710,398,7],[906,528,7],[19,541,8],[934,548,8]]){
  for(let i=0;i<n;i++){
   const dx=x+(rng()-.5)*24,dz=z+(rng()-.5)*18,h=4+rng()*12;
   shape('cone',dx,h*.44,dz,1.6,h,1.5,i%3?'#7c9c5f':'#9eae6b',.08,rng(),(rng()-.5)*.3,.35+h*.012);
   if(i%4===0)sphere(dx,h,dz,2.3,2.0,2.2,['#e9c4a8','#f4db8c','#e0baad'][i%3]);
  }
 }
 // Hand-planted colour in middle and near terrain, leaving the walking
 // lane and entry apron empty. Flowers use finite instanced geometry.
 for(const [x,z,palette] of [[355,273,['#f6dfa4','#f4d6b0']],[562,394,['#dfc0af','#efdc9a']],[710,386,['#efdbc1','#e1b6a9']],[315,461,['#eddfaa','#f1dfcb']],[875,340,['#f1dfad','#e7bdad']]]){
  for(let i=0;i<14;i++){
   const a=x+(rng()-.5)*46,b=z+(rng()-.5)*23,h=4+rng()*7;
   shape('trunk',a,h*.48,b,1.02,h,1.02,'#7f9c61',0,0,(rng()-.5)*.4);
   sphere(a,h,b,1.8,1.8,1.8,palette[i%2]);
  }
 }
 for(const [x,z] of [[72,527],[303,548],[551,549],[901,533],[930,518],[355,348]]){
  sphere(x,2,z,4+rng()*6,2+rng()*3,3+rng()*5,'#aaab8a',0,rng());
  if(x!==355)sphere(x+7,3,z+4,6,4,3,'#929b81',0,rng());
 }
 // The six original garden plots remain in the same places.
 box(821,3.4,459.5,172,6.8,111,'#8c795b');box(821,7,459.5,161,2,101,'#836247');
 for(const x of [767,817,867])for(const z of [440,482]){box(x,8.5,z,40,2.2,20,'#967858');box(x-1,10,z-3,36,1,2,'#a78b60');}
 for(const [x,z,w,d] of [[821,405,172,5],[821,513,172,5],[737,459,5,109],[905,459,5,109]])box(x,8,z,w,8,d,wood);
 // House is a real small chalet: façade and all roof meshes share the same
 // local origin, actor contact coordinates and approach as the pixel original.
 const cx=room.x+96,fr=room.depth-2,cy=fr-38;
 box(cx,5,cy,148,10,82,'#9c8d6b');
 box(cx,42,cy,140,72,76,'#e4c58e');
 for(let x=cx-61;x<=cx+65;x+=14)box(x,4,fr+1,7,1.3,1,'#bea985');
 for(let y=15;y<79;y+=9){
  box(cx,y,fr+1,140,.8,1.1,'#be9b61');box(cx+70,y,cy,.9,.8,75,'#aa8654');
 }
 for(const x of [cx-68,cx+68])box(x,44,fr+2,5,73,4,edge);
 // Front door keeps the original hit region and a distinct knob instead of a CSS hotspot.
 box(cx,31,fr+1,44,61,4,'#947449');box(cx,30,fr+4,35,57,3,'#4d7968');
 for(const y of [20,40]){box(cx,y,fr+6,26,15,1,'#3f6253');box(cx,y+1,fr+7,22,12,1,'#658d72');}
 sphere(cx+11,30,fr+8,2.1,2.2,1.1,'#eac078');
 for(const x of [cx-45,cx+45]){
  box(x,46,fr+3,26,28,3,edge);shape('window-glass',x,46,fr+5,21,23,1.6,'#b8a581');box(x,46,fr+7,2.1,22,1.2,cream);box(x,46,fr+7,21,2,1.2,cream);box(x,33,fr+7,30,3,7,warm);
 }
 for(const z of [cy-15,cy+12]){box(cx+71,47,z,2,23,21,edge);box(cx+73,47,z,1,19,17,'#84aaa2');box(cx+74,47,z,1,19,2,cream);box(cx+74,47,z,1,2,17,cream);}
 // True gables are triangular meshes, roof slopes are thick tiled slabs.
 const gable=new T.Shape();gable.moveTo(-70,0);gable.lineTo(70,0);gable.lineTo(0,43);gable.closePath();
 const gg=new T.ExtrudeGeometry(gable,{depth:76,bevelEnabled:false});
 const gm=new T.Mesh(gg,new T.MeshLambertMaterial({color:'#dbb77c',flatShading:true}));gm.position.set(cx-W/2,78,cy-38-H/2);gm.castShadow=true;gm.receiveShadow=true;scene.add(gm);
 const slope=.52;
 for(const s of [-1,1]){
  box(cx+s*39,100,cy,91,7,96,'#8d604d',0,0,-s*slope);
  for(let row=0;row<7;row++)for(let tile=0;tile<7;tile++){
   const offset=6+row*11;
   const wear=((row*19+tile*11+s*23)%8+8)%8;
   woodDetail(cx+s*offset,128-offset*.56+(wear-3.5)*.13,cy-42+tile*13+(row%2)*2+(wear-3.5)*.24,11.4,2.1+wear*.06,12.6,
    ['#a67257','#ad795d','#a06d55','#b17d62'][(row*3+tile+(s>0?1:0))%4],0,(wear-3.5)*.006,-s*slope);
  }
  box(cx+s*39,100,fr+10,91,4,4,'#c59d69',0,0,-s*slope);
 }
 box(cx,130,cy,5,4,98,'#a47a55');
 box(cx-25,120,cy-19,12,33,13,'#aa7856');box(cx-25,138,cy-19,16,4,17,'#d3a77a');
 const eye=new T.Mesh(new T.CylinderGeometry(8,8,2,10),new T.MeshLambertMaterial({color:'#8daaaa'}));eye.rotation.x=Math.PI/2;eye.position.set(cx-W/2,96,fr+1-H/2);scene.add(eye);
 box(cx,96,fr+3,2,12,1.5,cream);box(cx,96,fr+3,12,2,1.5,cream);
 for(const [dy,w] of [[8,52],[16,46],[24,39]])box(cx,3,fr+dy,w,6,7,wood);
 plane(cx-25,fr+20,2.9,73,24,'#3e503e',.26);
 // Rural story clusters: firewood and a rain barrel by the cabin;
 // a patched bank fence and stepping-stone alcove at the pond; little
 // clover, shrubs and gravel at the garden. All lie off interaction routes.
 box(754,3,213,30,5,14,'#8c7554');
 for(const [x,z,k] of [[744,210,0],[752,210,1],[760,210,2],[749,216,3],[756,216,4]]){
  shape('trunk',x,7+(k>2?3:0),z,6,17,6,k%2?'#946e4c':'#aa8058',Math.PI/2);
  box(x,7+(k>2?3:0),z+8.3,3,2.3,.4,'#cfaa76');
 }
 shape('trunk',770,7,221,10,16,10,'#9a774e');
 box(770,14.5,221,9.6,1.2,8.1,'#ad9064');
 for(const yy of [4.5,11.5])box(770,yy,225,7,1.1,1.1,'#706957');
 for(const [x,z,h] of [[581,217,14],[590,212,16],[602,205,10],[765,248,9],[773,242,14]]){
  sphere(x,h*.52,z,9+h*.25,h,8+h*.12,'#789b62',.12,rng());
  sphere(x+4,h*.82,z-4,5+h*.17,h*.45,5,'#a0af71',.08,rng());
  if(h>12)sphere(x+4,h*1.04,z,2,1.6,2,'#e5d1a4');
 }
 for(const [x,z,len]of[[14,382,27],[17,360,24],[22,538,24]]){
  for(const dx of [-9,9])box(x+dx,8,z,2.6,17,3,'#9d8159');
  box(x,11,z,len,2.2,2,'#b4976a',0,(z%3-1)*.17,.055);
 }
 for(const [x,z,sz] of [[21,395,7],[28,401,5],[34,395,5],[271,402,7],[281,393,6],[275,396,4],[722,437,5],[723,445,5],[907,406,5],[916,412,6],[916,421,4],[739,512,6]]){
  sphere(x,2,z,sz,2.1,sz*.62,'#a49d78',.1,rng());
 }
 for(const [x,z,green]of[[350,252,'#94a879'],[355,253,'#7e9c68'],[364,249,'#a2ae75'],[329,455,'#88a472'],[337,460,'#a1b179'],[698,479,'#8ea779'],[706,483,'#a6b47c'],[710,476,'#859d6a'],[912,511,'#91a573'],[920,516,'#859c6d']]){
  sphere(x,3.8,z,7+rng()*5,5+rng()*2,7,green,.16,rng());
  for(let j=0;j<3;j++){const xx=x+j*4-3,zz=z+8+j%2;shape('cone',xx,2.2,zz,1.7,5.5,1.6,'#809f6b');if(j%2===0)sphere(xx,4.4,zz,1.6,1.4,1.4,'#ecdb9f');}
 }
 // Fresh growth at the edges only; flowers, route and plot stay readable.
 for(const [x,z,hue,s] of [[35,381,0,1],[257,378,1,.83],[274,389,0,.74],[718,451,1,.90],
  [711,466,2,.79],[908,443,0,.72],[922,467,1,1],[764,253,2,.88],[786,238,0,.70]]){
  const colours=['#638344','#77974e','#87a958'];
  for(let j=0;j<4;j++){
   const theta=j*1.73+z*.05,width=(10+j%2*3)*s;
   shape('orchard-leaf',x+Math.cos(theta)*6*s,(6+j%3*2)*s,z+Math.sin(theta)*5*s,
    width,width*1.20,1,colours[(hue+j)%3],-.34-j*.17,theta,.33*Math.sin(theta));
  }
 }
 // Each mixed verge grows differently. Grass blades, clover and earth are
 // tiny geometry, while open paths and the centre still give the eye rest.
 for(const [x,z,n,kind] of [[149,265,11,0],[417,217,12,1],[535,261,9,0],[796,284,10,2],[293,410,11,1],
  [313,516,13,2],[382,442,9,0],[530,410,10,2],[627,447,9,0],[107,342,10,1],[680,521,12,2],[897,216,10,0]]){
  let s=(x*313+z*719)>>>0;
  const rand=()=>{s=(Math.imul(s,1664525)+1013904223)>>>0;return s/4294967296;};
  const inks=kind===0?['#819653','#a2b06f','#678445']:kind===1?['#6d9258','#89a36b','#99ae74']:['#8b9c5f','#b3bb83','#80935d'];
  for(let j=0;j<n;j++){
   const a=j*2.39996,r=6+rand()*16,xx=x+Math.sin(a)*r,zz=z+Math.cos(a)*r*.64;
   if(pathAt(xx,zz))continue;
   const h=2+rand()*4;
   if(j%4===0){
    sphere(xx,1.9,zz,2.6+rand()*2,.38,1.6+rand()*1.6,'#96865d',0,a);
   }else if(j%4===1){
    for(let k=0;k<3;k++)sphere(xx+Math.sin(k*2.1+a)*1.15,1.8+h*.26,zz+Math.cos(k*2.1+a)*1.15,
     1.3,.32,.82,inks[k],.1,k*2.1+a);
   }else shape('cone',xx,1+h*.44,zz,.6,h,.72,inks[j%3],.21,a,(rand()-.5)*.43);
  }
 }
 // Wooden stand is another readable full-volume landmark.
 box(stand.x,22,stand.y,4,42,4,edge);
 for(const xx of [-12,12])box(stand.x+xx*.53,7,stand.y+3,3,21,3,wood,0,0,xx>0?.54:-.54);
 box(stand.x,42,stand.y,42,21,4,wood,-.19);
 for(const x of [-9,9])box(stand.x+x,43,stand.y+2.5,16,17,1.5,'#f1deb1',-.19);
 for(let i=0;i<4;i++)for(const dx of [-9,9])box(stand.x+dx,40+i*3,stand.y+3.5,12,.5,1,'#af9a6e',-.19);
 addCabinAndPondCraft({box,sphere,shape},room);
 addBenchGardenCraft({box,sphere,shape},stand);
 const updateShore=addShoreCraft({T,scene,W,H,trees,room,shape});
 const swaying=[];
 for(const [kind,items] of batches){
  const batch=new T.InstancedMesh(geometry[kind],kind==='orchard-leaf'?leafyMaterial:kind==='trunk'?barkMaterial:kind==='window-glass'?windowGlass:kind==='orchard-fir'?firMaterial:kind==='weathered-board'?boardSkin:kind.startsWith('orchard-')?crownMaterial:material,items.length);
  items.forEach(([matrix,tint,flex,x,z],i)=>{
   batch.setMatrixAt(i,matrix);batch.setColorAt(i,color.set(tint));
   if(flex>0)swaying.push({batch,i,base:matrix,flex,x,z,seed:x*.006+z*.012});
  });
  batch.instanceMatrix.needsUpdate=true;batch.instanceColor.needsUpdate=true;batch.castShadow=true;batch.receiveShadow=true;scene.add(batch);
 }
 // Rain spilling from the little porch gutter is 3D detail, not extra
 // ground cells or an overlay. The main rain system still owns wetness.
 const eaveDrops=new T.InstancedMesh(geometry.sphere,new T.MeshBasicMaterial({color:'#cbdaca',
  transparent:true,opacity:.66,depthWrite:false}),6);
 eaveDrops.frustumCulled=false;eaveDrops.visible=false;scene.add(eaveDrops);
 const eaveAnchors=[cx-84.4,cx+84.4].map(v=>local(v,cy+49));
 function updateEaveDrops(weather,now){
  eaveDrops.visible=weather==='rain';if(!eaveDrops.visible)return;
  for(let i=0;i<6;i++){
   const [x,z]=eaveAnchors[i%2],u=((now+i*271)%1650+1650)%1650/1650;
   model.position.set(x,81-u*u*76,z+u*u*1.5);
   model.rotation.set(0,0,0);model.scale.set(.32,.9+u*1.12,.33);model.updateMatrix();
   eaveDrops.setMatrixAt(i,model.matrix);
  }
  eaveDrops.instanceMatrix.needsUpdate=true;
 }
 let leafStep=-1,shadowStep=-1,leafWeather='';
 const bent=new T.Matrix4();
 function swayCrowns(now,weather,allowed){
  const steptime=allowed?Math.floor(now/54):-2;
  if(steptime===leafStep&&leafWeather===weather)return;
  leafStep=steptime;leafWeather=weather;
  const t=allowed?steptime*54:0;
  const updated=new Set();
  for(const {batch,i,base,flex,x,z,seed} of swaying){
   bent.copy(base);
   const bend=flex*flex*(breezeAt(t,x,z,weather,allowed)*1.34+(allowed?.21*Math.sin(t*.0016+seed):0));
   bent.elements[12]+=bend;bent.elements[14]+=.48*bend;
   batch.setMatrixAt(i,bent);updated.add(batch);
  }
  for(const batch of updated)batch.instanceMatrix.needsUpdate=true;
  const stamp=allowed?Math.floor(now/118):-2;
  if(stamp!==shadowStep){shadowStep=stamp;renderer.shadowMap.needsUpdate=true;}
 }
 const sprites=new Map();
 const spriteSheet=(id,w,h)=>{
  if(sprites.has(id))return sprites.get(id);
  const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;
  const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;texture.magFilter=T.NearestFilter;texture.minFilter=T.NearestFilter;texture.generateMipmaps=false;
  // True depth-tested billboards, with geometry chosen so the pixel
  // silhouettes stay vertical even under the oblique view.
  const mat=new T.MeshBasicMaterial({map:texture,alphaTest:.22,depthWrite:true,transparent:false,fog:false,side:T.DoubleSide});
  const quad=new T.BufferGeometry(),h3=h/VIEW_Z;
  quad.setAttribute('position',new T.Float32BufferAttribute([-w/2,0,0,w/2,0,0,w/2,h3,0,-w/2,h3,0],3));
  quad.setAttribute('uv',new T.Float32BufferAttribute([0,0,1,0,1,1,0,1],2));
  quad.setIndex([0,1,2,0,2,3]);
  const sprite=new T.Mesh(quad,mat);
  const res={canvas,ctx:canvas.getContext('2d'),texture,sprite};scene.add(sprite);sprites.set(id,res);return res;
 };
 function drawSprite(id,x,y,w,h,paint,lift=0){
  const sheet=spriteSheet(id,w,h);
  sheet.sprite.visible=true;sheet.sprite.position.set(x-W/2,lift,y-H/2);
  const c=sheet.ctx;c.setTransform(1,0,0,1,0,0);c.clearRect(0,0,w,h);
  c.translate(w/2-x,h-1-y);paint(c);sheet.texture.needsUpdate=true;
 }
 const v=new T.Vector3(),ray=new T.Raycaster(),ground=new T.Plane(new T.Vector3(0,1,0),0),ndc=new T.Vector2();
 const project=(x,z,h=0)=>{
  v.set(x-W/2,h,z-H/2).project(camera);
  return {x:(v.x+1)*W/2,y:(1-v.y)*H/2,depth:v.z};
 };
 function inverse(x,y){
  ndc.set(x/W*2-1,1-y/H*2);ray.setFromCamera(ndc,camera);
  return ray.ray.intersectPlane(ground,sample)?{x:sample.x+W/2,y:sample.z+H/2}:null;
 }
 const dryMoisture=Object.freeze([]);
 let alive=true,lastWeather='',lastLight=null;
 function discard(){
  if(!alive)return;
  alive=false;
  const resources=new Set(horizons);
  scene.traverse(o=>{if(o.geometry)resources.add(o.geometry);if(o.material){for(const m of Array.isArray(o.material)?o.material:[o.material]){resources.add(m);if(m.map)resources.add(m.map);}}});
  for(const res of resources)res.dispose();
  renderer.dispose();onLoss?.();
 }
 output.addEventListener('webglcontextlost',e=>{e.preventDefault();discard();},{once:true});
 return Object.freeze({output,project,inverse,drawSprite,footmarks,
  hideSprites(){for(const s of sprites.values())s.sprite.visible=false;},
  render(weather,moisture=dryMoisture,now=Date.now(),motion=true,view='play',clock=0){
   if(!alive)return false;
   const close=view==='pond';
   camera=close?pondCamera:mapCamera;
   for(const {sprite} of sprites.values()){
    sprite.rotation.y=close?Math.atan2(pondCamera.position.x-sprite.position.x,pondCamera.position.z-sprite.position.z):0;
   }
   updateGrass(clock,weather,motion);
   updateShore(weather,close);
   scene.background=close?horizons[weather==='rain'?1:0]:mapBackground;
   if(weather!==lastWeather){
    lastWeather=weather;
    mapBackground.set(weather==='rain'?'#dcd8cd':'#eee5d6');
    sun.intensity=weather==='sun'?1.98:weather==='breeze'?1.47:.65;
    sun.color.set(weather==='rain'?'#ffeac9':weather==='breeze'?'#ffe5bf':'#ffecc9');
    fill.intensity=weather==='rain'?1.99:1.48;
    porchFill.intensity=weather==='rain'?.40:.48;
    fill.color.set(weather==='rain'?'#f2f5e8':'#fbf2de');
    windowGlass.emissiveIntensity=weather==='rain'?.76:.32;
    renderer.shadowMap.needsUpdate=true;
   }
   const lamp=townSunVector(now);
   if(!lastLight||Math.hypot(lamp.x-lastLight.x,lamp.y-lastLight.y,lamp.z-lastLight.z)>=1.8){
    sun.position.set(lamp.x,lamp.y,lamp.z);lastLight=lamp;
    renderer.shadowMap.needsUpdate=true;
   }
   paintedWater.update(now,weather,lamp,motion);
   updatePondLife(close,weather,clock,motion);
   swayCrowns(clock,weather,motion);
   updateEaveDrops(weather,motion?now:0);
   updateWetLayers(moisture);
   renderer.render(scene,camera);return true;
  },
  stats:()=>({calls:renderer.info.render.calls,triangles:renderer.info.render.triangles}),
  discard
 });
}
