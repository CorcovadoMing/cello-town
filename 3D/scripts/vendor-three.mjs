import {mkdir,readFile,writeFile,copyFile} from 'node:fs/promises';
const out=new URL('../vendor/',import.meta.url),pkg=new URL('../node_modules/three/',import.meta.url);
await mkdir(out,{recursive:true});
await copyFile(new URL('build/three.module.js',pkg),new URL('three.module.js',out));
await copyFile(new URL('LICENSE',pkg),new URL('THREE-LICENSE.txt',out));
for(const name of ['SVGRenderer.js','Projector.js']){
 const source=await readFile(new URL('examples/jsm/renderers/'+name,pkg),'utf8');
 await writeFile(new URL(name,out),source.replaceAll("from 'three'","from './three.module.js'").replaceAll("'../renderers/Projector.js'","'./Projector.js'"));
}
