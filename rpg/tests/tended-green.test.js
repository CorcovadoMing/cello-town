import test from 'node:test';
import assert from 'node:assert/strict';
import {GRASS_PATCHES} from '../town-breeze.js';
import {readFileSync} from 'node:fs';
test('turf growth is gathered at landmarks and leaves the center green quiet',()=>{
 assert.ok(GRASS_PATCHES.length<=10);
 assert.ok(GRASS_PATCHES.every(([x,z,rx,rz,n])=>n<=20&&!(x+rx>375&&x-rx<698&&z+rz>375)));
 assert.ok(GRASS_PATCHES.every(([x,z,rx,rz,n])=>rx*rz>80&&n>=10&&z-rz>198));
});
test('compact flower beds keep roads and the separately cultivated garden clear',()=>{
 const src=readFileSync(new URL('../town-webgl.js',import.meta.url),'utf8');
 assert.match(src,/const beds=\[/);
 assert.match(src,/if\(pathAt\(a,b\)\|\|insidePolygon\(a,b,GARDEN_SOIL\)\)continue/);
 assert.doesNotMatch(src,/box\(x,1\.1,z,w,\.65/);
});
