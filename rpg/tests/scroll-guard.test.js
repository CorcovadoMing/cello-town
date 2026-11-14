import test from 'node:test';
import assert from 'node:assert/strict';
import {isPullToRefresh} from '../scroll-guard.js';
const down={dx:2,dy:17,touches:1,atTop:true,nestedCanScroll:false};
test('only downward top-boundary pulls are blocked',()=>{
  assert.equal(isPullToRefresh(down),true);
  for(const change of [{dx:30},{dy:-18},{dy:4},{atTop:false},{nestedCanScroll:true},{touches:2},{zoomed:true}]){
    assert.equal(isPullToRefresh({...down,...change}),false);
  }
});

test('touch handler preserves normal, nested and multi-touch scrolling',async()=>{
  const {installPullToRefreshGuard}=await import('../scroll-guard.js');
  const handlers={},root={scrollTop:0},body={};
  const nested={nodeType:1,scrollTop:20,scrollHeight:200,clientHeight:80,parentElement:body};
  const child={nodeType:1,scrollTop:0,parentElement:nested};
  const doc={body,scrollingElement:root,addEventListener(name,fn,options){handlers[name]={fn,options};}};
  installPullToRefreshGuard(doc,{getComputedStyle:()=>({overflowY:'auto'}),visualViewport:{scale:1}});
  assert.equal(handlers.touchmove.options.passive,false);
  let prevented=0;
  const start=(target=body)=>handlers.touchstart.fn({target,touches:[{clientX:0,clientY:20}]});
  const move=(x,y)=>handlers.touchmove.fn({touches:[{clientX:x,clientY:y}],cancelable:true,preventDefault(){prevented++;}});
  start();move(0,45);assert.equal(prevented,1);
  start();move(1,0);assert.equal(prevented,1);
  root.scrollTop=80;start();move(0,40);assert.equal(prevented,1);
  root.scrollTop=0;start(child);move(0,40);assert.equal(prevented,1);
  handlers.touchend.fn();move(0,60);assert.equal(prevented,1);
});
