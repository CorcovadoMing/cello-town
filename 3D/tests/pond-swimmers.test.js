import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {pondSwimmer} from '../../rpg/town-webgl.js';
test('three submerged fish stay within clear water and turn along their true movement',()=>{
 const routes=[];
 for(let i=0;i<3;i++){
  const samples=[];
  for(let t=0;t<180;t+=.17){
   const here=pondSwimmer(i,t),before=pondSwimmer(i,t-.001),after=pondSwimmer(i,t+.001);
   const [x,z,depth,heading]=here;
   assert.ok(x>44&&x<231&&z>414&&z<516);assert.ok(depth>3.6&&depth<13);
   const dx=after[0]-before[0],dy=before[1]-after[1];
   assert.ok((Math.cos(heading)*dx+Math.sin(heading)*dy)/Math.hypot(dx,dy)>.9999);
   samples.push(here);
  }
  routes.push(samples);
 }
 assert.notDeepEqual(routes[0],routes[1]);assert.notDeepEqual(routes[1],routes[2]);
 const out={set(...values){this.values=values;}};
 pondSwimmer(2,16,out);assert.deepEqual(out.values,pondSwimmer(2,16));
});
test('fish remain in the existing ray depth not screen overlays',()=>{
 const source=readFileSync(new URL('../../rpg/town-webgl.js',import.meta.url),'utf8');
 assert.match(source,/vec2 hit=\(uvPond-f.xy\)\*townWaterSpan\+vec2\(rq.x,-rq.z\)\*dist/);
 assert.match(source,/if\(dot\(hit,hit\)>705\.\)continue/);
 assert.match(source,/fishAlpha\*transmission\*exp\(-dist\*\.018\)/);
});
