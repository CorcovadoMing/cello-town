// Build-time only: derive preload URLs from the exact copied, versioned module graph.
import fs from 'node:fs';import path from 'node:path';import {pathToFileURL} from 'node:url';
export function injectTownPreloads(dir){
 const file=path.join(dir,'index.html'),html=fs.readFileSync(file,'utf8'),base=new URL('https://town.invalid/'),seen=new Set();
 const scripts=[...html.matchAll(/<script\b[^>]*type=["']module["'][^>]*src=["']([^"']+)["']/g)].map(m=>m[1]);
 function visit(spec,parent=base){const url=new URL(spec,parent);if(url.origin!==base.origin||!url.pathname.endsWith('.js'))throw Error('Nonlocal module');if(seen.has(url.href))return;seen.add(url.href);const relative=decodeURIComponent(url.pathname.slice(1)),local=path.resolve(dir,relative);if(!local.startsWith(path.resolve(dir)+path.sep))throw Error('Escaping module');const text=fs.readFileSync(local,'utf8');for(const m of text.matchAll(/\b(?:import|export)\s+(?:[^;]*?\sfrom\s*)?["'](\.\.?\/[^"']+)["']/g))visit(m[1],url);}
 if(!scripts.length)throw Error('Town HTML has no discoverable module entry');
 scripts.forEach(s=>visit(s));
 if(!seen.size)throw Error('Empty town preload graph');
 const links=[...seen].map(h=>{const u=new URL(h);const href=('.'+u.pathname+u.search).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');return `<link rel="modulepreload" href="${href}">`;}).join('');
 const next=html.replace(/<!-- town-preloads -->[\s\S]*?<!-- \/town-preloads -->/,'').replace('</head>',`<!-- town-preloads -->${links}<!-- /town-preloads --></head>`);fs.writeFileSync(file,next);return [...seen].map(h=>new URL(h).pathname.slice(1)+new URL(h).search);
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)console.log(`Town modulepreloads: ${injectTownPreloads(process.argv[2]).length}`);
