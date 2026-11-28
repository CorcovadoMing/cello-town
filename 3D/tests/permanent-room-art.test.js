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
 assert.equal(art.children.length,6);
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

test('botanical wall studies face into the room and do not claim hits',()=>{
 const orig=globalThis.document;
 const op=()=>{};
 globalThis.document={createElement:()=>({getContext:()=>new Proxy({
  createLinearGradient:()=>({addColorStop:op}),
 },{get:(o,k)=>o[k]??op})})};
 try{
  const scene=new T.Scene();const art=installRoomMaterialArt(T,scene);scene.updateMatrixWorld(true);
  for(let j=0;j<2;j++){
   const plane=art.getObjectByName('botanical-study-paper-'+j),box=new T.Box3().setFromObject(plane);
   assert.ok(plane.material.map.isCanvasTexture);
   assert.ok(plane.geometry.attributes.normal.getX(0)>.99);
   assert.ok(box.min.x>-2.95&&box.max.x<-2.90&&box.min.y>1.09&&box.max.y<1.71);
   assert.equal(new T.Raycaster(new T.Vector3(0,plane.position.y,plane.position.z),new T.Vector3(-1,0,0)).intersectObject(plane).length,0);
  }
 }finally{if(orig===undefined)delete globalThis.document;else globalThis.document=orig;}
});

test('turned pots share one painted texture and map the motif at physical height',()=>{
 const prior=globalThis.document,no=()=>{};
 globalThis.document={createElement:()=>({getContext:()=>new Proxy({createLinearGradient:()=>({addColorStop:no})},{get:(o,k)=>o[k]??no})})};
 try{
  const scene=new T.Scene(),plants=[new T.Group(),new T.Group()];scene.add(...plants);
  installRoomMaterialArt(T,scene,{plants});
  const a=plants.map(p=>p.getObjectByName('ceramic-vessel-with-turned-foot'));
  assert.ok(a[0].material.map.isCanvasTexture);
  assert.equal(a[0].material.map,a[1].material.map);
  for(const m of a){
   const {position,uv}=m.geometry.attributes;
   assert.equal(uv.count,position.count);
   for(let i=0;i<uv.count;i++){
    const v=Math.min(1,Math.max(0,(position.getY(i)-.047)/.478));
    assert.ok(Math.abs(uv.getY(i)-v)<1e-5);
    assert.ok(uv.getX(i)>=0 && uv.getX(i)<=1);
   }
  }
 }finally{if(prior===undefined)delete globalThis.document;else globalThis.document=prior;}
});
