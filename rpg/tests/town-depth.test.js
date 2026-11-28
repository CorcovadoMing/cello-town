import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

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


import {benchCatLift,TOWN_PAINT_PALETTE} from '../town-webgl.js';
test('bench cat stays seated during stretch and follows its real support through a hop',()=>{
 const s=benchCatLift({mode:'home',y:211});
 const g=benchCatLift({mode:'return',y:247});
 assert.ok(s>31.5&&s<34);
 assert.ok(g>1&&g<2);
 assert.equal(benchCatLift({mode:'stretch',y:211}),s);
 for(const mode of ['jumpUp','jumpDown']){
  assert.equal(benchCatLift({mode,y:211,jump:0}),s);
  assert.equal(benchCatLift({mode,y:247,jump:0}),g);
  const overFrontSlat=benchCatLift({mode,y:223,jump:14*Math.sin(Math.PI/3)});
  assert.ok(overFrontSlat>31.5);
  let last=null;
  for(let i=0;i<=100;i++){
   const u=i/100,y=211+36*u,h=benchCatLift({mode,y,jump:14*Math.sin(Math.PI*u)});
   assert.ok(h>=g-1e-9,'must not penetrate even near the landing');
   if(last!==null)assert.ok(Math.abs(last-h)<.9,'no height snap');
   last=h;
  }
 }
 const app=readFileSync(new URL('../app.js',import.meta.url),'utf8');
 assert.equal((app.match(/sprite\('bench-cat'/g)||[]).length,1);
 assert.match(app,/sprite\('bench-cat',active\?b.x:222,active\?b.y\+6:220,66,53/);
 assert.match(app,/drawRainBenchCat\(g,\{\.\.\.b,jump:0\}\)/);
});

test('ground uses the formal palette as paint on geometry, not a veil over actors or rain',()=>{
 assert.equal(TOWN_PAINT_PALETTE.meadow[0],'#a3b783');
 assert.equal(TOWN_PAINT_PALETTE.soil[0],'#d0c298');
 assert.equal(TOWN_PAINT_PALETTE.pond[0],'#81b1a5');
 const renderer=readFileSync(new URL('../town-webgl.js',import.meta.url),'utf8');
 assert.match(renderer,/paintTerrainUV\(T,geo,w,d\)/);
 assert.match(renderer,/map:soilPigment/);
 assert.match(renderer,/updateWetLayers\(moisture\);\s*renderer.render/);
 const light=renderer.match(/sun\.intensity=weather==='sun'\?(\d[.\d]+):weather==='breeze'\?(\d[.\d]+):([.\d]+);/);
 assert.ok(light&&Number(light[1])>Number(light[2])&&Number(light[2])>Number(light[3]),'sun and rain retain distinct contrast');
 assert.match(renderer,/'#ffe5bf':'#ffecc9'/);
});
