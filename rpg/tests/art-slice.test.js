import test from 'node:test';import assert from 'node:assert/strict';import {createTownArt} from '../art-slice.js';
test('leaf highlights vary by placement but repeat identically across builds and draws',()=>{
 const trees=[[45,99,1.5],[115,105,1.3],[325,87,1.4]];
 const build=()=>{const calls=[];const art=createTownArt(()=>{const ops=[];calls.push(ops);const context=new Proxy({fillStyle:''},{get:(o,k)=>k in o?o[k]:(...args)=>ops.push([k,o.fillStyle,...args])});return{width:0,height:0,getContext:()=>context}},trees);return{calls,art}};
 const a=build(),b=build();assert.deepEqual(a.calls,b.calls);
 const accents=a.calls.slice(1).map(ops=>ops.filter(op=>op[0]==='fillRect'&&['#c0c98b','#b0bd7f','#b7c485','#a5b776'].includes(op[1])));
 assert.equal(new Set(accents.map(JSON.stringify)).size,3);
 const before=JSON.stringify(a.calls);for(let i=0;i<20;i++)a.art.drawTree({drawImage(){}},45,99,1.5,i*100,1);assert.equal(JSON.stringify(a.calls),before);
});
test('old road rectangles and original small marks finish ground cache',()=>{
 const contexts=[];createTownArt(()=>{const ops=[];contexts.push(ops);const c=new Proxy({fillStyle:''},{get:(o,k)=>k in o?o[k]:(...args)=>ops.push([k,o.fillStyle,...args])});return{width:0,height:0,getContext:()=>c}},[]);
 const ops=contexts[0],road=ops.findIndex(a=>a[0]==='fillRect'&&a[1]==='#d0c298');assert.ok(road>=0);
 assert.deepEqual(ops.slice(road,road+3),[['fillRect','#d0c298',170,298,620,72],['fillRect','#d0c298',428,300,72,260],['fillRect','#d0c298',620,220,75,110]]);
 assert.equal(ops.slice(road).filter(a=>a[0]==='fillRect'&&a[1]==='#beae83').length,27);
 assert.ok(ops.slice(road).every(a=>a[0]==='fillRect'));
});
test('private art caches once and exposes drawing only, with finite bounded surfaces',()=>{let allocations=0;const context=new Proxy({},{get:(o,k)=>k in o?o[k]:(...args)=>{for(const x of args)if(typeof x==='number')assert.ok(Number.isFinite(x));}});const trees=[[325,87,1.4],[139,279,1.2],[585,495,1.3]],before=JSON.stringify(trees);const art=createTownArt(()=>{allocations++;return{width:0,height:0,getContext:()=>context}},trees);assert.equal(allocations,4);assert.ok(art.stats.rgbaBytes<4_000_000);for(let i=0;i<600;i++){art.drawGround(context);art.drawTree(context,325,87,1.4,i,1);art.drawBench(context);art.drawBed(context)}assert.equal(allocations,4);assert.equal(JSON.stringify(trees),before);assert.equal(art.stats.animatedArtLayers,0);assert.deepEqual(Object.keys(art).sort(),['drawBed','drawBench','drawGround','drawTree','stats']);});
