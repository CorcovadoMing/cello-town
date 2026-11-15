import * as T from './vendor/three.module.js';
import {KEY,OPTIONS,defaults,normalize,update,move,stepToward} from './state.js?v=4';
const $=id=>document.getElementById(id),area=$('scene'),status=$('save-status');let state=defaults();try{state=normalize(JSON.parse(localStorage.getItem(KEY)));}catch{status.textContent='無法讀取本機設定，仍可自由試穿。';}
const labels={faceShape:'臉型',face:'神情',hair:'髮型',skin:'膚色',hairColor:'髮色',outfit:'衣服',color:'衣服顏色',hat:'頭飾',accessory:'小配件'},colorNames={skin:['奶油蜜桃','溫暖杏色','焦糖棕','可可棕'],hairColor:['栗子棕','蜂蜜金','午夜黑','紅茶棕'],color:['森林綠','珊瑚粉','丁香紫','暖陽黃']};
function persist(){try{localStorage.setItem(KEY,JSON.stringify(state));status.textContent='穿搭已自動保存在這個瀏覽器。';}catch{status.textContent='這次穿搭尚未儲存；瀏覽器不允許本機儲存。';}}
const categories=[['faceShape','skin'],['face'],['hair','hairColor'],['outfit','color'],['hat'],['accessory']];
let activeCategory=0,previewMode=null,previewYaw=0,roomSnapshot=null;
const visibleCategories=()=>previewMode==='wardrobe'?[3,4,5]:[0,1,2];
// Original flat silhouettes: only the room avatar uses the 3D renderer.
function choiceIcon(kind,index=0){
 const ink='#536859',skin=OPTIONS.skin[state.skin],hair=OPTIONS.hairColor[state.hairColor],cloth=OPTIONS.color[state.color];
 let art='';
 if(kind==='faceShape')art=`<ellipse cx="32" cy="32" rx="${[18,16,20][index]}" ry="${[21,24,19][index]}" fill="${skin}"/><circle cx="26" cy="30" r="1.6"/><circle cx="38" cy="30" r="1.6"/><path d="M28 39q4 3 8 0" fill="none"/>`;
 if(kind==='face')art=`<circle cx="32" cy="32" r="22" fill="${skin}"/>`+(index===2?'<path d="M20 29q5-5 10 0M35 29q5-5 10 0" fill="none"/>':`<ellipse cx="24" cy="29" rx="${index===1?3.8:2.8}" ry="${index===1?5:3.5}"/><ellipse cx="40" cy="29" rx="${index===1?3.8:2.8}" ry="${index===1?5:3.5}"/>`)+'<path d="M27 40q5 4 10 0" fill="none"/>';
 if(kind==='hair')art=(index===2?`<circle cx="14" cy="16" r="10" fill="${hair}"/><circle cx="50" cy="16" r="10" fill="${hair}"/>`:'')+`<path d="M12 34V25C12 2 52 2 52 25V${index===1?52:35}L${index===1?'45 55 40 37':'44 34'}H20L12 ${index===1?52:34}Z" fill="${hair}"/><ellipse cx="32" cy="34" rx="14" ry="18" fill="${skin}"/><path d="M16 27q2-22 16-18q16-2 17 18l-9-7-7 7-7-7-10 7" fill="${hair}"/>`;
 if(kind==='outfit')art=index===0?`<path d="M24 9h16l3 18 10 29H11l10-29Z" fill="${cloth}"/><path d="M25 9q7 14 14 0" fill="none"/>`:index===1?`<path d="M19 8h7v15h12V8h7v48H34V38h-4v18H19Z" fill="${cloth}"/><rect x="25" y="24" width="14" height="11" rx="2" fill="none"/>`:`<path d="m20 12 12 5 12-5 13 17-9 7-5-6v25H21V30l-5 6-9-7Z" fill="${cloth}"/><path d="M25 16q7 8 14 0M23 42h18M23 47h18" fill="none"/>`;
 if(kind==='outfit'&&index===3)art=`<path d="m22 10 10 5 10-5 9 42H13Z" fill="${cloth}"/><path d="m22 10 10 17 10-17M32 27v25M19 39h7m12 0h7" fill="none"/>`;
 if(kind==='hat')art=index===0?'<circle cx="32" cy="32" r="20" fill="none"/><path d="m18 46 28-28"/>':index===1?`<path d="M29 27 10 16v32l19-12m6-9 19-11v32L35 36" fill="${cloth}"/><circle cx="32" cy="32" r="7" fill="#f5d78b"/>`:`<ellipse cx="32" cy="34" rx="24" ry="14" fill="${cloth}"/><path d="m34 20 3-9M15 45h34" fill="none"/>`;
 if(kind==='accessory')art=index===0?'<circle cx="32" cy="32" r="20" fill="none"/><path d="m18 46 28-28"/>':index===1?'<circle cx="18" cy="32" r="11" fill="none"/><circle cx="46" cy="32" r="11" fill="none"/><path d="M29 31h6M7 29 3 25M57 29l4-4"/>':'<path d="M18 28V17q14-18 28 0v11" fill="none"/><rect x="12" y="27" width="40" height="29" rx="7" fill="#cda678"/><path d="M12 35q20 14 40 0" fill="none"/><circle cx="32" cy="42" r="2"/>';
 return `<svg aria-hidden="true" focusable="false" viewBox="0 0 64 64" fill="${ink}" stroke="${ink}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${art}</svg>`;
}
function controls(focusKey=null){
 const wrap=$('controls');wrap.replaceChildren();
 const tabs=document.createElement('div');tabs.className='category-tabs';tabs.setAttribute('role','tablist');tabs.setAttribute('aria-label','外觀分類');
 categories.forEach(([k],i)=>{if(!visibleCategories().includes(i))return;const tab=document.createElement('button');tab.type='button';tab.id='category-'+k;tab.className='category-tab';tab.dataset.category=k;tab.setAttribute('role','tab');tab.setAttribute('aria-label',labels[k]);tab.setAttribute('aria-selected',String(i===activeCategory));tab.setAttribute('aria-controls','appearance-options');tab.tabIndex=i===activeCategory?0:-1;tab.innerHTML=choiceIcon(k,k==='hat'||k==='accessory'?1:0);tab.onclick=()=>{activeCategory=i;controls('category:'+k);};tab.onkeydown=e=>{const ids=visibleCategories(),at=ids.indexOf(i);let next=i;if(e.key==='ArrowRight')next=ids[(at+1)%ids.length];else if(e.key==='ArrowLeft')next=ids[(at+ids.length-1)%ids.length];else if(e.key==='Home')next=ids[0];else if(e.key==='End')next=ids.at(-1);else return;e.preventDefault();activeCategory=next;controls('category:'+categories[next][0]);};tabs.append(tab);});wrap.append(tabs);
 const panel=document.createElement('div');panel.id='appearance-options';panel.className='appearance-options';panel.setAttribute('role','tabpanel');panel.setAttribute('aria-labelledby','category-'+categories[activeCategory][0]);
 for(const k of categories[activeCategory]){const box=document.createElement('fieldset');box.className='control';const legend=document.createElement('legend');legend.textContent=labels[k];box.append(legend);const row=document.createElement('div');row.className='choices'+(colorNames[k]?' swatches':' silhouettes');OPTIONS[k].forEach((v,i)=>{const b=document.createElement('button');b.type='button';b.setAttribute('aria-pressed',String(state[k]===i));b.setAttribute('aria-label',colorNames[k]?.[i]||v);if(colorNames[k])b.style.setProperty('--swatch',v);else b.innerHTML=choiceIcon(k,i);b.dataset.option=k+':'+i;b.onclick=()=>{state=update(state,k,i);persist();rebuild();controls(k+':'+i);$('scene-status').textContent='已換成'+(colorNames[k]?.[i]||v);};row.append(b);});box.append(row);panel.append(box);}wrap.append(panel);
 if(focusKey){const target=focusKey.startsWith('category:')?'[data-category="'+focusKey.slice(9)+'"]':'[data-option="'+focusKey+'"]';wrap.querySelector(target)?.focus({preventScroll:true});}
}
let renderer,software=false;try{renderer=new T.WebGLRenderer({antialias:true,alpha:true,powerPreference:'low-power'});}catch{const{SVGRenderer}=await import('./vendor/SVGRenderer.js');renderer=new SVGRenderer();renderer.setQuality('high');software=true;status.textContent='簡化 3D 模式（此瀏覽器未啟用 WebGL）；穿搭仍可儲存。';const note=document.createElement('span');note.className='render-mode sr-only';note.textContent='簡化 3D · SVG';area.append(note);}
if(!software){renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;renderer.outputColorSpace=T.SRGBColorSpace;renderer.setClearColor(0x000000,0);}area.append(renderer.domElement);$('loading').remove();renderer.domElement.setAttribute('aria-hidden','true');
const scene=new T.Scene(),camera=new T.OrthographicCamera(-4.5,4.5,4, -4,.1,60);camera.position.set(5.8,5.3,8.2);camera.lookAt(0,1,0);scene.add(new T.HemisphereLight(0xfff9df,0x9cbaaa,software?.65:2.4));const sun=new T.DirectionalLight(0xffefd0,software?.65:3.1);sun.position.set(-3,7,5);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);sun.shadow.camera.left=-5;sun.shadow.camera.right=5;sun.shadow.camera.top=5;sun.shadow.camera.bottom=-5;sun.shadow.bias=-.001;sun.shadow.normalBias=.02;scene.add(sun);scene.add(new T.AmbientLight(0xffffff,.25));
const mats=new Map();function mat(c,rough=.85){const key=c+':'+rough;if(!mats.has(key))mats.set(key,new T.MeshStandardMaterial({color:c,roughness:rough}));return mats.get(key);}
function mesh(geo,color,x,y,z,parent=scene){const o=new T.Mesh(geo,mat(color));o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;}
function ball(x,y,z,sx,sy,sz,c,p=scene){const o=mesh(new T.SphereGeometry(1,24,16),c,x,y,z,p);o.scale.set(sx,sy,sz);return o;}
function box(x,y,z,w,h,d,c,p=scene){return mesh(new T.BoxGeometry(w,h,d,Math.max(1,Math.ceil(w*4)),Math.max(1,Math.ceil(h*4)),Math.max(1,Math.ceil(d*4))),c,x,y,z,p);}
function cylinder(x,y,z,rt,rb,h,c,p=scene){return mesh(new T.CylinderGeometry(rt,rb,h,24),c,x,y,z,p);}
function rod(a,b,r,c,p=scene){const v=new T.Vector3(...b).sub(new T.Vector3(...a));const o=mesh(new T.CylinderGeometry(r,r,v.length(),12),c,...a,p);o.position.addScaledVector(v,.5);o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),v.normalize());return o;}
function ring(x,y,z,r,t,c,p=scene){return mesh(new T.TorusGeometry(r,t,8,24),c,x,y,z,p);}
// Open, sunny miniature set. No imported textures or external asset requests.
box(0,-.16,0,6.2,.3,4.9,'#c9b48e');box(0,-.015,0,6.1,.06,4.8,'#e5d2af');for(let i=-5;i<=5;i++)box(i*.55,.018,0,.012,.004,4.7,'#d2bb96');for(let j=0;j<8;j++)box((j%3-1)*1.1,.022,-2.2+j*.6,1.08,.004,.012,'#d8c19d');
const rearWall=box(0,1.5,-2.35,6.2,3.1,.13,'#c4d1b2');if(software)rearWall.renderOrder=-20;box(-3.05,.72,0,.12,1.55,4.7,'#d7ddc2');box(0,.12,-2.24,6,.24,.1,'#e7e5cb');box(-2.96,.12,0,.1,.24,4.6,'#e7e5cb');
// Window: one local coordinate system and a shared arched aperture.
const windowGroup=new T.Group();windowGroup.position.set(-.35,1.1,-2.12);scene.add(windowGroup);
const WINDOW_APERTURE={half:.76,spring:.93,outerHalf:.87,sill:.025};
function windowProfile(half,bottom){const p=new T.Shape();p.moveTo(-half,bottom);p.lineTo(half,bottom);p.lineTo(half,WINDOW_APERTURE.spring);p.absarc(0,WINDOW_APERTURE.spring,half,0,Math.PI,false);p.lineTo(-half,bottom);p.closePath();return p;}
const windowOuter=windowProfile(WINDOW_APERTURE.outerHalf,0),windowAperture=windowProfile(WINDOW_APERTURE.half,.1);
const apertureHole=new T.Path();apertureHole.moveTo(-.76,.1);apertureHole.lineTo(-.76,.93);apertureHole.absarc(0,.93,.76,Math.PI,0,true);apertureHole.lineTo(.76,.1);apertureHole.closePath();windowOuter.holes.push(apertureHole);
const windowFrame=mesh(new T.ExtrudeGeometry(windowOuter,{depth:.08,bevelEnabled:false,curveSegments:32}),'#f4edcf',0,0,.04,windowGroup);
windowFrame.name='window-continuous-frame';windowFrame.renderOrder=7;
function windowLayer(shape,color,z,name){const o=new T.Mesh(new T.ShapeGeometry(shape,32),new T.MeshBasicMaterial({color,side:T.DoubleSide}));o.position.z=z;o.renderOrder=1+z*100;o.name=name;windowGroup.add(o);return o;}
windowLayer(windowAperture,'#a5cfca',0,'window-sky');
const windowSun=new T.Shape();windowSun.absarc(-.3,1.17,.16,0,Math.PI*2);windowLayer(windowSun,'#fff1bd',.012,'window-sun');
// Both low hills remain wholly within the straight-sided bottom aperture.
const farHill=new T.Shape();farHill.moveTo(-.76,.1);farHill.lineTo(.76,.1);farHill.lineTo(.76,.44);farHill.bezierCurveTo(.4,.65,.18,.43,-.05,.49);farHill.bezierCurveTo(-.32,.62,-.55,.4,-.76,.46);farHill.closePath();windowLayer(farHill,'#91b8a3',.02,'window-far-hill');
const nearHill=new T.Shape();nearHill.moveTo(-.76,.1);nearHill.lineTo(.76,.1);nearHill.lineTo(.76,.25);nearHill.bezierCurveTo(.4,.39,.14,.23,-.08,.31);nearHill.bezierCurveTo(-.35,.42,-.55,.24,-.76,.3);nearHill.closePath();windowLayer(nearHill,'#7fa18c',.028,'window-near-hill');
const cloud=new T.Shape();cloud.moveTo(.06,1.08);cloud.bezierCurveTo(.01,1.12,.07,1.2,.13,1.18);cloud.bezierCurveTo(.16,1.29,.3,1.28,.32,1.19);cloud.bezierCurveTo(.42,1.21,.47,1.09,.38,1.07);cloud.lineTo(.06,1.08);cloud.closePath();windowLayer(cloud,'#edf4df',.036,'window-cloud');
// Mullions are in front of every scenery layer, joined inside the same arch.
box(0,.895,.085,.05,1.59,.045,'#f7eed7',windowGroup).renderOrder=8;
box(0,.88,.085,1.52,.05,.045,'#f7eed7',windowGroup).renderOrder=8;
box(0,.025,.13,1.94,.1,.36,'#e7d5b5',windowGroup).renderOrder=9;
const curtainTop=WINDOW_APERTURE.spring+WINDOW_APERTURE.outerHalf+.14,curtainBottom=WINDOW_APERTURE.sill+.07;
for(const side of [-1,1]){const drape=new T.Shape();drape.moveTo(side*.79,curtainTop-.045);drape.lineTo(side*1.12,curtainTop-.045);drape.lineTo(side*1.12,curtainBottom);drape.quadraticCurveTo(side*.92,curtainBottom-.035,side*.84,curtainBottom+.035);drape.bezierCurveTo(side*1.04,.62,side*.82,1.25,side*.79,curtainTop-.045);drape.closePath();const cloth=mesh(new T.ExtrudeGeometry(drape,{depth:.025,bevelEnabled:false,curveSegments:20}),'#e9ddc5',0,0,.17,windowGroup);cloth.renderOrder=10;for(let n=0;n<3;n++){const x=side*(.87+n*.08);rod([x,curtainTop-.06,.202],[x,curtainBottom+.03,.202],.012,'#f7edd8',windowGroup).renderOrder=10;}}
rod([-1.19,curtainTop,.19],[1.19,curtainTop,.19],.025,'#a9956c',windowGroup).renderOrder=11;
// SVG has no depth buffer: keep this backdrop below every foreground object.
if(typeof software!=='undefined'&&software)windowGroup.traverse(o=>{if(o.isMesh)o.renderOrder-=12;});
// Wardrobe and hanging cloth, little shelf.
const wardrobeStart=scene.children.length;
box(2.1,1.02,-1.85,1.25,2,.65,'#a6805f');box(2.1,1.04,-1.5,1.1,1.77,.035,'#c3a57d');box(2.1,1.04,-1.46,.025,1.78,.02,'#907054');for(const x of [1.98,2.23])ball(x,1.08,-1.41,.035,.035,.035,'#f4d99c');box(2.1,2.07,-1.85,1.4,.13,.77,'#b2956d');
scene.children.slice(wardrobeStart).forEach(o=>{o.userData.station='wardrobe';});
// A small vanity with a framed oval mirror, deliberately not a reflective render pass.
const vanity=new T.Group();vanity.position.set(-.85,0,-.85);vanity.scale.setScalar(.88);scene.add(vanity);
box(0,.78,0,1.05,.12,.5,'#bc9874',vanity);box(0,.68,0,.87,.16,.4,'#d4b590',vanity);
for(const x of [-.4,.4])for(const z of [-.16,.16])rod([x,.68,z],[x,.04,z],.035,'#a98160',vanity);
const mirrorBack=ball(0,1.4,-.17,.38,.49,.045,'#c7aa7a',vanity);const mirrorGlass=ball(0,1.4,-.115,.325,.43,.012,'#b7d2cc',vanity);mirrorGlass.receiveShadow=false;
rod([-.23,1.58,-.098],[-.08,1.77,-.098],.012,'#ecf4e7',vanity);cylinder(.31,.89,.05,.075,.065,.16,'#dbc5a4',vanity);
vanity.traverse(o=>{o.userData.station='vanity';});
// Rug center and stitched border.
const rug=mesh(new T.RingGeometry(0,1.6,48,8),'#c4c7a4',0,.045,.45);rug.rotation.x=-Math.PI/2;rug.scale.y=.72;const rugLine=ring(0,.065,.45,1.45,.018,'#ece8cb');rugLine.rotation.x=Math.PI/2;rugLine.scale.y=.72;
// Cello resting in left corner. Procedural detailed model 002.

// Original procedural miniature. No textures, random values, animation, or requests.
// Coordinates preserve the original corner prop: front +Z, endpin bottom -0.19.
function createCello() {
  const root = new T.Group(); root.name = 'DetailedCello';
  const parts = [], colors = {
    maple: '#c78952', ribs: '#a5653e', edge: '#e1b77d', line: '#79503a',
    ebony: '#493c30', metal: '#c7c4ad', ivory: '#e8d6ae', bow: '#98744f'
  };
  function add(geometry, color, name, x=0, y=0, z=0) {
    const part = new T.Mesh(geometry,null); part.position.set(x,y,z);
    parts.push({part,color,name}); return part;
  }
  function bar(name, a, b, radius, color, segments=6) {
    const v = new T.Vector3(...b).sub(new T.Vector3(...a));
    const part=add(new T.CylinderGeometry(radius,radius,v.length(),segments),color,name);
    part.position.copy(new T.Vector3(...a).addScaledVector(v,.5));
    part.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),v.normalize()); return part;
  }
  function block(name,x,y,z,w,h,d,color) {
    return add(new T.BoxGeometry(w,h,d),color,name,x,y,z);
  }
  function oval(name,x,y,z,rx,ry,rz,color) {
    const part=add(new T.SphereGeometry(1,10,6),color,name,x,y,z);
    part.scale.set(rx,ry,rz); return part;
  }
  function plate(shape, depth, color, name, z, bevel=false) {
    const g=new T.ExtrudeGeometry(shape,{depth,steps:1,curveSegments:7,
      bevelEnabled:bevel,bevelThickness:.006,bevelSize:.006,bevelSegments:1});
    // Small cap triangles retain the arched top and reliable painter sorting in SVG.
    const src=g.index?g.toNonIndexed():g, out=[], normals=[];
    function split(a,b,c,n,depth=0) {
      const d=[a.distanceToSquared(b),b.distanceToSquared(c),c.distanceToSquared(a)],j=d.indexOf(Math.max(...d));
      if(Math.abs(n.z)>.9 && d[j]>.0196 && depth<10) {
        const vs=[a,b,c],v=vs[j],w=vs[(j+1)%3],q=vs[(j+2)%3],m=v.clone().add(w).multiplyScalar(.5);
        split(v,m,q,n,depth+1);split(m,w,q,n,depth+1);return;
      }
      for(const v of [a,b,c]){out.push(v.x,v.y,v.z);normals.push(n.x,n.y,n.z);}
    }
    for(let i=0;i<src.attributes.position.count;i+=3){const ps=src.attributes.position;
      split(new T.Vector3().fromBufferAttribute(ps,i),new T.Vector3().fromBufferAttribute(ps,i+1),new T.Vector3().fromBufferAttribute(ps,i+2),new T.Vector3().fromBufferAttribute(src.attributes.normal,i));}
    const refined=new T.BufferGeometry();refined.setAttribute('position',new T.Float32BufferAttribute(out,3));
    refined.setAttribute('normal',new T.Float32BufferAttribute(normals,3));if(src!==g)src.dispose();g.dispose();
    return add(refined,color,name,0,0,z);
  }
  const outline=new T.Shape();
  outline.moveTo(0,1.225);
  // Rounded upper bouts, definite inward C-bouts, four small corners, broad lower bouts.
  outline.bezierCurveTo(.12,1.225,.225,1.145,.238,1.025);
  outline.bezierCurveTo(.244,.965,.204,.925,.187,.897);
  outline.lineTo(.214,.872);
  outline.bezierCurveTo(.133,.854,.130,.752,.212,.708);
  outline.lineTo(.192,.680);
  outline.bezierCurveTo(.270,.642,.312,.549,.307,.441);
  outline.bezierCurveTo(.300,.300,.173,.225,0,.222);
  outline.bezierCurveTo(-.173,.225,-.300,.300,-.307,.441);
  outline.bezierCurveTo(-.312,.549,-.270,.642,-.192,.680);
  outline.lineTo(-.212,.708);
  outline.bezierCurveTo(-.130,.752,-.133,.854,-.214,.872);
  outline.lineTo(-.187,.897);
  outline.bezierCurveTo(-.204,.925,-.244,.965,-.238,1.025);
  outline.bezierCurveTo(-.225,1.145,-.12,1.225,0,1.225);
  outline.closePath();
  plate(outline,.155,colors.ribs,'ribs-and-back',-.078,true);

  const archAt=(x,y)=>.026*Math.max(0,1-(x/.335)**2)*Math.max(0,1-((y-.724)/.53)**2);
  const front=outline.clone();
  // Real holes in the top plate; dark inset apertures sit behind them.
  const apertureShape=new T.Shape();
  apertureShape.moveTo(.006,.133);
  apertureShape.bezierCurveTo(.037,.151,.047,.115,.024,.089);
  apertureShape.bezierCurveTo(.007,.068,-.002,-.057,-.021,-.083);
  apertureShape.bezierCurveTo(-.048,-.110,-.031,-.144,-.008,-.128);
  apertureShape.bezierCurveTo(.006,-.117,-.007,-.097,-.015,-.100);
  apertureShape.bezierCurveTo(.016,-.074,.019,.057,.037,.083);
  apertureShape.bezierCurveTo(.061,.116,.041,.164,.009,.149);
  apertureShape.closePath();
  const aperturePoints=apertureShape.getPoints(7);
  for(const side of [-1,1]) {
    const points=aperturePoints.map(p=>new T.Vector2(side*(.110+p.x*.62),.770+p.y));
    if(T.ShapeUtils.isClockWise(points))points.reverse();
    const hole=new T.Path(points); hole.closePath(); front.holes.push(hole);
    const inset=new T.Shape(points); inset.closePath();
    const dark=new T.ShapeGeometry(inset,7),dp=dark.attributes.position;
    for(let i=0;i<dp.count;i++)dp.setZ(i,.121+archAt(dp.getX(i),dp.getY(i)));
    dark.computeVertexNormals();add(dark,colors.ebony,`f-hole-interior-${side}`);
    // The tiny transverse notches distinguish an f-hole from a generic slot.
    block(`f-notch-${side}`,side*.116,.770,.153,.025,.009,.003,colors.ebony);
  }
  const top=plate(front,.021,colors.maple,'arched-top-with-two-f-holes',.102,false);
  const positions=top.geometry.attributes.position;
  for(let i=0;i<positions.count;i++) {
    const x=positions.getX(i),y=positions.getY(i);
    const arch=archAt(x,y);
    positions.setZ(i,positions.getZ(i)+arch);
  }
  top.geometry.computeVertexNormals();
  // Continuous light edge and dark purfling, both kept on the plate perimeter.
  const rim=outline.getPoints(7);
  function perimeter(name,scale,z,r,color) {
    const pts=rim.map(p=>{const x=p.x*scale,y=.724+(p.y-.724)*scale;return new T.Vector3(x,y,z+archAt(x,y));});
    const curve=new T.CatmullRomCurve3(pts,false,'centripetal');
    add(new T.TubeGeometry(curve,112,r,4,false),color,name);
  }
  perimeter('maple-edge',1,.132,.0045,colors.edge);
  perimeter('purfling',.964,.133,.0022,colors.line);

  // Neck/heel and tapered ebony fingerboard remain separate from the four strings.
  block('neck',0,1.424,.020,.065,.455,.070,colors.ribs);
  oval('neck-heel',0,1.196,.010,.065,.095,.075,colors.ribs);
  const fingerboard=new T.Shape(); fingerboard.moveTo(-.047,.855);
  fingerboard.lineTo(.047,.855);fingerboard.lineTo(.026,1.652);
  fingerboard.lineTo(-.026,1.652);fingerboard.closePath();
  const fb=plate(fingerboard,.014,colors.ebony,'tapered-fingerboard',.139);
  for(let i=0;i<fb.geometry.attributes.position.count;i++) {
    const p=fb.geometry.attributes.position;
    p.setZ(i,p.getZ(i)+.025*(1.652-p.getY(i))/.797);
  }
  fb.geometry.computeVertexNormals();
  block('nut',0,1.647,.160,.062,.014,.025,colors.ebony);
  // Slender pegbox with four individually visible alternating tuning pegs.
  block('pegbox',0,1.741,.018,.063,.190,.075,colors.ribs);
  block('pegbox-recess',0,1.736,.061,.039,.142,.008,colors.ebony);
  for(let i=0;i<4;i++) {
    const side=i%2===0?-1:1,y=1.678+i*.041;
    bar(`peg-shaft-${i+1}`,[0,y,.020],[side*.107,y,.020],.010,colors.ebony);
    oval(`peg-handle-${i+1}`,side*.113,y,.020,.024,.018,.026,colors.ebony);
  }
  oval('scroll-core',0,1.866,.018,.056,.060,.046,colors.ribs);
  const spiral=[];
  for(let i=0;i<=30;i++) {const a=i/30*Math.PI*3.7,r=.043*(1-i/37);
    spiral.push(new T.Vector3(Math.cos(a)*r,1.867+Math.sin(a)*r,.066));}
  add(new T.TubeGeometry(new T.CatmullRomCurve3(spiral),30,.005,5,false),colors.edge,'carved-scroll');

  const tail=new T.Shape();tail.moveTo(-.027,.290);tail.lineTo(.027,.290);
  tail.lineTo(.061,.547);tail.quadraticCurveTo(0,.573,-.061,.547);tail.closePath();
  plate(tail,.021,colors.ebony,'tapered-tailpiece',.155,true);
  bar('tail-gut-left',[-.018,.293,.161],[-.012,.224,.11],.003,colors.ebony);
  bar('tail-gut-right',[.018,.293,.161],[.012,.224,.11],.003,colors.ebony);
  oval('endbutton',0,.224,.041,.025,.018,.024,colors.ebony);
  bar('endpin',[0,.225,0],[0,-.176,0],.009,colors.metal);
  oval('endpin-tip',0,-.180,0,.017,.014,.017,colors.ebony);

  const bridge=new T.Shape();bridge.moveTo(-.078,.646);bridge.lineTo(-.078,.692);
  bridge.quadraticCurveTo(0,.730,.078,.692);bridge.lineTo(.078,.646);
  bridge.lineTo(.041,.646);bridge.quadraticCurveTo(0,.695,-.041,.646);bridge.closePath();
  for(const x of [-.043,.043]) {const h=new T.Path();h.absellipse(x,.692,.012,.010,0,Math.PI*2,false);bridge.holes.push(h);}
  plate(bridge,.024,colors.ivory,'bridge-with-two-feet-and-kidneys',.185);
  for(let i=0;i<4;i++) {
    const x=(i-1.5)*.019,r=.0018+i*.00035;
    const points=[[x*.87,.549,.180],[x,.706,.216],[x*.72,1.648,.177],[(i%2?1:-1)*.014,1.678+i*.041,.065]];
    for(let j=0;j<3;j++)bar(`string-${i+1}-segment-${j+1}`,points[j],points[j+1],r,colors.metal,5);
    oval(`fine-tuner-${i+1}`,x*.87,.532,.190,.006,.006,.006,colors.metal);
  }
  // Existing bow, now recognizable: cambered stick, separate hair, frog and tip.
  const bx=.413,bz=.047;
  const bowPath=new T.QuadraticBezierCurve3(new T.Vector3(bx,.13,bz),new T.Vector3(bx+.045,.88,bz),new T.Vector3(bx,1.63,bz));
  add(new T.TubeGeometry(bowPath,20,.009,6,false),colors.bow,'bow-cambered-stick');
  bar('bow-hair',[bx-.024,.25,bz],[bx-.024,1.59,bz],.006,colors.ivory,4);
  block('bow-frog',bx-.014,.208,bz,.043,.079,.032,colors.ebony);
  block('bow-ferrule',bx-.022,.253,bz,.028,.019,.034,colors.metal);
  oval('bow-frog-eye',bx-.014,.207,bz+.018,.008,.008,.003,colors.ivory);
  bar('bow-screw',[bx,.124,bz],[bx,.088,bz],.012,colors.metal);
  bar('bow-tip',[bx,1.626,bz],[bx-.025,1.583,bz],.012,colors.bow);

  // Merge static parts by material. Eight draw calls, no shader/texture dependency,
  // and the official SVG fallback receives ordinary BufferGeometry triangles.
  const batches=new Map();
  for(const {part,color,name} of parts) {
    part.updateMatrix();const g=part.geometry.index?part.geometry.toNonIndexed():part.geometry.clone();
    g.applyMatrix4(part.matrix);const b=batches.get(color)||{positions:[],normals:[],names:[]};
    const start=b.positions.length/3;
    b.positions.push(...g.attributes.position.array);b.normals.push(...g.attributes.normal.array);
    b.names.push({name,start,count:g.attributes.position.count});batches.set(color,b);
    part.geometry.dispose();g.dispose();
  }
  for(const [color,b] of batches) {
    const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(b.positions,3));
    g.setAttribute('normal',new T.Float32BufferAttribute(b.normals,3));g.computeBoundingBox();g.computeBoundingSphere();
    const m=new T.Mesh(g,new T.MeshStandardMaterial({color,roughness:.79,metalness:color===colors.metal?.18:0}));
    m.name=`cello-material-${color}`;m.userData.parts=b.names;
    m.castShadow=color===colors.maple||color===colors.ribs;m.receiveShadow=true;root.add(m);
  }
  root.userData={model:'cello-procedural-002',strings:4,pegs:4,frontHoles:2,animated:false};
  return root;
}

const cello=createCello();
cello.position.set(-2.27,.2,-1.4);
cello.rotation.z=-.12;
scene.add(cello);

// Plant and reading stool on distant margins.
function plant(x,z){cylinder(x,.28,z,.24,.17,.5,'#cb9d7d');cylinder(x,.54,z,.22,.22,.025,'#776c4d');for(let n=0;n<7;n++){const a=n*2.4;const leaf=ball(x+Math.cos(a)*.22,.77+n%3*.09,z+Math.sin(a)*.2,.12,.3,.08,n%2?'#7f9e6e':'#91ad7c');leaf.rotation.z=Math.cos(a)*.7;}}plant(2.5,.65);plant(-2.6,1.3);cylinder(2.15,.38,1.55,.4,.4,.12,'#b78b61');for(const dx of [-.23,.23])for(const dz of [-.2,.2])rod([2.15+dx,.35,1.55+dz],[2.15+dx*1.2,.01,1.55+dz*1.2],.035,'#a27d57');box(2.15,.48,1.55,.48,.08,.3,'#d6a29a');box(2.12,.54,1.55,.43,.05,.3,'#eee4c9');
// Soft matte avatar assembled from genuine 3D geometry.
const avatar=new T.Group();scene.add(avatar);let body,head,leftLeg,rightLeg,leftArm,rightArm;let pos={x:0,z:.55},heading=0,walkPhase=0;
function disposeGroup(root){root.traverse(o=>{if(o.geometry)o.geometry.dispose();});root.clear();}
function buildAvatar(state){const avatar=new T.Group();let body,head,leftLeg,rightLeg,leftArm,rightArm;const skin=OPTIONS.skin[state.skin],hair=OPTIONS.hairColor[state.hairColor],cloth=OPTIONS.color[state.color];body=new T.Group();avatar.add(body);
leftLeg=new T.Group();rightLeg=new T.Group();leftLeg.position.set(-.135,.53,0);rightLeg.position.set(.135,.53,0);body.add(leftLeg,rightLeg);for(const p of [leftLeg,rightLeg]){cylinder(0,-.19,0,.075,.07,.35,state.outfit===1?'#798c84':skin,p);ball(0,-.39,.065,.11,.09,.17,'#735d4c',p);cylinder(0,-.28,0,.077,.078,.12,'#fff1d4',p);}
ball(0,.82,0,.27,.35,.18,state.outfit>=2?cloth:'#f8edd5',body);if(state.outfit===0){cylinder(0,.67,0,.19,.34,.46,cloth,body);box(0,.9,.16,.3,.24,.06,cloth,body);for(const x of [-.13,.13])box(x,1.01,.145,.055,.25,.07,cloth,body);box(0,.8,.21,.29,.05,.025,'#e1cda8',body);}else if(state.outfit===1){box(0,.75,.13,.39,.34,.13,cloth,body);for(const x of [-.14,.14])box(x,1,.15,.06,.29,.05,cloth,body);box(0,.84,.213,.17,.12,.035,'#e9dec3',body);}else if(state.outfit===3){const coat=cylinder(0,.76,0,.25,.30,.48,cloth,body);coat.scale.z=.72;box(0,.79,.204,.025,.37,.025,'#f5e9ce',body);for(const x of [-.14,.14]){const lapel=ball(x,1.03,.16,.075,.14,.035,'#e6d6b8',body);lapel.rotation.z=x>0?-.35:.35;ball(x,.73,.215,.065,.045,.02,cloth,body);}cylinder(0,.53,0,.22,.24,.12,'#b6a38a',body);}else{cylinder(0,.61,0,.23,.25,.18,'#b2a087',body);for(let n=0;n<3;n++)ball(0,.76+n*.1,.185,.018,.018,.015,'#f1ddb6',body);}
for(const x of [-.085,.085]){const c=ball(x,1.1,.145,.09,.035,.065,'#fff4de',body);c.rotation.z=x>0?-.25:.25;}
leftArm=new T.Group();rightArm=new T.Group();leftArm.position.set(-.26,1,0);rightArm.position.set(.26,1,0);body.add(leftArm,rightArm);for(const [p,sign]of [[leftArm,-1],[rightArm,1]]){p.rotation.z=sign*.12;ball(0,-.12,0,.095,.17,.1,state.outfit>=2?cloth:'#f7ebd4',p);ball(0,-.3,.01,.07,.11,.075,skin,p);}
head=new T.Group();head.position.set(0,1.49,0);body.add(head);ball(0,0,0,state.faceShape===1?.365:state.faceShape===2?.405:.39,state.faceShape===1?.455:state.faceShape===2?.415:.43,.34,skin,head);for(const x of [-.38,.38])ball(x,-.025,0,.065,.095,.065,skin,head);const capTheta=Math.PI-.01,capGeometry=new T.SphereGeometry(1,40,24,0,Math.PI*2,0,capTheta);const capPos=capGeometry.attributes.position;for(let i=0;i<capPos.count;i++){const v=new T.Vector3().fromBufferAttribute(capPos,i);const phi=Math.atan2(v.z,-v.x);const theta=Math.acos(Math.max(-1,Math.min(1,v.y)));const front=Math.max(0,Math.sin(phi));const back=Math.max(0,-Math.sin(phi));const edge=2.15-.98*Math.pow(front,3)+.12*back*back;const t=theta/capTheta*edge;capPos.setXYZ(i,-Math.cos(phi)*Math.sin(t),Math.cos(t),Math.sin(phi)*Math.sin(t));}capGeometry.computeVertexNormals();const hairCap=mesh(capGeometry,hair,0,.015,-.006,head);hairCap.scale.set((state.faceShape===1?.365:state.faceShape===2?.405:.39)+.022,(state.faceShape===1?.455:state.faceShape===2?.415:.43)+.024,.365);
// Fringe stays above eyes; bangs use rounded tapered clumps.
for(let n=-2;n<=2;n++){const bang=ball(n*.12,.255-Math.abs(n)*.013,.26,.092,.15+(n===-1?.035:0),.065,hair,head);bang.rotation.z=n*.11-.08;}
if(state.hair===1){for(const x of [-.32,.32])ball(x,-.02,-.035,.13,.35,.27,hair,head);ball(0,-.08,-.21,.36,.28,.15,hair,head);}else if(state.hair===2){for(const x of [-.39,.39]){ball(x,.23,-.05,.17,.17,.16,hair,head);ring(x,.23,.015,.14,.018,cloth,head);}}else for(const x of [-.33,.33])ball(x,.02,.05,.07,.15,.17,hair,head);
for(const x of [-.13,.13]){if(state.face===2){const eye=ring(x,-.018,.318,.046,.01,'#4c3b34',head);eye.scale.y=.35;eye.rotation.z=x>0?-.15:.15;}else{ball(x,-.025,.315,state.face===1?.042:.033,state.face===1?.057:.048,.018,'#3c3430',head);ball(x-.008,-.012,.333,.01,.013,.006,'#fff5dd',head);}ball(x*1.5,-.105,.293,.058,.026,.014,'#e8a797',head);}
ball(0,-.07,.341,.035,.025,.025,skin,head);const mouth=ring(0,-.15,.318,.035,.006,'#9e6b5b',head);mouth.scale.y=.47;box(0,-.13,.326,.086,.035,.02,skin,head);
if(state.hat===1){for(const x of [-.1,.1]){const bow=ball(x,.48,.04,.12,.075,.06,cloth,head);bow.rotation.z=x>0?.4:-.4;}ball(0,.48,.07,.04,.04,.035,'#f7e6b6',head);}else if(state.hat===2){const cap=ball(.03,.43,-.025,.36,.12,.29,cloth,head);cap.rotation.z=-.15;cylinder(.07,.55,-.02,.035,.025,.07,'#685c4b',head);}
if(state.accessory===1){for(const x of [-.13,.13])ring(x,-.025,.35,.075,.008,'#ad8959',head);rod([-.055,-.018,.35],[.055,-.018,.35],.006,'#ad8959',head);}else if(state.accessory===2){rod([-.2,1.1,.14],[.22,.65,.22],.022,'#9b7a52',body);box(.25,.64,.14,.19,.23,.12,'#bd9768',body);ball(.25,.76,.16,.1,.04,.065,'#d6b380',body);}
return {avatar,body,head,leftLeg,rightLeg,leftArm,rightArm};}
function rebuild(){disposeGroup(avatar);const built=buildAvatar(state);avatar.add(...[...built.avatar.children]);({body,head,leftLeg,rightLeg,leftArm,rightArm}=built);avatar.position.set(previewMode?0:pos.x,.02,previewMode?0:pos.z);avatar.rotation.y=previewMode?previewYaw:heading;}
rebuild();
let destination=null;const pressed=new Set();function release(){pressed.clear();destination=null;}const keyMap={ArrowUp:'up',w:'up',W:'up',ArrowDown:'down',s:'down',S:'down',ArrowLeft:'left',a:'left',A:'left',ArrowRight:'right',d:'right',D:'right'};window.addEventListener('keydown',e=>{if(previewMode)return;if(e.target.closest('button,input,select,textarea'))return;const d=keyMap[e.key];if(d){e.preventDefault();destination=null;pressed.add(d);}});window.addEventListener('keyup',e=>pressed.delete(keyMap[e.key]));window.addEventListener('blur',release);document.addEventListener('visibilitychange',release);for(const b of document.querySelectorAll('[data-dir]')){b.onpointerdown=e=>{if(previewMode)return;e.preventDefault();destination=null;b.setPointerCapture(e.pointerId);pressed.add(b.dataset.dir);};b.onpointerup=b.onpointercancel=b.onlostpointercapture=()=>pressed.delete(b.dataset.dir);}
$('home').onclick=()=>{if(previewMode)return;release();pos={x:0,z:.55};heading=0;avatar.position.set(0,.02,.55);avatar.rotation.y=0;area.focus({preventScroll:true});};$('reset').onclick=()=>{state=defaults();persist();controls();rebuild();};
const targetMarker=ring(0,.085,0,.16,.018,'#fff5cd');targetMarker.rotation.x=-Math.PI/2;targetMarker.visible=false;const raycaster=new T.Raycaster(),floorPlane=new T.Plane(new T.Vector3(0,1,0),0);let tap=null;
function enterPreview(mode){
 if(previewMode)return;roomSnapshot={position:avatar.position.clone(),rotation:avatar.rotation.clone(),pos:{...pos},heading,destination:destination?{...destination}:null,cameraPosition:camera.position.clone(),cameraQuaternion:camera.quaternion.clone(),focus:document.activeElement===document.body?area:document.activeElement,visibility:scene.children.map(o=>[o,o.visible])};
 release();tap=null;previewMode=mode;previewYaw=0;activeCategory=mode==='wardrobe'?3:0;
 scene.children.forEach(o=>{if(o!==avatar&&!o.isLight)o.visible=false;});avatar.position.set(0,.02,0);avatar.rotation.set(0,0,0);
 area.setAttribute('aria-label','角色預覽，左右拖曳或方向鍵轉動');document.body.classList.add('preview-open');const main=document.querySelector('main');main.setAttribute('role','dialog');main.setAttribute('aria-modal','true');main.setAttribute('aria-label',mode==='wardrobe'?'試穿衣服與配件':'調整臉型與髮型');document.querySelector('aside').hidden=false;$('preview-close').hidden=false;$('rotation-controls').hidden=false;
 camera.position.set(0,1.05,6);camera.lookAt(0,1.05,0);controls();resize();$('preview-close').focus({preventScroll:true});
}
function exitPreview(){if(!previewMode)return;const old=roomSnapshot;release();tap=null;previewMode=null;old.visibility.forEach(([o,v])=>o.visible=v);pos=old.pos;heading=old.heading;destination=old.destination;avatar.position.copy(old.position);avatar.rotation.copy(old.rotation);camera.position.copy(old.cameraPosition);camera.quaternion.copy(old.cameraQuaternion);area.setAttribute('aria-label','3D房間，點衣櫃或梳妝台更換外觀，點地板行走');document.body.classList.remove('preview-open');const main=document.querySelector('main');main.removeAttribute('role');main.removeAttribute('aria-modal');main.removeAttribute('aria-label');document.querySelector('aside').hidden=true;$('preview-close').hidden=true;$('rotation-controls').hidden=true;resize();old.focus?.focus({preventScroll:true});roomSnapshot=null;}
$('wardrobe-open').onclick=()=>enterPreview('wardrobe');$('vanity-open').onclick=()=>enterPreview('vanity');$('preview-close').onclick=exitPreview;
$('rotate-left').onclick=()=>previewYaw-=Math.PI/6;$('rotate-right').onclick=()=>previewYaw+=Math.PI/6;
document.addEventListener('keydown',e=>{if(!previewMode)return;if(e.key==='Escape'){e.preventDefault();exitPreview();return;}if(e.target===area&&(e.key==='ArrowLeft'||e.key==='ArrowRight')){e.preventDefault();previewYaw+=(e.key==='ArrowLeft'?-1:1)*Math.PI/12;}if(e.key==='Tab'){const focusable=[...document.querySelectorAll('main button,main a,#scene')].filter(o=>!o.closest('[hidden]')&&o.getClientRects().length&&o.tabIndex>=0);const at=focusable.indexOf(document.activeElement);if(e.shiftKey&&at<=0){e.preventDefault();focusable.at(-1)?.focus();}else if(!e.shiftKey&&(at===focusable.length-1||at<0)){e.preventDefault();focusable[0]?.focus();}}});
area.addEventListener('pointerdown',e=>{if(!e.isPrimary){tap=null;return;}if(e.button!==0)return;tap={id:e.pointerId,x:e.clientX,y:e.clientY,yaw:previewYaw};if(previewMode)area.setPointerCapture(e.pointerId);});
area.addEventListener('pointermove',e=>{if(previewMode&&tap?.id===e.pointerId)previewYaw=tap.yaw+(e.clientX-tap.x)*.012;});
area.addEventListener('pointercancel',()=>tap=null);area.addEventListener('lostpointercapture',()=>tap=null);
area.addEventListener('pointerup',e=>{if(!tap||tap.id!==e.pointerId)return;const start=tap;tap=null;if(previewMode)return;if(Math.hypot(e.clientX-start.x,e.clientY-start.y)>12)return;const r=area.getBoundingClientRect();camera.updateMatrixWorld();raycaster.setFromCamera(new T.Vector2((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1),camera);scene.updateMatrixWorld(true);const blockers=raycaster.intersectObjects(scene.children,true).filter(h=>h.object!==targetMarker);if(blockers[0]?.object.userData.station){enterPreview(blockers[0].object.userData.station);return;}if(blockers[0]&&blockers[0].point.y>.11)return;const hit=new T.Vector3();if(!raycaster.ray.intersectPlane(floorPlane,hit)||Math.abs(hit.x)>3.05||hit.z< -2.35||hit.z>2.35)return;destination={x:Math.max(-2.2,Math.min(2.2,hit.x)),z:Math.max(-.8,Math.min(1.9,hit.z))};area.focus({preventScroll:true});});
function resize(){const w=area.clientWidth,h=area.clientHeight;renderer.setSize(w,h);const size=previewMode?Math.max(1.22,1.05*h/w):Math.max(3.75,3.9*h/w);camera.left=-size*w/h;camera.right=size*w/h;camera.top=size;camera.bottom=-size;camera.updateProjectionMatrix();}new ResizeObserver(resize).observe(area);resize();controls();const reduced=matchMedia('(prefers-reduced-motion: reduce)');let last=0,lastDraw=0;
function frame(t){requestAnimationFrame(frame);const dt=Math.min((t-last)/1000,.05);last=t;if(document.hidden)return;if(previewMode){avatar.rotation.y=previewYaw;leftLeg.rotation.x=rightLeg.rotation.x=leftArm.rotation.x=rightArm.rotation.x=0;body.position.y=0;head.rotation.z=0;if(!software||t-lastDraw>100){renderer.render(scene,camera);lastDraw=t;}return;}let x=(pressed.has('right')?1:0)-(pressed.has('left')?1:0),z=(pressed.has('down')?1:0)-(pressed.has('up')?1:0);let moving=x||z;if(!moving&&destination){const next=stepToward(pos,destination,dt);const dx=next.x-pos.x,dz=next.z-pos.z;moving=Math.hypot(dx,dz)>.0001;if(moving){heading=Math.atan2(dx,dz);walkPhase+=dt*9;pos=next;}if(Math.hypot(pos.x-destination.x,pos.z-destination.z)<.005)destination=null;}if(x||z){const a=.615,wx=x*Math.cos(a)+z*Math.sin(a),wz=-x*Math.sin(a)+z*Math.cos(a);pos=move(pos,wx,wz,dt);heading=Math.atan2(wx,wz);walkPhase+=dt*9;}targetMarker.visible=!!destination;if(destination)targetMarker.position.set(destination.x,.085,destination.z);avatar.position.set(pos.x,.02,pos.z);let delta=Math.atan2(Math.sin(heading-avatar.rotation.y),Math.cos(heading-avatar.rotation.y));avatar.rotation.y+=delta*Math.min(1,dt*12);const swing=moving?Math.sin(walkPhase)*.38:0;leftLeg.rotation.x=swing;rightLeg.rotation.x=-swing;leftArm.rotation.x=-swing*.7;rightArm.rotation.x=swing*.7;body.position.y=moving?Math.abs(Math.sin(walkPhase))*.025:reduced.matches?0:Math.sin(t*.0018)*.012;head.rotation.z=reduced.matches||moving?0:Math.sin(t*.0008)*.025;if(!software||t-lastDraw>100){renderer.render(scene,camera);lastDraw=t;}}requestAnimationFrame(frame);
renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();release();$('scene-status').textContent='3D 畫面暫停，請重新整理恢復。';status.textContent='3D 顯示中斷，穿搭設定仍保留。請重新整理。';});
