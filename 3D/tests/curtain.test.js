import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import vm from 'node:vm';import * as T from '../vendor/three.module.js';
const app=readFileSync(new URL('../app.js',import.meta.url),'utf8');
function build(){const c={T};vm.createContext(c);vm.runInContext('const scene=new T.Scene();'+app.slice(app.indexOf('const mats=new Map()'),app.indexOf('// Open, sunny miniature set.'))+'const windowGroup=new T.Group(),WINDOW_APERTURE={half:.76,spring:.93,outerHalf:.87,sill:.025};'+app.slice(app.indexOf('const curtainTop='),app.indexOf('// SVG has no depth buffer:'))+';var result=curtains;',c);return c.result;}
test('curtain relief is thick finite bounded geometry with no cast or received shadows',()=>{const group=build();let triangles=0,folds=0;group.traverse(o=>{if(!o.isMesh)return;assert.equal(o.castShadow,false);assert.equal(o.receiveShadow,false);triangles+=(o.geometry.index?.count??o.geometry.attributes.position.count)/3;for(const v of o.geometry.attributes.position.array)assert.ok(Number.isFinite(v));if(o.name.startsWith('curtain-sculpted-fold')){folds++;o.geometry.computeBoundingBox();assert.ok(o.geometry.boundingBox.max.z-o.geometry.boundingBox.min.z>.09);assert.ok(Math.min(Math.abs(o.geometry.boundingBox.min.x),Math.abs(o.geometry.boundingBox.max.x))>.56);const p=o.geometry.attributes.position,n=o.geometry.attributes.normal;assert.ok(n.getX(8*5)>0,'outer fold normals face outward, not culled inward');}});assert.equal(folds,8);assert.ok(triangles<7000);assert.equal(group.children.length,17);});
test('sculpture uses existing material cache and leaves aperture, lights, animation and fallback outside builder',()=>{const s=app.slice(app.indexOf('const curtainTop='),app.indexOf('// SVG has no depth buffer:'));assert.ok(!s.includes('new T.MeshStandardMaterial'));assert.ok(!s.includes('Texture'));assert.ok(!s.includes('requestAnimationFrame'));assert.ok(s.includes("tie.name='curtain-tieback'"));assert.ok(app.includes("if(typeof software!=='undefined'&&software)windowGroup.traverse"));});

test('gathered cloth meets the outer rim at tie height while leaving the central glass clear',()=>{const group=build();for(const side of[-1,1]){const cloth=group.getObjectByName('curtain-pulled-back-'+side),p=cloth.geometry.attributes.position;let edge=Infinity;for(let i=0;i<p.count;i++)if(Math.abs(p.getY(i)-.67)<.025)edge=Math.min(edge,Math.abs(p.getX(i)));assert.ok(edge>.80&&edge<.88,`tie edge ${edge} meets .87 outer rim without crossing .76 glass`);}});

test('cloth warp spans left and right symmetrically, keeping the hems below window glass',()=>{
 const group=build();
 for(const side of [-1,1]){
  const cloth=group.getObjectByName('curtain-pulled-back-'+side);
  const uv=cloth.geometry.attributes.uv,p=cloth.geometry.attributes.position;
  assert.equal(uv.count,p.count);
  for(let i=0;i<uv.count;i++)assert.ok(uv.getX(i)>.05&&uv.getX(i)<.95&&uv.getY(i)>.02&&uv.getY(i)<.98);
  const bottom=Array.from({length:p.count},(_,i)=>i).filter(i=>p.getY(i)<.19);
  assert.ok(bottom.length>0&&bottom.every(i=>uv.getY(i)<.09));
 }
});
