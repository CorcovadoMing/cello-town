import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
test('outdoor reading furniture shares timber material without changing the seating or book support',()=>{
 const s=readFileSync(new URL('../town-webgl.js',import.meta.url),'utf8');
 const table=s.slice(s.indexOf('function table('),s.indexOf('table(490,230);'));
 assert.match(table,/woodDetail\(x,30,z\+dz,width-1,\.6,4\.8,tableTones\[i%tableTones\.length\]\)/);
 const reading=s.slice(s.indexOf('const loungeBook='),s.indexOf('// Real mossy volumes'));
 assert.match(reading,/loungeBook\.position\.set\(x-W\/2,30\.42,238-H\/2\)/);
 assert.match(reading,/woodDetail\(c\.x,LOUNGE_SEAT_CENTER,c\.y,16,LOUNGE_SEAT_DEPTH,13,wood\)/);
});
