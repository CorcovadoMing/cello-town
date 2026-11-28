import test from 'node:test';
import assert from 'node:assert/strict';
import {groundedShakePixels,sampleGroundedShake,dogPosePixels,drawGardenCat,drawRainBenchCat,drawRainDog} from '../ambience.js';

const footprints=(pixels,h)=>[...pixels].filter(([xy,k])=>k==='L'&&Number(xy.split(',')[1])>=h-2).map(([xy])=>xy);
test('pets gather their feet before shaking and the motion travels head to tail',()=>{
 const rise=sampleGroundedShake(.12),early=sampleGroundedShake(.28),middle=sampleGroundedShake(.5),settle=sampleGroundedShake(.93);
 assert.ok(rise.stand>.4&&rise.stand<.6);
 assert.equal(rise.head,0);assert.equal(rise.spray,0);
 assert.equal(early.stand,1);assert.notEqual(early.head,0);
 assert.equal(early.body,0);assert.equal(early.tail,0);
 assert.equal(middle.stand,1);assert.ok(middle.spray>.9);
 assert.equal(settle.head,0);assert.ok(settle.stand>0&&settle.stand<1);
 assert.equal(sampleGroundedShake(1).stand,0);
});
test('all four paw anchors hold world position during the animated rotation',()=>{
 const dog=dogPosePixels('left'),cat={h:19,pixels:new Map([['24,4','E'],['15,8','O'],['2,8','O']])};
 for(const [kind,{pixels,h}] of [['cat',cat],['dog',dog]]){
  const base=groundedShakePixels(pixels,{h,pose:sampleGroundedShake(0),kind});
  assert.equal(footprints(base,h).length,8);
  for(let i=1;i<=100;i++){
   const current=groundedShakePixels(pixels,{h,pose:sampleGroundedShake(i/100),kind});
   assert.deepEqual(footprints(current,h),footprints(base,h));
  }
  assert.notDeepEqual([...base],[...groundedShakePixels(pixels,{h,pose:sampleGroundedShake(.45),kind})]);
 }
});
test('sprite ground/contact shadow does not slide on either renderer',()=>{
 for(const render of [drawGardenCat,drawRainBenchCat,drawRainDog]){
  const run=u=>{
   const moves=[];
   const ctx=new Proxy({translate:(...xy)=>moves.push(xy)}, {get:(o,k)=>Reflect.get(o,k)??(()=>{})});
   render(ctx,{x:30,y:40,groundY:40,facing:'right',rainAlert:true,sit:1,wetShake:sampleGroundedShake(u)});
   return moves[0];
  };
  assert.deepEqual(run(.45),run(.55));assert.deepEqual(run(.45),[30,40]);
 }
});
