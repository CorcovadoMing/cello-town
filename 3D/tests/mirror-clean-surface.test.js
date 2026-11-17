import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
const source=fs.readFileSync(new URL('../app.js',import.meta.url),'utf8');
test('mirror surface has no decorative diagonal rod while preserving glass and tabletop mount',()=>{
 assert.ok(!source.includes("rod([-.23,1.58,-.098],[-.08,1.77,-.098]"));
 for(const name of ['mirror-tabletop-base','mirror-tabletop-stem','mirror-hazy-color-suggestion'])assert.ok(source.includes(name));
 assert.ok(source.includes("cylinder(.31,.89,.05,.075,.065,.16,'#dbc5a4',vanity)"));
 assert.ok(source.includes("o.userData.station='vanity'"));
});
