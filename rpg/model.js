export const NOTES=['D','E','F♯','G','A','B','C♯','D'];
export const fresh=()=>({version:1,phase:'available',steps:[],bpm:60,volume:.65,note:'',history:[],bloomsTotal:0,roundMs:0,roundTimed:false});
export function normalize(x){const s=fresh();if(!x||x.version!==1)return s;s.phase=['available','active','ready','done'].includes(x.phase)?x.phase:'available';s.steps=[...new Set(Array.isArray(x.steps)?x.steps.filter(n=>['listen','rhythm','memory'].includes(n)):[])];s.bpm=Math.max(40,Math.min(120,Number(x.bpm)||60));s.volume=Math.max(0,Math.min(1,Number.isFinite(x.volume)?x.volume:.65));s.note=String(x.note||'').slice(0,400);s.roundMs=validMs(x.roundMs);s.roundTimed=x.roundTimed===true||s.roundMs>0;s.history=Array.isArray(x.history)?x.history.filter(h=>typeof h.at==='string'&&Number.isFinite(h.bpm)).slice(-50):[];s.bloomsTotal=Math.max(s.history.length,Number.isSafeInteger(x.bloomsTotal)&&x.bloomsTotal>=0?x.bloomsTotal:0);if(s.phase==='ready'&&s.steps.length!==3)s.phase='active';return s;}
export function accept(s){return s.phase==='available'?{...s,phase:'active'}:s;}
export function complete(s,step){if(!['active','ready'].includes(s.phase)||!['listen','rhythm','memory'].includes(step))return s;const steps=[...new Set([...s.steps,step])];return {...s,steps,phase:steps.length===3?'ready':'active'};}
export function turnIn(s,at=new Date().toISOString()){return s.phase==='ready'&&s.steps.length===3?{...s,phase:'done',bloomsTotal:Math.max(s.bloomsTotal||0,s.history.length)+1,history:[...s.history,{at,bpm:s.bpm,note:s.note,elapsedSeconds:s.roundTimed||s.roundMs>0?Math.floor(validMs(s.roundMs)/1000):undefined}].slice(-50)}:s;}
export function again(s){return s.phase==='done'?{...s,phase:'available',steps:[],roundMs:0,roundTimed:false}:s;}

// Presentation derives from saved quest state; it never completes or rewards a quest.
export function questView(s){
 const active=s.phase==='active'||s.phase==='ready';
 const ready=s.phase==='ready'&&s.steps.length===3;
 return {visible:active,ready,count:s.steps.length,next:active&&!ready?['listen','rhythm','memory'].find(step=>!s.steps.includes(step))||null:null,marker:s.phase==='available'?'!':active?'?':null,markerTone:s.phase==='available'||ready?'gold':active?'gray':null};
}

// Reset only the current round; earned history, notes and sound preferences survive.
export function resetRound(s){return {...s,phase:'available',steps:[],roundMs:0,roundTimed:false};}
export const FLOWERS=[
 {name:'晨光雛菊',petal:'#fff3c0',shade:'#e5bb66',center:'#ce903d'},
 {name:'珊瑚波斯菊',petal:'#f1a5a0',shade:'#d77980',center:'#f4cf71'},
 {name:'暮紫銀蓮',petal:'#c4b1e5',shade:'#9078ba',center:'#f7d887'},
 {name:'晴空勿忘我',petal:'#a8d7e6',shade:'#6da8c5',center:'#f9dda0'},
 {name:'杏桃金盞',petal:'#f3c080',shade:'#dd9760',center:'#925d42'},
 {name:'月光小百合',petal:'#e7efc8',shade:'#b7c18c',center:'#dfb46c'}
];
export function bloomCount(s){return Math.max(s.bloomsTotal||0,s.history.length);}
export function collection(s){const total=bloomCount(s);return FLOWERS.map((flower,i)=>({...flower,earned:total>i,count:Math.max(0,Math.ceil((total-i)/FLOWERS.length))}));}

function validMs(value){return Number.isFinite(value)&&value>=0?Math.min(value,Number.MAX_SAFE_INTEGER):0;}
// The running timestamp is transient. Only accumulated duration is persisted.
export function addElapsed(s,deltaMs){return ['active','ready'].includes(s.phase)&&Number.isFinite(deltaMs)&&deltaMs>0?{...s,roundTimed:true,roundMs:validMs(validMs(s.roundMs)+deltaMs)}:s;}
export function formatElapsed(seconds){const n=Number.isFinite(seconds)&&seconds>=0?Math.floor(seconds):0;return String(Math.floor(n/60)).padStart(2,'0')+':'+String(n%60).padStart(2,'0');}
export function historyDuration(h){return Number.isFinite(h.elapsedSeconds)&&h.elapsedSeconds>=0?formatElapsed(h.elapsedSeconds):'未記錄時長';}


// Explicit development shortcut. Same transitions/reward rules, no fabricated time.
export function completeRoundForTest(s){
 if(s.phase==='done')return s;
 let next=s.phase==='available'?accept(s):s;
 for(const step of ['listen','rhythm','memory'])next=complete(next,step);
 return turnIn(next);
}

// Explicit owner-confirmed game reset. Preferences survive; progress does not.
export function clearRecords(s){return {...s,phase:'available',steps:[],note:'',history:[],bloomsTotal:0,roundMs:0,roundTimed:false};}
export function clearStoredRecords(storage,key,s){const next=clearRecords(s);storage.setItem(key,JSON.stringify(next));return next;}
