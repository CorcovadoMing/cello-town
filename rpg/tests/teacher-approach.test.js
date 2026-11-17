import test from 'node:test';import assert from 'node:assert/strict';import{createTeacherApproach}from'../teacher-approach.js';import{createQuietChat}from'../quiet-chat.js';import{readFileSync}from'node:fs';
const teacher={x:300,y:300,walking:false};const outside={x:370,y:300},inside={x:360,y:300,facing:'front'};
const step=(c,extra={})=>c.update(.05,{before:inside,player:inside,teacher,...extra});
test('idle nearby for three seconds earns one ambient signal, not periodic chatter',()=>{const c=createTeacherApproach();for(let i=0;i<59;i++)assert.equal(step(c),false);assert.equal(step(c),true);for(let i=0;i<1000;i++)assert.equal(step(c),false);step(c,{player:outside});for(let i=0;i<59;i++)assert.equal(step(c),false);assert.equal(step(c),true);});
test('keyboard, touch navigation, movement, teacher walking and higher priority interactions restart the quiet wait',()=>{for(const extra of[{input:true},{navigating:true},{blocked:true},{before:outside},{player:{...inside,walking:true}},{teacher:{...teacher,walking:true}}]){const c=createTeacherApproach();for(let i=0;i<40;i++)step(c);assert.equal(step(c,extra),false);for(let i=0;i<59;i++)assert.equal(step(c),false);assert.equal(step(c),true);}});
test('cancel and nonfinite deltas cannot complete an old wait',()=>{const c=createTeacherApproach();for(let i=0;i<50;i++)step(c);c.cancel();assert.equal(c.update(NaN,{before:inside,player:inside,teacher}),false);for(let i=0;i<59;i++)assert.equal(step(c),false);assert.equal(step(c),true);});
test('idle signal uses the existing in-scene finite exchange in regular and reduced motion',()=>{for(const reduced of[false,true]){const c=createQuietChat(),p={...inside,walking:false};assert.equal(c.update(.05,{teacher,player:p,idleChat:true,reduced}).facing,'left');const seen=new Set();let r;for(let i=0;i<140;i++){r=c.update(.05,{teacher,player:p,reduced});for(const b of r.bubbles){seen.add(b.speaker+':'+b.symbol);if(reduced)assert.equal(b.alpha,1);}}assert.equal(seen.size,3);assert.deepEqual(r.bubbles,[]);}});
test('explicit formal dialogue stays click/key owned; idle never opens dialog or task',()=>{const app=readFileSync(new URL('../app.js',import.meta.url),'utf8');assert.match(app,/const idleChat=teacherApproach.update/);assert.doesNotMatch(app,/teacherApproach.update[^\n]+talk\(\)/);assert.match(app,/quietChat.update\(dt,\{[^\n]+idleChat,/);assert.match(app,/kind==='npc'&&teacherWithinReach\(\)[^\n]+talk\(\)/);assert.match(app,/if\(teacherWithinReach\(\)\)\{standUp\(\);target=null;talk\(\);\}/);});
test('teacher arrival remembered while student moves, then turns only after stopping',()=>{const c=createQuietChat(),p={x:360,y:300,facing:'front',walking:true};c.update(.05,{teacher:{x:280,y:300,walking:true},player:p,input:true});c.update(.05,{teacher:{x:290,y:300,walking:true},player:p,input:true});for(let i=0;i<30;i++)assert.equal(c.update(.05,{teacher,player:p,input:true}).facing,null);p.walking=false;assert.equal(c.update(.05,{teacher,player:p}).facing,'left');});
test('teacher arrival turns the idle student even while pictogram bubbles are cooling down',()=>{
 const q=createQuietChat(),player={x:0,y:0,facing:'front'};
 const step=(x,walking)=>q.update(.05,{teacher:{x,y:0,walking},player});
 step(110,true);step(92,true);assert.equal(step(91,false).facing,'right');
 step(102,true);step(89,true);const next=step(88,false);
 assert.equal(next.facing,'right');assert.deepEqual(next.bubbles,[]);
});
test('reentering within the old 24-second cooldown still gets its idle exchange, without interrupting an active chat',()=>{
 const q=createQuietChat(),c=createTeacherApproach(),p={...inside,walking:false};
 q.update(.05,{teacher,player:p,idleChat:true});
 for(let i=0;i<140;i++)q.update(.05,{teacher,player:p});
 assert.equal(q.active,false);
 step(c,{player:outside});let signal=false;for(let i=0;i<60;i++)signal=step(c);
 assert.equal(signal,true);q.update(.05,{teacher,player:p,idleChat:signal});assert.equal(q.active,true);
 let r;for(let i=0;i<64;i++)r=q.update(.05,{teacher,player:p,idleChat:true});
 assert.ok(r.bubbles.some(b=>b.speaker==='player'),'repeated idle signals must not restart the ongoing teacher bubble');
});
test('idle timer counts visible real seconds even with slow render ticks',()=>{
 const c=createTeacherApproach();const tick=dt=>c.update(dt,{before:inside,player:inside,teacher});
 for(let i=0;i<5;i++)assert.equal(tick(.5),false);assert.equal(tick(.5),true);
 c.cancel();assert.equal(tick(0),false);assert.equal(tick(2.99),false);assert.equal(tick(.01),true);
 const app=readFileSync(new URL('../app.js',import.meta.url),'utf8');assert.match(app,/visibilitychange',\(\)=>\{idleLast=null/);assert.match(app,/idleLast=document.hidden\?null:t/);assert.match(app,/update\(dt,idleDt\)/);
});
