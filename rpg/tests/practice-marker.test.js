import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createContext,runInContext,runInNewContext} from 'node:vm';
import {accept,complete,fresh,turnIn} from '../model.js';
const app=readFileSync(new URL('../app.js',import.meta.url),'utf8');
const art=app.slice(app.indexOf('function drawStandMarker('),app.indexOf('function drawPracticeStand('));
function capture(state,t=0,reduced=false,webglTown=null){
 const ops=[];const g=new Proxy({}, {get(o,k){return (...v)=>ops.push([k,...v]);}});
 runInNewContext(art+';drawStandMarker(t)',{state,t,stand:{x:615,y:404},g,webglTown,label:(...a)=>ops.push(['label',...a]),reducedMotion:{matches:reduced}});
 return ops;
}
test('practice arrow stays aimed at the stand until all practices complete',()=>{
 const before=fresh(),active=accept(before),inProgress=complete(active,'listen'),finished=complete(complete(inProgress,'rhythm'),'memory');
 assert.equal(capture(before).length,0);assert.equal(capture(finished).length,0);assert.equal(capture(turnIn(finished)).length,0);
 for(const state of [active,inProgress]){
  const still=capture(state,500,true);assert.deepEqual(still.find(op=>op[0]==='translate'),['translate',615,404]);
  assert.ok(still.some(op=>op[0]==='lineTo'&&op[1]===0&&op[2]===-48));
  assert.notDeepEqual(capture(state,500),still);
 }
 const projected=capture(active,500,true,{project:(x,y,z)=>{assert.deepEqual([x,y,z],[615,404,3]);return {x:660,y:352};}});
 assert.deepEqual(projected.find(op=>op[0]==='translate'),['translate',660,352]);
 assert.match(app,/drawQuestMarker\(t\);drawStandMarker\(t\)/);
});

test('teacher status uses a noninteractive world-aligned vector overlay',()=>{
 const html=readFileSync(new URL('../index.html',import.meta.url),'utf8'),css=readFileSync(new URL('../style.css',import.meta.url),'utf8');
 assert.match(html,/<svg class="teacher-marker-layer" viewBox="0 0 960 560" aria-hidden="true"/);
 for(const kind of ['exclaim','question','spark'])assert.ok(html.includes('data-icon="'+kind+'"'));
 assert.match(css,/\.teacher-marker-layer\{position:absolute;inset:0;width:100%;height:100%;pointer-events:none\}/);
 const code=app.slice(app.indexOf('const teacherBadge='),app.indexOf('function drawStandMarker('));
 const badge={dataset:{},transforms:[],setAttribute(k,v){assert.equal(k,'transform');this.transforms.push(v);}};
 let q={marker:'!',markerTone:'gold',ready:false};
 const context=createContext({$:(id)=>{assert.equal(id,'teacher-badge');return badge;},questView:()=>q,state:{},npc:{x:300,y:200},webglTown:null,reducedMotion:{matches:true}});
 runInContext(code+';drawQuestMarker(100);drawQuestMarker(110)',context);
 assert.deepEqual(badge.dataset,{kind:'exclaim',tone:'gold'});assert.deepEqual(badge.transforms,['translate(300.00 135.00)']);
 q={marker:'?',markerTone:'gray',ready:false};context.npc.x=320;runInContext('drawQuestMarker(150)',context);
 assert.deepEqual(badge.dataset,{kind:'question',tone:'gray'});assert.equal(badge.transforms.at(-1),'translate(320.00 135.00)');
 q={marker:'?',markerTone:'gold',ready:true};runInContext('drawQuestMarker(160)',context);assert.deepEqual(badge.dataset,{kind:'ready',tone:'gold'});
 context.webglTown={project:(x,y,z)=>{assert.deepEqual([x,y,z],[320,200,77]);return {x:272,y:118};}};
 runInContext('drawQuestMarker(165)',context);
 assert.equal(badge.transforms.at(-1),'translate(272.00 118.00)');
 q={marker:null};runInContext('drawQuestMarker(170)',context);assert.equal(badge.dataset.kind,'');
});
