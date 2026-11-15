import * as T from './vendor/three.module.js';
import {KEY,OPTIONS,defaults,normalize,update,move,stepToward} from './state.js?v=6';
const $=id=>document.getElementById(id),area=$('scene'),status=$('save-status');let state=defaults();try{state=normalize(JSON.parse(localStorage.getItem(KEY)));}catch{status.textContent='無法讀取本機設定，仍可自由試穿。';}
const HAIR_ACCESSORY={bow:'#c88f83',beret:'#718f83',tie:'#d9b77d'};
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
 if(kind==='hat')art=index===0?'<circle cx="32" cy="32" r="20" fill="none"/><path d="m18 46 28-28"/>':index===1?`<path d="M29 27 10 16v32l19-12m6-9 19-11v32L35 36" fill="${index===1?HAIR_ACCESSORY.bow:HAIR_ACCESSORY.beret}"/><circle cx="32" cy="32" r="7" fill="#f5d78b"/>`:`<ellipse cx="32" cy="34" rx="24" ry="14" fill="${index===1?HAIR_ACCESSORY.bow:HAIR_ACCESSORY.beret}"/><path d="m34 20 3-9M15 45h34" fill="none"/>`;
 if(kind==='accessory')art=index===0?'<circle cx="32" cy="32" r="20" fill="none"/><path d="m18 46 28-28"/>':index===1?'<circle cx="18" cy="32" r="11" fill="none"/><circle cx="46" cy="32" r="11" fill="none"/><path d="M29 31h6M7 29 3 25M57 29l4-4"/>':'<path d="M18 28V17q14-18 28 0v11" fill="none"/><rect x="12" y="27" width="40" height="29" rx="7" fill="#cda678"/><path d="M12 35q20 14 40 0" fill="none"/><circle cx="32" cy="42" r="2"/>';
 return `<svg aria-hidden="true" focusable="false" viewBox="0 0 64 64" fill="${ink}" stroke="${ink}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${art}</svg>`;
}
function controls(focusKey=null){
 const wrap=$('controls');wrap.replaceChildren();
 const tabs=document.createElement('div');tabs.className='category-tabs';tabs.setAttribute('role','tablist');tabs.setAttribute('aria-label','外觀分類');
 categories.forEach(([k],i)=>{if(!visibleCategories().includes(i))return;const tab=document.createElement('button');tab.type='button';tab.id='category-'+k;tab.className='category-tab';tab.dataset.category=k;tab.setAttribute('role','tab');tab.setAttribute('aria-label',labels[k]);tab.setAttribute('aria-selected',String(i===activeCategory));tab.setAttribute('aria-controls','appearance-options');tab.tabIndex=i===activeCategory?0:-1;tab.innerHTML=choiceIcon(k,k==='hat'?2:k==='accessory'?1:0);tab.onclick=()=>{activeCategory=i;controls('category:'+k);};tab.onkeydown=e=>{const ids=visibleCategories(),at=ids.indexOf(i);let next=i;if(e.key==='ArrowRight')next=ids[(at+1)%ids.length];else if(e.key==='ArrowLeft')next=ids[(at+ids.length-1)%ids.length];else if(e.key==='Home')next=ids[0];else if(e.key==='End')next=ids.at(-1);else return;e.preventDefault();activeCategory=next;controls('category:'+categories[next][0]);};tabs.append(tab);});wrap.append(tabs);
 const panel=document.createElement('div');panel.id='appearance-options';panel.className='appearance-options';panel.setAttribute('role','tabpanel');panel.setAttribute('aria-labelledby','category-'+categories[activeCategory][0]);
 for(const k of categories[activeCategory]){const box=document.createElement('fieldset');box.className='control';const legend=document.createElement('legend');legend.textContent=labels[k];box.append(legend);const row=document.createElement('div');row.className='choices'+(colorNames[k]?' swatches':' silhouettes');OPTIONS[k].forEach((v,i)=>{const b=document.createElement('button');b.type='button';b.setAttribute('aria-pressed',String(state[k]===i));b.setAttribute('aria-label',colorNames[k]?.[i]||v);if(colorNames[k])b.style.setProperty('--swatch',v);else b.innerHTML=choiceIcon(k,i);b.dataset.option=k+':'+i;b.onclick=()=>{state=update(state,k,i);persist();rebuild();controls(k+':'+i);$('scene-status').textContent='已換成'+(colorNames[k]?.[i]||v);};row.append(b);});box.append(row);panel.append(box);}wrap.append(panel);
 if(focusKey){const target=focusKey.startsWith('category:')?'[data-category="'+focusKey.slice(9)+'"]':'[data-option="'+focusKey+'"]';wrap.querySelector(target)?.focus({preventScroll:true});}
}
let renderer,software=false;try{renderer=new T.WebGLRenderer({antialias:true,alpha:true,powerPreference:'low-power'});}catch{const{SVGRenderer}=await import('./vendor/SVGRenderer.js');renderer=new SVGRenderer();renderer.setQuality('high');software=true;status.textContent='簡化 3D 模式（此瀏覽器未啟用 WebGL）；穿搭仍可儲存。';const note=document.createElement('span');note.className='render-mode sr-only';note.textContent='簡化 3D · SVG';area.append(note);}
if(!software){renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;renderer.outputColorSpace=T.SRGBColorSpace;renderer.setClearColor(0x000000,0);}area.append(renderer.domElement);$('loading').remove();renderer.domElement.setAttribute('aria-hidden','true');
const scene=new T.Scene(),camera=new T.OrthographicCamera(-4.5,4.5,4, -4,.1,60);camera.position.set(5.8,5.3,8.2);camera.lookAt(0,1,0);scene.add(new T.HemisphereLight(0xfff9df,0x9cbaaa,software?.65:2.4));const sun=new T.DirectionalLight(0xffefd0,software?.65:3.1);sun.position.set(-1.25,5,-4);sun.target.position.set(.1,.35,1.1);scene.add(sun.target);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);sun.shadow.camera.left=-5;sun.shadow.camera.right=5;sun.shadow.camera.top=5;sun.shadow.camera.bottom=-5;sun.shadow.bias=-.001;sun.shadow.normalBias=.02;scene.add(sun);scene.add(new T.AmbientLight(0xffffff,.25));
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
const windowGroup=new T.Group();windowGroup.position.set(-1.25,1.1,-2.12);scene.add(windowGroup);
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
const curtains=new T.Group();curtains.name='curtains-soft-tiebacks';windowGroup.add(curtains);
const curtainOuter=WINDOW_APERTURE.outerHalf+.26,tieY=WINDOW_APERTURE.spring-.26;
for(const side of [-1,1]){
 const drape=new T.Shape(),sx=x=>side*x;
 drape.moveTo(sx(WINDOW_APERTURE.half-.18),curtainTop-.04);
 drape.quadraticCurveTo(sx(.77),curtainTop-.12,sx(.90),WINDOW_APERTURE.spring+.26);
 drape.bezierCurveTo(sx(.96),WINDOW_APERTURE.spring+.06,sx(1.03),tieY+.12,sx(1.02),tieY);
 drape.quadraticCurveTo(sx(.97),.40,sx(.84),curtainBottom+.05);
 drape.quadraticCurveTo(sx(.99),curtainBottom-.02,sx(curtainOuter),curtainBottom+.02);
 drape.bezierCurveTo(sx(1.10),.55,sx(curtainOuter+.05),1.15,sx(curtainOuter),curtainTop-.04);
 drape.quadraticCurveTo(sx(.89),curtainTop+.015,sx(WINDOW_APERTURE.half-.18),curtainTop-.04);drape.closePath();
 const cloth=mesh(new T.ExtrudeGeometry(drape,{depth:.018,bevelEnabled:true,bevelSize:.006,bevelThickness:.004,bevelSegments:2,curveSegments:28}),'#e7dcc8',0,0,.17,curtains);cloth.name='curtain-pulled-back-'+side;cloth.renderOrder=10;
 for(let n=0;n<2;n++){
  const curve=new T.CatmullRomCurve3([[.73+n*.18,curtainTop-.07,.197],[.96+n*.09,1.22,.197],[1.04+n*.025,tieY,.197],[.96+n*.10,curtainBottom+.06,.197]].map(([x,y,z])=>new T.Vector3(sx(x),y,z)));
  const fold=mesh(new T.TubeGeometry(curve,28,.007,5,false),'#f1e8d6',0,0,0,curtains);fold.name='curtain-soft-fold';fold.renderOrder=10;
 }
 const tie=rod([sx(.99),tieY+.025,.203],[sx(1.12),tieY-.01,.203],.014,'#c6ae82',curtains);tie.name='curtain-tieback';tie.renderOrder=11;
}
const curtainRod=rod([-curtainOuter-.06,curtainTop,.19],[curtainOuter+.06,curtainTop,.19],.023,'#b6a17b',curtains);curtainRod.name='curtain-rod';curtainRod.renderOrder=11;
// Cloth is decorative: no cast shadows or synthetic curtain-shadow geometry.
curtains.traverse(o=>{if(o.isMesh){o.castShadow=false;o.receiveShadow=false;}});
// SVG has no depth buffer: keep this backdrop below every foreground object.
if(typeof software!=='undefined'&&software)windowGroup.traverse(o=>{if(o.isMesh)o.renderOrder-=12;});
// Wardrobe and hanging cloth, little shelf.
const wardrobeStart=scene.children.length;
box(2.1,1.02,-1.85,1.25,2,.65,'#a6805f');box(2.1,1.04,-1.5,1.1,1.77,.035,'#c3a57d');box(2.1,1.04,-1.46,.025,1.78,.02,'#907054');for(const x of [1.98,2.23])ball(x,1.08,-1.41,.035,.035,.035,'#f4d99c');box(2.1,2.07,-1.85,1.4,.13,.77,'#b2956d');
scene.children.slice(wardrobeStart).forEach(o=>{o.userData.station='wardrobe';});
// A small vanity with a framed oval mirror, deliberately not a reflective render pass.
const vanity=new T.Group();vanity.position.set(.65,0,-1.65);vanity.scale.setScalar(.88);scene.add(vanity);
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
  const neck=block('neck',0,1.424,.020,.065,.455,.070,colors.ribs);
  const neckVertices=neck.geometry.attributes.position;
  for(let i=0;i<neckVertices.count;i++){const front=neckVertices.getZ(i)>0,y=neckVertices.getY(i)+neck.position.y;neckVertices.setZ(i,.139+.025*(1.652-y)/.797+.002-(front?0:.065)-neck.position.z);}
  neck.geometry.computeVertexNormals();
  oval('neck-heel',0,1.196,.045,.065,.095,.085,colors.ribs);
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
  const pegAssemblyStart=parts.length;
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

  // Move the whole pegbox/scroll assembly into the nut's continuous neck plane.
  for(const item of parts.slice(pegAssemblyStart))item.part.position.z+=.092;

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
    const points=[[x*.87,.549,.180],[x,.706,.216],[x*.72,1.648,.177],[(i%2?1:-1)*.014,1.678+i*.041,.157]];
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
scene.add(cello);cello.traverse(o=>{o.userData.station='cello';});

// Plant and reading stool on distant margins.
function plant(x,z,variant=0){const pot=variant?'#ba927e':'#c7b49a';cylinder(x,.27,z,variant?.20:.24,variant?.16:.18,.48,pot);cylinder(x,.51,z,variant?.205:.245,variant?.205:.245,.035,pot);cylinder(x,.53,z,.18,.18,.012,'#776c4d');for(let n=0;n<(variant?8:6);n++){const a=n*2.4,r=variant?.19:.23,y=variant?.84+(n%3)*.13:.78+(n%2)*.10;rod([x,.53,z],[x+Math.cos(a)*r,y,z+Math.sin(a)*r],.012,'#7d946e');const leaf=ball(x+Math.cos(a)*r,y,z+Math.sin(a)*r,variant?.085:.14,variant?.27:.24,.065,n%2?'#839d75':'#a1b58b');leaf.rotation.z=Math.cos(a)*(variant?.5:.7);leaf.rotation.y=-a;}}plant(2.5,.65);plant(-2.6,1.3,1);cylinder(2.15,.38,1.55,.4,.4,.12,'#b78b61');for(const dx of [-.23,.23])for(const dz of [-.2,.2])rod([2.15+dx,.35,1.55+dz],[2.15+dx*1.2,.01,1.55+dz*1.2],.035,'#a27d57');box(2.15,.48,1.55,.48,.08,.3,'#d6a29a');box(2.12,.54,1.55,.43,.05,.3,'#eee4c9');
// Soft matte avatar assembled from genuine 3D geometry.
// Standalone original procedural prop for Cello Town 006. No imports or side effects.
// Paste before scene construction; call after mesh/ball/rod exist. Time is milliseconds.
// const cat=createNappingCat({T,mesh,ball,rod}); scene.add(cat.group);
// In frame(t), before preview early return: cat.animateCat(t,reduced.matches);
function createNappingCat({T,mesh,ball,rod,position=[-1.4,.03,-1.75],rotation=0,scale=.72}) {
  const group=new T.Group();group.name='NappingCat';
  group.position.set(...position);group.rotation.y=rotation;group.scale.setScalar(scale);
  const C={fur:'#eadcc5',cream:'#f5e9d2',patch:'#bb9574',stripe:'#a88265',ear:'#d6a99b',
    ink:'#66594b',nose:'#ba8d84',cushion:'#aab5a0',piping:'#cbd0b7',whisker:'#ad9f88'};
  const sphere=new T.SphereGeometry(1,16,10),parts=[];
  function add(geometry,color,name,x=0,y=0,z=0,parent=group){const p=mesh(geometry,color,x,y,z,parent);p.name=name;parts.push(p);return p;}
  function oval(name,x,y,z,sx,sy,sz,color,parent=group){const p=add(sphere,color,name,x,y,z,parent);p.scale.set(sx,sy,sz);return p;}
  function curve(name,points,r,color,parent=group,steps=18){return add(new T.TubeGeometry(new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p))),steps,r,6,false),color,name,0,0,0,parent);}
  function detail(name,points,r,color,parent){const p=curve(name,points,r,color,parent,12);p.castShadow=false;return p;}
  // Soft contact with a shallow cushion: the underside is at local y=0.
  oval('cat-cushion-piping',0,.048,.035,.61,.048,.47,C.piping);
  oval('cat-cushion',0,.066,.035,.585,.058,.445,C.cushion);
  const body=oval('cat-curled-body',.085,.285,-.015,.405,.225,.285,C.fur);body.rotation.y=-.18;
  const rump=oval('cat-rounded-haunch',.29,.27,-.08,.235,.205,.245,C.fur);rump.rotation.y=.18;
  // A clean cream coat avoids intersecting patch meshes; tail/ears carry warm accents.
  oval('cat-rear-paw',.26,.143,.22,.14,.067,.105,C.cream);
  const pawA=oval('cat-tucked-paw-left',-.33,.143,.35,.12,.063,.112,C.cream);pawA.rotation.y=-.18;
  const pawB=oval('cat-tucked-paw-right',-.135,.137,.32,.115,.058,.105,C.cream);pawB.rotation.y=.13;
  // A curled tail wraps the outside of the body, away from the sleeping face.
  curve('cat-curled-tail',[[.35,.23,-.20],[.47,.185,-.02],[.45,.16,.21],[.27,.151,.37],[.075,.155,.385]],.066,C.patch,group,28);
  const tailTip=new T.Group();tailTip.name='cat-tail-tip-pivot';tailTip.position.set(.075,.155,.385);group.add(tailTip);
  curve('cat-tail-tip',[[0,0,0],[-.075,.003,-.012],[-.135,.015,-.055],[-.15,.021,-.10]],.057,C.fur,tailTip,14);
  oval('cat-tail-rounded-tip',-.15,.021,-.10,.054,.054,.054,C.fur,tailTip);
  // Head rests into the paws, not a standing/bobbing head.
  const head=new T.Group();head.name='cat-sleeping-head';head.position.set(-.265,.279,.18);head.rotation.set(-.12,-.12,-.12);group.add(head);
  oval('cat-soft-head',0,0,0,.232,.18,.207,C.fur,head);
  oval('cat-forehead-patch',-.078,.118,.025,.13,.061,.148,C.patch,head);
  oval('cat-left-cheek',-.085,-.073,.157,.10,.072,.068,C.cream,head);
  oval('cat-right-cheek',.085,-.073,.157,.10,.072,.068,C.cream,head);
  oval('cat-muzzle-left',-.038,-.077,.207,.056,.039,.038,C.cream,head);
  oval('cat-muzzle-right',.038,-.077,.207,.056,.039,.038,C.cream,head);
  function ear(side){
    const pivot=new T.Group();pivot.name='cat-ear-'+(side<0?'left':'right');pivot.position.set(side*.145,.117,-.035);pivot.rotation.z=-side*.19;head.add(pivot);
    const outline=new T.Shape();outline.moveTo(-.09,0);outline.quadraticCurveTo(-.075,.10,-.025,.185);outline.quadraticCurveTo(-.005,.204,.014,.176);outline.lineTo(.088,.018);outline.quadraticCurveTo(.02,-.017,-.09,0);
    add(new T.ExtrudeGeometry(outline,{depth:.052,steps:1,curveSegments:6,bevelEnabled:true,bevelSize:.012,bevelThickness:.009,bevelSegments:2}),side<0?C.patch:C.fur,'cat-ear-outer',0,0,-.025,pivot);
    const inner=new T.Shape();inner.moveTo(-.052,.026);inner.quadraticCurveTo(-.04,.085,-.012,.146);inner.quadraticCurveTo(0,.158,.01,.137);inner.lineTo(.052,.037);inner.closePath();
    add(new T.ShapeGeometry(inner,6),C.ear,'cat-ear-inner',0,0,.039,pivot).castShadow=false;
    return pivot;
  }
  const leftEar=ear(-1);ear(1);const earRest=leftEar.rotation.z;
  // Two shallow closed eyelids, kept high enough above the cream muzzle.
  for(const side of[-1,1]){
    const x=side*.087;
    detail('cat-closed-eye',[[x-.043,.018,.186],[x-.022,.002,.199],[x,-.006,.202],[x+.023,.001,.198],[x+.043,.014,.186]],.008,C.ink,head);
  }
  const nose=new T.Shape();nose.moveTo(-.027,0);nose.quadraticCurveTo(0,.012,.027,0);nose.quadraticCurveTo(.012,-.021,0,-.025);nose.quadraticCurveTo(-.013,-.021,-.027,0);
  add(new T.ExtrudeGeometry(nose,{depth:.008,bevelEnabled:true,bevelSize:.003,bevelThickness:.003,bevelSegments:1,curveSegments:5}),C.nose,'cat-small-nose',0,-.055,.243,head).castShadow=false;
  detail('cat-mouth',[[0,-.078,.247],[0,-.091,.245],[-.02,-.101,.239]],.004,C.ink,head,8);
  detail('cat-mouth-right',[[0,-.091,.245],[.012,-.10,.24],[.025,-.097,.235]],.004,C.ink,head,8);
  for(const side of[-1,1])for(const j of[-1,0,1]){
    const p=rod([side*.102,-.070+j*.015,.207],[side*(.245+.012*(1-Math.abs(j))),-.063+j*.044,.21],.0033,C.whisker,head);
    p.name='cat-whisker';p.castShadow=false;p.receiveShadow=false;parts.push(p);
  }
  // Three subdued forehead marks; no busy pattern or floating text.
  for(const x of[-.047,0,.047])detail('cat-forehead-stripe',[[x,.111,.145],[x*.95,.084,.172],[x*.85,.059,.186]],.007,C.stripe,head);
  for(const side of[-1,1])detail('cat-paw-toes',[[side*.018-.33,.19,.40],[side*.018-.33,.174,.443]],.0035,C.patch,group,6);
  // Decorative only: never set userData.station or add raycast/navigation targets.
  group.userData={model:'napping-cat-procedural-006',decorative:true,animatedParts:['tail-tip','left-ear'],footprint:{x:1.22*scale,z:.94*scale},placement:'under-window'};
  const stats={meshes:parts.length,triangles:parts.reduce((n,p)=>n+(p.geometry.index?p.geometry.index.count:p.geometry.attributes.position.count)/3,0),sharedSphereInstances:parts.filter(p=>p.geometry===sphere).length};
  function animateCat(t,reduced=false){
    const seconds=Number.isFinite(t)?t*.001:0;
    tailTip.rotation.y=reduced?0:Math.sin(seconds*.55)*.035;
    leftEar.rotation.z=earRest+(reduced?0:Math.pow(Math.max(0,Math.sin(seconds*.31)),18)*.022);
  }
  animateCat(0,true);return {group,animateCat,stats};
}

const roomCat=createNappingCat({T,mesh,ball,rod,position:[-.55,.03,-1.75]});scene.add(roomCat.group);
const avatar=new T.Group();scene.add(avatar);let body,head,leftLeg,rightLeg,leftArm,rightArm;let blinkEyes=[];let pos={x:0,z:.55},heading=0,walkPhase=0;
function disposeGroup(root){root.traverse(o=>{if(o.geometry)o.geometry.dispose();if(o.userData.ownedMaterial)o.material.dispose();});root.clear();}
function buildAvatar(state){const avatar=new T.Group();let body,head,leftLeg,rightLeg,leftArm,rightArm;let blinkEyes=[];const skin=OPTIONS.skin[state.skin],hair=OPTIONS.hairColor[state.hairColor],cloth=OPTIONS.color[state.color];body=new T.Group();avatar.add(body);
leftLeg=new T.Group();rightLeg=new T.Group();leftLeg.position.set(-.135,.53,0);rightLeg.position.set(.135,.53,0);body.add(leftLeg,rightLeg);for(const p of [leftLeg,rightLeg]){cylinder(0,-.19,0,.075,.07,.35,state.outfit===1?'#798c84':skin,p);ball(0,-.39,.065,.11,.09,.17,'#735d4c',p);cylinder(0,-.28,0,.077,.078,.12,'#fff1d4',p);}
// Tailored continuous silhouettes; seams sit on the garment surface, not floating blocks.
let garmentProfile=[];
function surfaceZ(x,y){let z=.18*Math.sqrt(Math.max(0,1-(x/.245)**2-((y-.84)/.30)**2));for(let i=1;i<garmentProfile.length;i++){const[r0,y0]=garmentProfile[i-1],[r1,y1]=garmentProfile[i];if(y>=y0&&y<=y1){const r=r0+(r1-r0)*(y-y0)/(y1-y0||1);z=Math.max(z,.8*Math.sqrt(Math.max(0,r*r-x*x)));}}return z;}
function garment(profile,color){garmentProfile=profile;const o=mesh(new T.LatheGeometry(profile.map(([r,y])=>new T.Vector2(r,y)),40),color,0,0,0,body);o.scale.z=.80;return o;}
function clothPanel(points,color,z,side=1){const shape=new T.Shape();shape.moveTo(...points[0]);for(const pt of points.slice(1))shape.lineTo(...pt);shape.closePath();const base=new T.ShapeGeometry(shape),p=base.attributes.position,indices=base.index.array,verts=[];function tri(a,b,c,n){if(n){const ab=a.clone().add(b).multiplyScalar(.5),bc=b.clone().add(c).multiplyScalar(.5),ca=c.clone().add(a).multiplyScalar(.5);tri(a,ab,ca,n-1);tri(ab,b,bc,n-1);tri(ca,bc,c,n-1);tri(ab,bc,ca,n-1);}else for(const v of[a,b,c])verts.push(v.x,v.y,side*(surfaceZ(v.x,v.y)+.004));}for(let i=0;i<indices.length;i+=3)tri(...[0,1,2].map(n=>new T.Vector3().fromBufferAttribute(p,indices[i+n])),3);base.dispose();const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(verts,3));geometry.computeVertexNormals();const o=mesh(geometry,color,0,0,0,body);o.material=mat(color).clone();o.material.side=T.DoubleSide;o.userData.ownedMaterial=true;o.castShadow=false;return o;}
function seam(points,color='#e9dfc5'){const guide=new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p))),curve=new T.CatmullRomCurve3(guide.getPoints(40).map(p=>new T.Vector3(p.x,p.y,surfaceZ(p.x,p.y)+.006)));const o=mesh(new T.TubeGeometry(curve,40,.004,5,false),color,0,0,0,body);o.castShadow=false;return o;}
function shoulderStraps(){for(const x of[-.12,.12]){const ribbon=[[x-.015,.89],[x+.015,.89],[x+.015,1.03],[x-.015,1.03]];clothPanel(ribbon,cloth,0);clothPanel(ribbon,cloth,0,-1);const ry=.30*Math.sqrt(1-(x/.245)**2),rz=.18*Math.sqrt(1-(x/.245)**2),start=Math.asin((1.03-.84)/ry),points=[];for(let i=0;i<=20;i++){const a=start+(Math.PI-2*start)*i/20;points.push(new T.Vector3(x,.84+(ry+.004)*Math.sin(a),(rz+.004)*Math.cos(a)));}const strap=mesh(new T.TubeGeometry(new T.CatmullRomCurve3(points),24,.014,6,false),cloth,0,0,0,body);strap.castShadow=false;}}
ball(0,.84,0,.245,.30,.18,state.outfit>=2?cloth:'#f6edda',body);
if(state.outfit===0){
 garment([[.30,.43],[.315,.46],[.30,.55],[.265,.70],[.255,.83],[.242,.96]],cloth);
 shoulderStraps();
 for(const x of[-.115,.115])ball(x,.98,surfaceZ(x,.98)+.008,.013,.013,.006,'#d8be8a',body);
}else if(state.outfit===1){
 garment([[.23,.50],[.245,.62],[.25,.79],[.25,.89],[.20,1.03]],cloth);
 shoulderStraps();
 clothPanel([[-.075,.82],[.075,.82],[.07,.91],[-.07,.91]],'#e6dcc4',.205);
 for(const x of[-.115,.115])ball(x,.985,surfaceZ(x,.985)+.008,.013,.013,.006,'#c6aa73',body);
}else if(state.outfit===3){
 garment([[.275,.51],[.29,.54],[.28,.65],[.27,.84],[.255,.99],[.185,1.08]],cloth);
 for(const side of[-1,1])clothPanel([[side*.035,.90],[side*.17,1.005],[side*.105,1.105],[side*.015,1.045]],'#e7dbc1',.205);
 seam([[0,.56,.236],[0,.77,.226],[0,.97,.212]],'#e8dbc0');
 for(const y of[.68,.80,.92])ball(.027,y,surfaceZ(.027,y)+.008,.012,.012,.005,'#b49664',body);
 cylinder(0,.49,0,.21,.235,.11,'#a99b84',body);
}else{
 garment([[.23,.62],[.25,.65],[.25,.82],[.23,1.01],[.17,1.08]],cloth);
 cylinder(0,.59,0,.23,.25,.13,'#b2a087',body);
 for(const y of[.77,.87,.97])ball(0,y,surfaceZ(0,y)+.008,.013,.013,.006,'#e8d5aa',body);
}
if(state.outfit!==3)for(const side of[-1,1])clothPanel([[0,1.075],[side*.12,1.11],[side*.16,1.035],[side*.065,1.005]],'#f5eedc',.19);

leftArm=new T.Group();rightArm=new T.Group();leftArm.position.set(-.26,1,0);rightArm.position.set(.26,1,0);body.add(leftArm,rightArm);for(const [p,sign]of [[leftArm,-1],[rightArm,1]]){p.rotation.z=sign*.12;ball(0,-.12,0,.095,.17,.1,state.outfit>=2?cloth:'#f7ebd4',p);ball(0,-.3,.01,.07,.11,.075,skin,p);}
head=new T.Group();head.position.set(0,1.49,0);body.add(head);const skull=ball(0,0,-.008,state.faceShape===1?.36:state.faceShape===2?.395:.38,state.faceShape===1?.43:state.faceShape===2?.39:.405,.37,skin,head);const skullP=skull.geometry.attributes.position;for(let i=0;i<skullP.count;i++)if(skullP.getZ(i)<0)skullP.setZ(i,skullP.getZ(i)*1.08);skull.geometry.computeVertexNormals();for(const x of [-.38,.38])ball(x,-.025,0,.065,.095,.065,skin,head);const capTheta=Math.PI-.01,capGeometry=new T.SphereGeometry(1,40,24,0,Math.PI*2,0,capTheta);const capPos=capGeometry.attributes.position;for(let i=0;i<capPos.count;i++){const v=new T.Vector3().fromBufferAttribute(capPos,i);const phi=Math.atan2(v.z,-v.x);const theta=Math.acos(Math.max(-1,Math.min(1,v.y)));const front=Math.max(0,Math.sin(phi));const back=Math.max(0,-Math.sin(phi));const edge=2.15-.98*Math.pow(front,3)+.12*back*back;const t=theta/capTheta*edge;capPos.setXYZ(i,-Math.cos(phi)*Math.sin(t),Math.cos(t),Math.sin(phi)*Math.sin(t)*(Math.sin(phi)<0?1.08:1));}capGeometry.computeVertexNormals();const hairCap=mesh(capGeometry,hair,0,.015,-.006,head);hairCap.scale.set((state.faceShape===1?.36:state.faceShape===2?.395:.38)+.022,(state.faceShape===1?.43:state.faceShape===2?.39:.405)+.024,.397);
// Fringe stays above eyes; bangs use rounded tapered clumps.
for(let n=-2;n<=2;n++){const bang=ball(n*.12,.255-Math.abs(n)*.013,.29,.092,.15+(n===-1?.035:0),.065,hair,head);bang.rotation.z=n*.11-.08;}
if(state.hair===1){for(const x of [-.32,.32])ball(x,-.02,-.035,.13,.35,.27,hair,head);ball(0,-.08,-.21,.36,.28,.15,hair,head);}else if(state.hair===2){for(const x of [-.39,.39]){ball(x,.23,-.05,.17,.17,.16,hair,head);ring(x,.23,.015,.14,.014,HAIR_ACCESSORY.tie,head);}}else for(const x of [-.33,.33])ball(x,.02,.05,.07,.15,.17,hair,head);
const faceRX=state.faceShape===1?.36:state.faceShape===2?.395:.38,faceRY=state.faceShape===1?.43:state.faceShape===2?.39:.405;
const faceZ=(x,y)=>-.008+.37*Math.sqrt(Math.max(.01,1-x*x/(faceRX*faceRX)-y*y/(faceRY*faceRY)));
function faceLine(points,color,radius){const curve=new T.CatmullRomCurve3(points.map(([x,y])=>new T.Vector3(x,y,faceZ(x,y)+.006)));const line=mesh(new T.TubeGeometry(curve,20,radius,6,false),color,0,0,0,head);line.castShadow=false;line.receiveShadow=false;return line;}
for(const x of[-.125,.125]){if(state.face===2){faceLine([[x-.029,-.018],[x,-.006],[x+.029,-.018]],'#594339',.006);}else{const y=-.022,z=faceZ(x,y);const eyeGroup=new T.Group();eyeGroup.position.set(x,y,z+.006);head.add(eyeGroup);blinkEyes.push(eyeGroup);const eye=ball(0,0,0,state.face===1?.031:.027,state.face===1?.044:.037,.010,'#453b32',eyeGroup);eye.castShadow=false;const glint=ball(-.007,.011,.011,.007,.009,.004,'#fff7e5',eyeGroup);glint.castShadow=false;}const cx=x*1.48,cy=-.095;const cheek=ball(cx,cy,faceZ(cx,cy)+.004,.043,.017,.006,'#e6b3a1',head);cheek.castShadow=false;}
const nose=ball(0,-.073,faceZ(0,-.073)+.003,.022,.016,.014,skin,head);nose.castShadow=false;
faceLine([[-.037,-.137],[0,state.face===1?-.149:-.157],[.037,-.137]],'#a16e62',.0055);
if(state.hat===1){for(const x of [-.1,.1]){const bow=ball(x,.48,.04,.12,.075,.06,HAIR_ACCESSORY.bow,head);bow.rotation.z=x>0?.4:-.4;}ball(0,.48,.07,.04,.04,.035,'#f7e6b6',head);}else if(state.hat===2){const cap=ball(.03,.43,-.025,.36,.12,.29,HAIR_ACCESSORY.beret,head);cap.rotation.z=-.15;cylinder(.07,.55,-.02,.035,.025,.07,'#685c4b',head);}
if(state.accessory===1){for(const x of [-.13,.13])ring(x,-.025,faceZ(x,-.025)+.025,.075,.008,'#ad8959',head);rod([-.055,-.018,.375],[.055,-.018,.375],.006,'#ad8959',head);}else if(state.accessory===2){rod([-.2,1.1,.14],[.22,.65,.22],.022,'#9b7a52',body);box(.25,.64,.14,.19,.23,.12,'#bd9768',body);ball(.25,.76,.16,.1,.04,.065,'#d6b380',body);}
return {avatar,body,head,leftLeg,rightLeg,leftArm,rightArm,blinkEyes};}
function rebuild(){disposeGroup(avatar);const built=buildAvatar(state);avatar.add(...[...built.avatar.children]);({body,head,leftLeg,rightLeg,leftArm,rightArm,blinkEyes}=built);avatar.position.set(pos.x,standY(pos),pos.z);avatar.rotation.y=previewMode?previewYaw:heading;}
rebuild();
let destination=null,pendingStation=null;const stationSpots={wardrobe:{x:2.2,z:-.8},vanity:{x:.65,z:-.75},cello:{x:-1.85,z:-.70}};const pressed=new Set();function release(){pressed.clear();destination=null;pendingStation=null;}const keyMap={ArrowUp:'up',w:'up',W:'up',ArrowDown:'down',s:'down',S:'down',ArrowLeft:'left',a:'left',A:'left',ArrowRight:'right',d:'right',D:'right'};window.addEventListener('keydown',e=>{if(previewMode)return;if(e.target.closest('button,input,select,textarea'))return;const d=keyMap[e.key];if(d){e.preventDefault();destination=null;pendingStation=null;pressed.add(d);}});window.addEventListener('keyup',e=>pressed.delete(keyMap[e.key]));window.addEventListener('blur',release);document.addEventListener('visibilitychange',release);for(const b of document.querySelectorAll('[data-dir]')){b.onpointerdown=e=>{if(previewMode)return;e.preventDefault();destination=null;pendingStation=null;b.setPointerCapture(e.pointerId);pressed.add(b.dataset.dir);};b.onpointerup=b.onpointercancel=b.onlostpointercapture=()=>pressed.delete(b.dataset.dir);}
const targetMarker=ring(0,.085,0,.16,.018,'#fff5cd');targetMarker.rotation.x=-Math.PI/2;targetMarker.visible=false;const raycaster=new T.Raycaster(),floorPlane=new T.Plane(new T.Vector3(0,1,0),0);let tap=null;
function approachStation(mode){if(!stationSpots[mode])return;if(previewMode)exitPreview();release();pendingStation=mode;destination={...stationSpots[mode]};$('scene-status').textContent=mode==='wardrobe'?'正在走向衣櫃':mode==='cello'?'正在走向大提琴':'正在走向梳妝台';area.focus({preventScroll:true});}
let cameraMotion=null;
function animateRoomCamera(position,zoom,restoring=false){
 cameraMotion={from:camera.position.clone(),to:position.clone(),fromZoom:camera.zoom,toZoom:zoom,start:performance.now(),restoring};
 if(reduced.matches){camera.position.copy(position);camera.zoom=zoom;camera.updateProjectionMatrix();cameraMotion=null;}
}
function previewCameraTarget(){
 const probe=camera.clone();probe.position.copy(roomSnapshot.cameraPosition);probe.quaternion.copy(roomSnapshot.cameraQuaternion);
 const height=camera.top-camera.bottom,zoom=Math.max(1.25,Math.min(3.1,height*.34/1.75));probe.zoom=zoom;probe.updateProjectionMatrix();probe.updateMatrixWorld(true);
 const projected=new T.Vector3(pos.x,.97,pos.z).project(probe),phone=area.clientWidth<600;
 const desiredX=phone?0:-.25,desiredY=phone?.32:.05;
 const right=new T.Vector3(1,0,0).applyQuaternion(probe.quaternion),up=new T.Vector3(0,1,0).applyQuaternion(probe.quaternion);
 probe.position.addScaledVector(right,(projected.x-desiredX)*(probe.right-probe.left)/(2*zoom));probe.position.addScaledVector(up,(projected.y-desiredY)*height/(2*zoom));
 return{position:probe.position,zoom};
}
function anchorEditor(){if(!previewMode||previewMode==='records')return;camera.updateMatrixWorld(true);const panel=document.querySelector('aside'),r=area.getBoundingClientRect(),m=document.querySelector('main').getBoundingClientRect();
 const project=(x,y,z)=>{const v=new T.Vector3(x,y,z).project(camera);return{x:r.left+(v.x+1)*r.width/2,y:r.top+(1-v.y)*r.height/2}};
 const points=[];for(const x of[-.52,.52])for(const y of[.02,2.05])for(const z of[-.35,.35])points.push(project(pos.x+x,y,pos.z+z));
 const left=Math.min(...points.map(v=>v.x)),right=Math.max(...points.map(v=>v.x)),top=Math.min(...points.map(v=>v.y)),bottom=Math.max(...points.map(v=>v.y));
 let x=right+14,y=top+22;if(r.width<600){x=(left+right-panel.offsetWidth)/2;y=bottom+14;}else if(x+panel.offsetWidth>r.right-12)x=left-panel.offsetWidth-14;
 x=Math.max(r.left+10,Math.min(r.right-panel.offsetWidth-10,x));y=Math.max(r.top+76,Math.min(r.bottom-panel.offsetHeight-10,y));
 Object.assign(panel.style,{left:(x-m.left)+'px',top:(y-m.top)+'px',right:'auto',bottom:'auto'});
}
function tickRoomCamera(t){if(cameraMotion){const motion=cameraMotion,u=Math.min(1,Math.max(0,(t-motion.start)/520)),ease=u*u*(3-2*u);camera.position.lerpVectors(motion.from,motion.to,ease);camera.zoom=motion.fromZoom+(motion.toZoom-motion.fromZoom)*ease;camera.updateProjectionMatrix();if(u===1){camera.position.copy(motion.to);camera.zoom=motion.toZoom;cameraMotion=null;}}if(previewMode)anchorEditor();}
function enterPreview(mode){
 if(mode==='cello'){openPracticeMock();return;}
 if(previewMode)exitPreview();
 roomSnapshot={rotation:avatar.rotation.clone(),heading,cameraPosition:cameraMotion?.restoring?cameraMotion.to.clone():camera.position.clone(),cameraQuaternion:camera.quaternion.clone(),cameraZoom:cameraMotion?.restoring?cameraMotion.toZoom:camera.zoom,focus:area};
 release();tap=null;previewMode=mode;previewYaw=Math.atan2(camera.position.x-pos.x,camera.position.z-pos.z);activeCategory=mode==='wardrobe'?3:0;
 area.setAttribute('aria-label','房間內角色試穿，左右拖曳或方向鍵轉動');document.body.classList.add('preview-open');document.body.dataset.editor=mode;const panel=document.querySelector('aside');panel.setAttribute('role','region');panel.setAttribute('aria-label',mode==='wardrobe'?'衣櫃試穿':'梳妝台');panel.hidden=false;$('preview-close').hidden=false;controls();const target=previewCameraTarget();animateRoomCamera(target.position,target.zoom);anchorEditor();$('preview-close').focus({preventScroll:true});
}
function exitPreview(){if(previewMode==='records'){closePracticeMock();return;}if(!previewMode)return;const old=roomSnapshot;release();if(tap&&area.hasPointerCapture(tap.id))area.releasePointerCapture(tap.id);tap=null;previewMode=null;heading=old.heading;avatar.rotation.copy(old.rotation);camera.quaternion.copy(old.cameraQuaternion);animateRoomCamera(old.cameraPosition,old.cameraZoom,true);area.setAttribute('aria-label','3D房間，點衣櫃或梳妝台走近更換外觀，點地板行走');document.body.classList.remove('preview-open');delete document.body.dataset.editor;const panel=document.querySelector('aside');panel.removeAttribute('role');panel.removeAttribute('aria-label');panel.removeAttribute('style');panel.hidden=true;$('preview-close').hidden=true;old.focus?.focus({preventScroll:true});roomSnapshot=null;}
$('wardrobe-open').onclick=()=>approachStation('wardrobe');$('vanity-open').onclick=()=>approachStation('vanity');$('preview-close').onclick=exitPreview;
function openPracticeMock(){release();previewMode='records';document.querySelector('.stage').inert=true;$('practice-mock').hidden=false;$('practice-close').focus({preventScroll:true});}
function closePracticeMock(){release();previewMode=null;document.querySelector('.stage').inert=false;$('practice-mock').hidden=true;area.focus({preventScroll:true});}
$('practice-close').onclick=closePracticeMock;
document.addEventListener('keydown',e=>{if(!previewMode)return;if(previewMode==='records'&&e.key==='Tab'){e.preventDefault();$('practice-close').focus();return;}if(e.key==='Escape'){e.preventDefault();exitPreview();return;}if(previewMode!=='records'&&e.target===area&&(e.key==='ArrowLeft'||e.key==='ArrowRight')){e.preventDefault();previewYaw+=(e.key==='ArrowLeft'?-1:1)*Math.PI/12;}});
area.addEventListener('pointerdown',e=>{if(!e.isPrimary){tap=null;return;}if(e.button!==0)return;if(!previewMode)release();tap={id:e.pointerId,x:e.clientX,y:e.clientY,yaw:previewYaw};if(previewMode)area.setPointerCapture(e.pointerId);});
area.addEventListener('pointermove',e=>{if(previewMode&&previewMode!=='records'&&tap?.id===e.pointerId)previewYaw=tap.yaw+(e.clientX-tap.x)*.012;});
area.addEventListener('pointercancel',()=>tap=null);area.addEventListener('lostpointercapture',()=>tap=null);
area.addEventListener('pointerup',e=>{if(!tap||tap.id!==e.pointerId)return;const start=tap;tap=null;if(previewMode)return;if(Math.hypot(e.clientX-start.x,e.clientY-start.y)>12)return;const r=area.getBoundingClientRect();camera.updateMatrixWorld();raycaster.setFromCamera(new T.Vector2((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1),camera);scene.updateMatrixWorld(true);const blockers=raycaster.intersectObjects(scene.children,true).filter(h=>h.object!==targetMarker);if(blockers[0]?.object.userData.station){approachStation(blockers[0].object.userData.station);return;}if(blockers[0]&&blockers[0].point.y>.11)return;const hit=new T.Vector3();if(!raycaster.ray.intersectPlane(floorPlane,hit)||Math.abs(hit.x)>3.05||hit.z< -2.35||hit.z>2.35)return;pendingStation=null;destination={x:Math.max(-2.2,Math.min(2.2,hit.x)),z:Math.max(-.8,Math.min(1.9,hit.z))};area.focus({preventScroll:true});});
function resize(){const w=area.clientWidth,h=area.clientHeight;renderer.setSize(w,h);const phone=w<600,size=Math.max(3.75,(phone?3.6:3.9)*h/w),lift=phone?2.05:0;camera.left=-size*w/h;camera.right=size*w/h;camera.top=size-lift;camera.bottom=-size-lift;camera.updateProjectionMatrix();if(previewMode&&previewMode!=='records'&&roomSnapshot){const target=previewCameraTarget();animateRoomCamera(target.position,target.zoom);}}new ResizeObserver(resize).observe(area);resize();controls();const reduced=matchMedia('(prefers-reduced-motion: reduce)');let last=0,lastDraw=0;
function standY(p){return (p.x*p.x/(1.6*1.6)+(p.z-.45)**2/(1.152*1.152)<=1?.045:.02)-.05;}
function walkPose(swing,moving){for(const[leg,theta]of[[leftLeg,swing],[rightLeg,-swing]]){leg.rotation.x=theta;const sole=.53-.39*Math.cos(theta)-.065*Math.sin(theta)-Math.sqrt((.09*Math.cos(theta))**2+(.17*Math.sin(theta))**2);leg.position.y=.53+(moving&&theta>=0?.05-sole:0);}leftArm.rotation.x=-swing*.85;rightArm.rotation.x=swing*.85;body.position.y=0;}
function animateIdle(t,moving){const still=reduced.matches||moving,breath=still?0:Math.sin(t*.0017);head.rotation.z=still?0:Math.sin(t*.0007)*.018;head.rotation.y=still?0:Math.sin(t*.00043)*.025;head.position.y=1.49+breath*.003;leftArm.position.y=rightArm.position.y=1+breath*.004;const phase=(t%4700)/4700,blink=still?1:phase>.955?Math.max(.10,Math.abs((phase-.9775)/.0225)):1;for(const eye of blinkEyes)eye.scale.y=blink;}
function frame(t){requestAnimationFrame(frame);const dt=Math.min((t-last)/1000,.05);last=t;if(document.hidden)return;tickRoomCamera(t);roomCat.animateCat(t,reduced.matches);if(previewMode){if(previewMode!=='records')avatar.rotation.y=previewYaw;walkPose(0,false);animateIdle(t,false);if(!software||t-lastDraw>100){renderer.render(scene,camera);lastDraw=t;}return;}let x=(pressed.has('right')?1:0)-(pressed.has('left')?1:0),z=(pressed.has('down')?1:0)-(pressed.has('up')?1:0);let moving=x||z;if(!moving&&destination){const next=stepToward(pos,destination,dt);const dx=next.x-pos.x,dz=next.z-pos.z;moving=Math.hypot(dx,dz)>.0001;if(moving){heading=Math.atan2(dx,dz);walkPhase+=Math.hypot(dx,dz)*5.7;pos=next;}if(Math.hypot(pos.x-destination.x,pos.z-destination.z)<.005)destination=null;}if(x||z){const a=.615,wx=x*Math.cos(a)+z*Math.sin(a),wz=-x*Math.sin(a)+z*Math.cos(a);const before=pos;pos=move(pos,wx,wz,dt);heading=Math.atan2(wx,wz);walkPhase+=Math.hypot(pos.x-before.x,pos.z-before.z)*5.7;}targetMarker.visible=!!destination;if(destination)targetMarker.position.set(destination.x,.085,destination.z);avatar.position.set(pos.x,standY(pos),pos.z);let delta=Math.atan2(Math.sin(heading-avatar.rotation.y),Math.cos(heading-avatar.rotation.y));avatar.rotation.y+=delta*Math.min(1,dt*12);const swing=moving?Math.sin(walkPhase)*.64:0;walkPose(swing,!!moving);animateIdle(t,!!moving);if(pendingStation&&!destination){const station=pendingStation;if(Math.hypot(pos.x-stationSpots[station].x,pos.z-stationSpots[station].z)<.005){enterPreview(station);}else pendingStation=null;}if(!software||t-lastDraw>100){renderer.render(scene,camera);lastDraw=t;}}requestAnimationFrame(frame);
renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();release();$('scene-status').textContent='3D 畫面暫停，請重新整理恢復。';status.textContent='3D 顯示中斷，穿搭設定仍保留。請重新整理。';});
