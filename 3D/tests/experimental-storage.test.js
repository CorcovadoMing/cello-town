import test from'node:test';import assert from'node:assert/strict';import fs from'node:fs';import vm from'node:vm';
test('experimental storage isolation is path-scoped and does not migrate or read stable saves',()=>{
 // Evaluate the exact declared expressions, not duplicated key rules.
 const s=fs.readFileSync(new URL('../state.js',import.meta.url),'utf8').match(/export const KEY=([^;]+);/)[1];const r=fs.readFileSync(new URL('../../rpg/app.js',import.meta.url),'utf8').match(/,KEY=([^;]+);/)[1];
 for(const [path,experimental]of[['/cello-town/',false],['/cello-town/3D/',false],['/cello-town/experimental/',true],['/cello-town/experimental/3D/',true]])for(const expr of[s,r]){const ctx={location:{pathname:path}};vm.createContext(ctx);vm.runInContext('globalThis.key='+expr,ctx);assert.equal(ctx.key.includes('-experimental-'),experimental);}
 assert.ok(fs.readFileSync(new URL('../../rpg/index.html',import.meta.url),'utf8').includes('href="./"'));
});
