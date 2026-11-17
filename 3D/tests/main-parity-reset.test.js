import test from'node:test';import assert from'node:assert/strict';import fs from'node:fs';import crypto from'node:crypto';
const fixture=JSON.parse(fs.readFileSync(new URL('./main-parity-reset.json',import.meta.url),'utf8'));
function normalized(s){return s.replace(/\.js\?v=[^'"\s]+/g,'.js').replace(/KEY=\/[^;]+;/g,m=>m.includes('3d-avatar')?"KEY='cello-town-3d-avatar-v1';":"KEY='cello-town-rpg-v1';");}
test('experimental reset matches exact current-main visuals and gameplay except scoped storage/cache identities',()=>{for(const [path,sha]of Object.entries(fixture.files)){const text=fs.readFileSync(new URL('../../'+path,import.meta.url),'utf8');assert.equal(crypto.createHash('sha256').update(normalized(text)).digest('hex'),sha,path+' matches '+fixture.main);}});
