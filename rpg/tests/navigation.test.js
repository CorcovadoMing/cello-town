import test from 'node:test';
import assert from 'node:assert/strict';
import {createNavigation, treeBlockedTiles} from '../navigation.js';

test('one trunk occupies exactly centre plus eight grid neighbours', () => {
  const cells = treeBlockedTiles([{x: 155, y: 155}]); assert.equal(cells.size, 9);
  for (let y = 4; y <= 6; y++) for (let x = 4; x <= 6; x++) assert.ok(cells.has(`${x},${y}`));
});
test('clear line preserves exact target; blocked or unreachable targets fail explicitly', () => {
  const n = createNavigation({width:300,height:300,trees:[{x:155,y:155}]});
  assert.deepEqual(n.findPath({x:15,y:15},{x:95,y:35}),[{x:95,y:35}]);
  assert.equal(n.findPath({x:15,y:15},{x:155,y:155}),null);
  assert.equal(n.findPath({x:155,y:155},{x:15,y:15}),null);
  const wall = createNavigation({width:300,height:300,blocked:(x)=>x>=140&&x<=160});
  assert.equal(wall.findPath({x:30,y:150},{x:270,y:150}),null);
});
test('opposite sides route around tree in both directions without diagonal corner cutting', () => {
  const n=createNavigation({width:300,height:300,trees:[{x:155,y:155}]});
  const a={x:75,y:165},b={x:255,y:165};
  assert.equal(n.lineClear(a,b),false);
  assert.equal(n.lineClear({x:105,y:135},{x:135,y:105}),false);
  for(const [start,end]of [[a,b],[b,a]]) {const path=n.findPath(start,end);assert.ok(path?.length>1);assert.deepEqual(path.at(-1),end);let prev=start;for(const p of path){assert.ok(n.lineClear(prev,p));prev=p;}}
});
test('actual town trunk centres retain spawn and reachable interaction destinations', () => {
  const art=[[45,99,1.5],[115,105,1.3],[210,83,1.2],[325,87,1.4],[435,91,1.6],[870,103,1.8],[930,178,1.4],[65,250,1.8],[139,279,1.2],[848,281,1.4],[919,356,1.2],[340,476,1.2],[585,495,1.3],[690,500,1]];
  const trees=art.map(([x,y,s])=>({x:x+.5*s,y:y+32*s}));
  const blocked=(x,y)=>x<30||x>930||y<130||y>542||(x<275&&y>380)||(x>730&&x<910&&y>395)||(x>174&&x<330&&y>170&&y<240);
  const n=createNavigation({trees,blocked}),spawn={x:460,y:425}; assert.ok(n.isWalkable(spawn.x,spawn.y));
  for(const end of [{x:303,y:325},{x:615,y:432},{x:710,y:460}]) {const route=n.findPath(spawn,end); assert.ok(route,JSON.stringify(end));let prev=spawn;for(const p of route){assert.ok(n.lineClear(prev,p));prev=p;}assert.deepEqual(route.at(-1),end);assert.ok(n.findPath(end,spawn));}
});
