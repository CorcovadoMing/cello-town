import test from 'node:test';import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {GARDEN_SOIL,GARDEN_ROWS,ROW_SECTION,rowPoint} from '../town-bed.js';
import {townPlantPosition} from '../garden.js';
const inside=(x,z)=>GARDEN_SOIL.reduce((hit,[a,b],i)=>{
 const [c,d]=GARDEN_SOIL[(i+1)%GARDEN_SOIL.length];
 return (b>z)!==(d>z)&&x<a+(c-a)*(z-b)/(d-b)?!hit:hit;
},false);
test('one shared irrigated bed contains two continuous rows and all original earned slots',()=>{
 assert.deepEqual(Array.from({length:6},(_,i)=>townPlantPosition(i)),[{x:767,y:482},{x:777,y:440},{x:827,y:440},{x:817,y:482},{x:867,y:482},{x:877,y:440}]);
 for(let i=0;i<6;i++){const p=townPlantPosition(i);assert.ok(inside(p.x,p.y));assert.ok(GARDEN_ROWS.some(r=>r.center===p.y&&r.start<p.x&&r.end>p.x));}
 assert.equal(GARDEN_ROWS.length,2);
 for(const row of GARDEN_ROWS)for(let i=0;i<=20;i++)for(const [off,lift] of ROW_SECTION){
  const [x,y,z]=rowPoint(row,i/20,off,lift);
  assert.ok(inside(x,z));assert.ok(y>=1.21&&y<1.64);
 }
});
test('GPU soil, 2D fallback soil and weather share the same garden plan',()=>{
 for(const n of ['town-webgl.js','terrain-art.js']){
  const s=readFileSync(new URL('../'+n,import.meta.url),'utf8');
  assert.match(s,/GARDEN_SOIL,GARDEN_ROWS/);assert.match(s,/from '.\/town-bed.js\?v=1'/);
 }
 const s=readFileSync(new URL('../town-webgl.js',import.meta.url),'utf8');
 assert.match(s,/GARDEN_ROWS[\s\S]+soilIndices\.push/);
 assert.doesNotMatch(s,/Planting pockets are at the original positions|20\.1\+\(i%3\)/);
});
