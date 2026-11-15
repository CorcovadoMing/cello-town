import test from 'node:test';import assert from 'node:assert/strict';
import {createNavigation} from '../navigation.js';import {createLounge} from '../lounge-state.js';
const trees=[[45,99,1.5],[115,105,1.3],[210,83,1.2],[325,87,1.4],[435,91,1.6],[870,103,1.8],[930,178,1.4],[65,250,1.8],[139,279,1.2],[848,281,1.4],[919,356,1.2],[340,476,1.2],[585,495,1.3],[690,500,1]].map(([x,y,s])=>({x:x+.5*s,y:y+32*s}));
const blocked=(x,y)=>(x>=478&&x<=542&&y>=214&&y<=245)||(x>=450&&x<=470&&y>=225&&y<=237)||(x>=550&&x<=570&&y>=225&&y<=237)||x<30||x>930||y<130||y>542||(x<275&&y>380)||(x>730&&x<910&&y>395)||(x>174&&x<330&&y>170&&y<240);
const navigation=createNavigation({trees,blocked});
test('table and chair bases are solid while both approaches and every station remain reachable',()=>{
 for(const p of [{x:510,y:230},{x:460,y:232},{x:560,y:232}])assert.equal(navigation.isWalkable(p.x,p.y),false);
 for(const p of [{x:443,y:250},{x:577,y:250},{x:303,y:325},{x:655,y:345},{x:710,y:460}])assert.ok(navigation.findPath({x:460,y:425},p));
});
test('teacher walks to chair, gives one optional line, rain closes book and returns exactly',()=>{
 const a=createLounge({navigation}),teacher={x:303,y:334,facing:'front'};let state,chat=0,wasSeated=false;
 for(let i=0;i<1600;i++){state=a.update(.05,{teacher,playerSeated:true});chat+=state.chat?1:0;if(state.mode==='seated'){wasSeated=true;if(chat)break;}}
 assert.ok(wasSeated);assert.equal(chat,1);assert.equal(state.pose.x,560);
 state=a.update(.05,{teacher,playerSeated:true,rain:true});assert.equal(state.mode,'return');assert.equal(state.reading,false);
 for(let i=0;i<1000&&state.borrowed;i++)state=a.update(.05,{teacher,rain:true});assert.equal(state.mode,'idle');assert.deepEqual(teacher,{x:303,y:334,facing:'front'});
});
test('practice, dialog, reduced motion prevent unsolicited lounge visit; timers bounded',()=>{
 for(const flag of ['practice','dialog','reduced','rain','questApproach']){const a=createLounge({navigation});for(let i=0;i<1000;i++)assert.equal(a.update(.05,{teacher:{x:303,y:290},[flag]:true}).mode,'idle');}
 const a=createLounge({navigation});assert.equal(a.update(Infinity,{teacher:{x:303,y:290}}).mode,'idle');assert.equal(a.update(-10,{teacher:{x:303,y:290}}).mode,'idle');
});
test('explicit teacher approach and dialog freeze leisure; practice preempts and resumes original station',()=>{
 const a=createLounge({navigation}),teacher={x:400,y:334,facing:'left'};let s;
 for(let i=0;i<1000;i++){s=a.update(.05,{teacher});if(s.mode==='seated')break;}
 assert.equal(s.mode,'seated');const seated=s.pose;
 for(let i=0;i<50;i++)assert.deepEqual(a.update(.05,{teacher,questApproach:true}).pose,seated);
 for(let i=0;i<500;i++)assert.deepEqual(a.update(.05,{teacher,player:{x:560,y:267}}).pose,seated);
 for(let i=0;i<50;i++)assert.deepEqual(a.update(.05,{teacher,dialog:true}).pose,seated);
 s=a.update(.05,{teacher,practice:true});assert.equal(s.mode,'return');
 for(let i=0;i<1000&&s.borrowed;i++)s=a.update(.05,{teacher,practice:true});
 assert.equal(s.mode,'idle');for(let i=0;i<1000;i++)assert.equal(a.update(.05,{teacher,practice:true}).mode,'idle');
});
