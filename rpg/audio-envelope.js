// Beat onsets/pitches remain unchanged; only reference-note articulation changes.
export function demoEnvelope(start,beat,volume,last=false){
 const overlap=Math.min(.04,beat*.12),end=start+(last?beat*1.45:beat+overlap);
 return {start,attack:start+.025,sustain:start+beat*.72,release:last?start+beat*.94:start+beat-.02,end,stop:end+.02,peak:volume*.18,body:volume*.09};
}
export function applyDemoEnvelope(gain,p){gain.setValueAtTime(0,p.start);gain.linearRampToValueAtTime(p.peak,p.attack);gain.linearRampToValueAtTime(p.body,p.sustain);gain.setValueAtTime(p.body,p.release);gain.linearRampToValueAtTime(0,p.end);}
export function stopVoices(voices){for(const voice of voices){try{voice.stop();}catch{}}voices.clear();}
