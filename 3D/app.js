import {createWindowLandscape,createWindowMotes,createWindowRain} from './window-landscape.js?v=room-art-040';
import {decoratePerformanceRoom,installWestRoomDetail,createRoomRayMirror,traceRoomDaylight,installRoomMaterialArt} from './room-polish.js?v=botanical-study-043';
import * as T from './vendor/three.module.js';
import {KEY,OPTIONS,defaults,normalize,update,move,stepToward,roomWalkPhase,FACE_SHAPES,faceWidth,sampleFaceMotion,installPullToRefreshGuard} from './state.js?v=wardrobe-colors-041';
const $=id=>document.getElementById(id),area=$('scene'),status=$('save-status');let state=defaults();try{state=normalize(JSON.parse(localStorage.getItem(KEY)));}catch{status.textContent='無法讀取本機設定，仍可自由試穿。';}
installPullToRefreshGuard();
const HAIR_ACCESSORY={bow:'#c88f83',beret:'#718f83',tie:'#d9b77d'};
const labels={faceShape:'臉型',face:'神情',hair:'髮型',skin:'膚色',hairColor:'髮色',outfit:'衣服',upper:'上身',lower:'下身',shoes:'鞋子',shoeColor:'鞋子顏色',lowerColor:'下身顏色',color:'上身顏色',hat:'頭飾',accessory:'小配件'},colorNames={skin:['奶油蜜桃','溫暖杏色','焦糖棕','可可棕'],hairColor:['栗子棕','蜂蜜金','午夜黑','紅茶棕'],color:['森林綠','珊瑚粉','丁香紫','暖陽黃'],lowerColor:['森林綠','珊瑚粉','丁香紫','暖陽黃','鼠尾草灰','燕麥棕','暖石灰','奶油米'],shoeColor:['款式原色','栗棕','墨黑','奶油米','暖粉','苔綠','深靛','赭紅']};
function persist(){try{localStorage.setItem(KEY,JSON.stringify(state));status.textContent='穿搭已自動保存在這個瀏覽器。';}catch{status.textContent='這次穿搭尚未儲存；瀏覽器不允許本機儲存。';}}
const categories=[['faceShape','skin'],['face'],['hair','hairColor'],['upper','color'],['lower','lowerColor'],['shoes','shoeColor'],['hat'],['accessory']];
let celloPerformance=null,rayMirrorFrame=null,mirrorCollider=null;
const mirrorSetting=new URLSearchParams(location.search).get('raymirror');
const mirrorRoom=/\/experimental(?:\/|$)/.test(location.pathname)||mirrorSetting==='1';
// Use the same center for the mirror and its square-on standing point.
const MIRROR_WALL_X=.65,MIRROR_APPROACH={x:MIRROR_WALL_X,z:-.79};
const MIRROR_TILT=-.17453;
let activeCategory=0,previewMode=null,previewYaw=0,roomSnapshot=null;
const visibleCategories=()=>previewMode==='wardrobe'?[3,4,5,6,7]:[0,1,2];
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
 if(kind==='upper'){
  const neck=index===4?'M24 18l8 9 8-9-8 3Z':index===7?'M20 20q12-22 24 0l-6 7H26Z':'M25 15q7 7 14 0';
  const body=index===3?'M21 12h22l9 43H12Z':index===5?'M24 12h16l3 43H21Z':'M20 14l12 5 12-5 12 16-9 7-5-8v26H22V29l-5 8-9-7Z';
  art=`<path d="${body}" fill="${cloth}"/><path d="${neck}" fill="none"/>`;
  if(index===1)art+='<path d="M24 16v20h16V16M24 36v18m16-18v18" fill="none"/>';
  if(index===2)art+='<path d="M24 38h16M24 43h16M24 48h16" fill="none"/>';
  if(index===5)art+='<path d="M24 16l8 17 8-17M32 33v21" fill="none"/>';
  if(index===6)art+='<path d="m12 27 7 6m26 0 7-6M32 23v31M35 28h5v7h-5Z" fill="none"/>';
 }
 if(kind==='lower'){
  const c=OPTIONS.lowerColor[state.lowerColor];
  art=index===0||index===4?`<path d="M24 12h16l13 43H11Z" fill="${c}"/>`:`<path d="M20 12h24l${index===5?5:0} ${index===7?26:42}H35l-3-${index===7?16:27}-3 ${index===7?16:27}H${index===5?15:20}Z" fill="${c}"/>`;
  art+='<path d="M23 18h18" fill="none"/>';
  if(index===4)art+='<path d="m26 20-7 33m11-33-2 33m6-33 2 33m2-33 7 33" fill="none"/>';
  if(index===1)art+='<path d="M24 12V5h4v7m8 0V5h4v7" fill="none"/>';
  if(index===3)art+='<path d="m25 23-1 28m15-28 1 28" fill="none"/>';
  if(index===6)art+='<path d="M20 48h9m6 0h9" fill="none"/>';
 }
 if(kind==='shoes'){
  const high=index===2||index===6,top=high?16:32;
  art=`<path d="M17 ${top}h15v18q20-1 20 14H12V38l5-4Z" fill="#9c8671"/><path d="M13 49h38" fill="none"/>`;
  if(index===1)art+='<path d="M19 33h14v5H19Z" fill="#e9ddbf"/>';
  if(index===3||index===6||index===7)art+='<path d="m28 35 8 4m-9 0 8 4m-9 0 8 4" fill="none"/>';
  if(index===4)art+='<path d="m30 38 5-5 5 6-5-2Z" fill="#e9ddbf"/>';
  if(index===5)art+='<path d="M20 38h20v5H20Z" fill="#e9ddbf"/>';
  if(index===7)art+='<path d="m37 43 9 3-5 2" fill="none"/>';
 }
if(kind==='upper')art+=['<path d="M24 32h16v12H24Zm4 1v9m4-9v9m4-9v9" fill="none"/>','<path d="M25 32h14v9q-7 6-14 0Z" fill="none"/>','<path d="m26 29 3 6-3 6 3 6m9-18-3 6 3 6-3 6" fill="none"/>','<path d="M19 38h9v6h-9m17-6h9v6h-9" fill="none"/>','<path d="m24 18 8 8-10 5m18-13-8 8 10 5M25 35v15m14-15v15" fill="none"/>','<path d="m24 18 8 18 8-18M23 44h6m6 0h6" fill="none"/>','<path d="M23 29h7v9h-7m11-9h7v9h-7" fill="none"/>','<path d="M23 41l4-5h10l4 5M26 21v9m12-9v9" fill="none"/>'][index];
if(kind==='lower')art+=['<path d="m26 18 6 5 6-5m-6 5-5 7m5-7 5 7M16 48q16 5 32 0" fill="none"/>','<path d="M22 23h7v8h-7m13-8h7v8h-7" fill="none"/>','<path d="M25 27v21m14-21v21" fill="none"/>','<path d="m23 20 6 5m12-5-6 5" fill="none"/>','<path d="M22 17h20M17 48h30" fill="none"/>','<path d="m25 20-1 32m15-32 1 32" fill="none"/>','<path d="M20 30h7v8h-7m10-8h7v8h-7" fill="none"/>','<path d="M20 34h9m6 0h9" fill="none"/>'][index];
// Insert before choiceIcon's return; preserves legacy indices 0..2.
if(kind==='faceShape'){const q=FACE_SHAPES[index],pts=[];for(let i=0;i<=40;i++){const a=i*Math.PI*2/40,y=Math.cos(a)*q.ry,x=Math.sin(a)*faceWidth(q,y);pts.push(`${32+x*52},${32-y*52}`);}art=`<polygon points="${pts.join(' ')}" fill="${skin}" stroke-linejoin="round"/><circle cx="26" cy="31" r="2"/><circle cx="38" cy="31" r="2"/><path d="M28 40q4 3 8 0" fill="none"/>`;}
if(kind==='face'){const eyes=[0,1,3,4,6].includes(index)?`<ellipse cx="24" cy="29" rx="3" ry="${index===6?5:index===3?2.7:4}"/><ellipse cx="40" cy="29" rx="3" ry="${index===1?5:4}"/>`:index===7?'<path d="M20 30q4-5 8 0" fill="none"/><ellipse cx="40" cy="29" rx="3" ry="4"/>':'<path d="M20 30q4-7 8 0M36 30q4-7 8 0" fill="none"/>';art=`<circle cx="32" cy="32" r="22" fill="${skin}"/><ellipse cx="19" cy="38" rx="4" ry="2" fill="#e6ad9f"/><ellipse cx="45" cy="38" rx="4" ry="2" fill="#e6ad9f"/>${eyes}`+([4,6].includes(index)?`<ellipse cx="32" cy="42" rx="${index===6?3:2}" ry="${index===6?4:2}" fill="none"/>`:index===5?'<ellipse cx="32" cy="42" rx="5" ry="3" fill="#9e645b"/>':`<path d="M27 40q5 ${index===3?2:5} 10 ${index===7?-2:0}" fill="none"/>`);}
if(index>=3&&kind==='hair'){const shapes={3:'M15 34Q7 12 28 8Q51 8 49 32L53 42Q56 58 43 58L39 34Z',4:'M12 34V21Q18 1 42 9Q55 16 50 37L42 22 18 31Z',5:'M10 30Q3 19 13 15Q11 4 25 9Q32 0 40 9Q55 3 53 18Q64 28 53 35Z',6:'M12 35Q7 5 42 8L54 15 40 18 50 23 25 25 18 35Z',7:'M11 57V25Q11 4 32 7Q53 4 53 25V57L41 54 39 27H25L22 54Z'};art=`<ellipse cx="32" cy="35" rx="15" ry="18" fill="${skin}"/><path d="${shapes[index]}" fill="${hair}"/>`;}
if(index>=3&&kind==='hat'){const shapes={3:'M6 42Q32 29 58 42Q52 52 6 42M19 37 22 17H42L46 37Z',4:'M13 43Q4 7 32 8Q60 7 51 43L46 40Q54 15 32 15Q10 15 18 40Z',5:'M12 37Q10 12 31 12Q51 12 49 36L60 42 24 42Z',6:'M13 42V31Q13 10 32 10Q51 10 51 31V42Z M12 36H52V47H12Z',7:'M8 46 16 34 21 14H43L48 34 56 46Z',8:'M8 42 20 36 19 17 31 23 43 16 46 36 57 42 47 47H17Z'};art=`<path d="${shapes[index]}" fill="#ad9776"/>`+(index===6?'<circle cx="32" cy="8" r="5" fill="#d7c0a1"/>':'');}
if(index>=3&&kind==='accessory'){const shapes={3:'M18 14v23M46 14v23',4:'M18 20v12M46 20v12',5:'M8 24H27V41H8ZM37 24H56V41H37ZM27 29H37',6:'M7 25H28M36 25H57M28 29H36M8 27v7q10 15 19 0v-7M37 27v7q10 15 19 0v-7',7:'M32 10 38 25 55 26 42 36 46 53 32 43 18 53 22 36 9 26 26 25Z',8:'M18 20v6M46 20v6'};art=`<path d="${shapes[index]}" fill="${index===7?'#e4c37f':'none'}"/>`+([3,4,8].includes(index)?[18,46].map(x=>index===3?`<ellipse cx="${x}" cy="42" rx="5" ry="8" fill="#e4cfac"/>`:index===4?`<path d="M${x} 28l4 6 7 1-5 5 1 7-7-3-7 3 1-7-5-5 7-1Z" fill="#d9aca1"/>`:`<circle cx="${x}" cy="32" r="5" fill="#ceb47d"/>`).join(''):'');}

 if(kind==='hair'){const profiles=[
 'M13 34Q8 11 27 9Q49 4 52 31L43 25 38 18 29 27 22 20 17 34Z',
 'M12 47V26Q10 7 32 8Q54 7 52 26V47Q49 57 42 49L40 28 32 21 23 28 22 49Q15 57 12 47Z',
 'M14 27Q3 28 6 16Q10 5 21 16Q32 4 43 16Q54 5 58 16Q61 28 50 27L43 24 34 17 23 24Z',
 'M14 31Q8 8 31 8Q50 6 51 29L48 36Q58 43 51 57L42 59 40 37 40 23 28 28 22 20Z',
 'M12 34Q7 9 35 8Q54 8 53 32L44 29 43 18 21 30 18 36Z',
 'M10 31Q3 22 13 16Q10 5 22 10Q31 1 39 9Q52 4 52 16Q62 20 54 32L44 26 35 28 26 24 18 33Z',
 'M12 35Q9 10 31 8Q47 5 54 19L42 18 48 25 29 26 21 30 17 37Z',
 'M11 53V24Q12 6 32 8Q52 6 53 24V53Q48 58 42 52L40 29 32 20 24 29 22 52Q16 58 11 53Z'];art=`<ellipse cx="32" cy="35" rx="15" ry="18" fill="${skin}"/><path d="${profiles[index]}" fill="${hair}"/><path d="M20 20q8-9 19-6" stroke="#c4a286" fill="none"/>`;}
 if(kind==='hat'&&index>0){const colors=['','#c98e8a','#829d8d','#e4ca94','#c39aa0','#86a7a0','#c8a295','#a8b794','#9c8f81'];const shapes=['','M29 28 12 19 12 39 28 34 23 51 32 43 41 51 36 34 52 39 52 19 35 28Z','M10 36Q4 18 31 17Q55 9 56 29L48 41 16 44Z','M5 42Q30 32 59 42Q52 54 5 42M19 36 22 16H42L45 36Z','M13 44Q4 8 32 8Q60 8 51 44L46 41Q52 17 32 16Q12 17 18 41Z','M11 37Q10 12 32 12Q53 12 51 37L59 45 22 43Z','M13 43V30Q13 9 32 9Q51 9 51 30V43Z M12 36H52V47H12Z','M8 46 16 34 21 14H43L48 34 56 46Z','M10 35Q9 13 32 13Q53 13 54 33L57 41 22 42Z'];art=`<path d="${shapes[index]}" fill="${colors[index]}"/>`+(index===1?'<circle cx="32" cy="30" r="5" fill="#eed5b5"/>':index===4?'<circle cx="47" cy="21" r="7" fill="#e7c1b3"/><circle cx="47" cy="21" r="3" fill="#dfbb6c"/>':index===6?'<circle cx="32" cy="8" r="5" fill="#e8cfb6"/><path d="M22 20v13m10-17v17m10-13v13" fill="none"/>':'<path d="M18 37h29M32 16v9" fill="none"/><circle cx="42" cy="31" r="4" fill="#e4c98b"/>');}
 if(kind==='accessory'&&index===2)art='<path d="M10 42V24q0-12 11-13m33 31V24q0-12-11-13M25 14V7q7-5 14 0v7" fill="none"/><rect x="13" y="28" width="38" height="29" rx="10" fill="#c6a176"/><path d="M13 31q19 12 38 0" fill="#ddbc8c"/><circle cx="32" cy="42" r="3" fill="#b99561"/>';
 if(kind==='accessory'&&index===8)art='<path d="M19 14v13m26-13v13" fill="none"/><circle cx="19" cy="35" r="8" fill="#b99561"/><circle cx="16" cy="32" r="6" fill="#ead9b4"/><circle cx="45" cy="35" r="8" fill="#b99561"/><circle cx="42" cy="32" r="6" fill="#ead9b4"/>';
 return `<svg aria-hidden="true" focusable="false" viewBox="0 0 64 64" fill="${ink}" stroke="${ink}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${art}</svg>`;
}
function controls(focusKey=null){
 const wrap=$('controls');wrap.replaceChildren();
 const tabs=document.createElement('div');tabs.className='category-tabs';tabs.setAttribute('role','tablist');tabs.setAttribute('aria-label','外觀分類');
 categories.forEach(([k],i)=>{if(!visibleCategories().includes(i))return;const tab=document.createElement('button');tab.type='button';tab.id='category-'+k;tab.className='category-tab';tab.dataset.category=k;tab.setAttribute('role','tab');tab.setAttribute('aria-label',labels[k]);tab.setAttribute('aria-selected',String(i===activeCategory));tab.setAttribute('aria-controls','appearance-options');tab.tabIndex=i===activeCategory?0:-1;tab.innerHTML=choiceIcon(k,k==='hat'?2:k==='accessory'?1:0);tab.onclick=()=>{activeCategory=i;controls('category:'+k);};tab.onkeydown=e=>{const ids=visibleCategories(),at=ids.indexOf(i);let next=i;if(e.key==='ArrowRight')next=ids[(at+1)%ids.length];else if(e.key==='ArrowLeft')next=ids[(at+ids.length-1)%ids.length];else if(e.key==='Home')next=ids[0];else if(e.key==='End')next=ids.at(-1);else return;e.preventDefault();activeCategory=next;controls('category:'+categories[next][0]);};tabs.append(tab);});wrap.append(tabs);
 const panel=document.createElement('div');panel.id='appearance-options';panel.className='appearance-options';panel.setAttribute('role','tabpanel');panel.setAttribute('aria-labelledby','category-'+categories[activeCategory][0]);
 // Show wardrobe swatches first so they remain visible in compact panels.
 const optionGroups=categories[activeCategory];
 for(const k of (previewMode==='wardrobe'&&optionGroups.length===2?[optionGroups[1],optionGroups[0]]:optionGroups)){const box=document.createElement('fieldset');box.className='control';const legend=document.createElement('legend');legend.textContent=labels[k];box.append(legend);const row=document.createElement('div');row.className='choices'+(colorNames[k]?' swatches':' silhouettes');OPTIONS[k].forEach((v,i)=>{const b=document.createElement('button');b.type='button';b.setAttribute('aria-pressed',String(state[k]===i));b.setAttribute('aria-label',colorNames[k]?.[i]||v);if(colorNames[k])b.style.setProperty('--swatch',v);else b.innerHTML=choiceIcon(k,i);if((k==='hat'||k==='accessory')&&i===0)b.classList.add('neutral-choice');b.title=colorNames[k]?.[i]||v;b.dataset.option=k+':'+i;b.onclick=()=>{state=update(state,k,i);persist();rebuild();controls(k+':'+i);$('scene-status').textContent='已換成'+(colorNames[k]?.[i]||v);};row.append(b);});box.append(row);panel.append(box);}wrap.append(panel);
 if(focusKey){const target=focusKey.startsWith('category:')?'[data-category="'+focusKey.slice(9)+'"]':'[data-option="'+focusKey+'"]';wrap.querySelector(target)?.focus({preventScroll:true});}
}
let renderer,software=false;try{renderer=new T.WebGLRenderer({antialias:true,alpha:true,powerPreference:'low-power'});}catch{const{SVGRenderer}=await import('./vendor/SVGRenderer.js');renderer=new SVGRenderer();renderer.setQuality('high');software=true;status.textContent='簡化 3D 模式（此瀏覽器未啟用 WebGL）；穿搭仍可儲存。';const note=document.createElement('span');note.className='render-mode sr-only';note.textContent='簡化 3D · SVG';area.append(note);}
if(!software){renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFShadowMap;renderer.outputColorSpace=T.SRGBColorSpace;renderer.setClearColor(0x000000,0);}area.append(renderer.domElement);$('loading').remove();renderer.domElement.setAttribute('aria-hidden','true');
const scene=new T.Scene(),camera=new T.OrthographicCamera(-4.5,4.5,4, -4,.1,60);camera.position.set(5.8,5.3,8.2);camera.lookAt(0,1,0);scene.add(new T.HemisphereLight(0xfff9df,0x9cbaaa,software?.65:2.4));const sun=new T.DirectionalLight(0xffefd0,software?.65:3.1);sun.name='window-sunlight';sun.position.set(-2.15,4.38,-5.04);sun.target.position.set(-.65,.38,-.04);scene.add(sun.target);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);sun.shadow.radius=2.75;sun.shadow.camera.left=-5;sun.shadow.camera.right=5;sun.shadow.camera.top=5;sun.shadow.camera.bottom=-5;sun.shadow.bias=-.00005;sun.shadow.normalBias=.002;scene.add(sun);scene.add(new T.AmbientLight(0xf0f0ed,.48));
// Single camera, continuously varying lens. The normalized perspective matrix
// shares w=1 with the orthographic matrix on the final focus plane.
let performanceLens=0,performanceLensFov=50.18,performanceLensDistance=2.925;
function blendCameraProjection(cam,amount,fov,distance){
 if(amount<=0)return;
 const n=cam.near,f=cam.far,aspect=(cam.right-cam.left)/(cam.top-cam.bottom),top=n*Math.tan(T.MathUtils.degToRad(fov)*.5),right=top*aspect;
 const perspective=new T.Matrix4().makePerspective(-right,right,top,-top,n,f).multiplyScalar(1/distance);
 for(let i=0;i<16;i++)cam.projectionMatrix.elements[i]=T.MathUtils.lerp(cam.projectionMatrix.elements[i],perspective.elements[i],amount);
 cam.projectionMatrixInverse.copy(cam.projectionMatrix).invert();
}
const roomProjectionUpdate=camera.updateProjectionMatrix.bind(camera);
camera.updateProjectionMatrix=()=>{roomProjectionUpdate();blendCameraProjection(camera,performanceLens,performanceLensFov,performanceLensDistance);};
const mats=new Map();function mat(c,rough=.85){const key=c+':'+rough;if(!mats.has(key))mats.set(key,new T.MeshStandardMaterial({color:c,roughness:rough}));return mats.get(key);}
function mesh(geo,color,x,y,z,parent=scene){const o=new T.Mesh(geo,mat(color));o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;}
function ball(x,y,z,sx,sy,sz,c,p=scene){const o=mesh(new T.SphereGeometry(1,24,16),c,x,y,z,p);o.scale.set(sx,sy,sz);return o;}
function box(x,y,z,w,h,d,c,p=scene){return mesh(new T.BoxGeometry(w,h,d,Math.max(1,Math.ceil(w*4)),Math.max(1,Math.ceil(h*4)),Math.max(1,Math.ceil(d*4))),c,x,y,z,p);}
function cylinder(x,y,z,rt,rb,h,c,p=scene){return mesh(new T.CylinderGeometry(rt,rb,h,24),c,x,y,z,p);}
function rod(a,b,r,c,p=scene){const v=new T.Vector3(...b).sub(new T.Vector3(...a));const o=mesh(new T.CylinderGeometry(r,r,v.length(),12),c,...a,p);o.position.addScaledVector(v,.5);o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),v.normalize());return o;}
function ring(x,y,z,r,t,c,p=scene){return mesh(new T.TorusGeometry(r,t,8,24),c,x,y,z,p);}
// Five small, deterministic room swatches, baked once. No image downloads,
// screen filters, bump passes or per-frame texture updates. SVG keeps base tones.
const roomTextures=new Map(),roomTextureScales=new Map(),roomMaterials=new Map();
function roomFinish(o,kind,repeatX=1,repeatY=1){
 if(typeof document==='undefined'||(typeof software!=='undefined'&&software))return o;
 let texture=roomTextures.get(kind);
 if(!texture){
  const c=document.createElement('canvas');c.width=c.height=128;const g=c.getContext('2d');
  g.fillStyle='#ffffff';g.fillRect(0,0,128,128);
  let n=531;const rand=()=>{n=(Math.imul(n,1664525)+1013904223)>>>0;return n/4294967296;};
  // BEGIN INTERIOR MATERIAL SWATCHES
  if(kind==='boards'||kind==='desk-oil'){
   const dark=kind==='desk-oil';const base=g.createLinearGradient(0,0,128,0);
   [[0,'#f4eadd'],[.18,'#fffaf0'],[.42,dark?'#e8d6bf':'#f8ebd7'],[.73,'#fff9ed'],[1,'#f3e5cc']].forEach(([x,c])=>base.addColorStop(x,c));
   g.fillStyle=base;g.fillRect(0,0,128,128);
   const knotX=36+rand()*45,knotY=38+rand()*43;
   for(let j=0;j<(dark?44:32);j++){
    const x=rand()*128,curve=(rand()-.5)*(dark?8:4),wave=rand()*6;
    g.strokeStyle='rgba(81,54,35,'+(.022+rand()*(dark?.19:.112))+')';
    g.lineWidth=.40+rand()*(dark?1.05:.69);
    g.beginPath();
    for(let y=0;y<=128;y+=5){
     const radius=Math.exp(-(((y-knotY)/23)**2))*Math.exp(-Math.abs(x-knotX)/17);
     const xx=x+curve*Math.sin(y*.041+wave)+(x<knotX?-1:1)*radius*(dark?8:5);
     if(!y)g.moveTo(xx,y);else g.lineTo(xx,y);
    }
    g.stroke();
   }
   for(let j=0;j<5;j++){
    g.strokeStyle='rgba(99,66,41,'+(dark?.078:.046)+')';g.lineWidth=.6;
    g.beginPath();g.ellipse(knotX,knotY,1.8+j*1.8,5+j*3.8,.16,j*.35,Math.PI*1.82+j*.26);g.stroke();
   }
  }else if(kind==='limewash'){
   // Baked chalk and pigment, not a continuous noise shader. All layers
   // wrap at both axes so the same wall material can continue into its cap.
   g.fillStyle='#fbf7ec';g.fillRect(0,0,128,128);
   const wrap=(x,y,extent,stamp)=>{
    for(const u of [x,x<extent?x+128:x>128-extent?x-128:null])
     for(const v of [y,y<extent?y+128:y>128-extent?y-128:null])
      if(u!==null&&v!==null)stamp(u,v);
   };
   function wash(x,y,rx,ry,angle,pigment,alpha){
    wrap(x,y,Math.max(rx,ry),(u,v)=>{
     g.save();g.translate(u,v);g.rotate(angle);g.scale(rx,ry);
     const soft=g.createRadialGradient(-.13,.07,.025,0,0,1);
     soft.addColorStop(0,'rgba('+pigment+','+alpha+')');
     soft.addColorStop(.49,'rgba('+pigment+','+(alpha*.47)+')');
     soft.addColorStop(1,'rgba('+pigment+',0)');
     g.fillStyle=soft;g.fillRect(-1,-1,2,2);g.restore();
    });
   }
   // Broad, barely coloured warm/cool openings between broken trowel strokes.
   for(const [x,y,rx,ry,angle,ink,alpha] of [
    [22,27,40,27,.42,'203,180,146',.16],[91,40,41,33,-.62,'236,224,193',.61],
    [74,99,41,30,.31,'186,183,153',.23],[124,82,36,21,-.34,'255,253,235',.82],
    [35,113,39,19,-.63,'233,209,176',.43],[103,123,38,21,.18,'189,175,145',.21],
    [51,62,41,32,-.48,'255,255,241',.73]
   ])wash(x,y,rx,ry,angle,ink,alpha);
   for(let i=0;i<53;i++){
    const x=rand()*128,y=rand()*128,rx=4+rand()*12,ry=2+rand()*5,angle=rand()*Math.PI;
    const light=i%3!==0;
    wash(x,y,rx,ry,angle,light?'255,255,245':'177,163,135',light?.29:.135);
   }
   // A sparse finish of dry, embedded pinholes instead of etched seams.
   for(let i=0;i<340;i++){
    const x=rand()*128,y=rand()*128,r=.22+rand()*.55;
    g.fillStyle=i%4?'#7762461b':'#fffff76e';
    wrap(x,y,r,(u,v)=>{g.beginPath();g.arc(u,v,r,0,Math.PI*2);g.fill();});
   }
  }else if(kind==='window-enamel'||kind==='joinery-oil'){
   const painted=kind==='window-enamel',wash=g.createLinearGradient(0,0,128,0);
   const shades=painted?['#e1d5bb','#f9f0da','#fff8e4','#f5ecd2','#dac8a9']:['#cdb292','#e2c5a3','#f0d7b7','#d7baa0','#c3a083'];
   [0,.14,.52,.85,1].forEach((at,i)=>wash.addColorStop(at,shades[i]));
   g.fillStyle=wash;g.fillRect(0,0,128,128);
   const knotX=41,knotY=72;
   for(let j=0;j<(painted?27:45);j++){
    const x=rand()*128,phase=rand()*6,bend=.6+rand()*(painted?1:3.2),strength=.045+rand()*(painted?.11:.19);
    g.strokeStyle='rgba(108,76,50,'+strength+')';g.lineWidth=.5+rand()*.77;
    g.beginPath();
    for(let y=0;y<=128;y+=4){
     const curl=painted?0:Math.exp(-(((y-knotY)/19)**2)-Math.abs(x-knotX)/15)*Math.sign(x-knotX)*5;
     const xx=x+bend*Math.sin(phase+y*Math.PI/64)+curl;
     if(y===0)g.moveTo(xx,y);else g.lineTo(xx,y);
    }
    g.stroke();
   }
   if(!painted)for(let i=0;i<3;i++){
    g.strokeStyle=i===0?'#805d4295':'#ad866d73';g.lineWidth=.8;
    g.beginPath();g.ellipse(knotX,knotY,1.4+i*1.3,4+i*3,.18,i*.40,Math.PI*1.78);g.stroke();
   }
   // Local rubbed highlights, then tiny dry-brush interruptions at joinery.
   for(let i=0;i<(painted?24:32);i++){
    const at=rand(),x=6+at*115,y=rand()*117,w=.55+rand()*1.15,h=2+rand()*8;
    g.fillStyle=i%4?'#fff9dd5c':'#8e755039';g.fillRect(x,y,w,h);
   }
  }else if(kind==='rug-medallion'){
   // One authored textile for the whole ellipse. Ink-dyed yarn feels
   // softer than a repeated grid; keep the center quiet for the avatars.
   const size=256,mid=size/2;c.width=c.height=size;
   const wash=g.createRadialGradient(mid,mid,15,mid,mid,128);
   [[0,'#f7edcc'],[.46,'#eee7c6'],[.67,'#d6d4ac'],[.8,'#b4bd93'],[1,'#969a71']].forEach(([at,col])=>wash.addColorStop(at,col));
   g.fillStyle=wash;g.fillRect(0,0,size,size);
   const ringYarn=(radius,width,color)=>{
    g.beginPath();g.arc(mid,mid,radius,0,Math.PI*2);g.lineWidth=width;g.strokeStyle=color;g.stroke();
   };
   ringYarn(121,3,'#e4dbb5');ringYarn(113,2,'#757d59');ringYarn(102,1.3,'#ece3ba');
   ringYarn(82,1.2,'#969572');ringYarn(51,1,'#b2a681');
   // Pair opposing leaf stitches without noisy one-pixel checkerboard tiles.
   for(let i=0;i<24;i++){
    g.save();g.translate(mid,mid);g.rotate(i*Math.PI/12);
    g.fillStyle=i%3===0?'#b28b67':'#d9cfab';
    g.beginPath();g.moveTo(-4,102);g.quadraticCurveTo(1,106,4,110);g.quadraticCurveTo(-1,111,-4,102);g.fill();
    g.restore();
   }
   for(let i=0;i<8;i++){
    g.save();g.translate(mid,mid);g.rotate(i*Math.PI/4);
    g.strokeStyle='#ae946e';g.lineWidth=1.2;
    g.beginPath();g.moveTo(0,25);g.quadraticCurveTo(-11,39,0,60);g.quadraticCurveTo(11,39,0,25);g.stroke();
    g.restore();
   }
   ringYarn(16,1.7,'#a48a68');
   for(let i=0;i<2200;i++){
    const x=rand()*size,y=rand()*size;
    g.fillStyle=i%3?'#5446380e':'#fffae72b';g.fillRect(x,y,.5+rand()*3,.5+rand()*.7);
   }
  }else if(kind==='soft-brass'){
   const sheen=g.createLinearGradient(0,0,128,0);
   [[0,'#c4a979'],[.21,'#eadbbe'],[.39,'#fbf4dc'],[.57,'#e4d0a7'],[.81,'#c7af83'],[1,'#f1e6cd']].forEach(([x,c])=>sheen.addColorStop(x,c));
   g.fillStyle=sheen;g.fillRect(0,0,128,128);
   for(let y=8;y<128;y+=8){g.fillStyle='#7f68441e';g.fillRect(0,y+rand()*2,128,.65);}
  }else
  // END INTERIOR MATERIAL SWATCHES
  if(kind==='oak'||kind==='walnut'){
   for(let j=0;j<25;j++){const y=rand()*128;g.strokeStyle='rgba(91,62,33,'+(.03+rand()*.09)+')';g.lineWidth=.5+rand()*.8;g.beginPath();g.moveTo(0,y);for(let x=0;x<=128;x+=8)g.lineTo(x,y+Math.sin(x*.045+j)*(.6+rand()*1.8));g.stroke();}
   for(let j=0;j<2;j++){g.strokeStyle='rgba(105,71,38,.10)';g.beginPath();g.ellipse(25+j*72,32+j*57,13,2.8,0,0,Math.PI*2);g.stroke();}
  }else if(kind==='linen'||kind==='woven'){
   for(let i=0;i<128;i+=4){g.fillStyle='rgba(98,81,59,.055)';g.fillRect(i,0,1,128);g.fillRect(0,i,128,1);}
   if(kind==='woven')for(let y=0;y<128;y+=16)for(let x=0;x<128;x+=16){g.fillStyle='rgba(130,110,76,.06)';g.fillRect(x+(y%32?8:0),y,7,7);}
  }else{
   for(let i=0;i<700;i++){g.fillStyle='rgba(110,107,78,'+(.018+rand()*.035)+')';g.fillRect(rand()*128,rand()*128,1+rand()*3,1+rand()*2);}
  }
  texture=new T.CanvasTexture(c);texture.colorSpace=T.SRGBColorSpace;texture.wrapS=texture.wrapT=T.RepeatWrapping;texture.anisotropy=2;roomTextures.set(kind,texture);
 }
 // Clone a bounded swatch per distinct material scale, never per frame.
 const scaleKey=kind+':'+repeatX+':'+repeatY;let map=roomTextureScales.get(scaleKey);if(!map){map=texture.clone();map.repeat.set(repeatX,repeatY);map.needsUpdate=true;roomTextureScales.set(scaleKey,map);}
 const materialKey=o.material.color.getHexString()+':'+scaleKey;let finish=roomMaterials.get(materialKey);if(!finish){finish=o.material.clone();finish.map=map;finish.roughness=kind==='walnut'?.72:.93;roomMaterials.set(materialKey,finish);}o.material=finish;o.name=o.name||'room-finish-'+kind;
 return o;
}
// Batch only static room detail that has no station or animated descendants.
// Geometry is transformed once; each color/texture group remains a single draw.
function batchRoomDetails(parts,name){
 const groups=new Map();for(const o of parts){const key=o.material.uuid;if(!groups.has(key))groups.set(key,[]);groups.get(key).push(o);}
 for(const items of groups.values()){
  const attrs={position:[],normal:[],uv:[]};
  for(const o of items){o.updateMatrix();const geo=o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone();geo.applyMatrix4(o.matrix);
   for(const key of Object.keys(attrs)){const a=geo.getAttribute(key);attrs[key].push(...a.array);}
   o.parent.remove(o);geo.dispose();o.geometry.dispose();
  }
  const geo=new T.BufferGeometry();for(const[key,values]of Object.entries(attrs))geo.setAttribute(key,new T.Float32BufferAttribute(values,key==='uv'?2:3));
  const m=new T.Mesh(geo,items[0].material);m.name=name;m.receiveShadow=true;m.castShadow=false;scene.add(m);
 }
}
// Open, sunny miniature set. All materials are local procedural swatches.
box(0,-.16,0,6.2,.3,4.9,'#c9b48e');roomFinish(box(0,-.015,0,6.1,.06,4.8,'#e5d2af'),'oak',3,3);
// Wide honey-oak boards with staggered, quiet joints and restrained variation.
const floorDetails=[];for(let col=0;col<11;col++)for(let row=0;row<4;row++){
 const x=-2.75+col*.55,z=-1.8+row*1.2,colors=['#e2cba5','#e8d3af','#dfc69e','#e5cfaa'];
 const plank=box(x,.017,z,.54,.004,1.188,colors[(col*3+row)%4]);plank.castShadow=false;roomFinish(plank,'oak',.65,1.5);floorDetails.push(plank);
}
batchRoomDetails(floorDetails,'handcrafted-oak-boards');
// Rendered walls sit exactly on the finished floor (top y=.015).
const FLOOR_TOP=.015;
const rearWall=box(0,FLOOR_TOP+3.1/2,-2.35,6.2,3.1,.13,'#c4d1b2');rearWall.name='rear-wall-grounded';rearWall.castShadow=false;if(software)rearWall.renderOrder=-20;
const sideWall=box(-3.05,FLOOR_TOP+1.55/2,0,.12,1.55,4.7,'#d7ddc2');sideWall.name='side-wall-grounded';roomFinish(rearWall,'plaster',5,3);roomFinish(sideWall,'plaster',4,2);
// A low shadow-only sill keeps a short attached contact shadow on the real floor receiver.
const wallCaster=box(0,FLOOR_TOP+.14/2,-2.35,6.2,.14,.13,'#c4d1b2');wallCaster.name='rear-wall-shadow-proxy';wallCaster.material=wallCaster.material.clone();wallCaster.material.colorWrite=false;wallCaster.material.depthWrite=false;wallCaster.material.shadowSide=T.DoubleSide;wallCaster.receiveShadow=false;wallCaster.raycast=()=>{};if(software)wallCaster.visible=false;
const rearSkirting=box(0,FLOOR_TOP+.095,-2.245,6.12,.19,.13,'#dddcc3');rearSkirting.name='rear-wall-base';
const sideSkirting=box(-2.955,FLOOR_TOP+.095,0,.13,.19,4.7,'#dddcc3');sideSkirting.name='side-wall-base';
for(const o of[rearSkirting,sideSkirting])o.castShadow=false;
// Tiny moulding and inset panels lend the miniature an intentional joinery.
box(0,.235,-2.16,6.08,.025,.025,'#eee6cb').castShadow=false;
box(-2.89,.235,0,.025,.025,4.65,'#eee6cb').castShadow=false;
for(const x of[.45,1.05,1.65,2.25,2.85])box(x,.55,-2.275,.012,.58,.012,'#b6c3a4').castShadow=false;
// South-centred doorway and supported plank landing, visibly beyond the room.
const roomExit=new T.Group();roomExit.name='town-exit-corridor';scene.add(roomExit);
for(const x of[-.67,.67]){roomFinish(box(x,.93,2.24,.13,1.83,.18,'#b7986e',roomExit),'oak');box(x,.93,2.13,.035,1.83,.035,'#e4cc9b',roomExit);}
roomFinish(box(0,1.89,2.24,1.47,.15,.18,'#b7986e',roomExit),'oak');
box(0,-.16,2.66,1.38,.30,1.20,'#c9b48e',roomExit);
for(let i=0;i<9;i++)roomFinish(box(0,.026,1.74+i*.16,1.20,.018,.155,i%2?'#ceb38b':'#dcc398',roomExit),'oak');
box(0,.028,1.66,1.22,.022,.035,'#e8d5ac',roomExit);
for(const[x,z,w,d]of[[0,2.72,.035,.24],[-.05,2.81,.035,.09],[.05,2.81,.035,.09]])box(x,.039,z,w,.006,d,'#8b7958',roomExit);
const exitLeaf=new T.Group();exitLeaf.position.set(-.58,0,2.24);exitLeaf.name='music-room-door-leaf';roomExit.add(exitLeaf);
roomFinish(box(.57,.92,0,1.14,1.72,.07,'#91a68a',exitLeaf),'oak');
for(const y of[.49,1.24]){box(.57,y,.045,.88,.55,.035,'#b4c4a3',exitLeaf);box(.57,y,.067,.72,.39,.012,'#9eb492',exitLeaf);}
box(.99,.96,.09,.07,.07,.07,'#c9ac68',exitLeaf);
exitLeaf.rotation.y=0;
roomExit.traverse(o=>{if(o.isMesh)o.userData.station='exit';});
// Literal low cross-section, retaining source material/maps and bottom UVs.
const doorCutaway=new T.Group();doorCutaway.name='door-low-cutaway';scene.add(doorCutaway);
function doorBottomSlice(source,height,bottom,parent){
 const p=source.geometry.parameters,geometry=new T.BoxGeometry(p.width,height,p.depth),uv=geometry.attributes.uv;
 for(const face of[0,1,4,5])for(let i=face*4;i<face*4+4;i++)uv.setY(i,(bottom-(source.position.y-p.height/2)+uv.getY(i)*height)/p.height);
 const o=new T.Mesh(geometry,source.material);o.position.copy(source.position);o.position.y=bottom+height/2;o.castShadow=false;o.receiveShadow=source.receiveShadow;o.raycast=()=>{};parent.add(o);return o;
}
const fullDoorParts=roomExit.children.filter(o=>o.isMesh&&o.position.y+(o.geometry.parameters?.height||0)/2>.3);
for(const x of[-.67,.67]){const original=fullDoorParts.find(o=>Math.abs(o.position.x-x)<.001&&o.geometry.parameters.height===1.83);doorBottomSlice(original,.14,.04,doorCutaway);}
const lowLeaf=new T.Group();lowLeaf.position.copy(exitLeaf.position);doorCutaway.add(lowLeaf);doorBottomSlice(exitLeaf.children[0],.12,.06,lowLeaf);
exitLeaf.traverse(o=>{if(o.isMesh)fullDoorParts.push(o);});
// Never fade shared furniture finishes or the low section's original materials.
const doorFadeMaterials=new Map();
for(const o of fullDoorParts){o.userData.fullDoorRaycast=o.raycast;let material=doorFadeMaterials.get(o.material);if(!material){material=o.material.clone();doorFadeMaterials.set(o.material,material);}o.material=material;}
let doorFullness=1,doorWantsFull=true;
function tickDoorCutaway(dt){
 if(doorArrival||pendingStation==='exit'||exitNavigating)doorWantsFull=true;
 else if(Math.abs(pos.x)<.95&&pos.z>1.38)doorWantsFull=true;
 else if(Math.abs(pos.x)>1.2||pos.z<1.12)doorWantsFull=false;
 const target=doorWantsFull?1:0;
 // A cancelled approach closes during the same fade, never leaving an ajar low slice.
 if(!doorWantsFull)exitLeaf.rotation.y=reduced.matches?0:Math.max(0,exitLeaf.rotation.y-dt*Math.PI*.49/.24);
 doorFullness=reduced.matches?target:doorFullness+Math.max(-dt/ .24,Math.min(dt/ .24,target-doorFullness));
 if(Math.abs(doorFullness-target)<.001)doorFullness=target;
 exitHitBounds.max.y=doorWantsFull?1.98:.20;
 for(const o of fullDoorParts){o.raycast=doorWantsFull?o.userData.fullDoorRaycast:()=>{};o.visible=doorFullness>0;o.material.transparent=doorFullness<1;o.material.opacity=doorFullness;o.material.depthWrite=doorFullness===1;}
 // The matching opaque lower section stays grounded while the tall part fades.
 doorCutaway.visible=doorFullness<1;lowLeaf.rotation.y=exitLeaf.rotation.y;
}
const cameFromTown=new URL(location.href).searchParams.get('from')==='town';
if(cameFromTown){const u=new URL(location.href);u.searchParams.delete('from');history.replaceState(history.state,'',u);}
let exitArmed=!cameFromTown,exitNavigating=false;
// Door travel replaces this history entry immediately; no opaque page veil.
function transferDoor(navigate){
 try{navigate();}catch{resetDoorTravel();}
}
function resetDoorTravel(){exitNavigating=false;exitArmed=false;}
window.addEventListener('pagehide',resetDoorTravel);
window.addEventListener('pageshow',e=>{if(e.persisted)resetDoorTravel();});

function leaveRoom(){if(exitNavigating)return;exitNavigating=true;transferDoor(()=>location.replace('../?from=room'));}
// Window: one local coordinate system and a shared arched aperture.
const windowGroup=new T.Group();windowGroup.position.set(-1.25,1.1,-2.12);scene.add(windowGroup);
const WINDOW_APERTURE={half:.76,spring:.93,outerHalf:.87,sill:.025};
function windowProfile(half,bottom){const p=new T.Shape();p.moveTo(-half,bottom);p.lineTo(half,bottom);p.lineTo(half,WINDOW_APERTURE.spring);p.absarc(0,WINDOW_APERTURE.spring,half,0,Math.PI,false);p.lineTo(-half,bottom);p.closePath();return p;}
const windowOuter=windowProfile(WINDOW_APERTURE.outerHalf,0),windowAperture=windowProfile(WINDOW_APERTURE.half,.1);
const apertureHole=new T.Path();apertureHole.moveTo(-.76,.1);apertureHole.lineTo(-.76,.93);apertureHole.absarc(0,.93,.76,Math.PI,0,true);apertureHole.lineTo(.76,.1);apertureHole.closePath();windowOuter.holes.push(apertureHole);
const windowFrame=mesh(new T.ExtrudeGeometry(windowOuter,{depth:.08,bevelEnabled:false,curveSegments:32}),'#f4edcf',0,0,.04,windowGroup);
windowFrame.name='window-continuous-frame';windowFrame.renderOrder=7;
function windowLayer(shape,color,z,name){const o=new T.Mesh(new T.ShapeGeometry(shape,32),new T.MeshBasicMaterial({color,side:T.DoubleSide}));o.position.z=z;o.renderOrder=1+z*100;o.name=name;windowGroup.add(o);return o;}
const directWindowSky=windowLayer(windowAperture,'#a5cfca',0,'window-sky');
const windowSun=new T.Shape();windowSun.absarc(-.3,1.17,.16,0,Math.PI*2);const fixedWindowSun=windowLayer(windowSun,'#fff1bd',.05,'window-sun');
// Both low hills remain wholly within the straight-sided bottom aperture.
const farHill=new T.Shape();farHill.moveTo(-.76,.1);farHill.lineTo(.76,.1);farHill.lineTo(.76,.44);farHill.bezierCurveTo(.4,.65,.18,.43,-.05,.49);farHill.bezierCurveTo(-.32,.62,-.55,.4,-.76,.46);farHill.closePath();windowLayer(farHill,'#91b8a3',.02,'window-far-hill');
const nearHill=new T.Shape();nearHill.moveTo(-.76,.1);nearHill.lineTo(.76,.1);nearHill.lineTo(.76,.25);nearHill.bezierCurveTo(.4,.39,.14,.23,-.08,.31);nearHill.bezierCurveTo(-.35,.42,-.55,.24,-.76,.3);nearHill.closePath();windowLayer(nearHill,'#7fa18c',.028,'window-near-hill');
// Bounded seeded procession: every cloud moves left-to-right, never oscillates.
function windowCloudState(t,index=0,seed=731,reduced=false){
 const time=reduced?0:Math.max(0,t),travel=time*.000038+index*1.16,lap=Math.floor(travel/2.32),phase=travel-lap*2.32;
 let n=(seed+index*977+lap*7919)>>>0;const random=()=>{n=(Math.imul(n,1664525)+1013904223)>>>0;return n/4294967296;};
 const scale=.62+random()*.42,y=.84+random()*.25,tone=random(),x=phase-1.16;
 // Fade entirely inside the arched glass before leaving; the wrap occurs while invisible.
 const half=.24*scale,top=y+.14*scale,edge=Math.sqrt(.76*.76-Math.max(0,top-.93)**2)-half-.025;
 const opacity=Math.max(0,Math.min(1,(edge-Math.abs(x))/.12))*.88;
 return{x,y,scale,tone,opacity,lap};
}
const cloudSeed=Math.floor(Math.random()*4294967296),windowClouds=[];
const cloud=new T.Shape();cloud.moveTo(.06,1.08);cloud.bezierCurveTo(.01,1.12,.07,1.2,.13,1.18);cloud.bezierCurveTo(.16,1.29,.3,1.28,.32,1.19);cloud.bezierCurveTo(.42,1.21,.47,1.09,.38,1.07);cloud.lineTo(.06,1.08);cloud.closePath();
for(let i=0;i<2;i++){const o=windowLayer(cloud,'#edf4df',.036,'window-cloud-'+i);o.geometry.translate(-.24,-1.15,0);o.material.transparent=true;o.material.depthWrite=false;windowClouds.push(o);}
function animateWindowSky(t,reduced=false){for(let i=0;i<windowClouds.length;i++){const o=windowClouds[i],p=windowCloudState(t,i,cloudSeed,reduced);o.position.x=p.x;o.position.y=p.y;o.scale.set(p.scale,p.scale,1);o.material.opacity=p.opacity;o.visible=p.opacity>0;if(o.userData.lap!==p.lap){o.userData.lap=p.lap;o.material.color.setHSL(.15,.18,.84+p.tone*.10);}}}

// Stable distant landscape. Every moving plant and cloud has its own geometry/transform.
const previewLandscape=windowLayer(windowAperture,'#ffffff',.055,'performance-rural-view');previewLandscape.visible=false;
const ruralPos=previewLandscape.geometry.attributes.position,ruralUV=previewLandscape.geometry.attributes.uv;
for(let i=0;i<ruralPos.count;i++)ruralUV.setXY(i,(ruralPos.getX(i)+.76)/1.52,(ruralPos.getY(i)-.10)/1.59);
const windowMotes=software?null:createWindowMotes(T),windowRain=software?null:createWindowRain(T,previewLandscape);
if(windowMotes)scene.add(windowMotes.points);
if(windowRain)windowGroup.add(windowRain.glassRain);
const livingLandscape=createWindowLandscape(T,previewLandscape);windowGroup.add(livingLandscape.group);livingLandscape.group.visible=false;
new T.TextureLoader().load('./rural-window.webp?v=22',tex=>{tex.colorSpace=T.SRGBColorSpace;previewLandscape.material.map=tex;previewLandscape.material.needsUpdate=true;previewLandscape.userData.ready=true;},undefined,()=>{previewLandscape.userData.ready=false;});
// Mullions are in front of every scenery layer, joined inside the same arch.
const daylightMullions=[
 box(0,.895,.085,.05,1.59,.045,'#f7eed7',windowGroup),
 box(0,.88,.085,1.52,.05,.045,'#f7eed7',windowGroup),
 box(0,.025,.13,1.94,.1,.36,'#e7d5b5',windowGroup)
];daylightMullions.forEach((o,i)=>{o.renderOrder=i===2?9:8;});
const curtainTop=WINDOW_APERTURE.spring+WINDOW_APERTURE.outerHalf+.14,curtainBottom=WINDOW_APERTURE.sill+.07;
const curtains=new T.Group();curtains.name='curtains-soft-tiebacks';windowGroup.add(curtains);
const curtainOuter=WINDOW_APERTURE.outerHalf+.26,tieY=WINDOW_APERTURE.spring-.26;
for(const side of [-1,1]){
 const firstCurtainMesh=curtains.children.length;
 const drape=new T.Shape(),sx=x=>side*x;
 drape.moveTo(sx(WINDOW_APERTURE.half-.18),curtainTop-.04);
 drape.quadraticCurveTo(sx(.77),curtainTop-.12,sx(.90),WINDOW_APERTURE.spring+.26);
 drape.bezierCurveTo(sx(.96),WINDOW_APERTURE.spring+.06,sx(1.03),tieY+.12,sx(1.02),tieY);
 drape.quadraticCurveTo(sx(.97),.40,sx(.84),curtainBottom+.05);
 drape.quadraticCurveTo(sx(.99),curtainBottom-.02,sx(curtainOuter),curtainBottom+.02);
 drape.bezierCurveTo(sx(1.10),.55,sx(curtainOuter+.05),1.15,sx(curtainOuter),curtainTop-.04);
 drape.quadraticCurveTo(sx(.89),curtainTop+.015,sx(WINDOW_APERTURE.half-.18),curtainTop-.04);drape.closePath();
 // Thick backing follows the original pulled-back silhouette; folds are genuine relief.
 const cloth=mesh(new T.ExtrudeGeometry(drape,{depth:.055,bevelEnabled:true,bevelSize:.012,bevelThickness:.009,bevelSegments:2,curveSegments:20}),'#dfcfba',0,0,.17,curtains);cloth.name='curtain-pulled-back-'+side;cloth.renderOrder=10;
 for(let n=0;n<4;n++){
  const u=(n+.5)/4,points=[];
  // Each hanging fold gathers into the same tieback, then opens into a weighted hem.
  for(let j=0;j<=24;j++){
   const t=j/24,y=curtainTop-.065-t*(curtainTop-curtainBottom-.13),above=y>=tieY;
   const v=above?(curtainTop-.065-y)/(curtainTop-.065-tieY):(tieY-y)/(tieY-curtainBottom-.065),q=Math.max(0,Math.min(1,v));
   const inner=above?.61+(.995-.61)*(1-(1-q)**2):.995-(.995-.88)*q*q;
   const outer=above?1.115-(1.115-1.085)*q:1.085+.025*q;
   const radius=(outer-inner)/4*.48;
   points.push({x:sx(inner+(outer-inner)*u),y,z:.226+Math.sin(q*Math.PI)*.009,r:Math.max(.009,radius)});
  }
  const positions=[],indices=[],radial=8;
  for(const p of points)for(let k=0;k<radial;k++){const angle=k/radial*Math.PI*2;positions.push(p.x+Math.cos(angle)*p.r,p.y,p.z+Math.sin(angle)*p.r*.95);}
  for(let j=0;j<24;j++)for(let k=0;k<radial;k++){const a=j*radial+k,b=j*radial+(k+1)%radial,c=a+radial,d=b+radial;indices.push(a,b,c,b,d,c);}
  // Closed ends keep the fabric dimensional from oblique views and SVG fallback.
  for(let k=1;k<radial-1;k++){indices.push(0,k+1,k);const end=24*radial;indices.push(end,end+k,end+k+1);}
  const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(positions,3));geometry.setIndex(indices);geometry.computeVertexNormals();
  const fold=mesh(geometry,n%2?'#ecdfcc':'#e7d7c1',0,0,0,curtains);fold.name='curtain-sculpted-fold-'+side+'-'+n;fold.renderOrder=10;
 }
 const tieCurve=new T.CatmullRomCurve3([[.985,tieY+.024,.23],[1.035,tieY+.009,.271],[1.09,tieY-.008,.247],[1.13,tieY+.012,.22]].map(([x,y,z])=>new T.Vector3(sx(x),y,z)));
 const tie=mesh(new T.TubeGeometry(tieCurve,12,.016,6,false),'#bfa36e',0,0,0,curtains);tie.name='curtain-tieback';tie.renderOrder=11;
 const tassel=rod([sx(1.12),tieY,.246],[sx(1.115),tieY-.13,.246],.009,'#bfa36e',curtains);tassel.name='curtain-tassel-cord';
 const tasselTip=mesh(new T.ConeGeometry(.024,.07,8),'#cbb583',sx(1.115),tieY-.15,.246,curtains);tasselTip.rotation.z=Math.PI;tasselTip.name='curtain-tassel';
 // Gather toward the visible rim at the tie, tapering to keep the arch and glass open.
 for(const o of curtains.children.slice(firstCurtainMesh)){
  o.updateMatrix();o.geometry.applyMatrix4(o.matrix);o.position.set(0,0,0);o.quaternion.identity();o.scale.set(1,1,1);
  const vertices=o.geometry.attributes.position;
  for(let i=0;i<vertices.count;i++){
   const y=vertices.getY(i),v=Math.max(0,Math.min(1,(y-tieY)/(curtainTop-tieY)));
   const gather=y>=tieY?.155*(1-v*v):.06+.095*Math.max(0,Math.min(1,(y-curtainBottom)/(tieY-curtainBottom)));
   vertices.setX(i,vertices.getX(i)-side*gather);
  }
  vertices.needsUpdate=true;o.geometry.computeVertexNormals();
 }


}
const curtainRod=rod([-curtainOuter-.06,curtainTop,.19],[curtainOuter+.06,curtainTop,.19],.023,'#b6a17b',curtains);curtainRod.name='curtain-rod';curtainRod.renderOrder=11;
// Cloth is decorative: no cast shadows or synthetic curtain-shadow geometry.
curtains.traverse(o=>{if(o.isMesh){o.castShadow=false;o.receiveShadow=false;}});
curtains.traverse(o=>{if(o.isMesh){
 if(o.name.startsWith('curtain-pulled')||o.name.startsWith('curtain-sculpted')){
  const a=o.geometry.attributes.position,uv=[];for(let i=0;i<a.count;i++)uv.push(a.getX(i)*2,a.getY(i)*2);o.geometry.setAttribute('uv',new T.Float32BufferAttribute(uv,2));roomFinish(o,'linen');
 }
}});
// SVG has no depth buffer: keep this backdrop below every foreground object.
if(typeof software!=='undefined'&&software)windowGroup.traverse(o=>{if(o.isMesh)o.renderOrder-=12;});
// Keep the window scenery, but no artificial pane-shaped wall/floor light motif.
windowGroup.traverse(o=>{if(o.isMesh)o.castShadow=false;});
// Wardrobe and hanging cloth, little shelf.
const wardrobeStart=scene.children.length;
box(2.1,1.02,-1.85,1.25,2,.65,'#a6805f');box(2.1,1.04,-1.5,1.1,1.77,.035,'#c3a57d');box(2.1,1.04,-1.46,.025,1.78,.02,'#907054');for(const x of [1.98,2.23])ball(x,1.08,-1.41,.035,.035,.035,'#f4d99c');box(2.1,2.07,-1.85,1.4,.13,.77,'#b2956d');
// Inset door panels and brass hinges, attached rather than floating ornaments.
for(const x of[1.82,2.38]){
 box(x,1.10,-1.43,.42,1.48,.025,'#b99a73');
 roomFinish(box(x,1.10,-1.412,.36,1.39,.018,'#c9ac82'),'walnut',1,2);
}
for(const x of[1.59,2.61])for(const y of[.56,1.53])box(x,y,-1.425,.025,.09,.016,'#b59b6d');
scene.children.slice(wardrobeStart).forEach(o=>{o.userData.station='wardrobe';if(o.isMesh&&!o.material.map&&o.geometry.type==='BoxGeometry')roomFinish(o,'walnut',1,2);});
// A small vanity with a framed oval mirror, deliberately not a reflective render pass.
const vanity=new T.Group();vanity.position.set(.65,0,-1.65);vanity.scale.setScalar(.88);scene.add(vanity);
box(0,.78,0,1.05,.12,.5,'#bc9874',vanity);box(0,.68,0,.87,.16,.4,'#d4b590',vanity);
for(const x of [-.4,.4])for(const z of [-.16,.16])rod([x,.68,z],[x,.04,z],.035,'#a98160',vanity);
// Tabletop mirror: weighted oval foot touches table y=.84; short brass neck meets frame.
const mirrorBase=ball(0,.863,-.15,.24,.026,.105,'#b59565',vanity);mirrorBase.name='mirror-tabletop-base';
const mirrorStem=rod([0,.875,-.17],[0,.96,-.17],.035,'#c7aa7a',vanity);mirrorStem.name='mirror-tabletop-stem';
const mirrorBack=ball(0,1.4,-.17,.38,.49,.045,'#c7aa7a',vanity);const mirrorGlass=ball(0,1.4,-.115,.325,.43,.012,'#b7d2cc',vanity);mirrorGlass.receiveShadow=false;mirrorGlass.material=new T.MeshBasicMaterial({color:'#c8dedb'});
// One tiny preblurred color suggestion, not a reflected scene or a second render pass.
let mirrorHint=null,mirrorCanvas=null,mirrorTexture=null;
if(!software){mirrorCanvas=document.createElement('canvas');mirrorCanvas.width=mirrorCanvas.height=128;mirrorTexture=new T.CanvasTexture(mirrorCanvas);mirrorTexture.colorSpace=T.SRGBColorSpace;mirrorHint=new T.Mesh(new T.PlaneGeometry(.62,.82),new T.ShaderMaterial({uniforms:{map:{value:mirrorTexture},opacity:{value:0},size:{value:new T.Vector2(1,1)},shift:{value:0}},transparent:true,depthWrite:false,vertexShader:'varying vec2 uvMirror;void main(){uvMirror=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',fragmentShader:'uniform sampler2D map;uniform float opacity;uniform vec2 size;uniform float shift;varying vec2 uvMirror;void main(){vec2 p=uvMirror-.5;float edge=1.-smoothstep(.91,1.,length(p*2.));vec2 q=(p-vec2(shift,0.))/size+.5;vec4 c=texture2D(map,clamp(q,0.,1.));float inside=step(0.,q.x)*step(q.x,1.)*step(0.,q.y)*step(q.y,1.);gl_FragColor=vec4(c.rgb,c.a*opacity*edge*inside);\n#include <tonemapping_fragment>\n#include <colorspace_fragment>\n}'} ));mirrorHint.position.set(0,1.39,-.09);mirrorHint.name='mirror-hazy-color-suggestion';vanity.add(mirrorHint);}else{
 mirrorHint=new T.Group();mirrorHint.name='mirror-hazy-color-suggestion';mirrorHint.position.set(0,1.39,-.09);vanity.add(mirrorHint);
 for(const[y,rx,ry]of[[.17,.17,.16],[.07,.13,.12],[-.20,.22,.15]]){const shape=new T.Shape();shape.absellipse(0,y,rx,ry,0,Math.PI*2);const o=new T.Mesh(new T.ShapeGeometry(shape,12),new T.MeshBasicMaterial({color:'#ffffff',transparent:true,opacity:0,depthWrite:false}));o.raycast=()=>{};mirrorHint.add(o);}
}
function refreshMirrorHint(){if(!mirrorHint)return;const colors=[OPTIONS.hairColor[state.hairColor],OPTIONS.skin[state.skin],OPTIONS.color[state.color]];if(software){mirrorHint.children.forEach((o,i)=>o.material.color.set(colors[i]));return;}const c=mirrorCanvas.getContext('2d');c.clearRect(0,0,128,128);c.save();c.beginPath();c.ellipse(64,64,60,61,0,0,Math.PI*2);c.clip();c.filter='blur(12px)';for(const[x,y,rx,ry,color]of[[64,29,44,43,colors[0]],[64,46,34,34,colors[1]],[64,113,58,51,colors[2]]]){c.fillStyle=color;c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.fill();}c.restore();mirrorTexture.needsUpdate=true;}
function mirrorSuggestion(x,z,facing=0,cameraX=5.8,cameraZ=8.2){
 const smooth=v=>{v=Math.max(0,Math.min(1,v));return v*v*(3-2*v);},distance=z+1.75;
 // Compressed planar projection: farther bodies are smaller and shift with viewer angle.
 const viewSlope=(cameraX-.65)/Math.max(1,cameraZ+1.75),projection=(x-.65)*.44-viewSlope*Math.max(0,distance)*.18;
 const field=1-smooth((Math.abs(projection)-.12)/.34),front=smooth(distance/.25),far=1-smooth((distance-2.8)/1.8);
 const opacity=(.10+.30/(1+Math.max(0,distance)*.8))*field*front*far,size=1.32-.22*smooth((distance-.3)/1.5)-.54*smooth((distance-1.8)/2.5);
 return{opacity,x:Math.max(-.115,Math.min(.115,projection*.38)),size,width:size*(.82+.18*Math.abs(Math.cos(facing))),tilt:Math.sin(facing)*.035};
}
function updateMirrorHint(){if(!mirrorHint)return;const p=mirrorSuggestion(pos.x,pos.z,avatar.rotation.y,camera.position.x,camera.position.z);if(software){mirrorHint.position.x=p.x*.35;mirrorHint.scale.set(Math.min(1.18,p.width),Math.min(1.12,p.size),1);mirrorHint.children.forEach(o=>o.material.opacity=p.opacity*.55);}else{mirrorHint.material.uniforms.opacity.value=p.opacity;mirrorHint.material.uniforms.size.value.set(p.width,p.size);mirrorHint.material.uniforms.shift.value=p.x/.62;}}


cylinder(.31,.89,.05,.075,.065,.16,'#dbc5a4',vanity);
// A shallow drawer front, framed lip and a fitted brass pull.
box(0,.685,.217,.73,.105,.018,'#bea07d',vanity);
box(0,.69,.232,.10,.018,.018,'#cbb17b',vanity);
vanity.traverse(o=>{o.userData.station='vanity';if(o.isMesh&&o.geometry.type==='BoxGeometry')roomFinish(o,'walnut',1,1);});
// Rug center and stitched border.
const rug=mesh(new T.RingGeometry(0,1.6,48,8),'#c4c7a4',0,.045,.45);rug.rotation.x=-Math.PI/2;rug.scale.y=.72;const rugLine=ring(0,.065,.45,1.45,.018,'#ece8cb');rugLine.rotation.x=Math.PI/2;rugLine.scale.y=.72;roomFinish(rug,'rug-medallion');
// Nested stitched border, with a muted sage edge rather than a shiny disc.
const rugEdge=ring(0,.061,.45,1.56,.012,'#a3ad8e');rugEdge.rotation.x=Math.PI/2;rugEdge.scale.y=.72;rugEdge.castShadow=false;
const stitches=[];for(let i=0;i<24;i++){const a=i/24*Math.PI*2;const stitch=box(Math.cos(a)*1.49,.068,.45+Math.sin(a)*1.49*.72,.035,.003,.012,'#e4dfc2');stitch.rotation.y=-a;stitch.castShadow=false;stitches.push(stitch);}batchRoomDetails(stitches,'rug-hand-stitching');
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
cello.scale.setScalar(.75);cello.updateMatrixWorld(true);cello.position.y+=.015-new T.Box3().setFromObject(cello).min.y;
scene.add(cello);cello.traverse(o=>{o.userData.station='cello';});
// Plant and reading stool on distant margins.
// A feathered endpin-to-lower-bout footprint follows the same sun projection.
// The pin is narrower than a shadow texel, so keep its visual connection explicit.
const celloShadowRoot=new T.Vector3(0,-.18,0).applyMatrix4((cello.updateMatrixWorld(true),cello.matrixWorld));celloShadowRoot.y=FLOOR_TOP+.0105;
const celloShadowBody=new T.Vector3(0,.35,0).applyMatrix4(cello.matrixWorld),celloRay=sun.target.position.clone().sub(sun.position);
const celloShadowEnd=celloShadowBody.clone().addScaledVector(celloRay,(FLOOR_TOP-celloShadowBody.y)/celloRay.y);celloShadowEnd.y=celloShadowRoot.y;
const celloShadowLength=Math.hypot(celloShadowEnd.x-celloShadowRoot.x,celloShadowEnd.z-celloShadowRoot.z),celloShadowBridge=new T.Group();celloShadowBridge.name='cello-projected-endpin-connection';celloShadowBridge.position.copy(celloShadowRoot).lerp(celloShadowEnd,.5);celloShadowBridge.rotation.y=Math.atan2(celloShadowEnd.x-celloShadowRoot.x,celloShadowEnd.z-celloShadowRoot.z);scene.add(celloShadowBridge);
if(!software){const c=document.createElement('canvas');c.width=64;c.height=128;const g=c.getContext('2d');g.filter='blur(5px)';const fade=g.createLinearGradient(0,128,0,0);fade.addColorStop(0,'rgba(65,63,51,.42)');fade.addColorStop(.42,'rgba(65,63,51,.31)');fade.addColorStop(1,'rgba(65,63,51,.12)');g.fillStyle=fade;g.beginPath();g.moveTo(27,122);g.quadraticCurveTo(22,68,11,5);g.lineTo(53,5);g.quadraticCurveTo(42,68,37,122);g.closePath();g.fill();const o=new T.Mesh(new T.PlaneGeometry(.19,celloShadowLength+.08),new T.MeshBasicMaterial({map:new T.CanvasTexture(c),transparent:true,depthWrite:false,side:T.DoubleSide,polygonOffset:true,polygonOffsetFactor:-1}));o.rotation.x=Math.PI/2;o.raycast=()=>{};celloShadowBridge.add(o);}else{const p=new T.Shape();p.moveTo(-.012,-celloShadowLength/2);p.lineTo(.012,-celloShadowLength/2);p.lineTo(.065,celloShadowLength/2);p.lineTo(-.065,celloShadowLength/2);p.closePath();const o=new T.Mesh(new T.ShapeGeometry(p),new T.MeshBasicMaterial({color:'#777260',transparent:true,opacity:.12,depthWrite:false,side:T.DoubleSide}));o.rotation.x=Math.PI/2;o.raycast=()=>{};celloShadowBridge.add(o);}

// Endpin already intersects the floor; this tiny contact cue restores its sub-texel occlusion.
// Preserve this deeper point contact below the softly connected projected footprint.
const pinContact=new T.Group();pinContact.name='cello-endpin-contact';pinContact.position.set(-2.27+Math.tan(-.12)*(.2-FLOOR_TOP),FLOOR_TOP+.001,-1.4);scene.add(pinContact);
if(!software){const c=document.createElement('canvas');c.width=c.height=32;const g=c.getContext('2d'),fade=g.createRadialGradient(16,16,0,16,16,16);fade.addColorStop(0,'rgba(63,61,50,.42)');fade.addColorStop(.28,'rgba(63,61,50,.25)');fade.addColorStop(1,'rgba(63,61,50,0)');g.fillStyle=fade;g.fillRect(0,0,32,32);const map=new T.CanvasTexture(c),o=new T.Mesh(new T.PlaneGeometry(.072,.072),new T.MeshBasicMaterial({map,transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1}));o.rotation.x=-Math.PI/2;o.raycast=()=>{};pinContact.add(o);}else{for(const[r,opacity]of[[.028,.06],[.013,.12]]){const o=new T.Mesh(new T.CircleGeometry(r,16),new T.MeshBasicMaterial({color:'#565349',transparent:true,opacity,depthWrite:false}));o.rotation.x=-Math.PI/2;o.raycast=()=>{};pinContact.add(o);}}


function plant(x,z,variant=0){const start=scene.children.length;const pot=variant?'#ba927e':'#c7b49a';cylinder(x,.27,z,variant?.20:.24,variant?.16:.18,.48,pot);cylinder(x,.51,z,variant?.205:.245,variant?.205:.245,.035,pot);cylinder(x,.53,z,.18,.18,.012,'#776c4d');for(let n=0;n<(variant?8:6);n++){const a=n*2.4,r=variant?.19:.23,y=variant?.84+(n%3)*.13:.78+(n%2)*.10;rod([x,.53,z],[x+Math.cos(a)*r,y,z+Math.sin(a)*r],.012,'#7d946e');const leaf=ball(x+Math.cos(a)*r,y,z+Math.sin(a)*r,variant?.085:.14,variant?.27:.24,.065,n%2?'#839d75':'#a1b58b');leaf.rotation.z=Math.cos(a)*(variant?.5:.7);leaf.rotation.y=-a;}const group=new T.Group();group.position.set(x,0,z);for(const o of scene.children.slice(start)){o.position.x-=x;o.position.z-=z;group.add(o);}scene.add(group);return group;}const eastFloorPlant=plant(2.5,.65);const westFloorPlant=plant(-2.6,1.3,1);westFloorPlant.name='west-floor-plant';
// BEGIN SIDE TABLE MANUSCRIPT
// A low wood table replaces the two decorative towels at the same room edge.
const scoreTable=new T.Group();scoreTable.name='score-side-table';
scoreTable.position.set(2.15,FLOOR_TOP,1.55);scene.add(scoreTable);
box(0,.57,0,.74,.065,.54,'#b18a62',scoreTable);
box(0,.521,0,.66,.045,.47,'#947050',scoreTable);
box(0,.463,.185,.57,.092,.110,'#a27b55',scoreTable);
box(0,.463,.244,.51,.068,.014,'#b7926a',scoreTable);
box(0,.462,.262,.091,.016,.025,'#cdb386',scoreTable);
for(const x of [-.287,.287])for(const z of [-.192,.192]){
 rod([x,.525,z],[x*1.04,.026,z*1.04],.028,'#8f6c4b',scoreTable);
 box(x,.028,z,.066,.050,.066,'#997653',scoreTable);
}
const SCORE_TABLE_FOOTPRINT={minX:1.64,maxX:2.66,minZ:1.12,maxZ:1.98};
// Geometry renders the ink even in the SVG fallback; it is not a playable transcription.
const manuscriptAccess=$('manuscript-access'),manuscriptObservation=$('manuscript-observation');
const manuscript=new T.Group();manuscript.name=manuscriptObservation.dataset.discoveryId;
manuscript.position.set(-.015,.611,.008);manuscript.rotation.y=-.13;scoreTable.add(manuscript);
const wornShape=new T.Shape();
const wornOutline=[[-.196,-.100],[-.12,-.107],[-.047,-.103],[.036,-.109],[.118,-.104],[.177,-.108],[.194,-.085],[.191,-.012],[.199,.063],[.194,.078],[.145,.109],[.058,.106],[-.023,.112],[-.096,.107],[-.168,.109],[-.198,.083],[-.192,.042],[-.200,-.022]];
wornOutline.forEach(([x,z],i)=>i?wornShape.lineTo(x,-z):wornShape.moveTo(x,-z));wornShape.closePath();
const oldSheet=mesh(new T.ShapeGeometry(wornShape),'#d3b77d',0,.006,0,manuscript);
oldSheet.rotation.x=-Math.PI/2;oldSheet.receiveShadow=false;
const manuscriptNotehead=new T.CircleGeometry(1,10);
for(let staff=0;staff<2;staff++){
 const z=-.050+staff*.080;
 for(let line=0;line<5;line++)box(line%2?.010:-.008,.009,z+line*.007,.265-(line%3)*.019,.001,.0014,line%2?'#b09769':'#b39a6c',manuscript);
 for(let i=0;i<5;i++){
  const x=-.125+i*.058,n=z+[.025,.011,.018,.008,.021][(i+staff)%5];
  const head=mesh(manuscriptNotehead,'#b39868',x,.011,n,manuscript);
  head.rotation.set(-Math.PI/2,0,-.22);head.scale.set(.009,.004,1);head.castShadow=false;
  box(x+.007,.011,n-.011,.0016,.001,.022,'#b29b72',manuscript);
 }
}
const manuscriptProjection=new T.Vector3(), manuscriptSpot={x:1.47,z:1.36};
const readingDialog=manuscriptObservation, readingPaper=$('manuscript-paper'),readingClose=$('manuscript-close');
let reading=null, paperMotion=null;
function manuscriptScreen(cam=camera){
 cam.updateMatrixWorld();
 manuscript.getWorldPosition(manuscriptProjection).project(cam);
 const bounds=area.getBoundingClientRect();
 return {x:bounds.left+(manuscriptProjection.x+1)*bounds.width/2,y:bounds.top+(1-manuscriptProjection.y)*bounds.height/2,z:manuscriptProjection.z};
}
function paperTransform(point){
 const r=readingPaper.getBoundingClientRect();
 return `translate(${point.x-r.left-r.width/2}px,${point.y-r.top-r.height/2}px) scale(.12,.05) rotate(-25deg)`;
}
function startManuscript(){
 if(reading||manuscriptAccess.hidden||previewMode||celloPerformance||watchingCat||doorArrival)return;
 release();
 reading={phase:'walking',home:{position:cameraMotion?.restoring?cameraMotion.to.clone():camera.position.clone(),zoom:cameraMotion?.restoring?cameraMotion.toZoom:camera.zoom,quaternion:cameraMotion?.restoring?cameraMotion.toQuaternion.clone():camera.quaternion.clone()}};
 if(reduced.matches){readManuscript();return;}
 destination={...manuscriptSpot};area.focus({preventScroll:true});
}
function readManuscript(){
 const source=manuscriptScreen();reading.phase='open';
 heading=Math.atan2(scoreTable.position.x-pos.x,scoreTable.position.z-pos.z);
 const probe=camera.clone(),focus=new T.Vector3(1.65,.56,1.35);
 probe.position.set(4.15,3.22,5.03);probe.lookAt(focus);
 const zoom=Math.max(1.1,Math.min(2.25,(camera.right-camera.left)/3.0,(camera.top-camera.bottom)/3.4));
 animateRoomCamera(probe.position,zoom,false,probe.quaternion,850);
 manuscript.visible=false;readingDialog.showModal();readingClose.focus({preventScroll:true});
 if(!reduced.matches&&readingPaper.animate){
  paperMotion=readingPaper.animate([
    {transform:paperTransform(source),opacity:.94},
    {transform:'translateY(12px) scale(.72) rotate(-6deg)',offset:.73},
    {transform:'none',opacity:1}
  ],{duration:760,easing:'cubic-bezier(.25,.64,.19,1)'});
 }
}
function closeManuscript(){
 if(!reading||reading.phase==='closing')return;
 if(reading.phase==='walking'){reading=null;destination=null;area.focus({preventScroll:true});return;}
 const home=reading.home;reading.phase='closing';paperMotion?.cancel();paperMotion=null;
 const probe=camera.clone();probe.position.copy(home.position);probe.quaternion.copy(home.quaternion);probe.zoom=home.zoom;probe.updateProjectionMatrix();
 animateRoomCamera(home.position,home.zoom,true,home.quaternion,450);
 const current=reading;
 const done=()=>{if(reading!==current)return;manuscript.visible=true;reading=null;if(readingDialog.open)readingDialog.close();area.focus({preventScroll:true});};
 if(reduced.matches||!readingPaper.animate){done();return;}
 paperMotion=readingPaper.animate([{transform:'none',opacity:1},{transform:paperTransform(manuscriptScreen(probe)),opacity:.92}],{duration:430,fill:'forwards',easing:'cubic-bezier(.45,0,.67,.85)'});
 paperMotion.finished.then(()=>{paperMotion.cancel();paperMotion=null;done();},done);
}
manuscriptAccess.addEventListener('click',startManuscript);
readingClose.addEventListener('click',closeManuscript);
readingDialog.addEventListener('cancel',event=>{event.preventDefault();closeManuscript();});
window.addEventListener('keydown',event=>{
 if(!reading)return;
 if(event.key==='Escape'){event.preventDefault();event.stopImmediatePropagation();closeManuscript();}
 else if(reading.phase==='walking'&&keyMap[event.key]){event.preventDefault();event.stopImmediatePropagation();}
},{capture:true});
for(const eventName of ['pointerdown','click'])area.closest('.stage').addEventListener(eventName,event=>{
 if(reading?.phase==='walking'){event.preventDefault();event.stopImmediatePropagation();}
},{capture:true});
window.addEventListener('pagehide',()=>{
 if(!reading)return;
 const {home}=reading;reading=null;paperMotion?.cancel();paperMotion=null;destination=null;
 manuscript.visible=true;if(readingDialog.open)readingDialog.close();
 cameraMotion=null;camera.position.copy(home.position);camera.quaternion.copy(home.quaternion);camera.zoom=home.zoom;camera.updateProjectionMatrix();
});
function positionManuscript(){
 if(reading?.phase==='walking'&&!destination){
  if(dist(pos,manuscriptSpot)<.03)readManuscript();
  else reading=null;
 }
 if(reading||previewMode||celloPerformance||watchingCat||doorArrival){manuscriptAccess.hidden=true;return;}
 const {x,y,z}=manuscriptScreen(),bounds=area.getBoundingClientRect(),px=x-bounds.left,py=y-bounds.top;
 if(px<22||py<22||px>bounds.width-22||py>bounds.height-22||Math.abs(z)>1){manuscriptAccess.hidden=true;return;}
 manuscriptAccess.hidden=false;
 manuscriptAccess.style.transform=`translate(${Math.round(px-22)}px,${Math.round(py-22)}px)`;
}
// END SIDE TABLE MANUSCRIPT

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
  const leftEar=ear(-1),rightEar=ear(1);const earRest=leftEar.rotation.z,rightEarRest=rightEar.rotation.z;
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
  group.userData={model:'napping-cat-procedural-006',decorative:true,animatedParts:['tail-tip','left-ear','upper-body-breath'],footprint:{x:1.22*scale,z:.94*scale},placement:'under-window'};
  const stats={meshes:parts.length,triangles:parts.reduce((n,p)=>n+(p.geometry.index?p.geometry.index.count:p.geometry.attributes.position.count)/3,0),sharedSphereInstances:parts.filter(p=>p.geometry===sphere).length};
  function animateCat(t,reduced=false){
    const seconds=Number.isFinite(t)?t*.001:0;
    // Unequal quiet intervals and brief damped flicks, deterministic and entirely transient.
    const cycle=seconds%29,windows=[[1.8,.95],[6.5,1.4],[12.8,.8],[18.2,1.2],[25,1.6]];
    let flick=0;for(const[start,duration]of windows){const u=(cycle-start)/duration;if(u>=0&&u<=1)flick+=Math.sin(u*Math.PI)*Math.sin(u*Math.PI*3)*.38;}
    tailTip.rotation.y=reduced?0:flick;
    const earPhase=(seconds+3.1)%19;
    let earPulse=0;for(const [start,duration]of[[2.2,.55],[8.4,.7],[15.1,.48]]){const u=(earPhase-start)/duration;if(u>=0&&u<=1)earPulse+=Math.sin(u*Math.PI)*.15;}
    leftEar.rotation.z=earRest+(reduced?0:earPulse);
    const rightPhase=(seconds+1.7)%23,rightPulse=rightPhase>10.2&&rightPhase<10.9?Math.sin((rightPhase-10.2)/.7*Math.PI)*.11:0;
    rightEar.rotation.z=rightEarRest-(reduced?0:rightPulse);
    const breath=reduced?0:(1+Math.sin(seconds*1.55))*.5*(.88+.12*Math.sin(seconds*.23));
    // Equal scale/height offsets hold the underside fixed while the ribs rise.
    body.scale.y=.225+breath*.018;body.position.y=.285+breath*.018;
    rump.scale.y=.205+breath*.008;rump.position.y=.27+breath*.008;
  }
  animateCat(0,true);return {group,animateCat,stats};
}

const roomCat=createNappingCat({T,mesh,ball,rod,position:[-.55,.03,-1.75]});scene.add(roomCat.group);roomCat.group.traverse(o=>{o.userData.pet='cat';});roomCat.group.userData.decorative=false;
const avatar=new T.Group();scene.add(avatar);let body,head,leftLeg,rightLeg,leftArm,rightArm,upperBody;let blinkEyes=[],faceRig=null;let pos=cameFromTown?{x:0,z:1.51}:{x:0,z:.55},heading=cameFromTown?Math.PI:0,walkPhase=0;
function disposeGroup(root){root.traverse(o=>{if(o.geometry)o.geometry.dispose();if(o.userData.ownedMaterial)o.material.dispose();});root.clear();}
// Baked local artist swatches shared by every player option. Wear and shine
// stay on the model, not the camera; SVG uses the same solid palette.
const avatarSwatches=new Map(),avatarMaterials=new Map();
function avatarFinish(mesh,kind,color){
 const rough={hair:.58,cloth:.88,shoe:.57,skin:.9}[kind], id=kind+':'+color;
 let material=avatarMaterials.get(id);
 if(!material){
  let map=null;
  if(!software&&kind!=='skin'){
   map=avatarSwatches.get(kind);
   if(!map){
    const c=document.createElement('canvas');c.width=c.height=128;const g=c.getContext('2d');
    g.fillStyle='#fffefb';g.fillRect(0,0,128,128);
    if(kind==='hair'){
     // Long curved ribbons, interleaved with finer strands; no drawn black
     // lines or hard stripes. Each hair shape retains its own UVs.
     for(let i=-3;i<35;i++){
      const x=i*4.15,k=(i*17%11)*.32,w=.46+Math.abs(Math.sin(i*2.3))*.90;
      g.beginPath();g.moveTo(x,0);g.bezierCurveTo(x+8+k,24,x-7+k,98,x,128);
      g.lineWidth=w;g.strokeStyle=i%4===0?'rgba(67,43,31,.33)':'rgba(77,50,33,.19)';g.stroke();
      if(i%3===0){g.beginPath();g.moveTo(x+1.1,0);g.bezierCurveTo(x+6,25,x-4,104,x+1.1,128);g.lineWidth=.45;g.strokeStyle='rgba(255,251,238,.55)';g.stroke();}
     }
    }else if(kind==='cloth'){
     for(let i=0;i<128;i+=5){
      g.fillStyle=i%10===0?'rgba(68,56,38,.16)':'rgba(97,85,64,.09)';
      g.fillRect(i,0,1,128);g.fillRect(0,i,128,1);
     }
     for(let y=0;y<128;y+=10)for(let x=0;x<128;x+=10){g.fillStyle='rgba(74,63,47,.075)';g.fillRect(x+(y%20?5:0),y,4,2);}
    }else{
     for(let i=0;i<240;i++){
      g.fillStyle=i%3?'rgba(75,51,37,.09)':'rgba(114,88,64,.13)';
      g.fillRect((i*47)%128,(i*73+Math.floor(i/9)*3)%128,i%4===0?3:1,1);
     }
    }
    map=new T.CanvasTexture(c);map.colorSpace=T.SRGBColorSpace;map.anisotropy=2;avatarSwatches.set(kind,map);
   }
  }
  material=new T.MeshStandardMaterial({color,map,roughness:rough,metalness:0});
  avatarMaterials.set(id,material);
 }
 mesh.material=material;return mesh;
}
function buildAvatar(state){const avatar=new T.Group();let body,head,leftLeg,rightLeg,leftArm,rightArm,upperBody;let blinkEyes=[],faceRig=null;const skin=OPTIONS.skin[state.skin],hair=OPTIONS.hairColor[state.hairColor],cloth=OPTIONS.color[state.color],upper=state.upper??state.outfit??0,lower=state.lower??state.outfit??0,shoe=state.shoes??0,legacy=Number.isInteger(state.legacyOutfit)&&state.legacyOutfit>=0&&state.legacyOutfit<4&&upper===state.legacyOutfit&&lower===state.legacyOutfit&&shoe===0?state.legacyOutfit:-1,lowerCloth=OPTIONS.lowerColor?.[state.lowerColor]??(lower===0?cloth:['', '#798c84','#b2a087','#a99b84'][lower]||'#798c84');body=new T.Group();avatar.add(body);
leftLeg=new T.Group();rightLeg=new T.Group();leftLeg.position.set(-.135,.53,0);rightLeg.position.set(.135,.53,0);body.add(leftLeg,rightLeg);for(const p of [leftLeg,rightLeg]){const knee=new T.Group(),foot=new T.Group();knee.name='leg-knee';foot.name='leg-foot';knee.position.y=-.195;foot.position.y=-.195;p.add(knee);knee.add(foot);const covered=legacy>=2?false:![0,4,7].includes(lower),legColor=covered?lowerCloth:skin,width=legacy>=0?.075:[.075,.077,.084,.072,.075,.105,.088,.075][lower];
cylinder(0,-.0975,0,width,width*.96,.195,legColor,p);cylinder(0,-.0975,0,width*.96,width*.93,.195,legColor,knee);ball(0,0,0,width+.001,.073,width,legColor,knee);if(covered){for(const limb of [p.children.at(-1),knee.children.at(-2)])if(limb?.isMesh)avatarFinish(limb,'cloth',legColor);}
if(lower===7)cylinder(0,-.055,0,.09,.094,.145,lowerCloth,p);
if(lower===6)cylinder(0,-.145,0,.094,.094,.06,'#d6c9ad',knee);
// Every shoe shares the same sole datum (-.09) and articulated ankle.
const shoeColors=['#735d4c','#6b4c40','#80614a','#eee4cc','#b88c7e','#59473b','#785b3d','#718b80'],sc=state.shoeColor>0?(OPTIONS.shoeColor[state.shoeColor]??shoeColors[shoe]):shoeColors[shoe];
const modernShoe=legacy<0;const sole=legacy>=0?ball(0,0,.065,.11,.09,.17,sc,foot):ball(0,-.026,.065,.111,.064,.171,shoe===0?sc:'#6d5b48',foot);sole.name='shoe-sole';
if(modernShoe){const shoeBody=ball(0,.004,.066,[.105,.108,.106,.112,.098,.112,.117,.119][shoe],[.060,.068,.075,.070,.049,.065,.078,.080][shoe],[.162,.164,.16,.181,.155,.172,.18,.192][shoe],sc,foot);shoeBody.name='designer-shoe-'+shoe;avatarFinish(shoeBody,'shoe',sc);}
if(shoe===0)cylinder(0,.11,0,.077,.078,.12,'#fff1d4',foot);
if(shoe===1){box(0,.064,.065,.205,.024,.045,'#d6bba0',foot);ball(.097,.068,.061,.015,.014,.013,'#d9bc80',foot);cylinder(0,.105,0,.075,.077,.09,'#fff1d4',foot);}
if(shoe===2||shoe===6){cylinder(0,.092,-.008,shoe===6?.091:.083,.091,shoe===6?.19:.17,sc,foot);ring(0,.18,-.008,.085,.009,'#b39a78',foot).rotation.x=Math.PI/2;}
if(shoe===3||shoe===7){for(const z of[.05,.085,.12])box(0,.074,z,.09,.008,.012,'#fff4db',foot);if(shoe===7)for(const x of[-.105,.105])box(x,.015,.08,.008,.025,.11,'#d4c7a9',foot);}
if(shoe===4){for(const x of[-.026,.026])ball(x,.071,.11,.032,.014,.018,'#e2baab',foot);}
if(shoe===5){box(0,.067,.09,.17,.018,.05,'#806a50',foot);box(0,.079,.09,.048,.009,.014,'#ccb37e',foot);}
if(shoe===6)for(const z of[.035,.075,.115])box(0,.079,z,.08,.009,.013,'#cfbd97',foot);
if(modernShoe){
 const trim=shoe===4?'#f0c9bf':'#e5d8b9',dark='#5a4a3d';
 // Designs wrap the toe, heel and ankle rather than decorating a generic ball.
 const toe=ring(0,.018,.074,.092,.006,trim,foot);toe.rotation.x=Math.PI/2;toe.scale.y=1.52;
 if(shoe===0){for(const x of[-.027,.027]){const petal=ball(x,.056,.143,.034,.013,.023,'#c4d1ad',foot);petal.rotation.y=x>0?.5:-.5;}ball(0,.065,.145,.012,.012,.009,'#e8c782',foot);}
 if(shoe===1){box(0,.071,.095,.184,.018,.038,sc,foot);const clasp=ring(.088,.083,.091,.018,.006,'#d3b477',foot);clasp.rotation.y=Math.PI/2;}
 if(shoe===2){cylinder(0,.157,-.008,.087,.087,.046,'#e4c8a2',foot);box(0,.182,-.065,.035,.064,.018,sc,foot);for(const y of[.085,.12])ball(.088,y,.002,.008,.009,.009,'#d1ad75',foot);}
 if(shoe===3){ball(0,.008,.19,.094,.043,.066,'#f6edda',foot);box(0,-.021,-.072,.15,.032,.022,'#cdbd9e',foot);for(const x of[-.105,.105])box(x,.023,.095,.006,.018,.093,'#aa8d73',foot);}
 if(shoe===4){for(const side of[-1,1]){const ribbon=rod([side*.075,.038,.056],[side*.025,.054,.13],.009,'#e0b1a9',foot);ribbon.name='ballet-cross-ribbon';}cylinder(0,.095,0,.078,.079,.025,'#edc7bb',foot);}
 if(shoe===5){box(0,.076,.115,.14,.011,.017,'#d2b271',foot);for(const x of[-.043,.043])rod([x,.073,.113],[x,.053,.145],.008,sc,foot);}
 if(shoe===6){cylinder(0,.178,-.008,.094,.094,.04,'#cbb18b',foot);for(const x of[-.10,.10])for(const z of[.02,.08,.14])box(x,-.035,z,.027,.035,.029,dark,foot);ball(0,.02,.18,.10,.042,.06,'#9a7952',foot);}
 if(modernShoe){
  const detail=new T.Color(sc).lerp(new T.Color('#efe4cf'),.23).getStyle();
  for(const s of [-1,1]){
   const stitches=[[-.011,.042,.202],[s*.050,.038,.192],[s*.083,.034,.159],[s*.099,.027,.117]];
   const edging=mesh(new T.TubeGeometry(new T.CatmullRomCurve3(stitches.map(x=>new T.Vector3(...x))),10,.0033,4,false),detail,0,0,0,foot);
   edging.name='shoe-toe-topstitch';edging.castShadow=false;
  }
 }
 if(shoe===7){for(const side of[-1,1])rod([side*.112,.03,.01],[side*.112,.015,.12],.012,'#e4d8bb',foot);ball(0,-.018,.20,.109,.048,.049,'#e5d8be',foot);box(0,.105,-.04,.06,.035,.014,'#d5bc87',foot);}
}

}
// Tailored continuous silhouettes; seams sit on the garment surface, not floating blocks.
let garmentProfile=[];
function surfaceZ(x,y){let z=.18*Math.sqrt(Math.max(0,1-(x/.245)**2-((y-.84)/.30)**2));for(let i=1;i<garmentProfile.length;i++){const[r0,y0]=garmentProfile[i-1],[r1,y1]=garmentProfile[i];if(y>=y0&&y<=y1){const r=r0+(r1-r0)*(y-y0)/(y1-y0||1);z=Math.max(z,.8*Math.sqrt(Math.max(0,r*r-x*x)));}}return z;}
function garment(profile,color,gather=false){garmentProfile=profile;const o=mesh(new T.LatheGeometry(profile.map(([r,y])=>new T.Vector2(r,y)),40),color,0,0,0,body);o.scale.z=.80;avatarFinish(o,'cloth',color);o.userData.avatarFabric=true;
 if(gather){
  // The long skirt gathers over bent knees; only the front hem folds, never
  // the body or limb lengths. Standing geometry is restored exactly at weight0.
  const folded=o.geometry.clone(),p=folded.attributes.position;
  for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i),front=Math.max(0,z/(Math.hypot(x,z)||1)),weight=Math.max(0,Math.min(1,(.78-y)/.35))*front;p.setXYZ(i,x,y+.24*weight,z-.025*weight);}
  folded.computeVertexNormals();o.geometry.morphAttributes.position=[p.clone()];o.geometry.morphAttributes.normal=[folded.attributes.normal.clone()];folded.dispose();o.name='crouch-dress-hem';o.updateMorphTargets();
 }return o;}
function clothPanel(points,color,z,side=1){const shape=new T.Shape();shape.moveTo(...points[0]);for(const pt of points.slice(1))shape.lineTo(...pt);shape.closePath();const base=new T.ShapeGeometry(shape),p=base.attributes.position,indices=base.index.array,verts=[];function tri(a,b,c,n){if(n){const ab=a.clone().add(b).multiplyScalar(.5),bc=b.clone().add(c).multiplyScalar(.5),ca=c.clone().add(a).multiplyScalar(.5);tri(a,ab,ca,n-1);tri(ab,b,bc,n-1);tri(ca,bc,c,n-1);tri(ab,bc,ca,n-1);}else for(const v of[a,b,c])verts.push(v.x,v.y,side*(surfaceZ(v.x,v.y)+.004));}for(let i=0;i<indices.length;i+=3)tri(...[0,1,2].map(n=>new T.Vector3().fromBufferAttribute(p,indices[i+n])),3);base.dispose();const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(verts,3));geometry.computeVertexNormals();const o=mesh(geometry,color,0,0,0,body);o.material=mat(color).clone();o.material.side=T.DoubleSide;o.userData.ownedMaterial=true;o.castShadow=false;return o;}
function seam(points,color='#e9dfc5'){const guide=new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p))),curve=new T.CatmullRomCurve3(guide.getPoints(40).map(p=>new T.Vector3(p.x,p.y,surfaceZ(p.x,p.y)+.006)));const o=mesh(new T.TubeGeometry(curve,40,.004,5,false),color,0,0,0,body);o.castShadow=false;return o;}
// Rounded cotton patch pocket: lipped opening, eased bottom corners,
 // a little volume from its lining, and fine tonal topstitch. One mesh.
function apronPocket(){
 const columns=12,rows=8,verts=[],uv=[],indices=[];
 for(let j=0;j<=rows;j++)for(let i=0;i<=columns;i++){
  const u=i/columns,v=j/rows,a=u*2-1;
  const x=a*(.112+Math.sin(Math.PI*v*.72)*.021);
  const y=.758+.141*v+.020*Math.abs(a)**3*(1-v)**3+.006*a*a*v*v;
  const padding=.004+.017*(1-a*a)*Math.sin(v*Math.PI*.87);
  verts.push(x,y,surfaceZ(x,y)+padding);uv.push(u,v);
 }
 for(let j=0;j<rows;j++)for(let i=0;i<columns;i++){
  const q=j*(columns+1)+i;indices.push(q,q+1,q+columns+1,q+1,q+columns+2,q+columns+1);
 }
 const geo=new T.BufferGeometry();
 geo.setAttribute('position',new T.Float32BufferAttribute(verts,3));
 geo.setAttribute('uv',new T.Float32BufferAttribute(uv,2));geo.setIndex(indices);geo.computeVertexNormals();
 const material=new T.MeshStandardMaterial({color:'#d1d6ae',roughness:.91,side:T.DoubleSide});
 if(!software){
  if(!avatarSwatches.has('apron-pocket')){
   const canvas=document.createElement('canvas');canvas.width=96;canvas.height=84;
   const g=canvas.getContext('2d'),shade=g.createLinearGradient(0,0,0,84);
   shade.addColorStop(0,'#f1ebd1');shade.addColorStop(.12,'#d4dabb');
   shade.addColorStop(.49,'#dee0c4');shade.addColorStop(1,'#b2be9c');
   g.fillStyle=shade;g.fillRect(0,0,96,84);
   for(let i=0;i<76;i++){
    g.fillStyle=i%2?'#faf6e325':'#71846916';g.fillRect((i*37)%96,(i*13)%84,2+(i%4),1);
   }
   g.fillStyle='#75846a';g.fillRect(0,13,96,3);g.fillStyle='#f9edcf';g.fillRect(0,8,96,3);
   g.strokeStyle='#f2e7c4';g.lineWidth=1.6;g.setLineDash([2.6,2.3]);
   g.beginPath();g.moveTo(8,22);g.lineTo(8,65);g.quadraticCurveTo(8,76,23,76);
   g.lineTo(73,76);g.quadraticCurveTo(88,76,88,65);g.lineTo(88,22);g.stroke();
   const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;
   avatarSwatches.set('apron-pocket',texture);
  }
  material.color.set('#ffffff');material.map=avatarSwatches.get('apron-pocket');
 }
 const pocket=mesh(geo,'#d1d6ae',0,0,0,body);
 pocket.material=material;pocket.name='tailored-apron-pocket';pocket.castShadow=false;pocket.userData.ownedMaterial=true;
}
function shoulderStraps(){for(const x of[-.12,.12]){const ribbon=[[x-.015,.89],[x+.015,.89],[x+.015,1.03],[x-.015,1.03]];clothPanel(ribbon,cloth,0);clothPanel(ribbon,cloth,0,-1);const ry=.30*Math.sqrt(1-(x/.245)**2),rz=.18*Math.sqrt(1-(x/.245)**2),start=Math.asin((1.03-.84)/ry),points=[];for(let i=0;i<=20;i++){const a=start+(Math.PI-2*start)*i/20;points.push(new T.Vector3(x,.84+(ry+.004)*Math.sin(a),(rz+.004)*Math.cos(a)));}const strap=mesh(new T.TubeGeometry(new T.CatmullRomCurve3(points),24,.014,6,false),cloth,0,0,0,body);strap.castShadow=false;}}
// Independent waist and lower pieces. Skirts gather with the existing crouch
// morph; trouser legs stay on the two articulated chains, never a rigid tube.
if(legacy>=0){
if(legacy>=2){cylinder(0,legacy===2?.59:.49,0,legacy===2?.23:.21,legacy===2?.25:.235,legacy===2?.13:.11,lowerCloth,body);}
else if(lower===0||lower===4){
 const skirt=garment(lower===0?[[.30,.43],[.315,.46],[.30,.55],[.265,.70],[.245,.75]]:[[.32,.44],[.33,.47],[.29,.60],[.245,.75]],lowerCloth,true);
 if(lower===4){const gp=skirt.geometry.attributes.position;for(let i=0;i<gp.count;i++){const x=gp.getX(i),z=gp.getZ(i),y=gp.getY(i),pleat=1+.035*Math.cos(Math.atan2(z,x)*14)*Math.min(1,(.75-y)/.2);gp.setXYZ(i,x*pleat,y,z*pleat);}skirt.geometry.computeVertexNormals();}
}else{garment([[.205,.48],[.235,.53],[.245,.67],[.235,.75]],lowerCloth);}
if(legacy<2){const waistband=cylinder(0,.715,0,.242,.245,.035,lowerCloth,body);waistband.scale.z=.80;}
}else{
 if(lower===0||lower===4){
  const skirt=garment(lower===0?[[.29,.43],[.32,.47],[.30,.55],[.26,.68],[.245,.75]]:[[.32,.44],[.335,.47],[.30,.56],[.258,.69],[.245,.75]],lowerCloth,true);
  // Broad scallops and crisp concertina pleats remain part of the cloth mesh.
  const gp=skirt.geometry.attributes.position;
  for(let i=0;i<gp.count;i++){const x=gp.getX(i),y=gp.getY(i),z=gp.getZ(i),a=Math.atan2(z,x),f=1+(lower===4?.06:.026)*Math.cos(a*(lower===4?12:8))*Math.min(1,(.75-y)/.20);gp.setXYZ(i,x*f,y,z*f);const mp=skirt.geometry.morphAttributes.position?.[0];if(mp)mp.setXYZ(i,mp.getX(i)*f,mp.getY(i),mp.getZ(i)*f);}
  skirt.geometry.computeVertexNormals();
  seam([[-.22,.52,0],[-.12,.495,0],[0,.49,0],[.12,.495,0],[.22,.52,0]],lower===0?'#eadcc1':'#d7c9b1');
 }else garment([[.205,.48],[lower===5?.25:.235,.55],[.245,.69],[.235,.75]],lowerCloth);
 const waistband=cylinder(0,.727,0,.24,.245,.04,lowerCloth,body);waistband.scale.z=.8;
 if(lower===0){for(const x of[-.045,.045]){const knot=ball(x,.71,surfaceZ(x,.71)+.009,.048,.021,.013,'#e8d8b9',body);knot.rotation.z=x>0?.35:-.35;}ball(0,.71,.202,.018,.022,.012,'#d2b782',body);}
 if(lower===1){for(const side of[-1,1])seam([[side*.065,.65,0],[side*.07,.585,0],[side*.15,.58,0],[side*.18,.65,0]],'#cbd5b8');seam([[0,.51,0],[0,.67,0]],'#dfdcc5');}
 if(lower===2){for(const x of[-.13,.13])seam([[x,.51,0],[x,.60,0],[x,.68,0]],'#cfccb5');}
 if(lower===3){for(const side of[-1,1])seam([[side*.08,.68,0],[side*.13,.64,0],[side*.19,.63,0]],'#ded4bb');}
 if(lower===4){for(const x of[-.025,.025])ball(x,.72,surfaceZ(x,.72)+.01,.009,.010,.006,'#c4a565',body);}
 if(lower===5){for(const x of[-.08,.08])seam([[x,.72,0],[x*.88,.64,0],[x*.83,.56,0]],'#e2d6bd');}
 if(lower===6){for(const side of[-1,1]){clothPanel([[side*.11,.53],[side*.20,.53],[side*.21,.62],[side*.12,.62]],lowerCloth,0);seam([[side*.125,.60,0],[side*.20,.60,0]],'#d0d6b9');}}
 if(lower===7){for(const side of[-1,1])seam([[side*.09,.71,0],[side*.14,.64,0],[side*.20,.63,0]],'#ebddbd');}
}
ball(0,.84,0,.245,.30,.18,[0,1,4,5,6].includes(upper)?'#f6edda':cloth,body);
if(upper===0){
 garment([[.252,.69],[.255,.83],[.242,.96]],cloth);shoulderStraps();
 for(const x of[-.115,.115])ball(x,.98,surfaceZ(x,.98)+.008,.013,.013,.006,'#d8be8a',body);
}else if(upper===1){
 garment([[.25,.69],[.25,.89],[.20,1.03]],cloth);shoulderStraps();
 if(legacy>=0)clothPanel([[-.075,.82],[.075,.82],[.07,.91],[-.07,.91]],'#e6dcc4',.205);
 for(const x of[-.115,.115])ball(x,.985,surfaceZ(x,.985)+.008,.013,.013,.006,'#c6aa73',body);
}else if(upper===3){
 garment(legacy===3?[[.275,.51],[.29,.54],[.28,.65],[.27,.84],[.255,.99],[.185,1.08]]:[0,4].includes(lower)?[[.335,.55],[.34,.58],[.32,.65],[.27,.84],[.255,.99],[.185,1.08]]:[[.275,.55],[.29,.58],[.28,.65],[.27,.84],[.255,.99],[.185,1.08]],cloth,legacy<0&&[0,4].includes(lower));
 for(const side of[-1,1])clothPanel([[side*.035,.90],[side*.17,1.005],[side*.105,1.105],[side*.015,1.045]],'#e7dbc1',.205);
 seam([[0,legacy<0&&[0,4].includes(lower)?.78:.59,.236],[0,.86,.226],[0,.97,.212]],'#e8dbc0');
 for(const y of(legacy<0&&[0,4].includes(lower)?[.78,.86,.94]:[.68,.80,.92]))ball(.027,y,surfaceZ(.027,y)+.008,.012,.012,.005,'#b49664',body);
}else if(upper===2){
 garment(legacy===2?[[.23,.62],[.25,.65],[.25,.82],[.23,1.01],[.17,1.08]]:[[.245,.69],[.26,.72],[.25,.82],[.23,1.01],[.17,1.08]],cloth);
 for(const y of[.77,.87,.97])ball(0,y,surfaceZ(0,y)+.008,.013,.013,.006,'#e8d5aa',body);
 seam([[-.18,.72,0],[0,.70,0],[.18,.72,0]],'#dacdb0');
}else if(upper===4){
 garment([[.245,.70],[.255,.77],[.25,.9],[.21,1.04]],cloth);
 for(const x of[-.055,.055]){const bow=ball(x,1.025,.178,.065,.038,.022,'#eee1c8',body);bow.rotation.z=x>0?.4:-.4;}ball(0,1.025,.195,.022,.024,.018,'#d6b68c',body);
 seam([[0,.73,0],[0,.90,0],[0,.98,0]],'#e9dbc0');
}else if(upper===5){
 garment([[.25,.72],[.26,.76],[.25,.9],[.21,1.035]],cloth);
 clothPanel([[-.09,1.07],[0,.89],[.09,1.07]],'#f6edda',0);
 seam([[0,.74,0],[0,.88,0]],'#dec9a2');for(const y of[.77,.84])ball(0,y,surfaceZ(0,y)+.008,.012,.012,.006,'#c5a36d',body);
}else if(upper===6){
 garment([[.25,.70],[.26,.8],[.25,.98],[.20,1.07]],cloth);
 seam([[0,.72,0],[0,1.04,0]],'#e4d4b8');
}else{
 const hoodie=garment(lower===4?[[.28,.69],[.28,.75],[.26,.98],[.20,1.08]]:[[.26,.69],[.27,.75],[.26,.98],[.20,1.08]],cloth);hoodie.name='wardrobe-hoodie';
 const hood=ball(0,1.055,-.10,.23,.16,.16,cloth,body);hood.name='upper-hood';
 seam([[0,.73,0],[0,1.06,0]],'#e9dfc5');clothPanel([[-.14,.77],[.14,.77],[.12,.85],[-.12,.85]],'#9cad96',0);
 for(const x of[-.055,.055])rod([x,1.06,.16],[x,.94,.18],.006,'#e8dfc9',body);
}
if(legacy<0){
 // A coordinated capsule: collars, seams and panels follow the actual surface.
 const piping='#eadfc5',ivory='#f6edda';
 if(upper===0){
  apronPocket();
 }else if(upper===1){
  clothPanel([[-.085,.79],[.085,.79],[.095,.90],[-.095,.90]],cloth,0);
  seam([[-.08,.90,0],[-.075,.81,0],[0,.79,0],[.075,.81,0],[.08,.90,0]],piping);
  for(const x of[-.06,.06])ball(x,.89,surfaceZ(x,.89)+.01,.01,.01,.006,'#c6a56e',body);
 }else if(upper===2){
  for(const y of[.77,.82,.87,.92])seam([[-.16,y+.012,0],[0,y,0],[.16,y+.012,0]],y===.87?'#eee2c3':'#b8c8af');
  for(const x of[-.11,.11])seam([[x,.75,0],[x-.012,.82,0],[x+.012,.90,0],[x,.98,0]],piping);
 }else if(upper===3){
  for(const side of[-1,1]){clothPanel([[side*.085,.78],[side*.19,.79],[side*.185,.85],[side*.08,.84]],cloth,0);seam([[side*.085,.84,0],[side*.18,.85,0]],piping);}
  seam([[-.19,.94,0],[-.11,.88,0],[0,.84,0]],piping);
 }else if(upper===4){
  for(const side of[-1,1])clothPanel([[side*.015,1.02],[side*.09,.97],[side*.155,1.035],[side*.10,1.075]],ivory,0);
  for(const x of[-.12,-.06,.06,.12])seam([[x,.76,0],[x,.88,0],[x,.95,0]],piping);
  for(const y of[.78,.86,.94])ball(0,y,surfaceZ(0,y)+.012,.009,.009,.005,'#c9b17d',body);
 }else if(upper===5){
  for(const side of[-1,1]){clothPanel([[side*.03,.90],[side*.12,1.045],[side*.16,1.00],[side*.055,.86]],'#b6c5a6',0);seam([[side*.07,.77,0],[side*.17,.78,0]],piping);}
 }else if(upper===6){
  for(const side of[-1,1]){clothPanel([[side*.055,.85],[side*.17,.85],[side*.17,.95],[side*.055,.95]],cloth,0);seam([[side*.06,.93,0],[side*.16,.93,0]],piping);ball(side*.11,.93,surfaceZ(side*.11,.93)+.01,.009,.009,.006,'#c7a872',body);}
  for(const y of[.75,.84,.93,1.02])ball(0,y,surfaceZ(0,y)+.01,.009,.009,.005,ivory,body);
 }else{
  seam([[-.14,.78,0],[-.09,.84,0],[.09,.84,0],[.14,.78,0]],piping);
  for(const x of[-.055,.055])ball(x,.945,.185,.011,.02,.011,'#c0a879',body);
  clothPanel([[-.17,.88],[-.09,.88],[-.09,.94],[-.17,.94]],cloth,0);seam([[-.155,.925,0],[-.13,.91,0],[-.105,.925,0]],piping);
 }
}
if(![3,4,7].includes(upper))for(const side of[-1,1])clothPanel([[0,1.075],[side*.12,1.11],[side*.16,1.035],[side*.065,1.005]],'#f5eedc',.19);
leftArm=new T.Group();rightArm=new T.Group();leftArm.position.set(-.26,1,0);rightArm.position.set(.26,1,0);body.add(leftArm,rightArm);
for(const [p,sign]of [[leftArm,-1],[rightArm,1]]){
 p.rotation.z=sign*.12;const sleeveColor=[0,1,5].includes(upper)?'#f7ebd4':cloth;
 avatarFinish(ball(0,-.12,0,upper===4?.108:.095,upper===6?.13:.17,.1,sleeveColor,p),'cloth',sleeveColor);
 if([2,3,7].includes(upper)&&legacy<0)ball(0,-.335,.004,.065,.08,.07,skin,p);else ball(0,-.3,.01,.07,.11,.075,skin,p);
 if([2,3,7].includes(upper)&&legacy<0)cylinder(0,-.255,0,.075,.083,.13,cloth,p);
 if(upper===6)cylinder(0,-.18,0,.094,.094,.06,'#e7dbc2',p);
 if(upper===4)cylinder(0,-.235,0,.075,.085,.038,'#eee1c8',p);
 if(legacy<0){
  if([0,1,4,5].includes(upper)){const cuff=cylinder(0,-.237,0,.073,.091,.037,'#e5d7bb',p);cuff.name='tailored-cuff';}
  if(upper===0||upper===4){const puff=ball(0,-.10,-.002,.108,.124,.109,upper===0?'#f7ebd4':cloth,p);puff.name='gathered-sleeve';}
  if(upper===2)for(const y of[-.25,-.28])cylinder(0,y,0,.079,.079,.012,'#d9d4b7',p);
  if(upper===3)box(0,-.23,.079,.11,.025,.018,'#dfd0ae',p);
  if(upper===6){const tab=box(sign*.04,-.19,.084,.03,.05,.01,cloth,p);ball(sign*.04,-.205,.094,.009,.009,.006,'#ccb181',p);}
  if(upper===7)cylinder(0,-.28,0,.078,.078,.025,'#b9c7b0',p);
  const cuffColor=new T.Color(sleeveColor).lerp(new T.Color('#6e5b4a'),.21).getStyle();
  const cy=[-.225,-.225,-.244,-.223,-.226,-.226,-.162,-.268][upper];
  const cuffEdge=ring(0,cy,0,[.078,.078,.079,.081,.080,.078,.094,.079][upper],.0032,cuffColor,p);
  cuffEdge.name='sleeve-topstitch';cuffEdge.rotation.x=Math.PI/2;cuffEdge.castShadow=false;

 }

}

const shape=FACE_SHAPES[state.faceShape]||FACE_SHAPES[0],headSize=[shape.rx,shape.ry];head=new T.Group();head.position.set(0,1.49,0);body.add(head);const skull=ball(0,0,-.008,headSize[0],headSize[1],.37,skin,head);const skullP=skull.geometry.attributes.position;for(let i=0;i<skullP.count;i++){if(skullP.getZ(i)<0)skullP.setZ(i,skullP.getZ(i)*1.08);skullP.setX(i,skullP.getX(i)*faceWidth(shape,skullP.getY(i))/shape.rx);}skull.geometry.computeVertexNormals();for(const x of [-shape.rx,shape.rx])ball(x,-.035,0,.058,.082,.058,skin,head);
// Every coiffure uses a scalp-following cap plus designed locks, not floating spheres.
const dressedHair=new T.Group();dressedHair.name='coiffure-'+state.hair;head.add(dressedHair);
const fashionLine=(name,pts,r,c,parent=dressedHair)=>{const m=mesh(new T.TubeGeometry(new T.CatmullRomCurve3(pts.map(v=>new T.Vector3(...v))),16,r,6,false),c,0,0,0,parent);m.name=name;return m;};
const lock=(name,x,y,z,rx,ry,rz,angle=0)=>{const m=avatarFinish(ball(x,y,z,rx,ry,rz,hair,dressedHair),'hair',hair);const pos=m.geometry.attributes.position;
 for(let i=0;i<pos.count;i++){const q=pos.getY(i),a=Math.atan2(pos.getZ(i),pos.getX(i));const f=1+.026*Math.cos(a*4+q*1.25)*Math.sqrt(Math.max(0,1-q*q));pos.setX(i,pos.getX(i)*(f+.10*q));pos.setZ(i,pos.getZ(i)*f);}
 m.geometry.computeVertexNormals();m.name=name;m.rotation.z=angle;if([2,3,5,6,7,8].includes(state.hat)&&y>=.20){m.position.y*=.45;m.scale.y*=.58;m.rotation.z*=.5;}return m;};
const capTheta=Math.PI-.01,capGeometry=new T.SphereGeometry(1,32,20,0,Math.PI*2,0,capTheta),capPos=capGeometry.attributes.position;
for(let i=0;i<capPos.count;i++){const v=new T.Vector3().fromBufferAttribute(capPos,i),phi=Math.atan2(v.z,-v.x),theta=Math.acos(Math.max(-1,Math.min(1,v.y))),front=Math.max(0,Math.sin(phi)),back=Math.max(0,-Math.sin(phi)),edge=2.15-.98*Math.pow(front,3)+.12*back*back,t=theta/capTheta*edge;capPos.setXYZ(i,-Math.cos(phi)*Math.sin(t)*(faceWidth(shape,Math.cos(t)*shape.ry)/shape.rx),Math.cos(t),Math.sin(phi)*Math.sin(t)*(Math.sin(phi)<0?1.08:1));}capGeometry.computeVertexNormals();
const hairCap=avatarFinish(mesh(capGeometry,hair,0,.015,-.006,dressedHair),'hair',hair);hairCap.name='fitted-scalp';hairCap.scale.set(headSize[0]+.022,headSize[1]+.024,.397);
const hairHighlight=new T.Color(hair).lerp(new T.Color('#e8cba1'),.16).getStyle();
const capHat=[2,3,5,6,7,8].includes(state.hat);
// 0: tucked pixie with a curled leaf-shaped forelock. 1: softly curled bob.
if(state.hair===0){for(const [x,y,a]of[[-.20,.24,-.32],[-.07,.28,-.23],[.075,.29,.18],[.21,.245,.34]])lock('pixie-fringe',x,y,.30,.09,.13,.064,a);for(const x of[-.34,.34])lock('tucked-side',x,.015,.035,.066,.14,.14);fashionLine('pixie-part',[[-.10,.40,.09],[-.13,.38,.19],[-.16,.32,.29]],.006,hairHighlight);}
if(state.hair===1){for(const side of[-1,1]){lock('bob-wing',side*.33,-.015,-.045,.123,.31,.27,-side*.06);lock('bob-inward-tip',side*.31,-.25,.08,.10,.10,.18,side*.28);lock('bob-curtain',side*.15,.27,.29,.16,.13,.07,-side*.22);fashionLine('bob-comb',[[side*.29,.25,.20],[side*.37,.04,.15],[side*.33,-.24,.18]],.006,hairHighlight);}}
if(state.hair===2){for(const side of[-1,1]){const by=capHat?.04:.18;lock('rolled-bun',side*.39,by,-.15,.143,.14,.15);const curl=ring(side*.39,by,-.004,.084,.014,hairHighlight,dressedHair);curl.rotation.y=side*.2;lock('bun-curtain',side*.12,.29,.29,.13,.13,.07,side*.28);fashionLine('bun-ribbon',[[side*.40,by-.08,-.02],[side*.44,by-.14,.01],[side*.42,by-.19,0]],.015,'#c79384');}}
if(state.hair===3){for(const [x,y,a]of[[-.19,.25,-.35],[-.04,.29,-.25],[.12,.29,-.34],[.26,.25,-.3]])lock('ponytail-fringe',x,y,.29,.10,.13,.065,a);lock('pony-root',0,-.10,-.35,.12,.15,.15);lock('pony-teardrop',.03,-.31,-.39,.14,.23,.14,-.15);const tie=ring(0,-.13,-.46,.09,.018,'#d5b977',dressedHair);tie.scale.y=.6;fashionLine('pony-ribbon',[[.07,-.13,-.47],[.13,-.20,-.46],[.08,-.27,-.44]],.018,'#d5b977');}
if(state.hair===4){for(let n=0;n<4;n++)lock('side-part-wave',-.21+n*.13,.25+n*.015,.29,.105,.135,.068,.50);for(const x of[-.34,.34])lock('neat-side',x,.015,.015,.065,.15,.15);fashionLine('side-part',[[.17,.38,.17],[.20,.35,.22],[.23,.30,.29]],.008,hairHighlight);}
if(state.hair===5){for(let n=0;n<7;n++){const a=n*Math.PI/6;lock('cloud-curl',Math.cos(a)*.28,.25+Math.sin(a)*(capHat?.06:.12),.22-Math.sin(a)*.05,.105,.10,.11,n*.3);}for(const side of[-1,1]){lock('curl-side',side*.34,.06,.015,.09,.16,.18);fashionLine('curl-etched',[[side*.31,.15,.17],[side*.36,.09,.16],[side*.32,.03,.18]],.006,hairHighlight);}}
if(state.hair===6){for(let n=0;n<4;n++)lock('swept-wave',-.21+n*.125,.30+n*.009,.255,.10,.12,.08,-.53);for(const side of[-1,1])lock('swept-taper',side*.34,.025,.01,.062,.13,.15);fashionLine('swept-part',[[-.24,.33,.19],[-.17,.40,.13],[-.09,.43,.01]],.007,hairHighlight);}
if(state.hair===7){for(const side of[-1,1]){lock('long-curtain',side*.33,-.12,-.07,.115,.38,.25,-side*.07);lock('long-turn',side*.31,-.40,.06,.105,.095,.17,side*.3);lock('split-bang',side*.13,.28,.29,.14,.13,.07,-side*.35);fashionLine('long-wave',[[side*.29,.23,.21],[side*.37,-.05,.15],[side*.31,-.38,.19]],.006,hairHighlight);}lock('long-back',0,-.18,-.28,.30,.31,.12);}
const faceZ=(x,y)=>-.008+.37*Math.sqrt(Math.max(.01,1-x*x/faceWidth(shape,y)**2-y*y/(shape.ry*shape.ry)));
function faceLine(points,color,radius){const curve=new T.CatmullRomCurve3(points.map(([x,y])=>new T.Vector3(x,y,faceZ(x,y)+.008)));const line=mesh(new T.TubeGeometry(curve,20,radius,6,false),color,0,0,0,head);line.castShadow=false;line.receiveShadow=false;return line;}
function facePart(points,color,radius,cx,cy){const group=new T.Group(),z=faceZ(cx,cy)+.008;group.position.set(cx,cy,z);head.add(group);const line=faceLine(points,color,radius);head.remove(line);line.geometry.translate(-cx,-cy,-z);group.add(line);return group;}
faceRig={eyes:[],brows:[],cheeks:[],mouth:null,motion:{},index:state.face};
const f=state.face,ink='#423834',lip='#a76f65',eyeY=-.028;
for(const sign of [-1,1]){
 const ear=ball(sign*(shape.rx+.024),-.041,.038,.024,.044,.014,new T.Color(skin).lerp(new T.Color('#b97569'),.27).getStyle(),head);
 ear.name='soft-ear-fold';ear.castShadow=false;
}

for(const x of[-.126,.126]){
 const closed=f===2||f===5||(f===7&&x<0),ey=new T.Group();ey.position.set(x,eyeY,faceZ(x,eyeY)+.009);head.add(ey);
 if(closed){const bend=f===5?.021:.012,line=facePart([[x-.033,eyeY-.006],[x,eyeY+bend],[x+.033,eyeY-.006]],ink,.007,x,eyeY);head.remove(line);ey.add(line);line.position.set(0,0,0);}
 else {const h=f===1?.045:f===3?.029:f===4?.031:f===6?.050:.039;const eye=ball(0,0,0,f===6?.035:.031,h,.010,ink,ey);eye.castShadow=false;eye.name='polished-eye';
 const iris=ball(.003,-.008,.009,.019,.022,.0035,'#73534a',ey);iris.castShadow=false;
 const pupil=ball(-.001,.004,.012,.012,.023,.003,'#342e30',ey);pupil.castShadow=false;
 ball(-.008,.014,.016,.008,.010,.003,'#fff7e7',ey).castShadow=false;
 ball(.009,-.013,.014,.004,.004,.0025,'#e3bf98',ey).castShadow=false;}
 ey.name='face-motion-eye';faceRig.eyes.push(ey);const cy=-.105,cx=x*1.48,cheek=ball(cx,cy,faceZ(cx,cy)+.006,f===2||f===5?.049:.043,.020,.006,'#e6ad9f',head);cheek.castShadow=false;faceRig.cheeks.push(cheek);
 const by=f===6?.079:f===1&&x<0?.073:.063,bend=f===3?.009:f===6?.018:.006;
 faceRig.brows.push(facePart([[x-.033,by],[x,by+bend],[x+.033,by-.003]],hair,.0045,x,by));
}
ball(0,-.082,faceZ(0,-.082)+.004,.019,.014,.012,skin,head).castShadow=false;
ball(0,-.080,faceZ(0,-.080)+.015,.006,.004,.002,new T.Color(skin).lerp(new T.Color('#fff1db'),.22).getStyle(),head).castShadow=false;
if(f===4||f===6){const cy=-.151;const m=new T.Group();m.position.set(0,cy,faceZ(0,cy)+.011);head.add(m);const r=ring(0,0,0,f===6?.019:.012,.0045,lip,m);r.scale.y=f===6?1.25:.8;r.castShadow=false;faceRig.mouth=m;}
else if(f===5){const m=new T.Group();m.position.set(0,-.15,faceZ(0,-.15)+.01);head.add(m);ball(0,0,0,.035,.024,.006,'#9e645b',m).castShadow=false;ball(0,-.010,.006,.019,.008,.003,'#dea39a',m).castShadow=false;faceRig.mouth=m;}
else {const points=f===7?[[-.034,-.144],[0,-.160],[.041,-.132]]:f===2?[[-.027,-.144],[0,-.158],[.027,-.144]]:f===3?[[-.031,-.144],[0,-.153],[.031,-.144]]:[[-.040,-.139],[0,-.158],[.040,-.139]];faceRig.mouth=facePart(points,lip,.006,0,-.15);}
faceRig.mouth.name='face-motion-mouth';
// Hat bands follow the scalp; taller hair is tucked beneath, never a floating prop.
const hats=new T.Group();hats.name='headwear-'+state.hat;head.add(hats);hats.position.y=headSize[1]-.405;
const hf=(name,pts,r,c)=>fashionLine(name,pts,r,c,hats);
const hOval=(name,x,y,z,rx,ry,rz,c)=>{const o=ball(x,y,z,rx,ry,rz,c,hats);o.name=name;return o;};
const band=(y,r,c,width=.018)=>{const o=ring(0,y,-.025,r,width,c,hats);o.rotation.x=Math.PI/2;o.scale.y=.93;return o;};
const badge=(x,y,z,c)=>{hOval('stitched-badge',x,y,z,.043,.038,.009,c);hf('badge-thread',[[x-.017,y-.012,z+.01],[x,y+.016,z+.01],[x+.019,y-.01,z+.01]],.004,'#f7e5be');};
if(state.hat===1){const bow=new T.Group();bow.position.set(-.23,.34,.23);bow.rotation.z=.28;hats.add(bow);for(const side of[-1,1]){const l=ball(side*.072,0,0,.084,.065,.035,'#c98e8a',bow);l.rotation.z=side*.28;fashionLine('bow-fold',[[side*.026,0,.034],[side*.09,.022,.033]],.005,'#e8b8ab',bow);fashionLine('ribbon-tail',[[side*.025,-.02,0],[side*.06,-.10,.015],[side*.045,-.15,.02]],.022,'#c98e8a',bow);}ball(0,0,.025,.027,.036,.027,'#eed5b5',bow);}
if(state.hat===2){const o=hOval('slouched-beret',-.035,.355,-.035,.41,.20,.36,'#829d8d');o.rotation.z=.16;band(.22,.365,'#647f70',.027);hOval('beret-stem',-.09,.55,-.04,.025,.045,.025,'#647f70');badge(.25,.38,.275,'#dcc28b');}
if(state.hat===3){const brim=hOval('scallop-sunhat',0,.25,-.025,.53,.035,.46,'#d9bb81');const crown=cylinder(0,.40,-.04,.295,.37,.30,'#e4ca94',hats);crown.name='sunhat-crown';band(.30,.366,'#b68b7e',.025);for(let n=0;n<12;n++){const a=n*Math.PI/6;hf('brim-stitch',[[Math.cos(a)*.43,.276,Math.sin(a)*.38-.025],[Math.cos(a)*.48,.266,Math.sin(a)*.42-.025]],.004,'#c4a36e');}badge(-.25,.325,.25,'#eee0b3');}
if(state.hat===4){hf('fitted-headband',[[-.39,.03,.03],[-.35,.23,.09],[-.19,.40,.08],[0,.445,.06],[.19,.40,.08],[.35,.23,.09],[.39,.03,.03]],.022,'#c39aa0');for(let n=0;n<5;n++){const a=n*Math.PI*2/5;hOval('band-petal',.28+Math.cos(a)*.035,.32+Math.sin(a)*.035,.18,.027,.027,.012,'#e7c1b3');}hOval('band-flower-core',.28,.32,.196,.019,.019,.009,'#dfbb6c');}
if(state.hat===5){hOval('rounded-baseball',0,.34,-.04,.40,.22,.37,'#86a7a0');hOval('stitched-visor',0,.24,.30,.28,.035,.25,'#6e918a');hf('cap-centre-seam',[[0,.51,-.12],[0,.535,.02],[0,.48,.23],[0,.39,.30]],.005,'#b6cdc1');badge(0,.36,.31,'#e4c98b');}
if(state.hat===6){hOval('soft-beanie',0,.34,-.04,.40,.25,.37,'#c8a295');band(.20,.38,'#b68c83',.043);for(let i=-3;i<=3;i++)hf('knit-rib',[[i*.085,.32,.30],[i*.073,.43,.29],[i*.045,.55,.15]],.006,'#ddbaac');hOval('knit-pompom',0,.62,-.05,.065,.065,.065,'#e8cfb6');badge(.25,.21,.285,'#e8cfb6');}
if(state.hat===7){cylinder(0,.39,-.04,.30,.375,.32,'#a8b794',hats).name='bucket-crown';const brim=cylinder(0,.23,-.04,.38,.45,.075,'#95a783',hats);brim.scale.z=.94;band(.27,.37,'#d7d7ac',.014);badge(.12,.38,.32,'#e9d5a3');hf('bucket-side-loop',[[-.34,.39,-.02],[-.40,.33,.02],[-.35,.27,.07]],.008,'#d6bd88');}
if(state.hat===8){hOval('newsboy-crown',0,.34,-.04,.41,.21,.37,'#9c8f81');hOval('newsboy-visor',0,.23,.28,.27,.026,.19,'#7f756a');band(.23,.36,'#7f756a',.020);for(const side of[-1,1])hf('newsboy-panel',[[0,.55,-.04],[side*.20,.50,.10],[side*.32,.39,.19]],.005,'#beaf9a');hOval('newsboy-button',0,.56,-.04,.022,.014,.022,'#7f756a');}
if([2,5,8].includes(state.hat)){const color={2:'#647f70',5:'#6e918a',8:'#7f756a'}[state.hat];const cuff=cylinder(0,.225,-.025,.38,.405,.11,color,hats);cuff.scale.z=1.04;cuff.name='fitted-hat-cuff';}
// Rear construction remains visible when turning: a cuff, panels or a real adjuster.
if([2,3,6,7,8].includes(state.hat)){const y={2:.225,3:.285,6:.205,7:.265,8:.235}[state.hat];hf('rear-band-seam',[[-.30,y,-.23],[-.17,y-.015,-.35],[0,y-.02,-.385],[.17,y-.015,-.35],[.30,y,-.23]],.008,state.hat===6?'#e5c8b4':'#d8c3a1');}
if(state.hat===5){hf('cap-back-opening',[[-.11,.24,-.36],[-.10,.30,-.375],[0,.34,-.38],[.10,.30,-.375],[.11,.24,-.36]],.013,'#6e918a');hf('cap-adjuster',[[-.12,.235,-.363],[0,.225,-.390],[.12,.235,-.363]],.014,'#d6c194');hOval('cap-buckle',.045,.23,-.405,.022,.018,.008,'#baa16f');}
// Eyewear is bridged and supported by temples; jewellery joins the earlobe.
const accessories=new T.Group();accessories.name='accessory-'+state.accessory;head.add(accessories);
const af=(name,pts,r,c)=>fashionLine(name,pts,r,c,accessories);
const metal='#b99561',ivory='#ead9b4';
if([1,5,6].includes(state.accessory)){const col=state.accessory===5?'#aa8178':state.accessory===6?'#7b8270':metal;for(const side of[-1,1]){const x=side*.127,z=faceZ(x,-.025)+.030;
 if(state.accessory===1){const o=ring(x,-.025,z,.074,.007,col,accessories);o.scale.y=.90;}
 else if(state.accessory===5){af('soft-square-frame',[[x-.067,.024,z],[x+.059,.024,z],[x+.071,.009,z],[x+.067,-.066,z],[x-.059,-.066,z],[x-.071,-.052,z],[x-.067,.024,z]],.008,col);}
 else{af('halfmoon-rim',[[x-.068,.010,z],[x-.058,-.048,z],[x,-.070,z],[x+.058,-.048,z],[x+.068,.010,z]],.006,col);af('brow-rim',[[x-.070,.012,z],[x,.020,z],[x+.070,.012,z]],.010,col);}
 af('glasses-temple',[[side*.20,-.005,z],[side*.31,-.005,.27],[side*.38,-.018,.08]],.006,col);ball(side*.205,-.008,z,.012,.012,.009,ivory,accessories);}
 af('nose-bridge',[[-.055,-.015,faceZ(-.055,-.015)+.030],[0,.004,.403],[.055,-.015,faceZ(.055,-.015)+.030]],.006,col);}
if(state.accessory===2){for(const side of[-1,1]){const front=[],back=[];for(let i=0;i<=24;i++){const u=i/24,x=side*(.16+.025*Math.sin(u*Math.PI)),y=1.10-.43*u;front.push([x,y,surfaceZ(x,y)+.024]);back.push([x,y,-Math.max(surfaceZ(x,y)+.024,upper===7&&y>1?.285:0)]);}fashionLine('backpack-front-strap-'+side,front,.019,'#af8963',body);fashionLine('backpack-rear-strap-'+side,back,.019,'#af8963',body);fashionLine('backpack-shoulder-'+side,[front[0],[side*.17,1.135,.02],back[0]],.019,'#af8963',body);fashionLine('backpack-side-'+side,[front.at(-1),[side*.25,.66,0],back.at(-1)],.017,'#af8963',body);ball(side*.16,.87,surfaceZ(side*.16,.87)+.043,.025,.031,.008,'#d9c18b',body);}
const backpack=new T.Group();backpack.position.z=.31-(surfaceZ(0,.75)+.09);body.add(backpack);const bag=ball(0,.75,-.31,.20,.23,.10,'#b99871',backpack);bag.name='little-town-backpack';ball(0,.87,-.385,.20,.11,.035,'#d8b88b',backpack);ball(0,.66,-.403,.145,.08,.025,'#c6a479',backpack);fashionLine('backpack-pocket-stitch',[[-.11,.70,-.425],[-.10,.61,-.428],[0,.59,-.430],[.10,.61,-.428],[.11,.70,-.425]],.004,'#efdab2',backpack);fashionLine('backpack-carry-loop',[[-.055,.96,-.31],[-.045,1.02,-.32],[.045,1.02,-.32],[.055,.96,-.31]],.012,'#9e7e59',backpack);ball(0,.83,-.427,.025,.028,.009,'#d9c18b',backpack);fashionLine('backpack-patch',[[.085,.91,-.415],[.10,.94,-.415],[.12,.92,-.415]],.006,'#f3dfb4',backpack);}

if([3,4,8].includes(state.accessory))for(const side of[-1,1]){const x=side*(shape.rx+.024);ball(x,-.07,.055,.014,.014,.011,metal,accessories);
 if(state.accessory===3){af('drop-chain',[[x,-.075,.056],[x,-.12,.056],[x+side*.008,-.145,.056]],.005,metal);ball(x+side*.008,-.17,.056,.024,.032,.018,ivory,accessories);ball(x+side*.002,-.16,.073,.007,.010,.003,'#fff1cf',accessories);}
 if(state.accessory===4){for(let n=0;n<5;n++){const a=n*Math.PI*2/5;ball(x+Math.cos(a)*.019,-.085+Math.sin(a)*.019,.063,.013,.016,.008,'#dba79d',accessories);}ball(x,-.085,.074,.011,.011,.006,'#ebcf85',accessories);}
 if(state.accessory===8){const moon=ring(x,-.084,.064,.023,.007,metal,accessories);moon.scale.y=1.1;ball(x-.007,-.076,.07,.014,.014,.009,ivory,accessories);}}
if(state.accessory===7){af('hairclip-base',[[.20,.20,.31],[.30,.26,.25]],.013,'#c69a77');const star=new T.Shape();for(let i=0;i<10;i++){const a=i*Math.PI/5+Math.PI/2,r=i%2?.014:.033;i?star.lineTo(Math.cos(a)*r,Math.sin(a)*r):star.moveTo(Math.cos(a)*r,Math.sin(a)*r);}star.closePath();const o=mesh(new T.ExtrudeGeometry(star,{depth:.009,bevelEnabled:true,bevelSize:.003,bevelThickness:.003,bevelSegments:1}),'#ead093',.25,.23,.29,accessories);o.name='fitted-star-clip';}
// Upper posture moves independently: the leg/foot chains remain planted.
upperBody=new T.Group();upperBody.name='avatar-upper-posture';for(const child of [...body.children])if(child!==leftLeg&&child!==rightLeg)upperBody.add(child);body.add(upperBody);
return {avatar,body,head,leftLeg,rightLeg,leftArm,rightArm,upperBody,blinkEyes,faceRig};}
function rebuild(){refreshMirrorHint();disposeGroup(avatar);const built=buildAvatar(state);avatar.add(...[...built.avatar.children]);({body,head,leftLeg,rightLeg,leftArm,rightArm,upperBody,blinkEyes,faceRig}=built);avatar.position.set(pos.x,standY(pos),pos.z);avatar.rotation.y=previewMode?previewYaw:heading;}
rebuild();
// Pure 3D-room helper. No state.js edits; caller owns performance-only bypass.
function stoolObstacle({x=-1.85,z=-.66,yaw=Math.PI-.42,halfX=.24,halfZ=.20,radius=.22}={}){
 const c=Math.abs(Math.cos(yaw)),s=Math.abs(Math.sin(yaw));
 return {minX:x-c*halfX-s*halfZ-radius,maxX:x+c*halfX+s*halfZ+radius,minZ:z-s*halfX-c*halfZ-radius,maxZ:z+s*halfX+c*halfZ+radius};
}
const ROOM={minX:-2.2,maxX:2.2,minZ:-.8,maxZ:1.9};
function inside(p,b){return p.x>b.minX&&p.x<b.maxX&&p.z>b.minZ&&p.z<b.maxZ;}
const dist=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
function segmentBlocked(a,b,o){let lo=0,hi=1;for(const [k,mn,mx]of[['x','minX','maxX'],['z','minZ','maxZ']]){const d=b[k]-a[k];if(Math.abs(d)<1e-12){if(a[k]<=o[mn]||a[k]>=o[mx])return false;continue;}let l=(o[mn]-a[k])/d,h=(o[mx]-a[k])/d;if(l>h)[l,h]=[h,l];lo=Math.max(lo,l);hi=Math.min(hi,h);if(lo>=hi)return false;}return hi>0&&lo<1;}
function clearPoint(p,o,room=ROOM){const q={x:Math.max(room.minX,Math.min(room.maxX,p.x)),z:Math.max(room.minZ,Math.min(room.maxZ,p.z))};if(!inside(q,o))return q;const e=.015,candidates=[{x:o.minX-e,z:q.z},{x:o.maxX+e,z:q.z},{x:q.x,z:o.minZ-e},{x:q.x,z:o.maxZ+e}].filter(v=>v.x>=room.minX&&v.x<=room.maxX&&v.z>=room.minZ&&v.z<=room.maxZ);if(!candidates.length)return null;return candidates.sort((a,b)=>dist(a,q)-dist(b,q))[0];}
function routeAroundStool(start,target,o=stoolObstacle(),room=ROOM){
 // Do NOT silently teleport an overlapping start: controlled egress must handle it.
 if(inside(start,o))return null;const goal=clearPoint(target,o,room);if(!goal)return null;
 const e=.015,nodes=[start,goal,...[o.minX-e,o.maxX+e].flatMap(x=>[o.minZ-e,o.maxZ+e].map(z=>({x,z})))].filter((p,i)=>i<2||(p.x>=room.minX&&p.x<=room.maxX&&p.z>=room.minZ&&p.z<=room.maxZ));
 const costs=nodes.map(()=>Infinity),prev=nodes.map(()=>-1),done=new Set();costs[0]=0;
 while(done.size<nodes.length){let i=-1;for(let j=0;j<nodes.length;j++)if(!done.has(j)&&(i<0||costs[j]<costs[i]))i=j;if(i<0||!Number.isFinite(costs[i]))return null;if(i===1){const path=[];for(let k=1;k>0;k=prev[k])path.unshift(nodes[k]);return path;}done.add(i);for(let j=0;j<nodes.length;j++)if(!done.has(j)&&!segmentBlocked(nodes[i],nodes[j],o)){const d=costs[i]+dist(nodes[i],nodes[j]);if(d<costs[j]){costs[j]=d;prev[j]=i;}}}return null;
}
function guardedMove(start,next,o=stoolObstacle()){
 if(inside(start,o))return {...start};if(!segmentBlocked(start,next,o))return next;
 const axes=[{x:next.x,z:start.z},{x:start.x,z:next.z}].filter(p=>!segmentBlocked(start,p,o));return axes.sort((a,b)=>dist(b,start)-dist(a,start))[0]||{...start};
}
// The mirror's draw bounds supply its swept floor footprint. Routing uses
// the same expanded obstacles for pointer paths and direct movement.
function mirrorWalkRoute(start,target,obstacles,room=ROOM){
 const within=p=>p.x>=room.minX&&p.x<=room.maxX&&p.z>=room.minZ&&p.z<=room.maxZ;
 const free=p=>within(p)&&obstacles.every(o=>!inside(p,o));
 const clear=(a,b)=>obstacles.every(o=>!segmentBlocked(a,b,o));
 if(!free(start))return null;
 const clamped={x:Math.max(room.minX,Math.min(room.maxX,target.x)),z:Math.max(room.minZ,Math.min(room.maxZ,target.z))};
 const e=.018,edge=obstacles.flatMap(o=>{
  const{x,z}=clamped;
  return [{x:o.minX-e,z},{x:o.maxX+e,z},{x,z:o.minZ-e},{x,z:o.maxZ+e}];
 });
 const goal=free(clamped)?clamped:edge.filter(free).sort((a,b)=>dist(a,clamped)-dist(b,clamped))[0];
 if(!goal)return null;
 if(clear(start,goal))return {goal,step:goal};
 const nodes=[start,goal,...obstacles.flatMap(o=>[o.minX-e,o.maxX+e].flatMap(x=>[o.minZ-e,o.maxZ+e].map(z=>({x,z})))).filter(free)];
 const cost=nodes.map(()=>Infinity),first=nodes.map(()=>null),done=new Set();cost[0]=0;
 while(done.size<nodes.length){
  let i=-1;for(let j=0;j<nodes.length;j++)if(!done.has(j)&&(i<0||cost[j]<cost[i]))i=j;
  if(i<0||!Number.isFinite(cost[i]))return null;
  if(i===1)return {goal,step:first[1]};
  done.add(i);
  for(let j=1;j<nodes.length;j++)if(!done.has(j)&&clear(nodes[i],nodes[j])){
   const next=cost[i]+dist(nodes[i],nodes[j]);if(next<cost[j]){cost[j]=next;first[j]=first[i]||nodes[j];}
  }
 }
 return null;
}
function stoolEgress(seat,o=stoolObstacle(),room=ROOM){return clearPoint(seat,o,room);}

const CELLO_SEAT={x:-1.85,z:-.70},STOOL_CENTER={x:-1.85,z:-.66},STOOL_COLLIDER=stoolObstacle();
function stoolRouteStep(p,target,dt){const route=routeAroundStool(p,target,STOOL_COLLIDER);if(!route?.length)return {...p};return guardedMove(p,stepToward(p,route[0],dt),STOOL_COLLIDER);}

function sideStoolEgress(from,o){if(from.x>=o.maxX+.005&&!inside(from,o))return {...from};return clearPoint({x:o.maxX+.08,z:Math.max(o.minZ+.05,Math.min(o.maxZ-.05,from.z))},o);}
function pointAlongPath(from,route,u){let total=0,p=from;const lengths=route.map(q=>{const n=Math.hypot(q.x-p.x,q.z-p.z);p=q;total+=n;return n;});let remaining=Math.max(0,Math.min(1,u))*total;p=from;for(let i=0;i<route.length;i++){const q=route[i],n=lengths[i];if(remaining<=n||i===route.length-1){const f=n?Math.min(1,remaining/n):1;return{x:p.x+(q.x-p.x)*f,z:p.z+(q.z-p.z)*f};}remaining-=n;p=q;}return{...from};}
let destination=null,pendingStation=null,watchingCat=false,catPose=0,catPoseMotion=null,catSnapshot=null;const stationSpots={exit:{x:0,z:1.9},wardrobe:{x:2.2,z:-.8},mirror:MIRROR_APPROACH,vanity:mirrorRoom?MIRROR_APPROACH:{x:.65,z:-.75},cello:{x:-1.25,z:-.66},cat:{x:-1.03,z:-.72}};const pressed=new Set();function release(){if(watchingCat)endCatView();pressed.clear();destination=null;pendingStation=null;watchingCat=false;}const keyMap={ArrowUp:'up',w:'up',W:'up',ArrowDown:'down',s:'down',S:'down',ArrowLeft:'left',a:'left',A:'left',ArrowRight:'right',d:'right',D:'right'};window.addEventListener('keydown',e=>{if(previewMode)return;if(e.target.closest('button,input,select,textarea')&&e.target!==$('cat-view-back'))return;const d=keyMap[e.key];if(d){e.preventDefault();destination=null;pendingStation=null;if(watchingCat)endCatView();watchingCat=false;pressed.add(d);}});window.addEventListener('keyup',e=>pressed.delete(keyMap[e.key]));window.addEventListener('blur',release);document.addEventListener('visibilitychange',release);for(const b of document.querySelectorAll('[data-dir]')){b.onpointerdown=e=>{if(previewMode)return;e.preventDefault();destination=null;pendingStation=null;b.setPointerCapture(e.pointerId);pressed.add(b.dataset.dir);};b.onpointerup=b.onpointercancel=b.onlostpointercapture=()=>pressed.delete(b.dataset.dir);}
window.addEventListener('pageshow',e=>{if(e.persisted){exitNavigating=false;exitArmed=pos.z<1.4;release();}});
const targetMarker=ring(0,.085,0,.16,.018,'#fff5cd');targetMarker.rotation.x=-Math.PI/2;targetMarker.visible=false;const raycaster=new T.Raycaster(),floorPlane=new T.Plane(new T.Vector3(0,1,0),0);let tap=null;
function approachStation(mode){if(!stationSpots[mode]||celloPerformance)return;if(mode==='exit')exitArmed=true;if(previewMode)exitPreview();release();pendingStation=mode;destination={...stationSpots[mode]};if(mode==='cello')beginPerformanceApproach();$('scene-status').textContent=mode==='exit'?'正在走向小鎮出口':mode==='wardrobe'?'正在走向衣櫃':mode==='mirror'?'正在走向全身鏡':mode==='cello'?'正在走向大提琴':mode==='cat'?'正在走到貓咪旁邊':mirrorRoom?'正在走向全身鏡':'正在走向梳妝台';area.focus({preventScroll:true});}
let cameraMotion=null;
function animateRoomCamera(position,zoom,restoring=false,orientation=null,duration=520){
 cameraMotion={from:camera.position.clone(),to:position.clone(),fromZoom:camera.zoom,toZoom:zoom,start:performance.now(),restoring,duration,fromQuaternion:camera.quaternion.clone(),toQuaternion:orientation?.clone()||camera.quaternion.clone()};
 if(reduced.matches){camera.position.copy(position);camera.zoom=zoom;if(orientation)camera.quaternion.copy(orientation);camera.updateProjectionMatrix();cameraMotion=null;}
}
function previewCameraTarget(){
 const probe=camera.clone();probe.position.copy(roomSnapshot.cameraPosition);probe.quaternion.copy(roomSnapshot.cameraQuaternion);
 const height=camera.top-camera.bottom,zoom=Math.max(1.25,Math.min(3.1,height*.34/1.75));probe.zoom=zoom;probe.updateProjectionMatrix();probe.updateMatrixWorld(true);
 const projected=new T.Vector3(pos.x,.97,pos.z).project(probe),phone=area.clientWidth<600;
 const desiredX=phone?0:-.25,desiredY=phone?.48:.05;
 const right=new T.Vector3(1,0,0).applyQuaternion(probe.quaternion),up=new T.Vector3(0,1,0).applyQuaternion(probe.quaternion);
 probe.position.addScaledVector(right,(projected.x-desiredX)*(probe.right-probe.left)/(2*zoom));probe.position.addScaledVector(up,(projected.y-desiredY)*height/(2*zoom));
 return{position:probe.position,zoom};
}
function anchorEditor(){if(!previewMode||previewMode==='records'||previewMode==='performance')return;camera.updateMatrixWorld(true);const panel=document.querySelector('aside'),r=area.getBoundingClientRect(),m=document.querySelector('main').getBoundingClientRect();
 const project=(x,y,z)=>{const v=new T.Vector3(x,y,z).project(camera);return{x:r.left+(v.x+1)*r.width/2,y:r.top+(1-v.y)*r.height/2}};
 const points=[];for(const x of[-.52,.52])for(const y of[.02,2.05])for(const z of[-.35,.35])points.push(project(pos.x+x,y,pos.z+z));
 const left=Math.min(...points.map(v=>v.x)),right=Math.max(...points.map(v=>v.x)),top=Math.min(...points.map(v=>v.y)),bottom=Math.max(...points.map(v=>v.y));
 let x=right+14,y=top+22;if(r.width<600){x=(left+right-panel.offsetWidth)/2;y=bottom+14;}else if(roomSnapshot?.station==='mirror'||x+panel.offsetWidth>r.right-12)x=left-panel.offsetWidth-14;
 x=Math.max(r.left+10,Math.min(r.right-panel.offsetWidth-10,x));y=Math.max(r.top+76,Math.min(r.bottom-panel.offsetHeight-10,y));
 Object.assign(panel.style,{left:(x-m.left)+'px',top:(y-m.top)+'px',right:'auto',bottom:'auto'});
}
function tickRoomCamera(t,dt=null){if(cameraMotion){const motion=cameraMotion;if(motion.frameTimed&&dt!==null)motion.elapsed=(motion.elapsed||0)+Math.min(.05,Math.max(0,dt))*1000;const u=Math.min(1,Math.max(0,(motion.frameTimed&&dt!==null?motion.elapsed:t-motion.start)/motion.duration)),ease=u*u*(3-2*u);camera.position.lerpVectors(motion.from,motion.to,ease);camera.zoom=motion.fromZoom+(motion.toZoom-motion.fromZoom)*ease;if(motion.fromQuaternion.equals(motion.toQuaternion))camera.quaternion.copy(motion.toQuaternion);else camera.quaternion.slerpQuaternions(motion.fromQuaternion,motion.toQuaternion,ease);if(motion.toLens!==undefined){performanceLens=T.MathUtils.lerp(motion.fromLens,motion.toLens,ease);performanceLensFov=T.MathUtils.lerp(motion.fromFov,motion.toFov,ease);performanceLensDistance=T.MathUtils.lerp(motion.fromDistance,motion.toDistance,ease);}camera.updateProjectionMatrix();if(u===1){camera.position.copy(motion.to);camera.zoom=motion.toZoom;camera.quaternion.copy(motion.toQuaternion);cameraMotion=null;}}if(previewMode)anchorEditor();}
function catCameraTarget(){
 const probe=camera.clone(),focus=new T.Vector3(-.70,.70,-1.30);probe.position.set(2.8,2.55,2.6);probe.lookAt(focus);
 probe.zoom=Math.max(1.35,Math.min(3.1,(probe.right-probe.left)/2.8,(probe.top-probe.bottom)/2.75));probe.updateProjectionMatrix();probe.updateMatrixWorld(true);
 // Compensate the room's phone lens shift; the same bounded subject stays visible.
 const v=focus.clone().project(probe),right=new T.Vector3(1,0,0).applyQuaternion(probe.quaternion),up=new T.Vector3(0,1,0).applyQuaternion(probe.quaternion);
 probe.position.addScaledVector(right,v.x*(probe.right-probe.left)/(2*probe.zoom));probe.position.addScaledVector(up,v.y*(probe.top-probe.bottom)/(2*probe.zoom));
 return{position:probe.position,zoom:probe.zoom,quaternion:probe.quaternion};
}
function setCatPose(value,duration){
 if(reduced.matches){catPose=value;catPoseMotion=null;return;}
 catPoseMotion={from:catPose,to:value,start:performance.now(),duration};
}
function tickCatPose(t){if(!catPoseMotion)return;const m=catPoseMotion,u=Math.min(1,Math.max(0,(t-m.start)/m.duration));catPose=m.from+(m.to-m.from)*u*u*(3-2*u);if(u===1){catPose=m.to;catPoseMotion=null;}}
function beginCatView(){
 if(watchingCat)return;catSnapshot={position:cameraMotion?.restoring?cameraMotion.to.clone():camera.position.clone(),zoom:cameraMotion?.restoring?cameraMotion.toZoom:camera.zoom,quaternion:cameraMotion?.restoring?cameraMotion.toQuaternion.clone():camera.quaternion.clone()};
 pendingStation=null;watchingCat=true;setCatPose(1,650);heading=Math.atan2(roomCat.group.position.x-pos.x,roomCat.group.position.z-pos.z);const view=catCameraTarget();animateRoomCamera(view.position,view.zoom,false,view.quaternion,950);
 $('cat-watch-access').hidden=true;$('cat-view-back').hidden=false;$('cat-view-back').focus({preventScroll:true});$('scene-status').textContent='蹲在旁邊看貓咪休息；可返回房間視角';
}
function endCatView(){
 if(!watchingCat)return;watchingCat=false;setCatPose(0,1000);$('cat-watch-access').hidden=false;$('cat-view-back').hidden=true;const old=catSnapshot;catSnapshot=null;if(old)animateRoomCamera(old.position,old.zoom,true,old.quaternion,450);area.focus({preventScroll:true});$('scene-status').textContent='回到房間視角';
}
function enterPreview(station){
 const mode=station==='mirror'?'vanity':station;
 if(mode==='exit'){leaveRoom();return;}
 if(mode==='cat'){beginCatView();return;}
 if(mode==='cello'){seatPerformance();return;}
 if(previewMode)exitPreview();
 // The performer faces the physical glass; the existing wardrobe and
 // fitting camera still handles focus, zoom and rotation exactly as before.
 const mirrorFacing=station==='mirror'&&rayMirrorFrame
  ?Math.atan2(rayMirrorFrame.position.x-pos.x,rayMirrorFrame.position.z-pos.z):null;
 if(mirrorFacing!==null){heading=mirrorFacing;avatar.rotation.y=mirrorFacing;}
 roomSnapshot={station,rotation:avatar.rotation.clone(),heading,cameraPosition:cameraMotion?.restoring?cameraMotion.to.clone():camera.position.clone(),cameraQuaternion:camera.quaternion.clone(),cameraZoom:cameraMotion?.restoring?cameraMotion.toZoom:camera.zoom,focus:area};
 release();tap=null;previewMode=mode;previewYaw=mirrorFacing??Math.atan2(camera.position.x-pos.x,camera.position.z-pos.z);activeCategory=mode==='wardrobe'?3:0;
 area.setAttribute('aria-label',mode==='wardrobe'?'房間內角色試穿，左右拖曳或方向鍵轉動':'房間內人物造型，左右拖曳或方向鍵轉動');document.body.classList.add('preview-open');document.body.dataset.editor=mode;const panel=document.querySelector('aside');panel.setAttribute('role','region');panel.setAttribute('aria-label',mode==='wardrobe'?'衣櫃試穿':(mirrorRoom?'全身鏡造型':'梳妝台'));panel.hidden=false;$('preview-close').hidden=false;controls();const target=previewCameraTarget();animateRoomCamera(target.position,target.zoom);anchorEditor();$('preview-close').focus({preventScroll:true});
}
function exitPreview(){if(celloPerformance)return;if(!previewMode)return;const old=roomSnapshot;release();if(tap&&area.hasPointerCapture(tap.id))area.releasePointerCapture(tap.id);tap=null;previewMode=null;heading=old.heading;avatar.rotation.copy(old.rotation);camera.quaternion.copy(old.cameraQuaternion);animateRoomCamera(old.cameraPosition,old.cameraZoom,true);area.setAttribute('aria-label',mirrorRoom?'3D房間，衣櫃可試穿，全身鏡可換造型，點地板行走':'3D房間，點衣櫃或梳妝台走近更換外觀，點地板行走');document.body.classList.remove('preview-open');delete document.body.dataset.editor;const panel=document.querySelector('aside');panel.removeAttribute('role');panel.removeAttribute('aria-label');panel.removeAttribute('style');panel.hidden=true;$('preview-close').hidden=true;old.focus?.focus({preventScroll:true});roomSnapshot=null;}
$('cat-watch-access').onclick=()=>approachStation('cat');
$('cat-view-back').onclick=endCatView;
$('wardrobe-open').onclick=()=>approachStation('wardrobe');$('vanity-open').onclick=()=>approachStation(mirrorRoom?'mirror':'vanity');$('preview-close').onclick=exitPreview;
// One reversible performance state: no practice records, scores or audio capture.
let performanceAssets=null;
function performanceParts(){
 if(performanceAssets)return performanceAssets;
 const instrument=new T.Group(),bow=new T.Group();instrument.name='performance-cello';bow.name='performance-bow';
 const performanceSource=cello;
 for(const source of performanceSource.children){
  const buckets=new Map();
  for(const part of source.userData.parts||[]){const parent=part.name.startsWith('bow-')?bow:instrument,values=buckets.get(parent)||{position:[],normal:[]};for(const key of['position','normal'])values[key].push(...source.geometry.attributes[key].array.slice(part.start*3,(part.start+part.count)*3));buckets.set(parent,values);}
  for(const[parent,values]of buckets){const g=new T.BufferGeometry();for(const key of['position','normal'])g.setAttribute(key,new T.Float32BufferAttribute(values[key],3));const mesh=new T.Mesh(g,source.material);mesh.name=parent===instrument?'performance-cello-'+source.material.color.getHexString():'performance-bow-'+source.material.color.getHexString();mesh.userData.partNames=(source.userData.parts||[]).filter(p=>p.name.startsWith('bow-')===(parent===bow)).map(p=>p.name);mesh.castShadow=source.castShadow;mesh.receiveShadow=true;mesh.raycast=()=>{};parent.add(mesh);}
 }
 for(const child of bow.children)child.geometry.translate(-.399,-.208,-.047);
 const stool=new T.Group();stool.name='performance-stool';for(const x of[-.17,.17])for(const z of[-.13,.13])box(x,.17,z,.045,.32,.045,'#967650',stool);box(0,.345,0,.48,.06,.40,'#b99a6c',stool);stool.traverse(o=>o.userData.station='cello');
 const grip=new T.Group();grip.name='bow-thumb-index-grip';const skin=OPTIONS.skin[state.skin];ball(-.018,.012,.018,.030,.023,.026,skin,grip);ball(.014,-.017,.006,.025,.028,.022,skin,grip);scene.add(instrument,bow,stool,grip);instrument.visible=bow.visible=stool.visible=grip.visible=false;
 const back=$('cat-view-back').cloneNode(true);back.id='performance-back';back.setAttribute('aria-label','返回房間視角');back.title='返回房間視角';back.hidden=true;document.querySelector('.stage').append(back);back.onclick=finishPerformance;
 return performanceAssets={instrument,bow,stool,grip,back};
}
const PERFORMANCE_YAW=Math.PI-.42, performanceUp=new T.Vector3(0,1,0);
function performanceFramePoint(x,y,z){return new T.Vector3(x,y,z).applyAxisAngle(performanceUp,PERFORMANCE_YAW).add(new T.Vector3(pos.x,standY(pos),pos.z));}
function performanceCamera(width=area.clientWidth){
 const aspect=(camera.right-camera.left)/(camera.top-camera.bottom);
 const portrait=T.MathUtils.smoothstep(1.4-aspect,0,.55);
 const wide=T.MathUtils.smoothstep(aspect,1.2,1.4)*(.10+1.3*Math.max(0,aspect-1.4));
 const catView=T.MathUtils.smoothstep(aspect,1.2,1.4),extraWide=Math.max(0,aspect-1.8);
 // Aspect-based leftward and slightly lower aim includes the nearby player and cello, while fitting the real window.
 const probe=camera.clone(),focus=new T.Vector3(-1.25-.25*portrait-wide-catView*(.48+.25*extraWide),1.68-.18*portrait-catView*(.28+.10*extraWide),-2.09);
 const wideFrame=.65*T.MathUtils.smoothstep(aspect,4/3,1.54);
 // A lower real eye line separates the near player/cello from the far window.
 // Portrait and ordinary tablet compositions retain their exact camera tuple.
 focus.lerp(new T.Vector3(-1.8-1.3*Math.max(0,aspect-1.58),1.4,-2.09),wideFrame);
 probe.position.set(-.08,1.67,.59).lerp(new T.Vector3(-.6,1.15,.3),wideFrame);probe.lookAt(focus);probe.updateMatrixWorld(true);
 const points=[];
 for(let i=0;i<=32;i++){const a=i*Math.PI/32;points.push(new T.Vector3(-1.25+.87*Math.cos(a),2.03+.87*Math.sin(a),-2.04));}
 for(const x of[-2.22,-.28])for(const y of[1.075,1.175])points.push(new T.Vector3(x,y,-1.98));
 let tangent=Math.tan(T.MathUtils.degToRad(50.18)*.5);
 for(const p of points){p.applyMatrix4(probe.matrixWorldInverse);tangent=Math.max(tangent,Math.max(Math.abs(p.y),Math.abs(p.x)/aspect)/(-p.z)*1.04);}
 const fov=T.MathUtils.radToDeg(2*Math.atan(tangent)),distance=probe.position.distanceTo(focus),zoom=(camera.top-camera.bottom)/(2*distance*tangent);
 // Translate left in the existing view plane; retain exactly the fitted lens and angle.
 const clampPoints=points.slice();
 for(const x of[-2.22,-.28])for(const y of[1.075,1.175])for(const z of[-2.17,-1.81])clampPoints.push(new T.Vector3(x,y,z).applyMatrix4(probe.matrixWorldInverse));
 for(let i=0;i<=128;i++)for(const z of[-2.08,-2.00]){const a=i*Math.PI/128;clampPoints.push(new T.Vector3(-1.25+.87*Math.cos(a),2.03+.87*Math.sin(a),z).applyMatrix4(probe.matrixWorldInverse));}
 const leftShift=Math.max(0,Math.min(.12,...clampPoints.map(p=>(-p.z)*tangent*aspect*.99-p.x)));
 probe.position.add(new T.Vector3(-leftShift*(1-wideFrame),0,0).applyQuaternion(probe.quaternion));
 return{position:probe.position,quaternion:probe.quaternion,zoom,fov,distance,lens:1};
}
function animatePerformanceCamera(view,duration,restoring=false){
 const fromLens=performanceLens,fromFov=performanceLensFov,fromDistance=performanceLensDistance,targetLens=view.lens??0;
 animateRoomCamera(view.position,view.zoom,restoring,view.quaternion,reduced.matches?0:duration);
 if(cameraMotion){Object.assign(cameraMotion,{frameTimed:true,fromLens,toLens:targetLens,fromFov,toFov:view.fov??fromFov,fromDistance,toDistance:view.distance??fromDistance});}
 else{performanceLens=targetLens;performanceLensFov=view.fov??fromFov;performanceLensDistance=view.distance??fromDistance;camera.updateProjectionMatrix();}
}

function beginPerformanceApproach(){
 const a=performanceParts();celloPerformance={phase:'approach',elapsed:0,home:{position:camera.position.clone(),quaternion:camera.quaternion.clone(),zoom:camera.zoom},celloPosition:cello.position.clone(),celloRotation:cello.rotation.clone(),arms:null};
 a.grip.children.forEach(o=>o.material=mat(OPTIONS.skin[state.skin]));a.stool.position.set(STOOL_CENTER.x,0,STOOL_CENTER.z);a.stool.rotation.y=PERFORMANCE_YAW;a.stool.scale.y=.455/.375;a.stool.visible=true;
 document.querySelector('.station-controls').hidden=true;$('cat-watch-access').hidden=true;
 // Keep room approach visible; switch only once seated into the window composition.
}
function watchPerformanceApproach(dt){
 const p=celloPerformance;if(p?.phase!=='approach')return;
 const distance=Math.hypot(pos.x-stationSpots.cello.x,pos.z-stationSpots.cello.z);
 if(distance<.01||catPose>.001){p.stalled=0;return;}
 p.stalled=distance<(p.distance??Infinity)-.0001?0:(p.stalled||0)+dt;p.distance=distance;
 if(p.stalled<1.5)return;
 performanceParts().stool.visible=true;celloPerformance=null;release();document.querySelector('.station-controls').hidden=false;$('cat-watch-access').hidden=false;
 animateRoomCamera(p.home.position,p.home.zoom,true,p.home.quaternion,reduced.matches?0:450);$('scene-status').textContent='目前無法走到大提琴旁，已回到琴房操作。';
}
function articulatePerformanceArms(){
 const arms=[];
 for(const arm of[leftArm,rightArm]){const snapshots=arm.children.map(child=>({child,position:child.position.clone(),scale:child.scale.clone(),quaternion:child.quaternion.clone(),name:child.name}));const elbow=new T.Group();elbow.name='performance-elbow';elbow.position.y=-.20;const moved=[];for(const child of[...arm.children])if(child.position.y<-.215){const original=child.position.clone();arm.remove(child);elbow.add(child);child.position.y+=.20;moved.push({child,original});}arm.add(elbow);arms.push({arm,elbow,moved,snapshots});}
 return arms;
}
function seatPerformance(){
 if(!celloPerformance)beginPerformanceApproach();release();tap=null;previewMode='performance';celloPerformance.phase='seating';celloPerformance.elapsed=0;beginPerformancePresentation();celloPerformance.arms=articulatePerformanceArms();celloPerformance.fromHeading=heading;celloPerformance.approachPosition={...pos};celloPerformance.seatPosition={...CELLO_SEAT};
 avatar.updateMatrixWorld(true);celloPerformance.restHands=celloPerformance.arms.map(r=>{const hand=r.moved.find(m=>m.child.isMesh&&m.child.geometry?.type==='SphereGeometry')?.child;return hand?hand.getWorldPosition(new T.Vector3()):r.arm.localToWorld(new T.Vector3(0,-.3,0));});celloPerformance.restHandLocal=celloPerformance.restHands.map(v=>avatar.worldToLocal(v.clone()));
 const a=performanceParts();cello.visible=false;celloShadowBridge.visible=false;pinContact.visible=false;a.instrument.visible=a.bow.visible=true;tickPerformance(0,performance.now());
}
function aimPerformanceArm(rig,hand,bend){
 const shoulder=rig.arm.position.clone(),target=hand.clone(),distance=target.distanceTo(shoulder),l1=rig.lengths?.[0]??.30,l2=rig.lengths?.[1]??.30;
 // Keep original outfit sleeve/cuff materials and a connected, relaxed forearm.
 if(!rig.hand){
   rig.hand=rig.elbow.children.find(o=>o.isMesh&&o.geometry?.type==='SphereGeometry');
   const c=rig.hand?.material?.color?.getHexString()||OPTIONS.skin[state.skin].replace('#','');
   rig.forearm=cylinder(0,0,0,.052,.057,1,'#'+c,rig.elbow);
   rig.forearm.name='performance-connected-forearm';
   const sleeve=rig.arm.children.find(o=>o.isMesh&&o.geometry?.type==='SphereGeometry');
   if(sleeve){sleeve.position.y=-l1*.5;sleeve.scale.y=l1*.52;}
 }
 rig.elbow.position.y=-l1;
 if(rig.hand){rig.hand.position.set(0,-l2,0);rig.hand.scale.set(.058,.072,.060);rig.hand.name='performance-hand-contact';}
 rig.forearm.position.y=-l2*.5;rig.forearm.scale.y=Math.max(.01,l2-.09);
 const direction=target.clone().sub(shoulder).normalize();
 const along=(l1*l1-l2*l2+distance*distance)/(2*distance);
 const side=(bend<0?new T.Vector3(-.45,.20,-.45):new T.Vector3(bend,.70,-.22)).projectOnPlane(direction).normalize();
 const elbowPoint=shoulder.clone().addScaledVector(direction,along).addScaledVector(side,Math.sqrt(Math.max(0,l1*l1-along*along)));
 rig.arm.quaternion.setFromUnitVectors(new T.Vector3(0,-1,0),elbowPoint.clone().sub(shoulder).normalize());
 const localHand=target.sub(shoulder).applyQuaternion(rig.arm.quaternion.clone().invert()).sub(rig.elbow.position);
 rig.elbow.quaternion.setFromUnitVectors(new T.Vector3(0,-1,0),localHand.normalize());
}
function finishPerformance(){if(celloPerformance?.phase!=='playing')return;celloPerformance.returnStroke=reduced.matches?0:Math.sin(celloPerformance.elapsed*.0016)*.075*T.MathUtils.smoothstep(celloPerformance.elapsed,0,650);celloPerformance.phase='returning';celloPerformance.elapsed=0;const home=celloPerformance.home;animatePerformanceCamera({...home,lens:0},1500,true);celloPerformance.returnCameraStarted=true;performanceParts().back.hidden=true;pressed.clear();}
window.addEventListener('pagehide',()=>{
 performanceKeys.clear();performancePointers.clear();
 if(!celloPerformance)return;
 const p=celloPerformance;
 if(!p.arms){const a=performanceParts();a.stool.visible=true;celloPerformance=null;release();document.querySelector('.station-controls').hidden=false;$('cat-watch-access').hidden=false;}
 else if(p.phase==='egress'){p.forceExit=true;tickPerformance(0,performance.now());}
 else{p.forceExit=true;p.phase='returning';p.elapsed=4000;tickPerformance(0,performance.now());if(celloPerformance?.phase==='egress')tickPerformance(0,performance.now());}
 cameraMotion=null;performanceLens=0;camera.position.copy(p.home.position);camera.quaternion.copy(p.home.quaternion);camera.zoom=p.home.zoom;camera.updateProjectionMatrix();
});
function performancePose(amount,t){
 upperBody.position.set(0,-.07*amount,0);upperBody.rotation.set(.025*amount,0,(reduced.matches?0:Math.sin(t*.00125)*.010)*amount);
 for(const[leg,sign]of[[leftLeg,-1],[rightLeg,1]]){leg.position.set(sign*(.135+.065*amount),.53-.07*amount,0);const seatedAngle=Math.acos(Math.cos(1.18)+.08/(.195*Math.cos(.08)));leg.rotation.set(-seatedAngle*amount,0,-sign*.08*amount);leg.getObjectByName('leg-knee').rotation.x=seatedAngle*amount;leg.getObjectByName('leg-foot').rotation.x=0;leg.getObjectByName('leg-foot').position.y=-.195+.02359*amount;}
}
// One timeline, reversed on return: release only after the prop is back in its stand.
const PERFORMANCE_TRANSITION_MS=3550;
function performanceTransition(ms){
 const smooth=(start,end)=>{const x=T.MathUtils.clamp((ms-start)/(end-start),0,1);return x*x*(3-2*x);};
 return{step:smooth(0,650),face:smooth(0,350),reach:smooth(350,1000),carry:smooth(1000,2200),sit:smooth(2200,3050),bow:smooth(3050,3550),stage:ms<350?'face-step':ms<1000?'reach':ms<2200?'carry-turn':ms<3050?'sit':ms<3550?'bow-settle':'ready'};
}
function tickPerformance(dt,t){
 if(!celloPerformance||celloPerformance.phase==='approach')return;
 const p=celloPerformance,a=performanceParts();
 if(p.phase==='egress'){
  p.elapsed+=dt*1000;const u=reduced.matches||p.forceExit?1:Math.min(1,p.elapsed/p.egressDuration),from={...pos},to=p.egressTo;
  pos=pointAlongPath(p.egressFrom,p.egressRoute,u);const stepping=Math.hypot(pos.x-from.x,pos.z-from.z)>1e-6;if(stepping)heading=Math.atan2(pos.x-from.x,pos.z-from.z);avatar.position.set(pos.x,standY(pos),pos.z);avatar.rotation.y+=Math.atan2(Math.sin(heading-avatar.rotation.y),Math.cos(heading-avatar.rotation.y))*Math.min(1,dt*12);
  walkPose(stepping&&u<1?Math.sin(u*Math.PI*2)*.30:0,stepping&&u<1);animateIdle(t,true);
  if(u===1&&!inside(pos,STOOL_COLLIDER)){previewMode=null;celloPerformance=null;release();walkPose(0,false);document.querySelector('.station-controls').hidden=false;$('cat-watch-access').hidden=false;area.focus({preventScroll:true});}
  return;
 }
 p.elapsed+=dt*1000;const returning=p.phase==='returning',playing=p.phase==='playing';
 const clock=reduced.matches?(returning?0:PERFORMANCE_TRANSITION_MS):playing?PERFORMANCE_TRANSITION_MS:returning?PERFORMANCE_TRANSITION_MS-p.elapsed:p.elapsed;
 const phase=performanceTransition(clock),sit=phase.sit,carry=phase.carry;p.transitionStage=phase.stage;
 pos={x:T.MathUtils.lerp(p.approachPosition.x,p.seatPosition.x,carry),z:T.MathUtils.lerp(p.approachPosition.z,p.seatPosition.z,carry)};
 if(!returning&&!p.cameraStarted&&(clock>=1750||reduced.matches)){const view=performanceCamera();animatePerformanceCamera(view,1800);p.cameraStarted=true;}
 const pickupMark=new T.Vector3(p.celloPosition.x+.63,0,p.celloPosition.z+.05);
 const pickupYaw=Math.atan2(p.celloPosition.x-pickupMark.x,p.celloPosition.z-pickupMark.z),facing=p.fromHeading+Math.atan2(Math.sin(pickupYaw-p.fromHeading),Math.cos(pickupYaw-p.fromHeading))*phase.face;
 heading=facing+Math.atan2(Math.sin(PERFORMANCE_YAW-facing),Math.cos(PERFORMANCE_YAW-facing))*carry;
 avatar.rotation.y=heading;avatar.position.set(pos.x,standY(pos),pos.z);
 const pickupPoint=pointAlongPath(p.approachPosition,[{x:p.approachPosition.x,z:STOOL_COLLIDER.minZ-.10},{x:pickupMark.x,z:pickupMark.z}],phase.step);
 const pickupStep=new T.Vector3(pickupPoint.x-pos.x,0,pickupPoint.z-pos.z).multiplyScalar(1-carry);avatar.position.add(pickupStep);
 walkPose(0,false);animateIdle(t,true);performancePose(sit,t);head.rotation.y=-.12*sit;head.position.z=-.12*phase.reach*(1-carry);
 const footstep=(Math.sin(Math.PI*phase.step)*(1-phase.reach)+Math.sin(Math.PI*2*carry)*.65)*(1-sit);
 leftLeg.rotation.x+=.20*footstep;rightLeg.rotation.x-=.26*footstep;
 leftLeg.getObjectByName('leg-foot').rotation.x=.12*footstep;rightLeg.getObjectByName('leg-foot').rotation.x=-.12*footstep;
 const lean=p.celloPosition.clone().sub(avatar.position);lean.y=0;lean.normalize().applyAxisAngle(performanceUp,-heading).multiplyScalar(.06*phase.reach*(1-carry));upperBody.position.add(lean);
 // Same prop geometry and scale from stand to hands, with a continuous carried pose.
 a.instrument.scale.copy(cello.scale);
 const turn=Math.atan2(Math.sin(heading-pickupYaw),Math.cos(heading-pickupYaw));
 a.instrument.quaternion.setFromAxisAngle(performanceUp,turn*carry).multiply(new T.Quaternion().setFromEuler(p.celloRotation));
 const finalQ=new T.Quaternion().setFromEuler(new T.Euler(.18,PERFORMANCE_YAW,-.70,'YXZ'));a.instrument.quaternion.slerp(finalQ,sit);
 const neckLocal=new T.Vector3(.17,1.38,.08).multiplyScalar(cello.scale.x).applyQuaternion(a.instrument.quaternion);
 const heldNeck=new T.Vector3(.46,1.02-.07*sit,.34).applyAxisAngle(performanceUp,heading).add(avatar.position);
 a.instrument.position.lerpVectors(p.celloPosition,heldNeck.sub(neckLocal),carry);
 a.instrument.position.y+=Math.sin(Math.PI*carry)*.025;
 // Continuously ground the endpin correction, no threshold snap at 99%.
 a.instrument.updateMatrixWorld(true);
 const finalBox=new T.Box3().setFromObject(a.instrument);
 a.instrument.position.y+=(.015-finalBox.min.y)*sit;a.instrument.updateMatrixWorld(true);
 const ramp=T.MathUtils.smoothstep(p.elapsed,0,650);
 const stroke=reduced.matches?0:Math.sin(p.elapsed*.0016)*.075*ramp,motion=playing?stroke:returning?(p.returnStroke||0)*phase.bow:0;
 // Calibrated contact: actual string segment, between bridge and fingerboard.
 a.instrument.updateMatrixWorld(true);
 const stringY=.785,stringZ=.216+(.177-.216)*(stringY-.706)/(1.648-.706);
 const contact=new T.Vector3(0,stringY,stringZ).applyMatrix4(a.instrument.matrixWorld);
 const bowQ=a.instrument.quaternion.clone().multiply(new T.Quaternion().setFromAxisAngle(new T.Vector3(0,0,1),-Math.PI/2)).multiply(new T.Quaternion().setFromAxisAngle(new T.Vector3(0,1,0),-Math.PI/2));
 const bowScale=cello.scale.x;
 const contactOnHair=new T.Vector3(-.010,.38+motion/bowScale,0).multiplyScalar(bowScale).applyQuaternion(bowQ);
 const bowHand=contact.clone().sub(contactOnHair);
 const carriedBow=new T.Vector3(.399,.208,.047).applyMatrix4(a.instrument.matrixWorld);
 const relaxedBow=new T.Vector3(-.30,.36,.28).applyAxisAngle(performanceUp,heading).add(avatar.position);carriedBow.lerp(relaxedBow,carry);
 const carryBowQ=a.instrument.quaternion.clone().slerp(new T.Quaternion().setFromAxisAngle(performanceUp,heading),carry);
 const carriedGrip=carriedBow.clone().add(new T.Vector3(0,.85,0).multiplyScalar(a.instrument.scale.x).applyQuaternion(carryBowQ));
 const bowGrip=carriedGrip.lerp(bowHand,phase.bow);
 a.bow.quaternion.copy(carryBowQ).slerp(bowQ,phase.bow);a.bow.scale.setScalar(bowScale);
 a.bow.position.copy(bowGrip).sub(new T.Vector3(0,.85*(1-phase.bow),0).multiplyScalar(bowScale).applyQuaternion(a.bow.quaternion));

 a.grip.visible=phase.reach>.99;a.grip.position.copy(bowGrip);a.grip.quaternion.copy(a.bow.quaternion);
 if(p.arms){
   avatar.updateMatrixWorld(true);upperBody.updateMatrixWorld(true);
   const leftWorld=avatar.localToWorld(p.restHandLocal[0].clone()).lerp(bowGrip,phase.reach);
   const fingerTarget=new T.Vector3(.17,1.38,.08).applyMatrix4(a.instrument.matrixWorld);
   const rightWorld=avatar.localToWorld(p.restHandLocal[1].clone()).lerp(fingerTarget,phase.reach);
   const lengths=[.22,.18];for(const rig of p.arms)rig.lengths=lengths;
   // Move the shoulder girdle into the intersection of the two reach spheres.
   // No limb length is derived from target distance.
   const reach=lengths[0]+lengths[1]-.006;
   const torsoBefore=upperBody.position.clone();
   for(let pass=0;pass<12;pass++){
    upperBody.updateWorldMatrix(true,true);
    for(const[rig,target]of[[p.arms[0],leftWorld],[p.arms[1],rightWorld]]){
     const shoulder=upperBody.localToWorld(rig.arm.position.clone()),delta=target.clone().sub(shoulder),d=delta.length();
     if(d>reach){delta.multiplyScalar((d-reach)/d);const parentQ=upperBody.parent.getWorldQuaternion(new T.Quaternion());upperBody.position.add(delta.applyQuaternion(parentQ.invert()));upperBody.updateWorldMatrix(true,true);}
    }
   }
   p.shoulderCorrection=upperBody.position.distanceTo(torsoBefore);
   const leftTarget=upperBody.worldToLocal(leftWorld);
   aimPerformanceArm(p.arms[0],leftTarget,-1);
   aimPerformanceArm(p.arms[1],upperBody.worldToLocal(rightWorld),1);
 }
 if(p.phase==='playing'&&!reduced.matches)head.rotation.z=Math.sin(t*.0010)*.012;
 if(!returning&&p.phase==='seating'&&clock>=PERFORMANCE_TRANSITION_MS){p.phase='playing';p.elapsed=0;$('scene-status').textContent='大提琴演奏畫面，不記錄練習資料。可返回琴房。';a.back.hidden=false;a.back.focus({preventScroll:true});}
 if(returning&&(p.elapsed>=PERFORMANCE_TRANSITION_MS||reduced.matches)){
  for(const{arm,elbow,moved,snapshots}of p.arms){for(const{child,original}of moved){elbow.remove(child);arm.add(child);child.position.copy(original);}arm.remove(elbow);for(const saved of snapshots){saved.child.position.copy(saved.position);saved.child.scale.copy(saved.scale);saved.child.quaternion.copy(saved.quaternion);saved.child.name=saved.name;}for(const child of elbow.children){if(!moved.some(m=>m.child===child))child.geometry?.dispose();}arm.rotation.set(0,0,arm===leftArm?-.12:.12);}
  endPerformancePresentation();a.instrument.visible=a.bow.visible=a.grip.visible=false;a.stool.visible=true;cello.visible=celloShadowBridge.visible=pinContact.visible=true;release();walkPose(0,false);upperBody.position.set(0,0,0);head.rotation.y=0;head.position.z=0;p.phase='egress';p.transitionStage='step-clear';p.elapsed=0;p.egressFrom={x:avatar.position.x,z:avatar.position.z};p.egressTo=sideStoolEgress(p.egressFrom,STOOL_COLLIDER);p.egressDuration=Math.max(120,Math.min(650,Math.hypot(p.egressTo.x-p.egressFrom.x,p.egressTo.z-p.egressFrom.z)/.7*1000));p.egressRoute=routeAroundStool(p.egressFrom,p.egressTo,STOOL_COLLIDER)||[p.egressTo];pos={...p.egressFrom};
  if(!p.returnCameraStarted)animateRoomCamera(p.home.position,p.home.zoom,true,p.home.quaternion,0);area.focus({preventScroll:true});
 }
}

// Only the outside view changes. Room geometry and camera remain the same scene.
let performancePresentation=null;
const outdoorMaterials=[];livingLandscape.group.traverse(o=>{for(const m of(o.material?(Array.isArray(o.material)?o.material:[o.material]):[])){if(!outdoorMaterials.some(v=>v.m===m))outdoorMaterials.push({m,opacity:m.opacity});m.transparent=true;}});
previewLandscape.material.transparent=true;
function beginPerformancePresentation(){
 if(!performancePresentation)performancePresentation={amount:0,sky:windowGroup.children.filter(o=>['window-sky','window-sun','window-far-hill','window-near-hill'].includes(o.name)||o.name.startsWith('window-cloud')).map(o=>({o,visible:o.visible}))};
}
function endPerformancePresentation(){
 if(!performancePresentation)return;for(const{o,visible}of performancePresentation.sky)o.visible=visible;
 previewLandscape.visible=false;livingLandscape.group.visible=false;performancePresentation=null;
}
function renderPerformanceView(t){
 const ready=!software&&!!previewLandscape.userData.ready;
 if(performancePresentation){
  const p=celloPerformance,target=p?.phase==='returning'?Math.max(0,1-p.elapsed/900):(p?.cameraStarted?performanceLens:0);
  if(p?.phase==='playing')performancePresentation.amount=1;else performancePresentation.amount=target;
  const amount=performancePresentation.amount;
  previewLandscape.visible=livingLandscape.group.visible=ready&&amount>0;previewLandscape.material.opacity=amount;
  for(const{m,opacity}of outdoorMaterials)m.opacity=opacity*amount;
  for(const{o,visible}of performancePresentation.sky)o.visible=visible&&!(ready&&amount>=1);
  livingLandscape.tick(t*.001,reduced.matches);for(const c of livingLandscape.clouds)c.material.uniforms.opacity.value*=amount;
 }
 realRoomPolish?.updatePresentation?.(performanceLens);
 renderer.render(scene,camera);
}

const performanceKeys=new Set(),performancePointers=new Set();
window.addEventListener('keydown',e=>{if(!celloPerformance&&!performanceKeys.has(e.key))return;if(e.key==='Escape'&&celloPerformance?.phase==='playing'){e.preventDefault();e.stopImmediatePropagation();finishPerformance();return;}if(!keyMap[e.key]&&!['Enter',' ','Escape','e','E'].includes(e.key))return;if(celloPerformance?.phase==='playing'&&e.target===performanceAssets?.back&&['Enter',' '].includes(e.key))return;performanceKeys.add(e.key);e.preventDefault();e.stopImmediatePropagation();},{capture:true});
window.addEventListener('keyup',e=>performanceKeys.delete(e.key),{capture:true});
window.addEventListener('pointerdown',e=>{if(!celloPerformance||e.target===performanceAssets?.back)return;if(!e.target.closest?.('.stage,aside'))return;performancePointers.add(e.pointerId);e.preventDefault();e.stopImmediatePropagation();},{capture:true});
window.addEventListener('pointerup',e=>{if(performancePointers.delete(e.pointerId)){e.preventDefault();e.stopImmediatePropagation();}},{capture:true});
window.addEventListener('click',e=>{if(celloPerformance&&e.target!==performanceAssets?.back&&e.target.closest?.('.stage,aside')){e.preventDefault();e.stopImmediatePropagation();}},{capture:true});

document.addEventListener('keydown',e=>{if(e.key==='Escape'&&celloPerformance?.phase==='playing'){e.preventDefault();finishPerformance();return;}if(e.key==='Escape'&&watchingCat){e.preventDefault();endCatView();return;}if(!previewMode)return;if(e.key==='Escape'){e.preventDefault();exitPreview();return;}if(previewMode!=='records'&&e.target===area&&(e.key==='ArrowLeft'||e.key==='ArrowRight')){e.preventDefault();previewYaw+=(e.key==='ArrowLeft'?-1:1)*Math.PI/12;}});
area.addEventListener('pointerdown',e=>{if(!e.isPrimary){tap=null;return;}if(e.button!==0)return;if(!previewMode&&!watchingCat)release();tap={id:e.pointerId,x:e.clientX,y:e.clientY,yaw:previewYaw};if(previewMode)area.setPointerCapture(e.pointerId);});
area.addEventListener('pointermove',e=>{if(previewMode&&previewMode!=='records'&&tap?.id===e.pointerId)previewYaw=tap.yaw+(e.clientX-tap.x)*.012;});
area.addEventListener('pointercancel',()=>tap=null);area.addEventListener('lostpointercapture',()=>tap=null);
const celloHitBounds=new T.Box3().setFromObject(cello).expandByVector(new T.Vector3(.11,.075,.10));
const exitHitBounds=new T.Box3(new T.Vector3(-.79,0,1.70),new T.Vector3(.79,1.98,3.12));
const catHitBounds=new T.Box3().setFromObject(roomCat.group).expandByVector(new T.Vector3(.055,.045,.055));
function forgivingRoomHit(ray,nearest){
 let result=null,distance=Infinity;
 for(const[mode,bounds]of[['cello',celloHitBounds],['cat',catHitBounds],['exit',exitHitBounds]]){
  const point=ray.intersectBox(bounds,new T.Vector3());if(!point)continue;
  const d=point.distanceTo(ray.origin);if(nearest&&nearest.distance+.025<d)continue;
  if(d<distance){distance=d;result=mode;}
 }
 return result;
}
// Only cat taps may see through the player's own meshes. Furniture and walls
// stay blockers, and all other ray-hit/movement rules retain the original list.
function catThroughAvatar(ray,hits){
 const isPlayer=o=>{for(let p=o;p;p=p.parent)if(p===avatar)return true;return false;};
 if(!hits.length||!isPlayer(hits[0].object))return false;
 const nearest=hits.find(h=>!isPlayer(h.object));
 if(nearest?.object.userData.pet==='cat')return true;
 const point=ray.intersectBox(catHitBounds,new T.Vector3());
 return !!point&&(!nearest||nearest.distance+.025>=point.distanceTo(ray.origin));
}
// An avatar may cover the instrument after standing up; real furniture still occludes.
function celloThroughAvatar(hits){
 const isPlayer=o=>{for(let p=o;p;p=p.parent)if(p===avatar)return true;return false;};
 if(!hits.length||!isPlayer(hits[0].object))return false;
 return hits.find(h=>!isPlayer(h.object))?.object.userData.station==='cello';
}
area.addEventListener('pointerup',e=>{if(!tap||tap.id!==e.pointerId)return;const start=tap;tap=null;if(previewMode)return;if(Math.hypot(e.clientX-start.x,e.clientY-start.y)>12)return;const r=area.getBoundingClientRect();camera.updateMatrixWorld();raycaster.setFromCamera(new T.Vector2((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1),camera);scene.updateMatrixWorld(true);const blockers=raycaster.intersectObjects(scene.children,true).filter(h=>h.object!==targetMarker);if(!watchingCat&&celloThroughAvatar(blockers)){approachStation('cello');return;}const catBehindPlayer=catThroughAvatar(raycaster.ray,blockers);if(watchingCat){if(!catBehindPlayer&&blockers[0]?.object.userData.pet!=='cat'&&forgivingRoomHit(raycaster.ray,blockers[0])!=='cat')endCatView();return;}if(catBehindPlayer){approachStation('cat');return;}if(blockers[0]?.object.userData.station){approachStation(blockers[0].object.userData.station);return;}if(blockers[0]?.object.userData.pet==='cat'){approachStation('cat');return;}
// Padded physical boxes, not screen-wide shortcuts. Any nearer solid surface
// still wins; exact wardrobe/vanity/cello mesh hits were handled above.
const hitIntent=forgivingRoomHit(raycaster.ray,blockers[0]);if(hitIntent){approachStation(hitIntent);return;}
if(blockers[0]&&blockers[0].point.y>.11)return;const hit=new T.Vector3();if(!raycaster.ray.intersectPlane(floorPlane,hit)||Math.abs(hit.x)>3.05||hit.z< -2.35||hit.z>2.35)return;pendingStation=null;destination={x:Math.max(-2.2,Math.min(2.2,hit.x)),z:Math.max(-.8,Math.min(1.9,hit.z))};area.focus({preventScroll:true});});
function resize(){const w=area.clientWidth,h=area.clientHeight;renderer.setSize(w,h);const phone=w<600,size=Math.max(3.75,(phone?3.6:3.9)*h/w),lift=phone?size*.13:0;camera.left=-size*w/h;camera.right=size*w/h;camera.top=size-lift;camera.bottom=-size-lift;camera.updateProjectionMatrix();if(celloPerformance?.cameraStarted&&celloPerformance.phase!=='returning'){const view=performanceCamera();animatePerformanceCamera(view,350);}if(watchingCat){const view=catCameraTarget();animateRoomCamera(view.position,view.zoom,false,view.quaternion,350);}if(previewMode&&previewMode!=='records'&&previewMode!=='performance'&&roomSnapshot){const target=previewCameraTarget();animateRoomCamera(target.position,target.zoom);}}new ResizeObserver(resize).observe(area);resize();controls();const reduced=matchMedia('(prefers-reduced-motion: reduce)');let last=0,lastDraw=0;
// A real doorway arrival: the saved outfit walks inward while the view opens.
// Only the consumed town arrival parameter opts in; direct visits never replay.
let doorArrival=null;
// BEGIN ARRIVAL CONTRACT
// World-space contract for the existing south doorway, not a second stage.
const arrivalView={position:[4.1,5.2,7.0],target:[0,.9,1.65],zoom:1.55};
const arrivalEase=v=>{v=Math.max(0,Math.min(1,v));return v*v*(3-2*v);};
function doorArrivalState(ms){
 const approach=arrivalEase(ms/300),opening=arrivalEase((ms-300)/550);
 // Wait for the actual leaf to finish opening before crossing its plane.
 const entry=arrivalEase((ms-950)/1100),closing=arrivalEase((ms-2450)/550);
 const view=arrivalEase((ms-3100)/1100),turnBack=arrivalEase((ms-2050)/400),faceRoom=arrivalEase((ms-3000)/400);
 return {x:.10,z:entry===1?.65:2.98-.10*approach-2.23*entry,
 angle:Math.PI*.49*opening*(1-closing),heading:Math.PI*(1-turnBack+faceRoom),
 moving:ms<300||(ms>950&&ms<2050),view,done:ms>=4200};
}
// END ARRIVAL CONTRACT
function startDoorArrival(){
 if(!cameFromTown||reduced.matches)return;
 const home={position:camera.position.clone(),quaternion:camera.quaternion.clone(),zoom:camera.zoom};
 camera.position.set(...arrivalView.position);camera.lookAt(...arrivalView.target);camera.zoom=arrivalView.zoom;camera.updateProjectionMatrix();
 pos={x:.10,z:2.98};heading=Math.PI;avatar.position.set(pos.x,standY(pos),pos.z);avatar.rotation.y=heading;exitLeaf.rotation.y=0;
 doorArrival={home,start:null,last:null,elapsed:0,from:camera.position.clone(),fromQuaternion:camera.quaternion.clone(),fromZoom:camera.zoom};destination=null;
}
function cancelDoorArrival(){
 if(!doorArrival)return;
 const {home}=doorArrival;doorArrival=null;destination=null;pendingStation=null;
 pos={x:.10,z:.65};heading=Math.PI;avatar.rotation.y=heading;exitLeaf.rotation.y=0;pressed.clear();
 cameraMotion=null;camera.position.copy(home.position);camera.quaternion.copy(home.quaternion);camera.zoom=home.zoom;camera.updateProjectionMatrix();
}
function tickDoorArrival(t){
 if(!doorArrival)return;
 if(doorArrival.start===null)doorArrival.start=t;
 const a=doorArrival;a.elapsed+=a.last===null?0:Math.min(50,Math.max(0,t-a.last));a.last=t;
 const state=doorArrivalState(a.elapsed);
 pos={x:state.x,z:state.z};heading=state.heading;avatar.rotation.y=heading;exitLeaf.rotation.y=state.angle;
 camera.position.lerpVectors(a.from,a.home.position,state.view);camera.quaternion.slerpQuaternions(a.fromQuaternion,a.home.quaternion,state.view);camera.zoom=a.fromZoom+(a.home.zoom-a.fromZoom)*state.view;camera.updateProjectionMatrix();
 if(state.done){heading=Math.PI;doorArrival=null;}
}
function poseDoorArrival(t){
 if(!doorArrival)return;
 const e=doorArrival.elapsed,state=doorArrivalState(e);
 // Do not reach through the panel or fake remote handle contact. Door is self-closing.
 walkPose(state.moving?Math.sin(e*.014)*.48:0,state.moving);
 const cue=Math.max(0,Math.min(1,(e-100)/180))*Math.max(0,Math.min(1,(650-e)/250));leftArm.rotation.x=-.65*cue;
}
// The entrance is one short performance, not a skippable movement command.
// Capture only in-game input. Native browser Back and unrelated page UI remain native.
const arrivalHeldKeys=new Set(),arrivalPointers=new Set();
window.addEventListener('keydown',e=>{
 const gameKey=!!keyMap[e.key]||['Enter',' ','e','E'].includes(e.key);
 if(!gameKey)return;
 if(doorArrival||arrivalHeldKeys.has(e.key)){arrivalHeldKeys.add(e.key);e.preventDefault();e.stopImmediatePropagation();}
},{capture:true});
window.addEventListener('keyup',e=>arrivalHeldKeys.delete(e.key),{capture:true});
window.addEventListener('pointerdown',e=>{
 if(!doorArrival||!e.target.closest?.('.stage,aside'))return;
 arrivalPointers.add(e.pointerId);e.preventDefault();e.stopImmediatePropagation();
},{capture:true});
window.addEventListener('pointerup',e=>{
 if(!arrivalPointers.delete(e.pointerId))return;e.preventDefault();e.stopImmediatePropagation();
},{capture:true});
window.addEventListener('pointercancel',e=>arrivalPointers.delete(e.pointerId),{capture:true});
window.addEventListener('click',e=>{if(doorArrival&&e.target.closest?.('.stage,aside')){e.preventDefault();e.stopImmediatePropagation();}},{capture:true});
window.addEventListener('blur',()=>{arrivalPointers.clear();if(doorArrival)doorArrival.last=null;});
document.addEventListener('visibilitychange',()=>{if(doorArrival)doorArrival.last=null;});
window.addEventListener('pagehide',cancelDoorArrival);
// Time from the first actual animation frame, not module/shader startup.
startDoorArrival();
function standY(p){return (p.x*p.x/(1.6*1.6)+(p.z-.45)**2/(1.152*1.152)<=1?.045:.02)-.05;}
function walkPose(swing,moving,crouch=0){
 for(const[leg,theta]of[[leftLeg,swing],[rightLeg,-swing]]){
  const knee=leg.getObjectByName('leg-knee'),foot=leg.getObjectByName('leg-foot');if(knee)knee.rotation.x=0;if(foot)foot.rotation.x=0;
  leg.position.z=0;leg.rotation.x=theta;const sole=.53-.39*Math.cos(theta)-.065*Math.sin(theta)-Math.sqrt((.09*Math.cos(theta))**2+(.17*Math.sin(theta))**2);leg.position.y=.53+(moving&&theta>=0?.05-sole:0);
  if(!moving&&crouch>0&&knee&&foot){const drop=.30*crouch,back=.08*crouch,vertical=.39-drop,axis=-Math.atan2(back,vertical),bend=Math.acos(Math.hypot(vertical,back)/.39);leg.position.y=.53-drop;leg.position.z=-back;leg.rotation.x=axis-bend;knee.rotation.x=bend*2;foot.rotation.x=-axis-bend;}
 }
 leftArm.rotation.x=-swing*.85;rightArm.rotation.x=swing*.85;body.position.y=0;
}
function animateIdle(t,moving){
 const still=reduced.matches||moving,breath=still?0:Math.sin(t*.0017),sway=still?0:Math.sin(t*.00069)*.022;
 upperBody.traverse(o=>{if(o.name==='crouch-dress-hem')o.morphTargetInfluences[0]=catPose;});
 const lean=.28*catPose,pivot=.65;upperBody.position.set(sway,-.30*catPose+pivot*(1-Math.cos(lean))+breath*.006,-.08*catPose-pivot*Math.sin(lean));upperBody.rotation.set(lean,still?0:Math.sin(t*.00047)*.018,still?0:-sway*.65);
 head.rotation.z=still?0:Math.sin(t*.0007)*.032;head.rotation.y=still?0:Math.sin(t*.00043)*.040;
 head.rotation.x=(.28*catPose)+(still?0:Math.sin(t*.0011)*.018);head.position.y=1.49+breath*.009;
 leftArm.position.y=rightArm.position.y=1+breath*.007;
 if(!moving){leftArm.rotation.x=-.55*catPose+(still?0:Math.sin(t*.00093)*.065);rightArm.rotation.x=-.55*catPose+(still?0:Math.sin(t*.00093+1.1)*.055);}
 leftArm.rotation.z=-.12+(still?0:Math.sin(t*.00071)*.025);rightArm.rotation.z=.12+(still?0:Math.sin(t*.00071+1)*.025);
 const fm=sampleFaceMotion(faceRig.index,t,still,faceRig.motion);for(let i=0;i<2;i++){faceRig.eyes[i].scale.y=i?fm.eyeR:fm.eyeL;faceRig.eyes[i].position.x=(i?.126:-.126)+fm.gaze;faceRig.brows[i].position.y+=(i?fm.browR:fm.browL)-(faceRig.brows[i].userData.offset||0);faceRig.brows[i].userData.offset=i?fm.browR:fm.browL;faceRig.cheeks[i].scale.y=.020*fm.cheek;}
 faceRig.mouth.scale.set(fm.mouthX,fm.mouthY,1);head.rotation.z+=fm.tilt;

}
function frame(t){requestAnimationFrame(frame);const dt=Math.min((t-last)/1000,.05);last=t;if(document.hidden)return;watchPerformanceApproach(dt);if(celloPerformance?.phase==='approach'&&!destination){destination={...stationSpots.cello};pendingStation='cello';}tickDoorArrival(t);tickDoorCutaway(dt);tickRoomCamera(t,dt);windowMotes?.tick(t*.001,reduced.matches,Math.min(devicePixelRatio,2));windowRain?.tick(t*.001,reduced.matches);positionManuscript();if(reading&&reading.phase!=='walking'){if(!software||t-lastDraw>100){renderer.render(scene,camera);lastDraw=t;}return;}roomCat.animateCat(t,reduced.matches);animateWindowSky(t,reduced.matches);updateMirrorHint();tickCatPose(t);if(previewMode==='performance'){tickPerformance(dt,t);if(!software||t-lastDraw>100){renderPerformanceView(t);lastDraw=t;}return;}if(previewMode){if(previewMode!=='records')avatar.rotation.y=previewYaw;walkPose(0,false);animateIdle(t,false);if(!software||t-lastDraw>100){renderer.render(scene,camera);lastDraw=t;}return;}let x=(pressed.has('right')?1:0)-(pressed.has('left')?1:0),z=(pressed.has('down')?1:0)-(pressed.has('up')?1:0);let moving=x||z;if(catPose>.001&&!watchingCat){x=0;z=0;moving=false;}if(!moving&&destination&&catPose<.001){let next;if(mirrorCollider){const r=mirrorWalkRoute(pos,destination,[STOOL_COLLIDER,SCORE_TABLE_FOOTPRINT,mirrorCollider]);if(!r){destination=null;pendingStation=null;next=pos;}else{destination=r.goal;next=stepToward(pos,r.step,dt);}}else{destination=clearPoint(destination,STOOL_COLLIDER);destination=clearPoint(destination,SCORE_TABLE_FOOTPRINT);const tableRoute=segmentBlocked(pos,destination,SCORE_TABLE_FOOTPRINT)?routeAroundStool(pos,destination,SCORE_TABLE_FOOTPRINT):null;next=stoolRouteStep(pos,tableRoute?.[0]||destination,dt);}const dx=next.x-pos.x,dz=next.z-pos.z;moving=Math.hypot(dx,dz)>.0001;if(moving){heading=Math.atan2(dx,dz);walkPhase=roomWalkPhase(walkPhase,pos,next);pos=next;}if(destination&&Math.hypot(pos.x-destination.x,pos.z-destination.z)<.005)destination=null;}if(x||z){const a=.615,wx=x*Math.cos(a)+z*Math.sin(a),wz=-x*Math.sin(a)+z*Math.cos(a);const before=pos;const roomStep=guardedMove(pos,guardedMove(pos,move(pos,wx,wz,dt),SCORE_TABLE_FOOTPRINT),STOOL_COLLIDER);pos=mirrorCollider?guardedMove(pos,roomStep,mirrorCollider):roomStep;heading=Math.atan2(wx,wz);walkPhase=roomWalkPhase(walkPhase,before,pos);}if(!doorArrival&&Math.abs(pos.x)<.65&&pos.z>1.4){exitLeaf.rotation.y=Math.max(exitLeaf.rotation.y,Math.PI*.49*Math.min(1,(pos.z-1.4)/.38));}if(!doorArrival&&!exitArmed&&pos.z<1.4)exitArmed=true;if(!doorArrival&&exitArmed&&!watchingCat&&pos.z>=1.88&&Math.abs(pos.x)<.55){leaveRoom();return;}targetMarker.visible=!!destination;if(destination)targetMarker.position.set(destination.x,.085,destination.z);avatar.position.set(pos.x,standY(pos),pos.z);let delta=Math.atan2(Math.sin(heading-avatar.rotation.y),Math.cos(heading-avatar.rotation.y));avatar.rotation.y+=delta*Math.min(1,dt*12);const swing=moving?Math.sin(walkPhase)*.64:0;walkPose(swing,!!moving,catPose);animateIdle(t,!!moving);poseDoorArrival(t);if(pendingStation&&!destination){const station=pendingStation;if(Math.hypot(pos.x-stationSpots[station].x,pos.z-stationSpots[station].z)<.005){if(station==='mirror'){pos={...MIRROR_APPROACH};avatar.position.x=pos.x;avatar.position.z=pos.z;}enterPreview(station);}else pendingStation=null;}if(!software||t-lastDraw>100){if(rayMirrorFrame&&previewMode==='performance')renderPerformanceView(t);else renderer.render(scene,camera);lastDraw=t;}}
const westRoomDetail=installWestRoomDetail(T,scene);
// BEGIN INTERIOR SURFACE FINISH
if(!software){
 for(const board of scene.children.filter(mesh=>mesh.name==='handcrafted-oak-boards'))roomFinish(board,'boards',.74,1.34);
 roomFinish(rearWall,'limewash',3.4,1.9);roomFinish(sideWall,'limewash',2.1,1.4);
 // Refinish existing meshes only: don't add draws, alter the arch opening,
 // move the sill, obscure the panes, or change the furniture hit surfaces.
 roomFinish(windowFrame,'window-enamel',.90,.72);
 for(const trim of windowGroup.children.filter(o=>o.isMesh&&(o.renderOrder===8||o.renderOrder===9))){
  const sill=trim.renderOrder===9;
  roomFinish(trim,sill?'joinery-oil':'window-enamel',sill?.48:.76,sill?1.12:.94);
 }
 for(const part of scene.children.filter(o=>o.userData.station==='wardrobe'&&o.geometry?.type==='BoxGeometry')){
  const {height,width}=part.geometry.parameters;
  if(height>1.35&&width>.3)roomFinish(part,'joinery-oil',1,1.05);
  else if(width>1.2)roomFinish(part,'joinery-oil',.73,.95);
 }
 const vanityTop=vanity.children.find(o=>o.geometry?.type==='BoxGeometry'&&o.position.y===.78);
 if(vanityTop)roomFinish(vanityTop,'joinery-oil',.78,1.02);

 scoreTable.children.forEach((part,index)=>{
  if(part===manuscript)return;
  roomFinish(part,index===4?'soft-brass':'desk-oil',index===0?1.1:.77,index===0?.63:1.14);
 });
}
if(mirrorRoom&&!software)installRoomMaterialArt(T,scene,{plants:[eastFloorPlant,westFloorPlant],rug,table:scoreTable});
 // END INTERIOR SURFACE FINISH
const realRoomPolish=software?null:decoratePerformanceRoom(T,scene);const realStool=performanceParts().stool;realStool.position.set(STOOL_CENTER.x,0,STOOL_CENTER.z);realStool.rotation.y=PERFORMANCE_YAW;realStool.scale.y=.455/.375;realStool.visible=true;
// Replace the dressing table in the experimental room while keeping both
// appearance editors. Non-WebGL displays retain the same usable station.
if(mirrorRoom){
 vanity.removeFromParent();
 area.setAttribute('aria-label','3D房間，衣櫃可試穿，全身鏡可換造型，點地板行走');
 $('vanity-open').setAttribute('aria-label','在全身鏡前更換外觀');
 // A free-standing easel: leave a small physical clearance ahead of the baseboard.
 const skirtingFace=rearSkirting.position.z+rearSkirting.geometry.parameters.depth/2;
 const frame=new T.Group();frame.name='full-length-ray-mirror-frame';frame.position.set(MIRROR_WALL_X,FLOOR_TOP+1.080,skirtingFace+.475);scene.add(frame);
 const paneMount=new T.Group();paneMount.rotation.x=MIRROR_TILT;frame.add(paneMount);
 for(const side of [-1,1]){box(side*.425,0,0,.040,2.15,.062,'#9e7755',paneMount);box(0,side*1.055,0,.872,.041,.062,'#b99163',paneMount);}
 for(const side of [-1,1])box(side*.407,0,.032,.007,2.06,.006,'#d2b076',paneMount);
 for(const side of [-1,1]){
  rod([side*.359,-.12,-.054],[side*.359,-1.069,-.18],.018,'#9e7755',frame).name='free-standing-mirror-brace';
  box(side*.359,-1.063,.10,.067,.034,.60,'#896446',frame).name='free-standing-mirror-foot';
 }
 const surface=new T.Mesh(new T.PlaneGeometry(.816,2.104),new T.MeshBasicMaterial({color:'#b3c8c3',side:T.DoubleSide}));
 surface.position.z=.034;surface.name='full-length-mirror-surface';paneMount.add(surface);
 frame.traverse(o=>{o.userData.station='mirror';});
 const bounds=new T.Box3().setFromObject(frame),margin=.30;
 mirrorCollider={minX:bounds.min.x-margin,maxX:bounds.max.x+margin,minZ:bounds.min.z-margin,maxZ:bounds.max.z+.46};
 rayMirrorFrame=frame;
 // Reflections are part of the experimental room, not an opt-in link.
 if(!software&&mirrorSetting!=='0')requestAnimationFrame(()=>setTimeout(()=>{
  let reflected=null;
  try{
   const roots=scene.children.filter(o=>o!==frame&&o!==avatar&&o!==targetMarker&&o!==doorCutaway&&o!==roomCat.group&&o!==windowMotes?.points);
   reflected=createRoomRayMirror(T,roots,avatar,renderer,{cat:roomCat.group,light:sun});if(!reflected)return;
   reflected.mesh.scale.set(1.275,2.104/1.72,1);reflected.mesh.position.z=.035;reflected.mesh.userData.station='mirror';paneMount.add(reflected.mesh);
   let shaderRejected=false;const prior=renderer.debug.onShaderError;
   renderer.debug.onShaderError=(...args)=>{shaderRejected=true;prior?.(...args);};
   try{renderer.compile(reflected.mesh,camera,scene);renderer.properties.get(reflected.mesh.material).currentProgram?.getUniforms();}finally{renderer.debug.onShaderError=prior;}
   if(shaderRejected)throw new Error('mirror shader unavailable');
   surface.visible=false;
  }catch{if(reflected){reflected.mesh.removeFromParent();reflected.dispose();}surface.visible=true;}
 },0));
}
// Let the ordinary room render first. The offline lighting map is optional
// and computed once, from real window bars, without a new render pass.
if(mirrorRoom&&!software&&new URLSearchParams(location.search).get('roomlight')!=='0')requestAnimationFrame(()=>setTimeout(()=>{
 try{
  const floors=scene.children.filter(o=>o.name==='handcrafted-oak-boards');
  const receivers=[[rearWall,'rear'],[sideWall,'side'],[rug,'floor'],...floors.map(o=>[o,'floor'])];
  const stats=traceRoomDaylight(T,{scene,opening:windowGroup,aperture:WINDOW_APERTURE,mullions:daylightMullions,receivers});
  scene.userData.daylightStats=stats;
  // The packaged town module exports its absolute-clock weather. No
  // URL flag or cached "weather at entry" can leave this scene stale.
  import('../garden.js?v=woodland-037').then(({weatherAt})=>{
   let lastWeather=null;
   const updateWeather=()=>{
    const weather=weatherAt().key;if(weather===lastWeather)return;
    lastWeather=weather;scene.userData.roomWeather=weather;
    const rain=weather==='rain';stats.setRain(rain);
    livingLandscape.setRain(rain);windowMotes?.setRain(rain);windowRain?.setRain(rain);
    sun.intensity=rain?1.58:2.88;sun.color.set(rain?'#bdcfe7':'#ffefd0');
    fixedWindowSun.visible=!rain;
    directWindowSky.material.color.set(rain?'#9aafc2':'#a5cfca');
    previewLandscape.material.color.set(rain?'#becada':'#ffffff');
   };
   updateWeather();
   setInterval(()=>{if(!document.hidden)updateWeather();},1200);
   document.addEventListener('visibilitychange',()=>{if(!document.hidden)updateWeather();});
  }).catch(()=>{ /* The room also works standalone with the authored sunny lighting. */ });
 }catch{ /* Preserve the authored room lighting on devices without transport maps. */ }
},50));
requestAnimationFrame(frame);
renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();release();$('scene-status').textContent='3D 畫面暫停，請重新整理恢復。';status.textContent='3D 顯示中斷，穿搭設定仍保留。請重新整理。';});

// Warm only fetched bytes after the room is usable. Never execute town code/audio
// or wait for this optional cache work when the door navigates.
function scheduleTownReturnWarmup(){
 const connection=navigator.connection;
 if(connection?.saveData||/^(slow-2g|2g)$/.test(connection?.effectiveType||''))return;
 let loaded=document.readyState==='complete',suspended=false,completed=false,running=false,scheduled=false,epoch=0,controller=null,rearm=false;
 const allowed=()=>loaded&&!suspended&&!document.hidden&&!completed;
 const stop=()=>{epoch++;scheduled=false;controller?.abort();};
 const ready=()=>{
  if(!allowed()||scheduled)return;
  if(running){rearm=true;return;}
  scheduled=true;const ticket=epoch;
  requestAnimationFrame(()=>requestAnimationFrame(()=>{
   if(ticket!==epoch||!allowed())return;
   const launch=()=>{if(ticket!==epoch||!allowed())return;scheduled=false;return run();};
   if('requestIdleCallback'in window)window.requestIdleCallback(launch,{timeout:5000});else setTimeout(launch,1500);
  }));
 };
 const run=async()=>{
  if(running||!allowed())return;
  running=true;rearm=false;const attempt=++epoch,abort=new AbortController();controller=abort;
  const current=()=>attempt===epoch&&!abort.signal.aborted&&allowed();
  try{
   const target=new URL('../?from=room',location.href),response=await fetch(target.href,{credentials:'same-origin',priority:'low',signal:abort.signal});
   if(!current()||!response.ok)return;const html=await response.text();if(!current()||html.length>200000)return;
   const doc=new DOMParser().parseFromString(html,'text/html'),base=new URL('./',target),urls=new Set();
   for(const node of doc.querySelectorAll('link[rel="modulepreload"],link[rel="stylesheet"],script[type="module"][src]')){
    const u=new URL(node.getAttribute('href')||node.getAttribute('src'),base);
    if(u.origin===base.origin&&u.pathname.startsWith(base.pathname)&&/\.(?:js|css)$/.test(u.pathname))urls.add(u.href);
    if(urls.size===32)break;
   }
   let success=true;const queue=[...urls];await Promise.all([0,1].map(async()=>{while(queue.length&&current()){const url=queue.shift();try{const r=await fetch(url,{credentials:'same-origin',cache:'force-cache',priority:'low',signal:abort.signal});if(r.ok)await r.arrayBuffer();else success=false;}catch{success=false;}}}));
   if(current()&&success&&queue.length===0)completed=true;
  }catch{/* Optional warm-up must never affect room input or navigation. */}
  finally{running=false;if(controller===abort)controller=null;if(rearm){rearm=false;ready();}}
 };
 window.addEventListener('pagehide',()=>{suspended=true;rearm=false;stop();});
 window.addEventListener('pageshow',()=>{suspended=false;ready();});
 document.addEventListener('visibilitychange',()=>{if(document.hidden){rearm=false;stop();}else ready();});
 if(loaded)ready();else window.addEventListener('load',()=>{loaded=true;ready();},{once:true});
}
scheduleTownReturnWarmup();
