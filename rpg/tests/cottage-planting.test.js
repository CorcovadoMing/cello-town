import test from 'node:test';
import assert from 'node:assert/strict';
import {LAWN_DRIFTS,lawnAnchor} from '../town-breeze.js';
import {readFileSync} from 'node:fs';
test('feathered lawn motifs use stable, wide bands instead of random isolated tufts',()=>{
 let n=0;
 for(const [x,z,w,d,rot,count] of LAWN_DRIFTS){
  n+=count;
  assert.ok(w/d>=2);
  for(let i=0;i<count;i++){
   const p=lawnAnchor(x,z,w,d,rot,i,count);
   assert.deepEqual(p,lawnAnchor(x,z,w,d,rot,i,count));
   assert.ok(p[0]>0&&p[0]<960&&p[1]>0&&p[1]<560);
  }
 }
 assert.ok(n>550&&n<750);
});
test('around the cottage keep entry, house floor and flowerbed free from grass',()=>{
 const s=readFileSync(new URL('../town-webgl.js',import.meta.url),'utf8');
 assert.match(s,/const clearTurf=\(x,z\)=>!pathAt\(x,z\)&&!insidePolygon\(x,z,GARDEN_SOIL\)/);
 assert.match(s,/makeLivingGrass\(T,scene,W,H,clearTurf\)/);
 assert.match(s,/if\(pathAt\(xx,zz\)\|\|Math\.abs\(xx-cx\)<56\)continue;/);
 assert.doesNotMatch(s,/\[\[581,217,14\],\[590,212,16\]/);
});
