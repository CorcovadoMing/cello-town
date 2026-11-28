import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {breezeAt,GRASS_PATCHES,POND_SHOT,WATCH_VIEWS} from '../town-breeze.js';
test('fixed map and pond options preserve the original controls, with no motion required',()=>{
 const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
 const app=readFileSync(new URL('../app.js',import.meta.url),'utf8');
 assert.deepEqual([...html.matchAll(/data-watch-view="(\w+)"/g)].map(m=>m[1]),WATCH_VIEWS);
 assert.match(html,/id="town-watch" hidden/);
 assert.match(app,/if\(dlg.open\|\|enteringRoom\|\|watchView!=='play'\)return/);
 assert.match(app,/if\(e.key==='Escape'\)\{e.preventDefault\(\);selectWatchView\('play'\)/);
 assert.ok(POND_SHOT.eye[1]>40&&POND_SHOT.eye[1]<80);
});
test('world-space gusts vary with position and time without jitter at rest',()=>{
 assert.equal(breezeAt(3000,150,200,'rain',false),0);
 const a=breezeAt(0,10,100,'breeze');
 assert.notEqual(a,breezeAt(0,110,100,'breeze'));
 assert.notEqual(a,breezeAt(1000,10,100,'breeze'));
 assert.ok(a>breezeAt(0,10,100,'sun'));
 for(const [x,z,rx,rz,n] of GRASS_PATCHES)assert.ok(x>rx&&x+rx<960&&z>rz&&z+rz<560&&n>1);
});

test('each weather sky has its own silhouette with a solar disk only on sunny days',async()=>{
 const {makePondHorizon}=await import('../town-breeze.js');
 const prior=globalThis.document;
 try{
  const read=weather=>{
   const calls=[],gradient={addColorStop(...a){calls.push(['stop',...a]);}};
   const c=new Proxy({}, {get(o,k){if(k in o)return o[k];
     return (...v)=>{calls.push([k,...v]);return String(k).includes('Gradient')?gradient:undefined;};}});
   globalThis.document={createElement:()=>({width:0,height:0,getContext:()=>c})};
   const T={CanvasTexture:class{constructor(source){this.image=source;}},SRGBColorSpace:'srgb'};
   const texture=makePondHorizon(T,weather);
   assert.equal(texture.image.width,960);assert.equal(texture.colorSpace,'srgb');
   return calls;
  };
  const sun=read('sun'),breeze=read('breeze'),rain=read('rain');
  const n=(list,op)=>list.filter(c=>c[0]===op).length;
  assert.deepEqual([n(sun,'arc'),n(breeze,'arc'),n(rain,'arc')],[1,0,0]);
  assert.deepEqual([n(sun,'rotate'),n(breeze,'rotate'),n(rain,'rotate')],[0,1,0]);
  assert.ok(n(rain,'bezierCurveTo')>n(breeze,'bezierCurveTo'));
 }finally{
  if(prior===undefined)delete globalThis.document;
  else globalThis.document=prior;
 }
});
