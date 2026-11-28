import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const app=fs.readFileSync(new URL('../app.js',import.meta.url),'utf8');
const slice=app.slice(app.indexOf('const ROOM='),app.indexOf('function stoolEgress('));
const c={};vm.createContext(c);
vm.runInContext(slice+';globalThis.nav={mirrorWalkRoute,inside,segmentBlocked,guardedMove};',c);
const nav=c.nav,mirror={minX:0,maxX:1.25,minZ:-1.8,maxZ:-.70},corner={minX:-1,maxX:-.5,minZ:.2,maxZ:.7};
test('floor targets and direct motion respect the mirror footprint, keeping approach reachable',()=>{
 const a={x:.65,z:.1},m={x:.65,z:-.44};
 const blocked={x:.65,z:-.8},r=nav.mirrorWalkRoute(a,blocked,[mirror,corner]);assert.ok(r);assert.ok(!nav.inside(r.goal,mirror));
 assert.ok(!nav.segmentBlocked(a,r.step,mirror));assert.ok(!nav.inside(nav.guardedMove(a,blocked,mirror),mirror));
 const clear=nav.mirrorWalkRoute(a,m,[mirror,corner]);assert.equal(clear.goal.z,m.z);assert.equal(clear.step.z,m.z);
});
test('mirror routes stay outside both nearby obstacle and furniture rather than clipping the diagonal',()=>{
 const a={x:-.86,z:.91},b={x:.34,z:-.78},r=nav.mirrorWalkRoute(a,b,[mirror,corner]);
 assert.ok(r);assert.ok(!nav.inside(r.goal,mirror));for(const o of [mirror,corner])assert.ok(!nav.segmentBlocked(a,r.step,o));
});
test('the full-length mirror replaces the experimental vanity and carries the outfit interaction',()=>{
 assert.match(app,/if\(mirrorRoom\)\{\s*vanity\.removeFromParent\(\);/);
 assert.match(app,/frame\.traverse\(o=>\{o\.userData\.station='mirror'/);
 assert.match(app,/wardrobe:\{x:2\.2,z:-\.8\},mirror:MIRROR_APPROACH/);
});

test('mirror glass stands upright and square with the wardrobe front',()=>{assert.match(app,/frame\.rotation\.set\(0,0,0\)/);});

test('the wall-mounted frame and both rendered surfaces keep their own station',()=>{
 assert.match(app,/wallFace=rearWall\.position\.z\+rearWall\.geometry\.parameters\.depth\/2/);
 assert.match(app,/frame\.position\.set\(\.65,1\.258,wallFace\+\.034\)/);
 assert.match(app,/reflected\.mesh\.userData\.station='mirror'/);
 assert.match(app,/scene\.children\.slice\(wardrobeStart\)\.forEach\(o=>\{o\.userData\.station='wardrobe'/);
 assert.match(app,/station==='mirror'\?'wardrobe':station/);
});
