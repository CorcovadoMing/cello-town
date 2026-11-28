import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
const app=fs.readFileSync(new URL('../app.js',import.meta.url),'utf8'),css=fs.readFileSync(new URL('../style.css',import.meta.url),'utf8');
test('door transfers have no veil, delay, history trap or pointer overlay',()=>{assert.ok(!app.includes('door-scene-dark'));assert.ok(!css.includes('door-scene-dark'));assert.ok(!css.includes('body::after'));assert.ok(app.includes('function transferDoor(navigate)'));assert.ok(app.includes('try{navigate();}catch{resetDoorTravel();}'));assert.ok(app.includes("window.addEventListener('pagehide',resetDoorTravel)"));assert.ok(app.includes('location.replace('));});
test('arrival is town-only, reduced-motion aware, cancellable and uses existing equipped avatar',()=>{assert.ok(app.includes('if(!cameFromTown||reduced.matches)return;'));assert.ok(app.includes('pos={x:.10,z:.65}'));assert.ok(app.includes('const state=doorArrivalState(a.elapsed)'));assert.ok(app.includes("arrivalPointers.add(e.pointerId);e.preventDefault();e.stopImmediatePropagation()"));assert.ok(app.includes("if(doorArrival||arrivalHeldKeys.has(e.key))"));});
test('real door opens before entry, environment interruption restores safe threshold, direct/reduced do not stage',async()=>{
 const {default:vm}=await import('node:vm');const T=await import('../vendor/three.module.js');
 function setup(from=true,reduce=false){const c={T,cameFromTown:from,reduced:{matches:reduce},camera:new T.OrthographicCamera(),avatar:new T.Group(),exitLeaf:new T.Group(),leftArm:new T.Group(),pressed:new Set(),cameraMotion:null,heading:Math.PI,pos:{x:0,z:1.51},destination:null,pendingStation:null,standY:()=>0,walkPose:()=>{},animateRoomCamera:()=>{}};c.camera.position.set(5.8,5.3,8.2);vm.createContext(c);vm.runInContext(app.slice(app.indexOf('let doorArrival=null;'),app.indexOf("// The entrance is one short performance")),c);return c;}
 const c=setup();vm.runInContext('startDoorArrival();tickDoorArrival(0);',c);assert.equal(c.pos.z,2.98);assert.equal(c.exitLeaf.rotation.y,0);
 for(let t=50;t<=500;t+=50)vm.runInContext('tickDoorArrival('+t+');poseDoorArrival('+t+');',c);
 assert.ok(c.exitLeaf.rotation.y>.4);assert.ok(c.leftArm.rotation.x<-.2);assert.ok(c.pos.z>2.5);
 for(let t=550;t<=1600;t+=50)vm.runInContext('tickDoorArrival('+t+');',c);
 assert.ok(c.pos.z>.65&&c.pos.z<2.88);assert.equal(c.exitLeaf.rotation.y,Math.PI*.49);
 for(let t=1650;t<=2400;t+=50)vm.runInContext('tickDoorArrival('+t+');poseDoorArrival('+t+');',c);
 assert.ok(c.heading<.2);assert.ok(Math.abs(c.leftArm.rotation.x)<1e-12);assert.equal(c.exitLeaf.rotation.y,Math.PI*.49);assert.ok(Math.abs(c.pos.z-.65)<1e-9);
 for(let t=2450;t<=4200;t+=50)vm.runInContext('tickDoorArrival('+t+');',c);
 assert.equal(c.pos.z,.65);assert.equal(c.pos.x,.10);assert.equal(c.exitLeaf.rotation.y,0);assert.equal(c.camera.zoom,1);assert.equal(c.heading,Math.PI);
 const interrupted=setup();vm.runInContext('startDoorArrival();cancelDoorArrival();',interrupted);assert.equal(interrupted.pos.z,.65);assert.equal(interrupted.pos.x,.10);assert.equal(interrupted.exitLeaf.rotation.y,0);assert.equal(interrupted.heading,Math.PI);
 for(const c of[setup(false),setup(true,true)]){vm.runInContext('startDoorArrival()',c);assert.equal(c.pos.z,1.51);assert.equal(c.camera.position.x,5.8);}
});
test('019 entrance is unskippable by game input and held directions require release',()=>{
 assert.ok(app.includes("if(doorArrival||arrivalHeldKeys.has(e.key))"));
 assert.ok(app.includes("window.addEventListener('keyup',e=>arrivalHeldKeys.delete(e.key)"));
 assert.ok(app.includes("arrivalPointers.add(e.pointerId);e.preventDefault();e.stopImmediatePropagation()"));
 assert.ok(app.includes("if(!arrivalPointers.delete(e.pointerId))return"));
 assert.ok(!app.includes("window.addEventListener('pointerdown',cancelDoorArrival"));
 const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');assert.ok(html.includes('app.js?v=20261129-048-experimental-botanical'));assert.ok(html.includes('style.css?v=30-quill-score'));
});
