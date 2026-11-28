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

test('wardrobe veneer is restricted to the two recessed fronts, with the oiled frame retained',()=>{
 const branch=app.slice(app.indexOf("else if(kind==='wardrobe-veneer')"),app.indexOf("else if(kind==='rug-medallion')"));
 assert.match(branch,/bezierCurveTo/);
 assert.match(branch,/channel\(6,4,116,120/);
 const installation=app.slice(app.indexOf('for(const part of scene.children.filter(o=>o.userData.station'),app.indexOf('const vanityTop='));
 assert.match(installation,/height===1\.39&&width===\.36\)roomFinish\(part,'wardrobe-veneer',1,1\)/);
 assert.match(installation,/else if\(height>1\.35&&width>\.3\)roomFinish\(part,'joinery-oil'/);
 assert.doesNotMatch(installation,/\.position\.|\.rotation\.|new T\./);
});

test('both floor plants retain their original placement and batch budget with shaped, UV-mapped leaves',async()=>{
 const T=await import('../vendor/three.module.js');
 const {installRoomMaterialArt}=await import('../room-polish.js');
 const scene=new T.Scene(),plants=[new T.Group(),new T.Group()];
 plants[0].position.set(2.5,0,.65);plants[1].position.set(-2.6,0,1.3);
 scene.add(...plants);const before=plants.map(p=>p.position.toArray());
 installRoomMaterialArt(T,scene,{plants});
 for(const [i,plot] of plants.entries()){
  assert.deepEqual(plot.position.toArray(),before[i]);
  const typed=plot.children[0].children.filter(o=>o.name.startsWith('curved-leaf-cluster-'));
  assert.equal(typed.length,3);
  assert.equal(typed.reduce((n,o)=>n+o.geometry.index.count/3,0),(i?11:13)*64);
  for(const o of typed){
   const {position,uv,normal}=o.geometry.attributes;
   assert.equal(position.count,uv.count);assert.ok(position.array.every(Number.isFinite));assert.ok(normal.array.every(Number.isFinite));
   assert.ok(uv.array.every(v=>v>=0&&v<=1));
  }
 }
});
