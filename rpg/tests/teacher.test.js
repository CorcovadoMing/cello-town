import assert from 'node:assert/strict';import {createTeacher} from '../teacher.js';import test from 'node:test';
test('teacher deterministic path, observations, pause and reset are ephemeral',()=>{
const blocked=(x,y)=>x<30||x>930||y<130||y>542||(x<275&&y>380)||(x>730&&x<910&&y>395)||(x>174&&x<330&&y>170&&y<240);
const a=createTeacher(),b=createTeacher();let moving=0,observing=0,minX=999,maxX=0;
for(let i=0;i<18000;i++){const input={practiceActive:i>3000&&i<11000};const x=a.update(1/60,input),y=b.update(1/60,input);assert.deepEqual(x,y);assert(!blocked(x.x,x.y));assert((Math.abs(x.x-303)<.001&&x.y>=290&&x.y<=334)||Math.abs(x.y-334)<.001);moving+=x.walking;observing+=x.observing;minX=Math.min(minX,x.x);maxX=Math.max(maxX,x.x)}assert(moving>0&&observing>0);
for(const input of[{dialogOpen:true},{reducedMotion:true},{holdForInteraction:true},{player:a.position}]){const before=a.position;for(let i=0;i<100;i++)a.update(.016,input);assert.deepEqual(a.position,before)}assert.deepEqual(a.reset().x,303);assert.deepEqual(a.position,{x:303,y:290});assert.equal(minX,303);assert.equal(maxX,520);
});
