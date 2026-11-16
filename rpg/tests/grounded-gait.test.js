import test from'node:test';import assert from'node:assert/strict';
import{teacherFoot,createTeacher,drawTeacher}from'../teacher.js';import{createLounge}from'../lounge-state.js';import{petGaitCycle,advancePetGait,createRainPets}from'../ambience.js';
const nav={findPath:(a,b)=>[{...b}],lineClear:()=>true,isWalkable:()=>true};
test('teacher planted side shoe cancels world travel, rather than bobbing vertically',()=>{
 for(const offset of[0,.5,1]){const a=teacherFoot(offset),d=.5,b=teacherFoot(offset+d*Math.PI/8);assert.equal(a.lift,0);assert.equal(b.lift,0);assert.ok(Math.abs(d+(b.travel-a.travel)*1.25)<1e-8);}
 assert.ok(teacherFoot(Math.PI*1.5).lift>2);assert.notEqual(teacherFoot(0).travel,teacherFoot(1).travel);
});
test('actual lounge side routes advance teacher stride; patrol and dialogue holds retain coherent phase',()=>{
 const lounge=createLounge({navigation:nav,random:()=>0}),teacher={x:303,y:290,stride:0,facing:'right'},player={x:900,y:500};let last=null,count=0;
 for(let i=0;i<1200;i++){const f=lounge.update(.04,{teacher,player});if(f.borrowed&&f.pose.walking&&last?.borrowed&&last.pose.walking){const d=Math.hypot(f.pose.x-last.pose.x,f.pose.y-last.pose.y);assert.ok(Math.abs(f.pose.stride-last.pose.stride-d*Math.PI/8)<1e-8);count++;}last=f;}
 assert.ok(count>100);const a=lounge.state,b=lounge.update(.04,{teacher,dialog:true});assert.deepEqual(b,a);
 const patrol=createTeacher();let before;for(let i=0;i<300;i++)before=patrol.update(.04);const frozen=patrol.update(.04,{reducedMotion:true});assert.equal(frozen.stride,before.stride);
});
test('slow pet cadence has shorter ground distance while normal and umbrella gait remain unchanged',()=>{
 assert.equal(petGaitCycle(29),12);assert.equal(petGaitCycle(37),12);assert.equal(petGaitCycle(58),24);assert.equal(petGaitCycle(160),24);
 assert.ok(petGaitCycle(45)>12&&petGaitCycle(45)<24);const slow={},normal={};advancePetGait(slow,3,29);advancePetGait(normal,3,58);assert.equal(slow.gaitPhase,normal.gaitPhase*2);
 const pets=createRainPets({navigation:nav});let previous=null,observed=0;
 for(let t=0;t<45000;t+=20){const f=pets.update(t);if(previous&&f.dog.moving&&previous.dog.moving){const d=Math.hypot(f.dog.x-previous.dog.x,f.dog.y-previous.dog.y);const phase=(f.dog.gaitPhase-previous.dog.gaitPhase+Math.PI*2)%(Math.PI*2);assert.ok(Math.abs(phase-d*Math.PI/6)<1e-8);observed++;}previous=f;}assert.ok(observed>50);
});
