export const NOTES=['D','E','F♯','G','A','B','C♯','D'];
export const fresh=()=>({version:1,phase:'available',steps:[],bpm:60,volume:.65,note:'',history:[]});
export function normalize(x){const s=fresh();if(!x||x.version!==1)return s;s.phase=['available','active','ready','done'].includes(x.phase)?x.phase:'available';s.steps=[...new Set(Array.isArray(x.steps)?x.steps.filter(n=>['listen','rhythm','memory'].includes(n)):[])];s.bpm=Math.max(40,Math.min(120,Number(x.bpm)||60));s.volume=Math.max(0,Math.min(1,Number.isFinite(x.volume)?x.volume:.65));s.note=String(x.note||'').slice(0,400);s.history=Array.isArray(x.history)?x.history.filter(h=>typeof h.at==='string'&&Number.isFinite(h.bpm)).slice(-50):[];if(s.phase==='ready'&&s.steps.length!==3)s.phase='active';return s;}
export function accept(s){return s.phase==='available'?{...s,phase:'active'}:s;}
export function complete(s,step){if(!['active','ready'].includes(s.phase)||!['listen','rhythm','memory'].includes(step))return s;const steps=[...new Set([...s.steps,step])];return {...s,steps,phase:steps.length===3?'ready':'active'};}
export function turnIn(s,at=new Date().toISOString()){return s.phase==='ready'&&s.steps.length===3?{...s,phase:'done',history:[...s.history,{at,bpm:s.bpm,note:s.note}].slice(-50)}:s;}
export function again(s){return s.phase==='done'?{...s,phase:'available',steps:[]}:s;}

// Presentation derives from saved quest state; it never completes or rewards a quest.
export function questView(s){
 const active=s.phase==='active'||s.phase==='ready';
 const ready=s.phase==='ready'&&s.steps.length===3;
 return {visible:active,ready,count:s.steps.length,next:active&&!ready?['listen','rhythm','memory'].find(step=>!s.steps.includes(step))||null:null,marker:s.phase==='available'?'!':active?'?':null,markerTone:s.phase==='available'||ready?'gold':active?'gray':null};
}
