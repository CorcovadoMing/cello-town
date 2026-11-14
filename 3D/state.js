export const KEY='cello-town-3d-avatar-v1';
export const OPTIONS={face:['暖暖微笑','好奇眼神','自在瞇眼'],hair:['栗子短髮','柔軟鮑伯','雙丸子'],skin:['#f6d5b6','#e7b58e','#bb805d','#81513c'],hairColor:['#563b30','#b37b45','#302f36','#a75e4e'],outfit:['森林背心裙','小鎮吊帶褲','柔軟針織衫'],color:['#719781','#d88f83','#b8a4cc','#ddb45f'],hat:['不戴帽子','小蝴蝶結','畫家貝雷帽'],accessory:['簡單就好','圓框眼鏡','隨身小包']};
export function defaults(){return Object.fromEntries(Object.keys(OPTIONS).map(k=>[k,0]));}
export function normalize(x){const out=defaults();for(const k in out)if(Number.isInteger(x?.[k])&&x[k]>=0&&x[k]<OPTIONS[k].length)out[k]=x[k];return out;}
export function update(s,k,v){return normalize({...s,[k]:v});}
export function move(p,x,z,dt){const len=Math.hypot(x,z)||1,speed=1.65*Math.min(Math.max(dt,0),.05);const next={x:Math.max(-2.2,Math.min(2.2,p.x+x/len*speed)),z:Math.max(-.8,Math.min(1.9,p.z+z/len*speed))};return next;}
