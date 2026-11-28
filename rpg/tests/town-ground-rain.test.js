import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {rainCoverage,BASINS} from '../town-ground-rain.js';
const webgl=readFileSync(new URL('../town-webgl.js',import.meta.url),'utf8');
test('wet road uses the same irregular outline as the dry path, and leaves garden independent',()=>{
 assert.match(webgl,/pathLoop\.forEach/);
 assert.match(webgl,/makeGroundRain\(T,scene,W,H,pathLoop,GARDEN_SOIL/);
 assert.match(webgl,/kind==='bed'\?GARDEN_SOIL:pathLoop/);
});
test('damp ground fills gradually and only persistent rain forms a few distinct puddles',()=>{
 let wet=0;
 for(let i=0;i<4*60;i++)wet=rainCoverage(wet,1/60,'rain');
 assert.ok(wet>0.25&&wet<Math.min(...BASINS.map(x=>x[4])));
 for(let i=0;i<12*60;i++)wet=rainCoverage(wet,1/60,'rain');
 assert.ok(wet>Math.max(...BASINS.map(x=>x[4]))&&wet<1);
 assert.ok(rainCoverage(wet,1,'sun')<wet);
 assert.equal(rainCoverage(wet,-1,'sun'),wet);
 assert.equal(new Set(BASINS.map(([x,z])=>x+','+z)).size,BASINS.length);
});
test('plant detail has individual petals and folded shade plus path placement checks',()=>{
 const art=readFileSync(new URL('../town-verge.js',import.meta.url),'utf8');
 assert.match(art,/petalCount/);assert.match(art,/color.push/);
 assert.match(webgl,/if\(pathAt\(a,b\)\|\|insidePolygon\(a,b,GARDEN_SOIL\)\)continue/);assert.match(webgl,/verge.finish\(\)/);
});
