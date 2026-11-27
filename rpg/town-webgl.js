/* Optional live 3D view of the existing gameplay map. All world (x, y) positions
   still belong to the town controller. This renderer owns only world-to-screen
   projection, GPU resources and the scenery meshes. */
export const ROOM_WIDTH=960,ROOM_HEIGHT=560;
const W=ROOM_WIDTH,H=ROOM_HEIGHT;
const local=(x,z)=>[x-W/2,z-H/2];

// The art remains 3D, but every ground vertex follows the former Canvas
// identity projection. Elevation alone projects left/up; no yaw across the
// map, perspective scaling, camera tracking or touch offsets are introduced.
const VIEW_X=.17,VIEW_Z=.88;
export function makeTownCamera(T){
 const camera=new T.OrthographicCamera(-W/2,W/2,H/2,-H/2,2,4200);
 camera.position.set(1000*VIEW_X,1000,1000*VIEW_Z);camera.lookAt(0,0,0);camera.updateMatrixWorld();
 // Keep the orthographic clipping-depth row from Three.js; use exact screen
 // coefficients for the first two rows of the combined world-to-clip matrix.
 const worldToClip=new T.Matrix4().multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse);
 const m=worldToClip.elements;
 m[0]=2/W;m[4]=-2*VIEW_X/W;m[8]=0;m[12]=0;
 m[1]=0;m[5]=2*VIEW_Z/H;m[9]=-2/H;m[13]=0;
 camera.projectionMatrix.multiplyMatrices(worldToClip,camera.matrixWorld);
 camera.projectionMatrixInverse.copy(camera.projectionMatrix).invert();
 return camera;
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
 scene.background=new T.Color('#eee3d5');
 const camera=makeTownCamera(T);
 const sun=new T.DirectionalLight('#ffe7b0',2.05);
 sun.position.set(350,700,-310);sun.castShadow=true;
 sun.shadow.mapSize.set(1024,1024);
 Object.assign(sun.shadow.camera,{left:-660,right:660,top:550,bottom:-550,near:40,far:1540});
 sun.shadow.camera.updateProjectionMatrix();sun.shadow.bias=-.0007;sun.shadow.normalBias=2.2;
 const fill=new T.HemisphereLight('#e8f3f0','#b8a183',1.34);
 const porchFill=new T.DirectionalLight('#fff0db',.43);
 porchFill.position.set(70,260,610);
 scene.add(sun,fill,porchFill);
 const geometry={
  box:new T.BoxGeometry(1,1,1), sphere:new T.IcosahedronGeometry(1,1),
  trunk:new T.CylinderGeometry(.36,.51,1,7), cone:new T.ConeGeometry(1,1,5),
  circle:new T.CircleGeometry(1,18)
 };
 const material=new T.MeshLambertMaterial({flatShading:true});
 const batches=new Map();
 const model=new T.Object3D(),sample=new T.Vector3();
 const color=new T.Color();
 function shape(kind,x,y,z,sx,sy,sz,tint,rx=0,ry=0,rz=0){
  const [dx,dz]=local(x,z);model.position.set(dx,y,dz);model.rotation.set(rx,ry,rz);model.scale.set(sx,sy,sz);model.updateMatrix();
  if(!batches.has(kind))batches.set(kind,[]);
  batches.get(kind).push([model.matrix.clone(),tint]);
 }
 const box=(...args)=>shape('box',...args);
 const sphere=(...args)=>shape('sphere',...args);
 function plane(x,z,y,sx,sz,tint,alpha){
  const [dx,dz]=local(x,z);
  const mesh=new T.Mesh(geometry.circle,new T.MeshBasicMaterial({color:tint,transparent:true,opacity:alpha,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1}));
  mesh.position.set(dx,y,dz);mesh.rotation.x=-Math.PI/2;mesh.scale.set(sx,sz,1);scene.add(mesh);return mesh;
 }
 let seed=21841;const rng=()=>{seed=(Math.imul(1664525,seed)+1013904223)>>>0;return seed/4294967296;};
 // The stage is an actual stand-alone little landscape model. No CSS
 // clipping: all three rounded pieces have exposed sides and catch shadows.
 function slab(w,d,rad,top,height,tint){
  const x=-w/2,z=-d/2,q=new T.Shape();
  q.moveTo(x+rad,z);q.lineTo(x+w-rad,z);q.quadraticCurveTo(x+w,z,x+w,z+rad);
  q.lineTo(x+w,z+d-rad);q.quadraticCurveTo(x+w,z+d,x+w-rad,z+d);
  q.lineTo(x+rad,z+d);q.quadraticCurveTo(x,z+d,x,z+d-rad);
  q.lineTo(x,z+rad);q.quadraticCurveTo(x,z,x+rad,z);q.closePath();
  const geo=new T.ExtrudeGeometry(q,{depth:height,bevelEnabled:true,bevelThickness:2,bevelSize:2,bevelSegments:2,curveSegments:8});
  const mesh=new T.Mesh(geo,new T.MeshLambertMaterial({color:tint,flatShading:true}));
  mesh.position.y=top-height;mesh.rotation.x=-Math.PI/2;mesh.castShadow=true;mesh.receiveShadow=true;scene.add(mesh);
 }
 slab(994,598,43,-28,10,'#786856');
 slab(983,586,40,-13,15,'#b59971');
 slab(966,569,36,-1,12,'#a9bf84');
 // Paint tiny exposed layers into the sides of the earth, always below the
 // walkable 0 plane. Deliberate dashes hint at gravel instead of raster noise.
 for(let i=0;i<37;i++){
  const x=44+i*23+rng()*8;
  box(x,-16-rng()*7,571,4+rng()*10,1.15,.85,i%3?'#cfbb91':'#8f795b');
  if(i<20)box(969,-18-rng()*5,27+i*25,1.05,.9,4+rng()*10,'#ceb88c');
 }
 // Unobtrusive, non-green linen under the model, with a fine weave that
 // catches the physical contact shadow. This is outside the playable board.
 const cloth=document.createElement('canvas');cloth.width=cloth.height=128;
 const linen=cloth.getContext('2d');
 linen.fillStyle='#f1e7da';linen.fillRect(0,0,128,128);
 for(let i=0;i<128;i+=4){
  linen.fillStyle=i%8?'#c6af9780':'#fdf5ec';
  linen.globalAlpha=.13;linen.fillRect(i,0,1,128);linen.fillRect(0,i,128,1);
 }
 const fabric=new T.CanvasTexture(cloth);fabric.colorSpace=T.SRGBColorSpace;
 fabric.wrapS=fabric.wrapT=T.RepeatWrapping;fabric.repeat.set(18,12);
 const clothMat=new T.MeshLambertMaterial({color:'#ede2d4',map:fabric});
 const plinth=new T.Mesh(new T.PlaneGeometry(5600,3600),clothMat);
 plinth.rotation.x=-Math.PI/2;plinth.position.y=-45;plinth.receiveShadow=true;scene.add(plinth);
 // The path is one junction, shaped and bevelled from its established
 // horizontal lane, centre walk, and short northern doorway approach.
 const pathLoop=[[168,312],[179,302],[236,300],[319,302],[385,298],[453,302],[514,298],[566,302],[630,299],[637,283],[636,254],[648,244],[704,244],[716,253],[715,281],[719,300],[751,301],[779,303],[793,314],[790,356],[777,369],[709,371],[636,368],[562,372],[501,369],[498,414],[500,463],[497,510],[499,556],[489,564],[442,564],[428,553],[428,500],[430,459],[427,414],[426,369],[374,367],[310,370],[255,368],[182,368],[170,359]];
 const trail=new T.Shape();
 pathLoop.forEach(([x,z],i)=>i?trail.lineTo(x-W/2,H/2-z):trail.moveTo(x-W/2,H/2-z));trail.closePath();
 const pathMesh=new T.Mesh(new T.ExtrudeGeometry(trail,{depth:1.85,bevelEnabled:true,bevelThickness:1.2,bevelSize:1.8,bevelSegments:2}),new T.MeshLambertMaterial({color:'#e3cda0',flatShading:true}));
 pathMesh.rotation.x=-Math.PI/2;pathMesh.position.y=1.2;pathMesh.receiveShadow=true;scene.add(pathMesh);
 const pathAt=(x,z)=>(x>161&&x<800&&z>292&&z<380)||(x>417&&x<510&&z>369)||(x>617&&x<727&&z>242&&z<314);
 for(let i=0;i<240;i++){
  const x=21+rng()*913,z=85+rng()*456;
  if(pathAt(x,z)||(x<282&&z>375)||(x>729&&z>393)||(x>565&&x<791&&z>111&&z<245))continue;
  const w=4+rng()*13;
  box(x,1.1,z,w,.65,2+rng()*8,['#a8bb84','#97b17a','#a6ba84','#a3b982'][i%4],0,(rng()-.5)*.65);
 }
 for(const [x,z,w,d] of [[480,333,620,72],[464,463,72,192],[676,268,76,53]])for(let i=0;i<Math.ceil(w*d/760);i++){
  const dx=x-w*.43+rng()*w*.86,dz=z-d*.41+rng()*d*.82;
  box(dx,4.2,dz,4+rng()*10,.65,1+rng()*4,['#d5bb8e','#ecd6ab','#cbb187'][i%3],0,(rng()-.5)*.55);
 }
 // Broad pigment islands break the upper meadow into ground, sun and
 // orchard shade, without filling the readable centre with extra objects.
 plane(360,162,1.53,89,42,'#829956',.22);
 plane(470,177,1.57,89,39,'#c0bb7a',.30);
 plane(525,129,1.51,65,38,'#8aa570',.19);
 plane(391,251,1.53,67,31,'#bac783',.23);
 const wornBand=(points,y,tint,a)=>{
  const q=new T.Shape();
  const complete=points.map(([x,z,w])=>[x,z-w]).concat(points.slice().reverse().map(([x,z,w])=>[x,z+w]));
  complete.forEach(([x,z],i)=>i?q.lineTo(x-W/2,H/2-z):q.moveTo(x-W/2,H/2-z));q.closePath();
  const mesh=new T.Mesh(new T.ShapeGeometry(q),new T.MeshLambertMaterial({color:tint,transparent:true,opacity:a,depthWrite:false}));
  mesh.rotation.x=-Math.PI/2;mesh.position.y=y;mesh.receiveShadow=true;scene.add(mesh);
 };
 wornBand([[181,320,1],[210,321,5],[256,324,8],[302,319,7],[362,319,8],[421,322,7],[471,320,5],[522,316,5],[577,316,7],[641,319,7],[698,316,7],[746,324,6],[781,325,1]],4.36,'#bf9e6c',.48);
 wornBand([[193,344,1],[227,342,5],[267,345,7],[311,348,8],[371,349,7],[444,347,9],[507,346,6],[576,342,7],[626,343,5],[685,345,7],[733,344,6],[763,347,1]],4.37,'#c1a477',.43);
 // Worn tracks, not scattered noise: two lighter walking lanes converge
 // at the junction; thin moss and rough stones stay close to the margins.
 const tracks=[
  {walk:[[183,323],[217,325],[256,328],[290,330],[332,331],[373,331],[415,332],[465,333],[501,331],[548,329],[590,327],[629,330],[676,331],[713,333],[756,330],[779,331]],span:7},
  {walk:[[455,369],[451,392],[452,420],[457,449],[457,473],[458,503],[453,528],[454,551]],span:5},
  {walk:[[685,246],[686,258],[682,278],[681,300],[678,318]],span:5}
 ];
 for(const {walk,span} of tracks)for(const [i,[x,z]] of walk.entries()){
  for(const d of [-1,1]){
   const vertical=span===5,ox=vertical?d*span:3,oz=vertical?3:d*span;
   box(x+ox,4.03,z+oz,vertical?2.8+rng()*6:14+rng()*12,.22,vertical?12+rng()*9:2.5+rng()*4.4,
    ['#ccb181','#d6b98b','#ecd2a3','#dbc095'][(i+2+(d>0?1:0))%4],0,(rng()-.5)*.18);
  }
 }
 for(const [x,z,rx,rz,n] of [[202,301,19,6,8],[277,367,25,7,10],[339,298,22,5,9],[401,370,18,7,8],[529,367,24,6,8],[577,300,25,7,11],[735,367,28,7,12],[782,332,9,18,9],[430,441,6,26,8],[498,498,7,26,7],[711,281,7,14,7]]){
  for(let i=0;i<n;i++){
   const dx=x+(rng()-.5)*rx*2,dz=z+(rng()-.5)*rz*2;
   if(i%4===0)sphere(dx,3.8,dz,2.5+rng()*3,1.5+rng(),1.8+rng()*3,i%2?'#a8996e':'#baa786',0,rng());
   else box(dx,4.2,dz,2.2+rng()*6,.4,1.1+rng()*4,['#aebb81','#9eaf73','#b3be84'][i%3],0,rng()*.8);
  }
 }
 const puddles=[];
 for(const [x,z,a,b] of [[213,348,17,4],[505,352,12,3.6],[455,517,7,12],[697,291,10,4]]){
  puddles.push(plane(x,z,4.52,a,b,'#526c6d',.30));
  puddles.push(plane(x+2,z-1,4.57,a*.62,b*.39,'#c2d2cc',.28));
 }
 puddles.forEach(m=>m.visible=false);
 // Low stone platform under the existing bench and slender lounge furniture.
 box(250,6,211,154,12,55,'#a39673');box(250,12,211,156,4,57,'#c9b78b');
 for(let x=179;x<326;x+=20)box(x,5,240,1.2,9,1,'#817b63');
 const wood='#ad8150',edge='#735b41',warm='#d2aa69',cream='#ede0ae';
 for(const x of [190,309]){box(x,18,221,5,29,5,edge);box(x,24,197,5,45,5,edge);}
 for(const z of [205,211,217,223])box(250,30,z,135,3,4,z%2?wood:warm);
 for(const y of [38,47,55])box(250,y,196,135,5,4,wood);
 function table(x,z,width=64,depth=32){
  for(const dx of [-width*.39,width*.39])for(const dz of [-depth*.36,depth*.36])box(x+dx,14,z+dz,4,28,4,edge);
  box(x,27,z,width,5,depth,wood);
  for(let dz=-depth/2+3;dz<depth/2;dz+=6)box(x,30,z+dz,width-1,.6,4.8,warm);
 }
 table(490,230);
 for(const c of chairs){
  box(c.x,16,c.y,16,3,13,wood);for(const x of [-5,5])for(const z of [-4,4])box(c.x+x,7,c.y+z,2.6,14,2.5,edge);
  const side=c.id==='left'?-1:1;box(c.x+side*7,24,c.y,3,20,13,wood);
 }
 // Real mossy volumes and two wooden portals lining the distant edge.
 for(let x=12;x<950;x+=30){
  box(x,13,72,4.5,29,5,'#ac8a57');box(x,28,72,5.4,2.5,6,'#d0ac73');
 }
 for(const y of [10,22])box(478,y,72,945,3,2.6,'#c4a46b');
 // Continuous foliage clusters on the north rim, all anchored to the
 // model; muted sage separates them from the sharper hand-shaped orchard.
 for(const [a,z,count] of [[87,49,5],[238,39,4],[391,50,5],[563,40,5],[717,46,6],[860,48,5]]){
  for(let i=0;i<count;i++){
   const x=a+(i-(count-1)/2)*20+5*rng(),d=z+(rng()-.5)*20,h=11+rng()*9;
   sphere(x,9,d,13+rng()*11,h,12+rng()*7,['#a6b78b','#96ac86','#9aaa82','#adbd8f'][i%4],.08,rng());
  }
 }
 for(const [i,[x,y,s]] of trees.entries()){
  const z=y+46*s,scale=s*.88;
  shape('trunk',x,25*scale,z,9*scale,51*scale,9*scale,'#76654b',0,0,(i%3-1)*.07);
  const greens=[['#688f60','#80a976','#a0bb7b'],['#4f7962','#6d9579','#8bb194'],['#789555','#95ad68','#b3be79']][i%3];
  for(const [dx,dy,dz,sz,row] of [[-13,55,4,22,0],[14,57,-2,21,0],[0,65,0,25,1],[-5,78,-9,19,2],[12,70,10,15,1]]){
   sphere(x+dx*scale,dy*scale,z+dz*scale,sz*scale,sz*1.02*scale,sz*scale,greens[row],.12,i*.51);
  }
  plane(x-12*s,z+15*s,3.3,31*s,12*s,'#2c4738',.23);
 }
 // Physical pond wall and a recessed, gently shaded water plane.
 box(146,-1,465,249,6,150,'#738773');
 box(146,-1.6,465,232,5.5,138,'#629d95');
 const water=new T.Mesh(new T.PlaneGeometry(225,135),new T.MeshLambertMaterial({color:'#5b9995'}));
 water.rotation.x=-Math.PI/2;water.position.set(...[146-W/2,2.15,465-H/2]);water.receiveShadow=true;scene.add(water);
 for(let i=0;i<17;i++){
  const x=42+i*12.2,z=i%2?398:531;
  sphere(x,1,z,6+rng()*6,3+rng()*3,5+rng()*3,i%3?'#a29e7d':'#bbb18d',0,rng());
 }
 for(let i=0;i<14;i++){const z=403+i*8.8;for(const x of [27,264])sphere(x,2,z,5,3+rng()*3,7,'#a6a788',0,rng());}
 for(const [x,z,n] of [[56,426,9],[248,474,7],[81,530,8],[287,438,4],[562,427,5],[710,398,7],[906,528,7],[19,541,8],[934,548,8]]){
  for(let i=0;i<n;i++){
   const dx=x+(rng()-.5)*24,dz=z+(rng()-.5)*18,h=4+rng()*12;
   shape('cone',dx,h*.44,dz,1.6,h,1.5,i%3?'#7c9c5f':'#9eae6b',.08,rng(),(rng()-.5)*.3);
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
  box(x,46,fr+3,26,28,3,edge);box(x,46,fr+5,21,23,1.6,'#95bab1');box(x,46,fr+7,2.1,22,1.2,cream);box(x,46,fr+7,21,2,1.2,cream);box(x,33,fr+7,30,3,7,warm);
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
   box(cx+s*offset,128-offset*.56,cy-42+tile*13+(row%2)*2,11.4,2.2,12.6,['#a36e56','#ae795c','#986751','#bc8463'][(row*3+tile+(s>0?1:0))%4],0,0,-s*slope);
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
 // Wooden stand is another readable full-volume landmark.
 box(stand.x,22,stand.y,4,42,4,edge);
 for(const xx of [-12,12])box(stand.x+xx*.53,7,stand.y+3,3,21,3,wood,0,0,xx>0?.54:-.54);
 box(stand.x,42,stand.y,42,21,4,wood,-.19);
 for(const x of [-9,9])box(stand.x+x,43,stand.y+2.5,16,17,1.5,'#f1deb1',-.19);
 for(let i=0;i<4;i++)for(const dx of [-9,9])box(stand.x+dx,40+i*3,stand.y+3.5,12,.5,1,'#af9a6e',-.19);
 for(const [kind,items] of batches){
  const batch=new T.InstancedMesh(geometry[kind],material,items.length);
  items.forEach(([matrix,tint],i)=>{batch.setMatrixAt(i,matrix);batch.setColorAt(i,color.set(tint));});
  batch.instanceMatrix.needsUpdate=true;batch.instanceColor.needsUpdate=true;batch.castShadow=true;batch.receiveShadow=true;scene.add(batch);
 }
 const sprites=new Map();
 const spriteSheet=(id,w,h)=>{
  if(sprites.has(id))return sprites.get(id);
  const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;
  const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;texture.magFilter=T.NearestFilter;texture.minFilter=T.NearestFilter;texture.generateMipmaps=false;
  // True depth-tested billboards, with geometry chosen so the pixel
  // silhouettes stay vertical even under the oblique view.
  const mat=new T.MeshBasicMaterial({map:texture,alphaTest:.22,depthWrite:true,transparent:false,fog:false,side:T.DoubleSide});
  const quad=new T.BufferGeometry(),h3=h/VIEW_Z,slant=VIEW_X*h3;
  quad.setAttribute('position',new T.Float32BufferAttribute([-w/2,0,0,w/2,0,0,w/2+slant,h3,0,-w/2+slant,h3,0],3));
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
 let alive=true,lastWeather='';
 function discard(){
  if(!alive)return;
  alive=false;
  const resources=new Set();
  scene.traverse(o=>{if(o.geometry)resources.add(o.geometry);if(o.material){resources.add(o.material);if(o.material.map)resources.add(o.material.map);}});
  for(const res of resources)res.dispose();
  renderer.dispose();onLoss?.();
 }
 output.addEventListener('webglcontextlost',e=>{e.preventDefault();discard();},{once:true});
 return Object.freeze({output,project,inverse,drawSprite,
  hideSprites(){for(const s of sprites.values())s.sprite.visible=false;},
  render(weather){
   if(!alive)return false;
   if(weather!==lastWeather){
    lastWeather=weather;
    scene.background.set(weather==='rain'?'#c7c6bc':'#eee3d5');
    sun.intensity=weather==='sun'?2.05:weather==='breeze'?1.48:.49;
    fill.intensity=weather==='rain'?1.78:1.34;
    porchFill.intensity=weather==='rain'?.22:.43;
    fill.color.set(weather==='rain'?'#dceef2':'#e8f3f0');
    puddles.forEach(m=>m.visible=weather==='rain');
    renderer.shadowMap.needsUpdate=true;
   }
   renderer.render(scene,camera);return true;
  },
  stats:()=>({calls:renderer.info.render.calls,triangles:renderer.info.render.triangles}),
  discard
 });
}
