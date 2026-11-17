import fs from 'node:fs';import {roomBlocks} from '../../music-room-art.js';import {LOUNGE_LAYOUT} from '../../lounge-art.js';import {petTrunkBlocked} from './pet-trunk-reference.js';
const app=fs.readFileSync(new URL('../../app.js',import.meta.url),'utf8');
export const TREE_LAYOUT=JSON.parse(app.match(/const TREE_LAYOUT=(\[.*?\]);/)[1]);
const LOUNGE_SOLIDS=[LOUNGE_LAYOUT.table.solid,...LOUNGE_LAYOUT.seats.map(c=>c.solid)],stand={x:615,y:404};
const blocked=new Function('roomBlocks','LOUNGE_SOLIDS','stand',app.match(/function blocked\([^\n]+/)[0]+';return blocked;')(roomBlocks,LOUNGE_SOLIDS,stand);
export const configs={player:{trees:TREE_LAYOUT.map(([x,y,s])=>({x:x+.5*s,y:y+32*s})),blocked},pet:{trees:TREE_LAYOUT.map(([x,y,s])=>({x:x+.5*s,y:y+32*s})),blocked:(x,y)=>blocked(x,y,true)},rain:{tileSize:15,blocked:(x,y)=>blocked(x,y,true)||petTrunkBlocked(TREE_LAYOUT,x,y)}};
export {blocked};
