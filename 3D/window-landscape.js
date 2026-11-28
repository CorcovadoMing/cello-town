// Independent world geometry over a static painted far landscape. Time in seconds.
export function createWindowLandscape(T, backdrop) {
 const rainTone={value:0};
 const group=new T.Group();group.name='living-window-landscape';const plants=[],clouds=[];let seed=771;const rand=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 if(backdrop){
  backdrop.material.onBeforeCompile=shader=>{
   shader.uniforms.windowRainTone=rainTone;
   shader.fragmentShader='uniform float windowRainTone;\n'+shader.fragmentShader;
   shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>',`
   #ifdef USE_MAP
    vec4 land=texture2D(map,vMapUv);
    // Keep the mountain ridge, tree foliage, path and all ground texels stationary.
    float skyMask=smoothstep(.655,.705,vMapUv.y);
    // Preserve only the actual right-side tree silhouette, not neutral cloud edges.
    // Land texture is already decoded to linear RGB by Three.js texture sampling.
    float treeRegion=smoothstep(.69,.75,vMapUv.x)*(1.-smoothstep(.755,.795,vMapUv.y));
    float leafChroma=smoothstep(.035,.095,land.g-land.b);
    float yellowGreen=smoothstep(-.065,-.015,land.g-land.r);
    float foliage=treeRegion*leafChroma*yellowGreen;
    skyMask*=1.-foliage;
    float height=smoothstep(.66,1.,vMapUv.y);
    vec3 clearSky=mix(vec3(.73,.82,.73),vec3(.20,.50,.65),pow(height,.60));
    float sunward=exp(-1.8*distance(vMapUv,vec2(.15,.82)));
    clearSky+=sunward*vec3(.071,.043,.006)*(1.-windowRainTone);
    clearSky=mix(clearSky,vec3(.53,.62,.68),windowRainTone*.72);
    // Pale aerial perspective at the far ridge only; anchor the stream/path
    // and the original right-hand tree in a deeper, nearer layer.
    float ridge=smoothstep(.43,.57,vMapUv.y)*(1.-smoothstep(.626,.708,vMapUv.y))*(1.-foliage);
    vec3 meadow=mix(land.rgb,vec3(.57,.71,.66),ridge*.24);
    diffuseColor*=vec4(mix(meadow,clearSky,skyMask),land.a);
   #endif`);
  };
  backdrop.material.customProgramCacheKey=()=> 'static-landscape-haze-v9';backdrop.material.needsUpdate=true;
 }
 const mats=['#627b44','#879e62','#a4af77','#c0c894'].map(color=>new T.MeshBasicMaterial({color,side:T.DoubleSide}));const petalMats=['#f5e7b7','#e8b960','#ca9eaa'].map(color=>new T.MeshBasicMaterial({color,side:T.DoubleSide}));const pollen=new T.MeshBasicMaterial({color:'#b98832',side:T.DoubleSide});const seedmat=new T.MeshBasicMaterial({color:'#d5c07b',side:T.DoubleSide});
 function blade(h,w,bend,mat){const p=[],ix=[];for(let k=0;k<7;k++){const t=k/6,xx=bend*t*t,ww=w*(1-t)*(.45+.55*Math.sin(Math.PI*t));p.push(xx-ww,h*t,0,xx+ww,h*t,0);if(k<6)ix.push(2*k,2*k+1,2*k+3,2*k,2*k+3,2*k+2);}const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setIndex(ix);return new T.Mesh(g,mat);}
 for(let i=0;i<69;i++){
  const u=.025+rand()*.95,v=.005+rand()*.25,path=.47-.47*u;if(Math.abs(v-path)<.06)continue;
  const root=new T.Group();root.position.set((u-.5)*1.52,.1+v*1.59,.063+rand()*.003);group.add(root);const h=(.05+rand()*.055)*1.59;
  plants.push({root,phase:rand()*6.283,speed:.9+rand()*.7,amp:.055+rand()*.09});
  for(let j=0;j<3;j++){const b=blade(h*(.45+rand()*.55),(.0015+rand()*.0015)*1.52,(rand()-.5)*.07,mats[Math.floor(rand()*mats.length)]);b.position.x=(rand()-.5)*.015;root.add(b);}
  if(i%3===0){const stem=blade(h*.85,.001,.008,mats[0]);root.add(stem);const flower=new T.Group();flower.rotation.z=(rand()-.5)*.7;flower.position.set(.008,h*.85,.0015);root.add(flower);const mat=petalMats[Math.floor(rand()*3)],rr=.009;
   for(let j=0;j<7;j++){const th=j*Math.PI*2/7,p=new T.Mesh(new T.CircleGeometry(rr,7),mat);p.scale.set(.52,1,1);p.rotation.z=th;p.position.set(-Math.sin(th)*rr*.70,Math.cos(th)*rr*.70,0);flower.add(p);}
   const c=new T.Mesh(new T.CircleGeometry(rr*.38,8),pollen);c.position.z=.0008;flower.add(c);
  }else if(i%2===0){for(let k=0;k<5;k++){const b=blade(h*.15,.0028,.012,seedmat);b.position.set(.007*k/5,h*(.65+.065*k),.001);b.rotation.z=-.42;root.add(b);}}
 }
 const cloudMat=new T.ShaderMaterial({transparent:true,depthWrite:false,side:T.DoubleSide,uniforms:{opacity:{value:.6}},vertexShader:'varying vec2 q;void main(){q=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'varying vec2 q;uniform float opacity;void main(){vec2 p=(q-.5)*2.;float a=pow(max(0.,1.-dot(p,p)),1.8)*opacity;gl_FragColor=vec4(vec3(.98,.96,.85),a);}' });
 for(let i=0;i<3;i++){const root=new T.Group();root.position.set([-.27,.07,.30][i],[1.32,1.50,1.22][i],.058);group.add(root);const base=root.position.x;clouds.push({root,base,speed:.011+i*.002,material:cloudMat.clone()});const cm=clouds.at(-1).material;
  for(let k=0;k<6;k++){const m=new T.Mesh(new T.PlaneGeometry(.15+rand()*.09,.026+rand()*.035),cm);m.position.set((k-2.5)*.041,(rand()-.5)*.024,k*.00008);root.add(m);}
 }
 group.traverse(o=>{o.raycast=()=>{};if(o.isMesh)o.renderOrder=6.7;});
 function tick(seconds,reduced=false){const t=reduced?0:Math.max(0,seconds);for(const p of plants)p.root.rotation.z=p.amp*Math.sin(t*p.speed+p.phase);for(const c of clouds){const span=.72;c.root.position.x=((c.base+t*c.speed+span/2)%span+span)%span-span/2;const ymax=c.root.position.y+.055;const edge=Math.sqrt(Math.max(0,.76*.76-(Math.max(0,ymax-.93))**2))-.22;const fade=Math.max(0,Math.min(1,(edge-Math.abs(c.root.position.x))/.10));c.material.uniforms.opacity.value=(.62-rainTone.value*.34)*fade;}}
 tick(0);return{group,tick,plants,clouds,setRain(rain){rainTone.value=rain?1:0;},dispose(){group.traverse(o=>{if(o.isMesh){o.geometry.dispose();}});[...mats,...petalMats,pollen,seedmat,cloudMat,...clouds.map(c=>c.material)].forEach(m=>m.dispose());}};
}

// Quiet motes in the volume just inside the actual window (one draw call).
// Soft circles, physically scoped by a fading cone; no synthetic light strip.
export function createWindowMotes(T){
 const N=43,pos=[],seeds=[];let state=4751;
 const rand=()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/4294967296;};
 for(let i=0;i<N;i++){
  const z=rand(),a=rand()*Math.PI*2,r=Math.sqrt(rand())*(.28+z*.39);
  pos.push(-1.25+.48*z+Math.cos(a)*r,2.0-.83*z+Math.sin(a)*r*.69,-1.96+z*1.93);
  seeds.push(rand(),rand(),rand());
 }
 const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(pos,3));geo.setAttribute('mote',new T.Float32BufferAttribute(seeds,3));
 const mat=new T.ShaderMaterial({transparent:true,depthWrite:false,uniforms:{time:{value:0},density:{value:1},dpi:{value:1}},
  vertexShader:`attribute vec3 mote;uniform float time;uniform float dpi;uniform float density;varying float veil;
  void main(){
   float w=time*(.09+.05*mote.z)+mote.x*6.283;
   vec3 p=position+vec3(sin(w)*.085,cos(w*.91+mote.y*4.)*.115,sin(w*.74)*.072);
   veil=(.50+.27*sin(w*.61+mote.z*4.))*density*(.72+.28*mote.y);
   gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);gl_PointSize=dpi*(1.1+mote.y*1.75);
  }`,
  fragmentShader:`varying float veil;void main(){
   vec2 xy=(gl_PointCoord-.5)*2.;float soft=pow(max(0.,1.-dot(xy,xy)),2.4);
   gl_FragColor=vec4(.98,.92,.71,soft*veil*.33);
   #include <colorspace_fragment>
  }`});
 let wet=false;
 const points=new T.Points(geo,mat);points.name='window-light-motes';points.raycast=()=>{};points.renderOrder=14;
 return {points,setRain(rain){wet=rain;},tick(seconds,reduced=false,pixelRatio=1){
  mat.uniforms.time.value=reduced?0:Math.max(0,seconds);
  mat.uniforms.density.value=(reduced?.55:1)*(wet?.19:1);
  mat.uniforms.dpi.value=Math.min(2,Math.max(1,pixelRatio));
 },dispose(){geo.dispose();mat.dispose();}};
}

// Same arch geometry as the glass, so no weather can spill into the room.
export function createWindowRain(T,apertureMesh){
 const geo=apertureMesh.geometry.clone(),uniforms={time:{value:0}};
 const mat=new T.ShaderMaterial({transparent:true,depthWrite:false,uniforms,
  vertexShader:`varying vec2 glass;void main(){glass=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
  fragmentShader:`uniform float time;varying vec2 glass;
  float hash(float x){return fract(sin(x*115.71)*41758.73);}
  void main(){
   float x=glass.x-glass.y*.12;
   float lane=floor(x*35.),offset=hash(lane+.5);
   float across=abs(fract(x*35.)-(.15+.70*offset));
   float fall=fract(glass.y*1.36+time*(.38+.20*offset)+hash(lane+15.));
   float drop=(1.-smoothstep(.017,.046,across))*smoothstep(.73,.93,fall)*(1.-smoothstep(.93,1.,fall));
   float strength=drop*(.15+.20*hash(lane+63.));
   gl_FragColor=vec4(.86,.94,1.,strength);
   #include <colorspace_fragment>
  }`});
 const glassRain=new T.Mesh(geo,mat);
 glassRain.name='window-rain-film';glassRain.position.z=.077;glassRain.renderOrder=7;glassRain.visible=false;glassRain.raycast=()=>{};
 return {glassRain,setRain(rain){glassRain.visible=rain;},tick(seconds,reduced=false){
  if(glassRain.visible)uniforms.time.value=reduced?0:Math.max(0,seconds);
 },dispose(){geo.dispose();mat.dispose();}};
}
