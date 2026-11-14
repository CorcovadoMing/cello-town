import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
const source=readFileSync(new URL('../app.js',import.meta.url),'utf8').replace(/^import .*;\n/,'');
const model=readFileSync(new URL('../model.js',import.meta.url),'utf8').replaceAll('export ','');
function setup({storageFails=false}={}) {
 const elements=new Map();
 const make=(id='')=>({id,value:'',textContent:'',innerHTML:'',hidden:false,disabled:false,style:{},dataset:{},children:[],handlers:{},classList:{add(){},remove(){},toggle(){},contains(){return false;}},setAttribute(){},append(x){this.children.push(x);},replaceChildren(...x){this.children=x;},addEventListener(k,fn){this.handlers[k]=fn;},scrollIntoView(){},focus(){}});
 const get=id=>{if(!elements.has(id))elements.set(id,make(id));return elements.get(id);};
 const missions=['listen','rhythm','memory'].map(task=>{const e=make();e.dataset.open=task;return e;});
 const intervals=[];const stored=new Map();let resumed=0;
 class AudioContext {constructor(){this.state='suspended';this.currentTime=0;this.destination={};}async resume(){resumed++;this.state='running';}createOscillator(){return {frequency:{},connect(){},start(){},stop(){},disconnect(){}};}createGain(){return {gain:{setValueAtTime(){},linearRampToValueAtTime(){},exponentialRampToValueAtTime(){}},connect(){},disconnect(){}};}}
 const document={hidden:false,getElementById:get,querySelectorAll:sel=>sel==='.mission'||sel==='[data-open]'?missions:[],createElement:()=>make(),handlers:{},addEventListener(k,fn){this.handlers[k]=fn;}};
 const sandbox={document,window:{AudioContext,addEventListener(){}},localStorage:{getItem(){if(storageFails)throw Error('denied');return null;},setItem(k,v){if(storageFails)throw Error('denied');stored.set(k,v);}},setInterval:fn=>{intervals.push(fn);return 1;},clearInterval(){},setTimeout(){},confirm:()=>true,matchMedia:()=>({matches:true}),console};
 vm.createContext(sandbox);vm.runInContext(model+'\n'+source,sandbox);
 return {get,missions,document,stored,eval:code=>vm.runInContext(code,sandbox),resumed:()=>resumed,intervals};
}
test('room selection does not complete; explicit confirmation does',()=>{const ui=setup();ui.missions[1].handlers.click();assert.equal(ui.eval('state.current.length'),0);ui.get('complete').handlers.click();assert.equal(ui.eval('state.current[0]'),'rhythm');});
test('audio starts on gesture, demo completion unlocks, background stops',async()=>{const ui=setup();assert.equal(ui.resumed(),0);assert.equal(ui.get('complete').disabled,true);await ui.get('audio-toggle').handlers.click();assert.equal(ui.resumed(),1);assert.equal(ui.eval('mode'),'demo');for(let i=1;i<=10;i++){ui.eval(`context.currentTime=${i};tick()`);}assert.equal(ui.eval('demoFinished'),true);assert.equal(ui.get('complete').disabled,false);ui.missions[1].handlers.click();await ui.get('audio-toggle').handlers.click();ui.document.hidden=true;ui.document.handlers.visibilitychange();assert.equal(ui.eval('mode'),null);});
test('storage failure warns without preventing practice',()=>{const ui=setup({storageFails:true});ui.missions[1].handlers.click();ui.get('complete').handlers.click();assert.equal(ui.eval('state.current.length'),1);assert.match(ui.get('save-status').textContent,/無法保存/);});
test('notes saved as plain text with progress',()=>{const ui=setup();ui.get('note').handlers.input({target:{value:'<script>not executed</script>'}});assert.equal(JSON.parse(ui.stored.get('cello-town-v1')).note,'<script>not executed</script>');});
