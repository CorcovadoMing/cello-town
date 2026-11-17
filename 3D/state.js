export const KEY='cello-town-3d-avatar-v1';
export const OPTIONS={
faceShape:['奶油小橢圓','軟軟鵝蛋','糯米小圓臉','蜜桃小愛心','吐司圓方臉','花生小豆臉','澎澎梨子臉','小杏仁臉'],
face:['暖暖招呼','探頭好奇','滿足瞇瞇','溫柔陪伴','小聲哼歌','開心偷笑','發現驚喜','俏皮眨眼'],
hair:['栗葉小短髮','內彎奶油鮑伯','緞帶雙丸子','燕麥低馬尾','側分小波浪','雲朵小捲髮','清風後梳','柔波及肩髮'],
skin:['#f6d5b6','#e7b58e','#bb805d','#81513c'],hairColor:['#563b30','#b37b45','#302f36','#a75e4e'],
outfit:['森林背心裙','小鎮吊帶褲','柔軟針織衫','小旅人外套'],
upper:['田園刺繡罩衫','工房口袋吊帶','奶油麻花開衫','郵差小斗篷外套','花瓣領泡泡袖','晨讀學院背心','園藝翻袖襯衫','雲朵連帽衫'],
lower:['緞結花苞裙','工房口袋褲','柔褶直筒褲','小紳士窄腳褲','手風琴百褶裙','晨讀寬褲','園藝反摺褲','野餐短褲'],
shoes:['葉結圓頭鞋','蜂蜜扣瑪莉珍','奶油翻領短靴','餅乾底帆布鞋','花瓣交帶舞鞋','小穗樂福鞋','栗子工房靴','雲朵慢跑鞋'],
color:['#719781','#d88f83','#b8a4cc','#ddb45f'],lowerColor:['#719781','#d88f83','#b8a4cc','#ddb45f','#798c84','#b2a087','#a99b84','#ddd2b7'],
hat:['不戴帽子','玫瑰緞帶結','畫家刺繡貝雷','花邊野餐帽','小花絨髮箍','小鎮徽章帽','奶茶毛球帽','草地漁夫帽','栗子報童帽'],
accessory:['簡單就好','蜂蜜圓框鏡','小鎮郵差背包','露珠珍珠耳墜','櫻花耳飾','莓果柔方框','橄欖半月鏡','星光細髮夾','小月亮耳釘']};
export function defaults(){return {...Object.fromEntries(Object.keys(OPTIONS).map(k=>[k,0])),legacyOutfit:-1};}
export function normalize(x){const out=defaults();for(const k in OPTIONS)if(Number.isInteger(x?.[k])&&x[k]>=0&&x[k]<OPTIONS[k].length)out[k]=x[k];for(const k of ['upper','lower'])if(x?.[k]===undefined&&Number.isInteger(x?.outfit)&&x.outfit>=0&&x.outfit<4)out[k]=x.outfit;if(x?.lowerColor===undefined)out.lowerColor=x?.outfit===1?4:x?.outfit===2?5:x?.outfit===3?6:out.color;if(x?.faceShape===undefined&&Number.isInteger(x?.face)&&x.face>=0&&x.face<3)out.faceShape=x.face;const original=Number.isInteger(x?.legacyOutfit)?x.legacyOutfit:x?.upper===undefined&&x?.lower===undefined&&Number.isInteger(x?.outfit)?x.outfit:-1;
// Preserve the old saved silhouette until the user explicitly chooses clothing.
if(original>=0&&original<4&&out.upper===original&&out.lower===original&&out.shoes===0)out.legacyOutfit=original;
return out;}
export function update(s,k,v){return normalize({...s,[k]:v,...(['upper','lower','shoes'].includes(k)?{legacyOutfit:-1}:{})});}
export function move(p,x,z,dt){const len=Math.hypot(x,z)||1,speed=1.65*Math.min(Math.max(dt,0),.05);const next={x:Math.max(-2.2,Math.min(2.2,p.x+x/len*speed)),z:Math.max(-.8,Math.min(1.9,p.z+z/len*speed))};return next;}

export function stepToward(p,target,dt){const dx=target.x-p.x,dz=target.z-p.z,d=Math.hypot(dx,dz),step=1.65*Math.min(Math.max(dt,0),.05);if(d<=step)return {...target};return move(p,dx,dz,dt);}

// Original clay-collectible silhouettes; stable indices preserve existing saves.
export const FACE_SHAPES=Object.freeze([
 {name:'奶油小橢圓',rx:.382,ry:.405,jaw:.10,cheek:.025},
 {name:'軟軟鵝蛋',rx:.359,ry:.438,jaw:.16,cheek:.015},
 {name:'糯米小圓臉',rx:.410,ry:.388,jaw:.025,cheek:.065},
 {name:'蜜桃小愛心',rx:.391,ry:.416,jaw:.27,cheek:.045},
 {name:'吐司圓方臉',rx:.402,ry:.401,jaw:-.035,cheek:.015},
 {name:'花生小豆臉',rx:.347,ry:.420,jaw:.13,cheek:.075},
 {name:'澎澎梨子臉',rx:.379,ry:.414,jaw:-.10,cheek:.10},
 {name:'小杏仁臉',rx:.370,ry:.425,jaw:.23,cheek:.005}
]);
export const FACE_NAMES=['暖暖招呼','探頭好奇','滿足瞇瞇','溫柔陪伴','小聲哼歌','開心偷笑','發現驚喜','俏皮眨眼'];
export function faceWidth(shape,y){const q=Math.max(-1,Math.min(1,y/shape.ry));return shape.rx*(1-shape.jaw*Math.max(0,-q)+shape.cheek*Math.exp(-(((q+.28)/.34)**2)));}
// Caller reuses one target object. No geometry/material/array allocations per frame.
export function sampleFaceMotion(index,t,reduced=false,out={}){
 const u=reduced?0:t*.001,w=Math.sin(u*1.5),pulse=reduced?0:(1-Math.cos(u*2.2))*.5;
 out.eyeL=1;out.eyeR=1;out.mouthX=1;out.mouthY=1;out.browL=0;out.browR=0;out.cheek=1;out.tilt=0;out.gaze=0;
 if(index===0){out.eyeL=out.eyeR=1-.18*pulse;out.mouthX=1+.10*pulse;out.cheek=1+.08*pulse;}
 if(index===1){out.gaze=reduced?0:Math.sin(u*.9)*.006;out.browL=.008*pulse;out.eyeR=1+.13*pulse;out.tilt=.045*w;}
 if(index===2){out.eyeL=out.eyeR=1+.12*pulse;out.cheek=1+.12*pulse;out.mouthY=1-.20*pulse;out.tilt=.018*w;}
 if(index===3){out.eyeL=out.eyeR=1-.24*pulse;out.browR=-.004*pulse;out.mouthX=1+.06*pulse;out.tilt=-.027*pulse;}
 if(index===4){out.mouthX=1-.18*pulse;out.mouthY=1+.45*pulse;out.browL=out.browR=.003*w;out.tilt=.025*w;}
 if(index===5){out.eyeL=out.eyeR=1-.16*pulse;out.mouthY=1+.22*pulse;out.cheek=1+.13*pulse;out.tilt=.026*Math.sin(u*3.2);}
 if(index===6){out.eyeL=out.eyeR=1+.15*pulse;out.mouthX=1-.12*pulse;out.mouthY=1+.25*pulse;out.browL=out.browR=.010*pulse;}
 if(index===7){out.eyeL=1+.25*pulse;out.eyeR=1-.12*pulse;out.mouthX=1+.13*pulse;out.browL=.008*pulse;out.tilt=-.04*pulse;}
 return out;
}

// Scope the cancelable top-edge pull to this room; preserve inner scrolling and pinch zoom.
export function isPullToRefresh({dx,dy,touches,atTop,nestedCanScroll,zoomed=false}){
  return touches===1 && atTop && !nestedCanScroll && !zoomed && dy>6 && dy>Math.abs(dx);
}

export function installPullToRefreshGuard(doc=document, win=window){
  let origin=null;
  const nestedCanScroll=(target,root)=>{
    for(let el=target; el && el!==root && el!==doc.body; el=el.parentElement){
      if(el.nodeType!==1 || el.scrollTop<=1 || el.scrollHeight<=el.clientHeight)continue;
      if(/^(auto|scroll|overlay)$/.test(win.getComputedStyle(el).overflowY))return true;
    }
    return false;
  };
  doc.addEventListener('touchstart',e=>{
    const t=e.touches[0];
    origin=e.touches.length===1?{x:t.clientX,y:t.clientY,target:e.target}:null;
  },{passive:true});
  doc.addEventListener('touchmove',e=>{
    if(!origin || !e.cancelable)return;
    const t=e.touches[0],root=doc.scrollingElement||doc.documentElement;
    if(e.touches.length!==1 || !t){origin=null;return;}
    if(isPullToRefresh({dx:t.clientX-origin.x,dy:t.clientY-origin.y,touches:e.touches.length,
      atTop:root.scrollTop<=1,nestedCanScroll:nestedCanScroll(origin.target,root),
      zoomed:(win.visualViewport?.scale||1)>1.01}))e.preventDefault();
  },{passive:false});
  for(const event of ['touchend','touchcancel'])doc.addEventListener(event,()=>{origin=null;},{passive:true});
}
