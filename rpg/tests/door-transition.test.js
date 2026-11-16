import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const app=fs.readFileSync(new URL('../app.js',import.meta.url),'utf8'),css=fs.readFileSync(new URL('../style.css',import.meta.url),'utf8');
function harness(incoming=false,reduced=false){
 let id=0,resets=0;const timers=new Map(),events={},listeners={},classes=new Set();
 const world={addEventListener:(k,f)=>{listeners[k]=f;},removeEventListener:(k,f)=>{if(listeners[k]===f)delete listeners[k];}};
 const stage={querySelector:()=>world,classList:{add:(...k)=>k.forEach(x=>classes.add(x)),remove:(...k)=>k.forEach(x=>classes.delete(x)),contains:k=>classes.has(k)}};
 const c={window:{addEventListener:(k,f)=>events[k]=f},matchMedia:()=>({matches:reduced}),requestAnimationFrame:()=>{},cancelAnimationFrame:()=>{},setTimeout:(fn,ms)=>{timers.set(++id,{fn,ms});return id;},clearTimeout:n=>timers.delete(n)};
 vm.createContext(c);vm.runInContext(app.slice(app.indexOf('function doorSceneTransition'),app.indexOf('const doorStage=')),c);
 return{transfer:c.doorSceneTransition(stage,incoming,()=>resets++),classes,events,get resets(){return resets;},end(propertyName='transform',target=world){listeners.transitionend?.({target,propertyName});},run(ms){for(const[n,t]of[...timers])if(t.ms===ms){timers.delete(n);t.fn();}}};
}
test('leave only after the world transform finishes, not a child/property nor twice',()=>{
 const h=harness();let n=0;h.transfer(()=>n++);
 assert.ok(h.classes.has('door-shot-near'));h.end('opacity');h.end('transform',{});assert.equal(n,0);
 h.end();h.end();h.run(650);assert.equal(n,1);h.run(2000);
 assert.equal(h.classes.size,0);assert.equal(h.resets,1);
 assert.match(app,/MUSIC_ROOM_DOOR.x\+MUSIC_ROOM_DOOR.w\/2/);assert.match(css,/door-shot-near>canvas/);assert.doesNotMatch(css,/door-scene-dark/);
});
test('fallback navigates once if the transition never paints; reduced motion is immediate',()=>{
 let n=0;const h=harness();h.transfer(()=>n++);h.run(650);h.end();assert.equal(n,1);
 const instant=harness(false,true);instant.transfer(()=>n++);assert.equal(n,2);assert.equal(instant.classes.size,0);
});
test('return pulls back, and leaving or failed navigation reliably clears the old shot',()=>{
 const h=harness(true);assert.ok(h.classes.has('door-shot-near'));h.run(120);
 assert.equal(h.classes.has('door-shot-near'),false);assert.ok(h.classes.has('door-shot-moving'));h.run(440);assert.equal(h.classes.size,0);
 let n=0;h.transfer(()=>n++);h.events.pagehide();h.end();h.run(650);assert.equal(n,0);
 h.events.pageshow({persisted:true});assert.equal(h.classes.size,0);
 h.transfer(()=>{throw Error('blocked');});h.end();assert.equal(h.classes.size,0);
});
