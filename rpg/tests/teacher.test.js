import assert from 'node:assert/strict';import {createTeacher} from '../teacher.js';import test from 'node:test';
test('teacher deterministic path, observations, pause and reset are ephemeral',()=>{
const blocked=(x,y)=>x<30||x>930||y<130||y>542||(x<275&&y>380)||(x>730&&x<910&&y>395)||(x>174&&x<330&&y>170&&y<240);
const a=createTeacher(),b=createTeacher();let moving=0,observing=0,minX=999,maxX=0;
for(let i=0;i<18000;i++){const input={practiceActive:i>3000&&i<11000};const x=a.update(1/60,input),y=b.update(1/60,input);assert.deepEqual(x,y);assert(!blocked(x.x,x.y));assert((Math.abs(x.x-303)<.001&&x.y>=290&&x.y<=334)||Math.abs(x.y-334)<.001);moving+=x.walking;observing+=x.observing;minX=Math.min(minX,x.x);maxX=Math.max(maxX,x.x)}assert(moving>0&&observing>0);
for(const input of[{dialogOpen:true},{reducedMotion:true},{holdForInteraction:true},{player:a.position}]){const before=a.position;for(let i=0;i<100;i++)a.update(.016,input);assert.deepEqual(a.position,before)}assert.deepEqual(a.reset().x,303);assert.deepEqual(a.position,{x:303,y:290});assert.equal(minX,303);assert.equal(maxX,520);
});

test('teacher conversation faces actual player on all four sides without moving',()=>{
 for(const [dx,dy,facing] of[[50,0,'right'],[-50,0,'left'],[0,-50,'back'],[0,50,'front']])for(const held of[{holdForInteraction:true},{dialogOpen:true}]){
  const a=createTeacher(),before=a.position;
  const p=a.update(.016,{...held,player:{x:before.x+dx,y:before.y+dy}});assert.equal(p.facing,facing);assert.deepEqual(a.position,before);assert.equal(p.walking,false);
 }
});
test('teacher nearby attention has diagonal hysteresis and no turn at coincident feet',()=>{
 const a=createTeacher(),p=a.position;
 assert.equal(a.update(.016,{player:{x:p.x+30,y:p.y+20}}).facing,'right');
 for(const d of[29,30,31,32,34,36])assert.equal(a.update(.016,{player:{x:p.x+30,y:p.y+d}}).facing,'right');
 assert.equal(a.update(.016,{player:{x:p.x+30,y:p.y+40}}).facing,'front');
 for(const d of[29,30,31,32,34,36])assert.equal(a.update(.016,{player:{x:p.x+d,y:p.y+30}}).facing,'front');
 assert.equal(a.update(.016,{player:p}).facing,'front');assert.deepEqual(a.position,p);
});
