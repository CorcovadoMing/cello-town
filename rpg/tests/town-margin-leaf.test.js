import test from 'node:test';
import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
import {marginLeaf} from '../town-countryside.js';

test('fence-side blade bends, keeps a broad crown, and stays grounded',()=>{
 const triangles=marginLeaf(4,7,4,.65,1.3,-.6);
 const vertices=triangles.flat().map(([point,t])=>({point,t}));
 assert.equal(triangles.length,5);
 assert.ok(vertices.filter(({t})=>!t).every(({point})=>point[1]===1.54));
 const high=vertices.filter(({t})=>t===.90).map(({point})=>point);
 assert.ok(Math.max(...high.map(p=>p[2]))-Math.min(...high.map(p=>p[2]))>.4);
 assert.deepEqual(vertices.find(({t})=>t===1).point,[5.3,5.54,6.4]);
 assert.ok(vertices.every(({point})=>point.every(Number.isFinite)));
});

test('cottage porch uses the existing shadow caster rather than a second fixed footprint',()=>{
 const s=readFileSync(new URL('../town-webgl.js',import.meta.url),'utf8');
 const house=s.split('markingHouse=true;')[1].split('// Rural story')[0];
 assert.match(house,/box\(cx,3,fr\+dy/);
 assert.doesNotMatch(house,/\bplane\(/);
 assert.match(s,/sun\.castShadow\s*=\s*true/);
});
