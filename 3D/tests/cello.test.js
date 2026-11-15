import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as T from '../vendor/three.module.js';
test('integrated detailed cello is finite, bounded, and retains placement',()=>{
 const source=readFileSync(new URL('../app.js',import.meta.url),'utf8');
 const start=source.indexOf('// Cello resting in left corner.');
 const end=source.indexOf('// Plant and reading stool',start);
 const scene=new T.Scene();const cello=new Function('T','scene',source.slice(start,end)+'\nreturn cello;')(T,scene);
 assert.deepEqual(cello.position.toArray(),[-2.27,.2,-1.4]);assert.equal(cello.rotation.z,-.12);
 assert.equal(cello.userData.strings,4);assert.equal(cello.userData.pegs,4);assert.equal(cello.userData.frontHoles,2);
 let triangles=0;cello.traverse(o=>{if(o.geometry){assert.ok(o.geometry.attributes.position.array.every(Number.isFinite));triangles+=o.geometry.attributes.position.count/3;}});
 assert.ok(triangles<7000);assert.ok(cello.children.length<=8);
});
test('hair cap preserves complete open-rim triangles after spherical remapping',()=>{const source=readFileSync(new URL('../app.js',import.meta.url),'utf8');const expr=source.slice(source.indexOf('const capTheta='),source.indexOf('const capPos='));const g=new Function('T',expr+'return capGeometry;')(T),idx=g.index.array;for(let x=0;x<40;x++){const a=24*41+x,b=a+1;let covered=false;for(let i=0;i<idx.length;i+=3){const t=[idx[i],idx[i+1],idx[i+2]];if(t.includes(a)&&t.includes(b)){covered=true;break;}}assert.ok(covered,`missing rim edge ${x}`);}});
