const TAU=Math.PI*2;
export const WATCH_VIEWS=Object.freeze(['play','pond']);
export const POND_SHOT=Object.freeze({
 eye:[96,62,536], target:[325,29,288], fov:48
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
export function makePondHorizon(T,rain){
 const c=document.createElement('canvas');c.width=960;c.height=560;
 const g=c.getContext('2d');
 const gradient=g.createLinearGradient(0,0,0,320);
 for(const [x,color] of (rain?[[0,'#aebdc2'],[.58,'#d1d9d3'],[1,'#eee6d3']]:[[0,'#b8d2ce'],[.52,'#d6e2d6'],[1,'#f4e9cd']]))gradient.addColorStop(x,color);
 g.fillStyle=gradient;g.fillRect(0,0,960,560);
 for(const [x,y,w,h] of [[65,114,204,29],[315,49,174,32],[643,109,222,35],[877,77,176,30]]){
  g.save();g.translate(x,y);g.scale(w,h);
  const mist=g.createRadialGradient(-.13,.1,.04,0,0,1);
  mist.addColorStop(0,rain?'#e7eae867':'#fffcdf9c');mist.addColorStop(1,'#faf5df00');
  g.fillStyle=mist;g.fillRect(-1,-1,2,2);g.restore();
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
