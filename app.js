import { fresh, normalize, complete, replay, NOTES } from './model.js';
const $ = id => document.getElementById(id);
const KEY = 'cello-town-v1';
let state = fresh(), storageOK = true;
try { const raw = localStorage.getItem(KEY); if (raw) state = normalize(JSON.parse(raw)); } catch { storageOK = false; }
let task = 'listen', revealed = false, context, timer, mode = null, voices = new Set(), step = 0, nextTime = 0, demoFinished = false, generation = 0;
const frequencies = [146.8324,164.8138,184.9972,195.9977,220,246.9417,277.1826,293.6648];
const config = {
 listen: ['01 / 聽覺暖身', '先讓耳朵走一遍。', '聽 D3 到 D4 的上行音階，再拿起琴跟著哼一遍。這是合成參考音，不是大提琴錄音。', '我已聽過示範'],
 rhythm: ['02 / 跟拍練習', '每一弓，都慢慢落地。', '選一個舒服的速度，按下節拍器。一拍拉一個音；覺得吃力就慢一點。完成後由你確認。', '我已跟拍練過'],
 memory: ['03 / 記憶挑戰', '把提示收起來，試試看。', '試著從 D 開始拉完一個八度。不記得也沒關係，隨時看看提示，再記下下次想練的地方。', '我已嘗試不看提示']
};
function save() { try { localStorage.setItem(KEY, JSON.stringify(state)); storageOK = true; } catch { storageOK = false; } $('save-status').textContent = storageOK ? '已自動保存在這台裝置。' : '此瀏覽器無法保存進度；關閉頁面後可能遺失。'; }
function announce(text) { $('announcement').textContent = text; }
function render() {
 document.querySelectorAll('.mission').forEach(b => { const id=b.dataset.open; b.classList.toggle('active',id===task); b.classList.toggle('done',state.current.includes(id)); b.setAttribute('aria-pressed',String(id===task)); $('check-'+id).textContent=state.current.includes(id)?'✓':String(['listen','rhythm','memory'].indexOf(id)+1).padStart(2,'0'); });
 $('counter').textContent=`${state.current.length} / 3`; $('progress').style.width=`${state.current.length/3*100}%`;
 const c=config[task]; $('task-label').textContent=c[0]; $('task-title').textContent=c[1]; $('task-description').textContent=c[2];
 $('complete').textContent=state.current.includes(task)?'這個任務已完成 ✓':c[3]; $('complete').disabled=state.current.includes(task)||(task==='listen'&&!demoFinished);
 $('notes').replaceChildren(...NOTES.map(n=>{const el=document.createElement('span');el.textContent=n;return el;})); $('notes').classList.toggle('hidden-notes',task==='memory'&&!revealed); $('notes').setAttribute('aria-hidden',String(task==='memory'&&!revealed));
 $('reveal').hidden=task!=='memory'; $('reveal').textContent=revealed?'收起音名提示':'暫時看看音名'; $('reveal').setAttribute('aria-pressed',String(revealed));
 $('bpm').value=state.bpm; $('bpm-value').textContent=state.bpm+' BPM'; $('volume').value=Math.round(state.volume*100); $('volume-value').textContent=Math.round(state.volume*100)+'%';
 $('flowers').replaceChildren(); const total=state.history.length; for(let i=0;i<Math.min(total,9);i++){let f=document.createElement('span');f.className='flower';f.textContent=['🌼','🌷','🌸'][i%3];f.setAttribute('aria-hidden','true');$('flowers').append(f);} if(!total){$('flowers').innerHTML='<span class="empty-pot" aria-hidden="true">🌱</span>';} $('flowers').setAttribute('aria-label',`已種下 ${total} 朵花`);$('garden-text').textContent=total?`已種下 ${total} 朵花。不會因為休息而消失。`:'完成今天三個小任務，種下第一朵花。';
 $('history-list').replaceChildren(); if(!total){const li=document.createElement('li');li.textContent='第一段足跡，等你慢慢寫下。';$('history-list').append(li);} state.history.slice(-10).reverse().forEach(h=>{const li=document.createElement('li');const date=new Date(h.at);li.textContent=`${Number.isNaN(date.getTime())?h.at:date.toLocaleString('zh-TW',{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'})} · D 大調 · ${h.bpm} BPM · 三個任務完成`;if(h.note){const note=document.createElement('small');note.textContent=h.note;li.append(note);}$('history-list').append(li);});
 updateAudioButton();
}
function updateAudioButton(){ $('audio-toggle').textContent=mode?'停止聲音 ■':task==='listen'?'播放示範 ▷':'開始節拍器 ▷'; $('audio-toggle').setAttribute('aria-pressed',String(!!mode)); }
function stop(){ generation++; clearInterval(timer);timer=null;mode=null;voices.forEach(v=>{try{v.stop();}catch{}});voices.clear(); $('beat').textContent='● ○ ○ ○';document.querySelectorAll('#notes span').forEach(n=>n.classList.remove('playing'));updateAudioButton(); }
function tone(freq,time,duration,click=false){ const osc=context.createOscillator(), gain=context.createGain();osc.type=click?'sine':'triangle';osc.frequency.value=freq;gain.gain.setValueAtTime(0,time);gain.gain.linearRampToValueAtTime(state.volume*(click?.5:.32),time+.008);gain.gain.exponentialRampToValueAtTime(.0001,time+duration);osc.connect(gain);gain.connect(context.destination);voices.add(osc);osc.onended=()=>{voices.delete(osc);osc.disconnect();gain.disconnect();};osc.start(time);osc.stop(time+duration+.02); }
async function start(){ if(mode){stop();return;} const request=++generation; try{const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio)throw Error('unsupported');context??=new Audio();await context.resume();if(request!==generation)return;if(context.state!=='running')throw Error('suspended');mode=task==='listen'?'demo':'metronome';step=0;nextTime=context.currentTime+.06;updateAudioButton();announce(mode==='demo'?'示範播放中。':'節拍器已開始。');timer=setInterval(tick,25);tick();}catch{stop();announce('聲音尚未啟動，請再點一次播放，並確認裝置音量。');} }
function tick(){if(!mode)return;while(nextTime<context.currentTime+.12){if(mode==='demo'&&step>=8){if(context.currentTime>=nextTime){demoFinished=true;stop();render();announce('示範播放完畢，可以確認完成第一個任務。');}return;}const i=step; const activeMode=mode; const token=generation; tone(activeMode==='demo'?frequencies[i]:i%4===0?1000:750,nextTime,activeMode==='demo'?60/state.bpm*.85:.07,activeMode!=='demo');const delay=Math.max(0,(nextTime-context.currentTime)*1000);setTimeout(()=>{if(mode!==activeMode||generation!==token)return;$('beat').textContent=Array.from({length:4},(_,j)=>j===i%4?'●':'○').join(' ');if(activeMode==='demo')document.querySelectorAll('#notes span').forEach((n,j)=>n.classList.toggle('playing',j===i));},delay);step++;nextTime+=60/state.bpm;}}
document.querySelectorAll('[data-open]').forEach(b=>b.addEventListener('click',()=>{stop();task=b.dataset.open;revealed=false;render();if(b.classList.contains('hotspot')){$('task-title').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'center'});$('audio-toggle').focus({preventScroll:true});}}));
$('audio-toggle').addEventListener('click',start);$('reveal').addEventListener('click',()=>{revealed=!revealed;render();});
$('complete').addEventListener('click',()=>{stop();const previous=state.history.length;state=complete(state,task);save();render();announce(state.history.length>previous?'三個小任務完成了！花園多了一朵花。':'已記下這次練習，準備好再進行下一個任務。');});
$('bpm').addEventListener('input',e=>{state.bpm=Number(e.target.value);$('bpm-value').textContent=state.bpm+' BPM';save();});$('volume').addEventListener('input',e=>{state.volume=Number(e.target.value)/100;$('volume-value').textContent=e.target.value+'%';save();});
$('note').value=state.note;$('note').addEventListener('input',e=>{state.note=e.target.value;save();});
$('replay').addEventListener('click',()=>{if(state.current.length>0&&state.current.length<3&&!confirm('開始新一輪？這輪尚未完成的勾選會重設；已完成的歷史、花園與筆記都會保留。'))return;stop();state=replay(state);task='listen';revealed=false;demoFinished=false;save();render();announce('新的一輪開始。花園、歷史和筆記都還在。');});
document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});window.addEventListener('pagehide',stop);render();if(!storageOK)$('save-status').textContent='無法讀取保存資料；本次進度可能無法永久保存。';
