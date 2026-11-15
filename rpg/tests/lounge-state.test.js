import test from 'node:test';import assert from 'node:assert/strict';
import {createNavigation} from '../navigation.js';import {createLounge} from '../lounge-state.js';
const trees=[[45,99,1.5],[115,105,1.3],[210,83,1.2],[325,87,1.4],[435,91,1.6],[870,103,1.8],[930,178,1.4],[65,250,1.8],[139,279,1.2],[848,281,1.4],[919,356,1.2],[340,476,1.2],[585,495,1.3],[690,500,1]].map(([x,y,s])=>({x:x+.5*s,y:y+32*s}));
const blocked=(x,y)=>(x>=478&&x<=542&&y>=214&&y<=245)||(x>=450&&x<=470&&y>=225&&y<=237)||(x>=550&&x<=570&&y>=225&&y<=237)||x<30||x>930||y<130||y>542||(x<275&&y>380)||(x>730&&x<910&&y>395)||(x>174&&x<330&&y>170&&y<240);
const navigation=createNavigation({trees,blocked});
test('table and chair bases are solid while both approaches and every station remain reachable',()=>{
 for(const p of [{x:510,y:230},{x:460,y:232},{x:560,y:232}])assert.equal(navigation.isWalkable(p.x,p.y),false);
 for(const p of [{x:443,y:250},{x:577,y:250},{x:303,y:325},{x:615,y:432},{x:710,y:460}])assert.ok(navigation.findPath({x:460,y:425},p));
});
test('teacher walks to chair, gives one optional line, rain closes book and returns exactly',()=>{
 const a=createLounge({navigation,random:()=>.75}),teacher={x:303,y:334,facing:'front'};let state,chat=0,wasSeated=false;
 for(let i=0;i<1600;i++){state=a.update(.05,{teacher,playerSeated:true});chat+=state.chat?1:0;if(state.mode==='seated'){wasSeated=true;if(chat)break;}}
 assert.ok(wasSeated);assert.equal(chat,1);assert.equal(state.pose.x,560);
 state=a.update(.05,{teacher,playerSeated:true,rain:true});assert.equal(state.mode,'return');assert.equal(state.reading,false);
 for(let i=0;i<1000&&state.borrowed;i++)state=a.update(.05,{teacher,rain:true});assert.equal(state.mode,'idle');assert.deepEqual(teacher,{x:303,y:334,facing:'front'});
});
test('practice, dialog, reduced motion prevent unsolicited lounge visit; timers bounded',()=>{
 for(const flag of ['practice','dialog','reduced','rain','questApproach']){const a=createLounge({navigation,random:()=>.75});for(let i=0;i<1000;i++)assert.equal(a.update(.05,{teacher:{x:303,y:290},[flag]:true}).mode,'idle');}
 const a=createLounge({navigation,random:()=>.75});assert.equal(a.update(Infinity,{teacher:{x:303,y:290}}).mode,'idle');assert.equal(a.update(-10,{teacher:{x:303,y:290}}).mode,'idle');
});
test('explicit teacher approach and dialog freeze leisure; practice preempts and resumes original station',()=>{
 const a=createLounge({navigation,random:()=>.75}),teacher={x:400,y:334,facing:'left'};let s;
 for(let i=0;i<1000;i++){s=a.update(.05,{teacher});if(s.mode==='seated')break;}
 assert.equal(s.mode,'seated');const seated=s.pose;
 for(let i=0;i<50;i++)assert.deepEqual(a.update(.05,{teacher,questApproach:true}).pose,seated);
 for(let i=0;i<500;i++)assert.deepEqual(a.update(.05,{teacher,player:{x:560,y:267}}).pose,seated);
 for(let i=0;i<50;i++)assert.deepEqual(a.update(.05,{teacher,dialog:true}).pose,seated);
 s=a.update(.05,{teacher,practice:true});assert.equal(s.mode,'return');
 for(let i=0;i<1000&&s.borrowed;i++)s=a.update(.05,{teacher,practice:true});
 assert.equal(s.mode,'idle');for(let i=0;i<1000;i++)assert.equal(a.update(.05,{teacher,practice:true}).mode,'idle');
});

test('either player chair makes teacher choose opposite and vacate before switching',()=>{
 const seats=[{x:440,y:232,facing:'right',approach:{x:423,y:250}},{x:540,y:232,facing:'left',approach:{x:557,y:250}}];
 const n=createNavigation({trees,blocked:(x,y)=>x<30||x>930||y<130||y>542||(x>=458&&x<=522&&y>=214&&y<=245)||(x>=430&&x<=450&&y>=225&&y<=237)||(x>=530&&x<=550&&y>=225&&y<=237)});
 for(const index of[0,1]){const a=createLounge({navigation:n,seats,random:()=>index===0?.1:.9}),teacher={x:303,y:334};let s;
  for(let i=0;i<1000;i++){s=a.update(.04,{teacher});if(s.mode==='seated')break;}assert.equal(s.seatIndex,index);
  s=a.update(.04,{teacher,playerSeatIndex:index});assert.equal(s.mode,'approach');assert.equal(s.seatIndex,1-index);assert.ok(Math.hypot(s.pose.x-seats[index].x,s.pose.y-seats[index].y)>10);
  for(let i=0;i<1000;i++){s=a.update(.04,{teacher,playerSeatIndex:index,playerSeated:true});if(s.mode==='seated')break;}
  assert.equal(s.mode,'seated');assert.equal(s.pose.x,seats[1-index].x);assert.equal(s.pose.facing,seats[1-index].facing);
  s=a.update(.04,{teacher,practice:true});assert.equal(s.mode,'return');assert.equal(s.reading,false);
 }
});
