export const KEY='cello-town-3d-avatar-v1';
export const OPTIONS={
faceShape:['柔和橢圓臉','修長鵝蛋臉','圓潤臉','柔心形','俐落方形','窄橢圓','寬顴形','柔菱形'],
face:['暖暖微笑','好奇眼神','自在瞇眼','溫柔垂眼','平靜','眉眼笑','驚喜','眨眼'],
hair:['栗子短髮','柔軟鮑伯','雙丸子','低馬尾','側分短髮','蓬鬆捲髮','後梳短髮','及肩長髮'],
skin:['#f6d5b6','#e7b58e','#bb805d','#81513c'],hairColor:['#563b30','#b37b45','#302f36','#a75e4e'],
outfit:['森林背心裙','小鎮吊帶褲','柔軟針織衫','小旅人外套'],
upper:['奶油襯衫','吊帶罩衫','柔軟針織衫','小旅人外套','蝴蝶領上衣','短背心襯衫','捲袖工作衫','連帽外套'],
lower:['皺褶裙','吊帶長褲','直筒長褲','合身長褲','百褶裙','寬管長褲','反摺工作褲','短褲'],
shoes:['圓頭平底鞋','瑪莉珍鞋','短靴','繫帶帆布鞋','芭蕾平底鞋','樂福鞋','工作靴','運動鞋'],
color:['#719781','#d88f83','#b8a4cc','#ddb45f'],lowerColor:['#719781','#d88f83','#b8a4cc','#ddb45f','#798c84','#b2a087','#a99b84','#ddd2b7'],
hat:['不戴帽子','小蝴蝶結','畫家貝雷帽','寬緣帽','細髮箍','棒球帽','針織帽','漁夫帽','軟呢帽'],
accessory:['簡單就好','圓框眼鏡','隨身小包','細長耳墜','花形耳飾','方框眼鏡','半框眼鏡','星形髮夾','小圓耳釘']};
export function defaults(){return {...Object.fromEntries(Object.keys(OPTIONS).map(k=>[k,0])),legacyOutfit:-1};}
export function normalize(x){const out=defaults();for(const k in OPTIONS)if(Number.isInteger(x?.[k])&&x[k]>=0&&x[k]<OPTIONS[k].length)out[k]=x[k];for(const k of ['upper','lower'])if(x?.[k]===undefined&&Number.isInteger(x?.outfit)&&x.outfit>=0&&x.outfit<4)out[k]=x.outfit;if(x?.lowerColor===undefined)out.lowerColor=x?.outfit===1?4:x?.outfit===2?5:x?.outfit===3?6:out.color;if(x?.faceShape===undefined&&Number.isInteger(x?.face)&&x.face>=0&&x.face<3)out.faceShape=x.face;const original=Number.isInteger(x?.legacyOutfit)?x.legacyOutfit:x?.upper===undefined&&x?.lower===undefined&&Number.isInteger(x?.outfit)?x.outfit:-1;
// Preserve the old saved silhouette until the user explicitly chooses clothing.
if(original>=0&&original<4&&out.upper===original&&out.lower===original&&out.shoes===0)out.legacyOutfit=original;
return out;}
export function update(s,k,v){return normalize({...s,[k]:v,...(['upper','lower','shoes'].includes(k)?{legacyOutfit:-1}:{})});}
export function move(p,x,z,dt){const len=Math.hypot(x,z)||1,speed=1.65*Math.min(Math.max(dt,0),.05);const next={x:Math.max(-2.2,Math.min(2.2,p.x+x/len*speed)),z:Math.max(-.8,Math.min(1.9,p.z+z/len*speed))};return next;}

export function stepToward(p,target,dt){const dx=target.x-p.x,dz=target.z-p.z,d=Math.hypot(dx,dz),step=1.65*Math.min(Math.max(dt,0),.05);if(d<=step)return {...target};return move(p,dx,dz,dt);}
