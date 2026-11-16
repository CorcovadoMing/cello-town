import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';import * as T from '../vendor/three.module.js';
const app=fs.readFileSync(new URL('../app.js',import.meta.url),'utf8');
test('cello action uses existing arrival path, reuses named original instrument and bow, no recording',()=>{
 assert.ok(app.includes("if(mode==='cello')beginPerformanceApproach()"));assert.ok(app.includes("if(mode==='cello'){seatPerformance();return;}"));
 const s=app.slice(app.indexOf('function performanceParts'),app.indexOf('const performanceKeys'));
 assert.ok(s.includes("source.userData.parts"));assert.ok(s.includes("part.name.startsWith('bow-')"));assert.ok(s.includes("new T.Mesh(g,source.material)"));
 assert.ok(!/localStorage|fetch\(|getUserMedia|AudioContext/.test(s));
 assert.ok(s.includes("back.textContent='返回琴房'"));assert.ok(s.includes("phase!=='playing'"));assert.ok(app.includes("performanceKeys.add(e.key);e.preventDefault();e.stopImmediatePropagation()"));
});
test('two-segment performance arms stay finite and reverse elbow orientation across bow stroke',()=>{
 const c={T,OPTIONS:{skin:["#cba987"]},state:{skin:0},cylinder:(x,y,z,a,b,h,color,parent)=>{const m=new T.Mesh(new T.CylinderGeometry(a,b,h),new T.MeshBasicMaterial({color}));parent.add(m);return m;}};vm.createContext(c);vm.runInContext(app.slice(app.indexOf('function aimPerformanceArm'),app.indexOf('function finishPerformance')),c);
 const arm=new T.Group(),elbow=new T.Group();arm.position.set(.26,1,0);elbow.position.y=-.2;arm.add(elbow);c.rig={arm,elbow};
 for(const x of[.12,.25,.38]){c.hand=new T.Vector3(x,.80,.33);vm.runInContext('aimPerformanceArm(rig,hand,1)',c);assert.ok(arm.quaternion.toArray().every(Number.isFinite));assert.ok(elbow.quaternion.toArray().every(Number.isFinite));}
});
test('seated thighs and knees articulate while both soles remain near the floor',()=>{
 const leg=()=>{const a=new T.Group(),k=new T.Group(),f=new T.Group();k.name='leg-knee';f.name='leg-foot';k.position.y=f.position.y=-.195;a.add(k);k.add(f);return a;};
 const c={T,leftLeg:leg(),rightLeg:leg(),upperBody:new T.Group(),reduced:{matches:false}};vm.createContext(c);vm.runInContext(app.slice(app.indexOf('function performancePose'),app.indexOf('function tickPerformance')),c);vm.runInContext('performancePose(1,1000)',c);
 for(const l of[c.leftLeg,c.rightLeg]){l.updateMatrixWorld(true);const p=l.getObjectByName('leg-foot').getWorldPosition(new T.Vector3());assert.ok(p.y>.13&&p.y<.15);assert.ok(p.z>.10);assert.ok(Math.abs(l.rotation.x)>.6);assert.ok(l.getObjectByName('leg-knee').rotation.x>.6);}
});
test('genuine approach stall releases lock, while normal progress and cat stand-up wait do not',()=>{
 let released=0,stool={visible:true};const c={celloPerformance:{phase:'approach',home:{}},pos:{x:2,z:0},stationSpots:{cello:{x:-1.85,z:-.7}},catPose:0,performanceParts:()=>({stool}),release:()=>released++,document:{querySelector:()=>({hidden:true})},$:()=>({hidden:true,textContent:''}),animateRoomCamera:()=>{},reduced:{matches:false}};
 vm.createContext(c);vm.runInContext(app.slice(app.indexOf('function watchPerformanceApproach'),app.indexOf('function articulatePerformanceArms')),c);
 for(let i=0;i<20;i++){c.pos.x-=.01;vm.runInContext('watchPerformanceApproach(.05)',c);}assert.equal(released,0);
 c.catPose=1;for(let i=0;i<40;i++)vm.runInContext('watchPerformanceApproach(.05)',c);assert.equal(released,0);c.catPose=0;
 for(let i=0;i<40;i++)vm.runInContext('watchPerformanceApproach(.05)',c);assert.equal(released,1);assert.equal(c.celloPerformance,null);assert.equal(stool.visible,false);
});
test('repeat cello tap ignores only avatar occlusion, never an intervening solid',()=>{
 const avatar={},head={parent:avatar,userData:{}},cello={userData:{station:'cello'}},wall={userData:{}};
 const c={avatar};vm.createContext(c);vm.runInContext(app.slice(app.indexOf('function celloThroughAvatar'),app.indexOf("area.addEventListener('pointerup'")),c);
 assert.equal(c.celloThroughAvatar([{object:head},{object:cello}]),true);
 assert.equal(c.celloThroughAvatar([{object:head},{object:wall},{object:cello}]),false);
 assert.equal(c.celloThroughAvatar([{object:wall},{object:cello}]),false);
 assert.equal(c.celloThroughAvatar([]),false);
});
