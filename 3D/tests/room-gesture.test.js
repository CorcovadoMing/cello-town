import test from 'node:test';
import assert from 'node:assert/strict';
import {isPullToRefresh,installPullToRefreshGuard} from '../state.js';
test('root downward pull is cancelled without blocking nested scroll, horizontal gesture, or pinch',()=>{
 const root={scrollTop:0},body={},doc={body,scrollingElement:root,handlers:{},addEventListener(k,fn){this.handlers[k]=fn}},win={visualViewport:{scale:1},getComputedStyle:e=>({overflowY:e.overflowY})};
 installPullToRefreshGuard(doc,win);
 const target={parentElement:body,nodeType:1,scrollTop:0,clientHeight:240,scrollHeight:460,overflowY:'auto'};
 function drag(dx,dy,n=1){doc.handlers.touchstart({target,touches:[{clientX:0,clientY:20}]});
  let blocked=false;doc.handlers.touchmove({cancelable:true,touches:Array.from({length:n},()=>({clientX:dx,clientY:20+dy})),preventDefault(){blocked=true}});doc.handlers.touchend();return blocked;}
 assert.equal(drag(0,40),true);assert.equal(drag(40,10),false);assert.equal(drag(0,-40),false);assert.equal(drag(0,40,2),false);
 target.scrollTop=60;assert.equal(drag(0,40),false);
 target.scrollTop=0;root.scrollTop=10;assert.equal(drag(0,40),false);
 root.scrollTop=0;win.visualViewport.scale=1.5;assert.equal(drag(0,40),false);
 assert.equal(isPullToRefresh({dx:0,dy:3,touches:1,atTop:true,nestedCanScroll:false}),false);
});
