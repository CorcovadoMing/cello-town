import test from 'node:test';import assert from 'node:assert/strict';import {pondLife,gardenLife} from '../ambience.js';
test('all fish and ripples stay inside clipped pond across long cycles',()=>{for(let t=0;t<180000;t+=137)for(const f of pondLife(t)){assert.ok(f.x>=76&&f.x<=204);assert.ok(f.y>=413&&f.y<=491);assert.ok(f.surface===null||(f.surface>=0&&f.surface<1));}});
test('only one friendly visitor and cat never reaches or catches it',()=>{for(let t=0;t<180000;t+=71){const {visitor:v,cat:c}=gardenLife(t);assert.ok(c.x>=769&&c.x<=869&&c.y>=474&&c.y<=535);if(v){assert.ok(['bird','bee','butterfly'].includes(v.kind));assert.ok(Math.hypot(c.x-v.x,c.y-v.y)>45);}}});
test('reduced motion is stable, no pounce/ripples; schedules bounded and deterministic',()=>{assert.deepEqual(pondLife(0,true),pondLife(999999,true));assert.deepEqual(gardenLife(0,true),gardenLife(999999,true));assert.equal(gardenLife(15000).cat.pounce,true);assert.equal(gardenLife(25000).visitor,null);assert.equal(gardenLife(32000).visitor.kind,'bird');assert.equal(gardenLife(62000).visitor.kind,'bee');});
import {townWeather} from '../ambience.js';
test('weather particles bounded, restrained and reduced-motion stable',()=>{for(const kind of ['sun','breeze','rain']){assert.deepEqual(townWeather(0,kind,true),townWeather(99999,kind,true));for(let t=0;t<100000;t+=961){const p=townWeather(t,kind);assert.ok(p.length<=42);for(const d of p){assert.ok(d.x>=0&&d.x<960);assert.ok(d.y>=0&&d.y<560);}}}assert.equal(townWeather(0,'sun').length,0);assert.equal(townWeather(0,'rain').length,42);assert.equal(townWeather(0,'breeze').length,7);});

import {fishVariants} from "../ambience.js";
test("fish appearance seeded once, independently varied and bounded",()=>{assert.deepEqual(fishVariants(91),fishVariants(91));assert.notDeepEqual(fishVariants(91),fishVariants(92));const fins=new Set(),colors=new Set();for(let seed=0;seed<200;seed++)for(const v of fishVariants(seed)){assert.ok(v.size>=.8&&v.size<=1.15&&v.length>=.78&&v.length<=1.28&&v.girth>=.72&&v.girth<=1.37);fins.add(v.fin);colors.add(v.color);}assert.equal(fins.size,3);assert.equal(colors.size,5);});

import {flightDirection} from '../ambience.js';
test('flight heading tracks both signs and holds through near-zero turn',()=>{for(let p=0;p<30;p+=.01)if(Math.abs(Math.cos(p))>=.1)assert.equal(flightDirection(p),Math.sign(Math.cos(p)));assert.equal(flightDirection(Math.PI/2+.03),1);assert.equal(flightDirection(3*Math.PI/2+.03),-1);});
test('cat visibly enters bed, chases then pounces and returns without contact',()=>{assert.equal(gardenLife(0).cat.phase,'idle');assert.equal(gardenLife(6000).cat.phase,'approach');assert.equal(gardenLife(10000).cat.phase,'chase');assert.ok(gardenLife(10000).cat.y<505);assert.equal(gardenLife(15000).cat.pounce,true);assert.equal(gardenLife(17000).cat.phase,'retreat');assert.equal(gardenLife(21000).cat.y,535);for(let t=0;t<90000;t+=10){const {cat,visitor}=gardenLife(t);assert.ok(Number.isFinite(cat.x+cat.y));if(visitor)assert.ok(Math.hypot(cat.x-visitor.x,cat.y-visitor.y)>45);}});

test('idle cat visibly prowls and blends continuously across every phase boundary',()=>{assert.notEqual(gardenLife(1000).cat.x,gardenLife(3000).cat.x);assert.notEqual(gardenLife(28000).cat.stride,0);for(const t of [4000,8000,14000,15500,19500,30000,34000,60000]){const a=gardenLife(t-.01).cat,b=gardenLife(t+.01).cat;assert.ok(Math.hypot(a.x-b.x,a.y-b.y)<.01);}assert.deepEqual(gardenLife(0,true),gardenLife(80000,true));assert.equal(gardenLife(80000,true).cat.stride,0);});

test('cat rests in distinct seated/lying poses and reaches a paw without contact',()=>{assert.equal(gardenLife(22000).cat.sit,1);assert.equal(gardenLife(25000).cat.lie,1);assert.equal(gardenLife(25000).cat.sit,0);assert.ok(gardenLife(14750).cat.paw>9);assert.equal(gardenLife(0,true).cat.paw,0);});

test('rain and drifting leaves share rightward wind',()=>{for(const kind of ['rain','breeze']){const a=townWeather(0,kind)[0],b=townWeather(100,kind)[0];assert.ok(b.x>a.x);}const a=townWeather(0,'rain')[0],b=townWeather(100,'rain')[0];assert.ok(b.y>a.y);});

import {foliageWind} from '../ambience.js';
test('wind affects selected plants with stagger, fixed roots and reduced motion',()=>{assert.equal(foliageWind(1000,1),0);assert.equal(foliageWind(1000,3,'rain',true),0);assert.notEqual(foliageWind(1000,3),foliageWind(1000,6));for(let t=0;t<300000;t+=113)for(const w of ['sun','breeze','rain']){const a=foliageWind(t,3,w);assert.ok(a>=0&&a<=1);assert.ok(Math.abs(a-foliageWind(t+1,3,w))<.001);}});

import {reactVisitor} from '../ambience.js';
test('visitor reacts causally to nearby cat and paw, not an absent/distant threat',()=>{const v={x:820,y:420},far={x:100,y:500,paw:0},near={x:810,y:490,paw:0};assert.equal(reactVisitor(v,far).y,v.y);assert.equal(reactVisitor(v,near,0).y,v.y);assert.ok(reactVisitor(v,near).y<v.y);assert.ok(reactVisitor(v,{...near,paw:10}).y<reactVisitor(v,near).y);});
test('reaction is continuous, finite, noncontact and search follows miss',()=>{for(let t=0;t<90000;t+=17){const a=gardenLife(t),b=gardenLife(t+.1);if(a.visitor&&b.visitor){assert.ok(Math.hypot(a.visitor.x-b.visitor.x,a.visitor.y-b.visitor.y)<.05);assert.ok(Math.hypot(a.visitor.x-a.cat.x,a.visitor.y-a.cat.y)>45);}}assert.equal(gardenLife(17000).cat.searching,true);assert.equal(gardenLife(21000).cat.searching,false);});

test('every fish group has distinct colors; load seed still varies assignment',()=>{for(let seed=0;seed<200;seed++)assert.equal(new Set(fishVariants(seed).map(f=>f.color)).size,3);});
test('cat aims with two hip wiggles then bursts, without changing idle',()=>{assert.ok(gardenLife(13750).cat.aim>.9);assert.equal(gardenLife(15000).cat.burst,1);assert.equal(gardenLife(25000).cat.burst,0);const signs=[13187.5,13562.5,13937.5,14312.5].map(t=>Math.sign(gardenLife(t).cat.wiggle));assert.deepEqual(signs,[1,-1,1,-1]);assert.equal(gardenLife(15000,true).cat.burst,0);});

test('pond sprites have different moving tails, colored bodies and symmetric direction',async()=>{
 const {drawPondFish}=await import('../ambience.js');
 const sprite=(fin,tail,dir=1)=>{
  const rows=[],g=new Proxy({},{get:(t,k)=> (...a)=>rows.push([k,...a]),set:(t,k,v)=>{rows.push([k,v]);return true;}});
  drawPondFish(g,{x:160,y:460,dir,tail},{size:.9,length:1.1,girth:.8,fin,color:'#e59958'});
  return rows;
 };
 const a=sprite('round',0),b=sprite('round',2),fork=sprite('fork',0),plain=sprite('none',0);
 assert.deepEqual(a[0],['save']);assert.deepEqual(a.at(-1),['restore']);
 assert.notDeepEqual(a,b);assert.notDeepEqual(a,fork);assert.notDeepEqual(a,plain);
 assert.ok(a.some(row=>row[0]==='fillStyle'&&row[1]==='#e59958'));
 assert.equal(sprite('fork',0,-1).find(row=>row[0]==='scale')[1],-fork.find(row=>row[0]==='scale')[1]);
});
