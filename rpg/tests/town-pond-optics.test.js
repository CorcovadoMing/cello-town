import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const s=readFileSync(new URL('../town-webgl.js',import.meta.url),'utf8');
test('fish are resolved in the water pass at a depth with angular and color attenuation',()=>{
 assert.match(s,/refract\(-eye,N,1\.\/1\.333\)/);
 assert.match(s,/dist=f\.z\/max\(\.14,-rq\.y\)/);
 assert.match(s,/fishAlpha\*transmission\*exp\(-dist/);
 assert.match(s,/detail\.value=close\?1:0/);
 assert.doesNotMatch(s,/pondFish|const fishGeometry/);
});
test('near-water glints use the existing shadow map and reduced motion stops fish movement',()=>{
 assert.match(s,/sunlit=getShadowMask\(\)/);
 assert.match(s,/sunlit\*sunlit\*pow\(townWaterBrightness/);
 assert.match(s,/time\.value=motion\?clock\/1000:0/);
 assert.match(s,/pondSwimmer\(i,time.value,u\)/);
 assert.doesNotMatch(s,/sunLane/);
});
test('near-shore mud and actual refracted bed texture are clearer than deep water',()=>{
 assert.match(s,/depth=mix\(5\.6,20\.0,smoothstep/);
 assert.match(s,/texture2D\(map,bedUV\)/);
 assert.match(s,/clearWeight\*\(\.42\+\.52\*shallow\)/);
});
test('glints are compact, irregular point pulses rather than long wave blades',()=>{
 assert.match(s,/length\(delta\)/);
 assert.match(s,/waveFront=sin\(townWaterTime\*2\.3-uvPond\.y\*19/);
 assert.match(s,/crest\*nearLight\*bankLight/);
 assert.doesNotMatch(s,/townWaterTime\*\(1\.9\+4\.\*b\)/);
 assert.match(s,/pow\(townWaterBrightness,3\.\)/);
});

test('wind crosses irregular local waves while refractive floor remains visible',()=>{
 assert.match(s,/drift=along-townWaterTime\*10\.8/);
 assert.match(s,/ripplet=\(\.45\*primary\+\.36\*oblique\+\.19\*riffle\)\*packet/);
 assert.match(s,/\.019\*ripplet/);
 assert.doesNotMatch(s,/windWave\*gust/);
});
