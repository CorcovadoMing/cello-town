import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
const app=readFileSync(new URL('../app.js',import.meta.url),'utf8');
test('room finishes are bounded deterministic local swatches with explicit software fallback',()=>{
 const code=app.slice(app.indexOf('const roomTextures='),app.indexOf('// Open, sunny miniature set.'));
 assert.ok(code.includes('c.width=c.height=128'));assert.ok(code.includes("typeof document==='undefined'"));
 assert.ok(code.includes("typeof software!=='undefined'&&software"));assert.ok(code.includes('roomTextureScales.get(scaleKey)'));
 assert.ok(code.includes('roomMaterials.get(materialKey)'));assert.ok(!code.includes('Math.random'));
 assert.ok(!code.includes('fetch('));assert.ok(!code.includes('filter='));
});
test('static floor and rug detail are batched; room interaction and established geometry remain',()=>{
 assert.ok(app.includes("batchRoomDetails(floorDetails,'handcrafted-oak-boards')"));assert.ok(app.includes("batchRoomDetails(stitches,'rug-hand-stitching')"));
 assert.ok(app.includes("scene.children.slice(wardrobeStart).forEach(o=>{o.userData.station='wardrobe'"));
 assert.ok(app.includes("vanity.traverse(o=>{o.userData.station='vanity'"));
 assert.ok(app.includes("mirrorBase.name='mirror-tabletop-base'"));
 assert.ok(app.includes("rearWall.name='rear-wall-grounded'"));
});
