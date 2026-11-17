import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import os from 'node:os';import path from 'node:path';
import {packageSnapshot} from '../scripts/package-pages.mjs';
test('Pages packages exact runtime bytes at stable and experimental relative routes',()=>{
 const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'town-union-'));
 try {
  const src=path.join(tmp,'src');fs.mkdirSync(path.join(src,'rpg'),{recursive:true});fs.mkdirSync(path.join(src,'3D/vendor'),{recursive:true});
  fs.writeFileSync(path.join(src,'rpg/index.html'),'<head><script type="module" src="./app.js?v=51"></script></head>');fs.writeFileSync(path.join(src,'rpg/app.js'),'export const x=1;');
  for(const f of ['index.html','style.css','app.js','state.js','room-polish.js','window-landscape.js','rural-window.webp'])fs.writeFileSync(path.join(src,'3D',f),'exact-'+f);
  for(const f of ['three.module.js','SVGRenderer.js','Projector.js','THREE-LICENSE.txt'])fs.writeFileSync(path.join(src,'3D/vendor',f),'vendor-'+f);
  for(const dir of [path.join(tmp,'out'),path.join(tmp,'out/experimental')]){
   assert.equal(packageSnapshot(src,dir).length,1);
   assert.equal(fs.readFileSync(path.join(dir,'app.js'),'utf8'),'export const x=1;');
   assert.equal(fs.readFileSync(path.join(dir,'3D/state.js'),'utf8'),'exact-state.js');
   assert.match(fs.readFileSync(path.join(dir,'index.html'),'utf8'),/href=".\/app.js\?v=51"/);
   assert(!fs.existsSync(path.join(dir,'rpg')));
  }
  assert.equal(new URL('./3D/?from=town','https://x/cello-town/experimental/').pathname,'/cello-town/experimental/3D/');
  assert.equal(new URL('../?from=room','https://x/cello-town/experimental/3D/').pathname,'/cello-town/experimental/');
 }finally{fs.rmSync(tmp,{recursive:true,force:true});}
});
