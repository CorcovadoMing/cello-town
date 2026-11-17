import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';import * as T from '../vendor/three.module.js';
const app=fs.readFileSync(new URL('../app.js',import.meta.url),'utf8');
test('cat alone can be selected through player, while furniture and walls still occlude',()=>{
 const avatar=new T.Group(),part=new T.Mesh();avatar.add(part);const cat=new T.Mesh();cat.userData.pet='cat';const wall=new T.Mesh();
 const c={T,avatar,catHitBounds:new T.Box3(new T.Vector3(-1,-1,-1),new T.Vector3(1,1,1))};vm.createContext(c);vm.runInContext(app.slice(app.indexOf('function catThroughAvatar'),app.indexOf("area.addEventListener('pointerup'")),c);
 const ray=new T.Ray(new T.Vector3(0,0,5),new T.Vector3(0,0,-1)),f=c.catThroughAvatar;
 assert.equal(f(ray,[{object:part,distance:1},{object:cat,distance:4}]),true);
 assert.equal(f(ray,[{object:part,distance:1},{object:wall,distance:2},{object:cat,distance:4}]),false);
 assert.equal(f(ray,[{object:wall,distance:1},{object:cat,distance:4}]),false);
 assert.equal(f(new T.Ray(new T.Vector3(8,0,5),new T.Vector3(0,0,-1)),[{object:part,distance:1}]),false);
 assert.equal(f(ray,[{object:part,distance:1},{object:wall,distance:8}]),true);
 assert.equal(f(ray,[]),false);
});
