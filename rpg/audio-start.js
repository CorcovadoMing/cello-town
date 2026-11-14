// resume() is invoked synchronously by the click handler, before yielding.
export function resumeFromTap(context,timeout=2500){let timer;const resumed=context.resume();return Promise.race([resumed,new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('resume-timeout')),timeout);})]).finally(()=>clearTimeout(timer));}
export function requestPlaybackSession(nav){try{const session=nav.audioSession;if(!session)return ()=>{};const previous=session.type;session.type='playback';return ()=>{try{if(session.type==='playback')session.type=previous;}catch{}};}catch{return ()=>{};}}
export function clockStalled(previous,current,elapsed){return current<=previous&&elapsed>1500;}
