import {softBlade} from './town-plant-form.js?v=1';
const TAU=Math.PI*2;
export const WATCH_VIEWS=Object.freeze(['play','pond']);
export const POND_SHOT=Object.freeze({
 eye:[35,69,602], target:[325,29,288], fov:49
});
export const GRASS_PATCHES=Object.freeze([
 // The open village green between these plantings is intentionally quiet.
 // Pond bank, shade beside the bench/trees, and low house-side planting.
 [35,410,16,18,13],[252,405,11,19,16],[256,475,13,24,17],[218,534,18,12,12],
 [908,481,12,20,13],[933,530,14,15,10]
].map(Object.freeze));
// The edge of the grass reads as a continuous, softly feathered ribbon,
// not individual widely spaced seedlings. Same site for paint and geometry.
export const LAWN_DRIFTS=Object.freeze([
 [350,392,76,9,-.08,83],[596,384,72,8,.04,73],
 [519,282,67,12,-.03,89],[572,237,30,14,.27,78],
 [776,258,33,9,-.22,83],[818,434,74,12,.08,75],
 [450,144,113,10,.01,78],[112,374,40,10,-.24,62]
].map(Object.freeze));
export function lawnAnchor(x,z,w,d,rot,i,n){
 const angle=i*2.399963,r=Math.sqrt((i+.6)/n)*(.86+.125*Math.sin(i*2.43));
 const u=Math.cos(angle)*w*r,v=Math.sin(angle)*d*r;
 return [x+u*Math.cos(rot)-v*Math.sin(rot),z+u*Math.sin(rot)+v*Math.cos(rot)];
}
// Neighbouring clumps share a slow passing gust, not one synchronous wobble.
export function breezeAt(ms,x,z,weather,motion=true){
 if(!motion)return 0;
 const t=ms*.001,strength=weather==='breeze'?1.1:weather==='rain'?.82:.64;
 return strength*(.40+.29*Math.sin(t*1.45-x*.024-z*.014)+.17*Math.sin(t*2.4-x*.048+z*.009));
}
export function makeLivingGrass(T,scene,W,H,clear=()=>true){
 const geometry=new T.BufferGeometry(),p=[],rgb=[];
 const seed={v:82021};
 const rand=()=>((seed.v=(Math.imul(seed.v,1664525)+1013904223)>>>0)/4294967296);
 const colors=['#88a767','#829f61','#91ab6e','#9ab576','#819f65'].map(c=>new T.Color(c));
 for(const [gx,gz,rx,rz,count] of GRASS_PATCHES)for(let i=0;i<count;i++){
  const angle=rand()*TAU,r=Math.pow(rand(),.67),x=gx+Math.cos(angle)*rx*r-W/2,z=gz+Math.sin(angle)*rz*r-H/2;
  const plant=.66+rand()*.58;
  for(let j=0;j<3;j++){
   const a=rand()*TAU,h=(1.95+rand()*3.25)*plant,w=(.48+rand()*.57)*plant;
   const xx=x+(rand()-.5)*5,zz=z+(rand()-.5)*5;
   const lean=(.85+rand()*2.10),tint=colors[(i+j)%colors.length];
   for(const tri of softBlade(xx,zz,a,h,w,lean,1.6))for(const {v,t,s} of tri){
    p.push(...v);const l=.86+t*.25-s*.027;
    rgb.push(tint.r*l,tint.g*l,tint.b*l);
   }

  }
 }
 const bright=['#9fbd62','#a7c46d','#89ac50','#b0c978','#94b65e'].map(c=>new T.Color(c));
 for(const [cx,cz,w,d,rot,count] of LAWN_DRIFTS)for(let i=0;i<count;i++){
  const [x,z]=lawnAnchor(cx,cz,w,d,rot,i,count);
  if(!clear(x,z))continue;
  for(let j=0;j<2;j++){
   const theta=i*2.399963+j*2.17+cx*.1,h=2.4+rand()*3.8,width=.60+rand()*.63;
   const tint=bright[(i+j)%bright.length];
   for(const fan of softBlade(x-W/2+(j-.5)*1.1,z-H/2,theta,h,width,2+rand()*1.7,1.45))for(const {v,t,s} of fan){
    p.push(...v);const tone=.86+t*.27-s*.019;
    rgb.push(tint.r*tone,tint.g*tone,tint.b*tone);
   }
  }
 }
 geometry.setAttribute('position',new T.Float32BufferAttribute(p,3));
 geometry.setAttribute('color',new T.Float32BufferAttribute(rgb,3));
 geometry.computeVertexNormals();
 const material=new T.MeshLambertMaterial({side:T.DoubleSide,vertexColors:true,emissive:'#687e3b',emissiveIntensity:.26});
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
export function makePondHorizon(T,weather,seed=(Math.random()*4294967296)>>>0){
 // Coordinates and cloud bodies vary on a fresh visit. The renderer
 // caches this image during the visit, so it never jumps during movement.
 const cloudRandom=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
 const signed=()=>cloudRandom()*2-1;
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
 // Paint a soft density field with directional light. Coarse folds form
 // the body; a separate fine turbulence breaks up the edge and washes it
 // into the sky. This is baked once into the weather texture, never per frame.
 const wisps=[[-.84,.12,.35,.21],[-.52,.02,.41,.31],[-.23,-.18,.40,.39],
  [.07,-.19,.42,.36],[.34,-.09,.35,.32],[.62,.03,.40,.26],[.86,.11,.26,.19]];
 const sunnyPuffs=[[-.83,.19,.34,.23],[-.58,.04,.39,.38],[-.36,-.12,.35,.47],[-.13,-.29,.37,.47],
  [.16,-.49,.39,.54],[.43,-.26,.43,.45],[.68,-.03,.42,.31],[.87,.14,.26,.20]];
 const banks=[[-.86,.12,.37,.33],[-.59,-.07,.38,.43],[-.30,-.28,.42,.55],
  [.02,-.40,.43,.58],[.32,-.26,.43,.57],[.59,-.10,.36,.43],[.84,.07,.35,.34]];
 const trailing=[[-.96,.22,.28,.08],[-.73,.10,.32,.12],[-.45,.04,.39,.18],[-.19,-.07,.40,.27],[.10,-.18,.37,.39],[.24,-.04,.32,.24],[.52,.06,.25,.15],[.79,.05,.16,.10]];
 const towers=[[-.76,.19,.34,.24],[-.54,.10,.36,.36],[-.35,-.19,.28,.55],[-.08,-.38,.36,.57],[.21,-.26,.33,.44],[.44,.09,.41,.30],[.72,.16,.27,.24]];
 const broken=[[-.83,-.01,.30,.14],[-.62,-.16,.31,.23],[-.43,-.24,.26,.18],[.05,.04,.32,.24],[.28,.08,.25,.25],[.52,.02,.19,.16],[.86,-.18,.24,.12]];
 const shelf=[[-.98,.13,.38,.22],[-.71,.01,.45,.28],[-.46,-.09,.48,.36],[-.12,-.12,.40,.49],[.19,-.11,.42,.49],[.45,-.08,.43,.30],[.69,.06,.40,.29],[.95,.16,.25,.20]];
 const rainCurtain=[[-.93,-.14,.35,.28],[-.60,-.2,.52,.44],[-.27,-.34,.42,.32],[-.05,-.23,.31,.31],[.33,-.20,.40,.40],[.62,-.19,.46,.31],[.9,.02,.28,.20]];
 const clamp01=x=>Math.max(0,Math.min(1,x));
 const fade=x=>{const t=clamp01(x);return t*t*(3-2*t);};
 function byteColor(h){return [1,3,5,7].map((i,k)=>h.length>i?parseInt(h.slice(i,i+2),16):k===3?255:0);}
 function cloud(x,y,w,h,shape,core,mid,edge){
  const thick=shape===banks||shape===shelf||shape===rainCurtain;
  x+=signed()*(thick?113:89);y+=signed()*(thick?23:31);
  w*=.73+cloudRandom()*.55;h*=.72+cloudRandom()*.59;
  // A sunlit gap leaves the sun itself legible even on a crowded roll.
  if(!rain&&!breeze&&Math.abs(x-728)<198&&Math.abs(y-88)<53)
   x=x<728?Math.min(x,728-111-w*.55):Math.max(x,728+107+w*.48);
  const width=Math.max(48,Math.min(202,Math.round(w*.94)));
  const height=Math.max(18,Math.min(73,Math.round(h*.88)));
  const layer=document.createElement('canvas');layer.width=width;layer.height=height;
  const ctx=layer.getContext('2d'),pixels=ctx.createImageData(width,height);
  const a=byteColor(core),b=byteColor(mid),c=byteColor(edge),salt=(x*.024+y*.046);
  const heavy=shape===banks||shape===shelf||shape===rainCurtain;
  const fields=shape.map(([xx,yy,rx,ry],k)=>{
   const wobble=Math.sin(salt+k*2.41)*.055;
   return [xx+wobble+signed()*.18,yy+wobble*.64+signed()*.17,
    1/(rx*(.71+cloudRandom()*.57)),1/(ry*(.67+cloudRandom()*.67))];
  });
  for(let j=0;j<height;j++)for(let i=0;i<width;i++){
   const u=(i+.5)/width*2.50-1.25,v=(j+.5)/height*2.48-1.24;
   let body=0,mix=0;
   for(let k=0;k<fields.length;k++){
    const f=fields[k],du=(u-f[0])*f[2],dv=(v-f[1])*f[3];
    const q=Math.max(0,1-du*du-dv*dv);
    body=Math.max(q,body);mix+=q;
   }
   const curl=.10*Math.sin(u*18+v*23+salt)+.07*Math.sin(v*36-u*33+salt*1.7)
             +.043*Math.sin(u*64+Math.sin(v*28+salt)*1.6)+.025*Math.sin(v*107-u*113+salt*2.3);
   const coherence=.09*Math.sin(u*8+Math.sin(v*8)*1.7+salt)+.04*Math.cos(u*13-v*18+salt);
   const density=body*.76+Math.min(.37,mix*.20)+curl+coherence;
   const outline=fade((density-(heavy?.075:.11))/ (heavy?.42:.49));
   if(outline===0)continue;
   const opacity=heavy?.90:.81;
   const depth=clamp01(body*.56+mix*.18);
   const lit=clamp01(.60-v*.52+curl*.66+coherence*.32);
   const bodyMix=clamp01(.35+depth*.45-lit*.34);
   const rim=lit*lit*.25+(1-outline)*.17;
   const p=(j*width+i)*4;
   for(let k=0;k<3;k++){
    const mass=b[k]+(a[k]-b[k])*bodyMix;
    pixels.data[p+k]=mass+(c[k]-mass)*rim+(lit-.43)*(heavy?20:13);
   }
   pixels.data[p+3]=outline*opacity*(.57+depth*.43)*Math.max(a[3],b[3]);
  }
  ctx.putImageData(pixels,0,0);
  g.drawImage(layer,x-w*1.25,y-h*1.24,w*2.50,h*2.48);
 }
 if(breeze){
  // No sharp sun disk; long feathered veils streak in one direction.
  // This remains a dry sky, visibly different from the low rain banks.
  glow(690,65,300,154,[[0,'#fff5deaa'],[.35,'#fff4dd49'],[1,'#fff5dd00']]);
  g.save();g.translate(479,104);g.rotate(-.115);g.translate(-479,-104);
  cloud(132,41,207,19,broken,'#f4f4efdf','#fbfaf5ac','#f6f7f100');
  cloud(342,79,345,22,trailing,'#eeeae0c8','#fffaeea9','#f4f3e900');
  cloud(678,128,267,25,wisps,'#fff7e6d4','#fffcf0bd','#f4f3e900');
  cloud(928,52,158,24,broken,'#eff5f6c0','#f4f7f4a4','#e7eef500');
  g.restore();
 }else if(!rain){
  glow(728,88,172,112,[[0,'#fff5c8bc'],[.26,'#fff2cb72'],[1,'#fff1ca00']]);
  glow(728,88,52,48,[[0,'#fff6baff'],[.38,'#fff3c38f'],[1,'#fff2c300']]);
  const disc=g.createLinearGradient(720,73,735,103);
  disc.addColorStop(0,'#fffad6');disc.addColorStop(1,'#ffdf94');
  g.fillStyle=disc;g.beginPath();g.arc(728,88,15.6,0,Math.PI*2);g.fill();
  cloud(117,104,228,26,trailing,'#fff7dfdc','#f8f2d99c','#f7fbf000');
  cloud(227,131,141,11,broken,'#f9ebd59b','#f9f8e67a','#f8f8ec00');
  cloud(443,62,130,40,towers,'#bac7d1bd','#fff9ebea','#f5ece28a');
  cloud(900,117,105,32,sunnyPuffs,'#c4c9c9ad','#fff6e8da','#f1ede377');
  cloud(860,144,128,12,trailing,'#fff5dcad','#fcf5e483','#f5f6e900');
  cloud(562,143,92,13,broken,'#fffbeb9c','#fffbef67','#ffffff00');
 }else{
  glow(648,133,281,133,[[0,'#fff0d2c8'],[.32,'#efe2d08e'],[1,'#d7cbbb00']]);
  cloud(253,36,393,100,rainCurtain,'#62758ecf','#768ba1bf','#9eacb800');
  cloud(531,74,299,68,shelf,'#77869ecf','#a3aebfa6','#a5b1c200');
  cloud(857,57,298,108,banks,'#596c86cd','#8e9bb291','#9ba7bc00');
  cloud(74,98,238,55,shelf,'#70849ab9','#a9b4c191','#a9b4c100');
  cloud(324,115,236,40,trailing,'#98a6b7d1','#c1c9ca85','#bdc5c800');
  cloud(894,117,181,44,rainCurtain,'#8494a9c5','#adb6c09a','#c5ccd000');
  cloud(625,151,254,20,broken,'#d5c8c6a5','#f0e0cf79','#e0cdc600');
  cloud(368,169,181,10,trailing,'#d0cbcc99','#e1d9d48d','#e0d9d200');
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
