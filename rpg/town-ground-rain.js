// Seeded basins and damp patches in world coordinates. Weather changes the
// amount, but never rerolls their positions while the player is looking.
export const BASINS=Object.freeze([
 [194,340,10,4, .51],[365,349,13,4,.57],[468,443,10,5,.62],[732,349,9,3,.60],
 [323,390,12,5,.55],[561,409,14,6,.63],[714,455,10,6,.69],[810,331,11,4,.67],[913,398,10,4,.64]
].map(Object.freeze));
const DAMP=[[140,293,26,13],[211,278,33,17],[317,390,44,26],[392,394,34,20],[555,412,46,24],
 [652,404,30,19],[724,453,44,18],[813,337,37,23],[892,392,43,24],[898,307,32,19],[352,439,26,20]];
const TAU=Math.PI*2;
export function rainCoverage(amount,dt,weather){
 const target=weather==='rain'?1:0, rate=target?.105:.033;
 return amount+(target-amount)*(1-Math.exp(-Math.min(1,Math.max(0,dt))*rate));
}
export function makeGroundRain(T,scene,W,H,outline,bed,roadY,local){
 const trace=(ctx,points)=>{points.forEach(([x,z],i)=>i?ctx.lineTo(x,z):ctx.moveTo(x,z));ctx.closePath();};
 const layers=[];
 function layer(y,road){
  const canvas=document.createElement('canvas'); canvas.width=Math.ceil(W/2);canvas.height=Math.ceil(H/2);
  const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;texture.generateMipmaps=false;texture.minFilter=T.LinearFilter;
  const material=new T.MeshBasicMaterial({map:texture,transparent:true,depthWrite:false,opacity:0});
  const sheet=new T.Mesh(new T.PlaneGeometry(W,H),material);
  sheet.rotation.x=-Math.PI/2;sheet.position.y=y;sheet.visible=false;sheet.renderOrder=road?4:1;scene.add(sheet);
  layers.push(sheet);
  const ctx=canvas.getContext('2d');ctx.scale(canvas.width/W,canvas.height/H);
  ctx.beginPath();
  if(!road){ctx.rect(0,0,W,H);trace(ctx,bed);}
  trace(ctx,outline);ctx.clip(road?'nonzero':'evenodd');
  return ctx;
 }
 const earth=layer(1.39,false),trail=layer(roadY,true);
 // A single thin tint reaches the exact outline shared with the dry road.
 // Existing drop-driven darker patches remain overlaid on the damp base.
 trail.fillStyle='rgba(84,65,52,.09)';trail.fillRect(0,0,W,H);
 function damp(ctx,x,z,w,h,alpha){
  ctx.save();ctx.translate(x,z);ctx.scale(w,h);
  const gradient=ctx.createRadialGradient(0,0,.12,0,0,1);
  gradient.addColorStop(0,`rgba(48,65,43,${alpha})`);
  gradient.addColorStop(.56,`rgba(52,68,43,${alpha*.57})`);
  gradient.addColorStop(1,'rgba(53,73,49,0)');
  ctx.fillStyle=gradient;ctx.fillRect(-1,-1,2,2);ctx.restore();
 }
 const rand=(i)=>((Math.imul(i+4729,1664525)+1013904223)>>>0)/4294967296;
 DAMP.forEach(([x,z,w,h],i)=>{
  damp(earth,x,z,w,h,.19+rand(i*297)*.1);
  damp(earth,x+(rand(i*641)-.5)*w,z+(rand(i*997)-.5)*h,w*.64,h*.77,.1);
 });
 const coord=[],alpha=[],color=[],pivot=[],parameters=[],uv=[];
 BASINS.forEach(([x,z,w,h,threshold],i)=>{
  const road=i<4,y=road?roadY+.035:1.43,[u,v]=local(x,z);
  const p=[[0,0]],center=new T.Color(road?'#c5c5b1':'#bbcbc0'),edge=new T.Color(road?'#716755':'#526550');
  for(let j=0;j<17;j++){
   const a=j/17*TAU,k=.80+rand(i*167+j*171)*.21+.065*Math.sin(j*1.8+i);
   p.push([Math.cos(a)*w*k,Math.sin(a)*h*k]);
  }
  for(let j=1;j<p.length;j++){
   for(const [a,b] of [p[0],p[j],p[j===p.length-1?1:j+1]]){
    coord.push(u+a,y,v+b);pivot.push(u,y,v);parameters.push(threshold,i,i%2===0?1:0);uv.push(a/w,b/h);
    const inner=a===0&&b===0,q=inner?center:edge;color.push(q.r,q.g,q.b);alpha.push(inner?1:0);
   }
  }
  if(!road)damp(earth,x,z,w*1.64,h*2,.21);
 });
 const geo=new T.BufferGeometry();
 for(const [name,array,dim] of [['position',coord,3],['color',color,3],['pivot',pivot,3],['basinData',parameters,3],['basinUv',uv,2],['edgeAlpha',alpha,1]])
  geo.setAttribute(name,new T.Float32BufferAttribute(array,dim));
 const mat=new T.MeshBasicMaterial({transparent:true,depthWrite:false,vertexColors:true,side:T.DoubleSide});
 const water={value:0},time={value:0},animation={value:0};
 mat.onBeforeCompile=s=>{
  Object.assign(s.uniforms,{groundWater:water,groundTime:time,groundAnimation:animation});
  s.vertexShader=`uniform float groundWater;
attribute float edgeAlpha; attribute vec2 basinUv; attribute vec3 pivot,basinData;
varying float shoreline, fillAmount; varying vec2 puddleXY, rippleData;
`+s.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
fillAmount=clamp((groundWater-basinData.x)/(1.-basinData.x),0.,1.);
transformed=pivot+(position-pivot)*(.52+.48*fillAmount);
shoreline=edgeAlpha; puddleXY=basinUv; rippleData=basinData.yz;
`);
  s.fragmentShader=`uniform float groundTime,groundAnimation;
varying float shoreline,fillAmount; varying vec2 puddleXY,rippleData;
`+s.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
float t=fract((groundTime+rippleData.x*.541)/1.65);
float d=length((puddleXY-vec2(.15,.10))*vec2(1.,.70));
float line=1.-smoothstep(.018,.044,abs(d-(.075+.46*t)));
float ring=line*rippleData.y*groundAnimation*max(0.,sin(3.14159*min(1.,t/.75)));
diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.74,.84,.77),ring*.43);
diffuseColor.a*=fillAmount*.54*smoothstep(0.,.36,shoreline);
`);
 };
 mat.customProgramCacheKey=()=>'ground-rain-basin-batch-v1';
 const puddles=new T.Mesh(geo,mat);puddles.visible=false;puddles.renderOrder=8;scene.add(puddles);
 for(const {material} of layers)material.map.needsUpdate=true;
 let wet=0,last=null,wasDry=true;
 return (clock,weather,motion)=>{
  const dt=last===null?0:(clock-last)*.001;last=clock;
  wet=rainCoverage(wet,dt,weather);
  let dry=wet<.006;if(dry&&wasDry)return wet;wasDry=dry;
  for(const mesh of layers){mesh.visible=!dry;mesh.material.opacity=wet;}
  puddles.visible=wet>.51;water.value=wet;
  time.value=(clock%60000)*.001;animation.value=motion&&weather==='rain'?1:0;
  return wet;
 };
}
