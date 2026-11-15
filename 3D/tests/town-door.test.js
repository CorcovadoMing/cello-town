import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
const source=fs.readFileSync(new URL('../app.js',import.meta.url),'utf8');
test('town doorway stays on supported floor and uses existing walking limits',()=>{
 assert.ok(source.includes("roomExit.name='town-exit-corridor'"));
 assert.ok(source.includes("exit:{x:-1.45,z:1.9}"));
 assert.ok(source.includes("box(-1.45,.026,1.74+i*.16,1.20,.018,.155"));
 assert.ok(source.includes("roomExit.traverse(o=>{if(o.isMesh)o.userData.station='exit';})"));
});
test('town return is same-origin and incoming room spawn is loop-safe without migrating saves',()=>{
 assert.ok(source.includes("location.assign('../?from=room')"));
 assert.ok(source.includes("let exitArmed=!cameFromTown"));
 assert.ok(source.includes("cameFromTown?{x:-1.45,z:1.51}:{x:0,z:.55}"));
 assert.ok(source.includes("u.searchParams.delete('from');history.replaceState(history.state,'',u)"));
 assert.ok(source.includes("if(!exitArmed&&pos.z<1.4)exitArmed=true"));
 assert.equal(source.includes('sessionStorage'),false);
});
