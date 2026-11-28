import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../vendor/three.module.js';
import {installRoomMaterialArt} from '../room-polish.js';

test('permanent room art is batched and retains the original plant and table hit geometry',()=>{
 const scene=new T.Scene(),plants=[new T.Group(),new T.Group()],table=new T.Group();
 plants[0].position.set(2.5,0,.65);plants[1].position.set(-2.6,0,1.3);table.position.set(2.15,.015,1.55);
 scene.add(...plants,table);
 const material=new T.MeshBasicMaterial({color:'#777'});
 const pots=plants.map(p=>{
  const mesh=new T.Mesh(new T.CylinderGeometry(.24,.18,.48,10),material);
  mesh.position.y=.27;p.add(mesh);return mesh;
 });
 const tabletop=new T.Mesh(new T.BoxGeometry(.74,.065,.54),material);tabletop.position.y=.57;table.add(tabletop);
 const score=new T.Object3D();score.position.set(-.015,.611,.008);score.name='score';table.add(score);
 const positions=[...plants,table,score].map(o=>o.position.clone());
 const rays=[new T.Raycaster(new T.Vector3(2.5,.5,2),new T.Vector3(0,0,-1)),new T.Raycaster(new T.Vector3(2.15,2,1.55),new T.Vector3(0,-1,0))];
 scene.updateMatrixWorld(true);
 const hits=rays.map(r=>r.intersectObjects(scene.children,true)[0]?.object);
 assert.deepEqual(hits,[pots[0],tabletop]);
 const art=installRoomMaterialArt(T,scene,{plants,table});
 scene.updateMatrixWorld(true);
 assert.deepEqual([...plants,table,score].map(o=>o.position),positions);
 assert.deepEqual(rays.map(r=>r.intersectObjects(scene.children,true)[0]?.object),hits);
 assert.equal(art.children.length,3);
 assert.equal(pots.every(m=>!m.visible),true);
 for(const [i,plant] of plants.entries()){
  const craft=plant.getObjectByName(i?'west-hand-thrown-plant':'east-hand-thrown-plant');
  const bounds=new T.Box3().setFromObject(craft);
  assert.equal(craft.children.length,6);
  assert.ok(bounds.max.x-bounds.min.x<.91);
  assert.ok(bounds.max.y>1.02 && bounds.max.y<1.48);
  for(const mesh of craft.children)for(const key of ['position','normal'])assert.ok(mesh.geometry.attributes[key].array.every(Number.isFinite));
 }
 assert.equal(table.children.length,6);
});
