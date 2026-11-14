// Sample-clock reference playback. No microphone input, network or shared state.
class PracticeProcessor extends AudioWorkletProcessor {
 constructor(){
  super();this.frame=0;this.session=null;this.voices=[];
  this.port.onmessage=({data:m})=>this.message(m||{});
 }
 message(m){
  if(m.type==='start'){
   if(!['demo','metro'].includes(m.mode))return;
   this.voices=[];this.session={id:m.id,mode:m.mode,bpm:this.bpm(m.bpm),volume:this.volume(m.volume),index:0,next:this.frame+Math.round(Math.max(0,Math.min(1,Number(m.delay)||0))*sampleRate),started:false,finish:Infinity};
  }else if(this.session&&m.id===this.session.id){
   if(m.type==='stop'){this.session=null;this.voices=[];}
   else if(m.type==='settings'){
    if(Number.isFinite(m.bpm))this.session.bpm=this.bpm(m.bpm);
    if(Number.isFinite(m.volume))this.session.volume=this.volume(m.volume);
   }
  }
 }
 bpm(n){return Number.isFinite(n)?Math.max(30,Math.min(240,n)):72;}
 volume(n){return Number.isFinite(n)?Math.max(0,Math.min(1,n)):0.5;}
 onset(s){
  const beat=60/s.bpm,i=s.index++,demo=s.mode==='demo',last=demo&&i===7;
  const freq=demo?[146.8324,164.8138,184.9972,195.9977,220,246.9417,277.1826,293.6648][i]:(i%4===0?1000:750);
  const duration=demo?(last?beat*1.45:beat+Math.min(.04,beat*.12)):.065;
  this.voices.push({start:this.frame,freq,beat,demo,last,duration});
  this.port.postMessage({type:'beat',id:s.id,index:i});
  // Fractional frame deadlines avoid accumulating rounding drift.
  s.next+=beat*sampleRate;
  if(last)s.finish=this.frame+Math.ceil((duration+.02)*sampleRate);
 }
 gain(v,t){
  if(t<0||t>=v.duration)return 0;
  if(!v.demo)return t<.008?.42*t/.008:.42*Math.pow(.0001/.42,(t-.008)/(.065-.008));
  const sustain=v.beat*.72,release=v.last?v.beat*.94:v.beat-.02;
  if(t<.025)return .18*t/.025;
  if(t<sustain)return .18+(.09-.18)*(t-.025)/(sustain-.025);
  if(t<release)return .09;
  return .09*(1-(t-release)/(v.duration-release));
 }
 process(inputs,outputs){
  const channels=outputs[0];if(!channels?.length)return true;
  for(let j=0;j<channels[0].length;j++,this.frame++){
   const s=this.session;let value=0;
   if(s){
    if(!s.started){s.started=true;this.port.postMessage({type:'started',id:s.id});}
    if(this.frame>=s.next&&(s.mode==='metro'||s.index<8))this.onset(s);
    for(const v of this.voices){
     const t=(this.frame-v.start)/sampleRate,phase=t*v.freq;
     const wave=v.demo?2/Math.PI*Math.asin(Math.sin(2*Math.PI*phase)):Math.sin(2*Math.PI*phase);
     value+=wave*this.gain(v,t)*s.volume;
    }
    this.voices=this.voices.filter(v=>(this.frame-v.start)/sampleRate<v.duration);
    if(this.frame>=s.finish){this.port.postMessage({type:'finished',id:s.id});this.session=null;this.voices=[];}
   }
   for(const channel of channels)channel[j]=value;
  }
  return true;
 }
}
registerProcessor('practice-processor',PracticeProcessor);
