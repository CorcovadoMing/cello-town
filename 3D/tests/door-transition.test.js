import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
const app=fs.readFileSync(new URL('../app.js',import.meta.url),'utf8'),css=fs.readFileSync(new URL('../style.css',import.meta.url),'utf8');
test('door transfers have no veil, delay, history trap or pointer overlay',()=>{assert.ok(!app.includes('door-scene-dark'));assert.ok(!css.includes('door-scene-dark'));assert.ok(!css.includes('body::after'));assert.ok(app.includes('function transferDoor(navigate)'));assert.ok(app.includes('try{navigate();}catch{resetDoorTravel();}'));assert.ok(app.includes("window.addEventListener('pagehide',resetDoorTravel)"));assert.ok(app.includes('location.replace('));});
test('arrival is town-only, reduced-motion aware, cancellable and uses existing equipped avatar',()=>{assert.ok(app.includes('if(!cameFromTown||reduced.matches)return;'));assert.ok(app.includes('pos={x:0,z:1}'));assert.ok(app.includes('const view=ease((elapsed-650)/950)'));assert.ok(app.includes("window.addEventListener('pointerdown',cancelDoorArrival,{capture:true})"));assert.ok(app.includes("window.addEventListener('keydown',cancelDoorArrival,{capture:true})"));});
test('real door opens before entry, first input restores safe threshold, direct/reduced do not stage',async()=>{
 const {default:vm}=await import('node:vm');const T=await import('../vendor/three.module.js');
 function setup(from=true,reduce=false){const c={T,cameFromTown:from,reduced:{matches:reduce},camera:new T.OrthographicCamera(),avatar:new T.Group(),exitLeaf:new T.Group(),leftArm:new T.Group(),heading:Math.PI,pos:{x:0,z:1.51},destination:null,pendingStation:null,standY:()=>0,walkPose:()=>{},animateRoomCamera:()=>{}};c.camera.position.set(5.8,5.3,8.2);vm.createContext(c);vm.runInContext(app.slice(app.indexOf('let doorArrival=null;'),app.indexOf("window.addEventListener('pointerdown',cancelDoorArrival")),c);return c;}
 const c=setup();vm.runInContext('startDoorArrival();tickDoorArrival(0);',c);assert.equal(c.pos.z,2.75);assert.equal(c.exitLeaf.rotation.y,0);
 for(let t=50;t<=500;t+=50)vm.runInContext('tickDoorArrival('+t+');poseDoorArrival('+t+');',c);
 assert.ok(c.exitLeaf.rotation.y>.4);assert.ok(c.leftArm.rotation.x<-1);assert.ok(c.pos.z>2.5);
 for(let t=550;t<=1600;t+=50)vm.runInContext('tickDoorArrival('+t+');',c);
 assert.equal(c.pos.z,1);assert.equal(c.exitLeaf.rotation.y,Math.PI*.49);assert.equal(c.camera.zoom,1);
 const interrupted=setup();vm.runInContext('startDoorArrival();cancelDoorArrival();',interrupted);assert.equal(interrupted.pos.z,1.51);assert.equal(interrupted.exitLeaf.rotation.y,Math.PI*.49);
 for(const c of[setup(false),setup(true,true)]){vm.runInContext('startDoorArrival()',c);assert.equal(c.pos.z,1.51);assert.equal(c.camera.position.x,5.8);}
});
