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

// Exercise the exact vertex emitter without a driver or actual game data.
import {makeVerge} from '../town-verge.js';
test('path-lip leaves stay low, deterministically clipped, with exactly one noninteractive batch',()=>{
 class Geometry{
  attributes={};
  setAttribute(name,buffer){this.attributes[name]=buffer;}
  computeVertexNormals(){}
 }
 class Attr{constructor(array){this.array=array;}}
 class Material{constructor(options){this.options=options;}}
 const T={BufferGeometry:Geometry,Float32BufferAttribute:Attr,MeshStandardMaterial:Material,
  Mesh:class{constructor(g,m){this.geometry=g;this.material=m;}},
  Color:class{r=.5;g=.6;b=.4;}};
 const make=()=>{
  const objects=[],verge=makeVerge(T,{add:m=>objects.push(m)},960,560);
  verge.trailFan(60,20,Math.PI/2,1.2,12,(_x,z)=>z>=21);
  const m=verge.finish();
  assert.deepEqual(objects,[m]);
  assert.equal(m.receiveShadow,true);
  const v=m.geometry.attributes.position.array;
  assert.ok(v.length>0 && v.length<162);
  for(let i=0;i<v.length;i+=3){
   assert.ok(v[i+2]+280>=21);
   assert.ok(v[i+1]>=1.53&&v[i+1]<3.4);
  }
  return v;
 };
 assert.deepEqual(make(),make());
});
