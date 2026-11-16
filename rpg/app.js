import {createQuietChat,drawQuietChat} from './quiet-chat.js?v=47';
import {ROOM_ENTRY,ROOM_RETURN,roomReturnURL,roomDoorHit,roomDoorNearby,createDoorApproach} from './room-door.js?v=46';
import {createTerrainArt} from './terrain-art.js?v=32';
import {createRainSystem} from './rain-system.js?v=35';
import {treeRainCanopies,umbrellaPose} from './rain-geometry.js?v=35';
import {MUSIC_ROOM,MUSIC_ROOM_DOOR,roomBlocks,drawMusicRoom,musicRoomRainCanopy} from './music-room-art.js?v=46';
import {createLounge} from './lounge-state.js?v=46';
import {LOUNGE_LAYOUT,drawLoungeTable,drawLoungeChair,drawSeatedResident,drawRainUmbrella} from './lounge-art.js?v=48';
import {createWetSoil,drawWetSoil} from './wet-soil.js?v=47';
const RAIN_EXCLUSIONS=Object.freeze([{x:410,y:175,w:160,h:95}]);
const wetSoil=createWetSoil({excludeRects:RAIN_EXCLUSIONS});
import {createTownArt,drawBackFence} from './art-slice.js?v=46';
import {createNavigation} from './navigation.js?v=24';
import {createTeacher,drawTeacher} from './teacher.js?v=48';
import {facingForMotion,drawPlayer} from './avatar.js?v=42';
import {resumeFromTap,requestPlaybackSession,clockStalled} from './audio-start.js?v=23';
import {demoEnvelope,applyDemoEnvelope,stopVoices} from './audio-envelope.js?v=23';
import {installPullToRefreshGuard} from './scroll-guard.js?v=23';
import {foliageWind,fishVariants,drawPondLife,drawGardenLife,drawTownWeather,drawBenchLife,drawRainFrame,createRainPets,petTrunkBlocked,drawRainDog,drawRainBenchCat,drawPetPondContact} from './ambience.js?v=47';
import {gardenScene,gardenPlants,townPlantPosition,drawPreparedSoil,weatherAt} from './garden.js?v=32';
import {DEV_TOOLS} from './config.js?v=23';
import {fresh,normalize,accept,complete,turnIn,again,NOTES,questView,resetRound,clearStoredRecords,FLOWERS,collection,bloomCount,addElapsed,formatElapsed,historyDuration,completeRoundForTest} from './model.js?v=23';
installPullToRefreshGuard();
let gameWeather=weatherAt();
const townFish=fishVariants(Math.floor(Math.random()*4294967296));
const $=id=>document.getElementById(id), canvas=$('world'),g=canvas.getContext('2d'),dlg=$('dialog'),KEY='cello-town-rpg-v1';
const townFont=getComputedStyle(document.documentElement).getPropertyValue('--town-font').trim()||'system-ui';
let state=fresh(),storeOK=true;try{const raw=localStorage.getItem(KEY);if(raw)state=normalize(JSON.parse(raw));}catch{storeOK=false;}
const player={x:460,y:425,dir:1,facing:'front',walking:false};const npc={x:303,y:290,kind:'teacher'},stand={x:615,y:404},garden={x:710,y:460};let keys=new Set(),target=null,last=0,near=null,task='listen',revealed=false,demoDone=false,practiced=false,context,timer,mode=null,voices=new Set(),step=0,next=0,generation=0,demoUntil=0,releaseSession=()=>{},clockTime=0,clockSeen=0,audioNode=null,workletAck=null;
const returnURL=roomReturnURL(window.location.href),doorApproach=createDoorApproach(Boolean(returnURL));
if(returnURL){Object.assign(player,ROOM_RETURN);history.replaceState(history.state,'',returnURL.href);}
// In-game scene changes share one history slot; native Back stays untouched.
const townBrand=document.querySelector('a.brand');
townBrand?.addEventListener('click',e=>{
 if(e.defaultPrevented||e.button!==0||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey)return;
 const url=new URL(townBrand.href,location.href);if(url.origin!==location.origin)return;
 e.preventDefault();location.replace(url.href);
});
let enteringRoom=false;
// Wait for the actual last camera frame before handing off to the 3D doorway.
function doorSceneTransition(stage,incoming,onReset){
 const world=stage.querySelector('canvas');
 let safety=0,revealTimer=0,frame=0,generation=0,endShot=null;
 const reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
 const clear=()=>{
  generation++;clearTimeout(safety);clearTimeout(revealTimer);cancelAnimationFrame(frame);
  if(endShot)world.removeEventListener('transitionend',endShot);endShot=null;
  stage.classList.remove('door-shot-moving','door-shot-near','door-shot-arriving');
 };
 const reset=()=>{clear();onReset();};
 window.addEventListener('pagehide',reset);
 window.addEventListener('pageshow',e=>{if(e.persisted)reset();});
 if(incoming&&!reduced()){
  stage.classList.add('door-shot-near','door-shot-arriving');const token=generation;
  const reveal=()=>{
   if(token!==generation||!stage.classList.contains('door-shot-near'))return;
   stage.classList.add('door-shot-moving');stage.classList.remove('door-shot-near');
   clearTimeout(revealTimer);
   revealTimer=setTimeout(()=>stage.classList.remove('door-shot-moving','door-shot-arriving'),440);
  };
  frame=requestAnimationFrame(()=>{frame=requestAnimationFrame(reveal);});
  revealTimer=setTimeout(reveal,120);
 }
 return navigate=>{
  clear();const token=generation;let sent=false;
  const run=()=>{
   if(sent||token!==generation)return;
   sent=true;clearTimeout(safety);
   if(endShot)world.removeEventListener('transitionend',endShot);endShot=null;
   safety=setTimeout(reset,2000);
   try{navigate();}catch{reset();}
  };
  if(reduced()){run();return;}
  endShot=e=>{if(e.target===world&&e.propertyName==='transform')run();};
  world.addEventListener('transitionend',endShot);
  stage.classList.add('door-shot-moving','door-shot-near');
  // Fallback for a suspended tab or a browser that did not paint the transition.
  safety=setTimeout(run,650);
 };
}
const doorStage=canvas.parentElement;
const doorFocus={x:(MUSIC_ROOM_DOOR.x+MUSIC_ROOM_DOOR.w/2)/canvas.width*100,y:(MUSIC_ROOM_DOOR.y+MUSIC_ROOM_DOOR.h/2)/canvas.height*100};
for(const axis of ['x','y']){
 doorStage.style.setProperty(`--door-origin-${axis}`,`${doorFocus[axis]}%`);
 doorStage.style.setProperty(`--door-shift-${axis}`,`${50-doorFocus[axis]}%`);
}
const transferDoor=doorSceneTransition(doorStage,Boolean(returnURL),()=>{enteringRoom=false;doorApproach.disarm();target=null;keys.clear();});
function enterRoom(){
 if(enteringRoom||dlg.open)return;
 enteringRoom=true;doorApproach.disarm();target=null;keys.clear();player.walking=false;player.facing='back';
 transferDoor(()=>window.location.replace(new URL('./3D/?from=town',window.location.href).href));
}
const TREE_LAYOUT=[[45,99,1.5],[115,105,1.3],[210,83,1.2],[325,87,1.4],[435,91,1.6],[870,103,1.8],[930,178,1.4],[65,250,1.8],[139,279,1.2],[848,281,1.4],[919,356,1.2],[340,476,1.2],[585,495,1.3],[690,500,1]];
const LOUNGE_SOLIDS=[LOUNGE_LAYOUT.table.solid,...LOUNGE_LAYOUT.seats.map(c=>c.solid)];
const navigation=createNavigation({trees:TREE_LAYOUT.map(([x,y,s])=>({x:x+.5*s,y:y+32*s})),blocked});
const teacherActor=createTeacher();
const quietChat=createQuietChat();let quietChatPose={bubbles:[]};
const lounge=createLounge({navigation,seats:LOUNGE_LAYOUT.seats});let loungePose=lounge.state,playerSeated=false,selectedChair=0,waitingForChair=false;
const chairs=LOUNGE_LAYOUT.seats;
const standApproach={x:stand.x,y:stand.y+28};
function standUp(){waitingForChair=false;if(!playerSeated)return;playerSeated=false;Object.assign(player,chairs[selectedChair].approach,{walking:false,facing:'front'});}
function sitDown(){target=null;keys.clear();const chair=chairs[selectedChair];if(loungePose.borrowed&&Math.hypot(npc.x-chair.x,npc.y-chair.y)<30){waitingForChair=true;return;}waitingForChair=false;playerSeated=true;Object.assign(player,chair,{walking:false});toast('坐一會兒。點自己的椅子或其他地方起身。');}
function requestChair(index){standUp();selectedChair=index;walkTo(chairs[index].approach,'chair');}


const townArt=createTownArt(()=>document.createElement('canvas'),TREE_LAYOUT);
const terrainArt=createTerrainArt(()=>document.createElement('canvas'));
const rainCanopies=treeRainCanopies(TREE_LAYOUT);
const petNavigation=createNavigation({trees:TREE_LAYOUT.map(([x,y,s])=>({x:x+.5*s,y:y+32*s})),blocked:(x,y)=>blocked(x,y,true)});
const petRainNavigation=createNavigation({tileSize:15,blocked:(x,y)=>blocked(x,y,true)||petTrunkBlocked(TREE_LAYOUT,x,y)});
const rainPets=createRainPets({navigation:petNavigation,rainNavigation:petRainNavigation,canopies:rainCanopies,trees:TREE_LAYOUT});
const rainSystem=createRainSystem({canopies:[...rainCanopies,musicRoomRainCanopy(),{kind:'table',left:LOUNGE_LAYOUT.table.solid.x,columns:new Float32Array(LOUNGE_LAYOUT.table.solid.w).fill(202),groundMin:LOUNGE_LAYOUT.table.solid.y,groundMax:LOUNGE_LAYOUT.table.depth}],excludeRects:[...RAIN_EXCLUSIONS,{x:560,y:40,w:236,h:199}]});
function walkTo(destination,kind=null){
 standUp();
 const path=navigation.findPath(player,destination);
 if(!path){target=null;toast('這裡暫時走不到，請選擇旁邊的小徑。');return false;}
 target={...destination,path,kind};return true;
}
const workletContexts=new WeakSet();
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
  $('quest-status').textContent=quest.ready?'回老師身旁交付':({listen:'聽一次 D 大調',rhythm:'跟節拍器練習',memory:'不看提示拉一遍'}[quest.next]||'到戶外譜架開始練習。');
  $('quest-return').hidden=!quest.ready;
  document.querySelectorAll('[data-step]').forEach(li=>{
    const done=state.steps.includes(li.dataset.step);
    li.classList.toggle('done',done);
    const current=li.dataset.step===quest.next;
    li.classList.toggle('current',current);
    if(current)li.setAttribute('aria-current','step');else li.removeAttribute('aria-current');
    li.querySelector('b').textContent='•';
    li.setAttribute('aria-label',li.querySelector('span').textContent+(done?'，已完成':'，待完成'));
  });
  $('flower-count').textContent=bloomCount(state);
  renderCollection();
  $('storage').textContent=storeOK?'':'此瀏覽器無法保存進度，離開後可能遺失。';
}
let toastTimer;function toast(s){$('toast').textContent=s;$('toast').style.opacity=1;clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').style.opacity=0,5500);}
function show(html){practiceOpen=false;pausePracticeTimer();stop();keys.clear();target=null;$('dialog-body').innerHTML=html;dlg.showModal();}
function talk(){const phase=state.phase;const text={available:'歡迎來到弓弦小鎮。我是這座小鎮的音樂老師。先不急著拉快，我們從 D 大調的一個八度開始。',active:'右邊戶外練習區的譜架在等你。先聽一遍，再跟著拍子拉，最後把提示收起來試試。',ready:'你已經走完三段練習了。不是每個音都完美才算進步，願意再試一次，就是很好的開始。',done:'你的第一朵花開了！想再走一遍 D 大調嗎？之前的足跡會留下，不會被清空。'}[phase];show(`<div class="eyebrow">老師 · 小鎮的音樂嚮導</div><h2>${phase==='ready'?'歡迎回來，旅人。':'讓琴聲出發。'}</h2><p>${text}</p><p class="reward">✿ D 大調的邀請 · 聽音 / 跟拍 / 記憶</p><button class="primary" id="npc-action">${{available:'接下任務',active:'我去練習',ready:'交付任務 · 種一朵花',done:'再練一輪'}[phase]}</button><button class="secondary" id="later">等一下再說</button>`);$('later').onclick=()=>dlg.close();$('npc-action').onclick=()=>{if(phase==='available'){state=accept(state);save();dlg.close();toast('任務接取！走到右邊的戶外譜架，開始練習。');}else if(phase==='ready'){pausePracticeTimer();state=turnIn(state);save();show(`<div class="eyebrow">QUEST COMPLETE</div><div class="reward-flower">${flowerArt(FLOWERS[(bloomCount(state)-1)%FLOWERS.length])}</div><p class="flower-name">${FLOWERS[(bloomCount(state)-1)%FLOWERS.length].name}</p><h2>小鎮，多了一點你的聲音。</h2><p>D 大調的邀請已完成。花園裡多了一朵花，練習手札也留下了這次足跡。</p><p class="hint">這是你的練習確認，不是音準或演奏能力評分。</p><button class="primary" id="done-close">回到小鎮</button>`);$('done-close').onclick=()=>dlg.close();}else if(phase==='done'){pausePracticeTimer();state=again(state);save();dlg.close();toast('新的一輪準備好了，和老師說話就能接取。');}else dlg.close();};}
function practice(){if(state.phase==='available'){toast('先和左邊的老師說話，接下第一個任務。');return;}if(state.phase==='done'){toast('這輪任務已完成。可以找老師接下一輪，或打開練習手札。');return;}task=['listen','rhythm','memory'].find(n=>!state.steps.includes(n))||'memory';demoDone=state.steps.includes('listen');practiced=false;revealed=false;show('<div></div>');practiceUI();}
const descriptions={listen:['聽見 D 大調','先聽 D3 到 D4 的合成參考音，再拿起琴試著找出第一個音。','我已聽過示範'],rhythm:['讓每一弓跟上拍子','選一個舒服的速度，一拍一個音。拉完一個八度上行和下行，再確認這次練習。','我已跟拍練過'],memory:['把音階留在心裡','先收起音名，試著拉一遍。不記得也沒關係，可以再看看提示。','我已嘗試不看提示']};
function practiceUI(){const d=descriptions[task];$('dialog-body').innerHTML=`<div class="eyebrow">戶外譜架 · D 大調 · 一個八度</div><div class="practice-timer" aria-label="本輪練習計時"><svg class="clock-icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="13" r="8"/><path d="M12 9v4l3 2M9 2h6M12 2v3"/></svg><span id="practice-time" aria-label="本輪累計時間">00:00</span><span id="timer-status">接任務後可開始</span></div><div class="tabs" role="tablist" aria-label="練習階段">${['listen','rhythm','memory'].map((s,i)=>`<button role="tab" aria-selected="${s===task}" data-tab="${s}">${state.steps.includes(s)?'✓ ':''}${['聽音','跟拍','記憶'][i]}</button>`).join('')}</div><h2>${d[0]}</h2><p>${d[1]}</p><div class="notes ${task==='memory'&&!revealed?'hidden':''}" aria-hidden="${task==='memory'&&!revealed}">${NOTES.map(n=>`<span>${n}</span>`).join('')}</div>${task==='memory'?'<button class="secondary" id="reveal">'+(revealed?'收起提示':'看看音名')+'</button>':''}<label for="bpm">速度 <strong id="bpm-label">${state.bpm} BPM</strong></label><input id="bpm" type="range" min="40" max="120" value="${state.bpm}"><label for="volume">音量 <strong id="volume-label">${Math.round(state.volume*100)}%</strong></label><input id="volume" type="range" min="0" max="100" value="${Math.round(state.volume*100)}"><div id="beat" aria-hidden="true">○ ○ ○ ○</div><button class="secondary" id="audio">${task==='listen'?'播放參考音':'開始節拍器'}</button><button class="primary" id="finish" ${state.steps.includes(task)||(task==='listen'&&!demoDone)?'disabled':''}>${state.steps.includes(task)?'這段已記下 ✓':d[2]}</button><p class="status" id="audio-status" role="status"></p><p class="hint">由你確認實際練習。此雛型不收音、不判斷音準。關閉視窗或離開頁面會停止聲音。</p>`;practiceOpen=true;resumePracticeTimer();document.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>{stop();task=b.dataset.tab;revealed=false;practiceUI();});if($('reveal'))$('reveal').onclick=()=>{revealed=!revealed;const el=document.querySelector('.notes');el.classList.toggle('hidden',!revealed);el.setAttribute('aria-hidden',String(!revealed));$('reveal').textContent=revealed?'收起提示':'看看音名';};$('bpm').oninput=e=>{state.bpm=Number(e.target.value);$('bpm-label').textContent=state.bpm+' BPM';updateWorklet();save();};$('volume').oninput=e=>{state.volume=Number(e.target.value)/100;$('volume-label').textContent=e.target.value+'%';updateWorklet();save();};$('audio').onclick=startAudio;$('finish').onclick=()=>{if(task==='listen'&&!demoDone)return;stop();state=complete(state,task);save();if(state.phase==='ready'){dlg.close();toast('練習完成！回到老師身旁，交付你的任務。');}else{task=['listen','rhythm','memory'].find(s=>!state.steps.includes(s));practiceUI();}};}
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
$('clear-records').onclick=()=>{show('<div class="eyebrow">DEVELOPMENT / TEST</div><h2>清空這台裝置的所有小鎮紀錄？</h2><p>將永久清除本瀏覽器的所有花朵、練習手札與歷史、本輪任務進度、累計計時及筆記。無法復原。</p><p>速度、音量等偏好設定會保留，不影響其他網站或弓弦網站的資料。</p><button class="secondary" id="clear-cancel">取消，保留紀錄</button><button class="primary" id="clear-confirm">確認清空所有紀錄</button><p id="clear-error" role="status"></p>');$('clear-cancel').onclick=()=>dlg.close();$('clear-confirm').onclick=()=>{practiceOpen=false;pausePracticeTimer();stop();try{state=clearStoredRecords(localStorage,KEY,state);storeOK=true;}catch{storeOK=false;$('clear-error').textContent='儲存失敗，尚未清空紀錄。請確認瀏覽器允許本機儲存後再試。';return;}timerStarted=null;task='listen';demoDone=false;practiced=false;revealed=false;render();dlg.close();toast('所有小鎮練習紀錄已清空，速度與音量設定保留。');};};

$('test-complete').onclick=()=>{pausePracticeTimer();if(state.phase==='done'){toast('本輪已交付，不重複領花。');return;}state=completeRoundForTest(state);save();toast('測試：本輪已完成，新增一朵花及一筆手札；沒有虛構練習時間。');};
$('reset-round').onclick=()=>{show('<div class="eyebrow">DEVELOPMENT / TEST</div><h2>重設本輪任務？</h2><p>只清除本輪的接取、三項練習進度及計時，回到可接任務狀態。已獲得的花、歷史手札、筆記和音量／速度設定全部保留。</p><button class="secondary" id="reset-cancel">取消</button><button class="primary" id="reset-confirm">確認重設本輪</button>');$('reset-cancel').onclick=()=>dlg.close();$('reset-confirm').onclick=()=>{pausePracticeTimer();state=resetRound(state);demoDone=false;practiced=false;revealed=false;save();dlg.close();toast('本輪已重設。花園、手札與聲音設定都保留了。');};};
}else devTools.remove();
function journal(){show('<div class="eyebrow">MY PRACTICE JOURNAL</div><h2>那些慢慢累積的音。</h2><p>已種下 '+bloomCount(state)+' 朵花。休息不會讓它們消失。</p><label for="note">下次想回來練的地方</label><textarea id="note" maxlength="400" placeholder="例如：F♯ 到 G 的換指，再放慢一點。"></textarea><div id="history"></div><p class="hint">進度只存在這台裝置的瀏覽器，不會跨裝置同步。</p>');$('note').value=state.note;$('note').oninput=e=>{state.note=e.target.value;save();};if(!state.history.length)$('history').textContent='第一段足跡，等你寫下。';state.history.slice().reverse().forEach(h=>{const el=document.createElement('div');el.className='journal-entry';el.textContent=`✿ D 大調 · ${h.bpm} BPM · ${historyDuration(h)}`;const sm=document.createElement('small');sm.textContent=new Date(h.at).toLocaleString('zh-TW')+(h.note?' · '+h.note:'');el.append(sm);$('history').append(el);});}
const freq=[146.8324,164.8138,184.9972,195.9977,220,246.9417,277.1826,293.6648];function stop(){const oldId=generation;generation++;clearTimeout(workletAck);if(audioNode){audioNode.port.postMessage({type:'stop',id:oldId});audioNode.port.onmessage=null;audioNode.onprocessorerror=null;audioNode.disconnect();audioNode=null;}clearInterval(timer);mode=null;stopVoices(voices);releaseSession();releaseSession=()=>{};if($('audio'))$('audio').textContent=task==='listen'?'播放參考音':'開始節拍器';if($('beat'))$('beat').textContent='○ ○ ○ ○';if($('audio-status'))$('audio-status').textContent='聲音已停止。';}
function tone(f,t,len,click,last=false){const plan=click?null:demoEnvelope(t,len,state.volume,last),end=plan?plan.stop:t+len+.02;if(state.volume===0)return end;const o=context.createOscillator(),a=context.createGain();o.type=click?'sine':'triangle';o.frequency.value=f;if(click){a.gain.setValueAtTime(0,t);a.gain.linearRampToValueAtTime(state.volume*.42,t+.008);a.gain.exponentialRampToValueAtTime(.0001,t+len);}else applyDemoEnvelope(a.gain,plan);o.connect(a);a.connect(context.destination);voices.add(o);o.onended=()=>{voices.delete(o);o.disconnect();a.disconnect();};o.start(t);o.stop(end);return end;}
function audioFailure(message){stop();const old=context;context=null;if(old){old.onstatechange=null;try{old.close().catch(()=>{});}catch{}}if($('audio-status'))$('audio-status').textContent=message;}
function updateWorklet(){if(audioNode)audioNode.port.postMessage({type:'settings',id:generation,bpm:state.bpm,volume:state.volume});}
function finishDemo(){demoDone=true;stop();if($('audio-status'))$('audio-status').textContent='示範播放完畢。';if($('finish'))$('finish').disabled=state.steps.includes('listen');}
async function prepareWorklet(ctx,gen){if(!ctx.audioWorklet||!window.AudioWorkletNode)return false;
 try{if(!workletContexts.has(ctx)){let timeout;try{await Promise.race([ctx.audioWorklet.addModule('./practice-worklet.js?v=23'),new Promise((_,reject)=>{timeout=setTimeout(()=>reject(Error('worklet-timeout')),2500);})]);}finally{clearTimeout(timeout);}workletContexts.add(ctx);}if(gen!==generation||!dlg.open)return false;
 const node=new AudioWorkletNode(ctx,'practice-processor',{numberOfInputs:0,numberOfOutputs:1,outputChannelCount:[1]});audioNode=node;node.connect(ctx.destination);node.onprocessorerror=()=>{if(audioNode===node)audioFailure('聲音處理器中斷，已停止。請再按播放。');};node.port.onmessage=e=>{const m=e.data;if(m.id!==generation||audioNode!==node)return;if(m.type==='started'){clearTimeout(workletAck);if($('audio-status'))$('audio-status').textContent='AudioWorklet 已啟動播放';}if(m.type==='beat'&&$('beat')){$('beat').textContent=Array.from({length:4},(_,n)=>n===m.index%4?'●':'○').join(' ');document.querySelectorAll('.notes span').forEach((s,n)=>s.classList.toggle('active',mode==='demo'&&n===m.index));}if(m.type==='finished'&&mode==='demo')finishDemo();};return true;
 }catch{if(gen===generation&&audioNode){audioNode.disconnect();audioNode=null;}return false;}}
async function startAudio(){if(mode){stop();return;}if(state.volume===0){$('audio-status').textContent='目前音量為 0，請先調高音量。';return;}const gen=++generation;try{const A=window.AudioContext||window.webkitAudioContext;if(!A)throw Error();if(!context||context.state==='closed')context=new A();const activeContext=context;releaseSession=requestPlaybackSession(navigator);mode='starting';$('audio').textContent='取消啟動';$('audio-status').textContent='正在啟動聲音…';await resumeFromTap(activeContext);if(gen!==generation||!dlg.open)return;if(activeContext.state!=='running')throw Error();const useWorklet=await prepareWorklet(activeContext,gen);if(gen!==generation||!dlg.open)return;mode=task==='listen'?'demo':'metro';step=0;demoUntil=0;next=activeContext.currentTime+.08;clockTime=activeContext.currentTime;clockSeen=performance.now();activeContext.onstatechange=()=>{if(context===activeContext&&(mode==='demo'||mode==='metro')&&activeContext.state!=='running')audioFailure('聲音被系統中斷，請再按播放。');};$('audio').textContent='停止聲音';$('audio-status').textContent=useWorklet?'正在啟動 AudioWorklet…':'相容模式播放（AudioWorklet 未啟用）';if(useWorklet){workletAck=setTimeout(()=>{if(gen===generation&&audioNode)audioFailure('AudioWorklet 未回應，請再按播放。');},2500);audioNode.port.postMessage({type:'start',id:gen,mode,bpm:state.bpm,volume:state.volume});}timer=setInterval(tick,25);tick();}catch{if(gen===generation)audioFailure('聲音未啟動，請再按播放；若仍無聲，請檢查裝置音量、靜音與藍牙輸出。');}}
function tick(){if(!mode||mode==='starting')return;const now=performance.now();if(context.currentTime>clockTime){clockTime=context.currentTime;clockSeen=now;}else if(clockStalled(clockTime,context.currentTime,now-clockSeen)){audioFailure('聲音引擎暫停了，請再按播放重新啟動。');return;}if(audioNode)return;while(next<context.currentTime+.12){if(mode==='demo'&&step>=8){if(context.currentTime>=demoUntil){finishDemo();}return;}let i=step,token=generation;const m=mode;const end=tone(m==='demo'?freq[i]:i%4===0?1000:750,next,m==='demo'?60/state.bpm:.065,m!=='demo',i===7);if(m==='demo')demoUntil=end;setTimeout(()=>{if(token!==generation||!$('beat'))return;$('beat').textContent=Array.from({length:4},(_,n)=>n===i%4?'●':'○').join(' ');document.querySelectorAll('.notes span').forEach((s,n)=>s.classList.toggle('active',m==='demo'&&n===i));},Math.max(0,(next-context.currentTime)*1000));step++;next+=60/state.bpm;}}
function rect(x,y,w,h,c){g.fillStyle=c;g.fillRect(Math.round(x),Math.round(y),w,h);}function tree(x,y,s=1,t=0,seed=1){townArt.drawTree(g,x,y,s,t,seed);}
function flower(x,y,color='#e6bf62'){rect(x,y,2,8,'#4a7c45');rect(x-3,y-3,8,6,color);rect(x,y-4,2,8,color);rect(x,y,2,2,'#faf0ba');}
function gardenBloom(x,y,f){
 // Each earned species keeps its original root anchor, but has its own silhouette.
 const species=f.species,stem='#4c704b',dark='#36563e',leaf='#79975e',light='#a7b57b';
 const p=(dx,dy,w,h,c)=>rect(x+dx,y+dy,w,h,c);
 p(-11,9,24,3,'#454e3633');p(-7,7,16,3,'#766347');
 const height=[19,28,24,17,21,30][species],top=-height;
 p(0,top+3,2,height+6,dark);p(0,top+5,1,height+3,stem);
 const leaves=(yy,spread)=>{p(-spread,yy-3,spread,3,dark);p(-spread+1,yy-4,spread-1,2,leaf);p(2,yy+1,spread,3,stem);p(3,yy,spread-1,2,light);};
 if(species===1){for(const yy of[-15,-6]){p(-8,yy,9,1,stem);p(2,yy-3,8,1,stem);p(-7,yy-3,1,5,leaf);p(-4,yy-2,1,4,leaf);p(5,yy-5,1,5,light);}}
 else if(species===5){leaves(-15,9);leaves(-5,7);}
 else{leaves(-2,species===0?8:6);if(species===2)leaves(-10,5);}
 const bloom=(cx,cy,kind)=>{
  const q=(dx,dy,w,h,c)=>p(cx+dx,cy+dy,w,h,c);
  if(kind===3){q(-4,-2,8,5,f.shade);q(-2,-4,4,9,f.shade);q(-4,-1,8,3,f.petal);q(-1,-4,3,8,f.petal);q(-1,-1,2,2,f.center);q(-3,-2,2,1,'#d4edf0');return;}
  if(kind===5){
   q(-3,-2,6,7,f.shade);q(-11,-9,5,3,f.shade);q(-8,-7,5,5,f.petal);q(-5,-4,5,5,f.petal);
   q(6,-9,5,3,f.shade);q(3,-7,6,5,f.petal);q(0,-4,5,5,f.petal);
   q(-2,-13,5,9,f.shade);q(-1,-12,3,10,f.petal);q(-7,1,5,5,f.petal);q(3,1,5,5,f.petal);
   q(-2,0,5,4,f.center);q(-6,-5,2,2,'#ad813d');q(5,-5,2,2,'#ad813d');q(0,-8,2,2,'#ad813d');q(-1,-11,1,5,'#fff9db');return;
  }
  const petals=kind===0?[[-3,-10,6,7],[-3,4,6,7],[-10,-3,7,6],[4,-3,7,6],[-8,-8,5,5],[4,-8,5,5],[-8,4,5,5],[4,4,5,5]]:
   kind===1?[[-5,-10,9,7],[-9,-6,7,9],[3,-7,7,9],[-6,2,8,8],[1,2,7,8]]:
   kind===2?[[-5,-9,10,7],[-10,-4,8,9],[3,-5,8,9],[-5,2,10,8]]:
   [[-4,-10,8,8],[-10,-4,8,8],[3,-4,8,8],[-4,3,8,8],[-8,-8,5,5],[4,-8,5,5],[-8,4,5,5],[4,4,5,5]];
  for(const [px,py,w,h]of petals){q(px,py,w,h,f.shade);q(px+1,py,w-2,h-2,f.petal);q(px+1,py,Math.max(1,w-3),1,kind===4?'#ffdfa1':'#fff2d3');}
  q(-4,-3,8,7,f.shade);q(-3,-3,6,6,kind===2?'#51425e':f.center);q(-2,-2,2,2,kind===2?'#c5adc9':'#f8dfa0');q(1,1,2,2,kind===2?'#a891af':'#b88b44');
 };
 if(species===3){p(-6,-15,7,1,stem);p(2,-21,6,1,stem);p(7,-21,1,9,stem);bloom(-6,-17,3);bloom(7,-23,3);bloom(1,-9,3);}
 else bloom(1,top,species);
}
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
function person(x,y,t,{teacher=false,walking=false,facing='front'}={}){
 if(teacher){if(loungePose.mode==='seated')drawSeatedResident(g,{...npc,kind:'teacher',reading:loungePose.reading&&!playerSeated&&!dlg.open,t,reduced:reducedMotion.matches});else drawTeacher(g,{...npc,t,reduced:reducedMotion.matches});return;}
 if(playerSeated){drawSeatedResident(g,{...player,kind:'player',t,reduced:reducedMotion.matches});return;}
 drawPlayer(g,{x,y,t,walking,facing,reduced:reducedMotion.matches});
}
function label(text,x,y,color='#fff7df'){g.font=`bold 13px ${townFont}`;g.textAlign='center';g.fillStyle='#294c35dd';const w=g.measureText(text).width+20;g.fillRect(x-w/2,y-15,w,24);g.fillStyle=color;g.fillText(text,x,y+2);}
// Draw the status icon as vectors above the pixel-art canvas, in the same world coordinates.
const teacherBadge=$('teacher-badge');
let teacherBadgeKey='',teacherBadgePosition='';
function drawQuestMarker(t){
 const {marker,markerTone,ready}=questView(state);
 const key=marker==='!'?'exclaim':marker==='?'?(ready?'ready':'question'):'';
 if(key!==teacherBadgeKey){teacherBadgeKey=key;teacherBadge.dataset.kind=key;teacherBadge.dataset.tone=key&&markerTone==='gold'?'gold':'gray';}
 if(!key)return;
 const y=npc.y-65+(reducedMotion.matches?0:Math.sin(t/420)*2);
 const next=`translate(${npc.x.toFixed(2)} ${y.toFixed(2)})`;
 if(next!==teacherBadgePosition){teacherBadgePosition=next;teacherBadge.setAttribute('transform',next);}
}
function drawStandMarker(t){
 if(state.phase!=='active'||state.steps.length===3)return;
 const x=stand.x,y=stand.y+(reducedMotion.matches?0:Math.sin(t/600)*2);
 label('來這裡練習',x,stand.y-85,'#f4db91');
 g.save();g.translate(x,y);g.beginPath();
 g.moveTo(-6,-72);g.lineTo(6,-72);g.lineTo(6,-62);g.lineTo(13,-62);
 g.lineTo(0,-48);g.lineTo(-13,-62);g.lineTo(-6,-62);g.closePath();
 g.fillStyle='#ffd66d';g.fill();g.lineJoin='round';g.lineWidth=3;g.strokeStyle='#60491f';g.stroke();
 g.fillStyle='#fff0b7';g.fillRect(-3,-69,6,3);g.restore();
}
function drawPracticeStand(){
 const {x,y}=stand,p=(dx,dy,w,h,c)=>rect(x+dx,y+dy,w,h,c);
 // Solid cedar tripod, sliding collar and open score, inside the existing hit area.
 p(-18,1,37,4,'#4d593433');p(-12,4,27,2,'#4d593422');
 p(-3,-25,7,25,'#574b39');p(-2,-24,3,24,'#ad8e5f');p(1,-24,2,24,'#806746');
 p(-5,-16,11,4,'#615741');p(-4,-16,8,1,'#c5a474');p(4,-15,3,2,'#d0b67c');
 p(-5,-3,4,4,'#70583d');p(-9,-1,5,3,'#70583d');p(-14,1,6,3,'#70583d');p(-13,1,5,1,'#b49a6b');
 p(3,-3,4,4,'#70583d');p(6,-1,5,3,'#70583d');p(10,1,7,3,'#70583d');p(11,1,5,1,'#b49a6b');p(-1,0,4,5,'#806746');
 p(-20,-42,39,22,'#584a38');p(-18,-41,35,19,'#9e8154');p(-17,-40,33,2,'#c6aa76');
 p(-20,-22,39,4,'#665039');p(-19,-22,37,1,'#d3b582');p(-17,-18,33,2,'#95774f');
 p(-16,-42,14,18,'#d4c39c');p(1,-41,14,18,'#ccb98e');p(-15,-41,12,15,'#f3e7c4');p(2,-40,12,15,'#eadbb3');
 p(-2,-40,3,16,'#b49c71');p(-1,-40,1,15,'#d9c497');p(-14,-41,10,1,'#fff4d6');p(3,-40,10,1,'#fff1cb');
 for(const yy of[-37,-34,-31]){p(-13,yy,8,1,'#b7ad86');p(4,yy+1,8,1,'#b2a37c');}
 for(const [xx,yy]of[[-11,-35],[-7,-32],[5,-34],[10,-31]]){p(xx,yy,2,2,'#657251');p(xx+1,yy-3,1,3,'#657251');}
 p(11,-25,2,7,'#ad7054');p(-17,-25,2,3,'#c7af79');p(15,-24,2,3,'#c7af79');
}
function draw(t){const rainFrame=rainSystem.sample(t,gameWeather.key,[player,npc],reducedMotion.matches);const petFrame=rainPets.update(t,{weather:gameWeather.key,player,playerUmbrella:umbrellaPose(player,rainFrame.actorOpen[0]),reduced:reducedMotion.matches});const moisture=wetSoil.update(t,gameWeather.key,reducedMotion.matches,rainFrame);townArt.drawGround(g);drawWetSoil(g,moisture,'road');
// water
terrainArt.drawPond(g);
// Sparse bank planting stays outside the fish/ripple water clip.
[[30,413],[253,451],[56,548],[213,549]].forEach(([x,y],i)=>{const lean=foliageWind(t,(i+1)*3,gameWeather.key,reducedMotion.matches)*3;g.strokeStyle='#65834e';g.lineWidth=2;g.beginPath();g.moveTo(x,y);g.quadraticCurveTo(x-2,y-6,x-4+lean,y-11);g.moveTo(x+3,y);g.quadraticCurveTo(x+3,y-7,x+5+lean,y-14);g.stroke();if(i%2===0)flower(x+7,y-4,'#e5d2a1');});
drawPondLife(g,t,reducedMotion.matches,townFish);drawPetPondContact(g,petFrame.pondContact);
// An outdoor practice clearing replaces the old cabin.
// Practice clearing material is cached with the art-study ground.
[[592,234],[712,237],[583,269],[728,269]].forEach(([x,y],i)=>flower(x,y,i%2?'#efdaa1':'#e9a9a6'));
// bench and garden
rect(180,176,145,9,'#a78c62');rect(180,192,145,9,'#a78c62');rect(187,174,6,47,'#776748');rect(309,174,6,47,'#776748');rect(176,208,153,12,'#b69b6c');rect(190,218,6,20,'#776748');rect(307,218,6,20,'#776748');townArt.drawBench(g);
terrainArt.drawBed(g);drawPreparedSoil(g,state);drawWetSoil(g,moisture,'bed');for(const f of gardenPlants(state)){const {x,y}=townPlantPosition(f.species);rect(x-8,y+5,19,5,'#6f704b');gardenBloom(x,y,f);}label('你的花園',820,391);
// fences and foliage
drawBackFence(g);
for(let i=0;i<18;i++){const x=370+(i*71)%400,y=395+(i*37)%110;
 // Keep decorative wildflowers outside the player's flowerbed.
 if(x+5>=735&&x-3<=907&&y+8>=404&&y-4<=515)continue;
 flower(x,y,i%2?'#ecdb8f':'#e1a6a4');}
drawBenchLife(g,t,reducedMotion.matches,petFrame);
if(gameWeather.key!=='rain')drawTownWeather(g,t,gameWeather.key,reducedMotion.matches,RAIN_EXCLUSIONS);
// Ground anchors order visible silhouettes; collision footprints remain separate.
let entities=[{y:petFrame.life.cat.groundY,draw:()=>drawGardenLife(g,t,reducedMotion.matches,petFrame)},...(petFrame.dogActive?[{y:petFrame.dog.y,draw:()=>drawRainDog(g,petFrame.dog)}]:[]),...(petFrame.benchCatActive?[{y:petFrame.benchCat.y,draw:()=>drawRainBenchCat(g,petFrame.benchCat)}]:[]),{y:stand.y,draw:drawPracticeStand},{y:MUSIC_ROOM.depth,draw:()=>drawMusicRoom(g)},{y:231,draw:()=>{chairs.forEach(chair=>drawLoungeChair(g,chair));}},{y:245,draw:()=>drawLoungeTable(g,{rain:gameWeather.key==='rain',readingSide:loungePose.reading&&!dlg.open?chairs[loungePose.seatIndex].id:null})},...[player,npc].flatMap((actor,i)=>rainFrame.actorStage[i]!=='closed'?[{y:actor.y+21,draw:()=>drawRainUmbrella(g,{...actor,kind:i===1?'teacher':'player'},rainFrame.actorOpen[i],rainFrame.actorStage[i])}]:[]),...TREE_LAYOUT.map((a,i)=>({y:a[1]+46*a[2],draw:()=>tree(...a,t,i+1)})),{y:npc.y,draw:()=>person(npc.x,npc.y,t,{teacher:true})},{y:player.y,draw:()=>person(player.x,player.y,t,player)}];entities.sort((a,b)=>a.y-b.y).forEach(e=>e.draw());if(gameWeather.key==='rain')drawRainFrame(g,rainFrame);label('老師',npc.x,npc.y+24);drawQuestMarker(t);drawStandMarker(t);if(!dlg.open)drawQuietChat(g,quietChatPose.bubbles,{teacher:npc,player});if(near&&!['chair','seated'].includes(near)){g.strokeStyle='#fff2c3';g.lineWidth=2;g.beginPath();g.ellipse(near==='npc'?npc.x:near==='garden'?garden.x:stand.x,near==='npc'?npc.y:near==='garden'?garden.y:stand.y,24,10,0,0,Math.PI*2);g.stroke();}}
function teacherWithinReach(){return Math.hypot(player.x-npc.x,player.y-npc.y)<65;}
function standWithinReach(){return Math.hypot(player.x-stand.x,player.y-stand.y)<48;}
function gardenWithinReach(){return Math.hypot(player.x-garden.x,player.y-garden.y)<55;}
function arriveAtTarget(){
 const kind=target.kind;target=null;
 if(kind==='chair')sitDown();
 else if(kind==='npc'&&teacherWithinReach()){player.walking=false;talk();}
 else if(kind==='stand'&&standWithinReach()){player.walking=false;practice();}
 else if(kind==='garden'&&gardenWithinReach()){player.walking=false;openGarden();}
 else if(kind==='room'){enterRoom();return;}
}
function blocked(x,y,allowGarden=false){return roomBlocks(x,y)||(Math.abs(x-stand.x)<=14&&Math.abs(y-stand.y)<=4)||LOUNGE_SOLIDS.some(r=>x>=r.x&&x<=r.x+r.w&&y>=r.y&&y<=r.y+r.h)||x<30||x>930||y<130||y>542||(x<275&&y>380)||(!allowGarden&&x>730&&x<910&&y>395)||(x>174&&x<330&&y>170&&y<240);}
function update(dt){
 const teacher=teacherActor.update(dt,{practiceActive:practiceOpen&&dlg.open,dialogOpen:dlg.open,holdForInteraction:quietChat.active||lounge.state.borrowed||target?.kind==='npc',reducedMotion:reducedMotion.matches,player});
 loungePose=lounge.update(dt,{teacher,player,playerSeated,playerSeatIndex:(playerSeated||waitingForChair||target?.kind==='chair')?selectedChair:null,practice:practiceOpen&&dlg.open,dialog:(dlg.open&&!practiceOpen)||quietChat.active,questApproach:target?.kind==='npc',rain:gameWeather.key==='rain',reduced:reducedMotion.matches});
 Object.assign(npc,loungePose.borrowed?loungePose.pose:teacher);
 if(waitingForChair&&!dlg.open)sitDown();

 if(enteringRoom)return;
 if(dlg.open){player.walking=false;quietChatPose=quietChat.update(dt,{teacher:npc,player,modal:true});return;}
 let dx=(keys.has('right')?1:0)-(keys.has('left')?1:0),dy=(keys.has('down')?1:0)-(keys.has('up')?1:0),speed=150*dt;
 const oldX=player.x,oldY=player.y;
 if(dx||dy){
  standUp();target=null;const length=Math.hypot(dx,dy);dx=dx/length*speed;dy=dy/length*speed;
  // Check complete segments, not only endpoints, including diagonal grid corners.
  if(navigation.lineClear(player,{x:player.x+dx,y:player.y+dy})){player.x+=dx;player.y+=dy;}
  else {if(dx&&navigation.lineClear(player,{x:player.x+dx,y:player.y}))player.x+=dx;else if(dy&&navigation.lineClear(player,{x:player.x,y:player.y+dy}))player.y+=dy;}
 }else if(target){
  while(target&&speed>0){
   const point=target.path[0],distance=Math.hypot(point.x-player.x,point.y-player.y);
   if(distance<.001){target.path.shift();if(!target.path.length)arriveAtTarget();continue;}
   const step=Math.min(speed,distance),next={x:player.x+(point.x-player.x)/distance*step,y:player.y+(point.y-player.y)/distance*step};
   if(!navigation.lineClear(player,next)){target=null;break;}
   player.x=next.x;player.y=next.y;speed-=step;
   if(step===distance){target.path.shift();if(!target.path.length)arriveAtTarget();}
  }
 }
 if(doorApproach.step({x:oldX,y:oldY},player,dy<0&&keys.has('up'))){enterRoom();return;}
 player.walking=Math.hypot(player.x-oldX,player.y-oldY)>.00001;
 player.facing=facingForMotion(player.facing,player.x-oldX,player.y-oldY);if(player.x!==oldX)player.dir=player.x>oldX?1:-1;if(playerSeated){player.facing=chairs[selectedChair].facing;player.walking=false;}
 quietChatPose=quietChat.update(dt,{teacher:npc,player,input:keys.size>0,navigating:!!target,modal:dlg.open,practice:practiceOpen,seatedChat:loungePose.chat,seated:playerSeated,reduced:reducedMotion.matches});
 if(quietChatPose.facing&&!playerSeated)player.facing=quietChatPose.facing;
 near=playerSeated?'seated':standWithinReach()?'stand':teacherWithinReach()?'npc':gardenWithinReach()?'garden':chairs.some(c=>Math.hypot(player.x-c.approach.x,player.y-c.approach.y)<38)?'chair':null;
 const atDoor=roomDoorNearby(player)&&!playerSeated;
 $('location').textContent=atDoor?'琴房門前':near==='npc'?'老師身旁':near==='stand'?'戶外譜架前':near==='garden'?'花園入口':'晨光小徑';
}
const approachRoom=()=>{if(!dlg.open)walkTo(ROOM_ENTRY,'room');};
function interact(){if(dlg.open)return;if(!playerSeated&&roomDoorNearby(player)){approachRoom();return;}if(playerSeated){standUp();return;}if(near==='chair'){const index=chairs.map(c=>Math.hypot(player.x-c.approach.x,player.y-c.approach.y)).indexOf(Math.min(...chairs.map(c=>Math.hypot(player.x-c.approach.x,player.y-c.approach.y))));requestChair(index);return;}if(near==='npc')talk();else if(near==='stand')practice();else if(near==='garden')openGarden();else toast('再靠近老師、戶外譜架或花園入口一點。');}
const dirs={ArrowUp:'up',w:'up',W:'up',ArrowDown:'down',s:'down',S:'down',ArrowLeft:'left',a:'left',A:'left',ArrowRight:'right',d:'right',D:'right'};window.addEventListener('keydown',e=>{if(dlg.open||enteringRoom)return;if(dirs[e.key]){e.preventDefault();target=null;keys.add(dirs[e.key]);}if((e.key==='e'||e.key==='E'||e.key==='Enter')&&!e.repeat&&e.target===canvas){e.preventDefault();interact();}else if((e.key==='e'||e.key==='E')&&!e.repeat)interact();});window.addEventListener('keyup',e=>keys.delete(dirs[e.key]));window.addEventListener('blur',()=>{keys.clear();target=null;});canvas.onpointerdown=e=>{if(dlg.open||enteringRoom)return;canvas.focus({preventScroll:true});const r=canvas.getBoundingClientRect(),x=(e.clientX-r.left)*960/r.width,y=(e.clientY-r.top)*560/r.height;const clickedChair=chairs.findIndex(c=>Math.abs(x-c.x)<20&&y>c.y-34&&y<c.y+18);if(roomDoorHit(x,y)){approachRoom();}else if(clickedChair>=0){if(playerSeated&&clickedChair===selectedChair)standUp();else requestChair(clickedChair);}else if(Math.abs(x-stand.x)<28&&y>stand.y-48&&y<stand.y+8){if(standWithinReach()){standUp();target=null;practice();}else walkTo(standApproach,'stand');}else if(Math.hypot(x-npc.x,y-(npc.y-20))<55){if(teacherWithinReach()){standUp();target=null;talk();}else walkTo({x:npc.x,y:npc.y+35},'npc');}else if(x>730&&x<910&&y>395&&y<525){if(gardenWithinReach()){standUp();target=null;openGarden();}else walkTo({x:garden.x,y:garden.y},'garden');}else walkTo({x,y});};$('journal').onclick=journal;$('close').onclick=()=>dlg.close();dlg.addEventListener('close',()=>{practiceOpen=false;pausePracticeTimer();stop();keys.clear();canvas.focus({preventScroll:true});});document.addEventListener('visibilitychange',()=>{if(document.hidden){pausePracticeTimer();stop();keys.clear();target=null;}else resumePracticeTimer();});window.addEventListener('pageshow',resumePracticeTimer);window.addEventListener('pageshow',()=>{enteringRoom=false;});window.addEventListener('pagehide',()=>{pausePracticeTimer();stop();});function loop(t){const dt=Math.min((t-last)/1000,.04);last=t;if(!document.hidden){update(dt);draw(t);}requestAnimationFrame(loop);}render();requestAnimationFrame(loop);setTimeout(()=>$('toast').style.opacity=0,6000);


setInterval(()=>{const nextWeather=weatherAt();if(nextWeather.key===gameWeather.key)return;gameWeather=nextWeather;document.querySelector('.topline span').textContent=gameWeather.name+' · 練琴日';if(dlg.open&&$('garden-view'))$('garden-view').innerHTML=gardenScene(state,gameWeather);},1000);
