import {collection} from './model.js?v=10';
export const WEATHER=[{name:'晴光微風',key:'sun',wind:'5.5s'},{name:'柔風拂葉',key:'breeze',wind:'3.8s'},{name:'細雨潤花',key:'rain',wind:'6.5s'}];
export function weatherAt(now=Date.now()){return WEATHER[Math.floor(now/120000)%WEATHER.length];}
export const BED={cx:380,cy:286,rx:300,ry:66};
export function plantPosition(slot){
 const row=Math.floor(slot/6),col=slot%6;
 // Five staggered rows inside the SAME ellipse rendered as soil below.
 const y=row===0?308:252+(row-1)*13, x=162+col*84+(row%2?18:0);
 return {x,y,scale:row===0?1.95:.88+row*.12};
}
export function insideBed(x,y){return ((x-BED.cx)/BED.rx)**2+((y-BED.cy)/BED.ry)**2<1;}
export function gardenPlants(state){return collection(state).flatMap((f,i)=>f.earned?Array.from({length:Math.min(f.count,5)},(_,n)=>({...f,species:i,slot:n*6+i})):[]);}
function blossom(f){const i=f.species;
 // Plush, rounded silhouettes retain each collected flower's palette/species.
 const petals=(count,rx,ry,cy,rotate=0)=>Array.from({length:count},(_,n)=>`<g transform="rotate(${rotate+n*360/count})"><ellipse cx="0" cy="${cy}" rx="${rx}" ry="${ry}" fill="url(#petal-${i})" stroke="${f.shade}" stroke-width="1.25"/><ellipse cx="-2" cy="${cy-3}" rx="${rx*.4}" ry="${ry*.37}" fill="#fffdf3" opacity=".45"/></g>`).join('');
 const shape=i===0?petals(9,7,13,-14):i===1?petals(6,11,13,-12):i===2?petals(6,12,13,-12):i===3?petals(5,10,11,-11):i===4?petals(10,7,12,-13)+petals(7,5,9,-8,20):petals(6,8,16,-11);
 const center=i===2?'#8d739b':f.center;
 return shape+`<circle r="10" fill="${center}" stroke="${f.shade}" stroke-width="1"/><ellipse cx="-3" cy="-4" rx="5" ry="2.5" fill="#fff7d4" opacity=".45"/><g fill="#675345"><ellipse cx="-3.6" cy=".5" rx="1.1" ry="1.6"/><ellipse cx="3.6" cy=".5" rx="1.1" ry="1.6"/></g><path d="M-2 4Q0 6 2 4" fill="none" stroke="#675345" stroke-width="1" stroke-linecap="round"/><g fill="#f1a4a0" opacity=".6"><ellipse cx="-6" cy="3" rx="2" ry="1"/><ellipse cx="6" cy="3" rx="2" ry="1"/></g>`;
}
export function gardenScene(state,weather=WEATHER[0]){
 const plants=gardenPlants(state), weatherSafe=WEATHER.find(w=>w.key===weather.key)||WEATHER[0];
 const gradients=collection(state).map((f,i)=>`<radialGradient id="petal-${i}" cx="35%" cy="20%"><stop stop-color="#fffaf1"/><stop offset=".4" stop-color="${f.petal}"/><stop offset="1" stop-color="${f.shade}"/></radialGradient>`).join('');
 const flowers=[...plants].sort((a,b)=>plantPosition(a.slot).y-plantPosition(b.slot).y).map(f=>{const {x,y,scale}=plantPosition(f.slot);return `<g transform="translate(${x} ${y}) scale(${scale})"><ellipse cy="1" rx="18" ry="4" fill="#443c2b" opacity=".22"/><g class="garden-stem" style="--delay:-${f.slot*.63}s"><path d="M0 0Q-7-38 0-83" fill="none" stroke="#466d45" stroke-width="3.4"/><path d="M-1-4Q-8-40-1-80" fill="none" stroke="#a6bc7c" stroke-width=".8"/><path d="M-2-25Q-35-29-27-45Q-9-43-2-25M-3-45Q23-62 27-48Q16-30-3-45" fill="#72956b"/><path d="m-3-27-20-15m20-1 24-8" fill="none" stroke="#b8c9a0" stroke-width=".8"/><g transform="translate(0 -85)">${blossom(f)}</g></g></g>`;}).join('');
 return `<div class="garden-scene weather-${weatherSafe.key}" style="--wind:${weatherSafe.wind}"><div class="garden-scene-label"><span>一方小花圃</span><small>${weatherSafe.name} · 遊戲天氣</small></div><svg viewBox="55 55 650 325" role="img" aria-label="${plants.length?'你的花圃，種著已獲得的'+collection(state).filter(f=>f.earned).map(f=>f.name).join('、'):'安靜的空花圃，等待第一朵練習獎勵'}"><defs><linearGradient id="garden-sky" x2="0" y2="1"><stop stop-color="#d6edf0"/><stop offset="1" stop-color="#fff6da"/></linearGradient><linearGradient id="garden-ground" x2="0" y2="1"><stop stop-color="#d7e4b2"/><stop offset="1" stop-color="#9fbd81"/></linearGradient><radialGradient id="garden-light"><stop stop-color="#fff9d5" stop-opacity=".95"/><stop offset="1" stop-color="#fff9d5" stop-opacity="0"/></radialGradient><linearGradient id="garden-soil" x2="0" y2="1"><stop stop-color="#756f52"/><stop offset="1" stop-color="#a09270"/></linearGradient>${gradients}</defs><rect width="760" height="410" fill="url(#garden-sky)"/><circle class="garden-sun" cx="585" cy="90" r="125" fill="url(#garden-light)"/><path d="M0 176Q130 105 250 167T510 151T760 160V410H0Z" fill="#bbd8ad"/><path d="M0 215Q150 164 330 207T760 195V410H0Z" fill="url(#garden-ground)"/><g opacity=".35" fill="#9bad85"><ellipse cx="39" cy="150" rx="46" ry="65"/><ellipse cx="742" cy="144" rx="55" ry="81"/></g><ellipse cx="380" cy="315" rx="332" ry="74" fill="#365441" opacity=".12"/>
<ellipse cx="380" cy="298" rx="320" ry="81" fill="#9a8f72"/>
<ellipse cx="380" cy="286" rx="320" ry="81" fill="#e0d8bd"/>
<ellipse cx="380" cy="286" rx="307" ry="70" fill="#c1baa1"/>
<ellipse cx="${BED.cx}" cy="${BED.cy}" rx="${BED.rx}" ry="${BED.ry}" fill="url(#garden-soil)"/>
${Array.from({length:90},(_,n)=>{const a=n*2.39996,r=Math.sqrt((n+.5)/90);return `<ellipse cx="${380+292*r*Math.cos(a)}" cy="${286+61*r*Math.sin(a)}" rx="${1+n%3}" ry="1" fill="${n%2?'#d4bd91':'#665d45'}" opacity=".55"/>`;}).join('')}
${Array.from({length:18},(_,n)=>{const a=n*Math.PI/17;return `<path d="M${380+309*Math.cos(a)} ${286+72*Math.sin(a)}l2 12" stroke="#afa58b" stroke-width="1.6"/>`;}).join('')}
<path d="M74 293Q380 426 686 293" fill="none" stroke="#f0e8ce" stroke-width="3" opacity=".65"/>
<g transform="translate(650 204)" aria-hidden="true"><ellipse cx="0" cy="18" rx="20" ry="4" fill="#4b6b4b" opacity=".12"/><ellipse cx="0" cy="6" rx="15" ry="12" fill="#e9e4d4"/><circle cx="-9" cy="0" r="10" fill="#f4f0e3"/><ellipse cx="-15" cy="-15" rx="4" ry="12" fill="#f4f0e3" transform="rotate(-12 -15 -15)"/><ellipse cx="-6" cy="-16" rx="4" ry="12" fill="#f4f0e3"/><path d="M-15-22v12M-6-24v13" stroke="#d8b7ac" stroke-width="2" stroke-linecap="round"/><circle cx="-12" cy="-1" r="1.5" fill="#655d53"/><circle cx="14" cy="5" r="5" fill="#f6f2e8"/></g>
${flowers}<g class="garden-butterfly" aria-hidden="true"><g transform="translate(620 95)"><path d="M0 0C-25-21-28 11-2 8C-18 25 8 27 2 6C27 17 28-14 2 0" fill="#f2c98b" stroke="#cb9f6e" stroke-width="1"/><path d="M0-3v14m0-11-3-5m3 5 3-5" stroke="#887252" fill="none" stroke-width="1.3"/></g></g><g class="garden-rain" stroke="#f8fcff" stroke-width="1" opacity=".55">${Array.from({length:28},(_,n)=>`<path d="m${n*29} ${n*43%320} 5 16"/>`).join('')}</g>${!plants.length?'<text x="380" y="290" text-anchor="middle" fill="#f5f1df" font-size="16" font-family="sans-serif">讓下一次練習，在這裡開花。</text>':''}</svg><p>慢慢練，也慢慢長大。${plants.length?'每一種花，都來自你已交付的練習。收藏數量完整保留。':'交付第一輪任務後，這裡就會迎來第一朵花。'}</p></div>`;
}
