import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as T from '../vendor/three.module.js';
test('integrated detailed cello is finite, bounded, and retains placement',()=>{
 const source=readFileSync(new URL('../app.js',import.meta.url),'utf8');
 const start=source.indexOf('// Cello resting in left corner.');
 const end=source.indexOf('// Plant and reading stool',start);
 const scene=new T.Scene();const cello=new Function('T','scene',source.slice(start,end)+'\nreturn cello;')(T,scene);
 assert.equal(cello.position.x,-2.27);assert.equal(cello.position.z,-1.4);assert.equal(cello.scale.x,.75);cello.updateMatrixWorld(true);assert.ok(Math.abs(new T.Box3().setFromObject(cello).min.y-.015)<1e-6);assert.equal(cello.rotation.z,-.12);
 assert.equal(cello.userData.strings,4);assert.equal(cello.userData.pegs,4);assert.equal(cello.userData.frontHoles,2);
 let triangles=0;cello.traverse(o=>{if(o.geometry){assert.ok(o.geometry.attributes.position.array.every(Number.isFinite));triangles+=o.geometry.attributes.position.count/3;}});
 assert.ok(triangles<7000);assert.ok(cello.children.length<=8);
});
test('hair cap preserves complete open-rim triangles after spherical remapping',()=>{const source=readFileSync(new URL('../app.js',import.meta.url),'utf8');const expr=source.slice(source.indexOf('const capTheta='),source.indexOf('for(let i=0;i<capPos.count;i++)',source.indexOf('const capTheta=')));const g=new Function('T',expr+'return capGeometry;')(T),idx=g.index.array;for(let x=0;x<32;x++){const a=20*33+x,b=a+1;let covered=false;for(let i=0;i<idx.length;i+=3){const t=[idx[i],idx[i+1],idx[i+2]];if(t.includes(a)&&t.includes(b)){covered=true;break;}}assert.ok(covered,`missing rim edge ${x}`);}});

test('spruce and maple have distinct bounded pigment without changing the instrument parts',()=>{
 const source=readFileSync(new URL('../app.js',import.meta.url),'utf8');
 const start=source.indexOf('// Cello resting in left corner.'),end=source.indexOf('// Plant and reading stool',start);
 const cello=new Function('T','scene',source.slice(start,end)+'\nreturn cello;')(T,new T.Scene());
 assert.equal(cello.children.length,8);
 const wood=cello.children.filter(o=>o.material.vertexColors);
 assert.equal(wood.length,2);
 for(const o of wood){
  const c=o.geometry.attributes.color;assert.equal(c.count,o.geometry.attributes.position.count);
  assert.ok(c.array.every(n=>Number.isFinite(n)&&n>.66&&n<1.25));
  assert.ok(new Set(c.array).size>60);
 }
 const performance=source.slice(source.indexOf('function performanceParts()'),source.indexOf('const PERFORMANCE_YAW'));
 assert.match(performance,/hasAttribute\('color'\)/);
 assert.match(performance,/for\(const key of attributes\)g\.setAttribute/);
});
