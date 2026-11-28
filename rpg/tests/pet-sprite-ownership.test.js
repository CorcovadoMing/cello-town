import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const app=fs.readFileSync(new URL('../app.js',import.meta.url),'utf8').split('function drawWebGLTown(')[1].split('function draw(t)')[0];
test('resting WebGL dog has an unconditional sprite independent from the calico',()=>{
 const dog=app.slice(app.indexOf('const d=petFrame.dog;'),app.indexOf('// Sprite sheets'));
 assert.match(dog,/const d=petFrame\.dog;\s+sprite\('dog'/);
 assert.match(dog,/if\(petFrame\.dogActive\)drawRainDog\(g,d\);\s+else drawBenchLife\(g,t,reduced,\{benchCatActive:true\}\);/);
 const cat=app.slice(app.indexOf("sprite('bench-cat'"),app.indexOf('for(let i=0;i<2'));
 assert.match(cat,/if\(active\)drawRainBenchCat/);
 assert.match(cat,/else drawBenchLife\(g,t,reduced,\{dogActive:true\}\);/);
});
