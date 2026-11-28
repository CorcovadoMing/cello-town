import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {groundContactSeeds} from '../town-shore.js';
test('pondside contact shades stay anchored under objects and preserve a translucent feather',()=>{
 const seeds=groundContactSeeds([[65,250,1.8],[340,476,1.2]],{x:580,depth:239});
 assert.ok(seeds.some(([x,z,...rest])=>x===65&&z===250+46*1.8&&rest[2]>.3));
 assert.ok(seeds.some(([x,z])=>x===250&&z===462)); // partly over submerged bank supports
 assert.ok(seeds.every(([x,z,rx,rz,a])=>x>0&&x<960&&z>0&&z<560&&rx>0&&rz>0&&a>=.15&&a<.5));
 const s=readFileSync(new URL('../town-shore.js',import.meta.url),'utf8');
 assert.match(s,/\[2\.4,1\.72,alpha\*\.42\].*\[0,\.78,alpha\]/);
 assert.match(s,/hills\.visible=close;contact\.material\.opacity=weather==='sun'/);
 assert.match(s,/depthWrite:false/);
});
