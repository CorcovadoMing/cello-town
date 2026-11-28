import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';import * as T from '../vendor/three.module.js';
const app=fs.readFileSync(new URL('../app.js',import.meta.url),'utf8'),src=app.slice(app.indexOf('function performanceCamera('),app.indexOf('function animatePerformanceCamera('));
function view(width,aspect,legacy=false){const camera=new T.OrthographicCamera(-4*aspect,4*aspect,4,-4,.1,60),ctx={T,camera,area:{clientWidth:width}};vm.createContext(ctx);vm.runInContext((legacy==='027'?src.replace(/const wide=.*?;/,'const wide=0;'):legacy?src.replace('const portrait=T.MathUtils.smoothstep(1.4-aspect,0,.55);','const portrait=0;').replace(/const wide=.*?;/,'const wide=0;'):src)+';globalThis.v=performanceCamera();',ctx);return ctx.v;}
const roomSrc=app.slice(app.indexOf('function performanceCameraForRoom('),app.indexOf('function performanceCamera('));
function roomView(width,aspect,rayMirrorFrame){
 const camera=new T.OrthographicCamera(-4*aspect,4*aspect,4,-4,.1,60);
 const ctx={T,camera,rayMirrorFrame,area:{clientWidth:width}};vm.createContext(ctx);
 vm.runInContext(src+roomSrc+';globalThis.v=performanceCameraForRoom()',ctx);return ctx.v;
}
const samples=JSON.parse(fs.readFileSync(new URL('./portrait-mesh-samples.json',import.meta.url))).map(o=>{const matrix=new T.Matrix4().fromArray(o.matrix),v=[];for(let i=0;i<o.positions.length;i+=3)v.push(new T.Vector3(...o.positions.slice(i,i+3)).applyMatrix4(matrix));return{kind:o.kind,v};});
function visible(kind,v,aspect){const c=new T.PerspectiveCamera(v.fov,aspect,.1,60);c.position.copy(v.position);c.quaternion.copy(v.quaternion);c.updateMatrixWorld(true);const pts=samples.filter(o=>o.kind===kind).flatMap(o=>o.v.map(p=>p.clone().project(c)));return pts.filter(p=>Math.abs(p.x)<=1&&Math.abs(p.y)<=1).length/pts.length;}
test('portrait tablet and phone endpoint numerically identical to027',()=>{for(const [width,aspect]of[[360,.652],[390,.655],[768,.927],[820,.99],[900,1.2]]){const a=view(width,aspect),b=view(width,aspect,'027');assert.deepEqual(a.position.toArray(),b.position.toArray());assert.deepEqual(a.quaternion.toArray(),b.quaternion.toArray());assert.equal(a.zoom,b.zoom);assert.equal(a.fov,b.fov);}});
test('narrow portrait retains substantially more actual performer and cello samples, full window',()=>{for(const [width,aspect]of[[360,.652],[390,.655],[390,.52]]){const a=view(width,aspect),b=view(width,aspect,true);for(const kind of['head','cello']){const before=visible(kind,b,aspect),after=visible(kind,a,aspect);assert.ok(after>before+.2,`${width} ${kind}: ${before}->${after}`);}assert.equal(visible('windowframe',a,aspect),1);assert.ok(a.fov-b.fov<16);}});

test('wide framing puts complete vanity bounds outside canvas while keeping true window',()=>{const points=JSON.parse(fs.readFileSync(new URL('./vanity-bounds.json',import.meta.url),'utf8'));for(const aspect of[1.4,1.5,1.62,1.8,2,2.3]){const v=view(1180,aspect),c=new T.PerspectiveCamera(v.fov,aspect,.1,60);c.position.copy(v.position);c.quaternion.copy(v.quaternion);c.updateMatrixWorld(true);for(const xyz of points){const p=new T.Vector3(...xyz).project(c);assert.ok(p.x>1||Math.abs(p.y)>1,`vanity entered at aspect${aspect} x${p.x} y${p.y}`);}assert.equal(visible('windowframe',v,aspect),1);}});

test('experimental playing composition contains the full freestanding mirror and seated musician',()=>{
 const rayMirrorFrame=new T.Group(),mount=new T.Group(),pane=new T.Object3D();
 rayMirrorFrame.position.set(.65,1.04,-1.909);rayMirrorFrame.add(mount);mount.rotation.x=-.07;
 pane.name='full-length-mirror-surface';pane.position.z=.034;mount.add(pane);
 for(const [width,aspect] of [[390,.52],[390,.655],[768,.927],[1180,1.62],[1180,2.3]]){
  const v=roomView(width,aspect,rayMirrorFrame),c=new T.PerspectiveCamera(v.fov,aspect,.1,60);
  c.position.copy(v.position);c.quaternion.copy(v.quaternion);c.updateMatrixWorld(true);
  for(const x of[-.455,.455])for(const y of[-1.035,1.035]){
   const q=pane.localToWorld(new T.Vector3(x,y,0)).project(c);
   assert.ok(Math.abs(q.x)<.94&&Math.abs(q.y)<.94);
  }
  for(const kind of ['head','cello'])assert.ok(visible(kind,v,aspect)>.95,`${width} ${kind}`);
 }
});
