import test from 'node:test';
import assert from 'node:assert/strict';
import {createTownDepth} from '../town-depth.js';

test('town depth uses bounded transparent atlases, only rebakes on weather change, preserves world origin',()=>{
 const cleared=[],canvases=[],layerCalls=[];
 const noop=()=>{};
 const gradient={addColorStop:noop};
 const makeCanvas=()=>{
  const ctx={clearRect:(...r)=>cleared.push(r),save:noop,restore:noop,translate:noop,rotate:noop,scale:noop,createRadialGradient:()=>gradient,createLinearGradient:()=>gradient,fillRect:noop,beginPath:noop,moveTo:noop,lineTo:noop,closePath:noop,fill:noop,rect:noop,clip:noop};
  const canvas={getContext:()=>ctx};canvases.push(canvas);return canvas;
 };
 const layers=createTownDepth(makeCanvas,[[580,225,1.8]],{x:580,w:196,depth:239});
 const world={drawImage:(...args)=>layerCalls.push(args)};
 let facade=0;const paint=()=>facade++;
 for(const weather of ['sun','sun','breeze','breeze','rain','rain','sun']){
  layers.drawGround(world,weather);
  layers.drawRoom(world,weather,paint);
 }
 assert.deepEqual(canvases.map(({width,height})=>[width,height]),[[960,560],[245,209]]);
 assert.equal(cleared.filter(r=>r[2]===960).length,4);
 assert.equal(facade,3);
 assert.equal(layerCalls.length,14);
 assert.deepEqual(layerCalls[0],[canvases[0],0,0]);
 assert.deepEqual(layerCalls[1],[canvases[1],555,35]);
});
