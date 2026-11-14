import {gardenScene,weatherAt} from './garden.js?v=8';
import {DEV_TOOLS} from './config.js?v=8';
import {fresh,normalize,accept,complete,turnIn,again,NOTES,questView,resetRound,FLOWERS,collection,bloomCount,addElapsed,formatElapsed,historyDuration,completeRoundForTest} from './model.js?v=8';
let gameWeather=weatherAt();
const $=id=>document.getElementById(id), canvas=$('world'),g=canvas.getContext('2d'),dlg=$('dialog'),KEY='cello-town-rpg-v1';
let state=fresh(),storeOK=true;try{const raw=localStorage.getItem(KEY);if(raw)state=normalize(JSON.parse(raw));}catch{storeOK=false;}
const player={x:460,y:425,dir:1,walking:false};const npc={x:303,y:290},stand={x:655,y:310},garden={x:710,y:460};let keys=new Set(),target=null,last=0,near=null,task='listen',revealed=false,demoDone=false,practiced=false,context,timer,mode=null,voices=new Set(),step=0,next=0,generation=0;
function persist(){try{localStorage.setItem(KEY,JSON.stringify(state));storeOK=true;}catch{storeOK=false;}}
function save(){persist();render();}
let timerStarted=null,practiceOpen=false;
function checkpointTimer(now=performance.now()){
 if(timerStarted===null)return;
 state=addElapsed(state,Math.max(0,now-timerStarted));timerStarted=now;persist();
}
function pausePracticeTimer(){if(timerStarted!==null){checkpointTimer();timerStarted=null;}renderTimer();}
function renderTimer(){
 if(!$('practice-time'))return;
 $('practice-time').textContent=formatElapsed((state.roundMs||0)/1000);
 $('timer-status').textContent=timerStarted!==null?'練習計時中':'已暫停';
}
function resumePracticeTimer(){if(practiceOpen&&dlg.open&&!document.hidden&&['active','ready'].includes(state.phase)&&timerStarted===null){state={...state,roundTimed:true};persist();timerStarted=performance.now();}renderTimer();}
setInterval(()=>{if(timerStarted!==null){checkpointTimer();renderTimer();}},1000);
function render(){
 document.querySelector('.topline span').textContent=gameWeather.name+' · 練琴日';
  const quest=questView(state);
  renderTimer();
  $('quest-hud').hidden=!quest.visible;
  $('quest-hud').classList.toggle('ready',quest.ready);
  $('quest-count').textContent=quest.count+'/3';
  $('quest-count').setAttribute('aria-label','三項練習已完成 '+quest.count+' 項');
  $('quest-status').textContent=quest.ready?'三項練習已完成，尚未交付。':'到戶外譜架開始練習。';
  $('quest-return').hidden=!quest.ready;
  document.querySelectorAll('[data-step]').forEach(li=>{
    const done=state.steps.includes(li.dataset.step);
    li.classList.toggle('done',done);
    const current=li.dataset.step===quest.next;
    li.classList.toggle('current',current);
    if(current)li.setAttribute('aria-current','step');else li.removeAttribute('aria-current');
    li.querySelector('b').textContent=done?'✓':current?'›':'○';
    li.setAttribute('aria-label',li.querySelector('span').textContent+(done?'，已完成':'，待完成'));
  });
  $('flower-count').textContent=bloomCount(state);
  renderCollection();
  $('storage').textContent=storeOK?'':'此瀏覽器無法保存進度，離開後可能遺失。';
}
let toastTimer;function toast(s){$('toast').textContent=s;$('toast').style.opacity=1;clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').style.opacity=0,5500);}
function show(html){practiceOpen=false;pausePracticeTimer();stop();keys.clear();target=null;$('dialog-body').innerHTML=html;dlg.showModal();}
function talk(){const phase=state.phase;const text={available:'歡迎來到弓弦小鎮。我是這座小鎮的音樂老師。先不急著拉快，我們從 D 大調的一個八度開始，好嗎？',active:'右邊戶外練習區的譜架在等你。先聽一遍，再跟著拍子拉，最後把提示收起來試試。慢慢來。',ready:'你已經走完三段練習了。不是每個音都完美才算進步，願意再試一次，就是很好的開始。',done:'你的第一朵花開了！想再走一遍 D 大調嗎？之前的足跡會留下，不會被清空。'}[phase];show(`<div class="eyebrow">老師 · 小鎮的音樂嚮導</div><h2>${phase==='ready'?'歡迎回來，旅人。':'來，讓琴聲出發。'}</h2><p>${text}</p><p class="reward">✿ D 大調的邀請 · 聽音 / 跟拍 / 記憶</p><button class="primary" id="npc-action">${{available:'接下任務',active:'我去練習',ready:'交付任務 · 種一朵花',done:'再練一輪'}[phase]}</button><button class="secondary" id="later">等一下再說</button>`);$('later').onclick=()=>dlg.close();$('npc-action').onclick=()=>{if(phase==='available'){state=accept(state);save();dlg.close();toast('任務接取！走到右邊的戶外譜架，開始練習。');}else if(phase==='ready'){pausePracticeTimer();state=turnIn(state);save();show(`<div class="eyebrow">QUEST COMPLETE</div><div class="reward-flower">${flowerArt(FLOWERS[(bloomCount(state)-1)%FLOWERS.length])}</div><p class="flower-name">${FLOWERS[(bloomCount(state)-1)%FLOWERS.length].name}</p><h2>小鎮，多了一點你的聲音。</h2><p>D 大調的邀請已完成。花園裡多了一朵花，練習手札也留下了這次足跡。</p><p class="hint">這是你的練習確認，不是音準或演奏能力評分。</p><button class="primary" id="done-close">回到小鎮</button>`);$('done-close').onclick=()=>dlg.close();}else if(phase==='done'){pausePracticeTimer();state=again(state);save();dlg.close();toast('新的一輪準備好了，和老師說話就能接取。');}else dlg.close();};}
function practice(){if(state.phase==='available'){toast('先和左邊的老師說話，接下第一個任務。');return;}if(state.phase==='done'){toast('這輪任務已完成。可以找老師接下一輪，或打開練習手札。');return;}task=['listen','rhythm','memory'].find(n=>!state.steps.includes(n))||'memory';demoDone=state.steps.includes('listen');practiced=false;revealed=false;show('<div></div>');practiceUI();}
const descriptions={listen:['聽見 D 大調','先聽 D3 到 D4 的合成參考音，再拿起琴試著找出第一個音。','我已聽過示範'],rhythm:['讓每一弓跟上拍子','選一個舒服的速度，一拍一個音。拉完一個八度上行和下行，再確認這次練習。','我已跟拍練過'],memory:['把音階留在心裡','先收起音名，試著拉一遍。不記得也沒關係，可以再看看提示。','我已嘗試不看提示']};
function practiceUI(){const d=descriptions[task];$('dialog-body').innerHTML=`<div class="eyebrow">戶外譜架 · D 大調 · 一個八度</div><div class="practice-timer" aria-label="本輪練習計時"><svg class="clock-icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="13" r="8"/><path d="M12 9v4l3 2M9 2h6M12 2v3"/></svg><span id="practice-time" aria-label="本輪累計時間">00:00</span><span id="timer-status">接任務後可開始</span></div><div class="tabs" role="tablist" aria-label="練習階段">${['listen','rhythm','memory'].map((s,i)=>`<button role="tab" aria-selected="${s===task}" data-tab="${s}">${state.steps.includes(s)?'✓ ':''}${['聽音','跟拍','記憶'][i]}</button>`).join('')}</div><h2>${d[0]}</h2><p>${d[1]}</p><div class="notes ${task==='memory'&&!revealed?'hidden':''}" aria-hidden="${task==='memory'&&!revealed}">${NOTES.map(n=>`<span>${n}</span>`).join('')}</div>${task==='memory'?'<button class="secondary" id="reveal">'+(revealed?'收起提示':'看看音名')+'</button>':''}<label for="bpm">速度 <strong id="bpm-label">${state.bpm} BPM</strong></label><input id="bpm" type="range" min="40" max="120" value="${state.bpm}"><label for="volume">音量 <strong id="volume-label">${Math.round(state.volume*100)}%</strong></label><input id="volume" type="range" min="0" max="100" value="${Math.round(state.volume*100)}"><div id="beat" aria-hidden="true">○ ○ ○ ○</div><button class="secondary" id="audio">${task==='listen'?'播放參考音':'開始節拍器'}</button><button class="primary" id="finish" ${state.steps.includes(task)||(task==='listen'&&!demoDone)?'disabled':''}>${state.steps.includes(task)?'這段已記下 ✓':d[2]}</button><p class="status" id="audio-status" role="status"></p><p class="hint">由你確認實際練習。此雛型不收音、不判斷音準。關閉視窗或離開頁面會停止聲音。</p>`;practiceOpen=true;resumePracticeTimer();document.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>{stop();task=b.dataset.tab;revealed=false;practiceUI();});if($('reveal'))$('reveal').onclick=()=>{revealed=!revealed;const el=document.querySelector('.notes');el.classList.toggle('hidden',!revealed);el.setAttribute('aria-hidden',String(!revealed));$('reveal').textContent=revealed?'收起提示':'看看音名';};$('bpm').oninput=e=>{state.bpm=Number(e.target.value);$('bpm-label').textContent=state.bpm+' BPM';save();};$('volume').oninput=e=>{state.volume=Number(e.target.value)/100;$('volume-label').textContent=e.target.value+'%';save();};$('audio').onclick=startAudio;$('finish').onclick=()=>{if(task==='listen'&&!demoDone)return;stop();state=complete(state,task);save();if(state.phase==='ready'){dlg.close();toast('練習完成！回到老師身旁，交付你的任務。');}else{task=['listen','rhythm','memory'].find(s=>!state.steps.includes(s));practiceUI();}};}
function flowerArt(f){return `<svg viewBox="0 0 100 110" aria-hidden="true"><ellipse cx="50" cy="99" rx="28" ry="5" fill="#294a3515"/><path d="M50 92V49" stroke="#557c56" stroke-width="4" stroke-linecap="round"/><path d="M49 78Q24 76 27 62Q47 61 49 78M51 87Q75 84 74 70Q56 70 51 87" fill="#7c9e69"/><g fill="${f.petal}" stroke="${f.shade}" stroke-width="1.5">${Array.from({length:6},(_,i)=>`<ellipse cx="50" cy="29" rx="11" ry="18" transform="rotate(${i*60} 50 47)"/>`).join('')}</g><circle cx="50" cy="47" r="11" fill="${f.center}"/><circle cx="47" cy="44" r="3" fill="#fff7d8" opacity=".7"/><path d="M18 20h6m-3-3v6M78 55h6m-3-3v6" stroke="${f.shade}" stroke-width="2" stroke-linecap="round"/></svg>`;}
function renderCollection(){
 if(!$('collection-grid'))return;
 const flowers=collection(state),earned=flowers.filter(f=>f.earned).length;
 $('collection-count').textContent=earned+' / '+FLOWERS.length;
 $('collection-grid').innerHTML=flowers.map((f,i)=>`<div class="flower-card ${f.earned?'earned':'locked'}">${flowerArt(f)}<span>${f.earned?f.name:'未收藏'}</span><small>${f.earned?'已種下 '+f.count+' 朵':'第 '+(i+1)+' 次交付解鎖'}</small></div>`).join('');
 $('next-flower').textContent='下一朵：'+FLOWERS[bloomCount(state)%FLOWERS.length].name+' · 交付任務後綻放';
}
function openGarden(){show(`<div class="eyebrow">YOUR GARDEN</div><div id="garden-view">${gardenScene(state,gameWeather)}</div><section class="collection" aria-label="花朵收藏"><div class="collection-heading"><span class="eyebrow">YOUR BLOOM COLLECTION</span><span id="collection-count"></span></div><h2>把練習，種成花。</h2><div id="collection-grid"></div><p id="next-flower"></p><p class="collection-note">六種花依序收藏，每次手動交付獲得一朵。休息不會失去收藏。</p></section><button id="garden-close" class="primary">回到小鎮</button>`);renderCollection();$('garden-close').onclick=()=>dlg.close();}
function rewardPreview(){const f=FLOWERS[bloomCount(state)%FLOWERS.length];show(`<div class="eyebrow">PREVIEW ONLY · 不計入收藏</div><div class="reward-flower">${flowerArt(f)}</div><h2>${f.name}</h2><p>這是下一次交付可獲得的花。預覽不會完成任務、不新增花朵，也不改變手札。</p><button class="primary" id="preview-close">關閉預覽</button>`);$('preview-close').onclick=()=>dlg.close();}
const devTools=document.querySelector('.dev-tools');
if(DEV_TOOLS){devTools.hidden=false;
$('preview-reward').onclick=rewardPreview;
$('test-complete').onclick=()=>{pausePracticeTimer();if(state.phase==='done'){toast('本輪已交付，不重複領花。');return;}state=completeRoundForTest(state);save();toast('測試：本輪已完成，新增一朵花及一筆手札；沒有虛構練習時間。');};
$('reset-round').onclick=()=>{show('<div class="eyebrow">DEVELOPMENT / TEST</div><h2>重設本輪任務？</h2><p>只清除本輪的接取、三項練習進度及計時，回到可接任務狀態。已獲得的花、歷史手札、筆記和音量／速度設定全部保留。</p><button class="secondary" id="reset-cancel">取消</button><button class="primary" id="reset-confirm">確認重設本輪</button>');$('reset-cancel').onclick=()=>dlg.close();$('reset-confirm').onclick=()=>{pausePracticeTimer();state=resetRound(state);demoDone=false;practiced=false;revealed=false;save();dlg.close();toast('本輪已重設。花園、手札與聲音設定都保留了。');};};
}else devTools.remove();
function journal(){show('<div class="eyebrow">MY PRACTICE JOURNAL</div><h2>那些慢慢累積的音。</h2><p>已種下 '+bloomCount(state)+' 朵花。休息不會讓它們消失。</p><label for="note">下次想回來練的地方</label><textarea id="note" maxlength="400" placeholder="例如：F♯ 到 G 的換指，再放慢一點。"></textarea><div id="history"></div><p class="hint">進度只存在這台裝置的瀏覽器，不會跨裝置同步。</p>');$('note').value=state.note;$('note').oninput=e=>{state.note=e.target.value;save();};if(!state.history.length)$('history').textContent='第一段足跡，等你寫下。';state.history.slice().reverse().forEach(h=>{const el=document.createElement('div');el.className='journal-entry';el.textContent=`✿ D 大調 · ${h.bpm} BPM · ${historyDuration(h)}`;const sm=document.createElement('small');sm.textContent=new Date(h.at).toLocaleString('zh-TW')+(h.note?' · '+h.note:'');el.append(sm);$('history').append(el);});}
const freq=[146.8324,164.8138,184.9972,195.9977,220,246.9417,277.1826,293.6648];function stop(){generation++;clearInterval(timer);mode=null;voices.forEach(v=>{try{v.stop();}catch{}});voices.clear();if($('audio'))$('audio').textContent=task==='listen'?'播放參考音':'開始節拍器';if($('beat'))$('beat').textContent='○ ○ ○ ○';}
function tone(f,t,len,click){if(state.volume===0)return;const o=context.createOscillator(),a=context.createGain();o.type=click?'sine':'triangle';o.frequency.value=f;a.gain.setValueAtTime(0,t);a.gain.linearRampToValueAtTime(state.volume*(click?.42:.3),t+.008);a.gain.exponentialRampToValueAtTime(.0001,t+len);o.connect(a);a.connect(context.destination);voices.add(o);o.onended=()=>{voices.delete(o);o.disconnect();a.disconnect();};o.start(t);o.stop(t+len+.02);}
async function startAudio(){if(mode){stop();return;}const gen=++generation;try{const A=window.AudioContext||window.webkitAudioContext;if(!A)throw Error();context??=new A();await context.resume();if(gen!==generation||!dlg.open)return;if(context.state!=='running')throw Error();mode=task==='listen'?'demo':'metro';step=0;next=context.currentTime+.08;$('audio').textContent='停止聲音';$('audio-status').textContent='播放中';timer=setInterval(tick,25);tick();}catch{stop();if($('audio-status'))$('audio-status').textContent='聲音未啟動，請再按播放並確認裝置音量。';}}
function tick(){if(!mode)return;while(next<context.currentTime+.12){if(mode==='demo'&&step>=8){if(context.currentTime>=next){demoDone=true;stop();if($('audio-status'))$('audio-status').textContent='示範播放完畢。';if($('finish'))$('finish').disabled=state.steps.includes('listen');}return;}let i=step,token=generation;const m=mode;tone(m==='demo'?freq[i]:i%4===0?1000:750,next,m==='demo'?60/state.bpm*.85:.065,m!=='demo');setTimeout(()=>{if(token!==generation||!$('beat'))return;$('beat').textContent=Array.from({length:4},(_,n)=>n===i%4?'●':'○').join(' ');document.querySelectorAll('.notes span').forEach((s,n)=>s.classList.toggle('active',m==='demo'&&n===i));},Math.max(0,(next-context.currentTime)*1000));step++;next+=60/state.bpm;}}
function rect(x,y,w,h,c){g.fillStyle=c;g.fillRect(Math.round(x),Math.round(y),w,h);}function tree(x,y,s=1){rect(x-4*s,y+18*s,9*s,28*s,'#836642');rect(x-19*s,y+5*s,38*s,27*s,'#527248');rect(x-25*s,y-10*s,50*s,29*s,'#3c6947');rect(x-18*s,y-24*s,36*s,28*s,'#54824b');rect(x-11*s,y-31*s,22*s,16*s,'#6e9355');rect(x-17*s,y-13*s,10*s,13*s,'#7b9c59');}
function flower(x,y,color='#e6bf62'){rect(x,y,2,8,'#4a7c45');rect(x-3,y-3,8,6,color);rect(x,y-4,2,8,color);rect(x,y,2,2,'#faf0ba');}
function gardenBloom(x,y,f){
 rect(x-10,y+9,23,4,'#454e3640');rect(x,y-1,3,13,'#426747');rect(x-6,y+4,6,3,'#a4bd7c');rect(x+3,y+1,5,3,'#89a66d');
 rect(x-7,y-11,17,12,f.shade);rect(x-10,y-8,23,6,f.shade);rect(x-5,y-14,13,19,f.shade);
 rect(x-6,y-10,15,10,f.petal);rect(x-9,y-7,21,4,f.petal);rect(x-4,y-13,11,17,f.petal);
 rect(x-2,y-7,7,7,f.center);rect(x-2,y-7,3,3,'#fff6ca');
}
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
function person(x,y,t,{teacher=false,walking=false,dir=1}={}){
  const outline='#3d3938', skin=teacher?'#f2c28d':'#f4c998';
  const hair=teacher?'#aaa394':'#543b42', coat=teacher?'#bf784f':'#4a8f83';
  const shade=teacher?'#96563d':'#366c65', accent=teacher?'#edd38e':'#f4cb67';
  const time=t+(teacher?1750:0), motion=!reducedMotion.matches;
  const stride=walking&&motion?Math.round(Math.sin(time/105)*4):0;
  const bob=motion?(walking?Math.round(Math.abs(Math.sin(time/105))*2):Math.round((1+Math.sin(time/540))*1.4)):0;
  const blink=motion&&!walking&&time%3600>3450;
  const yy=y-bob;
  const pixel=(px,py,w,h,c)=>rect(x+px,yy+py,w,h,c);
  rect(x-15,y-2,30,7,'#294a3540'); rect(x-10,y+4,20,2,'#294a3520');
  pixel(-10,-12,8,11+stride,shade); pixel(2,-12,8,11-stride,shade);
  pixel(-12,-2+stride,10,4,outline); pixel(2,-2-stride,10,4,outline);
  pixel(-14,-28,28,17,outline); pixel(-16,-24,5,10,outline); pixel(11,-24,5,10,outline);
  pixel(-12,-27,24,14,coat); pixel(-15,-23,4,8,skin); pixel(11,-23,4,8,skin);
  pixel(-10,-15,20,3,shade); pixel(-2,-24,5,9,accent);
  pixel(-7,-50,14,3,outline); pixel(-12,-47,24,3,outline); pixel(-15,-44,30,18,outline);
  pixel(-12,-26,24,3,outline); pixel(-8,-23,16,2,outline);
  pixel(-10,-46,20,4,hair); pixel(-13,-42,26,6,hair); pixel(-13,-36,26,9,skin); pixel(-10,-27,20,4,skin);
  pixel(dir>0?-12:7,-38,5,5,hair); pixel(dir>0?-7:3,-40,4,4,hair);
  if(!teacher){pixel(-5,-52,11,3,outline);pixel(-4,-51,9,2,coat);pixel(-7,-46,7,2,'#9b6970');}
  const eyes=dir>0?1:-1;
  pixel(eyes-6,-35,2,blink?1:4,outline); pixel(eyes+3,-35,2,blink?1:4,outline);
  if(teacher){pixel(eyes-7,-37,6,1,'#755f54');pixel(eyes+1,-37,6,1,'#755f54');pixel(eyes-1,-35,3,1,'#755f54');}
  pixel(eyes-9,-30,4,2,'#e88d87'); pixel(eyes+5,-30,4,2,'#e88d87'); pixel(eyes-1,-28,3,1,'#945b59');
}
function label(text,x,y,color='#fff7df'){g.font='bold 13px system-ui';g.textAlign='center';g.fillStyle='#294c35dd';const w=g.measureText(text).width+20;g.fillRect(x-w/2,y-15,w,24);g.fillStyle=color;g.fillText(text,x,y+2);}
function drawQuestMarker(t){
  const quest=questView(state),mark=quest.marker;
  if(!mark)return;
  const y=npc.y-65+(reducedMotion.matches?0:Math.sin(t/420)*2);
  g.save();
  // A large golden glyph stays over the teacher until explicit turn-in.
  g.font='900 40px system-ui';g.textAlign='center';g.textBaseline='alphabetic';
  g.lineJoin='round';g.lineWidth=6;g.strokeStyle=quest.markerTone==='gold'?'#56451d':'#3f4943';
  g.strokeText(mark,npc.x,y);g.fillStyle=quest.markerTone==='gold'?'#ffd66d':'#b9bfb7';g.fillText(mark,npc.x,y);
  if(mark==='?'&&quest.ready){
    rect(npc.x+20,y-29,3,9,'#fff0b0');rect(npc.x+17,y-26,9,3,'#fff0b0');
  }
  g.restore();
}
function draw(t){rect(0,0,960,560,'#98b878');for(let y=0;y<560;y+=30)for(let x=0;x<960;x+=30){if((x/30*17+y/30*31)%7<2){rect(x+8,y+9,3,5,'#86a96a');rect(x+12,y+7,2,7,'#86a96a');}}// walkways
rect(170,298,620,72,'#d0c298');rect(428,300,72,260,'#d0c298');rect(263,235,78,85,'#d0c298');rect(620,220,75,110,'#d0c298');for(let i=0;i<20;i++){const x=190+i*29;rect(x,326+(i%3)*9,12,3,'#beae83');}for(let i=0;i<7;i++)rect(449+(i%2)*18,390+i*22,14,3,'#beae83');
// water
rect(20,392,255,146,'#719fa1');rect(40,375,205,160,'#719fa1');rect(48,388,187,135,'#85b6ad');for(let i=0;i<7;i++){rect(55+(i*53)%160,408+i*15,26,3,'#b0cfc0');}rect(19,535,259,8,'#6f9c75');
// An outdoor practice clearing replaces the old cabin.
rect(578,243,154,53,'#b9c18d');rect(592,228,126,78,'#c8c799');rect(610,217,90,10,'#b9c18d');
[[592,234],[712,237],[583,269],[728,269]].forEach(([x,y],i)=>flower(x,y,i%2?'#efdaa1':'#e9a9a6'));
// bench and garden
rect(180,176,145,9,'#a78c62');rect(180,192,145,9,'#a78c62');rect(187,174,6,47,'#776748');rect(309,174,6,47,'#776748');rect(176,208,153,12,'#b69b6c');rect(190,218,6,20,'#776748');rect(307,218,6,20,'#776748');
rect(735,404,172,111,'#b7a379');rect(744,412,154,93,'#8c835c');for(let i=0;i<9;i++){const x=767+i%3*50,y=435+Math.floor(i/3)*28;rect(x-8,y+5,19,5,'#6f704b');if(i<bloomCount(state))gardenBloom(x,y,FLOWERS[i%FLOWERS.length]);else{rect(x,y,2,8,'#759651');rect(x-3,y+2,4,3,'#96af6b');}}label('你的花園',820,391);
// fences and foliage
for(let x=20;x<960;x+=28){rect(x,32,6,29,'#b5aa7a');rect(x-2,38,29,5,'#c7bd8e');}
[[45,99,1.5],[115,105,1.3],[210,83,1.2],[325,87,1.4],[435,91,1.6],[870,103,1.8],[930,178,1.4],[65,250,1.8],[139,279,1.2],[848,281,1.4],[919,356,1.2],[340,476,1.2],[585,495,1.3],[690,500,1]].forEach(a=>tree(...a));for(let i=0;i<18;i++)flower(370+(i*71)%400,395+(i*37)%110,i%2?'#ecdb8f':'#e1a6a4');
// stand
rect(650,284,7,28,'#665d43');rect(638,309,30,4,'#665d43');rect(637,269,34,22,'#705d42');rect(641,269,26,17,'#fff3cd');rect(653,269,2,16,'#d8c79d');rect(644,275,6,2,'#81906a');rect(657,278,7,2,'#81906a');
let entities=[{y:npc.y,draw:()=>person(npc.x,npc.y,t,{teacher:true})},{y:player.y,draw:()=>person(player.x,player.y,t,player)}];entities.sort((a,b)=>a.y-b.y).forEach(e=>e.draw());label('老師',npc.x,npc.y+24);drawQuestMarker(t);if(state.phase==='active'){label('來這裡練習',stand.x,stand.y-65,'#f4db91');}if(near){g.strokeStyle='#fff2c3';g.lineWidth=2;g.beginPath();g.ellipse(near==='npc'?npc.x:near==='garden'?garden.x:stand.x,near==='npc'?npc.y:near==='garden'?garden.y:stand.y,24,10,0,0,Math.PI*2);g.stroke();}}
function blocked(x,y){return x<30||x>930||y<130||y>542||(x<275&&y>380)||(x>730&&x<910&&y>395)||(x>174&&x<330&&y>170&&y<240);}
function update(dt){if(dlg.open){player.walking=false;return;}let dx=(keys.has('right')?1:0)-(keys.has('left')?1:0),dy=(keys.has('down')?1:0)-(keys.has('up')?1:0);if(!dx&&!dy&&target){const d=Math.hypot(target.x-player.x,target.y-player.y);if(d<5){target=null;}else{dx=(target.x-player.x)/d;dy=(target.y-player.y)/d;}}if(dx&&dy&&!target){dx/=Math.SQRT2;dy/=Math.SQRT2;}const speed=150*dt;let moved=false;if(!blocked(player.x+dx*speed,player.y)){player.x+=dx*speed;moved||=!!dx;}if(!blocked(player.x,player.y+dy*speed)){player.y+=dy*speed;moved||=!!dy;}player.walking=moved;if(dx)player.dir=dx>0?1:-1;near=Math.hypot(player.x-npc.x,player.y-npc.y)<65?'npc':Math.hypot(player.x-stand.x,player.y-stand.y)<65?'stand':Math.hypot(player.x-garden.x,player.y-garden.y)<55?'garden':null;$('interact').disabled=!near;$('interact').innerHTML=(near==='stand'?'練習':near==='garden'?'賞花':'交談')+' <span>E</span>';$('location').textContent=near==='npc'?'老師身旁':near==='stand'?'戶外譜架前':near==='garden'?'花園入口':'晨光小徑';}
function interact(){if(dlg.open)return;if(near==='npc')talk();else if(near==='stand')practice();else if(near==='garden')openGarden();else toast('再靠近老師、戶外譜架或花園入口一點。');}
const dirs={ArrowUp:'up',w:'up',W:'up',ArrowDown:'down',s:'down',S:'down',ArrowLeft:'left',a:'left',A:'left',ArrowRight:'right',d:'right',D:'right'};window.addEventListener('keydown',e=>{if(dlg.open)return;if(dirs[e.key]){e.preventDefault();target=null;keys.add(dirs[e.key]);}if((e.key==='e'||e.key==='E'||e.key==='Enter')&&!e.repeat&&e.target===canvas){e.preventDefault();interact();}else if((e.key==='e'||e.key==='E')&&!e.repeat)interact();});window.addEventListener('keyup',e=>keys.delete(dirs[e.key]));window.addEventListener('blur',()=>{keys.clear();target=null;});document.querySelectorAll('[data-dir]').forEach(b=>{b.onpointerdown=e=>{e.preventDefault();target=null;b.setPointerCapture(e.pointerId);keys.add(b.dataset.dir);};b.onpointerup=b.onpointercancel=b.onlostpointercapture=()=>keys.delete(b.dataset.dir);});canvas.onpointerdown=e=>{if(dlg.open)return;canvas.focus({preventScroll:true});const r=canvas.getBoundingClientRect(),x=(e.clientX-r.left)*960/r.width,y=(e.clientY-r.top)*560/r.height;if(Math.hypot(x-npc.x,y-(npc.y-20))<55){if(near==='npc')talk();else{target={x:npc.x,y:npc.y+35};toast('走近老師後，按「交談」。');}}else if(Math.hypot(x-stand.x,y-(stand.y-20))<60){if(near==='stand')practice();else{target={x:stand.x,y:stand.y+35};toast('走近譜架後，按「練習」。');}}else if(x>730&&x<910&&y>395&&y<525){if(near==='garden')openGarden();else{target={x:garden.x,y:garden.y};toast('走到花園入口，按「賞花」查看收藏。');}}else if(!blocked(x,y))target={x,y};};$('interact').onclick=interact;$('journal').onclick=journal;$('close').onclick=()=>dlg.close();dlg.addEventListener('close',()=>{practiceOpen=false;pausePracticeTimer();stop();keys.clear();canvas.focus({preventScroll:true});});document.addEventListener('visibilitychange',()=>{if(document.hidden){pausePracticeTimer();stop();keys.clear();target=null;}else resumePracticeTimer();});window.addEventListener('pageshow',resumePracticeTimer);window.addEventListener('pagehide',()=>{pausePracticeTimer();stop();});function loop(t){const dt=Math.min((t-last)/1000,.04);last=t;update(dt);draw(t);requestAnimationFrame(loop);}render();requestAnimationFrame(loop);setTimeout(()=>$('toast').style.opacity=0,6000);


setInterval(()=>{gameWeather=weatherAt();document.querySelector('.topline span').textContent=gameWeather.name+' · 練琴日';if(dlg.open&&$('garden-view'))$('garden-view').innerHTML=gardenScene(state,gameWeather);},120000);
