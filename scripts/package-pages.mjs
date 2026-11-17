// Trusted main-branch builder. Preserve exact runtime bytes; only derive town preloads.
import fs from 'node:fs';
import path from 'node:path';
import {injectTownPreloads} from '../rpg/scripts/preload-town.mjs';
export function packageSnapshot(source, out) {
  fs.mkdirSync(out,{recursive:true});
  for(const name of fs.readdirSync(path.join(source,'rpg'))) {
    if(/\.(html|css|js)$/.test(name)) fs.copyFileSync(path.join(source,'rpg',name),path.join(out,name));
  }
  const graph=injectTownPreloads(out);
  fs.mkdirSync(path.join(out,'3D/vendor'),{recursive:true});
  for(const name of ['index.html','style.css','app.js','state.js','room-polish.js','window-landscape.js','rural-window.webp'])
    fs.copyFileSync(path.join(source,'3D',name),path.join(out,'3D',name));
  for(const name of ['three.module.js','SVGRenderer.js','Projector.js','THREE-LICENSE.txt'])
    fs.copyFileSync(path.join(source,'3D/vendor',name),path.join(out,'3D/vendor',name));
  return graph;
}
if(process.argv[1]===new URL(import.meta.url).pathname){
 const [stable,experimental,out]=process.argv.slice(2);
 if(!stable||!experimental||!out)throw Error('Usage: package-pages.mjs stable experimental output');
 if(fs.existsSync(out))throw Error('Output must not exist; prevent stale release files');
 packageSnapshot(stable,out);packageSnapshot(experimental,path.join(out,'experimental'));
 fs.writeFileSync(path.join(out,'.nojekyll'),'');
}
