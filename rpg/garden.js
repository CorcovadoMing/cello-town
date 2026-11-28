import {collection} from './model.js?v=23';
export const WEATHER=[{name:'晴光微風',key:'sun',wind:'5.5s'},{name:'柔風拂葉',key:'breeze',wind:'3.8s'},{name:'雨落小鎮',key:'rain',wind:'6.5s'}];
// Local ambient rhythm: 3m sun, 3m breeze, then 6m of rain in a 12m cycle.
// No real-world weather, location request, or saved clock to migrate.
const SUN_MS=180000,BREEZE_MS=180000,RAIN_MS=360000,CYCLE_MS=SUN_MS+BREEZE_MS+RAIN_MS;
export function weatherAt(now=Date.now()){const phase=((now%CYCLE_MS)+CYCLE_MS)%CYCLE_MS;return WEATHER[phase<SUN_MS?0:phase<SUN_MS+BREEZE_MS?1:2];}
export const BED={cx:380,cy:286,rx:300,ry:66};
export function plantPosition(slot){
 // One specimen per earned species: three taller back plants, three lower front plants.
 const positions=[{x:185,y:318,scale:1.65},{x:245,y:264,scale:1.48},{x:410,y:264,scale:1.48},{x:365,y:318,scale:1.65},{x:545,y:318,scale:1.65},{x:575,y:264,scale:1.48}];
 return {...positions[slot]};
}
export function insideBed(x,y){return ((x-BED.cx)/BED.rx)**2+((y-BED.cy)/BED.ry)**2<1;}
export function gardenPlants(state){return collection(state).flatMap((f,i)=>f.earned?[{...f,species:i,slot:i}]:[]);}
// Empty slots are prepared soil, not planted seeds or pending rewards.
// The saved model awards blooms directly on turn-in; there is no growing phase.
export function preparedSoilSlots(state){return collection(state).flatMap((f,i)=>f.earned?[]:[i]);}
function preparedSoilArt(state){return preparedSoilSlots(state).map(slot=>{const {x,y}=plantPosition(slot);return `<g class="garden-prepared-soil" data-empty-slot="${slot}" transform="translate(${x} ${y})" aria-hidden="true"><ellipse cy="2" rx="29" ry="9" fill="#ac8a61" opacity=".72"/><path d="M-24 0Q0-8 24 0M-23 5Q0-3 23 5" fill="none" stroke="#705b42" stroke-width="2.2" stroke-linecap="round" opacity=".76"/><path d="M-21-2Q0-8 21-2M-20 3Q0-3 20 3" fill="none" stroke="#d0ad7b" stroke-width="1.4" stroke-linecap="round" opacity=".8"/></g>`;}).join('');}
export function drawPreparedSoil(g,state){
 // A few shallow rake marks on each empty position, not separate mounds.
 for(const slot of preparedSoilSlots(state)){const {x,y}=townPlantPosition(slot);g.save();g.translate(x,y+3);g.lineCap='round';g.globalAlpha=.34;
  for(const dy of[-3,2]){g.strokeStyle='#664f35';g.lineWidth=1.05;g.beginPath();g.moveTo(-8,dy+1);g.quadraticCurveTo(0,dy-1,9,dy);g.stroke();}g.restore();
 }
}
// Stylized botanical references, not cultivar identification (see QA-v20.md).
export const BOTANY=[
 {kind:'daisy',height:65,leaf:'rosette'}, {kind:'cosmos',height:92,leaf:'feathery'},
 {kind:'anemone',height:77,leaf:'lobed'}, {kind:'forget-me-not',height:59,leaf:'oval'},
 {kind:'calendula',height:74,leaf:'spoon'}, {kind:'lily',height:101,leaf:'lance'}
];
function blossom(f){const i=f.species;
 const petal=(d,n,offset=0)=>Array.from({length:n},(_,k)=>`<g transform="rotate(${offset+k*360/n})"><path d="${d}" fill="url(#petal-${i})" stroke="${f.shade}" stroke-width=".8"/><path d="M0-8Q-2-17 0-24" fill="none" stroke="#fffdf2" stroke-width=".7" opacity=".6"/></g>`).join('');
 const dots=(n,r,c)=>Array.from({length:n},(_,k)=>`<circle cx="${Math.cos(k*2.399)*r*Math.sqrt((k+1)/n)}" cy="${Math.sin(k*2.399)*r*Math.sqrt((k+1)/n)}" r=".9" fill="${c}"/>`).join('');
 if(i===5)return `<g transform="rotate(13)">${petal('M0 6C-8-4-19-23-10-29Q-4-30 0-24Q4-30 10-29C19-23 8-4 0 6Z',3)}${petal('M0 5Q-17-13 0-38Q17-13 0 5Z',3,60)}<path d="M0 3L-12-14M0 3L2-20M0 3L15-13" stroke="#94a063" stroke-width="1.4"/><g fill="#b8863f"><ellipse cx="-12" cy="-14" rx="3" ry="1.3" transform="rotate(30 -12 -14)"/><ellipse cx="2" cy="-20" rx="3" ry="1.3"/><ellipse cx="15" cy="-13" rx="3" ry="1.3" transform="rotate(-25 15 -13)"/></g><circle cy="3" r="3" fill="#d8c47e"/></g>`;
 let shape,center=f.center,r=8;
 if(i===0){shape=petal('M-2-6Q-7-21-3-28Q0-31 3-28Q7-21 2-6Z',18);r=9;}
 if(i===1){shape=petal('M-4-4Q-18-15-12-27L-7-25L-3-29L1-26L6-29Q19-18 5-4Z',8);r=6;}
 if(i===2){shape=petal('M-3-3Q-24-8-21-23Q-17-36-4-30Q13-34 16-23Q19-9 3-3Z',6,15);r=8;center='#4b3a65';}
 if(i===3){shape=petal('M-2-2Q-10-6-7-12Q0-18 7-12Q10-6 2-2Z',5);r=3;}
 if(i===4){shape=petal('M-2-5Q-8-20-3-29Q0-32 3-29Q8-20 2-5Z',19)+`<g transform="scale(.73) rotate(10)">${petal('M-2-5Q-8-20-3-29Q0-32 3-29Q8-20 2-5Z',15)}</g>`;r=7;}
 return shape+`<circle r="${r+1}" fill="${f.shade}"/><circle r="${r}" fill="${center}"/>${dots(i===2?28:17,r-1,i===2?'#bda2d0':'#fce39d')}<ellipse cx="-2" cy="-3" rx="3" ry="1.5" fill="#fff7d4" opacity=".38"/>`;
}
function foliage(i){
 const leaf=(x,y,angle,s=1)=>`<g transform="translate(${x} ${y}) rotate(${angle}) scale(${s})"><path d="M0 0Q-16-9-7-28Q10-20 0 0" fill="#658c62"/><path d="M0 0Q-5-13-7-24" fill="none" stroke="#a9c28a" stroke-width=".8"/></g>`;
 if(i===0)return [-65,-30,15,50,85].map(a=>leaf(0,-2,a,1.1)).join('');
 if(i===1)return [-1,1].map(dir=>`<g transform="translate(-2 -32) scale(${dir} 1)"><path d="M0 0L28-21M5-4L7-18M11-8L13-25M17-12L21-29M8-6L23-5M17-12L31-14" stroke="#668e62" stroke-width="1.5" stroke-linecap="round" fill="none"/></g>`).join('');
 if(i===2)return [-1,1].map(d=>`<path transform="translate(0 -26) scale(${d} 1)" d="M0 0L9-14L11-6L18-22L21-13L30-16L27-7L32-3L17 0L19 6L5 4Z" fill="#698e63" stroke="#b1c990" stroke-width=".6"/>`).join('');
 if(i===5)return [18,38,57,73].map((y,k)=>`<path d="M-2-${y}Q${k%2?28:-28}-${y+19} ${k%2?24:-24}-${y+28}Q${k%2?10:-10}-${y+18}-2-${y}Z" fill="${k%2?'#789b6c':'#597e58'}"/>`).join('');
 return leaf(-2,-16,-50,i===3?.72:1.1)+leaf(-3,-34,65,i===3?.7:1.0)+leaf(0,-3,30,.8);
}
function plant(f){const h=BOTANY[f.species].height;
 const stem=`<path d="M0 0Q-7-${h*.5} 0-${h}" fill="none" stroke="#4f7952" stroke-width="2.8"/><path d="M-1-3Q-6-${h*.5}-1-${h-2}" fill="none" stroke="#adc68d" stroke-width=".65"/>`;
 if(f.species===3)return stem+foliage(3)+[-1,0,1].map((n)=>`<path d="M-2-27Q${n*24}-${h-4} ${n*18}-${h+5-n*9}" fill="none" stroke="#63865c" stroke-width="1.5"/><g transform="translate(${n*18} ${-h-5+n*9}) scale(.82)">${blossom(f)}</g>`).join('');
 return stem+foliage(f.species)+`<g transform="translate(0 -${h}) rotate(${f.slot%2?9:-7})">${blossom(f)}</g>`;
}
export function gardenScene(state,weather=WEATHER[0]){
 const plants=gardenPlants(state), weatherSafe=WEATHER.find(w=>w.key===weather.key)||WEATHER[0];
 const gradients=collection(state).map((f,i)=>`<radialGradient id="petal-${i}" cx="35%" cy="20%"><stop stop-color="#fffaf1"/><stop offset=".4" stop-color="${f.petal}"/><stop offset="1" stop-color="${f.shade}"/></radialGradient>`).join('');
 const flowers=[...plants].sort((a,b)=>plantPosition(a.slot).y-plantPosition(b.slot).y).map(f=>{const {x,y,scale}=plantPosition(f.slot);return `<g data-species="${BOTANY[f.species].kind}" transform="translate(${x} ${y}) scale(${scale})"><ellipse cy="1" rx="18" ry="4" fill="#443c2b" opacity=".22"/><g class="garden-stem" style="--delay:-${f.slot*.63}s">${plant(f)}</g></g>`;}).join('');
 return `<div class="garden-scene weather-${weatherSafe.key}" style="--wind:${weatherSafe.wind}"><div class="garden-scene-label"><span>一方小花圃</span><small>${weatherSafe.name} · 遊戲天氣</small></div><svg viewBox="55 55 650 325" role="img" aria-label="${plants.length?'你的花圃，種著已獲得的'+collection(state).filter(f=>f.earned).map(f=>f.name).join('、'):'已整好的空花圃，等待第一朵練習獎勵'}"><defs><linearGradient id="garden-sky" x2="0" y2="1"><stop stop-color="#d6edf0"/><stop offset="1" stop-color="#fff6da"/></linearGradient><linearGradient id="garden-ground" x2="0" y2="1"><stop stop-color="#d7e4b2"/><stop offset="1" stop-color="#9fbd81"/></linearGradient><radialGradient id="garden-light"><stop stop-color="#fff9d5" stop-opacity=".95"/><stop offset="1" stop-color="#fff9d5" stop-opacity="0"/></radialGradient><linearGradient id="garden-soil" x2="0" y2="1"><stop stop-color="#756f52"/><stop offset="1" stop-color="#a09270"/></linearGradient>${gradients}</defs><rect width="760" height="410" fill="url(#garden-sky)"/><circle class="garden-sun" cx="585" cy="90" r="125" fill="url(#garden-light)"/><path d="M0 176Q130 105 250 167T510 151T760 160V410H0Z" fill="#bbd8ad"/><path d="M0 215Q150 164 330 207T760 195V410H0Z" fill="url(#garden-ground)"/><g opacity=".35" fill="#9bad85"><ellipse cx="39" cy="150" rx="46" ry="65"/><ellipse cx="742" cy="144" rx="55" ry="81"/></g><ellipse cx="380" cy="315" rx="332" ry="74" fill="#365441" opacity=".12"/>
<ellipse cx="380" cy="298" rx="320" ry="81" fill="#9a8f72"/>
<ellipse cx="380" cy="286" rx="320" ry="81" fill="#e0d8bd"/>
<ellipse cx="380" cy="286" rx="307" ry="70" fill="#c1baa1"/>
<ellipse cx="${BED.cx}" cy="${BED.cy}" rx="${BED.rx}" ry="${BED.ry}" fill="url(#garden-soil)"/>
${Array.from({length:90},(_,n)=>{const a=n*2.39996,r=Math.sqrt((n+.5)/90);return `<ellipse cx="${380+292*r*Math.cos(a)}" cy="${286+61*r*Math.sin(a)}" rx="${1+n%3}" ry="1" fill="${n%2?'#d4bd91':'#665d45'}" opacity=".55"/>`;}).join('')}
${Array.from({length:18},(_,n)=>{const a=n*Math.PI/17;return `<path d="M${380+309*Math.cos(a)} ${286+72*Math.sin(a)}l2 12" stroke="#afa58b" stroke-width="1.6"/>`;}).join('')}
<path d="M74 293Q380 426 686 293" fill="none" stroke="#f0e8ce" stroke-width="3" opacity=".65"/>
<g transform="translate(650 204)" aria-hidden="true"><ellipse cx="0" cy="18" rx="20" ry="4" fill="#4b6b4b" opacity=".12"/><ellipse cx="0" cy="6" rx="15" ry="12" fill="#e9e4d4"/><circle cx="-9" cy="0" r="10" fill="#f4f0e3"/><ellipse cx="-15" cy="-15" rx="4" ry="12" fill="#f4f0e3" transform="rotate(-12 -15 -15)"/><ellipse cx="-6" cy="-16" rx="4" ry="12" fill="#f4f0e3"/><path d="M-15-22v12M-6-24v13" stroke="#d8b7ac" stroke-width="2" stroke-linecap="round"/><circle cx="-12" cy="-1" r="1.5" fill="#655d53"/><circle cx="14" cy="5" r="5" fill="#f6f2e8"/></g>
${preparedSoilArt(state)}${flowers}<g class="garden-butterfly" aria-hidden="true"><g transform="translate(620 95)"><path d="M0 0C-25-21-28 11-2 8C-18 25 8 27 2 6C27 17 28-14 2 0" fill="#f2c98b" stroke="#cb9f6e" stroke-width="1"/><path d="M0-3v14m0-11-3-5m3 5 3-5" stroke="#887252" fill="none" stroke-width="1.3"/></g></g><g class="garden-rain" stroke="#f8fcff" stroke-width="1" opacity=".55">${Array.from({length:28},(_,n)=>`<path d="m${n*29} ${n*43%320} 5 16"/>`).join('')}</g>${!plants.length?'<text x="380" y="290" text-anchor="middle" fill="#f5f1df" font-size="16" font-family="sans-serif">讓下一次練習，在這裡開花。</text>':''}</svg><p>慢慢練，也慢慢長大。${plants.length?'每一種花，都來自你已交付的練習。收藏數量完整保留。':'交付第一輪任務後，這裡就會迎來第一朵花。'}</p></div>`;
}

// Town and close-up share the same one-per-earned-species selection.
export function townPlantPosition(species){
 const p=[{x:767,y:482},{x:777,y:440},{x:827,y:440},{x:817,y:482},{x:867,y:482},{x:877,y:440}];
 return {...p[species]};
}
