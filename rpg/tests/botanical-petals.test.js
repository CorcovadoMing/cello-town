import test from 'node:test';
import assert from 'node:assert/strict';
import {makeVerge} from '../town-verge.js';

class Geometry {
 attributes={};
 setAttribute(name,value){this.attributes[name]=value;}
 computeVertexNormals(){}
}
class Attribute { constructor(values,size){this.array=values;this.itemSize=size;} }
const T={BufferGeometry:Geometry,Float32BufferAttribute:Attribute,
 Color:class {r=1;g=.8;b=.7;},MeshStandardMaterial:class {},
 Mesh:class {constructor(g){this.geometry=g;}}};
function run(seeds){
 const objects=[],verge=makeVerge(T,{add:o=>objects.push(o)},80,80);
 for(const seed of seeds)verge.flower(40,4,40,'#ffdbaa',seed,.85);
 verge.finish();
 return objects;
}
test('flower silhouettes are finite and non-degenerate, with rounded petals and a raised pollen ring',()=>{
 for(const seed of [30,31,32]){
  const [bloom]=run([seed]),pos=bloom.geometry.attributes.position.array;
  const n=seed%3===1?8:5;
  assert.ok(pos.length>=n*12*9);
  for(let i=0;i<n*12*9;i+=9){
   const [a,b,c,d,e,f,g,h,j]=pos.slice(i,i+9);
   assert.ok(pos.slice(i,i+9).every(Number.isFinite));
   const u=[d-a,e-b,f-c],v=[g-a,h-b,j-c];
   assert.ok(Math.hypot(u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0])>1e-6);
  }
  const center=pos.slice(9*9,10*9);
  assert.ok(center[1]>4);
  assert.ok(bloom.receiveShadow);
 }
});
test('different flower forms retain a shared deterministic renderer batch',()=>{
 const a=run([30,31,32]),b=run([30,31,32]);
 assert.equal(a.length,1);
 assert.deepEqual(a[0].geometry.attributes.position.array,b[0].geometry.attributes.position.array);
 assert.notEqual(run([30])[0].geometry.attributes.position.array.length,run([31])[0].geometry.attributes.position.array.length);
});
