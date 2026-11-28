const TAU=Math.PI*2;
export const WATCH_VIEWS=Object.freeze(['play','pond']);
export const POND_SHOT=Object.freeze({
 eye:[35,69,602], target:[325,29,288], fov:49
});
export const GRASS_PATCHES=Object.freeze([
 [33,340,12,39,15],[287,412,19,28,21],[301,464,24,29,22],[308,512,29,31,22],
 [348,423,20,17,14],[402,452,15,27,15],[389,513,27,27,20],[522,446,22,29,21],
 [557,491,22,23,19],[639,468,24,24,17],[701,514,16,24,15],[272,268,23,13,19],
 [148,257,32,18,20],[343,268,30,14,24],[422,273,28,13,19],[532,273,27,16,21],
 [871,281,25,20,23],[902,358,29,21,23],[162,142,26,16,16],[400,177,36,23,23],
 [31,535,14,7,13],[265,527,13,24,18],[249,539,9,13,11]
]);
// Neighbouring clumps share a slow passing gust, not one synchronous wobble.
export function breezeAt(ms,x,z,weather,motion=true){
 if(!motion)return 0;
 const t=ms*.001,strength=weather==='breeze'?1.1:weather==='rain'?.82:.64;
 return strength*(.40+.29*Math.sin(t*1.45-x*.024-z*.014)+.17*Math.sin(t*2.4-x*.048+z*.009));
}
export function makeLivingGrass(T,scene,W,H){
 const geometry=new T.BufferGeometry(),p=[],rgb=[];
 const seed={v:82021};
 const rand=()=>((seed.v=(Math.imul(seed.v,1664525)+1013904223)>>>0)/4294967296);
 const colors=['#819f63','#739556','#8ba967','#9cb577','#719057'].map(c=>new T.Color(c));
 for(const [gx,gz,rx,rz,count] of GRASS_PATCHES)for(let i=0;i<count;i++){
  const angle=rand()*TAU,r=Math.sqrt(rand()),x=gx+Math.cos(angle)*rx*r-W/2,z=gz+Math.sin(angle)*rz*r-H/2;
  const plant=.60+rand()*.8;
  for(let j=0;j<3;j++){
   const a=rand()*TAU,h=(3.0+rand()*5.6)*plant,w=(.34+rand()*.48)*plant;
   const xx=x+(rand()-.5)*5,zz=z+(rand()-.5)*5,dx=Math.cos(a)*w,dz=Math.sin(a)*w;
   const lean=(.6+rand()*2.25),sx=-Math.sin(a)*lean,sz=Math.cos(a)*lean;
   const A=[xx-dx,1.6,zz-dz],B=[xx+dx,1.6,zz+dz],C=[xx+sx*.48-dx*.73,1.6+h*.56,zz+sz*.48-dz*.73],D=[xx+sx*.48+dx*.73,1.6+h*.56,zz+sz*.48+dz*.73],E=[xx+sx,1.6+h,zz+sz];
   p.push(...A,...B,...C,...B,...D,...C,...C,...D,...E);
   const tint=colors[(i+j)%colors.length];
   for(const l of [.84,.91,1,.91,1.03,1,1,1.03,1.14])rgb.push(tint.r*l,tint.g*l,tint.b*l);
  }
 }
 geometry.setAttribute('position',new T.Float32BufferAttribute(p,3));
 geometry.setAttribute('color',new T.Float32BufferAttribute(rgb,3));
 geometry.computeVertexNormals();
 const material=new T.MeshLambertMaterial({side:T.DoubleSide,vertexColors:true});
 const clock={value:0},strength={value:0};
 material.onBeforeCompile=shader=>{
  Object.assign(shader.uniforms,{townBreezeClock:clock,townBreezeStrength:strength});
  shader.vertexShader='uniform float townBreezeClock; uniform float townBreezeStrength;\n'+shader.vertexShader.replace('#include <begin_vertex>',`
#include <begin_vertex>
float stem = max(0., transformed.y - 1.6) / 9.;
float air = townBreezeStrength * (.4 + .29*sin(townBreezeClock*1.45 - position.x*.024 - position.z*.014) + .17*sin(townBreezeClock*2.4 - position.x*.048 + position.z*.009));
transformed.x += air * stem*stem * 4.9;
transformed.z += air * stem*stem * 2.0;
`);
 };
 material.customProgramCacheKey=()=>'town-living-grass-v1';
 const meadow=new T.Mesh(geometry,material);meadow.frustumCulled=false;meadow.receiveShadow=true;scene.add(meadow);
 return (ms,weather,motion)=>{clock.value=motion?(ms%600000)*.001:0;strength.value=motion?(weather==='breeze'?1.1:weather==='rain'?.82:.64):0;};
}

/** A quiet horizon for the shoreline framing, outside the playable model. */
export function makePondHorizon(T,weather){
 const rain=weather==='rain',breeze=weather==='breeze';
 const c=document.createElement('canvas');c.width=960;c.height=560;
 const g=c.getContext('2d');
 // Draw the sky before the horizon profiles. Each weather uses a different
 // cloud silhouette and light source, not merely a different tint.
 const gradient=g.createLinearGradient(0,0,0,325);
 for(const [x,color] of (rain?[[0,'#647993'],[.41,'#8899ae'],[.71,'#b9c0c6'],[1,'#efe0cc']]
   :breeze?[[0,'#889fb8'],[.47,'#aec5d1'],[.77,'#d8e2d8'],[1,'#f5e5ca']]
   :[[0,'#7eafb9'],[.40,'#a9d0cc'],[.72,'#d7e9d7'],[1,'#f7ead1']]))gradient.addColorStop(x,color);
 g.fillStyle=gradient;g.fillRect(0,0,960,560);
 function glow(x,y,w,h,stops){
  g.save();g.translate(x,y);g.scale(w,h);
  const ink=g.createRadialGradient(0,0,0,0,0,1);
  for(const [at,color] of stops)ink.addColorStop(at,color);
  g.fillStyle=ink;g.fillRect(-1,-1,2,2);g.restore();
 }
 // Different lobe sizes and vertical overlap keep even a still sky legible
 // from the phone while leaving openings between its low banks.
 function cloud(x,y,w,h,shape,core,mid,edge){
  g.save();g.translate(x,y);g.scale(w,h);
  const ink=g.createLinearGradient(0,-1,0,.75);
  for(const [at,color] of [[0,edge],[.26,mid],[.58,core],[1,edge]])ink.addColorStop(at,color);
  g.fillStyle=ink;g.beginPath();
  g.moveTo(-1,.12);
  shape.forEach(points=>g.bezierCurveTo(...points));
  g.bezierCurveTo(.54,.53,-.52,.72,-1,.12);
  g.fill();g.restore();
 }
 const wisps=[[-.85,-.08,-.64,.03,-.54,-.18],[-.38,-.40,-.14,-.37,-.02,-.20],[.19,-.37,.34,-.19,.45,-.22],[.67,-.20,.91,.03,1,.10]];
 const banks=[[-.96,-.04,-.84,-.22,-.72,-.21],[-.64,-.68,-.35,-.76,-.24,-.46],[-.08,-.94,.21,-.84,.30,-.43],
  [.47,-.69,.65,-.58,.72,-.28],[.85,-.21,.97,-.12,1,.10]];
 if(breeze){
  // No sharp sun disk; long feathered veils streak in one direction.
  // This remains a dry sky, visibly different from the low rain banks.
  glow(690,65,300,154,[[0,'#fff5deaa'],[.35,'#fff4dd49'],[1,'#fff5dd00']]);
  g.save();g.translate(479,104);g.rotate(-.115);g.translate(-479,-104);
  cloud(180,52,179,25,wisps,'#f4f4efdf','#fbfaf5ac','#f6f7f100');
  cloud(340,80,345,23,wisps,'#eeeae0c8','#fffaeea9','#f4f3e900');
  cloud(679,129,260,31,wisps,'#fff7e6d4','#fffcf0bd','#f4f3e900');
  cloud(924,61,182,14,wisps,'#eff5f6c0','#f4f7f4a4','#e7eef500');
  g.restore();
 }else if(!rain){
  glow(728,88,172,112,[[0,'#fff5c8bc'],[.26,'#fff2cb72'],[1,'#fff1ca00']]);
  glow(728,88,52,48,[[0,'#fff6baff'],[.38,'#fff3c38f'],[1,'#fff2c300']]);
  const disc=g.createLinearGradient(720,73,735,103);
  disc.addColorStop(0,'#fffad6');disc.addColorStop(1,'#ffdf94');
  g.fillStyle=disc;g.beginPath();g.arc(728,88,15.6,0,Math.PI*2);g.fill();
  cloud(158,107,193,27,wisps,'#fff7dfdc','#f8f2d99c','#f7fbf000');
  cloud(233,124,168,19,wisps,'#f9ebd59b','#f9f8e67a','#f8f8ec00');
  cloud(411,65,107,15,wisps,'#f7f5e9bc','#f8f8ea91','#f8f8ed00');
  cloud(894,127,161,32,wisps,'#fff5dcda','#fcf5e498','#f5f6e900');
  cloud(571,143,106,12,wisps,'#fffbeb9c','#fffbef67','#ffffff00');
 }else{
  glow(648,133,281,133,[[0,'#fff0d2c8'],[.32,'#efe2d08e'],[1,'#d7cbbb00']]);
  cloud(275,43,382,84,banks,'#62758ecf','#768ba1bf','#9eacb800');
  cloud(522,68,315,89,banks,'#77869ecf','#a3aebfa6','#a5b1c200');
  cloud(856,66,319,101,banks,'#596c86cd','#8e9bb291','#9ba7bc00');
  cloud(89,100,214,73,banks,'#70849ab9','#a9b4c191','#a9b4c100');
  cloud(321,116,258,53,wisps,'#98a6b7d1','#c1c9ca85','#bdc5c800');
  cloud(863,111,209,56,banks,'#8494a9c5','#adb6c09a','#c5ccd000');
  cloud(615,150,236,20,wisps,'#d5c8c6a5','#f0e0cf79','#e0cdc600');
  cloud(372,166,194,13,wisps,'#d0cbcc99','#e1d9d48d','#e0d9d200');
 }
 for(const [y,amp,phase,ink] of [[230,18,.4,rain?'#a5b4ad':'#aebfae'],[252,17,2.1,rain?'#a5b2a3':'#aabc9c']]){
  g.beginPath();
  for(let x=0;x<=960;x+=12){
   const k=y+amp*Math.sin(x*.0065+phase)+amp*.48*Math.sin(x*.013+phase*3);
   x?g.lineTo(x,k):g.moveTo(x,k);
  }
  g.lineTo(960,560);g.lineTo(0,560);g.closePath();g.globalAlpha=.56;g.fillStyle=ink;g.fill();
 }
 // Atmospheric distance should stay behind the physical pasture.
 // Offset the far profiles so they are neither evenly spaced nor a wall.
 const skyline=[
  [193,[[0,22],[83,10],[113,8],[186,-13],[274,-15],[356,4],[409,8],[510,-5],[594,-20],[669,-17],[761,1],[869,-3],[960,10]]],
  [213,[[0,11],[95,16],[183,3],[302,8],[370,-1],[451,-14],[547,-23],[648,5],[778,13],[837,17],[960,-2]]]
 ];
 for(const [i,[height,contour]] of skyline.entries()){
  g.beginPath();g.moveTo(0,height+contour[0][1]);
  for(let j=1;j<contour.length;j++){const p=contour[j-1],n=contour[j];g.bezierCurveTo((p[0]*2+n[0])/3,height+p[1],(p[0]+n[0]*2)/3,height+n[1],n[0],height+n[1]);}
  g.lineTo(960,560);g.lineTo(0,560);g.closePath();
  g.fillStyle=(rain?['#9daea6','#a6b3a5']:['#b0bca5','#a6b49b'])[i];
  g.globalAlpha=i===0?.43:.46;g.fill();
 }
 const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;return t;
}
