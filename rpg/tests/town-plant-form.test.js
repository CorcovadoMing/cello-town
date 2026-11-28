import test from 'node:test';import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {softBlade} from '../town-plant-form.js';
test('grass grows from a broad base into a curved blade with a short rounded tip',()=>{
 const p=softBlade(0,0,0,5,1,2,1.6);
 const vertices=p.flat();const end=vertices.filter(v=>v.t===1),last=vertices.filter(v=>v.t===.96);
 assert.equal(p.length,7);
 assert.equal(end.length,1);assert.ok(Math.abs(end[0].v[0]-2)<1e-9);
 assert.ok(last.some(q=>q.v[2]>0.20)&&last.some(q=>q.v[2]<-0.20));
 assert.ok(vertices.filter(q=>q.t===.36).every(q=>q.v[0]<.4&&Math.abs(q.v[2])===1));
 assert.ok(vertices.every(q=>q.v.every(Number.isFinite)));
});
test('wind grass and ornamental tuft share the new blade, and orchard shades leave real leaf silhouettes',()=>{
 for(const n of ['town-breeze.js','town-verge.js'])assert.match(readFileSync(new URL('../'+n,import.meta.url),'utf8'),/softBlade/);
 const orchard=readFileSync(new URL('../town-orchard.js',import.meta.url),'utf8');
 assert.match(orchard,/alphaToCoverage:true/);
 assert.match(orchard,/needle\?\.31:\.45/);
});
